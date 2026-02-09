/**
 * Permission Utilities
 * Centralized permission checking for DanielOS
 * @module lib/permissions
 */

import 'server-only';

import { createClient } from '@/shared/api/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type PermissionKey = 
  | 'view_finance'
  | 'view_planning'
  | 'view_ros'
  | 'manage_team'
  | 'manage_locations';

export interface WorkspacePermissions {
  view_finance: boolean;
  view_planning: boolean;
  view_ros: boolean;
  manage_team: boolean;
  manage_locations: boolean;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

// Owner and admin have all permissions by default
const ELEVATED_ROLES: WorkspaceRole[] = ['owner', 'admin'];

// ============================================================================
// Core Permission Check
// ============================================================================

/**
 * Checks if a user has a specific permission in a workspace
 * 
 * Uses the database function `member_has_permission` which:
 * - Returns TRUE for owners (all permissions)
 * - Returns TRUE for admins (most permissions)
 * - Checks JSONB permissions for members/viewers
 * 
 * @param userId - The user ID to check (optional, defaults to current user)
 * @param workspaceId - The workspace ID
 * @param permissionKey - The permission to check
 * @returns boolean indicating if user has permission
 * 
 * @example
 * const canViewFinance = await hasPermission(userId, workspaceId, 'view_finance');
 * if (!canViewFinance) {
 *   redirect('/unauthorized');
 * }
 */
export async function hasPermission(
  userId: string | null,
  workspaceId: string,
  permissionKey: PermissionKey
): Promise<boolean> {
  const supabase = await createClient();
  
  // If no userId provided, use current authenticated user
  const effectiveUserId = userId || (await supabase.auth.getUser()).data.user?.id;
  
  if (!effectiveUserId) {
    return false;
  }
  
  // Query the workspace membership and check permissions
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', effectiveUserId)
    .single();
  
  if (error || !member) {
    return false;
  }
  
  // Owners and admins have all permissions
  if (ELEVATED_ROLES.includes(member.role as WorkspaceRole)) {
    return true;
  }
  
  // Check JSONB permissions for regular members
  const permissions = member.permissions as WorkspacePermissions | null;
  return permissions?.[permissionKey] ?? false;
}

// ============================================================================
// Batch Permission Check
// ============================================================================

/**
 * Checks multiple permissions at once for efficiency
 * 
 * @param userId - The user ID to check
 * @param workspaceId - The workspace ID
 * @param permissionKeys - Array of permissions to check
 * @returns Object with permission keys as keys and booleans as values
 * 
 * @example
 * const perms = await hasPermissions(userId, workspaceId, ['view_finance', 'manage_team']);
 * // { view_finance: true, manage_team: false }
 */
export async function hasPermissions(
  userId: string | null,
  workspaceId: string,
  permissionKeys: PermissionKey[]
): Promise<Record<PermissionKey, boolean>> {
  const supabase = await createClient();
  
  const effectiveUserId = userId || (await supabase.auth.getUser()).data.user?.id;
  
  // Default all to false
  const result: Record<PermissionKey, boolean> = {
    view_finance: false,
    view_planning: false,
    view_ros: false,
    manage_team: false,
    manage_locations: false,
  };
  
  if (!effectiveUserId) {
    return result;
  }
  
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', effectiveUserId)
    .single();
  
  if (error || !member) {
    return result;
  }
  
  const isElevated = ELEVATED_ROLES.includes(member.role as WorkspaceRole);
  const permissions = member.permissions as WorkspacePermissions | null;
  
  for (const key of permissionKeys) {
    result[key] = isElevated || (permissions?.[key] ?? false);
  }
  
  return result;
}

// ============================================================================
// Role Check
// ============================================================================

/**
 * Gets the user's role in a workspace
 * 
 * @param userId - The user ID to check
 * @param workspaceId - The workspace ID
 * @returns The role or null if not a member
 */
export async function getUserRole(
  userId: string | null,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const supabase = await createClient();
  
  const effectiveUserId = userId || (await supabase.auth.getUser()).data.user?.id;
  
  if (!effectiveUserId) {
    return null;
  }
  
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', effectiveUserId)
    .single();
  
  if (error || !member) {
    return null;
  }
  
  return member.role as WorkspaceRole;
}

// ============================================================================
// Convenience Methods
// ============================================================================

/**
 * Checks if user can view finance data
 */
export async function canViewFinance(
  userId: string | null,
  workspaceId: string
): Promise<boolean> {
  return hasPermission(userId, workspaceId, 'view_finance');
}

/**
 * Checks if user can view planning data
 */
export async function canViewPlanning(
  userId: string | null,
  workspaceId: string
): Promise<boolean> {
  return hasPermission(userId, workspaceId, 'view_planning');
}

/**
 * Checks if user can view run-of-show data
 */
export async function canViewROS(
  userId: string | null,
  workspaceId: string
): Promise<boolean> {
  return hasPermission(userId, workspaceId, 'view_ros');
}

/**
 * Checks if user can manage team members
 */
export async function canManageTeam(
  userId: string | null,
  workspaceId: string
): Promise<boolean> {
  return hasPermission(userId, workspaceId, 'manage_team');
}

/**
 * Checks if user can manage locations
 */
export async function canManageLocations(
  userId: string | null,
  workspaceId: string
): Promise<boolean> {
  return hasPermission(userId, workspaceId, 'manage_locations');
}

// ============================================================================
// Guard Functions (for use in Server Components/Actions)
// ============================================================================

/**
 * Throws an error if user doesn't have permission
 * Use in server actions to protect endpoints
 * 
 * @throws Error if permission denied
 */
export async function requirePermission(
  userId: string | null,
  workspaceId: string,
  permissionKey: PermissionKey,
  errorMessage: string = 'Permission denied'
): Promise<void> {
  const allowed = await hasPermission(userId, workspaceId, permissionKey);
  
  if (!allowed) {
    throw new Error(errorMessage);
  }
}

/**
 * Throws an error if user isn't at least the specified role
 * 
 * @throws Error if insufficient role
 */
export async function requireRole(
  userId: string | null,
  workspaceId: string,
  minimumRole: WorkspaceRole,
  errorMessage: string = 'Insufficient role'
): Promise<void> {
  const role = await getUserRole(userId, workspaceId);
  
  if (!role) {
    throw new Error('Not a workspace member');
  }
  
  const roleHierarchy: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer'];
  const userRoleIndex = roleHierarchy.indexOf(role);
  const requiredRoleIndex = roleHierarchy.indexOf(minimumRole);
  
  if (userRoleIndex > requiredRoleIndex) {
    throw new Error(errorMessage);
  }
}
