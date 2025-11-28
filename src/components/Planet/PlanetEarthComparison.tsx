/**
 * PlanetEarthComparison Component
 * Visual side-by-side comparison of a planet with Earth
 * Shows size, mass, density, and other key metrics
 */

import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';
import { calculateSurfaceGravity } from '../../utils/math/planet';
import {
  getPlanetColor,
  calculateComparisonSizes,
  createSphereGradient,
  EARTH_REFERENCE,
  EARTH_GRADIENT,
} from '../../utils/planetComparison';


interface PlanetEarthComparisonProps {
  /** Planet data to compare with Earth */
  planet: Exoplanet;
}

/**
 * Visual comparison component showing planet vs Earth
 * with size spheres and key metrics
 */
export function PlanetEarthComparison({ planet }: PlanetEarthComparisonProps) {
  const { t } = useTranslation();

  // Planet values (default to Earth if unknown)
  const planetRadius = planet.pl_rade || 1;
  const planetMass = planet.pl_bmasse || null;
  const planetDensity = planet.pl_dens || null;
  const planetTemp = planet.pl_eqt || null;

  // Calculate visual sizes using centralized formula
  const { earthDisplaySize, planetDisplaySize } = calculateComparisonSizes(planetRadius);

  // Calculate surface gravity using centralized function
  const gravityResult = calculateSurfaceGravity(planetMass, planetRadius);
  const surfaceGravity = gravityResult?.gravityEarth ?? null;

  // Get planet color using centralized mapping
  const planetColor = getPlanetColor(planet.planet_type);

  // Comparison metrics using centralized EARTH_REFERENCE
  const metrics = [
    {
      key: 'radius',
      label: t('pages.planet.comparison.radius'),
      earthValue: `${EARTH_REFERENCE.radius.toFixed(1)} R⊕`,
      planetValue: planet.pl_rade ? `${planet.pl_rade.toFixed(2)} R⊕` : '—',
      ratio: planet.pl_rade ? planet.pl_rade / EARTH_REFERENCE.radius : null,
    },
    {
      key: 'mass',
      label: t('pages.planet.comparison.mass'),
      earthValue: `${EARTH_REFERENCE.mass.toFixed(1)} M⊕`,
      planetValue: planetMass ? `${planetMass.toFixed(2)} M⊕` : '—',
      ratio: planetMass ? planetMass / EARTH_REFERENCE.mass : null,
    },
    {
      key: 'density',
      label: t('pages.planet.comparison.density'),
      earthValue: `${EARTH_REFERENCE.density.toFixed(2)} g/cm³`,
      planetValue: planetDensity ? `${planetDensity.toFixed(2)} g/cm³` : '—',
      ratio: planetDensity ? planetDensity / EARTH_REFERENCE.density : null,
    },
    {
      key: 'gravity',
      label: t('pages.planet.comparison.gravity'),
      earthValue: '1.0 g',
      planetValue: surfaceGravity ? `${surfaceGravity.toFixed(2)} g` : '—',
      ratio: surfaceGravity,
    },
    {
      key: 'temperature',
      label: t('pages.planet.comparison.temperature'),
      earthValue: `${EARTH_REFERENCE.temperature} K`,
      planetValue: planetTemp ? `${planetTemp.toFixed(0)} K` : '—',
      ratio: planetTemp ? planetTemp / EARTH_REFERENCE.temperature : null,
    },
  ];

  /**
   * Formats the ratio as a comparison string
   */
  const formatRatio = (ratio: number | null): string => {
    if (ratio === null) return '';
    if (ratio > 1) {
      return t('pages.planet.comparison.timesLarger', { times: ratio.toFixed(1) });
    } else if (ratio < 1) {
      return t('pages.planet.comparison.timesSmaller', { times: (1 / ratio).toFixed(1) });
    }
    return t('pages.planet.comparison.similar');
  };

  return (
    <div className="planet-earth-comparison">
      {/* Visual size comparison */}
      <div className="comparison-visual">
        {/* Earth */}
        <div className="comparison-body">
          <div
            className="comparison-sphere earth"
            style={{
              width: earthDisplaySize,
              height: earthDisplaySize,
              background: EARTH_GRADIENT,
            }}
          >
            <div className="sphere-highlight" />
          </div>
          <span className="comparison-label">
            {t('pages.planet.comparison.earth')}
          </span>
          <span className="comparison-stats">1.0 R⊕ • 1.0 M⊕</span>
        </div>

        {/* VS indicator */}
        <div className="comparison-vs">vs</div>

        {/* Planet */}
        <div className="comparison-body">
          <div
            className="comparison-sphere planet"
            style={{
              width: planetDisplaySize,
              height: planetDisplaySize,
              background: createSphereGradient(planetColor),
            }}
          >
            <div className="sphere-highlight" />
          </div>
          <span className="comparison-label">{planet.pl_name}</span>
          <span className="comparison-stats">
            {planet.pl_rade ? `${planet.pl_rade.toFixed(2)} R⊕` : '—'}
            {' • '}
            {planetMass ? `${planetMass.toFixed(1)} M⊕` : '—'}
          </span>
        </div>
      </div>

      {/* Comparison summary */}
      <div className="comparison-summary">
        {planetRadius > 1 ? (
          <p>
            {t('pages.planet.comparison.largerThanEarth', {
              times: planetRadius.toFixed(1),
            })}
          </p>
        ) : planetRadius < 1 ? (
          <p>
            {t('pages.planet.comparison.smallerThanEarth', {
              pct: ((1 - planetRadius) * 100).toFixed(0),
            })}
          </p>
        ) : (
          <p>{t('pages.planet.comparison.similarToEarth')}</p>
        )}
      </div>

      {/* Metrics table */}
      <div className="comparison-metrics">
        {metrics.map((metric) => (
          <div key={metric.key} className="comparison-metric-row">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-earth">{metric.earthValue}</span>
            <span className="metric-planet">{metric.planetValue}</span>
            <span className="metric-ratio">{formatRatio(metric.ratio)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlanetEarthComparison;

