/**
 * Summoning Protocol – Invite ghosts, cure relationships, claim account with Magnet.
 * @module features/summoning/api/actions
 */

'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/api/supabase/server';
import { sendSummonEmail } from '@/shared/api/email/send';
import { randomBytes } from 'crypto';

const INVITE_EXPIRY_DAYS = 14;

type SummonResult =
  | { ok: true; token: string; cured?: false }
  | { ok: true; cured: true; message: string }
  | { ok: false; error: string };

async function getCurrentOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  if (!entity) return null;
  const { data: aff } = await supabase
    .from('affiliations')
    .select('organization_id')
    .eq('entity_id', entity.id)
    .in('access_level', ['admin', 'member', 'read_only'])
    .limit(1)
    .maybeSingle();
  return aff?.organization_id ?? null;
}

/**
 * Generate a secure token for invitations (cannot be guessed).
 */
function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Summon a partner (ghost org) by email. If they already have a real account, "Cure" the relationship.
 * Idempotent: repeated call with same args returns existing pending token.
 */
export async function createPartnerSummon(
  originOrgId: string,
  ghostOrgId: string,
  email: string,
  payload?: { redirectTo?: string }
): Promise<SummonResult> {
  const supabase = await createClient();
  const currentOrgId = await getCurrentOrgId(supabase);
  if (!currentOrgId || currentOrgId !== originOrgId) {
    return { ok: false, error: 'Not authorized.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { ok: false, error: 'Email is required.' };

  // Cure: already a real user with this email?
  const { data: entity } = await supabase
    .from('entities')
    .select('id, auth_id')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (entity?.auth_id) {
    // Find the sovereign org they own (claimed org where they are owner)
    const { data: aff } = await supabase
      .from('affiliations')
      .select('organization_id')
      .eq('entity_id', entity.id)
      .eq('access_level', 'admin')
      .limit(1)
      .maybeSingle();
    if (aff) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, is_claimed')
        .eq('id', aff.organization_id)
        .single();
      if (org?.is_claimed) {
        const sovereignOrgId = org.id;
        const { error: updateError } = await supabase
          .from('org_relationships')
          .update({ target_org_id: sovereignOrgId })
          .eq('source_org_id', originOrgId)
          .eq('target_org_id', ghostOrgId);
        if (!updateError) {
          revalidatePath('/network');
          return { ok: true, cured: true, message: 'Partner already on Signal. Relationship updated.' };
        }
      }
    }
  }

  // Idempotent: existing pending invitation for this email + ghost + origin?
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  const { data: existing } = await supabase
    .from('invitations')
    .select('id, token')
    .eq('email', normalizedEmail)
    .eq('target_org_id', ghostOrgId)
    .eq('created_by_org_id', originOrgId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return { ok: true, token: existing.token };
  }

  const token = generateSecureToken();
  const { error } = await supabase.from('invitations').insert({
    token,
    email: normalizedEmail,
    created_by_org_id: originOrgId,
    organization_id: ghostOrgId,
    target_org_id: ghostOrgId,
    type: 'partner_summon',
    status: 'pending',
    expires_at: expiresAt.toISOString(),
    payload: payload ?? null,
  } as Record<string, unknown>);

  if (error) return { ok: false, error: error.message };

  const { data: originOrg } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', originOrgId)
    .single();
  const originName = originOrg?.name ?? 'A partner';
  const sendResult = await sendSummonEmail(normalizedEmail, token, originName);
  if (!sendResult.ok) {
    // Invite is created; link can be shared manually. Do not fail the action.
    console.warn('[Summoning] Courier failed:', sendResult.error);
  }
  return { ok: true, token };
}

/**
 * Create auth user for claim flow (Step 3). Call this before finishPartnerClaim so session exists.
 */
export async function signUpForClaim(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: undefined },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Validate a summon/claim token; returns email and payload for the claim wizard.
 */
export async function validateSummonToken(
  token: string
): Promise<
  | { ok: true; email: string; payload: { redirectTo?: string } | null; type: string }
  | { ok: false; error: string }
> {
  if (!token?.trim()) return { ok: false, error: 'Missing token.' };
  const supabase = await createClient();
  const { data: inv, error } = await supabase
    .from('invitations')
    .select('id, email, status, expires_at, type, payload')
    .eq('token', token.trim())
    .maybeSingle();
  if (error || !inv) return { ok: false, error: 'Invalid or expired link.' };
  if (inv.status !== 'pending') return { ok: false, error: 'This link has already been used.' };
  if (new Date(inv.expires_at) <= new Date()) return { ok: false, error: 'This link has expired.' };
  const payload = (inv.payload as { redirectTo?: string } | null) ?? null;
  return {
    ok: true,
    email: inv.email,
    payload,
    type: (inv as { type?: string }).type ?? 'employee_invite',
  };
}

export type ClaimInvitation = {
  token: string;
  email: string;
  type: string;
  payload: { redirectTo?: string } | null;
  originName: string;
  targetName: string;
  targetLogoUrl: string | null;
};

/**
 * Fetch full invitation by token for the Airlock (claim page). Returns origin + target org names.
 * Use for Server Component; invalid/expired/used -> ok: false.
 */
export async function getInvitationForClaim(
  token: string
): Promise<{ ok: true; invitation: ClaimInvitation } | { ok: false; error: string }> {
  if (!token?.trim()) return { ok: false, error: 'Missing token.' };
  const supabase = await createClient();
  const { data: inv, error: invError } = await supabase
    .from('invitations')
    .select('id, email, status, expires_at, type, payload, created_by_org_id, target_org_id, organization_id')
    .eq('token', token.trim())
    .maybeSingle();

  if (invError || !inv) return { ok: false, error: 'Invalid or expired link.' };
  const invRow = inv as { created_by_org_id: string; target_org_id: string | null; organization_id: string; type?: string; payload: unknown };
  if (inv.status !== 'pending') return { ok: false, error: 'This link has already been used.' };
  if (new Date((inv as { expires_at: string }).expires_at) <= new Date()) return { ok: false, error: 'This link has expired.' };

  const targetOrgId = invRow.target_org_id ?? invRow.organization_id;
  const [originRes, targetRes] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', invRow.created_by_org_id).single(),
    supabase.from('organizations').select('name, logo_url').eq('id', targetOrgId).single(),
  ]);
  const originName = originRes.data?.name ?? 'A partner';
  const targetName = targetRes.data?.name ?? (inv as { email: string }).email.split('@')[0] ?? 'Your organization';
  const targetLogoUrl = targetRes.data?.logo_url ?? null;
  const payload = (invRow.payload as { redirectTo?: string } | null) ?? null;

  return {
    ok: true,
    invitation: {
      token: token.trim(),
      email: (inv as { email: string }).email,
      type: invRow.type ?? 'employee_invite',
      payload,
      originName,
      targetName,
      targetLogoUrl,
    },
  };
}

/**
 * After the user has signed up (auth exists), complete the claim: create sovereign org and run the Magnet.
 * Call this from the claim page after client-side signUp succeeds.
 */
export async function finishPartnerClaim(
  token: string,
  name: string,
  slug?: string
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.email) return { ok: false, error: 'You must be signed in.' };

  const { data: inv, error: invError } = await supabase
    .from('invitations')
    .select('id, email, organization_id, target_org_id, created_by_org_id, payload')
    .eq('token', token.trim())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .eq('type', 'partner_summon')
    .maybeSingle();

  if (invError || !inv) return { ok: false, error: 'Invalid or expired invitation.' };
  if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: 'This invitation was sent to a different email address.' };
  }

  const payload = (inv.payload as { redirectTo?: string } | null) ?? null;
  const redirectTo = payload?.redirectTo ?? '/network';

  let entityId: string;
  const { data: existingEntity } = await supabase
    .from('entities')
    .select('id')
    .ilike('email', user.email)
    .maybeSingle();

  if (existingEntity) {
    await supabase.from('entities').update({ is_ghost: false, auth_id: user.id }).eq('id', existingEntity.id);
    entityId = existingEntity.id;
  } else {
    const { data: newEntity, error: entityError } = await supabase
      .from('entities')
      .insert({ email: user.email, is_ghost: false, auth_id: user.id })
      .select('id')
      .single();
    if (entityError || !newEntity) return { ok: false, error: 'Failed to create profile.' };
    entityId = newEntity.id;
  }

  const orgName = name?.trim() || inv.email.split('@')[0] || 'My Organization';
  const orgSlug = (slug?.trim() || orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).slice(0, 64) || 'org';
  const ghostOrgId = inv.target_org_id ?? inv.organization_id;
  const { data: ghostOrg } = await supabase
    .from('organizations')
    .select('workspace_id')
    .eq('id', ghostOrgId)
    .single();
  const workspaceId = ghostOrg?.workspace_id;
  if (!workspaceId) return { ok: false, error: 'Workspace not found.' };

  const { data: sovereignOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: orgName,
      slug: orgSlug,
      is_claimed: true,
      claimed_at: new Date().toISOString(),
      owner_id: entityId,
      workspace_id: workspaceId,
    })
    .select('id')
    .single();

  if (orgError || !sovereignOrg) return { ok: false, error: 'Failed to create organization.' };

  await supabase.from('affiliations').insert({
    entity_id: entityId,
    organization_id: sovereignOrg.id,
    access_level: 'admin',
    status: 'active',
  });

  // Magnet: invitation's ghost + any other ghost orgs this entity is affiliated with
  const inviteGhostId = ghostOrgId;
  const { data: ghostAffs } = await supabase
    .from('affiliations')
    .select('organization_id')
    .eq('entity_id', entityId);
  const ghostOrgIds = [
    inviteGhostId,
    ...(ghostAffs ?? []).map((a) => a.organization_id),
  ].filter(Boolean) as string[];
  const uniqueGhostIds = [...new Set(ghostOrgIds)];

  const { data: ghostOrgs } = await supabase
    .from('organizations')
    .select('id, created_by_org_id')
    .in('id', uniqueGhostIds)
    .eq('is_claimed', false);

  for (const ghost of ghostOrgs ?? []) {
    const plannerOrgId = ghost.created_by_org_id;
    if (!plannerOrgId || plannerOrgId === sovereignOrg.id) continue;

    const { data: rel } = await supabase
      .from('org_relationships')
      .select('id, notes')
      .eq('source_org_id', plannerOrgId)
      .eq('target_org_id', ghost.id)
      .maybeSingle();

    const { data: orgWorkspace } = await supabase
      .from('organizations')
      .select('workspace_id')
      .eq('id', plannerOrgId)
      .single();

    if (orgWorkspace?.workspace_id) {
      await supabase.from('org_relationships').upsert(
        {
          source_org_id: plannerOrgId,
          target_org_id: sovereignOrg.id,
          type: 'partner',
          tier: 'preferred',
          notes: rel?.notes ?? null,
          workspace_id: orgWorkspace.workspace_id,
        },
        { onConflict: 'source_org_id,target_org_id' }
      );
    }

    const { data: privateRow } = await supabase
      .from('org_private_data')
      .select('private_notes, internal_rating')
      .eq('owner_org_id', plannerOrgId)
      .eq('subject_org_id', ghost.id)
      .maybeSingle();

    if (privateRow) {
      await supabase.from('org_private_data').upsert({
        owner_org_id: plannerOrgId,
        subject_org_id: sovereignOrg.id,
        private_notes: privateRow.private_notes,
        internal_rating: privateRow.internal_rating,
      }, { onConflict: 'subject_org_id,owner_org_id' });
    }

    await supabase
      .from('organizations')
      .update({ merged_into_org_id: sovereignOrg.id })
      .eq('id', ghost.id);
  }

  await supabase.from('invitations').update({ status: 'accepted' }).eq('id', inv.id);
  revalidatePath('/network');
  return { ok: true, redirectTo };
}
