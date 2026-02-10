/**
 * Application-wide constants
 */

// Python Backend Configuration
export const PYTHON_BACKEND_URL = 
  process.env.PYTHON_API_URL || 'http://127.0.0.1:8000/api/chat';

// Site Information
export const SITE_CONFIG = {
  title: 'Signal',
  description: 'The Event Operating System',
  owner: 'Arthur',
  contactEmail: 'hello@runsignal.live',
  socialX: 'https://x.com/runsignal_live',
} as const;

// API Routes
export const API_ROUTES = {
  arthur: '/api/arthur',
  capture: '/api/capture',
} as const;

