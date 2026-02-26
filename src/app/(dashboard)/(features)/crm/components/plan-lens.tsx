'use client';

import { DispatchSummary } from './dispatch-summary';
import type { EventSummaryForPrism } from '../actions/get-event-summary';

type PlanLensProps = {
  eventId: string;
  event: EventSummaryForPrism;
};

export function PlanLens({ eventId, event }: PlanLensProps) {
  return <DispatchSummary eventId={eventId} event={event} />;
}
