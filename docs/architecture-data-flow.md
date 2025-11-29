# Data Flow & State Management

## Overview

The application uses React Context (`DataContext`) to manage and provide access to exoplanet and star data globally. This document explains how data flows through the application, from CSV loading through filtering and consumption by components.

## DataContext Architecture

### Context Provider

`DataContext` wraps the entire application at the root level:

```typescript
// App.tsx
<DataProvider>
  <Layout>
    <Routes />
  </Layout>
</DataProvider>
```

### Context Value

The context provides:

```typescript
interface DataContextType {
  // Raw data
  exoplanets: Exoplanet[];
  stars: Map<string, Star>;

  // Services
  dataService: DataService;

  // Helper functions
  filterPlanets(options: FilterOptions): Exoplanet[];
  getPlanet(slug: string): Exoplanet | undefined;
  getStar(slug: string): Star | undefined;
  getTopHabitable(count: number): Exoplanet[];
  search(query: string): Exoplanet[];
}
```

### useData Hook

Components access the context via the `useData()` custom hook:

```typescript
const MyComponent = () => {
  const { exoplanets, filterPlanets, getPlanet } = useData();

  // Use data in component
};
```

## Data Loading Lifecycle

### 1. Initialization (App Startup)

```
DataProvider mounts
  ↓ useEffect
DataService.loadData()
  ↓
Fetch CSV from public/data/exoplanets.csv
  ↓
Parse CSV rows into Exoplanet[] and Star[] arrays
  ↓
Build index Maps:
  - nameToSlug Map (for O(1) lookups)
  - Star aggregation (group planets by host star)
  ↓
Set context value
  ↓
All children can now use useData()
```

### 2. Error Handling

```
If CSV fails to load:
  ↓
DataService catches error
  ↓
Context provides error state
  ↓
Components display ErrorBoundary or error message
```

### 3. Data Availability

```
isLoading = true (during fetch)
  ↓
CSV loaded and parsed
  ↓
isLoading = false, data available
  ↓
Components render with data
```

## CSV Parsing & Indexing

### CSV Structure

The runtime CSV has 72 columns (derived from 683 NASA columns):

| Category | Examples |
|----------|----------|
| Planet Properties | radius, mass, density, equilibrium_temperature |
| Orbital Properties | orbital_period, semi_major_axis, eccentricity |
| Host Star | star_name, star_radius, star_temperature, star_class |
| Discovery | discovery_year, discovery_method, disposition |
| Computed Flags | is_earth_like, is_habitable_zone, is_likely_tidally_locked |

### Index Strategy: O(1) Lookups

DataService builds Maps for fast lookups:

```typescript
// Internal indexes
const planetsBySlug = new Map<string, Exoplanet>();
const starsBySlug = new Map<string, Star>();

// When getPlanet("kepler-452b") is called:
// O(1) lookup - instant, no search through arrays
const planet = planetsBySlug.get("kepler-452b");
```

### Name to Slug Conversion

Names are converted to URL-safe slugs:

```
"Kepler-452 b" → "kepler-452-b"
"TRAPPIST-1e" → "trappist-1-e"
"CoRoT-7b" → "corot-7-b"

// In DataContext, provides nameToSlug() function
```

## Filtering Pipeline

### FilterOptions Interface

```typescript
interface FilterOptions {
  // Planet properties
  planetType?: PlanetType[];
  minMass?: number;
  maxMass?: number;

  // Orbital properties
  minOrbitalPeriod?: number;
  maxOrbitalPeriod?: number;
  inHabitableZone?: boolean;

  // Host star
  starClass?: StarClass[];
  minStarTemperature?: number;
  maxStarTemperature?: number;

  // Discovery
  discoveryYearMin?: number;
  discoveryYearMax?: number;
  discoveryMethod?: string[];
}
```

### Filtering Flow

```
User adjusts filters in FilterPanel
  ↓
Component calls filterPlanets(options)
  ↓
DataService.filter() iterates exoplanets array
  ↓
Each planet checked against filter criteria:
  - Is radius within range?
  - Is star class in list?
  - Is orbital period valid?
  - etc.
  ↓
Matching planets returned as new array
  ↓
Component updates state, re-renders results
```

### Performance Notes

- Filters iterate through full exoplanet array (O(n))
- Result is filtered Exoplanet[] (new array, doesn't mutate original)
- Components should memoize results if filtering is expensive
- No pagination yet - loads all filtered results

## Special Queries

### getTopHabitable(count)

Returns top N planets by habitability score:

```typescript
const topHabitable = useData().getTopHabitable(20);

// Internally:
// 1. Sorts all planets by habitability_score (descending)
// 2. Returns top 20
// 3. Used by Vote page, some analytics
```

### Search Query

Full-text search across planet/star names:

```typescript
const results = useData().search("kepler");

// Matches any planet or star name containing "kepler"
// Case-insensitive
```

## URL Slug System

### Purpose

Slugs make URLs readable and SEO-friendly:

- URL: `/planets/kepler-452-b` (readable, shareable)
- NOT: `/planets/345234` (meaningless ID)

### Slug Generation

```typescript
// nameToSlug("Kepler-452 b")
"kepler-452 b"
  ↓ lowercase
  ↓ remove special chars, keep numbers
  ↓ replace spaces with hyphens
"kepler-452-b"
```

### Lookup Reverse

```
User visits /planets/kepler-452-b
  ↓
Component extracts slug from URL
  ↓
Calls getPlanet("kepler-452-b")
  ↓
O(1) lookup in planetsBySlug Map
  ↓
Planet data returned
```

## State Updates & Re-renders

### When Components Re-render

```
useData() context value changes
  ↓
All components using useData() re-render
  ↓
Components using filtered data update
  ↓
UI reflects new data
```

### Avoiding Unnecessary Re-renders

```typescript
// Create stable reference at component level
const [filters, setFilters] = useState(initialFilters);

// Only re-render when filters change
useEffect(() => {
  const filtered = filterPlanets(filters);
  setFilteredResults(filtered);
}, [filters]); // filterPlanets not included (stable function)
```

## Star Aggregation

### Star Data Structure

Stars are derived from planet data - each planet references a host star:

```
CSV row: "Kepler-452" (star) + "b" (planet) = "Kepler-452 b"

DataService aggregates:
  All planets with host_star = "Kepler-452"
  ↓
  Creates Star object:
  {
    name: "Kepler-452",
    planets: [Kepler-452 b, Kepler-452 c, ...],
    radius: 1.04,
    temperature: 5757,
    ...
  }
```

### Star Lookup

```typescript
const star = getStar("kepler-452");
// Returns:
// {
//   name: "Kepler-452",
//   planets: [...all planets around this star...]
// }
```

## Data Mutation Rules

### Immutability

All data is immutable:

```typescript
// ❌ WRONG - mutating original array
const planets = useData().exoplanets;
planets[0].mass = 1.5;

// ✅ CORRECT - filtering returns new array
const filtered = useData().filterPlanets({minMass: 1.0});
```

### Filter Results

`filterPlanets()` always returns a new array:

```typescript
const allPlanets = useData().exoplanets;
const filtered = useData().filterPlanets(options);

// allPlanets !== filtered (different array objects)
// Both are valid, immutable Exoplanet[] arrays
```

## Caching Strategy

### What's Cached

- **Raw Data**: CSV loaded once at startup, never reloaded
- **Indexes**: planetsBySlug, starsBySlug Maps built once
- **Slug Functions**: nameToSlug() is deterministic (pure function)

### What's NOT Cached

- **Filter Results**: Computed fresh on each filterPlanets() call
- **Search Results**: Computed fresh on each search() call
- **Top Habitable**: Computed fresh on each getTopHabitable() call

### Why This Approach

```
Simple, predictable behavior
  ↓
Components always get up-to-date results
  ↓
No stale cache bugs
  ↓
Small performance cost (acceptable for 6000 items)
```

## Extending Data Flow

### Adding New Filter Option

1. Add to `FilterOptions` interface
2. Add to filter logic in `DataService.filter()`
3. Add UI control to `FilterPanel`
4. Optional: Add to URL params if shareable filter needed

### Adding New Query Function

1. Add method to `DataService` class
2. Export via context
3. Use in components via `useData()`

## See Also

- [System Architecture Overview](architecture-system-overview.md) - Data flow context
- [DataService API](api-data-service.md) - Detailed service methods
- [CSV Structure & Fields](data-csv-structure.md) - Available data fields
- [Component Hierarchy](architecture-component-hierarchy.md) - How components consume data
