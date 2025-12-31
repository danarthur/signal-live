'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TimelineItemProps {
  item: {
    id: string
    time: string
    text: string
    source?: 'ai' | 'user'
    timestamp: Date
    type?: string
    processed?: boolean | string | number // Can be boolean, string, or number (0)
    content?: string
    payload?: { content?: string }
  }
  isNew?: boolean
  isInputActive?: boolean
  isFirst?: boolean
}

export function TimelineItem({ item, isNew = false, isInputActive = false, isFirst = false }: TimelineItemProps) {
  // Data Fallback: Ensure component uses item.content || item.text
  const displayText = item.content || item.text || 'Empty Entry'
  
  // The 'Surgical' Arrow Logic: An item is a 'User Input' ONLY if item.type?.toLowerCase() === 'note'
  const isUserInput = item.type?.toLowerCase() === 'note'
  
  // Only show typewriter effect for non-user items (tasks/events)
  const [displayedText, setDisplayedText] = useState(isNew && !isUserInput ? '' : displayText)
  const [showCursor, setShowCursor] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)

  // Typewriter effect for new system items (tasks/events)
  useEffect(() => {
    if (isNew && !isUserInput && displayText) {
      setDisplayedText('')
      setShowCursor(true)
      let currentIndex = 0
      
      const typeInterval = setInterval(() => {
        if (currentIndex < displayText.length) {
          setDisplayedText(displayText.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          setShowCursor(false)
          clearInterval(typeInterval)
        }
      }, 30) // Fast typing speed
      
      return () => clearInterval(typeInterval)
    }
  }, [isNew, displayText, isUserInput])

  const handleGlitch = () => {
    // Only glitch for system items (tasks/events), not user inputs
    if (!isUserInput) {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 200)
    }
  }

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative flex items-start gap-8 cursor-default mb-8 transition-all duration-200 hover:translate-x-1 hover:bg-zinc-900/50 rounded-lg px-2 py-1 ${
        isInputActive ? 'opacity-50' : ''
      }`}
      onMouseEnter={handleGlitch}
    >
      {/* Timeline dot - smaller and dimmer, pulse gold for first item */}
      <div
        className={`absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full border-2 border-void transition-transform duration-200 group-hover:scale-125 ${
          isFirst
            ? 'bg-cream animate-pulse'
            : 'bg-zinc-700'
        }`}
      />
      
      {/* Content - Stacked vertically with aligned spacing */}
      <div className="flex-1 pt-0.5 max-w-4xl">
        {/* Timestamp - small, uppercase, subtle */}
        <div className="text-[10px] tracking-widest text-zinc-500 uppercase mb-1 font-mono pl-4">
          {item.time}
        </div>
        {/* Content - No arrows, clean text only */}
        {(() => {
          // Check if type is 'note' (case-insensitive) for styling only
          const isNote = item.type?.toLowerCase() === 'note'
          
          // Typography Hierarchy: Styling based on item type
          const textColor = isNote ? 'text-white' : 'text-zinc-400'
          const textFont = isNote ? 'font-mono' : 'font-sans'
          
          return (
            <div
              className={`text-lg font-medium leading-relaxed transition-colors duration-200 group-hover:text-white pl-6 ${
                isGlitching ? 'animate-glitch' : ''
              } ${textColor} ${textFont}`}
            >
              {displayedText}
              {showCursor && <span className="animate-blink text-cream">_</span>}
            </div>
          )
        })()}
      </div>
    </motion.div>
  )
}

