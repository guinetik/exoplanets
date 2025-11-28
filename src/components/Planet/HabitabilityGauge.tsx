/**
 * HabitabilityGauge Component
 * Circular gauge showing habitability score with breakdown
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';

/**
 * Calculates the breakdown of the habitability score
 * Score components (mirroring process_exoplanets.py logic):
 * - Temperature: max 40 points (peak at Earth's ~255K)
 * - Size: max 30 points (peak at 0.8-1.5 R⊕)
 * - Star type: max 20 points (G=20, K=18, F=15, M=12)
 * - Insolation: max 10 points (bonus for Earth-like values)
 */
function calculateScoreBreakdown(planet: Exoplanet): {
  temperature: number;
  size: number;
  starType: number;
  insolation: number;
} {
  // Temperature score (max 40)
  let tempScore = 0;
  if (planet.pl_eqt) {
    const temp = planet.pl_eqt;
    // Peak at 255K (Earth's equilibrium temp)
    if (temp >= 200 && temp <= 320) {
      // In habitable range
      const deviation = Math.abs(temp - 255);
      tempScore = Math.max(0, 40 - deviation * 0.5);
    } else if (temp < 200) {
      // Too cold
      tempScore = Math.max(0, 20 - (200 - temp) * 0.2);
    } else {
      // Too hot
      tempScore = Math.max(0, 20 - (temp - 320) * 0.1);
    }
  }

  // Size score (max 30)
  let sizeScore = 0;
  if (planet.pl_rade) {
    const radius = planet.pl_rade;
    if (radius >= 0.8 && radius <= 1.5) {
      // Optimal Earth-like size
      sizeScore = 30;
    } else if (radius >= 0.5 && radius <= 2.0) {
      // Good range
      sizeScore = 25;
    } else if (radius >= 0.3 && radius <= 2.5) {
      // Acceptable
      sizeScore = 15;
    } else if (radius <= 4.0) {
      // Sub-Neptune range
      sizeScore = 8;
    } else {
      // Gas giant or very small
      sizeScore = 2;
    }
  }

  // Star type score (max 20)
  let starScore = 0;
  switch (planet.star_class) {
    case 'G':
      starScore = 20;
      break;
    case 'K':
      starScore = 18;
      break;
    case 'F':
      starScore = 15;
      break;
    case 'M':
      starScore = 12;
      break;
    case 'A':
      starScore = 8;
      break;
    default:
      starScore = 5;
  }

  // Insolation score (max 10)
  let insolScore = 0;
  if (planet.pl_insol) {
    const insol = planet.pl_insol;
    if (insol >= 0.5 && insol <= 2.0) {
      // Earth-like insolation
      insolScore = 10;
    } else if (insol >= 0.25 && insol <= 4.0) {
      // Acceptable range
      insolScore = 6;
    } else {
      insolScore = 2;
    }
  }

  return {
    temperature: Math.round(tempScore),
    size: Math.round(sizeScore),
    starType: starScore,
    insolation: insolScore,
  };
}

/**
 * Gets the color for a given score
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#00ff88';
  if (score >= 60) return '#88ff00';
  if (score >= 40) return '#ffcc00';
  if (score >= 20) return '#ff8800';
  return '#ff4444';
}

/**
 * Gets the habitability tier label
 * Also considers extreme temperature deal-breakers
 */
function getHabitabilityTier(score: number, planet?: Exoplanet): string {
  // DEAL-BREAKERS: Extreme temperatures override score
  if (planet?.pl_eqt) {
    // Too hot - metals vaporize, no life possible
    if (planet.pl_eqt > 800) return 'uninhabitable';
    // Too cold - colder than Pluto
    if (planet.pl_eqt < 50) return 'uninhabitable';
  }
  
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low';
  return 'minimal';
}

interface HabitabilityGaugeProps {
  /** Planet data */
  planet: Exoplanet;
}

/**
 * Circular gauge component showing habitability score
 * with animated fill and breakdown details
 */
export function HabitabilityGauge({ planet }: HabitabilityGaugeProps) {
  const { t } = useTranslation();

  const score = planet.habitability_score || 0;
  const breakdown = useMemo(() => calculateScoreBreakdown(planet), [planet]);
  const scoreColor = getScoreColor(score);
  const tier = getHabitabilityTier(score);

  // SVG gauge parameters
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  // Breakdown items
  const breakdownItems = [
    {
      key: 'temperature',
      label: t('pages.planet.habitability.temperature'),
      value: breakdown.temperature,
      max: 40,
      color: '#ff6b6b',
    },
    {
      key: 'size',
      label: t('pages.planet.habitability.size'),
      value: breakdown.size,
      max: 30,
      color: '#4ecdc4',
    },
    {
      key: 'starType',
      label: t('pages.planet.habitability.starType'),
      value: breakdown.starType,
      max: 20,
      color: '#ffe66d',
    },
    {
      key: 'insolation',
      label: t('pages.planet.habitability.insolation'),
      value: breakdown.insolation,
      max: 10,
      color: '#a8e6cf',
    },
  ];

  return (
    <div className="habitability-gauge">
      {/* Circular gauge */}
      <div className="gauge-container">
        <svg
          className="gauge-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            className="gauge-background"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            className="gauge-progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease',
              filter: `drop-shadow(0 0 6px ${scoreColor}80)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="gauge-center">
          <span className="gauge-score" style={{ color: scoreColor }}>
            {score.toFixed(0)}
          </span>
          <span className="gauge-label">/100</span>
        </div>
      </div>

      {/* Tier label */}
      <div className="gauge-tier" style={{ color: scoreColor }}>
        {t(`pages.planet.habitability.tiers.${tier}`)}
      </div>

      {/* Breakdown bars */}
      <div className="habitability-breakdown">
        <h4 className="breakdown-title">
          {t('pages.planet.habitability.breakdown')}
        </h4>
        {breakdownItems.map((item) => (
          <div key={item.key} className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-label">{item.label}</span>
              <span className="breakdown-value">
                {item.value}/{item.max}
              </span>
            </div>
            <div className="breakdown-bar-track">
              <div
                className="breakdown-bar-fill"
                style={{
                  width: `${(item.value / item.max) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Key indicators */}
      <div className="habitability-indicators">
        {planet.is_habitable_zone && (
          <span className="indicator positive">
            ✓ {t('pages.planet.habitability.inHabitableZone')}
          </span>
        )}
        {planet.is_earth_like && (
          <span className="indicator positive">
            ✓ {t('pages.planet.habitability.earthLikeSize')}
          </span>
        )}
        {planet.is_potentially_rocky && (
          <span className="indicator positive">
            ✓ {t('pages.planet.habitability.potentiallyRocky')}
          </span>
        )}
        {planet.is_top_habitable_candidate && (
          <span className="indicator highlight">
            ★ {t('pages.planet.habitability.topCandidate')}
          </span>
        )}
      </div>
    </div>
  );
}

export default HabitabilityGauge;

