# Contributing to Exoplanets

Thank you for your interest in contributing! This document outlines our development guidelines and constraints.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **Routing**: React Router v6
- **i18n**: react-i18next (English + Portuguese)
- **Logging**: @guinetik/logger (no console.log!)
- **Testing**: Jest + React Testing Library

## Development Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Code Style Guidelines

### Tailwind CSS Usage

**DO NOT** write inline Tailwind class soup in components:

```tsx
// BAD - Avoid this
<div className="flex items-center justify-between px-4 py-2 bg-black border-b border-white/10">
```

**DO** use `@apply` in CSS to create semantic classes:

```css
/* GOOD - In src/styles/index.css */
@layer components {
  .navbar-inner {
    @apply flex items-center justify-between px-4 py-2 bg-black border-b border-white/10;
  }
}
```

```tsx
// GOOD - In component
<div className="navbar-inner">
```

This approach:
- Keeps markup clean and readable
- Creates reusable, semantic class names
- Makes styling changes easier to manage
- Allows cascading and composition

### Component Structure

```
src/
├── components/       # Reusable components
│   ├── ComponentName.tsx
│   └── index.ts      # Barrel exports
├── routes/           # Page components
│   ├── PageName.tsx
│   └── index.ts      # Route definitions
├── styles/           # CSS files
│   └── index.css     # Main stylesheet with @apply rules
├── i18n/             # Translations
│   ├── en.json
│   ├── pt.json
│   └── index.ts
└── __tests__/        # Test files
```

### Naming Conventions

- **Components**: PascalCase (`Navbar.tsx`, `LanguagePicker.tsx`)
- **CSS Classes**: kebab-case (`navbar-inner`, `mobile-menu-button`)
- **i18n Keys**: dot-notation (`nav.home`, `pages.about.title`)

### TypeScript

- Use strict mode (enabled in `tsconfig.json`)
- Define interfaces for props and data structures
- Avoid `any` type - use `unknown` if type is truly unknown

### Logging

**DO NOT** use `console.log`, `console.error`, or other console methods directly:

```tsx
// BAD - Direct console usage
console.log('Data loaded');
console.error('Failed to load:', error);
```

**DO** use the `@guinetik/logger` library for all logging:

```tsx
// GOOD - Use createLogger
import { createLogger } from '@guinetik/logger';

const logger = createLogger({ prefix: 'MyService' });

logger.info('Data loaded');
logger.error('Failed to load:', error);
```

#### Available Log Levels

The logger provides these methods (in order of severity):

| Method | Use Case |
|--------|----------|
| `logger.error()` | Errors that need attention |
| `logger.warn()` | Warnings about potential issues |
| `logger.info()` | General informational messages |
| `logger.debug()` | Detailed debugging information |
| `logger.trace()` | Very detailed tracing (auto-redacts secrets) |

#### Additional Features

```tsx
// Timing operations
logger.time('dataLoad');
// ... operation ...
logger.timeEnd('dataLoad');

// Grouping related logs
logger.group('Processing planets');
logger.info('Step 1...');
logger.info('Step 2...');
logger.groupEnd();

// Table output for data
logger.table(planets, ['name', 'type', 'distance']);
```

#### Component Filtering

The logger supports runtime filtering via `window.logFilter`:

```js
// In browser console:
logFilter.list();              // Show all registered components
logFilter.enable('DataService'); // Enable specific component
logFilter.disableAll();        // Silence all (errors still show)
logFilter.enableAll();         // Enable all components
```

### Math Module Architecture

This is a math project with strict architectural principles for all calculations.

**CRITICAL RULE: Pure Numbers → `src/utils/math/` | Domain Logic → Utilities | Components → Just Consume**

#### Separation of Concerns

1. **`src/utils/math/constants.ts`** - Pure numerical constants ONLY
   - Physical constants (G, AU conversions, Earth references)
   - Temperature thresholds
   - Visualization sizing constraints
   - Orbital mechanics parameters
   - **RULE**: No types, no interfaces, no logic—only numbers with comments

2. **`src/utils/math/*.ts`** (planet.ts, conversions.ts, utilities.ts) - Pure mathematical functions
   - Physics calculations (`calculateEquilibriumTemp`, `calculateSurfaceGravity`, etc)
   - Unit conversions
   - General utilities (`normalize`, `clamp`, `lerp`, `smoothstep`)
   - **RULE**: No domain logic, no visualization code

3. **`src/utils/*.ts`** (ringVisuals.ts, planetComparison.ts, etc) - Domain-specific utilities
   - Uses math module primitives
   - Introduces types and interfaces for domain concepts
   - Composes math functions with business logic
   - **RULE**: Import from math module, not the other way around

4. **Components** - Consume, don't implement
   - Import functions from utilities and math module
   - Zero magic numbers, zero duplicate logic
   - **RULE**: No hardcoded thresholds, no recalculations

#### Example: Temperature Resolution

**WRONG** - Scattered imperative code:
```typescript
// PlanetScene.tsx
let temp = planet.pl_eqt;
if (!temp && planet.pl_insol) {
  temp = Math.sqrt(planet.pl_insol) * 255; // Magic number!
} else if (!temp) {
  temp = 150; // Different component, different default!
}

// planetUniforms.ts
const temp = planet.pl_eqt ?? 300; // Different default again!
```

**RIGHT** - Centralized and consistent:
```typescript
// math/constants.ts
TEMPERATURE_DEFAULT_FALLBACK: 150,

// math/planet.ts
export function getEffectiveTemperature(planet): {
  temperatureK: number;
  isApproximate: boolean;
  method: 'observed' | 'calculated' | 'insolation' | 'fallback';
} {
  // Uses MATH_CONSTANTS, implements priority logic
}

// Any component
const tempResult = getEffectiveTemperature(planet);
const temp = tempResult.temperatureK;
```

**Benefits:**
- ✅ Single source of truth for all numeric values
- ✅ No scattered magic numbers
- ✅ Consistent defaults across all components
- ✅ Transparent calculation methods
- ✅ Easy to test and modify

### Magic Numbers

This is a math project so. **All magic numbers must be extracted to named constants.** This applies to both TypeScript/React and GLSL shaders.

#### TypeScript / React

Extract numeric literals to named constants at the top of files or in dedicated constants files:

```tsx
// BAD - Magic numbers scattered throughout
const timeout = setTimeout(() => { /* ... */ }, 5000);
const maxItems = data.slice(0, 24);
const itemsPerPage = 20;
const baseOpacity = 0.7;

// GOOD - Named constants
const TIMEOUT_MS = 5000;
const ITEMS_PER_PAGE = 20;
const MAX_VISIBLE_ITEMS = 24;
const BASE_OPACITY = 0.7;

const timeout = setTimeout(() => { /* ... */ }, TIMEOUT_MS);
const maxItems = data.slice(0, MAX_VISIBLE_ITEMS);
```

Guidelines:
- Use SCREAMING_SNAKE_CASE for all constants
- Group related constants in objects when appropriate
- Add comments explaining non-obvious values
- For thresholds, explain the boundary: `const TEMP_THRESHOLD_HOT = 800; // Above this = volcanic`

#### GLSL Shaders

Shaders are particularly prone to magic numbers. **All shader constants must be extracted to a dedicated section at the top**, organized by function.

**BAD - Magic numbers in code:**
```glsl
void main() {
  float bands = sin(latitude * 3.14159 * 5.0 + seed * 3.0) * 0.5 + 0.5;
  bands = smoothstep(0.3, 0.7, bands);
  
  float craters = snoise(uv * (25.0 + seed * 15.0));
  float crater = smoothstep(0.7, 0.8, craters) * (1.0 - hasAtmo);
  
  float haze = snoise(vec2(uv.x * 6.0 + time * 0.01)) * 0.5 + 0.5;
  haze = smoothstep(0.4, 0.8, haze) * 0.3;
}
```

**GOOD - Organized constants section:**
```glsl
// =============================================================================
// SHADER CONSTANTS - Magic Numbers Extracted
// =============================================================================

// --- Atmospheric Bands ---
const float BAND_PI = 3.14159;
const float BAND_FREQ_BASE = 5.0;
const float BAND_AMPLITUDE = 0.5;
const float BAND_SMOOTHSTEP_LOW = 0.3;
const float BAND_SMOOTHSTEP_HIGH = 0.7;

// --- Craters ---
const float CRATER_SCALE_BASE = 25.0;
const float CRATER_SCALE_SEED = 15.0;
const float CRATER_THRESHOLD_LOW = 0.7;
const float CRATER_THRESHOLD_HIGH = 0.8;
const float CRATER_VISIBILITY = 1.0;

// --- Haze ---
const float HAZE_SCALE = 6.0;
const float HAZE_TIME_SPEED = 0.01;
const float HAZE_THRESHOLD_LOW = 0.4;
const float HAZE_THRESHOLD_HIGH = 0.8;
const float HAZE_MAX_OPACITY = 0.3;

void main() {
  float bands = sin(latitude * BAND_PI * BAND_FREQ_BASE + seed * 3.0) 
               * BAND_AMPLITUDE + BAND_AMPLITUDE;
  bands = smoothstep(BAND_SMOOTHSTEP_LOW, BAND_SMOOTHSTEP_HIGH, bands);
  
  float craters = snoise(uv * (CRATER_SCALE_BASE + seed * CRATER_SCALE_SEED));
  float crater = smoothstep(CRATER_THRESHOLD_HIGH, CRATER_THRESHOLD_LOW, craters) * (1.0 - hasAtmo);
  
  float haze = snoise(vec2(uv.x * HAZE_SCALE + time * HAZE_TIME_SPEED)) * 0.5 + 0.5;
  haze = smoothstep(HAZE_THRESHOLD_LOW, HAZE_THRESHOLD_HIGH, haze) * HAZE_MAX_OPACITY;
}
```

Shader Constants Guidelines:

1. **Location**: Create a `SHADER CONSTANTS` section immediately after uniforms/varyings, before any functions
2. **Organization**: Group related constants with section headers:
   ```glsl
   // --- Atmospheric Bands ---
   const float BAND_FREQ_BASE = 5.0;
   
   // --- Craters ---
   const float CRATER_SCALE_BASE = 25.0;
   ```
3. **Naming**: Use SCREAMING_SNAKE_CASE. Include context: `BAND_FREQ_BASE` not just `FREQ`
4. **Comments**: Explain each constant's purpose:
   ```glsl
   const float BAND_SMOOTHSTEP_LOW = 0.3;  // Where soft band transition starts
   ```
5. **Algorithm Constants**: For mathematical constants (especially from algorithms like Simplex noise), show the formula:
   ```glsl
   const float SIMPLEX_SKEW = 0.211324865405187;  // (3 - sqrt(3)) / 6
   const float TAYLOR_A = 1.79284291400159;       // Taylor approximation coefficient
   ```
6. **Related Parameters**: Keep all related values together (e.g., all smoothstep thresholds):
   ```glsl
   // --- Limb Darkening ---
   const float LIMB_SMOOTHSTEP_LOW = -0.3;
   const float LIMB_SMOOTHSTEP_HIGH = 0.7;
   const float LIMB_BASE_DARKNESS = 0.3;
   const float LIMB_BRIGHTNESS_RANGE = 0.7;
   ```
7. **Ranges**: Make threshold pairs explicit:
   ```glsl
   const float TEMP_THRESHOLD_COLD = 250.0;    // Below = cold planet
   const float TEMP_THRESHOLD_HOT = 800.0;     // Above = hot planet
   ```

### Internationalization

All user-facing text must be translated:

```tsx
// GOOD
const { t } = useTranslation();
<h1>{t('pages.home.title')}</h1>

// BAD - Hardcoded text
<h1>Home</h1>
```

Add translations to both `en.json` and `pt.json`.

### Routing

Routes are defined in `src/routes/index.ts`. The navbar automatically renders routes where `showInNav: true`.

To add a new route:

1. Create the page component in `src/routes/NewPage.tsx`
2. Add the route config to `src/routes/index.ts`
3. Add translations to `src/i18n/en.json` and `src/i18n/pt.json`

### Testing

- Tests go in `src/__tests__/`
- Test file naming: `ComponentName.test.tsx`
- Focus on behavior, not implementation details

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

## Common Tasks

### Add a new mathematical constant

All physical and visualization constants belong in `src/utils/math/constants.ts`.

**Steps:**

1. Determine if it's a pure numeric value (no types/logic attached)
2. Add to the `MATH_CONSTANTS` object with a descriptive name and comment explaining the unit/purpose
3. Import and use in your calculation or utility function
4. Update this documentation if the constant affects multiple components

**Example:**

```typescript
// math/constants.ts
export const MATH_CONSTANTS = {
  // ... existing constants

  // Ring appearance thresholds (Kelvin)
  RING_COLOR_THRESHOLD_VERY_COLD: 120,  // Ultra-cold: pure ice rings
  RING_COLOR_THRESHOLD_COLD: 200,       // Cold: mixed ice/rock
} as const;

// utils/ringVisuals.ts
import { MATH_CONSTANTS } from './math/constants';

export function getRingColorProperties(temperature: number) {
  if (temperature < MATH_CONSTANTS.RING_COLOR_THRESHOLD_VERY_COLD) {
    return { hue: 200, saturation: 0.8 }; // Blue ice
  }
  // ... more logic using constants
}

// components/Planet/PlanetScene.tsx
import { createRingColorFromTemperature } from '../../utils/ringVisuals';

const ringColor = createRingColorFromTemperature(temp, seed);
```

### Add a new physics calculation

Follow the math module architecture: pure math primitives → domain utilities → components.

**Steps:**

1. If it's a fundamental calculation (equilibrium temp, density, gravity), add to `src/utils/math/planet.ts`
2. Use `MATH_CONSTANTS` for all numeric values
3. Include JSDoc with formula and parameter descriptions
4. Return rich objects with metadata (`isApproximate`, `method`, etc) for transparency
5. Create a domain utility in `src/utils/*.ts` that composes the math function with business logic if needed
6. Components import from utilities, not directly from the math module

**Example:**

```typescript
// math/planet.ts - Pure calculation
export function calculateEquilibriumTemp(
  starTempK: number,
  starRadiusSolar: number,
  orbitDistanceAU: number
): { temperatureK: number; isCalculated: true; albedo: number } {
  // T_eq = T_star × √(R_star_AU / (2 × a))
  // where R_star_AU = starRadiusSolar × SOLAR_RADIUS_AU
  const rStarAU = starRadiusSolar * MATH_CONSTANTS.SOLAR_RADIUS_AU;
  const denominator = 2 * orbitDistanceAU;
  const tempK = starTempK * Math.sqrt(rStarAU / denominator);

  return {
    temperatureK: tempK,
    isCalculated: true,
    albedo: MATH_CONSTANTS.EQUILIBRIUM_TEMP_ALBEDO,
  };
}

// utils/math/planet.ts - Domain resolution with priority logic
export function getEffectiveTemperature(planet: Exoplanet) {
  // Try NASA data first
  if (planet.pl_eqt) {
    return {
      temperatureK: planet.pl_eqt,
      isApproximate: false,
      method: 'observed' as const,
    };
  }

  // Try Stefan-Boltzmann calculation
  if (planet.st_teff && planet.st_rad && planet.pl_orbsmax) {
    const result = calculateEquilibriumTemp(
      planet.st_teff,
      planet.st_rad,
      planet.pl_orbsmax
    );
    return {
      temperatureK: result.temperatureK,
      isApproximate: true,
      method: 'calculated' as const,
    };
  }

  // ... more fallback logic
}

// components/Planet/PlanetScene.tsx - Components just consume
const tempResult = getEffectiveTemperature(planet);
const temp = tempResult.temperatureK;
const ringColor = createRingColorFromTemperature(temp, seed);
```

### Add a new route

Routes are defined in `src/routes/index.ts` and automatically appear in the navbar if `showInNav: true`.

**Steps:**

1. Create the page component in `src/routes/NewPage.tsx`
2. Add the route config to `src/routes/index.ts`:
   ```typescript
   import NewPage from './NewPage';

   { path: '/new-page', element: <NewPage />, showInNav: true }
   ```
3. Add translation keys to both `src/i18n/en.json` and `src/i18n/pt.json`

### Add a new shader

Shaders are registered in `public/shaders/manifest.json` and accessed via `shaderService.get()`.

**Steps:**

1. Create `.vert` and/or `.frag` files in `public/shaders/` (organized by type)
2. Register in `public/shaders/manifest.json`:
   ```json
   { "name": "planetMyShaderFrag", "path": "planet/myShader.frag" }
   ```
3. Use in components via:
   ```typescript
   import { shaderService } from '../../services/shaderService';

   const shader = shaderService.get('planetMyShaderFrag');
   ```

**Important**: Extract all magic numbers to a constants section at the top of the shader file using SCREAMING_SNAKE_CASE.

### Add new exoplanet data fields

When adding new columns to the data pipeline:

**Steps:**

1. Update `data/process_exoplanets.py` to include the new field
2. Add the property to the `Exoplanet` interface in `src/types/index.ts`
3. Re-run the data pipeline:
   ```bash
   cd data
   python process_exoplanets.py
   ```
4. The output automatically copies to `public/data/exoplanets.csv`

## Design Constraints

### Colors

- **Background**: Black (`bg-black`)
- **Text**: White (`text-white`)
- **Muted Text**: White with opacity (`text-white/70`, `text-white/50`)
- **Borders**: White with low opacity (`border-white/10`)

### Responsive Design

- Mobile-first approach
- Breakpoints: `md` (768px) for tablet/desktop
- Mobile menu for navigation on small screens

## Git Workflow

1. Create a feature branch from `master`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## Project Structure

```
exoplanets/
├── src/              # Frontend source
├── data/             # Data pipeline (Python)
│   ├── raw/          # Raw NASA data
│   ├── out/          # Processed data
│   └── *.py          # Processing scripts
├── legacy/           # Legacy JavaScript implementation
└── dist/             # Build output (generated)
```

## Questions?

Open an issue on GitHub or check existing documentation.
