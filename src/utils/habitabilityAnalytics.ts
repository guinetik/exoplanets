/**
 * Habitability Analytics
 * Data transformation functions for the Habitability Analysis page
 */

import type { Exoplanet } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export interface ScoreDistribution {
  range: string;
  min: number;
  max: number;
  count: number;
  pct: number;
}

export interface TemperatureScoreData {
  temp: number;
  score: number;
  name: string;
  isHabitable: boolean;
  isEarthLike: boolean;
}

export interface StarTypeStats {
  starClass: string;
  avgScore: number;
  count: number;
  habitableCount: number;
  pct: number;
}

export interface DiscoveryTrend {
  year: number;
  total: number;
  habitable: number;
  cumulative: number;
  cumulativeHabitable: number;
}

export interface SpatialPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  score: number;
  isHabitable: boolean;
  isEarthLike: boolean;
  distanceLy: number;
  starClass: string | null;
  planetType: string | null;
}

export interface HabitabilityStats {
  total: number;
  habitableZone: number;
  earthLike: number;
  topScore: number;
  topScorerName: string;
  nearestHabitable: {
    name: string;
    distanceLy: number;
  } | null;
  avgScore: number;
}

export interface InsolationData {
  insolation: number;
  score: number;
  name: string;
  isHabitable: boolean;
}

export interface SizeMassData {
  radius: number;
  mass: number;
  score: number;
  name: string;
  isHabitable: boolean;
  isEarthLike: boolean;
  planetType: string | null;
}

// =============================================================================
// SCORE DISTRIBUTION
// =============================================================================

const SCORE_BINS = [
  { range: '0-20', min: 0, max: 20 },
  { range: '20-40', min: 20, max: 40 },
  { range: '40-60', min: 40, max: 60 },
  { range: '60-80', min: 60, max: 80 },
  { range: '80-100', min: 80, max: 100 },
];

export function getScoreDistribution(planets: Exoplanet[]): ScoreDistribution[] {
  const total = planets.length;

  return SCORE_BINS.map(({ range, min, max }) => {
    const count = planets.filter(
      (p) => p.habitability_score >= min && p.habitability_score < (max === 100 ? 101 : max)
    ).length;

    return {
      range,
      min,
      max,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

// =============================================================================
// TEMPERATURE vs SCORE
// =============================================================================

export function getTemperatureScoreData(planets: Exoplanet[]): TemperatureScoreData[] {
  return planets
    .filter((p) => p.pl_eqt !== null && p.pl_eqt > 0)
    .map((p) => ({
      temp: p.pl_eqt!,
      score: p.habitability_score,
      name: p.pl_name,
      isHabitable: p.is_habitable_zone,
      isEarthLike: p.is_earth_like,
    }));
}

// =============================================================================
// STAR TYPE STATISTICS
// =============================================================================

const STAR_CLASS_ORDER = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

export function getStarTypeStats(planets: Exoplanet[]): StarTypeStats[] {
  const byClass = new Map<string, { scores: number[]; habitableCount: number }>();

  planets.forEach((p) => {
    const starClass = p.star_class || 'Unknown';
    if (!byClass.has(starClass)) {
      byClass.set(starClass, { scores: [], habitableCount: 0 });
    }
    const entry = byClass.get(starClass)!;
    entry.scores.push(p.habitability_score);
    if (p.is_habitable_zone) entry.habitableCount++;
  });

  const total = planets.length;
  const results: StarTypeStats[] = [];

  byClass.forEach((data, starClass) => {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    results.push({
      starClass,
      avgScore,
      count: data.scores.length,
      habitableCount: data.habitableCount,
      pct: total > 0 ? (data.scores.length / total) * 100 : 0,
    });
  });

  // Sort by star class order (spectral sequence)
  return results.sort((a, b) => {
    const aIdx = STAR_CLASS_ORDER.indexOf(a.starClass);
    const bIdx = STAR_CLASS_ORDER.indexOf(b.starClass);
    if (aIdx === -1 && bIdx === -1) return a.starClass.localeCompare(b.starClass);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return 1;
    return aIdx - bIdx;
  });
}

// =============================================================================
// DISCOVERY TRENDS
// =============================================================================

export function getDiscoveryTrends(planets: Exoplanet[]): DiscoveryTrend[] {
  const byYear = new Map<number, { total: number; habitable: number }>();

  planets.forEach((p) => {
    const year = p.disc_year;
    if (!byYear.has(year)) {
      byYear.set(year, { total: 0, habitable: 0 });
    }
    const entry = byYear.get(year)!;
    entry.total++;
    if (p.is_habitable_zone) entry.habitable++;
  });

  // Sort by year and compute cumulative
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  let cumulative = 0;
  let cumulativeHabitable = 0;

  return years.map((year) => {
    const data = byYear.get(year)!;
    cumulative += data.total;
    cumulativeHabitable += data.habitable;
    return {
      year,
      total: data.total,
      habitable: data.habitable,
      cumulative,
      cumulativeHabitable,
    };
  });
}

// =============================================================================
// SPATIAL DATA (for 3D visualization)
// =============================================================================

export function getSpatialData(planets: Exoplanet[]): SpatialPoint[] {
  return planets
    .filter((p) => p.x_pc !== null && p.y_pc !== null && p.z_pc !== null)
    .map((p) => ({
      id: p.pl_name,
      name: p.pl_name,
      x: p.x_pc!,
      y: p.y_pc!,
      z: p.z_pc!,
      score: p.habitability_score,
      isHabitable: p.is_habitable_zone,
      isEarthLike: p.is_earth_like,
      distanceLy: p.distance_ly ?? 0,
      starClass: p.star_class,
      planetType: p.planet_type,
    }));
}

// =============================================================================
// SUMMARY STATISTICS
// =============================================================================

export function getHabitabilityStats(planets: Exoplanet[]): HabitabilityStats {
  const habitableZone = planets.filter((p) => p.is_habitable_zone);
  const earthLike = planets.filter((p) => p.is_earth_like);

  // Find top scorer
  const topScorer = planets.reduce(
    (best, p) => (p.habitability_score > best.score ? { name: p.pl_name, score: p.habitability_score } : best),
    { name: '', score: 0 }
  );

  // Find nearest habitable
  const nearestHabitable = habitableZone
    .filter((p) => p.distance_ly !== null && p.distance_ly > 0)
    .sort((a, b) => (a.distance_ly ?? Infinity) - (b.distance_ly ?? Infinity))[0];

  // Average score
  const avgScore = planets.length > 0
    ? planets.reduce((sum, p) => sum + p.habitability_score, 0) / planets.length
    : 0;

  return {
    total: planets.length,
    habitableZone: habitableZone.length,
    earthLike: earthLike.length,
    topScore: topScorer.score,
    topScorerName: topScorer.name,
    nearestHabitable: nearestHabitable
      ? { name: nearestHabitable.pl_name, distanceLy: nearestHabitable.distance_ly! }
      : null,
    avgScore,
  };
}

// =============================================================================
// INSOLATION DATA
// =============================================================================

export function getInsolationData(planets: Exoplanet[]): InsolationData[] {
  return planets
    .filter((p) => p.pl_insol !== null && p.pl_insol > 0)
    .map((p) => ({
      insolation: p.pl_insol!,
      score: p.habitability_score,
      name: p.pl_name,
      isHabitable: p.is_habitable_zone,
    }));
}

// =============================================================================
// SIZE vs MASS DATA
// =============================================================================

export function getSizeMassData(planets: Exoplanet[]): SizeMassData[] {
  return planets
    .filter((p) => p.pl_rade !== null && p.pl_bmasse !== null)
    .map((p) => ({
      radius: p.pl_rade!,
      mass: p.pl_bmasse!,
      score: p.habitability_score,
      name: p.pl_name,
      isHabitable: p.is_habitable_zone,
      isEarthLike: p.is_earth_like,
      planetType: p.planet_type,
    }));
}

// =============================================================================
// FILTER HELPERS
// =============================================================================

export type SpatialFilter = 'all' | 'habitable' | 'earthLike' | 'top20';

export function filterSpatialData(data: SpatialPoint[], filter: SpatialFilter): SpatialPoint[] {
  switch (filter) {
    case 'habitable':
      return data.filter((p) => p.isHabitable);
    case 'earthLike':
      return data.filter((p) => p.isEarthLike);
    case 'top20':
      return [...data].sort((a, b) => b.score - a.score).slice(0, 20);
    default:
      return data;
  }
}

// =============================================================================
// PLANET TYPE × STAR CLASS HEATMAP
// =============================================================================

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

const PLANET_TYPE_ORDER = [
  'Sub-Earth',
  'Earth-sized',
  'Super-Earth',
  'Sub-Neptune',
  'Neptune-like',
  'Gas Giant',
];

export function getPlanetStarHeatmap(planets: Exoplanet[]): {
  data: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  maxValue: number;
} {
  const counts = new Map<string, number>();

  planets.forEach((p) => {
    const starClass = p.star_class || 'Unknown';
    const planetType = p.planet_type || 'Unknown';
    const key = `${starClass}|${planetType}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const data: HeatmapCell[] = [];
  let maxValue = 0;

  STAR_CLASS_ORDER.forEach((starClass) => {
    PLANET_TYPE_ORDER.forEach((planetType) => {
      const value = counts.get(`${starClass}|${planetType}`) || 0;
      data.push({ x: starClass, y: planetType, value });
      if (value > maxValue) maxValue = value;
    });
  });

  return {
    data,
    xLabels: STAR_CLASS_ORDER,
    yLabels: PLANET_TYPE_ORDER,
    maxValue,
  };
}

// =============================================================================
// FEATURE PREVALENCE
// =============================================================================

export interface FeaturePrevalence {
  feature: string;
  label: string;
  count: number;
  pct: number;
  category: string;
}

type BooleanFeatureKey = keyof {
  [K in keyof Exoplanet as Exoplanet[K] extends boolean ? K : never]: boolean;
};

const FEATURE_DEFINITIONS: {
  key: BooleanFeatureKey;
  label: string;
  category: string;
}[] = [
  // Habitability
  { key: 'is_habitable_zone', label: 'Habitable Zone', category: 'Habitability' },
  { key: 'is_earth_like', label: 'Earth-like', category: 'Habitability' },
  { key: 'is_potentially_rocky', label: 'Potentially Rocky', category: 'Habitability' },
  { key: 'has_earth_like_insolation', label: 'Earth-like Insolation', category: 'Habitability' },
  { key: 'is_conservative_habitable', label: 'Conservative HZ', category: 'Habitability' },
  { key: 'is_optimistic_habitable', label: 'Optimistic HZ', category: 'Habitability' },
  { key: 'is_top_habitable_candidate', label: 'Top Candidate', category: 'Habitability' },

  // Planet characteristics
  { key: 'is_hot_jupiter', label: 'Hot Jupiter', category: 'Planet Type' },
  { key: 'is_hot_neptune', label: 'Hot Neptune', category: 'Planet Type' },
  { key: 'is_ultra_hot', label: 'Ultra Hot', category: 'Planet Type' },
  { key: 'is_frozen_world', label: 'Frozen World', category: 'Planet Type' },
  { key: 'is_puffy', label: 'Puffy', category: 'Planet Type' },
  { key: 'is_ultra_dense', label: 'Ultra Dense', category: 'Planet Type' },

  // Orbital
  { key: 'is_likely_tidally_locked', label: 'Tidally Locked', category: 'Orbital' },
  { key: 'is_circular_orbit', label: 'Circular Orbit', category: 'Orbital' },
  { key: 'is_eccentric_orbit', label: 'Eccentric Orbit', category: 'Orbital' },
  { key: 'is_ultra_short_period', label: 'Ultra Short Period', category: 'Orbital' },

  // System
  { key: 'is_multi_planet_system', label: 'Multi-planet System', category: 'System' },
  { key: 'is_circumbinary', label: 'Circumbinary', category: 'System' },
  { key: 'is_nearby', label: 'Nearby (<100 ly)', category: 'System' },
  { key: 'is_very_nearby', label: 'Very Nearby (<50 ly)', category: 'System' },

  // Star
  { key: 'is_sun_like_star', label: 'Sun-like Star', category: 'Star' },
  { key: 'is_red_dwarf_host', label: 'Red Dwarf Host', category: 'Star' },
  { key: 'is_solar_analog', label: 'Solar Analog', category: 'Star' },
];

export function getFeaturePrevalence(planets: Exoplanet[]): FeaturePrevalence[] {
  const total = planets.length;

  return FEATURE_DEFINITIONS.map(({ key, label, category }) => {
    const count = planets.filter((p) => p[key] === true).length;
    return {
      feature: key,
      label,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
      category,
    };
  }).sort((a, b) => b.pct - a.pct);
}

// =============================================================================
// FEATURE CO-OCCURRENCE (for heatmap)
// =============================================================================

const COOCCURRENCE_FEATURES: { key: BooleanFeatureKey; label: string }[] = [
  { key: 'is_habitable_zone', label: 'Habitable Zone' },
  { key: 'is_earth_like', label: 'Earth-like' },
  { key: 'is_potentially_rocky', label: 'Rocky' },
  { key: 'has_earth_like_insolation', label: 'Earth Insolation' },
  { key: 'is_likely_tidally_locked', label: 'Tidally Locked' },
  { key: 'is_multi_planet_system', label: 'Multi-planet' },
  { key: 'is_sun_like_star', label: 'Sun-like Star' },
  { key: 'is_red_dwarf_host', label: 'Red Dwarf' },
  { key: 'is_nearby', label: 'Nearby' },
];

export function getFeatureCooccurrence(planets: Exoplanet[]): {
  data: HeatmapCell[];
  labels: string[];
  maxValue: number;
} {
  const labels = COOCCURRENCE_FEATURES.map((f) => f.label);
  const data: HeatmapCell[] = [];
  let maxValue = 0;

  COOCCURRENCE_FEATURES.forEach((f1) => {
    COOCCURRENCE_FEATURES.forEach((f2) => {
      const count = planets.filter(
        (p) => p[f1.key] === true && p[f2.key] === true
      ).length;

      // Calculate as percentage of planets with f1 that also have f2
      const f1Count = planets.filter((p) => p[f1.key] === true).length;
      const pct = f1Count > 0 ? (count / f1Count) * 100 : 0;

      data.push({ x: f1.label, y: f2.label, value: Math.round(pct) });
      if (pct > maxValue && f1.key !== f2.key) maxValue = pct;
    });
  });

  return { data, labels, maxValue: 100 };
}

// =============================================================================
// HABITABILITY BREAKDOWN (Venn-style data)
// =============================================================================

export interface HabitabilityBreakdown {
  category: string;
  count: number;
  pct: number;
  color: string;
}

export function getHabitabilityBreakdown(planets: Exoplanet[]): HabitabilityBreakdown[] {
  const total = planets.length;

  const conservative = planets.filter((p) => p.is_conservative_habitable).length;
  const optimistic = planets.filter(
    (p) => p.is_optimistic_habitable && !p.is_conservative_habitable
  ).length;
  const earthLike = planets.filter((p) => p.is_earth_like).length;
  const topCandidates = planets.filter((p) => p.is_top_habitable_candidate).length;
  const potentiallyRocky = planets.filter(
    (p) => p.is_potentially_rocky && !p.is_habitable_zone
  ).length;
  const other = total - conservative - optimistic - potentiallyRocky;

  return [
    {
      category: 'Top Candidates',
      count: topCandidates,
      pct: (topCandidates / total) * 100,
      color: '#ffd700',
    },
    {
      category: 'Earth-like',
      count: earthLike,
      pct: (earthLike / total) * 100,
      color: '#00ff88',
    },
    {
      category: 'Conservative HZ',
      count: conservative,
      pct: (conservative / total) * 100,
      color: '#00ccff',
    },
    {
      category: 'Optimistic HZ',
      count: optimistic,
      pct: (optimistic / total) * 100,
      color: '#ff8800',
    },
    {
      category: 'Potentially Rocky',
      count: potentiallyRocky,
      pct: (potentiallyRocky / total) * 100,
      color: '#aa88ff',
    },
    {
      category: 'Other',
      count: other,
      pct: (other / total) * 100,
      color: '#666666',
    },
  ];
}
