/**
 * SiblingPlanets Component
 * Shows other planets in the same system
 * with mini cards linking to their pages
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../../types';
import { nameToSlug } from '../../utils/urlSlug';
import { PlanetThumbnail } from '../CelestialBodyThumbnail';

/**
 * Gets a brief description based on planet type and characteristics
 */
function getPlanetBrief(planet: Exoplanet, t: (key: string) => string): string {
  if (planet.is_earth_like && planet.is_habitable_zone) {
    return t('pages.planet.siblings.earthLikeHabitable');
  }
  if (planet.is_habitable_zone) {
    return t('pages.planet.siblings.habitable');
  }
  if (planet.is_hot_jupiter) {
    return t('pages.planet.siblings.hotJupiter');
  }
  if (planet.is_frozen_world) {
    return t('pages.planet.siblings.frozen');
  }
  return planet.planet_type || t('pages.planet.siblings.exoplanet');
}

interface SiblingPlanetsProps {
  /** Current planet (to exclude from list) */
  currentPlanet: Exoplanet;
  /** All planets in the system */
  siblings: Exoplanet[];
}

/**
 * Displays sibling planets in the same system
 * with thumbnails and key stats
 */
export function SiblingPlanets({
  currentPlanet,
  siblings,
}: SiblingPlanetsProps) {
  const { t } = useTranslation();

  // Filter out current planet
  const otherPlanets = siblings.filter(
    (p) => p.pl_name !== currentPlanet.pl_name
  );

  // Don't render if no siblings
  if (otherPlanets.length === 0) {
    return null;
  }

  // Sort by orbital distance
  const sortedPlanets = [...otherPlanets].sort(
    (a, b) => (a.pl_orbsmax || 999) - (b.pl_orbsmax || 999)
  );

  return (
    <div className="sibling-planets-section">
      <h3 className="sibling-planets-title">
        {t('pages.planet.siblings.title', { system: currentPlanet.hostname })}
      </h3>
      <p className="sibling-planets-subtitle">
        {t('pages.planet.siblings.count', { count: otherPlanets.length })}
      </p>

      <div className="sibling-planets-grid">
        {sortedPlanets.map((planet) => (
          <Link
            key={planet.pl_name}
            to={`/planets/${nameToSlug(planet.pl_name)}`}
            className="sibling-planet-card"
          >
            {/* Thumbnail */}
            <div className="sibling-thumbnail">
              <PlanetThumbnail
                planet={planet}
                size={64}
              />
            </div>

            {/* Info */}
            <div className="sibling-info">
              <span className="sibling-name">
                {planet.pl_name.replace(currentPlanet.hostname, '').trim() || planet.pl_letter || planet.pl_name}
              </span>
              <span className="sibling-type">
                {getPlanetBrief(planet, t)}
              </span>
            </div>

            {/* Quick stats */}
            <div className="sibling-stats">
              {planet.pl_rade && (
                <div className="sibling-stat">
                  <span className="stat-value">{planet.pl_rade.toFixed(1)}</span>
                  <span className="stat-unit">R⊕</span>
                </div>
              )}
              {planet.pl_eqt && (
                <div className="sibling-stat">
                  <span className="stat-value">{planet.pl_eqt.toFixed(0)}</span>
                  <span className="stat-unit">K</span>
                </div>
              )}
              {planet.pl_orbsmax && (
                <div className="sibling-stat">
                  <span className="stat-value">{planet.pl_orbsmax.toFixed(2)}</span>
                  <span className="stat-unit">AU</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="sibling-badges">
              {planet.is_habitable_zone && (
                <span className="sibling-badge habitable">HZ</span>
              )}
              {planet.is_earth_like && (
                <span className="sibling-badge earth-like">🌍</span>
              )}
              {planet.is_hot_jupiter && (
                <span className="sibling-badge hot">🔥</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SiblingPlanets;

