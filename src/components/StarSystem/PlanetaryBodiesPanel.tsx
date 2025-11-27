/**
 * PlanetaryBodiesPanel Component
 * Displays a list of celestial bodies (stars and planets) in a star system
 * with hover interactions and click-to-focus behavior
 */

import { useTranslation } from 'react-i18next';
import type { StellarBody } from '../../utils/solarSystem';

interface PlanetaryBodiesPanelProps {
  /** All celestial bodies in the system */
  bodies: StellarBody[];
  /** Currently hovered body (for highlighting) */
  hoveredBody: StellarBody | null;
  /** Currently focused body (camera zoomed to it) */
  focusedBody?: StellarBody | null;
  /** Callback when a body is hovered */
  onBodyHover: (body: StellarBody | null) => void;
  /** Callback when a body is clicked (triggers zoom, or navigate if already focused) */
  onBodyClick?: (body: StellarBody) => void;
  /** Whether this is a binary star system */
  isBinarySystem?: boolean;
}

/**
 * Panel showing all celestial bodies in a star system
 * Click to zoom camera to body, click again to navigate (planets) or open modal (stars)
 */
export function PlanetaryBodiesPanel({
  bodies,
  hoveredBody,
  focusedBody,
  onBodyHover,
  onBodyClick,
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

  /**
   * Get CSS classes for a body item based on hover/focus state
   */
  const getItemClasses = (body: StellarBody) => {
    const classes = ['planet-item'];
    if (hoveredBody?.id === body.id) classes.push('hovered');
    if (focusedBody?.id === body.id) classes.push('focused');
    return classes.join(' ');
  };

  return (
    <div className="starsystem-planets-panel">
      <h2 className="planets-panel-title">
        {t('pages.starSystem.info.planetaryBodies')}
      </h2>

      <ul className="planets-list">
        {/* Primary star entry */}
        {primaryStar && (
          <li
            className={getItemClasses(primaryStar)}
            onMouseEnter={() => onBodyHover(primaryStar)}
            onMouseLeave={() => onBodyHover(null)}
            onClick={() => onBodyClick?.(primaryStar)}
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
            {focusedBody?.id === primaryStar.id && (
              <span className="focus-indicator">●</span>
            )}
          </li>
        )}

        {/* Companion star entries */}
        {companionStars.map((companionStar) => (
          <li
            key={companionStar.id}
            className={getItemClasses(companionStar)}
            onMouseEnter={() => onBodyHover(companionStar)}
            onMouseLeave={() => onBodyHover(null)}
            onClick={() => onBodyClick?.(companionStar)}
          >
            <span
              className="planet-color-dot"
              style={{ backgroundColor: companionStar.color }}
            />
            <span className="planet-name">{companionStar.name}</span>
            <span className="planet-type">
              {t('pages.starSystem.info.companionStar')}
            </span>
            {focusedBody?.id === companionStar.id && (
              <span className="focus-indicator">●</span>
            )}
          </li>
        ))}

        {/* Planet entries - click to focus, click again to navigate */}
        {planetBodies.map((body) => (
          <li
            key={body.id}
            className={getItemClasses(body)}
            onMouseEnter={() => onBodyHover(body)}
            onMouseLeave={() => onBodyHover(null)}
            onClick={() => onBodyClick?.(body)}
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
            {focusedBody?.id === body.id && (
              <span className="focus-indicator">●</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlanetaryBodiesPanel;

