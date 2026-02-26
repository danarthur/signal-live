/**
 * Network Manager – Server Actions for graph data, invitation validation, and private notes.
 * @module features/network/api/actions
 */

'use server';

import 'server-only';
import { unstable_noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/shared/api/supabase/server';
import { getSystemClient } from '@/shared/api/supabase/system';
import type { NetworkGraph, ValidateInvitationResult } from '../model/types';

const CURRENT_ORG_COOKIE = 'signal_current_org_id';

/** HQ role priority: owner, admin, manager, member, restricted (Observer). */
const ORG_ROLE_PRIORITY: Record<string, number> = {
  owner: 0,
  admin: 1,
  manager: 2,
  member: 3,
  restricted: 4,
};

/**
 * Resolves the current user's "Home Organization" (HQ) for Network/Team context.
 * Priority: 1) Org they OWN, 2) first ADMIN org, 3) first MEMBER org.
 * Returns null if not authenticated or no org (user should complete onboarding / Create HQ).
 */
export async function getCurrentOrgId(): Promise<string | null> {
  unstable_noStore();
  const supabase = await createClient();
  const { entityId, orgId } = await getCurrentEntityAndOrg(supabase);
  if (orgId) return orgId;

  // RPC (if present) uses auth.uid() and bypasses RLS
  const { data: rpcOrgId } = await supabase.rpc('get_current_org_id');
  if (rpcOrgId) return rpcOrgId as string;

  if (!entityId) {
    // User has no entity (e.g. onboarding only created commercial_organizations + organization_members).
    // Resolve org from organization_members first so onboarding-created orgs are found.
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('role', { ascending: false }) // owner before admin before member
        .limit(1)
        .maybeSingle();
      if (membership?.organization_id) return membership.organization_id;
      const resolved = await resolveCurrentOrgIdWithServiceRole(user.id);
      if (resolved) return resolved;
    }
    return null;
  }

  const cookieStore = await cookies();
  const lastOrg = cookieStore.get(CURRENT_ORG_COOKIE)?.value;
  if (lastOrg?.trim()) {
    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('entity_id', entityId)
      .eq('org_id', lastOrg.trim())
      .limit(1)
      .maybeSingle();
    if (member?.org_id) return member.org_id;
  }

  // Fallback: service role lookup (bypasses RLS)
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) {
    const resolved = await resolveCurrentOrgIdWithServiceRole(user.id);
    if (resolved) return resolved;
  }

  // Fallback when directory org tables (organizations / org_members / entities) are missing or empty:
  // use public commercial_organizations via organization_members so Network tab works.
  if (user?.id) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (membership?.organization_id) return membership.organization_id;
  }
  return null;
}

/**
 * Resolve current user's HQ org using service role (bypasses RLS).
 * Only call with auth user id from session — never expose service client to client.
 */
async function resolveCurrentOrgIdWithServiceRole(authUserId: string): Promise<string | null> {
  try {
    const sys = getSystemClient();
    const { data: entity } = await sys
      .from('entities')
      .select('id')
      .eq('auth_id', authUserId)
      .maybeSingle();
    if (!entity) return null;

    const { data: members } = await sys
      .from('org_members')
      .select('org_id, role')
      .eq('entity_id', entity.id);
    if (members?.length) {
      const sorted = [...members].sort(
        (a, b) => (ORG_ROLE_PRIORITY[a.role] ?? 99) - (ORG_ROLE_PRIORITY[b.role] ?? 99)
      );
      return sorted[0].org_id;
    }

    const { data: owned } = await sys
      .from('organizations')
      .select('id')
      .eq('owner_id', entity.id)
      .limit(1)
      .maybeSingle();
    return owned?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve current user's entity id (anon first, then service-role fallback).
 * Use this whenever a flow needs "current user's entity" for permissions (e.g. ghost profile, invite).
 */
export async function getCurrentEntityId(): Promise<string | null> {
  unstable_noStore();
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (entity?.id) return entity.id;

  try {
    const sys = getSystemClient();
    const { data: sysEntity } = await sys
      .from('entities')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();
    return sysEntity?.id ?? null;
  } catch {
    return null;
  }
}

/** Resolve current user's entity id and their HQ org (org_members with role priority: owner → admin → member). */
async function getCurrentEntityAndOrg(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { entityId: null, orgId: null };

  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (!entity) return { entityId: null, orgId: null };

  const { data: members } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('entity_id', entity.id);

  if (members?.length) {
    const sorted = [...members].sort(
      (a, b) => (ORG_ROLE_PRIORITY[a.role] ?? 99) - (ORG_ROLE_PRIORITY[b.role] ?? 99)
    );
    return { entityId: entity.id, orgId: sorted[0].org_id };
  }

  // Fallback: you own an org (organizations.owner_id) but org_members row missing or not visible (e.g. RLS).
  // Organizations RLS (workspace_isolate) lets you see orgs in your workspace, so we can resolve HQ here.
  const { data: owned } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', entity.id)
    .limit(1)
    .maybeSingle();
  if (owned?.id) return { entityId: entity.id, orgId: owned.id };

  return { entityId: entity.id, orgId: null };
}

/** Call from pages when you have a valid currentOrgId so it can be restored after nav (cookie fallback). */
export async function setCurrentOrgCookie(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CURRENT_ORG_COOKIE, orgId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Fetch the network graph scoped to current_org_id (Operator view – e.g. Invisible Touch).
 * Only returns orgs created by or owned by the current org, plus their rosters and our private notes.
 */
export async function getNetworkGraph(
  current_org_id: string
): Promise<NetworkGraph | null> {
  const supabase = await createClient();
  const { orgId } = await getCurrentEntityAndOrg(supabase);
  if (!orgId || orgId !== current_org_id) {
    return null;
  }

  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug, is_claimed, claimed_at, created_by_org_id, category')
    .or(`id.eq.${current_org_id},created_by_org_id.eq.${current_org_id}`);

  if (orgsError || !orgs?.length) {
    return { current_org_id, organizations: [], entities: [] };
  }

  const orgIds = orgs.map((o) => o.id);

  const { data: privateData } = await supabase
    .from('org_private_data')
    .select('subject_org_id, private_notes, internal_rating')
    .eq('owner_org_id', current_org_id)
    .in('subject_org_id', orgIds);

  const privateBySubject = new Map(
    (privateData ?? []).map((p) => [p.subject_org_id, { private_notes: p.private_notes, internal_rating: p.internal_rating }])
  );

  const { data: affiliations } = await supabase
    .from('affiliations')
    .select('organization_id, entity_id, role_label, access_level')
    .in('organization_id', orgIds)
    .eq('status', 'active');

  const { data: entityRows } = await supabase
    .from('entities')
    .select('id, email, is_ghost, auth_id')
    .in(
      'id',
      [...new Set((affiliations ?? []).map((a) => a.entity_id))]
    );

  const entityMap = new Map((entityRows ?? []).map((e) => [e.id, e]));
  const affByOrg = new Map<string, typeof affiliations>();
  for (const a of affiliations ?? []) {
    if (!affByOrg.has(a.organization_id)) affByOrg.set(a.organization_id, []);
    affByOrg.get(a.organization_id)!.push(a);
  }
  const affByEntity = new Map<string, { org_id: string; role_label: string | null; access_level: string }[]>();
  for (const a of affiliations ?? []) {
    if (!affByEntity.has(a.entity_id)) affByEntity.set(a.entity_id, []);
    affByEntity.get(a.entity_id)!.push({
      org_id: a.organization_id,
      role_label: a.role_label,
      access_level: a.access_level as 'admin' | 'member' | 'read_only',
    });
  }

  const entityIds = [...new Set((affiliations ?? []).map((a) => a.entity_id))];
  const { data: orgMembers } = entityIds.length > 0
    ? await supabase
        .from('org_members')
        .select('id, org_id, entity_id')
        .in('org_id', orgIds)
        .in('entity_id', entityIds)
    : { data: [] };
  const orgMemberIds = (orgMembers ?? []).map((m) => m.id);
  const { data: skillRows } = orgMemberIds.length > 0
    ? await supabase
        .from('talent_skills')
        .select('org_member_id, skill_tag')
        .in('org_member_id', orgMemberIds)
    : { data: [] };
  const skillsByOrgMemberId = new Map<string, string[]>();
  for (const s of skillRows ?? []) {
    const list = skillsByOrgMemberId.get(s.org_member_id) ?? [];
    list.push(s.skill_tag);
    skillsByOrgMemberId.set(s.org_member_id, list);
  }
  const orgMemberByOrgAndEntity = new Map<string, { id: string }>();
  for (const m of orgMembers ?? []) {
    const eid = (m as { entity_id?: string | null }).entity_id;
    if (eid) orgMemberByOrgAndEntity.set(`${m.org_id}:${eid}`, { id: m.id });
  }

  const orgNameById = new Map(orgs.map((o) => [o.id, o.name]));

  const organizations: NetworkGraph['organizations'] = orgs.map((org) => {
    const priv = privateBySubject.get(org.id);
    const affs = affByOrg.get(org.id) ?? [];
    const roster = affs
      .map((a) => {
        const e = entityMap.get(a.entity_id);
        if (!e) return null;
        const entityOrgs = affByEntity.get(a.entity_id) ?? [];
        const om = orgMemberByOrgAndEntity.get(`${org.id}:${a.entity_id}`);
        const skill_tags = om ? (skillsByOrgMemberId.get(om.id) ?? []) : [];
        return {
          id: e.id,
          email: e.email,
          is_ghost: e.is_ghost,
          role_label: a.role_label,
          access_level: a.access_level as 'admin' | 'member' | 'read_only',
          organization_ids: entityOrgs.map((x) => x.org_id),
          skill_tags,
          org_member_id: om?.id ?? null,
        };
      })
      .filter(Boolean) as NetworkGraph['organizations'][0]['roster'];
    const category = (org as { category?: string | null }).category ?? null;
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      is_claimed: org.is_claimed ?? false,
      claimed_at: org.claimed_at,
      created_by_org_id: org.created_by_org_id,
      category: category as NetworkGraph['organizations'][0]['category'],
      private_notes: priv?.private_notes ?? null,
      internal_rating: priv?.internal_rating ?? null,
      roster,
    };
  });

  const entities: NetworkGraph['entities'] = [];
  for (const [entityId, affs] of affByEntity) {
    const e = entityMap.get(entityId);
    if (!e) continue;
    const organization_names = affs.map((a) => orgNameById.get(a.org_id) ?? '').filter(Boolean);
    const first = affs[0];
    const allSkillTags = new Set<string>();
    for (const a of affs) {
      const om = orgMemberByOrgAndEntity.get(`${a.org_id}:${entityId}`);
      if (om) (skillsByOrgMemberId.get(om.id) ?? []).forEach((t) => allSkillTags.add(t));
    }
    const currentOrgMemberId = current_org_id
      ? orgMemberByOrgAndEntity.get(`${current_org_id}:${entityId}`)?.id ?? null
      : null;
    entities.push({
      id: e.id,
      email: e.email,
      is_ghost: e.is_ghost,
      role_label: first?.role_label ?? null,
      access_level: (first?.access_level ?? 'member') as 'admin' | 'member' | 'read_only',
      organization_ids: affs.map((a) => a.org_id),
      organization_names,
      skill_tags: [...allSkillTags],
      org_member_id: currentOrgMemberId,
    });
  }

  return { current_org_id, organizations, entities };
}

/**
 * Validate an invitation token (for the claim page). Returns email + org name if valid.
 */
export async function validateInvitation(
  token: string
): Promise<ValidateInvitationResult> {
  if (!token?.trim()) return { ok: false, error: 'Missing token.' };
  const supabase = await createClient();
  const { data: inv, error } = await supabase
    .from('invitations')
    .select('id, organization_id, email, status, expires_at')
    .eq('token', token.trim())
    .maybeSingle();
  if (error || !inv) return { ok: false, error: 'Invalid or expired invitation.' };
  if (inv.status !== 'pending')
    return { ok: false, error: 'This invitation has already been used.' };
  if (new Date(inv.expires_at) <= new Date())
    return { ok: false, error: 'This invitation has expired.' };

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', inv.organization_id)
    .single();
  return {
    ok: true,
    email: inv.email,
    org_name: org?.name ?? 'Organization',
    organization_id: inv.organization_id,
  };
}

/**
 * Update private notes for an org (owner_org_id = current user's org). For useOptimistic.
 */
export async function updatePrivateNotes(
  subject_org_id: string,
  private_notes: string | null,
  internal_rating: number | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { orgId } = await getCurrentEntityAndOrg(supabase);
  if (!orgId) return { ok: false, error: 'Not authorized.' };

  const payload = {
    subject_org_id,
    owner_org_id: orgId,
    private_notes: private_notes ?? null,
    internal_rating: internal_rating ?? null,
  };

  const { error } = await supabase.from('org_private_data').upsert(payload, {
    onConflict: 'subject_org_id,owner_org_id',
    ignoreDuplicates: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
