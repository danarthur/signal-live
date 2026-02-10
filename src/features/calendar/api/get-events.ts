/**
 * Calendar feature - Server Action: fetch events in range
 * Fetches from unified events table. Overlap: (starts_at <= rangeEnd) AND (ends_at >= rangeStart).
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

// =============================================================================
// Raw row from DB (events + joined projects.name)
// =============================================================================

/** Events row (unified table). */
interface EventsRow {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: string | null;
  location_name: string | null;
  workspace_id: string;
  projects?: { name: string } | { name: string }[] | null;
  project?: { name: string } | null;
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
    gigId: null,
    clientName: null,
  };
}

// =============================================================================
// Server Action
// =============================================================================

/**
 * Fetches calendar events overlapping the given range.
 * Fetches calendar events from public.events (unified table).
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

    // Fetch events from unified events table
    const { data: eventRowsRaw, error } = await supabase
      .from('events')
      .select('id, title, starts_at, ends_at, status, location_name, workspace_id')
      .eq('workspace_id', workspaceId)
      .lte('starts_at', end)
      .gte('ends_at', start)
      .order('starts_at', { ascending: true })
      .limit(5000);

    if (error) {
      console.error('[calendar] getCalendarEvents events error:', error.message);
      return [];
    }

    const result: CalendarEvent[] = (eventRowsRaw ?? []).map((r) => {
      const row = { ...r, projects: null, project: null } as unknown as EventsRow;
      return toCalendarEvent(row);
    });

    result.sort((a, b) => a.start.localeCompare(b.start));
    return result;
  } catch (err) {
    console.error('[calendar] getCalendarEvents unexpected error:', err);
    return [];
  }
}
