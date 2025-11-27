/**
 * PlanetaryBodiesPanel Component
 * Displays a list of celestial bodies (stars and planets) in a star system
 * with hover interactions and click navigation
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { StellarBody } from '../../utils/solarSystem';
import { nameToSlug } from '../../utils/urlSlug';

interface PlanetaryBodiesPanelProps {
  /** All celestial bodies in the system */
  bodies: StellarBody[];
  /** Currently hovered body (for highlighting) */
  hoveredBody: StellarBody | null;
  /** Callback when a body is hovered */
  onBodyHover: (body: StellarBody | null) => void;
  /** Whether this is a binary star system */
  isBinarySystem?: boolean;
}

/**
 * Panel showing all celestial bodies in a star system
 * Supports hover highlighting and click navigation to planet details
 */
export function PlanetaryBodiesPanel({
  bodies,
  hoveredBody,
  onBodyHover,
  isBinarySystem = false,
}: PlanetaryBodiesPanelProps) {
  const { t } = useTranslation();

  // Separate stars from planets
  const starBodies = bodies.filter((b) => b.type === 'star');
  const primaryStar = starBodies.find(
    (b) => b.isPrimaryStar || !b.isCompanionStar
  );
  const companionStars = starBodies.filter((b) => b.isCompanionStar);
  const planetBodies = bodies.filter((b) => b.type === 'planet');

  return (
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
  );
}

export default PlanetaryBodiesPanel;

