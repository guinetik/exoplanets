/**
 * Ring Visualization Utilities
 * Centralized system for ring color and appearance based on temperature
 * Replaces scattered HSL values and magic numbers
 */

import * as THREE from 'three';
import { MATH_CONSTANTS } from './math/constants';

/**
 * Ring color properties for a given temperature
 * Determines ring composition (ice, rock, metal, etc) from temperature
 */
interface RingColorProperties {
  hue: number;
  saturation: number;
  lightness: number;
}

/**
 * Get ring color HSL values based on planet temperature
 * Different temperature ranges produce different ring compositions
 *
 * SINGLE SOURCE OF TRUTH - No scattered HSL magic numbers
 *
 * @param temperature - Planet equilibrium temperature in Kelvin
 * @param seed - Random seed (0-1) for color variation within category
 * @returns HSL values (hue 0-1, saturation 0-1, lightness 0-1)
 */
export function getRingColorProperties(
  temperature: number,
  seed: number
): RingColorProperties {
  // Seed-based variation within the temperature category
  const variation = seed * 0.3 - 0.15;

  if (temperature < MATH_CONSTANTS.RING_COLOR_THRESHOLD_VERY_COLD) {
    // Very cold (< 120K): Pure ice rings - bright white/blue
    return {
      hue: 0.55 + variation * 0.1,
      saturation: 0.25 + seed * 0.15,
      lightness: 0.8 + seed * 0.1,
    };
  }

  if (temperature < MATH_CONSTANTS.RING_COLOR_THRESHOLD_COLD) {
    // Cold (120-200K): Mixed ice/rock - pale blue-gray
    return {
      hue: 0.58 + variation * 0.08,
      saturation: 0.15 + seed * 0.1,
      lightness: 0.7 + seed * 0.1,
    };
  }

  if (temperature < MATH_CONSTANTS.RING_COLOR_THRESHOLD_COOL) {
    // Cool (200-350K): Rocky/dusty - tans, browns, grays
    const subType = Math.floor(seed * 3);
    if (subType === 0) {
      return {
        hue: 0.08 + variation,
        saturation: 0.35,
        lightness: 0.6,
      };
    } else if (subType === 1) {
      return {
        hue: 0.6,
        saturation: 0.08 + seed * 0.1,
        lightness: 0.55,
      };
    } else {
      return {
        hue: 0.06 + variation,
        saturation: 0.4,
        lightness: 0.5,
      };
    }
  }

  if (temperature < MATH_CONSTANTS.RING_COLOR_THRESHOLD_WARM) {
    // Warm (350-600K): Rocky/dusty - neutral gray-tan
    return {
      hue: 0.1 + variation * 0.1,        // Slight warm tint
      saturation: 0.08 + seed * 0.08,    // Very low saturation - mostly gray
      lightness: 0.6 + seed * 0.15,      // Bright enough to see
    };
  }

  // Hot (> 600K): Silicate debris - slightly warm gray
  return {
    hue: 0.08 + variation * 0.1,
    saturation: 0.1 + seed * 0.1,        // Low saturation
    lightness: 0.55 + seed * 0.15,
  };
}

/**
 * Create a THREE.Color from temperature and seed
 * Convenience function that combines getRingColorProperties + THREE.Color.setHSL
 *
 * @param temperature - Planet equilibrium temperature in Kelvin
 * @param seed - Random seed (0-1) for color variation
 * @returns THREE.Color object
 */
export function createRingColorFromTemperature(
  temperature: number,
  seed: number
): THREE.Color {
  const props = getRingColorProperties(temperature, seed);
  const color = new THREE.Color();
  color.setHSL(props.hue, props.saturation, props.lightness);
  return color;
}
