/**
 * TravelTimeCalculator Component
 * Speed race visualization showing travel times at various speeds
 * Extracted from SystemOverviewModal for reuse
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Speed constants in km/s */
const TRAVEL_SPEEDS = {
  WALKING_KMS: 0.0014,
  CAR_KMS: 0.030,
  JET_KMS: 0.25,
  VOYAGER_KMS: 17,
  NEW_HORIZONS_KMS: 16.26,
  PARKER_PROBE_KMS: 192,
  LIGHT_1PCT_KMS: 2998,
  LIGHT_10PCT_KMS: 29979,
  LIGHT_SPEED_KMS: 299792,
};

/** One light year in kilometers */
const LIGHT_YEAR_KM = 9.461e12;

/** Human lifetime in years */
const HUMAN_LIFETIME_YEARS = 80;

/** Seconds per year */
const SECONDS_PER_YEAR = 31557600;

/** Animation duration in milliseconds */
const RACE_ANIMATION_DURATION = 2000;

/** Speed reference data for display */
interface SpeedReference {
  key: string;
  speedKms: number;
  icon: string;
  category: 'human' | 'spacecraft' | 'light';
  color: string;
}

const SPEED_REFERENCES: SpeedReference[] = [
  { key: 'walking', speedKms: TRAVEL_SPEEDS.WALKING_KMS, icon: '🚶', category: 'human', color: '#888888' },
  { key: 'car', speedKms: TRAVEL_SPEEDS.CAR_KMS, icon: '🚗', category: 'human', color: '#aaaaaa' },
  { key: 'jet', speedKms: TRAVEL_SPEEDS.JET_KMS, icon: '✈️', category: 'human', color: '#cccccc' },
  { key: 'voyager', speedKms: TRAVEL_SPEEDS.VOYAGER_KMS, icon: '🛰️', category: 'spacecraft', color: '#ff6b6b' },
  { key: 'newHorizons', speedKms: TRAVEL_SPEEDS.NEW_HORIZONS_KMS, icon: '🚀', category: 'spacecraft', color: '#ffa06b' },
  { key: 'parkerProbe', speedKms: TRAVEL_SPEEDS.PARKER_PROBE_KMS, icon: '☀️', category: 'spacecraft', color: '#ffcc00' },
  { key: 'onePercentC', speedKms: TRAVEL_SPEEDS.LIGHT_1PCT_KMS, icon: '⚡', category: 'light', color: '#00ccff' },
  { key: 'tenPercentC', speedKms: TRAVEL_SPEEDS.LIGHT_10PCT_KMS, icon: '💫', category: 'light', color: '#00ffcc' },
  { key: 'lightSpeed', speedKms: TRAVEL_SPEEDS.LIGHT_SPEED_KMS, icon: '🌟', category: 'light', color: '#00ff88' },
];

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Calculates travel time in years for a given distance and speed
 * @param distanceLy - Distance in light-years
 * @param speedKms - Speed in km/s
 * @returns Travel time in years
 */
function calculateTravelTimeYears(distanceLy: number, speedKms: number): number {
  const distanceKm = distanceLy * LIGHT_YEAR_KM;
  const travelTimeSeconds = distanceKm / speedKms;
  return travelTimeSeconds / SECONDS_PER_YEAR;
}

/**
 * Formats large numbers with appropriate suffixes
 * @param years - Number of years
 * @returns Formatted string
 */
function formatTravelTime(years: number): string {
  if (years < 1) {
    return `${(years * 365.25).toFixed(1)} days`;
  }
  if (years < 1000) {
    return `${years.toFixed(0)} years`;
  }
  if (years < 1e6) {
    return `${(years / 1000).toFixed(1)}k years`;
  }
  if (years < 1e9) {
    return `${(years / 1e6).toFixed(1)}M years`;
  }
  if (years < 1e12) {
    return `${(years / 1e9).toFixed(1)}B years`;
  }
  return `${(years / 1e12).toFixed(1)}T years`;
}

// =============================================================================
// COMPONENT
// =============================================================================

interface TravelTimeCalculatorProps {
  /** Distance in light-years */
  distanceLy: number;
  /** Optional: compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Speed Race Visualization Component
 * Interactive animated bar race showing travel times at various speeds
 */
export function TravelTimeCalculator({ 
  distanceLy,
  compact = false,
}: TravelTimeCalculatorProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<string | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Calculate all travel times
  const speedData = useMemo(() => {
    return SPEED_REFERENCES.map((speed) => {
      const years = calculateTravelTimeYears(distanceLy, speed.speedKms);
      const withinLifetime = years <= HUMAN_LIFETIME_YEARS;
      return {
        ...speed,
        years,
        withinLifetime,
      };
    });
  }, [distanceLy]);

  // Find fastest that arrives within lifetime
  const fastestReachable = useMemo(() => {
    return speedData.find((s) => s.withinLifetime)?.key || null;
  }, [speedData]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !distanceLy) return;

    const width = containerRef.current.clientWidth;
    const height = compact ? 300 : 400;
    const margin = { top: 20, right: 120, bottom: 30, left: compact ? 100 : 140 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Use log scale for speed (since range is enormous)
    const maxSpeed = Math.max(...speedData.map((d) => d.speedKms));
    const minSpeed = Math.min(...speedData.map((d) => d.speedKms));

    const x = d3
      .scaleLog()
      .domain([minSpeed * 0.5, maxSpeed * 2])
      .range([0, innerWidth]);

    const y = d3
      .scaleBand()
      .domain(speedData.map((d) => d.key))
      .range([0, innerHeight])
      .padding(0.3);

    // Background track for each bar
    g.selectAll('.bar-track')
      .data(speedData)
      .join('rect')
      .attr('class', 'bar-track')
      .attr('x', 0)
      .attr('y', (d) => y(d.key) || 0)
      .attr('width', innerWidth)
      .attr('height', y.bandwidth())
      .attr('fill', 'rgba(255, 255, 255, 0.03)')
      .attr('rx', 4);

    // Speed bars with animation
    const bars = g
      .selectAll('.speed-bar')
      .data(speedData)
      .join('rect')
      .attr('class', 'speed-bar')
      .attr('x', 0)
      .attr('y', (d) => y(d.key) || 0)
      .attr('height', y.bandwidth())
      .attr('fill', (d) => d.color)
      .attr('rx', 4)
      .attr('opacity', 0.8)
      .attr('cursor', 'pointer')
      .attr('width', 0);

    // Animate bars growing
    if (!hasAnimated) {
      bars
        .transition()
        .duration(RACE_ANIMATION_DURATION)
        .delay((_, i) => i * 100)
        .ease(d3.easeCubicOut)
        .attr('width', (d) => x(d.speedKms))
        .on('end', () => setHasAnimated(true));
    } else {
      bars.attr('width', (d) => x(d.speedKms));
    }

    // Hover effects
    bars
      .on('mouseenter', function (_, d) {
        d3.select(this).attr('opacity', 1);
        setSelectedSpeed(d.key);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 0.8);
        setSelectedSpeed(null);
      });

    // Icons on the left
    g.selectAll('.speed-icon')
      .data(speedData)
      .join('text')
      .attr('class', 'speed-icon')
      .attr('x', -35)
      .attr('y', (d) => (y(d.key) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', compact ? '16px' : '20px')
      .text((d) => d.icon);

    // Labels on the left
    g.selectAll('.speed-label')
      .data(speedData)
      .join('text')
      .attr('class', 'speed-label')
      .attr('x', -45)
      .attr('y', (d) => (y(d.key) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', compact ? '9px' : '11px')
      .text((d) => t(`components.travelTime.speeds.${d.key}`));

    // Travel time labels on the right
    const timeLabels = g
      .selectAll('.time-label')
      .data(speedData)
      .join('text')
      .attr('class', 'time-label')
      .attr('y', (d) => (y(d.key) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-size', compact ? '9px' : '11px')
      .attr('font-family', 'monospace')
      .attr('opacity', 0);

    // Animate time labels appearing
    if (!hasAnimated) {
      timeLabels
        .transition()
        .duration(300)
        .delay((_, i) => RACE_ANIMATION_DURATION + i * 100)
        .attr('x', (d) => x(d.speedKms) + 8)
        .attr('opacity', 1)
        .text((d) => formatTravelTime(d.years));
    } else {
      timeLabels
        .attr('x', (d) => x(d.speedKms) + 8)
        .attr('opacity', 1)
        .text((d) => formatTravelTime(d.years));
    }

    // "Reachable in lifetime" indicator
    const reachableData = speedData.filter((d) => d.withinLifetime);
    if (reachableData.length > 0) {
      const firstReachable = reachableData[reachableData.length - 1];
      g.append('line')
        .attr('x1', x(firstReachable.speedKms))
        .attr('x2', x(firstReachable.speedKms))
        .attr('y1', -10)
        .attr('y2', innerHeight + 10)
        .attr('stroke', '#00ff88')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.6);

      g.append('text')
        .attr('x', x(firstReachable.speedKms))
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#00ff88')
        .attr('font-size', '10px')
        .text(t('components.travelTime.reachableInLifetime'));
    }

  }, [distanceLy, speedData, t, hasAnimated, compact]);

  // Get selected speed details
  const selectedData = selectedSpeed
    ? speedData.find((s) => s.key === selectedSpeed)
    : null;

  if (!distanceLy || distanceLy <= 0) {
    return (
      <div className="travel-time-section">
        <p className="travel-unreachable">
          {t('components.travelTime.unknownDistance')}
        </p>
      </div>
    );
  }

  return (
    <div className="travel-time-section">
      {/* Distance header */}
      <div className="travel-time-header">
        <div className="travel-time-distance">
          <span className="distance-value">{distanceLy.toFixed(1)}</span>
          <span className="distance-label">
            {t('components.travelTime.lightYearsAway')}
          </span>
        </div>
        {fastestReachable && (
          <div className="travel-time-reachable">
            <span className="reachable-icon">✓</span>
            <span>
              {t('components.travelTime.reachableAt', {
                speed: t(`components.travelTime.speeds.${fastestReachable}`),
              })}
            </span>
          </div>
        )}
      </div>

      {/* SVG Race visualization */}
      <div ref={containerRef} className="travel-time-chart">
        <svg ref={svgRef} />
      </div>

      {/* Selected speed details */}
      {selectedData && (
        <div className="travel-time-details">
          <div className="detail-icon">{selectedData.icon}</div>
          <div className="detail-info">
            <span className="detail-name">
              {t(`components.travelTime.speeds.${selectedData.key}`)}
            </span>
            <span className="detail-time">{formatTravelTime(selectedData.years)}</span>
          </div>
          <div className="detail-stats">
            <span className={`detail-badge ${selectedData.withinLifetime ? 'reachable' : ''}`}>
              {selectedData.withinLifetime 
                ? t('components.travelTime.withinLifetime')
                : t('components.travelTime.lifetimes', { 
                    count: Math.ceil(selectedData.years / HUMAN_LIFETIME_YEARS) 
                  })
              }
            </span>
          </div>
        </div>
      )}

      {/* Replay button */}
      <button
        className="travel-time-replay"
        onClick={() => setHasAnimated(false)}
      >
        🔄 {t('components.travelTime.replayRace')}
      </button>
    </div>
  );
}

export default TravelTimeCalculator;

