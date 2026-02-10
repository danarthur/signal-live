'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, Users, Plus, Timer, CalendarClock } from 'lucide-react';
// Import the architectural component
import { GlassShell } from '@/shared/ui/glass-shell';
import { RunOfShow } from '@/widgets/run-of-show';
import { CueInspector } from '@/app/(dashboard)/(features)/crm/components/CueInspector';
import type { Cue } from '@/types/supabase';
import { deleteCue, duplicateCue, updateCue, createCue, fetchCues } from '@/app/(dashboard)/(features)/crm/actions/ros';

export default function RunOfShowPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  // --- STATE ---
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [cues, setCues] = useState<Cue[]>([]);

  // --- MOCK DATA ---
  const gigDetails = {
    title: 'Neon Nights Gala',
    client: 'TechFlow Systems',
    date: 'Oct 24, 2026',
    location: 'The Grand Hall, NYC',
  };

  // --- COMPUTED VALUES ---
  const selectedCue = useMemo(
    () => cues.find((cue) => cue.id === selectedCueId) ?? null,
    [cues, selectedCueId]
  );

  const computedStartTime = useMemo(() => {
    if (!selectedCueId || cues.length === 0) return null;
    const initialTime = cues[0]?.start_time ?? '18:00';
    const [hours, minutes] = initialTime.split(':').map((value) => Number(value));
    let currentMinutes = hours * 60 + minutes;

    for (const cue of cues) {
      if (cue.id === selectedCueId) {
        const normalizedMinutes = ((currentMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
        const hh = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0');
        const mm = String(normalizedMinutes % 60).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      currentMinutes += cue.duration_minutes;
    }
    return null;
  }, [cues, selectedCueId]);

  const totalDurationMinutes = useMemo(
    () => cues.reduce((total, cue) => total + cue.duration_minutes, 0),
    [cues]
  );

  const formatMinutes = (minutes: number) => {
    const safeMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hh = String(Math.floor(safeMinutes / 60)).padStart(2, '0');
    const mm = String(safeMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const showEndTime = useMemo(() => {
    if (cues.length === 0) return null;
    const start = cues[0]?.start_time ?? '18:00';
    const [hours, minutes] = start.split(':').map((value) => Number(value));
    const startMinutes = hours * 60 + minutes;
    return formatMinutes(startMinutes + totalDurationMinutes);
  }, [cues, totalDurationMinutes]);

  const totalDurationLabel = useMemo(() => {
    const hours = Math.floor(totalDurationMinutes / 60);
    const minutes = totalDurationMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }, [totalDurationMinutes]);

  // --- ACTIONS ---
  const handleSave = async (updates: Partial<Cue>) => {
    const cueId = selectedCueId;
    const id = eventId;
    if (!cueId || !id) return;
    setCues((prev) =>
      prev.map((cue) => (cue.id === cueId ? { ...cue, ...updates } : cue))
    );
    try {
      await updateCue(id, cueId, updates);
    } catch {
      // Optimistic rollback logic
    }
  };

  const handleCreateCue = async () => {
    if (!eventId) return;
    try {
      await createCue(eventId, { title: 'New Cue', duration_minutes: 10, type: 'stage' });
      const refreshed = await fetchCues(eventId);
      setCues(refreshed);
    } catch (err) {
      console.error('Failed to create cue', err);
    }
  };

  const scrollToCue = (cueId: string) => {
    requestAnimationFrame(() => {
      const element = document.querySelector(`[data-cue-id="${cueId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedCueId || !eventId) return;
    const previous = cues;
    setCues((prev) => prev.filter((cue) => cue.id !== selectedCueId));
    setSelectedCueId(null);
    try {
      await deleteCue(eventId, selectedCueId);
    } catch {
      setCues(previous);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedCueId || !eventId) return;
    const source = cues.find((cue) => cue.id === selectedCueId);
    if (!source) return;

    const tempId = `temp-${Date.now()}`;
    const tempCue: Cue = {
      ...source,
      id: tempId,
      title: `${source.title} Copy`,
      sort_order: source.sort_order + 1,
    };

    const nextCues = cues.flatMap((cue) =>
      cue.id === source.id ? [cue, tempCue] : [cue]
    );
    setCues(nextCues);
    setSelectedCueId(tempId);
    scrollToCue(tempId);

    try {
      const { cues: refreshed, newCueId } = await duplicateCue(eventId, selectedCueId);
      setCues(refreshed);
      setSelectedCueId(newCueId);
      scrollToCue(newCueId);
    } catch {
      setCues(cues);
      setSelectedCueId(source.id);
    }
  };

  if (!eventId) {
    return (
      <div className="h-full flex items-center justify-center text-ink-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-[var(--background)]">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-full hover:bg-ceramic/10 text-ink-muted hover:text-ceramic transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-light text-ceramic tracking-tight">{gigDetails.title}</h1>
            <div className="flex items-center gap-4 text-sm text-ink-muted mt-1">
              <span className="flex items-center gap-1">
                <Users size={14} /> {gigDetails.client}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {gigDetails.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {gigDetails.location}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateCue}
          className="bg-ceramic text-obsidian px-5 py-2.5 rounded-full hover:scale-105 transition-all flex items-center gap-2 liquid-levitation"
        >
          <Plus size={16} /> Add Cue
        </button>
      </header>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
        
        {/* --- LEFT COLUMN: TIMELINE (Using GlassShell) --- */}
        <section className="col-span-1 md:col-span-8 h-full min-h-0">
          
          <GlassShell
            /* HEADER SLOT: Now contains the Metadata Cluster */
            header={
              <div className="px-6 py-4 flex items-center justify-between">
                
                {/* LEFT: Title & Count */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">Timeline</span>
                  <span className="text-[10px] font-mono text-ink-muted bg-ink/5 px-2 py-1 rounded-full border border-[var(--glass-border)]">
                    {cues.length} Cues
                  </span>
                </div>

                {/* RIGHT: Duration & End Time (Clean, minimal, tabular) */}
                <div className="flex items-center gap-6">
                  
                  {/* Total Duration */}
                  <div className="flex items-center gap-2 text-ink-muted" title="Total Run Time">
                    <Timer size={14} className="text-ink-muted/50" />
                    <span className="text-xs font-mono font-medium tracking-tight">{totalDurationLabel}</span>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-3 w-px bg-[var(--glass-border)]" />

                  {/* End Time */}
                  <div className="flex items-center gap-2 text-ink" title="Projected End Time">
                    <CalendarClock size={14} className="text-emerald-500/70" />
                    <span className="text-xs font-mono font-medium tracking-tight">
                      Ends {showEndTime ?? '--:--'}
                    </span>
                  </div>

                </div>
              </div>
            }
            // FOOTER REMOVED (Clean scroll all the way to bottom)
          >
            {/* MAIN CONTENT (Scrolls automatically) */}
            <RunOfShow
              eventId={eventId}
              cues={cues}
              selectedCueId={selectedCueId}
              onSelectCue={setSelectedCueId}
              onCuesChange={setCues}
            />
          </GlassShell>

        </section>

        {/* --- RIGHT COLUMN: INSPECTOR --- */}
        <aside className="hidden md:flex col-span-4 flex-col h-full min-h-0">
          <CueInspector
            selectedCue={selectedCue}
            computedStartTime={computedStartTime}
            onSave={handleSave}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </aside>
      </div>
    </div>
  );
}