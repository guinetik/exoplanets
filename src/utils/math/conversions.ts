/**
 * Unit Conversion Functions
 * Convert between various astronomical and scientific units
 */

import { MATH_CONSTANTS } from './constants';

/**
 * Convert temperature from Kelvin to Celsius
 * @param kelvin - Temperature in Kelvin
 * @returns Temperature in Celsius
 */
export function kelvinToCelsius(kelvin: number): number {
  return kelvin - MATH_CONSTANTS.CELSIUS_OFFSET;
}

/**
 * Convert temperature from Celsius to Kelvin
 * @param celsius - Temperature in Celsius
 * @returns Temperature in Kelvin
 */
export function celsiusToKelvin(celsius: number): number {
  return celsius + MATH_CONSTANTS.CELSIUS_OFFSET;
}

/**
 * Convert distance from AU to kilometers
 * @param au - Distance in Astronomical Units
 * @returns Distance in kilometers
 */
export function auToKilometers(au: number): number {
  return au * MATH_CONSTANTS.AU_TO_KM;
}

/**
 * Convert distance from kilometers to AU
 * @param km - Distance in kilometers
 * @returns Distance in Astronomical Units
 */
export function kilometersToAu(km: number): number {
  return km / MATH_CONSTANTS.AU_TO_KM;
}

/**
 * Convert distance from parsecs to light-years
 * @param parsecs - Distance in parsecs
 * @returns Distance in light-years
 */
export function parsecToLightYears(parsecs: number): number {
  return parsecs * MATH_CONSTANTS.PARSEC_TO_LY;
}

/**
 * Convert distance from light-years to parsecs
 * @param lightYears - Distance in light-years
 * @returns Distance in parsecs
 */
export function lightYearsToParsec(lightYears: number): number {
  return lightYears / MATH_CONSTANTS.PARSEC_TO_LY;
}

/**
 * Convert distance from parsecs to kilometers
 * @param parsecs - Distance in parsecs
 * @returns Distance in kilometers
 */
export function parsecToKilometers(parsecs: number): number {
  return parsecs * MATH_CONSTANTS.PARSEC_TO_KM;
}

/**
 * Convert stellar radius from solar radii to AU
 * Useful for Stefan-Boltzmann calculations
 * @param solarRadii - Radius in solar radii
 * @returns Radius in AU
 */
export function solarRadiiToAU(solarRadii: number): number {
  return solarRadii * MATH_CONSTANTS.SOLAR_RADIUS_AU;
}

/**
 * Convert stellar radius from AU to solar radii
 * @param au - Radius in AU
 * @returns Radius in solar radii
 */
export function auToSolarRadii(au: number): number {
  return au / MATH_CONSTANTS.SOLAR_RADIUS_AU;
}

/**
 * Convert planet radius from Earth radii to kilometers
 * @param earthRadii - Radius in Earth radii
 * @returns Radius in kilometers
 */
export function earthRadiiToKilometers(earthRadii: number): number {
  return earthRadii * MATH_CONSTANTS.EARTH_RADIUS_KM;
}

/**
 * Convert planet radius from kilometers to Earth radii
 * @param km - Radius in kilometers
 * @returns Radius in Earth radii
 */
export function kilometersToEarthRadii(km: number): number {
  return km / MATH_CONSTANTS.EARTH_RADIUS_KM;
}

/**
 * Convert planet mass from Earth masses to kilograms
 * @param earthMasses - Mass in Earth masses
 * @returns Mass in kilograms
 */
export function earthMassesToKg(earthMasses: number): number {
  return earthMasses * MATH_CONSTANTS.EARTH_MASS_KG;
}

/**
 * Convert planet mass from kilograms to Earth masses
 * @param kg - Mass in kilograms
 * @returns Mass in Earth masses
 */
export function kgToEarthMasses(kg: number): number {
  return kg / MATH_CONSTANTS.EARTH_MASS_KG;
}

/**
 * Convert orbital period from days to years
 * @param days - Period in days
 * @returns Period in years
 */
export function daysToYears(days: number): number {
  return days / MATH_CONSTANTS.EARTH_YEAR_DAYS;
}

/**
 * Convert orbital period from years to days
 * @param years - Period in years
 * @returns Period in days
 */
export function yearsToDays(years: number): number {
  return years * MATH_CONSTANTS.EARTH_YEAR_DAYS;
}
