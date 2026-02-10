/**
 * Event entity – fetch event as GigCommandDTO shape (legacy compat).
 * Prefer getEventCommand() for new code. Fetches from unified events table.
 */

import 'server-only';

import { createClient } from '@/shared/api/supabase/server';

export interface GigCommandDTO {
  id: string;
  title: string | null;
  status: string | null;
  event_date: string | null;
  location: string | null;
  client_name: string | null;
  workspace_id: string;
}

/**
 * Returns event by id in GigCommandDTO shape for legacy callers.
 * Fetches from unified events table; maps lifecycle_status and starts_at.
 */
export async function getGigCommand(eventId: string): Promise<GigCommandDTO | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: row, error } = await supabase
    .from('events')
    .select('id, title, lifecycle_status, starts_at, location_name, workspace_id, organizations:client_id(name)')
    .eq('id', eventId)
    .maybeSingle();

  if (error || !row) return null;

  const r = row as Record<string, unknown>;
  const eventDate = r.starts_at ? String((r.starts_at as string).slice(0, 10)) : null;
  const clientName = (r.organizations as { name?: string } | null)?.name ?? null;

  return {
    id: r.id as string,
    title: (r.title as string) ?? null,
    status: (r.lifecycle_status as string) ?? null,
    event_date: eventDate,
    location: (r.location_name as string) ?? null,
    client_name: clientName,
    workspace_id: r.workspace_id as string,
  };
}
