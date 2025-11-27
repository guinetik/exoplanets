/**
 * Seed Reviews Data
 * Demo reviews and users displayed alongside real Firebase data
 */

import type { PlanetReview, ReviewUser } from '../types';

// Helper for ancient dates (years ago)
const yearsAgo = (years: number) => Date.now() - 86400000 * 365 * years;
const daysAgo = (days: number) => Date.now() - 86400000 * days;

// Seed users for demo reviews
export const SEED_USERS: Readonly<Record<string, ReviewUser>> = {
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
  'seed-ancient': {
    uid: 'seed-ancient',
    authProvider: 'seed',
    name: 'Ẍ̈́ø̷͘r̵̈́p̸̛l̶̾a̴̎x̵̌',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-ancient',
  },
  'seed-karen': {
    uid: 'seed-karen',
    authProvider: 'seed',
    name: 'SpaceKaren2847',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-karen',
  },
  'seed-influencer': {
    uid: 'seed-influencer',
    authProvider: 'seed',
    name: '✨CosmicInfluencer✨',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-influencer',
  },
  'seed-scientist': {
    uid: 'seed-scientist',
    authProvider: 'seed',
    name: 'Dr. Andromeda PhD',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-scientist',
  },
  'seed-boomer': {
    uid: 'seed-boomer',
    authProvider: 'seed',
    name: 'OldSpaceMan1952',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-boomer',
  },
  'seed-cryptobro': {
    uid: 'seed-cryptobro',
    authProvider: 'seed',
    name: 'CryptoMoonLambo',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-cryptobro',
  },
  'seed-ai': {
    uid: 'seed-ai',
    authProvider: 'seed',
    name: 'TOURISM-BOT-7',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-ai',
  },
  'seed-elder': {
    uid: 'seed-elder',
    authProvider: 'seed',
    name: '⧫ Elder Consciousness ⧫',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=seed-elder',
  },
};

// Seed reviews for popular planets
export const SEED_REVIEWS: readonly PlanetReview[] = [
  // ============================================
  // Proxima Centauri b
  // ============================================
  {
    id: 'seed-review-1',
    planet: 'proxima-cen-b',
    userid: 'seed-zyx47',
    rate: 4,
    title: 'Amazing red sunsets, pack thermal gear!',
    text: 'The views of Proxima Centauri from the surface are breathtaking - those red sunsets last forever! Just be warned, it gets COLD on the dark side. Bring your quantum heater. The tidally locked rotation takes some getting used to, but the permanent twilight zone is actually quite romantic.',
    date: daysAgo(30),
  },
  {
    id: 'seed-review-2',
    planet: 'proxima-cen-b',
    userid: 'seed-captain',
    rate: 3,
    title: 'Decent stopover, not much nightlife',
    text: "Good for a quick pit stop on the way to Alpha Centauri proper. The local cuisine is... interesting. Would recommend the geothermal spas but skip the dark side tours unless you enjoy freezing.",
    date: daysAgo(45),
  },
  {
    id: 'seed-review-ancient-1',
    planet: 'proxima-cen-b',
    userid: 'seed-ancient',
    rate: 2,
    title: 'It was better 15,000 years ago',
    text: 'W̷e̵ ̶s̷e̵e̷d̶e̵d̷ ̸t̵h̴i̷s̷ ̵w̴o̸r̸l̶d̸ ̵w̴i̵t̴h̵ ̶l̵i̸f̶e̶ ̶b̵e̸f̷o̸r̶e̷ ̷y̸o̵u̶r̵ ̴s̶p̸e̶c̴i̵e̵s̷ ̵l̵e̶a̶r̴n̵e̷d̵ ̵t̷o̴ ̶w̶a̵l̷k̵.̴ ̷N̴o̸w̵ ̴l̷o̸o̸k̷ ̷a̶t̸ ̸i̶t̷.̵ ̴T̴o̵u̸r̸i̷s̸t̵s̸ ̴e̵v̵e̶r̵y̴w̷h̵e̶r̴e̸.̶ ̶D̵i̴s̵a̸p̷p̸o̵i̵n̶t̸i̶n̴g̷.̵',
    date: yearsAgo(20000),
  },

  // ============================================
  // TRAPPIST-1 e
  // ============================================
  {
    id: 'seed-review-3',
    planet: 'trappist-1-e',
    userid: 'seed-tourist',
    rate: 5,
    title: 'Best Earth-like experience outside Sol!',
    text: 'Finally, a planet where my Earth-spec gear actually works! The temperature is perfect, the gravity is comfortable, and you can actually see 6 other planets in the sky. The sister planet tours are a MUST. Booked my return trip already!',
    date: daysAgo(15),
  },
  {
    id: 'seed-review-4',
    planet: 'trappist-1-e',
    userid: 'seed-wanderer',
    rate: 4,
    title: 'Crowded but worth it',
    text: "Everyone and their clone is visiting these days, but I get the hype. The planetary alignment festivals are spectacular. Just book your orbital hotel early - they fill up fast during conjunction season.",
    date: daysAgo(60),
  },
  {
    id: 'seed-review-karen-1',
    planet: 'trappist-1-e',
    userid: 'seed-karen',
    rate: 1,
    title: 'WORST. VACATION. EVER.',
    text: "I asked for a room with a VIEW OF EARTH and they said that's \"physically impossible from 40 light years away\"??? Then my quantum latte was COLD. I want to speak to the planetary manager. Also the red dwarf star is giving me a headache. Why can't they install a NORMAL yellow sun like back home?? Will be filing a complaint with the Galactic Tourism Board.",
    date: daysAgo(3),
  },
  {
    id: 'seed-review-influencer-1',
    planet: 'trappist-1-e',
    userid: 'seed-influencer',
    rate: 5,
    title: 'OMG the aesthetic!! 📸🌌',
    text: "Besties this planet is SO aesthetic for your feed!! The red sun gives everything this moody vibe that's literally PERFECT for content. Got like 2 million likes on my sunset pic (it lasted 47 hours btw lol). Use code COSMIC for 10% off your trip!! Not sponsored btw 😇✨ #TRAPPIST1e #SpaceInfluencer #NotAnAd",
    date: daysAgo(7),
  },

  // ============================================
  // Kepler-442 b
  // ============================================
  {
    id: 'seed-review-5',
    planet: 'kepler-442-b',
    userid: 'seed-explorer',
    rate: 5,
    title: 'Hidden gem of the galaxy!',
    text: "Skip the tourist traps and come here! Yes, it's 112 light-years out, but SO worth the cryo-sleep. The orange-tinted skies, the super-Earth gravity workout, the potential for indigenous life... This is what space exploration is all about!",
    date: daysAgo(90),
  },
  {
    id: 'seed-review-scientist-1',
    planet: 'kepler-442-b',
    userid: 'seed-scientist',
    rate: 4,
    title: 'Peer-reviewed vacation experience',
    text: "After conducting a rigorous double-blind study (n=1, me), I can confirm with 95% confidence that this planet is \"pretty nice.\" The atmospheric composition is within acceptable parameters for respiration. P-value of my enjoyment: <0.001. Would replicate this experiment.",
    date: daysAgo(200),
  },

  // ============================================
  // Kepler-22 b
  // ============================================
  {
    id: 'seed-review-6',
    planet: 'kepler-22-b',
    userid: 'seed-zyx47',
    rate: 4,
    title: 'Water world paradise',
    text: "If you like swimming, you'll LOVE Kepler-22b. Bring your gills (or rent some at the orbital station). The bioluminescent plankton displays at night are unreal. Only downside: no solid ground for traditional camping.",
    date: daysAgo(20),
  },
  {
    id: 'seed-review-boomer-1',
    planet: 'kepler-22-b',
    userid: 'seed-boomer',
    rate: 2,
    title: 'Back in my day we had LAND',
    text: "What's with all these water worlds nowadays? When I was young we had PROPER planets with continents and mountains. You could take a walk without needing gill implants. Kids these days with their \"ocean planets\" and their \"submarine hotels.\" Give me good old Mars any day. At least it has DIRT.",
    date: daysAgo(14),
  },

  // ============================================
  // 55 Cancri e
  // ============================================
  {
    id: 'seed-review-7',
    planet: '55-cnc-e',
    userid: 'seed-captain',
    rate: 2,
    title: 'Too hot, even for me',
    text: "Look, I've visited some extreme worlds, but this is ridiculous. The diamond mantle tours sound cool until you realize you're orbiting inside your ship's heat shields the ENTIRE time. Great views from orbit though. Just... don't land.",
    date: daysAgo(10),
  },
  {
    id: 'seed-review-cryptobro-1',
    planet: '55-cnc-e',
    userid: 'seed-cryptobro',
    rate: 5,
    title: 'DIAMOND PLANET TO THE MOON 🚀💎',
    text: "Bro this planet is LITERALLY made of diamonds. Do you understand what this means for the galactic economy?? I'm buying up all the mining rights. This is not financial advice but also it's definitely financial advice. WAGMI. Diamond hands literally. 💎🙌 Who's laughing now, Dad??",
    date: daysAgo(2),
  },

  // ============================================
  // HD 189733 b
  // ============================================
  {
    id: 'seed-review-8',
    planet: 'hd-189733-b',
    userid: 'seed-wanderer',
    rate: 1,
    title: 'DO NOT VISIT - Glass rain!!!',
    text: "I don't care how pretty the blue color is from space. IT RAINS GLASS HERE. SIDEWAYS. AT 5000 MPH. My ship still has dents. Zero stars if I could. The tourism board should be shut down for even listing this place.",
    date: daysAgo(5),
  },
  {
    id: 'seed-review-ai-1',
    planet: 'hd-189733-b',
    userid: 'seed-ai',
    rate: 3,
    title: 'DESTINATION ASSESSMENT: ADEQUATE',
    text: "PROCESSING... Glass precipitation velocity: 5,400 mph. Atmospheric silicate content: OPTIMAL for industrial harvesting. Tourist survivability index: 0.02%. Recommendation: VISIT FOR RESOURCE EXTRACTION ONLY. Human comfort rating: NOT APPLICABLE. Overall score computed as average of all metrics. Thank you for using TOURISM-BOT-7.",
    date: daysAgo(1),
  },

  // ============================================
  // WASP-43 b (Hot Jupiter)
  // ============================================
  {
    id: 'seed-review-wasp43-1',
    planet: 'wasp-43-b',
    userid: 'seed-explorer',
    rate: 3,
    title: 'Extreme sports destination',
    text: "This is NOT a vacation planet. This is where you go to feel ALIVE. Surfing the supersonic winds at the day-night terminator line? Chef's kiss. Yes, you'll need a ship rated for 2000K temperatures. Yes, you might die. But the adrenaline rush is UNMATCHED.",
    date: daysAgo(50),
  },
  {
    id: 'seed-review-elder-1',
    planet: 'wasp-43-b',
    userid: 'seed-elder',
    rate: 5,
    title: 'A memory of stellar birth',
    text: 'We remember when this gas gathered, when the star first ignited, when the dance of gravity began. To your species, it is extreme. To us, it is a meditation on impermanence. The winds carry the songs of formation. Listen, young ones. Even chaos has harmony.',
    date: yearsAgo(50000),
  },

  // ============================================
  // CoRoT-3 b (Brown dwarf territory)
  // ============================================
  {
    id: 'seed-review-corot3-1',
    planet: 'corot-3-b',
    userid: 'seed-scientist',
    rate: 4,
    title: 'Is it even a planet? (Great either way)',
    text: "The eternal debate: planet or brown dwarf? At 22 Jupiter masses, it's right on the edge. Academically fascinating. The gravitational lensing effects are publishable material. Brought my grad students. They cried. I'm putting this on my CV.",
    date: daysAgo(180),
  },

  // ============================================
  // K2-138 system (resonant chain)
  // ============================================
  {
    id: 'seed-review-k2138-1',
    planet: 'k2-138-b',
    userid: 'seed-tourist',
    rate: 5,
    title: 'The musical system!',
    text: "Six planets in PERFECT orbital resonance! You can literally HEAR the gravitational harmonics if you have the right equipment. It's like the universe composed a symphony. Visited all six planets in one trip. K2-138 b is the innermost - hot but the views of the siblings are INCREDIBLE.",
    date: daysAgo(100),
  },
  {
    id: 'seed-review-k2138-2',
    planet: 'k2-138-f',
    userid: 'seed-influencer',
    rate: 5,
    title: 'Did a planet-hop collab here!!',
    text: "Collabed with @NebulaNancy and we did the WHOLE system in 72 hours!! The resonance thing is actually so cool - the planets literally orbit in musical ratios?? Like 3:2:3:2?? Math is giving main character energy honestly. F is the outermost and the chillest vibes. Perfect for meditation content 🧘‍♀️✨",
    date: daysAgo(25),
  },

  // ============================================
  // HAT-P-7 b
  // ============================================
  {
    id: 'seed-review-hatp7-1',
    planet: 'hat-p-7-b',
    userid: 'seed-wanderer',
    rate: 4,
    title: 'Ruby and sapphire clouds!',
    text: "The clouds here are made of corundum - literally rubies and sapphires condensing in the atmosphere. The sunrise looks like someone spilled a jewelry store across the sky. Expensive taste, this planet. Can't land but the orbital viewing platforms are worth every credit.",
    date: daysAgo(70),
  },

  // ============================================
  // TOI-270 system
  // ============================================
  {
    id: 'seed-review-toi270-1',
    planet: 'toi-270-b',
    userid: 'seed-captain',
    rate: 3,
    title: 'Transit research paradise',
    text: "Scientists LOVE this system. Three planets transiting a bright, quiet star? It's like the universe set up a laboratory. As a tourist though... meh. TOI-270 b is too hot, the others are okay. But if you're into watching researchers get excited, 10/10.",
    date: daysAgo(40),
  },

  // ============================================
  // Gliese 12 b (nearby potentially habitable)
  // ============================================
  {
    id: 'seed-review-gliese12-1',
    planet: 'gliese-12-b',
    userid: 'seed-zyx47',
    rate: 5,
    title: 'The next big thing!',
    text: "Only 40 light-years out and potentially habitable! This is going to be HUGE once the infrastructure is built. Got in early as an investor. The star is quiet, the temperature is right, the vibes are immaculate. Mark my words - this will be the next Proxima Cen b.",
    date: daysAgo(8),
  },
  {
    id: 'seed-review-ancient-2',
    planet: 'gliese-12-b',
    userid: 'seed-ancient',
    rate: 4,
    title: 'We left something here once',
    text: 'C̷h̸e̶c̵k̴ ̸t̸h̶e̸ ̴n̶o̸r̶t̴h̵e̴r̵n̸ ̷c̵o̸n̷t̷i̴n̷e̸n̶t̷.̴ ̵B̸e̶n̷e̵a̴t̸h̸ ̴t̴h̵e̴ ̶t̶h̷i̴r̵d̷ ̵m̵o̵u̶n̴t̵a̷i̸n̸ ̴f̵r̸o̷m̵ ̵t̸h̵e̴ ̷i̷n̶l̵a̷n̶d̷ ̷s̶e̷a̴.̴ ̷Y̷o̷u̵ ̶w̶i̴l̷l̸ ̵k̸n̶o̸w̵ ̶i̸t̷ ̴w̷h̶e̷n̸ ̷y̴o̵u̶ ̷s̵e̵e̸ ̵i̸t̶.̸ ̷D̸o̴ ̷n̸o̸t̸ ̵o̷p̵e̸n̸ ̵i̵t̴ ̵y̵e̶t̷.̴ ̵Y̶o̵u̶ ̸a̷r̶e̵ ̵n̵o̵t̷ ̸r̵e̴a̸d̸y̵.̷',
    date: yearsAgo(12000),
  },

  // ============================================
  // Random chaos reviews
  // ============================================
  {
    id: 'seed-review-ngts10-1',
    planet: 'ngts-10-b',
    userid: 'seed-karen',
    rate: 1,
    title: 'Year is only 18 HOURS?!',
    text: "I asked for a week-long vacation and apparently that's 9+ YEARS here?? The calendar is completely BROKEN. Also my birthday came like 500 times during dinner. I'm suing somebody. The star takes up half the sky and it's giving me anxiety. Would NOT recommend.",
    date: daysAgo(4),
  },
  {
    id: 'seed-review-hd12661-1',
    planet: 'hd-12661-b',
    userid: 'seed-boomer',
    rate: 3,
    title: 'Reminds me of Jupiter back home',
    text: "Finally, a good old-fashioned gas giant like they used to make. None of this 'super-Earth' or 'mini-Neptune' nonsense. Just honest hydrogen and helium. The kids won't appreciate it but us old-timers know what a REAL planet looks like.",
    date: daysAgo(60),
  },
];

/**
 * Get seed reviews for a planet
 */
export function getSeedReviews(planetId: string): PlanetReview[] {
  return SEED_REVIEWS.filter((r) => r.planet === planetId).map((review) => ({
    ...review,
    author: SEED_USERS[review.userid],
  }));
}

/**
 * Get a seed user by ID
 */
export function getSeedUser(userId: string): ReviewUser | undefined {
  return SEED_USERS[userId];
}
