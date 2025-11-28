/**
 * Habitability Visualization Utilities
 * Constants for habitability dashboard charts, spatial views, and 3D visualizations
 */

/**
 * Spatial scaling and positioning
 */
export const SPATIAL_SCALING = {
  /** Scale factor for parsecs to scene units */
  SCALE_FACTOR: 0.75,

  /** Light-year to scene unit conversion (parsec conversion: 0.75 / 3.26) */
  LIGHT_YEAR_TO_SCENE: 0.75 / 3.26,

  /** Top candidates count for gold highlighting */
  TOP_CANDIDATES_COUNT: 20,
} as const;

/**
 * Planet cloud visual properties
 */
export const PLANET_CLOUD = {
  /** Base size for planets */
  BASE_SIZE: 2,

  /** Maximum size for planets */
  MAX_SIZE: 8,

  /** Size attenuation multiplier in shader */
  SIZE_ATTENUATION: 300.0,

  /** Minimum point size clamping */
  SIZE_MIN_CLAMP: 1.0,

  /** Maximum point size clamping */
  SIZE_MAX_CLAMP: 30.0,

  /** Fragment shader alpha multiplier */
  ALPHA_MULTIPLIER: 0.9,
} as const;

/**
 * Planet color scheme by habitability status
 */
export const PLANET_COLORS = {
  /** Top 20 candidates */
  TOP_CANDIDATE: '#ffd700',

  /** Habitable + Earth-like */
  HABITABLE_EARTHLIKE: '#00ff88',

  /** Habitable zone only */
  HABITABLE: '#00ccff',

  /** High score (60+) */
  HIGH_SCORE: '#ff8800',

  /** Score brightness calculation: min brightness */
  BRIGHTNESS_MIN: 0.2,

  /** Score brightness calculation: max additional brightness */
  BRIGHTNESS_RANGE: 0.3,

  /** High score threshold */
  HIGH_SCORE_THRESHOLD: 60,
} as const;

/**
 * Texture generation parameters
 */
export const TEXTURE_GENERATION = {
  /** Canvas size for texture generation */
  TEXTURE_SIZE: 128,

  /** Gradient color stop positions */
  GRADIENT_STOPS: [0.1, 0.3, 0.5],

  /** Spike gradient stop positions */
  SPIKE_STOPS: [0.3],

  /** Core radius multiplier */
  CORE_RADIUS_MULTIPLIER: 0.15,

  /** Spike width */
  SPIKE_WIDTH: 2,

  /** Spike length multiplier */
  SPIKE_LENGTH_MULTIPLIER: 0.9,
} as const;

/**
 * Hit detection for planet cloud
 */
export const PLANET_CLOUD_INTERACTION = {
  /** Hit detection threshold in screen pixels */
  HIT_THRESHOLD: 20,

  /** Drag distance threshold for click detection */
  DRAG_THRESHOLD: 5,

  /** Cursor styles */
  POINTER_CURSOR: 'pointer',
  DEFAULT_CURSOR: 'grab',
} as const;

/**
 * Distance rings parameters
 */
export const DISTANCE_RINGS = {
  /** Ring distances in light-years */
  RING_DISTANCES: [10, 50, 100, 500, 1000],

  /** Number of segments per ring */
  SEGMENTS: 64,

  /** Ring line width */
  LINE_WIDTH: 1,

  /** Initial ring opacity */
  INITIAL_OPACITY: 0.15,

  /** Opacity decrement per ring */
  OPACITY_STEP: 0.02,

  /** Ring color */
  COLOR: '#ffffff',

  /** Label font size */
  LABEL_FONT_SIZE: 3,

  /** Label offset from ring */
  LABEL_OFFSET: 5,
} as const;

/**
 * Grid visualization parameters
 */
export const GRID_VISUALIZATION = {
  /** Grid helper size */
  GRID_SIZE: 1000,

  /** Grid divisions */
  GRID_DIVISIONS: 20,

  /** Grid color */
  GRID_COLOR: '#333333',

  /** Grid secondary color */
  GRID_SECONDARY_COLOR: '#222222',

  /** Grid Y position offset */
  GRID_Y_OFFSET: -0.1,
} as const;

/**
 * Axis indicator parameters
 */
export const AXIS_INDICATORS = {
  /** Axis line length */
  LENGTH: 50,

  /** Axis line width */
  LINE_WIDTH: 2,

  /** Axis line opacity */
  OPACITY: 0.5,

  /** X axis color (red) */
  X_AXIS_COLOR: '#ff4444',

  /** Y axis color (green) */
  Y_AXIS_COLOR: '#44ff44',

  /** Z axis color (blue) */
  Z_AXIS_COLOR: '#4444ff',
} as const;

/**
 * Galaxy view 3D canvas settings
 */
export const GALAXY_CANVAS = {
  /** Camera initial position X */
  CAMERA_X: 0,

  /** Camera initial position Y */
  CAMERA_Y: 20,

  /** Camera initial position Z */
  CAMERA_Z: 60,

  /** Camera field of view */
  CAMERA_FOV: 60,

  /** Camera near clipping plane */
  CAMERA_NEAR: 0.1,

  /** Camera far clipping plane */
  CAMERA_FAR: 5000,

  /** Ambient light intensity */
  AMBIENT_LIGHT_INTENSITY: 0.3,
} as const;

/**
 * OrbitControls parameters for galaxy view
 */
export const ORBIT_CONTROLS = {
  /** Minimum distance for orbit controls */
  MIN_DISTANCE: 20,

  /** Maximum distance for orbit controls */
  MAX_DISTANCE: 1000,

  /** Minimum polar angle (radians) */
  MIN_POLAR_ANGLE: 0,

  /** Maximum polar angle (radians, = PI) */
  MAX_POLAR_ANGLE: Math.PI,

  /** Auto-rotate enabled */
  AUTO_ROTATE: true,

  /** Auto-rotate speed */
  AUTO_ROTATE_SPEED: 0.3,
} as const;

/**
 * Text labels in galaxy view
 */
export const GALAXY_LABELS = {
  /** SOL label font size */
  SOL_FONT_SIZE: 2,

  /** SOL label color (gold) */
  SOL_COLOR: '#ffd700',

  /** SOL label text */
  SOL_TEXT: 'SOL',
} as const;

/**
 * Tooltip positioning
 */
export const TOOLTIP_POSITION = {
  /** Tooltip X offset from cursor */
  X_OFFSET: 15,

  /** Tooltip Y offset from cursor */
  Y_OFFSET: -10,
} as const;

/**
 * Number formatting
 */
export const NUMBER_FORMATTING = {
  /** Default decimal places for scores */
  SCORE_DECIMALS: 1,

  /** Decimal places for temperature */
  TEMPERATURE_DECIMALS: 0,

  /** Decimal places for distance */
  DISTANCE_DECIMALS: 1,
} as const;

/**
 * Helper function to calculate planet brightness from score
 */
export function calculatePlanetBrightness(score: number): number {
  return (
    PLANET_COLORS.BRIGHTNESS_MIN +
    (score / 100) * PLANET_COLORS.BRIGHTNESS_RANGE
  );
}

/**
 * Helper function to get planet size from habitability score
 */
export function getPlanetSize(score: number): number {
  const normalized = score / 100;
  return PLANET_CLOUD.BASE_SIZE + normalized * (PLANET_CLOUD.MAX_SIZE - PLANET_CLOUD.BASE_SIZE);
}
