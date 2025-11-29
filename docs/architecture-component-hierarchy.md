# Component Hierarchy

## Overview

The React component structure is organized by feature area with clear separation between pages (routes), domain-specific feature components, and reusable shared components. This document shows how components relate to each other and their responsibilities.

## Component Tree

```
App
├── AppProviders (context providers)
│   ├── DataContext.Provider
│   ├── AuthContext.Provider
│   ├── i18nProvider
│   └── Navigation
│       └── Layout (sidebar/navbar)
│
└── Routes (lazy-loaded)
    ├── / (Starfield)
    │   └── StarfieldRenderer
    │       └── Three.js Canvas
    │
    ├── /planets (PlanetCatalog)
    │   ├── FilterPanel
    │   └── PlanetGrid
    │       ├── PlanetCard
    │       └── [repeated]
    │
    ├── /planets/:slug (PlanetDetail)
    │   ├── PlanetScene (3D visualization)
    │   │   └── Three.js Canvas
    │   ├── PlanetInfo
    │   ├── OrbitalInfo
    │   └── DataCharts
    │
    ├── /stars (StarCatalog)
    │   ├── FilterPanel
    │   └── StarGrid
    │       ├── StarCard
    │       └── [repeated]
    │
    ├── /stars/:slug (StarDetail)
    │   ├── StarScene (3D star)
    │   │   └── Three.js Canvas
    │   ├── StarInfo
    │   └── HostedPlanets
    │
    ├── /stars/:slug/system (StarSystem)
    │   ├── OrbitVisualization (3D)
    │   │   └── Three.js Canvas
    │   ├── SystemOverview (modals)
    │   │   ├── TravelTimeCalculator (D3)
    │   │   ├── OrbitalTopDownView (D3)
    │   │   ├── TempSizeBubbleChart (D3)
    │   │   └── [other sections]
    │   └── SystemInfo
    │
    ├── /habitability (HabitabilityDashboard)
    │   ├── HabitableGalaxyView (3D)
    │   │   └── Three.js Canvas
    │   ├── AnalyticsCharts (D3)
    │   │   ├── ScoreDistribution
    │   │   ├── TemperatureChart
    │   │   ├── StarTypeChart
    │   │   ├── MassChart
    │   │   └── [others]
    │   └── Filters
    │
    ├── /apod (APODPage)
    │   ├── APODImage
    │   ├── APODDetails
    │   └── Navigation
    │
    ├── /about (About)
    │
    ├── /vote (VotePage)
    │   ├── VoteCard
    │   └── VoteCard (repeated)
    │
    └── [other routes]
```

## Component Categories

### Pages/Routes (Lazy-Loaded)

High-level page components that correspond to URL routes:

| Component | Location | Purpose |
|-----------|----------|---------|
| `Starfield` | routes/Starfield.tsx | 2D sky visualization |
| `PlanetCatalog` | routes/PlanetCatalog.tsx | Browse planets, filtering UI |
| `PlanetDetail` | routes/PlanetDetail.tsx | Single planet view |
| `StarCatalog` | routes/StarCatalog.tsx | Browse stars, filtering UI |
| `StarDetail` | routes/StarDetail.tsx | Single star view |
| `StarSystem` | routes/StarSystem.tsx | 3D orbital system |
| `HabitabilityDashboard` | routes/Habitability.tsx | Analytics dashboard |
| `APODPage` | routes/APOD.tsx | NASA picture of the day |
| `About` | routes/About.tsx | Project info |
| `Vote` | routes/Vote.tsx | Community voting |

### 3D Visualization Components

Components that render Three.js scenes:

| Component | Renders | Data |
|-----------|---------|------|
| `StarfieldRenderer` | 2D star field | Star positions, colors |
| `PlanetScene` | Single 3D planet | Planet shader, size, rotation |
| `StarScene` | Single 3D star | Star shader, temperature |
| `OrbitVisualization` | Star system orbits | Planet orbits, positions |
| `HabitableGalaxyView` | 3D habitable planets | Filtered planet positions |

All use `@react-three/fiber` for Three.js integration.

### Data Analysis Components

Components that visualize data with D3.js:

| Component | Chart Type | Data |
|-----------|-----------|------|
| `ScoreDistribution` | Histogram | Habitability scores |
| `TemperatureChart` | Scatter | Temperature distribution |
| `StarTypeChart` | Bar | Star class distribution |
| `MassChart` | Distribution | Planet mass bins |
| `TravelTimeCalculator` | Race visualization | Interstellar distances |
| `OrbitalTopDownView` | Orbital diagram | Planetary orbits |
| `TempSizeBubbleChart` | Bubble scatter | Temperature vs size |

### Feature Components

Mid-level components specific to a feature area:

| Component | Feature | Purpose |
|-----------|---------|---------|
| `PlanetCard` | Planets | Displays planet summary |
| `StarCard` | Stars | Displays star summary |
| `PlanetInfo` | Planet Detail | Shows detailed properties |
| `StarInfo` | Star Detail | Shows detailed properties |
| `FilterPanel` | Catalog | User filtering interface |
| `SystemOverview` | Star System | Modal with 5 visualization sections |
| `VoteCard` | Vote | Individual voting card |

### Shared/Reusable Components

Components used across multiple features:

| Component | Purpose |
|-----------|---------|
| `Loading` | Loading spinner |
| `ErrorBoundary` | Error handling |
| `Modal` | Modal dialog |
| `Tooltip` | Information tooltip |
| `Navigation` | Header/sidebar nav |
| `Layout` | Page layout wrapper |

## Data Flow Between Components

### Props Flow

```
Page Component (gets data from useData())
  ↓
Feature Components (receive data as props)
  ↓
Shared Components (receive specific props)
```

### Hooks Usage

| Hook | Source | Used By | Purpose |
|------|--------|---------|---------|
| `useData()` | DataContext | All data-needing components | Access planets, stars, queries |
| `useTranslation()` | i18next | All text components | Get translated strings |
| `useAuth()` | AuthContext | Vote, Review features | Access user auth state |
| `useParams()` | React Router | Detail pages | Get URL parameters |
| `useNavigate()` | React Router | Navigation | Programmatic routing |

### Context Usage

```
DataContext
├── Provides: DataService, planets, stars
├── Used by: PlanetCatalog, StarCatalog, Detail pages
└── Custom hook: useData()

AuthContext
├── Provides: User, login/logout
├── Used by: Vote, Review features
└── Custom hook: useAuth()
```

## Rendering Patterns

### Lazy Loading Routes

Routes are code-split for smaller initial bundle:

```typescript
const PlanetCatalog = React.lazy(() => import('./routes/PlanetCatalog'));
const StarCatalog = React.lazy(() => import('./routes/StarCatalog'));

// In router config, wrapped with Suspense
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/planets" element={<PlanetCatalog />} />
  </Routes>
</Suspense>
```

### 3D Canvas Integration

Three.js canvases are rendered within React components:

```typescript
<Canvas>
  <PerspectiveCamera position={[0, 0, 5]} />
  <Lights />
  <Planet data={planetData} />
</Canvas>
```

### D3 Integration

D3 charts are mounted to DOM refs:

```typescript
const svgRef = useRef<SVGSVGElement>(null);

useEffect(() => {
  if (!svgRef.current || !data) return;

  d3.select(svgRef.current)
    .selectAll('*')
    .remove();

  // D3 code to create chart
}, [data]);

return <svg ref={svgRef} />;
```

## Composition Patterns

### Conditional Rendering

```typescript
{isLoading && <Loading />}
{error && <ErrorState message={error} />}
{data && <Content data={data} />}
```

### Container/Presentational

Feature components often split logic and UI:

```
PlanetDetail (container)
├── Fetches data with useData()
├── Manages state
└── PlanetDetailView (presentational)
    ├── Receives data as props
    └── Renders UI
```

### Render Props / Hooks

Custom hooks encapsulate logic:

```typescript
const { data, filters, applyFilter } = useData();
// vs
<DataConsumer>
  {({data, filters, applyFilter}) => ...}
</DataConsumer>
```

## Styling Approach

All styles use **Tailwind CSS**:

- **Utility classes**: Most styling done with `className="flex p-4 ..."`
- **@apply patterns**: Repeated patterns extracted to `src/styles/index.css`
- **No CSS-in-JS**: Consistent, pre-defined design system

Example pattern definition:

```css
/* src/styles/index.css */
.planet-card {
  @apply p-4 rounded-lg bg-black/50 border border-white/20;
}

.habitability-chart {
  @apply w-full h-96 bg-slate-900/50 rounded;
}
```

## See Also

- [System Architecture Overview](architecture-system-overview.md) - High-level project structure
- [Data Flow & State Management](architecture-data-flow.md) - How data moves through components
- [Service Layer Overview](api-service-layer.md) - Available services
