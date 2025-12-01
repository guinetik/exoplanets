/**
 * Star Page
 * Full-screen 3D visualization of a star system with UI overlays
 */

import { useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import Spinner from '../components/Spinner';
import SEO from '../components/SEO';
import { getStarSEO } from '../utils/seo';
import { StarSystem } from '../components/StarSystem';
import type { StellarBody } from '../components/StarSystem/StarSystem';
import { PlanetaryBodiesPanel } from '../components/StarSystem/PlanetaryBodiesPanel';
import { SystemOverviewModal } from '../components/StarSystem/SystemOverviewModal';
import { generateSolarSystem } from '../utils/solarSystem';
import { nameToSlug } from '../utils/urlSlug';
import { ExplainableProperty } from '../components/shared/ExplainableProperty';

export default function Star() {
  const { t } = useTranslation();
  const { starId } = useParams();
  const navigate = useNavigate();
  const { getStarBySlug, getPlanetsByHost, isLoading } = useData();

  // UI state
  const [showSystemOverview, setShowSystemOverview] = useState(false);
  const [showBodiesPanel, setShowBodiesPanel] = useState(false);
  const [hoveredBody, setHoveredBody] = useState<StellarBody | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [focusedBody, setFocusedBody] = useState<StellarBody | null>(null);
  const [isSceneReady, setIsSceneReady] = useState(false);

  // Get star and its planets by slug
  const star = starId ? getStarBySlug(starId) : undefined;
  const planets = star ? getPlanetsByHost(star.hostname) : [];

  // Generate bodies for the panel (same data as StarSystem uses)
  const bodies = useMemo(() => {
    if (!star) return [];
    return generateSolarSystem(star, planets);
  }, [star, planets]);

  // Detect desktop for bodies panel visibility
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    setIsDesktop(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle body hover from 3D scene
  const handleBodyHover = useCallback(
    (body: StellarBody | null, pos?: { x: number; y: number }) => {
      setHoveredBody(body);
      setMousePos(pos ?? null);
    },
    []
  );

  /**
   * Handle body click - implements zoom-to-body behavior
   * First click: zoom camera to body
   * Second click on same body: navigate (planet) or open modal (star)
   */
  const handleBodyClick = useCallback(
    (body: StellarBody) => {
      // If clicking the same body that's already focused
      if (focusedBody?.id === body.id) {
        if (body.type === 'planet') {
          // Navigate to planet detail page
          navigate(`/planets/${nameToSlug(body.id)}`);
        } else if (body.type === 'star') {
          // Open system overview modal
          setShowSystemOverview(true);
        }
      } else {
        // Focus on this body (triggers camera zoom)
        setFocusedBody(body);
      }
    },
    [focusedBody, navigate]
  );

  /**
   * Handle background click - zoom back to default view
   */
  const handleBackgroundClick = useCallback(() => {
    setFocusedBody(null);
  }, []);

  /**
   * Handle scene ready - called when 3D scene renders first frame
   */
  const handleSceneReady = useCallback(() => {
    setIsSceneReady(true);
  }, []);

  // Check if this is a binary system
  const isBinarySystem = star ? star.sy_snum > 1 : false;

  if (isLoading) {
    return <Spinner message={t('pages.star.loading')} />;
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

  const seoData = star ? getStarSEO(star) : null;

  return (
    <>
      {seoData && <SEO {...seoData} />}
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
          {/* System Overview button */}
          <button
            className="system-overview-btn"
            onClick={() => setShowSystemOverview(true)}
          >
            {t('pages.starSystem.systemOverview.button')}
          </button>
        </div>
        
        {/* Procedural visualization notice - positioned top left */}
        <div className="starsystem-procedural-notice">
          <ExplainableProperty
            propertyKey="proceduralVisuals"
            category="visualization"
            showIcon={true}
          >
            {t('pages.starSystem.proceduralNotice')}
          </ExplainableProperty>
        </div>

        {/* Back button */}
        <Link to="/" className="starsystem-back-button">
          {t('pages.star.backToStarfield')}
        </Link>

        {/* Main star system visualization (pure 3D) */}
        <StarSystem
          star={star}
          planets={planets}
          hoveredBody={hoveredBody}
          focusedBody={focusedBody}
          onBodyHover={handleBodyHover}
          onBodyClick={handleBodyClick}
          onBackgroundClick={handleBackgroundClick}
          onReady={handleSceneReady}
        />

        {/* Loading overlay while 3D scene initializes */}
        {!isSceneReady && (
          <div className="starsystem-loading-overlay">
            <p className="starsystem-loading-text">{t('pages.star.loadingScene')}</p>
          </div>
        )}

        {/* Planetary Bodies Panel - always visible on desktop, toggleable on mobile */}
        {(isDesktop || showBodiesPanel) && (
          <PlanetaryBodiesPanel
            bodies={bodies}
            hoveredBody={hoveredBody}
            focusedBody={focusedBody}
            onBodyHover={(body) => handleBodyHover(body)}
            onBodyClick={handleBodyClick}
            isBinarySystem={isBinarySystem}
          />
        )}

        {/* Mobile toggle for bodies panel */}
        {!isDesktop && (
          <button
            className="bodies-toggle-btn"
            onClick={() => setShowBodiesPanel(!showBodiesPanel)}
            title={showBodiesPanel ? t('pages.starSystem.hideBodies') : t('pages.starSystem.showBodies')}
          >
            {showBodiesPanel ? '✕' : '☰'}
          </button>
        )}

        {/* Cursor tooltip for hovered planet */}
        {hoveredBody &&
          hoveredBody.type === 'planet' &&
          mousePos &&
          hoveredBody.planetData && (
            <div
              className="starsystem-cursor-tooltip"
              style={{
                left: mousePos.x + 20,
                top: mousePos.y - 10,
              }}
            >
              <div className="cursor-tooltip-header">
                <div className="cursor-tooltip-name">
                  {hoveredBody.planetData.pl_name}
                </div>
                <div className="cursor-tooltip-type">
                  {hoveredBody.planetData.planet_type}
                </div>
              </div>

              <div className="cursor-tooltip-details">
                {hoveredBody.planetData.pl_rade && (
                  <div className="cursor-tooltip-detail">
                    <span className="cursor-tooltip-label">Radius</span>
                    <span className="cursor-tooltip-value">
                      {hoveredBody.planetData.pl_rade.toFixed(2)} R⊕
                    </span>
                  </div>
                )}

                {hoveredBody.planetData.pl_bmasse && (
                  <div className="cursor-tooltip-detail">
                    <span className="cursor-tooltip-label">Mass</span>
                    <span className="cursor-tooltip-value">
                      {hoveredBody.planetData.pl_bmasse.toFixed(2)} M⊕
                    </span>
                  </div>
                )}

                {hoveredBody.planetData.pl_orbper && (
                  <div className="cursor-tooltip-detail">
                    <span className="cursor-tooltip-label">Orbital Period</span>
                    <span className="cursor-tooltip-value">
                      {hoveredBody.planetData.pl_orbper.toFixed(2)} days
                    </span>
                  </div>
                )}

                {hoveredBody.planetData.pl_orbsmax && (
                  <div className="cursor-tooltip-detail">
                    <span className="cursor-tooltip-label">Semi-major Axis</span>
                    <span className="cursor-tooltip-value">
                      {hoveredBody.planetData.pl_orbsmax.toFixed(3)} AU
                    </span>
                  </div>
                )}

                {hoveredBody.planetData.pl_eqt && (
                  <div className="cursor-tooltip-detail">
                    <span className="cursor-tooltip-label">Eq. Temperature</span>
                    <span className="cursor-tooltip-value">
                      {hoveredBody.planetData.pl_eqt.toFixed(0)} K
                    </span>
                  </div>
                )}

                {hoveredBody.planetData.disc_year && (
                  <div className="cursor-tooltip-detail">
                    <span className="cursor-tooltip-label">Discovered</span>
                    <span className="cursor-tooltip-value">
                      {hoveredBody.planetData.disc_year}
                    </span>
                  </div>
                )}

                {hoveredBody.planetData.discoverymethod && (
                  <div className="cursor-tooltip-detail">
                    <span className="cursor-tooltip-label">Method</span>
                    <span className="cursor-tooltip-value">
                      {hoveredBody.planetData.discoverymethod}
                    </span>
                  </div>
                )}
              </div>

              <div className="cursor-tooltip-hint">Click to view details</div>
            </div>
          )}

        {/* System Overview Modal */}
        <SystemOverviewModal
          star={star}
          planets={planets}
          isOpen={showSystemOverview}
          onClose={() => setShowSystemOverview(false)}
        />
      </section>
      </div>
    </>
  );
}
