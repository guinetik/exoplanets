# Math Module Design

## Overview

The math module (`src/utils/math/`) enforces a strict separation between pure mathematical primitives and domain-specific business logic. This architecture ensures consistency, maintainability, and a single source of truth for all numerical values.

## Philosophy

**Single Source of Truth**: All constants, formulas, and calculations live in one place. Change a value once, it updates everywhere.

**Pure Math, No Logic**: The math module contains only numbers and formulas—no business logic, no types, no domain concepts.

**Domain Logic Separated**: Business logic lives in utility files that USE the math module, not in it.

## Module Structure

```
src/utils/math/
├── index.ts           # Public API exports
├── constants.ts       # All physical and numeric constants
├── planet.ts          # Planet-specific calculations
├── conversions.ts     # Unit conversions
└── utilities.ts       # General math functions
```

### 1. constants.ts - Single Source of Truth

**Purpose**: All numeric constants in one file, accessible everywhere.

**Content Examples**:
- Physical constants (Earth radius = 6,371 km, AU = 149.6 million km)
- Biological thresholds (habitable zone ranges)
- Numeric thresholds (ring probability cutoffs, temperature limits)
- Default values (fallback temperatures, default masses)

**Key Values** (examples):
```typescript
EARTH_RADIUS_KM: 6371
AU_IN_KM: 149597870.7
HABITABLE_ZONE_INNER_AU: 0.95
HABITABLE_ZONE_OUTER_AU: 1.37
RING_COLOR_THRESHOLD_COLD: 200
TEMPERATURE_DEFAULT_FALLBACK: 150
```

**Usage Pattern**:
```typescript
// ✅ CORRECT - Use constants
if (temperature < MATH_CONSTANTS.RING_COLOR_THRESHOLD_COLD) { ... }

// ❌ WRONG - Never hardcode numbers
if (temperature < 200) { ... }
```

### 2. planet.ts - Planet Physics

**Purpose**: Pure calculations related to planet properties.

**Functions** (examples):
- `calculateEquilibriumTemperature(starTemp, starRadius, orbitAU)`
- `calculateSurfaceGravity(mass, radius)`
- `calculateDensity(mass, radius)`
- `estimatePlanetType(radius, mass)`

**Characteristics**:
- No conditional logic (except math conditions like "if x > 0")
- No types or interfaces
- Returns pure numbers
- Deterministic (same inputs → same outputs)

**Example**:
```typescript
export function calculateEquilibriumTemperature(
  starTemperature: number,
  starRadius: number,
  orbitSemiMajorAxisAU: number
): number {
  const stellarFlux = (starTemperature ** 4) * (starRadius ** 2) / (orbitSemiMajorAxisAU ** 2);
  const equilibriumTemp = (stellarFlux / STEFAN_BOLTZMANN_CONSTANT) ** 0.25;
  return equilibriumTemp;
}
```

### 3. conversions.ts - Unit Transformations

**Purpose**: Convert between different units.

**Functions** (examples):
- `auToKm(au)` / `kmToAu(km)`
- `kelvinToCelsius(k)` / `celsiusToKelvin(c)`
- `parsecToLightyears(pc)` / `lightyearsToParsepc(ly)`
- `radiusKmToEarthRadii(km)` / `radiusEarthRadiiToKm(r)`
- `massKgToEarthMasses(kg)` / `massEarthMassesToKg(m)`

**Example**:
```typescript
export function auToKm(au: number): number {
  return au * MATH_CONSTANTS.AU_IN_KM;
}

export function kmToAu(km: number): number {
  return km / MATH_CONSTANTS.AU_IN_KM;
}
```

### 4. utilities.ts - General Math Functions

**Purpose**: Common math operations used throughout.

**Functions** (examples):
- `normalize(value, min, max)` - Scale to [0, 1]
- `clamp(value, min, max)` - Constrain to range
- `lerp(a, b, t)` - Linear interpolation
- `map(value, min1, max1, min2, max2)` - Remap range
- `smoothstep(x)` - Smooth interpolation
- `distance(x1, y1, x2, y2)` - Euclidean distance

**Example**:
```typescript
export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

## Public API (index.ts)

The math module exports everything via a single namespace:

```typescript
export * as MATH_CONSTANTS from './constants';
export * from './planet';
export * from './conversions';
export * from './utilities';
```

**Usage**:
```typescript
import { MATH_CONSTANTS, calculateEquilibriumTemperature, auToKm, normalize } from '@utils/math';

const temp = calculateEquilibriumTemperature(5778, 1, 1.5);
const km = auToKm(1.5);
const normalized = normalize(temp, 0, 3000);
```

## Domain Utilities (Outside Math Module)

**Location**: `src/utils/*.ts`

**Purpose**: Use math primitives to solve domain problems.

**Files** (examples):
- `ringVisuals.ts` - Ring colors from temperature using MATH_CONSTANTS
- `solarSystem.ts` - Ring probability heuristics using formulas
- `planetComparison.ts` - Planet comparison visualization
- `habitabilityAnalytics.ts` - Habitability calculations

**Example Pattern**:
```typescript
// ringVisuals.ts - DOMAIN LOGIC
import { MATH_CONSTANTS, normalize } from '@utils/math';

export interface RingColorProperties {
  color: string;
  hue: number;
  saturation: number;
}

export function getRingColorFromTemperature(
  temperature: number,
  seed: number
): RingColorProperties {
  // Use constant as threshold
  if (temperature < MATH_CONSTANTS.RING_COLOR_THRESHOLD_COLD) {
    return { color: 'ice-blue', hue: 200, saturation: 0.8 };
  }

  // Use utility function
  const normalized = normalize(temperature, 0, 1000);

  return {
    color: `hsl(${hue}, ${saturation}%, 50%)`,
    hue,
    saturation,
  };
}
```

## Adding New Constants

### When a New Value Is Introduced

1. **Check existing constants** - Is it already defined?
2. **Define in constants.ts** - Add with clear name and comment
3. **Use everywhere** - Reference via MATH_CONSTANTS
4. **Document** - Include the source/rationale

### Example: Adding a New Threshold

**Current code has magic numbers**:
```typescript
// ❌ SCATTERED MAGIC NUMBERS
if (planet.temperature < 200) { ... } // planetVisuals.ts
if (equilibriumTemp < 200) { ... } // habitabilityAnalytics.ts
```

**Solution**:
1. Add to `constants.ts`:
```typescript
TEMPERATURE_THRESHOLD_ICE_WORLD: 200, // K, freezing point reference
```

2. Update all uses:
```typescript
// ✅ CORRECT - Uses constant
if (planet.temperature < MATH_CONSTANTS.TEMPERATURE_THRESHOLD_ICE_WORLD) { ... }
```

## Anti-Patterns to Avoid

### ❌ Hardcoded Numbers in Components

```typescript
// WRONG
if (temperature < 200) { ... }
if (mass > 1.5) { ... }
```

**Fix**: Use MATH_CONSTANTS

### ❌ Logic in Math Module

```typescript
// WRONG in math module
export function getPlanetColor(temperature: number, type: string): string {
  if (type === 'rocky') {
    if (temperature < 200) return 'blue';
    if (temperature < 500) return 'green';
  }
  return 'red';
}
```

**Fix**: Move to domain utility (ringVisuals.ts, planetUniforms.ts, etc.)

### ❌ Type Definitions in Math Module

```typescript
// WRONG
export interface Planet {
  name: string;
  radius: number;
}
```

**Fix**: Types go in `src/types/index.ts` or domain utilities

### ❌ Circular Dependencies

```typescript
// WRONG
// constants.ts imports from planet.ts
// planet.ts imports from constants.ts
```

**Fix**: Keep math module acyclic:
- constants.ts (no imports from other math files)
- planet.ts, conversions.ts, utilities.ts (import from constants)
- They don't import each other

## Constants Organization

Constants are organized by category in constants.ts:

```typescript
// Physical Constants
EARTH_RADIUS_KM: 6371,
SOLAR_RADIUS_KM: 696000,
AU_IN_KM: 149597870.7,

// Biological Thresholds
HABITABLE_ZONE_INNER_AU: 0.95,
HABITABLE_ZONE_OUTER_AU: 1.37,
EQUILIBRIUM_TEMPERATURE_MIN: 0,
EQUILIBRIUM_TEMPERATURE_MAX: 3000,

// Numerical Thresholds
RING_PROBABILITY_THRESHOLD: 0.5,
PLANET_TYPE_BOUNDARY_EARTH: 1.25,
PLANET_TYPE_BOUNDARY_SUPER_EARTH: 2.0,

// Default/Fallback Values
TEMPERATURE_DEFAULT_FALLBACK: 150,
MASS_DEFAULT_FALLBACK: 1.0,
```

## Updating Constants

### Impact Analysis

Before changing a constant, consider:
- What calculations use this value?
- What visuals depend on this calculation?
- Will it change planet classifications?
- Will it change habitability scores?

### Change Process

1. Update value in `constants.ts`
2. Test affected calculations
3. Verify visual results (shaders, charts)
4. Document rationale in code comment
5. Update this documentation if threshold meaning changed

## Testing Math Module

### Pattern: Pure Function Testing

```typescript
// Math functions are pure - easy to test
describe('calculateEquilibriumTemperature', () => {
  it('returns correct temp for Earth-like orbit', () => {
    const temp = calculateEquilibriumTemperature(5778, 1, 1.0);
    expect(temp).toBeCloseTo(288, 0); // Should be ~Earth temp
  });
});
```

### Property-Based Testing

```typescript
// Test invariants
it('clamp always returns value within bounds', () => {
  for (let i = 0; i < 1000; i++) {
    const value = Math.random() * 10000 - 5000;
    const clamped = clamp(value, 0, 100);
    expect(clamped).toBeGreaterThanOrEqual(0);
    expect(clamped).toBeLessThanOrEqual(100);
  }
});
```

## See Also

- [System Architecture Overview](architecture-system-overview.md) - Math module in context
- [Planetary Rings](visualization-planetary-rings.md) - Ring probability calculation (uses math)
- [Data Processing Pipeline](data-processing-pipeline.md) - Where derived fields use math
- [CSV Structure & Fields](data-csv-structure.md) - Data that feeds calculations
