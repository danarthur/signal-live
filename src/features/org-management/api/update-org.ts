'use server';

import 'server-only';
import { createClient } from '@/shared/api/supabase/server';
import { updateOrgSchema } from '@/entities/organization/model/schema';
import type { UpdateOrgInput } from '@/entities/organization/model/schema';

export type UpdateOrgResult = { ok: true } | { ok: false; error: string };

/** Update organization profile (Identity, Operations). RLS: only admins/members of the org. */
export async function updateOrg(input: UpdateOrgInput): Promise<UpdateOrgResult> {
  const parsed = updateOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createClient();
  const { org_id, ...payload } = parsed.data;

  const toUpdate: Record<string, unknown> = {};
  if (payload.name !== undefined) toUpdate.name = payload.name;
  if (payload.description !== undefined) toUpdate.description = payload.description ?? null;
  if (payload.brand_color !== undefined) toUpdate.brand_color = payload.brand_color ?? null;
  if (payload.website !== undefined) toUpdate.website = payload.website === '' ? null : payload.website;
  if (payload.logo_url !== undefined) toUpdate.logo_url = payload.logo_url ?? null;
  if (payload.support_email !== undefined) toUpdate.support_email = payload.support_email === '' ? null : payload.support_email;
  if (payload.default_currency !== undefined) toUpdate.default_currency = payload.default_currency ?? null;
  if (payload.address !== undefined) toUpdate.address = payload.address ?? null;
  if (payload.social_links !== undefined) toUpdate.social_links = payload.social_links ?? null;
  if (payload.operational_settings !== undefined) toUpdate.operational_settings = payload.operational_settings ?? null;

  if (Object.keys(toUpdate).length === 0) return { ok: true };

  const { error } = await supabase
    .from('organizations')
    .update(toUpdate)
    .eq('id', org_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
