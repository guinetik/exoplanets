# CLAUDE.md - Exoplanets Project Guide

## IMPORTANT RULES
- **NEVER run `npm run dev`** - The user manages the dev server themselves
- **NEVER start background servers** - Only run `npm run build` or `npm test`

## Quick Start

```bash
npm install
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm test             # Run tests
```

## Project Overview

An interactive web app for exploring NASA's confirmed exoplanet database. Visualizes 6,000+ exoplanets and 4,500+ host stars with 3D WebGL rendering, data analysis, and habitability scoring.

**Tech Stack**: React 18 + TypeScript + Vite + Three.js + Tailwind CSS + D3.js

## Architecture

```
src/
├── components/          # Reusable UI components
│   ├── Habitability/    # Dashboard with D3 charts + 3D spatial view
│   ├── Planet/          # 3D planet rendering (PlanetScene.tsx)
│   ├── StarSystem/      # 3D star system visualization
│   └── Starfield/       # 2D sky view
├── routes/              # Page components (lazy-loaded)
├── services/            # Singleton data services
│   ├── dataService.ts   # CSV loading, indexing, querying
│   ├── shaderService.ts # GLSL shader management
│   └── apodService.ts   # NASA APOD API
├── context/             # React Context (DataContext)
├── utils/               # Helpers (astronomy, habitability, 3D math)
├── types/               # TypeScript interfaces
├── i18n/                # Translations (en.json, pt.json)
└── styles/              # Tailwind CSS with @apply patterns

public/
├── data/exoplanets.csv  # Runtime data (3.6 MB, 72 columns)
└── shaders/             # GLSL shaders (star, planet, earth, rings)
    └── manifest.json    # Shader registry

data/
├── fetch_exoplanets.py  # NASA API fetcher
└── process_exoplanets.py # Data transformer (683 → 72 columns)
```

## Key Patterns

### Data Flow
- `DataContext` wraps app, provides `useData()` hook
- `dataService` singleton loads CSV, builds Maps for O(1) lookups
- URL slugs via `nameToSlug()` for SEO-friendly routes

### 3D Rendering
- React Three Fiber (`@react-three/fiber`) for Three.js integration
- Custom GLSL shaders loaded via `shaderService`
- Shader selection based on planet type in `planetUniforms.ts`

### Styling Convention
**Use @apply in index.css, not inline Tailwind:**
```css
/* src/styles/index.css */
.planet-card {
  @apply p-4 rounded-lg bg-black/50 border border-white/20;
}
```

### Logging (NO console.log)
```typescript
import { createLogger } from '@guinetik/logger';
const logger = createLogger({ prefix: 'ComponentName' });
logger.info('message');
```

## Data Pipeline

To refresh exoplanet data:
```bash
cd data
python fetch_exoplanets.py      # Download from NASA
python process_exoplanets.py    # Process + derive fields
# Output auto-copies to public/data/exoplanets.csv
```

## Shader System

Register shaders in `public/shaders/manifest.json`:
```json
{ "name": "planetRockyFrag", "path": "planet/rocky.frag" }
```

Access via: `shaderService.get('planetRockyFrag')`

Available planet shaders: `gasGiant`, `hotJupiter`, `iceGiant`, `rocky`, `lavaWorld`, `icyWorld`

## i18n

- Languages: `en`, `pt`
- Files: `src/i18n/{lang}.json`
- Usage: `const { t } = useTranslation(); t('pages.planets.title')`

## Routes

| Path | Component | Nav |
|------|-----------|-----|
| `/` | Home (Starfield) | Yes |
| `/stars` | Star catalog | Yes |
| `/stars/:starId` | Star detail | No |
| `/planets` | Planet catalog | Yes |
| `/planets/:planetId` | Planet detail | No |
| `/habitability` | Analysis dashboard | Yes |
| `/apod` | NASA Picture of Day | Yes |
| `/about` | About page | Yes |

## Types

Core interfaces in `src/types/index.ts`:
- `Exoplanet` - 164 properties (physical, orbital, discovery, flags)
- `Star` - Host star aggregation
- `PlanetType` - Sub-Earth | Earth-sized | Super-Earth | Sub-Neptune | Neptune-like | Gas Giant
- `StarClass` - O | B | A | F | G | K | M | L | T | Y

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```
Tests in `src/__tests__/`, uses Jest + React Testing Library.

## Git Conventions

- Main branch: `master`
- Commit style: `type(scope): message` (feat, fix, chore, refactor, docs)

## Common Tasks

**Add a new route:**
1. Create `src/routes/NewPage.tsx`
2. Add to `src/routes/index.ts` with lazy import
3. Add i18n keys to both `en.json` and `pt.json`

**Add a new shader:**
1. Create `.vert`/`.frag` in `public/shaders/`
2. Register in `manifest.json`
3. Use via `shaderService.get('name')`

**Add new exoplanet fields:**
1. Update `process_exoplanets.py`
2. Add to `Exoplanet` interface in `types/index.ts`
3. Re-run data pipeline
