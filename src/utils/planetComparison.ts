/**
 * Planet Comparison Visualization Utilities
 * Centralized system for planet color, sizing, and comparison calculations
 * Replaces scattered hardcoded values and switch statements
 */

import { MATH_CONSTANTS } from './math/constants';
import type { PlanetType } from '../types';

/**
 * Planet type to color mapping
 * Single source of truth for visualization colors
 */
const PLANET_TYPE_COLORS: Record<PlanetType | 'unknown', string> = {
  'Sub-Earth': '#a0a0a0', // Gray - small rocky
  'Earth-sized': '#4a90d9', // Blue - Earth-like
  'Super-Earth': '#6bb86b', // Green - larger rocky
  'Sub-Neptune': '#7ec8e3', // Cyan - small ice giant
  'Neptune-like': '#4169e1', // Deep blue - large ice giant
  'Gas Giant': '#d4a574', // Tan/brown - Jovian
  'unknown': '#888888', // Gray - unknown type
};

/**
 * Get color for a planet based on its classification type
 * @param planetType - The planet classification (e.g., 'Earth-sized', 'Gas Giant')
 * @returns Hex color string for visualization
 */
export function getPlanetColor(planetType: PlanetType | string | null): string {
  if (!planetType) return PLANET_TYPE_COLORS.unknown;
  return PLANET_TYPE_COLORS[planetType as PlanetType] ?? PLANET_TYPE_COLORS.unknown;
}

/**
 * Get color for a planet in orbital visualizations
 * Checks habitable zone and earth-like flags before falling back to planet type
 * @param planet - The planet object with type and habitability flags
 * @returns Hex color string for visualization
 */
export function getPlanetVisualizationColor(planet: { is_habitable_zone?: boolean; is_earth_like?: boolean; planet_type?: PlanetType | null }): string {
  if (planet.is_habitable_zone) return '#00ff88';
  if (planet.is_earth_like) return '#4a90d9';
  return getPlanetColor(planet.planet_type ?? null);
}

/**
 * Calculate visual sphere sizes for comparison
 * Both spheres fit within maxSize constraint while maintaining radius proportion
 *
 * @param planetRadius - Planet radius in Earth radii
 * @returns Object with earthDisplaySize and planetDisplaySize in pixels
 */
export function calculateComparisonSizes(
  planetRadius: number
): { earthDisplaySize: number; planetDisplaySize: number } {
  const maxSize = MATH_CONSTANTS.COMPARISON_MAX_SIZE;
  const minSize = MATH_CONSTANTS.COMPARISON_MIN_SIZE;
  const maxRadiusFactor = MATH_CONSTANTS.COMPARISON_MAX_RADIUS_FACTOR;

  // If planet is larger than Earth, scale Earth down
  // If planet is smaller, scale planet up but keep proportional
  const earthSize =
    planetRadius >= 1
      ? maxSize / Math.min(planetRadius, maxRadiusFactor)
      : maxSize;
  const planetSize =
    planetRadius >= 1
      ? maxSize
      : maxSize * planetRadius;

  // Ensure both spheres are visible
  const earthDisplaySize = Math.max(earthSize, minSize);
  const planetDisplaySize = Math.max(planetSize, minSize);

  return { earthDisplaySize, planetDisplaySize };
}

/**
 * Create radial gradient string for sphere visualization
 * Gives 3D appearance with highlight
 *
 * @param color - Base color (hex) for the sphere
 * @returns CSS radial-gradient string
 */
export function createSphereGradient(color: string): string {
  return `radial-gradient(circle at 30% 30%, #fff, ${color}, ${color}dd)`;
}

/**
 * Earth reference data for all comparison calculations
 * Single source of truth - no scattered hardcoded values
 */
export const EARTH_REFERENCE = {
  radius: MATH_CONSTANTS.EARTH_RADIUS_RELATIVE,
  mass: MATH_CONSTANTS.EARTH_MASS_RELATIVE,
  density: MATH_CONSTANTS.EARTH_DENSITY,
  temperature: MATH_CONSTANTS.EARTH_EQUILIBRIUM_TEMP,
  gravity: MATH_CONSTANTS.EARTH_SURFACE_GRAVITY,
} as const;

/**
 * Earth gradient for visualization (predefined)
 */
export const EARTH_GRADIENT = 'radial-gradient(circle at 30% 30%, #87ceeb, #4a90d9, #1e4d7b)';
