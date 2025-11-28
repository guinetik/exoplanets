/**
 * Mathematical and Physical Constants
 * Core constants for all physics calculations in the exoplanets app
 */

export const MATH_CONSTANTS = {
  // Gravitational constant
  G: 6.674e-11, // m³/(kg·s²) - Newton's gravitational constant

  // Astronomical unit conversions
  SOLAR_RADIUS_AU: 0.00465047, // Solar radius in AU (1 AU / 215.03 solar radii)
  AU_TO_KM: 149597870.7, // 1 AU in kilometers
  PARSEC_TO_LY: 3.26156, // 1 parsec in light-years
  PARSEC_TO_KM: 3.086e13, // 1 parsec in kilometers

  // Earth reference values
  EARTH_GRAVITY: 9.80665, // m/s² - surface gravity at Earth
  EARTH_RADIUS_KM: 6371, // Earth mean radius in km
  EARTH_MASS_KG: 5.972e24, // Earth mass in kg
  EARTH_YEAR_DAYS: 365.25, // Days per year (mean)

  // Solar constants
  SOLAR_RADIUS_KM: 695700, // Solar radius in km
  SOLAR_MASS_KG: 1.989e30, // Solar mass in kg

  // Stefan-Boltzmann law constant for planet equilibrium temperature
  // Used in: T_eq = T_star × sqrt(R_star / (2 × a))
  // Note: Assumes albedo = 0 (perfect black body absorber)
  EQUILIBRIUM_TEMP_ALBEDO: 0,

  // Temperature conversion offset
  CELSIUS_OFFSET: 273.15, // Kelvin to Celsius

  // Temperature defaults and fallbacks
  TEMPERATURE_DEFAULT_FALLBACK: 150, // Default fallback when no data available (K)
  TEMPERATURE_UNKNOWN_THRESHOLD: 0, // Temperature below this is considered invalid

  // Temperature-based ring color thresholds (Kelvin)
  // Used for determining ring composition and appearance based on planet temperature
  RING_COLOR_THRESHOLD_VERY_COLD: 120, // Ultra-cold: pure ice rings
  RING_COLOR_THRESHOLD_COLD: 200, // Cold: mixed ice/rock
  RING_COLOR_THRESHOLD_COOL: 350, // Cool: rocky/dusty
  RING_COLOR_THRESHOLD_WARM: 600, // Warm: dark rocky/metallic
  // Above 600K: Hot - silicate/volcanic debris

  // Clamping and scaling defaults
  CLAMP_MIN: 0.0,
  CLAMP_MAX: 1.0,

  // Earth reference values for comparisons
  EARTH_RADIUS_RELATIVE: 1.0, // Earth radii (by definition)
  EARTH_MASS_RELATIVE: 1.0, // Earth masses (by definition)
  EARTH_DENSITY: 5.51, // g/cm³
  EARTH_EQUILIBRIUM_TEMP: 255, // K (equilibrium temperature)
  EARTH_SURFACE_GRAVITY: 9.8, // m/s² (standard)

  // Habitable zone boundaries for Sun-like star (AU)
  // Used with calculateHabitableZone to scale by stellar luminosity
  HZ_INNER_AU: 0.95, // Inner habitable zone boundary
  HZ_OUTER_AU: 1.67, // Outer habitable zone boundary

  // Visualization sizing constraints
  COMPARISON_MAX_SIZE: 120, // Maximum sphere size in pixels
  COMPARISON_MIN_SIZE: 12, // Minimum sphere size for visibility
  COMPARISON_MAX_RADIUS_FACTOR: 15, // Max radius to compare against for sizing
} as const;

export type MathConstants = typeof MATH_CONSTANTS;
