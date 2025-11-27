/**
 * Data Context
 * Manages data loading state and provides access to data service
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { dataService } from '../services/dataService';
import { shaderService } from '../services/shaderService';
import { loadBinaryData } from '../utils/solarSystem';
import { createLogger } from '@guinetik/logger';
import type { Exoplanet, Star, FilterOptions, SortOptions } from '../types';

const logger = createLogger({ prefix: 'DataContext' });

interface DataContextValue {
  isLoading: boolean;
  error: string | null;

  // Planet queries
  getAllPlanets: () => Exoplanet[];
  getPlanetByName: (name: string) => Exoplanet | undefined;
  getPlanetBySlug: (slug: string) => Exoplanet | undefined;
  getPlanetsByHost: (hostname: string) => Exoplanet[];
  filterPlanets: (options: FilterOptions) => Exoplanet[];
  sortPlanets: (planets: Exoplanet[], options: SortOptions) => Exoplanet[];
  searchPlanets: (query: string) => Exoplanet[];

  // Star queries
  getAllStars: () => Star[];
  getStarByName: (hostname: string) => Star | undefined;
  getStarBySlug: (slug: string) => Star | undefined;
  searchStars: (query: string) => Star[];

  // Special queries
  getTopHabitable: (limit?: number) => Exoplanet[];
  getClosestPlanets: (limit?: number) => Exoplanet[];
  getRecentDiscoveries: (limit?: number) => Exoplanet[];

  // Stats
  getStats: () => ReturnType<typeof dataService.getStats>;
}

const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        // Load data, shaders, and binary star data in parallel
        await Promise.all([
          dataService.loadData(),
          shaderService.loadShaders(),
          loadBinaryData()
        ]);
      } catch (err) {
        logger.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const value: DataContextValue = {
    isLoading,
    error,

    // Planet queries
    getAllPlanets: () => dataService.getAllPlanets(),
    getPlanetByName: (name) => dataService.getPlanetByName(name),
    getPlanetBySlug: (slug) => dataService.getPlanetBySlug(slug),
    getPlanetsByHost: (hostname) => dataService.getPlanetsByHost(hostname),
    filterPlanets: (options) => dataService.filterPlanets(options),
    sortPlanets: (planets, options) => dataService.sortPlanets(planets, options),
    searchPlanets: (query) => dataService.searchPlanets(query),

    // Star queries
    getAllStars: () => dataService.getAllStars(),
    getStarByName: (hostname) => dataService.getStarByName(hostname),
    getStarBySlug: (slug) => dataService.getStarBySlug(slug),
    searchStars: (query) => dataService.searchStars(query),

    // Special queries
    getTopHabitable: (limit) => dataService.getTopHabitable(limit),
    getClosestPlanets: (limit) => dataService.getClosestPlanets(limit),
    getRecentDiscoveries: (limit) => dataService.getRecentDiscoveries(limit),

    // Stats
    getStats: () => dataService.getStats(),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
