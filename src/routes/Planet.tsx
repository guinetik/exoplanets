/**
 * Planet Page
 * Rich planetary profile with visualizations and detailed information
 * Layout: 3D hero, comparison sections, data visualizations, reviews
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import {
  PlanetScene,
  PlanetInfo,
  PlanetEarthComparison,
  HabitabilityGauge,
  TemperatureZoneIndicator,
  OrbitalPositionChart,
  SiblingPlanets,
} from '../components/Planet';
import { TravelTimeCalculator } from '../components/shared';
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

/**
 * Section wrapper component for consistent styling
 */
function PlanetSection({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`planet-section ${className}`}>
      {title && <h2 className="planet-section-title">{title}</h2>}
      <div className="planet-section-content">{children}</div>
    </section>
  );
}

export default function Planet() {
  const { t } = useTranslation();
  const { planetId } = useParams();
  const navigate = useNavigate();
  const { getPlanetBySlug, getPlanetsByHost, isLoading } = useData();
  const [showVizInfo, setShowVizInfo] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Get planet by slug from URL
  const planet = planetId ? getPlanetBySlug(planetId) : undefined;

  // Get sibling planets in the same system
  const siblings = useMemo(() => {
    if (!planet) return [];
    return getPlanetsByHost(planet.hostname);
  }, [planet, getPlanetsByHost]);

  // Scroll to top when planet changes (e.g., when navigating via sibling planets)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [planetId]);

  const scrollToStats = () => {
    if (detailsRef.current) {
      const offset = 120;
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

      {/* Main content area */}
      <div className="planet-content" ref={detailsRef}>
        {/* Planet vs Earth Comparison */}
        <PlanetSection
          title={t('pages.planet.sections.earthComparison')}
          className="section-comparison"
        >
          <PlanetEarthComparison planet={planet} />
        </PlanetSection>

        {/* Habitability & Temperature Row */}
        <div className="planet-section-row">
          <PlanetSection
            title={t('pages.planet.sections.habitability')}
            className="section-habitability"
          >
            <HabitabilityGauge planet={planet} />
          </PlanetSection>

          <PlanetSection
            title={t('pages.planet.sections.temperature')}
            className="section-temperature"
          >
            <TemperatureZoneIndicator planet={planet} />
          </PlanetSection>
        </div>

        {/* Orbital Position */}
        <PlanetSection
          title={t('pages.planet.sections.orbitalPosition')}
          className="section-orbital"
        >
          <OrbitalPositionChart planet={planet} siblings={siblings} />
        </PlanetSection>

        {/* Travel Time Calculator */}
        {planet.distance_ly && planet.distance_ly > 0 && (
          <PlanetSection
            title={t('pages.planet.sections.travelTime')}
            className="section-travel"
          >
            <TravelTimeCalculator distanceLy={planet.distance_ly} />
          </PlanetSection>
        )}

        {/* Detailed Properties */}
        <PlanetSection className="section-details">
          <PlanetInfo planet={planet} />
        </PlanetSection>

        {/* Sibling Planets */}
        {siblings.length > 1 && (
          <PlanetSection className="section-siblings">
            <SiblingPlanets currentPlanet={planet} siblings={siblings} />
          </PlanetSection>
        )}
      </div>
    </div>
  );
}
