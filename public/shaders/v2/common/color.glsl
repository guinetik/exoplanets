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
const float PI = 3.14159265359;                     // Pi constant
const float TAU = 6.28318530718;                    // 2 * PI - full hue rotation

// --- Luminance Weights ---
// sRGB luminance coefficients (ITU-R BT.709)
const vec3 LUMINANCE_WEIGHTS = vec3(0.2126, 0.7152, 0.0722);

// =============================================================================
// BLACKBODY RADIATION CONSTANTS
// =============================================================================

// Temperature ranges for blackbody approximation
// Extended to cover brown dwarfs (Y, T, L types)
const float BLACKBODY_TEMP_MIN = 300.0;             // Kelvin - ultra-cool Y-dwarf
const float BLACKBODY_TEMP_MAX = 40000.0;           // Kelvin - blue-white O-star

// Blackbody color at key temperatures (pre-computed)
// These are approximate sRGB values for stellar/substellar temperatures
// Note: T and Y dwarfs deviate from blackbody due to methane absorption

// Brown dwarfs (substellar objects)
const vec3 TEMP_300K = vec3(0.35, 0.2, 0.45);      // Dark purple (Y-dwarf, ultra-cool)
const vec3 TEMP_500K = vec3(0.5, 0.25, 0.55);      // Purple (Y-dwarf)
const vec3 TEMP_800K = vec3(0.6, 0.27, 0.65);      // Magenta-purple (T-dwarf, methane)
const vec3 TEMP_1300K = vec3(0.8, 0.3, 0.35);      // Deep red-magenta (L-dwarf boundary)

// Main sequence stars
const vec3 TEMP_2000K = vec3(1.0, 0.35, 0.1);      // Deep red (late L-dwarf/early M)
const vec3 TEMP_3000K = vec3(1.0, 0.65, 0.35);     // Orange-red (M-dwarf)
const vec3 TEMP_4000K = vec3(1.0, 0.78, 0.55);     // Orange (K-dwarf)
const vec3 TEMP_5778K = vec3(1.0, 0.96, 0.91);     // Yellow-white (Sun, G-type)
const vec3 TEMP_7500K = vec3(0.92, 0.93, 1.0);     // White (F-type)
const vec3 TEMP_10000K = vec3(0.80, 0.85, 1.0);    // Blue-white (A-type)
const vec3 TEMP_20000K = vec3(0.70, 0.78, 1.0);    // Blue (B-type)
const vec3 TEMP_40000K = vec3(0.62, 0.72, 1.0);    // Deep blue (O-type)

// Temperature boundaries for interpolation
const float TEMP_BD_1 = 500.0;   // Y to T transition
const float TEMP_BD_2 = 800.0;   // T-dwarf peak methane
const float TEMP_BD_3 = 1300.0;  // T to L transition
const float TEMP_BD_4 = 2000.0;  // L to M transition
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
 * Extended to cover brown dwarfs (Y, T, L types) with methane absorption colors
 *
 * @param tempK - Temperature in Kelvin (300-40000 range)
 * @return RGB color approximation
 */
vec3 temperatureToColor(float tempK) {
    tempK = clamp(tempK, BLACKBODY_TEMP_MIN, BLACKBODY_TEMP_MAX);

    // Brown dwarf range (Y, T, L types) - non-blackbody due to methane
    if (tempK < TEMP_BD_1) {
        // Ultra-cool Y-dwarfs (300-500 K)
        float t = (tempK - BLACKBODY_TEMP_MIN) / (TEMP_BD_1 - BLACKBODY_TEMP_MIN);
        return mix(TEMP_300K, TEMP_500K, t);
    } else if (tempK < TEMP_BD_2) {
        // T-dwarfs with methane absorption (500-800 K) - peak magenta
        float t = (tempK - TEMP_BD_1) / (TEMP_BD_2 - TEMP_BD_1);
        return mix(TEMP_500K, TEMP_800K, t);
    } else if (tempK < TEMP_BD_3) {
        // Late T to early L transition (800-1300 K)
        float t = (tempK - TEMP_BD_2) / (TEMP_BD_3 - TEMP_BD_2);
        return mix(TEMP_800K, TEMP_1300K, t);
    } else if (tempK < TEMP_BD_4) {
        // L-dwarfs (1300-2000 K) - transitioning to red
        float t = (tempK - TEMP_BD_3) / (TEMP_BD_4 - TEMP_BD_3);
        return mix(TEMP_1300K, TEMP_2000K, t);
    } else if (tempK < TEMP_BOUND_1) {
        // Late L to M transition (2000-3000 K)
        float t = (tempK - TEMP_BD_4) / (TEMP_BOUND_1 - TEMP_BD_4);
        return mix(TEMP_2000K, TEMP_3000K, t);
    }
    // Main sequence stars
    else if (tempK < TEMP_BOUND_2) {
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

// =============================================================================
// PHYSICAL COLOR GENERATION
// =============================================================================

// Temperature gradient colors (cold to hot)
const vec3 PHYS_TEMP_COLD = vec3(0.6, 0.75, 0.9);      // Icy blue
const vec3 PHYS_TEMP_COOL = vec3(0.5, 0.6, 0.65);      // Cool gray-blue
const vec3 PHYS_TEMP_MILD = vec3(0.55, 0.5, 0.45);     // Earthy gray
const vec3 PHYS_TEMP_WARM = vec3(0.7, 0.55, 0.4);      // Warm tan
const vec3 PHYS_TEMP_HOT = vec3(0.85, 0.45, 0.3);      // Hot orange

// Composition gradient colors (gas to rock)
const vec3 PHYS_COMP_GAS = vec3(0.75, 0.7, 0.6);       // Gas giant tan
const vec3 PHYS_COMP_ICE = vec3(0.65, 0.7, 0.8);       // Ice blue-gray
const vec3 PHYS_COMP_ROCK = vec3(0.6, 0.5, 0.45);      // Rocky brown

/**
 * Generate physically-accurate base color from planet properties
 * Uses NASA data factors to create data-driven variety
 *
 * @param tempFactor - Temperature factor (0 = cold/200K, 1 = hot/2500K)
 * @param compFactor - Composition factor (0 = gas, 0.5 = ice, 1 = rock)
 * @param irradFactor - Irradiation factor (0 = dim, 1 = bright)
 * @param metalFactor - Metallicity factor (0 = metal-poor, 1 = metal-rich)
 * @param seed - Seed for variation (0-1)
 * @return RGB base color
 */
vec3 physicalPlanetColor(float tempFactor, float compFactor, float irradFactor, float metalFactor, float seed) {
    // Temperature gradient: cold (blue) to hot (orange/red)
    vec3 tempColor;
    if (tempFactor < 0.25) {
        tempColor = mix(PHYS_TEMP_COLD, PHYS_TEMP_COOL, tempFactor * 4.0);
    } else if (tempFactor < 0.5) {
        tempColor = mix(PHYS_TEMP_COOL, PHYS_TEMP_MILD, (tempFactor - 0.25) * 4.0);
    } else if (tempFactor < 0.75) {
        tempColor = mix(PHYS_TEMP_MILD, PHYS_TEMP_WARM, (tempFactor - 0.5) * 4.0);
    } else {
        tempColor = mix(PHYS_TEMP_WARM, PHYS_TEMP_HOT, (tempFactor - 0.75) * 4.0);
    }

    // Composition gradient: gas (tan) to ice (blue) to rock (brown)
    vec3 compColor;
    if (compFactor < 0.5) {
        compColor = mix(PHYS_COMP_GAS, PHYS_COMP_ICE, compFactor * 2.0);
    } else {
        compColor = mix(PHYS_COMP_ICE, PHYS_COMP_ROCK, (compFactor - 0.5) * 2.0);
    }

    // Blend temperature and composition (temperature dominant for extremes)
    float tempWeight = abs(tempFactor - 0.5) * 2.0; // 0 at middle, 1 at extremes
    vec3 baseColor = mix(compColor, tempColor, tempWeight * 0.7 + 0.3);

    // Metallicity affects color saturation and warmth
    // High metallicity = warmer, more saturated colors
    vec3 baseHSV = rgb2hsv(baseColor);
    baseHSV.y *= 0.8 + metalFactor * 0.4;  // Saturation: 0.8-1.2
    baseHSV.x += (metalFactor - 0.5) * 0.05; // Slight hue shift
    baseColor = hsv2rgb(baseHSV);

    // Irradiation affects brightness
    // High irradiation = brighter, slightly washed out
    baseColor = mix(baseColor, baseColor * 1.2 + vec3(0.05), irradFactor * 0.3);

    // Add seed-based variation for uniqueness
    vec3 seedHSV = rgb2hsv(baseColor);
    float seedHue = fract(seed * 0.1031 + seed * seed * 0.0973);
    seedHSV.x = fract(seedHSV.x + (seedHue - 0.5) * 0.1); // ±5% hue variation
    seedHSV.y *= 0.9 + seedHue * 0.2; // ±10% saturation variation

    return hsv2rgb(seedHSV);
}

