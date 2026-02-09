/**
 * Event entity – fetch gig for Command Center when no event is linked.
 * Server-only; workspace-scoped via RLS.
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
 * Returns gig by id for Command Center display when no event exists for this gig.
 * Relies on RLS to scope by workspace (same as CRM page); no explicit workspace filter.
 */
export async function getGigCommand(gigId: string): Promise<GigCommandDTO | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: row, error } = await supabase
    .from('gigs')
    .select('id, title, status, event_date, location, client_name, workspace_id')
    .eq('id', gigId)
    .maybeSingle();

  if (error || !row) return null;

  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    title: (r.title as string) ?? null,
    status: (r.status as string) ?? null,
    event_date: (r.event_date as string) ?? null,
    location: (r.location as string) ?? null,
    client_name: (r.client_name as string) ?? null,
    workspace_id: r.workspace_id as string,
  };
}
