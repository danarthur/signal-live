/**
 * Event entity – resolve event id from gig id for Command Center redirect.
 * Server-only; workspace-scoped via RLS.
 */

import 'server-only';

import { createClient } from '@/shared/api/supabase/server';

/**
 * Returns the first event id linked to this gig (events.gig_id = gigId).
 * Used to redirect /events/g/[gigId] → /events/[eventId].
 * Relies on RLS to scope by workspace (no explicit workspace filter).
 */
export async function getEventIdByGigId(gigId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: row, error } = await supabase
    .from('events')
    .select('id')
    .eq('gig_id', gigId)
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !row) return null;
  return (row as { id: string }).id;
}
