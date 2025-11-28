# Planetary Rings System

This document describes the physics-based ring probability heuristic and procedural ring rendering system.

## Overview

The system determines which exoplanets should have rings using astrophysical principles, then renders those rings with procedural shaders that create thin, sandy, concentric bands.

## Ring Probability Heuristic

### Scoring Formula

```
S = 0.35×S_HR + 0.30×S_G + 0.20×S_T + 0.15×S_A
```

A planet has rings if its deterministic seed (from name hash) is less than the calculated probability score.

### Score Components

#### S_HR: Hill/Roche Availability (35% weight)

Determines if a stable ring zone exists between the Roche limit and Hill radius.

**Hill Radius** - Gravitational sphere of influence:
```
R_H = a × (M_p / (3 × M_star))^(1/3)
```

**Roche Limit** - Minimum distance before tidal disruption:
```
R_Roche = 2.456 × R_p × (ρ_p / ρ_s)^(1/3)
```

| Ratio (R_H / R_Roche) | Score | Interpretation |
|----------------------:|------:|----------------|
| > 10                  | 1.0   | Huge ring zone (like Saturn) |
| > 3                   | 0.8   | Good ring zone |
| > 1.5                 | 0.4   | Marginal ring zone |
| ≤ 1.5                 | 0.05  | No stable ring zone |

#### S_G: Giantness Score (30% weight)

Larger planets capture and retain ring material more effectively.

| Planet Radius | Score | Examples |
|--------------:|------:|----------|
| > 8 R⊕        | 1.0   | Jupiter, Saturn |
| > 4 R⊕        | 0.6   | Neptune, sub-Saturns |
| > 2 R⊕        | 0.2   | Mini-Neptunes |
| ≤ 2 R⊕        | 0.05  | Rocky worlds |

#### S_T: Temperature Score (20% weight)

Cold planets favor stable icy rings; hot planets sublimate ring material.

| Equilibrium Temp | Score | Ring Composition |
|-----------------:|------:|------------------|
| < 150 K          | 1.0   | Pure ice (like Saturn's) |
| < 250 K          | 0.5   | Mixed ice/rock |
| < 400 K          | 0.2   | Rocky/dusty (less stable) |
| ≥ 400 K          | 0.05  | Rings sublimate quickly |

#### S_A: Youth Score (15% weight)

Young systems have more debris available for ring formation.

| System Age | Score | Debris Availability |
|-----------:|------:|---------------------|
| < 0.3 Gyr  | 1.0   | Abundant debris |
| < 1.0 Gyr  | 0.7   | Good debris |
| < 3.0 Gyr  | 0.4   | Moderate debris |
| ≥ 3.0 Gyr  | 0.3   | Limited debris |

### Eligible Planet Types

Only these types can have rings:
- Gas Giant
- Neptune-like
- Sub-Neptune

Rocky planets (Earth-sized, Super-Earth, Sub-Earth) are excluded regardless of score.

## Ring Rendering

### Visual Design

Rings are rendered with procedural GLSL shaders creating:
- **8-15 thin concentric bands** per planet
- **Sandy/porous particle texture** using multi-layer noise
- **Temperature-based colors** matching planet environment
- **Transparency** allowing background visibility

### Ring Band Generation

```glsl
// Evenly distribute rings with small random offsets
float numRings = 8.0 + floor(uSeed * 8.0);
float spacing = availableSpace / numRings;

// Very thin rings (0.01-0.04 radial width)
float ringWidth = 0.01 + hash(seed) * 0.03;

// Sharp edges using step function
float edge = sharpStep(ringCenter - ringWidth/2, r, 300.0);
```

### Sandy Texture

Three noise layers create a porous, particulate appearance:

| Layer | Scale | Purpose |
|-------|------:|---------|
| Clumps | 50× | Large-scale density variation |
| Medium grain | 200× | Visible gaps between particles |
| Fine grain | 500× | Sand-like granularity |

```glsl
float sandy = clumps * medGrain * (0.5 + fineGrain * 0.5);
ringDensity *= sandy;
```

### Temperature-Based Ring Colors

| Temperature | Color | Description |
|------------:|-------|-------------|
| < 120 K     | Bright white/blue | Pure ice rings |
| < 200 K     | Pale blue-gray | Mixed ice/rock |
| < 350 K     | Tan/brown/gray | Rocky/dusty |
| < 600 K     | Dark metallic/rusty | Dark rocky |
| ≥ 600 K     | Orange-red | Silicate/volcanic debris |

## Files

### Core Logic

**`src/utils/solarSystem.ts`**
- `calculateRingProbability(planet)` - Compute probability score
- `shouldHaveRings(planet)` - Boolean determination using seed
- `estimateMassFromRadius(radius)` - Chen & Kipping mass-radius relation
- `calculateHillRadius(a, Mp, Ms)` - Gravitational sphere calculation
- `calculateRocheLimit(Rp, ρp, ρs)` - Tidal disruption limit

### Shaders

**`public/shaders/planet/rings.vert`**
- Calculates radial position from vertex coordinates
- Passes `vRadialPos` (0-1) and `vAngle` to fragment shader

**`public/shaders/planet/rings.frag`**
- Generates thin concentric ring bands
- Applies sandy particle texture
- Handles temperature-based coloring

### Components

**`src/components/StarSystem/CelestialBody.tsx`**
- Renders rings in star system overview
- Passes uniforms: `uInnerRadius`, `uOuterRadius`, `uRingColor`, etc.

**`src/components/Planet/PlanetScene.tsx`**
- Renders rings on planet detail page
- Uses `shouldHaveRings()` for consistency

**`src/components/PlanetVisualization.tsx`**
- SVG thumbnail with ring indication
- Uses same `shouldHaveRings()` function

## Data Requirements

The heuristic uses these `Exoplanet` fields:

| Field | Usage | Fallback |
|-------|-------|----------|
| `pl_rade` | Giantness score | 1.0 R⊕ |
| `pl_bmasse` | Hill radius calc | Estimated from radius |
| `pl_dens` | Roche limit calc | Type-based estimate |
| `pl_orbsmax` | Hill radius calc | 1.0 AU |
| `pl_eqt` | Temperature score | Estimated from insolation |
| `pl_insol` | Temperature estimate | 300 K default |
| `st_mass` | Hill radius calc | 1.0 M☉ |
| `st_age` | Youth score | 0.3 (unknown) |
| `is_young_system` | Youth score boost | false |
| `planet_type` | Eligibility filter | 'Terrestrial' |

## Example Calculation

**16 Cyg B b** (Gas Giant at 1.66 AU, 7.4 Gyr old system):

```
S_HR = 1.0  (Hill/Roche ratio = 87.8)
S_G  = 1.0  (radius = 13.5 R⊕)
S_T  = 0.5  (T_eq ≈ 216 K)
S_A  = 0.3  (age = 7.4 Gyr)

S = 0.35(1.0) + 0.30(1.0) + 0.20(0.5) + 0.15(0.3)
S = 0.35 + 0.30 + 0.10 + 0.045 = 0.795 (79.5%)

Seed = 0.552 < 0.795 → HAS RINGS ✓
```

## References

- Chen & Kipping (2017) - Mass-radius relation ("Forecaster")
- Hill sphere - Gravitational sphere of influence
- Roche limit - Tidal disruption distance
- Saturn ring composition studies
