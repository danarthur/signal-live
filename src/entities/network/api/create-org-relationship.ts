'use server';

import 'server-only';
import { createClient } from '@/shared/api/supabase/server';
import type { RelationshipType } from '../model/types';

export type CreateOrgRelationshipResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Link source_org to target_org (vendor/venue/client/partner).
 * RLS: only source_org members can insert.
 * workspace_id is resolved from source org for tenant isolation.
 */
export async function createOrgRelationship(
  sourceOrgId: string,
  targetOrgId: string,
  type: RelationshipType,
  notes?: string | null
): Promise<CreateOrgRelationshipResult> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('workspace_id')
    .eq('id', sourceOrgId)
    .single();
  if (!org?.workspace_id) return { ok: false, error: 'Organization not found.' };

  const { data, error } = await supabase
    .from('org_relationships')
    .insert({
      source_org_id: sourceOrgId,
      target_org_id: targetOrgId,
      type,
      notes: notes ?? null,
      workspace_id: org.workspace_id,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}
