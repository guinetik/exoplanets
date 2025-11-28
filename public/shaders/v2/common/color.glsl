/**
 * Shared Color Functions for V2 Shaders
 * 
 * Provides:
 * - RGB <-> HSV conversion
 * - Hue rotation
 * - Palette interpolation
 * - Color temperature (blackbody)
 * - Contrast and saturation adjustments
 */

// =============================================================================
// COLOR SPACE CONSTANTS
// =============================================================================

// --- HSV to RGB Constants ---
// These define the sector boundaries for hue mapping
const vec4 HSV_TO_RGB_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);

// --- RGB to HSV Constants ---
const vec4 RGB_TO_HSV_K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
const float RGB_TO_HSV_EPSILON = 1.0e-10;           // Prevents division by zero

// --- Hue Rotation ---
const float TAU = 6.28318530718;                    // 2 * PI - full hue rotation

// --- Luminance Weights ---
// sRGB luminance coefficients (ITU-R BT.709)
const vec3 LUMINANCE_WEIGHTS = vec3(0.2126, 0.7152, 0.0722);

// =============================================================================
// BLACKBODY RADIATION CONSTANTS
// =============================================================================

// Temperature ranges for blackbody approximation
const float BLACKBODY_TEMP_MIN = 1000.0;            // Kelvin - deep red
const float BLACKBODY_TEMP_MAX = 40000.0;           // Kelvin - blue-white

// Blackbody color at key temperatures (pre-computed)
// These are approximate sRGB values for stellar temperatures
const vec3 TEMP_1000K = vec3(1.0, 0.22, 0.0);      // Deep red (dying ember)
const vec3 TEMP_3000K = vec3(1.0, 0.65, 0.35);     // Orange-red (M-dwarf)
const vec3 TEMP_4000K = vec3(1.0, 0.78, 0.55);     // Orange (K-dwarf)
const vec3 TEMP_5778K = vec3(1.0, 0.96, 0.91);     // Yellow-white (Sun, G-type)
const vec3 TEMP_7500K = vec3(0.92, 0.93, 1.0);     // White (F-type)
const vec3 TEMP_10000K = vec3(0.80, 0.85, 1.0);    // Blue-white (A-type)
const vec3 TEMP_20000K = vec3(0.70, 0.78, 1.0);    // Blue (B-type)
const vec3 TEMP_40000K = vec3(0.62, 0.72, 1.0);    // Deep blue (O-type)

// Temperature boundaries for interpolation
const float TEMP_BOUND_1 = 3000.0;
const float TEMP_BOUND_2 = 4000.0;
const float TEMP_BOUND_3 = 5778.0;
const float TEMP_BOUND_4 = 7500.0;
const float TEMP_BOUND_5 = 10000.0;
const float TEMP_BOUND_6 = 20000.0;

// =============================================================================
// COLOR SPACE CONVERSION
// =============================================================================

/**
 * Convert RGB to HSV
 * 
 * @param c - RGB color (0-1 range)
 * @return HSV color where H is in [0,1], S and V are in [0,1]
 */
vec3 rgb2hsv(vec3 c) {
    vec4 p = mix(vec4(c.bg, RGB_TO_HSV_K.wz), vec4(c.gb, RGB_TO_HSV_K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    return vec3(
        abs(q.z + (q.w - q.y) / (6.0 * d + RGB_TO_HSV_EPSILON)),
        d / (q.x + RGB_TO_HSV_EPSILON),
        q.x
    );
}

/**
 * Convert HSV to RGB
 * 
 * @param c - HSV color where H is in [0,1], S and V are in [0,1]
 * @return RGB color (0-1 range)
 */
vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + HSV_TO_RGB_K.xyz) * 6.0 - HSV_TO_RGB_K.www);
    return c.z * mix(HSV_TO_RGB_K.xxx, clamp(p - HSV_TO_RGB_K.xxx, 0.0, 1.0), c.y);
}

/**
 * Rotate hue by a given amount
 * 
 * @param color - RGB color
 * @param amount - Rotation amount (0-1 = full rotation)
 * @return Color with rotated hue
 */
vec3 hueRotate(vec3 color, float amount) {
    vec3 hsv = rgb2hsv(color);
    hsv.x = fract(hsv.x + amount);
    return hsv2rgb(hsv);
}

/**
 * Shift hue towards a target hue
 * 
 * @param color - RGB color
 * @param targetHue - Target hue (0-1)
 * @param strength - Blend strength (0 = none, 1 = full shift)
 * @return Color with shifted hue
 */
vec3 hueShift(vec3 color, float targetHue, float strength) {
    vec3 hsv = rgb2hsv(color);
    hsv.x = mix(hsv.x, targetHue, strength);
    return hsv2rgb(hsv);
}

// =============================================================================
// SATURATION AND CONTRAST
// =============================================================================

/**
 * Calculate luminance of an RGB color
 * Named with v2_ prefix to avoid conflicts with THREE.js built-ins
 * 
 * @param color - RGB color
 * @return Luminance value (0-1)
 */
float v2_luminance(vec3 color) {
    return dot(color, LUMINANCE_WEIGHTS);
}

/**
 * Adjust saturation of a color
 * 
 * @param color - RGB color
 * @param amount - Saturation multiplier (0 = grayscale, 1 = unchanged, >1 = more saturated)
 * @return Color with adjusted saturation
 */
vec3 adjustSaturation(vec3 color, float amount) {
    float lum = v2_luminance(color);
    return mix(vec3(lum), color, amount);
}

/**
 * Adjust contrast of a color
 * 
 * @param color - RGB color
 * @param amount - Contrast multiplier (0 = flat gray, 1 = unchanged, >1 = more contrast)
 * @return Color with adjusted contrast
 */
vec3 adjustContrast(vec3 color, float amount) {
    return (color - 0.5) * amount + 0.5;
}

/**
 * Apply gamma correction
 * 
 * @param color - Linear RGB color
 * @param gamma - Gamma value (2.2 for sRGB)
 * @return Gamma-corrected color
 */
vec3 gammaCorrect(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
}

// =============================================================================
// BLACKBODY / TEMPERATURE TO COLOR
// =============================================================================

/**
 * Convert temperature (Kelvin) to approximate RGB color
 * Uses piecewise linear interpolation between key stellar temperatures
 * 
 * @param tempK - Temperature in Kelvin (1000-40000 range)
 * @return RGB color approximation
 */
vec3 temperatureToColor(float tempK) {
    tempK = clamp(tempK, BLACKBODY_TEMP_MIN, BLACKBODY_TEMP_MAX);
    
    if (tempK < TEMP_BOUND_1) {
        float t = (tempK - BLACKBODY_TEMP_MIN) / (TEMP_BOUND_1 - BLACKBODY_TEMP_MIN);
        return mix(TEMP_1000K, TEMP_3000K, t);
    } else if (tempK < TEMP_BOUND_2) {
        float t = (tempK - TEMP_BOUND_1) / (TEMP_BOUND_2 - TEMP_BOUND_1);
        return mix(TEMP_3000K, TEMP_4000K, t);
    } else if (tempK < TEMP_BOUND_3) {
        float t = (tempK - TEMP_BOUND_2) / (TEMP_BOUND_3 - TEMP_BOUND_2);
        return mix(TEMP_4000K, TEMP_5778K, t);
    } else if (tempK < TEMP_BOUND_4) {
        float t = (tempK - TEMP_BOUND_3) / (TEMP_BOUND_4 - TEMP_BOUND_3);
        return mix(TEMP_5778K, TEMP_7500K, t);
    } else if (tempK < TEMP_BOUND_5) {
        float t = (tempK - TEMP_BOUND_4) / (TEMP_BOUND_5 - TEMP_BOUND_4);
        return mix(TEMP_7500K, TEMP_10000K, t);
    } else if (tempK < TEMP_BOUND_6) {
        float t = (tempK - TEMP_BOUND_5) / (TEMP_BOUND_6 - TEMP_BOUND_5);
        return mix(TEMP_10000K, TEMP_20000K, t);
    } else {
        float t = (tempK - TEMP_BOUND_6) / (BLACKBODY_TEMP_MAX - TEMP_BOUND_6);
        return mix(TEMP_20000K, TEMP_40000K, t);
    }
}

/**
 * Get star color tint based on host star temperature
 * Returns a subtle tint to apply to planet surfaces
 * Preserves brightness while shifting hue for cool/hot stars
 * 
 * @param starTempK - Star temperature in Kelvin
 * @return RGB tint color (multiply with surface color)
 */
vec3 starLightTint(float starTempK) {
    vec3 starColor = temperatureToColor(starTempK);
    
    // Normalize to preserve brightness (cool stars shouldn't darken planets)
    float maxComp = max(starColor.r, max(starColor.g, starColor.b));
    vec3 normalizedStar = starColor / maxComp;
    
    // Very subtle tinting - just shifts the hue slightly
    vec3 tint = mix(vec3(1.0), normalizedStar, 0.25);
    
    // Boost brightness for cool stars (M-dwarfs like TRAPPIST-1)
    // They emit less visible light, but planets shouldn't appear too dark
    float coolBoost = smoothstep(4000.0, 2500.0, starTempK) * 0.15;
    tint += vec3(coolBoost);
    
    return tint;
}

// =============================================================================
// PALETTE INTERPOLATION
// =============================================================================

/**
 * Cosine gradient palette (Inigo Quilez technique)
 * Creates smooth, customizable color gradients
 * 
 * @param t - Input value (0-1)
 * @param a - Base color (center of palette)
 * @param b - Amplitude (color range)
 * @param c - Frequency (oscillation speed)
 * @param d - Phase (starting point)
 * @return RGB color from palette
 */
vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
}

/**
 * Preset: Sunset/lava palette
 */
vec3 paletteLava(float t) {
    return cosinePalette(t,
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(1.0, 0.7, 0.4),
        vec3(0.0, 0.15, 0.20)
    );
}

/**
 * Preset: Ocean/ice palette
 */
vec3 paletteOcean(float t) {
    return cosinePalette(t,
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(1.0, 1.0, 1.0),
        vec3(0.0, 0.10, 0.20)
    );
}

/**
 * Preset: Forest/vegetation palette
 */
vec3 paletteForest(float t) {
    return cosinePalette(t,
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(1.0, 1.0, 0.5),
        vec3(0.8, 0.90, 0.30)
    );
}

/**
 * Preset: Gas giant bands palette
 */
vec3 paletteGasGiant(float t) {
    return cosinePalette(t,
        vec3(0.6, 0.5, 0.4),
        vec3(0.3, 0.25, 0.2),
        vec3(1.0, 1.0, 1.0),
        vec3(0.0, 0.05, 0.10)
    );
}

// =============================================================================
// COLOR BLENDING
// =============================================================================

/**
 * Blend two colors using soft light blending mode
 * Good for subtle color overlays
 * 
 * @param base - Base color
 * @param blend - Blend color
 * @return Blended color
 */
vec3 softLight(vec3 base, vec3 blend) {
    return mix(
        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
        2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
        step(0.5, blend)
    );
}

/**
 * Blend two colors using overlay blending mode
 * Increases contrast
 * 
 * @param base - Base color
 * @param blend - Blend color
 * @return Blended color
 */
vec3 overlay(vec3 base, vec3 blend) {
    return mix(
        2.0 * base * blend,
        1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
        step(0.5, base)
    );
}

