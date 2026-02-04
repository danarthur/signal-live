'use client';

import React, { useState } from 'react';
import { useSession } from '@/components/providers/SessionContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { ChatInterface } from '@/app/(features)/brain/components/ChatInterface';
import { WeatherCard, TimeCard } from '@/app/(features)/inbox/components/DailyBriefing';
import { DailyBriefingClient } from '@/app/(features)/inbox/components/DailyBriefingClient';
import { ArthurInput } from '@/app/(features)/brain/components/ArthurInput';
import { AIStatus } from '@/app/(features)/brain/components/AIStatus';
import { FinancialUpdates } from '@/app/(features)/finance/components/FinancialUpdates';
import { EventStatus } from '@/app/(features)/events/components/EventStatus';

const MORPH_TRANSITION = {
  type: 'spring',
  stiffness: 280,
  damping: 30,
  mass: 1,
};

const PANEL_BASE = 'relative rounded-[32px] overflow-hidden backdrop-blur-2xl border border-white/50 shadow-sm';

export default function Home() {
  const { viewState, setViewState, isLoading } = useSession();
  const [input, setInput] = useState('');

  const toggleView = () => setViewState(viewState === 'overview' ? 'chat' : 'overview');
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  return (
    <main className="h-screen w-full bg-[#E6E4DD] text-[#4A453E] overflow-hidden relative font-sans antialiased">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#DCD8D0] rounded-full blur-[140px] mix-blend-multiply animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#EFEDE6] rounded-full blur-[140px] mix-blend-multiply animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 h-full w-full p-4 md:p-6 grid h-full grid-cols-12 grid-rows-6 gap-6">
        {/* LEFT PANEL: Widgets <-> History */}
        <motion.div
          layout
          transition={MORPH_TRANSITION}
          className={[
            PANEL_BASE,
            viewState === 'overview' ? 'flex-[1] bg-white/70' : 'w-80 shrink-0 bg-[#EBE7DF]/80',
          ].join(' ')}
        >
          <AnimatePresence mode="wait">
            {viewState === 'overview' ? (
              <motion.div
                key="widgets"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full p-6 flex flex-col"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-serif text-[#2C2824]">Briefing</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <p className="text-[#A8A29E] uppercase tracking-widest text-[10px] font-mono">Systems Nominal</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="space-y-6">
                    <div className="bg-white/40 border border-white/40 rounded-2xl p-4 backdrop-blur-md shadow-sm transition-all hover:bg-white/60 hover:shadow-md">
                      <FinancialUpdates />
                    </div>
                    <div className="bg-white/40 border border-white/40 rounded-2xl p-4 backdrop-blur-md shadow-sm transition-all hover:bg-white/60 hover:shadow-md">
                      <EventStatus />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sidebar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                <Sidebar />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* CENTER PANEL: Input <-> Chat */}
        <motion.div
          layout
          transition={MORPH_TRANSITION}
          className={[
            PANEL_BASE,
            viewState === 'overview' ? 'flex-[2] bg-[#F5F5F0]/70' : 'flex-[3] bg-[#F5F5F0] shadow-lg',
          ].join(' ')}
        >
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={toggleView}
              className="p-2.5 rounded-full bg-white/50 hover:bg-white text-[#4A453E] transition-all shadow-sm active:scale-95"
            >
              {viewState === 'overview' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {viewState === 'overview' ? (
              <motion.div
                key="overview-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full p-8 flex flex-col"
              >
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <h1 className="text-4xl font-serif text-[#2C2824] tracking-tight mb-4">Good Afternoon, Daniel.</h1>
                  <p className="text-sm text-[#8B8276] uppercase tracking-widest font-mono">Focus Mode</p>
                </div>

                <div className="w-full max-w-2xl mx-auto">
                  <ArthurInput
                    input={input}
                    setInput={setInput}
                    handleInputChange={handleInputChange}
                    isLoading={isLoading}
                    onInteraction={() => setViewState('chat')}
                  />
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="chat-center"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                <ChatInterface viewState={viewState} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RIGHT PANEL: Timeline <-> Status */}
        <motion.div
          layout
          transition={MORPH_TRANSITION}
          className={[
            PANEL_BASE,
            viewState === 'overview'
              ? 'flex-[1] bg-white/70'
              : 'flex-[0] w-0 min-w-0 opacity-0 pointer-events-none',
          ].join(' ')}
        >
          <AnimatePresence mode="wait">
            {viewState === 'overview' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full p-6 flex flex-col"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-serif text-[#2C2824]">Telemetry</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <p className="text-[#A8A29E] uppercase tracking-widest text-[10px] font-mono">System Health</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="space-y-6">
                    <WeatherCard />
                    <TimeCard />
                    <AIStatus />
                    <div className="mask-gradient-bottom">
                      <div className="pb-24">
                        <h3 className="text-xs font-mono text-[#A8A29E] uppercase tracking-widest mb-4">Recent Activity</h3>
                        <DailyBriefingClient items={[]} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 bg-[url('/grain.svg')] mix-blend-multiply" />
    </main>
  );
}
