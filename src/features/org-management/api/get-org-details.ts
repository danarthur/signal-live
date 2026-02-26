'use server';

import 'server-only';
import { createClient } from '@/shared/api/supabase/server';
import type { OrgDetails, OrgAddress, OrgSocialLinks, OrgOperationalSettings } from '@/entities/organization';

/** Fetch full organization details for Command Center. RLS: only members/admins of the org. */
export async function getOrgDetails(orgId: string): Promise<OrgDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, workspace_id, category, is_claimed, is_ghost, created_at, updated_at, brand_color, website, logo_url, description, address, social_links, operational_settings, support_email, default_currency'
    )
    .eq('id', orgId)
    .maybeSingle();

  if (!error && data) {
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      name: row.name as string,
      slug: (row.slug as string | null) ?? null,
      workspace_id: row.workspace_id as string,
      category: (row.category as string | null) ?? null,
      is_claimed: (row.is_claimed as boolean) ?? false,
      is_ghost: (row.is_ghost as boolean) ?? false,
      created_at: (row.created_at as string | null) ?? null,
      updated_at: (row.updated_at as string | null) ?? null,
      brand_color: (row.brand_color as string | null) ?? null,
      website: (row.website as string | null) ?? null,
      logo_url: (row.logo_url as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      address: (row.address as OrgAddress | null) ?? null,
      social_links: (row.social_links as OrgSocialLinks | null) ?? null,
      operational_settings: (row.operational_settings as OrgOperationalSettings | null) ?? null,
      support_email: (row.support_email as string | null) ?? null,
      default_currency: (row.default_currency as string | null) ?? null,
    };
  }

  // Fallback: orgId may be a commercial_organizations id (e.g. when directory organizations don't exist)
  const { data: commercial } = await supabase
    .from('commercial_organizations')
    .select('id, name, workspace_id, created_at, updated_at')
    .eq('id', orgId)
    .maybeSingle();

  if (commercial) {
    return {
      id: commercial.id,
      name: commercial.name,
      slug: null,
      workspace_id: commercial.workspace_id ?? '',
      category: null,
      is_claimed: true,
      is_ghost: false,
      created_at: commercial.created_at ?? null,
      updated_at: commercial.updated_at ?? null,
      brand_color: null,
      website: null,
      logo_url: null,
      description: null,
      address: null,
      social_links: null,
      operational_settings: null,
      support_email: null,
      default_currency: null,
    };
  }
  return null;
}
