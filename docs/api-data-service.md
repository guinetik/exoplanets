# DataService API

## Overview

`DataService` is the core singleton service responsible for loading the exoplanet CSV data, building indexed lookups, and providing filtering/querying APIs. It enables O(1) planet lookups and efficient filtering across 6,000+ exoplanets.

**Location**: `src/services/dataService.ts`

## Initialization

DataService is initialized once at application startup:

```typescript
// In src/services/index.ts
import DataService from './dataService';

export const dataService = new DataService();

// In DataContext
useEffect(() => {
  dataService.loadData();
}, []);
```

## Core Methods

### loadData()

**Purpose**: Load CSV, parse to typed arrays, build indexes

**Signature**:
```typescript
async loadData(): Promise<void>
```

**Behavior**:
1. Fetches `/public/data/exoplanets.csv`
2. Parses CSV rows into strongly typed `Exoplanet` objects
3. Aggregates host star data into `Star` objects
4. Builds internal indexes (Maps) for O(1) lookups
5. Resolves when complete

**Error Handling**:
- Throws error if CSV fails to load
- Caught by DataContext, displayed to user

**Usage**:
```typescript
try {
  await dataService.loadData();
  // Data now available via other methods
} catch (error) {
  console.error('Failed to load data:', error);
}
```

### getAllPlanets()

**Purpose**: Get array of all loaded exoplanets

**Signature**:
```typescript
getAllPlanets(): Exoplanet[]
```

**Returns**: Array of all 6,000+ `Exoplanet` objects

**Performance**: O(1) - returns cached array

**Usage**:
```typescript
const allPlanets = dataService.getAllPlanets();
allPlanets.forEach(planet => {
  console.log(planet.name, planet.planet_type);
});
```

### getPlanet(slug)

**Purpose**: Get single planet by URL-friendly slug

**Signature**:
```typescript
getPlanet(slug: string): Exoplanet | undefined
```

**Parameters**:
- `slug`: URL-safe planet identifier (e.g., "kepler-452-b")

**Returns**: `Exoplanet` object or `undefined` if not found

**Performance**: O(1) - Map lookup

**Usage**:
```typescript
const planet = dataService.getPlanet("kepler-452-b");
if (planet) {
  console.log(`${planet.name}: ${planet.planet_type}`);
} else {
  console.log("Planet not found");
}
```

### getStar(slug)

**Purpose**: Get star by slug, including all hosted planets

**Signature**:
```typescript
getStar(slug: string): Star | undefined
```

**Parameters**:
- `slug`: URL-safe star identifier (e.g., "kepler-452")

**Returns**: `Star` object or `undefined` if not found

**Star Object Contains**:
```typescript
{
  name: string;
  slug: string;
  planets: Exoplanet[]; // All planets orbiting this star
  radius: number;       // Solar radii
  temperature: number;  // Kelvin
  [other properties...]
}
```

**Performance**: O(1) - Map lookup

**Usage**:
```typescript
const star = dataService.getStar("kepler-452");
if (star) {
  console.log(`${star.name} hosts ${star.planets.length} planets`);
  star.planets.forEach(planet => {
    console.log(`  - ${planet.name}`);
  });
}
```

### filterPlanets(options)

**Purpose**: Query planets by multiple criteria

**Signature**:
```typescript
filterPlanets(options: FilterOptions): Exoplanet[]
```

**FilterOptions Interface**:
```typescript
interface FilterOptions {
  // Planet properties
  planetType?: PlanetType[];
  minMass?: number;
  maxMass?: number;
  minRadius?: number;
  maxRadius?: number;

  // Orbital properties
  minOrbitalPeriod?: number;
  maxOrbitalPeriod?: number;
  inHabitableZone?: boolean;

  // Host star
  starClass?: StarClass[];
  minStarTemperature?: number;
  maxStarTemperature?: number;
  minStarRadius?: number;
  maxStarRadius?: number;

  // Discovery
  discoveryYearMin?: number;
  discoveryYearMax?: number;
  discoveryMethod?: string[];

  // Custom flags
  isEarthLike?: boolean;
  isHabitableZone?: boolean;
}
```

**Returns**: Array of matching `Exoplanet` objects

**Performance**: O(n) - iterates through all planets with filter criteria

**Usage**:
```typescript
// Find potentially habitable planets
const habitable = dataService.filterPlanets({
  inHabitableZone: true,
  planetType: ['Earth-sized', 'Super-Earth']
});

// Find large exoplanets around hot stars
const hotJupiters = dataService.filterPlanets({
  planetType: ['Gas Giant'],
  minStarTemperature: 6000
});

// Find recently discovered Earth-like planets
const newEarths = dataService.filterPlanets({
  isEarthLike: true,
  discoveryYearMin: 2020
});
```

### getTopHabitable(count)

**Purpose**: Get top N planets ranked by habitability

**Signature**:
```typescript
getTopHabitable(count: number): Exoplanet[]
```

**Parameters**:
- `count`: Number of planets to return (e.g., 20)

**Returns**: Array of top habitable planets, sorted by `habitability_score` descending

**Performance**: O(n log n) - sorts all planets once

**Usage**:
```typescript
const top20 = dataService.getTopHabitable(20);
// Used by Vote page to show top candidates
```

### search(query)

**Purpose**: Full-text search across planet and star names

**Signature**:
```typescript
search(query: string): Exoplanet[]
```

**Parameters**:
- `query`: Search string (case-insensitive, partial matching)

**Returns**: Array of planets matching search

**Performance**: O(n) - scans all planet names

**Usage**:
```typescript
const results = dataService.search("kepler");
// Returns all planets with "kepler" in the name
```

## CSV Parsing Details

### Input Format

CSV columns are parsed from `public/data/exoplanets.csv`. Each row becomes:

```typescript
const planet = {
  name: "Kepler-452 b",           // string
  planet_type: "Earth-sized",     // PlanetType enum
  radius: 1.04,                   // number (Earth radii)
  mass: 5.0,                      // number (Earth masses)
  equilibrium_temperature: 265,   // number (Kelvin)
  orbital_period: 384.8,          // number (days)
  semi_major_axis: 1.046,         // number (AU)

  host_star: "Kepler-452",
  star_radius: 1.11,              // number (Solar radii)
  star_temperature: 5757,         // number (Kelvin)
  star_class: "G",

  discovery_year: 2015,
  discovery_method: "Transit",

  // Derived flags
  is_earth_like: true,
  is_habitable_zone: true,
  is_likely_tidally_locked: false,
  habitability_score: 0.74,

  // ... and 42 more properties
};
```

### Data Validation

- Missing or invalid values converted to defaults
- Numeric fields validated for reasonable ranges
- Slug names normalized (lowercase, hyphens)
- Duplicate checks (if planet appears twice, last wins)

## Internal Indexes

DataService maintains Maps for efficient lookups:

```typescript
// Planets by slug - enables getPlanet()
private planetsBySlug = new Map<string, Exoplanet>();

// Stars by slug - enables getStar()
private starsBySlug = new Map<string, Star>();

// All planets and stars
private exoplanets: Exoplanet[] = [];
private stars: Star[] = [];
```

## Type Safety

All data is strongly typed:

```typescript
interface Exoplanet {
  name: string;
  planet_type: PlanetType;  // 'Earth-sized' | 'Super-Earth' | ...
  radius: number;
  // ... all properties typed
}

type PlanetType =
  | 'Sub-Earth'
  | 'Earth-sized'
  | 'Super-Earth'
  | 'Sub-Neptune'
  | 'Neptune-like'
  | 'Gas Giant';

type StarClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'L' | 'T' | 'Y';
```

## Derived Fields

Some CSV columns are computed during processing:

| Field | Calculation |
|-------|-------------|
| `planet_type` | Based on radius and mass ratios |
| `habitability_score` | Weighted formula (temperature, size, orbit) |
| `is_earth_like` | planet_type == 'Earth-sized' && in habitable zone |
| `is_habitable_zone` | Orbital distance within HZ range for star |
| `is_likely_tidally_locked` | Orbital period < threshold for star |

See [Data Processing Pipeline](data-processing-pipeline.md) for calculation details.

## Usage in Components

### Via DataContext

```typescript
// In any component
const { dataService, exoplanets } = useData();

// Get single planet
const planet = dataService.getPlanet(planetSlug);

// Filter planets
const filtered = dataService.filterPlanets({
  planetType: ['Earth-sized'],
  inHabitableZone: true
});

// Get top habitable
const topCandidates = dataService.getTopHabitable(10);
```

### Direct Service Access

```typescript
// Less common - usually accessed via context
import { dataService } from '@services';

const allPlanets = dataService.getAllPlanets();
```

## Performance Notes

- **CSV Loading**: ~200ms on modern hardware
- **Index Building**: ~50ms for 6,000+ planets
- **getPlanet()**: O(1) - ~0.1ms
- **filterPlanets()**: O(n) - ~10-20ms depending on filter complexity
- **getTopHabitable()**: O(n log n) - ~30ms (sorts all planets)

Large result sets (1,000+ planets) are not paginated - component handles rendering.

## Error Handling

```typescript
try {
  await dataService.loadData();
} catch (error) {
  if (error.message.includes('fetch')) {
    // CSV file not found
  } else if (error.message.includes('parse')) {
    // CSV format invalid
  }
  // Handle error - show user message
}
```

## See Also

- [Data Flow & State Management](architecture-data-flow.md) - How DataService fits into data flow
- [CSV Structure & Fields](data-csv-structure.md) - Complete field reference
- [Data Processing Pipeline](data-processing-pipeline.md) - How CSV is created
- [Component Hierarchy](architecture-component-hierarchy.md) - How components use DataService
