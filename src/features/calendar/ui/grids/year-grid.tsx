'use client';

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getMonth,
  getYear,
  getDate,
  format,
  type Locale,
} from 'date-fns';
import type { CalendarEvent } from '@/features/calendar/model/types';

const WEEK_STARTS_ON = 1;

const COLOR_DOT: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
};

function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function eventOverlapsDay(event: CalendarEvent, dayKeyStr: string): boolean {
  const dayStart = new Date(dayKeyStr + 'T00:00:00').getTime();
  const dayEnd = new Date(dayKeyStr + 'T23:59:59.999').getTime();
  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  return start <= dayEnd && end >= dayStart;
}

export interface YearGridProps {
  events: CalendarEvent[];
  viewDate: Date;
  onMonthSelect: (year: number, month: number) => void;
  /** When a specific day is clicked, go to month view on that date */
  onDateSelect?: (year: number, month: number, day: number) => void;
  locale?: Locale;
  className?: string;
}

export function YearGrid({ events, viewDate, onMonthSelect, onDateSelect, locale, className }: YearGridProps) {
  const year = getYear(viewDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const months = useMemo(() => {
    const result: { month: number; days: Date[]; dayKeys: string[] }[] = [];
    for (let m = 1; m <= 12; m++) {
      const d = new Date(year, m - 1, 15);
      const monthStart = startOfMonth(d);
      const monthEnd = endOfMonth(d);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON, locale });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON, locale });
      const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
      result.push({
        month: m,
        days,
        dayKeys: days.map((day) => dayKey(day)),
      });
    }
    return result;
  }, [year, locale]);

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl min-h-0 grid-auto-rows-[minmax(140px,1fr)] ${className ?? ''}`.trim()}
    >
      {months.map(({ month, days, dayKeys }) => {
        const countByDay = dayKeys.map((key) => {
          const dayEvents = events.filter((e) => eventOverlapsDay(e, key));
          const colors = [...new Set(dayEvents.map((e) => e.color))];
          return { key, count: dayEvents.length, colors };
        });
        const totalEvents = countByDay.reduce((sum, d) => sum + d.count, 0);
        const handleDayClick = onDateSelect
          ? (day: Date) => {
              const dMonth = getMonth(day) + 1;
              const dYear = getYear(day);
              if (dYear === year && dMonth === month) {
                onDateSelect(dYear, dMonth, getDate(day));
              }
            }
          : undefined;

        return (
          <div
            key={month}
            className="flex flex-col min-h-0 p-4 rounded-2xl text-left liquid-panel liquid-panel-nested border border-[var(--glass-border)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => onMonthSelect(year, month)}
              className="text-base font-semibold text-ink mb-1 hover:underline focus:outline-none focus:underline"
            >
              {format(new Date(year, month - 1, 1), 'MMMM')}
            </button>
            {totalEvents > 0 ? (
              <p className="text-sm text-ink-muted mb-2">
                {totalEvents} event{totalEvents !== 1 ? 's' : ''}
              </p>
            ) : null}
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => (
                <div
                  key={i}
                  className="text-[10px] font-medium text-ink-muted dark:text-ink/80 text-center"
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0 overflow-hidden">
              {days.map((day, i) => {
                const { count, colors } = countByDay[i];
                const isCurrentMonth = getMonth(day) === month - 1 && getYear(day) === year;
                const dayNum = getDate(day);
                const hasEvents = count > 0;

                const isToday = dayKey(day) === todayKey;
                if (!isCurrentMonth) {
                  return (
                    <div
                      key={dayKey(day)}
                      className={`flex flex-col items-center justify-center min-h-[22px] text-ink-muted/50 text-[10px] rounded ${isToday ? 'ring-2 ring-inset ring-[var(--today-ring)] bg-[var(--today-bg)]' : ''}`}
                    >
                      {dayNum}
                    </div>
                  );
                }

                const onClick = handleDayClick
                  ? () => handleDayClick(day)
                  : () => onMonthSelect(year, month);

                return (
                  <button
                    key={dayKey(day)}
                    type="button"
                    onClick={onClick}
                    title={
                      hasEvents
                        ? `${dayNum}: ${count} event${count !== 1 ? 's' : ''} — click to open month`
                        : `${dayNum} — click to open month`
                    }
                    className={`flex flex-col items-center justify-center min-h-[22px] rounded text-[10px] font-medium transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--glass-border-hover)] focus:ring-inset ${
                      hasEvents
                        ? 'bg-[var(--glass-bg)]/60 text-ink hover:bg-[var(--glass-bg-hover)] hover:shadow-[var(--glass-shadow-nested)] border border-[var(--glass-border)]/50'
                        : 'text-ink-muted hover:bg-[var(--glass-bg)]/40 hover:border-[var(--glass-border)]/50'
                    } ${isToday ? 'ring-2 ring-inset ring-[var(--today-ring)] bg-[var(--today-bg)]' : ''}`}
                  >
                    <span>{dayNum}</span>
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full">
                        {colors.slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className={`block w-1 h-1 rounded-full shrink-0 ${COLOR_DOT[c] ?? COLOR_DOT.blue}`}
                          />
                        ))}
                        {count > 3 && (
                          <span className="block w-1 h-1 rounded-full shrink-0 bg-ink-muted" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
