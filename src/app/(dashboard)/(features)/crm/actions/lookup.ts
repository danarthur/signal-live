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
// searchOmni: Search directory.entities (clients + contacts), unified list
// Clients: type in ('organization', 'client'). Contacts: type = 'person'.
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

    const [clientsRes, contactsRes] = await Promise.all([
      supabase
        .schema('directory')
        .from('entities')
        .select('id, type, display_name, attributes')
        .eq('owner_workspace_id', workspaceId)
        .in('type', ['organization', 'client'])
        .ilike('display_name', pattern)
        .order('display_name')
        .limit(3),
      supabase
        .schema('directory')
        .from('entities')
        .select('id, type, display_name, attributes')
        .eq('owner_workspace_id', workspaceId)
        .eq('type', 'person')
        .ilike('display_name', pattern)
        .order('display_name')
        .limit(3),
    ]);

    const results: OmniResult[] = [];
    for (const row of clientsRes.data ?? []) {
      results.push({ type: 'org', id: row.id, name: row.display_name ?? '' });
    }
    for (const row of contactsRes.data ?? []) {
      const attrs = (row.attributes as Record<string, unknown>) ?? {};
      const first = (attrs.first_name as string) ?? '';
      const last = (attrs.last_name as string) ?? '';
      const email = (attrs.email as string) ?? null;
      const orgId = (attrs.organization_id as string) ?? null;
      results.push({
        type: 'contact',
        id: row.id,
        first_name: first,
        last_name: last,
        email,
        organization_id: orgId,
        subtitle: email ?? undefined,
      });
    }

    return results.slice(0, 5);
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// getVenueSuggestions: "Liquid Memory" venue lookup from directory.entities
// Filter by type = 'venue'. Name/address from display_name and attributes.
// Heuristic 3: Return "Create new venue" signal when no match.
// -----------------------------------------------------------------------------
export async function getVenueSuggestions(
  query: string,
  _organizationId?: string | null
): Promise<VenueSuggestion[]> {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return [];

  try {
    const supabase = await createClient();
    const trimmed = query.trim();
    const pattern = trimmed.length >= 1 ? `%${trimmed}%` : '%';

    const { data: venues } = await supabase
      .schema('directory')
      .from('entities')
      .select('id, display_name, attributes')
      .eq('owner_workspace_id', workspaceId)
      .eq('type', 'venue')
      .or(`display_name.ilike.${pattern},attributes->>address.ilike.${pattern},attributes->>city.ilike.${pattern}`)
      .order('display_name')
      .limit(5);

    const fromTable: VenueSuggestion[] = (venues ?? []).map((v) => {
      const attrs = (v.attributes as Record<string, unknown>) ?? {};
      return {
        type: 'venue' as const,
        id: v.id,
        name: (v.display_name as string) ?? '',
        address: (attrs.address as string) ?? null,
        city: (attrs.city as string) ?? null,
        state: (attrs.state as string) ?? null,
      };
    });

    if (fromTable.length === 0 && trimmed.length >= 2) {
      return [{ type: 'create', query: trimmed }];
    }

    return fromTable;
  } catch {
    return [];
  }
}
