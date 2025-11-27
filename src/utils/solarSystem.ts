/**
 * Solar System Generator
 * Converts star and planet data into 3D render data for Three.js
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
  planetType?: string; // Planet classification (Gas Giant, Neptune-like, etc.)
  hasAtmosphere?: number; // 0-1 scale for atmosphere thickness
  orbitRadius: number;
  orbitPeriod: number; // in animation frames
  orbitTilt: number; // radians
  orbitEccentricity: number;
  hasRings?: boolean;
  planetData?: Exoplanet;
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

const PLANET_COLORS: Record<string, string[]> = {
  'Gas Giant': ['#c9a86c', '#deb887', '#d4a574', '#c19a6b', '#b8860b'],
  'Neptune-like': ['#4a90d9', '#5ba3e0', '#6bb5e8', '#3d7fc4', '#2e6eb0'],
  'Sub-Neptune': ['#5fa8d3', '#7ab8db', '#8ec8e3', '#4a98c9', '#3a88b9'],
  'Super-Earth': ['#8b7355', '#9c8a6e', '#7a6548', '#6b5a3e', '#5c4d35'],
  'Earth-sized': ['#4a7c59', '#5a8c69', '#6a9c79', '#3a6c49', '#2a5c39'],
  'Sub-Earth': ['#a0522d', '#b0623d', '#c0724d', '#90421d', '#80320d'],
  'Terrestrial': ['#cd853f', '#d4956a', '#daa576', '#c0764a', '#b06640'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getStarColor(starClass: string | null): string {
  if (!starClass) return STELLAR_COLORS.G;
  const letter = starClass.charAt(0).toUpperCase();
  return STELLAR_COLORS[letter] || STELLAR_COLORS.G;
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

  // Star radius in solar radii (default to 1 if not available)
  const starRadius = star.st_rad ?? 1;
  // Star luminosity (log scale, default to 0 = 1 solar luminosity)
  const starLum = star.st_lum ?? 0;

  // Scale star diameter - use log scale for giant stars to keep visualization manageable
  // Small stars (< 5 R☉): linear scaling
  // Giant stars (> 5 R☉): logarithmic scaling to prevent massive stars from dominating
  const starDiameter = starRadius <= 5
    ? 2 + starRadius * 1.5
    : 2 + 5 * 1.5 + Math.log10(starRadius / 5) * 8;

  // Add the star
  bodies.push({
    id: star.id,
    name: star.hostname,
    displayName: star.hostname,
    type: 'star',
    diameter: starDiameter,
    color: getStarColor(star.star_class),
    emissive: getStarColor(star.star_class),
    emissiveIntensity: 0.8 + Math.pow(10, starLum) * 0.2,
    temperature: star.st_teff ?? 5778, // Default to Sun temperature
    orbitRadius: 0,
    orbitPeriod: 0,
    orbitTilt: 0,
    orbitEccentricity: 0,
  });

  // Sort planets by orbital distance
  const sortedPlanets = [...planets].sort((a, b) => {
    const aOrbit = a.pl_orbsmax ?? 999;
    const bOrbit = b.pl_orbsmax ?? 999;
    return aOrbit - bOrbit;
  });

  // Add planets
  sortedPlanets.forEach((planet, index) => {
    // Planet radius in Jupiter radii (use Earth radii converted if Jupiter not available)
    const planetRadJ = planet.pl_radj ?? (planet.pl_rade ? planet.pl_rade / 11.2 : 0.1);

    // Orbital properties
    const semiMajorAxis = planet.pl_orbsmax ?? (index + 1) * 0.5; // AU, default based on index
    const orbitalPeriod = planet.pl_orbper ?? Math.pow(semiMajorAxis, 1.5) * 365; // Kepler's 3rd law fallback
    const eccentricity = planet.pl_orbeccen ?? 0.05;

    // Scale orbit radius for visualization (compress large distances)
    // Use logarithmic scaling for better visualization
    // Ensure orbit is always outside the star (star radius + padding + orbit distance)
    const baseOrbitRadius = 5 + Math.log10(1 + semiMajorAxis * 10) * 8;
    const minOrbitRadius = starDiameter / 2 + 2; // At least star radius + padding
    const orbitRadius = Math.max(baseOrbitRadius, minOrbitRadius + index * 2);

    // Scale orbital period for animation (faster for outer planets too)
    const animationPeriod = 200 + Math.sqrt(orbitalPeriod) * 5;

    // Determine planet type for color
    const planetType = planet.planet_type || 'Terrestrial';

    // Scale planet size (with reasonable bounds)
    const diameter = clamp(0.3 + planetRadJ * 0.8, 0.2, 2.5);

    // Determine if planet should have rings (gas giants and ice giants)
    const hasRings = planetType === 'Gas Giant' || planetType === 'Neptune-like';

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
    });
  });

  return bodies;
}

/**
 * Get a display-friendly value with units
 */
export function formatStarProperty(key: string, value: number | string | null): string {
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
