/**
 * User Service
 * Manages anonymous user identity in localStorage for reviews
 */

import type { ReviewUser } from '../types';

const STORAGE_KEY = 'exoplanet_user';

/**
 * Generate a DiceBear avatar URL for a user
 */
function generateAvatar(uid: string): string {
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${uid}`;
}

/**
 * Get the current user from localStorage
 */
export function getUser(): ReviewUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ReviewUser;
  } catch {
    return null;
  }
}

/**
 * Create a new anonymous user and save to localStorage
 */
export function createUser(name: string): ReviewUser {
  const uid = crypto.randomUUID();
  const user: ReviewUser = {
    uid,
    authProvider: 'anonymous',
    name: name.trim(),
    email: '',
    avatar: generateAvatar(uid),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

/**
 * Clear the current user from localStorage
 */
export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get or create user - returns existing user or prompts for creation
 */
export function hasUser(): boolean {
  return getUser() !== null;
}

export const userService = {
  getUser,
  createUser,
  clearUser,
  hasUser,
};
