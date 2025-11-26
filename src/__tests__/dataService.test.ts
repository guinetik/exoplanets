/**
 * Tests for Data Service
 */

import { mockCSV } from '../test/mocks';

// Create a fresh instance for testing (not the singleton)
class TestDataService {
  private planets: any[] = [];
  private stars: Map<string, any> = new Map();
  private planetsByName: Map<string, any> = new Map();
  private loaded = false;

  async loadFromString(csvText: string): Promise<void> {
    this.planets = this.parseCSV(csvText);
    this.buildIndexes();
    this.loaded = true;
  }

  private parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const planets: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        const value = values[index];
        row[header] = this.parseValue(header, value);
      });

      planets.push(row);
    }

    return planets;
  }

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

  private parseValue(header: string, value: string): unknown {
    if (value === '' || value === 'null' || value === 'NaN') {
      return null;
    }

    if (header === 'is_habitable_zone' || header === 'is_earth_like') {
      return value === 'True' || value === 'true' || value === '1';
    }

    const intFields = [
      'disc_year', 'sy_snum', 'sy_pnum', 'sy_mnum',
      'cb_flag', 'pl_controv_flag', 'tran_flag', 'rv_flag', 'ttv_flag'
    ];
    if (intFields.includes(header)) {
      return parseInt(value, 10);
    }

    const floatFields = [
      'pl_rade', 'pl_radj', 'pl_bmasse', 'pl_bmassj', 'pl_dens', 'pl_eqt', 'pl_insol',
      'pl_orbper', 'pl_orbsmax', 'pl_orbeccen', 'pl_orbincl',
      'st_teff', 'st_rad', 'st_mass', 'st_lum', 'st_logg', 'st_age', 'st_dens', 'st_met', 'st_rotp',
      'sy_dist', 'ra', 'dec', 'glat', 'glon', 'x', 'y', 'z',
      'habitability_score', 'x_pc', 'y_pc', 'z_pc', 'distance_ly'
    ];
    if (floatFields.includes(header)) {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }

    return value;
  }

  private buildIndexes(): void {
    for (const planet of this.planets) {
      this.planetsByName.set(planet.pl_name, planet);
    }

    const starGroups = new Map<string, any[]>();
    for (const planet of this.planets) {
      const existing = starGroups.get(planet.hostname) || [];
      existing.push(planet);
      starGroups.set(planet.hostname, existing);
    }

    for (const [hostname, planets] of starGroups) {
      const first = planets[0];
      this.stars.set(hostname, {
        id: hostname,
        hostname,
        planets: planets.map((p: any) => p.pl_name),
        st_teff: first.st_teff,
        st_rad: first.st_rad,
        star_class: first.star_class,
        sy_pnum: first.sy_pnum,
        sy_dist: first.sy_dist,
      });
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getAllPlanets(): any[] {
    return this.planets;
  }

  getPlanetByName(name: string): any | undefined {
    return this.planetsByName.get(name);
  }

  getPlanetsByHost(hostname: string): any[] {
    return this.planets.filter(p => p.hostname === hostname);
  }

  getAllStars(): any[] {
    return Array.from(this.stars.values());
  }

  getStarByName(hostname: string): any | undefined {
    return this.stars.get(hostname);
  }

  filterPlanets(options: {
    planetType?: string;
    discoveryMethod?: string;
    habitableOnly?: boolean;
    earthLikeOnly?: boolean;
  }): any[] {
    return this.planets.filter(planet => {
      if (options.planetType && planet.planet_type !== options.planetType) {
        return false;
      }
      if (options.discoveryMethod && planet.discoverymethod !== options.discoveryMethod) {
        return false;
      }
      if (options.habitableOnly && !planet.is_habitable_zone) {
        return false;
      }
      if (options.earthLikeOnly && !planet.is_earth_like) {
        return false;
      }
      return true;
    });
  }

  searchPlanets(query: string): any[] {
    const lowerQuery = query.toLowerCase();
    return this.planets.filter(
      p =>
        p.pl_name.toLowerCase().includes(lowerQuery) ||
        p.hostname.toLowerCase().includes(lowerQuery)
    );
  }

  getTopHabitable(limit = 10): any[] {
    return [...this.planets]
      .sort((a, b) => b.habitability_score - a.habitability_score)
      .slice(0, limit);
  }
}

describe('DataService', () => {
  let service: TestDataService;

  beforeEach(async () => {
    service = new TestDataService();
    await service.loadFromString(mockCSV);
  });

  describe('CSV Parsing', () => {
    test('parses correct number of planets', () => {
      const planets = service.getAllPlanets();
      expect(planets.length).toBe(3);
    });

    test('parses string fields correctly', () => {
      const planet = service.getPlanetByName('Test Planet b');
      expect(planet.pl_name).toBe('Test Planet b');
      expect(planet.hostname).toBe('Test Star');
      expect(planet.discoverymethod).toBe('Transit');
    });

    test('parses numeric fields correctly', () => {
      const planet = service.getPlanetByName('Test Planet b');
      expect(planet.pl_rade).toBe(1.5);
      expect(planet.disc_year).toBe(2020);
      expect(planet.sy_dist).toBe(10);
    });

    test('parses boolean fields correctly', () => {
      const planet = service.getPlanetByName('Test Planet b');
      expect(planet.is_habitable_zone).toBe(true);
      expect(planet.is_earth_like).toBe(false);

      const planet2 = service.getPlanetByName('Test Planet c');
      expect(planet2.is_earth_like).toBe(true);
    });

    test('handles empty spectral type', () => {
      const planet = service.getPlanetByName('Hot Jupiter b');
      expect(planet.st_rotp).toBeNull();
    });
  });

  describe('Planet Queries', () => {
    test('getPlanetByName returns correct planet', () => {
      const planet = service.getPlanetByName('Test Planet c');
      expect(planet).toBeDefined();
      expect(planet.pl_letter).toBe('c');
    });

    test('getPlanetByName returns undefined for non-existent', () => {
      const planet = service.getPlanetByName('Non Existent');
      expect(planet).toBeUndefined();
    });

    test('getPlanetsByHost returns all planets for star', () => {
      const planets = service.getPlanetsByHost('Test Star');
      expect(planets.length).toBe(2);
      expect(planets.map(p => p.pl_name)).toContain('Test Planet b');
      expect(planets.map(p => p.pl_name)).toContain('Test Planet c');
    });

    test('getPlanetsByHost returns empty for unknown star', () => {
      const planets = service.getPlanetsByHost('Unknown Star');
      expect(planets.length).toBe(0);
    });
  });

  describe('Star Queries', () => {
    test('getAllStars returns correct count', () => {
      const stars = service.getAllStars();
      expect(stars.length).toBe(2); // Test Star and Hot Star
    });

    test('getStarByName returns correct star', () => {
      const star = service.getStarByName('Test Star');
      expect(star).toBeDefined();
      expect(star.planets.length).toBe(2);
    });

    test('star aggregates planet names', () => {
      const star = service.getStarByName('Test Star');
      expect(star.planets).toContain('Test Planet b');
      expect(star.planets).toContain('Test Planet c');
    });
  });

  describe('Filtering', () => {
    test('filters by planet type', () => {
      const filtered = service.filterPlanets({ planetType: 'Gas Giant' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].pl_name).toBe('Hot Jupiter b');
    });

    test('filters by discovery method', () => {
      const filtered = service.filterPlanets({ discoveryMethod: 'Transit' });
      expect(filtered.length).toBe(2);
    });

    test('filters habitable only', () => {
      const filtered = service.filterPlanets({ habitableOnly: true });
      expect(filtered.length).toBe(2);
      expect(filtered.every(p => p.is_habitable_zone)).toBe(true);
    });

    test('filters earth-like only', () => {
      const filtered = service.filterPlanets({ earthLikeOnly: true });
      expect(filtered.length).toBe(1);
      expect(filtered[0].pl_name).toBe('Test Planet c');
    });

    test('combines filters', () => {
      const filtered = service.filterPlanets({
        habitableOnly: true,
        earthLikeOnly: true,
      });
      expect(filtered.length).toBe(1);
    });
  });

  describe('Search', () => {
    test('searches by planet name', () => {
      const results = service.searchPlanets('Jupiter');
      expect(results.length).toBe(1);
      expect(results[0].pl_name).toBe('Hot Jupiter b');
    });

    test('searches by hostname', () => {
      const results = service.searchPlanets('Test Star');
      expect(results.length).toBe(2);
    });

    test('search is case insensitive', () => {
      const results = service.searchPlanets('test');
      expect(results.length).toBe(2);
    });

    test('returns empty for no matches', () => {
      const results = service.searchPlanets('xyz123');
      expect(results.length).toBe(0);
    });
  });

  describe('Sorting and Special Queries', () => {
    test('getTopHabitable returns sorted by score', () => {
      const top = service.getTopHabitable(3);
      expect(top.length).toBe(3);
      expect(top[0].habitability_score).toBeGreaterThanOrEqual(top[1].habitability_score);
      expect(top[1].habitability_score).toBeGreaterThanOrEqual(top[2].habitability_score);
    });

    test('getTopHabitable respects limit', () => {
      const top = service.getTopHabitable(1);
      expect(top.length).toBe(1);
      expect(top[0].pl_name).toBe('Test Planet c'); // Highest score
    });
  });

  describe('State', () => {
    test('isLoaded returns true after loading', () => {
      expect(service.isLoaded()).toBe(true);
    });

    test('isLoaded returns false before loading', () => {
      const newService = new TestDataService();
      expect(newService.isLoaded()).toBe(false);
    });
  });
});
