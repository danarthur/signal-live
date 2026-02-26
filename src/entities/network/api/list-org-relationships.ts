'use server';

import 'server-only';
import { createClient } from '@/shared/api/supabase/server';
import type { OrgConnectionItem, RelationshipType } from '../model/types';

/**
 * List org_relationships for a source org (my Rolodex).
 * RLS: only source_org members can see.
 */
export async function listOrgRelationships(sourceOrgId: string): Promise<OrgConnectionItem[]> {
  const supabase = await createClient();
  const { data: rels, error: relError } = await supabase
    .from('org_relationships')
    .select('id, source_org_id, target_org_id, type, notes, created_at')
    .eq('source_org_id', sourceOrgId)
    .order('created_at', { ascending: false });

  if (relError || !rels?.length) return [];

  const targetIds = [...new Set(rels.map((r) => r.target_org_id))];
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, is_ghost, address')
    .in('id', targetIds);

  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o]));
  return rels.map((r) => {
    const target = orgMap.get(r.target_org_id);
    return {
      id: r.id,
      source_org_id: r.source_org_id,
      target_org_id: r.target_org_id,
      type: r.type as RelationshipType,
      notes: r.notes,
      created_at: r.created_at,
      target_org: target
        ? {
            id: target.id,
            name: target.name,
            is_ghost: (target as { is_ghost?: boolean }).is_ghost ?? false,
            address: (target.address as { city?: string; state?: string } | null) ?? null,
          }
        : { id: r.target_org_id, name: 'Unknown', is_ghost: false, address: null },
    };
  });
}
