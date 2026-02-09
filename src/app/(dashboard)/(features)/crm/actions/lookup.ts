'use server';

import { createClient } from '@/shared/api/supabase/server';
import { getActiveWorkspaceId } from '@/shared/lib/workspace';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type OmniResult =
  | { type: 'org'; id: string; name: string; subtitle?: string }
  | { type: 'contact'; id: string; first_name: string; last_name: string; email: string | null; organization_id: string | null; subtitle?: string };

export type VenueSuggestion =
  | { type: 'venue'; id: string; name: string; address: string | null; city: string | null; state: string | null }
  | { type: 'create'; query: string };

// -----------------------------------------------------------------------------
// searchOmni: Search organizations + contacts, unified list
// Limit 5 for speed. Returns type: 'org' | 'contact'.
// -----------------------------------------------------------------------------
export async function searchOmni(query: string): Promise<OmniResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return [];

  try {
    const supabase = await createClient();
    const pattern = `%${trimmed}%`;

    const [orgsRes, contactsRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .ilike('name', pattern)
      .order('name')
      .limit(3),
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, organization_id')
      .eq('workspace_id', workspaceId)
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
      .order('last_name')
      .limit(3),
  ]);

  const results: OmniResult[] = [];
  for (const row of orgsRes.data ?? []) {
    results.push({ type: 'org', id: row.id, name: row.name });
  }
  for (const row of contactsRes.data ?? []) {
    results.push({
      type: 'contact',
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email ?? null,
      organization_id: row.organization_id ?? null,
      subtitle: row.email ?? undefined,
    });
  }

  return results.slice(0, 5);
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// getVenueSuggestions: "Liquid Memory" venue lookup
// Heuristic 1: If organizationId, fetch venues previously used by this org in gigs.
// Heuristic 2: If no org or no matches, search venues table by name/address.
// Heuristic 3: Return "Create new venue" signal when no match.
// -----------------------------------------------------------------------------
export async function getVenueSuggestions(
  query: string,
  organizationId?: string | null
): Promise<VenueSuggestion[]> {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return [];

  try {
    const supabase = await createClient();
  const trimmed = query.trim();
  const pattern = trimmed.length >= 1 ? `%${trimmed}%` : '%';

  // Heuristic 1: Org-scoped venues from past gigs (venue_id must exist after migration)
  if (organizationId) {
    const { data: gigs } = await supabase
      .from('gigs')
      .select('venue_id')
      .eq('organization_id', organizationId)
      .not('venue_id', 'is', null)
      .limit(10);

    const venueIds = [...new Set((gigs ?? []).map((g) => g.venue_id).filter(Boolean))] as string[];
    if (venueIds.length > 0) {
      const { data: venuesForOrg } = await supabase
        .from('venues')
        .select('id, name, address, city, state')
        .in('id', venueIds)
        .eq('workspace_id', workspaceId);

      const fromGigs: VenueSuggestion[] = (venuesForOrg ?? []).map((v) => ({
        type: 'venue' as const,
        id: v.id,
        name: v.name,
        address: v.address ?? null,
        city: v.city ?? null,
        state: v.state ?? null,
      }));

      const filtered = trimmed
        ? fromGigs.filter((v) =>
            v.type === 'venue' && [v.name, v.address, v.city, v.state].some((x) => x?.toLowerCase().includes(trimmed.toLowerCase()))
          )
        : fromGigs;
      if (filtered.length > 0) return filtered;
    }
  }

  // Heuristic 2: General venue search
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, address, city, state')
    .eq('workspace_id', workspaceId)
    .or(`name.ilike.${pattern},address.ilike.${pattern},city.ilike.${pattern}`)
    .order('name')
    .limit(5);

  const fromTable: VenueSuggestion[] = (venues ?? []).map((v) => ({
    type: 'venue' as const,
    id: v.id,
    name: v.name,
    address: v.address ?? null,
    city: v.city ?? null,
    state: v.state ?? null,
  }));

  // Heuristic 3: Create new venue signal
  if (fromTable.length === 0 && trimmed.length >= 2) {
    return [{ type: 'create', query: trimmed }];
  }

  return fromTable;
  } catch {
    return [];
  }
}
