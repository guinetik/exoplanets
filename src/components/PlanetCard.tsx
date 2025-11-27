/**
 * Planet Card Component
 * Displays information about a single exoplanet in a card format
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../types';
import { getStarColorHex } from '../utils/astronomy';
import { nameToSlug } from '../utils/urlSlug';

interface PlanetCardProps {
  planet: Exoplanet;
}

export function PlanetCard({ planet }: PlanetCardProps) {
  const { t } = useTranslation();
  const starColorHex = getStarColorHex(planet.star_class);
  const starColorRgb = `rgb(${(starColorHex >> 16) & 255}, ${(starColorHex >> 8) & 255}, ${starColorHex & 255})`;

  return (
    <Link to={`/planets/${nameToSlug(planet.pl_name)}`} className="planet-card-link">
      <div className="planet-card">
        {/* Header with star color and planet name */}
        <div className="planet-card-header">
          <div
            className="planet-star-dot"
            style={{ backgroundColor: starColorRgb, boxShadow: `0 0 12px ${starColorRgb}` }}
          />
          <div className="planet-card-title-group">
            <h3 className="planet-card-name">{planet.pl_name}</h3>
            <p className="planet-card-host">{planet.hostname}</p>
          </div>
        </div>

        {/* Planet type badge */}
        {planet.planet_type && (
          <div className="planet-type-badge">
            {planet.planet_type}
          </div>
        )}

        {/* Planet properties grid */}
        <div className="planet-card-properties">
          {planet.pl_rade !== null && (
            <div className="planet-property">
              <span className="property-label">{t('pages.planetCard.properties.radius')}</span>
              <span className="property-value">{planet.pl_rade.toFixed(2)} R⊕</span>
            </div>
          )}

          {planet.pl_bmasse !== null && (
            <div className="planet-property">
              <span className="property-label">{t('pages.planetCard.properties.mass')}</span>
              <span className="property-value">{planet.pl_bmasse.toFixed(2)} M⊕</span>
            </div>
          )}

          {planet.pl_orbper !== null && (
            <div className="planet-property">
              <span className="property-label">{t('pages.planetCard.properties.period')}</span>
              <span className="property-value">{planet.pl_orbper.toFixed(2)} d</span>
            </div>
          )}

          {planet.pl_eqt !== null && (
            <div className="planet-property">
              <span className="property-label">{t('pages.planetCard.properties.temp')}</span>
              <span className="property-value">{Math.round(planet.pl_eqt)} K</span>
            </div>
          )}

          {planet.distance_ly !== null && (
            <div className="planet-property">
              <span className="property-label">{t('pages.planetCard.properties.distance')}</span>
              <span className="property-value">
                {planet.distance_ly < 1000
                  ? `${planet.distance_ly.toFixed(1)} ly`
                  : `${(planet.distance_ly / 1000).toFixed(1)} kly`}
              </span>
            </div>
          )}

          {planet.disc_year && (
            <div className="planet-property">
              <span className="property-label">{t('pages.planetCard.properties.discovered')}</span>
              <span className="property-value">{planet.disc_year}</span>
            </div>
          )}
        </div>

        {/* Flags */}
        <div className="planet-card-flags">
          {planet.is_habitable_zone && (
            <span className="flag-badge flag-habitable">{t('pages.planetCard.flags.habitableZone')}</span>
          )}
          {planet.is_earth_like && (
            <span className="flag-badge flag-earth-like">{t('pages.planetCard.flags.earthLike')}</span>
          )}
          {planet.cb_flag === 1 && (
            <span className="flag-badge flag-circumbinary">{t('pages.planetCard.flags.circumbinary')}</span>
          )}
        </div>

        {/* Footer hint */}
        <div className="planet-card-footer">
          <span className="planet-card-link-hint">{t('pages.planetCard.viewDetails')}</span>
        </div>
      </div>
    </Link>
  );
}
