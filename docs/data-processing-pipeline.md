# Data Processing Pipeline

## Overview

The `process_exoplanets.py` script transforms NASA's raw 683-column dataset into a streamlined 72-column CSV optimized for the web application. This process includes data validation, selection of key columns, and computation of derived fields.

**Location**: `data/process_exoplanets.py`

**Input**: `exoplanets_raw.csv` (683 columns, 5-6 MB)
**Output**: `exoplanets.csv` (72 columns, 1-2 MB) → `public/data/exoplanets.csv`

## Processing Goals

1. **Column Reduction**: 683 → 72 most useful columns
2. **Data Cleaning**: Handle missing values, validate ranges
3. **Derived Fields**: Compute habitability, planet type, orbital stability
4. **Type Consistency**: Ensure numeric types, proper string formats
5. **Optimization**: Reduce file size for web delivery

## Processing Pipeline

```
exoplanets_raw.csv (from NASA)
  ↓
1. Load with pandas, handle missing values
  ↓
2. Select key columns (astronomy + discovery)
  ↓
3. Compute derived fields:
   - Planet type classification
   - Habitability score
   - Habitability zone membership
   - Earth-like classification
   - Tidal locking prediction
  ↓
4. Validate data ranges
  ↓
5. Format and export to CSV
  ↓
6. Copy to public/data/exoplanets.csv
  ↓
exoplanets.csv (final output)
```

## Column Selection

### Kept Columns (~35 core columns)

**Planet Properties** (14):
- `pl_name` - Planet name
- `pl_type` - Type (Earth-sized, Gas Giant, etc.)
- `pl_radius` - Radius in Earth radii
- `pl_mass` - Mass in Earth masses
- `pl_density` - Density in g/cm³
- `pl_gravity` - Surface gravity in m/s²
- `pl_eqt` - Equilibrium temperature
- `pl_orbper` - Orbital period (days)
- `pl_smaxis` - Semi-major axis (AU)
- `pl_eccen` - Eccentricity (0-1)
- `pl_incl` - Orbital inclination
- `pl_trandep` - Transit depth (for transit method)
- `pl_rvampl` - RV amplitude (for RV method)
- `pl_age` - Planet age (if known)

**Host Star Properties** (11):
- `st_name` - Host star name
- `st_class` - Spectral class (G, K, M, etc.)
- `st_radius` - Radius in solar radii
- `st_mass` - Mass in solar masses
- `st_teff` - Effective temperature (K)
- `st_dist` - Distance in parsecs
- `st_lum` - Luminosity in solar luminosities
- `st_age` - Age in Gyr (if known)
- `st_rotper` - Rotation period (days)
- `st_rvel` - Radial velocity (m/s)
- `st_radvel_err` - RV measurement error

**Discovery Info** (9):
- `discoverymethod` - Detection method (Transit, RV, etc.)
- `discoveryyear` - Year of discovery
- `releasedate` - First public announcement
- `rowupdate` - Last update date
- `publicationstatus` - Published status
- `pubdate` - Publication date
- `journal` - Publication journal
- `authors` - First author name
- `disposition` - Disposition code

**Computed Flags** (4 derived):
- `is_earth_like` - Boolean
- `is_habitable_zone` - Boolean
- `is_likely_tidally_locked` - Boolean
- `habitability_score` - Float (0-1)

### Dropped Columns

Removed columns:
- Duplicate/redundant information
- Highly sparse data (>80% missing)
- Obsolete measurements
- Proprietary codes
- QA/QC flags not needed for viz
- Ultra-specific astrophysics columns

## Derived Fields Computation

### 1. Planet Type Classification

**Logic**:
```
if radius < 1.25 R⊕:
  if mass < 5 M⊕:
    type = "Earth-sized"
  else:
    type = "Super-Earth"
elif radius < 2.0 R⊕:
  type = "Sub-Neptune"
elif radius < 6.0 R⊕:
  type = "Neptune-like"
elif radius < 15.0 R⊕:
  type = "Sub-Jupiter"
else:
  type = "Gas Giant"

Special cases:
  if temperature > 1000 K AND type = "Gas Giant":
    type = "Hot Jupiter"
  if temperature < 150 K:
    type = "Ice Giant"
  if habitable_zone AND Earth-sized:
    type remains "Earth-sized" (preferred name)
```

**Data Used**:
- `pl_radius` - Planet radius
- `pl_mass` - Planet mass
- `pl_eqt` - Equilibrium temperature

**Output**: Categorical field with 10 types

### 2. Habitability Score

**Formula** (weighted combination):
```
score = w_temp * temp_match +
        w_size * size_match +
        w_star * star_stability +
        w_orbit * orbit_stability

Where:
  w_temp = 0.40 (40% weight)
  w_size = 0.30 (30% weight)
  w_star = 0.20 (20% weight)
  w_orbit = 0.10 (10% weight)
```

**Component Calculations**:

| Component | Formula | Optimal | Max Score |
|-----------|---------|---------|-----------|
| Temp Match | gaussian(temp, 288K, 50K) | 288 K (Earth) | 1.0 |
| Size Match | gaussian(radius, 1.0 R⊕, 0.2) | 1.0 R⊕ | 1.0 |
| Star Stability | based on star class + age | G/K class, 5+ Gyr | 1.0 |
| Orbit Stability | based on eccentricity + tidal lock | Low ecc, not locked | 1.0 |

**Example**:
```
Kepler-452 b:
  temp_match = 0.95 (close to Earth temp)
  size_match = 0.98 (very close to Earth size)
  star_stability = 0.90 (G-class star, 5.1 Gyr old)
  orbit_stability = 0.98 (nearly circular, not locked)

  score = 0.40*0.95 + 0.30*0.98 + 0.20*0.90 + 0.10*0.98
        = 0.38 + 0.294 + 0.18 + 0.098
        = 0.752 (75.2%)
```

**Output**: Float 0.0-1.0

### 3. Habitable Zone Membership

**Logic**:
```
For each planet:
  1. Get star temperature and radius
  2. Calculate stellar flux at planet orbit
  3. Determine habitable zone inner/outer boundaries
  4. Check if planet's orbital distance is within HZ

Habitable Zone Formula:
  HZ_inner = sqrt(L_star / 1.37) AU
  HZ_outer = sqrt(L_star / 0.32) AU

Where L_star = (T_star / 5778 K)^2 * (R_star / 1 R☉)^2
```

**Conservative vs Optimistic**:
- Conservative: Stricter temperature range (0-100°C, 273-373 K)
- Optimistic: Broader range (−50 to +50°C, 223-323 K)
- This implementation uses **conservative** estimates

**Output**: Boolean (true/false)

### 4. Earth-Like Classification

**Definition**:
```
is_earth_like = (
  is_habitable_zone AND
  planet_type = "Earth-sized"
)
```

**Meaning**: Planet in habitable zone AND Earth-sized, potentially habitable

**Output**: Boolean (true/false)

### 5. Tidal Locking Prediction

**Logic**:
```
Tidal locking likely if:
  orbital_period < critical_period AND
  eccentricity < 0.2

Critical period (rough approximation):
  P_crit = f(star_mass, star_radius, planet_mass, planet_radius)

Simplified heuristic:
  if orbital_period < 3 days:
    likely tidally locked
  else if orbital_period < 10 days AND star_class = "M":
    likely tidally locked
  else:
    not tidally locked
```

**Physical Basis**: Planets close to low-mass stars experience tidal forces that synchronize rotation to orbit (one day = one year)

**Output**: Boolean (true/false)

## Data Validation

### Range Checks

After computation, validate all numeric fields:

| Field | Valid Range | Action if Invalid |
|-------|-------------|------------------|
| `pl_radius` | 0.1 to 1000 R⊕ | Set to null |
| `pl_mass` | 0.001 to 10000 M⊕ | Set to null |
| `pl_eqt` | 10 to 3000 K | Set to null |
| `pl_orbper` | 0.1 to 1,000,000 days | Set to null |
| `st_teff` | 2000 to 50000 K | Set to null |
| `st_dist` | 1 to 100,000 pc | Set to null |

### String Cleaning

- Trim whitespace
- Normalize special characters
- Ensure UTF-8 encoding
- Handle accented characters (e.g., "TRAPPIST-1" for proper display)

### Consistency Checks

- Verify star properties make physical sense
- Check planet properties consistent with star (e.g., hot planet around cool star is rare)
- Flag outliers for manual review

## Missing Value Handling

### Strategy

```
For key fields (planet type, discovery method):
  → Drop row if missing (can't classify)

For secondary fields (star age, density):
  → Keep row, leave field blank in CSV

For computed fields:
  → Use available data, handle nulls gracefully
  → If temp unknown, can't compute habitability (leave null)
  → If orbital period unknown, can't compute tidal locking
```

### Handling by Field Type

| Field | >50% Missing | <50% Missing | <10% Missing |
|-------|-------------|-------------|-------------|
| Star age | Drop column | Keep, allow null | Keep |
| Planet mass | Keep, allow null | Keep | Keep |
| Planet radius | Keep only if also have | Keep | Keep |
| Discovery method | Drop if missing | Drop row | Keep |

## Running the Script

### Command

```bash
cd data
python process_exoplanets.py
```

### Expected Output

```
Loading NASA exoplanet data...
Loaded 6,847 rows from exoplanets_raw.csv

Selecting key columns (35 core)...
Computing derived fields...
  - Planet types: 10 categories identified
  - Habitability scores: 6,847 computed
  - Habitable zone: 843 planets in HZ
  - Earth-like: 127 candidates
  - Tidal locking: 1,204 likely locked

Validating data...
  - Range checks: passed
  - String cleaning: 12 corrections made
  - Consistency checks: 5 warnings logged

Exporting to CSV...
File saved: exoplanets.csv (1.2 MB, 72 columns, 6,847 rows)
Copying to public/data/exoplanets.csv...

Success!
```

## Output File Format

### CSV Structure

```csv
pl_name,pl_type,pl_radius,pl_mass,pl_density,...,is_earth_like,habitability_score
"Kepler-452 b","Earth-sized",1.04,5.0,5.5,...,true,0.752
"51 Pegasi b","Gas Giant",1.95,0.467,0.14,...,false,0.012
...
```

### Deployment

The final `exoplanets.csv` is:
- Copied to `public/data/exoplanets.csv`
- Bundled with the app for download
- Loaded at app startup by `DataService`
- Never re-downloaded (static data in repo)

## Performance Considerations

- **Processing Time**: ~5-10 seconds for full dataset
- **Memory Usage**: ~500 MB during processing (pandas in-memory)
- **Output Size**: ~1.2 MB (compressed, gzip: ~300 KB)
- **CSV Parsing**: App loads in ~200ms at startup

## Extending the Pipeline

### Adding New Derived Fields

1. **Identify what to compute** (e.g., "discovery period")
2. **Write calculation function** using MATH_CONSTANTS
3. **Add to column selection** in process script
4. **Update CSV schema** in TypeScript types
5. **Update app to use** new field

### Example: Adding "Discovery Era"

```python
def classify_discovery_era(year):
    if year < 2000:
        return "Pre-Kepler"
    elif year < 2010:
        return "Early Kepler"
    elif year < 2020:
        return "Kepler Era"
    else:
        return "Modern Era"

df['discovery_era'] = df['discoveryyear'].apply(classify_discovery_era)
```

## See Also

- [NASA Data Fetching](data-nasa-fetching.md) - Data source and download
- [CSV Structure & Fields](data-csv-structure.md) - Final columns reference
- [System Architecture Overview](architecture-system-overview.md) - Data pipeline integration
- [DataService API](api-data-service.md) - How data is loaded in app
