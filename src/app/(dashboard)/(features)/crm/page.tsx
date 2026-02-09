import { createClient } from '@/shared/api/supabase/server';
import { CRMProductionQueue } from './components/crm-production-queue';

/** CRM queue item: unified event row mapped for Production Queue UI. */
export type CRMQueueItem = {
  id: string;
  title: string | null;
  status: string | null;
  event_date: string | null;
  location: string | null;
  client_name: string | null;
};

export default async function CRMPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, title, lifecycle_status, starts_at, location_name, organizations:client_id(name)')
    .in('lifecycle_status', ['lead', 'tentative', 'confirmed', 'production', 'live'])
    .neq('lifecycle_status', 'archived')
    .order('starts_at', { ascending: true });

  const gigs: CRMQueueItem[] = (events ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    title: (e.title as string) ?? null,
    status: (e.lifecycle_status as string) ?? null,
    event_date: e.starts_at ? String((e.starts_at as string).slice(0, 10)) : null,
    location: (e.location_name as string) ?? null,
    client_name: (e.organizations as { name?: string } | null)?.name ?? null,
  }));

  return <CRMProductionQueue gigs={gigs} />;
}
