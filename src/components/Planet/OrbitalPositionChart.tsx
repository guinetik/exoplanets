/**
 * OrbitalPositionChart Component
 * Top-down view of planet's orbit around its star
 * Shows habitable zone and sibling planets
 */

import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import type { Exoplanet } from '../../types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Habitable zone boundaries for Sun-like star (AU) */
const HZ_INNER_AU = 0.95;
const HZ_OUTER_AU = 1.67;

/**
 * Calculates habitable zone boundaries scaled by stellar luminosity
 * @param luminosity - Star luminosity in log(L☉)
 * @returns Inner and outer HZ boundaries in AU
 */
function calculateHabitableZone(luminosity: number | null): { inner: number; outer: number } {
  const lum = luminosity ? Math.pow(10, luminosity) : 1;
  const sqrtLum = Math.sqrt(Math.max(lum, 0.001));
  return {
    inner: HZ_INNER_AU * sqrtLum,
    outer: HZ_OUTER_AU * sqrtLum,
  };
}

/**
 * Gets color based on planet type
 */
function getPlanetColor(planet: Exoplanet): string {
  if (planet.is_habitable_zone) return '#00ff88';
  if (planet.is_earth_like) return '#4a90d9';
  switch (planet.planet_type) {
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
      return '#00ccff';
  }
}

interface OrbitalPositionChartProps {
  /** Current planet being viewed */
  planet: Exoplanet;
  /** All planets in the system (siblings) */
  siblings: Exoplanet[];
}

/**
 * D3 visualization showing planetary orbits from above
 * with habitable zone highlighted
 */
export function OrbitalPositionChart({
  planet,
  siblings,
}: OrbitalPositionChartProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const size = Math.min(containerWidth, 350);
    const margin = 40;
    const radius = (size - margin * 2) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size);

    // Combine current planet with siblings
    const allPlanets = siblings.length > 0 ? siblings : [planet];

    // Get orbital data
    const orbitalData = allPlanets
      .filter((p) => p.pl_orbsmax && p.pl_orbsmax > 0)
      .map((p) => ({
        name: p.pl_name.split(' ').pop() || p.pl_name,
        fullName: p.pl_name,
        semiMajorAxis: p.pl_orbsmax!,
        eccentricity: p.pl_orbeccen || 0,
        habitable: p.is_habitable_zone || false,
        isCurrent: p.pl_name === planet.pl_name,
        color: getPlanetColor(p),
        planetType: p.planet_type,
      }))
      .sort((a, b) => a.semiMajorAxis - b.semiMajorAxis);

    if (orbitalData.length === 0) return;

    // Calculate scale (max orbit fills the view)
    const maxOrbit = Math.max(...orbitalData.map((d) => d.semiMajorAxis));
    const hz = calculateHabitableZone(planet.st_lum);
    const maxDistance = Math.max(maxOrbit * 1.3, hz.outer * 1.2);
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

    if (outerHzRadius > 0 && outerHzRadius <= radius + 20) {
      // Outer HZ circle
      svg
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', Math.min(outerHzRadius, radius))
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
      .attr('r', 10)
      .attr('fill', '#ffcc00')
      .attr('filter', 'drop-shadow(0 0 10px rgba(255, 200, 0, 0.5))');

    // Planet orbits and dots
    orbitalData.forEach((p, index) => {
      const orbitRadius = p.semiMajorAxis * scale;
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
        .attr('stroke', p.isCurrent 
          ? 'rgba(255, 255, 255, 0.6)' 
          : p.habitable 
            ? 'rgba(0, 255, 136, 0.4)' 
            : 'rgba(0, 204, 255, 0.2)')
        .attr('stroke-width', p.isCurrent ? 2 : 1)
        .attr('stroke-dasharray', p.isCurrent ? 'none' : '4,4');

      // Planet dot - larger for current planet
      const dotRadius = p.isCurrent ? 10 : 6;
      svg
        .append('circle')
        .attr('cx', planetX)
        .attr('cy', planetY)
        .attr('r', dotRadius)
        .attr('fill', p.color)
        .attr('stroke', p.isCurrent ? '#fff' : 'rgba(255,255,255,0.5)')
        .attr('stroke-width', p.isCurrent ? 2 : 1)
        .attr('filter', p.isCurrent ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none');

      // Planet label
      svg
        .append('text')
        .attr('x', planetX)
        .attr('y', planetY - dotRadius - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', p.isCurrent ? '#fff' : 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', p.isCurrent ? '11px' : '9px')
        .attr('font-weight', p.isCurrent ? 'bold' : 'normal')
        .text(p.name);
    });

  }, [planet, siblings]);

  // If no orbital data available
  if (!planet.pl_orbsmax) {
    return (
      <div className="orbital-position-container">
        <div className="orbital-no-data">
          {t('pages.planet.orbital.noData')}
        </div>
      </div>
    );
  }

  return (
    <div className="orbital-position-container">
      <h4 className="orbital-title">
        {t('pages.planet.orbital.title')}
      </h4>
      
      <div ref={containerRef} className="orbital-chart">
        <svg ref={svgRef} />
      </div>

      {/* Legend */}
      <div className="orbital-legend">
        <div className="orbital-legend-item">
          <div className="orbital-legend-dot star" />
          <span>{planet.hostname}</span>
        </div>
        <div className="orbital-legend-item">
          <div className="orbital-legend-dot current" />
          <span>{planet.pl_name}</span>
        </div>
        <div className="orbital-legend-item">
          <div className="orbital-legend-dot hz" />
          <span>{t('pages.planet.orbital.habitableZone')}</span>
        </div>
      </div>

      {/* Orbital info */}
      <div className="orbital-info">
        <div className="orbital-info-item">
          <span className="info-label">{t('pages.planet.orbital.distance')}</span>
          <span className="info-value">{planet.pl_orbsmax?.toFixed(3)} AU</span>
        </div>
        {planet.pl_orbper && (
          <div className="orbital-info-item">
            <span className="info-label">{t('pages.planet.orbital.period')}</span>
            <span className="info-value">
              {planet.pl_orbper < 365 
                ? `${planet.pl_orbper.toFixed(1)} days`
                : `${(planet.pl_orbper / 365.25).toFixed(2)} years`}
            </span>
          </div>
        )}
        {planet.pl_orbeccen !== null && (
          <div className="orbital-info-item">
            <span className="info-label">{t('pages.planet.orbital.eccentricity')}</span>
            <span className="info-value">{planet.pl_orbeccen.toFixed(3)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrbitalPositionChart;

