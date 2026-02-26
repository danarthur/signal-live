'use server';

import 'server-only';
import { createClient } from '@/shared/api/supabase/server';
import { getOrgMemberWithSkills } from '@/entities/talent';
import type { OrgMemberWithSkillsDTO } from '@/entities/talent';
import { updateMemberIdentitySchema, addSkillSchema, removeSkillSchema } from '../model/schema';
import type { UpdateMemberIdentityInput, AddSkillInput, RemoveSkillInput } from '../model/schema';

export async function getMemberForSheet(orgMemberId: string): Promise<OrgMemberWithSkillsDTO | null> {
  return getOrgMemberWithSkills(orgMemberId);
}

export type MemberActionResult = { ok: true } | { ok: false; error: string };

async function assertCanManageOrgMember(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in.' };
  const { data: entity } = await supabase.from('entities').select('id').eq('auth_id', user.id).maybeSingle();
  if (!entity) return { ok: false as const, error: 'Account not linked.' };
  const { data: aff } = await supabase
    .from('affiliations')
    .select('organization_id')
    .eq('entity_id', entity.id)
    .eq('organization_id', orgId)
    .in('access_level', ['admin', 'member'])
    .eq('status', 'active')
    .maybeSingle();
  if (!aff) return { ok: false as const, error: 'No permission to manage this org.' };
  return null;
}

export async function updateMemberIdentity(input: UpdateMemberIdentityInput): Promise<MemberActionResult> {
  const parsed = updateMemberIdentitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const supabase = await createClient();
  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('id', parsed.data.org_member_id)
    .single();
  if (!member) return { ok: false, error: 'Member not found.' };
  const err = await assertCanManageOrgMember(supabase, member.org_id);
  if (err) return err;

  const { error } = await supabase
    .from('org_members')
    .update({
      first_name: parsed.data.first_name ?? null,
      last_name: parsed.data.last_name ?? null,
      phone: parsed.data.phone ?? null,
      job_title: parsed.data.job_title ?? null,
    })
    .eq('id', parsed.data.org_member_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function addSkillToMember(input: AddSkillInput): Promise<MemberActionResult> {
  const parsed = addSkillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const supabase = await createClient();
  const { data: om } = await supabase
    .from('org_members')
    .select('id, org_id, workspace_id')
    .eq('id', parsed.data.org_member_id)
    .single();
  if (!om) return { ok: false, error: 'Member not found.' };
  const err = await assertCanManageOrgMember(supabase, om.org_id);
  if (err) return err;

  const { error } = await supabase.from('talent_skills').insert({
    org_member_id: parsed.data.org_member_id,
    workspace_id: om.workspace_id,
    skill_tag: parsed.data.skill_tag.trim(),
  });

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Skill already added.' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function removeSkillFromMember(input: RemoveSkillInput): Promise<MemberActionResult> {
  const parsed = removeSkillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const supabase = await createClient();
  const { data: skill } = await supabase
    .from('talent_skills')
    .select('org_member_id')
    .eq('id', parsed.data.talent_skill_id)
    .single();
  if (!skill) return { ok: false, error: 'Skill not found.' };
  const { data: om } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('id', skill.org_member_id)
    .single();
  if (!om) return { ok: false, error: 'Member not found.' };
  const err = await assertCanManageOrgMember(supabase, om.org_id);
  if (err) return err;

  const { error } = await supabase
    .from('talent_skills')
    .delete()
    .eq('id', parsed.data.talent_skill_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
