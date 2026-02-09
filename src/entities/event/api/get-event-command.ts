/**
 * Event entity – fetch full Event Genome for Command Center.
 * Server-only; workspace-scoped via RLS.
 */

import 'server-only';

import { createClient } from '@/shared/api/supabase/server';
import type { EventCommandDTO } from '../model/types';

export async function getEventCommand(eventId: string): Promise<EventCommandDTO | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const workspaceId = membership?.workspace_id ?? null;
  if (!workspaceId) return null;

  const { data: row, error } = await supabase
    .from('events')
    .select(`
      id,
      workspace_id,
      title,
      internal_code,
      status,
      lifecycle_status,
      confidentiality_level,
      slug,
      starts_at,
      ends_at,
      dates_load_in,
      dates_load_out,
      venue_name,
      venue_address,
      venue_google_maps_id,
      location_name,
      location_address,
      logistics_dock_info,
      logistics_power_info,
      client_id,
      producer_id,
      pm_id,
      guest_count_expected,
      guest_count_actual,
      tech_requirements,
      compliance_docs,
      project_id,
      crm_probability,
      crm_estimated_value,
      lead_source,
      notes,
      created_at,
      updated_at,
      organizations:client_id(name),
      producer:producer_id(full_name),
      pm:pm_id(full_name)
    `)
    .eq('id', eventId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error('[event] getEventCommand:', error.message);
    return null;
  }

  const r = row as Record<string, unknown>;
  const org = (r.organizations as { name?: string } | null) ?? null;
  const producerRow = r.producer as { full_name?: string } | { full_name?: string }[] | null;
  const producer = Array.isArray(producerRow) ? producerRow[0] ?? null : producerRow;
  const pmRow = r.pm as { full_name?: string } | { full_name?: string }[] | null;
  const pm = Array.isArray(pmRow) ? pmRow[0] ?? null : pmRow;

  const dto: EventCommandDTO = {
    id: r.id as string,
    workspace_id: r.workspace_id as string,
    title: (r.title as string) ?? null,
    internal_code: (r.internal_code as string) ?? null,
    status: (r.status as string) ?? null,
    lifecycle_status: (r.lifecycle_status as EventCommandDTO['lifecycle_status']) ?? null,
    confidentiality_level: (r.confidentiality_level as EventCommandDTO['confidentiality_level']) ?? null,
    slug: (r.slug as string) ?? null,
    starts_at: r.starts_at as string,
    ends_at: r.ends_at as string,
    dates_load_in: (r.dates_load_in as string) ?? null,
    dates_load_out: (r.dates_load_out as string) ?? null,
    venue_name: (r.venue_name as string) ?? null,
    venue_address: (r.venue_address as string) ?? null,
    venue_google_maps_id: (r.venue_google_maps_id as string) ?? null,
    location_name: (r.location_name as string) ?? null,
    location_address: (r.location_address as string) ?? null,
    logistics_dock_info: (r.logistics_dock_info as string) ?? null,
    logistics_power_info: (r.logistics_power_info as string) ?? null,
    client_id: (r.client_id as string) ?? null,
    producer_id: (r.producer_id as string) ?? null,
    pm_id: (r.pm_id as string) ?? null,
    guest_count_expected: (r.guest_count_expected as number) ?? null,
    guest_count_actual: (r.guest_count_actual as number) ?? null,
    tech_requirements: (r.tech_requirements as EventCommandDTO['tech_requirements']) ?? null,
    compliance_docs: (r.compliance_docs as EventCommandDTO['compliance_docs']) ?? null,
    project_id: (r.project_id as string) ?? null,
    crm_probability: (r.crm_probability as number) ?? null,
    crm_estimated_value: (r.crm_estimated_value as number) ?? null,
    lead_source: (r.lead_source as string) ?? null,
    notes: (r.notes as string) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    client_name: (org?.name as string) ?? null,
    producer_name: (producer?.full_name as string) ?? null,
    pm_name: (pm?.full_name as string) ?? null,
  };

  return dto;
}
