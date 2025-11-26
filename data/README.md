# Exoplanet Data Pipeline

Data processing pipeline for NASA's Exoplanet Archive. Downloads confirmed exoplanet data, extracts essential columns, and adds derived fields for visualization.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Download raw data from NASA
python fetch_exoplanets.py

# Process and export clean dataset
python process_exoplanets.py
```

## Data Source

Data comes from NASA's Exoplanet Archive TAP service:
- **Table**: `pscomppars` (Planetary Systems Composite Parameters)
- **URL**: https://exoplanetarchive.ipac.caltech.edu
- **Content**: One row per confirmed exoplanet with composite "best" parameters

## Output

| File | Description | Size |
|------|-------------|------|
| `raw/exoplanets_raw.csv` | Full NASA dataset (683 columns) | ~73 MB |
| `out/exoplanets.csv` | Processed dataset (72 columns) | ~3.6 MB |

## Column Reference

### Planet Identification
| Column | Description |
|--------|-------------|
| `pl_name` | Planet name (e.g., "Kepler-452 b") |
| `pl_letter` | Planet letter (b, c, d...) |
| `hostname` | Host star name |

### Planet Physical Properties
| Column | Description |
|--------|-------------|
| `pl_rade` | Planet radius [Earth radii] |
| `pl_radj` | Planet radius [Jupiter radii] |
| `pl_bmasse` | Planet mass [Earth masses] - best estimate |
| `pl_bmassj` | Planet mass [Jupiter masses] - best estimate |
| `pl_bmassprov` | Mass provenance (measured / M-R relationship) |
| `pl_dens` | Planet density [g/cm³] |
| `pl_eqt` | Equilibrium temperature [K] |
| `pl_insol` | Insolation flux [Earth flux] |

### Orbital Properties
| Column | Description |
|--------|-------------|
| `pl_orbper` | Orbital period [days] |
| `pl_orbsmax` | Semi-major axis [AU] |
| `pl_orbeccen` | Orbital eccentricity |
| `pl_orbincl` | Orbital inclination [deg] |

### Transit Properties
| Column | Description |
|--------|-------------|
| `pl_trandep` | Transit depth [%] |
| `pl_trandur` | Transit duration [hours] |
| `pl_ratror` | Planet/star radius ratio |
| `pl_ratdor` | Semi-major axis / stellar radius |
| `pl_imppar` | Impact parameter |

### Discovery Info
| Column | Description |
|--------|-------------|
| `disc_year` | Discovery year |
| `discoverymethod` | Discovery method (Transit, Radial Velocity, etc.) |
| `disc_facility` | Discovery facility |
| `disc_telescope` | Discovery telescope |

### Stellar Properties
| Column | Description |
|--------|-------------|
| `st_teff` | Effective temperature [K] |
| `st_rad` | Stellar radius [Solar radii] |
| `st_mass` | Stellar mass [Solar masses] |
| `st_lum` | Luminosity [log Solar] |
| `st_logg` | Surface gravity [log g] |
| `st_age` | Age [Gyr] |
| `st_dens` | Density [g/cm³] |
| `st_met` | Metallicity [dex] |
| `st_rotp` | Rotation period [days] |
| `st_spectype` | Spectral type (e.g., "G2V") |

### System Properties
| Column | Description |
|--------|-------------|
| `sy_snum` | Number of stars |
| `sy_pnum` | Number of planets |
| `sy_mnum` | Number of moons |
| `sy_dist` | Distance [parsecs] |

### Coordinates
| Column | Description |
|--------|-------------|
| `ra`, `dec` | Right ascension / Declination [deg] |
| `rastr`, `decstr` | RA / Dec [sexagesimal] |
| `glat`, `glon` | Galactic latitude / longitude [deg] |
| `x`, `y`, `z` | Heliocentric unit vectors |

### Flags
| Column | Description |
|--------|-------------|
| `cb_flag` | Circumbinary planet (orbits 2 stars) |
| `pl_controv_flag` | Controversial planet |
| `tran_flag` | Detected via transit |
| `rv_flag` | Detected via radial velocity |
| `ttv_flag` | Transit timing variations |

### Magnitudes
| Column | Description |
|--------|-------------|
| `sy_vmag` | V-band (visible) magnitude |
| `sy_kmag` | K-band (infrared) magnitude |
| `sy_gaiamag` | Gaia magnitude |
| `sy_tmag` | TESS magnitude |

### IDs
| Column | Description |
|--------|-------------|
| `tic_id` | TESS Input Catalog ID |
| `gaia_dr3_id` | Gaia DR3 ID |

---

## Derived Fields

Fields computed by `process_exoplanets.py`:

### Classifications
| Column | Description | Values |
|--------|-------------|--------|
| `star_class` | Stellar class | O, B, A, F, G, K, M, L, T |
| `planet_type` | Size category | Sub-Earth, Earth-sized, Super-Earth, Sub-Neptune, Neptune-like, Gas Giant |
| `planet_subtype` | Detailed type | Rocky, Lava World, Hot Jupiter, Ice Giant, Mini-Neptune, etc. |

### Habitability
| Column | Description |
|--------|-------------|
| `habitability_score` | 0-100 score based on temperature, size, star type, insolation |
| `is_habitable_zone` | Boolean: equilibrium temp 200-320K |
| `is_earth_like` | Boolean: radius 0.8-1.25 Earth radii |

### Human-Readable Displays
| Column | Description | Example |
|--------|-------------|---------|
| `distance_display` | Distance string | "4.2 light-years" |
| `period_display` | Orbital period | "1.0 days", "11.2 years" |
| `mass_display` | Mass string | "1.5 Earth masses" |
| `radius_display` | Radius string | "1.02 Earth radii" |
| `distance_ly` | Distance [light-years] | 4.24 |

### 3D Positions
| Column | Description |
|--------|-------------|
| `x_pc`, `y_pc`, `z_pc` | 3D position in parsecs (for galaxy mapping) |

---

## Data Highlights

| Metric | Count |
|--------|-------|
| Total confirmed exoplanets | 6,052 |
| Unique host stars | 4,516 |
| Habitable zone candidates | 158 |
| Earth-sized planets | 500 |
| Circumbinary planets | 53 |
| Closest exoplanet | Proxima Cen b (1.3 pc) |

### Discovery Methods
| Method | Count |
|--------|-------|
| Transit | 4,464 |
| Radial Velocity | 1,158 |
| Microlensing | 262 |
| Imaging | 87 |
| Transit Timing Variations | 39 |

### Planet Types
| Type | Count |
|------|-------|
| Sub-Neptune | 1,972 |
| Gas Giant | 1,743 |
| Super-Earth | 1,175 |
| Neptune-like | 567 |
| Earth-sized | 342 |
| Sub-Earth | 228 |

---

## Habitability Score

The habitability score (0-100) is calculated from:

| Factor | Max Points | Criteria |
|--------|------------|----------|
| Temperature | 40 | Ideal: 200-320K (Earth ~255K) |
| Size | 30 | Ideal: 0.8-1.5 Earth radii |
| Star type | 20 | G=20, K=18, F=15, M=12 |
| Insolation | 10 | Ideal: 0.5-2.0 Earth flux |

### Top Candidates
| Planet | Score | Temp (K) | Radius (R⊕) | Distance |
|--------|-------|----------|-------------|----------|
| Wolf 1069 b | 90.4 | 250 | 1.08 | 31 ly |
| TOI-700 d | 87.4 | 269 | 1.07 | 102 ly |
| Kepler-452 b | 86.7 | 265 | 1.63 | 1,800 ly |
| LP 890-9 c | 86.3 | 272 | 1.37 | 106 ly |
| Teegarden's Star b | 84.7 | 277 | 1.05 | 12.5 ly |

---

## License

Data from NASA Exoplanet Archive is public domain.

Pipeline code is part of the Exoplanets Review project.
