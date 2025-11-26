/**
 * Tests for App Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../App';
import { DataProvider } from '../context/DataContext';
import { resetDataService } from '../services/dataService';
import { mockCSV } from '../test/mocks';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Wrapper component with all providers
const AppWithProviders = () => (
  <DataProvider>
    <HashRouter>
      <App />
    </HashRouter>
  </DataProvider>
);

describe('App', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    resetDataService();
  });

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AppWithProviders />);

      expect(screen.getByText('common.loading')).toBeInTheDocument();
    });
  });

  describe('After Loading', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      });
    });

    it('renders navbar with brand after loading', async () => {
      render(<AppWithProviders />);

      await waitFor(() => {
        expect(screen.getByText('Exoplanets')).toBeInTheDocument();
      });
    });

    it('renders navigation links', async () => {
      render(<AppWithProviders />);

      await waitFor(() => {
        expect(screen.getByText('nav.home')).toBeInTheDocument();
      });

      expect(screen.getByText('nav.stars')).toBeInTheDocument();
      expect(screen.getByText('nav.planets')).toBeInTheDocument();
    });

    it('renders language picker', async () => {
      render(<AppWithProviders />);

      await waitFor(() => {
        expect(screen.getByText('EN')).toBeInTheDocument();
      });

      expect(screen.getByText('PT')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      render(<AppWithProviders />);

      await waitFor(() => {
        expect(screen.getByText('common.error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load data: Not Found')).toBeInTheDocument();
    });
  });
});
