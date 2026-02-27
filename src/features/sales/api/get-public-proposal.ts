/**
 * Sales feature – Fetch public proposal by token (client portal)
 * Uses service-role client to bypass RLS; only returns data for matching public_token.
 * @module features/sales/api/get-public-proposal
 */

import 'server-only';

import { getSystemClient } from '@/shared/api/supabase/system';
import type { PublicProposalDTO } from '../model/public-proposal';

export async function getPublicProposal(token: string): Promise<PublicProposalDTO | null> {
  if (!token?.trim()) return null;

  const supabase = getSystemClient();

  // 1. Proposal by public_token
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('*')
    .eq('public_token', token.trim())
    .maybeSingle();

  if (proposalError || !proposal) return null;

  const status = (proposal as { status?: string }).status;
  if (status !== 'sent' && status !== 'viewed' && status !== 'accepted') return null;

  const proposalId = proposal.id;
  const dealId = (proposal as { deal_id?: string }).deal_id;
  const workspaceId = proposal.workspace_id;

  if (!dealId) return null;

  // 2. Deal (and event if handed over)
  const { data: dealRow, error: dealError } = await supabase
    .from('deals')
    .select('id, title, proposed_date, event_id, organization_id')
    .eq('id', dealId)
    .single();

  if (dealError || !dealRow) return null;

  const deal = dealRow as { title?: string | null; proposed_date?: string | null; event_id?: string | null; organization_id?: string | null };
  let eventRow: { id: string; title?: string | null; starts_at?: string | null; organizations?: { name?: string } | null } | null = null;
  let clientName: string | null = null;

  // Bill-To from deal_stakeholders (Stakeholder Map) for PDF / client name
  try {
    const { data: billToRow } = await supabase
      .from('deal_stakeholders')
      .select('organization_id, entity_id')
      .eq('deal_id', dealId)
      .eq('role', 'bill_to')
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle();
    const billTo = billToRow as { organization_id?: string | null; entity_id?: string | null } | null;
    if (billTo?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', billTo.organization_id)
        .maybeSingle();
      if (org) clientName = (org as { name?: string }).name ?? null;
    } else if (billTo?.entity_id) {
      const { data: entity } = await supabase
        .from('entities')
        .select('email')
        .eq('id', billTo.entity_id)
        .maybeSingle();
      if (entity) clientName = (entity as { email?: string }).email ?? null;
    }
  } catch {
    // deal_stakeholders may not exist; clientName stays null
  }
  if (!clientName && deal.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', deal.organization_id)
      .maybeSingle();
    if (org) clientName = (org as { name?: string }).name ?? null;
  }

  if (deal.event_id) {
    const { data: ev } = await supabase
      .schema('ops')
      .from('events')
      .select('id, name, start_at')
      .eq('id', deal.event_id)
      .maybeSingle();
    if (ev) {
      eventRow = {
        id: ev.id,
        title: (ev as { name?: string }).name ?? null,
        starts_at: (ev as { start_at?: string }).start_at ?? null,
        organizations: null,
      };
    }
  }

  const eventTitle = eventRow?.title ?? deal.title ?? '';
  const startsAt = eventRow?.starts_at ?? (deal.proposed_date ? `${deal.proposed_date}T08:00:00.000Z` : null);
  const eventIdForReturn = eventRow?.id ?? deal.event_id ?? dealId;

  // 3. Workspace (logo, name) – optional; logo_url may not be in generated workspaces type
  type WorkspaceRow = { id: string; name?: string; logo_url?: string | null };
  const { data: workspaceData } = await (supabase as any)
    .from('workspaces')
    .select('id, name, logo_url')
    .eq('id', workspaceId)
    .maybeSingle();
  const workspace = workspaceData as WorkspaceRow | null;

  // 4. Proposal items (with package image_url where package_id is set)
  const { data: items, error: itemsError } = await supabase
    .from('proposal_items')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('sort_order', { ascending: true });

  if (itemsError) return null;

  const itemList = items ?? [];
  const packageIds = [...new Set(itemList.map((i) => i.package_id).filter(Boolean))] as string[];

  let packageImages: Record<string, string | null> = {};
  if (packageIds.length > 0) {
    const { data: packages } = await supabase
      .from('packages')
      .select('id, image_url')
      .in('id', packageIds);
    if (packages) {
      for (const p of packages) {
        packageImages[p.id] = p.image_url ?? null;
      }
    }
  }

  const itemsWithImages = itemList.map((item) => ({
    ...item,
    packageImageUrl: item.package_id ? packageImages[item.package_id] ?? null : null,
  }));

  const total = itemsWithImages.reduce(
    (sum, row) => sum + (row.quantity ?? 1) * parseFloat(String(row.unit_price ?? 0)),
    0
  );

  return {
    proposal,
    event: {
      id: eventIdForReturn,
      title: eventTitle,
      clientName,
      startsAt,
    },
    workspace: workspace
      ? { id: workspace.id, name: workspace.name ?? '', logoUrl: workspace.logo_url ?? null }
      : { id: workspaceId ?? '', name: 'Signal', logoUrl: null },
    items: itemsWithImages,
    total,
  };
}
