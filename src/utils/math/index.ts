/**
 * Math Module - Public API
 * Centralized mathematical primitives for the exoplanets app
 *
 * This module provides:
 * - Physical property calculations (gravity, temperature, density)
 * - Unit conversions (AU→km, K→C, parsec→ly, etc.)
 * - General utilities (normalize, clamp, map, lerp, etc.)
 * - Mathematical constants
 *
 * Usage:
 *   import { calculateEquilibriumTemp, kelvinToCelsius, normalize } from '@/utils/math';
 */

export * from './constants';
export * from './planet';
export * from './conversions';
export * from './utilities';
