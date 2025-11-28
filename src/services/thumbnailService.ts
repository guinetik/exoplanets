/**
 * Thumbnail Service
 * Manages planet/star thumbnail caching and storage in Firebase
 * Thumbnails are generated once and shared across all users
 */

import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage, isFirebaseConfigured } from './firebase';
import { nameToSlug } from '../utils/urlSlug';

/** Storage paths for different celestial body types */
const STORAGE_PATHS = {
  planet: 'thumbnails/planets',
  star: 'thumbnails/stars',
} as const;

/** Thumbnail size in pixels */
export const THUMBNAIL_SIZE = 128;

/** In-memory cache for thumbnail URLs */
const urlCache = new Map<string, string>();

/** Set of planet names currently being generated (prevents duplicate renders) */
const generationInProgress = new Set<string>();

/** Queue of pending generation callbacks */
const generationCallbacks = new Map<string, Array<(url: string | null) => void>>();

/**
 * Get the storage path for a celestial body thumbnail
 * @param name - The name of the celestial body
 * @param type - The type of celestial body ('planet' or 'star')
 * @returns The full storage path
 */
function getStoragePath(name: string, type: 'planet' | 'star'): string {
  const slug = nameToSlug(name);
  return `${STORAGE_PATHS[type]}/${slug}.png`;
}

/**
 * Get cached thumbnail URL from memory
 * @param name - The celestial body name
 * @param type - The type of celestial body
 * @returns Cached URL or undefined if not cached
 */
export function getCachedUrl(name: string, type: 'planet' | 'star'): string | undefined {
  const key = `${type}:${name}`;
  return urlCache.get(key);
}

/**
 * Set thumbnail URL in memory cache
 * @param name - The celestial body name
 * @param type - The type of celestial body
 * @param url - The thumbnail URL
 */
function setCachedUrl(name: string, type: 'planet' | 'star', url: string): void {
  const key = `${type}:${name}`;
  urlCache.set(key, url);
}

/**
 * Check if a thumbnail exists in Firebase Storage
 * @param name - The celestial body name
 * @param type - The type of celestial body
 * @returns The download URL if exists, null otherwise
 */
export async function getThumbnailUrl(
  name: string,
  type: 'planet' | 'star'
): Promise<string | null> {
  // Check memory cache first
  const cached = getCachedUrl(name, type);
  if (cached) {
    return cached;
  }

  // If Firebase is not configured, return null
  if (!isFirebaseConfigured()) {
    return null;
  }

  try {
    const storage = getFirebaseStorage();
    const path = getStoragePath(name, type);
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    
    // Cache the URL
    setCachedUrl(name, type, url);
    return url;
  } catch (error: unknown) {
    // File doesn't exist or other error
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'storage/object-not-found') {
      return null;
    }
    console.warn(`Failed to get thumbnail for ${name}:`, error);
    return null;
  }
}

/**
 * Upload a thumbnail to Firebase Storage
 * @param name - The celestial body name
 * @param type - The type of celestial body
 * @param blob - The image blob to upload
 * @returns The download URL of the uploaded thumbnail
 */
export async function uploadThumbnail(
  name: string,
  type: 'planet' | 'star',
  blob: Blob
): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  const storage = getFirebaseStorage();
  const path = getStoragePath(name, type);
  const storageRef = ref(storage, path);
  
  // Upload the blob
  await uploadBytes(storageRef, blob, {
    contentType: 'image/png',
    cacheControl: 'public, max-age=31536000', // Cache for 1 year
  });
  
  // Get the download URL
  const url = await getDownloadURL(storageRef);
  
  // Cache the URL
  setCachedUrl(name, type, url);
  
  return url;
}

/**
 * Check if a thumbnail is currently being generated
 * @param name - The celestial body name
 * @param type - The type of celestial body
 * @returns True if generation is in progress
 */
export function isGenerating(name: string, type: 'planet' | 'star'): boolean {
  const key = `${type}:${name}`;
  return generationInProgress.has(key);
}

/**
 * Mark a thumbnail as being generated
 * @param name - The celestial body name
 * @param type - The type of celestial body
 */
export function markGenerating(name: string, type: 'planet' | 'star'): void {
  const key = `${type}:${name}`;
  generationInProgress.add(key);
}

/**
 * Mark a thumbnail generation as complete
 * @param name - The celestial body name
 * @param type - The type of celestial body
 * @param url - The resulting URL (or null if failed)
 */
export function markGenerationComplete(
  name: string,
  type: 'planet' | 'star',
  url: string | null
): void {
  const key = `${type}:${name}`;
  generationInProgress.delete(key);
  
  // Notify all waiting callbacks
  const callbacks = generationCallbacks.get(key);
  if (callbacks) {
    callbacks.forEach((cb) => cb(url));
    generationCallbacks.delete(key);
  }
}

/**
 * Wait for an in-progress generation to complete
 * @param name - The celestial body name
 * @param type - The type of celestial body
 * @returns Promise that resolves with the URL when generation completes
 */
export function waitForGeneration(
  name: string,
  type: 'planet' | 'star'
): Promise<string | null> {
  const key = `${type}:${name}`;
  return new Promise((resolve) => {
    const callbacks = generationCallbacks.get(key) || [];
    callbacks.push(resolve);
    generationCallbacks.set(key, callbacks);
  });
}

/**
 * Thumbnail service singleton for convenience
 */
export const thumbnailService = {
  getThumbnailUrl,
  uploadThumbnail,
  getCachedUrl,
  isGenerating,
  markGenerating,
  markGenerationComplete,
  waitForGeneration,
  THUMBNAIL_SIZE,
};

export default thumbnailService;

