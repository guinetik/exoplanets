/**
 * Review Service
 * Mock implementation using localStorage + seed data
 * Will be replaced with Firebase integration later
 */

import type { PlanetReview, ReviewUser } from '../types';

const STORAGE_KEY = 'exoplanet_reviews';

// Seed users for demo reviews
const SEED_USERS: Record<string, ReviewUser> = {
  'seed-zyx47': {
    uid: 'seed-zyx47',
    authProvider: 'seed',
    name: 'Zyx-47',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-zyx47',
  },
  'seed-captain': {
    uid: 'seed-captain',
    authProvider: 'seed',
    name: 'Captain Nebula',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-captain',
  },
  'seed-tourist': {
    uid: 'seed-tourist',
    authProvider: 'seed',
    name: 'GalacticTourist_9000',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-tourist',
  },
  'seed-wanderer': {
    uid: 'seed-wanderer',
    authProvider: 'seed',
    name: 'Void Wanderer',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-wanderer',
  },
  'seed-explorer': {
    uid: 'seed-explorer',
    authProvider: 'seed',
    name: 'Astro Explorer X',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-explorer',
  },
};

// Seed reviews for popular planets
const SEED_REVIEWS: PlanetReview[] = [
  // Proxima Centauri b
  {
    id: 'seed-review-1',
    planet: 'Proxima Cen b',
    userid: 'seed-zyx47',
    rate: 4,
    title: 'Amazing red sunsets, pack thermal gear!',
    text: 'The views of Proxima Centauri from the surface are breathtaking - those red sunsets last forever! Just be warned, it gets COLD on the dark side. Bring your quantum heater. The tidally locked rotation takes some getting used to, but the permanent twilight zone is actually quite romantic.',
    date: Date.now() - 86400000 * 30, // 30 days ago
  },
  {
    id: 'seed-review-2',
    planet: 'Proxima Cen b',
    userid: 'seed-captain',
    rate: 3,
    title: 'Decent stopover, not much nightlife',
    text: 'Good for a quick pit stop on the way to Alpha Centauri proper. The local cuisine is... interesting. Would recommend the geothermal spas but skip the dark side tours unless you enjoy freezing.',
    date: Date.now() - 86400000 * 45, // 45 days ago
  },
  // TRAPPIST-1e
  {
    id: 'seed-review-3',
    planet: 'TRAPPIST-1e',
    userid: 'seed-tourist',
    rate: 5,
    title: 'Best Earth-like experience outside Sol!',
    text: 'Finally, a planet where my Earth-spec gear actually works! The temperature is perfect, the gravity is comfortable, and you can actually see 6 other planets in the sky. The sister planet tours are a MUST. Booked my return trip already!',
    date: Date.now() - 86400000 * 15, // 15 days ago
  },
  {
    id: 'seed-review-4',
    planet: 'TRAPPIST-1e',
    userid: 'seed-wanderer',
    rate: 4,
    title: 'Crowded but worth it',
    text: 'Everyone and their clone is visiting these days, but I get the hype. The planetary alignment festivals are spectacular. Just book your orbital hotel early - they fill up fast during conjunction season.',
    date: Date.now() - 86400000 * 60, // 60 days ago
  },
  // Kepler-442b
  {
    id: 'seed-review-5',
    planet: 'Kepler-442b',
    userid: 'seed-explorer',
    rate: 5,
    title: 'Hidden gem of the galaxy!',
    text: 'Skip the tourist traps and come here! Yes, it\'s 112 light-years out, but SO worth the cryo-sleep. The orange-tinted skies, the super-Earth gravity workout, the potential for indigenous life... This is what space exploration is all about!',
    date: Date.now() - 86400000 * 90, // 90 days ago
  },
  // Kepler-22b
  {
    id: 'seed-review-6',
    planet: 'Kepler-22b',
    userid: 'seed-zyx47',
    rate: 4,
    title: 'Water world paradise',
    text: 'If you like swimming, you\'ll LOVE Kepler-22b. Bring your gills (or rent some at the orbital station). The bioluminescent plankton displays at night are unreal. Only downside: no solid ground for traditional camping.',
    date: Date.now() - 86400000 * 20, // 20 days ago
  },
  // 55 Cancri e
  {
    id: 'seed-review-7',
    planet: '55 Cnc e',
    userid: 'seed-captain',
    rate: 2,
    title: 'Too hot, even for me',
    text: 'Look, I\'ve visited some extreme worlds, but this is ridiculous. The diamond mantle tours sound cool until you realize you\'re orbiting inside your ship\'s heat shields the ENTIRE time. Great views from orbit though. Just... don\'t land.',
    date: Date.now() - 86400000 * 10, // 10 days ago
  },
  // HD 189733 b
  {
    id: 'seed-review-8',
    planet: 'HD 189733 b',
    userid: 'seed-wanderer',
    rate: 1,
    title: 'DO NOT VISIT - Glass rain!!!',
    text: 'I don\'t care how pretty the blue color is from space. IT RAINS GLASS HERE. SIDEWAYS. AT 5000 MPH. My ship still has dents. Zero stars if I could. The tourism board should be shut down for even listing this place.',
    date: Date.now() - 86400000 * 5, // 5 days ago
  },
];

/**
 * Get reviews from localStorage
 */
function getStoredReviews(): PlanetReview[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PlanetReview[];
  } catch {
    return [];
  }
}

/**
 * Save reviews to localStorage
 */
function saveReviews(reviews: PlanetReview[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

/**
 * Attach author info to reviews
 * Preserves existing author if already present on the review
 */
function attachAuthors(reviews: PlanetReview[]): PlanetReview[] {
  return reviews.map(review => ({
    ...review,
    author: review.author || SEED_USERS[review.userid] || {
      uid: review.userid,
      authProvider: 'unknown',
      name: 'Unknown Traveler',
      email: '',
      avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${review.userid}`,
    },
  }));
}

/**
 * Get all reviews for a planet
 */
export async function getReviews(planetId: string): Promise<PlanetReview[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Get seed reviews for this planet
  const seedReviews = SEED_REVIEWS.filter(r => r.planet === planetId);

  // Get user-created reviews from localStorage
  const storedReviews = getStoredReviews().filter(r => r.planet === planetId);

  // Merge and sort by date (newest first)
  const allReviews = [...seedReviews, ...storedReviews].sort((a, b) => b.date - a.date);

  // Attach author info
  return attachAuthors(allReviews);
}

/**
 * Create a new review
 */
export async function createReview(
  review: Omit<PlanetReview, 'id' | 'date'>,
  author: ReviewUser
): Promise<PlanetReview> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const newReview: PlanetReview = {
    ...review,
    id: crypto.randomUUID(),
    date: Date.now(),
    author,
  };

  // Save to localStorage
  const stored = getStoredReviews();
  stored.push(newReview);
  saveReviews(stored);

  return newReview;
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
export async function getAverageRating(planetId: string): Promise<number | null> {
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
