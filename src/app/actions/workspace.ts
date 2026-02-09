/**
 * Workspace Server Actions
 * Handles workspace setup and management
 * @module app/actions/workspace
 */

'use server';

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Types
// ============================================================================

export interface WorkspacePermissions {
  view_finance: boolean;
  view_planning: boolean;
  view_ros: boolean;
  manage_team: boolean;
  manage_locations: boolean;
}

const OWNER_PERMISSIONS: WorkspacePermissions = {
  view_finance: true,
  view_planning: true,
  view_ros: true,
  manage_team: true,
  manage_locations: true,
};

const DEFAULT_MEMBER_PERMISSIONS: WorkspacePermissions = {
  view_finance: false,
  view_planning: true,
  view_ros: true,
  manage_team: false,
  manage_locations: false,
};

export interface SetupWorkspaceResult {
  success: boolean;
  error?: string;
  workspace?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
}

// ============================================================================
// Setup Initial Workspace
// Creates workspace, default location, and owner membership
// ============================================================================

/**
 * Sets up a complete workspace with default location and owner membership
 * 
 * This is the primary action for workspace creation - it:
 * 1. Creates a new Workspace
 * 2. Creates a default 'Main Office' location
 * 3. Assigns the creator as 'owner' with all permissions
 * 
 * @param name - The workspace name
 * @param locationName - Optional custom name for the primary location (defaults to 'Main Office')
 * @param department - Optional department for the owner (e.g., 'Executive', 'Operations')
 */
export async function setupInitialWorkspace(
  name: string,
  locationName: string = 'Main Office',
  department?: string
): Promise<SetupWorkspaceResult> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Validate input
  if (!name.trim()) {
    return { success: false, error: 'Workspace name is required' };
  }
  
  try {
    // Step 1: Create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        created_by: user.id,
      })
      .select()
      .single();
    
    if (workspaceError || !workspace) {
      console.error('[Workspace] Create error:', workspaceError);
      return { 
        success: false, 
        error: workspaceError?.message || 'Failed to create workspace' 
      };
    }
    
    // Step 2: Create the default location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        workspace_id: workspace.id,
        name: locationName.trim(),
        is_primary: true,
      })
      .select()
      .single();
    
    if (locationError) {
      console.error('[Workspace] Location create error:', locationError);
      // Rollback workspace creation
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return { 
        success: false, 
        error: locationError.message || 'Failed to create default location' 
      };
    }
    
    // Step 3: Add the creator as owner with full permissions
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
        department: department?.trim() || 'Executive',
        permissions: OWNER_PERMISSIONS,
        primary_location_id: location?.id,
      });
    
    if (memberError) {
      console.error('[Workspace] Member create error:', memberError);
      // Rollback
      await supabase.from('locations').delete().eq('id', location.id);
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return { 
        success: false, 
        error: memberError.message || 'Failed to assign ownership' 
      };
    }
    
    revalidatePath('/');
    
    return {
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      location: location ? {
        id: location.id,
        name: location.name,
      } : undefined,
    };
    
  } catch (e) {
    console.error('[Workspace] Unexpected error:', e);
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    };
  }
}

// ============================================================================
// Update Member Permissions
// ============================================================================

/**
 * Updates a member's permissions in a workspace
 * Requires manage_team permission or owner/admin role
 */
export async function updateMemberPermissions(
  workspaceId: string,
  memberId: string,
  permissions: Partial<WorkspacePermissions>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Check if user has permission to manage team
  const { data: currentMember } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();
  
  if (!currentMember) {
    return { success: false, error: 'Not a member of this workspace' };
  }
  
  const canManage = 
    currentMember.role === 'owner' || 
    currentMember.role === 'admin' ||
    (currentMember.permissions as WorkspacePermissions)?.manage_team;
  
  if (!canManage) {
    return { success: false, error: 'Insufficient permissions' };
  }
  
  // Get target member's current permissions
  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single();
  
  if (!targetMember) {
    return { success: false, error: 'Member not found' };
  }
  
  // Prevent modifying owner permissions (unless you're the owner)
  if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
    return { success: false, error: 'Cannot modify owner permissions' };
  }
  
  // Merge permissions
  const updatedPermissions = {
    ...(targetMember.permissions as WorkspacePermissions),
    ...permissions,
  };
  
  const { error } = await supabase
    .from('workspace_members')
    .update({ permissions: updatedPermissions })
    .eq('id', memberId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/settings');
  return { success: true };
}

// ============================================================================
// Update Member Department
// ============================================================================

/**
 * Updates a member's department
 * Requires manage_team permission or owner/admin role
 */
export async function updateMemberDepartment(
  workspaceId: string,
  memberId: string,
  department: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Check if user has permission to manage team
  const { data: currentMember } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();
  
  if (!currentMember) {
    return { success: false, error: 'Not a member of this workspace' };
  }
  
  const canManage = 
    currentMember.role === 'owner' || 
    currentMember.role === 'admin' ||
    (currentMember.permissions as WorkspacePermissions)?.manage_team;
  
  if (!canManage) {
    return { success: false, error: 'Insufficient permissions' };
  }
  
  const { error } = await supabase
    .from('workspace_members')
    .update({ department: department.trim() })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/settings');
  return { success: true };
}

// ============================================================================
// Get Workspace Members
// ============================================================================

export interface WorkspaceMemberData {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  department: string | null;
  permissions: WorkspacePermissions;
  primaryLocationId: string | null;
  joinedAt: string;
}

/**
 * Fetches all members of a workspace with their profile data
 */
export async function getWorkspaceMembers(
  workspaceId: string
): Promise<{ success: boolean; members?: WorkspaceMemberData[]; error?: string }> {
  const supabase = await createClient();
  
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select(`
      id,
      user_id,
      role,
      department,
      permissions,
      primary_location_id,
      created_at,
      profiles:user_id (
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('role')
    .order('created_at', { ascending: true });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  const formattedMembers: WorkspaceMemberData[] = members.map((m) => {
    const rawProfile = m.profiles;
    const profile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as { email: string; full_name: string | null; avatar_url: string | null } | null;
    return {
      id: m.id,
      userId: m.user_id,
      email: profile?.email || '',
      fullName: profile?.full_name || null,
      avatarUrl: profile?.avatar_url || null,
      role: m.role as 'owner' | 'admin' | 'member' | 'viewer',
      department: m.department,
      permissions: m.permissions as WorkspacePermissions,
      primaryLocationId: m.primary_location_id,
      joinedAt: m.created_at,
    };
  });
  
  return { success: true, members: formattedMembers };
}

// ============================================================================
// Get Workspace Locations
// ============================================================================

export interface LocationData {
  id: string;
  name: string;
  address: string | null;
  isPrimary: boolean;
}

/**
 * Fetches all locations for a workspace
 */
export async function getWorkspaceLocations(
  workspaceId: string
): Promise<{ success: boolean; locations?: LocationData[]; error?: string }> {
  const supabase = await createClient();
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, address, is_primary')
    .eq('workspace_id', workspaceId)
    .order('is_primary', { ascending: false })
    .order('name');
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  const formattedLocations: LocationData[] = locations.map((l) => ({
    id: l.id,
    name: l.name,
    address: l.address,
    isPrimary: l.is_primary,
  }));
  
  return { success: true, locations: formattedLocations };
}

// ============================================================================
// Add Location
// ============================================================================

/**
 * Adds a new location to the workspace
 */
export async function addLocation(
  workspaceId: string,
  name: string,
  address?: string
): Promise<{ success: boolean; location?: LocationData; error?: string }> {
  const supabase = await createClient();
  
  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      workspace_id: workspaceId,
      name: name.trim(),
      address: address?.trim() || null,
      is_primary: false,
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/settings');
  
  return {
    success: true,
    location: {
      id: location.id,
      name: location.name,
      address: location.address,
      isPrimary: location.is_primary,
    },
  };
}
