/**
 * Onboarding Wizard Component
 * Streamlined 2-step setup: Identity + Workspace
 * @module app/(auth)/onboarding/components/onboarding-wizard
 */

'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Users,
  X,
  Camera,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { 
  updateProfile, 
  updateOnboardingStep, 
  completeOnboarding,
  joinWorkspace,
  uploadAvatar,
} from '@/features/identity-hydration';
import { setupInitialWorkspace } from '@/app/actions/workspace';
import { signOutAction } from '@/features/auth/smart-login';

interface OnboardingState {
  user: { id: string; email: string };
  profile: {
    fullName: string;
    avatarUrl: string | null;
    onboardingStep: number;
  };
  hasWorkspace: boolean;
  workspaceId: string | null;
  workspaceName: string | null;
}

interface OnboardingWizardProps {
  initialState: OnboardingState;
}

const STEPS = [
  { id: 'profile', title: 'Identity', description: 'Who you are', icon: User },
  { id: 'workspace', title: 'Workspace', description: 'Your command center', icon: Building2 },
];

export function OnboardingWizard({ initialState }: OnboardingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine starting step:
  // - If user already has a full name (from signup), skip to workspace step (1)
  // - Otherwise, use the saved onboarding step
  const computeInitialStep = () => {
    // If user already has a name and workspace, they're done
    if (initialState.profile.fullName && initialState.hasWorkspace) {
      return STEPS.length - 1; // Last step
    }
    // If user has a name but no workspace, go to workspace step
    if (initialState.profile.fullName && initialState.profile.onboardingStep === 0) {
      return 1; // Workspace step
    }
    // Otherwise use saved progress
    return Math.min(initialState.profile.onboardingStep, STEPS.length - 1);
  };
  
  // Local state
  const [currentStep, setCurrentStep] = useState(computeInitialStep);
  const [fullName, setFullName] = useState(initialState.profile.fullName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialState.profile.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<'create' | 'join' | null>(
    initialState.hasWorkspace ? null : null
  );
  const [workspaceName, setWorkspaceName] = useState(initialState.workspaceName || '');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasWorkspace, setHasWorkspace] = useState(initialState.hasWorkspace);
  
  const springConfig = { type: 'spring', stiffness: 300, damping: 30 } as const;
  
  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAvatarUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    const result = await uploadAvatar(formData);
    
    if (result.success && result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
    } else {
      setError(result.error || 'Failed to upload avatar');
    }
    
    setAvatarUploading(false);
  };
  
  const handleNext = async () => {
    setError(null);
    
    startTransition(async () => {
      // Step-specific validation and actions
      if (currentStep === 0) {
        // Step 1: Save profile
        if (!fullName.trim()) {
          setError('Please enter your name to continue');
          return;
        }
        
        const result = await updateProfile({ fullName: fullName.trim() });
        if (!result.success) {
          setError(result.error || 'Failed to save profile');
          return;
        }
      }
      
      if (currentStep === 1) {
        // Step 2: Create or join workspace, then complete
        if (!hasWorkspace) {
          if (workspaceMode === 'create') {
            if (!workspaceName.trim()) {
              setError('Please name your workspace');
              return;
            }
            
            // Use setupInitialWorkspace to create workspace with default location
            const result = await setupInitialWorkspace(workspaceName.trim());
            if (!result.success) {
              setError(result.error || 'Failed to create workspace');
              return;
            }
            
            setHasWorkspace(true);
          } else if (workspaceMode === 'join') {
            if (!inviteCode.trim()) {
              setError('Please enter an invite code');
              return;
            }
            
            const result = await joinWorkspace(inviteCode.trim());
            if (!result.success) {
              setError(result.error || 'Invalid invite code');
              return;
            }
            
            setHasWorkspace(true);
            setWorkspaceName(result.workspace?.name || '');
          } else {
            setError('Choose to create or join a workspace');
            return;
          }
        }
        
        // Complete onboarding after workspace setup
        await completeOnboarding();
        router.push('/');
        return;
      }
      
      // Move to next step
      const nextStep = currentStep + 1;
      if (nextStep < STEPS.length) {
        await updateOnboardingStep(nextStep);
        setCurrentStep(nextStep);
      }
    });
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Header with Progress */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.1 }}
        className="text-center"
      >
        <h1 className="text-3xl font-light text-ink tracking-tight mb-2">
          Initializing DanielOS
        </h1>
        <p className="text-sm text-ink-muted font-light">
          Setting up your personal operating system
        </p>
      </motion.div>
      
      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.15 }}
        className="flex items-center justify-center gap-3"
      >
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.08 : 1,
                }}
                transition={springConfig}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center
                    transition-all duration-500
                    ${isCompleted 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                      : isActive 
                        ? 'bg-ink text-canvas shadow-lg shadow-ink/20' 
                        : 'bg-ink/5 border border-[var(--glass-border)] text-ink-muted/50'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`
                  text-[10px] font-medium uppercase tracking-wider
                  ${isActive ? 'text-ink' : 'text-ink-muted/50'}
                `}>
                  {step.title}
                </span>
              </motion.div>
              
              {index < STEPS.length - 1 && (
                <div className={`
                  w-10 h-[2px] mx-2 rounded-full
                  ${index < currentStep ? 'bg-emerald-500/50' : 'bg-ink/10'}
                  transition-colors duration-500
                `} />
              )}
            </div>
          );
        })}
      </motion.div>
      
      {/* Step Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.2 }}
        className="liquid-panel p-8"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Identity */}
          {currentStep === 0 && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={springConfig}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-xl font-light text-ink tracking-tight">
                  Hello, let's get acquainted
                </h2>
                <p className="text-sm text-ink-muted mt-1.5 font-light">
                  How should the system address you?
                </p>
              </div>
              
              {/* Avatar Upload */}
              <div className="flex justify-center">
                <div className="relative group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springConfig}
                    className="w-28 h-28 rounded-2xl border-2 border-dashed border-[var(--glass-border)] 
                      hover:border-walnut/40 bg-ink/[0.02] flex items-center justify-center
                      transition-all duration-300 overflow-hidden relative"
                  >
                    {avatarUrl ? (
                      <>
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 
                          transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-canvas" />
                        </div>
                      </>
                    ) : avatarUploading ? (
                      <Loader2 className="w-8 h-8 text-ink-muted animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <User className="w-8 h-8 text-ink-muted/50" />
                        <span className="text-[10px] text-ink-muted/50 uppercase tracking-wider">
                          Avatar
                        </span>
                      </div>
                    )}
                  </motion.button>
                  
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarUrl(null);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white
                        flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100
                        transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Name Input */}
              <div className="max-w-sm mx-auto">
                <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-[0.15em] mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3.5 rounded-xl text-center
                    bg-ink/[0.03] border border-[var(--glass-border)]
                    text-ink placeholder:text-ink-muted/40 text-lg font-light
                    focus:outline-none focus:border-walnut/40 focus:ring-2 focus:ring-walnut/10
                    transition-all duration-300"
                />
              </div>
              
              {/* Email Display */}
              <div className="max-w-sm mx-auto">
                <div className="px-4 py-3 rounded-xl bg-ink/[0.02] border border-[var(--glass-border)] 
                  text-ink-muted text-center text-sm">
                  {initialState.user.email}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Workspace */}
          {currentStep === 1 && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={springConfig}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-light text-ink tracking-tight">
                  {hasWorkspace ? 'Workspace Ready' : 'Create Your Command Center'}
                </h2>
                <p className="text-sm text-ink-muted mt-1.5 font-light">
                  {hasWorkspace 
                    ? `Connected to "${workspaceName || 'your workspace'}"`
                    : 'A workspace is where your team collaborates'
                  }
                </p>
              </div>
              
              {hasWorkspace ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springConfig}
                  className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-lg font-medium text-emerald-700 dark:text-emerald-400">
                    {workspaceName || 'Workspace'}
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 uppercase tracking-wider">
                    Ready to use
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Create / Join Toggle */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setWorkspaceMode('create')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={springConfig}
                      className={`
                        p-5 rounded-xl border-2 transition-all duration-300
                        ${workspaceMode === 'create'
                          ? 'border-walnut bg-walnut/5 shadow-lg'
                          : 'border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
                        }
                      `}
                    >
                      <Plus className={`w-7 h-7 mx-auto mb-2.5 ${workspaceMode === 'create' ? 'text-walnut' : 'text-ink-muted'}`} />
                      <p className={`text-sm font-medium ${workspaceMode === 'create' ? 'text-walnut' : 'text-ink'}`}>
                        Create New
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">Start fresh</p>
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => setWorkspaceMode('join')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={springConfig}
                      className={`
                        p-5 rounded-xl border-2 transition-all duration-300
                        ${workspaceMode === 'join'
                          ? 'border-walnut bg-walnut/5 shadow-lg'
                          : 'border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
                        }
                      `}
                    >
                      <Users className={`w-7 h-7 mx-auto mb-2.5 ${workspaceMode === 'join' ? 'text-walnut' : 'text-ink-muted'}`} />
                      <p className={`text-sm font-medium ${workspaceMode === 'join' ? 'text-walnut' : 'text-ink'}`}>
                        Join Team
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">With invite code</p>
                    </motion.button>
                  </div>
                  
                  {/* Conditional Forms */}
                  <AnimatePresence mode="wait">
                    {workspaceMode === 'create' && (
                      <motion.div
                        key="create-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={springConfig}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-[0.15em] mb-2">
                            Workspace Name
                          </label>
                          <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder="Your company or team name"
                            className="w-full px-4 py-3.5 rounded-xl
                              bg-ink/[0.03] border border-[var(--glass-border)]
                              text-ink placeholder:text-ink-muted/40
                              focus:outline-none focus:border-walnut/40 focus:ring-2 focus:ring-walnut/10
                              transition-all duration-300"
                          />
                        </div>
                      </motion.div>
                    )}
                    
                    {workspaceMode === 'join' && (
                      <motion.div
                        key="join-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={springConfig}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-[0.15em] mb-2">
                            Invite Code
                          </label>
                          <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="Enter your invite code"
                            className="w-full px-4 py-3.5 rounded-xl font-mono text-center tracking-widest
                              bg-ink/[0.03] border border-[var(--glass-border)]
                              text-ink placeholder:text-ink-muted/40
                              focus:outline-none focus:border-walnut/40 focus:ring-2 focus:ring-walnut/10
                              transition-all duration-300"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springConfig}
              className="mt-6 p-4 rounded-xl bg-red-500/5 border border-red-500/15"
            >
              <p className="text-sm text-red-600 dark:text-red-400 text-center font-light">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--glass-border)]">
          {currentStep > 0 ? (
            <motion.button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={springConfig}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                text-ink-muted hover:text-ink
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </motion.button>
          ) : (
            <div />
          )}
          
          <motion.button
            type="button"
            onClick={handleNext}
            disabled={isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
              shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all
              ${currentStep === STEPS.length - 1 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/25' 
                : 'bg-ink text-canvas hover:opacity-90 shadow-ink/15'
              }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep === STEPS.length - 1 ? 'Launching...' : 'Processing...'}
              </>
            ) : currentStep === STEPS.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Launch DanielOS
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
      
      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...springConfig, delay: 0.4 }}
        className="text-center space-y-3"
      >
        <p className="text-xs text-ink-muted/40 font-light">
          DanielOS • Post-Enterprise Operating System
        </p>
        
        {/* Sign Out Option */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-xs text-ink-muted/60 hover:text-ink-muted hover:bg-ink/5
              transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign out and use a different account</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
