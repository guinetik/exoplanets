"""
Exoplanet Data Fetcher
Downloads data from NASA Exoplanet Archive
"""

import requests
import pandas as pd
from pathlib import Path

BASE_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
QUERY = "select * from pscomppars"  # Confirmed planets, one row per planet
RAW_DIR = Path(__file__).parent / "raw"
OUT_DIR = Path(__file__).parent / "out"

# Essential columns for the frontend visualization
# Organized by category with descriptions
ESSENTIAL_COLUMNS = {
    # =========================================================================
    # PLANET IDENTIFICATION
    # =========================================================================
    "pl_name": "Planet name",
    "pl_letter": "Planet letter (b, c, d...)",
    "hostname": "Host star name",

    # =========================================================================
    # PLANET PHYSICAL PROPERTIES
    # =========================================================================
    "pl_rade": "Planet radius [Earth radii]",
    "pl_radj": "Planet radius [Jupiter radii]",
    "pl_bmasse": "Planet mass [Earth masses] - best estimate",
    "pl_bmassj": "Planet mass [Jupiter masses] - best estimate",
    "pl_bmassprov": "Mass measurement provenance (measured/M-R relationship)",
    "pl_dens": "Planet density [g/cm³]",
    "pl_eqt": "Equilibrium temperature [K]",
    "pl_insol": "Insolation flux [Earth flux] - for habitability",

    # =========================================================================
    # ORBITAL PROPERTIES (for orbital animation)
    # =========================================================================
    "pl_orbper": "Orbital period [days]",
    "pl_orbsmax": "Orbital semi-major axis [AU]",
    "pl_orbeccen": "Orbital eccentricity",
    "pl_orbincl": "Orbital inclination [deg]",

    # =========================================================================
    # TRANSIT PROPERTIES (for visualization)
    # =========================================================================
    "pl_trandep": "Transit depth [%] - how much star dims",
    "pl_trandur": "Transit duration [hours]",
    "pl_ratror": "Planet/star radius ratio",
    "pl_ratdor": "Semi-major axis / stellar radius ratio",
    "pl_imppar": "Impact parameter",

    # =========================================================================
    # DISCOVERY INFO
    # =========================================================================
    "disc_year": "Discovery year",
    "discoverymethod": "Discovery method",
    "disc_facility": "Discovery facility",
    "disc_telescope": "Discovery telescope",

    # =========================================================================
    # STAR PHYSICAL PROPERTIES
    # =========================================================================
    "st_teff": "Stellar effective temperature [K]",
    "st_rad": "Stellar radius [Solar radii]",
    "st_mass": "Stellar mass [Solar masses]",
    "st_lum": "Stellar luminosity [log Solar]",
    "st_logg": "Stellar surface gravity [log g]",
    "st_age": "Stellar age [Gyr]",
    "st_dens": "Stellar density [g/cm³]",
    "st_met": "Stellar metallicity [dex]",
    "st_rotp": "Stellar rotation period [days]",
    "st_spectype": "Stellar spectral type (M, K, G, F, A, B, O)",

    # =========================================================================
    # SYSTEM PROPERTIES
    # =========================================================================
    "sy_snum": "Number of stars in system",
    "sy_pnum": "Number of planets in system",
    "sy_mnum": "Number of moons in system",
    "sy_dist": "Distance from Earth [parsecs]",

    # =========================================================================
    # 3D COORDINATES (for 3D galaxy mapping!)
    # =========================================================================
    "ra": "Right ascension [deg]",
    "dec": "Declination [deg]",
    "rastr": "Right ascension [sexagesimal]",
    "decstr": "Declination [sexagesimal]",
    "glat": "Galactic latitude [deg]",
    "glon": "Galactic longitude [deg]",
    "x": "Heliocentric X coordinate (unit vector)",
    "y": "Heliocentric Y coordinate (unit vector)",
    "z": "Heliocentric Z coordinate (unit vector)",

    # =========================================================================
    # FLAGS (for filtering/categorization)
    # =========================================================================
    "cb_flag": "Circumbinary planet (orbits 2 stars)",
    "pl_controv_flag": "Controversial planet flag",
    "tran_flag": "Detected by transit",
    "rv_flag": "Detected by radial velocity",
    "ttv_flag": "Transit timing variations detected",

    # =========================================================================
    # MAGNITUDES (for brightness visualization)
    # =========================================================================
    "sy_vmag": "V-band (visible) magnitude",
    "sy_kmag": "K-band (infrared) magnitude",
    "sy_gaiamag": "Gaia magnitude",
    "sy_tmag": "TESS magnitude",

    # =========================================================================
    # IDs (for cross-referencing)
    # =========================================================================
    "tic_id": "TESS Input Catalog ID",
    "gaia_dr3_id": "Gaia DR3 ID",
}


def download_exoplanets(force=False):
    """Download the full exoplanet dataset from NASA Exoplanet Archive."""
    output_file = RAW_DIR / "exoplanets_raw.csv"

    if output_file.exists() and not force:
        print(f"Using cached data from {output_file}")
        return output_file

    print("Downloading exoplanet data from NASA Exoplanet Archive...")

    response = requests.get(BASE_URL, params={"query": QUERY, "format": "csv"}, timeout=120)
    response.raise_for_status()

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(response.text)

    file_size = output_file.stat().st_size / (1024 * 1024)
    print(f"Downloaded {file_size:.2f} MB to {output_file}")

    return output_file


def analyze_columns(df):
    """Analyze which essential columns exist and their data quality."""
    print("\n" + "=" * 70)
    print("ESSENTIAL COLUMNS ANALYSIS")
    print("=" * 70)

    available = []
    missing = []

    for col, desc in ESSENTIAL_COLUMNS.items():
        if col in df.columns:
            non_null = df[col].notna().sum()
            pct = (non_null / len(df)) * 100
            available.append((col, desc, non_null, pct))
        else:
            missing.append((col, desc))

    print(f"\n✓ Available columns ({len(available)}/{len(ESSENTIAL_COLUMNS)}):\n")
    print(f"{'Column':<20} {'Description':<35} {'Values':>8} {'%':>6}")
    print("-" * 72)
    for col, desc, count, pct in available:
        print(f"{col:<20} {desc[:33]:<35} {count:>8,} {pct:>5.1f}%")

    if missing:
        print(f"\n✗ Missing columns ({len(missing)}):")
        for col, desc in missing:
            print(f"  - {col}: {desc}")

    return [col for col, _, _, _ in available]


def show_highlights(df):
    """Show interesting data highlights."""
    print("\n" + "=" * 70)
    print("DATA HIGHLIGHTS")
    print("=" * 70)

    print(f"\n📊 Total confirmed exoplanets: {len(df):,}")
    print(f"⭐ Unique host stars: {df['hostname'].nunique():,}")

    # Habitable zone
    if 'pl_eqt' in df.columns:
        habitable = df[(df['pl_eqt'] >= 200) & (df['pl_eqt'] <= 320)]
        print(f"🌍 Habitable zone candidates (200-320K): {len(habitable)}")

    # Earth-like
    if 'pl_rade' in df.columns:
        earthlike = df[(df['pl_rade'] >= 0.8) & (df['pl_rade'] <= 1.25)]
        print(f"🌎 Earth-sized planets (0.8-1.25 R⊕): {len(earthlike)}")

    # Circumbinary
    if 'cb_flag' in df.columns:
        cb = df[df['cb_flag'] == 1]
        print(f"🌑 Circumbinary planets (two suns): {len(cb)}")

    # Closest
    if 'sy_dist' in df.columns:
        closest = df.nsmallest(1, 'sy_dist')
        print(f"📍 Closest exoplanet: {closest.iloc[0]['pl_name']} ({closest.iloc[0]['sy_dist']:.2f} pc)")

    # Discovery methods
    print(f"\n📡 Discovery methods:")
    for method, count in df['discoverymethod'].value_counts().head(5).items():
        print(f"   {method}: {count:,}")


def main():
    csv_file = RAW_DIR / "exoplanets_raw.csv"

    # Download if not exists
    if not csv_file.exists():
        csv_file = download_exoplanets()

    print("\nLoading data...")
    df = pd.read_csv(csv_file, low_memory=False)

    print(f"\nTotal rows: {len(df):,}")
    print(f"Total columns: {len(df.columns)}")

    # Analyze essential columns
    available_cols = analyze_columns(df)

    # Show highlights
    show_highlights(df)

    return df, available_cols


if __name__ == "__main__":
    main()
