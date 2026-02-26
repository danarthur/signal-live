/**
 * Event entity – fetch full Event Genome for Command Center.
 * Reads from ops.events (project-scoped); workspace via project join.
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
    .schema('ops')
    .from('events')
    .select('id, project_id, name, start_at, end_at, venue_entity_id, created_at, project:projects!inner(workspace_id)')
    .eq('id', eventId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error('[event] getEventCommand:', error.message);
    return null;
  }

  const r = row as Record<string, unknown>;
  const project = (r.project as { workspace_id?: string } | null) ?? null;
  const wsId = project?.workspace_id ?? workspaceId;

  const dto: EventCommandDTO = {
    id: r.id as string,
    workspace_id: wsId,
    title: (r.name as string) ?? null,
    internal_code: null,
    status: null,
    lifecycle_status: null,
    confidentiality_level: null,
    slug: null,
    starts_at: (r.start_at as string) ?? '',
    ends_at: (r.end_at as string) ?? '',
    dates_load_in: null,
    dates_load_out: null,
    venue_name: null,
    venue_address: null,
    venue_google_maps_id: null,
    location_name: null,
    location_address: null,
    logistics_dock_info: null,
    logistics_power_info: null,
    client_id: null,
    producer_id: null,
    pm_id: null,
    guest_count_expected: null,
    guest_count_actual: null,
    tech_requirements: null,
    compliance_docs: null,
    project_id: (r.project_id as string) ?? null,
    crm_probability: null,
    crm_estimated_value: null,
    lead_source: null,
    notes: null,
    created_at: (r.created_at as string) ?? '',
    updated_at: (r.created_at as string) ?? '',
    client_name: null,
    producer_name: null,
    pm_name: null,
  };

  return dto;
}
