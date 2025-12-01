/**
 * Stars Page
 * Grid view of all stars with filtering, sorting, and pagination
 * Uses URL query parameters to maintain state across navigation
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { StarCard } from '../components/StarCard';
import SEO from '../components/SEO';
import { getCatalogSEO } from '../utils/seo';
import Spinner from '../components/Spinner';

type SortOption = 'name' | 'distance' | 'planets' | 'temperature';

const ITEMS_PER_PAGE = 24;

export default function Stars() {
  const { t } = useTranslation();
  const { getAllStars, isLoading, error } = useData();
  const { trackSearch, trackFilter } = useAnalytics();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize state from URL params
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'name'
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    searchParams.get('classes')?.split(',').filter(Boolean) || []
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [binaryFilter, setBinaryFilter] = useState<'all' | 'binary' | 'single'>(
    (searchParams.get('binary') as 'all' | 'binary' | 'single') || 'all'
  );

  // Get all stars
  const allStars = useMemo(() => getAllStars(), [getAllStars]);

  // Get unique star classes
  const starClasses = useMemo(() => {
    const classes = new Set<string>();
    allStars.forEach((star) => {
      if (star.star_class) classes.add(star.star_class);
    });
    return Array.from(classes).sort();
  }, [allStars]);

  // Filter and sort stars
  const filteredStars = useMemo(() => {
    let result = allStars;

    // Apply class filter
    if (selectedClasses.length > 0) {
      result = result.filter(
        (star) => star.star_class && selectedClasses.includes(star.star_class)
      );
    }

    // Apply binary filter
    if (binaryFilter === 'binary') {
      result = result.filter((star) => star.sy_snum > 1);
    } else if (binaryFilter === 'single') {
      result = result.filter((star) => star.sy_snum === 1);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((star) =>
        star.hostname.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance_ly ?? Infinity) - (b.distance_ly ?? Infinity);
        case 'planets':
          return b.sy_pnum - a.sy_pnum;
        case 'temperature':
          return (b.st_teff ?? 0) - (a.st_teff ?? 0);
        case 'name':
        default:
          return a.hostname.localeCompare(b.hostname);
      }
    });

    return sorted;
  }, [allStars, selectedClasses, searchQuery, sortBy, binaryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStars.length / ITEMS_PER_PAGE);
  const validPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStars = filteredStars.slice(startIndex, endIndex);

  // Update URL whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (sortBy !== 'name') params.set('sort', sortBy);
    if (selectedClasses.length > 0)
      params.set('classes', selectedClasses.join(','));
    if (searchQuery) params.set('search', searchQuery);
    if (binaryFilter !== 'all') params.set('binary', binaryFilter);
    if (validPage !== 1) params.set('page', String(validPage));

    setSearchParams(params, { replace: true });
  }, [sortBy, selectedClasses, searchQuery, binaryFilter, validPage, setSearchParams]);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const toggleStarClass = (starClass: string) => {
    const isAdding = !selectedClasses.includes(starClass);
    setSelectedClasses((prev) =>
      prev.includes(starClass)
        ? prev.filter((c) => c !== starClass)
        : [...prev, starClass]
    );
    handleFilterChange();
    if (isAdding) trackFilter('star_class', starClass);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();

    // Debounced search tracking
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (value.length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        const results = allStars.filter((s) =>
          s.hostname.toLowerCase().includes(value.toLowerCase())
        );
        trackSearch('stars', value, results.length);
      }, 500);
    }
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    handleFilterChange();
  };

  const handleBinaryFilterChange = (value: 'all' | 'binary' | 'single') => {
    setBinaryFilter(value);
    handleFilterChange();
  };

  const clearFilters = () => {
    setSelectedClasses([]);
    setSearchQuery('');
    setSortBy('name');
    setBinaryFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return <Spinner message={t('pages.stars.loading')} />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1 className="error-title">{t('pages.stars.errorTitle')}</h1>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  const seoData = getCatalogSEO('stars');

  return (
    <>
      <SEO {...seoData} />
      <div className="page-container">
        <h1 className="page-title">{t('pages.stars.title')}</h1>

      {/* Controls Panel */}
      <div className="stars-controls">
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('pages.stars.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filters and Sort */}
        <div className="controls-row">
          {/* Star Class Filter */}
          <div className="filter-group">
            <label className="filter-label">{t('pages.stars.filters.starClass')}</label>
            <div className="class-buttons">
              {starClasses.map((starClass) => (
                <button
                  key={starClass}
                  onClick={() => toggleStarClass(starClass)}
                  className={`class-button ${selectedClasses.includes(starClass) ? 'active' : ''}`}
                >
                  {starClass}
                </button>
              ))}
            </div>
          </div>

          {/* Binary Filter */}
          <div className="filter-group">
            <label className="filter-label">{t('pages.stars.filters.systemType', 'System Type')}</label>
            <div className="class-buttons">
              <button
                onClick={() => handleBinaryFilterChange('all')}
                className={`class-button ${binaryFilter === 'all' ? 'active' : ''}`}
              >
                {t('pages.stars.filters.allSystems', 'All')}
              </button>
              <button
                onClick={() => handleBinaryFilterChange('binary')}
                className={`class-button ${binaryFilter === 'binary' ? 'active' : ''}`}
              >
                {t('pages.stars.filters.binarySystems', 'Binary ★★')}
              </button>
              <button
                onClick={() => handleBinaryFilterChange('single')}
                className={`class-button ${binaryFilter === 'single' ? 'active' : ''}`}
              >
                {t('pages.stars.filters.singleSystems', 'Single ★')}
              </button>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-group">
            <label className="filter-label">{t('pages.stars.filters.sortBy')}</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="sort-select"
            >
              <option value="name">{t('pages.stars.sort.name')}</option>
              <option value="distance">{t('pages.stars.sort.distance')}</option>
              <option value="planets">{t('pages.stars.sort.planets')}</option>
              <option value="temperature">{t('pages.stars.sort.temperature')}</option>
            </select>
          </div>

          {/* Clear Button */}
          {(selectedClasses.length > 0 || searchQuery || binaryFilter !== 'all') && (
            <button onClick={clearFilters} className="clear-button">
              {t('pages.stars.filters.clearFilters')}
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="results-info">
          {t(filteredStars.length !== 1 ? 'pages.stars.results.showing_plural' : 'pages.stars.results.showing', {
            start: startIndex + 1,
            end: Math.min(endIndex, filteredStars.length),
            filtered: filteredStars.length
          })}{' '}
          {t('pages.stars.results.total', { total: allStars.length })}
        </div>
      </div>

      {/* Stars Grid */}
      {paginatedStars.length > 0 ? (
        <>
          <div className="stars-grid">
            {paginatedStars.map((star) => (
              <div key={star.id} className="stars-grid-item">
                <StarCard star={star} />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                onClick={() => setCurrentPage(Math.max(1, validPage - 1))}
                disabled={validPage === 1}
                className="pagination-button"
              >
                {t('pages.stars.pagination.previous')}
              </button>

              <div className="pagination-info">
                {t('pages.stars.pagination.pageOf', { current: validPage, total: totalPages })}
              </div>

              {/* Page number buttons */}
              <div className="pagination-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (validPage <= 3) {
                      pageNum = i + 1;
                    } else if (validPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = validPage - 2 + i;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`pagination-number ${
                        validPage === pageNum ? 'active' : ''
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, validPage + 1))
                }
                disabled={validPage === totalPages}
                className="pagination-button"
              >
                {t('pages.stars.pagination.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="placeholder">
          {t('pages.stars.results.noResults')}
        </div>
      )}
      </div>
    </>
  );
}
