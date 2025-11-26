/**
 * Star Page
 * Full-screen 3D visualization of a star system
 */

import { useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { StarSystem } from '../components/StarSystem';
import type { Exoplanet } from '../types';

export default function Star() {
  const { starId } = useParams();
  const navigate = useNavigate();
  const { getStarByName, getPlanetsByHost, isLoading } = useData();

  // Get star and its planets
  const star = starId ? getStarByName(decodeURIComponent(starId)) : undefined;
  const planets = star ? getPlanetsByHost(star.hostname) : [];

  const handlePlanetClick = useCallback(
    (planet: Exoplanet) => {
      navigate(`/planets/${encodeURIComponent(planet.pl_name)}`);
    },
    [navigate]
  );

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner-content">
          <div className="spinner-orbit">
            <div className="spinner-planet" />
          </div>
          <div className="spinner-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (!star) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1 className="error-title">Star Not Found</h1>
          <p className="error-message">
            The star "{starId}" could not be found.
          </p>
          <Link to="/" className="starsystem-back-link">
            ← Return to starfield
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="starsystem-page">
      {/* Back button */}
      <Link to="/" className="starsystem-back-button">
        ← Back to Starfield
      </Link>

      {/* Main star system visualization */}
      <StarSystem
        star={star}
        planets={planets}
        onPlanetClick={handlePlanetClick}
      />
    </div>
  );
}
