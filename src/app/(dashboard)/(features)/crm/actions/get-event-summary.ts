'use server';

import { getEventSummary as getEventSummaryEntity } from '@/entities/event/api/get-event-summary';

/** Event summary for Prism Plan/Ledger lenses. Same shape as entity EventSummary. */
export type EventSummaryForPrism = {
  title: string | null;
  client_name: string | null;
  starts_at: string;
  location_name: string | null;
  location_address: string | null;
};

export async function getEventSummaryForPrism(
  eventId: string
): Promise<EventSummaryForPrism | null> {
  return getEventSummaryEntity(eventId);
}
