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

  // Radial Velocity Properties
  pl_rvamp: number | null; // RV semi-amplitude (m/s)
  st_radv: number | null; // Stellar radial velocity (km/s)
  st_vsin: number | null; // Stellar rotation velocity (km/s)

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

  // Boolean flags - Habitability
  is_habitable_zone: boolean;
  is_earth_like: boolean;
  has_earth_like_insolation: boolean;
  is_conservative_habitable: boolean;
  is_optimistic_habitable: boolean;
  is_top_habitable_candidate: boolean;
  is_potentially_rocky: boolean;

  // Boolean flags - Orbital characteristics
  is_ultra_short_period: boolean;
  is_short_period: boolean;
  is_long_period: boolean;
  is_eccentric_orbit: boolean;
  is_circular_orbit: boolean;
  is_likely_tidally_locked: boolean;

  // Boolean flags - System characteristics
  is_multi_planet_system: boolean;
  is_rich_system: boolean;
  is_only_known_planet: boolean;
  is_circumbinary: boolean;
  is_multi_star_system: boolean;

  // Boolean flags - Distance
  is_nearby: boolean;
  is_very_nearby: boolean;

  // Boolean flags - Detection
  is_transiting: boolean;
  has_rv_data: boolean;
  has_ttv: boolean;
  is_controversial: boolean;

  // Boolean flags - Star characteristics
  is_solar_analog: boolean;
  is_sun_like_star: boolean;
  is_red_dwarf_host: boolean;
  is_young_system: boolean;
  is_mature_system: boolean;
  is_ancient_system: boolean;
  is_metal_rich_star: boolean;
  is_metal_poor_star: boolean;

  // Boolean flags - Planet characteristics
  is_hot_jupiter: boolean;
  is_hot_neptune: boolean;
  is_ultra_hot: boolean;
  is_frozen_world: boolean;
  is_ultra_dense: boolean;
  is_puffy: boolean;
  is_super_massive: boolean;
  is_lightweight: boolean;

  // Color factors for shader generation (0-1 normalized)
  color_temp_factor: number | null;         // Temperature: 0 = cold/blue, 1 = hot/red
  color_composition_factor: number | null;  // Composition: 0 = gas, 0.5 = ice, 1 = rock
  color_irradiation_factor: number | null;  // Irradiation: 0 = dim, 1 = bright
  color_metallicity_factor: number | null;  // Star metallicity: 0 = metal-poor, 1 = metal-rich
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

// =============================================================================
// REVIEW TYPES (matches legacy Firebase schema)
// =============================================================================

/**
 * User profile for reviews
 * Matches legacy Firestore 'users' collection
 */
export interface ReviewUser {
  uid: string;           // UUID generated locally
  authProvider: string;  // "anonymous" for no-login users
  name: string;          // Display name
  email: string;         // Empty string for anonymous users
  avatar: string;        // DiceBear avatar URL
}

/**
 * Planet review
 * Matches legacy Firestore 'reviews' collection
 */
export interface PlanetReview {
  id?: string;           // Firestore doc ID (auto-generated)
  date: number;          // Timestamp in milliseconds
  planet: string;        // Planet name as ID
  rate: number;          // 1-5 star rating
  title: string;         // Review title
  text: string;          // Review body
  userid: string;        // Reference to user's uid
  // Joined field (populated on fetch, not stored in DB)
  author?: ReviewUser;
}

// =============================================================================
// VOTING TYPES (Earth 2.0 Poll)
// =============================================================================

/**
 * User vote for Earth 2.0 poll
 * Firestore collection: exoplanets_poll
 */
export interface ExoplanetVote {
  id?: string;           // Firestore doc ID (auto-generated)
  planet: string;        // Planet name (e.g., "TRAPPIST-1 e")
  userid: string;        // User ID (from existing auth)
  timestamp: number;     // Vote timestamp in milliseconds
}

/**
 * Aggregated vote counts by planet
 */
export interface VoteCount {
  planet: string;        // Planet name
  count: number;         // Number of votes
}
