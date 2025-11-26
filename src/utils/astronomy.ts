/**
 * Astronomy Utilities
 * Coordinate transformations for starfield visualization
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Mathematical and astronomical constants
 */
export const ASTRONOMY_CONSTANTS = {
  // Angle conversion
  DEGREES_TO_RADIANS: Math.PI / 180,
  RADIANS_TO_DEGREES: 180 / Math.PI,
  FULL_CIRCLE: 360,
  HALF_CIRCLE: 180,
  QUARTER_CIRCLE: 90,

  // Time constants
  MILLISECONDS_PER_DAY: 86400000,
  JULIAN_DATE_OFFSET: 2440587.5,
  J2000_JULIAN_DATE: 2451545.0,
  JULIAN_CENTURIES_PER_CENTURY: 36525.0,

  // GMST (Greenwich Mean Sidereal Time) calculation coefficients
  GMST_CONSTANT: 280.46061837,
  GMST_RATE: 360.98564736629,
  GMST_T_SQUARED_COEFF: 0.000387933,
  GMST_T_CUBED_DIVISOR: 38710000.0,

  // Hour angle normalization
  HOUR_ANGLE_MIN: -180,
  HOUR_ANGLE_MAX: 180,

  // Magnitude and brightness
  NAKED_EYE_LIMIT: 6.5,
  MIN_MAGNITUDE: 0,
  MAX_MAGNITUDE: 20,
  MAGNITUDE_CLAMP_MIN: 0.1,
  MAGNITUDE_CLAMP_MAX: 3.0,
  MAGNITUDE_SIZE_COEFFICIENT: 2.5,
  MAGNITUDE_EXPONENT_DIVISOR: 10,

  // Azimuth compass directions
  COMPASS_DIRECTIONS: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const,
  COMPASS_SECTOR_DEGREES: 45,

  // Formatting
  COORDINATE_DECIMAL_PLACES: 2,

  // Coordinate bounds
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
  RA_MIN: 0,
  RA_MAX: 360,
  DECLINATION_MIN: -90,
  DECLINATION_MAX: 90,
  ALTITUDE_MIN: -90,
  ALTITUDE_MAX: 90,
  AZIMUTH_MIN: 0,
  AZIMUTH_MAX: 360,

  // Default values
  DEFAULT_SPHERE_RADIUS: 1,
  DEFAULT_STAR_RADIUS: 100,
  HORIZON_ALTITUDE_THRESHOLD: 0,

  // Trigonometric bounds for edge cases
  COSINE_MAX: 1,
  COSINE_MIN: -1,
} as const;

/**
 * Star spectral class colors (hex values)
 */
export const STAR_COLORS: Record<string, number> = {
  O: 0x5b7cff, // Blue
  B: 0x7b9fff, // Blue-white
  A: 0xcad7ff, // White
  F: 0xf8f7ff, // Yellow-white
  G: 0xfff4ea, // Yellow (like our Sun)
  K: 0xffd2a1, // Orange
  M: 0xff3333, // Red-orange
  L: 0xff4444, // Red-brown (brown dwarf)
  T: 0xff5555, // Brown (cool brown dwarf)
  Y: 0xff2200, // Dark brown (coolest)
};

const DEFAULT_STAR_COLOR = 0xffffff; // White

// ============================================================================
// Interfaces
// ============================================================================

export interface ObserverLocation {
  latitude: number; // degrees, -90 to 90
  longitude: number; // degrees, -180 to 180
}

export interface EquatorialCoords {
  ra: number; // Right Ascension in degrees (0-360)
  dec: number; // Declination in degrees (-90 to 90)
}

export interface HorizontalCoords {
  altitude: number; // degrees above horizon (-90 to 90)
  azimuth: number; // degrees from north (0-360)
}

// ============================================================================
// Angle Conversion
// ============================================================================

/**
 * Convert degrees to radians
 */
export function degToRad(deg: number): number {
  return deg * ASTRONOMY_CONSTANTS.DEGREES_TO_RADIANS;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad: number): number {
  return rad * ASTRONOMY_CONSTANTS.RADIANS_TO_DEGREES;
}

// ============================================================================
// Sidereal Time Calculations
// ============================================================================

/**
 * Calculate Julian Date from a JavaScript Date
 */
export function getJulianDate(date: Date): number {
  const time = date.getTime();
  return (
    time / ASTRONOMY_CONSTANTS.MILLISECONDS_PER_DAY +
    ASTRONOMY_CONSTANTS.JULIAN_DATE_OFFSET
  );
}

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) in degrees
 * Based on the algorithm from the Astronomical Almanac
 */
export function getGMST(date: Date): number {
  const jd = getJulianDate(date);
  const T =
    (jd - ASTRONOMY_CONSTANTS.J2000_JULIAN_DATE) /
    ASTRONOMY_CONSTANTS.JULIAN_CENTURIES_PER_CENTURY; // Julian centuries from J2000.0

  // GMST in degrees
  let gmst =
    ASTRONOMY_CONSTANTS.GMST_CONSTANT +
    ASTRONOMY_CONSTANTS.GMST_RATE *
      (jd - ASTRONOMY_CONSTANTS.J2000_JULIAN_DATE) +
    ASTRONOMY_CONSTANTS.GMST_T_SQUARED_COEFF * T * T -
    (T * T * T) / ASTRONOMY_CONSTANTS.GMST_T_CUBED_DIVISOR;

  // Normalize to 0-360
  gmst =
    ((gmst % ASTRONOMY_CONSTANTS.FULL_CIRCLE) +
      ASTRONOMY_CONSTANTS.FULL_CIRCLE) %
    ASTRONOMY_CONSTANTS.FULL_CIRCLE;
  return gmst;
}

/**
 * Calculate Local Sidereal Time (LST) in degrees
 */
export function getLST(date: Date, longitude: number): number {
  const gmst = getGMST(date);
  let lst = gmst + longitude;
  // Normalize to 0-360
  return (
    ((lst % ASTRONOMY_CONSTANTS.FULL_CIRCLE) +
      ASTRONOMY_CONSTANTS.FULL_CIRCLE) %
    ASTRONOMY_CONSTANTS.FULL_CIRCLE
  );
}

// ============================================================================
// Coordinate Transformations
// ============================================================================

/**
 * Convert Equatorial coordinates (RA/Dec) to Horizontal coordinates (Alt/Az)
 *
 * @param coords - RA/Dec in degrees
 * @param observer - Observer's location (lat/long in degrees)
 * @param date - Date/time of observation
 * @returns Altitude and Azimuth in degrees
 */
export function equatorialToHorizontal(
  coords: EquatorialCoords,
  observer: ObserverLocation,
  date: Date = new Date()
): HorizontalCoords {
  const { ra, dec } = coords;
  const { latitude, longitude } = observer;

  // Calculate Local Sidereal Time
  const lst = getLST(date, longitude);

  // Calculate Hour Angle
  let ha = lst - ra;
  // Normalize to -180 to 180
  if (ha < ASTRONOMY_CONSTANTS.HOUR_ANGLE_MIN)
    ha += ASTRONOMY_CONSTANTS.FULL_CIRCLE;
  if (ha > ASTRONOMY_CONSTANTS.HOUR_ANGLE_MAX)
    ha -= ASTRONOMY_CONSTANTS.FULL_CIRCLE;

  // Convert to radians
  const haRad = degToRad(ha);
  const decRad = degToRad(dec);
  const latRad = degToRad(latitude);

  // Calculate altitude
  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altitude = radToDeg(Math.asin(sinAlt));

  // Calculate azimuth
  const cosAz =
    (Math.sin(decRad) - Math.sin(degToRad(altitude)) * Math.sin(latRad)) /
    (Math.cos(degToRad(altitude)) * Math.cos(latRad));

  // Handle edge cases near poles
  let azimuth: number;
  if (Math.abs(cosAz) > ASTRONOMY_CONSTANTS.COSINE_MAX) {
    azimuth = cosAz > 0 ? 0 : ASTRONOMY_CONSTANTS.HALF_CIRCLE;
  } else {
    azimuth = radToDeg(
      Math.acos(
        Math.max(
          ASTRONOMY_CONSTANTS.COSINE_MIN,
          Math.min(ASTRONOMY_CONSTANTS.COSINE_MAX, cosAz)
        )
      )
    );
  }

  // Adjust azimuth based on hour angle
  if (Math.sin(haRad) > 0) {
    azimuth = ASTRONOMY_CONSTANTS.FULL_CIRCLE - azimuth;
  }

  return { altitude, azimuth };
}

/**
 * Convert Horizontal coordinates to 3D position on a unit sphere
 * Y is up, Z is towards viewer (south), X is right (west)
 *
 * @param coords - Altitude/Azimuth in degrees
 * @param radius - Radius of the sphere (default 1)
 */
export function horizontalTo3D(
  coords: HorizontalCoords,
  radius: number = ASTRONOMY_CONSTANTS.DEFAULT_SPHERE_RADIUS
): { x: number; y: number; z: number } {
  const altRad = degToRad(coords.altitude);
  const azRad = degToRad(coords.azimuth);

  // Convert spherical to Cartesian
  // Azimuth: 0 = North, 90 = East, 180 = South, 270 = West
  const y = Math.sin(altRad) * radius;
  const groundDist = Math.cos(altRad) * radius;
  const x = -Math.sin(azRad) * groundDist; // West is positive X
  const z = -Math.cos(azRad) * groundDist; // North is negative Z

  return { x, y, z };
}

/**
 * Convert RA/Dec directly to 3D position for a given observer
 */
export function starTo3D(
  ra: number,
  dec: number,
  observer: ObserverLocation,
  date: Date = new Date(),
  radius: number = ASTRONOMY_CONSTANTS.DEFAULT_STAR_RADIUS
): { x: number; y: number; z: number; visible: boolean } {
  const horizontal = equatorialToHorizontal({ ra, dec }, observer, date);
  const pos = horizontalTo3D(horizontal, radius);

  return {
    ...pos,
    visible:
      horizontal.altitude > ASTRONOMY_CONSTANTS.HORIZON_ALTITUDE_THRESHOLD,
  };
}

// ============================================================================
// Star Properties
// ============================================================================

/**
 * Get star color based on spectral class
 */
export function getStarColorHex(starClass: string | null): number {
  if (!starClass) return DEFAULT_STAR_COLOR;

  const classLetter = starClass.charAt(0).toUpperCase();
  return STAR_COLORS[classLetter] ?? DEFAULT_STAR_COLOR;
}

/**
 * Calculate apparent brightness factor from visual magnitude
 * Brighter stars have lower magnitude values
 *
 * @param vmag - Visual magnitude (typically -1 to 20+)
 * @returns Size multiplier (0.1 to 3.0)
 */
export function magnitudeToSize(vmag: number | null): number {
  if (vmag === null || isNaN(vmag)) return 0.5;

  // Magnitude scale: lower = brighter
  // Most visible stars: -1 to 6
  // Our data stars: typically 5 to 18

  // Clamp to reasonable range
  const clampedMag = Math.max(
    ASTRONOMY_CONSTANTS.MIN_MAGNITUDE,
    Math.min(ASTRONOMY_CONSTANTS.MAX_MAGNITUDE, vmag)
  );

  // Inverse logarithmic scale
  // Bright stars (mag 0-6): size 1.5-3.0
  // Medium stars (mag 6-12): size 0.5-1.5
  // Faint stars (mag 12+): size 0.1-0.5
  const size =
    ASTRONOMY_CONSTANTS.MAGNITUDE_SIZE_COEFFICIENT *
    Math.pow(10, -clampedMag / ASTRONOMY_CONSTANTS.MAGNITUDE_EXPONENT_DIVISOR);

  return Math.max(
    ASTRONOMY_CONSTANTS.MAGNITUDE_CLAMP_MIN,
    Math.min(ASTRONOMY_CONSTANTS.MAGNITUDE_CLAMP_MAX, size)
  );
}

/**
 * Check if a star would be visible to the naked eye
 * Naked eye limit is approximately magnitude 6
 */
export function isNakedEyeVisible(vmag: number | null): boolean {
  if (vmag === null) return false;
  return vmag <= ASTRONOMY_CONSTANTS.NAKED_EYE_LIMIT;
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format coordinates for display
 */
export function formatLatitude(lat: number): string {
  const abs = Math.abs(lat);
  const dir = lat >= 0 ? 'N' : 'S';
  return `${abs.toFixed(ASTRONOMY_CONSTANTS.COORDINATE_DECIMAL_PLACES)}°${dir}`;
}

export function formatLongitude(lon: number): string {
  const abs = Math.abs(lon);
  const dir = lon >= 0 ? 'E' : 'W';
  return `${abs.toFixed(ASTRONOMY_CONSTANTS.COORDINATE_DECIMAL_PLACES)}°${dir}`;
}

export function formatAzimuth(az: number): string {
  return `${az.toFixed(ASTRONOMY_CONSTANTS.COORDINATE_DECIMAL_PLACES)}°`;
}

export function formatAltitude(alt: number): string {
  return `${alt.toFixed(ASTRONOMY_CONSTANTS.COORDINATE_DECIMAL_PLACES)}°`;
}

/**
 * Get compass direction from azimuth
 */
export function azimuthToCompass(azimuth: number): string {
  const index =
    Math.round(azimuth / ASTRONOMY_CONSTANTS.COMPASS_SECTOR_DEGREES) %
    ASTRONOMY_CONSTANTS.COMPASS_DIRECTIONS.length;
  return ASTRONOMY_CONSTANTS.COMPASS_DIRECTIONS[index];
}

// ============================================================================
// Default Locations
// ============================================================================

/**
 * Default observer locations
 */
export const LOCATIONS: Record<string, ObserverLocation> = {
  'New York': { latitude: 40.7128, longitude: -74.006 },
  London: { latitude: 51.5074, longitude: -0.1278 },
  Tokyo: { latitude: 35.6762, longitude: 139.6503 },
  Sydney: { latitude: -33.8688, longitude: 151.2093 },
  'São Paulo': { latitude: -23.5505, longitude: -46.6333 },
  'Cape Town': { latitude: -33.9249, longitude: 18.4241 },
  'Rio de Janeiro': { latitude: -22.9068, longitude: -43.1729 },
  Greenwich: { latitude: 51.4772, longitude: 0.0 },
};
