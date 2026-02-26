/**
 * Talent entity – Skills-based junction types (Holographic Roster).
 * Aligns with talent_skills + org_members.
 */

import type { Database } from '@/types/supabase';

export type EmploymentStatus = Database['public']['Enums']['employment_status'];
export type SkillLevel = Database['public']['Enums']['skill_level'];
export type OrgMemberRole = Database['public']['Enums']['org_member_role'];

export type TalentSkillRow = Database['public']['Tables']['talent_skills']['Row'];
export type TalentSkillInsert = Database['public']['Tables']['talent_skills']['Insert'];
export type TalentSkillUpdate = Database['public']['Tables']['talent_skills']['Update'];

export type OrgMemberRow = Database['public']['Tables']['org_members']['Row'];
export type OrgMemberInsert = Database['public']['Tables']['org_members']['Insert'];
export type OrgMemberUpdate = Database['public']['Tables']['org_members']['Update'];

/** Skill node for display (e.g. badge under member name). */
export interface TalentSkillDTO {
  id: string;
  skill_tag: string;
  proficiency: SkillLevel;
  hourly_rate: number | null;
  verified: boolean;
}

/** Org member with skills (expanded card). Ghost members have profile_id null. */
export interface OrgMemberWithSkillsDTO {
  id: string;
  profile_id: string | null;
  org_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  job_title: string | null;
  employment_status: EmploymentStatus;
  role: OrgMemberRole;
  default_hourly_rate: number;
  skills: TalentSkillDTO[];
  /** From profiles join (fallback when first_name/last_name empty). */
  profiles?: { full_name: string | null; email: string | null } | null;
}
