/**
 * Ice Giant Fragment Shader
 * Creates Neptune/Uranus-like smooth blue-green atmosphere
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uTemperature;
uniform float uHasAtmosphere; // Unused but passed from component
uniform float uSeed; // Unique seed per planet for color variation

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// SHADER CONSTANTS - Magic Numbers Extracted
// =============================================================================

// --- Latitude-Based Bands ---
const float BAND_FREQ_BASE = 5.0; // Base number of atmospheric bands
const float BAND_FREQ_SEED_RANGE = 4.0; // Seed variation on band frequency (5-9 bands)
const float BAND_PI = 3.14159; // Pi for sine wave calculation
const float BAND_AMPLITUDE = 0.5; // Sine wave amplitude
const float BAND_OFFSET = 0.5; // Offset to convert -0.5..0.5 to 0..1
const float BAND_SEED_PHASE = 3.0; // Seed multiplier for band phase shift
const float BAND_SMOOTHSTEP_LOW = 0.3; // Smoothstep lower threshold (soft transitions)
const float BAND_SMOOTHSTEP_HIGH = 0.7; // Smoothstep upper threshold

// --- Atmospheric Flow / Wind Patterns ---
const float FLOW_NOISE_SCALE_X = 4.0; // Horizontal noise frequency for atmospheric movement
const float FLOW_TIME_SPEED = 0.015; // How fast atmosphere moves
const float FLOW_SEED_SCALE = 5.0; // Seed variation on flow position
const float FLOW_LATITUDE_SCALE = 8.0; // Vertical frequency of flow patterns
const float FLOW_STRENGTH = 0.2; // How much flow affects band appearance

// --- Haze / High Altitude Clouds ---
const float HAZE_NOISE_SCALE_X = 6.0; // Horizontal haze pattern frequency
const float HAZE_NOISE_SCALE_Y = 6.0; // Vertical haze pattern frequency
const float HAZE_TIME_SPEED = 0.01; // How fast haze animates
const float HAZE_SEED_SCALE = 10.0; // Seed variation on haze pattern
const float HAZE_THRESHOLD_LOW = 0.4; // Where haze becomes visible
const float HAZE_THRESHOLD_HIGH = 0.8; // Where haze reaches full opacity
const float HAZE_LAYER_OPACITY = 0.3; // Maximum haze layer opacity

// --- Methane Tint / Atmospheric Coloring ---
const float METHANE_NOISE_SCALE_X = 3.0; // Horizontal frequency of methane variation
const float METHANE_NOISE_SCALE_Y = 5.0; // Vertical frequency of methane variation
const float METHANE_TIME_SPEED = 0.005; // How fast methane tint animates
const float METHANE_SEED_SCALE = 7.0; // Seed variation on methane pattern
const float METHANE_RED = 0.7; // Methane tint red channel
const float METHANE_GREEN = 0.9; // Methane tint green channel
const float METHANE_BLUE = 1.1; // Methane tint blue channel (boost)
const float METHANE_BLEND_STRENGTH = 0.3; // How much methane tint affects color

// --- Color Palette ---
const float DEEP_COLOR_BRIGHTNESS = 0.7; // Deep regions darker
const float BRIGHT_COLOR_BRIGHTNESS = 1.2; // Bright regions brighter
const float HAZE_WHITE_RED = 0.8; // Haze is slightly warm white
const float HAZE_WHITE_GREEN = 0.9; // Haze is slightly warm white
const float HAZE_WHITE_BLUE = 1.0; // Haze is bright blue-white

// --- Color Modulation from Seed ---
const float HUE_SHIFT_RANGE = 0.4; // ±20% hue rotation from seed
const float HUE_SHIFT_CENTER = 0.5; // Center point for hue shift calculation
const float HUE_SHIFT_DIVISOR = 2.0; // Divisor to get ±0.2 range
const float SAT_BASE_FACTOR = 0.6; // Base saturation multiplier
const float SAT_SEED_FACTOR = 0.8; // Seed contribution to saturation
const float SAT_MIN_CLAMP = 0.35; // Minimum saturation (prevents gray)
const float SAT_MAX_CLAMP = 1.0; // Maximum saturation
const float BRIGHT_BASE_FACTOR = 0.7; // Base brightness multiplier
const float BRIGHT_SEED_FACTOR = 0.5; // Seed contribution to brightness
const float BRIGHT_MIN_CLAMP = 0.4; // Minimum brightness (prevents black)
const float BRIGHT_MAX_CLAMP = 1.0; // Maximum brightness

// --- Dark Spots / Storm Features ---
const float SPOT_CENTER_X_SEED = 4.3; // Seed multiplier for spot X position
const float SPOT_CENTER_X_OFFSET = 0.3; // X offset for spot base position
const float SPOT_CENTER_X_RANGE = 0.4; // How far spot can vary horizontally
const float SPOT_CENTER_Y_SEED = 2.7; // Seed multiplier for spot Y position
const float SPOT_CENTER_Y_OFFSET = 0.4; // Y offset for spot base position
const float SPOT_CENTER_Y_RANGE = 0.3; // How far spot can vary vertically
const float SPOT_SIZE_BASE = 0.05; // Base size of dark spot
const float SPOT_SIZE_SEED = 6.1; // Seed multiplier for size variation
const float SPOT_SIZE_RANGE = 0.08; // How much spot size varies
const float SPOT_EDGE_SOFTNESS = 0.04; // Softness of spot edge (smoothstep range)
const float SPOT_DARKNESS = 0.4; // How dark the spot is

// --- Limb Darkening (atmospheric scattering) ---
const float LIMB_SMOOTHSTEP_LOW = -0.3; // Where limb darkening starts (allows glow beyond edge)
const float LIMB_SMOOTHSTEP_HIGH = 0.7; // Where limb darkening ends
const float LIMB_BASE_DARKNESS = 0.3; // Base darkness at limb (ice giants have strong scattering)
const float LIMB_BRIGHTNESS_RANGE = 0.7; // Range from limb to center

// --- Atmospheric Glow at Edges ---
const float EDGE_GLOW_POWER = 3.0; // How concentrated glow is at edges
const float EDGE_GLOW_STRENGTH = 0.2; // Maximum glow intensity

// --- Noise Algorithm Constants ---
// SIMPLEX NOISE: vec4 C contains pre-computed constants from the algorithm
// These values come from: (3-sqrt(3))/6, 0.5*(sqrt(3)-1), -1/sqrt(3), 1/41
const float MOD_DIVISOR = 289.0; // Modulo divisor for noise
const float SIMPLEX_SKEW_1 = 0.211324865405187; // (3 - sqrt(3)) / 6 - grid skew
const float SIMPLEX_UNSKEW = 0.366025403784439; // 0.5 * (sqrt(3) - 1) - grid unskew
const float SIMPLEX_GRADIENT_SCALE = -0.577350269189626; // -1 / sqrt(3) - gradient scaling
const float SIMPLEX_PERMUTE_SCALE = 0.024390243902439; // 1 / 41 - permutation scaling
const float SIMPLEX_NORMALIZE = 130.0; // Final scaling for noise output
const float SIMPLEX_DISTANCE_THRESHOLD = 0.5; // Distance threshold for gradients
const float TAYLOR_APPROX_A = 1.79284291400159; // Taylor series coefficient A
const float TAYLOR_APPROX_B = 0.85373472095314; // Taylor series coefficient B

// --- HSV Color Space Constants ---
// HSV2RGB_K: Used for transforming HSV to RGB color space
const float HSV2RGB_K1 = 1.0; // Hue sector multiplier
const float HSV2RGB_K2 = 2.0 / 3.0; // Offset 1 for RGB sectors (120°)
const float HSV2RGB_K3 = 1.0 / 3.0; // Offset 2 for RGB sectors (240°)
const float HSV2RGB_K4 = 3.0; // Sector boundary
// RGB2HSV_K: Used for transforming RGB to HSV color space
const float RGB2HSV_K1 = 0.0; // Lower bound
const float RGB2HSV_K2 = -1.0 / 3.0; // Sector offset 1
const float RGB2HSV_K3 = 2.0 / 3.0; // Sector offset 2
const float RGB2HSV_K4 = -1.0; // Sector offset 3
const float RGB2HSV_EPSILON = 1.0e-10; // Prevents division by zero

// --- View Direction for Lighting ---
const vec3 VIEW_DIRECTION = vec3(0.0, 0.0, 1.0); // Direction toward camera

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
// LEARNING: The vec4 C contains mathematical constants from the Simplex noise algorithm
// These are derived from sqrt(3) and are part of the algorithm specification
float snoise(vec2 v) {
    vec4 simplexConstants = vec4(SIMPLEX_SKEW_1, SIMPLEX_UNSKEW,
            SIMPLEX_GRADIENT_SCALE, SIMPLEX_PERMUTE_SCALE);

    vec2 gridCell = floor(v + dot(v, simplexConstants.yy));
    vec2 localCoord = v - gridCell + dot(gridCell, simplexConstants.xx);
    vec2 cellStep = (localCoord.x > localCoord.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

    vec4 cornerOffsets = localCoord.xyxy + simplexConstants.xxzz;
    cornerOffsets.xy -= cellStep;

    gridCell = mod289(gridCell);
    vec3 permutedIndices = permute(permute(gridCell.y + vec3(0.0, cellStep.y, 1.0))
                + gridCell.x + vec3(0.0, cellStep.x, 1.0));

    vec3 distanceFalloff = max(SIMPLEX_DISTANCE_THRESHOLD - vec3(dot(localCoord, localCoord),
                    dot(cornerOffsets.xy, cornerOffsets.xy),
                    dot(cornerOffsets.zw, cornerOffsets.zw)), 0.0);
    distanceFalloff = distanceFalloff * distanceFalloff;
    distanceFalloff = distanceFalloff * distanceFalloff;

    vec3 gradientX = 2.0 * fract(permutedIndices * simplexConstants.www) - 1.0;
    vec3 gradientH = abs(gradientX) - 0.5;
    vec3 gradientFloor = floor(gradientX + 0.5);
    vec3 gradientA = gradientX - gradientFloor;

    distanceFalloff *= TAYLOR_APPROX_A - TAYLOR_APPROX_B * (gradientA * gradientA + gradientH * gradientH);

    vec3 gradientContrib;
    gradientContrib.x = gradientA.x * localCoord.x + gradientH.x * localCoord.y;
    gradientContrib.yz = gradientA.yz * cornerOffsets.xz + gradientH.yz * cornerOffsets.yw;

    return SIMPLEX_NORMALIZE * dot(distanceFalloff, gradientContrib);
}

// =============================================================================
// Color Space Conversion Functions
// =============================================================================

// HSV to RGB conversion
vec3 hsv2rgb(vec3 hsv) {
    vec4 hsvConstants = vec4(HSV2RGB_K1, HSV2RGB_K2, HSV2RGB_K3, HSV2RGB_K4);
    vec3 p = abs(fract(hsv.xxx + hsvConstants.xyz) * HSV2RGB_K4 - hsvConstants.www);
    return hsv.z * mix(hsvConstants.xxx, clamp(p - hsvConstants.xxx, 0.0, 1.0), hsv.y);
}

// RGB to HSV conversion
vec3 rgb2hsv(vec3 rgb) {
    vec4 rgbConstants = vec4(RGB2HSV_K1, RGB2HSV_K2, RGB2HSV_K3, RGB2HSV_K4);
    vec4 p = mix(vec4(rgb.bg, rgbConstants.wz), vec4(rgb.gb, rgbConstants.xy), step(rgb.b, rgb.g));
    vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));
    float delta = q.x - min(q.w, q.y);
    float epsilon = RGB2HSV_EPSILON;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * delta + epsilon)), delta / (q.x + epsilon), q.x);
}

// =============================================================================
// Main Fragment Shader
// =============================================================================

void main() {
    // === SETUP ===
    float latitude = vUv.y;

    // === SEED-BASED COLOR VARIATION ===
    // LEARNING: Ice giants can have wide color variation from deep blue to cyan to purple
    // We use HSV space to easily shift hue and adjust saturation/brightness

    vec3 colorHsv = rgb2hsv(uBaseColor);

    // Vary hue based on seed for palette diversity
    float hueShift = (uSeed - HUE_SHIFT_CENTER) * HUE_SHIFT_RANGE / HUE_SHIFT_DIVISOR;
    colorHsv.x = fract(colorHsv.x + hueShift);

    // Adjust saturation and brightness based on seed
    colorHsv.y = clamp(colorHsv.y * (SAT_BASE_FACTOR + uSeed * SAT_SEED_FACTOR),
            SAT_MIN_CLAMP, SAT_MAX_CLAMP);
    colorHsv.z = clamp(colorHsv.z * (BRIGHT_BASE_FACTOR + uSeed * BRIGHT_SEED_FACTOR),
            BRIGHT_MIN_CLAMP, BRIGHT_MAX_CLAMP);

    vec3 variedBaseColor = hsv2rgb(colorHsv);

    // === ATMOSPHERIC BANDS ===
    // LEARNING: Ice giants have gentle, smooth bands - less pronounced than gas giants
    // We use smoothstep for softer transitions between bands

    float bandFrequency = BAND_FREQ_BASE + uSeed * BAND_FREQ_SEED_RANGE;
    float bandPattern = sin(latitude * BAND_PI * bandFrequency + uSeed * BAND_SEED_PHASE)
            * BAND_AMPLITUDE + BAND_OFFSET;
    float bands = smoothstep(BAND_SMOOTHSTEP_LOW, BAND_SMOOTHSTEP_HIGH, bandPattern);

    // === ATMOSPHERIC FLOW / WIND PATTERNS ===
    // Add dynamic movement to make the atmosphere feel alive
    float flowPattern = snoise(vec2(vUv.x * FLOW_NOISE_SCALE_X + uTime * FLOW_TIME_SPEED + uSeed * FLOW_SEED_SCALE,
                latitude * FLOW_LATITUDE_SCALE)) * FLOW_STRENGTH;
    bands += flowPattern;

    // === HIGH ALTITUDE HAZE / CLOUDS ===
    float hazePattern = snoise(vec2(vUv.x * HAZE_NOISE_SCALE_X + uTime * HAZE_TIME_SPEED,
                vUv.y * HAZE_NOISE_SCALE_Y + uSeed * HAZE_SEED_SCALE)) * 0.5 + 0.5;
    float hazeMask = smoothstep(HAZE_THRESHOLD_LOW, HAZE_THRESHOLD_HIGH, hazePattern) * HAZE_LAYER_OPACITY;

    // === COLOR PALETTE ===
    vec3 deepColor = variedBaseColor * DEEP_COLOR_BRIGHTNESS;
    vec3 brightColor = variedBaseColor * BRIGHT_COLOR_BRIGHTNESS;
    vec3 whiteHazeColor = vec3(HAZE_WHITE_RED, HAZE_WHITE_GREEN, HAZE_WHITE_BLUE);

    // === COMPOSITE ATMOSPHERE ===
    // Mix based on band pattern
    vec3 atmosphereColor = mix(deepColor, brightColor, bands);

    // === METHANE TINT / ATMOSPHERIC ABSORPTION ===
    // Ice giants have methane in their atmosphere which creates a blue-green tint
    float methanePattern = snoise(vec2(vUv.x * METHANE_NOISE_SCALE_X + uSeed * METHANE_SEED_SCALE,
                vUv.y * METHANE_NOISE_SCALE_Y + uTime * METHANE_TIME_SPEED))
            * 0.5 + 0.5;
    vec3 methaneTint = vec3(METHANE_RED, METHANE_GREEN, METHANE_BLUE);
    atmosphereColor *= mix(vec3(1.0), methaneTint, methanePattern * METHANE_BLEND_STRENGTH);

    // === ADD HAZE LAYER ===
    atmosphereColor = mix(atmosphereColor, whiteHazeColor * variedBaseColor, hazeMask);

    // === DARK SPOTS / STORM FEATURES ===
    // Position dark spots based on seed for uniqueness per planet
    vec2 spotCenter = vec2(SPOT_CENTER_X_OFFSET + fract(uSeed * SPOT_CENTER_X_SEED) * SPOT_CENTER_X_RANGE,
            SPOT_CENTER_Y_OFFSET + fract(uSeed * SPOT_CENTER_Y_SEED) * SPOT_CENTER_Y_RANGE);
    float spotDistance = length(vUv - spotCenter);
    float spotSize = SPOT_SIZE_BASE + fract(uSeed * SPOT_SIZE_SEED) * SPOT_SIZE_RANGE;
    float spotMask = smoothstep(spotSize + SPOT_EDGE_SOFTNESS, spotSize, spotDistance);
    atmosphereColor *= (1.0 - spotMask * SPOT_DARKNESS);

    // === LIMB DARKENING ===
    // Ice giants have strong atmospheric scattering, creating pronounced limb darkening
    float limbEffect = dot(vNormal, VIEW_DIRECTION);
    limbEffect = smoothstep(LIMB_SMOOTHSTEP_LOW, LIMB_SMOOTHSTEP_HIGH, limbEffect);
    atmosphereColor *= LIMB_BASE_DARKNESS + limbEffect * LIMB_BRIGHTNESS_RANGE;

    // === ATMOSPHERIC GLOW AT EDGES ===
    // Add subtle glow effect at the planet's limb from atmospheric scattering
    float edgeGlow = 1.0 - abs(dot(vNormal, VIEW_DIRECTION));
    edgeGlow = pow(edgeGlow, EDGE_GLOW_POWER) * EDGE_GLOW_STRENGTH;
    atmosphereColor += variedBaseColor * edgeGlow;

    gl_FragColor = vec4(atmosphereColor, 1.0);
}
