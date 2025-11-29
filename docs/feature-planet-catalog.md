# Planet Catalog

## Overview

The Planet Catalog is a comprehensive, searchable, and filterable database of 6,000+ confirmed exoplanets. Users can browse planets, apply filters to discover specific types, and drill down into detailed information about individual worlds.

**Route**: `/planets`

**Key Features**:
- Browseable grid of all exoplanets
- Multi-criteria filtering (type, size, temperature, habitability)
- Sorting by various properties
- Quick preview cards with key data
- Drill-down to detailed planet pages

## Data Source

### Primary Data

Uses all 6,000+ exoplanets from `dataService.getAllPlanets()`:

| Data Point | Purpose |
|-----------|---------|
| `name` | Planet identifier |
| `planet_type` | Size category (Earth-sized, Gas Giant, etc.) |
| `radius` | Planet size in Earth radii |
| `mass` | Planet mass in Earth masses |
| `equilibrium_temperature` | Estimated surface temperature |
| `orbital_period` | Time to orbit host star |
| `host_star` | Name of parent star |
| `discovery_year` | When confirmed |

### Computed Flags

| Flag | Indicates |
|------|-----------|
| `is_earth_like` | Potentially habitable Earth-sized world |
| `is_habitable_zone` | Within host star's habitable zone |
| `is_likely_tidally_locked` | Rotation locked to star |
| `habitability_score` | 0-1 score for habitability potential |

## Planet Catalog Grid

### Component Structure

```
PlanetCatalog (page)
├── FilterPanel
│   ├── Planet type checkboxes (6 types)
│   ├── Size range slider (radius)
│   ├── Temperature range slider (K)
│   ├── Host star class filter
│   ├── Habitability filters (HZ, Earth-like)
│   ├── Discovery year range
│   └── Search input
│
├── SortOptions
│   ├── By discovery date (newest/oldest)
│   ├── By size (largest/smallest)
│   ├── By temperature (hottest/coldest)
│   ├── By habitability score
│   ├── By orbital period
│   └── Alphabetically
│
└── PlanetGrid
    ├── PlanetCard
    │   ├── Planet name
    │   ├── Host star name
    │   ├── Type badge + icon
    │   ├── Key stats (size, temp, period)
    │   ├── Habitability indicator
    │   └── "View Details" button
    ├── PlanetCard
    └── [repeating cards...]
```

### PlanetCard Display

Each card shows:

**Header**:
- Planet name (e.g., "Kepler-452 b")
- Type badge + icon:
  - 🪨 Rocky (Earth-sized, Super-Earth)
  - 💧 Ocean
  - 🌍 Desert
  - ❄️ Icy
  - 🔥 Lava
  - 🪐 Gas Giant
  - 💨 Neptune-like

**Key Metrics**:
```
Size: 1.04 R⊕    (Earth radii)
Temp: 265 K      (Kelvin, red/yellow/blue badge)
Period: 384.8 d  (days)
```

**Additional Info**:
- Host star class (e.g., "G2V")
- Distance from Earth (parsecs)
- Discovered: 2015

**Habitability Indicator**:
- Score bar (0-100%)
- Color: red (uninhabitable) → yellow → green (habitable)
- Tooltip: "74% habitable"

**Quick Indicators**:
- ✓ "In HZ" badge if in habitable zone
- ⦿ "Tidal lock" if tidally locked
- 🌍 "Earth-like" if potential candidate

**Actions**:
- Click card → Planet detail page
- "Learn More" button → Planet detail page

## Filtering System

### Available Filters

#### Planet Type

Checkboxes for:
- Sub-Earth
- Earth-sized
- Super-Earth
- Sub-Neptune
- Neptune-like
- Gas Giant

#### Size Range

Dual slider: 0.1 to 50 Earth radii

**Quick filters**:
- "Earth-sized" (0.9-1.1 R⊕)
- "Larger than Earth" (>1.1 R⊕)
- "Gas Giants" (>10 R⊕)

#### Temperature Range

Dual slider: 0 to 3000 K

**Quick filters**:
- "Habitable zone" (250-350 K)
- "Too hot" (>500 K)
- "Too cold" (<150 K)

#### Habitability Filters

- **In Habitable Zone**: Toggle
  - Only shows planets within calculated HZ for their star
- **Earth-like**: Toggle
  - Earth-sized AND in habitable zone
- **Habitability Score**: Slider (0.0-1.0)
  - Shows top candidates (0.5+)

#### Star Properties

- **Star Class**: Checkboxes (O/B/A/F/G/K/M/L/T/Y)
- **Star Temperature**: Dual slider
- **Star Distance**: Dual slider (parsecs)

#### Discovery

- **Year Range**: Slider
  - Find recent discoveries (2020+) or classics (1995-2000)
- **Discovery Method**: Checkboxes
  - Transit (most common, ~70%)
  - Radial velocity (~20%)
  - Direct imaging, microlensing, etc.

#### Search

Full-text search by planet name or host star name:
- Supports partial matching ("kepler" matches all Kepler planets)
- Case-insensitive
- Real-time search as user types

### Filter Behavior

```
User adjusts filters
  ↓
Component state updates
  ↓
dataService.filterPlanets(options) called
  ↓
Returns matching Exoplanet[] array
  ↓
Grid re-renders with results
  ↓
Result count shown: "562 planets found"
```

**Performance**: Most filter combinations return results in <100ms

## Sorting Options

| Sort Option | Order | Use Case |
|-------------|-------|----------|
| Discovery Date | Newest → Oldest | Find recent discoveries |
| Discovery Date | Oldest → Newest | Historical perspective |
| Size | Largest → Smallest | Compare planet types |
| Size | Smallest → Largest | Find mini-Earths |
| Temperature | Hottest → Coldest | Thermal range view |
| Temperature | Coldest → Hottest | Find ice worlds |
| Habitability | Highest → Lowest | Best candidates |
| Orbital Period | Longest → Shortest | Orbital mechanics view |
| Distance | Nearest → Farthest | Exploration priority |
| Alphabetical | A → Z | Browse by name |

## Planet Detail Page

**Route**: `/planets/:planetSlug`

### Page Layout

```
PlanetDetail page
├── Hero Section
│   ├── Planet name + host star
│   ├── Large visual (3D planet or artist conception)
│   └── Key highlights (type, size, habitability)
│
├── 3D Planet Visualization (Three.js canvas)
│   └── Rotating 3D planet with shader effects
│
├── Key Properties Table
│   ├── Physical: radius, mass, density, gravity
│   ├── Orbital: period, distance, eccentricity, insolation
│   ├── Atmosphere: composition (if known), pressure
│   └── Host Star: name, type, temperature, distance
│
├── Habitability Section
│   ├── Habitability score visualization
│   ├── Assessment factors (temp, size, star stability)
│   └── Comparison to Earth
│
├── Discovery Information
│   ├── Discovery year and method
│   ├── Confirmation status
│   └── Detection details
│
├── Related Planets
│   ├── Planets around same star
│   ├── Similar-sized planets
│   └── Similar-temperature planets
│
└── Actions
    ├── "Vote for Earth 2.0" button (if habitable)
    └── "View Host Star" link
```

### 3D Planet Visualization

**What's Shown**:
- Procedurally generated 3D planet
- Shader selection based on:
  - Planet type → shader choice
  - Temperature → color palette
  - Density → surface detail
  - Rotation → animated rotation

**Rotation Effects**:
- Rotation speed based on planet properties
- Axial tilt from heuristic calculation
- Tidal locking if applicable (synchronized to star)

**User Interaction**:
- Click and drag to rotate
- Scroll to zoom
- Pause animation button

## Data Presentation

### Physical Properties Table

| Property | Unit | Example |
|----------|------|---------|
| Radius | Earth radii (R⊕) | 1.04 |
| Mass | Earth masses (M⊕) | 5.0 |
| Density | g/cm³ | 5.5 |
| Surface Gravity | m/s² | 9.8 |
| Escape Velocity | km/s | 11.2 |

### Orbital Properties Table

| Property | Unit | Example |
|----------|------|---------|
| Orbital Period | days/years | 384.8 days |
| Semi-major Axis | AU | 1.046 |
| Eccentricity | 0-1 | 0.005 |
| Insolation | Earth units | 1.0 |
| Equilibrium Temp | Kelvin | 265 K |

### Habitability Scoring

```
Displayed as:
- Percentage: 74%
- Color scale: red → yellow → green
- Textual rating: "Good candidate"
- Comparison: "Similar to Earth"

Components shown:
- Temperature match
- Size match
- Orbital stability
- Host star suitability
```

## Navigation Integration

### From Planet Page

- Click host star name → Star detail page
- "Similar planets" section → Links to related planets
- "Vote for Earth 2.0" → Vote page (if habitable)

### From Other Pages

- Planet card in catalog → Planet detail page
- Planet name in habitability dashboard → Planet detail page
- Planet in star system view → Planet detail page

## Mobile Responsiveness

### Catalog Page

- **Desktop**: Multi-column grid (4-6 cards per row)
- **Tablet**: 2-3 columns
- **Mobile**: Single column stack
- Filter panel: Collapsible/drawer on mobile

### Detail Page

- **Desktop**: Side-by-side layouts
- **Mobile**: Stacked vertical
- 3D visualization: Touch controls for rotation
- Tables: Scrollable horizontally on small screens

## Internationalization

### Translation Keys

```
pages.planets.title
pages.planets.catalog.title
pages.planets.catalog.filters.*
pages.planets.catalog.sort.*

pages.planet.title
pages.planet.properties.*
pages.planet.habitability.*
pages.planet.discovery.*
pages.planet.discovery.method.*
pages.planet.relatedPlanets.*
```

Supported: English, Portuguese

### Translated Content

- All UI labels (filters, buttons, headings)
- Property names and units
- Habitability assessments
- Related section titles

## Performance Considerations

1. **Large Grid**: 6,000+ planets rendered with virtualization (only visible cards in DOM)
2. **Filtering**: O(n) complexity but <100ms for 6,000 items
3. **Detail Page**: 3D visualization renders at 60fps on modern hardware
4. **Shader Loading**: Compiled on first planet detail view, cached thereafter

## Customization Points

### Filter Thresholds

Habitability zone range, temperature bins, size categories defined in:
- `MATH_CONSTANTS` (physics thresholds)
- `filterPlanets()` logic (filter behavior)

### Card Display

What properties show on cards configurable in:
- `src/components/Planet/PlanetCard.tsx`
- CSS classes for styling

### Sort Behavior

Sort options and order defined in:
- `src/utils/sorting.ts`
- Component sort menu

## See Also

- [System Architecture Overview](architecture-system-overview.md) - Page structure
- [DataService API](api-data-service.md) - Filtering and querying planets
- [CSV Structure & Fields](data-csv-structure.md) - Available planet properties
- [Component Hierarchy](architecture-component-hierarchy.md) - Component organization
- [Star Catalog](feature-star-catalog.md) - Host stars
- [Habitability Dashboard](feature-habitability-dashboard.md) - Analysis view
