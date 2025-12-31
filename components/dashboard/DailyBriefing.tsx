import { createClient } from '@/utils/supabase/server'

interface TimelineItem {
  id: string
  time: string
  text: string
  source: 'ai' | 'user'
  timestamp: Date
  type?: string
  processed?: boolean
  isRawInput?: boolean // Explicit tag for raw, unprocessed entries
  created_at?: string // Preserve created_at for sorting
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function parseTimeString(timeStr: string): Date {
  // Parse time strings like "9:30 AM" into a Date object for today
  const today = new Date()
  const [time, period] = timeStr.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  
  let hour24 = hours
  if (period === 'PM' && hours !== 12) hour24 += 12
  if (period === 'AM' && hours === 12) hour24 = 0
  
  today.setHours(hour24, minutes || 0, 0, 0)
  return today
}

async function getUnifiedTimeline(): Promise<TimelineItem[]> {
  const supabase = await createClient()
  
  // Source A: Fetch latest daily_log must_do
  const { data: dailyLogData, error: dailyLogError } = await supabase
    .from('daily_log')
    .select('must_do, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  // Source B: FORCE FETCH - Completely separate fetch for entries
  // NO FILTERS - fetch ALL entries, no date restrictions
  const { data: entriesData, error: entriesError } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Log immediately to see what we're getting
  console.log('RAW ENTRIES FETCH:', entriesData)
  console.log('RAW ENTRIES ERROR:', entriesError)
  console.log('RAW ENTRIES COUNT:', entriesData?.length || 0)
  
  const timelineItems: TimelineItem[] = []
  
  // Transform Source A: daily_log must_do items
  if (!dailyLogError && dailyLogData && dailyLogData.must_do) {
    let mustDoItems: string[] = []
    
    if (Array.isArray(dailyLogData.must_do)) {
      mustDoItems = dailyLogData.must_do
    } else if (typeof dailyLogData.must_do === 'string') {
      try {
        mustDoItems = JSON.parse(dailyLogData.must_do)
      } catch {
        mustDoItems = []
      }
    }
    
    mustDoItems.forEach((item, index) => {
      const parts = item.split(' - ')
      const timeStr = parts[0] || ''
      const text = parts.slice(1).join(' - ') || item
      
      try {
        const timestamp = parseTimeString(timeStr)
        timelineItems.push({
          id: `ai-${index}`,
          time: timeStr,
          text,
          source: 'ai',
          timestamp,
          isRawInput: false, // AI items never get arrow
          created_at: dailyLogData.created_at, // Use daily_log created_at for sorting
        })
      } catch {
        // Skip invalid time strings
      }
    })
  }
  
  // Transform Source B: entries table (user inputs)
  // Fix the Arrow Logic: Explicitly tag raw, unprocessed entries
  if (!entriesError && entriesData && Array.isArray(entriesData)) {
    console.log(`Processing ${entriesData.length} entries from entries table`)
    
    entriesData.forEach((entry: any) => {
      // Fix 'Ghost' Content: Handle all possible field names
      const displayContent = entry.content || entry.text || entry.payload?.content || 'Empty Entry'
      
      // The 'Only One Arrow' Rule: Tag items from entries table with processed: false
      const isRawInput = entry.processed === false || entry.processed === 'FALSE' || entry.processed === 'false'
      
      timelineItems.push({
        id: `user-${entry.id}`,
        time: formatTime(entry.created_at),
        text: displayContent,
        source: 'user',
        timestamp: new Date(entry.created_at),
        type: entry.type || 'note',
        processed: entry.processed,
        isRawInput: isRawInput, // Explicit tag: only raw, unprocessed entries get arrow
        created_at: entry.created_at, // Preserve for sorting
      })
    })
    
    console.log(`Successfully processed ${entriesData.length} entries into timeline`)
  } else {
    console.log('ERROR: Could not process entries:', entriesError)
  }
  
  // Add type to AI items from daily_log (default to 'task' or 'event' based on content)
  timelineItems.forEach((item) => {
    if (item.source === 'ai' && !item.type) {
      // Default AI items to 'task', but could be 'event' if content suggests it
      const textLower = item.text.toLowerCase()
      if (textLower.includes('gym') || textLower.includes('meeting') || textLower.includes('event')) {
        item.type = 'event'
      } else {
        item.type = 'task'
      }
    }
    // Ensure isRawInput is false for all non-entries items
    if (item.source === 'ai') {
      item.isRawInput = false
    }
  })
  
  // Sort by time: Chronological order (earliest to latest)
  timelineItems.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : a.timestamp.getTime()
    const dateB = b.created_at ? new Date(b.created_at).getTime() : b.timestamp.getTime()
    return dateA - dateB // Ascending order (earliest first)
  })
  
  // Debug: Log final timeline items
  console.log('Final Timeline Items:', timelineItems)
  console.log(`Total items in timeline: ${timelineItems.length}`)
  console.log(`Entries items: ${timelineItems.filter(i => i.source === 'user').length}`)
  console.log(`AI items: ${timelineItems.filter(i => i.source === 'ai').length}`)
  
  return timelineItems
}

import { DailyBriefingClient } from './DailyBriefingClient'

export async function DailyBriefing() {
  const items = await getUnifiedTimeline()

  return <DailyBriefingClient items={items} />
}

