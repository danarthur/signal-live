import Link from 'next/link';
import { createClient } from '@/shared/api/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Signal Initializing — Marketing landing page.
 * Authenticated users are redirected to /lobby.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/lobby');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-canvas text-ink">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-accent-sage/10 blur-[120px] dark:bg-accent-sage/5" />
        <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-accent-clay/10 blur-[120px] dark:bg-accent-clay/5" />
      </div>

      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-ink mb-3">
          Signal
        </h1>
        <p className="text-lg md:text-xl text-ink-muted font-light mb-2">
          Initializing
        </p>
        <p className="text-sm text-ink-muted/80 font-light mb-12 max-w-md mx-auto">
          The Event Operating System
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/login"
            className="liquid-panel px-6 py-3 rounded-xl text-sm font-medium text-ink hover:bg-[var(--glass-bg-hover)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="liquid-panel px-6 py-3 rounded-xl text-sm font-medium text-ink border border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)] transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
