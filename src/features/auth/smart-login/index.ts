/**
 * Smart Login Feature
 * Production-grade authentication with state restoration
 * @module features/auth/smart-login
 */

// UI Components
export { SmartLoginForm } from './ui/smart-login-form';

// Server Actions
export { signInAction, signUpAction, signOutAction, signOut } from './api/actions';

// Types
export type { 
  AuthState, 
  AuthStatus, 
  AuthMode,
  AuthenticatedUser, 
  ProfileStatus,
  // Legacy aliases
  LoginState,
  LoginStatus,
} from './model/types';

// Schemas
export { loginSchema, signupSchema, type LoginInput, type SignupInput } from './model/schema';
