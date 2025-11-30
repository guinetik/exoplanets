/**
 * Data Service
 * Loads and manages exoplanet data from CSV
 */

import type { Exoplanet, Star, FilterOptions, SortOptions } from '../types';
import { createLogger } from '@guinetik/logger';
import { nameToSlug } from '../utils/urlSlug';

const logger = createLogger({ prefix: 'DataService' });

const DATA_URL = './data/exoplanets.csv';

class DataService {
  private planets: Exoplanet[] = [];
  private stars: Map<string, Star> = new Map();
  private planetsByName: Map<string, Exoplanet> = new Map();
  private planetsBySlug: Map<string, string> = new Map(); // slug -> planet name
  private starsBySlug: Map<string, string> = new Map(); // slug -> star hostname
  private loaded = false;

  /**
   * Load data from CSV file
   */
  async loadData(): Promise<void> {
    if (this.loaded) return;

    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.statusText}`);
    }

    const csvText = await response.text();
    this.planets = this.parseCSV(csvText);
    this.buildIndexes();
    this.loaded = true;

    logger.info(`Loaded ${this.planets.length} planets and ${this.stars.size} stars`);
  }

  /**
   * Parse CSV text into Exoplanet objects
   */
  private parseCSV(csvText: string): Exoplanet[] {
    const lines = csvText.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const planets: Exoplanet[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        const value = values[index];
        row[header] = this.parseValue(header, value);
      });

      planets.push(row as unknown as Exoplanet);
    }

    return planets;
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  /**
   * Parse a value to the appropriate type
   */
  private parseValue(header: string, value: string): unknown {
    if (value === '' || value === 'null' || value === 'NaN') {
      return null;
    }

    // Boolean fields (all is_* and has_* columns from the Python processing pipeline)
    if (header.startsWith('is_') || header.startsWith('has_')) {
      return value === 'True' || value === 'true' || value === '1';
    }

    // Integer fields
    const intFields = [
      'disc_year', 'sy_snum', 'sy_pnum', 'sy_mnum',
      'cb_flag', 'pl_controv_flag', 'tran_flag', 'rv_flag', 'ttv_flag'
    ];
    if (intFields.includes(header)) {
      return parseInt(value, 10);
    }

    // Float fields (most numeric columns)
    const floatFields = [
      'pl_rade', 'pl_radj', 'pl_bmasse', 'pl_bmassj', 'pl_dens', 'pl_eqt', 'pl_insol',
      'pl_orbper', 'pl_orbsmax', 'pl_orbeccen', 'pl_orbincl',
      'pl_trandep', 'pl_trandur', 'pl_ratror', 'pl_ratdor', 'pl_imppar',
      'st_teff', 'st_rad', 'st_mass', 'st_lum', 'st_logg', 'st_age', 'st_dens', 'st_met', 'st_rotp',
      'sy_dist', 'ra', 'dec', 'glat', 'glon', 'x', 'y', 'z',
      'sy_vmag', 'sy_kmag', 'sy_gaiamag', 'sy_tmag',
      'habitability_score', 'x_pc', 'y_pc', 'z_pc', 'distance_ly'
    ];
    if (floatFields.includes(header)) {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }

    return value;
  }

  /**
   * Build lookup indexes for fast queries
   */
  private buildIndexes(): void {
    // Index planets by name and slug
    for (const planet of this.planets) {
      this.planetsByName.set(planet.pl_name, planet);
      const slug = nameToSlug(planet.pl_name);
      this.planetsBySlug.set(slug, planet.pl_name);
    }

    // Group planets by host star
    const starGroups = new Map<string, Exoplanet[]>();
    for (const planet of this.planets) {
      const existing = starGroups.get(planet.hostname) || [];
      existing.push(planet);
      starGroups.set(planet.hostname, existing);
    }

    // Build star objects and index by slug
    for (const [hostname, planets] of starGroups) {
      const first = planets[0];
      const star: Star = {
        id: hostname,
        hostname,
        planets: planets.map(p => p.pl_name),
        st_teff: first.st_teff,
        st_rad: first.st_rad,
        st_mass: first.st_mass,
        st_lum: first.st_lum,
        st_logg: first.st_logg,
        st_age: first.st_age,
        st_dens: first.st_dens,
        st_met: first.st_met,
        st_rotp: first.st_rotp,
        st_spectype: first.st_spectype,
        star_class: first.star_class,
        sy_snum: first.sy_snum,
        sy_pnum: first.sy_pnum,
        sy_mnum: first.sy_mnum,
        sy_dist: first.sy_dist,
        distance_ly: first.distance_ly,
        distance_display: first.distance_display,
        ra: first.ra,
        dec: first.dec,
        rastr: first.rastr,
        decstr: first.decstr,
        glat: first.glat,
        glon: first.glon,
        x: first.x,
        y: first.y,
        z: first.z,
        x_pc: first.x_pc,
        y_pc: first.y_pc,
        z_pc: first.z_pc,
        sy_vmag: first.sy_vmag,
        sy_kmag: first.sy_kmag,
        sy_gaiamag: first.sy_gaiamag,
        sy_tmag: first.sy_tmag,
        cb_flag: planets.some(p => p.cb_flag === 1),
      };
      this.stars.set(hostname, star);
      const slug = nameToSlug(hostname);
      this.starsBySlug.set(slug, hostname);

      // Manual aliases for famous systems that might be known by other names
      if (hostname === 'KOI-351') {
        this.starsBySlug.set('kepler-90', hostname);
      }
    }
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  isLoaded(): boolean {
    return this.loaded;
  }

  // ===========================================================================
  // PLANET QUERIES
  // ===========================================================================

  getAllPlanets(): Exoplanet[] {
    return this.planets;
  }

  getPlanetByName(name: string): Exoplanet | undefined {
    return this.planetsByName.get(name);
  }

  /**
   * Get a planet by its URL slug
   * @param slug - The slug version of the planet name
   * @returns The planet if found, undefined otherwise
   */
  getPlanetBySlug(slug: string): Exoplanet | undefined {
    const name = this.planetsBySlug.get(slug);
    return name ? this.planetsByName.get(name) : undefined;
  }

  getPlanetsByHost(hostname: string): Exoplanet[] {
    return this.planets.filter(p => p.hostname === hostname);
  }

  filterPlanets(options: FilterOptions): Exoplanet[] {
    return this.planets.filter(planet => {
      if (options.planetType && planet.planet_type !== options.planetType) {
        return false;
      }
      if (options.starClass && planet.star_class !== options.starClass) {
        return false;
      }
      if (options.discoveryMethod && planet.discoverymethod !== options.discoveryMethod) {
        return false;
      }
      if (options.minYear && planet.disc_year < options.minYear) {
        return false;
      }
      if (options.maxYear && planet.disc_year > options.maxYear) {
        return false;
      }
      if (options.habitableOnly && !planet.is_habitable_zone) {
        return false;
      }
      if (options.earthLikeOnly && !planet.is_earth_like) {
        return false;
      }
      if (options.maxDistance && planet.distance_ly && planet.distance_ly > options.maxDistance) {
        return false;
      }
      return true;
    });
  }

  sortPlanets(planets: Exoplanet[], options: SortOptions): Exoplanet[] {
    return [...planets].sort((a, b) => {
      const aVal = a[options.field];
      const bVal = b[options.field];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      }

      return options.direction === 'desc' ? -comparison : comparison;
    });
  }

  // ===========================================================================
  // STAR QUERIES
  // ===========================================================================

  getAllStars(): Star[] {
    return Array.from(this.stars.values());
  }

  getStarByName(hostname: string): Star | undefined {
    return this.stars.get(hostname);
  }

  /**
   * Get a star by its URL slug
   * @param slug - The slug version of the star hostname
   * @returns The star if found, undefined otherwise
   */
  getStarBySlug(slug: string): Star | undefined {
    const hostname = this.starsBySlug.get(slug);
    return hostname ? this.stars.get(hostname) : undefined;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  getStats() {
    const planets = this.planets;
    return {
      totalPlanets: planets.length,
      totalStars: this.stars.size,
      habitableZone: planets.filter(p => p.is_habitable_zone).length,
      earthLike: planets.filter(p => p.is_earth_like).length,
      circumbinary: planets.filter(p => p.cb_flag === 1).length,
      byType: this.groupBy(planets, 'planet_type'),
      byMethod: this.groupBy(planets, 'discoverymethod'),
      byStarClass: this.groupBy(planets, 'star_class'),
    };
  }

  private groupBy<K extends keyof Exoplanet>(
    planets: Exoplanet[],
    key: K
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const planet of planets) {
      const value = String(planet[key] ?? 'Unknown');
      result[value] = (result[value] || 0) + 1;
    }
    return result;
  }

  // ===========================================================================
  // SPECIAL QUERIES
  // ===========================================================================

  getTopHabitable(limit = 10): Exoplanet[] {
    return [...this.planets]
      .sort((a, b) => b.habitability_score - a.habitability_score)
      .slice(0, limit);
  }

  getClosestPlanets(limit = 10): Exoplanet[] {
    return [...this.planets]
      .filter(p => p.distance_ly !== null)
      .sort((a, b) => (a.distance_ly ?? Infinity) - (b.distance_ly ?? Infinity))
      .slice(0, limit);
  }

  getRecentDiscoveries(limit = 10): Exoplanet[] {
    return [...this.planets]
      .sort((a, b) => b.disc_year - a.disc_year)
      .slice(0, limit);
  }

  searchPlanets(query: string): Exoplanet[] {
    const lowerQuery = query.toLowerCase();
    return this.planets.filter(
      p =>
        p.pl_name.toLowerCase().includes(lowerQuery) ||
        p.hostname.toLowerCase().includes(lowerQuery)
    );
  }

  searchStars(query: string): Star[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllStars().filter(s =>
      s.hostname.toLowerCase().includes(lowerQuery)
    );
  }
}

// Singleton instance
export const dataService = new DataService();

// For testing purposes
export function resetDataService(): void {
  (dataService as unknown as { loaded: boolean; planets: Exoplanet[]; stars: Map<string, Star>; planetsByName: Map<string, Exoplanet>; planetsBySlug: Map<string, string>; starsBySlug: Map<string, string> }).loaded = false;
  (dataService as unknown as { planets: Exoplanet[] }).planets = [];
  (dataService as unknown as { stars: Map<string, Star> }).stars = new Map();
  (dataService as unknown as { planetsByName: Map<string, Exoplanet> }).planetsByName = new Map();
  (dataService as unknown as { planetsBySlug: Map<string, string> }).planetsBySlug = new Map();
  (dataService as unknown as { starsBySlug: Map<string, string> }).starsBySlug = new Map();
}

// Export slug utility for use in components
export { nameToSlug } from '../utils/urlSlug';
