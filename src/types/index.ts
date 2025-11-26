/**
 * Exoplanet data types based on NASA Exoplanet Archive
 * https://exoplanetarchive.ipac.caltech.edu
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export interface Exoplanet {
  // Identification
  pl_name: string;
  pl_letter: string;
  hostname: string;

  // Planet Physical Properties
  pl_rade: number | null; // Earth radii
  pl_radj: number | null; // Jupiter radii
  pl_bmasse: number | null; // Earth masses
  pl_bmassj: number | null; // Jupiter masses
  pl_bmassprov: string | null; // Mass measurement method
  pl_dens: number | null; // g/cm³
  pl_eqt: number | null; // Equilibrium temp (K)
  pl_insol: number | null; // Insolation flux (Earth flux)

  // Orbital Properties
  pl_orbper: number | null; // Orbital period (days)
  pl_orbsmax: number | null; // Semi-major axis (AU)
  pl_orbeccen: number | null; // Eccentricity
  pl_orbincl: number | null; // Inclination (deg)

  // Transit Properties
  pl_trandep: number | null; // Transit depth (%)
  pl_trandur: number | null; // Transit duration (hours)
  pl_ratror: number | null; // Planet/star radius ratio
  pl_ratdor: number | null; // Semi-major axis / stellar radius
  pl_imppar: number | null; // Impact parameter

  // Discovery
  disc_year: number;
  discoverymethod: string;
  disc_facility: string;
  disc_telescope: string;

  // Host Star Properties
  st_teff: number | null; // Effective temp (K)
  st_rad: number | null; // Solar radii
  st_mass: number | null; // Solar masses
  st_lum: number | null; // log(Solar luminosity)
  st_logg: number | null; // Surface gravity (log g)
  st_age: number | null; // Age (Gyr)
  st_dens: number | null; // Density (g/cm³)
  st_met: number | null; // Metallicity (dex)
  st_rotp: number | null; // Rotation period (days)
  st_spectype: string | null; // Spectral type

  // System Properties
  sy_snum: number; // Number of stars
  sy_pnum: number; // Number of planets
  sy_mnum: number; // Number of moons
  sy_dist: number | null; // Distance (parsecs)

  // Coordinates
  ra: number; // Right ascension (deg)
  dec: number; // Declination (deg)
  rastr: string;
  decstr: string;
  glat: number; // Galactic latitude (deg)
  glon: number; // Galactic longitude (deg)

  // Unit vectors (for 3D positioning)
  x: number;
  y: number;
  z: number;

  // Flags
  cb_flag: number; // Circumbinary (0 or 1)
  pl_controv_flag: number; // Controversial (0 or 1)
  tran_flag: number; // Transit detected
  rv_flag: number; // Radial velocity detected
  ttv_flag: number; // Transit timing variations

  // Magnitudes
  sy_vmag: number | null; // V-band
  sy_kmag: number | null; // K-band
  sy_gaiamag: number | null; // Gaia
  sy_tmag: number | null; // TESS

  // External IDs
  tic_id: string | null;
  gaia_dr3_id: string | null;

  // Derived Fields
  star_class: string | null; // O, B, A, F, G, K, M
  planet_type: PlanetType | null;
  planet_subtype: string | null;
  habitability_score: number;
  distance_display: string | null;
  period_display: string | null;
  mass_display: string | null;
  radius_display: string | null;

  // 3D positions (parsecs)
  x_pc: number | null;
  y_pc: number | null;
  z_pc: number | null;

  // Distance in light-years
  distance_ly: number | null;

  // Boolean flags
  is_habitable_zone: boolean;
  is_earth_like: boolean;
}

export type PlanetType =
  | 'Sub-Earth'
  | 'Earth-sized'
  | 'Super-Earth'
  | 'Sub-Neptune'
  | 'Neptune-like'
  | 'Gas Giant';

export type StarClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'L' | 'T' | 'Y';

export type DiscoveryMethod =
  | 'Transit'
  | 'Radial Velocity'
  | 'Microlensing'
  | 'Imaging'
  | 'Transit Timing Variations'
  | 'Eclipse Timing Variations'
  | 'Orbital Brightness Modulation'
  | 'Pulsar Timing'
  | 'Astrometry'
  | 'Pulsation Timing Variations'
  | 'Disk Kinematics';

// =============================================================================
// STAR TYPE (aggregated from planets)
// =============================================================================

export interface Star {
  id: string; // hostname
  hostname: string;
  planets: string[]; // planet names

  // Star properties (from first planet)
  st_teff: number | null;
  st_rad: number | null;
  st_mass: number | null;
  st_lum: number | null;
  st_logg: number | null;
  st_age: number | null;
  st_dens: number | null;
  st_met: number | null;
  st_rotp: number | null;
  st_spectype: string | null;
  star_class: string | null;

  // System properties
  sy_snum: number;
  sy_pnum: number;
  sy_mnum: number;
  sy_dist: number | null;
  distance_ly: number | null;
  distance_display: string | null;

  // Coordinates
  ra: number;
  dec: number;
  rastr: string;
  decstr: string;
  glat: number;
  glon: number;

  // 3D position
  x: number;
  y: number;
  z: number;
  x_pc: number | null;
  y_pc: number | null;
  z_pc: number | null;

  // Magnitudes
  sy_vmag: number | null;
  sy_kmag: number | null;
  sy_gaiamag: number | null;
  sy_tmag: number | null;

  // Flags
  cb_flag: boolean; // Has circumbinary planets
}

// =============================================================================
// 3D TYPES (for ThreeJS visualization)
// =============================================================================

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalCoords {
  ra: number; // Right ascension (degrees)
  dec: number; // Declination (degrees)
  distance: number; // Distance (parsecs or light-years)
}

export interface CartesianCoords {
  x: number;
  y: number;
  z: number;
}

export interface OrbitalElements {
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  period: number; // days
}

// =============================================================================
// UI TYPES
// =============================================================================

export interface FilterOptions {
  planetType?: PlanetType | null;
  starClass?: StarClass | null;
  discoveryMethod?: DiscoveryMethod | null;
  minYear?: number;
  maxYear?: number;
  habitableOnly?: boolean;
  earthLikeOnly?: boolean;
  maxDistance?: number; // light-years
}

export interface SortOptions {
  field: keyof Exoplanet;
  direction: 'asc' | 'desc';
}

// =============================================================================
// APOD TYPES (NASA Astronomy Picture of the Day)
// =============================================================================

export interface ApodData {
  /** Title of the APOD */
  title: string;
  /** Explanation/description of the image */
  explanation: string;
  /** URL to the image/video */
  url: string;
  /** URL to high-definition version (images only) */
  hdurl?: string;
  /** Date of the APOD in YYYY-MM-DD format */
  date: string;
  /** Copyright holder if applicable */
  copyright?: string;
  /** Media type: 'image' or 'video' */
  mediaType?: string;
}

export interface ApodSuccessResponse {
  error: false;
  data: ApodData;
}

export interface ApodErrorResponse {
  error: true;
  code: number;
  message: string;
}

export type ApodResponse = ApodSuccessResponse | ApodErrorResponse;
