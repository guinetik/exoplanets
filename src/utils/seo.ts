/**
 * SEO Utility Functions
 * Helper functions for generating SEO metadata for different route types
 */

import type { Exoplanet } from '../types';
import type { Star } from '../types';

const SITE_URL = 'https://exoplanets.guinetik.com';

/**
 * Generate SEO metadata for a planet detail page
 * @param planet - The exoplanet data
 * @returns SEO metadata object
 */
export function getPlanetSEO(planet: Exoplanet) {
  const name = planet.pl_name;
  const type = planet.planet_type || 'exoplanet';
  const distance = planet.distance_ly 
    ? `${planet.distance_ly.toFixed(1)} light-years`
    : planet.sy_dist 
    ? `${planet.sy_dist.toFixed(1)} parsecs`
    : null;
  
  // Build description
  const parts: string[] = [];
  parts.push(`${name} is a ${type}`);
  
  if (distance) {
    parts.push(`located ${distance} away`);
  }
  
  if (planet.pl_rade) {
    parts.push(`${planet.pl_rade.toFixed(2)}× Earth's radius`);
  }
  
  if (planet.pl_eqt) {
    parts.push(`with an equilibrium temperature of ${Math.round(planet.pl_eqt)}K`);
  }
  
  if (planet.is_habitable_zone) {
    parts.push('in the habitable zone');
  }
  
  const description = parts.join(', ') + '. Explore detailed information, 3D visualization, and habitability analysis.';
  
  const keywords = [
    name,
    type,
    'exoplanet',
    planet.discoverymethod || 'exoplanet discovery',
    planet.hostname || 'exoplanet system',
    planet.is_habitable_zone ? 'habitable zone' : '',
    planet.is_potentially_rocky ? 'rocky planet' : '',
  ].filter(Boolean).join(', ');
  
  return {
    title: name,
    description,
    keywords,
    url: `${SITE_URL}/planets/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
    type: 'article',
  };
}

/**
 * Generate SEO metadata for a star detail page
 * @param star - The star data
 * @returns SEO metadata object
 */
export function getStarSEO(star: Star) {
  const name = star.hostname;
  const spectralType = star.st_spectype || star.star_class || '';
  const distance = star.distance_ly 
    ? `${star.distance_ly.toFixed(1)} light-years`
    : star.sy_dist 
    ? `${star.sy_dist.toFixed(1)} parsecs`
    : null;
  
  // Build description
  const parts: string[] = [];
  if (spectralType) {
    parts.push(`${name} is a ${spectralType} star`);
  } else {
    parts.push(`${name} is a star`);
  }
  
  if (distance) {
    parts.push(`located ${distance} away`);
  }
  
  if (star.st_teff) {
    parts.push(`with a surface temperature of ${Math.round(star.st_teff)}K`);
  }
  
  const planetCount = star.sy_pnum || star.planets?.length || 0;
  if (planetCount > 0) {
    parts.push(`hosting ${planetCount} confirmed planet${planetCount > 1 ? 's' : ''}`);
  }
  
  if (star.sy_snum > 1) {
    parts.push('in a binary star system');
  }
  
  const description = parts.join(', ') + '. Explore the star system, planetary orbits, and detailed stellar properties.';
  
  const keywords = [
    name,
    spectralType,
    'star',
    'exoplanet host star',
    star.sy_snum > 1 ? 'binary star system' : 'single star system',
    planetCount > 0 ? `${planetCount} planets` : '',
  ].filter(Boolean).join(', ');
  
  return {
    title: name,
    description,
    keywords,
    url: `${SITE_URL}/stars/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
    type: 'article',
  };
}

/**
 * Generate SEO metadata for catalog pages
 * @param pageType - Type of catalog page ('planets' | 'stars')
 * @returns SEO metadata object
 */
export function getCatalogSEO(pageType: 'planets' | 'stars') {
  if (pageType === 'planets') {
    return {
      title: 'Planet Catalog',
      description: 'Browse and explore thousands of confirmed exoplanets. Filter by type, size, temperature, and habitability. Discover Earth-like worlds, gas giants, and exotic planetary systems.',
      keywords: 'exoplanets, planet catalog, habitable planets, gas giants, rocky planets, NASA exoplanet archive',
      url: `${SITE_URL}/planets`,
    };
  } else {
    return {
      title: 'Star Catalog',
      description: 'Explore host stars of confirmed exoplanets. Browse stellar systems, binary stars, and discover the stars that harbor distant worlds.',
      keywords: 'exoplanet host stars, stellar catalog, binary stars, star systems, NASA exoplanet archive',
      url: `${SITE_URL}/stars`,
    };
  }
}

/**
 * Generate SEO metadata for the home page
 * @returns SEO metadata object
 */
export function getHomeSEO() {
  return {
    title: 'Home',
    description: 'Exploring 6,000+ confirmed worlds beyond our solar system. Interactive 3D visualizations, habitability analysis, and detailed information about exoplanets and their host stars.',
    keywords: 'exoplanets, planets, stars, space exploration, NASA, habitability, astronomy, 3D visualization',
    url: SITE_URL,
  };
}

/**
 * Generate SEO metadata for the habitability page
 * @returns SEO metadata object
 */
export function getHabitabilitySEO() {
  return {
    title: 'Habitability Analysis',
    description: 'Analyze and discover potentially habitable exoplanets. Explore habitability scores, temperature zones, and find Earth-like worlds that could support life.',
    keywords: 'habitable planets, habitability, exoplanets, Earth-like planets, habitable zone, astrobiology',
    url: `${SITE_URL}/habitability`,
  };
}

/**
 * Generate SEO metadata for the APOD page
 * @returns SEO metadata object
 */
export function getAPODSEO() {
  return {
    title: 'Astronomy Picture of the Day',
    description: 'Discover NASA\'s Astronomy Picture of the Day. Explore stunning images of space, exoplanets, stars, and cosmic phenomena.',
    keywords: 'NASA APOD, astronomy picture of the day, space images, NASA, astronomy',
    url: `${SITE_URL}/apod`,
  };
}

/**
 * Generate SEO metadata for the vote page
 * @returns SEO metadata object
 */
export function getVoteSEO() {
  return {
    title: 'Vote for Earth 2.0',
    description: 'Help us identify the most promising Earth-like exoplanet candidates. Vote for planets that could potentially support life and share your thoughts.',
    keywords: 'Earth 2.0, habitable planets, exoplanet voting, community, space exploration',
    url: `${SITE_URL}/vote`,
  };
}

/**
 * Generate SEO metadata for the about page
 * @returns SEO metadata object
 */
export function getAboutSEO() {
  return {
    title: 'About',
    description: 'Learn about the Exoplanets project, the story of exoplanet exploration, and the technology behind this interactive visualization of 6,000+ confirmed worlds.',
    keywords: 'exoplanets project, NASA exoplanet archive, space visualization, Three.js, astronomy',
    url: `${SITE_URL}/about`,
  };
}

/**
 * Generate SEO metadata for the tour page
 * @returns SEO metadata object
 */
export function getTourSEO() {
  return {
    title: 'Tour',
    description: 'Take an interactive tour of the exoplanet catalog. Learn how to explore planets, stars, and discover fascinating worlds beyond our solar system.',
    keywords: 'exoplanet tour, interactive tour, space exploration guide, exoplanets tutorial',
    url: `${SITE_URL}/tour`,
  };
}

