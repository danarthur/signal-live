'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/shared/ui/providers/WorkspaceProvider';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { Command } from 'cmdk';
import { Building2, User, MapPin, Plus } from 'lucide-react';
import { createGig } from '../actions/gig-actions';
import { searchOmni, getVenueSuggestions, type OmniResult, type VenueSuggestion } from '../actions/lookup';
import { CeramicDatePicker } from './ceramic-date-picker';
import { cn } from '@/shared/lib/utils';

function normalizeTime(v: string): string | null {
  if (!v) return null;
  const parts = v.split(':');
  const h = (parts[0] ?? '00').padStart(2, '0');
  const m = (parts[1] ?? '00').padStart(2, '0').slice(0, 2);
  if (parseInt(h, 10) <= 23 && parseInt(m, 10) <= 59) return `${h}:${m}`;
  return null;
}

function TimeInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  eventDate?: string;
  startTime?: string;
  isStart?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d:]/g, '');
    const parts = v.split(':');
    if (parts.length > 2) return;
    const h = (parts[0] ?? '').slice(0, 2);
    const m = (parts[1] ?? '').slice(0, 2);
    if (!h) onChange('');
    else if (v.endsWith(':')) onChange(`${h}:`);
    else if (!m) onChange(h);
    else onChange(`${h}:${m}`);
  };
  const handleBlur = () => {
    if (!value) return;
    const n = normalizeTime(value);
    if (n) onChange(n);
  };
  return (
    <div className="flex flex-col gap-0.5">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="9:00 or 14:30"
        maxLength={5}
        className="w-full min-w-0 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      <span className="text-[10px] text-ink-muted">24h (14:30 = 2:30 PM)</span>
    </div>
  );
}

type OptimisticUpdate =
  | { type: 'add'; gig: { id: string; title: string | null; status: string | null; event_date: string | null; location: string | null; client_name: string | null } }
  | { type: 'revert'; tempId: string };

interface CreateGigModalProps {
  open: boolean;
  onClose: () => void;
  addOptimisticGig: (update: OptimisticUpdate) => void;
}

export function CreateGigModal({ open, onClose, addOptimisticGig }: CreateGigModalProps) {
  const { hasWorkspace } = useWorkspace();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventType, setEventType] = useState<'single' | 'recurring' | 'multi_day'>('single');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Client OmniBox state
  const [clientOpen, setClientOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState<OmniResult[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    type: 'org' | 'contact';
    id: string;
    name: string;
    organizationId?: string | null;
  } | null>(null);

  // VenueBox state
  const [venueOpen, setVenueOpen] = useState(false);
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<VenueSuggestion[]>([]);
  const [venueLoading, setVenueLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<{ id: string; name: string; address?: string | null } | null>(null);

  const orgId = selectedClient?.type === 'org' ? selectedClient.id : selectedClient?.organizationId ?? null;

  const runClientSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setClientResults([]);
      return;
    }
    setClientLoading(true);
    try {
      const res = await searchOmni(q);
      setClientResults(res);
    } catch {
      setClientResults([]);
    } finally {
      setClientLoading(false);
    }
  }, []);

  const runVenueSearch = useCallback(async (q: string) => {
    setVenueLoading(true);
    try {
      const res = await getVenueSuggestions(q, orgId);
      setVenueResults(res);
    } catch {
      setVenueResults([]);
    } finally {
      setVenueLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (clientQuery.length < 2) {
      setClientResults([]);
      return;
    }
    const t = setTimeout(() => runClientSearch(clientQuery), 150);
    return () => clearTimeout(t);
  }, [clientQuery, runClientSearch]);

  useEffect(() => {
    if (venueQuery.length < 1) {
      setVenueResults([]);
      return;
    }
    const t = setTimeout(() => runVenueSearch(venueQuery), 150);
    return () => clearTimeout(t);
  }, [venueQuery, orgId, runVenueSearch]);

  const clientName = selectedClient?.name ?? '';
  const locationStr = selectedVenue
    ? [selectedVenue.name, selectedVenue.address].filter(Boolean).join(', ')
    : venueQuery || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasWorkspace) {
      setError('No workspace selected. Complete onboarding first.');
      return;
    }

    const tempId = crypto.randomUUID();
    const optimisticGig = {
      id: tempId,
      title: title.trim() || null,
      status: 'inquiry' as const,
      event_date: eventDate || null,
      location: locationStr.trim() || null,
      client_name: clientName.trim() || null,
    };

    addOptimisticGig({ type: 'add', gig: optimisticGig });

    const normStart = normalizeTime(startTime);
    const normEnd = normalizeTime(endTime);
    const effectiveEndDate = eventType === 'multi_day' && endDate ? endDate : eventDate;
    const eventStartAt = eventDate && normStart ? `${eventDate}T${normStart}:00` : null;
    const eventEndAt = effectiveEndDate && normEnd ? `${effectiveEndDate}T${normEnd}:00` : null;

    startTransition(async () => {
      const result = await createGig({
        title: title.trim(),
        eventDate: eventStartAt ?? (eventDate || null),
        status: 'inquiry',
        location: locationStr.trim() || null,
        clientName: clientName.trim() || null,
        venueId: (selectedVenue?.id && selectedVenue.id.length > 0) ? selectedVenue.id : null,
        organizationId: selectedClient?.type === 'org' ? selectedClient.id : selectedClient?.organizationId ?? null,
        mainContactId: selectedClient?.type === 'contact' ? selectedClient.id : null,
        eventStartAt: eventStartAt ?? null,
        eventEndAt: eventEndAt ?? null,
        isRecurring: eventType === 'recurring',
        occurrenceType: eventType,
      });

      if (result.success) {
        onClose();
        setTitle('');
        setEventDate('');
        setEndDate('');
        setStartTime('');
        setEndTime('');
        setSelectedClient(null);
        setSelectedVenue(null);
        setClientQuery('');
        setVenueQuery('');
      } else {
        addOptimisticGig({ type: 'revert', tempId });
        setError(result.error);
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      <div
        className="relative z-10 my-auto w-full max-w-2xl min-w-0 max-h-[min(90vh,40rem)]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
      <LiquidPanel className="flex flex-col overflow-hidden p-0 h-full">
        <div className="p-6 pb-4 shrink-0 min-w-0 overflow-hidden">
          <h2 className="text-lg font-medium text-ink mb-1 truncate">New Production</h2>
          <p className="text-sm text-ink-muted break-words">
            Creating a gig will add it to the calendar, Production Queue, and Active Productions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 min-h-0 min-w-0">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 gap-4 auto-rows-auto pb-4 min-w-0">
            {/* Title + Client */}
            <div className="space-y-4 min-w-0">
              <div>
                <label htmlFor="create-gig-title" className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  id="create-gig-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Gala 2026"
                  className="w-full min-w-0 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                  Client
                </label>
                <Command
                  className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] overflow-hidden min-w-0"
                  loop
                >
                  <Command.Input
                    value={selectedClient ? selectedClient.name : clientQuery}
                    onValueChange={(v) => {
                      setSelectedClient(null);
                      setClientQuery(v);
                    }}
                    onFocus={() => setClientOpen(true)}
                    onBlur={() => setTimeout(() => setClientOpen(false), 180)}
                    placeholder="Search org or contact…"
                    className="w-full min-w-0 border-0 bg-transparent px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-0 truncate"
                  />
                  {(clientOpen && clientResults.length > 0) && (
                  <Command.List className="h-fit max-h-[200px] overflow-y-auto overflow-x-hidden border-t border-[var(--glass-border)]">
                    <>
                        {clientResults.map((r) => (
                          <Command.Item
                            key={`${r.type}-${r.id}`}
                            value={`${r.type}-${r.id}-${r.type === 'org' ? r.name : `${r.first_name} ${r.last_name}`}`}
                            onSelect={() => {
                              if (r.type === 'org') {
                                setSelectedClient({ type: 'org', id: r.id, name: r.name });
                              } else {
                                setSelectedClient({
                                  type: 'contact',
                                  id: r.id,
                                  name: `${r.first_name} ${r.last_name}`,
                                  organizationId: r.organization_id,
                                });
                              }
                              setClientQuery('');
                              setClientResults([]);
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-[var(--glass-bg-hover)] data-[selected=true]:bg-[var(--glass-bg-hover)] min-w-0"
                          >
                            {r.type === 'org' ? (
                              <Building2 size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                            ) : (
                              <User size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                            )}
                            <span className="text-ink truncate min-w-0">
                              {r.type === 'org' ? r.name : `${r.first_name} ${r.last_name}`}
                            </span>
                            {r.type === 'contact' && r.email && (
                              <span className="text-ink-muted text-xs truncate shrink-0 max-w-[120px]">{r.email}</span>
                            )}
                          </Command.Item>
                        ))}
                    </>
                  </Command.List>
                  )}
                </Command>
              </div>
            </div>

            {/* Date & Event type - side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div>
                <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <CeramicDatePicker
                  value={eventDate}
                  onChange={setEventDate}
                  placeholder="Select date"
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
                  Event type
                </span>
                <div className="flex flex-wrap gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="eventType"
                      checked={eventType === 'single'}
                      onChange={() => setEventType('single')}
                      className="h-4 w-4 border-[var(--glass-border)] text-walnut focus:ring-[var(--ring)]"
                    />
                    <span className="text-sm text-ink">Single event</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="eventType"
                      checked={eventType === 'recurring'}
                      onChange={() => setEventType('recurring')}
                      className="h-4 w-4 border-[var(--glass-border)] text-walnut focus:ring-[var(--ring)]"
                    />
                    <span className="text-sm text-ink">Recurring</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="eventType"
                      checked={eventType === 'multi_day'}
                      onChange={() => setEventType('multi_day')}
                      className="h-4 w-4 border-[var(--glass-border)] text-walnut focus:ring-[var(--ring)]"
                    />
                    <span className="text-sm text-ink">Multi-day</span>
                  </label>
                </div>
              </div>
            </div>

            {eventType === 'multi_day' && (
              <div>
                <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                  End date
                </label>
                <CeramicDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-gig-start" className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                    Start time
                  </label>
                  <TimeInput
                    id="create-gig-start"
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
                <div>
                  <label htmlFor="create-gig-end" className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                    End time
                  </label>
                  <TimeInput
                    id="create-gig-end"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
              </div>

            {/* Venue Selector - plain input + dropdown only when results exist */}
            <div className="min-w-0 relative">
              <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                Venue
              </label>
              <input
                type="text"
                value={selectedVenue ? selectedVenue.name : venueQuery}
                onChange={(e) => {
                  setSelectedVenue(null);
                  setVenueQuery(e.target.value);
                }}
                onFocus={() => setVenueOpen(true)}
                onBlur={() => setTimeout(() => setVenueOpen(false), 200)}
                placeholder="Search venue or type to create…"
                className="w-full min-w-0 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] truncate"
              />
              {/* Only render dropdown when user has typed AND we have results */}
              {venueOpen && venueQuery.length >= 1 && venueResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[180px] overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--glass-shadow)]">
                  {venueResults.map((r, i) =>
                    r.type === 'venue' ? (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedVenue({
                            id: r.id,
                            name: r.name,
                            address: r.address ?? undefined,
                          });
                          setVenueQuery('');
                          setVenueResults([]);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[var(--glass-bg-hover)] min-w-0"
                      >
                        <MapPin size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                        <span className="text-ink truncate min-w-0">{r.name}</span>
                        {(r.address || r.city) && (
                          <span className="text-ink-muted text-xs truncate shrink-0 max-w-[140px]">
                            {[r.address, r.city, r.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        key={`create-${i}`}
                        type="button"
                        onClick={() => {
                          setSelectedVenue({ id: '', name: r.query, address: null });
                          setVenueQuery(r.query);
                          setVenueResults([]);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-accent-sage hover:bg-[var(--glass-bg-hover)] min-w-0"
                      >
                        <Plus size={16} className="shrink-0" strokeWidth={1.5} />
                        <span className="truncate min-w-0">Create venue &quot;{r.query}&quot;</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          </div>

          <div className="flex flex-col gap-2 p-6 pt-4 border-t border-[var(--glass-border)] shrink-0 bg-[var(--glass-bg)]/50 min-w-0 overflow-hidden">
            {error && <p className="text-sm text-rose-500 break-words">{error}</p>}
            <div className="flex gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--glass-border)] py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-[var(--glass-bg-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-walnut py-2.5 text-sm font-medium text-canvas transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Creating…' : 'Create Production'}
            </button>
            </div>
          </div>
        </form>
      </LiquidPanel>
      </div>
    </div>
  );
}
