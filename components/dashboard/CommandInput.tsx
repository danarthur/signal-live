'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'

export function CommandInput() {
  const [command, setCommand] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!command.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('entries')
        .insert({
          content: command.trim(),
          type: 'note',
        })

      if (error) {
        console.error('Error inserting entry:', error)
        return
      }

      // Clear input
      setCommand('')
      
      // Refresh the page to show new entry
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Desktop: Sticky header with backdrop */}
      <div className="hidden md:block sticky top-0 z-50 w-full">
        <div className="bg-void backdrop-blur-xl border-b border-subtle">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="relative">
              <Input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Command..."
                disabled={isSubmitting}
                className="bg-stone/50 border-subtle text-cream placeholder:text-muted/60
                         focus:border-cream/50 focus:ring-cream/30 focus:ring-1
                         focus:shadow-[0_0_30px_rgba(251,191,36,0.15)]
                         h-12 px-4 text-sm font-mono
                         transition-all duration-200
                         backdrop-blur-xl
                         disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed to bottom (above nav), full width with frosted glass */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 px-4 z-50 pb-4">
        <div className="backdrop-blur-xl bg-zinc-950/90 rounded-lg px-4 py-3">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Command..."
              disabled={isSubmitting}
              className="bg-stone/50 border-subtle text-cream placeholder:text-muted/60
                       focus:border-cream/50 focus:ring-cream/30 focus:ring-1
                       focus:shadow-[0_0_30px_rgba(251,191,36,0.15)]
                       h-12 px-4 text-sm font-mono w-full
                       transition-all duration-200
                       backdrop-blur-xl
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </form>
        </div>
      </div>
    </>
  )
}

