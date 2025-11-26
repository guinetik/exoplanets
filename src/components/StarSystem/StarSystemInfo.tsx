/**
 * StarSystemInfo Component
 * Overlay panel showing star and planet information
 */

import { Link } from 'react-router-dom';
import type { Star } from '../../types';
import type { StellarBody } from '../../utils/solarSystem';
import { formatStarProperty } from '../../utils/solarSystem';

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

  const starBody = bodies.find((b) => b.type === 'star');
  const planetBodies = bodies.filter((b) => b.type === 'planet');

  return (
    <>
      {/* Star info panel - top left */}
      <div className="starsystem-info-panel">
        <h1 className="starsystem-star-name">{star.hostname}</h1>

        <div className="starsystem-star-details">
          <div className="star-detail">
            <span className="detail-label">Type</span>
            <span className="detail-value">{star.st_spectype || star.star_class || 'Unknown'}</span>
          </div>

          {star.st_teff && (
            <div className="star-detail">
              <span className="detail-label">Temperature</span>
              <span className="detail-value">{formatStarProperty('st_teff', star.st_teff)}</span>
            </div>
          )}

          {star.st_rad && (
            <div className="star-detail">
              <span className="detail-label">Radius</span>
              <span className="detail-value">{formatStarProperty('st_rad', star.st_rad)}</span>
            </div>
          )}

          {star.st_mass && (
            <div className="star-detail">
              <span className="detail-label">Mass</span>
              <span className="detail-value">{formatStarProperty('st_mass', star.st_mass)}</span>
            </div>
          )}

          {star.distance_ly && (
            <div className="star-detail">
              <span className="detail-label">Distance</span>
              <span className="detail-value">{formatStarProperty('distance_ly', star.distance_ly)}</span>
            </div>
          )}

          {star.st_age && (
            <div className="star-detail">
              <span className="detail-label">Age</span>
              <span className="detail-value">{formatStarProperty('st_age', star.st_age)}</span>
            </div>
          )}
        </div>

        <div className="starsystem-planet-count">
          {star.sy_pnum} {star.sy_pnum === 1 ? 'Planet' : 'Planets'}
        </div>
      </div>

      {/* Planets list - bottom left */}
      <div className="starsystem-planets-panel">
        <h2 className="planets-panel-title">Planetary Bodies</h2>

        <ul className="planets-list">
          {/* Star entry */}
          {starBody && (
            <li
              className={`planet-item ${hoveredBody?.id === starBody.id ? 'hovered' : ''}`}
              onMouseEnter={() => onBodyHover(starBody)}
              onMouseLeave={() => onBodyHover(null)}
            >
              <span
                className="planet-color-dot"
                style={{ backgroundColor: starBody.color }}
              />
              <span className="planet-name">{starBody.name}</span>
              <span className="planet-type">Star</span>
            </li>
          )}

          {/* Planet entries - link to planet page */}
          {planetBodies.map((body) => (
            <li
              key={body.id}
              className={`planet-item ${hoveredBody?.id === body.id ? 'hovered' : ''}`}
              onMouseEnter={() => onBodyHover(body)}
              onMouseLeave={() => onBodyHover(null)}
            >
              <Link
                to={`/planets/${encodeURIComponent(body.id)}`}
                className="planet-item-link"
              >
                <span
                  className="planet-color-dot"
                  style={{ backgroundColor: body.color }}
                />
                <span className="planet-name">{body.name}</span>
                <span className="planet-type">
                  {body.planetData?.planet_type || 'Planet'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions hint */}
      <div className="starsystem-hint">
        Drag to rotate • Scroll to zoom • Hover planets for info
      </div>
    </>
  );
}

export default StarSystemInfo;
