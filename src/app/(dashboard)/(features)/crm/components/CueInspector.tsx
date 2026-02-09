'use client';

import { useEffect, useMemo, useRef, useState, useOptimistic, startTransition } from 'react';
import { Clock, Mic, Sun, Video, Truck, Copy, Trash2, MousePointerClick } from 'lucide-react';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { cn } from '@/shared/lib/utils';
import type { Cue, CueType } from '@/types/supabase';

type CueInspectorProps = {
  selectedCue: Cue | null;
  computedStartTime?: string | null;
  onSave: (updates: Partial<Cue>) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
};

const typeOptions: { value: CueType; label: string; icon: typeof Mic }[] = [
  { value: 'stage', label: 'Stage', icon: Mic },
  { value: 'audio', label: 'Audio', icon: Video },
  { value: 'lighting', label: 'Lighting', icon: Sun },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'logistics', label: 'Logistics', icon: Truck },
];

export function CueInspector({
  selectedCue,
  computedStartTime,
  onSave,
  onDelete,
  onDuplicate,
}: CueInspectorProps) {
  const [formState, setFormState] = useState<Partial<Cue>>({});
  const [optimisticCue, setOptimisticCue] = useOptimistic<Partial<Cue>>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!selectedCue) {
      setFormState({});
      startTransition(() => {
        setOptimisticCue({});
      });
      return;
    }
    setFormState({
      title: selectedCue.title,
      duration_minutes: selectedCue.duration_minutes,
      type: selectedCue.type,
      notes: selectedCue.notes ?? '',
    });
    startTransition(() => {
      setOptimisticCue({
        title: selectedCue.title,
        duration_minutes: selectedCue.duration_minutes,
        type: selectedCue.type,
        notes: selectedCue.notes ?? '',
      });
    });
  }, [selectedCue, setOptimisticCue]);

  const activeType = useMemo(() => {
    const match = typeOptions.find((option) => option.value === (optimisticCue.type ?? selectedCue?.type));
    return match ?? typeOptions[0];
  }, [optimisticCue.type, selectedCue?.type]);

  const handleDelete = async () => {
    if (!selectedCue) return;
    if (!window.confirm('Delete this cue?')) return;
    await onDelete();
  };

  const scheduleSave = (updates: Partial<Cue>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSave(updates).catch(() => undefined);
    }, 500);
  };

  const updateField = <K extends keyof Cue>(key: K, value: Cue[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    startTransition(() => {
      setOptimisticCue((prev) => ({ ...prev, [key]: value }));
    });
    scheduleSave({ [key]: value } as Partial<Cue>);
  };

  if (!selectedCue) {
    return (
      <LiquidPanel className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MousePointerClick size={24} className="text-stone-300" />
          <p className="text-sm text-stone-400">Select a cue to edit</p>
        </div>
      </LiquidPanel>
    );
  }

  return (
    <LiquidPanel className="h-full flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">Cue Inspector</h3>
          <p className="text-xs text-ink-muted mt-1">Adjust timing, type, and notes.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-ink-muted">Starts at</p>
          <div className="font-mono text-4xl font-light text-ink tracking-tight">
            {computedStartTime ?? '--:--'}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-ink-muted">Title</label>
          <input
            value={(formState.title as string) ?? ''}
            onChange={(event) => updateField('title', event.target.value)}
            className="w-full bg-[var(--glass-bg)] rounded-xl px-4 py-3 text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-[var(--glass-border-hover)] transition-all border border-[var(--glass-border)]"
            placeholder="Cue title"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-ink-muted">Duration</label>
            <div className="w-full bg-[var(--glass-bg)] rounded-xl px-4 py-3 text-ink placeholder:text-ink-muted/50 focus-within:ring-2 focus-within:ring-[var(--glass-border-hover)] transition-all border border-[var(--glass-border)] flex items-center gap-2">
              <Clock size={14} className="text-ink-muted" />
              <input
                type="number"
                min={1}
                value={Number(formState.duration_minutes ?? 0)}
                onChange={(event) => updateField('duration_minutes', Number(event.target.value))}
                className="w-full bg-transparent border-none outline-none text-sm text-ink placeholder:text-ink-muted/50 focus:ring-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-ink-muted">Type</label>
            <div className="liquid-panel liquid-panel-nested !rounded-2xl !p-1 flex items-center gap-2">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = (formState.type ?? selectedCue?.type) === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('type', option.value)}
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center transition-all',
                      isActive
                        ? 'bg-ink text-[var(--background)] shadow-sm'
                        : 'text-ink-muted hover:text-ink hover:bg-ink/5'
                    )}
                    aria-label={option.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-ink-muted uppercase tracking-widest">
              <activeType.icon size={12} />
              {activeType.label}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-ink-muted">Notes</label>
          <textarea
            value={(formState.notes as string) ?? ''}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={6}
            className={cn(
              "w-full bg-[var(--glass-bg)] rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-[var(--glass-border-hover)] transition-all border border-[var(--glass-border)]",
              "resize-none outline-none min-h-[120px]"
            )}
            placeholder="Add cue notes..."
          />
        </div>
      </div>

      <div className="mt-auto pt-2 border-t border-[var(--glass-border)] grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onDuplicate}
          className="h-10 flex items-center justify-center gap-2 rounded-lg bg-ink/5 hover:bg-ink/10 text-xs font-medium text-ink transition-colors"
        >
          <Copy size={12} />
          Duplicate
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="h-10 flex items-center justify-center gap-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-600 transition-colors"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </LiquidPanel>
  );
}
