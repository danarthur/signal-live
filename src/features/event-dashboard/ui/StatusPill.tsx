'use client';

import React, { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import type { EventLifecycleStatus } from '@/entities/event';
import { cn } from '@/shared/lib/utils';

const LIFECYCLE_LABELS: Record<EventLifecycleStatus, string> = {
  lead: 'Lead',
  tentative: 'Tentative',
  confirmed: 'Confirmed',
  production: 'Production',
  live: 'Live',
  post: 'Post',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

const LIFECYCLE_COLORS: Record<EventLifecycleStatus, string> = {
  lead: 'bg-stone/30 text-ink',
  tentative: 'bg-amber-500/20 text-amber-800 dark:text-amber-200',
  confirmed: 'bg-accent-sage/30 text-ink',
  production: 'bg-silk/40 text-ink',
  live: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200',
  post: 'bg-ink-muted/20 text-ink-muted',
  archived: 'bg-ink-muted/15 text-ink-muted',
  cancelled: 'bg-accent-clay/30 text-ink',
};

interface StatusPillProps {
  value: EventLifecycleStatus | null;
  onSave: (value: EventLifecycleStatus) => Promise<{ ok: boolean; error?: string }>;
  className?: string;
}

export function StatusPill({ value, onSave, className }: StatusPillProps) {
  const [pending, startTransition] = useTransition();

  const handleChange = (v: string) => {
    if (!v) return;
    startTransition(async () => {
      await onSave(v as EventLifecycleStatus);
    });
  };

  const status = value ?? 'lead';
  const label = LIFECYCLE_LABELS[status];
  const colorClass = LIFECYCLE_COLORS[status];

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger
        className={cn(
          'border-0 shadow-none bg-transparent h-auto py-1 px-2 text-xs font-medium rounded-full w-fit',
          colorClass,
          className
        )}
      >
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LIFECYCLE_LABELS) as EventLifecycleStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {LIFECYCLE_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
