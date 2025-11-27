/**
 * Planet Page
 * Vertical stack: 3D planet on top, hero name centered, details below
 */

import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { PlanetScene, PlanetInfo } from '../components/Planet';
import { nameToSlug } from '../utils/urlSlug';

/**
 * Visualization methodology dialog
 * Explains how planet visualizations are generated from scientific data
 * @param isOpen - Whether the dialog is open
 * @param onClose - Callback to close the dialog
 */
function VisualizationInfoDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="viz-dialog-overlay" onClick={onClose}>
      <div className="viz-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="viz-dialog-close" onClick={onClose}>&times;</button>
        <h3 className="viz-dialog-title">{t('pages.planet.visualization.title')}</h3>

        <div className="viz-dialog-content">
          <p>{t('pages.planet.visualization.intro')}</p>

          <div className="viz-method-section">
            <h4>{t('pages.planet.visualization.density.title')}</h4>
            <p>{t('pages.planet.visualization.density.description')}</p>
          </div>

          <div className="viz-method-section">
            <h4>{t('pages.planet.visualization.insolation.title')}</h4>
            <p>{t('pages.planet.visualization.insolation.description')}</p>
          </div>

          <div className="viz-method-section">
            <h4>{t('pages.planet.visualization.starTemp.title')}</h4>
            <p>{t('pages.planet.visualization.starTemp.description')}</p>
          </div>

          <div className="viz-method-section">
            <h4>{t('pages.planet.visualization.planetType.title')}</h4>
            <p>{t('pages.planet.visualization.planetType.description')}</p>
          </div>

          <p className="viz-disclaimer">{t('pages.planet.visualization.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}

export default function Planet() {
  const { t } = useTranslation();
  const { planetId } = useParams();
  const navigate = useNavigate();
  const { getPlanetBySlug, isLoading } = useData();
  const [showVizInfo, setShowVizInfo] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Get planet by slug from URL
  const planet = planetId ? getPlanetBySlug(planetId) : undefined;

  const scrollToStats = () => {
    if (detailsRef.current) {
      const offset = 120; // Keep title visible
      const elementPosition = detailsRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="planet-page">
        <div className="planet-loading">
          <div className="spinner-orbit">
            <div className="spinner-planet" />
          </div>
          <p className="spinner-text">{t('pages.planet.loading')}</p>
        </div>
      </div>
    );
  }

  // Planet not found
  if (!planet) {
    return (
      <div className="planet-page">
        <div className="planet-not-found">
          <h1>{t('pages.planet.notFound.title')}</h1>
          <p>{t('pages.planet.notFound.message', { planetId: planetId || '' })}</p>
          <Link to="/planets" className="planet-back-link">
            {t('pages.planet.notFound.browseAll')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="planet-page">
      {/* Back button */}
      <button
        className="planet-back-button"
        onClick={() => navigate(-1)}
      >
        {t('pages.planet.back')}
      </button>

      {/* Top: 3D Planet visualization */}
      <div className="planet-hero">
        <div className="planet-canvas-container">
          <PlanetScene planet={planet} />
        </div>

        {/* Visualization info button - top right of hero */}
        <button
          className="viz-info-button"
          onClick={() => setShowVizInfo(true)}
          title={t('pages.planet.visualization.title')}
        >
          <span className="viz-info-icon">i</span>
        </button>

        {/* Visualization Info Dialog */}
        <VisualizationInfoDialog isOpen={showVizInfo} onClose={() => setShowVizInfo(false)} />

        {/* Hero name overlay */}
        <div className="planet-hero-text">
          <h1 className="planet-hero-title">{planet.pl_name}</h1>
          <p className="planet-hero-subtitle">{planet.planet_type || t('pages.planet.exoplanet')}</p>
          <div className="planet-hero-links">
            <button
              className="planet-hero-link"
              onClick={scrollToStats}
            >
              {t('pages.planet.viewStats')} ↓
            </button>
            {planet.hostname && (
              <Link
                to={`/stars/${nameToSlug(planet.hostname)}`}
                className="planet-hero-link"
              >
                {t('pages.planet.viewSystem', { hostname: planet.hostname })}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Details section */}
      <div className="planet-details" ref={detailsRef}>
        <PlanetInfo planet={planet} />
      </div>
    </div>
  );
}
