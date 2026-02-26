'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, CheckCircle2, Circle, Clock, Truck } from 'lucide-react';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { SIGNAL_PHYSICS } from '@/shared/lib/motion-constants';
import type { EventSummaryForPrism } from '../actions/get-event-summary';

type DispatchSummaryProps = {
  eventId: string;
  event: EventSummaryForPrism;
  /** Placeholder counts; replace with real crew/assignments when available */
  crewConfirmed?: number;
  crewTotal?: number;
  /** Placeholder: "Not Loaded" | "In Transit" */
  truckStatus?: 'not_loaded' | 'in_transit';
};

const FLIGHT_ITEMS = [
  { id: 'venue', label: 'Venue access confirmed', done: false },
  { id: 'truck', label: 'Truck loaded', done: false },
  { id: 'crew', label: 'Crew confirmed', done: false },
] as const;

/** Call time = event start minus 2 hours (Phase 3 spec). */
function getCallTime(startsAt: string | null): string {
  if (!startsAt) return 'TBD';
  const d = new Date(startsAt);
  d.setHours(d.getHours() - 2);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Google Maps search URL for address. */
function googleMapsUrl(address: string): string {
  if (!address || address === '—') return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function DispatchSummary({
  eventId,
  event,
  crewConfirmed = 4,
  crewTotal = 12,
  truckStatus = 'not_loaded',
}: DispatchSummaryProps) {
  const displayDate = event.starts_at
    ? new Date(event.starts_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'TBD';
  const location = event.location_name ?? event.location_address ?? '—';
  const locationAddress = event.location_address ?? event.location_name ?? '';
  const crewLabel = crewTotal > 0 ? `${crewConfirmed}/${crewTotal} Assigned` : '—';
  const callTime = getCallTime(event.starts_at ?? null);
  const truckLabel = truckStatus === 'in_transit' ? 'In Transit' : 'Not Loaded';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SIGNAL_PHYSICS}
      className="flex flex-col gap-6"
    >
      {/* Phase 3: Vitals — Location (Map Pin + Google Maps), Call Time (start - 2h), Truck Status, Crew Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiquidPanel className="p-4 rounded-[28px] flex items-center gap-3">
          <Calendar size={18} className="shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Event date</p>
            <p className="text-ceramic font-medium tracking-tight truncate">{displayDate}</p>
          </div>
        </LiquidPanel>
        <LiquidPanel className="p-4 rounded-[28px] flex items-center gap-3">
          <MapPin size={18} className="shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Location</p>
            <a
              href={googleMapsUrl(locationAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ceramic font-medium tracking-tight truncate block hover:text-[var(--color-neon-blue)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
            >
              {location}
            </a>
          </div>
        </LiquidPanel>
        <LiquidPanel className="p-4 rounded-[28px] flex items-center gap-3">
          <Clock size={18} className="shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Call time</p>
            <p className="text-ceramic font-medium tracking-tight truncate">{callTime}</p>
          </div>
        </LiquidPanel>
        <LiquidPanel className="p-4 rounded-[28px] flex items-center gap-3">
          <Truck size={18} className="shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Truck status</p>
            <p className="text-ceramic font-medium tracking-tight truncate">{truckLabel}</p>
          </div>
        </LiquidPanel>
        <LiquidPanel className="p-4 rounded-[28px] flex items-center gap-3 sm:col-span-2 lg:col-span-1">
          <Users size={18} className="shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Crew count</p>
            <p className="text-ceramic font-medium tracking-tight">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[var(--color-neon-blue)]/10 text-[var(--color-neon-blue)] text-xs font-mono">
                {crewLabel}
              </span>
            </p>
          </div>
        </LiquidPanel>
      </div>

      {/* Flight check list */}
      <LiquidPanel className="p-6 rounded-[28px]">
        <h2 className="text-xs font-medium uppercase tracking-widest text-ink-muted mb-4">
          Flight check
        </h2>
        <ul className="space-y-3">
          {FLIGHT_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 text-sm text-ink-muted"
            >
              {item.done ? (
                <CheckCircle2 size={18} className="shrink-0 text-[var(--color-signal-success)]" aria-hidden />
              ) : (
                <Circle size={18} className="shrink-0 text-ink-muted/60" aria-hidden />
              )}
              <span>{item.label}</span>
            </li>
          ))}
          {crewTotal > 0 && (
            <li className="flex items-center gap-3 text-sm text-ink-muted">
              {crewConfirmed >= crewTotal ? (
                <CheckCircle2 size={18} className="shrink-0 text-[var(--color-signal-success)]" aria-hidden />
              ) : (
                <Circle size={18} className="shrink-0 text-ink-muted/60" aria-hidden />
              )}
              <span>Crew confirmed ({crewLabel})</span>
            </li>
          )}
        </ul>
      </LiquidPanel>

      {/* Phase 3: The Wormhole — Launch Event Studio (opens /events/g/[id]) */}
      <Link
        href={`/events/g/${eventId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center min-h-[140px] rounded-[28px] border-2 border-dashed border-[var(--glass-border)] liquid-card p-8 text-center transition-all hover:border-[var(--color-neon-blue)]/40 hover:bg-[var(--color-neon-blue)]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-obsidian)]"
      >
        <p className="text-ceramic font-medium tracking-tight mb-1">Launch Event Studio</p>
        <p className="text-sm text-ink-muted">Run of show, crewing, and full command center</p>
      </Link>
    </motion.div>
  );
}
