/**
 * Review Service
 * Manages planet reviews with Firestore backend + seed data
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import type { PlanetReview, ReviewUser } from '../types';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { getSeedReviews } from '../data/seedReviews';
import { getUsersByIds } from './userService';
import { createLogger } from '@guinetik/logger';

const logger = createLogger({ prefix: 'ReviewService' });

/**
 * Get all reviews for a planet (Firestore + seed data)
 */
export async function getReviews(planetId: string): Promise<PlanetReview[]> {
  // Always include seed reviews
  const seedReviews = getSeedReviews(planetId);

  // Fetch from Firestore if configured
  let firestoreReviews: PlanetReview[] = [];

  if (isFirebaseConfigured()) {
    try {
      const db = getFirebaseDb();
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef,
        where('planet', '==', planetId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const rawReviews: PlanetReview[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        rawReviews.push({
          id: doc.id,
          planet: data.planet,
          userid: data.userid,
          rate: data.rate,
          title: data.title,
          text: data.text,
          // Convert Firestore Timestamp to milliseconds
          date:
            data.date instanceof Timestamp
              ? data.date.toMillis()
              : data.date,
        });
      });

      // Batch fetch all authors
      const userIds = rawReviews.map((r) => r.userid);
      const usersMap = await getUsersByIds(userIds);

      // Attach authors to reviews
      firestoreReviews = rawReviews.map((review) => ({
        ...review,
        author: usersMap.get(review.userid),
      }));
    } catch (err) {
      logger.error('Failed to fetch reviews from Firestore:', err);
    }
  }

  // Merge and sort by date (newest first)
  const allReviews = [...firestoreReviews, ...seedReviews].sort(
    (a, b) => b.date - a.date
  );

  return allReviews;
}

/**
 * Create a new review in Firestore
 */
export async function createReview(
  review: Omit<PlanetReview, 'id' | 'date'>,
  author: ReviewUser
): Promise<PlanetReview> {
  if (!isFirebaseConfigured()) {
    // Fallback: create local-only review (for testing without Firebase)
    logger.warn('Firebase not configured, creating local-only review');
    return {
      ...review,
      id: crypto.randomUUID(),
      date: Date.now(),
      author,
    };
  }

  const db = getFirebaseDb();
  const reviewsRef = collection(db, 'reviews');

  const reviewData = {
    planet: review.planet,
    userid: review.userid,
    rate: review.rate,
    title: review.title,
    text: review.text,
    date: Timestamp.now(),
  };

  const docRef = await addDoc(reviewsRef, reviewData);
  logger.info('Created review:', docRef.id);

  return {
    ...review,
    id: docRef.id,
    date: Date.now(),
    author,
  };
}

/**
 * Get review count for a planet
 */
export async function getReviewCount(planetId: string): Promise<number> {
  const reviews = await getReviews(planetId);
  return reviews.length;
}

/**
 * Get average rating for a planet
 */
export async function getAverageRating(
  planetId: string
): Promise<number | null> {
  const reviews = await getReviews(planetId);
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rate, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export const reviewService = {
  getReviews,
  createReview,
  getReviewCount,
  getAverageRating,
};
