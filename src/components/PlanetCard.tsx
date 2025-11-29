/**
 * Planet Card Component
 * Displays information about a single exoplanet in a card format
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Exoplanet } from '../types';
import { nameToSlug } from '../utils/urlSlug';
import { PlanetThumbnail } from './CelestialBodyThumbnail';

interface PlanetCardProps {
  planet: Exoplanet & { tourDescription?: string };
}

export function PlanetCard({ planet }: PlanetCardProps) {
  const { t } = useTranslation();

  return (
    <Link to={`/planets/${nameToSlug(planet.pl_name)}`} className="planet-card-link">
      <div className="planet-card">
        {/* Planet visualization thumbnail */}
        <div className="planet-card-visualization">
          <PlanetThumbnail planet={planet} size={80} />
        </div>

        {/* Header */}
        <div className="planet-card-header">
          <div className="planet-card-title-group">
            <h3 className="planet-card-name">{planet.pl_name}</h3>
            <p className="planet-card-host">{planet.hostname}</p>
          </div>
          {planet.planet_type && (
            <div className="planet-type-badge">
              {planet.planet_type}
            </div>
          )}
        </div>

        {/* Tour description (if available) */}
        {planet.tourDescription && (
          <p className="planet-card-description">{planet.tourDescription}</p>
        )}

        {/* Planet properties grid */}
        <div className="planet-card-properties">
          {planet.pl_rade !== null && (
            <div className="planet-card-property">
              <span className="planet-card-property-label">{t('pages.planetCard.properties.radius')}</span>
              <span className="planet-card-property-value">{planet.pl_rade.toFixed(2)} R⊕</span>
            </div>
          )}

          {planet.pl_bmasse !== null && (
            <div className="planet-card-property">
              <span className="planet-card-property-label">{t('pages.planetCard.properties.mass')}</span>
              <span className="planet-card-property-value">{planet.pl_bmasse.toFixed(2)} M⊕</span>
            </div>
          )}

          {planet.pl_orbper !== null && (
            <div className="planet-card-property">
              <span className="planet-card-property-label">{t('pages.planetCard.properties.period')}</span>
              <span className="planet-card-property-value">{planet.pl_orbper.toFixed(2)} d</span>
            </div>
          )}

          {planet.distance_ly !== null && (
            <div className="planet-card-property">
              <span className="planet-card-property-label">{t('pages.planetCard.properties.distance')}</span>
              <span className="planet-card-property-value">
                {planet.distance_ly < 1000
                  ? `${planet.distance_ly.toFixed(1)} ly`
                  : `${(planet.distance_ly / 1000).toFixed(1)} kly`}
              </span>
            </div>
          )}

          {planet.disc_year && (
            <div className="planet-card-property">
              <span className="planet-card-property-label">{t('pages.planetCard.properties.discovered')}</span>
              <span className="planet-card-property-value">{planet.disc_year}</span>
            </div>
          )}
        </div>

        {/* Flags */}
        <div className="planet-card-flags">
          {/* Habitability flags */}
          {planet.is_habitable_zone && (
            <span className="flag-badge flag-habitable">{t('pages.planetCard.flags.habitableZone')}</span>
          )}
          {planet.is_earth_like && (
            <span className="flag-badge flag-earth-like">{t('pages.planetCard.flags.earthLike')}</span>
          )}
          {planet.is_top_habitable_candidate && (
            <span className="flag-badge flag-top-candidate">{t('pages.planetCard.flags.topCandidate')}</span>
          )}
          {planet.is_potentially_rocky && (
            <span className="flag-badge flag-rocky">{t('pages.planetCard.flags.potentiallyRocky')}</span>
          )}
          
          {/* Extreme world flags */}
          {planet.is_hot_jupiter && (
            <span className="flag-badge flag-hot-jupiter">{t('pages.planetCard.flags.hotJupiter')}</span>
          )}
          {planet.is_hot_neptune && (
            <span className="flag-badge flag-hot-neptune">{t('pages.planetCard.flags.hotNeptune')}</span>
          )}
          {planet.is_ultra_hot && (
            <span className="flag-badge flag-ultra-hot">{t('pages.planetCard.flags.ultraHot')}</span>
          )}
          {planet.is_frozen_world && (
            <span className="flag-badge flag-frozen">{t('pages.planetCard.flags.frozenWorld')}</span>
          )}
          {planet.is_ultra_dense && (
            <span className="flag-badge flag-ultra-dense">{t('pages.planetCard.flags.ultraDense')}</span>
          )}
          {planet.is_puffy && (
            <span className="flag-badge flag-puffy">{t('pages.planetCard.flags.puffy')}</span>
          )}
          
          {/* Orbital flags */}
          {planet.is_ultra_short_period && (
            <span className="flag-badge flag-ultra-short">{t('pages.planetCard.flags.ultraShortPeriod')}</span>
          )}
          {planet.is_eccentric_orbit && (
            <span className="flag-badge flag-eccentric">{t('pages.planetCard.flags.eccentricOrbit')}</span>
          )}
          {planet.is_likely_tidally_locked && (
            <span className="flag-badge flag-tidally-locked">{t('pages.planetCard.flags.tidallyLocked')}</span>
          )}
          
          {/* System flags */}
          {planet.cb_flag === 1 && (
            <span className="flag-badge flag-circumbinary">{t('pages.planetCard.flags.circumbinary')}</span>
          )}
          {planet.is_rich_system && (
            <span className="flag-badge flag-rich-system">{t('pages.planetCard.flags.richSystem')}</span>
          )}
          
          {/* Proximity flags */}
          {planet.is_very_nearby && (
            <span className="flag-badge flag-very-nearby">{t('pages.planetCard.flags.veryNearby')}</span>
          )}
          
          {/* Star flags */}
          {planet.is_solar_analog && (
            <span className="flag-badge flag-solar-analog">{t('pages.planetCard.flags.solarAnalog')}</span>
          )}
          {planet.is_red_dwarf_host && (
            <span className="flag-badge flag-red-dwarf">{t('pages.planetCard.flags.redDwarfHost')}</span>
          )}
          
          {/* Detection flags */}
          {planet.has_rv_data && (
            <span className="flag-badge flag-rv-data">{t('pages.planetCard.flags.hasRvData')}</span>
          )}
          {planet.is_controversial && (
            <span className="flag-badge flag-controversial">{t('pages.planetCard.flags.controversial')}</span>
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
