/**
 * Poll Service
 * Manages Earth 2.0 voting with Firestore backend
 */

import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import type { ExoplanetVote, VoteCount } from '../types';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import { createLogger } from '@guinetik/logger';

const logger = createLogger({ prefix: 'PollService' });

/** Firestore collection name */
const COLLECTION_NAME = 'exoplanets_poll';

/**
 * Cast or update a vote for a planet
 * Each user can only have one vote (upsert by userid)
 * @param planet - Planet name to vote for
 * @param userid - User's unique ID
 * @returns The created/updated vote
 */
export async function castVote(
  planet: string,
  userid: string
): Promise<ExoplanetVote> {
  if (!isFirebaseConfigured()) {
    logger.warn('Firebase not configured, creating local-only vote');
    return {
      id: userid,
      planet,
      userid,
      timestamp: Date.now(),
    };
  }

  const db = getFirebaseDb();
  // Use userid as document ID to ensure one vote per user
  const voteRef = doc(db, COLLECTION_NAME, userid);

  const voteData = {
    planet,
    userid,
    timestamp: Timestamp.now(),
  };

  await setDoc(voteRef, voteData);
  logger.info('Vote cast:', { planet, userid });

  return {
    id: userid,
    planet,
    userid,
    timestamp: Date.now(),
  };
}

/**
 * Get the current user's vote (if any)
 * @param userid - User's unique ID
 * @returns The user's vote or null if not voted
 */
export async function getUserVote(
  userid: string
): Promise<ExoplanetVote | null> {
  if (!isFirebaseConfigured()) {
    logger.warn('Firebase not configured, returning null');
    return null;
  }

  try {
    const db = getFirebaseDb();
    const pollRef = collection(db, COLLECTION_NAME);
    const q = query(pollRef, where('userid', '==', userid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docData = snapshot.docs[0];
    const data = docData.data();

    return {
      id: docData.id,
      planet: data.planet,
      userid: data.userid,
      timestamp:
        data.timestamp instanceof Timestamp
          ? data.timestamp.toMillis()
          : data.timestamp,
    };
  } catch (err) {
    logger.error('Failed to fetch user vote:', err);
    return null;
  }
}

/**
 * Get aggregated vote counts for all planets
 * @returns Array of vote counts sorted by count (descending)
 */
export async function getVoteCounts(): Promise<VoteCount[]> {
  if (!isFirebaseConfigured()) {
    logger.warn('Firebase not configured, returning empty counts');
    return [];
  }

  try {
    const db = getFirebaseDb();
    const pollRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(pollRef);

    // Aggregate votes by planet
    const countMap = new Map<string, number>();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const planet = data.planet as string;
      countMap.set(planet, (countMap.get(planet) || 0) + 1);
    });

    // Convert to array and sort by count
    const counts: VoteCount[] = Array.from(countMap.entries())
      .map(([planet, count]) => ({ planet, count }))
      .sort((a, b) => b.count - a.count);

    return counts;
  } catch (err) {
    logger.error('Failed to fetch vote counts:', err);
    return [];
  }
}

/**
 * Get total number of votes cast
 * @returns Total vote count
 */
export async function getTotalVotes(): Promise<number> {
  if (!isFirebaseConfigured()) {
    return 0;
  }

  try {
    const db = getFirebaseDb();
    const pollRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(pollRef);
    return snapshot.size;
  } catch (err) {
    logger.error('Failed to fetch total votes:', err);
    return 0;
  }
}

export const pollService = {
  castVote,
  getUserVote,
  getVoteCounts,
  getTotalVotes,
};

