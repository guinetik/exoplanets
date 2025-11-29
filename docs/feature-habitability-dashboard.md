# Habitability Dashboard

## Overview

The Habitability Dashboard is an analytics-focused page that visualizes exoplanet data through multiple D3.js charts and a 3D spatial view. It helps users explore habitability patterns, discover correlations, and understand what makes planets potentially habitable.

**Route**: `/habitability`

**Key Features**:
- Multiple D3 charts showing different aspects of habitability
- Real-time filtering by habitability score, temperature range, planet type
- 3D spatial visualization of habitable planets in the galaxy
- Interactive tooltips and drill-down capabilities

## Data Sources

### Primary Data

Uses `dataService.filterPlanets()` with habitability criteria:

| Data Point | Purpose |
|-----------|---------|
| `habitability_score` | Ranking metric (0-1) |
| `equilibrium_temperature` | Classify planets (too hot/cold) |
| `planet_type` | Group by size category |
| `star_class` | Host star classification |
| `radius` | Planet size visualization |
| `orbital_period` | Orbital dynamics |

### Derived Metrics

Computed during filtering:

```typescript
interface HabitabilityMetrics {
  countTotal: number;              // Total filtered planets
  countEarthLike: number;           // earth_like == true
  countHabitableZone: number;      // in habitable zone
  avgHabitabilityScore: number;
  tempRange: {min, max};
  sizeRange: {min, max};
}
```

## Chart Components

### 1. Habitability Score Distribution

**Type**: Histogram

**Axes**:
- X: Habitability score (0.0 to 1.0, binned by 0.05)
- Y: Count of planets in each bin

**What It Shows**:
- Most planets cluster at low scores (0.0-0.2)
- Few planets approach perfect habitability (0.8+)
- Visual representation of "Earth 2.0" rarity

**Interactions**:
- Hover for count details
- Click bar to filter planets by score range

### 2. Temperature Distribution

**Type**: Scatter plot

**Axes**:
- X: Equilibrium temperature (K)
- Y: Planet radius (Earth radii)

**Color Coding**:
- Green: Habitable zone
- Blue: Too cold
- Red: Too hot

**What It Shows**:
- Temperature vs size relationship
- Habitable zone boundaries (visual)
- Clustering of hot Jupiters and cold super-Earths

**Interactions**:
- Hover to see planet details
- Click to navigate to planet detail page

### 3. Star Class Distribution

**Type**: Bar chart

**Axes**:
- X: Star class (O, B, A, F, G, K, M, L, T, Y)
- Y: Count of planets around each class

**What It Shows**:
- Most exoplanets orbit M-class (red dwarf) stars
- Fewer around F/G/K class stars
- Very few around O/B/A class stars

**Interactions**:
- Hover for count
- Click to filter by star class

### 4. Mass Distribution

**Type**: Histogram

**Axes**:
- X: Planet mass (Earth masses, log scale)
- Y: Count

**What It Shows**:
- Most planets are below 5 Earth masses
- Gas giants (>100 masses) are rare
- Super-Earths (2-10 masses) common

**Interactions**:
- Hover for details
- Drag to zoom into mass ranges

### 5. Discovery Method Breakdown

**Type**: Pie/donut chart

**What It Shows**:
- Transit method dominates (>70%)
- Radial velocity minority (<20%)
- Other methods rare

**Interactions**:
- Click slice to filter by method

## 3D Spatial View: HabitableGalaxyView

### Component

**Location**: `src/components/Habitability/HabitableGalaxyView.tsx`

**Technology**: Three.js + React Three Fiber

### What It Shows

**3D Galaxy Points**:
- X, Y, Z: Galactic coordinates (derived from RA, Dec, Distance)
- Color: Habitability score (gradient red → yellow → green)
- Size: Planet radius (visual volume)
- Interactive rotation and zoom

**Selected Planet Highlight**:
- Highlight selected planet (larger, pulsing)
- Show orbital information on click

### Data Transformation

```
Raw CSV data:
  - right_ascension (RA)
  - declination (Dec)
  - distance (parsecs)
  ↓
Convert to 3D Cartesian coordinates:
  x = distance * cos(Dec) * cos(RA)
  y = distance * cos(Dec) * sin(RA)
  z = distance * sin(Dec)
  ↓
Normalize to render space (-1000 to +1000)
  ↓
Visualize as 3D point cloud
```

### Performance

- Renders up to 6,000+ points with GPU instancing
- Dynamic LOD (level of detail) for many points
- Smooth panning and rotation

## Filter Panel

### Available Filters

| Filter | Type | Range |
|--------|------|-------|
| Habitability Score | Slider | 0.0 - 1.0 |
| Temperature Range | Dual Slider | 0 - 3000 K |
| Planet Type | Checkboxes | 6 types |
| Star Class | Checkboxes | 10 classes |
| Size Range | Slider | 0.1 - 50 R⊕ |
| Discovery Year | Slider | 1995 - 2024 |

### Filter Behavior

```
User adjusts filter
  ↓
Component calls filterPlanets(options)
  ↓
DataService filters exoplanet array
  ↓
Re-compute metrics
  ↓
Update all charts and 3D view
```

**Performance**: Filtering ~50-100ms for typical filter sets

## Habitability Score Calculation

### Formula (Simplified)

```
score = (
  temperature_match * 0.4 +
  size_match * 0.3 +
  star_stability * 0.2 +
  orbital_stability * 0.1
)
```

### Component Scores

| Factor | Weight | Details |
|--------|--------|---------|
| Temperature Match | 40% | Distance from optimal Earth temp (288 K) |
| Size Match | 30% | Distance from Earth radius (1 R⊕) |
| Star Stability | 20% | Star lifetime in habitable zone |
| Orbital Stability | 10% | Orbital period similarity to Earth |

### Example Calculation

```
Kepler-452 b:
  Temperature: 265 K (13K from Earth)
    → 0.95 match score
  Radius: 1.04 R⊕ (0.04 difference)
    → 0.98 match score
  Star: G-class, 5 Gyr old, stable
    → 0.90 match score
  Orbit: 384.8 days (1.05 years)
    → 0.98 match score

Final score = (0.95*0.4) + (0.98*0.3) + (0.90*0.2) + (0.98*0.1)
            = 0.38 + 0.294 + 0.18 + 0.098
            = 0.752 (75.2% habitable)
```

## Internationalization

### Translation Keys

All UI text is internationalized:

```
pages.habitability.title
pages.habitability.filters.*
pages.habitability.charts.*
pages.habitability.spatialView.*
```

Supported languages: English (en), Portuguese (pt)

### Chart Labels

- Chart titles: `pages.habitability.charts.{chartName}.title`
- Axis labels: `pages.habitability.charts.{chartName}.axis{X|Y}`

## Navigation & Integration

### Entry Points

- Main navigation menu: "Habitability"
- Direct URL: `/habitability`
- From planet detail: "See similar planets" button

### Links to Other Features

- Click planet in chart → Navigate to planet detail page
- Filter results → "Vote for Earth 2.0" page with filtered candidates
- Star class filter → Navigate to star catalog with filtered results

## Data Flow

```
Page mounts
  ↓
useData() provides dataService
  ↓
Apply default filters
  ↓
DataService.filterPlanets()
  ↓
Compute metrics
  ↓
Render all D3 charts
  ↓
Render 3D spatial view

User adjusts filter
  ↓
Component state updates
  ↓
DataService.filterPlanets() again
  ↓
Charts and 3D view re-render
```

## Performance Considerations

1. **Large Result Sets**: Dashboard handles 1,000+ filtered planets smoothly
2. **Chart Rendering**: D3 charts re-draw on filter change (~100-200ms)
3. **3D Rendering**: WebGL renders up to 6,000 points at 60fps
4. **Mobile**: Charts scale responsively, 3D view simplified for smaller screens

## Customization Points

### Chart Configuration

Chart sizes, colors, and behavior configured in:
- `src/components/Habitability/charts/*`
- Color schemes defined as CSS classes
- Legend and tooltip templates configurable

### Metric Definitions

Habitability score formula and thresholds:
- `src/utils/habitabilityAnalytics.ts`
- Adjust weights to emphasize different factors
- Update MATH_CONSTANTS for thresholds

## See Also

- [System Architecture Overview](architecture-system-overview.md) - Page structure
- [DataService API](api-data-service.md) - Filtering and querying
- [Component Hierarchy](architecture-component-hierarchy.md) - Component organization
- [CSV Structure & Fields](data-csv-structure.md) - Available data fields
