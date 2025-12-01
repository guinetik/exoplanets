/**
 * Habitability Analysis Page
 * Data science insights on potentially habitable exoplanets
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import SEO from '../components/SEO';
import { getHabitabilitySEO } from '../utils/seo';
import Spinner from '../components/Spinner';
import HabitableGalaxyView from '../components/Habitability/spatial/HabitableGalaxyView';
import HabitabilityStats from '../components/Habitability/HabitabilityStats';
import TopCandidates from '../components/Habitability/TopCandidates';
import ScoreDistribution from '../components/Habitability/charts/ScoreDistribution';
import TemperatureChart from '../components/Habitability/charts/TemperatureChart';
import StarTypeChart from '../components/Habitability/charts/StarTypeChart';
import DiscoveryTimeline from '../components/Habitability/charts/DiscoveryTimeline';
import {
  getHabitabilityStats,
  getSpatialData,
  getScoreDistribution,
  getTemperatureScoreData,
  getStarTypeStats,
  getDiscoveryTrends,
  getPlanetStarHeatmap,
  getFeatureCooccurrence,
  getFeaturePrevalence,
  getHabitabilityBreakdown,
} from '../utils/habitabilityAnalytics';
import Heatmap from '../components/Habitability/charts/Heatmap';
import FeaturePrevalenceChart from '../components/Habitability/charts/FeaturePrevalence';
import HabitabilityBreakdownChart from '../components/Habitability/charts/HabitabilityBreakdown';

export default function Habitability() {
  const { t } = useTranslation();
  const { isLoading, error, getAllPlanets, getTopHabitable } = useData();

  // Compute all analytics data
  const analytics = useMemo(() => {
    if (isLoading) return null;

    const planets = getAllPlanets();
    const topCandidates = getTopHabitable(10);

    return {
      stats: getHabitabilityStats(planets),
      spatial: getSpatialData(planets),
      scoreDistribution: getScoreDistribution(planets),
      temperatureData: getTemperatureScoreData(planets),
      starTypeStats: getStarTypeStats(planets),
      discoveryTrends: getDiscoveryTrends(planets),
      planetStarHeatmap: getPlanetStarHeatmap(planets),
      featureCooccurrence: getFeatureCooccurrence(planets),
      featurePrevalence: getFeaturePrevalence(planets),
      habitabilityBreakdown: getHabitabilityBreakdown(planets),
      topCandidates,
      totalPlanets: planets.length,
    };
  }, [isLoading, getAllPlanets, getTopHabitable]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-white/60">{t('pages.habitability.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-400">
          <h2 className="text-xl font-bold mb-2">{t('common.error')}</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const seoData = getHabitabilitySEO();

  return (
    <>
      <SEO {...seoData} />
      <div className="habitability-page">
      {/* Hero: 3D Galaxy Map */}
      <section className="habitability-hero-section">
        <div className="habitability-hero-header">
          <h1 className="habitability-title">{t('pages.habitability.title')}</h1>
          <p className="habitability-subtitle">{t('pages.habitability.subtitle')}</p>
        </div>
        <HabitableGalaxyView data={analytics.spatial} stats={analytics.stats} />
      </section>

      {/* Stats Bar */}
      <HabitabilityStats stats={analytics.stats} />

      {/* Charts Grid */}
      <section className="habitability-charts-section">
        <h2 className="section-title">{t('pages.habitability.insights.title')}</h2>
        <div className="charts-grid">
          <ScoreDistribution data={analytics.scoreDistribution} />
          <TemperatureChart data={analytics.temperatureData} />
          <StarTypeChart data={analytics.starTypeStats} />
          <DiscoveryTimeline data={analytics.discoveryTrends} />
        </div>
      </section>

      {/* Deep Dive Section */}
      <section className="habitability-charts-section">
        <h2 className="section-title">{t('pages.habitability.deepDive.title')}</h2>
        <div className="charts-grid">
          <Heatmap
            data={analytics.planetStarHeatmap.data}
            xLabels={analytics.planetStarHeatmap.xLabels}
            yLabels={analytics.planetStarHeatmap.yLabels}
            maxValue={analytics.planetStarHeatmap.maxValue}
            title={t('pages.habitability.deepDive.planetStarHeatmap')}
            xAxisLabel={t('pages.habitability.deepDive.starClass')}
            yAxisLabel={t('pages.habitability.deepDive.planetType')}
            colorScheme="blue"
          />
          <Heatmap
            data={analytics.featureCooccurrence.data}
            xLabels={analytics.featureCooccurrence.labels}
            yLabels={analytics.featureCooccurrence.labels}
            maxValue={analytics.featureCooccurrence.maxValue}
            title={t('pages.habitability.deepDive.featureCooccurrence')}
            colorScheme="green"
            showValues={true}
          />
          <FeaturePrevalenceChart
            data={analytics.featurePrevalence}
            title={t('pages.habitability.deepDive.featurePrevalence')}
          />
          <HabitabilityBreakdownChart
            data={analytics.habitabilityBreakdown}
            title={t('pages.habitability.deepDive.habitabilityBreakdown')}
            totalPlanets={analytics.totalPlanets}
          />
        </div>
      </section>

      {/* Top Candidates */}
      <section className="habitability-candidates-section">
        <h2 className="section-title">{t('pages.habitability.candidates.title')}</h2>
        <p className="section-description">{t('pages.habitability.candidates.description')}</p>
        <TopCandidates candidates={analytics.topCandidates} />
      </section>

      {/* Methodology */}
      <section className="habitability-methodology-section">
        <h2 className="section-title">{t('pages.habitability.methodology.title')}</h2>
        <div className="methodology-card">
          <p className="methodology-intro">{t('pages.habitability.methodology.description')}</p>
          <ul className="methodology-list">
            <li>{t('pages.habitability.methodology.temperature')}</li>
            <li>{t('pages.habitability.methodology.size')}</li>
            <li>{t('pages.habitability.methodology.starType')}</li>
            <li>{t('pages.habitability.methodology.insolation')}</li>
          </ul>
        </div>
      </section>
      </div>
    </>
  );
}
