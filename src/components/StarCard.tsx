import { Link } from 'react-router-dom';
import type { Star } from '../types';
import { getStarColorHex } from '../utils/astronomy';

interface StarCardProps {
  star: Star;
}

export function StarCard({ star }: StarCardProps) {
  const colorHex = getStarColorHex(star.star_class);
  const colorRgb = `rgb(${(colorHex >> 16) & 255}, ${(colorHex >> 8) & 255}, ${colorHex & 255})`;

  return (
    <Link
      to={`/stars/${encodeURIComponent(star.hostname)}`}
      className="block h-full"
    >
      <div className="star-card">
        {/* Color indicator dot */}
        <div className="star-card-header">
          <div
            className="star-card-dot"
            style={{ backgroundColor: colorRgb }}
          />
          <h3 className="star-card-name">{star.hostname}</h3>
        </div>

        {/* Star class badge */}
        {star.star_class && (
          <div className="star-card-class-badge">
            {star.star_class}
          </div>
        )}

        {/* Star properties grid */}
        <div className="star-card-properties">
          {/* Temperature */}
          {star.st_teff && (
            <div className="star-property">
              <span className="property-label">Temperature</span>
              <span className="property-value">{Math.round(star.st_teff)} K</span>
            </div>
          )}

          {/* Radius */}
          {star.st_rad && (
            <div className="star-property">
              <span className="property-label">Radius</span>
              <span className="property-value">{star.st_rad.toFixed(2)} R☉</span>
            </div>
          )}

          {/* Mass */}
          {star.st_mass && (
            <div className="star-property">
              <span className="property-label">Mass</span>
              <span className="property-value">{star.st_mass.toFixed(2)} M☉</span>
            </div>
          )}

          {/* Distance */}
          {star.distance_ly && (
            <div className="star-property">
              <span className="property-label">Distance</span>
              <span className="property-value">
                {star.distance_ly < 1000
                  ? `${star.distance_ly.toFixed(1)} ly`
                  : `${(star.distance_ly / 1000).toFixed(1)} kly`}
              </span>
            </div>
          )}

          {/* Number of planets */}
          <div className="star-property">
            <span className="property-label">Planets</span>
            <span className="property-value">{star.sy_pnum}</span>
          </div>

          {/* Magnitude */}
          {star.sy_vmag && (
            <div className="star-property">
              <span className="property-label">V Magnitude</span>
              <span className="property-value">{star.sy_vmag.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Info text */}
        <div className="star-card-footer">
          <span className="star-card-link-hint">View system →</span>
        </div>
      </div>
    </Link>
  );
}
