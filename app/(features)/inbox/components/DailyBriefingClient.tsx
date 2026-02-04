'use client'

import { useState, useEffect, useRef } from 'react'
import { TimelineItem } from '@/app/(features)/events/components/TimelineItem'

interface TimelineItemData {
  id: string
  time: string
  text: string
  source: 'ai' | 'user'
  timestamp: Date
  type?: string
  processed?: boolean
  isRawInput?: boolean
}

interface DailyBriefingClientProps {
  items: TimelineItemData[]
}

export function DailyBriefingClient({ items }: DailyBriefingClientProps) {
  const previousItemsRef = useRef<Set<string>>(new Set())
  const [isInputActive, setIsInputActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isInitialMount = useRef(true)

  // Track input focus state
  useEffect(() => {
    const handleFocus = () => setIsInputActive(true)
    const handleBlur = () => setIsInputActive(false)

    // Find the input element
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      inputRef.current = input
      input.addEventListener('focus', handleFocus)
      input.addEventListener('blur', handleBlur)
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleFocus)
        inputRef.current.removeEventListener('blur', handleBlur)
      }
    }
  }, [])

  // Track new items - check before marking as seen
  const isNewItem = (itemId: string) => {
    if (isInitialMount.current) {
      return false // Don't animate on initial render
    }
    return !previousItemsRef.current.has(itemId)
  }

  // Mark items as seen after render
  useEffect(() => {
    if (isInitialMount.current) {
      // On initial mount, mark all items as seen
      items.forEach(item => previousItemsRef.current.add(item.id))
      isInitialMount.current = false
    } else {
      // On subsequent updates, mark new items as seen after a delay
      const newItems = items.filter(item => !previousItemsRef.current.has(item.id))
      if (newItems.length > 0) {
        // Mark as seen after animation completes
        setTimeout(() => {
          newItems.forEach(item => previousItemsRef.current.add(item.id))
        }, 2000) // After typewriter animation completes
      }
    }
  }, [items])

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-16 pb-80">
      <div className="relative pl-6">
        {/* Vertical timeline line - subtle */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] border-zinc-800 bg-gradient-to-b from-zinc-800/50 via-zinc-800/50 to-transparent" />
        
        {items.length > 0 ? (
          <div>
            {items.map((item, index) => {
              // Always render every item - no filtering
              // Data Field Consistency: Use item.content || item.text
              const displayContent = (item as any).content || item.text || 'Empty Entry'
              
              const displayItem = {
                ...item,
                text: displayContent,
                content: (item as any).content, // Preserve content field for TimelineItem
              }
              
              return (
                <TimelineItem
                  key={item.id}
                  item={displayItem}
                  isNew={isNewItem(item.id)}
                  isInputActive={isInputActive}
                  isFirst={index === 0}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-subtle text-sm">No critical tasks pending</div>
        )}
      </div>
    </div>
  )
}

