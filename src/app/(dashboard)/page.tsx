'use client';

import React, { useState } from 'react';
import { useSession } from '@/shared/ui/providers/SessionContext';
import { AnimatePresence, motion } from 'framer-motion';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { ActiveProductionWidget } from '@/widgets/active-production';

import { ChatInterface } from '@/app/(dashboard)/(features)/brain/components/ChatInterface';
import { ArthurInput } from '@/app/(dashboard)/(features)/brain/components/ArthurInput';
import { DailyBriefingClient } from '@/app/(dashboard)/(features)/inbox/components/DailyBriefingClient';
import { AIStatus } from '@/app/(dashboard)/(features)/brain/components/AIStatus';
import { FinancialUpdates } from '@/app/(dashboard)/(features)/finance/components/FinancialUpdates';

export default function Home() {
  const { viewState, setViewState } = useSession();
  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleDashboardSubmit = async () => {
    if (!input.trim()) return;
    setViewState('chat');
  };

  const showOverview = viewState !== 'chat';

  return (
    <div className="flex-1 min-h-full w-full relative p-4 md:p-6 lg:p-8 font-sans overflow-auto">
      <AnimatePresence mode="wait">
        {showOverview && (
          <motion.div
            key="dashboard-view"
            className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-full"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="md:col-span-3 flex flex-col gap-6 min-h-0">
              <LiquidPanel hoverEffect className="flex-1 flex flex-col justify-between min-h-0">
                <div className="space-y-1">
                  <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest">Finance</h2>
                  <div className="text-3xl font-light text-ink tracking-tight">
                    $24,500<span className="text-ink-muted text-lg">.00</span>
              </div>
            </div>
                <div className="mt-4">
                   <FinancialUpdates />
                </div>
              </LiquidPanel>
              
              <ActiveProductionWidget />
            </div>

            <div className="md:col-span-6 flex flex-col items-center justify-center relative z-10">
              <div className="text-center mb-12 space-y-4">
                <h1 className="text-6xl md:text-7xl font-light tracking-tight text-ink">
                  Good Morning.
                </h1>
                <p className="text-xl text-ink-muted font-light">
                  System is <span className="text-ink font-medium">Online</span>.
                </p>
              </div>

              <div className="w-full max-w-xl">
                <ArthurInput
                  input={input}
                  setInput={setInput}
                  handleInputChange={handleInputChange}
                  isLoading={false}
                  onInteraction={handleDashboardSubmit}
                />
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-6 min-h-0">
              <div className="space-y-4">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-widest">Status</span>
                <AIStatus />
              </div>

              <LiquidPanel className="flex-1 flex flex-col min-h-0">
                <div className="mb-4 pb-4 border-b border-[var(--glass-border)] flex justify-between items-end">
                  <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest">Inbox</h2>
                  <span className="text-xs text-ink liquid-panel !rounded-full !px-2 !py-0.5 !p-0">0</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <DailyBriefingClient items={[]} />
              </div>
              </LiquidPanel>
            </div>
          </motion.div>
        )}

        {viewState === 'chat' && (
          <motion.div
            key="chat-view"
            className="h-full w-full flex flex-col"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <LiquidPanel className="flex-1 overflow-hidden flex flex-col !p-0">
              <div className="flex-1">
                <ChatInterface />
            </div>
            </LiquidPanel>

            <button
              onClick={() => setViewState('overview')}
              className="mt-4 mx-auto flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
              </svg>
              Return to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
