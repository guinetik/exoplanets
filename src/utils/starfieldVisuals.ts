/**
 * Starfield Visualization Utilities
 * Constants for the interactive starfield scene including intro animations,
 * camera controls, stars rendering, satellites, and Earth horizon
 */

/**
 * Intro sequence animation timings (in milliseconds)
 */
export const INTRO_ANIMATION = {
  /** Earth spinning phase duration */
  EARTH_SPIN_DURATION: 5000,

  /** Camera movement phase duration */
  CAMERA_SWOOP_DURATION: 2500,

  /** Stars fade-in phase duration */
  STARS_FADE_DURATION: 2000,

  /** Welcome card appearance delay */
  WELCOME_CARD_DELAY: 300,

  /** Welcome card dismiss animation duration */
  WELCOME_CARD_DISMISS_DURATION: 300,

  /** Letter animation delay multiplier (in seconds) */
  LETTER_ANIMATION_DELAY: 0.25,

  /** Letter animation initial line offset (in letter delays) */
  PLANETS_LINE_START_OFFSET: 3,
} as const;

/**
 * Intro Earth visual parameters
 */
export const INTRO_EARTH = {
  /** Base sphere radius */
  BASE_RADIUS: 580,

  /** Scale multiplier during intro (0-1 progress) */
  SCALE_MULTIPLIER: 0.35,

  /** Initial Z position */
  INITIAL_Z: -600,

  /** Z movement distance over duration */
  Z_MOVEMENT_DISTANCE: 500,

  /** Rotation speed (radians per second) */
  ROTATION_SPEED: 0.15,

  /** Atmosphere glow scale */
  ATMOSPHERE_SCALE: 1.05,

  /** Atmosphere glow opacity */
  ATMOSPHERE_OPACITY: 0.15,

  /** Outer glow scale */
  OUTER_GLOW_SCALE: 1.12,

  /** Outer glow opacity */
  OUTER_GLOW_OPACITY: 0.08,

  /** Atmosphere color (hex) */
  ATMOSPHERE_COLOR: 0x4488ff,

  /** Outer glow color (hex) */
  OUTER_GLOW_COLOR: 0x66aaff,
} as const;

/**
 * Shader constants for intro Earth planet rendering
 */
export const INTRO_PLANET_SHADER = {
  /** Time multiplier for rotation animation */
  TIME_MULTIPLIER: 0.1,

  /** Noise frequency for land generation */
  LAND_NOISE_FREQUENCY: 8.0,

  /** Land generation smoothstep lower threshold */
  LAND_SMOOTHSTEP_LOWER: 0.45,

  /** Land generation smoothstep upper threshold */
  LAND_SMOOTHSTEP_UPPER: 0.55,

  /** Land detail noise frequency */
  LAND_DETAIL_FREQUENCY: 16.0,

  /** Cloud noise frequency */
  CLOUD_NOISE_FREQUENCY: 6.0,

  /** Cloud animation time multiplier */
  CLOUD_TIME_MULTIPLIER: 0.05,

  /** Cloud smoothstep lower threshold */
  CLOUD_SMOOTHSTEP_LOWER: 0.5,

  /** Cloud smoothstep upper threshold */
  CLOUD_SMOOTHSTEP_UPPER: 0.7,

  /** Cloud opacity multiplier */
  CLOUD_OPACITY: 0.7,

  /** Ice cap pole threshold */
  ICE_CAP_LOWER: 0.7,

  /** Ice cap pole upper threshold */
  ICE_CAP_UPPER: 0.9,

  /** Ambient light level */
  AMBIENT_LIGHT: 0.15,

  /** Atmosphere rim power */
  ATMOSPHERE_RIM_POWER: 3.0,

  /** Atmosphere rim glow intensity */
  ATMOSPHERE_RIM_INTENSITY: 0.5,

  /** Longitude conversion constant (pi) */
  LONGITUDE_DIVISOR: 3.14159,

  /** Latitude conversion constant (pi/2) */
  LATITUDE_DIVISOR: 1.5708,

  /** FBM iterations for noise generation */
  FBM_ITERATIONS: 4,
} as const;

/**
 * Camera controller parameters
 */
export const CAMERA_CONTROLLER = {
  /** Initial camera azimuth (horizontal angle in degrees) */
  INITIAL_AZIMUTH: 180,

  /** Initial camera altitude (vertical angle in degrees) */
  INITIAL_ALTITUDE: 10,

  /** Camera lookAt distance */
  LOOKAT_DISTANCE: 100,

  /** Mouse drag sensitivity (multiplier) */
  DRAG_SENSITIVITY: 0.3,

  /** Minimum altitude constraint (degrees) */
  MIN_ALTITUDE: -10,

  /** Maximum altitude constraint (degrees) */
  MAX_ALTITUDE: 90,

  /** Default cursor style */
  DEFAULT_CURSOR: 'grab',

  /** Dragging cursor style */
  DRAGGING_CURSOR: 'grabbing',
} as const;

/**
 * Background stars rendering settings
 */
export const BACKGROUND_STARS_SETTINGS = {
  /** Number of background stars */
  COUNT: 3000,

  /** Sphere radius for star distribution */
  SPHERE_RADIUS: 800,

  /** Point size in pixels */
  POINT_SIZE: 0.8,

  /** Star color (hex) */
  COLOR: 0x888888,

  /** Opacity multiplier for fade */
  OPACITY_MULTIPLIER: 0.5,
} as const;

/**
 * Stars component rendering settings
 */
export const STARS_RENDERING = {
  /** Distance from camera to star sphere */
  STAR_DISTANCE: 500,

  /** Base scale multiplier for star size */
  BASE_SCALE: 20,

  /** Scale when hovered */
  HOVER_SCALE: 40,

  /** Point size attenuation multiplier */
  SIZE_ATTENUATION_MULTIPLIER: 1500.0,
} as const;

/**
 * Star texture generation parameters
 */
export const STAR_TEXTURE = {
  /** Canvas size for texture generation */
  SIZE: 128,

  /** Glow gradient color stops */
  GRADIENT_STOPS: [
    { position: 0, opacity: 1 },
    { position: 0.1, opacity: 0.8 },
    { position: 0.3, opacity: 0.3 },
    { position: 0.5, opacity: 0.1 },
    { position: 1, opacity: 0 },
  ],

  /** Spike gradient color stops */
  SPIKE_GRADIENT_STOPS: [
    { position: 0, opacity: 0.8 },
    { position: 0.3, opacity: 0.3 },
    { position: 1, opacity: 0 },
  ],

  /** Spike width */
  SPIKE_WIDTH: 2,

  /** Spike length multiplier */
  SPIKE_LENGTH_MULTIPLIER: 0.9,

  /** Core gradient radius multiplier */
  CORE_RADIUS_MULTIPLIER: 0.15,

  /** Core gradient color stops */
  CORE_GRADIENT_STOPS: [
    { position: 0, opacity: 1 },
    { position: 0.5, opacity: 0.8 },
    { position: 1, opacity: 0 },
  ],
} as const;

/**
 * Star shader animation parameters
 */
export const STAR_SHADER = {
  /** Twinkle time multiplier */
  TWINKLE_TIME_MULTIPLIER: 0.3,

  /** Twinkle intensity multiplier */
  TWINKLE_INTENSITY_MULTIPLIER: 0.15,

  /** Base opacity for non-hovered stars */
  BASE_OPACITY: 0.95,

  /** Hovered star opacity */
  HOVERED_OPACITY: 1.0,
} as const;

/**
 * Star twinkle animation derived from hash
 */
export const STAR_TWINKLE = {
  /** Minimum twinkle speed */
  MIN_SPEED: 0.5,

  /** Twinkle speed range (max - min) */
  SPEED_RANGE: 2.0,

  /** Hash modulo for speed calculation */
  SPEED_MODULO: 100,

  /** Hash divisor for speed range */
  SPEED_DIVISOR: 50,

  /** Minimum twinkle intensity */
  MIN_INTENSITY: 0.15,

  /** Twinkle intensity range (max - min) */
  INTENSITY_RANGE: 0.25,

  /** Hash modulo for intensity calculation */
  INTENSITY_MODULO: 50,

  /** Hash divisor for intensity range */
  INTENSITY_DIVISOR: 200,
} as const;

/**
 * Star hit detection and interaction
 */
export const STAR_INTERACTION = {
  /** Base hit detection threshold in screen pixels */
  BASE_HIT_THRESHOLD: 15,

  /** Hit threshold scale by star size */
  SIZE_SCALE_MULTIPLIER: 0.3,

  /** Hover smoothing lerp factor */
  HOVER_LERP: 0.15,

  /** Drag distance threshold for click detection */
  CLICK_DISTANCE_THRESHOLD: 5,

  /** Pointer cursor style */
  POINTER_CURSOR: 'pointer',

  /** Default cursor style */
  DEFAULT_CURSOR: 'grab',
} as const;

/**
 * Satellite spawning settings
 */
export const SATELLITE_SPAWN = {
  /** Minimum time between satellite spawns (milliseconds) */
  MIN_INTERVAL_MS: 5000,

  /** Maximum time between satellite spawns (milliseconds) */
  MAX_INTERVAL_MS: 12000,

  /** Maximum active satellites visible at once */
  MAX_ACTIVE: 3,

  /** Initial spawn delay (milliseconds) */
  INITIAL_DELAY_MS: 3000,
} as const;

/**
 * Satellite lifetime and movement
 */
export const SATELLITE_PHYSICS = {
  /** Satellite lifetime in seconds */
  LIFETIME_S: 20,

  /** Base satellite size */
  BASE_SIZE: 0.8,

  /** Altitude (distance from camera) */
  ALTITUDE: 80,

  /** Movement speed */
  SPEED: 15,

  /** Speed variation factor (min + random * range) */
  SPEED_MIN_FACTOR: 0.8,

  /** Speed variation range */
  SPEED_VARIATION: 0.4,

  /** Tumble rotation speeds (radians per frame) */
  TUMBLE_X: 0.01,

  /** Tumble Y rotation */
  TUMBLE_Y: 0.02,
} as const;

/**
 * Satellite spawn position randomization
 */
export const SATELLITE_SPAWN_POSITION = {
  /** Start Y position base */
  START_Y_BASE: 10,

  /** Start Y position random range */
  START_Y_RANGE: 40,

  /** Start Z position lower multiplier */
  START_Z_LOWER: 0.3,

  /** Start Z position random range */
  START_Z_RANGE: 0.7,

  /** Direction Y drift random scale */
  DIR_Y_SCALE: 0.3,

  /** Direction Z variation random scale */
  DIR_Z_SCALE: 0.5,
} as const;

/**
 * Satellite type definitions with appearance
 */
export const SATELLITE_TYPES = [
  {
    name: 'ISS',
    color: '#ffffff',
    size: 1.0,
    panels: true,
    spawnProbability: 0.15,
  },
  {
    name: 'Satellite',
    color: '#aaaaaa',
    size: 0.6,
    panels: true,
    spawnProbability: 0.55,
  },
  {
    name: 'Debris',
    color: '#666666',
    size: 0.3,
    panels: false,
    spawnProbability: 0.3,
  },
] as const;

/**
 * Satellite visual parameters
 */
export const SATELLITE_VISUALS = {
  /** Main body box geometry scales */
  BODY_HEIGHT_MULTIPLIER: 0.5,

  /** Body depth multiplier */
  BODY_DEPTH_MULTIPLIER: 0.5,

  /** Solar panel X position multiplier */
  PANEL_X_OFFSET: 0.8,

  /** Solar panel width multiplier */
  PANEL_WIDTH: 0.8,

  /** Solar panel thickness multiplier */
  PANEL_THICKNESS: 0.05,

  /** Solar panel depth multiplier */
  PANEL_DEPTH: 0.4,

  /** Solar panel color (hex) */
  PANEL_COLOR: '#1a3a5c',
} as const;

/**
 * Location animation settings
 */
export const LOCATION_ANIMATION = {
  /** Animation duration for location transitions (milliseconds) */
  DURATION_MS: 2000,
} as const;

/**
 * Easing function constants
 */
export const EASING = {
  /** InOutBack ease constant 1 */
  INOUT_BACK_C1: 1.70158,

  /** InOutBack ease constant 2 multiplier */
  INOUT_BACK_C2_MULTIPLIER: 1.525,
} as const;

/**
 * Earth horizon sphere parameters
 */
export const EARTH_HORIZON = {
  /** Sphere radius */
  RADIUS: 580,

  /** Sphere position Y (below camera) */
  POSITION_Y: -600,

  /** Width segments for geometry */
  WIDTH_SEGMENTS: 64,

  /** Height segments for surface shader */
  HEIGHT_SEGMENTS_SURFACE: 64,

  /** Height segments for atmosphere shader */
  HEIGHT_SEGMENTS_ATMOSPHERE: 64,

  /** Atmosphere scale multiplier */
  ATMOSPHERE_SCALE: 1.02,

  /** Fallback color when shaders unavailable (hex) */
  FALLBACK_COLOR: 0x80aae2,

  /** Shader retry delay (milliseconds) */
  SHADER_RETRY_DELAY_MS: 100,

  /** Rotation interpolation lerp factor */
  ROTATION_LERP: 0.05,
} as const;

/**
 * Canvas and scene settings
 */
export const STARFIELD_SCENE = {
  /** Canvas background color */
  BACKGROUND_COLOR: '#000',

  /** Canvas background color (alternative) */
  BACKGROUND_COLOR_ALT: '#000000',

  /** Camera field of view */
  CAMERA_FOV: 60,

  /** Camera near clipping plane */
  CAMERA_NEAR: 0.1,

  /** Camera far clipping plane */
  CAMERA_FAR: 2000,

  /** Initial camera X position */
  CAMERA_INITIAL_X: 0,

  /** Initial camera Y position */
  CAMERA_INITIAL_Y: 50,

  /** Initial camera Z position */
  CAMERA_INITIAL_Z: 400,

  /** Ambient light intensity */
  AMBIENT_LIGHT_INTENSITY: 0.3,

  /** Overlay fade opacity when visible */
  OVERLAY_OPACITY_VISIBLE: 1,
} as const;

/**
 * Helper function to select satellite type by roll probability
 */
export function selectSatelliteType(roll: number) {
  if (roll < SATELLITE_TYPES[0].spawnProbability) {
    return SATELLITE_TYPES[0]; // ISS
  }
  if (roll < SATELLITE_TYPES[0].spawnProbability + SATELLITE_TYPES[1].spawnProbability) {
    return SATELLITE_TYPES[1]; // Satellite
  }
  return SATELLITE_TYPES[2]; // Debris
}
