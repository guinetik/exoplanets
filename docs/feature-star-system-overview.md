# System Overview Modal Enhancements

This document describes the five new sections added to the `SystemOverviewModal` component.

## Overview

The System Overview Modal now includes comprehensive analysis and visualization features for star systems:

1. **Travel Time Calculator** - Visualize cosmic distances in human terms
2. **Notable Star Features** - Highlight special stellar characteristics
3. **System Habitability Overview** - Habitability analysis using existing analytics
4. **Orbital Top-Down View** - D3 polar visualization of planetary orbits
5. **Temperature-Size Bubble Chart** - D3 scatter plot with habitability coloring

---

## 1. Speed Race Visualization

**Component:** `TravelTimeCalculator`

An interactive, animated bar race visualization showing how long it would take to reach the star system at various speeds.

### Features

- **Animated Racing Bars**: Bars grow with staggered timing, creating a visual "race"
- **Logarithmic Scale**: Makes extreme speed differences visible
- **Hover Interaction**: Shows detailed info when hovering over bars
- **"Reachable in Lifetime" Indicator**: Green dashed line showing the threshold
- **Replay Button**: Re-trigger the animation anytime

### Speed Categories (Color-Coded)

| Category | Speeds | Color |
|----------|--------|-------|
| Human Scale | Walking, Car, Commercial Jet | Gray |
| Spacecraft | Voyager 1, New Horizons, Parker Solar Probe | Red → Orange → Yellow |
| Light-Based | 1% c, 10% c, Light Speed | Cyan → Green |

### Interactive Elements

1. **Distance Header**: Shows distance in light-years + reachability badge
2. **Bar Hover**: Displays speed name, travel time, and lifetime comparison
3. **Replay Race**: Button to re-trigger the growth animation

### Constants

```typescript
const LIGHT_YEAR_KM = 9.461e12;
const HUMAN_LIFETIME_YEARS = 80;
const RACE_ANIMATION_DURATION = 2000; // 2 seconds
```

---

## 2. Notable Star Features Section

**Component:** `StarFeaturesSection`

Detects and displays notable stellar characteristics with icons and descriptions.

### Detected Features

| Feature | Condition | Icon |
|---------|-----------|------|
| Solar Analog | `is_solar_analog` | ☀️ |
| Sun-like Star | `is_sun_like_star` | ⭐ |
| Red Dwarf Host | `is_red_dwarf_host` | 🔴 |
| Young System | `is_young_system` (< 1 Gyr) | 🌱 |
| Mature System | `is_mature_system` (1-8 Gyr) | 🌳 |
| Ancient System | `is_ancient_system` (> 10 Gyr) | 🏛️ |
| Metal-Rich | `is_metal_rich_star` | ⚙️ |
| Metal-Poor | `is_metal_poor_star` | 💨 |
| Binary System | `sy_snum > 1` | ★★ |
| Circumbinary | `cb_flag` | 🌀 |

---

## 3. System Habitability Overview

**Component:** `SystemHabitabilitySection`

Reuses existing analytics from `habitabilityAnalytics.ts` to display system-level habitability information.

### Display Elements

1. **System Average Score** - Average habitability score across all planets
2. **Best Candidate** - Name and score of the highest-scoring planet
3. **Breakdown Bars** - Visual representation of habitability categories:
   - Top Candidates (gold)
   - Earth-like (green)
   - Conservative HZ (cyan)
   - Optimistic HZ (orange)
   - Potentially Rocky (purple)
4. **Quick Stats** - Count of habitable zone, Earth-like, and total planets

### Analytics Functions Used

```typescript
import { getHabitabilityStats, getHabitabilityBreakdown } from '../../utils/habitabilityAnalytics';
```

---

## 4. Orbital Top-Down View

**Component:** `OrbitalTopDownChart`

D3-based polar visualization showing planetary orbits from above with habitable zone overlay.

### Features

- **Star at Center** - Yellow glow representing the host star
- **Orbital Paths** - Concentric circles for each planet's semi-major axis
- **Habitable Zone Band** - Green semi-transparent ring showing HZ boundaries
- **Planet Markers** - Color-coded dots (green for habitable zone, cyan for others)
- **AU Grid** - Reference circles showing distances in astronomical units
- **Scale Adaptation** - Automatically scales to fit the outermost orbit

### Habitable Zone Calculation

```typescript
function calculateHabitableZone(luminosity: number | null) {
  const lum = luminosity ? Math.pow(10, luminosity) : 1;
  const sqrtLum = Math.sqrt(Math.max(lum, 0.001));
  return {
    inner: 0.95 * sqrtLum,  // Inner HZ boundary
    outer: 1.67 * sqrtLum,  // Outer HZ boundary
  };
}
```

---

## 5. Temperature-Size Bubble Chart

**Component:** `TempSizeBubbleChart`

D3 scatter plot visualizing planet equilibrium temperature vs. radius with habitability coloring.

### Axes

- **X-axis:** Equilibrium Temperature (K) - logarithmic scale
- **Y-axis:** Planet Radius (Earth radii) - logarithmic scale

### Visual Elements

1. **Temperature Zones** (background)
   - Too Hot (> 320K) - Red tint
   - Habitable (200-320K) - Green tint
   - Too Cold (< 200K) - Blue tint

2. **Planet Bubbles**
   - Size: Proportional to planet mass (sqrt scale)
   - Color: Habitability score gradient (red → yellow → green)

3. **Earth Reference** - Dashed circle marker at Earth's position (255K, 1 R⊕)

### Constants

```typescript
const TEMP_ZONE_HOT = 320;   // Kelvin
const TEMP_ZONE_COLD = 200;  // Kelvin
```

---

## CSS Classes

All new sections use semantic CSS classes defined in `src/styles/index.css`:

- `.travel-time-section`, `.travel-time-row`, `.travel-speed-cell`
- `.star-features-grid`, `.star-feature-card`
- `.habitability-overview-container`, `.habitability-bar-*`
- `.orbital-topdown-container`, `.orbital-legend`
- `.temp-size-container`, `.temp-zone-indicator`

---

## i18n Keys

All text is internationalized with keys under:

```
pages.starSystem.systemOverview.travelTime.*
pages.starSystem.systemOverview.starFeatures.*
pages.starSystem.systemOverview.habitability.*
pages.starSystem.systemOverview.orbitalView.*
pages.starSystem.systemOverview.tempSizeChart.*
```

Translations available in English (`en.json`) and Portuguese (`pt.json`).

## See Also

- [Star Catalog](feature-star-catalog.md) - Star listing and filtering
- [Star Surface Shader](visualization-star-surface-shader.md) - How stars are rendered
- [DataService API](api-data-service.md) - Data loading and querying
- [i18n-stars-pages](i18n-stars-pages.md) - Translation keys for stars pages

