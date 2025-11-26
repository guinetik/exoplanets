/**
 * 3D Math Utilities for ThreeJS Visualization
 */

import type { Vector3D, SphericalCoords, CartesianCoords, OrbitalElements, Exoplanet, Star } from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const PARSEC_TO_LY = 3.26156;
export const LY_TO_PARSEC = 1 / PARSEC_TO_LY;
export const AU_TO_KM = 149597870.7;
export const EARTH_RADIUS_KM = 6371;
export const JUPITER_RADIUS_KM = 69911;
export const SOLAR_RADIUS_KM = 695700;

// =============================================================================
// COORDINATE CONVERSIONS
// =============================================================================

/**
 * Convert spherical coordinates (RA, Dec, distance) to Cartesian (x, y, z)
 * Uses astronomical convention:
 * - X points toward RA=0, Dec=0
 * - Y points toward RA=90°, Dec=0
 * - Z points toward Dec=90° (North celestial pole)
 */
export function sphericalToCartesian(coords: SphericalCoords): CartesianCoords {
  const raRad = coords.ra * DEG_TO_RAD;
  const decRad = coords.dec * DEG_TO_RAD;
  const dist = coords.distance;

  return {
    x: dist * Math.cos(decRad) * Math.cos(raRad),
    y: dist * Math.cos(decRad) * Math.sin(raRad),
    z: dist * Math.sin(decRad),
  };
}

/**
 * Convert Cartesian coordinates to spherical
 */
export function cartesianToSpherical(coords: CartesianCoords): SphericalCoords {
  const distance = Math.sqrt(coords.x ** 2 + coords.y ** 2 + coords.z ** 2);
  const dec = Math.asin(coords.z / distance) * RAD_TO_DEG;
  let ra = Math.atan2(coords.y, coords.x) * RAD_TO_DEG;
  if (ra < 0) ra += 360;

  return { ra, dec, distance };
}

/**
 * Get 3D position from an Exoplanet or Star
 * Returns position in parsecs
 */
export function getPosition3D(obj: Exoplanet | Star): Vector3D | null {
  if (obj.x_pc !== null && obj.y_pc !== null && obj.z_pc !== null) {
    return { x: obj.x_pc, y: obj.y_pc, z: obj.z_pc };
  }

  // Calculate from unit vector and distance
  if (obj.sy_dist !== null) {
    return {
      x: obj.x * obj.sy_dist,
      y: obj.y * obj.sy_dist,
      z: obj.z * obj.sy_dist,
    };
  }

  return null;
}

/**
 * Get 3D position in light-years
 */
export function getPositionLY(obj: Exoplanet | Star): Vector3D | null {
  const pos = getPosition3D(obj);
  if (!pos) return null;

  return {
    x: pos.x * PARSEC_TO_LY,
    y: pos.y * PARSEC_TO_LY,
    z: pos.z * PARSEC_TO_LY,
  };
}

// =============================================================================
// DISTANCE CALCULATIONS
// =============================================================================

/**
 * Calculate distance between two 3D points
 */
export function distance3D(a: Vector3D, b: Vector3D): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
}

/**
 * Calculate angular distance between two celestial objects (degrees)
 */
export function angularDistance(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number
): number {
  const ra1Rad = ra1 * DEG_TO_RAD;
  const dec1Rad = dec1 * DEG_TO_RAD;
  const ra2Rad = ra2 * DEG_TO_RAD;
  const dec2Rad = dec2 * DEG_TO_RAD;

  const cosAngle =
    Math.sin(dec1Rad) * Math.sin(dec2Rad) +
    Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);

  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * RAD_TO_DEG;
}

// =============================================================================
// ORBITAL MECHANICS
// =============================================================================

/**
 * Calculate position on an elliptical orbit at a given time
 * Returns position relative to the focus (star)
 */
export function calculateOrbitalPosition(
  elements: OrbitalElements,
  time: number // in days from epoch
): Vector3D {
  const { semiMajorAxis, eccentricity, inclination, period } = elements;

  // Mean anomaly (position along orbit)
  const meanAnomaly = ((2 * Math.PI * time) / period) % (2 * Math.PI);

  // Solve Kepler's equation for eccentric anomaly (Newton-Raphson)
  let E = meanAnomaly;
  for (let i = 0; i < 10; i++) {
    E = E - (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
  }

  // True anomaly
  const trueAnomaly =
    2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
    );

  // Distance from focus
  const r = semiMajorAxis * (1 - eccentricity * Math.cos(E));

  // Position in orbital plane
  const xOrbit = r * Math.cos(trueAnomaly);
  const yOrbit = r * Math.sin(trueAnomaly);

  // Apply inclination (rotate around X axis)
  const incRad = inclination * DEG_TO_RAD;
  return {
    x: xOrbit,
    y: yOrbit * Math.cos(incRad),
    z: yOrbit * Math.sin(incRad),
  };
}

/**
 * Generate orbit path points for visualization
 */
export function generateOrbitPath(
  elements: OrbitalElements,
  segments = 64
): Vector3D[] {
  const points: Vector3D[] = [];
  for (let i = 0; i <= segments; i++) {
    const time = (elements.period * i) / segments;
    points.push(calculateOrbitalPosition(elements, time));
  }
  return points;
}

/**
 * Extract orbital elements from an Exoplanet
 */
export function getOrbitalElements(planet: Exoplanet): OrbitalElements | null {
  if (planet.pl_orbsmax === null || planet.pl_orbper === null) {
    return null;
  }

  return {
    semiMajorAxis: planet.pl_orbsmax,
    eccentricity: planet.pl_orbeccen ?? 0,
    inclination: planet.pl_orbincl ?? 0,
    period: planet.pl_orbper,
  };
}

// =============================================================================
// SCALING UTILITIES (for visualization)
// =============================================================================

/**
 * Calculate visual scale for planet radius
 * Returns a reasonable size for 3D rendering
 */
export function scalePlanetRadius(earthRadii: number | null, baseScale = 1): number {
  if (earthRadii === null) return baseScale;

  // Use log scale for large range of sizes
  // Earth = 1, Jupiter ≈ 11.2 Earth radii
  return baseScale * Math.log10(earthRadii + 1) + baseScale * 0.5;
}

/**
 * Calculate visual scale for star radius
 */
export function scaleStarRadius(solarRadii: number | null, baseScale = 5): number {
  if (solarRadii === null) return baseScale;

  // Sun = 1 solar radius
  return baseScale * (0.5 + Math.log10(solarRadii + 0.1));
}

/**
 * Calculate visual scale for orbital distance
 * Compresses large distances for visualization
 */
export function scaleOrbitalDistance(au: number | null, baseScale = 10): number {
  if (au === null) return baseScale;

  // Use sqrt scale for better visualization
  return baseScale * Math.sqrt(au);
}

/**
 * Normalize distance for galaxy visualization
 * Maps distances to a reasonable range (e.g., 0-100 units)
 */
export function normalizeDistance(
  distance: number,
  maxDistance: number,
  targetRange = 100
): number {
  // Use log scale for huge range of cosmic distances
  const logDist = Math.log10(distance + 1);
  const logMax = Math.log10(maxDistance + 1);
  return (logDist / logMax) * targetRange;
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Get star color from stellar class
 */
export function getStarColor(starClass: string | null): string {
  const colors: Record<string, string> = {
    O: '#9bb0ff', // Blue
    B: '#aabfff', // Blue-white
    A: '#cad7ff', // White
    F: '#f8f7ff', // Yellow-white
    G: '#fff4ea', // Yellow (like Sun)
    K: '#ffd2a1', // Orange
    M: '#ffcc6f', // Red
    L: '#ff6600', // Dark red
    T: '#cc3300', // Brown
    Y: '#990000', // Dark brown
  };

  return colors[starClass ?? ''] ?? '#ffffff';
}

/**
 * Get star color as RGB values (for ThreeJS Color)
 */
export function getStarColorRGB(starClass: string | null): [number, number, number] {
  const hex = getStarColor(starClass);
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

/**
 * Get planet color based on type
 */
export function getPlanetColor(planetType: string | null): string {
  const colors: Record<string, string> = {
    'Sub-Earth': '#a0a0a0', // Gray (rocky)
    'Earth-sized': '#4a7c59', // Earth green-blue
    'Super-Earth': '#8b7355', // Brown
    'Sub-Neptune': '#5da4a8', // Teal
    'Neptune-like': '#4169e1', // Blue
    'Gas Giant': '#cd853f', // Tan/Jupiter
  };

  return colors[planetType ?? ''] ?? '#808080';
}
