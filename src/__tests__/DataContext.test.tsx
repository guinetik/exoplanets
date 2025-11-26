/**
 * Tests for DataContext
 */

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { DataProvider, useData } from '../context/DataContext';
import { resetDataService } from '../services/dataService';
import { mockCSV } from '../test/mocks';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Wrapper for hook testing
const wrapper = ({ children }: { children: ReactNode }) => (
  <DataProvider>{children}</DataProvider>
);

describe('DataContext', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    resetDataService();
  });

  describe('Loading State', () => {
    test('starts in loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useData(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('finishes loading after data fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      });

      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('sets error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load data: Not Found');
    });

    test('sets error on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Data Access', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      });
    });

    test('provides getAllPlanets function', async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const planets = result.current.getAllPlanets();
      expect(planets.length).toBe(3);
    });

    test('provides getAllStars function', async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stars = result.current.getAllStars();
      expect(stars.length).toBe(2);
    });

    test('provides getPlanetByName function', async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const planet = result.current.getPlanetByName('Test Planet b');
      expect(planet).toBeDefined();
      expect(planet?.hostname).toBe('Test Star');
    });

    test('provides getStarByName function', async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const star = result.current.getStarByName('Test Star');
      expect(star).toBeDefined();
      expect(star?.planets.length).toBe(2);
    });

    test('provides searchPlanets function', async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const results = result.current.searchPlanets('Test');
      expect(results.length).toBe(2);
    });

    test('provides getStats function', async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.getStats();
      expect(stats.totalPlanets).toBe(3);
      expect(stats.totalStars).toBe(2);
    });

    test('provides getTopHabitable function', async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const top = result.current.getTopHabitable(2);
      expect(top.length).toBe(2);
      expect(top[0].habitability_score).toBeGreaterThanOrEqual(top[1].habitability_score);
    });
  });

  describe('useData hook', () => {
    test('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useData());
      }).toThrow('useData must be used within a DataProvider');

      consoleSpy.mockRestore();
    });
  });
});
