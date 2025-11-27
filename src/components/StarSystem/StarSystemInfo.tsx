/**
 * StarSystemInfo Component
 * Overlay panel showing star and planet information
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Star } from '../../types';
import type { StellarBody } from '../../utils/solarSystem';
import { formatStarProperty } from '../../utils/solarSystem';
import { nameToSlug } from '../../utils/urlSlug';

interface StarSystemInfoProps {
  star: Star;
  bodies: StellarBody[];
  hoveredBody: StellarBody | null;
  onBodyHover: (body: StellarBody | null) => void;
}

export function StarSystemInfo({
  star,
  bodies,
  hoveredBody,
  onBodyHover,
}: StarSystemInfoProps) {
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect if screen is desktop size (>= 769px)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    setIsDesktop(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  const starBodies = bodies.filter((b) => b.type === 'star');
  const primaryStar = starBodies.find(
    (b) => b.isPrimaryStar || !b.isCompanionStar
  );
  const companionStars = starBodies.filter((b) => b.isCompanionStar);
  const planetBodies = bodies.filter((b) => b.type === 'planet');
  const isBinarySystem = starBodies.length > 1;

  return (
    <>
      {/* Star info panel - top left - desktop only */}
      {isDesktop && (
        <div className="starsystem-info-panel">
        <h1 className="starsystem-star-name">
          {star.hostname}
          {isBinarySystem && (
            <span
              className="binary-badge"
              style={{ marginLeft: '8px', fontSize: '0.5em', opacity: 0.8 }}
            >
              ★★ Binary
            </span>
          )}
        </h1>

        <div className="starsystem-star-details">
          <div className="star-detail">
            <span className="detail-label">
              {t('pages.starSystem.info.type')}
            </span>
            <span className="detail-value">
              {star.st_spectype ||
                star.star_class ||
                t('pages.starSystem.info.unknown')}
            </span>
          </div>

          {star.st_teff && (
            <div className="star-detail">
              <span className="detail-label">
                {t('pages.starSystem.info.temperature')}
              </span>
              <span className="detail-value">
                {formatStarProperty('st_teff', star.st_teff)}
              </span>
            </div>
          )}

          {star.st_rad && (
            <div className="star-detail">
              <span className="detail-label">
                {t('pages.starSystem.info.radius')}
              </span>
              <span className="detail-value">
                {formatStarProperty('st_rad', star.st_rad)}
              </span>
            </div>
          )}

          {star.st_mass && (
            <div className="star-detail">
              <span className="detail-label">
                {t('pages.starSystem.info.mass')}
              </span>
              <span className="detail-value">
                {formatStarProperty('st_mass', star.st_mass)}
              </span>
            </div>
          )}

          {star.distance_ly && (
            <div className="star-detail">
              <span className="detail-label">
                {t('pages.starSystem.info.distance')}
              </span>
              <span className="detail-value">
                {formatStarProperty('distance_ly', star.distance_ly)}
              </span>
            </div>
          )}

          {star.st_age && (
            <div className="star-detail">
              <span className="detail-label">
                {t('pages.starSystem.info.age')}
              </span>
              <span className="detail-value">
                {formatStarProperty('st_age', star.st_age)}
              </span>
            </div>
          )}
        </div>

        <div className="starsystem-planet-count">
          {star.sy_snum > 1 && (
            <span className="star-count">
              {star.sy_snum} {t('pages.starSystem.info.stars')} •{' '}
            </span>
          )}
          {star.sy_pnum}{' '}
          {star.sy_pnum === 1
            ? t('pages.starSystem.info.planet')
            : t('pages.starSystem.info.planets')}
          {star.cb_flag && (
            <span className="circumbinary-note" style={{ opacity: 0.7 }}>
              {' '}
              ({t('pages.starSystem.info.circumbinary')})
            </span>
          )}
        </div>
        </div>
      )}

      {/* Planets list - bottom left - shown on desktop and mobile */}
      <div className="starsystem-planets-panel">
        <h2 className="planets-panel-title">
          {t('pages.starSystem.info.planetaryBodies')}
        </h2>

        <ul className="planets-list">
          {/* Primary star entry */}
          {primaryStar && (
            <li
              className={`planet-item ${hoveredBody?.id === primaryStar.id ? 'hovered' : ''}`}
              onMouseEnter={() => onBodyHover(primaryStar)}
              onMouseLeave={() => onBodyHover(null)}
            >
              <span
                className="planet-color-dot"
                style={{ backgroundColor: primaryStar.color }}
              />
              <span className="planet-name">{primaryStar.name}</span>
              <span className="planet-type">
                {isBinarySystem
                  ? t('pages.starSystem.info.primaryStar')
                  : t('pages.starSystem.info.star')}
              </span>
            </li>
          )}

          {/* Companion star entries */}
          {companionStars.map((companionStar) => (
            <li
              key={companionStar.id}
              className={`planet-item ${hoveredBody?.id === companionStar.id ? 'hovered' : ''}`}
              onMouseEnter={() => onBodyHover(companionStar)}
              onMouseLeave={() => onBodyHover(null)}
            >
              <span
                className="planet-color-dot"
                style={{ backgroundColor: companionStar.color }}
              />
              <span className="planet-name">{companionStar.name}</span>
              <span className="planet-type">
                {t('pages.starSystem.info.companionStar')}
              </span>
            </li>
          ))}

          {/* Planet entries - link to planet page */}
          {planetBodies.map((body) => (
            <li
              key={body.id}
              className={`planet-item ${hoveredBody?.id === body.id ? 'hovered' : ''}`}
              onMouseEnter={() => onBodyHover(body)}
              onMouseLeave={() => onBodyHover(null)}
            >
              <Link
                to={`/planets/${nameToSlug(body.id)}`}
                className="planet-item-link"
              >
                <span
                  className="planet-color-dot"
                  style={{ backgroundColor: body.color }}
                />
                <span className="planet-name">{body.name}</span>
                <span className="planet-type">
                  {body.planetData?.planet_type ||
                    t('pages.starSystem.info.planet')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions hint - desktop only */}
      {isDesktop && (
        <div className="starsystem-hint">{t('pages.starSystem.hint')}</div>
      )}
    </>
  );
}

export default StarSystemInfo;
