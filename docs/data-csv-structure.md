# CSV Structure & Fields

## Overview

The `exoplanets.csv` file contains 72 columns describing 6,000+ confirmed exoplanets. This document provides a complete reference for each field, including data type, units, typical values, and usage notes.

**File Location**: `public/data/exoplanets.csv`

**Dimensions**: 6,800+ rows × 72 columns

**Size**: ~1.2 MB (plain CSV), ~300 KB (gzip compressed)

## Field Reference Guide

### Planet Name & Identification

#### `pl_name` (string)
Official planet name from NASA archive
- Format: "Kepler-452 b" or "51 Pegasi b"
- Never null
- Unique identifier for each planet
- Used for URL slugs

#### `pl_name_alt` (string)
Alternative or discovery name if available
- Examples: "K2-18b" (Kepler mission), "TOI-1695 b" (TESS)
- May be null for planets without alternate names

---

### Planet Physical Properties

#### `pl_type` (string, categorical)
Planet type classification based on radius and mass

**Valid Values**:
- "Sub-Earth" (R < 0.8 R⊕)
- "Earth-sized" (0.8-1.25 R⊕)
- "Super-Earth" (1.25-2.0 R⊕)
- "Sub-Neptune" (2.0-6.0 R⊕)
- "Neptune-like" (6.0-10.0 R⊕)
- "Sub-Jupiter" (10.0-15.0 R⊕)
- "Gas Giant" (> 15.0 R⊕)
- "Hot Jupiter" (Gas Giant, T > 1000 K)
- "Ice Giant" (Large, T < 150 K)
- "Desert World" (Rocky, T > 700 K)

**Never Null**: Always has a classification

**Used By**: Filtering, visualization selection, habitability scoring

#### `pl_radius` (float)
Planetary radius in Earth radii (R⊕)

**Unit**: Earth radii (1 R⊕ = 6,371 km)
**Range**: 0.1 to 1000 R⊕ (typical: 0.5-20)
**Null %**: ~15% (not all radii measured)
**Precision**: 2-4 decimal places

**Used By**:
- Type classification
- Visual sizing
- Habitability scoring
- Comparison charts

#### `pl_mass` (float)
Planetary mass in Earth masses (M⊕)

**Unit**: Earth masses (1 M⊕ = 5.972×10²⁴ kg)
**Range**: 0.001 to 10000 M⊕ (typical: 0.1-1000)
**Null %**: ~40% (hard to measure directly)
**Precision**: 1-3 significant figures

**Notes**:
- Gas giants often have lower precision mass estimates
- Derived from orbital dynamics for transit method

#### `pl_density` (float)
Planetary mean density in g/cm³

**Unit**: g/cm³
**Range**: 0.1 to 50 g/cm³
**Null %**: ~70% (requires both mass and radius)
**Precision**: 1-2 decimal places

**Formula**: density = mass / (4/3 π r³)

**Used By**: Surface/atmosphere inference, visual appearance

#### `pl_gravity` (float)
Surface gravity in m/s²

**Unit**: m/s² (Earth: 9.81 m/s²)
**Range**: 0.1 to 100 m/s²
**Null %**: ~75% (requires mass, radius, and assumptions)
**Precision**: 1 decimal place

**Formula**: g = G*M / r²

**Used By**: Atmospheric retention estimates

#### `pl_eqt` (float)
Equilibrium temperature (K)

**Unit**: Kelvin
**Range**: 10 to 3000 K (typical: 50-2000)
**Null %**: ~5% (usually can be computed)
**Precision**: 0 decimal places (integer K)

**Formula**: T_eq = T_star * sqrt(R_star / (2*a)) ^ 0.5

**Used By**:
- Habitability scoring (weighted heavily)
- Shader color selection
- Ring probability
- Tidal locking prediction
- Ring color determination

#### `pl_smaxis` (float)
Semi-major axis (orbital distance) in AU

**Unit**: Astronomical Units (1 AU = 149.6 million km)
**Range**: 0.001 to 1000 AU (typical: 0.01-100)
**Null %**: ~5%
**Precision**: 3-6 decimal places

**Used By**:
- Habitable zone determination
- RV amplitude calculation
- Orbital visualization

---

### Orbital Properties

#### `pl_orbper` (float)
Orbital period (time for one complete orbit)

**Unit**: Days
**Range**: 0.1 to 1,000,000 days
**Null %**: ~10% (sometimes measured as years, needs conversion)
**Precision**: 3-6 decimal places

**Used By**:
- Animation speed
- Radial velocity visualization
- Orbital stability assessment

#### `pl_eccen` (float)
Orbital eccentricity (0 = perfect circle, 1 = parabolic)

**Unit**: Dimensionless (0-1)
**Range**: 0.0 to 1.0 (typical: 0.0-0.8)
**Null %**: ~50% (hard to measure)
**Precision**: 2-4 decimal places

**Used By**:
- Tidal locking prediction
- Orbital visualization
- Habitability assessment

#### `pl_incl` (float)
Orbital inclination angle

**Unit**: Degrees (0-90)
**Range**: 0 to 90 degrees
**Null %**: ~80% (only known for transit method)
**Precision**: 1-2 decimal places

**Notes**: Required to convert RV amplitude to true planet mass

#### `pl_trandep` (float)
Transit depth (dip in star brightness)

**Unit**: Dimensionless (parts per million, ppm)
**Range**: 0 to 10000 ppm
**Null %**: ~98% (only for transiting planets)
**Precision**: 0 decimal places (integer ppm)

**Used By**: Detection strength indicator for transit method planets

#### `pl_rvampl` (float)
Radial velocity amplitude (K value)

**Unit**: m/s
**Range**: 0.1 to 1000 m/s
**Null %**: ~98% (only for RV method planets)
**Precision**: 1-3 decimal places

**Used By**: RV visualization, detection difficulty assessment

#### `pl_trandur` (float)
Transit duration (how long star is blocked)

**Unit**: Hours
**Range**: 0.5 to 12 hours
**Null %**: ~98% (transit method only)
**Precision**: 2-3 decimal places

---

### Host Star Properties

#### `st_name` (string)
Host star name (usually catalog designation)

**Format**: "Kepler-452", "51 Pegasi", "TRAPPIST-1"
**Never Null**
**Unique**: Usually (some planets share stars)

#### `st_class` (string, categorical)
Stellar spectral classification

**Valid Values**: O, B, A, F, G, K, M, L, T, Y

**Distribution** (by frequency):
- M (red dwarf): ~70% of stars
- K (orange dwarf): ~15%
- G (yellow, like Sun): ~10%
- F, A, B, O: ~5% combined
- L, T, Y: <1% (brown dwarfs)

**Used By**:
- Filtering
- Star appearance
- Habitability scoring (star stability)

#### `st_radius` (float)
Host star radius in solar radii (R☉)

**Unit**: Solar radii (1 R☉ = 696,000 km)
**Range**: 0.1 to 1000 R☉ (typical: 0.1-3)
**Null %**: ~20%
**Precision**: 2-3 decimal places

**Used By**: Habitable zone calculation, visual sizing

#### `st_mass` (float)
Host star mass in solar masses (M☉)

**Unit**: Solar masses (1 M☉ = 1.989×10³⁰ kg)
**Range**: 0.07 to 300 M☉ (typical: 0.08-3)
**Null %**: ~30%
**Precision**: 2-3 decimal places

**Used By**:
- Planet mass derivation (from RV)
- Stellar stability assessment
- Habitability scoring

#### `st_teff` (float)
Star effective temperature (K)

**Unit**: Kelvin
**Range**: 2000 to 50000 K (typical: 2800-6000)
**Null %**: ~5%
**Precision**: 0 decimal places (integer K)

**Used By**:
- Star color visualization
- Habitable zone calculation
- Planet equilibrium temperature

#### `st_dist` (float)
Star distance from Earth

**Unit**: Parsecs (1 pc = 3.26 light-years)
**Range**: 1 to 100,000 pc (typical: 10-1000)
**Null %**: ~25% (hard to measure accurately)
**Precision**: 1-2 decimal places

**Used By**:
- Distance filtering
- 3D spatial visualization
- Accessibility for observation

#### `st_lum` (float)
Star luminosity (total power output)

**Unit**: Solar luminosities (L☉)
**Range**: 0.0001 to 1,000,000 L☉
**Null %**: ~40%
**Precision**: 2-4 decimal places

**Used By**: Habitable zone boundaries

#### `st_age` (float)
Star age (estimated)

**Unit**: Giga-years (Gyr), 1 Gyr = 1 billion years
**Range**: 0.1 to 13 Gyr
**Null %**: ~95% (age hard to measure)
**Precision**: 1-2 decimal places

**Used By**: Habitability scoring (stellar stability)

#### `st_rotper` (float)
Star rotation period (days)

**Unit**: Days
**Range**: 0.1 to 1000 days
**Null %**: ~99% (rarely measured)

#### `st_rvel` (float)
Star radial velocity (km/s toward/away from us)

**Unit**: km/s
**Range**: -1000 to +1000 km/s
**Null %**: ~90%
**Precision**: 1-2 decimal places

#### `st_radvel_err` (float)
RV measurement error/uncertainty

**Unit**: km/s
**Null %**: ~95%

---

### Discovery Information

#### `discoverymethod` (string, categorical)
Detection method used to find planet

**Valid Values**:
- "Transit" (~70%) - Planet crosses star, blocking light
- "Radial Velocity" (~20%) - Star wobbles toward/away
- "Microlensing" (~3%) - Gravitational lensing
- "Direct Imaging" (~2%) - Picture of planet
- "Timing Variations" (~2%) - Planet affects pulsar/star timing
- "Other" (<1%) - Various other methods

**Never Null**: Method always determined

**Used By**:
- Filtering
- Detection difficulty inference
- Visualization (RV method)

#### `discoveryyear` (integer)
Year planet was discovered

**Range**: 1995 to 2024
**Null %**: <1%
**Precision**: Integer year

**Used By**:
- Historical filtering (find recent discoveries)
- Discovery timeline
- Sorting

#### `releasedate` (string, date)
First public announcement (ISO format: YYYY-MM-DD)

**Null %**: ~5%

#### `rowupdate` (string, date)
Last update to this record

**Null %**: <1%

#### `publicationstatus` (string)
Publication status of discovery

**Valid Values**:
- "Published"
- "Submitted"
- "Archived"

#### `pubdate` (string, date)
Publication date of discovery paper

**Null %**: ~10%

#### `journal` (string)
Journal where discovery published

**Examples**: "Astronomy & Astrophysics", "The Astrophysical Journal"

**Null %**: ~30%

#### `authors` (string)
First author of discovery paper

**Null %**: ~30%

---

### Computed / Derived Flags

#### `is_earth_like` (boolean)
Planet is potentially habitable Earth-like world

**Definition**:
```
is_earth_like = (
  pl_type == "Earth-sized" AND
  is_habitable_zone == true
)
```

**Count**: ~127 planets (1.9% of database)

**Never Null**: Always computed

**Used By**:
- Vote page (candidate list)
- Habitability dashboard
- Filtering

#### `is_habitable_zone` (boolean)
Planet is within star's habitable zone

**Definition**: Orbital distance where liquid water could exist

**Conservative Habitable Zone**:
- Inner boundary: Where Venus is (too hot)
- Outer boundary: Where Mars is (too cold)
- Roughly: 0.95 to 1.37 AU around Sun-like star

**Count**: ~843 planets (12.3% of database)

**Never Null**: Always computed

**Used By**: Habitability assessment, filtering, scoring

#### `is_likely_tidally_locked` (boolean)
Planet likely has one side always facing star

**Definition**: Rotation synchronized to orbit (one day = one year)

**When It Happens**:
- Very close orbits (< 3 days typical)
- Low-mass stars (red dwarfs, M-class)
- Examples: TRAPPIST-1 planets, most hot Jupiters

**Count**: ~1,204 planets (17.6% of database)

**Never Null**: Always computed

**Used By**:
- Visualization (rotation behavior)
- Habitability assessment (no day/night cycle)

#### `habitability_score` (float)
Composite score for potential habitability

**Range**: 0.0 (not habitable) to 1.0 (ideal like Earth)

**Null %**: ~5% (when key data is missing)

**Composition**:
- 40% - Temperature match (vs Earth)
- 30% - Size match (vs Earth)
- 20% - Star stability (age, class)
- 10% - Orbital stability (eccentricity, not tidally locked)

**Distribution**:
- Median: 0.05
- Mean: 0.12
- Max: 0.98
- 127 planets > 0.5 (good candidates)

**Never Null** (unless critical data missing): Always computed

**Used By**:
- Dashboard sorting
- Vote page rankings
- Filtering (show "best candidates")
- Visual scoring displays

---

## Data Type Summary

| Type | Fields | Example |
|------|--------|---------|
| String | `pl_name`, `discoverymethod`, `journal` | "Kepler-452 b" |
| Float | `pl_radius`, `pl_eqt`, `habitability_score` | 1.04, 265.0, 0.752 |
| Integer | `discoveryyear` | 2015 |
| Boolean | `is_earth_like`, `is_habitable_zone` | true, false |
| Categorical | `pl_type`, `st_class` | "Earth-sized", "G" |
| Date | `releasedate`, `pubdate` | "2015-07-23" |

## NULL Values

### Fields Most Likely to be NULL

| Field | % Null | Reason |
|-------|--------|--------|
| `st_age` | 95% | Age hard to determine |
| `st_rotper` | 99% | Star rotation rarely measured |
| `pl_gravity` | 75% | Requires mass + radius |
| `pl_incl` | 80% | Only known for transit method |
| `pl_mass` | 40% | Hard to measure directly |
| `pl_density` | 70% | Requires both mass and radius |

### Fields Rarely NULL

| Field | % Null | Reason |
|--------|--------|--------|
| `pl_name` | 0% | Always has name |
| `pl_type` | 0% | Always classified |
| `discoverymethod` | 0% | Always known |
| `is_earth_like` | 0% | Always computed |
| `discoveryyear` | <1% | Always recorded |

## Using the Data in the App

### CSV Loading

```typescript
// DataService loads and parses CSV
const csv = await fetch('public/data/exoplanets.csv');
const text = await csv.text();
const rows = Papa.parse(text).data;

// Each row becomes typed Exoplanet object
const planet: Exoplanet = {
  name: row.pl_name,
  planet_type: row.pl_type as PlanetType,
  radius: parseFloat(row.pl_radius),
  // ... etc
};
```

### Type Definitions

All fields are defined in `src/types/index.ts`:

```typescript
interface Exoplanet {
  name: string;
  planet_type: PlanetType;
  radius: number;
  mass: number;
  // ... all 72 fields
  habitability_score: number;
  is_earth_like: boolean;
}
```

### Filtering

```typescript
// Filter for habitable planets
const habitable = planets.filter(p => p.is_habitable_zone);

// Filter by radius
const earths = planets.filter(p => p.radius >= 0.8 && p.radius <= 1.5);

// Filter by temperature
const temperate = planets.filter(p => p.equilibrium_temperature > 250 && p.equilibrium_temperature < 350);
```

## See Also

- [NASA Data Fetching](data-nasa-fetching.md) - Data source
- [Data Processing Pipeline](data-processing-pipeline.md) - How CSV is created
- [DataService API](api-data-service.md) - How data is loaded and queried
- [Habitability Dashboard](feature-habitability-dashboard.md) - Data usage in UI
