# Exoplanet Dataset - Derived Features Documentation

This document describes all derived features (tags/flags) computed by `process_exoplanets.py` from the raw NASA Exoplanet Archive data.

## Table of Contents

- [Planet Classification](#planet-classification)
- [Orbital Characteristics](#orbital-characteristics)
- [System Architecture](#system-architecture)
- [Proximity & Observability](#proximity--observability)
- [Stellar Environment](#stellar-environment)
- [Extreme Worlds](#extreme-worlds)
- [Habitability Related](#habitability-related)
- [Display Fields](#display-fields)
- [Computed Values](#computed-values)

---

## Planet Classification

### `planet_type` (string)
Primary classification based on radius AND temperature. **Prioritizes liquid water potential.**

| Value | Criteria |
|-------|----------|
| `Sub-Earth` | Radius < 0.5 R⊕ (habitable zone) or < 1.0 R⊕ (cold/unknown) |
| `Earth-sized` | Radius 0.5-1.25 R⊕ (habitable zone) or < 1.0 R⊕ (cold) |
| `Super-Earth` | Radius 1.25-2.5 R⊕ in habitable zone, or 1.0-1.75 R⊕ otherwise |
| `Sub-Neptune` | Radius 2.5-4.0 R⊕ (habitable zone) or 1.75-4.0 R⊕ otherwise |
| `Neptune-like` | Radius 4.0-10.0 R⊕ |
| `Gas Giant` | Radius > 10.0 R⊕ |

**Key insight:** A 2.1 R⊕ planet in the habitable zone (like Kepler-22 b) is classified as `Super-Earth`, not `Sub-Neptune`, because it could be an ocean world or rocky planet with a thick atmosphere capable of supporting life.

### `planet_subtype` (string)
More detailed classification using mass, radius, and temperature.

| Value | Description |
|-------|-------------|
| `Rocky` | Small, likely rocky composition |
| `Terrestrial` | Earth-like, in habitable zone |
| `Super-Earth` | Larger rocky world |
| `Ocean World` | In habitable zone, radius 1.75-2.5 R⊕, mass > 10 M⊕ |
| `Mini-Neptune` | Small gas/ice planet |
| `Ice Giant` | Neptune-sized, cold |
| `Jovian` | Jupiter-like gas giant |
| `Hot Jupiter` | Gas giant with temp > 1000K |
| `Hot Neptune` | Neptune-sized with temp > 1000K |
| `Lava World` | Small planet with temp > 1000K |
| `Brown Dwarf Candidate` | Mass > 13 Jupiter masses |
| `Dense Super-Earth` | Super-Earth with mass > 5 M⊕ |

### `star_class` (string)
Stellar spectral class extracted from `st_spectype`.

Values: `O`, `B`, `A`, `F`, `G`, `K`, `M`, `L`, `T`, `Y`

---

## Orbital Characteristics

### `is_ultra_short_period` (boolean)
**Criteria:** Orbital period < 1 day

Extreme worlds completing an orbit in less than 24 hours. These planets are likely tidally locked, with permanent day and night sides, and may be lava worlds due to intense stellar radiation.

### `is_short_period` (boolean)
**Criteria:** Orbital period < 10 days

Planets with relatively short orbital periods, easier to detect via transit method.

### `is_long_period` (boolean)
**Criteria:** Orbital period > 1000 days (~2.7 years)

Outer solar system analogs. These are harder to detect and confirm due to requiring years of observation.

### `is_eccentric_orbit` (boolean)
**Criteria:** Orbital eccentricity > 0.3

Planets with elongated orbits experience significant temperature variations throughout their year. May indicate gravitational interactions with other bodies.

### `is_circular_orbit` (boolean)
**Criteria:** Orbital eccentricity < 0.05

Stable, nearly circular orbits like Earth's (e=0.017). Generally more favorable for climate stability.

### `is_likely_tidally_locked` (boolean)
**Criteria:** Period < 10 days AND semi-major axis < 0.1 AU

Planets that likely have one side permanently facing their star. Common for planets in the habitable zone of red dwarf stars.

---

## System Architecture

### `is_multi_planet_system` (boolean)
**Criteria:** System has more than 1 known planet

Systems with multiple confirmed planets, indicating we have a better understanding of the system's architecture.

### `is_rich_system` (boolean)
**Criteria:** System has 4 or more planets

Systems with complex architectures, similar to our solar system's inner planets.

### `is_only_known_planet` (boolean)
**Criteria:** System has exactly 1 known planet

Could indicate either a true single-planet system or undiscovered companions.

### `is_circumbinary` (boolean)
**Criteria:** `cb_flag == 1`

"Tatooine" planets that orbit two stars. These systems have complex dynamics and unique formation histories.

### `is_multi_star_system` (boolean)
**Criteria:** System has more than 1 star

Planets in binary or multiple star systems.

---

## Proximity & Observability

### `is_nearby` (boolean)
**Criteria:** Distance < 50 parsecs (~163 light-years)

Close enough for detailed study with current and near-future technology. Prime targets for atmospheric characterization with JWST.

### `is_very_nearby` (boolean)
**Criteria:** Distance < 20 parsecs (~65 light-years)

The closest exoplanets to Earth. Best candidates for direct imaging and future missions.

### `is_transiting` (boolean)
**Criteria:** `tran_flag == 1`

Planet transits its star as seen from Earth. Enables atmospheric spectroscopy during transit.

### `has_rv_data` (boolean)
**Criteria:** `rv_flag == 1`

Has radial velocity measurements, which provide mass constraints.

### `has_ttv` (boolean)
**Criteria:** `ttv_flag == 1`

Shows transit timing variations, indicating gravitational interactions with other bodies (possibly undiscovered planets).

### `is_controversial` (boolean)
**Criteria:** `pl_controv_flag == 1`

Flagged as controversial in the NASA Exoplanet Archive. May have disputed detection or parameters.

---

## Stellar Environment

### `is_solar_analog` (boolean)
**Criteria:** G-type star AND stellar mass between 0.8-1.2 solar masses

Stars most similar to our Sun. Planets here may have the most Earth-like conditions.

### `is_sun_like_star` (boolean)
**Criteria:** Star class is F, G, or K

Broader category of Sun-like stars. These have appropriate luminosities and lifetimes for potential habitability.

### `is_red_dwarf_host` (boolean)
**Criteria:** Star class is M

Red dwarf stars are the most common in the galaxy. Their habitable zones are very close-in, leading to tidally locked planets.

### `is_young_system` (boolean)
**Criteria:** Stellar age < 1 billion years

Young systems where planets may still be evolving, with ongoing geological activity and atmospheric changes.

### `is_mature_system` (boolean)
**Criteria:** Stellar age between 1-8 billion years

Systems of similar age to our solar system (~4.6 Gyr). Enough time for life to potentially develop.

### `is_ancient_system` (boolean)
**Criteria:** Stellar age > 10 billion years

Very old systems that have had billions of years for potential life to evolve. These predate our solar system significantly.

### `is_metal_rich_star` (boolean)
**Criteria:** Stellar metallicity [Fe/H] > 0.1

Stars with higher heavy element content. Correlates with higher probability of giant planet formation.

### `is_metal_poor_star` (boolean)
**Criteria:** Stellar metallicity [Fe/H] < -0.3

Stars with lower heavy element content. May have different planet formation outcomes.

---

## Extreme Worlds

### `is_hot_jupiter` (boolean)
**Criteria:** Gas Giant AND equilibrium temperature > 1000K

Large gas giants orbiting very close to their stars. Have exotic atmospheric chemistry and often inflated radii.

### `is_hot_neptune` (boolean)
**Criteria:** Neptune-like or Sub-Neptune AND equilibrium temperature > 800K

Neptune-sized planets in close orbits. May be undergoing atmospheric escape.

### `is_ultra_hot` (boolean)
**Criteria:** Equilibrium temperature > 2000K

Extremely hot planets where metals may vaporize in the atmosphere.

### `is_frozen_world` (boolean)
**Criteria:** Equilibrium temperature < 150K

Very cold planets, likely beyond the snow line. May have exotic ice compositions.

### `is_ultra_dense` (boolean)
**Criteria:** Density > 8 g/cm³

Iron-rich worlds, denser than Earth (5.5 g/cm³). May be remnant cores or Mercury-like compositions.

### `is_puffy` (boolean)
**Criteria:** Density < 0.5 g/cm³

Inflated planets with very low density. Often hot Jupiters with expanded atmospheres.

### `is_super_massive` (boolean)
**Criteria:** Mass > 10 Jupiter masses

Approaching the brown dwarf boundary (~13 Jupiter masses). May have deuterium fusion.

### `is_lightweight` (boolean)
**Criteria:** Mass < 0.5 Earth masses

Very small planets, smaller than Mars. Difficult to detect and may have lost atmospheres.

---

## Habitability Related

### `is_habitable_zone` (boolean)
**Criteria:** Equilibrium temperature between 200-320K

Temperature range where liquid water could exist on the surface (with appropriate atmospheric pressure).

### `has_earth_like_insolation` (boolean)
**Criteria:** Insolation flux between 0.5-2.0 Earth flux

Receives a similar amount of stellar energy as Earth. Important for climate considerations.

### `is_conservative_habitable` (boolean)
**Criteria:** Equilibrium temperature between 200-280K

Stricter habitable zone definition, closer to Earth's conditions.

### `is_optimistic_habitable` (boolean)
**Criteria:** Equilibrium temperature between 150-350K

Broader habitable zone allowing for greenhouse effects (Venus-like) or distant habitability.

### `is_top_habitable_candidate` (boolean)
**Criteria:** In habitable zone AND radius 0.5-2.0 R⊕ AND orbits Sun-like or red dwarf star

Best candidates for potential habitability based on multiple factors.

### `is_potentially_rocky` (boolean)
**Criteria:** Radius ≤ 1.6 R⊕ AND (density ≥ 3.5 g/cm³ OR density unknown)

Planets likely to have rocky compositions based on the radius-density relationship.

### `is_earth_like` (boolean)
**Criteria:** Radius between 0.8-1.25 R⊕

Earth-sized planets regardless of temperature. Combined with `is_habitable_zone` for best Earth analogs.

### `habitability_score` (float, 0-100)
Composite score based on:
- Temperature (max 40 points): Peak at Earth's ~255K
- Size (max 30 points): Peak at 0.8-1.5 R⊕
- Star type (max 20 points): G=20, K=18, F=15, M=12
- Insolation (max 10 points): Bonus for Earth-like values

---

## Display Fields

Human-readable formatted values for UI display.

| Field | Description | Example |
|-------|-------------|---------|
| `distance_display` | Formatted distance | "635 light-years", "1.2k light-years" |
| `period_display` | Formatted orbital period | "5.2 days", "9.7 months", "12.3 years" |
| `mass_display` | Formatted mass | "2.1 Earth masses", "1.3 Jupiter masses" |
| `radius_display` | Formatted radius | "1.50 Earth radii", "11.2 Jupiter radii" |

---

## Computed Values

### Position & Distance

| Field | Description | Unit |
|-------|-------------|------|
| `x_pc`, `y_pc`, `z_pc` | 3D Cartesian position | parsecs |
| `distance_ly` | Distance from Earth | light-years |

Positions are computed from the unit vector (x, y, z) multiplied by distance (`sy_dist`).

---

## Data Pipeline

To regenerate the processed data:

```bash
cd exoplanets/data
python process_exoplanets.py
cp out/exoplanets.csv ../public/data/exoplanets.csv
```

## Source Data

Raw data is fetched from the [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) using `fetch_exoplanets.py`.