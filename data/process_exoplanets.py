"""
Exoplanet Data Processing Pipeline
Extracts essential columns, adds derived fields, exports clean dataset

Run: python process_exoplanets.py
"""

from pathlib import Path

import numpy as np
import pandas as pd

RAW_DIR = Path(__file__).parent / "raw"
OUT_DIR = Path(__file__).parent / "out"

# =============================================================================
# COLUMN DEFINITIONS
# =============================================================================

ESSENTIAL_COLUMNS = [
    # Planet identification
    "pl_name",
    "pl_letter",
    "hostname",
    # Planet physical properties
    "pl_rade",
    "pl_radj",
    "pl_bmasse",
    "pl_bmassj",
    "pl_bmassprov",
    "pl_dens",
    "pl_eqt",
    "pl_insol",
    # Orbital properties
    "pl_orbper",
    "pl_orbsmax",
    "pl_orbeccen",
    "pl_orbincl",
    # Transit properties
    "pl_trandep",
    "pl_trandur",
    "pl_ratror",
    "pl_ratdor",
    "pl_imppar",
    # Discovery info
    "disc_year",
    "discoverymethod",
    "disc_facility",
    "disc_telescope",
    # Star properties
    "st_teff",
    "st_rad",
    "st_mass",
    "st_lum",
    "st_logg",
    "st_age",
    "st_dens",
    "st_met",
    "st_rotp",
    "st_spectype",
    # System properties
    "sy_snum",
    "sy_pnum",
    "sy_mnum",
    "sy_dist",
    # Coordinates
    "ra",
    "dec",
    "rastr",
    "decstr",
    "glat",
    "glon",
    "x",
    "y",
    "z",
    # Flags
    "cb_flag",
    "pl_controv_flag",
    "tran_flag",
    "rv_flag",
    "ttv_flag",
    # Magnitudes
    "sy_vmag",
    "sy_kmag",
    "sy_gaiamag",
    "sy_tmag",
    # IDs
    "tic_id",
    "gaia_dr3_id",
    # Radial Velocity properties
    "pl_rvamp",      # RV semi-amplitude (m/s)
    "st_radv",       # Stellar radial velocity (km/s)
    "st_vsin",       # Stellar rotation velocity (km/s)
]


# =============================================================================
# DERIVED FIELD FUNCTIONS
# =============================================================================


def classify_planet_type(row):
    """
    Classify planet type based on radius (Earth radii).
    Based on NASA's classification scheme.
    """
    radius = row["pl_rade"]
    if pd.isna(radius):
        return None

    if radius < 1.0:
        return "Sub-Earth"
    elif radius < 1.25:
        return "Earth-sized"
    elif radius < 2.0:
        return "Super-Earth"
    elif radius < 4.0:
        return "Sub-Neptune"
    elif radius < 10.0:
        return "Neptune-like"
    else:
        return "Gas Giant"


def classify_planet_subtype(row):
    """
    More detailed classification using mass, radius, and temperature.
    """
    radius = row["pl_rade"]
    mass = row["pl_bmasse"]
    temp = row["pl_eqt"]

    if pd.isna(radius):
        return None

    # Hot planets (equilibrium temp > 1000K)
    if pd.notna(temp) and temp > 1000:
        if radius > 10:
            return "Hot Jupiter"
        elif radius > 4:
            return "Hot Neptune"
        else:
            return "Lava World"

    # Frozen rocky worlds (temp < 220K and small radius)
    # These are Europa/Enceladus-like or cold super-Earths like TRAPPIST-1 f
    if pd.notna(temp) and temp < 220 and radius < 2.0:
        return "Ice World"

    # Cold/temperate planets
    if radius < 1.25:
        return "Rocky"
    elif radius < 2.0:
        if pd.notna(mass) and mass > 5:
            return "Dense Super-Earth"
        return "Super-Earth"
    elif radius < 4.0:
        return "Mini-Neptune"
    elif radius < 10.0:
        return "Ice Giant"
    else:
        if pd.notna(mass) and mass > 4000:  # > ~13 Jupiter masses
            return "Brown Dwarf Candidate"
        return "Jovian"


def get_star_class_from_spectype(spectype):
    """
    Extract stellar class (O, B, A, F, G, K, M) from spectral type string.
    
    Args:
        spectype: Spectral type string (e.g., "M8V", "G2V", "K5")
        
    Returns:
        Single character stellar class or None
    """
    if pd.isna(spectype):
        return None

    spectype = str(spectype).strip().upper()
    if len(spectype) == 0:
        return None

    # Get first letter, which is the main class
    first = spectype[0]
    if first in ["O", "B", "A", "F", "G", "K", "M", "L", "T", "Y"]:
        return first
    return None


def get_star_class_from_temp(temperature):
    """
    Infer stellar class from effective temperature.
    Used as a fallback when spectral type is not available.
    
    Temperature ranges based on standard stellar classification:
    - O: >= 30,000 K (hot blue stars)
    - B: 10,000 - 30,000 K (blue-white stars)  
    - A: 7,500 - 10,000 K (white stars)
    - F: 6,000 - 7,500 K (yellow-white stars)
    - G: 5,200 - 6,000 K (yellow stars like the Sun)
    - K: 3,700 - 5,200 K (orange stars)
    - M: 2,400 - 3,700 K (red dwarfs)
    - L: 1,300 - 2,400 K (brown dwarfs)
    - T: 550 - 1,300 K (cool brown dwarfs)
    - Y: < 550 K (very cool brown dwarfs)
    
    Args:
        temperature: Effective temperature in Kelvin
        
    Returns:
        Single character stellar class or None
    """
    if pd.isna(temperature):
        return None
    
    temp = float(temperature)
    
    if temp >= 30000:
        return "O"
    elif temp >= 10000:
        return "B"
    elif temp >= 7500:
        return "A"
    elif temp >= 6000:
        return "F"
    elif temp >= 5200:
        return "G"
    elif temp >= 3700:
        return "K"
    elif temp >= 2400:
        return "M"
    elif temp >= 1300:
        return "L"
    elif temp >= 550:
        return "T"
    else:
        return "Y"


def get_star_class(row):
    """
    Determine stellar class from spectral type or temperature.
    Prefers spectral type if available, falls back to temperature.
    
    Args:
        row: DataFrame row with st_spectype and st_teff columns
        
    Returns:
        Single character stellar class or None
    """
    # First try spectral type
    spectype_class = get_star_class_from_spectype(row.get("st_spectype"))
    if spectype_class:
        return spectype_class
    
    # Fall back to temperature
    return get_star_class_from_temp(row.get("st_teff"))


def calculate_habitability_score(row):
    """
    Calculate a simple habitability score (0-100) based on:
    - Equilibrium temperature (ideal: 200-320K, Earth is ~255K)
    - Planet size (ideal: 0.5-2.0 Earth radii)
    - Star type (ideal: G, K, M dwarfs)

    Hard constraints:
    - Temperature must be between 100K and 500K (extreme bounds for any life)
    - If outside this range, score is 0
    """
    score = 0

    # Hard temperature constraint - disqualify extreme cases
    temp = row["pl_eqt"]
    if pd.notna(temp):
        if temp < 100 or temp > 500:
            return 0  # Too hot or too cold for any habitability consideration

    # Temperature score (max 40 points)
    if pd.notna(temp):
        if 200 <= temp <= 320:
            # Perfect range
            score += 40 - abs(temp - 255) / 3  # Peak at Earth's temp
        elif 180 <= temp < 200 or 320 < temp <= 350:
            score += 20
        elif 150 <= temp < 180 or 350 < temp <= 400:
            score += 10

    # Size score (max 30 points)
    radius = row["pl_rade"]
    if pd.notna(radius):
        if 0.8 <= radius <= 1.5:
            score += 30
        elif 0.5 <= radius < 0.8 or 1.5 < radius <= 2.0:
            score += 20
        elif 2.0 < radius <= 3.0:
            score += 10

    # Star type score (max 20 points)
    star_class = row.get("star_class")
    if pd.notna(star_class):
        star_scores = {"G": 20, "K": 18, "F": 15, "M": 12, "A": 5}
        score += star_scores.get(star_class, 0)

    # Bonus: Insolation close to Earth (max 10 points)
    insol = row["pl_insol"]
    if pd.notna(insol):
        if 0.5 <= insol <= 2.0:
            score += 10
        elif 0.25 <= insol < 0.5 or 2.0 < insol <= 4.0:
            score += 5

    return round(score, 1)


def format_distance(parsecs):
    """Convert parsecs to human-readable distance string."""
    if pd.isna(parsecs):
        return None

    light_years = parsecs * 3.26156
    if light_years < 100:
        return f"{light_years:.1f} light-years"
    elif light_years < 1000:
        return f"{light_years:.0f} light-years"
    else:
        return f"{light_years / 1000:.1f}k light-years"


def format_period(days):
    """Convert orbital period in days to human-readable string."""
    if pd.isna(days):
        return None

    if days < 1:
        hours = days * 24
        return f"{hours:.1f} hours"
    elif days < 30:
        return f"{days:.1f} days"
    elif days < 365:
        return f"{days / 30:.1f} months"
    else:
        years = days / 365.25
        return f"{years:.1f} years"


def format_mass(earth_masses):
    """Convert Earth masses to human-readable string."""
    if pd.isna(earth_masses):
        return None

    if earth_masses < 0.1:
        return f"{earth_masses:.3f} Earth masses"
    elif earth_masses < 10:
        return f"{earth_masses:.1f} Earth masses"
    elif earth_masses < 318:  # Jupiter mass in Earth masses
        return f"{earth_masses:.0f} Earth masses"
    else:
        jupiter_masses = earth_masses / 317.8
        return f"{jupiter_masses:.1f} Jupiter masses"


def format_radius(earth_radii):
    """Convert Earth radii to human-readable string."""
    if pd.isna(earth_radii):
        return None

    if earth_radii < 2:
        return f"{earth_radii:.2f} Earth radii"
    elif earth_radii < 11.2:  # Jupiter radius in Earth radii
        return f"{earth_radii:.1f} Earth radii"
    else:
        jupiter_radii = earth_radii / 11.2
        return f"{jupiter_radii:.1f} Jupiter radii"


def calculate_3d_position(row):
    """
    Calculate actual 3D position in parsecs from unit vector and distance.
    Returns (x_pc, y_pc, z_pc) tuple.
    """
    dist = row["sy_dist"]
    if pd.isna(dist):
        return (None, None, None)

    x = row["x"] * dist if pd.notna(row["x"]) else None
    y = row["y"] * dist if pd.notna(row["y"]) else None
    z = row["z"] * dist if pd.notna(row["z"]) else None

    return (x, y, z)


# =============================================================================
# MAIN PROCESSING
# =============================================================================


def load_raw_data():
    """Load raw data from CSV."""
    csv_file = RAW_DIR / "exoplanets_raw.csv"
    if not csv_file.exists():
        raise FileNotFoundError(
            f"Raw data not found at {csv_file}. Run fetch_exoplanets.py first."
        )

    print(f"Loading raw data from {csv_file}...")
    df = pd.read_csv(csv_file, low_memory=False)
    print(f"Loaded {len(df):,} rows")
    return df


def extract_columns(df):
    """Extract only essential columns."""
    print(f"\nExtracting {len(ESSENTIAL_COLUMNS)} essential columns...")

    # Check which columns exist
    available = [col for col in ESSENTIAL_COLUMNS if col in df.columns]
    missing = [col for col in ESSENTIAL_COLUMNS if col not in df.columns]

    if missing:
        print(f"Warning: Missing columns: {missing}")

    return df[available].copy()


def add_derived_fields(df):
    """Add all derived fields."""
    print("\nAdding derived fields...")

    # Star class (from spectral type, with temperature fallback)
    print("  - star_class")
    df["star_class"] = df.apply(get_star_class, axis=1)

    # Planet classifications
    print("  - planet_type")
    df["planet_type"] = df.apply(classify_planet_type, axis=1)

    print("  - planet_subtype")
    df["planet_subtype"] = df.apply(classify_planet_subtype, axis=1)

    # Habitability score
    print("  - habitability_score")
    df["habitability_score"] = df.apply(calculate_habitability_score, axis=1)

    # Human-readable displays
    print("  - display fields (distance, period, mass, radius)")
    df["distance_display"] = df["sy_dist"].apply(format_distance)
    df["period_display"] = df["pl_orbper"].apply(format_period)
    df["mass_display"] = df["pl_bmasse"].apply(format_mass)
    df["radius_display"] = df["pl_rade"].apply(format_radius)

    # 3D positions in parsecs
    print("  - 3D positions (x_pc, y_pc, z_pc)")
    positions = df.apply(calculate_3d_position, axis=1)
    df["x_pc"] = positions.apply(lambda p: p[0])
    df["y_pc"] = positions.apply(lambda p: p[1])
    df["z_pc"] = positions.apply(lambda p: p[2])

    # Distance in light years
    print("  - distance_ly")
    df["distance_ly"] = df["sy_dist"] * 3.26156

    # Is in habitable zone flag
    print("  - is_habitable_zone")
    df["is_habitable_zone"] = (df["pl_eqt"] >= 200) & (df["pl_eqt"] <= 320)

    # Is Earth-like flag
    print("  - is_earth_like")
    df["is_earth_like"] = (df["pl_rade"] >= 0.8) & (df["pl_rade"] <= 1.25)

    # =========================================================================
    # ORBITAL CHARACTERISTICS
    # =========================================================================
    print("  - orbital characteristics")

    # Ultra-short period: < 1 day (extreme worlds, likely tidally locked)
    df["is_ultra_short_period"] = df["pl_orbper"] < 1.0

    # Short period: < 10 days
    df["is_short_period"] = df["pl_orbper"] < 10.0

    # Long period: > 1000 days (outer system analogs)
    df["is_long_period"] = df["pl_orbper"] > 1000.0

    # Eccentric orbit: e > 0.3 (wild temperature swings)
    df["is_eccentric_orbit"] = df["pl_orbeccen"] > 0.3

    # Circular orbit: e < 0.05 (stable, Earth-like)
    df["is_circular_orbit"] = df["pl_orbeccen"] < 0.05

    # Likely tidally locked: short period + close orbit (permanent day/night)
    df["is_likely_tidally_locked"] = (df["pl_orbper"] < 10.0) & (df["pl_orbsmax"] < 0.1)

    # =========================================================================
    # SYSTEM ARCHITECTURE
    # =========================================================================
    print("  - system architecture")

    # Multi-planet system
    df["is_multi_planet_system"] = df["sy_pnum"] > 1

    # Rich system: 4+ planets
    df["is_rich_system"] = df["sy_pnum"] >= 4

    # Only known planet in system
    df["is_only_known_planet"] = df["sy_pnum"] == 1

    # Circumbinary: orbits two stars ("Tatooine" planets)
    df["is_circumbinary"] = df["cb_flag"] == 1

    # Multi-star system
    df["is_multi_star_system"] = df["sy_snum"] > 1

    # =========================================================================
    # PROXIMITY & OBSERVABILITY
    # =========================================================================
    print("  - proximity & observability")

    # Nearby: < 50 parsecs (~163 light-years) - best for detailed study
    df["is_nearby"] = df["sy_dist"] < 50

    # Very nearby: < 20 parsecs (~65 light-years) - prime targets
    df["is_very_nearby"] = df["sy_dist"] < 20

    # Transiting: can observe atmosphere during transit
    # Check both the flag AND actual transit data (depth + period)
    df["is_transiting"] = (df["tran_flag"] == 1) | (
        (df["pl_trandep"].notna()) & (df["pl_orbper"].notna())
    )

    # Has radial velocity data - check both flag AND actual RV amplitude value
    df["has_rv_data"] = (df["rv_flag"] == 1) & (df["pl_rvamp"].notna())

    # Has transit timing variations (indicates gravitational interactions)
    df["has_ttv"] = df["ttv_flag"] == 1

    # Controversial: flagged as controversial in NASA database
    df["is_controversial"] = df["pl_controv_flag"] == 1

    # =========================================================================
    # STELLAR ENVIRONMENT
    # =========================================================================
    print("  - stellar environment")

    # Solar analog: G-type star with similar mass to Sun
    df["is_solar_analog"] = (df["star_class"] == "G") & (
        (df["st_mass"] >= 0.8) & (df["st_mass"] <= 1.2)
    )

    # Sun-like star (broader): F, G, or K type
    df["is_sun_like_star"] = df["star_class"].isin(["F", "G", "K"])

    # Red dwarf host: M-type star
    df["is_red_dwarf_host"] = df["star_class"] == "M"

    # Young system: < 1 billion years (planets still evolving)
    df["is_young_system"] = df["st_age"] < 1.0

    # Mature system: 1-8 billion years (like our solar system)
    df["is_mature_system"] = (df["st_age"] >= 1.0) & (df["st_age"] <= 8.0)

    # Ancient system: > 10 billion years (time for complex life?)
    df["is_ancient_system"] = df["st_age"] > 10.0

    # Metal-rich star: higher chance of rocky planets
    df["is_metal_rich_star"] = df["st_met"] > 0.1

    # Metal-poor star: may have different planet formation
    df["is_metal_poor_star"] = df["st_met"] < -0.3

    # =========================================================================
    # EXTREME WORLDS
    # =========================================================================
    print("  - extreme worlds")

    # Hot Jupiter: gas giant with very high temperature
    df["is_hot_jupiter"] = (df["planet_type"] == "Gas Giant") & (df["pl_eqt"] > 1000)

    # Hot Neptune: Neptune-sized with high temperature
    df["is_hot_neptune"] = (df["planet_type"].isin(["Neptune-like", "Sub-Neptune"])) & (
        df["pl_eqt"] > 800
    )

    # Ultra-hot: equilibrium temp > 2000K
    df["is_ultra_hot"] = df["pl_eqt"] > 2000

    # Frozen world: very cold (outer system)
    df["is_frozen_world"] = df["pl_eqt"] < 150

    # Ultra-dense: density > 8 g/cm³ (iron-rich, Mercury-like)
    df["is_ultra_dense"] = df["pl_dens"] > 8.0

    # Puffy: density < 0.5 g/cm³ (inflated atmosphere)
    df["is_puffy"] = df["pl_dens"] < 0.5

    # Super-massive: > 10 Jupiter masses (brown dwarf boundary)
    df["is_super_massive"] = df["pl_bmassj"] > 10.0

    # Lightweight: < 0.5 Earth masses
    df["is_lightweight"] = df["pl_bmasse"] < 0.5

    # =========================================================================
    # HABITABILITY RELATED
    # =========================================================================
    print("  - habitability features")

    # Earth-like insolation: receives similar energy as Earth
    df["has_earth_like_insolation"] = (df["pl_insol"] >= 0.5) & (df["pl_insol"] <= 2.0)

    # Conservative habitable zone: stricter temperature range
    df["is_conservative_habitable"] = (df["pl_eqt"] >= 200) & (df["pl_eqt"] <= 280)

    # Optimistic habitable zone: broader range allowing for greenhouse effects
    df["is_optimistic_habitable"] = (df["pl_eqt"] >= 150) & (df["pl_eqt"] <= 350)

    # Best habitability candidates: combines multiple factors
    df["is_top_habitable_candidate"] = (
        (df["is_habitable_zone"])
        & (df["pl_rade"] <= 2.0)
        & (df["pl_rade"] >= 0.5)
        & (df["is_sun_like_star"] | df["is_red_dwarf_host"])
    )

    # Potentially rocky: size suggests rocky composition
    df["is_potentially_rocky"] = (df["pl_rade"] <= 1.6) & (
        (df["pl_dens"] >= 3.5) | pd.isna(df["pl_dens"])
    )

    # =========================================================================
    # COLOR FACTORS (for procedural shader generation)
    # These normalized values drive physically-based planet appearance
    # =========================================================================
    print("  - color factors (for shaders)")

    # Temperature factor: 0 = cold/blue (50K), 1 = hot/red (2500K)
    # Affects hue: cold planets are blue, hot planets are orange/red
    temp_min, temp_max = 50.0, 2500.0
    df["color_temp_factor"] = df["pl_eqt"].apply(
        lambda t: np.clip((t - temp_min) / (temp_max - temp_min), 0, 1)
        if pd.notna(t) else 0.5
    )

    # Composition factor: 0 = gas (low density), 0.5 = ice, 1 = rock (high density)
    # Affects saturation: rocky planets are more saturated, gas giants are muted
    dens_min, dens_max = 0.3, 8.0  # g/cm³
    df["color_composition_factor"] = df["pl_dens"].apply(
        lambda d: np.clip((d - dens_min) / (dens_max - dens_min), 0, 1)
        if pd.notna(d) else 0.5
    )

    # Irradiation factor: 0 = dim (low flux), 1 = bright (high flux)
    # Affects brightness/value: highly irradiated planets appear brighter
    insol_min, insol_max = 0.01, 10000.0  # Earth flux
    df["color_irradiation_factor"] = df["pl_insol"].apply(
        lambda i: np.clip(
            (np.log10(i) - np.log10(insol_min)) /
            (np.log10(insol_max) - np.log10(insol_min)), 0, 1
        ) if pd.notna(i) and i > 0 else 0.5
    )

    # Metallicity factor: affects planetary composition coloring
    # High metallicity = more minerals = warmer colors
    # Low metallicity = more volatiles = cooler colors
    met_min, met_max = -0.5, 0.5  # [Fe/H] dex
    df["color_metallicity_factor"] = df["st_met"].apply(
        lambda m: np.clip((m - met_min) / (met_max - met_min), 0, 1)
        if pd.notna(m) else 0.5
    )

    return df


def generate_summary(df):
    """Generate summary statistics."""
    print("\n" + "=" * 70)
    print("PROCESSED DATA SUMMARY")
    print("=" * 70)

    print(f"\nTotal planets: {len(df):,}")
    print(f"Total columns: {len(df.columns)}")

    print("\nPlanet types:")
    for ptype, count in df["planet_type"].value_counts().items():
        print(f"  {ptype}: {count:,}")

    print("\nStar classes:")
    for sclass, count in df["star_class"].value_counts().head(8).items():
        print(f"  {sclass}: {count:,}")

    print("\nHabitability:")
    print(f"  Habitable zone: {df['is_habitable_zone'].sum():,}")
    print(f"  Earth-like size: {df['is_earth_like'].sum():,}")
    print(
        f"  Both (best candidates): {((df['is_habitable_zone']) & (df['is_earth_like'])).sum():,}"
    )

    top_hab = df.nlargest(5, "habitability_score")[
        ["pl_name", "habitability_score", "pl_eqt", "pl_rade"]
    ]
    print("\nTop 5 habitability scores:")
    for _, row in top_hab.iterrows():
        print(f"  {row['pl_name']}: {row['habitability_score']:.1f}")


def save_output(df):
    """Save processed data to CSV."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    output_file = OUT_DIR / "exoplanets.csv"
    print(f"\nSaving to {output_file}...")
    df.to_csv(output_file, index=False)

    file_size = output_file.stat().st_size / (1024 * 1024)
    print(f"Saved {file_size:.2f} MB ({len(df):,} rows, {len(df.columns)} columns)")

    return output_file


def main():
    """Main processing pipeline."""
    print("=" * 70)
    print("EXOPLANET DATA PROCESSING PIPELINE")
    print("=" * 70)

    # Load raw data
    df = load_raw_data()

    # Extract essential columns
    df = extract_columns(df)

    # Add derived fields
    df = add_derived_fields(df)

    # Generate summary
    generate_summary(df)

    # Save output
    output_file = save_output(df)

    print("\n✓ Pipeline complete!")
    print(f"  Output: {output_file}")

    return df


if __name__ == "__main__":
    main()
