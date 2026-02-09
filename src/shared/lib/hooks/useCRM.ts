import { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';

/** Unified event row for CRM (lifecycle = lead/tentative/confirmed). */
export type Gig = {
  id: string;
  title: string;
  status: string;
  event_date: string;
  event_location: string;
  budget_estimated?: number;
  client: { name: string; type: string } | null;
};

export function useGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          id,
          title,
          lifecycle_status,
          starts_at,
          location_name,
          crm_estimated_value,
          organizations:client_id(name, type)
        `
        )
        .in('lifecycle_status', ['lead', 'tentative', 'confirmed', 'production', 'live'])
        .order('starts_at', { ascending: true });

      if (error) throw error;
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      setGigs(
        rows.map((e) => ({
          id: e.id as string,
          title: (e.title as string) ?? '',
          status: (e.lifecycle_status as string) ?? '',
          event_date: e.starts_at ? String((e.starts_at as string).slice(0, 10)) : '',
          event_location: (e.location_name as string) ?? '',
          budget_estimated: (e.crm_estimated_value as number) ?? undefined,
          client: (e.organizations as { name?: string; type?: string } | null) ?? null,
        }))
      );
    } catch (error) {
      console.error('Error fetching events (CRM):', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();

    const channel = supabase
      .channel('crm_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchGigs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { gigs, loading, refresh: fetchGigs };
}
