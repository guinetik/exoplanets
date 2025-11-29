/**
 * SystemOverviewModal Component
 * Full-screen modal with comprehensive star system information
 * Includes star comparison, system stats, charts, and discovery info
 */

import { useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import type { Star, Exoplanet } from '../../types';
import {
  getHabitabilityStats,
  getHabitabilityBreakdown,
} from '../../utils/habitabilityAnalytics';
import useResizeObserver from '../../utils/useResizeObserver';
import { TravelTimeCalculator } from '../shared/TravelTimeCalculator';
import { ExplainableProperty } from '../shared/ExplainableProperty';

interface SystemOverviewModalProps {
  /** Star data */
  star: Star;
  /** Planets in the system */
  planets: Exoplanet[];
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
}

/**
 * Modal showing comprehensive star system overview
 * with visualizations, charts, and discovery information
 */
export function SystemOverviewModal({
  star,
  planets,
  isOpen,
  onClose,
}: SystemOverviewModalProps) {
  const { t } = useTranslation();

  // Calculate system statistics
  const systemStats = useMemo(() => {
    const habitableCount = planets.filter(
      (p) => p.is_habitable_zone
    ).length;
    const earthLikeCount = planets.filter((p) => p.is_earth_like).length;
    const avgHabitability =
      planets.length > 0
        ? planets.reduce((sum, p) => sum + (p.habitability_score || 0), 0) /
          planets.length
        : 0;
    const discoveryYears = planets
      .map((p) => p.disc_year)
      .filter((y): y is number => y != null)
      .sort((a, b) => a - b);
    const firstDiscovery = discoveryYears[0];
    const latestDiscovery = discoveryYears[discoveryYears.length - 1];
    const discoveryMethods = [...new Set(planets.map((p) => p.discoverymethod))];

    return {
      habitableCount,
      earthLikeCount,
      avgHabitability,
      firstDiscovery,
      latestDiscovery,
      discoveryMethods,
    };
  }, [planets]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="system-overview-overlay" onClick={onClose}>
      <div
        className="system-overview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button className="system-overview-close" onClick={onClose}>
          ✕
        </button>

        {/* Scrollable content */}
        <div className="system-overview-content">
          {/* Header */}
          <header className="system-overview-header">
            <h1 className="system-overview-title">{star.hostname}</h1>
            <div className="system-overview-badges">
              {star.st_spectype && (
                <span className="overview-badge spectral">
                  {star.st_spectype}
                </span>
              )}
              {star.sy_snum > 1 && (
                <span className="overview-badge binary">
                  ★★ {t('pages.starSystem.info.binarySystem')}
                </span>
              )}
              {star.cb_flag && (
                <span className="overview-badge circumbinary">
                  {t('pages.starSystem.info.circumbinary')}
                </span>
              )}
            </div>
          </header>

          {/* Star vs Sun Comparison */}
          <section className="overview-section">
            <h2 className="overview-section-title">
              {t('pages.starSystem.systemOverview.starComparison')}
            </h2>
            <StarSunComparison star={star} />
          </section>

          {/* System Stats Bar */}
          <section className="overview-section">
            <h2 className="overview-section-title">
              {t('pages.starSystem.systemOverview.systemStats')}
            </h2>
            <div className="overview-stats-grid">
              <div className="overview-stat">
                <span className="stat-value">{star.sy_pnum}</span>
                <span className="stat-label">
                  {t('pages.starSystem.info.planets')}
                </span>
              </div>
              <div className="overview-stat">
                <span className="stat-value">{systemStats.habitableCount}</span>
                <span className="stat-label">
                  {t('pages.starSystem.systemOverview.habitableCandidates')}
                </span>
              </div>
              <div className="overview-stat">
                <span className="stat-value">
                  {star.distance_ly?.toFixed(1) || '—'}
                </span>
                <span className="stat-label">
                  {t('pages.starSystem.systemOverview.lightYears')}
                </span>
              </div>
              <div className="overview-stat">
                <span className="stat-value">
                  {star.st_age ? `${star.st_age.toFixed(1)} Gyr` : '—'}
                </span>
                <span className="stat-label">
                  {t('pages.starSystem.info.age')}
                </span>
              </div>
            </div>
          </section>

          {/* Notable Star Features */}
          <section className="overview-section">
            <h2 className="overview-section-title">
              {t('pages.starSystem.systemOverview.starFeatures.title')}
            </h2>
            <StarFeaturesSection star={star} planets={planets} />
          </section>

          {/* System Habitability Overview */}
          {planets.length > 0 && (
            <section className="overview-section">
              <h2 className="overview-section-title">
                {t('pages.starSystem.systemOverview.habitability.title')}
              </h2>
              <SystemHabitabilitySection planets={planets} />
            </section>
          )}

          {/* Travel Time Calculator */}
          {star.distance_ly && star.distance_ly > 0 && (
            <section className="overview-section">
              <h2 className="overview-section-title">
                {t('pages.starSystem.systemOverview.travelTime.title')}
              </h2>
              <TravelTimeCalculator distanceLy={star.distance_ly} compact />
            </section>
          )}

          {/* Charts Section */}
          {planets.length > 0 && (
            <section className="overview-section">
              <h2 className="overview-section-title">
                {t('pages.starSystem.systemOverview.planetaryData')}
              </h2>
              <div className="overview-charts-grid">
                <div className="overview-chart-card">
                  <h3>{t('pages.starSystem.systemOverview.planetSizes')}</h3>
                  <PlanetSizesChart planets={planets} />
                </div>
                <div className="overview-chart-card">
                  <h3>{t('pages.starSystem.systemOverview.orbitalDistances')}</h3>
                  <OrbitalDistancesChart planets={planets} />
                </div>
              </div>
            </section>
          )}

          {/* Orbital Architecture & Temperature-Size Charts */}
          {planets.length > 0 && (
            <section className="overview-section">
              <h2 className="overview-section-title">
                {t('pages.starSystem.systemOverview.orbitalView.title')}
              </h2>
              <div className="overview-charts-grid">
                <OrbitalTopDownChart star={star} planets={planets} />
                <div className="overview-chart-card">
                  <h3>{t('pages.starSystem.systemOverview.tempSizeChart.title')}</h3>
                  <TempSizeBubbleChart planets={planets} />
                </div>
              </div>
            </section>
          )}

          {/* Sky Position */}
          <section className="overview-section">
            <h2 className="overview-section-title">
              {t('pages.starSystem.systemOverview.skyPosition')}
            </h2>
            <div className="overview-position-grid">
              <div className="position-item">
                <span className="position-label">
                  {t('pages.starSystem.systemOverview.rightAscension')}
                </span>
                <span className="position-value">{star.rastr || `${star.ra?.toFixed(4)}°`}</span>
              </div>
              <div className="position-item">
                <span className="position-label">
                  {t('pages.starSystem.systemOverview.declination')}
                </span>
                <span className="position-value">{star.decstr || `${star.dec?.toFixed(4)}°`}</span>
              </div>
              <div className="position-item">
                <span className="position-label">
                  {t('pages.starSystem.systemOverview.galacticLat')}
                </span>
                <span className="position-value">{star.glat?.toFixed(2)}°</span>
              </div>
              <div className="position-item">
                <span className="position-label">
                  {t('pages.starSystem.systemOverview.galacticLon')}
                </span>
                <span className="position-value">{star.glon?.toFixed(2)}°</span>
              </div>
            </div>
          </section>

          {/* Discovery Info */}
          {planets.length > 0 && (
            <section className="overview-section">
              <h2 className="overview-section-title">
                {t('pages.starSystem.systemOverview.discoveryInfo')}
              </h2>
              <div className="overview-discovery-grid">
                {systemStats.firstDiscovery && (
                  <div className="discovery-item">
                    <span className="discovery-label">
                      {t('pages.starSystem.systemOverview.firstDiscovery')}
                    </span>
                    <span className="discovery-value">
                      {systemStats.firstDiscovery}
                    </span>
                  </div>
                )}
                {systemStats.latestDiscovery &&
                  systemStats.latestDiscovery !== systemStats.firstDiscovery && (
                    <div className="discovery-item">
                      <span className="discovery-label">
                        {t('pages.starSystem.systemOverview.latestDiscovery')}
                      </span>
                      <span className="discovery-value">
                        {systemStats.latestDiscovery}
                      </span>
                    </div>
                  )}
                {systemStats.discoveryMethods.length > 0 && (
                  <div className="discovery-item full-width">
                    <span className="discovery-label">
                      {t('pages.starSystem.systemOverview.methods')}
                    </span>
                    <div className="discovery-methods">
                      {systemStats.discoveryMethods.map((method) => (
                        <span key={method} className="method-badge">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Star Properties Table */}
          <section className="overview-section">
            <h2 className="overview-section-title">
              {t('pages.starSystem.systemOverview.stellarProperties')}
            </h2>
            <div className="overview-properties-table">
              {star.st_teff && (
                <div className="property-row">
                  <span className="property-label">
                    <ExplainableProperty
                      propertyKey="starTemperature"
                      category="star"
                    >
                      {t('pages.starSystem.info.temperature')}
                    </ExplainableProperty>
                  </span>
                  <span className="property-value">
                    <ExplainableProperty
                      propertyKey="starTemperature"
                      category="star"
                    >
                      {star.st_teff.toFixed(0)} K
                    </ExplainableProperty>
                  </span>
                </div>
              )}
              {star.st_rad && (
                <div className="property-row">
                  <span className="property-label">
                    <ExplainableProperty
                      propertyKey="starRadius"
                      category="star"
                    >
                      {t('pages.starSystem.info.radius')}
                    </ExplainableProperty>
                  </span>
                  <span className="property-value">
                    <ExplainableProperty
                      propertyKey="starRadius"
                      category="star"
                    >
                      {star.st_rad.toFixed(2)} R☉
                    </ExplainableProperty>
                  </span>
                </div>
              )}
              {star.st_mass && (
                <div className="property-row">
                  <span className="property-label">
                    <ExplainableProperty
                      propertyKey="starMass"
                      category="star"
                    >
                      {t('pages.starSystem.info.mass')}
                    </ExplainableProperty>
                  </span>
                  <span className="property-value">
                    <ExplainableProperty
                      propertyKey="starMass"
                      category="star"
                    >
                      {star.st_mass.toFixed(2)} M☉
                    </ExplainableProperty>
                  </span>
                </div>
              )}
              {star.st_lum && (
                <div className="property-row">
                  <span className="property-label">
                    <ExplainableProperty
                      propertyKey="starLuminosity"
                      category="star"
                    >
                      {t('pages.starSystem.systemOverview.luminosity')}
                    </ExplainableProperty>
                  </span>
                  <span className="property-value">
                    <ExplainableProperty
                      propertyKey="starLuminosity"
                      category="star"
                    >
                      {star.st_lum.toFixed(3)} L☉
                    </ExplainableProperty>
                  </span>
                </div>
              )}
              {star.st_logg && (
                <div className="property-row">
                  <span className="property-label">
                    <ExplainableProperty
                      propertyKey="starSurfaceGravity"
                      category="star"
                    >
                      {t('pages.starSystem.systemOverview.surfaceGravity')}
                    </ExplainableProperty>
                  </span>
                  <span className="property-value">
                    <ExplainableProperty
                      propertyKey="starSurfaceGravity"
                      category="star"
                    >
                      {star.st_logg.toFixed(2)} log g
                    </ExplainableProperty>
                  </span>
                </div>
              )}
              {star.st_met && (
                <div className="property-row">
                  <span className="property-label">
                    <ExplainableProperty
                      propertyKey="starMetallicity"
                      category="star"
                    >
                      {t('pages.starSystem.systemOverview.metallicity')}
                    </ExplainableProperty>
                  </span>
                  <span className="property-value">
                    <ExplainableProperty
                      propertyKey="starMetallicity"
                      category="star"
                    >
                      {star.st_met.toFixed(2)} [Fe/H]
                    </ExplainableProperty>
                  </span>
                </div>
              )}
              {star.st_rotp && (
                <div className="property-row">
                  <span className="property-label">
                    <ExplainableProperty
                      propertyKey="starRotationPeriod"
                      category="star"
                    >
                      {t('pages.starSystem.systemOverview.rotationPeriod')}
                    </ExplainableProperty>
                  </span>
                  <span className="property-value">
                    <ExplainableProperty
                      propertyKey="starRotationPeriod"
                      category="star"
                    >
                      {star.st_rotp.toFixed(1)} days
                    </ExplainableProperty>
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual comparison of star size and temperature vs the Sun
 */
function StarSunComparison({ star }: { star: Star }) {
  const { t } = useTranslation();

  // Sun reference values
  const sunTemp = 5778;

  // Star values (default to Sun if unknown)
  const starRadius = star.st_rad || 1;
  const starTemp = star.st_teff || 5778;

  // Calculate visual sizes (max 100px for the larger one)
  const maxSize = 100;
  const sunSize = starRadius >= 1 ? maxSize / starRadius : maxSize;
  const starSize = starRadius >= 1 ? maxSize : maxSize * starRadius;

  // Temperature to color mapping
  const getStarColor = (temp: number): string => {
    if (temp > 30000) return '#9bb0ff';
    if (temp > 10000) return '#aabfff';
    if (temp > 7500) return '#cad7ff';
    if (temp > 6000) return '#f8f7ff';
    if (temp > 5200) return '#fff4e8';
    if (temp > 3700) return '#ffd2a1';
    if (temp > 2400) return '#ffb56c';
    return '#ff6b35';
  };

  return (
    <div className="star-comparison-container">
      <div className="star-comparison-visual">
        {/* Sun */}
        <div className="comparison-body">
          <div
            className="comparison-sphere sun"
            style={{
              width: sunSize,
              height: sunSize,
              background: `radial-gradient(circle at 30% 30%, #fff4e8, ${getStarColor(sunTemp)})`,
            }}
          />
          <span className="comparison-label">
            {t('pages.starSystem.systemOverview.sun')}
          </span>
          <span className="comparison-stats">
            {t('pages.starSystem.systemOverview.sunStats')}
          </span>
        </div>

        {/* Comparison indicator */}
        <div className="comparison-vs">vs</div>

        {/* Target star */}
        <div className="comparison-body">
          <div
            className="comparison-sphere star"
            style={{
              width: starSize,
              height: starSize,
              background: `radial-gradient(circle at 30% 30%, #fff, ${getStarColor(starTemp)})`,
            }}
          />
          <span className="comparison-label">{star.hostname}</span>
          <span className="comparison-stats">
            {starRadius.toFixed(2)} R☉ • {starTemp.toFixed(0)} K
          </span>
        </div>
      </div>

      {/* Comparison summary */}
      <div className="comparison-summary">
        {starRadius > 1 ? (
          <p>
            {t('pages.starSystem.systemOverview.largerThanSun', {
              times: starRadius.toFixed(1),
            })}
          </p>
        ) : starRadius < 1 ? (
          <p>
            {t('pages.starSystem.systemOverview.smallerThanSun', {
              pct: ((1 - starRadius) * 100).toFixed(0),
            })}
          </p>
        ) : (
          <p>{t('pages.starSystem.systemOverview.similarToSun')}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Bar chart showing planet sizes (radius in Earth radii)
 */
function PlanetSizesChart({ planets }: { planets: Exoplanet[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || width === 0) return;

    const height = 200;
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Data - sorted by radius
    const data = planets
      .filter((p) => p.pl_rade)
      .map((p) => ({
        name: p.pl_name.replace(star.hostname, '').trim() || p.pl_name,
        radius: p.pl_rade!,
      }))
      .sort((a, b) => b.radius - a.radius)
      .slice(0, 10);

    if (data.length === 0) return;

    // Scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, innerWidth])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.radius) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.name) || 0)
      .attr('y', (d) => y(d.radius))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerHeight - y(d.radius))
      .attr('fill', '#00ccff')
      .attr('rx', 3);

    // X Axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
    
    xAxis.selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .attr('text-anchor', 'end');

    if (width < 400) {
      xAxis.selectAll('text')
        .attr('transform', 'rotate(-65)');
    } else {
      xAxis.selectAll('text')
        .attr('transform', 'rotate(-45)');
    }

    g.selectAll('.domain, .tick line').attr('stroke', '#444');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .text('Radius (R⊕)');

    // Reference line for Earth
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y(1))
      .attr('y2', y(1))
      .attr('stroke', '#00ff88')
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.6);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', y(1) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#00ff88')
      .attr('font-size', '10px')
      .text('Earth');
  }, [planets, width]);

  // Get star hostname for planet name shortening
  const star = planets[0];

  return (
    <div ref={containerRef} className="chart-container">
      <svg ref={svgRef} />
    </div>
  );
}

/**
 * Visualization of orbital distances (semi-major axis in AU)
 */
function OrbitalDistancesChart({ planets }: { planets: Exoplanet[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || width === 0) return;

    const isMobile = width < 500;
    const height = 200;
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Data - sorted by distance
    const data = planets
      .filter((p) => p.pl_orbsmax)
      .map((p) => ({
        name: p.pl_name,
        distance: p.pl_orbsmax!,
        habitable: p.is_habitable_zone || false,
      }))
      .sort((a, b) => a.distance - b.distance);

    if (data.length === 0) return;

    // Scale - log scale for better visualization
    const maxDist = Math.max(...data.map((d) => d.distance), 1);
    const x = d3
      .scaleLog()
      .domain([Math.min(...data.map((d) => d.distance), 0.01), maxDist * 1.2])
      .range([0, innerWidth]);

    // Draw habitable zone band (approximately 0.95 - 1.67 AU for Sun-like)
    g.append('rect')
      .attr('x', x(0.95))
      .attr('y', 0)
      .attr('width', Math.max(0, x(1.67) - x(0.95)))
      .attr('height', innerHeight)
      .attr('fill', 'rgba(0, 255, 136, 0.1)');

    // Central line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight / 2)
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#333');

    // Planet dots
    g.selectAll('.planet-dot')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.distance))
      .attr('cy', innerHeight / 2)
      .attr('r', isMobile ? 6 : 8)
      .attr('fill', (d) => (d.habitable ? '#00ff88' : '#00ccff'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Planet labels
    g.selectAll('.planet-label')
      .data(data)
      .join('text')
      .attr('x', (d) => x(d.distance))
      .attr('y', innerHeight / 2 - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '9px')
      .text((d) => d.name.split(' ').pop() || d.name);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x).tickValues([0.01, 0.1, 1, 10, 100]).tickFormat(d3.format('.2'))
      )
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px');

    g.selectAll('.domain, .tick line').attr('stroke', '#444');

    // X axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .text('Semi-major Axis (AU)');

    // Legend
    g.append('text')
      .attr('x', innerWidth)
      .attr('y', -10)
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(0, 255, 136, 0.6)')
      .attr('font-size', '10px')
      .text('Habitable Zone');
  }, [planets, width]);

  return (
    <div ref={containerRef} className="chart-container">
      <svg ref={svgRef} />
    </div>
  );
}

// =============================================================================
// STAR FEATURES SECTION
// =============================================================================

/** Feature definition for star characteristics */
interface StarFeature {
  key: string;
  icon: string;
  className: string;
}

/** All possible star features to check */
const STAR_FEATURE_DEFINITIONS: StarFeature[] = [
  { key: 'solarAnalog', icon: '☀️', className: 'solar' },
  { key: 'sunLike', icon: '⭐', className: 'solar' },
  { key: 'redDwarf', icon: '🔴', className: 'red-dwarf' },
  { key: 'youngSystem', icon: '🌱', className: 'age' },
  { key: 'matureSystem', icon: '🌳', className: 'age' },
  { key: 'ancientSystem', icon: '🏛️', className: 'age' },
  { key: 'metalRich', icon: '⚙️', className: 'metallicity' },
  { key: 'metalPoor', icon: '💨', className: 'metallicity' },
  { key: 'binarySystem', icon: '★★', className: 'binary' },
  { key: 'circumbinary', icon: '🌀', className: 'binary' },
];

/**
 * Detects which star features are present in the system
 * @param star - Star data
 * @param planets - Planets in the system (for feature flags)
 * @returns Array of detected feature keys
 */
function detectStarFeatures(star: Star, planets: Exoplanet[]): string[] {
  const features: string[] = [];
  const firstPlanet = planets[0];

  if (!firstPlanet) return features;

  // Check star type features
  if (firstPlanet.is_solar_analog) features.push('solarAnalog');
  else if (firstPlanet.is_sun_like_star) features.push('sunLike');
  
  if (firstPlanet.is_red_dwarf_host) features.push('redDwarf');

  // Check age features (mutually exclusive)
  if (firstPlanet.is_young_system) features.push('youngSystem');
  else if (firstPlanet.is_ancient_system) features.push('ancientSystem');
  else if (firstPlanet.is_mature_system) features.push('matureSystem');

  // Check metallicity features
  if (firstPlanet.is_metal_rich_star) features.push('metalRich');
  else if (firstPlanet.is_metal_poor_star) features.push('metalPoor');

  // Check system architecture
  if (star.sy_snum > 1) features.push('binarySystem');
  if (star.cb_flag) features.push('circumbinary');

  return features;
}

/**
 * Star Features Section Component
 * Displays notable stellar characteristics with descriptions
 */
function StarFeaturesSection({ star, planets }: { star: Star; planets: Exoplanet[] }) {
  const { t } = useTranslation();

  const detectedFeatures = useMemo(
    () => detectStarFeatures(star, planets),
    [star, planets]
  );

  if (detectedFeatures.length === 0) {
    return (
      <div className="star-features-empty">
        {t('pages.starSystem.systemOverview.starFeatures.title')}
      </div>
    );
  }

  return (
    <div className="star-features-grid">
      {detectedFeatures.map((featureKey) => {
        const featureDef = STAR_FEATURE_DEFINITIONS.find((f) => f.key === featureKey);
        if (!featureDef) return null;

        return (
          <div
            key={featureKey}
            className={`star-feature-card ${featureDef.className}`}
          >
            <div className="star-feature-header">
              <span className="star-feature-icon">{featureDef.icon}</span>
              <span className="star-feature-name">
                {t(`pages.starSystem.systemOverview.starFeatures.${featureKey}`)}
              </span>
            </div>
            <p className="star-feature-description">
              {t(`pages.starSystem.systemOverview.starFeatures.${featureKey}Desc`)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// SYSTEM HABITABILITY SECTION
// =============================================================================

/**
 * System Habitability Section Component
 * Shows habitability analysis using existing analytics functions
 */
function SystemHabitabilitySection({ planets }: { planets: Exoplanet[] }) {
  const { t } = useTranslation();

  const habitabilityData = useMemo(() => {
    if (planets.length === 0) return null;

    const stats = getHabitabilityStats(planets);
    const breakdown = getHabitabilityBreakdown(planets);

    return { stats, breakdown };
  }, [planets]);

  if (!habitabilityData || planets.length === 0) {
    return (
      <div className="habitability-no-data">
        {t('pages.starSystem.systemOverview.habitability.noData')}
      </div>
    );
  }

  const { stats, breakdown } = habitabilityData;

  // Filter breakdown to only show categories with count > 0
  const relevantBreakdown = breakdown.filter((b) => b.count > 0);

  return (
    <div className="habitability-overview-container">
      {/* Score Display */}
      <div className="habitability-score-display">
        <div className="habitability-avg-score">
          <span className="habitability-score-value">
            {stats.avgScore.toFixed(0)}
          </span>
          <span className="habitability-score-label">
            {t('pages.starSystem.systemOverview.habitability.avgScore')}
          </span>
        </div>

        {stats.topScorerName && (
          <div className="habitability-best-candidate">
            <span className="habitability-candidate-name">
              {stats.topScorerName.split(' ').pop()}
            </span>
            <span className="habitability-candidate-score">
              {t('pages.starSystem.systemOverview.habitability.score')}: {stats.topScore.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* Breakdown Bars */}
      {relevantBreakdown.length > 0 && (
        <div className="habitability-breakdown-container">
          <span className="habitability-breakdown-title">
            {t('pages.starSystem.systemOverview.habitability.breakdown')}
          </span>
          <div className="habitability-breakdown-bars">
            {relevantBreakdown.map((item) => {
              const maxPct = Math.max(...relevantBreakdown.map((b) => b.pct));
              const barWidth = maxPct > 0 ? (item.pct / maxPct) * 100 : 0;
              const colorClass = item.category.toLowerCase().replace(/[\s-]/g, '-');

              return (
                <div key={item.category} className="habitability-bar-row">
                  <span className="habitability-bar-label">{item.category}</span>
                  <div className="habitability-bar-track">
                    <div
                      className={`habitability-bar-fill ${colorClass}`}
                      style={{ width: `${barWidth}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="habitability-bar-count">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="habitability-quick-stats">
        <div className="habitability-quick-stat">
          <span className="habitability-quick-stat-value">{stats.habitableZone}</span>
          <span className="habitability-quick-stat-label">
            {t('pages.starSystem.systemOverview.habitability.habitableZone')}
          </span>
        </div>
        <div className="habitability-quick-stat">
          <span className="habitability-quick-stat-value">{stats.earthLike}</span>
          <span className="habitability-quick-stat-label">
            {t('pages.starSystem.systemOverview.habitability.earthLike')}
          </span>
        </div>
        <div className="habitability-quick-stat">
          <span className="habitability-quick-stat-value">{stats.total}</span>
          <span className="habitability-quick-stat-label">
            {t('pages.starSystem.info.planets')}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ORBITAL TOP-DOWN VIEW CONSTANTS
// =============================================================================

/** Habitable zone boundaries for Sun-like star (AU) */
const HZ_INNER_AU = 0.95;
const HZ_OUTER_AU = 1.67;

/**
 * Calculates habitable zone boundaries scaled by stellar luminosity
 * @param luminosity - Star luminosity in solar luminosities (L☉)
 * @returns Inner and outer HZ boundaries in AU
 */
function calculateHabitableZone(luminosity: number | null): { inner: number; outer: number } {
  const lum = luminosity ? Math.pow(10, luminosity) : 1; // Convert from log(L☉) to L☉
  const sqrtLum = Math.sqrt(Math.max(lum, 0.001));
  return {
    inner: HZ_INNER_AU * sqrtLum,
    outer: HZ_OUTER_AU * sqrtLum,
  };
}

/**
 * Orbital Top-Down View Component
 * D3 visualization showing planetary orbits from above with habitable zone
 */
function OrbitalTopDownChart({ star, planets }: { star: Star; planets: Exoplanet[] }) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || width === 0) return;

    const isMobile = width < 500;
    const size = Math.min(width, 400);
    const margin = 40;
    const radius = (size - margin * 2) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size);

    // Get orbital data
    const orbitalData = planets
      .filter((p) => p.pl_orbsmax && p.pl_orbsmax > 0)
      .map((p) => ({
        name: p.pl_name.split(' ').pop() || p.pl_name,
        semiMajorAxis: p.pl_orbsmax!,
        eccentricity: p.pl_orbeccen || 0,
        habitable: p.is_habitable_zone || false,
      }))
      .sort((a, b) => a.semiMajorAxis - b.semiMajorAxis);

    if (orbitalData.length === 0) return;

    // Calculate scale (max orbit fills the view)
    const maxOrbit = Math.max(...orbitalData.map((d) => d.semiMajorAxis));
    const hz = calculateHabitableZone(star.st_lum);
    const maxDistance = Math.max(maxOrbit * 1.2, hz.outer * 1.1);
    const scale = radius / maxDistance;

    // Background
    svg
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius + margin / 2)
      .attr('fill', 'rgba(0, 0, 0, 0.3)');

    // Habitable zone band
    const innerHzRadius = hz.inner * scale;
    const outerHzRadius = hz.outer * scale;

    if (outerHzRadius > 0 && outerHzRadius <= radius) {
      // Outer HZ circle
      svg
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', outerHzRadius)
        .attr('fill', 'rgba(0, 255, 136, 0.1)')
        .attr('stroke', 'rgba(0, 255, 136, 0.3)')
        .attr('stroke-width', 1);

      // Inner HZ circle (cut out)
      if (innerHzRadius > 0) {
        svg
          .append('circle')
          .attr('cx', centerX)
          .attr('cy', centerY)
          .attr('r', innerHzRadius)
          .attr('fill', 'rgba(0, 0, 0, 0.3)')
          .attr('stroke', 'rgba(0, 255, 136, 0.3)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,4');
      }
    }

    // Grid circles (AU markers)
    const gridDistances = [0.1, 0.5, 1, 2, 5, 10, 20, 50].filter(
      (d) => d * scale < radius && d < maxDistance
    );

    gridDistances.forEach((dist) => {
      svg
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', dist * scale)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 0.5);

      svg
        .append('text')
        .attr('x', centerX + dist * scale + 3)
        .attr('y', centerY - 3)
        .attr('fill', 'rgba(255, 255, 255, 0.3)')
        .attr('font-size', '8px')
        .text(`${dist} AU`);
    });

    // Star at center
    svg
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 8)
      .attr('fill', '#ffcc00')
      .attr('filter', 'drop-shadow(0 0 10px rgba(255, 200, 0, 0.5))');

    // Planet orbits and dots
    orbitalData.forEach((planet, index) => {
      const orbitRadius = planet.semiMajorAxis * scale;
      const angle = (index / orbitalData.length) * Math.PI * 2 - Math.PI / 2;
      const planetX = centerX + Math.cos(angle) * orbitRadius;
      const planetY = centerY + Math.sin(angle) * orbitRadius;

      // Orbit path
      svg
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', orbitRadius)
        .attr('fill', 'none')
        .attr('stroke', planet.habitable ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 204, 255, 0.3)')
        .attr('stroke-width', 1);

      // Planet dot
      svg
        .append('circle')
        .attr('cx', planetX)
        .attr('cy', planetY)
        .attr('r', isMobile ? 4 : 6)
        .attr('fill', planet.habitable ? '#00ff88' : '#00ccff')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      // Planet label
      svg
        .append('text')
        .attr('x', planetX)
        .attr('y', planetY - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '9px')
        .text(planet.name);
    });
  }, [star, planets, width, t]);

  return (
    <div className="orbital-topdown-container">
      <div ref={containerRef} className="orbital-topdown-chart">
        <svg ref={svgRef} />
      </div>
      <div className="orbital-legend">
        <div className="orbital-legend-item">
          <div className="orbital-legend-dot hz" />
          <span>{t('pages.starSystem.systemOverview.orbitalView.habitableZone')}</span>
        </div>
        <div className="orbital-legend-item">
          <div className="orbital-legend-dot planet" />
          <span>{t('pages.starSystem.info.planet')}</span>
        </div>
        <div className="orbital-legend-item">
          <div className="orbital-legend-dot habitable" />
          <span>{t('pages.starSystem.systemOverview.habitability.habitableZone')}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TEMPERATURE-SIZE BUBBLE CHART CONSTANTS
// =============================================================================

/** Temperature zone boundaries in Kelvin */
const TEMP_ZONE_HOT = 320;
const TEMP_ZONE_COLD = 200;

/**
 * Temperature-Size Bubble Chart Component
 * D3 scatter plot showing equilibrium temperature vs planet radius
 */
function TempSizeBubbleChart({ planets }: { planets: Exoplanet[] }) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || width === 0) return;

    const isMobile = width < 500;
    const height = 280;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Filter planets with required data
    const data = planets
      .filter((p) => p.pl_eqt && p.pl_eqt > 0 && p.pl_rade && p.pl_rade > 0)
      .map((p) => ({
        name: p.pl_name.split(' ').pop() || p.pl_name,
        temp: p.pl_eqt!,
        radius: p.pl_rade!,
        mass: p.pl_bmasse || 1,
        score: p.habitability_score,
        habitable: p.is_habitable_zone || false,
      }));

    if (data.length === 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(data, (d) => d.temp) as [number, number];
    const yExtent = d3.extent(data, (d) => d.radius) as [number, number];

    const x = d3
      .scaleLog()
      .domain([Math.min(xExtent[0] * 0.8, 100), Math.max(xExtent[1] * 1.2, 3000)])
      .range([0, innerWidth]);

    const y = d3
      .scaleLog()
      .domain([Math.min(yExtent[0] * 0.8, 0.3), Math.max(yExtent[1] * 1.2, 20)])
      .range([innerHeight, 0]);

    // Temperature zones (background)
    // Too hot zone (right)
    g.append('rect')
      .attr('x', x(TEMP_ZONE_HOT))
      .attr('y', 0)
      .attr('width', innerWidth - x(TEMP_ZONE_HOT))
      .attr('height', innerHeight)
      .attr('fill', 'rgba(255, 100, 100, 0.1)');

    // Habitable zone (middle)
    g.append('rect')
      .attr('x', x(TEMP_ZONE_COLD))
      .attr('y', 0)
      .attr('width', x(TEMP_ZONE_HOT) - x(TEMP_ZONE_COLD))
      .attr('height', innerHeight)
      .attr('fill', 'rgba(0, 255, 136, 0.1)');

    // Too cold zone (left)
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', x(TEMP_ZONE_COLD))
      .attr('height', innerHeight)
      .attr('fill', 'rgba(100, 150, 255, 0.1)');

    // Color scale for habitability score
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 50, 100])
      .range(['#ff4444', '#ffaa00', '#00ff88']);

    // Bubble size scale
    const massExtent = d3.extent(data, (d) => d.mass) as [number, number];
    const sizeScale = d3
      .scaleSqrt()
      .domain([Math.min(massExtent[0], 0.1), Math.max(massExtent[1], 100)])
      .range(isMobile ? [3, 10] : [4, 15]);

    // Planet bubbles
    g.selectAll('.planet-bubble')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.temp))
      .attr('cy', (d) => y(d.radius))
      .attr('r', (d) => sizeScale(d.mass))
      .attr('fill', (d) => colorScale(d.score))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8);

    // Planet labels (only if few planets)
    if (data.length <= 8) {
      g.selectAll('.planet-label')
        .data(data)
        .join('text')
        .attr('x', (d) => x(d.temp))
        .attr('y', (d) => y(d.radius) - sizeScale(d.mass) - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '9px')
        .text((d) => d.name);
    }

    // Earth reference marker
    const earthTemp = 255;
    const earthRadius = 1;
    if (x(earthTemp) > 0 && x(earthTemp) < innerWidth && y(earthRadius) > 0 && y(earthRadius) < innerHeight) {
      g.append('circle')
        .attr('cx', x(earthTemp))
        .attr('cy', y(earthRadius))
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '2,2');

      g.append('text')
        .attr('x', x(earthTemp) + 8)
        .attr('y', y(earthRadius) + 3)
        .attr('fill', 'rgba(255, 255, 255, 0.5)')
        .attr('font-size', '9px')
        .text('🌍');
    }

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x)
          .tickValues([100, 200, 300, 500, 1000, 2000])
          .tickFormat(d3.format('d'))
      )
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px');

    g.selectAll('.domain, .tick line').attr('stroke', '#444');

    // X axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .text(t('pages.starSystem.systemOverview.tempSizeChart.xAxis'));

    // Y Axis
    g.append('g')
      .call(
        d3.axisLeft(y)
          .tickValues([0.5, 1, 2, 5, 10, 20])
          .tickFormat(d3.format('.1f'))
      )
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .text(t('pages.starSystem.systemOverview.tempSizeChart.yAxis'));
  }, [planets, t, width]);

  return (
    <div className="temp-size-container">
      <div ref={containerRef} className="temp-size-chart">
        <svg ref={svgRef} />
      </div>
      <div className="temp-size-legend">
        <div className="temp-size-legend-item">
          <div className="temp-zone-indicator hot" />
          <span>{t('pages.starSystem.systemOverview.tempSizeChart.tooHot')}</span>
        </div>
        <div className="temp-size-legend-item">
          <div className="temp-zone-indicator habitable" />
          <span>{t('pages.starSystem.systemOverview.tempSizeChart.habitable')}</span>
        </div>
        <div className="temp-size-legend-item">
          <div className="temp-zone-indicator cold" />
          <span>{t('pages.starSystem.systemOverview.tempSizeChart.tooCold')}</span>
        </div>
        <div className="temp-size-legend-item temp-size-earth-marker">
          <div className="temp-size-earth-dot" />
          <span>{t('pages.starSystem.systemOverview.tempSizeChart.earth')}</span>
        </div>
      </div>
    </div>
  );
}

export default SystemOverviewModal;

