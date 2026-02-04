/**
 * ARCHITECTURAL NOTE:
 * This is the "Identity Bridge." Currently, it returns a hardcoded Developer Session.
 * Later, we will swap this implementation to fetch the real user from Supabase Auth.
 * This allows us to build Multi-Tenant features NOW without waiting for the Login UI.
 */

export const DEV_SESSION = {
  user: {
    id: 'dev-user-001',
    name: 'Daniel Arthur',
    role: 'owner',
    avatar: 'https://avatar.vercel.sh/daniel',
  },
  workspace: {
    // ⚠️ REPLACE THIS WITH YOUR REAL WORKSPACE UUID FROM SUPABASE
    id: '7c977570-ae46-444f-91db-90a5f595b819',
    name: 'DanielOS Main',
    plan: 'enterprise',
  },
};

export async function getSession() {
  // Simulate network latency (makes the UI feel "real" during dev)
  await new Promise((resolve) => setTimeout(resolve, 50));
  return DEV_SESSION;
}
