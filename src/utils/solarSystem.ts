/**
 * Solar System Generator
 * Converts star and planet data into 3D render data for Three.js
 * Supports single stars, binary systems, and circumbinary planets
 */

import type { Star, Exoplanet } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export interface StellarBody {
  id: string;
  name: string;
  displayName: string;
  type: 'star' | 'planet';
  diameter: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  temperature?: number; // Temperature in Kelvin (star or planet equilibrium)
  spectralType?: string; // Star spectral type (e.g., "G2V", "M5", "K")
  planetType?: string; // Planet classification (Gas Giant, Neptune-like, etc.)
  hasAtmosphere?: number; // 0-1 scale for atmosphere thickness
  orbitRadius: number;
  orbitPeriod: number; // in animation frames
  orbitTilt: number; // radians
  orbitEccentricity: number;
  orbitArgOfPeriastron?: number; // radians - orientation of ellipse
  hasRings?: boolean;
  planetData?: Exoplanet;
  // Binary star system properties
  isPrimaryStar?: boolean;
  isCompanionStar?: boolean;
  // Rotation properties
  rotationSpeed: number; // radians per second for animation
  axialTilt: number; // radians - tilt of rotation axis
  isTidallyLocked: boolean; // if true, one face always toward star
}

// Binary system data from binary.json
export interface BinaryStarData {
  mass: number; // solar masses
  radius: number; // solar radii
  temperature: number; // K
  luminosity: number; // solar luminosities
}

export interface BinaryOrbitData {
  semiMajorAxis: number; // AU
  period: number; // days
  eccentricity: number; // 0-1
  inclination: number; // degrees
  argOfPeriastron: number; // degrees
}

export interface BinarySystemData {
  hostname: string;
  isCircumbinary: boolean;
  numStars: number;
  starA: BinaryStarData;
  starB: BinaryStarData;
  orbit: BinaryOrbitData;
  _notes?: string;
}

// Cache for binary data
let binaryDataCache: Map<string, BinarySystemData> | null = null;
let binaryDataPromise: Promise<Map<string, BinarySystemData>> | null = null;

/**
 * Load binary system data from binary.json
 */
export async function loadBinaryData(): Promise<Map<string, BinarySystemData>> {
  if (binaryDataCache) {
    return binaryDataCache;
  }

  if (binaryDataPromise) {
    return binaryDataPromise;
  }

  binaryDataPromise = fetch('/data/binary.json')
    .then((response) => response.json())
    .then((data: { systems: BinarySystemData[] }) => {
      const map = new Map<string, BinarySystemData>();
      for (const system of data.systems) {
        map.set(system.hostname, system);
      }
      binaryDataCache = map;
      return map;
    })
    .catch((error) => {
      console.warn('Failed to load binary.json:', error);
      return new Map<string, BinarySystemData>();
    });

  return binaryDataPromise;
}

/**
 * Get binary data for a specific system (sync - uses cache)
 */
export function getBinaryData(hostname: string): BinarySystemData | undefined {
  return binaryDataCache?.get(hostname);
}

// =============================================================================
// COLOR PALETTES
// =============================================================================

const STELLAR_COLORS: Record<string, string> = {
  O: '#9bb0ff', // Blue
  B: '#aabfff', // Blue-white
  A: '#cad7ff', // White
  F: '#f8f7ff', // Yellow-white
  G: '#fff4ea', // Yellow (Sun-like)
  K: '#ffd2a1', // Orange
  M: '#ffcc6f', // Red
  L: '#ff8c42', // Brown dwarf
  T: '#ff6b35', // Cool brown dwarf
  Y: '#ff4500', // Coolest brown dwarf
};

// Companion star colors - typically cooler/redder than primary
const COMPANION_STAR_COLORS: Record<string, string> = {
  O: '#aabfff', // Slightly cooler blue
  B: '#cad7ff', // Blue-white to white
  A: '#f8f7ff', // White to yellow-white
  F: '#fff4ea', // Yellow-white to yellow
  G: '#ffd2a1', // Yellow to orange
  K: '#ffcc6f', // Orange to red
  M: '#ff8c42', // Red to brown
  L: '#ff6b35', // Brown dwarf
  T: '#ff4500', // Cool brown dwarf
  Y: '#cc3700', // Coolest brown dwarf
};

const PLANET_COLORS: Record<string, string[]> = {
  'Gas Giant': ['#c9a86c', '#deb887', '#d4a574', '#c19a6b', '#b8860b'],
  'Neptune-like': ['#4a90d9', '#5ba3e0', '#6bb5e8', '#3d7fc4', '#2e6eb0'],
  'Sub-Neptune': ['#5fa8d3', '#7ab8db', '#8ec8e3', '#4a98c9', '#3a88b9'],
  'Super-Earth': ['#8b7355', '#9c8a6e', '#7a6548', '#6b5a3e', '#5c4d35'],
  'Earth-sized': ['#4a7c59', '#5a8c69', '#6a9c79', '#3a6c49', '#2a5c39'],
  'Sub-Earth': ['#a0522d', '#b0623d', '#c0724d', '#90421d', '#80320d'],
  Terrestrial: ['#cd853f', '#d4956a', '#daa576', '#c0764a', '#b06640'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getStarColor(starClass: string | null): string {
  if (!starClass) return STELLAR_COLORS.G;
  const letter = starClass.charAt(0).toUpperCase();
  return STELLAR_COLORS[letter] || STELLAR_COLORS.G;
}

function getCompanionStarColor(starClass: string | null): string {
  if (!starClass) return COMPANION_STAR_COLORS.K;
  const letter = starClass.charAt(0).toUpperCase();
  return COMPANION_STAR_COLORS[letter] || COMPANION_STAR_COLORS.K;
}

/**
 * Get star color from temperature (for binary.json data)
 */
function getStarColorFromTemp(temperature: number): string {
  // Approximate spectral class from temperature
  if (temperature >= 30000) return STELLAR_COLORS.O;
  if (temperature >= 10000) return STELLAR_COLORS.B;
  if (temperature >= 7500) return STELLAR_COLORS.A;
  if (temperature >= 6000) return STELLAR_COLORS.F;
  if (temperature >= 5200) return STELLAR_COLORS.G;
  if (temperature >= 3700) return STELLAR_COLORS.K;
  if (temperature >= 2400) return STELLAR_COLORS.M;
  if (temperature >= 1300) return STELLAR_COLORS.L;
  if (temperature >= 550) return STELLAR_COLORS.T;
  return STELLAR_COLORS.Y;
}

/**
 * Get spectral type string from temperature
 * Used for stars without explicit spectral type data
 */
function getSpectralTypeFromTemp(temperature: number): string {
  if (temperature >= 30000) return 'O';
  if (temperature >= 10000) return 'B';
  if (temperature >= 7500) return 'A';
  if (temperature >= 6000) return 'F';
  if (temperature >= 5200) return 'G';
  if (temperature >= 3700) return 'K';
  if (temperature >= 2400) return 'M';
  if (temperature >= 1300) return 'L';
  if (temperature >= 550) return 'T';
  return 'Y';
}

/**
 * Maximum visual diameter for stars to prevent overwhelming visuals
 * This caps giant stars at a reasonable size for the scene
 */
const MAX_STAR_VISUAL_DIAMETER = 18;

/**
 * Scale stellar radius to visual diameter for rendering
 * Uses logarithmic scaling for giant stars and clamps to max diameter
 * @param radiusSolar - Star radius in solar radii
 * @returns Visual diameter clamped to MAX_STAR_VISUAL_DIAMETER
 */
function radiusToVisualDiameter(radiusSolar: number): number {
  // Use log scale for giant stars to keep visualization manageable
  let diameter: number;
  if (radiusSolar <= 5) {
    diameter = 2 + radiusSolar * 1.5;
  } else {
    diameter = 2 + 5 * 1.5 + Math.log10(radiusSolar / 5) * 8;
  }
  // Clamp to maximum to prevent overwhelming corona/glow effects
  return Math.min(diameter, MAX_STAR_VISUAL_DIAMETER);
}

/**
 * Convert AU to visual units for orbit rendering
 * Uses logarithmic scaling for better visualization of wide binaries
 */
function auToVisualOrbit(au: number, minRadius: number = 5): number {
  // Log scale: compress large distances while keeping small ones visible
  return Math.max(minRadius, 5 + Math.log10(1 + au * 10) * 8);
}

function getPlanetColor(planetType: string | null, index: number): string {
  if (!planetType) return '#888888';
  const colors = PLANET_COLORS[planetType] || PLANET_COLORS['Terrestrial'];
  return colors[index % colors.length];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// =============================================================================
// PHYSICAL CONSTANTS FOR RING CALCULATIONS
// =============================================================================

/** Sun/Earth mass ratio */
const SOLAR_MASS_IN_EARTH_MASSES = 332946;

/** AU in kilometers */
const AU_IN_KM = 1.496e8;

/** Earth radius in kilometers */
const EARTH_RADIUS_KM = 6371;

/** Default ring particle density (g/cm³) - icy particles like Saturn's rings */
const DEFAULT_RING_PARTICLE_DENSITY = 1.0;

// =============================================================================
// RING PROBABILITY HEURISTIC
// =============================================================================

/**
 * Estimate planet mass from radius using Chen & Kipping (2017) mass-radius relation
 * @param radiusEarth - Planet radius in Earth radii
 * @returns Estimated mass in Earth masses
 */
function estimateMassFromRadius(radiusEarth: number): number {
  // Chen & Kipping "Forecaster" empirical relation (simplified)
  // Different power laws for different size regimes
  if (radiusEarth < 1.23) {
    // Rocky/Earth-like: M ~ R^3.7
    return Math.pow(radiusEarth, 3.7);
  } else if (radiusEarth < 2.0) {
    // Super-Earth transition: M ~ R^1.7
    return 1.9 * Math.pow(radiusEarth, 1.7);
  } else if (radiusEarth < 4.0) {
    // Neptune-like: M ~ R^0.5
    return 2.7 * Math.pow(radiusEarth, 0.5) * 3;
  } else {
    // Gas giant: M ~ R^0.01 (weak dependence, use Jupiter-like)
    return 17.5 * Math.pow(radiusEarth / 4, 0.59) * 17.8;
  }
}

/**
 * Calculate Hill radius - the gravitational sphere of influence
 * @param semiMajorAxisAU - Orbital distance in AU
 * @param planetMassEarth - Planet mass in Earth masses
 * @param starMassSolar - Star mass in Solar masses
 * @returns Hill radius in kilometers
 */
function calculateHillRadius(
  semiMajorAxisAU: number,
  planetMassEarth: number,
  starMassSolar: number
): number {
  // R_H = a * (M_p / (3 * M_star))^(1/3)
  const massRatio = planetMassEarth / (3 * starMassSolar * SOLAR_MASS_IN_EARTH_MASSES);
  const hillRadiusAU = semiMajorAxisAU * Math.pow(massRatio, 1/3);
  return hillRadiusAU * AU_IN_KM;
}

/**
 * Calculate Roche limit - minimum distance before tidal forces destroy a satellite
 * @param planetRadiusEarth - Planet radius in Earth radii
 * @param planetDensity - Planet density in g/cm³
 * @param ringParticleDensity - Ring particle density in g/cm³
 * @returns Roche limit in kilometers
 */
function calculateRocheLimit(
  planetRadiusEarth: number,
  planetDensity: number,
  ringParticleDensity: number = DEFAULT_RING_PARTICLE_DENSITY
): number {
  // R_Roche ≈ 2.456 * R_p * (ρ_p / ρ_s)^(1/3)
  const planetRadiusKm = planetRadiusEarth * EARTH_RADIUS_KM;
  const densityRatio = planetDensity / ringParticleDensity;
  return 2.456 * planetRadiusKm * Math.pow(densityRatio, 1/3);
}

/**
 * Calculate physics-based ring probability score
 * Based on DeepSeek research heuristic combining multiple factors:
 * - Giantness: Larger planets more likely to have rings
 * - Hill/Roche ratio: Must have stable ring zone (R_H >> R_Roche)
 * - Temperature: Cold planets favor icy rings
 * - Youth: Young systems have more debris
 *
 * @param planet - Exoplanet data
 * @returns Ring probability score (0-1)
 */
export function calculateRingProbability(planet: Exoplanet): number {
  // ==========================================================================
  // 1. GIANTNESS SCORE (S_G) - larger planets more likely to have rings
  // ==========================================================================
  const radiusEarth = planet.pl_rade ?? 1.0;
  let giantnessScore: number;

  if (radiusEarth > 8) {
    // Large gas giants (Jupiter-sized and above)
    giantnessScore = 1.0;
  } else if (radiusEarth > 4) {
    // Saturn-sized, Neptune-sized
    giantnessScore = 0.6;
  } else if (radiusEarth > 2) {
    // Sub-Neptunes, mini-Neptunes
    giantnessScore = 0.2;
  } else {
    // Rocky worlds - very unlikely to have rings
    giantnessScore = 0.05;
  }

  // ==========================================================================
  // 2. HILL/ROCHE AVAILABILITY SCORE (S_HR) - can rings exist?
  // ==========================================================================
  const semiMajorAxisAU = planet.pl_orbsmax ?? 1.0;
  const starMassSolar = planet.st_mass ?? 1.0;

  // Get planet mass - use actual if available, otherwise estimate from radius
  const planetMassEarth = planet.pl_bmasse ?? estimateMassFromRadius(radiusEarth);

  // Get planet density - use actual if available, otherwise estimate
  // Typical densities: Gas giant ~1.3, Neptune-like ~1.6, Rocky ~5.5
  let planetDensity = planet.pl_dens;
  if (!planetDensity) {
    const planetType = planet.planet_type || 'Terrestrial';
    if (planetType === 'Gas Giant') planetDensity = 1.3;
    else if (planetType === 'Neptune-like' || planetType === 'Sub-Neptune') planetDensity = 1.6;
    else planetDensity = 5.5;
  }

  // Calculate Hill radius and Roche limit
  const hillRadiusKm = calculateHillRadius(semiMajorAxisAU, planetMassEarth, starMassSolar);
  const rocheKm = calculateRocheLimit(radiusEarth, planetDensity);

  // Ratio X = R_H / R_Roche - how much room for rings?
  const hillRocheRatio = hillRadiusKm / rocheKm;

  let hillRocheScore: number;
  if (hillRocheRatio > 10) {
    // Huge ring zone available (like Saturn at 9.5 AU)
    hillRocheScore = 1.0;
  } else if (hillRocheRatio > 3) {
    // Good ring zone
    hillRocheScore = 0.8;
  } else if (hillRocheRatio > 1.5) {
    // Marginal ring zone
    hillRocheScore = 0.4;
  } else {
    // Ring zone too small or non-existent
    hillRocheScore = 0.05;
  }

  // ==========================================================================
  // 3. COLDNESS/COMPOSITION SCORE (S_T) - icy rings favored if cold
  // ==========================================================================
  // Use equilibrium temperature, or estimate from insolation
  let equilibriumTemp = planet.pl_eqt;
  if (!equilibriumTemp && planet.pl_insol) {
    // Estimate: T_eq ≈ 255 * (insolation)^0.25 for Earth-like albedo
    equilibriumTemp = 255 * Math.pow(planet.pl_insol, 0.25);
  }
  equilibriumTemp = equilibriumTemp ?? 300; // Default to Earth-like

  let temperatureScore: number;
  if (equilibriumTemp < 150) {
    // Very cold - icy rings stable (like Saturn's)
    temperatureScore = 1.0;
  } else if (equilibriumTemp < 250) {
    // Cold - mixed ice/rock possible
    temperatureScore = 0.5;
  } else if (equilibriumTemp < 400) {
    // Warm - only rocky/dusty rings, less stable
    temperatureScore = 0.2;
  } else {
    // Hot - rings would sublimate quickly
    temperatureScore = 0.05;
  }

  // ==========================================================================
  // 4. YOUTH/DEBRIS SCORE (S_A) - young systems have more debris
  // ==========================================================================
  let youthScore: number;

  if (planet.is_young_system) {
    // Flagged as young (<1 Gyr typically)
    youthScore = 1.0;
  } else if (planet.st_age !== null && planet.st_age < 0.3) {
    // Very young system (<300 Myr) - lots of debris
    youthScore = 1.0;
  } else if (planet.st_age !== null && planet.st_age < 1.0) {
    // Young system (300 Myr - 1 Gyr)
    youthScore = 0.7;
  } else if (planet.st_age !== null && planet.st_age < 3.0) {
    // Middle-aged
    youthScore = 0.4;
  } else {
    // Old or unknown age (most Kepler targets)
    youthScore = 0.3;
  }

  // ==========================================================================
  // COMBINE SCORES WITH WEIGHTS
  // ==========================================================================
  // Weights prioritize physical possibility (Hill/Roche) and size (Giantness)
  const weights = {
    hillRoche: 0.35,    // Most important - can rings physically exist?
    giantness: 0.30,    // Large planets capture/retain ring material
    temperature: 0.20,  // Temperature affects ring composition/stability
    youth: 0.15,        // Young systems have more debris
  };

  const totalScore =
    weights.hillRoche * hillRocheScore +
    weights.giantness * giantnessScore +
    weights.temperature * temperatureScore +
    weights.youth * youthScore;

  return clamp(totalScore, 0, 1);
}

/**
 * Determine if a planet should have rings based on physics-based probability
 * Uses deterministic seed for consistency across renders
 * @param planet - Exoplanet data
 * @returns True if planet should have rings
 */
export function shouldHaveRings(planet: Exoplanet): boolean {
  // Only gas giants and ice giants can have significant rings
  const planetType = planet.planet_type || 'Terrestrial';
  if (planetType !== 'Gas Giant' && planetType !== 'Neptune-like' && planetType !== 'Sub-Neptune') {
    return false;
  }

  // Calculate physics-based probability
  const ringProbability = calculateRingProbability(planet);

  // Use deterministic seed so same planet always has same result
  const seed = hashString(planet.pl_name + '-rings');

  // Planet has rings if random seed < probability score
  return seed < ringProbability;
}

// =============================================================================
// ROTATION & AXIAL TILT UTILITIES
// =============================================================================

/** Degrees to radians conversion */
const DEG_TO_RAD = Math.PI / 180;

/**
 * Generate a deterministic hash from a string (for consistent random values)
 * @param str - Input string (typically planet name)
 * @returns Number in range 0-1
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Base rotation speeds by planet type (radians per second for animation)
 * Based on real solar system data:
 * - Jupiter: ~10 hour rotation → fastest
 * - Earth: ~24 hour rotation → medium
 * - Venus: ~243 days → very slow (tidally influenced)
 */
const ROTATION_SPEEDS: Record<string, number> = {
  'Gas Giant': 0.6,     // Fast rotators like Jupiter
  'Neptune-like': 0.4,  // Ice giants rotate moderately fast
  'Sub-Neptune': 0.3,   // Mini-Neptunes
  'Super-Earth': 0.15,  // Larger rocky worlds
  'Earth-sized': 0.15,  // Earth-like rotation
  'Sub-Earth': 0.1,     // Small rocky worlds
  'Terrestrial': 0.12,  // Default rocky
};

/**
 * Estimate rotation speed based on planet type and tidal locking
 * @param planet - Exoplanet data
 * @returns Rotation speed in radians per second (for animation)
 */
export function estimateRotationSpeed(planet: Exoplanet): number {
  const planetType = planet.planet_type || 'Terrestrial';
  const baseSpeed = ROTATION_SPEEDS[planetType] ?? 0.12;
  
  // Tidally locked planets don't rotate relative to their star
  // Return 0 for animation - CelestialBody will handle the locked face
  if (planet.is_likely_tidally_locked) {
    return 0;
  }
  
  // Add small variation based on planet name hash for uniqueness
  const variation = hashString(planet.pl_name) * 0.3 - 0.15; // ±15%
  
  return baseSpeed * (1 + variation);
}

/**
 * Estimate axial tilt using physics-based heuristics
 * 
 * Factors considered:
 * - Tidal locking: locked planets have near-zero tilt
 * - Distance from star: closer = more tidal damping = lower tilt
 * - Temperature: hot planets experience more damping
 * - Eccentricity: high eccentricity may indicate dynamical history
 * - Planet type: gas giants damp faster due to fluid nature
 * 
 * @param planet - Exoplanet data
 * @returns Axial tilt in radians
 */
export function estimateAxialTilt(planet: Exoplanet): number {
  // Base tilt: Earth-like default (23.4°)
  let baseTilt = 23.4;
  
  // Tidally locked planets have very low axial tilt (tidal forces align the axis)
  if (planet.is_likely_tidally_locked) {
    // Small variation 0-3° for locked planets
    return hashString(planet.pl_name) * 3 * DEG_TO_RAD;
  }
  
  // Tidal damping factor based on orbital distance
  // Closer planets experience stronger tides → lower tilt
  const semiMajorAxis = planet.pl_orbsmax ?? 1.0;
  if (semiMajorAxis < 0.1) {
    // Very close: strong damping (reduce tilt by 70%)
    baseTilt *= 0.3;
  } else if (semiMajorAxis < 0.3) {
    // Close: moderate damping (reduce by 50%)
    baseTilt *= 0.5;
  } else if (semiMajorAxis < 0.5) {
    // Moderately close: some damping (reduce by 30%)
    baseTilt *= 0.7;
  }
  
  // Temperature factor: hot planets (>1000K) have more damping
  const temp = planet.pl_eqt ?? 300;
  if (temp > 1500) {
    baseTilt *= 0.4; // Ultra-hot: significant damping
  } else if (temp > 1000) {
    baseTilt *= 0.6; // Hot: moderate damping
  }
  
  // Planet type: gas giants damp faster due to fluid interiors
  const planetType = planet.planet_type || 'Terrestrial';
  if (planetType === 'Gas Giant' || planetType === 'Neptune-like') {
    baseTilt *= 0.7; // Gas/ice giants tend toward lower tilts
  }
  
  // Eccentricity factor: high eccentricity may indicate past perturbations
  // which could result in higher tilts
  const eccentricity = planet.pl_orbeccen ?? 0.05;
  if (eccentricity > 0.3) {
    // High eccentricity: widen the possible tilt range
    baseTilt *= (1 + eccentricity * 0.5);
  }
  
  // Add deterministic variation based on planet name
  // This ensures each planet has a unique but consistent tilt
  const hash = hashString(planet.pl_name);
  const variation = (hash - 0.5) * 0.6; // ±30% variation
  baseTilt *= (1 + variation);
  
  // Clamp to realistic range (0-45°, extreme tilts like Uranus are rare)
  baseTilt = clamp(baseTilt, 0, 45);
  
  return baseTilt * DEG_TO_RAD;
}

// =============================================================================
// GENERATOR
// =============================================================================

/**
 * Generate solar system data for 3D rendering
 * @param star - The host star
 * @param planets - Array of planets orbiting the star
 * @returns Array of stellar bodies for rendering
 */
export function generateSolarSystem(
  star: Star,
  planets: Exoplanet[]
): StellarBody[] {
  const bodies: StellarBody[] = [];

  // Check if this is a binary/multiple star system
  const isMultiStarSystem = star.sy_snum > 1;

  // Try to get detailed binary data from binary.json
  const binaryData = getBinaryData(star.hostname);

  // Use binary.json data if available, otherwise fall back to estimates
  if (isMultiStarSystem && binaryData) {
    // =========================================================================
    // BINARY SYSTEM WITH DETAILED DATA
    // =========================================================================
    const { starA, starB, orbit } = binaryData;

    // Calculate visual sizes
    const starADiameter = radiusToVisualDiameter(starA.radius);
    const starBDiameter = radiusToVisualDiameter(starB.radius);

    // Binary orbit - convert AU to visual units
    // Stars orbit around barycenter, distances inversely proportional to mass
    const totalMass = starA.mass + starB.mass;
    const massRatioA = starB.mass / totalMass; // Star A orbits closer if heavier
    const massRatioB = starA.mass / totalMass;

    const binaryVisualSeparation = auToVisualOrbit(
      orbit.semiMajorAxis,
      starADiameter + starBDiameter + 2
    );

    // Animation period - scale real period to reasonable animation speed
    // ~40 day period = ~120 frames, scale logarithmically for longer periods
    const animationPeriod = 120 * Math.log10(1 + orbit.period / 40);

    // Convert argument of periastron to radians
    const argOfPeriastronRad = (orbit.argOfPeriastron * Math.PI) / 180;

    // Add primary star (Star A)
    bodies.push({
      id: star.id,
      name: star.hostname,
      displayName: `${star.hostname} A (Primary)`,
      type: 'star',
      diameter: starADiameter,
      color: getStarColorFromTemp(starA.temperature),
      emissive: getStarColorFromTemp(starA.temperature),
      emissiveIntensity: 0.8 + Math.min(starA.luminosity * 0.1, 0.5),
      temperature: starA.temperature,
      spectralType: star.st_spectype ?? star.star_class ?? undefined,
      orbitRadius: binaryVisualSeparation * massRatioA,
      orbitPeriod: animationPeriod,
      orbitTilt: ((90 - orbit.inclination) * Math.PI) / 180, // Convert to radians
      orbitEccentricity: orbit.eccentricity,
      orbitArgOfPeriastron: argOfPeriastronRad,
      isPrimaryStar: true,
      isCompanionStar: false,
      // Stars use default rotation values (not physics-based)
      rotationSpeed: 0.1,
      axialTilt: 0,
      isTidallyLocked: false,
    });

    // Add companion star (Star B)
    // For companions, estimate spectral type from temperature (cooler = later type)
    const companionSpectralType = getSpectralTypeFromTemp(starB.temperature);
    bodies.push({
      id: `${star.id}-B`,
      name: `${star.hostname} B`,
      displayName: `${star.hostname} B (Companion)`,
      type: 'star',
      diameter: starBDiameter,
      color: getStarColorFromTemp(starB.temperature),
      emissive: getStarColorFromTemp(starB.temperature),
      emissiveIntensity: 0.8 + Math.min(starB.luminosity * 0.1, 0.5),
      temperature: starB.temperature,
      spectralType: companionSpectralType,
      orbitRadius: binaryVisualSeparation * massRatioB,
      orbitPeriod: animationPeriod, // Same period, opposite phase handled in renderer
      orbitTilt: ((90 - orbit.inclination) * Math.PI) / 180,
      orbitEccentricity: orbit.eccentricity,
      orbitArgOfPeriastron: argOfPeriastronRad + Math.PI, // Opposite side
      isPrimaryStar: false,
      isCompanionStar: true,
      // Stars use default rotation values (not physics-based)
      rotationSpeed: 0.1,
      axialTilt: 0,
      isTidallyLocked: false,
    });
  } else {
    // =========================================================================
    // SINGLE STAR OR BINARY WITHOUT DETAILED DATA (fallback)
    // =========================================================================
    const starRadius = star.st_rad ?? 1;
    const starLum = star.st_lum ?? 0;
    const starDiameter = radiusToVisualDiameter(starRadius);

    // For binary systems without data, estimate companion at 70% size
    const companionDiameter = starDiameter * 0.7;
    const binaryOrbitRadius = isMultiStarSystem ? starDiameter * 1.5 + 2 : 0;

    // Add the primary star
    bodies.push({
      id: star.id,
      name: star.hostname,
      displayName: isMultiStarSystem
        ? `${star.hostname} A (Primary)`
        : star.hostname,
      type: 'star',
      diameter: starDiameter,
      color: getStarColor(star.star_class),
      emissive: getStarColor(star.star_class),
      emissiveIntensity: 0.8 + Math.pow(10, starLum) * 0.2,
      temperature: star.st_teff ?? 5778,
      spectralType: star.st_spectype ?? star.star_class ?? undefined,
      orbitRadius: isMultiStarSystem ? binaryOrbitRadius * 0.4 : 0,
      orbitPeriod: isMultiStarSystem ? 120 : 0,
      orbitTilt: 0,
      orbitEccentricity: 0.1,
      isPrimaryStar: true,
      isCompanionStar: false,
      // Stars use default rotation values (not physics-based)
      rotationSpeed: 0.1,
      axialTilt: 0,
      isTidallyLocked: false,
    });

    // Add companion star for binary/multiple systems (estimated)
    if (isMultiStarSystem) {
      const companionTemp = (star.st_teff ?? 5778) * 0.85;

      bodies.push({
        id: `${star.id}-B`,
        name: `${star.hostname} B`,
        displayName: `${star.hostname} B (Companion)`,
        type: 'star',
        diameter: companionDiameter,
        color: getCompanionStarColor(star.star_class),
        emissive: getCompanionStarColor(star.star_class),
        emissiveIntensity: 0.6 + Math.pow(10, starLum * 0.7) * 0.15,
        temperature: companionTemp,
        spectralType: getSpectralTypeFromTemp(companionTemp),
        orbitRadius: binaryOrbitRadius * 0.6,
        orbitPeriod: 120,
        orbitTilt: 0,
        orbitEccentricity: 0.1,
        isPrimaryStar: false,
        isCompanionStar: true,
        // Stars use default rotation values (not physics-based)
        rotationSpeed: 0.1,
        axialTilt: 0,
        isTidallyLocked: false,
      });
    }
  }

  // Calculate minimum planet orbit radius based on binary configuration
  const binaryOuterRadius = bodies
    .filter((b) => b.type === 'star')
    .reduce((max, b) => Math.max(max, b.orbitRadius + b.diameter / 2), 0);

  // Sort planets by orbital distance
  const sortedPlanets = [...planets].sort((a, b) => {
    const aOrbit = a.pl_orbsmax ?? 999;
    const bOrbit = b.pl_orbsmax ?? 999;
    return aOrbit - bOrbit;
  });

  // For circumbinary systems, planets need to orbit outside the binary pair
  // Minimum safe orbit is typically 2-4x the binary separation
  const minPlanetOrbitRadius = binaryOuterRadius * 2.5 + 2;

  // Add planets
  sortedPlanets.forEach((planet, index) => {
    // Planet radius in Jupiter radii (use Earth radii converted if Jupiter not available)
    const planetRadJ =
      planet.pl_radj ?? (planet.pl_rade ? planet.pl_rade / 11.2 : 0.1);

    // Orbital properties
    const semiMajorAxis = planet.pl_orbsmax ?? (index + 1) * 0.5; // AU, default based on index
    const orbitalPeriod =
      planet.pl_orbper ?? Math.pow(semiMajorAxis, 1.5) * 365; // Kepler's 3rd law fallback
    const eccentricity = planet.pl_orbeccen ?? 0.05;

    // Scale orbit radius for visualization (compress large distances)
    // Ensure orbit is always outside the star(s)
    const baseOrbitRadius = auToVisualOrbit(semiMajorAxis);
    const orbitRadius = Math.max(
      baseOrbitRadius,
      minPlanetOrbitRadius + index * 2
    );

    // Scale orbital period for animation (faster for outer planets too)
    const animationPeriod = 200 + Math.sqrt(orbitalPeriod) * 5;

    // Determine planet type for color
    const planetType = planet.planet_type || 'Terrestrial';

    // Scale planet size (with reasonable bounds)
    const diameter = clamp(0.3 + planetRadJ * 0.8, 0.2, 2.5);

    // Determine if planet should have rings using physics-based heuristic
    // Considers: size, Hill/Roche ratio, temperature, system age
    const hasRings = shouldHaveRings(planet);

    // Estimate atmosphere based on planet type and size
    // Gas giants and ice giants always have thick atmospheres
    // Rocky planets: larger ones more likely to retain atmosphere
    let hasAtmosphere = 0;
    if (planetType === 'Gas Giant' || planetType === 'Neptune-like') {
      hasAtmosphere = 1.0;
    } else if (planetType === 'Sub-Neptune') {
      hasAtmosphere = 0.8;
    } else if (planetType === 'Super-Earth') {
      hasAtmosphere = 0.5;
    } else if (planetType === 'Earth-sized') {
      hasAtmosphere = 0.6;
    } else {
      hasAtmosphere = 0.2; // Thin or no atmosphere for small rocky worlds
    }

    // Calculate physics-based rotation and axial tilt
    const rotationSpeed = estimateRotationSpeed(planet);
    const axialTilt = estimateAxialTilt(planet);
    const isTidallyLocked = planet.is_likely_tidally_locked ?? false;

    bodies.push({
      id: planet.pl_name,
      name: planet.pl_name,
      displayName: `${planet.pl_name} (${planetType})`,
      type: 'planet',
      diameter,
      color: getPlanetColor(planetType, index),
      temperature: planet.pl_eqt ?? 300, // Equilibrium temperature, default to Earth-like
      planetType,
      hasAtmosphere,
      orbitRadius,
      orbitPeriod: animationPeriod,
      orbitTilt: eccentricity * 0.3, // Small tilt based on eccentricity
      orbitEccentricity: eccentricity,
      hasRings,
      planetData: planet,
      // Physics-based rotation properties
      rotationSpeed,
      axialTilt,
      isTidallyLocked,
    });
  });

  return bodies;
}

/**
 * Get a display-friendly value with units
 */
export function formatStarProperty(
  key: string,
  value: number | string | null
): string {
  if (value === null || value === undefined) return 'Unknown';

  const formatters: Record<string, (v: number) => string> = {
    st_teff: (v) => `${v.toLocaleString()} K`,
    st_rad: (v) => `${v.toFixed(2)} R☉`,
    st_mass: (v) => `${v.toFixed(2)} M☉`,
    st_lum: (v) => `${Math.pow(10, v).toFixed(2)} L☉`,
    st_age: (v) => `${v.toFixed(1)} Gyr`,
    st_met: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)} dex`,
    sy_dist: (v) => `${v.toFixed(1)} pc`,
    distance_ly: (v) => `${v.toFixed(1)} ly`,
  };

  if (typeof value === 'number' && formatters[key]) {
    return formatters[key](value);
  }

  return String(value);
}
