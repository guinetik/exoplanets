/**
 * User Service
 * Manages user profiles in Firestore with localStorage fallback
 */

import { doc, getDoc } from 'firebase/firestore';
import type { ReviewUser } from '../types';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { getSeedUser } from '../data/seedReviews';

const STORAGE_KEY = 'exoplanet_user';

/**
 * Generate a DiceBear avatar URL for a user
 */
export function generateAvatar(uid: string): string {
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${uid}`;
}

/**
 * Get the current user from localStorage (for anonymous/offline users)
 */
export function getLocalUser(): ReviewUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ReviewUser;
  } catch {
    return null;
  }
}

/**
 * Save user to localStorage
 */
export function saveLocalUser(user: ReviewUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * Clear the current user from localStorage
 */
export function clearLocalUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if there's a local user stored
 */
export function hasLocalUser(): boolean {
  return getLocalUser() !== null;
}

/**
 * Get user by ID from Firestore
 */
export async function getUserById(uid: string): Promise<ReviewUser | null> {
  // Check seed users first
  const seedUser = getSeedUser(uid);
  if (seedUser) {
    return seedUser;
  }

  // Check Firebase if configured
  if (isFirebaseConfigured()) {
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as ReviewUser;
      }
    } catch (err) {
      console.warn('Failed to fetch user from Firestore:', err);
    }
  }

  // Generate a placeholder user for unknown IDs
  return {
    uid,
    authProvider: 'unknown',
    name: 'Unknown Traveler',
    email: '',
    avatar: generateAvatar(uid),
  };
}

/**
 * Batch fetch users by IDs (for attaching to reviews)
 * Returns a Map for O(1) lookup
 */
export async function getUsersByIds(
  uids: string[]
): Promise<Map<string, ReviewUser>> {
  const users = new Map<string, ReviewUser>();
  const uniqueUids = [...new Set(uids)];

  // Fetch all users in parallel
  const results = await Promise.all(
    uniqueUids.map(async (uid) => {
      const user = await getUserById(uid);
      return { uid, user };
    })
  );

  for (const { uid, user } of results) {
    if (user) {
      users.set(uid, user);
    }
  }

  return users;
}

// Legacy exports for backwards compatibility
export const userService = {
  getUser: getLocalUser,
  createUser: (name: string): ReviewUser => {
    const uid = crypto.randomUUID();
    const user: ReviewUser = {
      uid,
      authProvider: 'anonymous',
      name: name.trim(),
      email: '',
      avatar: generateAvatar(uid),
    };
    saveLocalUser(user);
    return user;
  },
  clearUser: clearLocalUser,
  hasUser: hasLocalUser,
  getUserById,
  getUsersByIds,
};
