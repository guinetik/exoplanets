/**
 * TravelTimeCalculator Component
 * SVG visualization showing spacecraft racing from Earth to a target planet
 * along curved paths at different speeds
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// =============================================================================
// CONSTANTS
// =============================================================================

/** One light year in kilometers */
const LIGHT_YEAR_KM = 9.461e12;

/** Human lifetime in years */
const HUMAN_LIFETIME_YEARS = 80;

/** Seconds per year */
const SECONDS_PER_YEAR = 31557600;

/** Animation settings */
const ANIMATION = {
  BASE_DURATION: 2, // seconds for fastest (light speed)
  MAX_DURATION: 8,  // seconds cap for slowest
};

/** Spacecraft data */
interface Spacecraft {
  id: string;
  icon: string;
  speedKms: number;
  color: string;
}

const SPACECRAFT: Spacecraft[] = [
  { id: 'starship', icon: 'bfr', speedKms: 7.6, color: '#ff6b6b' },         // Mach 25 (~17,000 mph)
  { id: 'shuttle', icon: 'shuttle', speedKms: 7.8, color: '#ff8c6b' },      // Orbital velocity
  { id: 'saturnV', icon: 'saturn9', speedKms: 11.2, color: '#ffa06b' },     // Escape velocity
  { id: 'falconHeavy', icon: 'falcon-heavy', speedKms: 11.2, color: '#ffb86b' },
  { id: 'newHorizons', icon: 'new-horizons', speedKms: 16.26, color: '#ffd06b' },
  { id: 'voyager', icon: 'voyager', speedKms: 17, color: '#ffcc00' },
  { id: 'parkerProbe', icon: 'parker', speedKms: 192, color: '#00ccff' },
  { id: 'solarSail', icon: 'solar', speedKms: 2998, color: '#00ffcc' },     // 1% light speed
  { id: 'enterprise', icon: 'enterprise', speedKms: 299792, color: '#00ff88' },
];

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Calculates travel time in years for a given distance and speed
 */
function calculateTravelTimeYears(distanceLy: number, speedKms: number): number {
  const distanceKm = distanceLy * LIGHT_YEAR_KM;
  const travelTimeSeconds = distanceKm / speedKms;
  return travelTimeSeconds / SECONDS_PER_YEAR;
}

/**
 * Formats large numbers with appropriate suffixes
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

/**
 * Calculates arc height based on spacecraft index
 */
function getArcHeight(index: number, total: number): number {
  const arcFactor = 1 - index / (total - 1); // 1 for slowest, 0 for fastest
  const maxArcHeight = 80;
  const minArcHeight = 15;
  return minArcHeight + arcFactor * (maxArcHeight - minArcHeight);
}

/**
 * Generates a quadratic bezier curve path from Earth to Planet
 * Slower spacecraft = higher arc
 */
function generateCurvePath(
  index: number,
  total: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const arcHeight = getArcHeight(index, total);
  const controlX = (startX + endX) / 2;
  const controlY = startY - arcHeight;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}

/**
 * Gets a point on a quadratic bezier curve at parameter t (0-1)
 */
function getPointOnCurve(
  t: number,
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number
): { x: number; y: number } {
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * controlX + t * t * endX,
    y: oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * controlY + t * t * endY,
  };
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
 * Travel Time Visualization Component
 * Shows spacecraft racing along curved paths from Earth to a target planet
 */
/** Spacecraft info for the detail dialog */
interface SpacecraftInfo {
  id: string;
  icon: string;
  speedKms: number;
  color: string;
  years: number;
  withinLifetime: boolean;
}

/**
 * Spacecraft Info Dialog Component
 */
function SpacecraftInfoDialog({
  spacecraft,
  onClose,
  t,
}: {
  spacecraft: SpacecraftInfo;
  onClose: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const speedMph = (spacecraft.speedKms * 2236.94).toFixed(0);
  const speedPercentLight = ((spacecraft.speedKms / 299792) * 100).toFixed(
    spacecraft.speedKms >= 2998 ? 0 : 6
  );

  return createPortal(
    <div className="property-dialog-overlay" onClick={onClose}>
      <div className="property-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          className="property-dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          &times;
        </button>

        <div className="spacecraft-dialog-header">
          <img
            src={`/icons/${spacecraft.icon}.svg`}
            alt={spacecraft.id}
            className="spacecraft-dialog-icon"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h3 className="property-dialog-title">
            {t(`components.travelTime.speeds.${spacecraft.id}`)}
          </h3>
        </div>

        <div className="property-dialog-content">
          <p className="property-dialog-description">
            {t(`components.travelTime.spacecraft.${spacecraft.id}.description`)}
          </p>

          <div className="spacecraft-stats">
            <div className="spacecraft-stat">
              <span className="stat-label">{t('components.travelTime.speedLabel')}</span>
              <span className="stat-value" style={{ color: spacecraft.color }}>
                {spacecraft.speedKms.toLocaleString()} km/s
              </span>
              <span className="stat-secondary">
                ({Number(speedMph).toLocaleString()} mph)
              </span>
            </div>
            <div className="spacecraft-stat">
              <span className="stat-label">{t('components.travelTime.percentLight')}</span>
              <span className="stat-value" style={{ color: spacecraft.color }}>
                {speedPercentLight}%
              </span>
            </div>
            <div className="spacecraft-stat">
              <span className="stat-label">{t('components.travelTime.travelTimeLabel')}</span>
              <span className="stat-value" style={{ color: spacecraft.color }}>
                {formatTravelTime(spacecraft.years)}
              </span>
              {spacecraft.withinLifetime && (
                <span className="stat-reachable">
                  ✓ {t('components.travelTime.withinLifetime')}
                </span>
              )}
            </div>
          </div>

          <div className="property-dialog-fun-fact">
            {t(`components.travelTime.spacecraft.${spacecraft.id}.funFact`)}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function TravelTimeCalculator({
  distanceLy,
  compact = false,
}: TravelTimeCalculatorProps) {
  const { t } = useTranslation();
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedSpacecraft, setSelectedSpacecraft] = useState<SpacecraftInfo | null>(null);

  // Calculate travel data for each spacecraft
  const spacecraftData = useMemo(() => {
    const maxSpeed = Math.max(...SPACECRAFT.map(s => s.speedKms));

    return SPACECRAFT.map((craft, index) => {
      const years = calculateTravelTimeYears(distanceLy, craft.speedKms);
      const withinLifetime = years <= HUMAN_LIFETIME_YEARS;

      // Animation duration: faster craft = shorter duration
      const speedRatio = craft.speedKms / maxSpeed;
      const duration = ANIMATION.BASE_DURATION + (1 - speedRatio) * (ANIMATION.MAX_DURATION - ANIMATION.BASE_DURATION);

      return {
        ...craft,
        index,
        years,
        withinLifetime,
        duration,
      };
    });
  }, [distanceLy]);

  // Find fastest that arrives within lifetime
  const fastestReachable = useMemo(() => {
    return spacecraftData.find((s) => s.withinLifetime)?.id || null;
  }, [spacecraftData]);

  // Handle animation end
  useEffect(() => {
    if (isAnimating) {
      const maxDuration = Math.max(...spacecraftData.map(s => s.duration));
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, maxDuration * 1000 + 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, spacecraftData, animationKey]);

  // Replay race
  const handleReplay = useCallback(() => {
    setAnimationKey(prev => prev + 1);
    setIsAnimating(true);
  }, []);

  // SVG dimensions
  const svgWidth = 400;
  const svgHeight = compact ? 160 : 200;
  const startX = 50;
  const endX = svgWidth - 50;
  const centerY = svgHeight - 50;

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
      <div className="travel-viz-container">
        <svg
          key={animationKey}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="travel-viz"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Curved paths only */}
          {spacecraftData.map((craft) => {
            const path = generateCurvePath(
              craft.index,
              spacecraftData.length,
              startX,
              centerY,
              endX,
              centerY
            );

            return (
              <path
                key={craft.id}
                d={path}
                fill="none"
                stroke={craft.color}
                strokeWidth={2}
                strokeOpacity={0.3}
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Earth */}
          <text
            x={startX}
            y={centerY}
            fontSize={compact ? 24 : 32}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            🌍
          </text>
          <text
            x={startX}
            y={centerY + 25}
            fill="rgba(255,255,255,0.6)"
            fontSize={compact ? 10 : 12}
            textAnchor="middle"
          >
            {t('components.travelTime.earth')}
          </text>

          {/* Target Planet */}
          <text
            x={endX}
            y={centerY}
            fontSize={compact ? 24 : 32}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            🪐
          </text>
          <text
            x={endX}
            y={centerY + 25}
            fill="rgba(255,255,255,0.6)"
            fontSize={compact ? 10 : 12}
            textAnchor="middle"
          >
            {t('components.travelTime.planet')}
          </text>

          {/* Spacecraft - rendered last to appear on top */}
          {spacecraftData.map((craft) => {
            const arcHeight = getArcHeight(craft.index, spacecraftData.length);
            const controlX = (startX + endX) / 2;
            const controlY = centerY - arcHeight;
            const path = generateCurvePath(
              craft.index,
              spacecraftData.length,
              startX,
              centerY,
              endX,
              centerY
            );

            // Calculate final position - evenly distributed ranking from slowest to fastest
            // Position 0.1 (just after Earth) to 0.9 (just before Planet)
            const totalCraft = spacecraftData.length;
            const normalizedRatio = 0.1 + 0.8 * (craft.index / (totalCraft - 1));
            const finalPos = getPointOnCurve(
              normalizedRatio,
              startX,
              centerY,
              controlX,
              controlY,
              endX,
              centerY
            );

            const iconSize = compact ? 20 : 24;

            return isAnimating ? (
              <image
                key={craft.id}
                href={`/icons/${craft.icon}.svg`}
                width={iconSize}
                height={iconSize}
                className="craft-icon"
                style={{ filter: 'brightness(0) invert(1)' }}
              >
                <animateMotion
                  dur={`${craft.duration}s`}
                  repeatCount="1"
                  fill="freeze"
                  path={path}
                />
              </image>
            ) : (
              <image
                key={craft.id}
                href={`/icons/${craft.icon}.svg`}
                x={finalPos.x - iconSize / 2}
                y={finalPos.y - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="craft-icon"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="travel-legend">
        {spacecraftData.map((craft) => (
          <button
            key={craft.id}
            className={`travel-legend-item clickable ${craft.withinLifetime ? 'reachable' : ''}`}
            onClick={() => setSelectedSpacecraft(craft)}
            type="button"
          >
            <img
              src={`/icons/${craft.icon}.svg`}
              alt={craft.id}
              className="legend-icon"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="legend-name">
              {t(`components.travelTime.speeds.${craft.id}`)}
            </span>
            <span className="legend-time" style={{ color: craft.color }}>
              {formatTravelTime(craft.years)}
            </span>
          </button>
        ))}
      </div>

      {/* Replay button */}
      <button
        className="travel-time-replay"
        onClick={handleReplay}
        disabled={isAnimating}
      >
        🔄 {t('components.travelTime.replayRace')}
      </button>

      {/* Spacecraft info dialog */}
      {selectedSpacecraft && (
        <SpacecraftInfoDialog
          spacecraft={selectedSpacecraft}
          onClose={() => setSelectedSpacecraft(null)}
          t={t}
        />
      )}
    </div>
  );
}

export default TravelTimeCalculator;
