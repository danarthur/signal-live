/**
 * Calendar feature - Server Action: fetch full event dossier by id
 * Joins projects. Optional: crew, guests, run_of_show when schema exists.
 * @module features/calendar/api/get-event-details
 */

import 'server-only';

import { createClient } from '@/shared/api/supabase/server';
import type { EventDetailDTO } from '../model/event-detail';
import type { EventStatus } from '../model/types';
import { getEventColor } from '../model/types';

const EVENT_STATUS_VALUES: EventStatus[] = ['confirmed', 'hold', 'cancelled', 'planned'];

function parseEventStatus(value: string | null): EventStatus {
  if (value && EVENT_STATUS_VALUES.includes(value as EventStatus)) {
    return value as EventStatus;
  }
  return 'planned';
}

interface EventRow {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: string | null;
  location_name: string | null;
  workspace_id: string;
  gig_id?: string | null;
  projects?: { id: string; name: string } | { id: string; name: string }[] | null;
}

function projectFromRow(row: EventRow): { id: string | null; name: string | null } {
  const p = row.projects;
  if (!p) return { id: null, name: null };
  const single = Array.isArray(p) ? p[0] : p;
  return { id: single?.id ?? null, name: single?.name ?? null };
}

/** Build starts_at from event_date (08:00 UTC). */
function startsAtFromEventDate(eventDate: string | null): string {
  if (!eventDate) return new Date().toISOString();
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setUTCHours(8, 0, 0, 0);
  return d.toISOString();
}

/** Build ends_at from event_date (18:00 UTC). */
function endsAtFromEventDate(eventDate: string | null): string {
  if (!eventDate) return new Date().toISOString();
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setUTCHours(18, 0, 0, 0);
  return d.toISOString();
}

/** Map gig status to event_status. */
function gigStatusToEventStatus(gigStatus: string | null): EventStatus {
  switch (gigStatus) {
    case 'confirmed':
    case 'run_of_show':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    case 'hold':
      return 'hold';
    default:
      return 'planned';
  }
}

/**
 * Fetches full event dossier by id (join projects).
 * Handles gig-backed events (id starts with "gig:") by fetching from gigs.
 * Returns comprehensive EventDetailDTO.
 */
export async function getEventDetails(eventId: string): Promise<EventDetailDTO | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const workspaceId = membership?.workspace_id ?? null;
  if (!workspaceId) return null;

  // gig-backed event: id is "gig:<gig_id>"
  if (eventId.startsWith('gig:')) {
    const gigId = eventId.slice(4);
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('id, title, status, event_date, workspace_id, location, client_name')
      .eq('id', gigId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (gigError || !gig) {
      if (gigError) console.error('[calendar] getEventDetails gig error:', gigError.message);
      return null;
    }

    const status = gigStatusToEventStatus((gig as { status?: string | null }).status ?? null);
    const start = startsAtFromEventDate((gig as { event_date?: string | null }).event_date ?? null);
    const end = endsAtFromEventDate((gig as { event_date?: string | null }).event_date ?? null);

    return {
      id: eventId,
      title: (gig as { title?: string | null }).title ?? 'Untitled Production',
      start,
      end,
      status,
      projectTitle: null,
      projectId: null,
      location: (gig as { location?: string | null }).location ?? null,
      color: getEventColor(status),
      workspaceId: (gig as { workspace_id?: string }).workspace_id ?? '',
      gigId: gig.id,
      crewCount: 0,
      guestCount: 0,
      leadContact: (gig as { client_name?: string | null }).client_name ?? null,
      timelineStatus: null,
    };
  }

  const { data: row, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      starts_at,
      ends_at,
      status,
      location_name,
      workspace_id,
      gig_id,
      projects(id, name)
    `)
    .eq('id', eventId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error('[calendar] getEventDetails error:', error.message);
    return null;
  }

  const r = row as unknown as EventRow & { crew_count?: number; guest_count?: number; lead_contact?: string | null };
  const status = parseEventStatus(r.status);
  const project = projectFromRow(r as EventRow);

  const dto: EventDetailDTO = {
    id: String(r.id),
    title: r.title ?? '',
    start: r.starts_at ?? new Date().toISOString(),
    end: r.ends_at ?? r.starts_at ?? new Date().toISOString(),
    status,
    projectTitle: project.name ?? null,
    projectId: project.id ?? null,
    location: r.location_name ?? null,
    color: getEventColor(status),
    workspaceId: r.workspace_id ?? '',
    gigId: r.gig_id ?? null,
    crewCount: typeof r.crew_count === 'number' ? r.crew_count : 0,
    guestCount: typeof r.guest_count === 'number' ? r.guest_count : 0,
    leadContact: r.lead_contact ?? null,
    timelineStatus: null,
  };

  return dto;
}
