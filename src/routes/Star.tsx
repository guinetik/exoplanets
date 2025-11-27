/**
 * Star Page
 * Full-screen 3D visualization of a star system
 */

import { useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { StarSystem } from '../components/StarSystem';
import type { Exoplanet } from '../types';
import { nameToSlug } from '../utils/urlSlug';

export default function Star() {
  const { t } = useTranslation();
  const { starId } = useParams();
  const navigate = useNavigate();
  const { getStarBySlug, getPlanetsByHost, isLoading } = useData();

  // Get star and its planets by slug
  const star = starId ? getStarBySlug(starId) : undefined;
  const planets = star ? getPlanetsByHost(star.hostname) : [];

  const handlePlanetClick = useCallback(
    (planet: Exoplanet) => {
      navigate(`/planets/${nameToSlug(planet.pl_name)}`);
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
          <div className="spinner-text">{t('pages.star.loading')}</div>
        </div>
      </div>
    );
  }

  if (!star) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1 className="error-title">{t('pages.star.notFound.title')}</h1>
          <p className="error-message">
            {t('pages.star.notFound.message', { starId: starId || '' })}
          </p>
          <Link to="/" className="starsystem-back-link">
            {t('pages.star.notFound.returnToStarfield')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="starsystem-page">
      {/* Back button */}
      <Link to="/" className="starsystem-back-button">
        {t('pages.star.backToStarfield')}
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
