import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { redirect } from 'next/navigation';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const { data: history } = await supabase
    .from('agent_runs')
    .select('id, user_message, started_at, status')
    .order('started_at', { ascending: false })
    .limit(50);

  const normalizedHistory = (history || []).map(run => ({
    id: run.id,
    preview: run.user_message || 'Autonomous Process',
    createdAt: new Date(run.started_at).getTime(),
  }));

  return (
    <div className="relative flex h-screen w-full bg-[#F5F2EB] overflow-hidden font-sans text-[#3E3A35] p-6 gap-6">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#E7E2D8] rounded-full blur-[140px] mix-blend-multiply animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#F4F1EA] rounded-full blur-[140px] mix-blend-multiply animate-pulse-slow delay-1000" />
      </div>

      <Sidebar initialSessions={normalizedHistory} />
      <main className="flex-1 relative flex flex-col h-full overflow-hidden rounded-[2rem] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none bg-[url('/grain.svg')] mix-blend-multiply" />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

