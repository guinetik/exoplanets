/**
 * PlanetEarthComparison Component
 * Visual side-by-side comparison of a planet with Earth
 * Shows size, mass, density, and other key metrics
 */

import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';

// Earth reference values
const EARTH = {
  radius: 1.0, // R⊕
  mass: 1.0, // M⊕
  density: 5.51, // g/cm³
  temperature: 255, // K (equilibrium)
  gravity: 9.8, // m/s²
};

/**
 * Gets a color based on planet type
 * @param planetType - The planet classification
 * @returns CSS color string
 */
function getPlanetColor(planetType: string | null): string {
  switch (planetType) {
    case 'Sub-Earth':
      return '#a0a0a0';
    case 'Earth-sized':
      return '#4a90d9';
    case 'Super-Earth':
      return '#6bb86b';
    case 'Sub-Neptune':
      return '#7ec8e3';
    case 'Neptune-like':
      return '#4169e1';
    case 'Gas Giant':
      return '#d4a574';
    default:
      return '#888888';
  }
}

/**
 * Calculates surface gravity relative to Earth
 * g = G * M / R² → g_rel = (M_rel) / (R_rel)²
 * @param massEarth - Mass in Earth masses
 * @param radiusEarth - Radius in Earth radii
 * @returns Surface gravity relative to Earth
 */
function calculateSurfaceGravity(
  massEarth: number | null,
  radiusEarth: number | null
): number | null {
  if (!massEarth || !radiusEarth || radiusEarth === 0) return null;
  return massEarth / (radiusEarth * radiusEarth);
}

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

  // Calculate visual sizes (max 120px for the larger one)
  const maxSize = 120;
  const earthSize = planetRadius >= 1 ? maxSize / Math.min(planetRadius, 15) : maxSize;
  const planetSize = planetRadius >= 1 ? maxSize : maxSize * planetRadius;

  // Cap minimum size for visibility
  const minSize = 12;
  const earthDisplaySize = Math.max(earthSize, minSize);
  const planetDisplaySize = Math.max(planetSize, minSize);

  // Calculate surface gravity
  const surfaceGravity = calculateSurfaceGravity(planetMass, planetRadius);

  // Get planet color
  const planetColor = getPlanetColor(planet.planet_type);

  // Comparison metrics
  const metrics = [
    {
      key: 'radius',
      label: t('pages.planet.comparison.radius'),
      earthValue: `${EARTH.radius.toFixed(1)} R⊕`,
      planetValue: planet.pl_rade ? `${planet.pl_rade.toFixed(2)} R⊕` : '—',
      ratio: planet.pl_rade ? planet.pl_rade / EARTH.radius : null,
    },
    {
      key: 'mass',
      label: t('pages.planet.comparison.mass'),
      earthValue: `${EARTH.mass.toFixed(1)} M⊕`,
      planetValue: planetMass ? `${planetMass.toFixed(2)} M⊕` : '—',
      ratio: planetMass ? planetMass / EARTH.mass : null,
    },
    {
      key: 'density',
      label: t('pages.planet.comparison.density'),
      earthValue: `${EARTH.density.toFixed(2)} g/cm³`,
      planetValue: planetDensity ? `${planetDensity.toFixed(2)} g/cm³` : '—',
      ratio: planetDensity ? planetDensity / EARTH.density : null,
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
      earthValue: `${EARTH.temperature} K`,
      planetValue: planetTemp ? `${planetTemp.toFixed(0)} K` : '—',
      ratio: planetTemp ? planetTemp / EARTH.temperature : null,
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
              background: `radial-gradient(circle at 30% 30%, #87ceeb, #4a90d9, #1e4d7b)`,
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
              background: `radial-gradient(circle at 30% 30%, #fff, ${planetColor}, ${planetColor}dd)`,
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

