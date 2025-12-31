import { createClient } from '@/utils/supabase/server'

async function getDailyLogSummary() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('daily_log')
    .select('summary')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data || !data.summary) {
    return null
  }
  
  return data.summary
}

export async function AIStatus() {
  const summary = await getDailyLogSummary()
  const displayText = summary || 'System online. Waiting for daily briefing generation.'

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="p-4 rounded-lg bg-white/5 border border-cream/20">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 pt-0.5">
            <div className="relative">
              <div className="w-2 h-2 bg-cream rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-cream/30 rounded-full animate-ping" />
            </div>
            <span className="text-cream text-xs font-bold uppercase tracking-wide">
              Briefing
            </span>
          </div>
          <p className="text-primary font-light text-sm leading-relaxed flex-1">
            {displayText}
          </p>
        </div>
      </div>
    </div>
  )
}

