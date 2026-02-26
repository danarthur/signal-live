/**
 * Event entity – lightweight summary for Run of Show header.
 * Reads from ops.events; workspace-scoped via project join.
 */

import 'server-only';

import { createClient } from '@/shared/api/supabase/server';

export type EventSummary = {
  title: string | null;
  client_name: string | null;
  starts_at: string;
  location_name: string | null;
  location_address: string | null;
};

export async function getEventSummary(eventId: string): Promise<EventSummary | null> {
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
    .select('name, start_at, project:projects!inner(workspace_id)')
    .eq('id', eventId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error('[event] getEventSummary:', error.message);
    return null;
  }

  const r = row as Record<string, unknown>;
  return {
    title: (r.name as string) ?? null,
    client_name: null,
    starts_at: (r.start_at as string) ?? '',
    location_name: null,
    location_address: null,
  };
}
