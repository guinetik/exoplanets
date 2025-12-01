/**
 * Google Analytics hooks and utilities for tracking user interactions
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Send a custom event to Google Analytics
 */
function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/**
 * Hook that tracks page views when the route changes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);
}

/**
 * Hook that provides tracking functions for user interactions
 */
export function useAnalytics() {
  const trackCTAClick = useCallback((buttonName: 'take_tour' | 'explore') => {
    trackEvent('cta_click', {
      button_name: buttonName,
    });
  }, []);

  const trackLocationChange = useCallback((locationName: string) => {
    trackEvent('location_change', {
      location_name: locationName,
    });
  }, []);

  const trackSearch = useCallback((searchType: 'planets' | 'stars', query: string, resultCount: number) => {
    trackEvent('search', {
      search_type: searchType,
      search_query: query,
      result_count: resultCount,
    });
  }, []);

  const trackFilter = useCallback((filterType: string, filterValue: string) => {
    trackEvent('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }, []);

  return {
    trackCTAClick,
    trackLocationChange,
    trackSearch,
    trackFilter,
  };
}
