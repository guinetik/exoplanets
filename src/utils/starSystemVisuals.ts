/**
 * Star System Visualization Utilities
 * Constants for 3D scene rendering, camera controls, animations, and lighting
 */

/**
 * Background stars animation and appearance
 */
export const BACKGROUND_STARS = {
  /** Number of background stars to render */
  COUNT: 3000,

  /** Sphere radius for distributing stars */
  SPHERE_RADIUS: 500,

  /** Individual star point size */
  POINT_SIZE: 1.5,

  /** Star color (white) */
  COLOR: 0xffffff,

  /** Initial opacity (starts invisible for fade-in) */
  INITIAL_OPACITY: 0,

  /** Target opacity after fade-in completes */
  TARGET_OPACITY: 0.6,

  /** Fade-in animation duration in seconds */
  FADE_DURATION: 2.0,

  /** Easing power for fade-in cubic curve */
  FADE_EASING_POWER: 3,
} as const;

/**
 * Lighting parameters for the 3D scene
 */
export const SCENE_LIGHTING = {
  /** Ambient light intensity */
  AMBIENT_INTENSITY: 0.6,

  /** Hemisphere light colors and intensity */
  HEMISPHERE_SKY_COLOR: '#ffffff',
  HEMISPHERE_GROUND_COLOR: '#444444',
  HEMISPHERE_INTENSITY: 0.5,
} as const;

/**
 * Camera baseline and responsiveness parameters
 */
export const CAMERA_BASELINE = {
  /** Baseline aspect ratio (reference for responsive calculations) */
  ASPECT_RATIO: 1.5,

  /** Field of view in degrees */
  FOV: 50,

  /** Minimum camera distance to prevent clipping */
  MIN_DISTANCE: 2,

  /** Initial camera Y position as multiple of distance */
  INITIAL_Y_MULTIPLIER: 0.5,
} as const;

/**
 * Camera responsive adjustment thresholds
 */
export const CAMERA_RESPONSIVENESS = {
  /** Threshold for detecting viewport aspect ratio change (resize event) */
  MULTIPLIER_DELTA_THRESHOLD: 0.01,

  /** Threshold for stopping resize adjustment */
  ADJUSTMENT_STOP_THRESHOLD: 0.001,

  /** Lerp factor for smooth responsive multiplier transition */
  RESPONSIVE_LERP: 0.1,
} as const;

/**
 * Camera focus animation parameters (when following a body)
 */
export const CAMERA_FOCUS_ANIMATION = {
  /** Speed of animation progress ramp-up (per second) */
  PROGRESS_RAMP_UP: 3,

  /** Camera offset distance as multiple of body diameter */
  OFFSET_DISTANCE_MULTIPLIER: 4,

  /** Y offset for camera position as multiple of offset distance */
  Y_OFFSET_MULTIPLIER: 0.4,

  /** Base lerp factor for camera chase (slower = smoother) */
  BASE_LERP: 0.06,

  /** Follow lerp factor when animation is complete (faster = tighter follow) */
  FOLLOW_LERP: 0.12,

  /** Multiplier for follow lerp when updating control target */
  TARGET_LERP_MULTIPLIER: 1.5,
} as const;

/**
 * Camera return-to-default animation parameters (when unfocusing a body)
 */
export const CAMERA_RETURN_ANIMATION = {
  /** Speed of animation progress ramp-down (per second) */
  PROGRESS_RAMP_DOWN: 2,

  /** Lerp factor for returning camera position to default */
  CAMERA_RETURN_LERP: 0.03,

  /** Lerp factor for returning control target to default */
  TARGET_RETURN_LERP: 0.03,

  /** Lerp factor for resize-based camera adjustment */
  RESIZE_ADJUST_LERP: 0.02,

  /** Lerp factor for resize-based target adjustment */
  RESIZE_TARGET_LERP: 0.02,
} as const;

/**
 * Auto-rotation parameters (when not interacting with scene)
 */
export const AUTO_ROTATION = {
  /** Auto-rotation speed (radians per second) */
  SPEED: 0.1,
} as const;

/**
 * Camera distance calculation parameters
 */
export const CAMERA_DISTANCE = {
  /** Minimum distance multiplier for star diameter visibility */
  STAR_SIZE_MULTIPLIER: 4,

  /** Distance multiplier for orbit visibility */
  ORBITS_MULTIPLIER: 2.5,

  /** Maximum camera distance multiplier (for max zoom constraint) */
  MAX_DISTANCE_MULTIPLIER: 3,
} as const;

/**
 * Nebula background parameters
 */
export const NEBULA_BACKGROUND = {
  /** Nebula density (0-1) */
  DENSITY: 0.7,

  /** Nebula sphere radius */
  RADIUS: 480,
} as const;

/**
 * Scene canvas properties
 */
export const SCENE_CANVAS = {
  /** Canvas background color */
  BACKGROUND_COLOR: 'black',
} as const;
