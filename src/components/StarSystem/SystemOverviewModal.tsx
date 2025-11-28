/**
 * SystemOverviewModal Component
 * Full-screen modal with comprehensive star system information
 * Includes star comparison, system stats, charts, and discovery info
 */

import { useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import type { Star, Exoplanet } from '../../types';

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
                    {t('pages.starSystem.info.temperature')}
                  </span>
                  <span className="property-value">{star.st_teff.toFixed(0)} K</span>
                </div>
              )}
              {star.st_rad && (
                <div className="property-row">
                  <span className="property-label">
                    {t('pages.starSystem.info.radius')}
                  </span>
                  <span className="property-value">{star.st_rad.toFixed(2)} R☉</span>
                </div>
              )}
              {star.st_mass && (
                <div className="property-row">
                  <span className="property-label">
                    {t('pages.starSystem.info.mass')}
                  </span>
                  <span className="property-value">{star.st_mass.toFixed(2)} M☉</span>
                </div>
              )}
              {star.st_lum && (
                <div className="property-row">
                  <span className="property-label">
                    {t('pages.starSystem.systemOverview.luminosity')}
                  </span>
                  <span className="property-value">{star.st_lum.toFixed(3)} L☉</span>
                </div>
              )}
              {star.st_logg && (
                <div className="property-row">
                  <span className="property-label">
                    {t('pages.starSystem.systemOverview.surfaceGravity')}
                  </span>
                  <span className="property-value">{star.st_logg.toFixed(2)} log g</span>
                </div>
              )}
              {star.st_met && (
                <div className="property-row">
                  <span className="property-label">
                    {t('pages.starSystem.systemOverview.metallicity')}
                  </span>
                  <span className="property-value">{star.st_met.toFixed(2)} [Fe/H]</span>
                </div>
              )}
              {star.st_rotp && (
                <div className="property-row">
                  <span className="property-label">
                    {t('pages.starSystem.systemOverview.rotationPeriod')}
                  </span>
                  <span className="property-value">{star.st_rotp.toFixed(1)} days</span>
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
          <span className="comparison-stats">1.0 R☉ • 5,778 K</span>
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

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
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
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');

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
  }, [planets]);

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

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
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
      .attr('r', 8)
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
  }, [planets]);

  return (
    <div ref={containerRef} className="chart-container">
      <svg ref={svgRef} />
    </div>
  );
}

export default SystemOverviewModal;

