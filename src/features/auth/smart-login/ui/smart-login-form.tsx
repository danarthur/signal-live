/**
 * Smart Login Form
 * Unified authentication - Sign In / Create Account toggle
 * Liquid Japandi design matching Signal aesthetic
 * @module features/auth/smart-login/ui/smart-login-form
 */

'use client';

import { useActionState, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { signInAction, signUpAction } from '../api/actions';
import type { AuthState, AuthMode } from '../model/types';

const initialState: AuthState = {
  status: 'idle',
  message: null,
  error: null,
  redirect: null,
};

// Loading messages for sign in
const signInMessages = [
  'Authenticating...',
  'Restoring context...',
  'Loading your world...',
];

// Loading messages for sign up
const signUpMessages = [
  'Creating your account...',
  'Preparing your workspace...',
  'Almost there...',
];

interface SmartLoginFormProps {
  redirectTo?: string;
  defaultMode?: AuthMode;
}

export function SmartLoginForm({ redirectTo, defaultMode = 'signin' }: SmartLoginFormProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [signInState, signInFormAction, isSigningIn] = useActionState(signInAction, initialState);
  const [signUpState, signUpFormAction, isSigningUp] = useActionState(signUpAction, initialState);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  // Track form field values for "ready" state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const isPending = isSigningIn || isSigningUp;
  const currentState = mode === 'signin' ? signInState : signUpState;
  const loadingMessages = mode === 'signin' ? signInMessages : signUpMessages;
  
  // Check if form is complete based on mode
  const isFormComplete = mode === 'signin'
    ? email.trim().length > 0 && password.length >= 6
    : fullName.trim().length >= 2 && email.trim().length > 0 && password.length >= 8;
  
  const springConfig = { type: 'spring', stiffness: 300, damping: 30 } as const;
  
  // Cycle through loading messages
  useEffect(() => {
    if (!isPending) {
      setLoadingMessageIndex(0);
      return;
    }
    
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);
    
    return () => clearInterval(interval);
  }, [isPending, loadingMessages.length]);
  
  // Reset state when switching modes
  const handleModeSwitch = (newMode: AuthMode) => {
    if (!isPending) {
      setMode(newMode);
      setShowPassword(false);
      // Keep email but reset other fields when switching
      setPassword('');
      if (newMode === 'signin') {
        setFullName('');
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springConfig}
      className="w-full max-w-md mx-auto"
    >
      {/* Liquid Panel Card */}
      <div className="liquid-panel p-8 md:p-10 relative overflow-hidden">
        {/* Internal noise texture */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo / Brand Mark */}
            <motion.div
              animate={isPending ? { 
                opacity: [0.7, 1, 0.7],
              } : {}}
              transition={{ 
                duration: 2,
                repeat: isPending ? Infinity : 0,
                ease: 'easeInOut',
              }}
              className="w-12 h-12 mx-auto mb-5 rounded-2xl bg-silk/20 border border-[var(--glass-border)] flex items-center justify-center"
            >
              <span className="text-xl font-light text-walnut tracking-tight">D</span>
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-light text-ink tracking-tight">
                  {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isPending ? loadingMessageIndex : `${mode}-default`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-ink-muted mt-1.5"
                  >
                    {isPending 
                      ? loadingMessages[loadingMessageIndex] 
                      : mode === 'signin' 
                        ? 'Sign in to your workspace'
                        : 'Join Signal in seconds'
                    }
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-1 p-1 mb-6 rounded-xl bg-ink/[0.03] border border-[var(--glass-border)]">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              disabled={isPending}
              className={`
                flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
                disabled:cursor-not-allowed
                ${mode === 'signin'
                  ? 'bg-canvas shadow-sm text-ink'
                  : 'text-ink-muted hover:text-ink'
                }
              `}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              disabled={isPending}
              className={`
                flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
                disabled:cursor-not-allowed
                ${mode === 'signup'
                  ? 'bg-canvas shadow-sm text-ink'
                  : 'text-ink-muted hover:text-ink'
                }
              `}
            >
              Create Account
            </button>
          </div>
          
          {/* Form */}
          <form 
            action={mode === 'signin' ? signInFormAction : signUpFormAction} 
            className="space-y-5"
          >
            {/* Hidden redirect field */}
            {redirectTo && (
              <input type="hidden" name="redirect" value={redirectTo} />
            )}
            
            {/* Name Field (Sign Up Only) */}
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="fullName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springConfig}
                  className="overflow-hidden"
                >
                  <div className="pb-0">
                    <label 
                      htmlFor="fullName" 
                      className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      disabled={isPending}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl
                        bg-canvas/50 border border-[var(--glass-border)]
                        text-ink placeholder:text-muted-foreground
                        focus:outline-none focus:border-[var(--glass-border-hover)] focus:ring-2 focus:ring-ring/30
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200"
                      placeholder="Your full name"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl
                  bg-canvas/50 border border-[var(--glass-border)]
                  text-ink placeholder:text-muted-foreground
                  focus:outline-none focus:border-[var(--glass-border-hover)] focus:ring-2 focus:ring-ring/30
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>
            
            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 pr-11 rounded-xl
                    bg-canvas/50 border border-[var(--glass-border)]
                    text-ink placeholder:text-muted-foreground
                    focus:outline-none focus:border-[var(--glass-border-hover)] focus:ring-2 focus:ring-ring/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200"
                  placeholder={mode === 'signin' ? 'Your password' : 'Create a secure password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute right-1 top-1/2 -translate-y-1/2 
                    w-9 h-9 rounded-lg flex items-center justify-center
                    text-ink-muted hover:text-ink hover:bg-stone/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Password requirements hint for signup */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] text-ink-muted/60 mt-1.5"
                  >
                    Must contain at least 8 characters, one uppercase letter, and one number
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            {/* Error Message */}
            <AnimatePresence>
              {currentState.status === 'error' && currentState.error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={springConfig}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                      {currentState.error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isPending}
              whileHover={{ scale: isPending ? 1 : 1.01 }}
              whileTap={{ scale: isPending ? 1 : 0.99 }}
              animate={isFormComplete && !isPending ? {
                boxShadow: [
                  '0 0 0 0 rgba(139, 90, 43, 0)',
                  '0 0 0 4px rgba(139, 90, 43, 0.15)',
                  '0 0 0 0 rgba(139, 90, 43, 0)',
                ],
              } : {}}
              transition={isFormComplete ? {
                boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                ...springConfig,
              } : springConfig}
              className={`w-full h-12 rounded-xl font-medium text-sm
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-300
                flex items-center justify-center gap-2.5
                ${mode === 'signup' 
                  ? isFormComplete
                    ? 'bg-walnut text-canvas shadow-lg shadow-walnut/25 ring-2 ring-walnut/20' 
                    : 'bg-walnut/60 text-canvas/80'
                  : isFormComplete
                    ? 'bg-ink text-canvas shadow-lg shadow-ink/20'
                    : 'bg-ink/60 text-canvas/80'
                }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Sparkles className={`w-4 h-4 ${isFormComplete ? 'animate-pulse' : ''}`} />
                  <span>Get Started</span>
                </>
              )}
            </motion.button>
          </form>
          
          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-[var(--glass-border)]">
            <p className="text-[11px] text-center text-ink-muted/60 uppercase tracking-widest">
              Signal
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
