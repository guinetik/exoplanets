/**
 * Celestial Body Visualization Utilities
 * Constants and functions for star and planet rendering in 3D scenes
 */

import * as THREE from 'three';
import { createRingColorFromTemperature } from './ringVisuals';

/**
 * Orbital animation speed multiplier
 * Lower = slower, 1.0 = original speed based on orbital period
 */
export const ORBIT_SPEED = 0.15;

/**
 * Camera distance thresholds for zoom-based detail level
 * Used to determine how much detail to render based on camera distance
 */
export const CAMERA_ZOOM = {
  CLOSE_THRESHOLD_MULTIPLIER: 4, // Zoom level 1.0 when camera is 4x body diameter away
  FAR_THRESHOLD_MULTIPLIER: 20, // Zoom level 0.0 when camera is 20x body diameter away
} as const;

/**
 * Star rendering parameters
 */
export const STAR_RENDERING = {
  /** Star takes up 12.5% of billboard width (radius) - billboard is 4x diameter */
  RAY_STAR_RADIUS: 0.125,

  /** Billboard size multiplier for outer glow effect */
  GLOW_SIZE_MULTIPLIER: 1.8,

  /** Billboard size multiplier for radiating rays */
  RAYS_SIZE_MULTIPLIER: 4.0,

  /** Corona layer size relative to star radius */
  CORONA_SCALE_MULTIPLIER: 1.5,

  /** Point light intensity for primary star */
  PRIMARY_LIGHT_INTENSITY: 2.0,

  /** Point light intensity for companion star */
  COMPANION_LIGHT_INTENSITY: 1.5,

  /** Point light distance for primary star */
  PRIMARY_LIGHT_DISTANCE: 50,

  /** Point light distance for companion star */
  COMPANION_LIGHT_DISTANCE: 40,
} as const;

/**
 * Glow effect calculation parameters
 */
export const GLOW_EFFECT = {
  /** Smoothstep threshold start (where glow begins) */
  SMOOTHSTEP_LOW: 0.55,

  /** Smoothstep threshold end (where glow ends) */
  SMOOTHSTEP_HIGH: 1.0,

  /** Power curve for glow falloff */
  POWER: 2.5,

  /** Glow intensity multiplier */
  MULTIPLIER: 0.35,

  /** Minimum intensity clamp */
  INTENSITY_MIN: 0.7,

  /** Maximum intensity clamp */
  INTENSITY_MAX: 1.8,
} as const;

/**
 * Ring geometry dimensions and orientation
 */
export const RING_GEOMETRY = {
  INNER_RADIUS_MULTIPLIER: 0.6, // Inner radius as multiple of body diameter
  OUTER_RADIUS_MULTIPLIER: 1.3, // Outer radius as multiple of body diameter
  BASE_ROTATION_X: Math.PI / 2, // Rings in equatorial plane (perpendicular to spin axis)
} as const;

/**
 * Orbital mechanics parameters
 */
export const ORBITAL_MECHANICS = {
  /** Maximum eccentricity (clamped to prevent degenerate orbits) */
  MAX_ECCENTRICITY: 0.99,
} as const;

/**
 * Ring color properties for data-driven visualization
 * Combines temperature-based color with seed-based variation
 */
export interface RingColorProperties {
  base: THREE.Color;
  density: number;
  insolation: number;
  variation: number;
}

/**
 * Generate ring color with temperature-based variation
 * Uses centralized temperature thresholds and seed-based randomness
 *
 * @param temperature - Planet equilibrium temperature in Kelvin
 * @param seed - Deterministic random seed (0-1) for variation
 * @param density - Planet mass normalized to 0-1 range
 * @param insolation - Planet insolation normalized to 0-1 range
 * @returns Ring color properties
 */
export function generateRingColor(
  temperature: number,
  seed: number,
  density: number,
  insolation: number
): RingColorProperties {
  // Seed-based variation within the temperature category
  const variation = seed * 0.3 - 0.15; // -0.15 to +0.15

  return {
    base: createRingColorFromTemperature(temperature, seed),
    density,
    insolation,
    variation,
  };
}

/**
 * Normalize density value from planet mass to 0-1 range
 * @param massEarth - Planet mass in Earth masses (null or 0 for unknown)
 * @returns Normalized density value 0-1
 */
export function normalizeDensity(massEarth: number | null | undefined): number {
  if (!massEarth) return 0.5; // Default for unknown
  // Normalize to 0-1 where ~300 Earth masses = 1.0
  return Math.min(massEarth / 300, 1.0);
}

/**
 * Normalize insolation value to 0-1 range
 * @param insolationFlux - Insolation in Earth flux units (null for unknown)
 * @returns Normalized insolation value 0-1
 */
export function normalizeInsolation(insolationFlux: number | null | undefined): number {
  if (!insolationFlux) return 0.5; // Default for unknown
  // Normalize to 0-1 where ~2 Earth flux = 1.0
  return Math.min(insolationFlux / 2, 1.0);
}

/**
 * Calculate zoom level based on camera distance
 * Returns 1.0 when very close, 0.0 when far
 *
 * @param distanceToBody - Distance from camera to body
 * @param bodyDiameter - Diameter of the body
 * @returns Zoom level 0-1
 */
export function calculateZoomLevel(distanceToBody: number, bodyDiameter: number): number {
  const closeThreshold = bodyDiameter * CAMERA_ZOOM.CLOSE_THRESHOLD_MULTIPLIER;
  const farThreshold = bodyDiameter * CAMERA_ZOOM.FAR_THRESHOLD_MULTIPLIER;

  return 1.0 - Math.min(
    1.0,
    Math.max(0.0, (distanceToBody - closeThreshold) / (farThreshold - closeThreshold))
  );
}
