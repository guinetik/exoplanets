/**
 * Rocky Planet Fragment Shader
 * Creates terrestrial worlds with terrain, craters, and possible atmosphere
 * Works for Earth-like, Super-Earths, Mars-like, and barren rocky worlds
 *
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uTemperature; // Equilibrium temperature
uniform float uHasAtmosphere; // 0.0 = no atmosphere, 1.0 = thick atmosphere
uniform float uSeed; // Unique seed per planet for color variation

// New data-driven uniforms
uniform float uDensity;      // 0-1 normalized (low=puffy/volatile-rich, high=dense/iron-rich)
uniform float uInsolation;   // 0-1 normalized (energy from star, affects surface activity)
uniform float uStarTemp;     // Host star temperature in Kelvin (for lighting tint)
uniform float uDetailLevel;  // 0=simple colors for StarSystem, 1=full detail for Planet page

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// SHADER CONSTANTS - Magic Numbers Extracted
// =============================================================================

// --- Simplex Noise Constants ---
// LEARNING: vec4 C contains pre-computed mathematical constants used in the
// Simplex noise algorithm. These aren't arbitrary - they're derived from:
// - sqrt(3) and other geometric ratios
// They're part of the algorithm specification and shouldn't be changed.
const float MOD_DIVISOR = 289.0;
const float SIMPLEX_SKEW_FACTOR_1 = 0.211324865405187; // (3 - sqrt(3)) / 6
const float SIMPLEX_UNSKEW_FACTOR = 0.366025403784439; // 0.5 * (sqrt(3) - 1)
const float SIMPLEX_SKEW_FACTOR_2 = -0.577350269189626; // -1 / sqrt(3)
const float SIMPLEX_PERMUTE_SCALE = 0.024390243902439; // 1 / 41
const float NOISE_NORMALIZE = 130.0; // Final scaling for noise output
const float NOISE_GRADIENT_THRESHOLD = 0.5; // Distance threshold for gradients
const float TAYLOR_APPROX_A = 1.79284291400159; // Taylor series coefficient A
const float TAYLOR_APPROX_B = 0.85373472095314; // Taylor series coefficient B

// --- HSV Color Space Constants ---
// LEARNING: vec4 K in HSV functions contains color space transformation values.
// These are used to convert between RGB and HSV color spaces.
// Each component maps to a specific calculation in the color space conversion.
const float HSV_TO_RGB_K1 = 1.0; // Hue sector multiplier
const float HSV_TO_RGB_K2 = 2.0 / 3.0; // Offset 1 for RGB sectors
const float HSV_TO_RGB_K3 = 1.0 / 3.0; // Offset 2 for RGB sectors
const float HSV_TO_RGB_K4 = 3.0; // Sector boundary

const float RGB_TO_HSV_K1 = 0.0; // Lower bound
const float RGB_TO_HSV_K2 = -1.0 / 3.0; // Sector offset 1
const float RGB_TO_HSV_K3 = 2.0 / 3.0; // Sector offset 2
const float RGB_TO_HSV_K4 = -1.0; // Sector offset 3
const float RGB_TO_HSV_EPSILON = 1.0e-10; // Prevents division by zero

// --- Terrain Generation ---
const float TERRAIN_SCALE_BASE = 3.0; // Base scale for terrain features
const float TERRAIN_SCALE_SEED_RANGE = 3.0; // How much seed affects scale
const float TERRAIN_OCTAVE_1_MULT = 1.0; // First octave multiplier
const float TERRAIN_OCTAVE_2_MULT = 2.0; // Second octave multiplier
const float TERRAIN_OCTAVE_3_MULT = 4.0; // Third octave multiplier
const float TERRAIN_OCTAVE_1_AMP = 0.5; // First octave amplitude
const float TERRAIN_OCTAVE_2_AMP = 0.25; // Second octave amplitude
const float TERRAIN_OCTAVE_3_AMP = 0.125; // Third octave amplitude
const float TERRAIN_OCTAVE_TOTAL = 1.875; // Sum of amplitudes (for normalization)

// --- Temperature Thresholds ---
// These determine when planet changes from icy → temperate → volcanic
const float TEMP_ICE_LOW = 180.0; // Below this: icy surface
const float TEMP_ICE_HIGH = 250.0; // Above this: not icy
const float TEMP_VOLCANIC_LOW = 400.0; // Below this: not volcanic
const float TEMP_VOLCANIC_HIGH = 800.0; // Above this: volcanic surface

// --- Color Palettes ---
// Base terrain colors (modified by temperature)
const float LOWLAND_BRIGHTNESS = 0.7; // Lowlands are darker
const float HIGHLAND_BRIGHTNESS = 1.2; // Highlands are brighter
const float PEAK_BRIGHTNESS = 1.4; // Peaks are brightest

// Ice world colors
const float ICE_BASE_RED = 0.8;
const float ICE_SEED_RED_RANGE = 0.15;
const float ICE_BASE_GREEN = 0.85;
const float ICE_SEED_GREEN_RANGE = 0.1;
const float ICE_BASE_BLUE = 0.9;
const float ICE_SEED_BLUE_RANGE = 0.1;

const float ICE_LOWLAND_TINT = 0.6; // Ice tint on lowlands
const float ICE_HIGHLAND_TINT = 0.8; // Ice tint on highlands
const float ICE_PEAK_TINT = 1.0; // Ice tint on peaks

// Volcanic world colors
const float LAVA_RED = 1.0;
const float LAVA_GREEN_BASE = 0.2;
const float LAVA_GREEN_SEED_RANGE = 0.3;
const float LAVA_BLUE_BASE = 0.05;
const float LAVA_BLUE_SEED_RANGE = 0.15;

const float ASH_RED_BASE = 0.15;
const float ASH_RED_SEED_RANGE = 0.1;
const float ASH_GREEN_BASE = 0.1;
const float ASH_GREEN_SEED_RANGE = 0.1;
const float ASH_BLUE_BASE = 0.05;
const float ASH_BLUE_SEED_RANGE = 0.1;

const float VOLCANIC_LOWLAND_MIX = 0.5; // How much lava affects lowlands
const float VOLCANIC_LAVA_BRIGHTNESS = 0.8; // Lava color tint level
const float VOLCANIC_ASH_TINT = 1.0; // Ash color tint level

// --- Terrain Feature Scales ---
// Craters (impact features on airless worlds)
const float CRATER_NOISE_SCALE_BASE = 25.0;
const float CRATER_NOISE_SEED_SCALE = 15.0;
const float CRATER_THRESHOLD_LOW = 0.7;
const float CRATER_THRESHOLD_HIGH = 0.8;
const float CRATER_DARKNESS = 0.3; // How dark craters are

// Lava cracks (fractures on volcanic worlds)
const float LAVA_CRACK_SCALE_BASE = 15.0;
const float LAVA_CRACK_SEED_SCALE = 10.0;
const float LAVA_CRACK_THRESHOLD_LOW = 0.6;
const float LAVA_CRACK_THRESHOLD_HIGH = 0.7;
const float LAVA_CRACK_GLOW = 1.2; // How bright cracks glow
const float LAVA_CRACK_VISIBILITY = 0.6; // How visible cracks are on hot worlds

// Polar ice caps
const float POLAR_CAP_BASE_SIZE = 0.65;
const float POLAR_CAP_SEED_SIZE_RANGE = 0.2;
const float POLAR_CAP_SOFTNESS = 0.15; // Gradient zone width
const float POLAR_CAP_MIN_ATMOSPHERE = 0.3; // Minimum atmosphere for caps
const float POLAR_CAP_MIN_TEMPERATURE = 0.3; // Minimum temperature factor for caps
const float POLAR_CAP_VISIBILITY = 0.7; // How opaque ice caps are

// --- Atmospheric Effects ---
// Clouds
const float CLOUD_SCALE_BASE = 5.0;
const float CLOUD_SCALE_SEED_RANGE = 4.0;
const float CLOUD_TIME_SPEED_1 = 0.01; // First cloud layer speed
const float CLOUD_TIME_SPEED_2 = 0.015; // Second cloud layer speed
const float CLOUD_OCTAVE_1_STRENGTH = 0.5; // First octave contribution
const float CLOUD_OCTAVE_2_STRENGTH = 0.25; // Second octave contribution
const float CLOUD_THRESHOLD = 0.5; // Where clouds become visible
const float CLOUD_THRESHOLD_HIGH = 0.8; // Where clouds fully form
const float CLOUD_MAX_OPACITY = 0.4; // Maximum cloud opacity

// Surface detail (fine noise texture)
const float DETAIL_SCALE = 40.0; // Fine texture scale
const float DETAIL_STRENGTH = 0.05; // How much detail affects color

// Limb darkening (edge darkening effect)
const float LIMB_SMOOTHSTEP_LOW = -0.2;
const float LIMB_SMOOTHSTEP_HIGH = 0.8;
const float LIMB_BASE_DARKNESS = 0.4;
const float LIMB_BRIGHTNESS_RANGE = 0.6;
const vec3 LIMB_VIEW_DIRECTION = vec3(0.0, 0.0, 1.0);

// Atmospheric haze
const float HAZE_POWER = 2.0; // How concentrated haze is at edges
const float HAZE_MAX_OPACITY = 0.3; // Maximum haze opacity

// Haze colors (varies by seed and temperature)
const float HAZE_COOL_RED_BASE = 0.5;
const float HAZE_COOL_RED_SEED = 0.3;
const float HAZE_COOL_GREEN_BASE = 0.6;
const float HAZE_COOL_GREEN_SEED = 0.2;
const float HAZE_COOL_BLUE_BASE = 0.9;
const float HAZE_COOL_BLUE_SEED = 0.1;

const float HAZE_HOT_RED = 1.0;
const float HAZE_HOT_GREEN_BASE = 0.5;
const float HAZE_HOT_GREEN_SEED = 0.2;
const float HAZE_HOT_BLUE_BASE = 0.3;
const float HAZE_HOT_BLUE_SEED = 0.2;

// --- Color Variation from Seed ---
const float HUE_SHIFT_RANGE = 0.15; // Up to 15% hue rotation (subtle but noticeable)
const float SAT_BASE_MULT = 0.85; // Base saturation multiplier (increased to preserve color)
const float SAT_SEED_MULT = 0.3; // Seed contribution to saturation
const float SAT_MIN_CLAMP = 0.35; // Minimum saturation (prevents grey appearance)
const float SAT_MAX_CLAMP = 1.0; // Maximum saturation

// --- UV Offset from Seed ---
const float UV_SEED_OFFSET_X = 10.0; // X-axis offset multiplier
const float UV_SEED_OFFSET_Y = 7.0; // Y-axis offset multiplier

// --- Density Effects ---
// High density = iron-rich (redder), more cratered (impacts retained)
// Low density = volatile-rich (bluer), smoother surface
const float DENSITY_CRATER_MIN = 0.3;    // Minimum crater visibility at low density
const float DENSITY_CRATER_MAX = 1.0;    // Maximum crater visibility at high density
const float DENSITY_ROUGHNESS_MIN = 0.5; // Minimum terrain roughness
const float DENSITY_ROUGHNESS_MAX = 1.5; // Maximum terrain roughness at high density
const float DENSITY_HUE_SHIFT = 0.08;    // Hue shift towards red for high density (iron)
const float DENSITY_SAT_BOOST = 0.2;     // Saturation boost for high density worlds

// --- Insolation Effects ---
// Modifies volcanic/ice thresholds based on actual stellar energy received
const float INSOL_VOLCANIC_BOOST = 200.0;  // Temperature boost from high insolation
const float INSOL_ICE_PENALTY = 100.0;     // Temperature reduction for low insolation
const float INSOL_GLOW_THRESHOLD = 0.7;    // Above this, surface glows from heat
const float INSOL_GLOW_INTENSITY = 0.4;    // How bright the glow is

// --- Star Temperature Effects (Kelvin) ---
const float STAR_TEMP_RED_DWARF = 3500.0;  // M-type stars
const float STAR_TEMP_SUN = 5778.0;        // G-type (Sun-like)
const float STAR_TEMP_HOT = 8000.0;        // A/B-type stars
const float STAR_TINT_STRENGTH = 0.35;     // How much star color affects surface (increased for visibility)

// --- Terrain Smoothstep Thresholds ---
const float TERRAIN_HIGHLAND_LOW = 0.3;
const float TERRAIN_HIGHLAND_HIGH = 0.6;
const float TERRAIN_PEAK_LOW = 0.7;
const float TERRAIN_PEAK_HIGH = 0.9;

// --- FBM Constants ---
const int FBM_MAX_OCTAVES = 5; // Maximum octaves for FBM
const float FBM_FREQUENCY_MULT = 2.0; // How much frequency increases per octave
const float FBM_AMPLITUDE_MULT = 0.5; // How much amplitude decreases per octave

// =============================================================================
// Noise Functions
// =============================================================================

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

// 2D Simplex Noise
// LEARNING: This function generates smooth, organic-looking randomness.
// The vec4 C contains mathematical constants derived from sqrt(3) that are
// part of the Simplex noise algorithm specification.
float snoise(vec2 v) {
    // Pack the Simplex constants into vec4 for efficient computation
    vec4 simplexConstants = vec4(SIMPLEX_SKEW_FACTOR_1, SIMPLEX_UNSKEW_FACTOR,
            SIMPLEX_SKEW_FACTOR_2, SIMPLEX_PERMUTE_SCALE);

    vec2 gridCell = floor(v + dot(v, simplexConstants.yy));
    vec2 localCoord = v - gridCell + dot(gridCell, simplexConstants.xx);
    vec2 diagonalOffset = (localCoord.x > localCoord.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

    vec4 cornerOffsets = localCoord.xyxy + simplexConstants.xxzz;
    cornerOffsets.xy -= diagonalOffset;

    gridCell = mod289(gridCell);
    vec3 permutedIndices = permute(permute(gridCell.y + vec3(0.0, diagonalOffset.y, 1.0))
                + gridCell.x + vec3(0.0, diagonalOffset.x, 1.0));

    // Calculate distance falloff for gradient contributions
    vec3 distanceFalloff = max(NOISE_GRADIENT_THRESHOLD - vec3(dot(localCoord, localCoord),
                    dot(cornerOffsets.xy, cornerOffsets.xy),
                    dot(cornerOffsets.zw, cornerOffsets.zw)), 0.0);
    distanceFalloff = distanceFalloff * distanceFalloff;
    distanceFalloff = distanceFalloff * distanceFalloff;

    // Generate gradient vectors
    vec3 gradientX = 2.0 * fract(permutedIndices * simplexConstants.www) - 1.0;
    vec3 gradientH = abs(gradientX) - 0.5;
    vec3 gradientOrigins = floor(gradientX + 0.5);
    vec3 gradientOffsets = gradientX - gradientOrigins;

    // Apply Taylor inverse square root approximation for normalization
    distanceFalloff *= TAYLOR_APPROX_A - TAYLOR_APPROX_B * (gradientOffsets * gradientOffsets + gradientH * gradientH);

    vec3 gradientContributions;
    gradientContributions.x = gradientOffsets.x * localCoord.x + gradientH.x * localCoord.y;
    gradientContributions.yz = gradientOffsets.yz * cornerOffsets.xz + gradientH.yz * cornerOffsets.yw;

    return NOISE_NORMALIZE * dot(distanceFalloff, gradientContributions);
}

// Fractional Brownian Motion - combines multiple noise octaves
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p);
        p *= FBM_FREQUENCY_MULT;
        amplitude *= FBM_AMPLITUDE_MULT;
    }

    return value;
}

// =============================================================================
// Color Space Conversion Functions
// =============================================================================

// HSV to RGB conversion
// LEARNING: vec4 K contains constants for transforming from HSV (Hue, Saturation, Value)
// to RGB. Each component handles a different sector of the hue spectrum.
vec3 hsv2rgb(vec3 hsv) {
    vec4 hsvToRgbConstants = vec4(HSV_TO_RGB_K1, HSV_TO_RGB_K2, HSV_TO_RGB_K3, HSV_TO_RGB_K4);
    vec3 p = abs(fract(hsv.xxx + hsvToRgbConstants.xyz) * HSV_TO_RGB_K4 - hsvToRgbConstants.www);
    return hsv.z * mix(hsvToRgbConstants.xxx, clamp(p - hsvToRgbConstants.xxx, 0.0, 1.0), hsv.y);
}

// RGB to HSV conversion
vec3 rgb2hsv(vec3 rgb) {
    vec4 rgbToHsvConstants = vec4(RGB_TO_HSV_K1, RGB_TO_HSV_K2, RGB_TO_HSV_K3, RGB_TO_HSV_K4);
    vec4 p = mix(vec4(rgb.bg, rgbToHsvConstants.wz), vec4(rgb.gb, rgbToHsvConstants.xy), step(rgb.b, rgb.g));
    vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));
    float delta = q.x - min(q.w, q.y);
    float safetyEpsilon = RGB_TO_HSV_EPSILON;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * delta + safetyEpsilon)),
        delta / (q.x + safetyEpsilon),
        q.x);
}

// =============================================================================
// Star Temperature to Color Tint
// =============================================================================

vec3 getStarTint(float starTemp) {
    // Red dwarf (M-type): warm orange-red tint
    vec3 redDwarfTint = vec3(1.0, 0.7, 0.5);
    // Sun-like (G-type): neutral warm yellow
    vec3 sunTint = vec3(1.0, 0.98, 0.95);
    // Hot star (A/B-type): cool blue-white
    vec3 hotStarTint = vec3(0.85, 0.9, 1.0);

    if (starTemp < STAR_TEMP_SUN) {
        float t = smoothstep(STAR_TEMP_RED_DWARF, STAR_TEMP_SUN, starTemp);
        return mix(redDwarfTint, sunTint, t);
    } else {
        float t = smoothstep(STAR_TEMP_SUN, STAR_TEMP_HOT, starTemp);
        return mix(sunTint, hotStarTint, t);
    }
}

// =============================================================================
// Main Fragment Shader
// =============================================================================

void main() {
    // === SETUP ===
    // Offset UV coordinates by seed to generate unique terrain per planet
    vec2 terrainUv = vUv + vec2(uSeed * UV_SEED_OFFSET_X, uSeed * UV_SEED_OFFSET_Y);

    // === COLOR VARIATION FROM SEED AND DENSITY ===
    vec3 colorInHsv = rgb2hsv(uBaseColor);

    // Rotate hue based on seed for variety
    float seedHueShift = uSeed * HUE_SHIFT_RANGE;
    colorInHsv.x = fract(colorInHsv.x + seedHueShift);

    // Density affects color: high density = iron-rich (shift toward red/orange)
    // Low density = volatile-rich (shift toward blue/gray)
    float densityHueShift = (uDensity - 0.5) * DENSITY_HUE_SHIFT;
    colorInHsv.x = fract(colorInHsv.x - densityHueShift); // Negative to shift toward red

    // Vary saturation based on seed and density
    float densitySatBoost = uDensity * DENSITY_SAT_BOOST;
    colorInHsv.y = clamp(colorInHsv.y * (SAT_BASE_MULT + uSeed * SAT_SEED_MULT) + densitySatBoost,
            SAT_MIN_CLAMP, SAT_MAX_CLAMP);

    vec3 seedVariedBaseColor = hsv2rgb(colorInHsv);

    // === TERRAIN HEIGHT GENERATION ===
    // Generate multi-octave terrain using FBM (Fractional Brownian Motion)
    // Density affects terrain roughness: high density = more rugged terrain
    float densityRoughness = mix(DENSITY_ROUGHNESS_MIN, DENSITY_ROUGHNESS_MAX, uDensity);
    float terrainScale = (TERRAIN_SCALE_BASE + uSeed * TERRAIN_SCALE_SEED_RANGE) * densityRoughness;

    float terrainHeight = fbm(terrainUv * terrainScale) * TERRAIN_OCTAVE_1_AMP;
    // Only add extra octaves in detailed mode (expensive)
    if (uDetailLevel > 0.5) {
        terrainHeight += fbm(terrainUv * terrainScale * TERRAIN_OCTAVE_2_MULT) * TERRAIN_OCTAVE_2_AMP;
        terrainHeight += fbm(terrainUv * terrainScale * TERRAIN_OCTAVE_3_MULT) * TERRAIN_OCTAVE_3_AMP;
        terrainHeight = terrainHeight / TERRAIN_OCTAVE_TOTAL;
    } else {
        terrainHeight = terrainHeight / TERRAIN_OCTAVE_1_AMP; // Normalize single octave
    }

    // === TEMPERATURE ANALYSIS ===
    // Combine equilibrium temperature with insolation for effective surface temp
    // High insolation boosts volcanic activity, low insolation promotes ice
    float effectiveTemp = uTemperature;
    effectiveTemp += (uInsolation - 0.5) * INSOL_VOLCANIC_BOOST; // High insol = hotter
    effectiveTemp -= (0.5 - uInsolation) * INSOL_ICE_PENALTY * step(uInsolation, 0.5); // Low insol = colder

    // Determine if planet is icy, temperate, or volcanic using effective temp
    float iceFactor = smoothstep(TEMP_ICE_HIGH, TEMP_ICE_LOW, effectiveTemp);
    float volcanicFactor = smoothstep(TEMP_VOLCANIC_LOW, TEMP_VOLCANIC_HIGH, effectiveTemp);
    float temperateFactor = 1.0 - iceFactor - volcanicFactor;

    // === BASE TERRAIN COLORS ===
    vec3 lowlandTerrainColor = seedVariedBaseColor * LOWLAND_BRIGHTNESS;
    vec3 highlandTerrainColor = seedVariedBaseColor * HIGHLAND_BRIGHTNESS;
    vec3 peakTerrainColor = seedVariedBaseColor * PEAK_BRIGHTNESS;

    // === ICE WORLD COLORING ===
    vec3 iceColor = vec3(ICE_BASE_RED + uSeed * ICE_SEED_RED_RANGE,
            ICE_BASE_GREEN + uSeed * ICE_SEED_GREEN_RANGE,
            ICE_BASE_BLUE + uSeed * ICE_SEED_BLUE_RANGE);

    lowlandTerrainColor = mix(lowlandTerrainColor, iceColor * ICE_LOWLAND_TINT, iceFactor);
    highlandTerrainColor = mix(highlandTerrainColor, iceColor * ICE_HIGHLAND_TINT, iceFactor);
    peakTerrainColor = mix(peakTerrainColor, iceColor * ICE_PEAK_TINT, iceFactor);

    // === VOLCANIC WORLD COLORING ===
    vec3 lavaColor = vec3(LAVA_RED,
            LAVA_GREEN_BASE + uSeed * LAVA_GREEN_SEED_RANGE,
            LAVA_BLUE_BASE + uSeed * LAVA_BLUE_SEED_RANGE);
    vec3 ashColor = vec3(ASH_RED_BASE + uSeed * ASH_RED_SEED_RANGE,
            ASH_GREEN_BASE + uSeed * ASH_GREEN_SEED_RANGE,
            ASH_BLUE_BASE + uSeed * ASH_BLUE_SEED_RANGE);

    lowlandTerrainColor = mix(lowlandTerrainColor, lavaColor * VOLCANIC_LAVA_BRIGHTNESS, volcanicFactor * VOLCANIC_LOWLAND_MIX);
    highlandTerrainColor = mix(highlandTerrainColor, ashColor, volcanicFactor);

    // === MIX TERRAIN COLORS BY HEIGHT ===
    vec3 surfaceColor = mix(lowlandTerrainColor, highlandTerrainColor,
            smoothstep(TERRAIN_HIGHLAND_LOW, TERRAIN_HIGHLAND_HIGH, terrainHeight));
    surfaceColor = mix(surfaceColor, peakTerrainColor,
            smoothstep(TERRAIN_PEAK_LOW, TERRAIN_PEAK_HIGH, terrainHeight));

    // === CRATERS (on airless worlds) ===
    // High density worlds retain more craters (stronger gravity, harder surface)
    // Low density worlds have fewer visible craters (resurfacing, weathering)
    float densityCraterFactor = mix(DENSITY_CRATER_MIN, DENSITY_CRATER_MAX, uDensity);
    float craterPattern = snoise(terrainUv * (CRATER_NOISE_SCALE_BASE + uSeed * CRATER_NOISE_SEED_SCALE));
    float craterMask = smoothstep(CRATER_THRESHOLD_HIGH, CRATER_THRESHOLD_LOW, craterPattern);
    craterMask *= (1.0 - uHasAtmosphere) * densityCraterFactor;
    surfaceColor *= (1.0 - craterMask * CRATER_DARKNESS);

    // === LAVA CRACKS (on hot worlds) - detailed mode only ===
    if (volcanicFactor > 0.0 && uDetailLevel > 0.5) {
        float crackPattern = snoise(terrainUv * (LAVA_CRACK_SCALE_BASE + uSeed * LAVA_CRACK_SEED_SCALE));
        float crackMask = smoothstep(LAVA_CRACK_THRESHOLD_HIGH, LAVA_CRACK_THRESHOLD_LOW, abs(crackPattern));
        vec3 crackGlowColor = lavaColor * LAVA_CRACK_GLOW;
        surfaceColor = mix(surfaceColor, crackGlowColor, crackMask * volcanicFactor * LAVA_CRACK_VISIBILITY);
    }

    // === INSOLATION GLOW (extremely irradiated worlds) ===
    // Very high insolation causes the surface to glow from thermal radiation
    if (uInsolation > INSOL_GLOW_THRESHOLD) {
        float glowFactor = smoothstep(INSOL_GLOW_THRESHOLD, 1.0, uInsolation);
        vec3 glowColor = vec3(1.0, 0.6, 0.3); // Hot orange glow
        surfaceColor = mix(surfaceColor, surfaceColor + glowColor * INSOL_GLOW_INTENSITY, glowFactor);
    }

    // === POLAR ICE CAPS (temperate worlds with atmosphere) - detailed mode only ===
    if (temperateFactor > POLAR_CAP_MIN_TEMPERATURE && uHasAtmosphere > POLAR_CAP_MIN_ATMOSPHERE && uDetailLevel > 0.5) {
        float distanceFromEquator = abs(vUv.y - 0.5) * 2.0;
        // Low insolation = larger ice caps
        float insolIceBoost = (1.0 - uInsolation) * 0.1;
        float capThreshold = POLAR_CAP_BASE_SIZE + uSeed * POLAR_CAP_SEED_SIZE_RANGE - insolIceBoost;
        float capMask = smoothstep(capThreshold, capThreshold + POLAR_CAP_SOFTNESS, distanceFromEquator);
        surfaceColor = mix(surfaceColor, iceColor, capMask * POLAR_CAP_VISIBILITY);
    }

    // === CLOUDS (for worlds with atmosphere) - detailed mode only ===
    if (uHasAtmosphere > 0.3 && uDetailLevel > 0.5) {
        float cloudScale = CLOUD_SCALE_BASE + uSeed * CLOUD_SCALE_SEED_RANGE;
        float cloudPattern1 = snoise(terrainUv * cloudScale + vec2(uTime * CLOUD_TIME_SPEED_1, 0.0)) * CLOUD_OCTAVE_1_STRENGTH + 0.5;
        float cloudPattern2 = snoise(terrainUv * cloudScale * FBM_FREQUENCY_MULT + vec2(uTime * CLOUD_TIME_SPEED_2, 0.0)) * CLOUD_OCTAVE_2_STRENGTH;
        float cloudCombined = cloudPattern1 + cloudPattern2;

        float cloudMask = smoothstep(CLOUD_THRESHOLD, CLOUD_THRESHOLD_HIGH, cloudCombined) * uHasAtmosphere * CLOUD_MAX_OPACITY;
        surfaceColor = mix(surfaceColor, vec3(1.0), cloudMask);
    }

    // === SURFACE DETAIL NOISE - detailed mode only ===
    if (uDetailLevel > 0.5) {
        float detailNoise = snoise(terrainUv * DETAIL_SCALE) * DETAIL_STRENGTH;
        surfaceColor += surfaceColor * detailNoise;
    }

    // === LIMB DARKENING ===
    float limbEffect = dot(vNormal, LIMB_VIEW_DIRECTION);
    limbEffect = smoothstep(LIMB_SMOOTHSTEP_LOW, LIMB_SMOOTHSTEP_HIGH, limbEffect);
    surfaceColor *= LIMB_BASE_DARKNESS + limbEffect * LIMB_BRIGHTNESS_RANGE;

    // === ATMOSPHERIC HAZE (for worlds with atmosphere) - detailed mode only ===
    if (uHasAtmosphere > 0.0 && uDetailLevel > 0.5) {
        float edgeIntensity = 1.0 - abs(dot(vNormal, LIMB_VIEW_DIRECTION));
        float hazeMask = pow(edgeIntensity, HAZE_POWER) * uHasAtmosphere * HAZE_MAX_OPACITY;

        // Haze color varies by temperature
        vec3 coolHazeColor = vec3(HAZE_COOL_RED_BASE + uSeed * HAZE_COOL_RED_SEED,
                HAZE_COOL_GREEN_BASE + uSeed * HAZE_COOL_GREEN_SEED,
                HAZE_COOL_BLUE_BASE + uSeed * HAZE_COOL_BLUE_SEED);
        vec3 hotHazeColor = vec3(HAZE_HOT_RED,
                HAZE_HOT_GREEN_BASE + uSeed * HAZE_HOT_GREEN_SEED,
                HAZE_HOT_BLUE_BASE + uSeed * HAZE_HOT_BLUE_SEED);

        vec3 hazeColor = mix(coolHazeColor, hotHazeColor, volcanicFactor);
        surfaceColor += hazeColor * hazeMask;
    }

    // === STAR TEMPERATURE TINTING ===
    // Apply subtle color tint based on host star type
    vec3 starTint = getStarTint(uStarTemp);
    surfaceColor = mix(surfaceColor, surfaceColor * starTint, STAR_TINT_STRENGTH);

    gl_FragColor = vec4(surfaceColor, 1.0);
}
