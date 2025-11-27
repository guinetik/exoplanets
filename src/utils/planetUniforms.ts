/**
 * Planet Uniform Factory
 * Creates shader uniforms from exoplanet data with normalization
 */

import * as THREE from 'three';
import type { Exoplanet } from '../types';

// Detail levels for LOD rendering
export type DetailLevel = 'simple' | 'detailed';

// Normalization ranges based on real exoplanet data
const DENSITY_MIN = 0.3;   // g/cm³ - puffy hot Jupiters
const DENSITY_MAX = 13.0;  // g/cm³ - dense iron-rich worlds (Earth is 5.5)

const INSOL_MIN = 0.01;    // Earth flux - distant frozen worlds
const INSOL_MAX = 10000;   // Earth flux - ultra-hot close-in planets

// Temperature range (kept for reference, used directly in shaders)
// TEMP_MIN = 50 K - coldest, TEMP_MAX = 3000 K - hottest lava worlds

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

/**
 * Normalize a value to 0-1 range with clamping
 */
function normalize(value: number | null, min: number, max: number, fallback: number = 0.5): number {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Get base color for a planet based on type
 */
function getBaseColor(planet: Exoplanet): THREE.Color {
  const colorHex = PLANET_COLORS[planet.planet_type || 'Terrestrial'] || '#888888';
  return new THREE.Color(colorHex);
}

/**
 * Generate a deterministic seed from planet name (0-1 range)
 */
function generateSeed(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Estimate atmosphere factor based on planet type and density
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

export interface PlanetUniformOptions {
  planet: Exoplanet;
  detailLevel?: DetailLevel;
  starTemp?: number; // Host star temperature in Kelvin
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
}

/**
 * Create shader uniforms for a planet
 *
 * @param options - Planet data and rendering options
 * @returns Uniforms object for Three.js shader material
 */
export function createPlanetUniforms(options: PlanetUniformOptions): PlanetUniforms {
  const { planet, detailLevel = 'simple', starTemp } = options;

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
  };
}

/**
 * Determine which fragment shader to use based on planet subtype (preferred) or type
 *
 * Subtype-based mapping (more accurate):
 * - hotJupiter: Hot Jupiter (tidally locked, extreme atmospheres)
 * - gasGiant: Jovian, Brown Dwarf Candidate
 * - iceGiant: Ice Giant, Mini-Neptune, Hot Neptune
 * - lavaWorld: Lava World (molten hellscapes)
 * - icyWorld: Ice World (frozen rocky worlds like TRAPPIST-1 f)
 * - rocky: Rocky, Super-Earth, Dense Super-Earth
 */
export function getPlanetShaderType(
  planetSubtype?: string | null,
  planetType?: string | null
): 'hotJupiter' | 'gasGiant' | 'iceGiant' | 'lavaWorld' | 'icyWorld' | 'rocky' {
  // Prefer subtype for more accurate shader selection
  if (planetSubtype) {
    switch (planetSubtype) {
      // Hot Jupiters - tidally locked extreme gas giants
      case 'Hot Jupiter':
        return 'hotJupiter';

      // Gas giants - large hydrogen/helium dominated
      case 'Jovian':
      case 'Brown Dwarf Candidate':
        return 'gasGiant';

      // Ice giants - Neptune/Uranus-like
      case 'Ice Giant':
      case 'Mini-Neptune':
      case 'Hot Neptune':
        return 'iceGiant';

      // Lava worlds - molten surfaces
      case 'Lava World':
        return 'lavaWorld';

      // Ice worlds - frozen rocky surfaces (Europa-like)
      case 'Ice World':
        return 'icyWorld';

      // Rocky worlds - solid surfaces
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
      // Earth-sized, Super-Earth, Sub-Earth, Terrestrial
      return 'rocky';
  }
}

/**
 * Get shader file name from shader type
 */
export function getShaderFileName(shaderType: 'hotJupiter' | 'gasGiant' | 'iceGiant' | 'lavaWorld' | 'icyWorld' | 'rocky'): string {
  const shaderMap = {
    hotJupiter: 'hotJupiterFrag',
    gasGiant: 'gasGiantFrag',
    iceGiant: 'iceGiantFrag',
    lavaWorld: 'lavaWorldFrag',
    icyWorld: 'icyWorldFrag',
    rocky: 'rockyFrag',
  };
  return shaderMap[shaderType];
}
