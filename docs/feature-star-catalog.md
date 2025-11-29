# Star Catalog

## Overview

The Star Catalog is a browseable, searchable, and filterable list of 4,500+ host stars from the exoplanet dataset. Each star shows key properties and displays the planets orbiting it, with options to explore in detail.

**Route**: `/stars`

**Key Features**:
- Star grid with filtering and sorting
- Star detail pages with 3D visualization
- 3D orbital system view
- Integration with planet data

## Data Source

Stars are aggregated from planetary data:

```
Exoplanet CSV (6,000+ planets)
  ↓
Group by host_star name
  ↓
Aggregate properties (temperature, radius, class)
  ↓
4,500+ unique Star objects
  ↓
Each contains:
  - Star properties (radius, temperature, class)
  - Hosted planets (count and list)
  - Habitability metrics (how many habitable zones)
```

## Star Properties

### Core Properties

| Property | Source | Purpose |
|----------|--------|---------|
| `name` | CSV | Star identifier (e.g., "Kepler-452") |
| `radius` | CSV | Solar radii (used for size visualization) |
| `temperature` | CSV | Kelvin (drives color) |
| `star_class` | CSV | Spectral type (O/B/A/F/G/K/M/L/T/Y) |
| `distance` | CSV | Parsecs (affects position in 3D view) |

### Derived Properties

| Property | Calculation | Purpose |
|----------|-------------|---------|
| `planet_count` | Count hosted planets | Show alongside name |
| `habitableZone_count` | Count planets in HZ | Assess habitability potential |
| `earthLike_count` | Count Earth-like planets | Show rarity |
| `avgPlanetTemp` | Average of hosted planets | Orbital temperature profile |

## Star Grid / Listing Page

### Component Structure

```
StarCatalog (page)
├── FilterPanel
│   ├── Star class filter
│   ├── Temperature range
│   ├── Distance range
│   ├── Hosting habitable planets filter
│   └── Search input
├── SortOptions
│   ├── By name
│   ├── By temperature
│   ├── By distance
│   └── By planet count
└── StarGrid
    ├── StarCard
    │   ├── Star name + class badge
    │   ├── Temperature color indicator
    │   ├── Planet count badge
    │   ├── "View System" button
    │   └── Quick planet list
    ├── StarCard
    └── [more cards...]
```

### StarCard Component

Each card displays:

**Header**:
- Star name + class (e.g., "Kepler-452 (G)")
- Temperature badge (color-coded by spectral type)

**Stats**:
- Number of planets: "4 planets"
- Habitable zone count: "2 in HZ"
- Distance: "430 pc" (parsecs)

**Quick Planet List**:
- Shows first 3 planets
- "More..." indicator if >3 planets
- Click planet to navigate to detail

**Actions**:
- "View System" button → 3D orbital view
- "See Planets" button → Star detail page
- Click card → Star detail page

## Star Detail Page

**Route**: `/stars/:starSlug`

### Page Layout

```
StarDetail page
├── Star Header
│   ├── Star name and class
│   ├── Temperature display
│   └── Quick facts (distance, planets)
│
├── 3D Star Visualization (Three.js canvas)
│   └── Rotating star with flame effects
│
└── Star Properties Section
    ├── Physical properties table
    │   └── Radius, temperature, class, distance
    ├── Orbital System Info
    │   └── Planets hosted, average orbit distance
    └── Discovery Metadata
        └── When found, discovery context
```

### Properties Display

**Table Format**:
```
Property               | Value
---------------------|---------------------------
Spectral Type         | G2V
Temperature           | 5,757 K
Radius                | 1.11 R☉ (solar radii)
Distance              | 430 parsecs (~1,400 light-years)
Planets Hosted        | 4
Habitable Zone Count  | 2
Age (estimated)       | ~5 billion years
```

## Star System Overview (3D View)

**Route**: `/stars/:starSlug/system`

### Component Features

```
StarSystem page
├── 3D Orbital Visualization (Three.js)
│   ├── Central star
│   ├── Orbital paths (ellipses)
│   ├── Planet positions
│   ├── Scale indicators
│   └── Interactive camera control
│
├── System Information Modals
│   ├── Travel Time Calculator
│   │   └── D3 race visualization (interstellar speeds)
│   ├── Orbital Top-Down View
│   │   └── D3 2D orbital diagram
│   ├── Temperature-Size Bubble Chart
│   │   └── D3 scatter with planets as bubbles
│   └── Notable Features
│       └── Tidal locking, habitable zones, etc.
│
└── Legend
    ├── Orbital periods
    ├── Planet types (color-coded)
    └── Distance scale
```

### 3D Visualization Details

**What's Rendered**:
- Central star (sized to actual radius, colored by temperature)
- Orbital ellipses (to scale in AU)
- Planet positions (on orbits, sized by radius)
- Habitable zone (shaded region)

**Colors**:
- Stars: Temperature-based gradient (blue hot → yellow warm → red cool)
- Planets: By type (rocky, gas giant, etc.)
- Habitable zone: Light green band

**Interactions**:
- Rotate: Click and drag to rotate view
- Zoom: Scroll to zoom in/out
- Click planet: Show details, link to planet page

**Scale Notes**:
- Orbital distances to scale (1 AU = orbital unit)
- Planet sizes scaled up for visibility (otherwise invisible)
- Scale indicator shows reference distance

## Filtering

### Available Filters

| Filter | Type | Purpose |
|--------|------|---------|
| Star Class | Checkboxes | Filter by spectral type |
| Temperature | Dual slider | Min-max range (K) |
| Distance | Dual slider | Parsecs from Earth |
| Has Habitable Planets | Toggle | Only stars with HZ planets |
| Search | Text input | Find by name |

### Filter Behavior

```
User adjusts filter
  ↓
DataService.filterStars() applied
  ↓
Star grid updates
  ↓
Count of matching stars shown
```

## Sorting Options

- **Alphabetical**: A-Z by name
- **Temperature**: Hottest to coolest
- **Distance**: Nearest to farthest
- **Planet Count**: Most to fewest hosted planets
- **Habitability**: Most habitable zones to least

## Navigation Integration

### From Star Page

- Click hosted planet → Planet detail page
- "See all planets of this star" → Planet catalog (pre-filtered)
- "Find similar stars" → Star catalog (pre-filtered by class)

### From Other Pages

- Star link in planet detail → Star detail page
- Planet card in habitability dashboard → Star detail page (if clicked)

## Data Display

### Star Properties Shown

**Physical**:
- Spectral type / class (O/B/A/F/G/K/M/L/T/Y)
- Effective temperature (Kelvin)
- Radius (Solar radii)

**Orbital**:
- Distance from Earth (parsecs, light-years)
- Hosted planets (count)
- Habitable zone range (AU from star)

**Characteristics**:
- Estimated age (if available)
- Notable features (tidal locking, planets, etc.)

## Visual Design

### Color Coding

**By Star Class**:
- O/B: Blue
- A: White-blue
- F: White
- G: Yellow (like Sun)
- K: Orange
- M: Red
- L/T/Y: Brown/dark red

**By Habitability**:
- Dark red: No habitable planets
- Yellow: Some habitable planets
- Green: Multiple habitable planets

### Icons

- "★" indicates main sequence (normal star)
- "◯" indicates giant or unusual star
- "⦿" indicates tidal locking present
- Color badges for planet types

## Internationalization

### Translation Keys

```
pages.stars.title
pages.stars.catalog.title
pages.stars.catalog.filters.*
pages.stars.catalog.sort.*

pages.star.title
pages.star.properties.*
pages.star.system.*

pages.starSystem.title
pages.starSystem.*.title
```

Supported: English, Portuguese

## Performance

- Star grid renders 4,500+ cards with virtualization
- 3D system view handles 10+ planets smoothly
- Filtering: <50ms for most filter combinations
- Search: Real-time as user types

## See Also

- [System Architecture Overview](architecture-system-overview.md) - Page structure
- [DataService API](api-data-service.md) - Star querying methods
- [Star System Overview Feature](feature-star-system-overview.md) - System view details
- [Planet Catalog](feature-planet-catalog.md) - Related planets page
- [CSV Structure & Fields](data-csv-structure.md) - Available star properties
