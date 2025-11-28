/**
 * General Mathematical Utilities
 * Common math operations used across the app
 */

/**
 * Normalize a value to 0-1 range
 * @param value - The value to normalize
 * @param min - Minimum bound of the value range
 * @param max - Maximum bound of the value range
 * @param fallback - Value to return if input is null/undefined/NaN (default 0.5)
 * @returns Normalized value between 0 and 1
 */
export function normalize(
  value: number | null | undefined,
  min: number,
  max: number,
  fallback: number = 0.5
): number {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Clamp a value between min and max bounds
 * @param value - The value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map a value from one range to another (linear interpolation)
 * @param value - The value to map
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value in output range
 */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothstep interpolation (cubic Hermite curve)
 * Smooth interpolation that starts and ends slowly
 * @param t - Interpolation factor (0-1)
 * @returns Smoothed interpolation factor
 */
export function smoothstep(t: number): number {
  const clamped = clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}
