'use client';

import { TimelineItem } from '@/app/(dashboard)/(features)/events/components/TimelineItem';

interface DailyBriefingClientProps {
  items: any[];
}

export function DailyBriefingClient({ items }: DailyBriefingClientProps) {
  if (!items || items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-ink-muted opacity-60">
        <p className="text-xs tracking-widest uppercase font-sans">Inbox Zero</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="relative space-y-4 liquid-panel liquid-panel-nested !p-4">
        <div className="absolute left-4 top-4 bottom-4 w-px bg-[var(--glass-border)]" />
        {items.map((item, index) => (
          <div key={item.id || index} className="relative pl-6">
            <div className="absolute left-3 top-1.5 liquid-panel liquid-panel-nested !rounded-full !p-0 w-2.5 h-2.5 !bg-stone/50" />
            <TimelineItem
              item={{ ...item, text: item.content || item.text || 'Entry' }}
              isLast={index === items.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

