import { NextResponse } from 'next/server';
import { getSession } from '@/shared/lib/auth/session';
import { getSystemClient } from '@/shared/api/supabase/system';
import type { Database } from '@/types/supabase';

/** EventSnippet shape for EventStatus / Production Schedule */
interface EventSnippet {
  id: string;
  title: string;
  status: 'planned' | 'booked' | 'confirmed';
  starts_at: string;
  location_name?: string;
}

type EventsRow = Database['public']['Tables']['events']['Row'];

export async function GET() {
  try {
    const session = await getSession();
    const workspaceId = session.workspace.id;
    const supabase = getSystemClient();

    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id, title, status, starts_at, location_name')
      .eq('workspace_id', workspaceId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(3);

    if (eventsError) {
      console.error('❌ Events API:', eventsError.message);
      return NextResponse.json([]);
    }

    const rows = (eventsData ?? []) as EventsRow[];
    const snippets: EventSnippet[] = rows.map((e) => ({
      id: e.id,
      title: e.title ?? 'Untitled',
      status: (e.status === 'confirmed' ? 'confirmed' : e.status === 'hold' ? 'booked' : 'planned') as EventSnippet['status'],
      starts_at: e.starts_at,
      location_name: e.location_name ?? undefined,
    }));
    return NextResponse.json(snippets);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('❌ Events API Fatal:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
