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

  const proposalId = proposal.id;
  const eventId = proposal.event_id;
  const workspaceId = proposal.workspace_id;

  // 2. Event (title, starts_at, client from organizations)
  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('id, title, starts_at, organizations:client_id(name)')
    .eq('id', eventId)
    .single();

  if (eventError || !eventRow) return null;

  const row = eventRow as {
    title?: string | null;
    starts_at?: string | null;
    organizations?: { name?: string } | null;
  };
  const clientName =
    (row.organizations && typeof row.organizations === 'object' && 'name' in row.organizations
      ? (row.organizations.name as string) ?? null
      : null) ?? null;

  // 3. Workspace (logo, name)
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, logo_url')
    .eq('id', workspaceId)
    .single();

  if (workspaceError || !workspace) return null;

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
      id: eventRow.id,
      title: (eventRow as { title?: string }).title ?? '',
      clientName,
      startsAt: (eventRow as { starts_at?: string | null }).starts_at ?? null,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name ?? '',
      logoUrl: workspace.logo_url ?? null,
    },
    items: itemsWithImages,
    total,
  };
}
