'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';

interface EventSnippet {
  id: string;
  title: string;
  status: 'planned' | 'booked' | 'confirmed';
  starts_at: string;
  location_name?: string;
}

export function EventStatus() {
  const [events, setEvents] = useState<EventSnippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-[#A8A29E] uppercase tracking-widest">
          Production Schedule
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="h-20 w-full animate-pulse rounded-xl bg-white/20" />
        ) : events.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8C8781] italic">
            No upcoming productions.
          </div>
        ) : (
          events.map((evt, i) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex flex-col gap-2 rounded-xl border border-white/20 bg-white/40 p-3 transition-all hover:bg-white/60"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-serif text-sm font-medium text-[#2C2824]">
                    {evt.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8C8781] uppercase tracking-wider">
                    <Calendar size={10} />
                    {new Date(evt.starts_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <StatusBadge status={evt.status} />
              </div>

              {evt.location_name && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#A8A29E]">
                  <MapPin size={10} />
                  <span className="truncate">{evt.location_name}</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    booked: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    planned: 'bg-stone-100 text-stone-600 border-stone-200',
  };

  const activeStyle = styles[status as keyof typeof styles] || styles.planned;

  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${activeStyle}`}>
      {status}
    </span>
  );
}
