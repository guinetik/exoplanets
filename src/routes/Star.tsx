/**
 * Star Page
 * Full-screen 3D visualization of a star system
 */

import { useCallback, useState } from 'react';
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
  const [showInfo, setShowInfo] = useState(false);

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
      {/* Hero Section */}
      <section className="starsystem-hero-section">
        <div className="starsystem-hero-header">
          <h1 className="starsystem-title">{star.hostname}</h1>
          <p className="starsystem-subtitle">
            {star.st_spectype || star.star_class || t('pages.starSystem.info.unknown')}
            {star.distance_ly && ` • ${star.distance_ly.toFixed(2)} ly`}
            {planets.length > 0 && ` • ${planets.length} ${planets.length === 1 ? t('pages.starSystem.info.planet') : t('pages.starSystem.info.planets')}`}
          </p>
        </div>

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
      </section>

      {/* Info toggle button - mobile only */}
      <button
        className="starsystem-info-toggle"
        onClick={() => setShowInfo(!showInfo)}
        title={showInfo ? t('pages.star.hideInfo') : t('pages.star.showInfo')}
      >
        {showInfo ? '✕' : 'ℹ'}
      </button>

      {/* Mobile Info Panel - toggle with button */}
      {showInfo && (
        <div 
          className="starsystem-info-panel-mobile" 
          style={{ display: 'flex' }}
          onClick={() => setShowInfo(false)}
        >
          <div className="starsystem-info-panel-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="starsystem-info-close"
              onClick={() => setShowInfo(false)}
            >
              ✕
            </button>
            <h2>{star?.hostname}</h2>
            <div className="starsystem-info-content">
              <div className="starsystem-info-row">
                <span className="label">{t('pages.star.distance')}</span>
                <span className="value">
                  {star?.distance_ly ? `${star.distance_ly.toFixed(2)} ly` : 'N/A'}
                </span>
              </div>
              <div className="starsystem-info-row">
                <span className="label">{t('pages.star.planets')}</span>
                <span className="value">{planets.length}</span>
              </div>
              {star?.star_class && (
                <div className="starsystem-info-row">
                  <span className="label">{t('pages.star.spectralType')}</span>
                  <span className="value">{star.star_class}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
