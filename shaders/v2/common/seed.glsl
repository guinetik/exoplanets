/**
 * Seed-Based Variation Functions for V2 Shaders
 * 
 * Provides consistent, deterministic variation based on planet seed.
 * Same seed always produces same appearance, different seeds look distinct.
 * 
 * Provides:
 * - Scale variation
 * - Rotation/phase offsets
 * - Color shifting
 * - Feature toggles
 * - Coordinate warping
 * 
 * REQUIRES: color.glsl must be included before this file (provides TAU constant)
 */

// =============================================================================
// SEED VARIATION CONSTANTS
// =============================================================================

// --- Scale Variation ---
const float SCALE_MIN = 0.7;           // Minimum feature scale
const float SCALE_MAX = 1.4;           // Maximum feature scale
const float SCALE_RANGE = 0.7;         // SCALE_MAX - SCALE_MIN

// --- Rotation/Phase ---
// TAU is defined in color.glsl
const float PHASE_RANGE = 100.0;       // Range for noise phase offset

// --- Color Variation ---
const float HUE_SHIFT_MAX = 0.15;      // Maximum hue rotation (15% of spectrum)
const float SAT_SHIFT_MIN = 0.85;      // Minimum saturation multiplier
const float SAT_SHIFT_RANGE = 0.3;     // Saturation variation range
const float VAL_SHIFT_MIN = 0.9;       // Minimum value/brightness multiplier
const float VAL_SHIFT_RANGE = 0.2;     // Value variation range

// --- Feature Probability ---
// Thresholds for seed-based feature toggles
const float FEATURE_RARE = 0.15;        // ~15% chance
const float FEATURE_UNCOMMON = 0.35;    // ~35% chance
const float FEATURE_COMMON = 0.65;      // ~65% chance
const float FEATURE_VERY_COMMON = 0.85; // ~85% chance

// --- Coordinate Warping ---
const float UV_OFFSET_SCALE = 10.0;     // Scale for UV coordinate offset

// --- Hash Constants ---
// Using integer-based constants for stable hashing (avoids sin() precision issues)
const float HASH_K1 = 0.1031;
const float HASH_K2 = 0.1030;
const float HASH_K3 = 0.0973;
const float HASH_K4 = 33.33;

// =============================================================================
// SEED HASHING
// =============================================================================

/**
 * Generate a pseudo-random value from seed
 * Same seed always returns same value
 *
 * Uses integer-based hashing instead of sin() to avoid Chrome/ANGLE
 * floating-point precision issues that cause flickering.
 *
 * @param seed - Input seed (0-1)
 * @return Pseudo-random value (0-1)
 */
float seedHash(float seed) {
    // Use fract-based hash (Dave Hoskins' technique) - avoids sin() precision issues
    vec3 p3 = fract(vec3(seed) * vec3(HASH_K1, HASH_K2, HASH_K3));
    p3 += dot(p3, p3.yzx + HASH_K4);
    return fract((p3.x + p3.y) * p3.z);
}

/**
 * Generate multiple independent values from one seed
 * Uses different offsets to create uncorrelated outputs
 * 
 * @param seed - Input seed (0-1)
 * @param index - Which value to generate (0, 1, 2, ...)
 * @return Pseudo-random value (0-1)
 */
float seedHashN(float seed, float index) {
    return seedHash(seed * (index + 1.0) + index * 0.123);
}

/**
 * Generate a vec2 from seed
 * 
 * @param seed - Input seed (0-1)
 * @return Pseudo-random vec2 (each component 0-1)
 */
vec2 seedHash2(float seed) {
    return vec2(
        seedHashN(seed, 0.0),
        seedHashN(seed, 1.0)
    );
}

/**
 * Generate a vec3 from seed
 * 
 * @param seed - Input seed (0-1)
 * @return Pseudo-random vec3 (each component 0-1)
 */
vec3 seedHash3(float seed) {
    return vec3(
        seedHashN(seed, 0.0),
        seedHashN(seed, 1.0),
        seedHashN(seed, 2.0)
    );
}

// =============================================================================
// SCALE VARIATION
// =============================================================================

/**
 * Get feature scale multiplier from seed
 * Varies feature sizes while maintaining visual coherence
 * 
 * @param seed - Planet seed (0-1)
 * @return Scale multiplier (SCALE_MIN to SCALE_MAX)
 */
float seedScale(float seed) {
    return SCALE_MIN + seedHash(seed) * SCALE_RANGE;
}

/**
 * Get multiple scale factors for layered features
 * 
 * @param seed - Planet seed (0-1)
 * @return vec3 of scale multipliers for different layers
 */
vec3 seedScales(float seed) {
    return vec3(
        SCALE_MIN + seedHashN(seed, 0.0) * SCALE_RANGE,
        SCALE_MIN + seedHashN(seed, 1.0) * SCALE_RANGE,
        SCALE_MIN + seedHashN(seed, 2.0) * SCALE_RANGE
    );
}

// =============================================================================
// ROTATION / PHASE VARIATION
// =============================================================================

/**
 * Get rotation angle from seed
 * For rotating textures/features
 * 
 * @param seed - Planet seed (0-1)
 * @return Rotation angle in radians (0 to 2*PI)
 */
float seedRotation(float seed) {
    return seedHash(seed + 0.5) * TAU;
}

/**
 * Get noise phase offset from seed
 * Shifts where patterns appear on the surface
 * 
 * @param seed - Planet seed (0-1)
 * @return Phase offset value
 */
float seedPhase(float seed) {
    return seedHash(seed + 0.7) * PHASE_RANGE;
}

/**
 * Get 3D phase offset for noise sampling
 * 
 * @param seed - Planet seed (0-1)
 * @return 3D offset vector
 */
vec3 seedPhase3D(float seed) {
    return seedHash3(seed + 0.7) * PHASE_RANGE;
}

/**
 * Rotate 2D coordinates by seed-derived angle
 * 
 * @param uv - Input coordinates
 * @param seed - Planet seed (0-1)
 * @return Rotated coordinates
 */
vec2 seedRotateUV(vec2 uv, float seed) {
    float angle = seedRotation(seed);
    float c = cos(angle);
    float s = sin(angle);
    return vec2(
        c * uv.x - s * uv.y,
        s * uv.x + c * uv.y
    );
}

/**
 * Rotate a 3D vector by seed-derived angles
 * Applies rotation around Y axis (longitude) and X axis (latitude tilt)
 * This is used to transform sphere positions for seamless noise sampling
 * 
 * @param v - Input 3D vector (typically normalized position on sphere)
 * @param seed - Planet seed (0-1)
 * @return Rotated 3D vector
 */
vec3 rotateVectorBySeed(vec3 v, float seed) {
    // Get two rotation angles from seed
    float angleY = seedHashN(seed, 5.0) * TAU;  // Rotation around Y
    float angleX = (seedHashN(seed, 6.0) - 0.5) * 1.5;  // Slight tilt (-0.75 to 0.75 rad)
    
    // Rotate around Y axis first
    float cy = cos(angleY);
    float sy = sin(angleY);
    vec3 rotY = vec3(
        cy * v.x + sy * v.z,
        v.y,
        -sy * v.x + cy * v.z
    );
    
    // Then rotate around X axis for tilt
    float cx = cos(angleX);
    float sx = sin(angleX);
    return vec3(
        rotY.x,
        cx * rotY.y - sx * rotY.z,
        sx * rotY.y + cx * rotY.z
    );
}

// =============================================================================
// COLOR VARIATION
// =============================================================================

/**
 * Get hue shift amount from seed
 * 
 * @param seed - Planet seed (0-1)
 * @return Hue shift (0 to HUE_SHIFT_MAX)
 */
float seedHueShift(float seed) {
    // Use signed shift for variety (can shift either direction)
    return (seedHash(seed + 0.3) - 0.5) * 2.0 * HUE_SHIFT_MAX;
}

/**
 * Get saturation multiplier from seed
 * 
 * @param seed - Planet seed (0-1)
 * @return Saturation multiplier (SAT_SHIFT_MIN to SAT_SHIFT_MIN + SAT_SHIFT_RANGE)
 */
float seedSaturation(float seed) {
    return SAT_SHIFT_MIN + seedHash(seed + 0.4) * SAT_SHIFT_RANGE;
}

/**
 * Get value/brightness multiplier from seed
 * 
 * @param seed - Planet seed (0-1)
 * @return Value multiplier (VAL_SHIFT_MIN to VAL_SHIFT_MIN + VAL_SHIFT_RANGE)
 */
float seedValue(float seed) {
    return VAL_SHIFT_MIN + seedHash(seed + 0.6) * VAL_SHIFT_RANGE;
}

/**
 * Apply seed-based color variation to HSV color
 * 
 * @param hsv - Input HSV color
 * @param seed - Planet seed (0-1)
 * @return Modified HSV color
 */
vec3 seedVaryHSV(vec3 hsv, float seed) {
    hsv.x = fract(hsv.x + seedHueShift(seed));
    hsv.y *= seedSaturation(seed);
    hsv.z *= seedValue(seed);
    return hsv;
}

/**
 * Blend between two colors based on seed
 * 
 * @param colorA - First color
 * @param colorB - Second color
 * @param seed - Planet seed (0-1)
 * @return Blended color
 */
vec3 seedBlendColors(vec3 colorA, vec3 colorB, float seed) {
    return mix(colorA, colorB, seedHash(seed + 0.8));
}

// =============================================================================
// FEATURE TOGGLES
// =============================================================================

/**
 * Check if a rare feature should appear
 * ~15% chance based on seed
 * 
 * @param seed - Planet seed (0-1)
 * @param featureIndex - Which feature to check
 * @return true if feature should appear
 */
bool seedHasRareFeature(float seed, float featureIndex) {
    return seedHashN(seed, featureIndex + 10.0) < FEATURE_RARE;
}

/**
 * Check if an uncommon feature should appear
 * ~35% chance based on seed
 * 
 * @param seed - Planet seed (0-1)
 * @param featureIndex - Which feature to check
 * @return true if feature should appear
 */
bool seedHasUncommonFeature(float seed, float featureIndex) {
    return seedHashN(seed, featureIndex + 10.0) < FEATURE_UNCOMMON;
}

/**
 * Check if a common feature should appear
 * ~65% chance based on seed
 * 
 * @param seed - Planet seed (0-1)
 * @param featureIndex - Which feature to check
 * @return true if feature should appear
 */
bool seedHasCommonFeature(float seed, float featureIndex) {
    return seedHashN(seed, featureIndex + 10.0) < FEATURE_COMMON;
}

/**
 * Get a feature intensity (0-1) from seed
 * For features that vary in strength
 * 
 * @param seed - Planet seed (0-1)
 * @param featureIndex - Which feature
 * @return Intensity value (0-1)
 */
float seedFeatureIntensity(float seed, float featureIndex) {
    return seedHashN(seed, featureIndex + 20.0);
}

// =============================================================================
// COORDINATE VARIATION
// =============================================================================

/**
 * Offset UV coordinates based on seed
 * Makes each planet start at a different "location"
 * 
 * @param uv - Input UV coordinates
 * @param seed - Planet seed (0-1)
 * @return Offset UV coordinates
 */
vec2 seedOffsetUV(vec2 uv, float seed) {
    vec2 offset = seedHash2(seed) * UV_OFFSET_SCALE;
    return uv + offset;
}

/**
 * Offset 3D coordinates based on seed
 * For 3D noise sampling
 * 
 * @param pos - Input 3D position
 * @param seed - Planet seed (0-1)
 * @return Offset position
 */
vec3 seedOffset3D(vec3 pos, float seed) {
    vec3 offset = seedHash3(seed) * UV_OFFSET_SCALE;
    return pos + offset;
}

/**
 * Apply full coordinate variation
 * Combines offset and rotation for maximum variation
 * 
 * @param uv - Input UV coordinates
 * @param seed - Planet seed (0-1)
 * @return Transformed UV coordinates
 */
vec2 seedTransformUV(vec2 uv, float seed) {
    // First offset
    vec2 transformed = seedOffsetUV(uv, seed);
    // Then rotate
    transformed = seedRotateUV(transformed, seed);
    return transformed;
}

// =============================================================================
// BAND / STRIPE VARIATION (for gas giants)
// =============================================================================

/**
 * Get band count multiplier from seed
 * Varies number of atmospheric bands
 * 
 * @param seed - Planet seed (0-1)
 * @param baseCount - Base number of bands
 * @return Modified band count (as float for smooth variation)
 */
float seedBandCount(float seed, float baseCount) {
    float variation = seedHash(seed + 0.9) * 0.6 + 0.7;  // 0.7 to 1.3x
    return baseCount * variation;
}

/**
 * Get band width variation from seed
 * Makes some bands thicker/thinner
 * 
 * @param seed - Planet seed (0-1)
 * @param latitude - Latitude on planet (-1 to 1)
 * @return Width multiplier for band at this latitude
 */
float seedBandWidth(float seed, float latitude) {
    // Use latitude to vary which bands are affected
    float localSeed = seedHash(seed + latitude * 3.0);
    return 0.5 + localSeed;  // 0.5 to 1.5x width
}

// =============================================================================
// STORM / SPOT VARIATION (for gas giants)
// =============================================================================

/**
 * Get storm position based on seed
 * Returns latitude/longitude for a storm feature
 * 
 * @param seed - Planet seed (0-1)
 * @param stormIndex - Which storm (0, 1, 2, ...)
 * @return vec2(latitude, longitude) normalized to 0-1
 */
vec2 seedStormPosition(float seed, float stormIndex) {
    float lat = seedHashN(seed, stormIndex * 2.0);
    float lon = seedHashN(seed, stormIndex * 2.0 + 1.0);
    // Bias storms towards mid-latitudes (more realistic)
    lat = 0.2 + lat * 0.6;  // 0.2 to 0.8
    return vec2(lat, lon);
}

/**
 * Get storm size based on seed
 * 
 * @param seed - Planet seed (0-1)
 * @param stormIndex - Which storm
 * @return Storm size multiplier
 */
float seedStormSize(float seed, float stormIndex) {
    return 0.02 + seedHashN(seed, stormIndex + 30.0) * 0.08;  // 2% to 10% of surface
}

