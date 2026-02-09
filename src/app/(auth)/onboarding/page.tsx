/**
 * Onboarding Wizard Page
 * Streamlined 2-step setup flow for new users
 * @module app/(auth)/onboarding
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/shared/api/supabase/server';
import { OnboardingWizard } from './components/onboarding-wizard';

export const metadata = {
  title: 'Welcome to DanielOS',
  description: 'Set up your DanielOS workspace',
};

export const dynamic = 'force-dynamic';

async function getOnboardingState() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Fetch profile - use maybeSingle() to handle case where profile doesn't exist yet
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  
  if (profileError) {
    console.error('[Onboarding] Profile fetch error:', profileError);
  }
  
  // If onboarding is already complete, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect('/');
  }
  
  // Fetch existing workspaces - don't use single() since user might have 0 or many
  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      workspaces:workspace_id (id, name)
    `)
    .eq('user_id', user.id);
  
  if (workspaceError) {
    console.error('[Onboarding] Workspace fetch error:', workspaceError);
  }
  
  // Get the full name from profile, or fallback to auth user metadata
  const fullName = profile?.full_name 
    || user.user_metadata?.full_name 
    || user.user_metadata?.name 
    || '';
  
  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    profile: {
      fullName,
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      onboardingStep: profile?.onboarding_step || 0,
    },
    hasWorkspace: (workspaces?.length || 0) > 0,
    workspaceId: workspaces?.[0]?.workspace_id || null,
    workspaceName: (workspaces?.[0]?.workspaces as unknown as { name: string } | null)?.name ?? null,
  };
}

export default async function OnboardingPage() {
  const state = await getOnboardingState();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 grain-overlay" />
        <div 
          className="absolute -top-[25%] -left-[15%] w-[65vw] h-[65vw] rounded-full blur-[160px] opacity-50 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, oklch(0.85 0.05 90) 0%, transparent 70%)',
            animationDuration: '8s',
          }}
        />
        <div 
          className="absolute top-[15%] -right-[20%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-35 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, oklch(0.75 0.07 50) 0%, transparent 70%)',
            animationDuration: '10s',
            animationDelay: '2s',
          }}
        />
        <div 
          className="absolute -bottom-[15%] left-[15%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, oklch(0.70 0.06 160) 0%, transparent 70%)',
            animationDuration: '12s',
            animationDelay: '4s',
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-xl">
        <OnboardingWizard initialState={state} />
      </div>
    </div>
  );
}
