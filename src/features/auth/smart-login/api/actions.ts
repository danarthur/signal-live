/**
 * Smart Login Feature - Server Actions
 * Production-grade authentication with state restoration
 * @module features/auth/smart-login/api/actions
 */

'use server';

import { createClient } from '@/shared/api/supabase/server';
import { redirect } from 'next/navigation';
import { loginSchema, signupSchema } from '../model/schema';
import type { AuthState, ProfileStatus } from '../model/types';

const initialState: AuthState = {
  status: 'idle',
  message: null,
  error: null,
  redirect: null,
};

/**
 * Creates a new user account and redirects to onboarding
 * 
 * Flow:
 * 1. Validate input (email, password, name)
 * 2. Create user in Supabase Auth
 * 3. Profile is auto-created by database trigger
 * 4. Redirect to /onboarding
 */
export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Parse and validate input
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      message: null,
      error: parsed.error.issues[0]?.message || 'Invalid input',
      redirect: null,
    };
  }

  const { email, password, fullName } = parsed.data;

  // Create user in Supabase Auth
  const supabase = await createClient();
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    // Handle specific error cases
    if (authError.message.includes('already registered')) {
      return {
        status: 'error',
        message: null,
        error: 'An account with this email already exists. Try signing in instead.',
        redirect: null,
      };
    }
    
    return {
      status: 'error',
      message: null,
      error: authError.message || 'Failed to create account',
      redirect: null,
    };
  }

  if (!authData.user) {
    return {
      status: 'error',
      message: null,
      error: 'Failed to create account',
      redirect: null,
    };
  }

  // Note: Profile is automatically created by database trigger (handle_new_user)
  // The trigger populates: id, email, full_name from auth user metadata
  
  // Redirect to onboarding to complete setup
  redirect('/onboarding');
}

/**
 * Authenticates user and redirects based on onboarding status
 * 
 * Flow:
 * 1. Validate credentials
 * 2. Authenticate with Supabase
 * 3. Check profile.onboarding_completed
 * 4. Redirect to /onboarding or /dashboard
 */
export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Parse and validate input
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      message: null,
      error: parsed.error.issues[0]?.message || 'Invalid input',
      redirect: null,
    };
  }

  const { email, password } = parsed.data;

  // Authenticate with Supabase
  const supabase = await createClient();
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      status: 'error',
      message: null,
      error: authError?.message || 'Authentication failed',
      redirect: null,
    };
  }

  // Check profile status for routing
  const profileStatus = await checkProfileStatus(supabase, authData.user.id);

  // Determine redirect destination
  let redirectPath: string;
  
  if (!profileStatus.exists || !profileStatus.onboardingCompleted) {
    redirectPath = '/onboarding';
  } else {
    // Check if there was a redirect parameter in the original request
    const intendedPath = formData.get('redirect') as string;
    redirectPath = intendedPath && intendedPath !== '/login' ? intendedPath : '/lobby';
  }

  // Return success state with redirect info before actual redirect
  // The redirect happens after the client receives this response
  redirect(redirectPath);
}

/**
 * Checks if user profile exists and onboarding is complete
 */
async function checkProfileStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ProfileStatus> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return {
      exists: false,
      onboardingCompleted: false,
      fullName: null,
    };
  }

  return {
    exists: true,
    onboardingCompleted: profile.onboarding_completed || false,
    fullName: profile.full_name,
  };
}

/**
 * Signs out the current user and redirects to login
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Non-redirect version for client-side use
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
