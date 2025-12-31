'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname()

  const routes = [
    { path: '/', label: 'Home' },
    { path: '/brain', label: 'Nodes' },
    { path: '/engine', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-void relative">
      {/* Cinematic vignette overlay */}
      <div 
        className="fixed inset-0 bg-cinematic pointer-events-none z-0"
        aria-hidden="true"
      />
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Ghost Menu - Fixed at bottom center */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="backdrop-blur-md bg-stone border border-white/20 rounded-full px-6 py-3 flex items-center gap-4">
          {routes.map((route) => {
            const isActive = pathname === route.path
            return (
              <Link
                key={route.path}
                href={route.path}
                className={`relative transition-all duration-300 ${
                  isActive ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                }`}
                aria-label={route.label}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-cream shadow-[0_0_8px_rgba(212,196,168,0.5)] scale-110'
                      : 'bg-subtle opacity-60'
                  }`}
                />
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

