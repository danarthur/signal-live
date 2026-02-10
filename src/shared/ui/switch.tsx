'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Liquid Ceramic branded switch: rounded-full track, walnut when on,
 * silk/glass when off. Use for Set by time, Show load-in/out, and Settings preferences.
 */
export interface CeramicSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Accessible label (used for aria-label if no associated label). */
  'aria-label'?: string;
}

export function CeramicSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  className,
  'aria-label': ariaLabel,
}: CeramicSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-[background-color,border-color,box-shadow] duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
        'disabled:pointer-events-none disabled:opacity-50',
        checked
          ? 'border-walnut/30 bg-walnut/20 dark:bg-walnut/25'
          : 'border-[var(--glass-border)] bg-[var(--glass-bg)] dark:bg-ink/10',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full transition-transform duration-200 translate-y-0.5',
          checked ? 'translate-x-5 bg-walnut' : 'translate-x-0.5 bg-ink/20 dark:bg-ink/30'
        )}
      />
    </button>
  );
}
