/**
 * Gas Giant Fragment Shader
 * Creates Jupiter/Saturn-like banded atmosphere with storms
 *
 * REFACTORING NOTES:
 * All magic numbers have been extracted to named constants organized by function.
 * This makes it easy to tune the appearance of different gas giants without
 * modifying the core algorithm.
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uTemperature; // Planet equilibrium temperature
uniform float uHasAtmosphere; // Unused but passed from component
uniform float uSeed; // Unique seed per planet for color variation

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// SHADER CONSTANTS
// =============================================================================

// --- Band Generation ---
const float BAND_FREQ_BASE = 10.0; // Base number of latitude bands
const float BAND_FREQ_SEED_SCALE = 6.0; // How much seed affects band frequency (10-16 bands)
const float BAND_PI = 3.14159; // Pi for sine wave calculation
const float BAND_AMPLITUDE = 0.5; // Sine wave amplitude (0-1 output)

// --- Turbulence / Atmospheric Movement ---
const float TURBULENCE_SCALE_X = 8.0; // Horizontal noise frequency
const float TURBULENCE_SPEED = 0.02; // How fast turbulence animates
const float TURBULENCE_SEED_SCALE = 10.0; // How seed affects turbulence pattern
const float TURBULENCE_LATITUDE_SCALE = 20.0; // Vertical frequency of turbulence
const float TURBULENCE_STRENGTH = 0.15; // How much turbulence affects bands

// --- Small Bands (secondary detail) ---
const float SMALL_BAND_FREQ_MULTIPLIER = 3.0; // How many small bands per large band
const float SMALL_BAND_SEED_SCALE = 5.0; // Seed variation for small bands
const float SMALL_BAND_STRENGTH = 0.3; // How strong small bands are
const float SMALL_BAND_MIX = 0.3; // How much small bands blend with large bands

// --- Primary Storm ---
const float STORM_CENTER_X_SEED = 3.7; // Seed multiplier for storm X position
const float STORM_CENTER_Y_BASE = 0.4; // Base latitude for storm
const float STORM_CENTER_Y_SEED = 2.3; // Seed multiplier for storm Y position
const float STORM_CENTER_Y_RANGE = 0.3; // How far north/south storm can drift
const float STORM_SIZE_BASE = 0.04; // Base size of storm
const float STORM_SIZE_SEED = 5.1; // Seed multiplier for size variation
const float STORM_SIZE_RANGE = 0.06; // How much size varies
const float STORM_SMOOTHSTEP_OUTER = 0.03; // Softness of storm edge (larger = softer)

// --- Secondary Storm ---
const float STORM2_CENTER_X_SEED = 7.1; // Seed for second storm X
const float STORM2_CENTER_X_OFFSET = 0.5; // Offset to separate from first storm
const float STORM2_CENTER_Y_BASE = 0.3; // Base latitude for second storm
const float STORM2_CENTER_Y_SEED = 4.7; // Seed for second storm Y
const float STORM2_CENTER_Y_RANGE = 0.4; // Range for second storm Y
const float STORM2_SMOOTHSTEP_OUTER = 0.05; // Outer edge of second storm
const float STORM2_SMOOTHSTEP_INNER = 0.01; // Inner edge of second storm
const float STORM2_STRENGTH = 0.6; // Opacity of second storm

// --- Color Palette & Hue Shift ---
const float HUE_SHIFT_RANGE = 0.5; // How much seed can shift hue (±0.25 of full hue circle)
const float SAT_BASE_FACTOR = 0.5; // Base saturation multiplier
const float SAT_SEED_FACTOR = 0.9; // How much seed affects saturation
const float SAT_MIN_CLAMP = 0.25; // Minimum saturation (prevent gray)
const float SAT_MAX_CLAMP = 1.0; // Maximum saturation
const float BRIGHT_BASE_FACTOR = 0.7; // Base brightness multiplier
const float BRIGHT_SEED_FACTOR = 0.5; // How much seed affects brightness
const float BRIGHT_MIN_CLAMP = 0.4; // Minimum brightness (prevent black)
const float BRIGHT_MAX_CLAMP = 1.0; // Maximum brightness

// --- Temperature-based Color Tinting ---
const float TEMP_THRESHOLD_LOW = 500.0; // Temperature for no tint
const float TEMP_THRESHOLD_HIGH = 2000.0; // Temperature for full tint (range = 1500)
const float HOT_TINT_RED = 1.2; // Red boost for hot planets
const float HOT_TINT_GREEN = 0.8; // Green (reduced) for warm tone
const float HOT_TINT_BLUE = 0.6; // Blue (reduced) for warm tone
const float HOT_TINT_DARK_SCALE = 0.8; // How much to scale dark band tint

// --- Band Color Multipliers ---
const float LIGHT_BAND_BRIGHTNESS = 1.3; // How bright the light bands are
const float DARK_BAND_BRIGHTNESS = 0.6; // How dark the dark bands are

// --- Storm Color ---
const float STORM_HUE_SHIFT = 0.05; // Hue shift for storms (slight color change)
const float STORM_SAT_BOOST = 1.2; // Saturation boost for storms
const float STORM_BRIGHTNESS = 0.7; // Brightness reduction for storms

// --- Swirl/Detail Effect ---
const float SWIRL_SCALE_X = 15.0; // Horizontal frequency of swirl detail
const float SWIRL_SPEED = 0.01; // How fast swirl animates
const float SWIRL_SCALE_Y = 10.0; // Vertical frequency of swirl detail
const float SWIRL_SEED_SCALE = 20.0; // Seed variation for swirl pattern
const float SWIRL_STRENGTH = 0.1; // How much swirl affects surface color

// --- Limb Darkening ---
const float LIMB_VIEW_AXIS = 1.0; // Which normal axis points toward camera (Z)
const float LIMB_SMOOTHSTEP_LOW = -0.2; // Where limb darkening starts
const float LIMB_SMOOTHSTEP_HIGH = 0.8; // Where limb darkening ends
const float LIMB_DARKNESS_BASE = 0.4; // Minimum brightness at limb
const float LIMB_DARKNESS_RANGE = 0.6; // Range from limb to center

// --- Noise Constants ---
const float MOD_DIVISOR = 289.0; // Modulo divisor for Simplex noise
const float SIMPLEX_CONST_1 = 0.211324865405187;
const float SIMPLEX_CONST_2 = 0.366025403784439;
const float SIMPLEX_CONST_3 = -0.577350269189626;
const float SIMPLEX_CONST_4 = 0.024390243902439;
const float NOISE_NORMALIZE = 130.0; // Normalization factor for 2D Simplex noise
const float NOISE_FALLOFF = 0.5; // Distance threshold for noise gradient
const float NOISE_TAYLOR_A = 1.79284291400159;
const float NOISE_TAYLOR_B = 0.85373472095314;

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
float snoise(vec2 v) {
    const vec4 C = vec4(SIMPLEX_CONST_1, SIMPLEX_CONST_2,
            SIMPLEX_CONST_3, SIMPLEX_CONST_4);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(NOISE_FALLOFF - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= NOISE_TAYLOR_A - NOISE_TAYLOR_B * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return NOISE_NORMALIZE * dot(m, g);
}

// =============================================================================
// Color Space Conversion Functions
// =============================================================================

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// =============================================================================
// Main Fragment Shader
// =============================================================================

void main() {
    // === LATITUDE-BASED BANDS ===
    // LEARNING: Gas giants like Jupiter have distinctive latitude bands
    // caused by atmospheric circulation patterns. We use sine waves
    // at different frequencies to create this effect.

    float latitude = vUv.y;

    // Calculate number of bands based on seed for variety
    float bandFreq = BAND_FREQ_BASE + uSeed * BAND_FREQ_SEED_SCALE;

    // Create sine wave that varies from 0 to 1 based on latitude
    float bands = sin(latitude * BAND_PI * bandFreq) * BAND_AMPLITUDE + BAND_AMPLITUDE;

    // === TURBULENCE / ATMOSPHERIC MOVEMENT ===
    // Add noise to make bands look more realistic and animated
    float turbulence = snoise(vec2(
                vUv.x * TURBULENCE_SCALE_X + uTime * TURBULENCE_SPEED + uSeed * TURBULENCE_SEED_SCALE,
                latitude * TURBULENCE_LATITUDE_SCALE
            )) * TURBULENCE_STRENGTH;
    bands += turbulence;

    // === SECONDARY SMALLER BANDS ===
    // Add finer detail with higher frequency bands
    float smallBands = sin(latitude * BAND_PI * bandFreq * SMALL_BAND_FREQ_MULTIPLIER + uSeed * SMALL_BAND_SEED_SCALE) * BAND_AMPLITUDE + BAND_AMPLITUDE;
    smallBands *= SMALL_BAND_STRENGTH;

    // Blend small bands into main bands for added detail
    bands = mix(bands, smallBands, SMALL_BAND_MIX);

    // === PRIMARY STORM (Great Red Spot) ===
    // LEARNING: Gas giants have long-lived storms. We position them
    // using the seed value so each planet has unique storm locations.

    vec2 stormCenter = vec2(
            fract(uSeed * STORM_CENTER_X_SEED),
            STORM_CENTER_Y_BASE + fract(uSeed * STORM_CENTER_Y_SEED) * STORM_CENTER_Y_RANGE
        );
    float stormDist = length(vUv - stormCenter);
    float stormSize = STORM_SIZE_BASE + fract(uSeed * STORM_SIZE_SEED) * STORM_SIZE_RANGE;

    // Create soft-edged storm using smoothstep
    float storm = smoothstep(stormSize + STORM_SMOOTHSTEP_OUTER, stormSize, stormDist);

    // === SECONDARY STORM ===
    // Add a second smaller storm for more interest
    vec2 storm2Center = vec2(
            fract(uSeed * STORM2_CENTER_X_SEED + STORM2_CENTER_X_OFFSET),
            STORM2_CENTER_Y_BASE + fract(uSeed * STORM2_CENTER_Y_SEED) * STORM2_CENTER_Y_RANGE
        );
    float storm2Dist = length(vUv - storm2Center);
    float storm2 = smoothstep(STORM2_SMOOTHSTEP_OUTER, STORM2_SMOOTHSTEP_INNER, storm2Dist) * STORM2_STRENGTH;

    // === COLOR PALETTE WITH SEED-BASED VARIATION ===
    // LEARNING: Using HSV color space lets us easily shift hue, saturation,
    // and brightness independently. This creates more natural-looking variation.

    vec3 baseHSV = rgb2hsv(uBaseColor);

    // Vary hue based on seed for palette diversity
    float hueShift = (uSeed - 0.5) * HUE_SHIFT_RANGE;
    baseHSV.x = fract(baseHSV.x + hueShift);

    // Adjust saturation and brightness based on seed
    baseHSV.y = clamp(baseHSV.y * (SAT_BASE_FACTOR + uSeed * SAT_SEED_FACTOR), SAT_MIN_CLAMP, SAT_MAX_CLAMP);
    baseHSV.z = clamp(baseHSV.z * (BRIGHT_BASE_FACTOR + uSeed * BRIGHT_SEED_FACTOR), BRIGHT_MIN_CLAMP, BRIGHT_MAX_CLAMP);

    vec3 variedBaseColor = hsv2rgb(baseHSV);

    // Create light and dark band colors
    vec3 lightBand = variedBaseColor * LIGHT_BAND_BRIGHTNESS;
    vec3 darkBand = variedBaseColor * DARK_BAND_BRIGHTNESS;

    // === TEMPERATURE-BASED TINTING ===
    // LEARNING: Hot gas giants are more red/orange due to atmosphere
    // at higher temperatures being more opaque to shorter wavelengths

    float tempFactor = clamp(
            (uTemperature - TEMP_THRESHOLD_LOW) / (TEMP_THRESHOLD_HIGH - TEMP_THRESHOLD_LOW),
            0.0,
            1.0
        );
    vec3 hotTint = vec3(HOT_TINT_RED, HOT_TINT_GREEN, HOT_TINT_BLUE);
    lightBand *= mix(vec3(1.0), hotTint, tempFactor);
    darkBand *= mix(vec3(1.0), hotTint * HOT_TINT_DARK_SCALE, tempFactor);

    // === STORM COLOR ===
    // Make storms have a slightly different hue
    vec3 stormHSV = baseHSV;
    stormHSV.x = fract(stormHSV.x + STORM_HUE_SHIFT);
    stormHSV.y *= STORM_SAT_BOOST;
    stormHSV.z *= STORM_BRIGHTNESS;
    vec3 stormColor = hsv2rgb(stormHSV);

    // === SURFACE COLOR COMPOSITION ===
    // Mix all the layers together

    // Start with band color (interpolate between dark and light)
    vec3 surfaceColor = mix(darkBand, lightBand, bands);

    // Overlay storms
    surfaceColor = mix(surfaceColor, stormColor, storm + storm2);

    // === SWIRL/DETAIL NOISE ===
    // Add subtle swirling texture to make it more dynamic
    float swirl = snoise(vec2(
                vUv.x * SWIRL_SCALE_X + uTime * SWIRL_SPEED,
                vUv.y * SWIRL_SCALE_Y + uSeed * SWIRL_SEED_SCALE
            )) * SWIRL_STRENGTH;
    surfaceColor += surfaceColor * swirl;

    // === LIMB DARKENING ===
    // LEARNING: Gas giants appear darker at the edges due to
    // atmospheric scattering and absorption

    float limb = dot(vNormal, vec3(0.0, 0.0, LIMB_VIEW_AXIS));
    limb = smoothstep(LIMB_SMOOTHSTEP_LOW, LIMB_SMOOTHSTEP_HIGH, limb);
    surfaceColor *= LIMB_DARKNESS_BASE + limb * LIMB_DARKNESS_RANGE;

    gl_FragColor = vec4(surfaceColor, 1.0);
}
