'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function CommandCenter() {
  const [command, setCommand] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!command.trim()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('https://os.danielos.me/webhook/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: command }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      setStatus('success')
      setCommand('')
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 2000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send command')
      
      // Reset error state after 3 seconds
      setTimeout(() => {
        setStatus('idle')
        setErrorMessage('')
      }, 3000)
    }
  }

  return (
    <div className="w-full flex items-center justify-center py-12 px-8">
      <div className="w-full max-w-2xl space-y-6">
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
            placeholder="What is your command?"
            disabled={status === 'loading'}
            className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 
                     focus:border-neutral-600 focus:ring-neutral-600/50 focus:ring-2
                     h-14 px-6 text-base font-light
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {/* Status Indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
            {status === 'loading' && (
              <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        </form>

        {/* Error Message */}
        {status === 'error' && errorMessage && (
          <div className="bg-red-950/30 border border-red-800/50 text-red-400 px-4 py-3 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        {/* Success Message */}
        {status === 'success' && (
          <div className="bg-green-950/30 border border-green-800/50 text-green-400 px-4 py-3 rounded-md text-sm text-center">
            Command sent successfully
          </div>
        )}
      </div>
    </div>
  )
}

