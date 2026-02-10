/**
 * Settings Content Component
 * Main settings interface with profile, team, and integrations management
 * @module app/(dashboard)/settings/components/settings-content
 */

'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Building2, 
  Plug2, 
  Camera, 
  Check, 
  X, 
  Loader2,
  ExternalLink,
  Sparkles,
  Copy,
  RefreshCw,
  MapPin,
  Plus,
  Clock,
} from 'lucide-react';
import { updateProfile, uploadAvatar } from '@/features/identity-hydration';
import { QboConnectCard } from '@/features/auth/qbo-connect/ui/connect-card';
import { TeamManagement } from './team-management';
import { usePreferences } from '@/shared/ui/providers/PreferencesContext';
import { CeramicSwitch } from '@/shared/ui/switch';
import type { WorkspaceMemberData, LocationData } from '@/app/actions/workspace';

interface SettingsData {
  user: {
    id: string;
    email: string;
  };
  profile: {
    fullName: string;
    avatarUrl: string | null;
  };
  workspace: {
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    inviteCode: string | null;
  } | null;
  integrations: {
    quickbooks: boolean;
    qboRealmId?: string | null;
  };
  members: WorkspaceMemberData[];
  locations: LocationData[];
}

interface SettingsContentProps {
  data: SettingsData;
  searchParams?: { success?: string; error?: string };
}

export function SettingsContent({ data, searchParams }: SettingsContentProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { militaryTime, setMilitaryTime } = usePreferences();
  
  // Profile state
  const [fullName, setFullName] = useState(data.profile.fullName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(data.profile.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams?.error === 'qbo_auth_failed' ? 'QuickBooks authorization failed. Try again.' : null
  );
  
  const springConfig = { type: 'spring', stiffness: 300, damping: 30 } as const;
  
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
  
  const handleSaveProfile = () => {
    setError(null);
    setProfileSaved(false);
    
    startTransition(async () => {
      const result = await updateProfile({ fullName: fullName.trim() });
      
      if (result.success) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      } else {
        setError(result.error || 'Failed to save profile');
      }
    });
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.1 }}
      >
        <h1 className="text-3xl font-light text-ink tracking-tight">Kit</h1>
        <p className="text-sm text-ink-muted font-light mt-1">
          Tune your account and integrations
        </p>
</motion.div>

      {/* Preferences Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.12 }}
        className="liquid-panel p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center">
            <Clock className="w-5 h-5 text-ink-muted" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Preferences</h2>
            <p className="text-xs text-ink-muted">Site-wide display and time options</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-ink/[0.02] border border-[var(--glass-border)]">
          <div>
            <p className="text-sm font-medium text-ink">Use 24-hour time</p>
            <p className="text-xs text-ink-muted mt-0.5">Show times as 14:30 instead of 2:30 PM across the app</p>
          </div>
          <CeramicSwitch
            checked={militaryTime}
            onCheckedChange={setMilitaryTime}
            aria-label="Use 24-hour time"
          />
        </div>
      </motion.section>

      {/* Profile Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.15 }}
        className="liquid-panel p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center">
            <User className="w-5 h-5 text-ink-muted" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Profile</h2>
            <p className="text-xs text-ink-muted">Your personal information</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-[auto,1fr] gap-6 items-start">
          {/* Avatar */}
          <div className="relative group mx-auto md:mx-0">
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
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--glass-border)] 
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
                <div className="flex flex-col items-center gap-1">
                  <User className="w-8 h-8 text-ink-muted/50" />
                  <span className="text-[9px] text-ink-muted/50 uppercase tracking-wider">
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
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white
                  flex items-center justify-center opacity-0 group-hover:opacity-100
                  transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Profile Form */}
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-[0.15em] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl
                  bg-ink/[0.03] border border-[var(--glass-border)]
                  text-ink placeholder:text-ink-muted/40
                  focus:outline-none focus:border-walnut/40 focus:ring-2 focus:ring-walnut/10
                  transition-all duration-300"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-[0.15em] mb-2">
                Email
              </label>
              <div className="px-4 py-3 rounded-xl bg-ink/[0.02] border border-[var(--glass-border)] 
                text-ink-muted text-sm">
                {data.user.email}
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <motion.button
                onClick={handleSaveProfile}
                disabled={isPending || fullName === data.profile.fullName}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springConfig}
                className="px-5 py-2.5 rounded-xl bg-ink text-canvas text-sm font-medium
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Locking...
                  </>
                ) : (
                  'Lock'
                )}
              </motion.button>
              
              <AnimatePresence>
                {profileSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-1.5 text-emerald-600 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.section>
      
      {/* Workspace Section */}
      {data.workspace && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.2 }}
          className="liquid-panel p-6 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-ink-muted" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-ink">Workspace</h2>
              <p className="text-xs text-ink-muted">Your current workspace</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-ink/[0.02] border border-[var(--glass-border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ink font-medium">{data.workspace.name}</p>
                <p className="text-xs text-ink-muted mt-0.5 capitalize">
                  Role: {data.workspace.role}
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
          
          {/* Invite Code - Owners/Admins Only */}
          {(data.workspace.role === 'owner' || data.workspace.role === 'admin') && data.workspace.inviteCode && (
            <div className="p-4 rounded-xl bg-walnut/5 border border-walnut/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
                    Invite Code
                  </p>
                  <p className="text-lg font-mono font-medium text-walnut tracking-widest">
                    {data.workspace.inviteCode}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(data.workspace!.inviteCode!);
                  }}
                  className="p-2.5 rounded-xl bg-walnut/10 hover:bg-walnut/20 text-walnut transition-colors"
                  title="Copy invite code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-2">
                Share this code with team members to invite them
              </p>
            </div>
          )}
          
          {/* Locations */}
          {data.locations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-ink-muted" />
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                  Locations
                </span>
              </div>
              <div className="space-y-2">
                {data.locations.map((location) => (
                  <div 
                    key={location.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.02] border border-[var(--glass-border)]"
                  >
                    <div className={`w-2 h-2 rounded-full ${location.isPrimary ? 'bg-emerald-500' : 'bg-ink/20'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-ink">{location.name}</p>
                      {location.address && (
                        <p className="text-xs text-ink-muted">{location.address}</p>
                      )}
                    </div>
                    {location.isPrimary && (
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      )}
      
      {/* Team Management Section */}
      {data.workspace && data.members.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.22 }}
          className="liquid-panel p-6"
        >
          <TeamManagement 
            workspaceId={data.workspace.id}
            members={data.members}
            currentUserRole={data.workspace.role}
          />
        </motion.section>
      )}
      
      {/* Integrations Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.25 }}
        className="liquid-panel p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center">
            <Plug2 className="w-5 h-5 text-ink-muted" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Integrations</h2>
            <p className="text-xs text-ink-muted">Connect external services</p>
          </div>
        </div>
        
        {searchParams?.success === 'true' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <Check className="w-4 h-4" />
            QuickBooks connected successfully
          </motion.div>
        )}
        <div className="space-y-4">
          {/* QuickBooks Integration (QBO Connect) */}
          {data.workspace ? (
            <QboConnectCard
              workspaceId={data.workspace.id}
              isConnected={data.integrations.quickbooks}
              realmId={data.integrations.qboRealmId ?? null}
            />
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Set up a workspace first to enable integrations
              </p>
            </div>
          )}
          
          {/* Placeholder for future integrations */}
          <div className="p-4 rounded-xl bg-ink/[0.02] border border-dashed border-[var(--glass-border)]">
            <div className="flex items-center gap-4 opacity-40">
              <div className="w-10 h-10 rounded-lg bg-ink/5 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-ink-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">More Integrations</p>
                <p className="text-xs text-ink-muted">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
      
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springConfig}
            className="p-4 rounded-xl bg-red-500/5 border border-red-500/15"
          >
            <p className="text-sm text-red-600 dark:text-red-400 text-center font-light">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
