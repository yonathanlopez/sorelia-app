import { getAppParams, getStoredAccessToken } from './app-params';
import { base44, refreshBase44Client } from '@/api/base44Client';

/** Read access_token from the URL, persist it, and refresh the SDK client. */
export function completeOAuthCallback(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  getAppParams();
  const token = getStoredAccessToken();
  if (token) {
    base44.auth.setToken(token, false);
  }
  refreshBase44Client();
  return !!token;
}

export function getOAuthRedirectPath(): string {
  return '/auth/callback';
}
