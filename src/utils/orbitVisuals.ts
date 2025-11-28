/**
 * Orbit Ring Visualization Utilities
 * Constants and helpers for rendering orbital paths in 3D scenes
 */

/**
 * Animation parameters for orbit rings
 */
export const ORBIT_ANIMATION = {
  /** Fade-in animation duration in seconds */
  FADE_DURATION: 2.2,

  /** Easing power for fade-out cubic curve */
  FADE_EASING_POWER: 3,
} as const;

/**
 * Geometry parameters for orbit rings
 */
export const ORBIT_GEOMETRY = {
  /** Number of line segments to render smooth orbit curve */
  SEGMENTS: 128,

  /** Full circle in radians (2π) */
  FULL_CIRCLE: Math.PI * 2,

  /** Threshold eccentricity to consider orbit "eccentric" */
  ECCENTRICITY_THRESHOLD: 0.1,
} as const;

/**
 * Visual style for different orbit types
 */
export const ORBIT_STYLES = {
  // Highlighted orbit (when hovered/selected)
  highlighted: {
    color: '#ffffff', // White
    opacity: 0.8,
  },

  // Binary star orbital path
  binaryOrbit: {
    color: '#ffaa44', // Golden orange
    opacity: 0.5,
  },

  // Eccentric planet orbit (e > threshold)
  eccentricPlanet: {
    color: '#aaaaff', // Blue-ish
    opacity: 0.45,
  },

  // Circular planet orbit (e ≤ threshold)
  circularPlanet: {
    color: '#888888', // Gray
    opacity: 0.3,
  },
} as const;

/**
 * Get orbit style based on state
 * @param isHighlighted - Whether orbit is currently highlighted
 * @param isBinaryOrbit - Whether this is a binary star orbit
 * @param isEccentric - Whether orbit eccentricity exceeds threshold
 * @returns Object with color (hex string) and opacity (0-1)
 */
export function getOrbitStyle(
  isHighlighted: boolean,
  isBinaryOrbit: boolean,
  isEccentric: boolean
): { color: string; opacity: number } {
  if (isHighlighted) return ORBIT_STYLES.highlighted;
  if (isBinaryOrbit) return ORBIT_STYLES.binaryOrbit;
  if (isEccentric) return ORBIT_STYLES.eccentricPlanet;
  return ORBIT_STYLES.circularPlanet;
}
