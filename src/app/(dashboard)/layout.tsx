/**
 * Dashboard Layout
 * Protected layout with sidebar navigation and workspace context
 * @module app/(dashboard)/layout
 */

import { createClient } from "@/shared/api/supabase/server";
import { SidebarWithUser } from "@/shared/ui/layout/SidebarWithUser";
import { WorkspaceProvider, type WorkspaceRole } from "@/shared/ui/providers/WorkspaceProvider";
import { PreferencesProvider } from "@/shared/ui/providers/PreferencesContext";
import { SystemHeartProvider } from "@/shared/ui/providers/SystemHeartContext";

/** Dashboard uses cookies (Supabase auth) — always render on the server. */
export const dynamic = 'force-dynamic';

/**
 * Fetches the active workspace for the current user.
 * Must filter by user_id – RLS lets you see all members of your workspaces,
 * so without this we could get another member's row.
 */
async function getActiveWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      workspaces:workspace_id (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('role')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  
  if (error || !membership) {
    console.log('[Dashboard] No workspace found for user');
    return null;
  }
  
  const rawWorkspace = membership.workspaces;
  const workspace = (Array.isArray(rawWorkspace) ? rawWorkspace[0] : rawWorkspace) as { id: string; name: string } | null;
  
  return {
    id: membership.workspace_id as string,
    name: workspace?.name ?? null,
    role: membership.role as WorkspaceRole,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userData: { email: string; fullName: string | null; avatarUrl: string | null } | null = null;
  let activeWorkspace: { id: string; name: string | null; role: WorkspaceRole } | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const [profileResult, workspaceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle(),
        getActiveWorkspace(supabase, user.id),
      ]);
      
      const profile = profileResult.data;
      activeWorkspace = workspaceResult;
      userData = {
        email: user.email || '',
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
      };
    }
  } catch (err) {
    // Skip logging expected "couldn't be rendered statically because it used cookies" during build
    const isDynamicUsage =
      err && typeof err === 'object' && 'digest' in err && (err as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE';
    if (!isDynamicUsage) {
      console.error('[Dashboard] Layout error:', err);
    }
    // Continue with null workspace - pages can show degraded UI
  }

  return (
    <WorkspaceProvider
      workspaceId={activeWorkspace?.id ?? null}
      workspaceName={activeWorkspace?.name ?? null}
      role={activeWorkspace?.role ?? null}
    >
      <PreferencesProvider>
      <SystemHeartProvider>
      {/* Single full-height wrapper so sidebar + main get a defined height */}
      <div className="min-h-screen h-full flex flex-col min-w-0">
        {/* Ambient Background (OKLCH) */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 grain-overlay" />
          <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-neon-blue/10 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-neon-rose/5 blur-[120px]" />
        </div>

        {/* Main Layout: sidebar + content area that fills and scrolls */}
        <div className="relative z-10 flex flex-1 min-h-0 w-full min-w-0">
          <SidebarWithUser 
            user={userData} 
            workspaceName={activeWorkspace?.name}
          />
          <main className="flex-1 min-w-0 min-h-0 flex flex-col relative overflow-hidden bg-obsidian/95">
            <div className="flex-1 min-h-0 min-w-0 overflow-auto flex flex-col">
              {children}
            </div>
          </main>
        </div>
      </div>
      </SystemHeartProvider>
      </PreferencesProvider>
    </WorkspaceProvider>
  );
}
