/**
 * Tour Data Utilities
 * Data transformation and query functions for the Tour page
 * Each planet includes a description explaining why it's special
 */

import type { TFunction } from 'i18next';
import type { Exoplanet, Star } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export interface TourPlanet extends Exoplanet {
  tourCategory?: string;
  tourDescription?: string;
}

export interface TourStar extends Star {
  tourCategory?: string;
  tourDescription?: string;
}

export interface RecordPlanet extends TourPlanet {
  record: string;
  recordValue: string;
}

export interface ExtremePlanet extends TourPlanet {
  extremeType: 'ultra_hot' | 'puffy' | 'circumbinary' | 'ultra_dense' | 'eccentric';
  extremeLabel: string;
}

// =============================================================================
// FAMOUS WORLDS - Curated list with translation keys
// =============================================================================

const FAMOUS_PLANET_NAMES = [
  'Proxima Cen b',
  'TRAPPIST-1 e',
  'Kepler-452 b',
  '51 Peg b',
  'Kepler-16 b',
  'Kepler-186 f',
];

// Map planet names to translation keys
const FAMOUS_PLANET_KEYS: Record<string, string> = {
  'Proxima Cen b': 'proximaCenB',
  'TRAPPIST-1 e': 'trappist1e',
  'Kepler-452 b': 'kepler452b',
  '51 Peg b': 'fiftyOnePegB',
  'Kepler-16 b': 'kepler16b',
  'Kepler-186 f': 'kepler186f',
};

export function getFamousPlanets(planets: Exoplanet[], t: TFunction): TourPlanet[] {
  const planetMap = new Map(planets.map((p) => [p.pl_name, p]));
  const result: TourPlanet[] = [];

  FAMOUS_PLANET_NAMES.forEach((name) => {
    const planet = planetMap.get(name);
    const key = FAMOUS_PLANET_KEYS[name];
    if (planet && key) {
      result.push({
        ...planet,
        tourCategory: 'famous',
        tourDescription: t(`pages.tour.descriptions.famous.${key}`),
      });
    }
  });

  return result;
}

// =============================================================================
// FAMOUS STARS - Curated list
// =============================================================================

const FAMOUS_STAR_NAMES = [
  'Proxima Cen',
  'Barnard\'s star',
  'Wolf 1069',
  'TRAPPIST-1',
  '51 Peg',
  'iot Dra',
  'Kepler-186',
  'KOI-351', // Kepler-90
  'Kepler-16',
];

const FAMOUS_STAR_KEYS: Record<string, string> = {
  'Proxima Cen': 'proximaCen',
  'Barnard\'s star': 'barnardsStar',
  'Wolf 1069': 'wolf1069',
  'TRAPPIST-1': 'trappist1',
  '51 Peg': 'fiftyOnePeg',
  'iot Dra': 'iotDra',
  'Kepler-186': 'kepler186',
  'KOI-351': 'kepler90',
  'Kepler-16': 'kepler16',
};

export function getFamousStars(stars: Star[], t: TFunction): TourStar[] {
  const starMap = new Map(stars.map((s) => [s.hostname, s]));
  const result: TourStar[] = [];

  FAMOUS_STAR_NAMES.forEach((name) => {
    const star = starMap.get(name);
    const key = FAMOUS_STAR_KEYS[name];
    if (star && key) {
      // Rename KOI-351 to its more famous name Kepler-90
      const starData = { ...star };
      if (starData.hostname === 'KOI-351') {
        starData.hostname = 'Kepler-90';
      }

      result.push({
        ...starData,
        tourCategory: 'famousStar',
        tourDescription: t(`pages.tour.descriptions.stars.${key}`),
      });
    }
  });

  return result;
}

// =============================================================================
// NEAREST NEIGHBORS - Dynamic descriptions based on distance
// =============================================================================

function generateNearbyDescription(planet: Exoplanet, t: TFunction): string {
  const distance = planet.distance_ly?.toFixed(1) ?? 'unknown';
  const type = planet.planet_type ?? t('pages.tour.descriptions.common.world');

  if (planet.is_habitable_zone) {
    return t('pages.tour.descriptions.nearby.habitableZone', { distance, type });
  }

  if (planet.sy_pnum > 1) {
    return t('pages.tour.descriptions.nearby.multiPlanet', { distance, count: planet.sy_pnum });
  }

  return t('pages.tour.descriptions.nearby.default', { distance, type });
}

export function getNearestNeighbors(planets: Exoplanet[], t: TFunction): TourPlanet[] {
  return planets
    .filter((p) => p.distance_ly !== null && p.distance_ly > 0 && p.distance_ly < 50)
    .sort((a, b) => (a.distance_ly ?? Infinity) - (b.distance_ly ?? Infinity))
    .slice(0, 6)
    .map((p) => ({
      ...p,
      tourCategory: 'nearby',
      tourDescription: generateNearbyDescription(p, t),
    }));
}

// =============================================================================
// MOST HABITABLE - Dynamic descriptions based on habitability factors
// =============================================================================

function generateHabitableDescription(planet: Exoplanet, t: TFunction): string {
  const score = planet.habitability_score.toFixed(0);
  const parts: string[] = [];

  if (planet.is_earth_like) {
    parts.push(t('pages.tour.descriptions.habitable.traits.earthSized'));
  } else if (planet.planet_type) {
    parts.push(planet.planet_type);
  }

  if (planet.is_habitable_zone) {
    parts.push(t('pages.tour.descriptions.habitable.traits.habitableZone'));
  }

  if (planet.is_sun_like_star) {
    parts.push(t('pages.tour.descriptions.habitable.traits.sunLikeStar'));
  } else if (planet.is_red_dwarf_host) {
    parts.push(t('pages.tour.descriptions.habitable.traits.redDwarf'));
  }

  const intro = parts.length > 0
    ? t('pages.tour.descriptions.habitable.intro', { traits: parts.join(', ') })
    : '';

  return intro + t('pages.tour.descriptions.habitable.score', { score });
}

export function getMostHabitable(planets: Exoplanet[], t: TFunction): TourPlanet[] {
  return planets
    .filter((p) => p.is_top_habitable_candidate || p.habitability_score > 60)
    .sort((a, b) => b.habitability_score - a.habitability_score)
    .slice(0, 6)
    .map((p) => ({
      ...p,
      tourCategory: 'habitable',
      tourDescription: generateHabitableDescription(p, t),
    }));
}

// =============================================================================
// EXTREME WORLDS - Descriptions for each extreme type
// =============================================================================

function getExtremeDescription(type: string, planet: Exoplanet, t: TFunction): string {
  switch (type) {
    case 'ultra_hot': {
      const temp = planet.pl_eqt?.toFixed(0) ?? '2000+';
      return t('pages.tour.descriptions.extreme.ultraHot', { temp });
    }
    case 'puffy': {
      const density = planet.pl_dens?.toFixed(2) ?? t('pages.tour.descriptions.common.veryLow');
      return t('pages.tour.descriptions.extreme.puffy', { density });
    }
    case 'circumbinary':
      return t('pages.tour.descriptions.extreme.circumbinary');
    case 'ultra_dense': {
      const density = planet.pl_dens?.toFixed(1) ?? '8+';
      return t('pages.tour.descriptions.extreme.ultraDense', { density });
    }
    case 'eccentric': {
      const ecc = planet.pl_orbeccen?.toFixed(2) ?? '0.3+';
      return t('pages.tour.descriptions.extreme.eccentric', { ecc });
    }
    default:
      return '';
  }
}

export function getExtremeWorlds(planets: Exoplanet[], t: TFunction): ExtremePlanet[] {
  const extremeTypes: Array<{
    flag: keyof Exoplanet;
    type: ExtremePlanet['extremeType'];
    labelKey: string;
  }> = [
    { flag: 'is_ultra_hot', type: 'ultra_hot', labelKey: 'pages.tour.descriptions.extreme.labels.ultraHot' },
    { flag: 'is_puffy', type: 'puffy', labelKey: 'pages.tour.descriptions.extreme.labels.puffy' },
    { flag: 'is_circumbinary', type: 'circumbinary', labelKey: 'pages.tour.descriptions.extreme.labels.circumbinary' },
    { flag: 'is_ultra_dense', type: 'ultra_dense', labelKey: 'pages.tour.descriptions.extreme.labels.ultraDense' },
    { flag: 'is_eccentric_orbit', type: 'eccentric', labelKey: 'pages.tour.descriptions.extreme.labels.eccentric' },
  ];

  const result: ExtremePlanet[] = [];

  // Get 1-2 of each type, max 6 total
  extremeTypes.forEach(({ flag, type, labelKey }) => {
    if (result.length >= 6) return;

    const matching = planets
      .filter((p) => p[flag] === true)
      .slice(0, result.length < 4 ? 2 : 1);

    matching.forEach((p) => {
      if (result.length < 6) {
        result.push({
          ...p,
          extremeType: type,
          extremeLabel: t(labelKey),
          tourCategory: 'extreme',
          tourDescription: getExtremeDescription(type, p, t),
        });
      }
    });
  });

  return result;
}

// =============================================================================
// RECORD BREAKERS - Each record with description
// =============================================================================

export function getRecordBreakers(planets: Exoplanet[], t: TFunction): RecordPlanet[] {
  const records: RecordPlanet[] = [];

  // Hottest
  const hottest = planets
    .filter((p) => p.pl_eqt !== null && p.pl_eqt > 0)
    .sort((a, b) => (b.pl_eqt ?? 0) - (a.pl_eqt ?? 0))[0];
  if (hottest) {
    const temp = hottest.pl_eqt?.toFixed(0);
    records.push({
      ...hottest,
      record: t('pages.tour.descriptions.records.labels.hottest'),
      recordValue: `${temp}K`,
      tourCategory: 'record',
      tourDescription: t('pages.tour.descriptions.records.hottest', { temp }),
    });
  }

  // Coldest
  const coldest = planets
    .filter((p) => p.pl_eqt !== null && p.pl_eqt > 0)
    .sort((a, b) => (a.pl_eqt ?? Infinity) - (b.pl_eqt ?? Infinity))[0];
  if (coldest) {
    const temp = coldest.pl_eqt?.toFixed(0);
    const tempC = ((coldest.pl_eqt ?? 0) - 273).toFixed(0);
    records.push({
      ...coldest,
      record: t('pages.tour.descriptions.records.labels.coldest'),
      recordValue: `${temp}K`,
      tourCategory: 'record',
      tourDescription: t('pages.tour.descriptions.records.coldest', { temp, tempC }),
    });
  }

  // Fastest orbit
  const fastest = planets
    .filter((p) => p.pl_orbper !== null && p.pl_orbper > 0)
    .sort((a, b) => (a.pl_orbper ?? Infinity) - (b.pl_orbper ?? Infinity))[0];
  if (fastest) {
    const period = fastest.pl_orbper!;
    const display = period < 1
      ? t('pages.tour.descriptions.common.hours', { value: (period * 24).toFixed(1) })
      : t('pages.tour.descriptions.common.days', { value: period.toFixed(2) });
    records.push({
      ...fastest,
      record: t('pages.tour.descriptions.records.labels.fastest'),
      recordValue: display,
      tourCategory: 'record',
      tourDescription: t('pages.tour.descriptions.records.fastest', { period: display }),
    });
  }

  // Largest
  const largest = planets
    .filter((p) => p.pl_radj !== null && p.pl_radj > 0)
    .sort((a, b) => (b.pl_radj ?? 0) - (a.pl_radj ?? 0))[0];
  if (largest) {
    const radius = largest.pl_radj?.toFixed(1);
    records.push({
      ...largest,
      record: t('pages.tour.descriptions.records.labels.largest'),
      recordValue: `${radius} R♃`,
      tourCategory: 'record',
      tourDescription: t('pages.tour.descriptions.records.largest', { radius }),
    });
  }

  // Smallest
  const smallest = planets
    .filter((p) => p.pl_rade !== null && p.pl_rade > 0)
    .sort((a, b) => (a.pl_rade ?? Infinity) - (b.pl_rade ?? Infinity))[0];
  if (smallest) {
    const radius = smallest.pl_rade?.toFixed(2);
    records.push({
      ...smallest,
      record: t('pages.tour.descriptions.records.labels.smallest'),
      recordValue: `${radius} R⊕`,
      tourCategory: 'record',
      tourDescription: t('pages.tour.descriptions.records.smallest', { radius }),
    });
  }

  // Oldest system
  const oldest = planets
    .filter((p) => p.st_age !== null && p.st_age > 0)
    .sort((a, b) => (b.st_age ?? 0) - (a.st_age ?? 0))[0];
  if (oldest) {
    const age = oldest.st_age?.toFixed(1);
    records.push({
      ...oldest,
      record: t('pages.tour.descriptions.records.labels.oldest'),
      recordValue: `${age} Gyr`,
      tourCategory: 'record',
      tourDescription: t('pages.tour.descriptions.records.oldest', { age }),
    });
  }

  return records.slice(0, 6);
}

// =============================================================================
// ALL TOUR DATA
// =============================================================================

export interface TourData {
  famous: TourPlanet[];
  famousStars: TourStar[];
  nearest: TourPlanet[];
  habitable: TourPlanet[];
  extreme: ExtremePlanet[];
  records: RecordPlanet[];
}

export function getTourData(planets: Exoplanet[], stars: Star[], t: TFunction): TourData {
  return {
    famous: getFamousPlanets(planets, t),
    famousStars: getFamousStars(stars, t),
    nearest: getNearestNeighbors(planets, t),
    habitable: getMostHabitable(planets, t),
    extreme: getExtremeWorlds(planets, t),
    records: getRecordBreakers(planets, t),
  };
}
