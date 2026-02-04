'use client';

import React from 'react';
import { Plus, Command, MoreHorizontal, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { useSession } from '@/components/providers/SessionContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SidebarProps {
  initialSessions?: Array<{ id: string; preview: string; createdAt: number }>;
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

export function Sidebar({ initialSessions = [] }: SidebarProps) {
  const { sessions: contextSessions, currentSessionId, selectSession, startNewChat } = useSession();
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(() => new Set());
  const [renamed, setRenamed] = React.useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(() => new Set());

  const displaySessions = contextSessions.length > 0 ? contextSessions : initialSessions;
  const filteredSessions = displaySessions.filter(session => !deletedIds.has(session.id));
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const handleSelect = (sessionId: string) => {
    setOpenMenuId(null);
    selectSession(sessionId);
  };

  const handleTogglePin = (sessionId: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
    setOpenMenuId(null);
  };

  const handleRename = (sessionId: string, currentLabel: string) => {
    const nextLabel = window.prompt('Rename conversation', currentLabel);
    if (nextLabel === null) return;
    const trimmed = nextLabel.trim();
    setRenamed(prev => ({ ...prev, [sessionId]: trimmed || 'New conversation' }));
    setOpenMenuId(null);
  };

  const handleDelete = (sessionId: string) => {
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.add(sessionId);
      return next;
    });
    if (currentSessionId === sessionId) {
      const fallback = sortedSessions.find(session => session.id !== sessionId);
      if (fallback) selectSession(fallback.id);
    }
    setOpenMenuId(null);
  };

  return (
    <aside className="w-80 shrink-0 h-full bg-white/70 backdrop-blur-xl relative z-20 hidden md:flex flex-col rounded-[2rem] border border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-full bg-[#4A453E] flex items-center justify-center text-[#F5F2EB] shadow-lg">
            <Command size={14} />
          </div>
          <span className="font-serif text-lg tracking-tight text-[#4A453E]">
            Arthur <span className="opacity-40 font-sans text-xs uppercase tracking-widest ml-1">OS</span>
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startNewChat}
          className="w-full flex items-center gap-3 rounded-xl bg-white/60 border border-white/40 px-4 py-3 text-sm text-[#4A453E] shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300 group"
        >
          <div className="bg-[#C5A278]/20 p-1.5 rounded-md group-hover:bg-[#C5A278]/30 transition-colors">
            <Plus size={16} className="text-[#8B735B]" />
          </div>
          <span className="font-medium">New Session</span>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-[#A8A29E]/20 hover:scrollbar-thumb-[#A8A29E]/40">
        <div className="px-2 py-2 text-[10px] font-bold text-[#A8A29E] uppercase tracking-widest">
          History
        </div>

        {sortedSessions.map((session, i) => {
          const isActive = session.id === currentSessionId;
          const isPinned = pinnedIds.has(session.id);
          const label = renamed[session.id] ?? session.preview ?? 'New conversation';
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className={cn(
                'w-full text-left rounded-xl transition-all duration-200 group relative border',
                isActive
                  ? 'bg-white/90 text-[#2C2824] shadow-md border-white/70 ring-1 ring-white/60'
                  : 'bg-white/60 text-[#4A453E] border-white/50 hover:bg-white/75 hover:text-[#2C2824] hover:border-white/70'
              )}
            >
              <button
                type="button"
                onClick={() => handleSelect(session.id)}
                className="w-full text-left rounded-xl px-4 py-3"
              >
                <div className="relative z-10">
                  <div className="text-sm font-medium truncate pr-4">
                    {label}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isActive ? 'bg-[#C5A278]' : 'bg-[#A8A29E]/30'
                      )}
                    />
                    <span className="text-[10px] opacity-60">{formatDate(session.createdAt)}</span>
                    {isPinned && <Pin size={10} className="opacity-50" />}
                  </div>
                </div>
              </button>

              <div className="absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId(prev => (prev === session.id ? null : session.id));
                  }}
                  className="p-1.5 rounded-md hover:bg-white/60 text-[#8B8276] transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>

              {openMenuId === session.id && (
                <div
                  className="absolute right-3 top-9 z-30 w-40 rounded-xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg p-1 text-xs text-[#4A453E]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors"
                    onClick={() => handleRename(session.id, label)}
                  >
                    <Pencil size={12} />
                    Rename
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors"
                    onClick={() => handleTogglePin(session.id)}
                  >
                    {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                    {isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors text-[#9B5C4A]"
                    onClick={() => handleDelete(session.id)}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#A8A29E]/10 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[10px] text-[#8B8276]">
          <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-pulse" />
          <span>Systems Nominal</span>
        </div>
      </div>
    </aside>
  );
}

