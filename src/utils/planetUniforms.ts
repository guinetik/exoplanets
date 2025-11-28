/**
 * Planet Uniform Factory
 * Creates shader uniforms from exoplanet data with normalization
 * Supports both V1 and V2 shader systems
 */

import * as THREE from 'three';
import type { Exoplanet } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/** Detail levels for LOD rendering */
export type DetailLevel = 'simple' | 'detailed';

/** Shader version selection */
export type ShaderVersion = 'v1' | 'v2';

/** V1 shader types (original) */
export type V1ShaderType = 'hotJupiter' | 'gasGiant' | 'iceGiant' | 'lavaWorld' | 'icyWorld' | 'rocky';

/** V2 shader types (expanded with new planet types) */
export type V2ShaderType =
  | 'hotJupiter'
  | 'gasGiant'
  | 'iceGiant'
  | 'subNeptune'
  | 'lavaWorld'
  | 'icyWorld'
  | 'rocky'
  | 'oceanWorld'
  | 'desertWorld'
  | 'tidallyLocked';

// =============================================================================
// CONSTANTS
// =============================================================================

// Normalization ranges based on real exoplanet data
const DENSITY_MIN = 0.3;   // g/cm³ - puffy hot Jupiters
const DENSITY_MAX = 13.0;  // g/cm³ - dense iron-rich worlds (Earth is 5.5)

const INSOL_MIN = 0.01;    // Earth flux - distant frozen worlds
const INSOL_MAX = 10000;   // Earth flux - ultra-hot close-in planets

// Temperature thresholds for shader selection
const TEMP_FROZEN = 200;      // Below = ice world candidate
const TEMP_OCEAN_MIN = 250;   // Minimum for liquid water
const TEMP_OCEAN_MAX = 350;   // Maximum for stable oceans
const TEMP_DESERT = 400;      // Hot, arid conditions
const TEMP_LAVA = 800;        // Volcanic/lava surface

// Orbital period threshold for tidal locking
const PERIOD_TIDAL_LOCK = 30; // Days - planets with shorter periods likely tidally locked

// Color palettes by planet type - more saturated for better shader results
const PLANET_COLORS: Record<string, string> = {
  'Gas Giant': '#d4a854',     // Warm golden (Saturn-like)
  'Neptune-like': '#3b8fd9',  // Rich blue
  'Sub-Neptune': '#4eb8e0',   // Cyan-blue
  'Super-Earth': '#b5885a',   // Warm tan/ochre
  'Earth-sized': '#5a9668',   // Verdant green
  'Sub-Earth': '#c4623a',     // Mars-like rust
  'Terrestrial': '#d9a050',   // Desert tan
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize a value to 0-1 range with clamping
 * @param value - Raw value
 * @param min - Minimum expected value
 * @param max - Maximum expected value
 * @param fallback - Default if value is null/undefined
 * @returns Normalized value between 0 and 1
 */
function normalize(value: number | null, min: number, max: number, fallback: number = 0.5): number {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Get base color for a planet based on type
 * @param planet - Exoplanet data
 * @returns Three.js Color object
 */
function getBaseColor(planet: Exoplanet): THREE.Color {
  const colorHex = PLANET_COLORS[planet.planet_type || 'Terrestrial'] || '#888888';
  return new THREE.Color(colorHex);
}

/**
 * Generate a deterministic seed from planet name (0-1 range)
 * Same name always produces same seed for consistent appearance
 * @param name - Planet name
 * @returns Seed value between 0 and 1
 */
export function generateSeed(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Get stellar activity level based on spectral type
 * Activity affects pulsation intensity and flame dynamics
 *
 * Scientific basis:
 * - M-dwarfs: Known for frequent, violent flares
 * - K-dwarfs: Moderate activity
 * - G-stars (Sun-like): Steady, moderate activity
 * - F-stars: Lower activity
 * - A-stars: Low activity (radiative envelope)
 * - B/O-stars: Violent stellar winds
 * - L/T/Y (Brown dwarfs): Slow convection
 *
 * @param spectralType - Star's spectral type (e.g., "G2V", "M5", "K")
 * @returns Activity level between 0 and 1
 */
export function getStarActivityLevel(spectralType: string | undefined): number {
  const type = spectralType?.charAt(0)?.toUpperCase() ?? 'G';
  const activityMap: Record<string, number> = {
    'M': 0.95,  // Flare stars - very active
    'K': 0.65,
    'G': 0.55,
    'F': 0.35,
    'A': 0.25,
    'B': 0.85,  // Violent stellar winds
    'O': 0.90,  // Extremely violent
    'L': 0.20,  // Brown dwarfs - calm
    'T': 0.15,  // T-dwarfs - very calm
    'Y': 0.10,  // Ultra-cool - minimal activity
  };
  return activityMap[type] ?? 0.5;
}

/**
 * Estimate atmosphere factor based on planet type and density
 * @param planet - Exoplanet data
 * @returns Atmosphere factor between 0 (none) and 1 (thick)
 */
function estimateAtmosphere(planet: Exoplanet): number {
  const type = planet.planet_type;
  const density = planet.pl_dens;

  // Gas giants always have thick atmospheres
  if (type === 'Gas Giant' || type === 'Neptune-like') return 1.0;
  if (type === 'Sub-Neptune') return 0.8;

  // Rocky planets: lower density suggests more volatiles
  if (density !== null) {
    if (density < 3) return 0.7;  // Puffy, volatile-rich
    if (density < 5) return 0.5;  // Earth-like
    if (density > 7) return 0.2;  // Dense, likely lost atmosphere
  }

  if (type === 'Super-Earth') return 0.5;
  if (type === 'Earth-sized') return 0.6;
  return 0.2; // Small rocky worlds - thin or no atmosphere
}

/**
 * Check if a planet is likely tidally locked
 * @param planet - Exoplanet data
 * @returns True if planet is likely tidally locked
 */
function isTidallyLocked(planet: Exoplanet): boolean {
  // Explicit flag
  if (planet.is_likely_tidally_locked) return true;

  // Short orbital period around M-dwarf
  if (planet.pl_orbper !== null && planet.pl_orbper < PERIOD_TIDAL_LOCK) {
    if (planet.st_teff !== null && planet.st_teff < 4000) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a planet is likely an ocean world
 * @param planet - Exoplanet data
 * @returns True if planet is likely an ocean world
 */
function isOceanWorld(planet: Exoplanet): boolean {
  const temp = planet.pl_eqt;
  const density = planet.pl_dens;
  const hasAtmosphere = estimateAtmosphere(planet) > 0.3;

  // Temperature in liquid water range
  if (temp === null || temp < TEMP_OCEAN_MIN || temp > TEMP_OCEAN_MAX) return false;

  // Low density suggests high water content
  if (density !== null && density < 3.5 && density > 1.0) {
    return hasAtmosphere;
  }

  return false;
}

/**
 * Check if a planet is likely a desert world
 * @param planet - Exoplanet data
 * @returns True if planet is likely a desert world
 */
function isDesertWorld(planet: Exoplanet): boolean {
  const temp = planet.pl_eqt;
  const density = planet.pl_dens;

  // Hot but not volcanic
  if (temp === null || temp < TEMP_DESERT || temp > TEMP_LAVA) return false;

  // Rocky density
  if (density !== null && density > 3.5) {
    return true;
  }

  return false;
}

// =============================================================================
// UNIFORM INTERFACES
// =============================================================================

export interface PlanetUniformOptions {
  planet: Exoplanet;
  detailLevel?: DetailLevel;
  starTemp?: number;
  /** Show terminator effect (day/night zones) for tidally locked planets
   * Default: true (planet page), set to false for star map view
   */
  showTerminator?: boolean;
}

export interface PlanetUniforms {
  [uniform: string]: { value: unknown };
  uBaseColor: { value: THREE.Color };
  uTime: { value: number };
  uTemperature: { value: number };
  uHasAtmosphere: { value: number };
  uSeed: { value: number };
  uDensity: { value: number };
  uInsolation: { value: number };
  uStarTemp: { value: number };
  uDetailLevel: { value: number };
  uEnableTerminator: { value: number };
  // Physical color factors (0-1 normalized)
  uColorTempFactor: { value: number };        // Temperature: 0 = cold/blue, 1 = hot/red
  uColorCompositionFactor: { value: number }; // Composition: 0 = gas, 0.5 = ice, 1 = rock
  uColorIrradiationFactor: { value: number }; // Irradiation: 0 = dim, 1 = bright
  uColorMetallicityFactor: { value: number }; // Metallicity: 0 = metal-poor, 1 = metal-rich
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Create shader uniforms for a planet
 * Works with both V1 and V2 shader systems
 *
 * @param options - Planet data and rendering options
 * @returns Uniforms object for Three.js shader material
 */
export function createPlanetUniforms(options: PlanetUniformOptions): PlanetUniforms {
  const { planet, detailLevel = 'simple', starTemp, showTerminator = true } = options;

  // Normalize physical properties to 0-1 range
  const density = normalize(planet.pl_dens, DENSITY_MIN, DENSITY_MAX, 0.5);
  const insolation = normalize(planet.pl_insol, INSOL_MIN, INSOL_MAX, 0.5);
  const temperature = planet.pl_eqt ?? 300;

  // Estimate atmosphere if not directly available
  const atmosphere = estimateAtmosphere(planet);

  // Generate deterministic seed for variation
  const seed = generateSeed(planet.pl_name);

  // Star temperature (defaults to Sun-like if not provided)
  const effectiveStarTemp = starTemp ?? planet.st_teff ?? 5778;

  // Enable terminator effect (day/night zones) for tidally locked planets
  // Planet page: showTerminator = true (show dark side effect)
  // Star map: showTerminator = false (star already provides lighting)
  const enableTerminator = showTerminator ? 1.0 : 0.0;

  // Physical color factors from pre-computed data (fallback to 0.5 if null)
  const colorTempFactor = planet.color_temp_factor ?? 0.5;
  const colorCompositionFactor = planet.color_composition_factor ?? 0.5;
  const colorIrradiationFactor = planet.color_irradiation_factor ?? 0.5;
  const colorMetallicityFactor = planet.color_metallicity_factor ?? 0.5;

  return {
    uBaseColor: { value: getBaseColor(planet) },
    uTime: { value: 0 },
    uTemperature: { value: temperature },
    uHasAtmosphere: { value: atmosphere },
    uSeed: { value: seed },
    uDensity: { value: density },
    uInsolation: { value: insolation },
    uStarTemp: { value: effectiveStarTemp },
    uDetailLevel: { value: detailLevel === 'detailed' ? 1.0 : 0.0 },
    uEnableTerminator: { value: enableTerminator },
    // Physical color factors for procedural generation
    uColorTempFactor: { value: colorTempFactor },
    uColorCompositionFactor: { value: colorCompositionFactor },
    uColorIrradiationFactor: { value: colorIrradiationFactor },
    uColorMetallicityFactor: { value: colorMetallicityFactor },
  };
}

/**
 * Determine which V1 fragment shader to use based on planet data
 * Original shader selection logic
 *
 * @param planetSubtype - Planet subtype classification
 * @param planetType - Planet type classification
 * @returns V1 shader type identifier
 */
export function getPlanetShaderType(
  planetSubtype?: string | null,
  planetType?: string | null
): V1ShaderType {
  // Prefer subtype for more accurate shader selection
  if (planetSubtype) {
    switch (planetSubtype) {
      case 'Hot Jupiter':
        return 'hotJupiter';
      case 'Jovian':
      case 'Brown Dwarf Candidate':
        return 'gasGiant';
      case 'Ice Giant':
      case 'Mini-Neptune':
      case 'Hot Neptune':
        return 'iceGiant';
      case 'Lava World':
        return 'lavaWorld';
      case 'Ice World':
        return 'icyWorld';
      case 'Rocky':
      case 'Super-Earth':
      case 'Dense Super-Earth':
        return 'rocky';
    }
  }

  // Fallback to type-based classification
  switch (planetType) {
    case 'Gas Giant':
      return 'gasGiant';
    case 'Neptune-like':
    case 'Sub-Neptune':
      return 'iceGiant';
    default:
      return 'rocky';
  }
}

/**
 * Determine which V2 fragment shader to use based on planet data
 * Enhanced shader selection with new planet types
 *
 * @param planet - Full exoplanet data for smart selection
 * @returns V2 shader type identifier
 */
export function getV2PlanetShaderType(planet: Exoplanet): V2ShaderType {
  const subtype = planet.planet_subtype;
  const type = planet.planet_type;
  const temp = planet.pl_eqt ?? 300;

  // Subtype-based selection (most accurate)
  if (subtype) {
    switch (subtype) {
      case 'Hot Jupiter':
        return 'hotJupiter';
      case 'Jovian':
      case 'Brown Dwarf Candidate':
        return 'gasGiant';
      case 'Ice Giant':
        return 'iceGiant';
      case 'Mini-Neptune':
      case 'Hot Neptune':
        return 'subNeptune';
      case 'Lava World':
        return 'lavaWorld';
      case 'Ice World':
        return 'icyWorld';
    }
  }

  // Type-based with smart inference
  switch (type) {
    case 'Gas Giant':
      // Check if hot Jupiter based on temperature
      if (temp > 1000) return 'hotJupiter';
      return 'gasGiant';

    case 'Neptune-like':
      return 'iceGiant';

    case 'Sub-Neptune':
      return 'subNeptune';

    default:
      // Rocky planet variants
      // Check for special conditions

      // PRIORITY 1: Extreme temperatures override everything
      // A frozen or molten world should look that way even if tidally locked

      // Lava world (very hot) - highest priority
      if (temp > TEMP_LAVA) {
        return 'lavaWorld';
      }

      // Ice world (very cold) - takes priority over tidal locking
      // A frozen tidally locked world still looks frozen
      if (temp < TEMP_FROZEN) {
        return 'icyWorld';
      }

      // PRIORITY 2: Tidal locking for temperate rocky worlds
      // Only use tidallyLocked shader when temperature is in the
      // habitable/temperate range where day/night contrast matters
      if (isTidallyLocked(planet)) {
        return 'tidallyLocked';
      }

      // PRIORITY 3: Other environmental conditions

      // Ocean world (temperate with low density)
      if (isOceanWorld(planet)) {
        return 'oceanWorld';
      }

      // Desert world (hot and rocky)
      if (isDesertWorld(planet)) {
        return 'desertWorld';
      }

      // Default rocky
      return 'rocky';
  }
}

/**
 * Get V1 shader file name from shader type
 * @param shaderType - V1 shader type
 * @returns Shader name as registered in manifest
 */
export function getShaderFileName(shaderType: V1ShaderType): string {
  const shaderMap: Record<V1ShaderType, string> = {
    hotJupiter: 'hotJupiterFrag',
    gasGiant: 'gasGiantFrag',
    iceGiant: 'iceGiantFrag',
    lavaWorld: 'lavaWorldFrag',
    icyWorld: 'icyWorldFrag',
    rocky: 'rockyFrag',
  };
  return shaderMap[shaderType];
}

/**
 * Get V2 shader file name from shader type
 * @param shaderType - V2 shader type
 * @returns Shader name as registered in manifest (with v2 prefix)
 */
export function getV2ShaderFileName(shaderType: V2ShaderType): string {
  const shaderMap: Record<V2ShaderType, string> = {
    hotJupiter: 'v2HotJupiterFrag',
    gasGiant: 'v2GasGiantFrag',
    iceGiant: 'v2IceGiantFrag',
    subNeptune: 'v2SubNeptuneFrag',
    lavaWorld: 'v2LavaWorldFrag',
    icyWorld: 'v2IcyWorldFrag',
    rocky: 'v2RockyFrag',
    oceanWorld: 'v2OceanWorldFrag',
    desertWorld: 'v2DesertWorldFrag',
    tidallyLocked: 'v2TidallyLockedFrag',
  };
  return shaderMap[shaderType];
}

/**
 * Get the vertex shader name for a given shader version
 * @param version - Shader version (v1 or v2)
 * @returns Vertex shader name as registered in manifest
 */
export function getPlanetVertexShader(version: ShaderVersion = 'v1'): string {
  return version === 'v2' ? 'v2PlanetVert' : 'planetVert';
}

/**
 * Get star surface shader names for a given version
 * @param version - Shader version (v1 or v2)
 * @returns Object with vert and frag shader names
 */
export function getStarSurfaceShaders(version: ShaderVersion = 'v1'): { vert: string; frag: string } {
  return version === 'v2'
    ? { vert: 'v2StarSurfaceVert', frag: 'v2StarSurfaceFrag' }
    : { vert: 'starSurfaceVert', frag: 'starSurfaceFrag' };
}

/**
 * Get star corona shader names for a given version
 * @param version - Shader version (v1 or v2)
 * @returns Object with vert and frag shader names
 */
export function getStarCoronaShaders(version: ShaderVersion = 'v1'): { vert: string; frag: string } {
  return version === 'v2'
    ? { vert: 'v2StarCoronaVert', frag: 'v2StarCoronaFrag' }
    : { vert: 'starCoronaVert', frag: 'starCoronaFrag' };
}

/**
 * Get solar flare shader names (V2 only)
 * @returns Object with vert and frag shader names
 */
export function getStarFlareShaders(): { vert: string; frag: string } {
  return { vert: 'v2StarFlareVert', frag: 'v2StarFlareFrag' };
}
