# Planet Rotation and Axial Tilt

This document describes the physics-based rotation and axial tilt estimation system for exoplanet visualizations.

## Overview

The system provides realistic rotation and axial tilt for planets in the StarSystem view and the individual Planet page, using astronomical heuristics based on available exoplanet data.

## Key Concepts

### Rotation Speed

Planets rotate at different speeds based on their type:

| Planet Type    | Base Speed (rad/s) | Real-World Analogue |
|----------------|-------------------:|---------------------|
| Gas Giant      | 0.6                | Jupiter (~10 hr day)|
| Neptune-like   | 0.4                | Neptune (~16 hr day)|
| Sub-Neptune    | 0.3                | Mini-Neptunes       |
| Super-Earth    | 0.15               | Larger rocky worlds |
| Earth-sized    | 0.15               | Earth (~24 hr day)  |
| Sub-Earth      | 0.1                | Small rocky worlds  |

A small variation (±15%) is added based on the planet name hash for uniqueness.

### Tidal Locking

Planets with `is_likely_tidally_locked === true` don't spin on their axis. Instead, one face always points toward the host star. This is common for:
- Ultra-short period planets
- Planets very close to their star
- Planets orbiting red dwarf stars

In the visualization:
- **StarSystem view**: The planet's rotation matches its orbital angle
- **Planet page**: Very slow rotation to indicate the locked state

### Axial Tilt Estimation

The axial tilt (obliquity) is estimated using physics-based heuristics:

1. **Base tilt**: Start with 23.4° (Earth-like default)

2. **Tidal damping** reduces tilt based on:
   - Distance from star (`pl_orbsmax`): Closer planets experience stronger tidal forces
   - Temperature (`pl_eqt`): Hot planets (>1000K) have more damping
   - Planet type: Gas giants damp faster due to fluid interiors

3. **Dynamical history** can increase tilt:
   - High eccentricity (`pl_orbeccen > 0.3`) may indicate past gravitational perturbations

4. **Tidally locked planets**: Near-zero tilt (0-3°)

5. **Final range**: Clamped to 0-45° (extreme tilts like Uranus are rare)

## Files Modified

### `src/utils/solarSystem.ts`

New exports:
- `hashString(str)`: Deterministic hash function for consistent random values
- `estimateRotationSpeed(planet)`: Calculate rotation speed based on planet type
- `estimateAxialTilt(planet)`: Estimate axial tilt using physics heuristics

Extended `StellarBody` interface:
- `rotationSpeed: number` - Radians per second
- `axialTilt: number` - Radians
- `isTidallyLocked: boolean` - Tidal lock state

### `src/components/StarSystem/CelestialBody.tsx`

Updated to use physics-based rotation:
- Applies `axialTilt` to mesh rotation.x
- Uses `rotationSpeed` for spin animation
- Handles tidally locked planets (face always toward star)
- Rings respect axial tilt

### `src/components/Planet/PlanetScene.tsx`

Updated to use shared utilities:
- Imports `estimateRotationSpeed` and `estimateAxialTilt`
- Applies axial tilt to the planet group
- Uses physics-based rotation speed
- Shows minimal rotation for tidally locked planets

## Data Requirements

The estimation functions use these `Exoplanet` fields:
- `planet_type` - For rotation speed classification
- `is_likely_tidally_locked` - Tidal locking state
- `pl_orbsmax` - Semi-major axis (AU)
- `pl_eqt` - Equilibrium temperature (K)
- `pl_orbeccen` - Orbital eccentricity
- `pl_name` - For deterministic variation hash

## Example Usage

```typescript
import { estimateRotationSpeed, estimateAxialTilt } from './utils/solarSystem';

// Get rotation properties for a planet
const rotationSpeed = estimateRotationSpeed(planet);
const axialTilt = estimateAxialTilt(planet);
const isTidallyLocked = planet.is_likely_tidally_locked ?? false;

// Apply in animation loop
mesh.rotation.x = axialTilt;
if (isTidallyLocked) {
  mesh.rotation.y = -orbitAngle + Math.PI; // Face star
} else {
  mesh.rotation.y += delta * rotationSpeed;
}
```

## See Also

- [Shader System V2](visualization-shader-system-v2.md) - How rotation affects visuals
- [Planetary Rings](visualization-planetary-rings.md) - Ring alignment with rotation
- [Math Module Design](architecture-math-module.md) - Physics calculations

