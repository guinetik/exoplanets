import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Star } from '../types';
import { nameToSlug } from '../utils/urlSlug';
import { StarThumbnail } from './CelestialBodyThumbnail';

interface StarCardProps {
  star: Star & { tourDescription?: string };
}

export function StarCard({ star }: StarCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/stars/${nameToSlug(star.hostname)}`}
      className="block h-full"
    >
      <div className="star-card">
        {/* Star visualization thumbnail */}
        <div className="star-card-visualization">
          <StarThumbnail star={star} size={96} />
        </div>

        {/* Header */}
        <div className="star-card-header">
          <h3 className="star-card-name">{star.hostname}</h3>
          <div className="star-card-badges">
            {star.sy_snum > 1 && (
              <div className="star-card-binary-badge">
                {t('pages.starCard.binary', 'Binary')}
              </div>
            )}
            {star.star_class && (
              <div className="star-card-class-badge">
                {star.star_class}
              </div>
            )}
          </div>
        </div>

        {/* Tour description (if available) */}
        {star.tourDescription && (
          <p className="star-card-description">{star.tourDescription}</p>
        )}

        {/* Star properties grid */}
        <div className="star-card-properties">
          {/* Temperature */}
          {star.st_teff && (
            <div className="star-property">
              <span className="property-label">{t('pages.starCard.properties.temperature')}</span>
              <span className="property-value">{Math.round(star.st_teff)} K</span>
            </div>
          )}

          {/* Radius */}
          {star.st_rad && (
            <div className="star-property">
              <span className="property-label">{t('pages.starCard.properties.radius')}</span>
              <span className="property-value">{star.st_rad.toFixed(2)} R☉</span>
            </div>
          )}

          {/* Mass */}
          {star.st_mass && (
            <div className="star-property">
              <span className="property-label">{t('pages.starCard.properties.mass')}</span>
              <span className="property-value">{star.st_mass.toFixed(2)} M☉</span>
            </div>
          )}

          {/* Distance */}
          {star.distance_ly && (
            <div className="star-property">
              <span className="property-label">{t('pages.starCard.properties.distance')}</span>
              <span className="property-value">
                {star.distance_ly < 1000
                  ? `${star.distance_ly.toFixed(1)} ly`
                  : `${(star.distance_ly / 1000).toFixed(1)} kly`}
              </span>
            </div>
          )}

          {/* Number of planets */}
          <div className="star-property">
            <span className="property-label">{t('pages.starCard.properties.planets')}</span>
            <span className="property-value">{star.sy_pnum}</span>
          </div>

          {/* Magnitude */}
          {star.sy_vmag && (
            <div className="star-property">
              <span className="property-label">{t('pages.starCard.properties.vMagnitude')}</span>
              <span className="property-value">{star.sy_vmag.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Info text */}
        <div className="star-card-footer">
          <span className="star-card-link-hint">{t('pages.starCard.viewSystem')}</span>
        </div>
      </div>
    </Link>
  );
}
