/**
 * Sign Up Page
 * Convenience route that shows the unified auth form in signup mode
 * @module app/(auth)/signup
 */

import { SmartLoginForm } from '@/features/auth/smart-login';

export const metadata = {
  title: 'Create Account | Signal',
  description: 'Create your Signal workspace',
};

interface SignUpPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { redirect } = await searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas relative">
      {/* Ambient Background - Matches site-wide aesthetic */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Grain texture overlay */}
        <div className="absolute inset-0 grain-overlay" />
        
        {/* Soft ambient orbs using design system colors */}
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-accent-sage/10 blur-[150px] dark:bg-accent-sage/5"
        />
        <div 
          className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-accent-clay/10 blur-[150px] dark:bg-accent-clay/5"
        />
        <div 
          className="absolute -bottom-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-silk/5 blur-[120px]"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full">
        <SmartLoginForm redirectTo={redirect} defaultMode="signup" />
      </div>
    </div>
  );
}
