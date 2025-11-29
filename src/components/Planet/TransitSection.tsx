/**
 * TransitSection Component
 * Educational visualization of the transit detection method
 * Shows light curve, orbital geometry, and comparison with siblings
 */

import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import type { Exoplanet } from '../../types';
import { renderLegend, type LegendItem } from '../Habitability/charts/ChartLegend';
import {
  generateTransitCurve,
  formatTransitDepth,
  formatTransitDuration,
  formatOrbitalPeriod,
  formatPlanetRadius,
  formatImpactParameter,
  formatSemiMajorRatio,
  type TransitDataPoint,
} from '../../utils/transitCalculations';

// =============================================================================
// TYPES
// =============================================================================

interface TransitSectionProps {
  planet: Exoplanet;
  siblings?: Exoplanet[];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TransitSection({
  planet,
  siblings = [],
}: TransitSectionProps) {
  const { t } = useTranslation();

  // State
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);

  // Refs for D3 charts
  const curveChartRef = useRef<SVGSVGElement>(null);
  const curveContainerRef = useRef<HTMLDivElement>(null);
  const comparisonChartRef = useRef<SVGSVGElement>(null);
  const comparisonContainerRef = useRef<HTMLDivElement>(null);
  const orbitalDiagramRef = useRef<SVGSVGElement>(null);
  const orbitalContainerRef = useRef<HTMLDivElement>(null);
  const sideViewRef = useRef<SVGSVGElement>(null);
  const sideViewContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Check if we have transit data
  const hasTransitData = planet.is_transiting &&
    planet.pl_trandep !== null &&
    planet.pl_orbper !== null;

  // =============================================================================
  // ANIMATION LOOP
  // =============================================================================

  useEffect(() => {
    if (!hasTransitData) return;

    const animationSpeed = 0.0008; // ~8 seconds per orbit at 60fps

    const animate = () => {
      setCurrentPhase((prev) => (prev + animationSpeed) % 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasTransitData]);

  // =============================================================================
  // D3 VISUALIZATION: LIGHT CURVE
  // =============================================================================

  useEffect(() => {
    if (!hasTransitData || !curveChartRef.current || !curveContainerRef.current) return;

    const containerWidth = curveContainerRef.current.clientWidth;
    const isMobile = containerWidth < 500;
    const width = Math.min(containerWidth - 20, 1200);
    const height = 380; // Increased to accommodate legend below
    const margin = { top: 20, right: 30, bottom: isMobile ? 120 : 90, left: 70 }; // Increased bottom margin for legend

    const svg = d3.select(curveChartRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Generate data
    const data = generateTransitCurve(planet);

    // Calculate Y-axis scale balanced around baseline (1.0)
    // The dip below 1.0 determines the scale, with equal padding above
    const minFlux = Math.min(...data.map(d => d.fluxClean));

    // Distance below baseline (1.0)
    const dipDepth = 1.0 - minFlux;

    // Scale: show the dip + more space above baseline for noise
    // This keeps 1.0 nicely visible and readable
    const yMin = minFlux - dipDepth * 0.5; // More padding below dip
    const yMax = 1.0 + dipDepth * 1.2;     // Space above baseline

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(0, 0, 0, 0.2)');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(5)
          .tickSize(-(height - margin.top - margin.bottom))
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)');

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)');

    // Transit region highlight
    const transitStart = 0.5 - (planet.pl_trandur && planet.pl_orbper
      ? (planet.pl_trandur / 24) / planet.pl_orbper / 2
      : 0.04);
    const transitEnd = 0.5 + (planet.pl_trandur && planet.pl_orbper
      ? (planet.pl_trandur / 24) / planet.pl_orbper / 2
      : 0.04);

    g.append('rect')
      .attr('x', xScale(transitStart))
      .attr('y', margin.top)
      .attr('width', xScale(transitEnd) - xScale(transitStart))
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', '#00e5ff')
      .attr('opacity', 0.05);

    // Baseline reference line (more visible)
    g.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(1))
      .attr('y2', yScale(1))
      .attr('stroke', '#ff9500')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.8);

    // Transit model curve (drawn first, so data points appear on top)
    const line = d3.line<TransitDataPoint>()
      .x((d) => xScale(d.phase))
      .y((d) => yScale(d.fluxClean))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#00e5ff')
      .attr('stroke-width', 3)
      .attr('opacity', 1)
      .attr('d', line);

    // Data points (observations)
    g.selectAll('.point')
      .data(data.filter((_, i) => i % 4 === 0))  // Show every 4th point to avoid clutter
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (d) => xScale(d.phase))
      .attr('cy', (d) => yScale(d.flux))
      .attr('r', 1.5)
      .attr('fill', '#00e5ff')
      .attr('opacity', 0.15);

    // Animated marker
    const marker = g.append('g').attr('class', 'marker');

    marker.append('line')
      .attr('class', 'marker-line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#ff9500')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8);

    marker.append('circle')
      .attr('class', 'marker-dot')
      .attr('r', 6)
      .attr('fill', '#ff9500')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Legend - placed below the chart to avoid overlapping data
    const legendItems: LegendItem[] = [
      { color: '#00e5ff', text: 'Model', type: 'line' },
      { color: '#ff9500', text: 'Baseline', type: 'line', lineStyle: 'dashed' },
      { color: '#00e5ff', text: 'Data', type: 'circle', size: 6 }
    ];

    renderLegend(svg, legendItems, {
      x: margin.left,
      y: height - margin.bottom + 50,
      width: width - margin.left - margin.right,
      isMobile,
    });

    // Axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5));

    xAxis.selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)');

    xAxis.selectAll('line, path')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - margin.bottom + 30) // Adjusted Y
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '12px')
      .text(t('pages.planet.transit.xAxisLabel'));

    const yAxis = g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => `${Number(d).toFixed(3)}`));

    yAxis.selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)');

    yAxis.selectAll('line, path')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '12px')
      .text(t('pages.planet.transit.yAxisLabel'));

    // Update marker position (using noisy observation data for realistic view)
    const idx = Math.floor(currentPhase * (data.length - 1));
    const datum = data[Math.min(idx, data.length - 1)];

    marker.select('.marker-line')
      .attr('x1', xScale(currentPhase))
      .attr('x2', xScale(currentPhase));

    marker.select('.marker-dot')
      .attr('cx', xScale(currentPhase))
      .attr('cy', yScale(datum.flux));

  }, [currentPhase, hasTransitData, planet, t]);

  // =============================================================================
  // D3 VISUALIZATION: ORBITAL DIAGRAM
  // =============================================================================

  useEffect(() => {
    if (!hasTransitData || !orbitalDiagramRef.current || !orbitalContainerRef.current) return;

    const size = 250;
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size / 2 - 20;

    const svg = d3.select(orbitalDiagramRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size);

    // Background
    svg.append('rect')
      .attr('width', size)
      .attr('height', size)
      .attr('fill', 'rgba(0, 0, 0, 0.3)');

    // Orbital path (ellipse)
    const planetOrbitRadius = maxRadius * 0.7;

    // Calculate planet position early for light cone check
    const adjustedPhase = currentPhase - 0.25;
    const planetX = centerX + Math.cos(adjustedPhase * 2 * Math.PI) * planetOrbitRadius;
    const planetY = centerY + Math.sin(adjustedPhase * 2 * Math.PI) * planetOrbitRadius;

    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', planetOrbitRadius)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Light cone (wedge showing line of sight from Earth)
    const coneWidth = 35;
    const conePath = [
      [centerX, centerY],
      [centerX - coneWidth / 2, centerY + maxRadius],
      [centerX + coneWidth / 2, centerY + maxRadius],
    ];

    // Check if planet is currently transiting (in the light cone)
    const inTransit = Math.abs(planetX - centerX) < coneWidth / 2 && planetY > centerY;

    svg.append('polygon')
      .attr('points', conePath.map(p => p.join(',')).join(' '))
      .attr('fill', inTransit ? 'rgba(255, 100, 100, 0.1)' : 'rgba(0, 229, 255, 0.05)')
      .attr('stroke', inTransit ? 'rgba(255, 100, 100, 0.3)' : 'rgba(0, 229, 255, 0.15)')
      .attr('stroke-width', 1);

    // Star glow (gradient)
    const defs = svg.append('defs');
    const starGradient = defs.append('radialGradient').attr('id', 'transitStarGlow');
    starGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fff');
    starGradient.append('stop').attr('offset', '50%').attr('stop-color', '#ffdd44');
    starGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ff8800').attr('stop-opacity', 0);

    // Star
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 18)
      .attr('fill', 'url(#transitStarGlow)');

    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 12)
      .attr('fill', '#ffdd44');

    // Planet circle (position already calculated above)
    svg.append('circle')
      .attr('cx', planetX)
      .attr('cy', planetY)
      .attr('r', 5)
      .attr('fill', '#00e5ff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // "To Earth" indicator
    svg.append('line')
      .attr('x1', centerX)
      .attr('x2', centerX)
      .attr('y1', centerY + maxRadius - 5)
      .attr('y2', centerY + maxRadius + 5)
      .attr('stroke', 'rgba(255, 255, 255, 0.5)')
      .attr('stroke-width', 1);

    svg.append('text')
      .attr('x', centerX)
      .attr('y', size - 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.5)')
      .attr('font-size', '9px')
      .text('To Earth');

    // Title
    svg.append('text')
      .attr('x', size / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '11px')
      .text(t('pages.planet.transit.visualizations.topView'));

  }, [currentPhase, hasTransitData, t]);

  // =============================================================================
  // D3 VISUALIZATION: SIDE VIEW
  // =============================================================================

  useEffect(() => {
    if (!hasTransitData || !sideViewRef.current || !sideViewContainerRef.current) return;

    const width = 250;
    const height = 80;
    const centerY = height / 2;
    const viewLength = 180;

    const svg = d3.select(sideViewRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(0, 0, 0, 0.3)');

    // Line of sight
    svg.append('line')
      .attr('x1', 35)
      .attr('x2', 35 + viewLength)
      .attr('y1', centerY)
      .attr('y2', centerY)
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 2);

    // Star glow
    const defs = svg.append('defs');
    const starGradient = defs.append('radialGradient').attr('id', 'transitStarGlowSide');
    starGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fff');
    starGradient.append('stop').attr('offset', '50%').attr('stop-color', '#ffdd44');
    starGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ff8800').attr('stop-opacity', 0);

    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', centerY)
      .attr('r', 28)
      .attr('fill', 'url(#transitStarGlowSide)');

    // Star
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', centerY)
      .attr('r', 22)
      .attr('fill', '#ffdd44');

    // Planet position (left/right motion) - synchronized with orbital diagram
    const adjustedPhase = currentPhase - 0.25;
    const planetX = 35 + viewLength / 2 + Math.cos(adjustedPhase * 2 * Math.PI) * 70;
    const impactParam = planet.pl_imppar || 0.3;
    const planetY = centerY + impactParam * 10;

    // Check if planet is in front (transiting) - phase 0.5 is in front
    const inFront = Math.sin(adjustedPhase * 2 * Math.PI) > 0;

    svg.append('circle')
      .attr('cx', planetX)
      .attr('cy', planetY)
      .attr('r', 5)
      .attr('fill', inFront ? '#00e5ff' : '#0088aa')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', inFront ? 1 : 0.5);

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '11px')
      .text(t('pages.planet.transit.visualizations.sideView'));

  }, [currentPhase, hasTransitData, planet, t]);

  // =============================================================================
  // D3 VISUALIZATION: COMPARISON CHART
  // =============================================================================

  useEffect(() => {
    if (!hasTransitData || siblings.length === 0 || !comparisonChartRef.current || !comparisonContainerRef.current) return;

    // Get all planets with transit data
    const transitPlanets = [planet, ...siblings]
      .filter(p => p.is_transiting && p.pl_trandep !== null && p.pl_trandep > 0)
      .sort((a, b) => (b.pl_trandep || 0) - (a.pl_trandep || 0));

    if (transitPlanets.length <= 1) return;

    const containerWidth = comparisonContainerRef.current.clientWidth;
    const isMobile = containerWidth < 500;
    const width = Math.max(isMobile ? 320 : 400, containerWidth - (isMobile ? 20 : 40));
    const height = Math.max(200, transitPlanets.length * (isMobile ? 30 : 40));
    const margin = { 
      top: 20, 
      right: isMobile ? 15 : 20, 
      bottom: isMobile ? 30 : 40, 
      left: isMobile ? 80 : 120 
    };

    const svg = d3.select(comparisonChartRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(0, 0, 0, 0.2)');

    // Logarithmic scale for transit depth
    const maxDepth = d3.max(transitPlanets, p => p.pl_trandep || 0.01)!;
    const xScale = d3.scaleLog()
      .domain([0.001, maxDepth * 1.2])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(transitPlanets.map(p => p.pl_name.split(' ').pop() || p.pl_name))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    // Bars
    svg.selectAll('.transit-bar')
      .data(transitPlanets)
      .join('rect')
      .attr('class', 'transit-bar')
      .attr('x', margin.left)
      .attr('y', p => yScale(p.pl_name.split(' ').pop() || p.pl_name)!)
      .attr('width', p => xScale(p.pl_trandep || 0.01) - margin.left)
      .attr('height', yScale.bandwidth())
      .attr('fill', p => p.pl_name === planet.pl_name ? '#4caf50' : '#00ccff')
      .attr('opacity', p => p.pl_name === planet.pl_name ? 1 : 0.6);

    // Detection threshold line
    if (xScale(0.01) >= margin.left && xScale(0.01) <= width - margin.right) {
      svg.append('line')
        .attr('x1', xScale(0.01))
        .attr('x2', xScale(0.01))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#ff6b6b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      svg.append('text')
        .attr('x', xScale(0.01) + 5)
        .attr('y', margin.top + 15)
        .attr('fill', '#ff6b6b')
        .attr('font-size', '10px')
        .text('0.01%');
    }

    // Axes
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(Math.max(2, Math.floor(width / 160))) // Aggressively reduce ticks
          .tickFormat(d => `${d}%`)
      );

    xAxis.selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .style('text-anchor', isMobile ? 'end' : 'middle')
      .attr('transform', isMobile ? 'rotate(-30)' : null)
      .attr('dy', isMobile ? '0.5em' : '0.71em')
      .attr('dx', isMobile ? '-0.5em' : '0');

    xAxis.selectAll('line, path').attr('stroke', 'rgba(255, 255, 255, 0.3)');

    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    yAxis.selectAll('text')
      .attr('font-size', isMobile ? '10px' : '12px')
      .attr('fill', (d) => {
        const planetName = transitPlanets.find(p =>
          (p.pl_name.split(' ').pop() || p.pl_name) === d
        )?.pl_name;
        return planetName === planet.pl_name ? '#4caf50' : 'rgba(255, 255, 255, 0.7)';
      })
      .attr('font-weight', (d) => {
        const planetName = transitPlanets.find(p =>
          (p.pl_name.split(' ').pop() || p.pl_name) === d
        )?.pl_name;
        return planetName === planet.pl_name ? 'bold' : 'normal';
      });

    yAxis.selectAll('line, path').attr('stroke', 'rgba(255, 255, 255, 0.3)');

  }, [planet, siblings, hasTransitData]);

  // =============================================================================
  // RENDER: NO DATA VIEW
  // =============================================================================

  if (!hasTransitData) {
    return (
      <div className="transit-no-data-container">
        <div className="transit-no-data-message">
          <h4 className="transit-no-data-title">
            {t('pages.planet.transit.noData.title')}
          </h4>
          <p className="transit-no-data-explanation">
            {t('pages.planet.transit.noData.message', {
              method: planet.discoverymethod || 'unknown method'
            })}
          </p>
        </div>

        {/* Educational content */}
        {renderEducationalContent()}

        {/* Solar System example */}
        <div className="transit-example">
          <p><strong>{t('pages.planet.transit.noData.example')}</strong></p>
          <ul>
            <li>{t('pages.planet.transit.noData.jupiterExample')}</li>
            <li>{t('pages.planet.transit.noData.earthExample')}</li>
            <li>{t('pages.planet.transit.noData.detectionLimit')}</li>
          </ul>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER: EDUCATIONAL ACCORDION
  // =============================================================================

  function renderEducationalContent() {
    const sections = [
      {
        key: 'geometry',
        title: t('pages.planet.transit.explanation.geometryTitle'),
        content: t('pages.planet.transit.explanation.geometryContent'),
      },
      {
        key: 'depth',
        title: t('pages.planet.transit.explanation.depthTitle'),
        content: t('pages.planet.transit.explanation.depthContent'),
      },
      {
        key: 'timing',
        title: t('pages.planet.transit.explanation.timingTitle'),
        content: t('pages.planet.transit.explanation.timingContent'),
      },
    ];

    return (
      <div className="transit-explanation-header">
        {sections.map((section) => (
          <div key={section.key} className="transit-explanation-section">
            <button
              className="transit-explanation-trigger"
              onClick={() =>
                setExpandedSection(
                  expandedSection === section.key ? null : section.key
                )
              }
            >
              <span>{section.title}</span>
              <span
                className={`transit-explanation-icon ${
                  expandedSection === section.key ? 'expanded' : ''
                }`}
              >
                ›
              </span>
            </button>
            {expandedSection === section.key && (
              <div className="transit-explanation-content">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // =============================================================================
  // RENDER: TECHNICAL DETAILS
  // =============================================================================

  function renderTechnicalDetails() {
    return (
      <div className="transit-technical-details">
        <div className="transit-detail-item">
          <div className="transit-detail-label">
            {t('pages.planet.transit.technical.depth')}
          </div>
          <div className="transit-detail-value">
            {formatTransitDepth(planet)}
          </div>
        </div>

        <div className="transit-detail-item">
          <div className="transit-detail-label">
            {t('pages.planet.transit.technical.duration')}
          </div>
          <div className="transit-detail-value">
            {formatTransitDuration(planet)}
          </div>
        </div>

        <div className="transit-detail-item">
          <div className="transit-detail-label">
            {t('pages.planet.transit.technical.period')}
          </div>
          <div className="transit-detail-value">
            {formatOrbitalPeriod(planet)}
          </div>
        </div>

        {planet.pl_ratror !== null && (
          <div className="transit-detail-item">
            <div className="transit-detail-label">
              {t('pages.planet.transit.technical.radiusRatio')}
            </div>
            <div className="transit-detail-value">
              {planet.pl_ratror.toFixed(3)}
            </div>
          </div>
        )}

        {planet.pl_ratdor !== null && (
          <div className="transit-detail-item">
            <div className="transit-detail-label">
              {t('pages.planet.transit.technical.semiMajorRatio')}
            </div>
            <div className="transit-detail-value">
              {formatSemiMajorRatio(planet)}
            </div>
          </div>
        )}

        {planet.pl_imppar !== null && (
          <div className="transit-detail-item">
            <div className="transit-detail-label">
              {t('pages.planet.transit.technical.impactParameter')}
            </div>
            <div className="transit-detail-value">
              {formatImpactParameter(planet)}
            </div>
          </div>
        )}

        <div className="transit-detail-item">
          <div className="transit-detail-label">
            {t('pages.planet.transit.technical.planetRadius')}
          </div>
          <div className="transit-detail-value">
            {formatPlanetRadius(planet)}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER: MAIN VIEW
  // =============================================================================

  return (
    <div className="transit-section">
      {/* Introduction */}
      <p className="transit-intro">
        {t('pages.planet.transit.intro')}
      </p>

      {/* Educational accordion */}
      {renderEducationalContent()}

      {/* Light Curve Chart - Full Width */}
      <div className="transit-curve-container">
        <h4 className="transit-curve-title">
          {t('pages.planet.transit.curveTitle')}
        </h4>
        <div ref={curveContainerRef} className="transit-curve-chart">
          <svg ref={curveChartRef} />
        </div>
      </div>

      {/* Real-time Data Display */}
      <div className="transit-data-display">
        <div className="transit-data-item">
          <div className="transit-data-label">{t('pages.planet.transit.dataDisplay.currentFlux')}</div>
          <div className="transit-data-value">
            {(() => {
              const data = generateTransitCurve(planet);
              const idx = Math.floor(currentPhase * (data.length - 1));
              return data[Math.min(idx, data.length - 1)].flux.toFixed(4);
            })()}
          </div>
        </div>
        <div className="transit-data-item">
          <div className="transit-data-label">{t('pages.planet.transit.dataDisplay.transitDepth')}</div>
          <div className="transit-data-value">
            {((planet.pl_trandep || (planet.pl_ratror ? planet.pl_ratror * planet.pl_ratror * 100 : 0.01)) * 100).toFixed(2)}%
          </div>
        </div>
        <div className="transit-data-item">
          <div className="transit-data-label">{t('pages.planet.transit.dataDisplay.planetRadius')}</div>
          <div className="transit-data-value">
            {formatPlanetRadius(planet)}
          </div>
        </div>
        <div className="transit-data-item">
          <div className="transit-data-label">{t('pages.planet.transit.dataDisplay.phase')}</div>
          <div className="transit-data-value">
            {(currentPhase).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Synchronized Visualizations Grid */}
      <div className="transit-visualizations-grid">
        {/* Left Column: Orbital Views */}
        <div className="transit-orbital-card">
          <h4 className="transit-viz-subtitle">{t('pages.planet.transit.visualizations.orbitalGeometry')}</h4>
          <div className="transit-orbital-views">
            {/* Orbital Diagram */}
            <div className="transit-orbital-diagram-container">
              <div ref={orbitalContainerRef} className="transit-orbital-diagram">
                <svg ref={orbitalDiagramRef} />
              </div>
            </div>

            {/* Side View */}
            <div className="transit-side-view-container">
              <div ref={sideViewContainerRef} className="transit-side-view">
                <svg ref={sideViewRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: What We Learn */}
        <div className="transit-legend-card">
          <h4 className="transit-viz-subtitle">{t('pages.planet.transit.visualizations.whatWeLearn')}</h4>
          <div className="transit-legend-section">
            <div className="transit-legend-title">{t('pages.planet.transit.legend.duringTransit')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.duringTransitItem1')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.duringTransitItem2')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.duringTransitItem3')}</div>

            <div className="transit-legend-title">{t('pages.planet.transit.legend.outsideTransit')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.outsideTransitItem1')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.outsideTransitItem2')}</div>

            <div className="transit-legend-title">{t('pages.planet.transit.legend.whatWeLearn')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.whatWeLearnItem1')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.whatWeLearnItem2')}</div>
            <div className="transit-legend-item">{t('pages.planet.transit.legend.whatWeLearnItem3')}</div>
          </div>
        </div>
      </div>

      {/* Comparison Chart (only if siblings exist) */}
      {siblings.length > 0 && (
        <div className="transit-comparison-container">
          <h4 className="transit-comparison-title">
            {t('pages.planet.transit.comparisonTitle')}
          </h4>
          <p className="transit-comparison-description">
            {t('pages.planet.transit.comparisonDescription')}
          </p>
          <div ref={comparisonContainerRef} className="transit-comparison-chart">
            <svg ref={comparisonChartRef} />
          </div>

          <div className="transit-comparison-legend">
            <div className="transit-comparison-legend-item">
              <div className="transit-legend-dot current" />
              <span>{planet.pl_name}</span>
            </div>
            <div className="transit-comparison-legend-item">
              <div className="transit-legend-dot sibling" />
              <span>Sibling planets</span>
            </div>
            <div className="transit-comparison-legend-item">
              <div className="transit-legend-dot threshold" />
              <span>Detection threshold</span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      {renderTechnicalDetails()}
    </div>
  );
}

export default TransitSection;
