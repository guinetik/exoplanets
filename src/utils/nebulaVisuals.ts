/**
 * Nebula Background Visualization Utilities
 * Constants and helpers for procedural nebula cloud rendering
 */

import * as THREE from 'three';

/**
 * Nebula animation parameters
 */
export const NEBULA_ANIMATION = {
  /** Fade-in animation duration in seconds */
  FADE_DURATION: 2.5,

  /** Easing power for fade-in cubic curve */
  FADE_EASING_POWER: 3,
} as const;

/**
 * Nebula sphere geometry parameters
 */
export const NEBULA_GEOMETRY = {
  /** Width segments for sphere geometry (horizontal subdivisions) */
  WIDTH_SEGMENTS: 64,

  /** Height segments for sphere geometry (vertical subdivisions) */
  HEIGHT_SEGMENTS: 32,
} as const;

/**
 * Nebula seed generation parameters
 */
export const NEBULA_SEED = {
  /** Modulo divisor for normalizing hash to 0-1 range */
  SEED_MODULO: 10000,

  /** Number of distinct color themes */
  THEME_COUNT: 6,
} as const;

/**
 * Nebula color theme definitions
 * Each theme has primary and secondary colors with HSL parameters
 */
export const NEBULA_COLOR_THEMES = {
  // Theme 0: Blue-purple (emission nebula)
  bluePurple: {
    primary: {
      hue: 0.7,
      saturation: 0.6,
      lightness: 0.5,
      hueVariation: 0.1,
    },
    secondary: {
      hue: 0.8,
      saturation: 0.5,
      lightness: 0.4,
      hueVariation: 0.05,
    },
  },

  // Theme 1: Red-orange (star-forming region)
  redOrange: {
    primary: {
      hue: 0.0,
      saturation: 0.7,
      lightness: 0.5,
      hueVariation: 0.05,
    },
    secondary: {
      hue: 0.05,
      saturation: 0.6,
      lightness: 0.4,
      hueVariation: 0.05,
    },
  },

  // Theme 2: Teal-cyan (reflection nebula)
  tealCyan: {
    primary: {
      hue: 0.5,
      saturation: 0.5,
      lightness: 0.5,
      hueVariation: 0.05,
    },
    secondary: {
      hue: 0.55,
      saturation: 0.4,
      lightness: 0.4,
      hueVariation: 0.05,
    },
  },

  // Theme 3: Green-yellow (planetary nebula)
  greenYellow: {
    primary: {
      hue: 0.25,
      saturation: 0.5,
      lightness: 0.45,
      hueVariation: 0.1,
    },
    secondary: {
      hue: 0.15,
      saturation: 0.4,
      lightness: 0.4,
      hueVariation: 0.1,
    },
  },

  // Theme 4: Pink-magenta (HII region)
  pinkMagenta: {
    primary: {
      hue: 0.9,
      saturation: 0.6,
      lightness: 0.55,
      hueVariation: 0.05,
    },
    secondary: {
      hue: 0.85,
      saturation: 0.5,
      lightness: 0.45,
      hueVariation: 0.05,
    },
  },

  // Theme 5: Deep blue-violet (dark nebula with stars)
  blueViolet: {
    primary: {
      hue: 0.65,
      saturation: 0.4,
      lightness: 0.35,
      hueVariation: 0.1,
    },
    secondary: {
      hue: 0.7,
      saturation: 0.3,
      lightness: 0.3,
      hueVariation: 0.1,
    },
  },
} as const;

/**
 * Generate nebula colors based on seed value
 * Creates a deterministic color pair (primary and secondary) for a nebula
 * @param seed - Seed value (0-1) for theme selection
 * @returns Object with primary and secondary THREE.Color objects
 */
export function generateNebulaColors(seed: number): {
  primary: THREE.Color;
  secondary: THREE.Color;
} {
  // Select theme based on seed
  const themeIndex = Math.floor(seed * NEBULA_SEED.THEME_COUNT);
  const themes = Object.values(NEBULA_COLOR_THEMES);
  const theme = themes[Math.min(themeIndex, themes.length - 1)];

  return {
    primary: new THREE.Color().setHSL(
      theme.primary.hue + seed * theme.primary.hueVariation,
      theme.primary.saturation,
      theme.primary.lightness
    ),
    secondary: new THREE.Color().setHSL(
      theme.secondary.hue + seed * theme.secondary.hueVariation,
      theme.secondary.saturation,
      theme.secondary.lightness
    ),
  };
}
