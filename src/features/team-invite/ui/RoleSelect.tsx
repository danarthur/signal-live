'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  SIGNAL_ROLE_PRESETS,
  ASSIGNABLE_ROLE_IDS,
  getRoleLabel,
  type SignalRoleId,
} from '../model/role-presets';
import { cn } from '@/shared/lib/utils';

export interface RoleSelectProps {
  value: SignalRoleId;
  onChange: (value: SignalRoleId) => void;
  /** When false, Admin and Manager are hidden (only owner/admin can assign them). */
  canAssignElevated?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

/**
 * Role Select — rich descriptions for the 5 Signal archetypes.
 * Replaces the simple access-level dropdown with the Advanced Access System (Phase 1).
 */
export function RoleSelect({
  value,
  onChange,
  canAssignElevated = false,
  disabled = false,
  className,
  triggerClassName,
}: RoleSelectProps) {
  const options = React.useMemo(() => {
    return ASSIGNABLE_ROLE_IDS.filter((id) => {
      const preset = SIGNAL_ROLE_PRESETS.find((p) => p.id === id);
      if (!preset?.assignable) return false;
      if (preset.requiresElevatedAssigner && !canAssignElevated) return false;
      return true;
    });
  }, [canAssignElevated]);

  const displayValue = getRoleLabel(value);
  const selectedPreset = SIGNAL_ROLE_PRESETS.find((p) => p.id === value);

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-xs font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
        Role
      </label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as SignalRoleId)}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'w-full rounded-xl border border-[var(--color-mercury)] bg-[var(--color-obsidian)]/50 px-3 py-2.5 text-[var(--color-ink)]',
            'hover:bg-[var(--color-obsidian)]/70 focus:border-[var(--color-silk)]/50 focus:ring-2 focus:ring-[var(--color-silk)]/20',
            triggerClassName
          )}
        >
          <SelectValue placeholder="Select role">
            <span className="font-medium">{displayValue}</span>
            {selectedPreset?.description && (
              <span className="ml-2 hidden text-xs text-[var(--color-ink-muted)] sm:inline">
                — {selectedPreset.description}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          align="end"
          position="popper"
          className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
        >
          {options.map((id) => {
            const preset = SIGNAL_ROLE_PRESETS.find((p) => p.id === id);
            if (!preset) return null;
            return (
              <SelectItem
                key={preset.id}
                value={preset.id}
                className="py-3 pr-8 pl-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-xs text-[var(--color-ink-muted)]">
                    {preset.description}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
