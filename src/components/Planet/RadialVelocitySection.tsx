/**
 * RadialVelocitySection Component
 * Educational visualization of the radial velocity detection method
 * Shows sinusoidal RV curve, comparison chart, and educational content
 */

import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import type { Exoplanet } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface RadialVelocitySectionProps {
  planet: Exoplanet;
  siblings?: Exoplanet[];
}

interface RvDataPoint {
  time: number;      // Time in days
  velocity: number;  // Radial velocity in m/s
  phase: number;     // Orbital phase (0 to 2π * numCycles)
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate synthetic RV curve from orbital parameters
 */
function generateRvCurve(planet: Exoplanet, numCycles = 1): RvDataPoint[] {
  const K = planet.pl_rvamp!;           // RV amplitude (m/s)
  const P = planet.pl_orbper!;          // Period (days)
  const baseline = (planet.st_radv || 0) * 1000;  // km/s → m/s

  const points: RvDataPoint[] = [];
  const totalPoints = Math.floor(numCycles * 100);

  for (let i = 0; i <= totalPoints; i++) {
    const phase = (i / 100) * 2 * Math.PI;
    const time = (i / 100) * P;

    // Simple sinusoidal model (circular orbit approximation)
    // Using sin with phase=0 at TOP position (standard convention)
    // For eccentric orbits, we would use: K * [sin(phase + ω) + e * sin(ω)]
    const velocity = baseline + K * Math.sin(phase);

    points.push({ time, velocity, phase });
  }

  return points;
}

/**
 * Format velocity value for display
 */
function formatVelocity(velocity: number | null | undefined): string {
  if (velocity === null || velocity === undefined || isNaN(velocity)) {
    return 'N/A';
  }
  const numVel = Number(velocity);
  if (Math.abs(numVel) < 1) {
    return `${(numVel * 1000).toFixed(0)} cm/s`;
  }
  return `${numVel.toFixed(2)} m/s`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RadialVelocitySection({
  planet,
  siblings = []
}: RadialVelocitySectionProps) {
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
  const spectrumRef = useRef<SVGSVGElement>(null);
  const spectrumContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Check if we have RV data
  const hasRvData = planet.pl_rvamp !== null && planet.pl_orbper !== null;

  // =============================================================================
  // ANIMATION LOOP
  // =============================================================================

  useEffect(() => {
    if (!hasRvData) return;

    // Calculate animation speed based on orbital period
    // Shorter periods animate faster, longer periods animate slower
    const referencePeriod = 15; // Reference: 15-day orbit completes in ~10 seconds
    const baseSpeed = 0.01; // Base radians per frame at 60fps
    const speedMultiplier = referencePeriod / planet.pl_orbper!;
    // Clamp speed between 0.2x and 8x for watchability
    const speed = baseSpeed * Math.min(Math.max(speedMultiplier, 0.2), 8);

    const animate = () => {
      setCurrentPhase((prev) => (prev + speed) % (Math.PI * 2));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasRvData, planet.pl_orbper]);

  // =============================================================================
  // D3 VISUALIZATION: RV CURVE
  // =============================================================================

  useEffect(() => {
    if (!hasRvData || !curveChartRef.current || !curveContainerRef.current) return;

    const containerWidth = curveContainerRef.current.clientWidth;
    const width = Math.min(containerWidth - 20, 1200); // Cap max width, subtract padding to avoid scroll
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    const svg = d3.select(curveChartRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Generate data
    const data = generateRvCurve(planet);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.time)!])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.velocity)! - planet.pl_rvamp! * 0.2,
        d3.max(data, d => d.velocity)! + planet.pl_rvamp! * 0.2
      ])
      .range([height - margin.bottom, margin.top]);

    // Line generator
    const line = d3.line<RvDataPoint>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.velocity))
      .curve(d3.curveBasis);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(0, 0, 0, 0.2)');

    // Grid lines
    svg.append('g')
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

    svg.append('g')
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

    // Baseline reference line
    const K = planet.pl_rvamp!;
    const P = planet.pl_orbper!;
    const baseline = (planet.st_radv || 0) * 1000;

    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(baseline))
      .attr('y2', yScale(baseline))
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Redshift region (above baseline)
    const redshiftArea = d3.area<RvDataPoint>()
      .x(d => xScale(d.time))
      .y0(yScale(baseline))
      .y1(d => yScale(Math.max(d.velocity, baseline)))
      .curve(d3.curveBasis);

    svg.append('path')
      .datum(data)
      .attr('d', redshiftArea)
      .attr('fill', 'rgba(255, 100, 100, 0.15)')
      .attr('opacity', 0.8);

    // Blueshift region (below baseline)
    const blueshiftArea = d3.area<RvDataPoint>()
      .x(d => xScale(d.time))
      .y0(yScale(baseline))
      .y1(d => yScale(Math.min(d.velocity, baseline)))
      .curve(d3.curveBasis);

    svg.append('path')
      .datum(data)
      .attr('d', blueshiftArea)
      .attr('fill', 'rgba(100, 150, 255, 0.15)')
      .attr('opacity', 0.8);

    // Draw the RV curve
    svg.append('path')
      .datum(data)
      .attr('id', 'rv-curve-path')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#00ccff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Legend
    const legendX = width - margin.right - 130;
    const legendY = margin.top + 10;

    // Legend background
    svg.append('rect')
      .attr('x', legendX - 5)
      .attr('y', legendY - 5)
      .attr('width', 135)
      .attr('height', 60)
      .attr('fill', 'rgba(0, 0, 0, 0.6)')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    // Redshift legend item
    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', 'rgba(255, 100, 100, 0.4)');

    svg.append('text')
      .attr('x', legendX + 25)
      .attr('y', legendY + 9)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-size', '11px')
      .text('Redshift (away)');

    // Blueshift legend item
    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY + 20)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', 'rgba(100, 150, 255, 0.4)');

    svg.append('text')
      .attr('x', legendX + 25)
      .attr('y', legendY + 29)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-size', '11px')
      .text('Blueshift (toward)');

    // Baseline legend item
    svg.append('line')
      .attr('x1', legendX)
      .attr('x2', legendX + 20)
      .attr('y1', legendY + 46)
      .attr('y2', legendY + 46)
      .attr('stroke', 'rgba(255, 255, 255, 0.5)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    svg.append('text')
      .attr('x', legendX + 25)
      .attr('y', legendY + 49)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-size', '11px')
      .text('Baseline');

    // Animated marker (positioned by currentPhase in separate useEffect)
    svg.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', '#ff6b6b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'rv-animated-marker');

    // X-axis
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5));

    xAxis.selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)');

    xAxis.selectAll('line, path')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)');

    // X-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '12px')
      .text(t('pages.planet.rv.xAxisLabel'));

    // Y-axis
    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => `${d}`)
      );

    yAxis.selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)');

    yAxis.selectAll('line, path')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)');

    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '12px')
      .text(t('pages.planet.rv.yAxisLabel'));

    // Update marker position based on currentPhase
    const currentTime = (currentPhase / (Math.PI * 2)) * P;
    const currentVelocity = baseline + K * Math.sin(currentPhase);

    svg.select('.rv-animated-marker')
      .attr('cx', xScale(currentTime))
      .attr('cy', yScale(currentVelocity));

  }, [currentPhase, hasRvData, planet, t]); // planet and t needed for curve generation, but currentPhase updates marker

  // =============================================================================
  // D3 VISUALIZATION: ORBITAL DIAGRAM
  // =============================================================================

  useEffect(() => {
    if (!hasRvData || !orbitalDiagramRef.current || !orbitalContainerRef.current) return;

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

    // Calculate planet orbit radius (scale for visualization)
    const planetOrbitRadius = maxRadius * 0.7;

    // Star wobble radius (greatly exaggerated for visibility)
    const starWobbleRadius = maxRadius * 0.15;

    // Planet position
    const planetX = centerX + Math.cos(currentPhase) * planetOrbitRadius;
    const planetY = centerY + Math.sin(currentPhase) * planetOrbitRadius;

    // Star position (wobbles in opposite direction)
    const starX = centerX - Math.cos(currentPhase) * starWobbleRadius;
    const starY = centerY - Math.sin(currentPhase) * starWobbleRadius;

    // Orbital path
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', planetOrbitRadius)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Star wobble path
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', starWobbleRadius)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 200, 0, 0.3)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // Calculate Doppler shift color for light cone
    // Cone points toward observer (Earth) at 6 o'clock (straight down)
    // In SVG coordinates where Y increases downward, down = 90°
    const observerAngleDeg = 90; // Straight down toward observer
    const observerAngle = observerAngleDeg * Math.PI / 180; // Convert to radians
    const cosObs = Math.cos(observerAngle);
    const sinObs = Math.sin(observerAngle);

    // Star position offset (opposite to planet): (-cos, -sin)
    // Projection onto observer direction: -cos*cosObs + -sin*sinObs
    const radialComponent = -(Math.cos(currentPhase) * cosObs + Math.sin(currentPhase) * sinObs);
    const normalizedVelocity = radialComponent; // -1 to 1

    // Light cone color based on Doppler shift
    // Positive radialComponent = star toward observer = BLUESHIFT
    // Negative radialComponent = star away from observer = REDSHIFT
    let coneColor;
    if (normalizedVelocity > 0.05) {
      // Blueshift - star moving toward observer (positive radial component)
      const intensity = Math.abs(normalizedVelocity);
      const blue = 255;
      const green = Math.floor(150 + intensity * 105); // Cyan to deep blue
      coneColor = `rgba(0, ${green}, ${blue}, ${0.4 + intensity * 0.3})`;
    } else if (normalizedVelocity < -0.05) {
      // Redshift - star moving away from observer (negative radial component)
      const intensity = Math.abs(normalizedVelocity);
      const red = 255;
      const green = Math.floor(200 - intensity * 200); // More orange at lower velocities
      coneColor = `rgba(${red}, ${green}, 0, ${0.4 + intensity * 0.3})`;
    } else {
      // Very near baseline - neutral yellowish (star light at rest)
      coneColor = 'rgba(255, 255, 200, 0.25)';
    }

    // Light cone emanating from star toward observer
    const coneAngle = 40; // Cone spread angle in degrees
    const coneLength = 60;
    // Reuse observerAngleDeg from color calculation above

    const leftAngleRad = ((observerAngleDeg - coneAngle / 2) * Math.PI) / 180;
    const rightAngleRad = ((observerAngleDeg + coneAngle / 2) * Math.PI) / 180;

    const coneLeft = `${starX + Math.cos(leftAngleRad) * coneLength},${starY + Math.sin(leftAngleRad) * coneLength}`;
    const coneRight = `${starX + Math.cos(rightAngleRad) * coneLength},${starY + Math.sin(rightAngleRad) * coneLength}`;

    svg.append('path')
      .attr('d', `M ${starX},${starY} L ${coneLeft} L ${coneRight} Z`)
      .attr('fill', coneColor)
      .attr('opacity', 0.6);

    // Star (drawn after cone so it's on top)
    svg.append('circle')
      .attr('cx', starX)
      .attr('cy', starY)
      .attr('r', 15)
      .attr('fill', '#ffcc00')
      .attr('filter', 'drop-shadow(0 0 8px rgba(255, 200, 0, 0.6))');

    // Planet
    svg.append('circle')
      .attr('cx', planetX)
      .attr('cy', planetY)
      .attr('r', 8)
      .attr('fill', '#00ccff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Center of mass indicator
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 3)
      .attr('fill', '#ff6b6b')
      .attr('opacity', 0.5);

    // Labels
    svg.append('text')
      .attr('x', size / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '11px')
      .text('Orbital Motion');

  }, [currentPhase, hasRvData]);

  // =============================================================================
  // D3 VISUALIZATION: 1D SIDE VIEW
  // =============================================================================

  useEffect(() => {
    if (!hasRvData || !sideViewRef.current || !sideViewContainerRef.current) return;

    const width = 250;
    const height = 80;
    const centerY = height / 2;
    const viewLength = 180; // Length of the 1D representation

    const svg = d3.select(sideViewRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(0, 0, 0, 0.3)');

    // Horizontal line representing line of sight
    svg.append('line')
      .attr('x1', 35)
      .attr('x2', 35 + viewLength)
      .attr('y1', centerY)
      .attr('y2', centerY)
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 2);

    // Calculate positions (horizontal position only matters for 1D view)
    // Side view looks at orbit edge-on (perpendicular to main observer)
    // Shows X-axis motion: at center when planet is at top/bottom of orbit
    // Both wobble in same direction (observer's frame, not CM frame)
    const starX = 35 + viewLength / 2 + Math.cos(currentPhase) * 8; // Star wobbles left-right
    const planetX = 35 + viewLength / 2 + Math.cos(currentPhase) * 60; // Planet orbit left-right

    // Star (yellow circle)
    svg.append('circle')
      .attr('cx', starX)
      .attr('cy', centerY)
      .attr('r', 12)
      .attr('fill', '#ffcc00')
      .attr('filter', 'drop-shadow(0 0 6px rgba(255, 200, 0, 0.5))');

    // Planet (blue circle)
    svg.append('circle')
      .attr('cx', planetX)
      .attr('cy', centerY)
      .attr('r', 6)
      .attr('fill', '#00ccff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '11px')
      .text('Side View');

  }, [currentPhase, hasRvData]);

  // =============================================================================
  // D3 VISUALIZATION: SPECTRAL LINES
  // =============================================================================

  useEffect(() => {
    if (!hasRvData || !spectrumRef.current || !spectrumContainerRef.current) return;

    const width = Math.min(spectrumContainerRef.current.clientWidth, 600);

    const svg = d3.select(spectrumRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', 380); // Increased height for comprehensive summary

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', 380)
      .attr('fill', 'rgba(0, 0, 0, 0.3)');

    // Spectrum gradient (simplified stellar spectrum)
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'spectrum-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4169e1'); // Blue

    gradient.append('stop')
      .attr('offset', '25%')
      .attr('stop-color', '#00bfff'); // Cyan

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#90ee90'); // Green

    gradient.append('stop')
      .attr('offset', '75%')
      .attr('stop-color', '#ffff00'); // Yellow

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ff4500'); // Red

    // Spectrum bar
    svg.append('rect')
      .attr('x', 20)
      .attr('y', 20)
      .attr('width', width - 40)
      .attr('height', 40)
      .attr('fill', 'url(#spectrum-gradient)');

    // Calculate Doppler shift directly from phase for perfect sync
    const K = planet.pl_rvamp!;
    const currentVelocity = K * Math.sin(currentPhase); // Velocity relative to baseline
    const maxShift = 20; // Maximum pixel shift for visualization (increased for visibility)
    const shift = (currentVelocity / K) * maxShift;

    // Absorption lines at realistic stellar spectral feature positions
    // Based on common absorption lines: Ca II H&K, H-beta, Mg, Na D, H-alpha, etc.
    // Positioned to mimic actual wavelength distribution (not evenly spaced)
    const spectralLines = [
      { pos: 0.05, label: 'Ca K' },
      { pos: 0.08, label: 'Ca H' },
      { pos: 0.25, label: 'H-δ' },
      { pos: 0.35, label: 'H-γ' },
      { pos: 0.45, label: 'H-β' },
      { pos: 0.55, label: 'Mg' },
      { pos: 0.59, label: 'Na D' },
      { pos: 0.61, label: 'Na D' },
      { pos: 0.75, label: 'H-α' },
      { pos: 0.88, label: 'Ca II' },
    ];

    spectralLines.forEach((line, index) => {
      const restX = 20 + (width - 40) * line.pos;

      // Reference line (rest position - BLACK DASHED, stationary, extended)
      svg.append('line')
        .attr('x1', restX)
        .attr('x2', restX)
        .attr('y1', 10)  // Extended above spectrum
        .attr('y2', 70)  // Extended below spectrum
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.6);

      // Doppler-shifted line (SOLID, moves left/right)
      svg.append('line')
        .attr('x1', restX + shift)
        .attr('x2', restX + shift)
        .attr('y1', 20)
        .attr('y2', 60)
        .attr('stroke', '#000')
        .attr('stroke-width', 3)
        .attr('opacity', 0.9);

      // Label below spectrum with alternating vertical positions to prevent overlap
      const labelY = 80 + (index % 3) * 10; // Alternate between 3 levels: 80, 90, 100
      svg.append('text')
        .attr('x', restX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.6)')
        .attr('font-size', '8px')
        .text(line.label);
    });

    // Label with velocity
    const velocityText = Math.abs(currentVelocity) > 0.1
      ? `${currentVelocity > 0 ? 'Redshift' : 'Blueshift'} (${Math.abs(currentVelocity).toFixed(1)} m/s)`
      : 'No shift (perpendicular motion)';

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 110)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '10px')
      .text(velocityText);

    // Educational summary - expanded to fill space
    const summaryData = [
      { text: 'How to Read These Visualizations:', y: 135, bold: true, size: 11 },
      { text: '', y: 145 }, // spacer
      { text: 'REDSHIFT (Star moving away from us):', y: 155, bold: true },
      { text: '  • Orbital View: Planet at BOTTOM position', y: 168 },
      { text: '  • Side View: Both star & planet on RIGHT (far side)', y: 181 },
      { text: '  • RV Curve: Red marker at PEAK (maximum velocity)', y: 194 },
      { text: '  • Spectrum: Black lines shift RIGHT (toward red)', y: 207 },
      { text: '', y: 217 }, // spacer
      { text: 'BLUESHIFT (Star moving toward us):', y: 227, bold: true },
      { text: '  • Orbital View: Planet at TOP position', y: 240 },
      { text: '  • Side View: Both star & planet on LEFT (near side)', y: 253 },
      { text: '  • RV Curve: Red marker at VALLEY (minimum velocity)', y: 266 },
      { text: '  • Spectrum: Black lines shift LEFT (toward blue)', y: 279 },
      { text: '', y: 289 }, // spacer
      { text: 'NO DOPPLER SHIFT (Perpendicular motion):', y: 299, bold: true },
      { text: '  • Orbital View: Planet at LEFT or RIGHT sides', y: 312 },
      { text: '  • Side View: Both at center position', y: 325 },
      { text: '  • RV Curve: Red marker crosses BASELINE', y: 338 },
      { text: '  • Spectrum: Black lines align with dashed reference lines', y: 351 },
    ];

    summaryData.forEach((item) => {
      if (!item.text) return; // Skip spacers

      const text = svg.append('text')
        .attr('x', 20)
        .attr('y', item.y)
        .attr('text-anchor', 'start')
        .attr('fill', 'rgba(255, 255, 255, 0.6)')
        .attr('font-size', item.size ? `${item.size}px` : '10px')
        .text(item.text);

      if (item.bold) {
        text.attr('font-weight', 'bold').attr('fill', 'rgba(255, 255, 255, 0.8)');
      }
    });

  }, [currentPhase, hasRvData, planet]);

  // =============================================================================
  // D3 VISUALIZATION: COMPARISON CHART
  // =============================================================================

  useEffect(() => {
    if (!hasRvData || siblings.length === 0 || !comparisonChartRef.current || !comparisonContainerRef.current) return;

    // Get all planets with RV data
    const rvPlanets = [planet, ...siblings]
      .filter(p => p.pl_rvamp !== null && p.pl_rvamp > 0)
      .sort((a, b) => b.pl_rvamp! - a.pl_rvamp!);

    if (rvPlanets.length <= 1) return; // Need at least 2 planets for comparison

    const containerWidth = comparisonContainerRef.current.clientWidth;
    const width = Math.max(400, containerWidth - 40); // Account for container padding
    const height = Math.max(200, rvPlanets.length * 40);
    const margin = { top: 20, right: 30, bottom: 40, left: 150 };

    const svg = d3.select(comparisonChartRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(0, 0, 0, 0.2)');

    // Logarithmic scale for RV amplitude
    const maxRv = d3.max(rvPlanets, p => p.pl_rvamp!)!;
    const xScale = d3.scaleLog()
      .domain([0.1, maxRv * 1.2])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(rvPlanets.map(p => p.pl_name.split(' ').pop() || p.pl_name))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    // Bars
    svg.selectAll('.rv-bar')
      .data(rvPlanets)
      .join('rect')
      .attr('class', 'rv-bar')
      .attr('x', margin.left)
      .attr('y', p => yScale(p.pl_name.split(' ').pop() || p.pl_name)!)
      .attr('width', p => xScale(p.pl_rvamp!) - margin.left)
      .attr('height', yScale.bandwidth())
      .attr('fill', p => p.pl_name === planet.pl_name ? '#00ff88' : '#00ccff')
      .attr('opacity', p => p.pl_name === planet.pl_name ? 1 : 0.6);

    // Detection threshold line (1 m/s)
    if (xScale(1) >= margin.left && xScale(1) <= width - margin.right) {
      svg.append('line')
        .attr('x1', xScale(1))
        .attr('x2', xScale(1))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#ff6b6b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      svg.append('text')
        .attr('x', xScale(1) + 5)
        .attr('y', margin.top + 15)
        .attr('fill', '#ff6b6b')
        .attr('font-size', '10px')
        .text('1 m/s');
    }

    // X-axis
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(5, '~s')
          .tickFormat(d => `${d} m/s`)
      );

    xAxis.selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)');

    xAxis.selectAll('line, path')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)');

    // Y-axis
    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    yAxis.selectAll('text')
      .attr('fill', (d) => {
        const planetName = rvPlanets.find(p =>
          (p.pl_name.split(' ').pop() || p.pl_name) === d
        )?.pl_name;
        return planetName === planet.pl_name ? '#00ff88' : 'rgba(255, 255, 255, 0.7)';
      })
      .attr('font-weight', (d) => {
        const planetName = rvPlanets.find(p =>
          (p.pl_name.split(' ').pop() || p.pl_name) === d
        )?.pl_name;
        return planetName === planet.pl_name ? 'bold' : 'normal';
      });

    yAxis.selectAll('line, path')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)');

  }, [planet, siblings, hasRvData, t]);

  // =============================================================================
  // RENDER: NO DATA VIEW
  // =============================================================================

  if (!hasRvData) {
    return (
      <div className="rv-no-data-container">
        <div className="rv-no-data-message">
          <h4 className="rv-no-data-title">
            {t('pages.planet.rv.noData.title')}
          </h4>
          <p className="rv-no-data-explanation">
            {t('pages.planet.rv.noData.message', {
              method: planet.discoverymethod || 'unknown method'
            })}
          </p>
        </div>

        {/* Educational content */}
        {renderEducationalContent()}

        {/* Solar System example */}
        <div className="rv-example">
          <p><strong>{t('pages.planet.rv.noData.example')}</strong></p>
          <ul>
            <li>{t('pages.planet.rv.noData.jupiterExample')}</li>
            <li>{t('pages.planet.rv.noData.earthExample')}</li>
            <li>{t('pages.planet.rv.noData.detectionLimit')}</li>
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
        key: 'doppler',
        title: t('pages.planet.rv.explanation.dopplerTitle'),
        content: t('pages.planet.rv.explanation.dopplerContent'),
      },
      {
        key: 'wobble',
        title: t('pages.planet.rv.explanation.wobbleTitle'),
        content: t('pages.planet.rv.explanation.wobbleContent'),
      },
      {
        key: 'discovery',
        title: t('pages.planet.rv.explanation.discoveryTitle'),
        content: t('pages.planet.rv.explanation.discoveryContent'),
      },
    ];

    return (
      <div className="rv-explanation-header">
        {sections.map((section) => (
          <div key={section.key} className="rv-explanation-section">
            <button
              className="rv-explanation-trigger"
              onClick={() =>
                setExpandedSection(
                  expandedSection === section.key ? null : section.key
                )
              }
            >
              <span>{section.title}</span>
              <span
                className={`rv-explanation-icon ${
                  expandedSection === section.key ? 'expanded' : ''
                }`}
              >
                ›
              </span>
            </button>
            {expandedSection === section.key && (
              <div className="rv-explanation-content">
                {section.content}
                {section.key === 'doppler' && (
                  <div className="rv-explanation-image">
                    <img
                      src="/images/rv.png"
                      alt="Radial Velocity Detection Diagram"
                      className="rv-diagram-image"
                    />
                    <p className="rv-image-caption">
                      {t('pages.planet.rv.explanation.dopplerImageCaption')}
                    </p>
                  </div>
                )}
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
      <div className="rv-technical-details">
        <div className="rv-detail-item">
          <div className="rv-detail-label">
            {t('pages.planet.rv.technical.amplitude')}
          </div>
          <div className="rv-detail-value">
            {formatVelocity(planet.pl_rvamp!)}
          </div>
        </div>

        <div className="rv-detail-item">
          <div className="rv-detail-label">
            {t('pages.planet.rv.technical.period')}
          </div>
          <div className="rv-detail-value">
            {Number(planet.pl_orbper) < 365
              ? `${Number(planet.pl_orbper).toFixed(1)} days`
              : `${(Number(planet.pl_orbper) / 365.25).toFixed(2)} years`}
          </div>
        </div>

        {planet.st_radv !== null && (
          <div className="rv-detail-item">
            <div className="rv-detail-label">
              {t('pages.planet.rv.technical.baseline')}
            </div>
            <div className="rv-detail-value">
              {Number(planet.st_radv).toFixed(2)} km/s
            </div>
          </div>
        )}

        {planet.pl_orbeccen !== null && (
          <div className="rv-detail-item">
            <div className="rv-detail-label">
              {t('pages.planet.rv.technical.eccentricity')}
            </div>
            <div className="rv-detail-value">
              {Number(planet.pl_orbeccen).toFixed(3)}
            </div>
          </div>
        )}

        {planet.st_vsin !== null && planet.st_vsin > 0 && (
          <div className="rv-detail-item">
            <div className="rv-detail-label">
              {t('pages.planet.rv.technical.stellarRotation')}
            </div>
            <div className="rv-detail-value">
              {Number(planet.st_vsin).toFixed(2)} km/s
            </div>
          </div>
        )}
      </div>
    );
  }

  // =============================================================================
  // RENDER: MAIN VIEW
  // =============================================================================

  return (
    <div className="rv-section">
      {/* Introduction */}
      <p className="rv-intro">
        {t('pages.planet.rv.intro')}
      </p>

      {/* Educational accordion */}
      {renderEducationalContent()}

      {/* RV Curve Chart - Full Width at Top */}
      <div className="rv-curve-container">
        <h4 className="rv-curve-title">
          {t('pages.planet.rv.curveTitle')}
        </h4>
        <div ref={curveContainerRef} className="rv-curve-chart">
          <svg ref={curveChartRef} />
        </div>
      </div>

      {/* Real-time Data Display */}
      <div className="rv-data-display">
        <div className="rv-data-item">
          <div className="rv-data-label">{t('pages.planet.rv.dataDisplay.currentRV')}</div>
          <div className="rv-data-value rv-data-current">
            {(((planet.st_radv || 0) * 1000) + (planet.pl_rvamp || 0) * Math.sin(currentPhase)).toFixed(2)}
            <span className="rv-data-unit">m/s</span>
          </div>
        </div>
        <div className="rv-data-item">
          <div className="rv-data-label">{t('pages.planet.rv.dataDisplay.amplitude')}</div>
          <div className="rv-data-value">
            {Number(planet.pl_rvamp || 0).toFixed(2)}
            <span className="rv-data-unit">m/s</span>
          </div>
        </div>
        <div className="rv-data-item">
          <div className="rv-data-label">{t('pages.planet.rv.dataDisplay.baseline')}</div>
          <div className="rv-data-value">
            {(Number(planet.st_radv || 0) * 1000).toFixed(2)}
            <span className="rv-data-unit">m/s</span>
          </div>
        </div>
      </div>

      {/* Synchronized Visualizations Grid */}
      <div className="rv-visualizations-grid">
        {/* Left Column: Orbital Views */}
        <div className="rv-orbital-views-card">
          <h4 className="rv-viz-subtitle">{t('pages.planet.rv.visualizations.orbitalMotion')}</h4>
          <div className="rv-orbital-views">
            {/* Orbital Diagram */}
            <div className="rv-orbital-diagram-container">
              <div ref={orbitalContainerRef} className="rv-orbital-diagram">
                <svg ref={orbitalDiagramRef} />
              </div>
            </div>

            {/* 1D Side View */}
            <div className="rv-side-view-container">
              <div ref={sideViewContainerRef} className="rv-side-view">
                <svg ref={sideViewRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Spectral Lines */}
        <div className="rv-spectrum-card">
          <h4 className="rv-viz-subtitle">{t('pages.planet.rv.visualizations.spectralDoppler')}</h4>
          <div ref={spectrumContainerRef} className="rv-spectrum">
            <svg ref={spectrumRef} />
          </div>
        </div>
      </div>

      {/* Comparison Chart (only if siblings exist) */}
      {siblings.length > 0 && (
        <div className="rv-comparison-container">
          <h4 className="rv-comparison-title">
            {t('pages.planet.rv.comparisonTitle')}
          </h4>
          <p className="rv-comparison-description">
            {t('pages.planet.rv.comparisonDescription')}
          </p>
          <div ref={comparisonContainerRef} className="rv-comparison-chart">
            <svg ref={comparisonChartRef} />
          </div>

          <div className="rv-comparison-legend">
            <div className="rv-comparison-legend-item">
              <div className="rv-legend-dot current" />
              <span>{planet.pl_name}</span>
            </div>
            <div className="rv-comparison-legend-item">
              <div className="rv-legend-dot sibling" />
              <span>Sibling planets</span>
            </div>
            <div className="rv-comparison-legend-item">
              <div className="rv-legend-dot threshold" />
              <span>{t('pages.planet.rv.detectionThreshold')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      {renderTechnicalDetails()}
    </div>
  );
}

export default RadialVelocitySection;
