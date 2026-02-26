'use server';

import { createClient } from '@/shared/api/supabase/server';
import { getActiveWorkspaceId } from '@/shared/lib/workspace';

export type DealClientContact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};

export type DealClientOrganization = {
  id: string;
  name: string;
  category: string | null;
  support_email: string | null;
  website: string | null;
  /** Billing address: { street?, city?, state?, postal_code?, country? } */
  address: { street?: string; city?: string; state?: string; postal_code?: string; country?: string } | null;
};

export type DealClientContext = {
  organization: DealClientOrganization;
  mainContact: DealClientContact | null;
  /** Number of deals (including current) with this organization in the workspace */
  pastDealsCount: number;
  /** Internal notes about this client (from org_private_data when available) */
  privateNotes: string | null;
  /** Org relationship id for opening Network Detail Sheet (nodeId for external_partner) */
  relationshipId: string | null;
};

export async function getDealClientContext(
  dealId: string,
  sourceOrgId?: string | null
): Promise<DealClientContext | null> {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return null;

  const supabase = await createClient();

  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .select('organization_id, main_contact_id')
    .eq('id', dealId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (dealErr || !deal) return null;

  // Prefer bill_to from deal_stakeholders (Stakeholder Map); fallback to deal.organization_id
  let orgIdFromStakeholder: string | null = null;
  let entityIdFromStakeholder: string | null = null;
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
    orgIdFromStakeholder = billTo?.organization_id ?? null;
    entityIdFromStakeholder = billTo?.entity_id ?? null;
  } catch {
    // deal_stakeholders table may not exist yet; use deal.organization_id
  }

  const orgId = orgIdFromStakeholder ?? (deal as { organization_id?: string | null }).organization_id;
  const mainContactId = (deal as { main_contact_id?: string | null }).main_contact_id;

  // Dual-node bill_to: org + contact — use contact for mainContact (email/signing), org for organization (address)
  if (orgId && entityIdFromStakeholder) {
    const [orgRes, entityRes, memberRes] = await Promise.all([
      supabase.from('organizations').select('id, name, category, support_email, website, address').eq('id', orgId).eq('workspace_id', workspaceId).maybeSingle(),
      supabase.from('entities').select('id, email').eq('id', entityIdFromStakeholder).maybeSingle(),
      supabase.from('org_members').select('first_name, last_name').eq('org_id', orgId).eq('entity_id', entityIdFromStakeholder).maybeSingle(),
    ]);
    const org = orgRes.data as Record<string, unknown> | null;
    const entity = entityRes.data as { id?: string; email?: string | null } | null;
    const member = memberRes.data as { first_name?: string | null; last_name?: string | null } | null;
    if (org && entity) {
      const firstName = (member?.first_name ?? '') as string;
      const lastName = (member?.last_name ?? '') as string;
      return {
        organization: {
          id: org.id as string,
          name: (org.name as string) ?? '',
          category: (org.category as string) ?? null,
          support_email: (org.support_email as string) ?? null,
          website: (org.website as string) ?? null,
          address: org.address && typeof org.address === 'object' ? (org.address as DealClientContext['organization']['address']) : null,
        },
        mainContact: {
          id: entity.id as string,
          first_name: firstName,
          last_name: lastName,
          email: entity.email ?? null,
          phone: null,
        },
        pastDealsCount: 0,
        privateNotes: null,
        relationshipId: null,
      };
    }
  }

  // If bill_to is an entity only (person, e.g. Bride), build minimal context from entity
  if (entityIdFromStakeholder && !orgId) {
    const { data: entity } = await supabase
      .from('entities')
      .select('id, email')
      .eq('id', entityIdFromStakeholder)
      .maybeSingle();
    if (entity) {
      const e = entity as { id: string; email?: string | null };
      return {
        organization: {
          id: e.id,
          name: e.email ?? 'Unknown',
          category: null,
          support_email: e.email ?? null,
          website: null,
          address: null,
        },
        mainContact: null,
        pastDealsCount: 0,
        privateNotes: null,
        relationshipId: null,
      };
    }
  }

  if (!orgId) return null;

  const [orgRes, contactRes, countRes, notesRes, relRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, category, support_email, website, address')
      .eq('id', orgId)
      .eq('workspace_id', workspaceId)
      .maybeSingle(),
    mainContactId
      ? supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone')
          .eq('id', mainContactId)
          .eq('workspace_id', workspaceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('workspace_id', workspaceId),
    supabase
      .from('org_private_data')
      .select('private_notes')
      .eq('subject_org_id', orgId)
      .maybeSingle(),
    sourceOrgId
      ? supabase
          .from('org_relationships')
          .select('id')
          .eq('source_org_id', sourceOrgId)
          .eq('target_org_id', orgId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const org = orgRes.data as Record<string, unknown> | null;
  if (!org) return null;

  const contact = contactRes.data as Record<string, unknown> | null;
  const count = countRes.count ?? 0;
  const priv = notesRes.data as { private_notes?: string | null } | null;
  const rel = relRes.data as { id?: string } | null;

  const address = org.address as DealClientContext['organization']['address'];
  return {
    organization: {
      id: org.id as string,
      name: (org.name as string) ?? '',
      category: (org.category as string) ?? null,
      support_email: (org.support_email as string) ?? null,
      website: (org.website as string) ?? null,
      address: address && typeof address === 'object' ? address : null,
    },
    mainContact: contact
      ? {
          id: contact.id as string,
          first_name: (contact.first_name as string) ?? '',
          last_name: (contact.last_name as string) ?? '',
          email: (contact.email as string) ?? null,
          phone: (contact.phone as string) ?? null,
        }
      : null,
    pastDealsCount: typeof count === 'number' ? count : 0,
    /** Fetched separately in drawer via updatePrivateNotes / network API (owner_org_id required). */
    privateNotes: null,
    relationshipId: rel?.id ?? null,
  };
}
