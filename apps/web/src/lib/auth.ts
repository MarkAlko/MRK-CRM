/**
 * Auth utility – thin layer used by AuthProvider.
 * Cookie-based auth: the API sets httpOnly cookies, so we only
 * need to track the user object on the client side.
 */

import { authApi } from './api';
import type { User, LoginRequest } from './types';

export async function loginUser(credentials: LoginRequest): Promise<User> {
  await authApi.login(credentials);
  // After login, fetch user info via /me
  return await authApi.me();
}

export async function logoutUser(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    // Even if logout call fails, clear local state
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await authApi.me();
  } catch {
    return null;
  }
}

export async function refreshSession(): Promise<User | null> {
  try {
    await authApi.refresh();
    return await authApi.me();
  } catch {
    return null;
  }
}
