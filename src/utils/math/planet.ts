/**
 * Planet Physics Calculations
 * Physical property calculations for exoplanet characterization
 */

import { MATH_CONSTANTS } from './constants';

/**
 * Calculate surface gravity relative to Earth
 * Formula: g_rel = (M_rel) / (R_rel)²
 * Or in SI: g = G*M/R², then normalized to Earth's gravity
 *
 * @param massEarth - Planet mass in Earth masses
 * @param radiusEarth - Planet radius in Earth radii
 * @returns Object with gravity in m/s² and relative to Earth, or null if data missing
 */
export function calculateSurfaceGravity(
  massEarth: number | null,
  radiusEarth: number | null
): { gravityMs2: number; gravityEarth: number } | null {
  if (!massEarth || !radiusEarth || radiusEarth === 0) {
    return null;
  }

  // Relative gravity: M / R²
  const gravityEarth = massEarth / (radiusEarth * radiusEarth);

  // Convert to m/s²
  const gravityMs2 = gravityEarth * MATH_CONSTANTS.EARTH_GRAVITY;

  return { gravityMs2, gravityEarth };
}

/**
 * Calculate planet equilibrium temperature using Stefan-Boltzmann law
 * Formula: T_eq = T_star × √(R_star_AU / (2 × a))
 * Assumes albedo = 0 (perfect black body absorber)
 *
 * This is used as an approximation when NASA data doesn't include pl_eqt.
 * More accurate than using default values (like 300K).
 *
 * @param starTempK - Star's effective temperature in Kelvin
 * @param starRadiusSolar - Star's radius in solar radii
 * @param orbitDistanceAU - Planet's orbital distance in AU
 * @returns Object with calculated temperature, calculation metadata, or null if data missing
 */
export function calculateEquilibriumTemp(
  starTempK: number | null,
  starRadiusSolar: number | null,
  orbitDistanceAU: number | null
): { temperatureK: number; isCalculated: true; albedo: number } | null {
  if (!starTempK || !starRadiusSolar || !orbitDistanceAU) {
    return null;
  }

  // Convert stellar radius from solar radii to AU
  const starRadiusAU = starRadiusSolar * MATH_CONSTANTS.SOLAR_RADIUS_AU;

  // Stefan-Boltzmann law: T_eq = T_star × √(R_star / (2 × a))
  const T_eq = starTempK * Math.sqrt(starRadiusAU / (2 * orbitDistanceAU));

  return {
    temperatureK: Math.round(T_eq),
    isCalculated: true,
    albedo: MATH_CONSTANTS.EQUILIBRIUM_TEMP_ALBEDO,
  };
}

/**
 * Calculate planet density
 * Formula: ρ = M / V, where V = (4/3)πR³
 * Normalized to Earth's density: ρ_rel = M_rel / R_rel³
 *
 * @param massEarth - Planet mass in Earth masses
 * @param radiusEarth - Planet radius in Earth radii
 * @returns Density in g/cm³ (Earth = 5.52), or null if data missing
 */
export function calculateDensity(
  massEarth: number | null,
  radiusEarth: number | null
): { densityRelative: number; densityGcm3: number } | null {
  if (!massEarth || !radiusEarth || radiusEarth === 0) {
    return null;
  }

  // Relative density: M / R³ (Earth density reference = 1.0)
  const densityRelative = massEarth / (radiusEarth ** 3);

  // Earth's mean density is 5.52 g/cm³
  const EARTH_DENSITY_GCM3 = 5.52;
  const densityGcm3 = densityRelative * EARTH_DENSITY_GCM3;

  return { densityRelative, densityGcm3 };
}

/**
 * Estimate planet temperature from insolation flux
 * Rough approximation: T ≈ √(insolation) × 255
 * This is a simplified approach used when equilibrium temperature is not available
 * More accurate than assuming a default temperature
 *
 * @param insolationFlux - Insolation in Earth flux units
 * @returns Estimated temperature in Kelvin, or null if data missing
 */
export function estimateTemperatureFromInsolation(
  insolationFlux: number | null
): { temperatureK: number; isCalculated: true; method: 'insolation' } | null {
  if (!insolationFlux || insolationFlux <= 0) {
    return null;
  }

  // Simplified relationship: T ≈ sqrt(insolation) * 255
  // Based on Stefan-Boltzmann law with typical albedo
  const estimatedTemp = Math.sqrt(insolationFlux) * 255;

  return {
    temperatureK: Math.round(estimatedTemp),
    isCalculated: true,
    method: 'insolation',
  };
}

/**
 * Get the effective planet temperature using a resolution priority:
 * 1. NASA observed equilibrium temperature (pl_eqt)
 * 2. Calculated from stellar parameters (Stefan-Boltzmann)
 * 3. Estimated from insolation flux
 * 4. Default fallback constant
 *
 * SINGLE SOURCE OF TRUTH for temperature resolution across all components
 * No magic numbers, no scattered defaults
 *
 * @param planet - Exoplanet data object
 * @returns Object with temperature in Kelvin, calculation method, and whether it was approximated
 */
export function getEffectiveTemperature(planet: {
  pl_eqt: number | null;
  st_teff: number | null;
  st_rad: number | null;
  pl_orbsmax: number | null;
  pl_insol: number | null;
}): {
  temperatureK: number;
  isApproximate: boolean;
  method: 'observed' | 'calculated' | 'insolation' | 'fallback';
} {
  // Priority 1: NASA observed data
  if (planet.pl_eqt && planet.pl_eqt > MATH_CONSTANTS.TEMPERATURE_UNKNOWN_THRESHOLD) {
    return {
      temperatureK: planet.pl_eqt,
      isApproximate: false,
      method: 'observed',
    };
  }

  // Priority 2: Calculate from stellar parameters
  const calculated = calculateEquilibriumTemp(planet.st_teff, planet.st_rad, planet.pl_orbsmax);
  if (calculated) {
    return {
      temperatureK: calculated.temperatureK,
      isApproximate: true,
      method: 'calculated',
    };
  }

  // Priority 3: Estimate from insolation
  const insolationEstimate = estimateTemperatureFromInsolation(planet.pl_insol);
  if (insolationEstimate) {
    return {
      temperatureK: insolationEstimate.temperatureK,
      isApproximate: true,
      method: 'insolation',
    };
  }

  // Priority 4: Default fallback
  return {
    temperatureK: MATH_CONSTANTS.TEMPERATURE_DEFAULT_FALLBACK,
    isApproximate: true,
    method: 'fallback',
  };
}

/**
 * Calculate habitable zone boundaries scaled by stellar luminosity
 * Uses the inner and outer HZ boundaries for a Sun-like star, scaled by sqrt(luminosity)
 * Formula: HZ_distance = HZ_ref × √(L_star / L_sun)
 *
 * @param starLuminosity - Star luminosity in log₁₀(L☉) (can be null)
 * @returns Object with inner and outer HZ boundaries in AU
 */
export function calculateHabitableZone(
  starLuminosity: number | null
): { inner: number; outer: number } {
  // Default to Sun's luminosity if not provided (log(1) = 0)
  const log10Lum = starLuminosity ?? 0;
  const luminosity = Math.pow(10, log10Lum);

  // Use sqrt of luminosity to scale the reference HZ boundaries
  // Guard against very small luminosity values
  const sqrtLum = Math.sqrt(Math.max(luminosity, 0.001));

  return {
    inner: MATH_CONSTANTS.HZ_INNER_AU * sqrtLum,
    outer: MATH_CONSTANTS.HZ_OUTER_AU * sqrtLum,
  };
}
