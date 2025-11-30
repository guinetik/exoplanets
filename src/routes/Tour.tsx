/**
 * Tour Page
 * Vertical scroll storytelling journey through remarkable exoplanets
 */

import { useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { TourSection, TourNavigation, useScrollAnimation } from '../components/Tour';
import { PlanetCard } from '../components/PlanetCard';
import { StarCard } from '../components/StarCard';
import { getTourData } from '../utils/tourData';

// Lazy load the 3D background to avoid blocking
const TourHeroBackground = lazy(() => import('../components/Tour/TourHeroBackground'));

const TOUR_SECTIONS = [
  { id: 'stars', label: 'Famous Stars' },
  { id: 'famous', label: 'Famous Worlds' },
  { id: 'nearest', label: 'Nearest Neighbors' },
  { id: 'habitable', label: 'Most Habitable' },
  { id: 'extreme', label: 'Extreme Worlds' },
  { id: 'records', label: 'Record Breakers' },
];

export default function Tour() {
  const { t } = useTranslation();
  const { getAllPlanets, getAllStars, isLoading } = useData();

  const tourData = useMemo(() => {
    if (isLoading) return null;
    const planets = getAllPlanets();
    const stars = getAllStars();
    return getTourData(planets, stars, t);
  }, [isLoading, getAllPlanets, getAllStars, t]);

  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation<HTMLElement>({
    threshold: 0.3,
  });

  if (isLoading || !tourData) {
    return (
      <div className="tour-page">
        <div className="tour-hero">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="tour-page">
      {/* Hero Section */}
      <header
        ref={heroRef}
        className={`tour-hero ${heroVisible ? 'visible' : ''}`}
      >
        <Suspense fallback={null}>
          <TourHeroBackground />
        </Suspense>
        <div className="tour-hero-content">
          <h1 className="tour-hero-title">{t('pages.tour.title')}</h1>
          <p className="tour-hero-subtitle">{t('pages.tour.subtitle')}</p>
        </div>
        <div className="tour-hero-scroll">
          <span className="tour-hero-scroll-hint">{t('pages.tour.scrollHint')}</span>
          <div className="tour-hero-scroll-arrow">↓</div>
        </div>
      </header>

      {/* Navigation Dots */}
      <TourNavigation sections={TOUR_SECTIONS} />

      {/* Stop 1: Famous Stars */}
      <TourSection
        id="stars"
        chapter={t('pages.tour.sections.stars.chapter')}
        title={t('pages.tour.sections.stars.title')}
        intro={t('pages.tour.sections.stars.intro')}
      >
        <div className="tour-planets-grid">
          {tourData.famousStars.map((star) => (
            <div key={star.hostname} className="planets-grid-item">
              <StarCard star={star} />
            </div>
          ))}
        </div>
      </TourSection>

      {/* Stop 2: Famous Worlds */}
      <TourSection
        id="famous"
        chapter={t('pages.tour.sections.famous.chapter')}
        title={t('pages.tour.sections.famous.title')}
        intro={t('pages.tour.sections.famous.intro')}
      >
        <div className="tour-planets-grid">
          {tourData.famous.map((planet) => (
            <div key={planet.pl_name} className="planets-grid-item">
              <PlanetCard planet={planet} />
            </div>
          ))}
        </div>
      </TourSection>

      {/* Stop 3: Nearest Neighbors */}
      <TourSection
        id="nearest"
        chapter={t('pages.tour.sections.nearest.chapter')}
        title={t('pages.tour.sections.nearest.title')}
        intro={t('pages.tour.sections.nearest.intro')}
      >
        <div className="tour-planets-grid">
          {tourData.nearest.map((planet) => (
            <div key={planet.pl_name} className="planets-grid-item">
              <PlanetCard planet={planet} />
            </div>
          ))}
        </div>
      </TourSection>

      {/* Stop 4: Most Habitable */}
      <TourSection
        id="habitable"
        chapter={t('pages.tour.sections.habitable.chapter')}
        title={t('pages.tour.sections.habitable.title')}
        intro={t('pages.tour.sections.habitable.intro')}
      >
        <div className="tour-planets-grid">
          {tourData.habitable.map((planet) => (
            <div key={planet.pl_name} className="planets-grid-item">
              <PlanetCard planet={planet} />
            </div>
          ))}
        </div>
      </TourSection>

      {/* Stop 5: Extreme Worlds */}
      <TourSection
        id="extreme"
        chapter={t('pages.tour.sections.extreme.chapter')}
        title={t('pages.tour.sections.extreme.title')}
        intro={t('pages.tour.sections.extreme.intro')}
      >
        <div className="tour-planets-grid">
          {tourData.extreme.map((planet) => (
            <div key={`${planet.pl_name}-${planet.extremeType}`} className="planets-grid-item">
              <PlanetCard planet={planet} />
            </div>
          ))}
        </div>
      </TourSection>

      {/* Stop 6: Record Breakers */}
      <TourSection
        id="records"
        chapter={t('pages.tour.sections.records.chapter')}
        title={t('pages.tour.sections.records.title')}
        intro={t('pages.tour.sections.records.intro')}
      >
        <div className="tour-planets-grid">
          {tourData.records.map((planet) => (
            <div key={`${planet.pl_name}-${planet.record}`} className="planets-grid-item">
              <PlanetCard planet={planet} />
            </div>
          ))}
        </div>
      </TourSection>

      {/* Footer CTA */}
      <footer className="tour-footer">
        <h2 className="tour-footer-title">{t('pages.tour.footer.title')}</h2>
        <Link to="/planets" className="tour-footer-cta">
          {t('pages.tour.footer.cta')}
        </Link>
      </footer>
    </div>
  );
}
