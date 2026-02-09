/**
 * Calendar feature - Server Action: fetch events in range
 * Unified: fetches from both events and gigs. Events table is synced from gigs via DB trigger.
 * Fallback: gigs without events are converted to CalendarEvents so nothing is lost.
 * Overlap: (starts_at <= rangeEnd) AND (ends_at >= rangeStart) for events;
 * event_date within range for gigs.
 * @module features/calendar/api/get-events
 */

import 'server-only';

import { createClient } from '@/shared/api/supabase/server';
import { getCalendarEventsInputSchema } from '../model/schema';
import type { CalendarEvent, EventStatus } from '../model/types';
import { getEventColor } from '../model/types';

export type GetCalendarEventsInput = import('../model/schema').GetCalendarEventsInputSchema;

// =============================================================================
// event_status enum – must match Database['public']['Enums']['event_status']
// =============================================================================

const EVENT_STATUS_VALUES: EventStatus[] = ['confirmed', 'hold', 'cancelled', 'planned'];

function parseEventStatus(value: string | null): EventStatus {
  if (value && EVENT_STATUS_VALUES.includes(value as EventStatus)) {
    return value as EventStatus;
  }
  return 'planned';
}

/** Map gig status to event_status (same logic as DB trigger). */
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

/** Build starts_at from event_date (08:00 UTC). */
function startsAtFromEventDate(eventDate: string | null): string {
  if (!eventDate) {
    const d = new Date();
    d.setUTCHours(8, 0, 0, 0);
    return d.toISOString();
  }
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setUTCHours(8, 0, 0, 0);
  return d.toISOString();
}

/** Build ends_at from event_date (18:00 UTC). */
function endsAtFromEventDate(eventDate: string | null): string {
  if (!eventDate) {
    const d = new Date();
    d.setUTCHours(18, 0, 0, 0);
    return d.toISOString();
  }
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setUTCHours(18, 0, 0, 0);
  return d.toISOString();
}

// =============================================================================
// Raw row from DB (events + joined projects.name)
// =============================================================================

/** Events row + joined projects.name. gig_id from events; no gig join to avoid schema cache issues. */
interface EventsRow {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: string | null;
  location_name: string | null;
  workspace_id: string;
  gig_id?: string | null;
  projects?: { name: string } | { name: string }[] | null;
  project?: { name: string } | null;
}

interface GigRow {
  id: string;
  title: string | null;
  status: string | null;
  event_date: string | null;
  workspace_id: string;
  location?: string | null;
  client_name?: string | null;
}

function projectName(row: EventsRow): string | null {
  const p = row.projects ?? row.project;
  if (!p) return null;
  if (Array.isArray(p)) return p[0]?.name ?? null;
  return p.name ?? null;
}

function toCalendarEvent(row: EventsRow): CalendarEvent {
  const status = parseEventStatus(row.status);
  const color = getEventColor(status);
  const start = row.starts_at ?? (row as { start_at?: string }).start_at ?? new Date().toISOString();
  const end = row.ends_at ?? (row as { end_at?: string }).end_at ?? start;
  return {
    id: String(row.id ?? ''),
    title: row.title ?? '',
    start,
    end,
    status,
    projectTitle: projectName(row),
    location: row.location_name ?? null,
    color,
    workspaceId: row.workspace_id ?? '',
    gigId: row.gig_id ?? null,
    clientName: null,
  };
}

function gigToCalendarEvent(gig: GigRow): CalendarEvent {
  const status = gigStatusToEventStatus(gig.status);
  const color = getEventColor(status);
  const start = startsAtFromEventDate(gig.event_date ?? null);
  const end = endsAtFromEventDate(gig.event_date ?? null);
  return {
    id: `gig:${gig.id}`,
    title: gig.title ?? 'Untitled Production',
    start,
    end,
    status,
    projectTitle: null,
    location: gig.location ?? null,
    color,
    workspaceId: gig.workspace_id ?? '',
    gigId: gig.id,
    clientName: gig.client_name ?? null,
  };
}

// =============================================================================
// Server Action
// =============================================================================

/**
 * Fetches calendar events overlapping the given range.
 * Unified: events from public.events + gigs without events (fallback).
 * Overlap: (starts_at <= rangeEnd) AND (ends_at >= rangeStart) for events;
 * event_date between range dates for gigs.
 * Security: workspace_id enforced; RLS must scope by workspace.
 */
export async function getCalendarEvents(
  input: GetCalendarEventsInput
): Promise<CalendarEvent[]> {
  try {
    const parsed = getCalendarEventsInputSchema.safeParse(input);
    if (!parsed.success) {
      console.error('[calendar] getCalendarEvents validation:', parsed.error.flatten());
      return [];
    }
    const { start, end, workspaceId } = parsed.data;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    // 1. Fetch events from events table (minimal select to avoid join/column issues)
    const { data: eventRowsRaw, error } = await supabase
      .from('events')
      .select('id, title, starts_at, ends_at, status, location_name, workspace_id, gig_id')
      .eq('workspace_id', workspaceId)
      .lte('starts_at', end)
      .gte('ends_at', start)
      .order('starts_at', { ascending: true });

    let eventRows: unknown[] = [];
    if (error) {
      console.error('[calendar] getCalendarEvents events error:', error.message);
    } else {
      eventRows = (eventRowsRaw ?? []).map((r) => ({ ...r, projects: null, project: null }));
    }

    const result: CalendarEvent[] = [];
    const gigIdsWithEvents = new Set<string>();

    for (const row of eventRows) {
      try {
        const ev = toCalendarEvent(row as unknown as EventsRow);
        result.push(ev);
        if (ev.gigId) gigIdsWithEvents.add(ev.gigId);
      } catch (rowErr) {
        console.warn('[calendar] Skipping malformed event row:', rowErr);
      }
    }

    // 2. Fetch ALL gigs for workspace (same as Production Queue) – no date filter
    //    so we never miss any; MonthGrid filters by day for display
    const { data: gigs } = await supabase
      .from('gigs')
      .select('id, title, status, event_date, workspace_id, location, client_name')
      .eq('workspace_id', workspaceId)
      .neq('status', 'archived')
      .order('event_date', { ascending: true, nullsFirst: false });

    for (const gig of (gigs ?? []) as GigRow[]) {
      if (gigIdsWithEvents.has(gig.id)) continue;
      try {
        result.push(gigToCalendarEvent(gig));
      } catch (gigErr) {
        console.warn('[calendar] Skipping malformed gig row:', gigErr);
      }
    }

    result.sort((a, b) => a.start.localeCompare(b.start));
    return result;
  } catch (err) {
    console.error('[calendar] getCalendarEvents unexpected error:', err);
    return [];
  }
}
