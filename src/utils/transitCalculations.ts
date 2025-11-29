/**
 * Transit Calculation Utilities
 * Functions for generating synthetic transit light curves from orbital parameters
 */

import type { Exoplanet } from '../types';
import { smoothstep, clamp } from './math/utilities';

/**
 * Transit data point for light curve visualization
 */
export interface TransitDataPoint {
  phase: number;      // Orbital phase (0-1)
  flux: number;       // Relative flux including noise
  fluxClean: number;  // Model flux without noise
}

/**
 * Gaussian random number generator using Box-Muller transform
 */
export function gaussianNoise(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Calculate transit depth from planet and star radii
 * Depth = (Rp / Rs)^2
 */
function calculateDepth(planet: Exoplanet): number {
  // Primary source: direct measurement
  if (planet.pl_trandep !== null && planet.pl_trandep > 0) {
    return planet.pl_trandep / 100; // Convert percentage to fraction
  }

  // Fallback: calculate from radius ratio if available
  if (planet.pl_ratror !== null && planet.pl_ratror > 0) {
    return planet.pl_ratror * planet.pl_ratror;
  }

  // Final fallback: estimate from planet and stellar radius
  if (planet.pl_rade !== null && planet.st_rad !== null) {
    const Rp_in_solar = planet.pl_rade / 109.1; // Convert Earth radii to solar radii
    const ratio = Rp_in_solar / planet.st_rad;
    return ratio * ratio;
  }

  // Default to a small transit
  return 0.01;
}

/**
 * Calculate transit duration as fraction of orbital period
 * Uses impact parameter to refine estimate
 */
function calculateDurationFraction(planet: Exoplanet): number {
  // Primary source: direct measurement
  if (planet.pl_trandur !== null && planet.pl_orbper !== null && planet.pl_trandur > 0) {
    // Convert hours to days, then to fraction of period
    return (planet.pl_trandur / 24) / planet.pl_orbper;
  }

  // Fallback: estimate from impact parameter and orbital geometry
  if (planet.pl_imppar !== null && planet.pl_ratdor !== null) {
    // Rough estimate: duration ~ 2 * arcsin(b / a) / π
    // Simplified for visualization
    const b = planet.pl_imppar;
    const a = planet.pl_ratdor;

    if (a > 0) {
      // Impact parameter ranges from 0 to 1
      // Central transit (b=0): duration ≈ 2/a
      // Grazing transit (b=1): duration ≈ 0
      const centralDuration = 2 / a;
      const impactFactor = Math.sqrt(Math.max(0, 1 - b * b));
      return centralDuration * impactFactor * 0.1; // Scale factor for visualization
    }
  }

  // Default estimate for visualization
  return 0.08;
}

/**
 * Calculate ingress/egress duration as fraction of total transit duration
 */
function calculateIngressFraction(transitDuration: number): number {
  // Ingress typically takes 10-20% of total transit duration
  // Deeper transits have steeper ingress edges
  return Math.min(0.2, Math.max(0.1, transitDuration * 0.15));
}

/**
 * Generate synthetic transit light curve
 * Produces realistic-looking light curve with ingress/egress and noise
 */
export function generateTransitCurve(
  planet: Exoplanet,
  numPoints: number = 1500  // Increased for better resolution on short transits
): TransitDataPoint[] {
  const data: TransitDataPoint[] = [];

  // Calculate transit parameters
  let depth = calculateDepth(planet);

  // EDUCATIONAL EXAGGERATION: Boost depth for visibility without going overboard
  // Real transits are often too shallow to see clearly in a chart
  // We exaggerate smaller transits more, and taper off for larger ones
  if (depth < 0.0005) {
    // Extremely shallow (< 0.05%) - exaggerate 12x
    depth *= 12;
  } else if (depth < 0.002) {
    // Very shallow (< 0.2%) - exaggerate 8x
    depth *= 8;
  } else if (depth < 0.01) {
    // Shallow (< 1%) - exaggerate 4x
    depth *= 4;
  } else if (depth < 0.05) {
    // Moderate (1-5%) - exaggerate 2x
    depth *= 2;
  }
  // Deeper transits (> 5%) get minimal or no exaggeration

  // Cap maximum depth to keep visualization readable (0.25 = 25% dip)
  depth = Math.min(depth, 0.25);

  let transitDurationFrac = calculateDurationFraction(planet);
  
  // EDUCATIONAL EXAGGERATION: Ensure minimum width for visibility
  // If the transit is too short relative to period, it disappears on screen
  // We ensure it occupies at least 5% of the chart width so the "U" shape is visible
  transitDurationFrac = Math.max(transitDurationFrac, 0.05);

  const ingressFrac = calculateIngressFraction(transitDurationFrac);

  // Center of transit at phase 0.5
  const transitCenter = 0.5;
  const transitStart = transitCenter - transitDurationFrac / 2;
  const transitEnd = transitCenter + transitDurationFrac / 2;

  // Ingress and egress boundaries
  const firstContactStart = transitStart;
  const firstContactEnd = transitStart + ingressFrac;
  const lastContactStart = transitEnd - ingressFrac;
  const lastContactEnd = transitEnd;

  // Noise level scales with transit depth (reduced for cleaner visualization)
  const noiseLevel = Math.max(0.00005, depth * 0.03);

  // Generate light curve points
  for (let i = 0; i < numPoints; i++) {
    const phase = i / (numPoints - 1); // 0 to 1
    let fluxClean = 1.0;

    // Calculate flux during different parts of transit
    if (phase >= firstContactStart && phase <= lastContactEnd) {
      if (phase < firstContactEnd) {
        // Ingress: smooth transition from 1.0 to bottom
        const ingressProgress = (phase - firstContactStart) / (firstContactEnd - firstContactStart);
        fluxClean = 1.0 - depth * smoothstep(ingressProgress);
      } else if (phase > lastContactStart) {
        // Egress: smooth transition from bottom to 1.0
        const egressProgress = (phase - lastContactStart) / (lastContactEnd - lastContactStart);
        fluxClean = 1.0 - depth * (1.0 - smoothstep(egressProgress));
      } else {
        // Mid-transit: constant depth
        fluxClean = 1.0 - depth;
      }
    }

    // Add Gaussian noise to simulate real observations
    const noise = gaussianNoise() * noiseLevel;
    const flux = clamp(fluxClean + noise, 1.0 - depth - 0.01, 1.01);

    data.push({
      phase,
      flux: Number(flux.toFixed(6)), // Round for cleaner display
      fluxClean: Number(fluxClean.toFixed(6)),
    });
  }

  return data;
}

/**
 * Get formatted transit depth for display
 */
export function formatTransitDepth(planet: Exoplanet): string {
  const depth = calculateDepth(planet);
  const percentDepth = depth * 100;

  if (percentDepth < 0.01) {
    return `${(percentDepth * 1000).toFixed(1)} ppm`;
  }
  return `${percentDepth.toFixed(3)}%`;
}

/**
 * Get formatted transit duration for display
 */
export function formatTransitDuration(planet: Exoplanet): string {
  if (planet.pl_trandur !== null) {
    const hours = planet.pl_trandur;
    if (hours < 1) {
      return `${(hours * 60).toFixed(0)} min`;
    }
    if (hours < 24) {
      return `${hours.toFixed(2)} h`;
    }
    return `${(hours / 24).toFixed(2)} days`;
  }
  return 'N/A';
}

/**
 * Get formatted orbital period for display
 */
export function formatOrbitalPeriod(planet: Exoplanet): string {
  if (planet.pl_orbper === null) return 'N/A';

  const days = planet.pl_orbper;
  if (days < 365) {
    return `${days.toFixed(2)} days`;
  }
  return `${(days / 365.25).toFixed(2)} years`;
}

/**
 * Get formatted planet radius for display
 */
export function formatPlanetRadius(planet: Exoplanet): string {
  if (planet.pl_rade === null) {
    if (planet.pl_ratror !== null) {
      return `${planet.pl_ratror.toFixed(2)} R★`;
    }
    return 'N/A';
  }

  const earthRadii = planet.pl_rade;
  if (earthRadii < 0.5) {
    return `${earthRadii.toFixed(2)} R⊕`;
  }
  if (earthRadii < 1.5) {
    return `${earthRadii.toFixed(2)} R⊕`;
  }
  if (earthRadii < 10) {
    return `${earthRadii.toFixed(1)} R⊕`;
  }
  return `${(earthRadii / 109.1).toFixed(2)} R☉`;
}

/**
 * Get formatted impact parameter for display
 */
export function formatImpactParameter(planet: Exoplanet): string {
  if (planet.pl_imppar === null) return 'N/A';
  return planet.pl_imppar.toFixed(2);
}

/**
 * Get formatted semi-major axis / stellar radius for display
 */
export function formatSemiMajorRatio(planet: Exoplanet): string {
  if (planet.pl_ratdor === null) return 'N/A';
  return planet.pl_ratdor.toFixed(2);
}
