"""
Exoplanet Data Processing Pipeline
Extracts essential columns, adds derived fields, exports clean dataset

Run: python process_exoplanets.py
"""

import pandas as pd
import numpy as np
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw"
OUT_DIR = Path(__file__).parent / "out"

# =============================================================================
# COLUMN DEFINITIONS
# =============================================================================

ESSENTIAL_COLUMNS = [
    # Planet identification
    "pl_name", "pl_letter", "hostname",
    # Planet physical properties
    "pl_rade", "pl_radj", "pl_bmasse", "pl_bmassj", "pl_bmassprov",
    "pl_dens", "pl_eqt", "pl_insol",
    # Orbital properties
    "pl_orbper", "pl_orbsmax", "pl_orbeccen", "pl_orbincl",
    # Transit properties
    "pl_trandep", "pl_trandur", "pl_ratror", "pl_ratdor", "pl_imppar",
    # Discovery info
    "disc_year", "discoverymethod", "disc_facility", "disc_telescope",
    # Star properties
    "st_teff", "st_rad", "st_mass", "st_lum", "st_logg",
    "st_age", "st_dens", "st_met", "st_rotp", "st_spectype",
    # System properties
    "sy_snum", "sy_pnum", "sy_mnum", "sy_dist",
    # Coordinates
    "ra", "dec", "rastr", "decstr", "glat", "glon", "x", "y", "z",
    # Flags
    "cb_flag", "pl_controv_flag", "tran_flag", "rv_flag", "ttv_flag",
    # Magnitudes
    "sy_vmag", "sy_kmag", "sy_gaiamag", "sy_tmag",
    # IDs
    "tic_id", "gaia_dr3_id",
]


# =============================================================================
# DERIVED FIELD FUNCTIONS
# =============================================================================

def classify_planet_type(row):
    """
    Classify planet type based on radius (Earth radii).
    Based on NASA's classification scheme.
    """
    radius = row['pl_rade']
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
    More detailed classification using mass and radius.
    """
    radius = row['pl_rade']
    mass = row['pl_bmasse']
    temp = row['pl_eqt']

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


def get_star_class(spectype):
    """
    Extract stellar class (O, B, A, F, G, K, M) from spectral type string.
    """
    if pd.isna(spectype):
        return None

    spectype = str(spectype).strip().upper()
    if len(spectype) == 0:
        return None

    # Get first letter, which is the main class
    first = spectype[0]
    if first in ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y']:
        return first
    return None


def calculate_habitability_score(row):
    """
    Calculate a simple habitability score (0-100) based on:
    - Equilibrium temperature (ideal: 200-320K, Earth is ~255K)
    - Planet size (ideal: 0.5-2.0 Earth radii)
    - Star type (ideal: G, K, M dwarfs)
    """
    score = 0

    # Temperature score (max 40 points)
    temp = row['pl_eqt']
    if pd.notna(temp):
        if 200 <= temp <= 320:
            # Perfect range
            score += 40 - abs(temp - 255) / 3  # Peak at Earth's temp
        elif 180 <= temp < 200 or 320 < temp <= 350:
            score += 20
        elif 150 <= temp < 180 or 350 < temp <= 400:
            score += 10

    # Size score (max 30 points)
    radius = row['pl_rade']
    if pd.notna(radius):
        if 0.8 <= radius <= 1.5:
            score += 30
        elif 0.5 <= radius < 0.8 or 1.5 < radius <= 2.0:
            score += 20
        elif 2.0 < radius <= 3.0:
            score += 10

    # Star type score (max 20 points)
    star_class = row.get('star_class')
    if pd.notna(star_class):
        star_scores = {'G': 20, 'K': 18, 'F': 15, 'M': 12, 'A': 5}
        score += star_scores.get(star_class, 0)

    # Bonus: Insolation close to Earth (max 10 points)
    insol = row['pl_insol']
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
        return f"{light_years/1000:.1f}k light-years"


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
        return f"{days/30:.1f} months"
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
    dist = row['sy_dist']
    if pd.isna(dist):
        return (None, None, None)

    x = row['x'] * dist if pd.notna(row['x']) else None
    y = row['y'] * dist if pd.notna(row['y']) else None
    z = row['z'] * dist if pd.notna(row['z']) else None

    return (x, y, z)


# =============================================================================
# MAIN PROCESSING
# =============================================================================

def load_raw_data():
    """Load raw data from CSV."""
    csv_file = RAW_DIR / "exoplanets_raw.csv"
    if not csv_file.exists():
        raise FileNotFoundError(f"Raw data not found at {csv_file}. Run fetch_exoplanets.py first.")

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

    # Star class (from spectral type)
    print("  - star_class")
    df['star_class'] = df['st_spectype'].apply(get_star_class)

    # Planet classifications
    print("  - planet_type")
    df['planet_type'] = df.apply(classify_planet_type, axis=1)

    print("  - planet_subtype")
    df['planet_subtype'] = df.apply(classify_planet_subtype, axis=1)

    # Habitability score
    print("  - habitability_score")
    df['habitability_score'] = df.apply(calculate_habitability_score, axis=1)

    # Human-readable displays
    print("  - display fields (distance, period, mass, radius)")
    df['distance_display'] = df['sy_dist'].apply(format_distance)
    df['period_display'] = df['pl_orbper'].apply(format_period)
    df['mass_display'] = df['pl_bmasse'].apply(format_mass)
    df['radius_display'] = df['pl_rade'].apply(format_radius)

    # 3D positions in parsecs
    print("  - 3D positions (x_pc, y_pc, z_pc)")
    positions = df.apply(calculate_3d_position, axis=1)
    df['x_pc'] = positions.apply(lambda p: p[0])
    df['y_pc'] = positions.apply(lambda p: p[1])
    df['z_pc'] = positions.apply(lambda p: p[2])

    # Distance in light years
    print("  - distance_ly")
    df['distance_ly'] = df['sy_dist'] * 3.26156

    # Is in habitable zone flag
    print("  - is_habitable_zone")
    df['is_habitable_zone'] = (df['pl_eqt'] >= 200) & (df['pl_eqt'] <= 320)

    # Is Earth-like flag
    print("  - is_earth_like")
    df['is_earth_like'] = (df['pl_rade'] >= 0.8) & (df['pl_rade'] <= 1.25)

    return df


def generate_summary(df):
    """Generate summary statistics."""
    print("\n" + "=" * 70)
    print("PROCESSED DATA SUMMARY")
    print("=" * 70)

    print(f"\nTotal planets: {len(df):,}")
    print(f"Total columns: {len(df.columns)}")

    print("\nPlanet types:")
    for ptype, count in df['planet_type'].value_counts().items():
        print(f"  {ptype}: {count:,}")

    print("\nStar classes:")
    for sclass, count in df['star_class'].value_counts().head(8).items():
        print(f"  {sclass}: {count:,}")

    print("\nHabitability:")
    print(f"  Habitable zone: {df['is_habitable_zone'].sum():,}")
    print(f"  Earth-like size: {df['is_earth_like'].sum():,}")
    print(f"  Both (best candidates): {((df['is_habitable_zone']) & (df['is_earth_like'])).sum():,}")

    top_hab = df.nlargest(5, 'habitability_score')[['pl_name', 'habitability_score', 'pl_eqt', 'pl_rade']]
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
