/**
 * Planets Page
 * Grid view of all exoplanets with filtering, sorting, and pagination
 * Uses URL query parameters to maintain state across navigation
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { PlanetCard } from '../components/PlanetCard';
import type { PlanetType } from '../types';

type SortOption =
  | 'name'
  | 'distance'
  | 'discoveryYear'
  | 'radius'
  | 'mass'
  | 'habitability'
  | 'temperatureHot'
  | 'temperatureCold';

type DiscoveryMethod = 'all' | 'transit' | 'rv' | 'both';

const ITEMS_PER_PAGE = 24;

export default function Planets() {
  const { t } = useTranslation();
  const { getAllPlanets, isLoading, error } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'name'
  );
  const [selectedTypes, setSelectedTypes] = useState<PlanetType[]>(
    searchParams.get('types')
      ? (searchParams.get('types')!.split(',') as PlanetType[])
      : []
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    searchParams.get('classes') ? searchParams.get('classes')!.split(',') : []
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );
  const [habitableOnly, setHabitableOnly] = useState(
    searchParams.get('habitable') === 'true'
  );
  const [earthLikeOnly, setEarthLikeOnly] = useState(
    searchParams.get('earthlike') === 'true'
  );
  const [eccentricOnly, setEccentricOnly] = useState(
    searchParams.get('eccentric') === 'true'
  );
  const [circumbinaryOnly, setCircumbinaryOnly] = useState(
    searchParams.get('circumbinary') === 'true'
  );
  const [discoveryMethod, setDiscoveryMethod] = useState<DiscoveryMethod>(
    (searchParams.get('method') as DiscoveryMethod) || 'all'
  );
  const [ultraHotOnly, setUltraHotOnly] = useState(
    searchParams.get('ultrahot') === 'true'
  );
  const [frozenOnly, setFrozenOnly] = useState(
    searchParams.get('frozen') === 'true'
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  // Get all planets
  const allPlanets = useMemo(() => getAllPlanets(), [getAllPlanets]);

  // Get unique planet types
  const planetTypes = useMemo(() => {
    const types = new Set<PlanetType>();
    allPlanets.forEach((planet) => {
      if (planet.planet_type) types.add(planet.planet_type);
    });
    return Array.from(types).sort();
  }, [allPlanets]);

  // Get unique star classes
  const starClasses = useMemo(() => {
    const classes = new Set<string>();
    allPlanets.forEach((planet) => {
      if (planet.star_class) classes.add(planet.star_class);
    });
    return Array.from(classes).sort();
  }, [allPlanets]);

  // Filter and sort planets
  const filteredPlanets = useMemo(() => {
    let result = allPlanets;

    // Apply planet type filter
    if (selectedTypes.length > 0) {
      result = result.filter(
        (planet) =>
          planet.planet_type && selectedTypes.includes(planet.planet_type)
      );
    }

    // Apply star class filter
    if (selectedClasses.length > 0) {
      result = result.filter(
        (planet) =>
          planet.star_class && selectedClasses.includes(planet.star_class)
      );
    }

    // Apply habitable zone filter
    if (habitableOnly) {
      result = result.filter((planet) => planet.is_habitable_zone);
    }

    // Apply earth-like filter
    if (earthLikeOnly) {
      result = result.filter((planet) => planet.is_earth_like);
    }

    // Apply eccentric orbit filter
    if (eccentricOnly) {
      result = result.filter((planet) => planet.is_eccentric_orbit);
    }

    // Apply circumbinary filter
    if (circumbinaryOnly) {
      result = result.filter((planet) => planet.is_circumbinary);
    }

    // Apply discovery method filter
    if (discoveryMethod !== 'all') {
      result = result.filter((planet) => {
        const hasRv = planet.has_rv_data;
        const hasTransit = planet.is_transiting;

        switch (discoveryMethod) {
          case 'rv':
            return hasRv && !hasTransit;
          case 'transit':
            return hasTransit && !hasRv;
          case 'both':
            return hasRv && hasTransit;
          default:
            return true;
        }
      });
    }

    // Apply ultra hot filter
    if (ultraHotOnly) {
      result = result.filter((planet) => planet.is_ultra_hot);
    }

    // Apply frozen world filter
    if (frozenOnly) {
      result = result.filter((planet) => planet.is_frozen_world);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (planet) =>
          planet.pl_name.toLowerCase().includes(query) ||
          planet.hostname.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance_ly ?? Infinity) - (b.distance_ly ?? Infinity);
        case 'mass':
          return (b.pl_bmasse ?? 0) - (a.pl_bmasse ?? 0);
        case 'radius':
          return (b.pl_rade ?? 0) - (a.pl_rade ?? 0);
        case 'discoveryYear':
          return b.disc_year - a.disc_year;
        case 'habitability':
          const aScore = a.habitability_score ?? 0;
          const bScore = b.habitability_score ?? 0;
          return bScore - aScore;
        case 'temperatureHot':
          return (b.pl_eqt ?? 0) - (a.pl_eqt ?? 0);
        case 'temperatureCold':
          return (a.pl_eqt ?? Infinity) - (b.pl_eqt ?? Infinity);
        case 'name':
        default:
          return a.pl_name.localeCompare(b.pl_name);
      }
    });

    return sorted;
  }, [
    allPlanets,
    selectedTypes,
    selectedClasses,
    habitableOnly,
    earthLikeOnly,
    eccentricOnly,
    circumbinaryOnly,
    discoveryMethod,
    ultraHotOnly,
    frozenOnly,
    searchQuery,
    sortBy,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredPlanets.length / ITEMS_PER_PAGE);
  const validPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPlanets = filteredPlanets.slice(startIndex, endIndex);

  // Update URL whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (sortBy !== 'name') params.set('sort', sortBy);
    if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','));
    if (selectedClasses.length > 0)
      params.set('classes', selectedClasses.join(','));
    if (searchQuery) params.set('search', searchQuery);
    if (habitableOnly) params.set('habitable', 'true');
    if (earthLikeOnly) params.set('earthlike', 'true');
    if (eccentricOnly) params.set('eccentric', 'true');
    if (circumbinaryOnly) params.set('circumbinary', 'true');
    if (discoveryMethod !== 'all') params.set('method', discoveryMethod);
    if (ultraHotOnly) params.set('ultrahot', 'true');
    if (frozenOnly) params.set('frozen', 'true');
    if (validPage !== 1) params.set('page', String(validPage));

    setSearchParams(params, { replace: true });
  }, [
    sortBy,
    selectedTypes,
    selectedClasses,
    searchQuery,
    habitableOnly,
    earthLikeOnly,
    eccentricOnly,
    circumbinaryOnly,
    discoveryMethod,
    ultraHotOnly,
    frozenOnly,
    validPage,
    setSearchParams,
  ]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const togglePlanetType = (type: PlanetType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    handleFilterChange();
  };

  const toggleStarClass = (starClass: string) => {
    setSelectedClasses((prev) =>
      prev.includes(starClass)
        ? prev.filter((c) => c !== starClass)
        : [...prev, starClass]
    );
    handleFilterChange();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    handleFilterChange();
  };

  const handleHabitableToggle = () => {
    setHabitableOnly((prev) => !prev);
    handleFilterChange();
  };

  const handleEarthLikeToggle = () => {
    setEarthLikeOnly((prev) => !prev);
    handleFilterChange();
  };

  const handleEccentricToggle = () => {
    setEccentricOnly((prev) => !prev);
    handleFilterChange();
  };

  const handleCircumbinaryToggle = () => {
    setCircumbinaryOnly((prev) => !prev);
    handleFilterChange();
  };

  const handleDiscoveryMethodChange = (method: DiscoveryMethod) => {
    setDiscoveryMethod(method);
    handleFilterChange();
  };

  const handleUltraHotToggle = () => {
    setUltraHotOnly((prev) => !prev);
    handleFilterChange();
  };

  const handleFrozenToggle = () => {
    setFrozenOnly((prev) => !prev);
    handleFilterChange();
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedClasses([]);
    setSearchQuery('');
    setHabitableOnly(false);
    setEarthLikeOnly(false);
    setEccentricOnly(false);
    setCircumbinaryOnly(false);
    setDiscoveryMethod('all');
    setUltraHotOnly(false);
    setFrozenOnly(false);
    setSortBy('name');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner-content">
          <div className="spinner-orbit">
            <div className="spinner-planet" />
          </div>
          <div className="spinner-text">{t('pages.planets.loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1 className="error-title">{t('pages.planets.errorTitle')}</h1>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  const hasFilters =
    selectedTypes.length > 0 ||
    selectedClasses.length > 0 ||
    searchQuery ||
    habitableOnly ||
    earthLikeOnly ||
    eccentricOnly ||
    circumbinaryOnly ||
    discoveryMethod !== 'all' ||
    ultraHotOnly ||
    frozenOnly;

  return (
    <div className="page-container">
      <h1 className="page-title">{t('pages.planets.title')}</h1>

      {/* Controls Panel */}
      <div className="planets-controls">
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('pages.planets.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filters and Sort */}
        <div className="controls-row">
          {/* Planet Type Filter */}
          <div className="filter-group">
            <label className="filter-label">{t('pages.planets.filters.planetType')}</label>
            <div className="type-buttons">
              {planetTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => togglePlanetType(type)}
                  className={`type-button ${selectedTypes.includes(type) ? 'active' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Star Class Filter */}
          <div className="filter-group">
            <label className="filter-label">{t('pages.planets.filters.starClass')}</label>
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

          {/* Discovery Method Filter */}
          <div className="filter-group">
            <label className="filter-label">{t('pages.planets.filters.discoveryMethod')}</label>
            <select
              value={discoveryMethod}
              onChange={(e) => handleDiscoveryMethodChange(e.target.value as DiscoveryMethod)}
              className="sort-select"
            >
              <option value="all">{t('pages.planets.filters.discoveryMethods.all')}</option>
              <option value="transit">{t('pages.planets.filters.discoveryMethods.transit')}</option>
              <option value="rv">{t('pages.planets.filters.discoveryMethods.rv')}</option>
              <option value="both">{t('pages.planets.filters.discoveryMethods.both')}</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-group">
            <label className="filter-label">{t('pages.planets.filters.sortBy')}</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="sort-select"
            >
              <option value="name">{t('pages.planets.sort.name')}</option>
              <option value="distance">{t('pages.planets.sort.distance')}</option>
              <option value="mass">{t('pages.planets.sort.mass')}</option>
              <option value="radius">{t('pages.planets.sort.radius')}</option>
              <option value="discoveryYear">{t('pages.planets.sort.discoveryYear')}</option>
              <option value="habitability">{t('pages.planets.sort.habitability')}</option>
              <option value="temperatureHot">Temperature (Hottest)</option>
              <option value="temperatureCold">Temperature (Coldest)</option>
            </select>
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="toggle-filters">
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={habitableOnly}
              onChange={handleHabitableToggle}
              className="toggle-checkbox"
            />
            <span>{t('pages.planets.filters.habitableOnly')}</span>
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={earthLikeOnly}
              onChange={handleEarthLikeToggle}
              className="toggle-checkbox"
            />
            <span>{t('pages.planets.filters.earthLikeOnly')}</span>
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={eccentricOnly}
              onChange={handleEccentricToggle}
              className="toggle-checkbox"
            />
            <span>{t('pages.planets.filters.eccentricOnly')}</span>
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={circumbinaryOnly}
              onChange={handleCircumbinaryToggle}
              className="toggle-checkbox"
            />
            <span>{t('pages.planets.filters.circumbinaryOnly')}</span>
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={ultraHotOnly}
              onChange={handleUltraHotToggle}
              className="toggle-checkbox"
            />
            <span>Ultra Hot Worlds</span>
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={frozenOnly}
              onChange={handleFrozenToggle}
              className="toggle-checkbox"
            />
            <span>Frozen Worlds</span>
          </label>
        </div>

        {/* Clear Button */}
        {hasFilters && (
          <button onClick={clearFilters} className="clear-button">
            {t('pages.planets.filters.clearFilters')}
          </button>
        )}

        {/* Results Counter */}
        <div className="results-info">
          {t(filteredPlanets.length !== 1 ? 'pages.planets.results.showing_plural' : 'pages.planets.results.showing', {
            start: startIndex + 1,
            end: Math.min(endIndex, filteredPlanets.length),
            filtered: filteredPlanets.length
          })}{' '}
          {t('pages.planets.results.total', { total: allPlanets.length })}
        </div>
      </div>

      {/* Planets Grid */}
      {paginatedPlanets.length > 0 ? (
        <>
          <div className="planets-grid">
            {paginatedPlanets.map((planet) => (
              <div key={planet.pl_name} className="planets-grid-item">
                <PlanetCard planet={planet} />
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
                {t('pages.planets.pagination.previous')}
              </button>

              <div className="pagination-info">
                {t('pages.planets.pagination.pageOf', { current: validPage, total: totalPages })}
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
                {t('pages.planets.pagination.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="placeholder">
          {t('pages.planets.results.noResults')}
        </div>
      )}
    </div>
  );
}
