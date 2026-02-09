'use server';

import { createClient } from '@/shared/api/supabase/server';

export type SearchResultItem =
  | { type: 'event'; id: string; title: string; subtitle?: string }
  | { type: 'invoice'; id: string; invoice_number: string | null; event_id: string; subtitle?: string };

export type SearchGlobalResult = {
  events: Array<{ id: string; title: string; client_name: string | null }>;
  invoices: Array<{
    id: string;
    invoice_number: string | null;
    event_id: string;
    status: string;
  }>;
};

export async function searchGlobal(
  query: string
): Promise<SearchGlobalResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { events: [], invoices: [] };
  }

  const supabase = await createClient();
  const pattern = `%${trimmed}%`;

  const [eventsRes, invoicesRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, organizations:client_id(name)')
      .or(`title.ilike.${pattern}`)
      .in('lifecycle_status', ['lead', 'tentative', 'confirmed', 'production', 'live'])
      .order('starts_at', { ascending: true })
      .limit(8),
    supabase
      .from('invoices')
      .select('id, invoice_number, event_id, status')
      .ilike('invoice_number', pattern)
      .limit(6),
  ]);

  const events = (eventsRes.data ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    title: (e.title as string) ?? '',
    client_name: (e.organizations as { name?: string } | null)?.name ?? null,
  }));

  return {
    events,
    invoices: (invoicesRes.data ?? []) as SearchGlobalResult['invoices'],
  };
}
