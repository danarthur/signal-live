/**
 * Sidebar with User Account
 * Navigation sidebar with integrated account menu
 * @module components/layout/SidebarWithUser
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Calendar, CalendarDays, MessageSquare, Wallet, Settings, Sun, Moon, SunMoon, LogOut, User, FolderKanban } from 'lucide-react';
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from 'react';
import { useSession } from '@/shared/ui/providers/SessionContext';
import { cn } from '@/shared/lib/utils';
import { signOutAction } from '@/features/auth/smart-login';

interface SidebarWithUserProps {
  user: {
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  workspaceName?: string | null;
}

export function SidebarWithUser({ user, workspaceName }: SidebarWithUserProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setViewState } = useSession();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const springConfig = { type: 'spring', stiffness: 300, damping: 30 } as const;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountOpen(false);
      }
    }
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleNavClick = (id: string) => {
    if (id === 'brain') setViewState('chat');
    else setViewState('overview');
  };

  const handleNavigation = (id: string, href: string) => {
    handleNavClick(id);
    router.push(href);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid, href: '/' },
    { id: 'brain', label: 'Brain', icon: MessageSquare, href: '/brain' },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/calendar' },
    { id: 'production', label: 'Production', icon: FolderKanban, href: '/crm' },
    { id: 'finance', label: 'Finance', icon: Wallet, href: '/finance' },
  ];

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <motion.aside
      initial={false}
      className={cn(
        "liquid-panel h-full w-[88px] relative z-50 flex flex-col transition-colors duration-500 !p-0",
        "!bg-[var(--sidebar-bg)] backdrop-blur-xl backdrop-saturate-150"
      )}
    >
      <div className="py-4 flex flex-col h-full">
        {/* User Account Section - Top */}
        <div ref={accountRef} className="px-3 mb-6 relative">
          <motion.button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            onMouseEnter={() => setHoveredId('account')}
            onMouseLeave={() => setHoveredId(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
            className={cn(
              "w-full h-14 flex items-center justify-center rounded-xl transition-all duration-200",
              isAccountOpen 
                ? "liquid-panel active-glass !rounded-xl" 
                : "hover:bg-[var(--glass-bg-hover)]"
            )}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-ink/10 flex items-center justify-center ring-2 ring-[var(--glass-border)]">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.fullName || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-ink">{initials}</span>
              )}
            </div>
          </motion.button>

          {/* Account Tooltip */}
          <AnimatePresence>
            {hoveredId === 'account' && !isAccountOpen && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={springConfig}
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-ink/90 text-[var(--background)] text-xs font-medium rounded-full pointer-events-none whitespace-nowrap shadow-xl z-[60]"
              >
                Account
              </motion.div>
            )}
          </AnimatePresence>

          {/* Account Dropdown */}
          <AnimatePresence>
            {isAccountOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                transition={springConfig}
                className="absolute left-full top-0 ml-3 w-64 liquid-panel p-2 z-[60]"
              >
                {/* User Info */}
                <div className="px-3 py-3 border-b border-[var(--glass-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-ink/10 flex items-center justify-center shrink-0">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-ink-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Workspace Indicator */}
                  {workspaceName && (
                    <div className="mt-3 px-2 py-1.5 rounded-lg bg-ink/[0.03] border border-[var(--glass-border)]">
                      <p className="text-[10px] text-ink-muted/70 uppercase tracking-wider mb-0.5">
                        Workspace
                      </p>
                      <p className="text-xs font-medium text-ink truncate">
                        {workspaceName}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setIsAccountOpen(false);
                      router.push('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-ink-muted hover:text-ink hover:bg-ink/5
                      transition-colors text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-ink-muted hover:text-red-600 hover:bg-red-500/5
                        transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logo / Brand */}
        <div className="mb-6 h-12 w-full flex items-center justify-center shrink-0">
          <div
            onClick={() => handleNavigation('overview', '/')}
            className="w-10 h-10 rounded-xl bg-ink hover:scale-105 cursor-pointer transition-transform shadow-lg flex items-center justify-center"
          >
            <div className="w-3 h-3 rounded-full bg-[var(--background)]" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-3 w-full">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.id === 'overview' && pathname === '/');

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "group relative flex items-center h-12 rounded-xl transition-all duration-200 overflow-hidden",
                  isActive
                    ? "liquid-panel active-glass !rounded-xl text-ink"
                    : "text-ink-muted hover:text-ink hover:bg-[var(--glass-bg-hover)]"
                )}
                aria-label={item.label}
              >
                <div className="w-[62px] flex items-center justify-center shrink-0">
                  <item.icon
                    size={22}
                    strokeWidth={1.5}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-ink" : "text-ink-muted group-hover:text-ink"
                    )}
                  />
                </div>

                <AnimatePresence>
                  {hoveredId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={springConfig}
                      className="absolute left-full ml-3 px-3 py-1.5 bg-ink/90 text-[var(--background)] text-xs font-medium rounded-full pointer-events-none whitespace-nowrap shadow-xl z-[60]"
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto px-3 shrink-0 flex flex-col gap-2">
          <button
            onClick={cycleTheme}
            onMouseEnter={() => setHoveredId('theme')}
            onMouseLeave={() => setHoveredId(null)}
            className="relative w-full h-12 flex items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <div className="relative w-5 h-5">
              {!isMounted ? (
                <SunMoon className="absolute inset-0" />
              ) : theme === 'system' ? (
                <SunMoon className="absolute inset-0" />
              ) : resolvedTheme === 'light' ? (
                <Sun className="absolute inset-0" />
              ) : (
                <Moon className="absolute inset-0" />
              )}
            </div>
            
            <AnimatePresence>
              {hoveredId === 'theme' && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={springConfig}
                  className="absolute left-full ml-3 px-3 py-1.5 bg-ink/90 text-[var(--background)] text-xs font-medium rounded-full pointer-events-none whitespace-nowrap shadow-xl z-[60]"
                >
                  {!isMounted ? 'Theme' : theme === 'system' ? 'System' : resolvedTheme === 'light' ? 'Light' : 'Dark'}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <button 
            onClick={() => router.push('/settings')}
            onMouseEnter={() => setHoveredId('settings')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "relative w-full h-12 flex items-center justify-center rounded-xl transition-colors",
              pathname === '/settings' 
                ? "liquid-panel active-glass !rounded-xl text-ink" 
                : "text-ink-muted hover:text-ink hover:bg-ink/5"
            )}
          >
            <Settings size={22} strokeWidth={1.5} />
            
            <AnimatePresence>
              {hoveredId === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={springConfig}
                  className="absolute left-full ml-3 px-3 py-1.5 bg-ink/90 text-[var(--background)] text-xs font-medium rounded-full pointer-events-none whitespace-nowrap shadow-xl z-[60]"
                >
                  Settings
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
