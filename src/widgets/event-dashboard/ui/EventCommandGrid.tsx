'use client';

import React from 'react';
import Link from 'next/link';
import {
  InlineEditText,
  InlineEditNumber,
  InlineEditTextarea,
  StatusPill,
  DateRangeDisplay,
  TeamPile,
  updateEventDetails,
} from '@/features/event-dashboard';
import type { EventCommandDTO } from '@/entities/event';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { DollarSign, FileText, Calendar } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EventCommandGridProps {
  event: EventCommandDTO;
}

export function EventCommandGrid({ event: initialEvent }: EventCommandGridProps) {
  const [event, setEvent] = React.useState(initialEvent);

  const onSave = React.useCallback(
    async (field: keyof EventCommandDTO, value: string | number | null) => {
      const res = await updateEventDetails(initialEvent.id, { [field]: value });
      if (res.ok) {
        setEvent((prev) => ({ ...prev, [field]: value }));
      }
      return res;
    },
    [initialEvent.id]
  );

  const onSaveStatus = React.useCallback(
    async (value: NonNullable<EventCommandDTO['lifecycle_status']>) => {
      const res = await updateEventDetails(initialEvent.id, { lifecycle_status: value });
      if (res.ok) setEvent((prev) => ({ ...prev, lifecycle_status: value }));
      return res;
    },
    [initialEvent.id]
  );

  const teamMembers = React.useMemo(() => {
    const out: { id: string; name: string | null; avatarUrl?: string | null; role?: string }[] = [];
    if (event.producer_id) {
      out.push({
        id: event.producer_id,
        name: event.producer_name ?? null,
        role: 'Producer',
      });
    }
    if (event.pm_id) {
      out.push({
        id: event.pm_id,
        name: event.pm_name ?? null,
        role: 'PM',
      });
    }
    return out;
  }, [event.producer_id, event.producer_name, event.pm_id, event.pm_name]);

  const techNotes =
    event.tech_requirements && typeof event.tech_requirements === 'object' && !Array.isArray(event.tech_requirements)
      ? (event.tech_requirements as { notes?: string; audio?: string; video?: string; lighting?: string })
      : null;
  const techSummary =
    techNotes?.notes ??
    ([techNotes?.audio, techNotes?.video, techNotes?.lighting].filter(Boolean).join(' · ') || null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 auto-rows-[minmax(180px,auto)]">
      {/* Zone Header: Title, Code, Status, optional background */}
      <div className="md:col-span-12">
        <LiquidPanel className="relative min-h-[140px] flex flex-col justify-end p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-silk/20 via-transparent to-transparent" />
          <div className="relative z-10 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-light text-ink tracking-tight truncate">
                <InlineEditText
                  value={event.title}
                  onSave={(v) => onSave('title', v)}
                  placeholder="Event title"
                  className="!p-0 !text-2xl md:!text-3xl font-light"
                />
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {event.internal_code != null && (
                  <span className="text-sm font-mono text-ink-muted">
                    <InlineEditText
                      value={event.internal_code}
                      onSave={(v) => onSave('internal_code', v)}
                      placeholder="EVT-24-001"
                      className="!p-0 !text-sm font-mono"
                    />
                  </span>
                )}
                <StatusPill value={event.lifecycle_status} onSave={onSaveStatus} />
              </div>
            </div>
          </div>
        </LiquidPanel>
      </div>

      {/* Zone Logistics: Date/Time + Venue */}
      <div className="md:col-span-6">
        <LiquidPanel className="h-full flex flex-col">
          <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-3">
            Date & time
          </h3>
          <DateRangeDisplay
            startsAt={event.starts_at}
            endsAt={event.ends_at}
            loadIn={event.dates_load_in}
            loadOut={event.dates_load_out}
          />
        </LiquidPanel>
      </div>
      <div className="md:col-span-6">
        <LiquidPanel className="h-full flex flex-col">
          <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-3">
            Venue
          </h3>
          <div className="space-y-2">
            <p className="text-ink">
              <InlineEditText
                value={event.venue_name ?? event.location_name}
                onSave={(v) => onSave('venue_name', v)}
                placeholder="Venue name"
              />
            </p>
            <p className="text-sm text-ink-muted">
              <InlineEditTextarea
                value={event.venue_address ?? event.location_address ?? ''}
                onSave={(v) => onSave('venue_address', v)}
                placeholder="Address"
              />
            </p>
            {event.venue_google_maps_id && (
              <p className="text-xs text-ink-muted font-mono truncate">
                Map ID: {event.venue_google_maps_id}
              </p>
            )}
          </div>
        </LiquidPanel>
      </div>

      {/* Zone Context: Client + Tech */}
      <div className="md:col-span-6">
        <LiquidPanel className="h-full flex flex-col">
          <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-3">
            Client
          </h3>
          <p className="text-ink">
            {event.client_name ?? (
              <InlineEditText
                value={null}
                onSave={() => Promise.resolve({ ok: true })}
                placeholder="No client linked"
              />
            )}
          </p>
        </LiquidPanel>
      </div>
      <div className="md:col-span-6">
        <LiquidPanel className="h-full flex flex-col">
          <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-3">
            Tech notes
          </h3>
          <InlineEditTextarea
            value={techSummary}
            onSave={async (v) => {
              const merged = {
                ...(typeof event.tech_requirements === 'object' && event.tech_requirements && !Array.isArray(event.tech_requirements)
                  ? (event.tech_requirements as Record<string, unknown>)
                  : {}),
                notes: v,
              };
              const res = await updateEventDetails(initialEvent.id, {
                tech_requirements: merged,
              });
              if (res.ok)
                setEvent((prev) => ({
                  ...prev,
                  tech_requirements: merged,
                }));
              return res;
            }}
            placeholder="Audio / video / lighting…"
          />
        </LiquidPanel>
      </div>

      {/* Zone People: Team pile */}
      <div className="md:col-span-6">
        <LiquidPanel className="h-full flex flex-col">
          <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-3">
            Team
          </h3>
          <TeamPile members={teamMembers} size="md" />
          <div className="mt-2 flex gap-2 text-sm text-ink-muted">
            <span>Expected: </span>
            <InlineEditNumber
              value={event.guest_count_expected}
              onSave={(v) => onSave('guest_count_expected', typeof v === 'number' ? v : null)}
            />
            <span>Actual: </span>
            <InlineEditNumber
              value={event.guest_count_actual}
              onSave={(v) => onSave('guest_count_actual', typeof v === 'number' ? v : null)}
            />
          </div>
        </LiquidPanel>
      </div>

      {/* Zone Navigation: Launchpad */}
      <div className="md:col-span-6">
        <LiquidPanel className="h-full flex flex-col liquid-panel-hover">
          <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-3">
            Launchpad
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/events/${initialEvent.id}/finance`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink bg-silk/30 hover:bg-silk/50 transition-colors"
            >
              <DollarSign className="size-4" />
              Finance
            </Link>
            <Link
              href={`/events/${initialEvent.id}/deal`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-ink hover:bg-white/5 transition-colors"
            >
              <FileText className="size-4" />
              Deal room
            </Link>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-ink hover:bg-white/5 transition-colors"
            >
              <Calendar className="size-4" />
              Calendar
            </Link>
          </div>
        </LiquidPanel>
      </div>
    </div>
  );
}
