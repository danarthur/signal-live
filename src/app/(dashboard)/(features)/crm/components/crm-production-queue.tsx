'use client';

import { useState, useOptimistic } from 'react';
import Link from 'next/link';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { Sparkles, Plus, FileText, Wallet } from 'lucide-react';
import { CreateGigModal } from './create-gig-modal';

type Gig = {
  id: string;
  title: string | null;
  status: string | null;
  event_date: string | null;
  location: string | null;
  client_name: string | null;
  isOptimistic?: boolean;
};

type OptimisticUpdate =
  | { type: 'add'; gig: Gig }
  | { type: 'revert'; tempId: string };

function gigsReducer(current: Gig[], update: OptimisticUpdate): Gig[] {
  if (update.type === 'add') {
    return [...current, { ...update.gig, isOptimistic: true }];
  }
  return current.filter((g) => g.id !== update.tempId);
}

export function CRMProductionQueue({ gigs }: { gigs: Gig[] }) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [optimisticGigs, addOptimisticGig] = useOptimistic(gigs, gigsReducer);

  return (
    <>
      <div className="flex-1 min-h-[80vh] p-6 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light text-ink tracking-tight mb-2">Production Queue</h1>
            <p className="text-ink-muted">Lead your pipeline from inquiry to execution.</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-ink text-canvas px-6 py-3 rounded-full hover:bg-walnut transition-colors liquid-levitation flex items-center gap-2"
          >
            <Plus size={18} /> New Gig
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {optimisticGigs.map((gig) => (
            <LiquidPanel
              key={gig.id}
              hoverEffect={!gig.isOptimistic}
              className={`h-full flex flex-col justify-between group ${gig.isOptimistic ? 'opacity-75 animate-pulse' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 liquid-panel liquid-panel-nested !rounded-full text-2xl text-ink">
                  <Sparkles size={18} />
                </div>
                <span className="liquid-panel liquid-panel-nested !rounded-full !p-0 px-2 py-1 text-xs font-mono text-ink-muted">
                  {gig.status ?? '—'}
                </span>
              </div>

              <Link
                href={gig.isOptimistic ? '#' : `/events/g/${gig.id}`}
                className="flex flex-col flex-1 min-w-0"
                onClick={(e) => gig.isOptimistic && e.preventDefault()}
              >
                <h3 className="text-xl font-light text-ink mb-1 group-hover:text-emerald-600 transition-colors">
                  {gig.title ?? 'Untitled Production'}
                </h3>
                <p className="text-sm text-ink-muted mb-4">{gig.client_name ?? 'Client'}</p>

                <div className="flex items-center gap-4 text-xs text-ink-muted border-t border-[var(--glass-border)] pt-4 mt-2">
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">📅</span>
                    {gig.event_date
                      ? new Date(gig.event_date).toLocaleDateString()
                      : 'TBD'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">📍</span>
                    {gig.location?.split(',')[0] ?? 'TBD'}
                  </span>
                </div>
              </Link>

              <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex gap-2 flex-wrap">
                {!gig.isOptimistic && (
                  <>
                    <Link
                      href={`/events/${gig.id}/deal`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:bg-[var(--glass-bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      <FileText size={14} />
                      Deal room
                    </Link>
                    <Link
                      href={`/events/${gig.id}/finance`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:bg-[var(--glass-bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      <Wallet size={14} />
                      Finance
                    </Link>
                  </>
                )}
              </div>
            </LiquidPanel>
          ))}

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="text-left"
          >
            <LiquidPanel
              hoverEffect
              className="h-full min-h-[200px] flex flex-col items-center justify-center text-ink-muted hover:text-ink transition-all gap-3 group border-2 border-dashed border-[var(--glass-border)]"
            >
              <div className="w-12 h-12 rounded-full liquid-panel liquid-panel-nested flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <span className="font-medium">Create New Production</span>
            </LiquidPanel>
          </button>
        </div>
      </div>

      <CreateGigModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        addOptimisticGig={addOptimisticGig}
      />
    </>
  );
}
