# System Architecture Overview

## Overview

The Exoplanets application is a React-based interactive explorer for NASA's confirmed exoplanet database. It combines 3D WebGL visualization with data analysis and discovery tools, all powered by a modular architecture built on React 18, TypeScript, Three.js, and D3.js.

**Key Numbers:**
- 6,000+ confirmed exoplanets
- 4,500+ host stars
- 72 data columns (derived from 683 NASA columns)
- 10+ planet shader types
- Multiple visualization systems

## Project Structure

```
src/
├── components/          # Reusable UI components organized by feature
│   ├── Habitability/    # Dashboard with D3 charts + 3D spatial view
│   ├── Planet/          # 3D planet rendering (PlanetScene.tsx)
│   ├── StarSystem/      # 3D star system visualization
│   ├── Starfield/       # 2D sky view
│   └── [other features]/
├── routes/              # Page components (lazy-loaded)
├── services/            # Singleton data services
│   ├── dataService.ts   # CSV loading, indexing, querying (O(1) lookups)
│   ├── shaderService.ts # GLSL shader management
│   └── apodService.ts   # NASA APOD API
├── context/             # React Context (DataContext, AuthContext)
├── utils/               # Helpers and domain-specific utilities
│   ├── math/            # Pure mathematical primitives
│   ├── astronomy.ts     # Coordinate transformations
│   ├── planetUniforms.ts # Shader parameter generation
│   └── [other utilities]/
├── types/               # TypeScript interfaces
├── i18n/                # Translations (en.json, pt.json)
└── styles/              # Tailwind CSS + @apply patterns

public/
├── data/exoplanets.csv  # Runtime data (3.6 MB)
└── shaders/             # GLSL shaders + manifest.json

data/
├── fetch_exoplanets.py  # NASA API fetcher
└── process_exoplanets.py # Data transformer
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 18 + TypeScript | Component-based UI, type safety |
| **Build Tool** | Vite | Fast development and production builds |
| **Styling** | Tailwind CSS | Utility-first styling with @apply patterns |
| **3D Graphics** | Three.js + React Three Fiber | WebGL rendering and scene management |
| **Data Visualization** | D3.js | Interactive charts and analytics |
| **Shader Language** | GLSL | Custom vertex/fragment shaders for planets and stars |
| **Internationalization** | react-i18next | Multi-language support (EN, PT) |
| **State Management** | React Context | DataContext for global data access |

## Core Architectural Patterns

### 1. Service Layer (Singletons)

Services are singleton instances that manage specific domains:

- **DataService**: Loads CSV, builds indexed Maps (O(1) lookups), provides filtering and querying API
- **ShaderService**: Manages GLSL shader compilation and caching
- **APODService**: Fetches NASA Astronomy Picture of the Day
- **PollService, ReviewService, UserService**: Additional feature services

All services follow a consistent pattern: initialize once, export as singleton, use throughout app.

### 2. React Context for Global State

`DataContext` wraps the entire application:

```
App
├── DataContext.Provider
│   ├── Layout + Routes
│   │   ├── /planets (uses useData())
│   │   ├── /stars (uses useData())
│   │   ├── /habitability (uses useData())
│   │   └── [other pages]
```

`useData()` hook provides access to:
- Loaded exoplanet and star data
- Filtering and search functions
- Cached indexes for fast lookups

### 3. Component Organization

Components are organized by feature area:

- **Routes** (lazy-loaded pages): `Planets`, `Stars`, `Habitability`, `APOD`, etc.
- **Feature components**: Domain-specific components (`Habitability/`, `Planet/`, `StarSystem/`)
- **Shared components**: Reusable UI elements used across features

### 4. 3D Rendering Pattern

Three.js scenes are managed with React Three Fiber (`@react-three/fiber`):

- Each 3D feature is a separate component (e.g., `PlanetScene.tsx`, `StarfieldRenderer.tsx`)
- Shaders are loaded via `ShaderService`
- Uniforms are computed with utility functions (`planetUniforms.ts`)
- Animation frames are managed by the Three.js render loop

### 5. Math Module Architecture

Strict separation between pure math and domain logic:

**Pure Math** (`src/utils/math/`):
- Constants only (physical values, numeric thresholds)
- Functions only (calculations, conversions)
- Zero types, zero business logic
- Single source of truth for all values

**Domain Utilities** (`src/utils/*.ts`):
- Uses math module primitives
- Introduces types and interfaces
- Applies business logic
- Examples: `ringVisuals.ts`, `solarSystem.ts`, `planetComparison.ts`

**Components**: Consume utilities, no magic numbers

## Data Flow

### 1. Application Startup

```
1. App mounts
2. DataContext initializes DataService
3. DataService loads CSV from public/data/exoplanets.csv
4. CSV is parsed into typed Exoplanet[] and Star[] arrays
5. Indexes (slug Maps) are built for O(1) lookups
6. DataContext provides useData() hook to all children
```

### 2. Feature Usage (Example: Planet Details)

```
1. User visits /planets/:planetSlug
2. Component calls useData() to get dataService
3. getPlanet(slug) does O(1) lookup
4. Planet data is rendered with:
   - 3D visualization (PlanetScene)
   - Shader selection (planetUniforms.ts)
   - D3 charts for properties
   - Orbit visualization
```

### 3. Filtering Pipeline

```
User filters → filterPlanets(options) → Results
                    ↓
            DataService.queryIndex()
            (fast filtered results)
            ↓
            Component re-renders
            (new filtered data)
```

## Internationalization

Translation system using react-i18next:

- Language files: `src/i18n/en.json`, `src/i18n/pt.json`
- Key structure: `pages.planets.title`, `pages.planet.details.radius`
- Usage in components: `const { t } = useTranslation(); t('pages.planets.title')`
- Add new language: Create new JSON file, register in `src/i18n/index.ts`

## Routing Structure

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Starfield | 2D sky visualization |
| `/planets` | PlanetCatalog | Browse and filter planets |
| `/planets/:slug` | PlanetDetail | Individual planet details |
| `/stars` | StarCatalog | Browse and filter stars |
| `/stars/:slug` | StarDetail | Individual star details |
| `/stars/:slug/system` | StarSystem | 3D orbital system view |
| `/habitability` | HabitabilityDashboard | Analytics and statistics |
| `/apod` | APODPage | NASA Picture of the Day |
| `/about` | About | Project information |

## Performance Considerations

1. **Code Splitting**: Routes are lazy-loaded with `React.lazy()`
2. **CSV Parsing**: Done once at startup, indexed for fast lookups
3. **Memoization**: Components use React.memo where appropriate
4. **WebGL Optimization**: Shader compilation is cached
5. **Image Optimization**: APOD images are responsive, with fallback sizes

## Data Pipeline

The CSV data originates from NASA and undergoes transformation:

```
NASA Exoplanet Archive
        ↓ (fetch_exoplanets.py)
683 raw columns
        ↓ (process_exoplanets.py)
72 derived columns:
- Basic properties (radius, mass, orbital period)
- Derived calculations (planet type, habitability score, tidal lock)
- Flags (is_habitable_zone, is_earth_like)
        ↓
public/data/exoplanets.csv
        ↓ (Runtime)
DataService parses
        ↓
Indexed for fast access
```

Key derived fields that drive visuals:
- `planet_type` → Shader selection
- `equilibrium_temperature` → Ring colors, planet appearance
- `is_likely_tidally_locked` → Rotation behavior
- `orbital_period` → Animation speed

## Build & Deployment

- **Development**: `npm run dev` starts Vite dev server
- **Production**: `npm run build` creates optimized build
- **Testing**: `npm test` runs Jest + React Testing Library tests

## See Also

- [Component Hierarchy](architecture-component-hierarchy.md) - Detailed component organization
- [Data Flow & State Management](architecture-data-flow.md) - State flow mechanics
- [Math Module Design](architecture-math-module.md) - Math primitives philosophy
- [DataService API](api-data-service.md) - Data service methods
- [Service Layer Overview](api-service-layer.md) - All available services
