import { Header } from '@/components/dashboard/Header'
import { CommandInput } from '@/components/dashboard/CommandInput'
import { AIStatus } from '@/components/dashboard/AIStatus'
import { DailyBriefing } from '@/components/dashboard/DailyBriefing'

export default function Dashboard() {
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Header - Greeting and status */}
      <Header />
      
      {/* Command Input - Sticky header with backdrop */}
      <CommandInput />
      
      {/* AI Status - Briefing summary */}
      <AIStatus />
      
      {/* Daily Briefing - Timeline */}
      <div className="pb-96 relative">
        <DailyBriefing />
        
        {/* Gradient Fade - Fixed at bottom, fades text behind input bar */}
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent pointer-events-none z-40" />
      </div>
    </div>
  )
}
