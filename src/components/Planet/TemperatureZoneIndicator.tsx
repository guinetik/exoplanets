/**
 * TemperatureZoneIndicator Component
 * Visual temperature scale showing planet's position
 * relative to habitable zone boundaries
 */

import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';
import { calculateEquilibriumTemp } from '../../utils/math/planet';

// Temperature zone boundaries (Kelvin)
const TEMP_ZONES = {
  SCORCHING: 1500, // Ultra hot
  HOT: 500, // Hot
  WARM: 320, // Upper habitable
  HABITABLE_UPPER: 320,
  HABITABLE_LOWER: 200,
  COOL: 200, // Lower habitable
  COLD: 150, // Cold
  FROZEN: 100, // Frozen
};

// Reference temperatures
const REFERENCE_TEMPS = {
  VENUS: 737, // Surface temp (runaway greenhouse)
  EARTH: 255, // Equilibrium temp
  MARS: 210, // Equilibrium temp
  MERCURY: 440, // Average
};

/**
 * Gets the zone classification for a temperature
 */
function getTemperatureZone(temp: number | null): {
  zone: string;
  color: string;
  description: string;
} {
  if (temp === null) {
    return {
      zone: 'unknown',
      color: '#666666',
      description: 'Temperature unknown',
    };
  }

  if (temp > TEMP_ZONES.SCORCHING) {
    return {
      zone: 'scorching',
      color: '#ff2200',
      description: 'Extreme heat - metals may vaporize',
    };
  }
  if (temp > TEMP_ZONES.HOT) {
    return {
      zone: 'hot',
      color: '#ff6600',
      description: 'Very hot - surface would be molten',
    };
  }
  if (temp > TEMP_ZONES.WARM) {
    return {
      zone: 'warm',
      color: '#ffaa00',
      description: 'Too warm for liquid water',
    };
  }
  if (temp >= TEMP_ZONES.HABITABLE_LOWER) {
    return {
      zone: 'habitable',
      color: '#00ff88',
      description: 'Potential for liquid water',
    };
  }
  if (temp >= TEMP_ZONES.COLD) {
    return {
      zone: 'cool',
      color: '#00ccff',
      description: 'Cool - water would be frozen',
    };
  }
  if (temp >= TEMP_ZONES.FROZEN) {
    return {
      zone: 'cold',
      color: '#0088ff',
      description: 'Cold - likely frozen surface',
    };
  }
  return {
    zone: 'frozen',
    color: '#4444ff',
    description: 'Extreme cold - cryogenic conditions',
  };
}

/**
 * Calculates the position on the temperature scale (0-100%)
 * Uses logarithmic scale for better visualization
 */
function calculatePosition(temp: number): number {
  const minTemp = 50;
  const maxTemp = 2000;
  // Clamp temperature
  const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temp));
  // Use log scale for better distribution
  const logMin = Math.log(minTemp);
  const logMax = Math.log(maxTemp);
  const logTemp = Math.log(clampedTemp);
  return ((logTemp - logMin) / (logMax - logMin)) * 100;
}

interface TemperatureZoneIndicatorProps {
  /** Planet data */
  planet: Exoplanet;
}

/**
 * Visual temperature scale with planet position marker
 * and reference points for Earth, Venus, Mars
 */
export function TemperatureZoneIndicator({
  planet,
}: TemperatureZoneIndicatorProps) {
  const { t } = useTranslation();

  // Use NASA data if available, otherwise calculate approximation
  const nasaTemp = planet.pl_eqt;
  const calculatedTempObj = nasaTemp ? null : calculateEquilibriumTemp(
    planet.st_teff ?? null,
    planet.st_rad ?? null,
    planet.pl_orbsmax ?? null
  );
  const temp: number | null = nasaTemp || calculatedTempObj?.temperatureK || null;
  const isApproximate = !nasaTemp && calculatedTempObj !== null;

  const zoneInfo = getTemperatureZone(temp);
  const position = temp ? calculatePosition(temp) : 50;

  // Reference positions
  const references = [
    {
      name: 'Venus',
      temp: REFERENCE_TEMPS.VENUS,
      position: calculatePosition(REFERENCE_TEMPS.VENUS),
      emoji: '🪐',
    },
    {
      name: 'Earth',
      temp: REFERENCE_TEMPS.EARTH,
      position: calculatePosition(REFERENCE_TEMPS.EARTH),
      emoji: '🌍',
    },
    {
      name: 'Mars',
      temp: REFERENCE_TEMPS.MARS,
      position: calculatePosition(REFERENCE_TEMPS.MARS),
      emoji: '🔴',
    },
  ];

  // Habitable zone boundaries as positions
  const hzStart = calculatePosition(TEMP_ZONES.HABITABLE_LOWER);
  const hzEnd = calculatePosition(TEMP_ZONES.HABITABLE_UPPER);

  return (
    <div className="temperature-zone-indicator">
      <h4 className="temp-zone-title">
        {t('pages.planet.temperature.title')}
      </h4>

      {/* Temperature value display */}
      <div className="temp-value-display">
        {temp ? (
          <>
            <span className="temp-value" style={{ color: zoneInfo.color }}>
              {temp.toFixed(0)} K
            </span>
            <span className="temp-celsius">
              ({(temp - 273.15).toFixed(0)}°C)
            </span>
            {isApproximate && (
              <span className="temp-approximate" title="Calculated using Stefan-Boltzmann law from stellar and orbital parameters">
                {' '}~
              </span>
            )}
          </>
        ) : (
          <span className="temp-unknown">
            {t('pages.planet.temperature.unknown')}
          </span>
        )}
      </div>

      {/* Zone label */}
      <div className="temp-zone-label" style={{ color: zoneInfo.color }}>
        {t(`pages.planet.temperature.zones.${zoneInfo.zone}`)}
      </div>

      {/* Visual scale */}
      <div className="temp-scale-container">
        {/* Gradient bar */}
        <div className="temp-scale-bar">
          {/* Habitable zone highlight */}
          <div
            className="temp-habitable-zone"
            style={{
              left: `${hzStart}%`,
              width: `${hzEnd - hzStart}%`,
            }}
          />

          {/* Zone gradient overlay */}
          <div className="temp-scale-gradient" />

          {/* Reference markers */}
          {references.map((ref) => (
            <div
              key={ref.name}
              className="temp-reference-marker"
              style={{ left: `${ref.position}%` }}
              title={`${ref.name}: ${ref.temp}K`}
            >
              <span className="reference-emoji">{ref.emoji}</span>
              <span className="reference-line" />
            </div>
          ))}

          {/* Planet marker */}
          {temp && (
            <div
              className="temp-planet-marker"
              style={{
                left: `${position}%`,
                borderColor: zoneInfo.color,
              }}
            >
              <div
                className="marker-dot"
                style={{ backgroundColor: zoneInfo.color }}
              />
              <div className="marker-label">{planet.pl_letter || '●'}</div>
            </div>
          )}
        </div>

        {/* Scale labels */}
        <div className="temp-scale-labels">
          <span className="scale-label cold">
            {t('pages.planet.temperature.frozen')}
          </span>
          <span className="scale-label habitable">
            {t('pages.planet.temperature.habitable')}
          </span>
          <span className="scale-label hot">
            {t('pages.planet.temperature.scorching')}
          </span>
        </div>
      </div>

      {/* Zone description */}
      <p className="temp-zone-description">
        {t(`pages.planet.temperature.descriptions.${zoneInfo.zone}`)}
      </p>

      {/* Approximation notice */}
      {isApproximate && (
        <p className="temp-approximation-notice">
          ⓘ Temperature estimated using Stefan-Boltzmann law (T = T★ × √(R★/2a)) from stellar temperature, radius, and orbital distance. NASA data not available.
        </p>
      )}

      {/* Legend */}
      <div className="temp-legend">
        <div className="legend-item">
          <span className="legend-marker earth">🌍</span>
          <span className="legend-text">Earth (255K)</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker habitable-zone" />
          <span className="legend-text">
            {t('pages.planet.temperature.habitableZone')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TemperatureZoneIndicator;

