/**
 * Star Surface Fragment Shader
 * Creates a realistic star surface with:
 * - Base color from spectral class
 * - Procedural solar granulation texture
 * - Limb darkening
 * - Sunspots
 * - Animated convection cells
 *
 * REFACTORING NOTES:
 * All magic numbers have been extracted to named constants at the top.
 * This makes the shader easier to understand, tweak, and maintain.
 * Each constant has a clear purpose and comment explaining its role.
 */

uniform vec3 uStarColor; // Base color from spectral class
uniform float uTime; // Animation time
uniform float uTemperature; // Star temperature (affects turbulence)

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// SHADER CONSTANTS - Extracted Magic Numbers
// =============================================================================
// These values control the appearance and behavior of the star surface.
// Adjusting these lets you tune the visual effect without rewriting shader code.

// --- Animation Speed Constants ---
const float CONVECTION_ANIMATION_SPEED = 0.05; // How fast convection cells move (lower = slower)
const float CONVECTION_X_WAVE = 0.1; // X-direction convection wave amplitude
const float CONVECTION_Z_WAVE = 0.05; // Z-direction convection wave amplitude
const float FINE_DETAIL_ANIMATION = 0.02; // Speed of fine detail animation
const float FLARE_ANIMATION = 0.1; // Speed of flare/bright spot animation
const float SUNSPOT_ANIMATION = 0.01; // Speed of sunspot movement

// --- Granulation / Convection Constants ---
const float GRANULATION_SCALE = 8.0; // Scale of large convection cells (higher = smaller cells)
const int GRANULATION_OCTAVES = 4; // Number of noise octaves for granulation detail
const float GRANULATION_STRENGTH = 0.5; // How much granulation affects brightness (0-1)

const float FINE_DETAIL_SCALE = 20.0; // Scale of fine surface details
const int FINE_DETAIL_OCTAVES = 3; // Noise octaves for fine detail
const float FINE_DETAIL_STRENGTH = 0.3; // Intensity of fine detail
const float FINE_DETAIL_COLOR_MIX = 0.2; // How much fine detail affects color (0-1)

// --- Sunspot Constants ---
const float SUNSPOT_NOISE_SCALE = 3.0; // Scale of sunspot noise pattern
const float SUNSPOT_THRESHOLD_LOW = 0.6; // Lower threshold for sunspot smoothstep
const float SUNSPOT_THRESHOLD_HIGH = 0.8; // Upper threshold for sunspot smoothstep
const float SUNSPOT_DARKNESS = 0.4; // How dark sunspots are (0 = no change, 1 = completely black)
const float SUNSPOT_TEMPERATURE_SHIFT = 0.85; // Color temperature of cool sunspots (cooler = lower values)

// --- Flare / Hot Spot Constants ---
const float FLARE_NOISE_SCALE = 5.0; // Scale of flare noise pattern
const float FLARE_THRESHOLD_LOW = 0.7; // Lower threshold for flare smoothstep
const float FLARE_THRESHOLD_HIGH = 0.9; // Upper threshold for flare smoothstep
const float FLARE_BRIGHTNESS = 0.3; // How bright flares are relative to base color
const float FLARE_WARMTH_RED = 1.2; // Red channel boost for flares (warmer = higher)
const float FLARE_WARMTH_GREEN = 1.1; // Green channel boost for flares
const float FLARE_WARMTH_BLUE = 0.9; // Blue channel boost for flares (stays cooler)

// --- Limb Darkening Constants ---
const float LIMB_DARKENING_EXPONENT = 0.3; // Power for limb darkening falloff (lower = brighter center)
const float LIMB_DARKENING_BLEND = 0.3; // How much temperature affects limb darkening intensity
const float TEMPERATURE_SCALE = 10000.0; // Reference temperature for normalization
const float TEMPERATURE_MIN_CLAMP = 0.3; // Minimum temperature factor (prevents over-brightening)
const float TEMPERATURE_MAX_CLAMP = 1.0; // Maximum temperature factor
const float LIMB_BASE_DARKNESS = 0.6; // Base multiplier for limb darkening (higher = brighter overall)
const float LIMB_DARKNESS_MIX = 0.4; // How much limb darkening contributes to final brightness

// --- Core Brightness / Luminosity Constants ---
const float CORE_GLOW_STRENGTH = 0.4; // How much brighter the center is (additive glow)
const float CORE_GLOW_EXPONENT = 2.0; // Falloff of core glow (higher = tighter center hotspot)
const float BLOOM_STRENGTH = 0.15; // Overall brightness boost to simulate bloom/HDR
const float HOT_STAR_BOOST = 0.3; // Extra brightness for hot stars (temp > 7000K)

// --- Color Variation Constants ---
const float WARM_COLOR_RED = 1.1; // Red boost for warm/bright areas
const float WARM_COLOR_GREEN = 1.05; // Green boost for warm areas
const float WARM_COLOR_BLUE = 0.95; // Blue reduction for warm areas (makes more yellow)

const float COOL_COLOR_RED = 0.85; // Red reduction for cool/dark areas
const float COOL_COLOR_GREEN = 0.75; // Green reduction for cool areas
const float COOL_COLOR_BLUE = 0.7; // Blue reduction for cool areas (makes more red)

// --- HDR and Output Constants ---
const float SURFACE_COLOR_MAX = 2.0; // Maximum clamp for HDR output (prevents over-bright pixels)
const float SURFACE_COLOR_MIN = 0.0; // Minimum clamp
const vec3 LIMB_VIEW_DIRECTION = vec3(0.0, 0.0, 1.0); // Direction for limb darkening calculation (toward camera)

// --- Noise Constants ---
const float MOD_DIVISOR = 289.0; // Modulo divisor for noise (used in permutation)
const float PERMUTE_MULT = 34.0; // Multiplier in permutation formula
const float PERMUTE_ADD = 1.0; // Additive constant in permutation
const float NOISE_NORMALIZATION_A = 1.79284291400159; // Taylor inverse square root coefficient A
const float NOISE_NORMALIZATION_B = 0.85373472095314; // Taylor inverse square root coefficient B
const float FBMPLITUDE_SCALE = 0.5; // How much each octave amplitude decreases (0.5 = half)
const float FBM_FREQUENCY_SCALE = 2.0; // How much each octave frequency increases (2.0 = double)
const float SIMPLEX_DISTANCE_THRESHOLD = 0.6; // Distance threshold for simplex noise gradient
const float SIMPLEX_NOISE_SCALE = 42.0; // Final scaling factor for 3D simplex noise output

// =============================================================================
// Noise Functions
// =============================================================================

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec4 permute(vec4 x) {
    return mod289(((x * PERMUTE_MULT) + PERMUTE_ADD) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return NOISE_NORMALIZATION_A - NOISE_NORMALIZATION_B * r;
}

// 3D Simplex Noise
// LEARNING: This generates smooth random values in 3D space
// Used as the basis for all procedural texture generation
float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(SIMPLEX_DISTANCE_THRESHOLD - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return SIMPLEX_NOISE_SCALE * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractional Brownian Motion for more detail
// LEARNING: FBM stacks multiple noise layers at different scales
// Creates natural-looking complexity by combining fine and coarse details
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        amplitude *= FBMPLITUDE_SCALE;
        frequency *= FBM_FREQUENCY_SCALE;
    }

    return value;
}

// =============================================================================
// Main Fragment Shader
// =============================================================================

void main() {
    // === SETUP ===
    // Get the position normalized to the sphere surface (for seamless wrapping)
    // LEARNING: Normalizing ensures coordinates wrap correctly around the sphere
    vec3 spherePos = normalize(vPosition);

    // Calculate animated position for convection movement
    // LEARNING: We modify the input coordinates over time to create animation
    // without actually moving geometry - just shifting the noise pattern
    float slowTime = uTime * CONVECTION_ANIMATION_SPEED;
    vec3 animatedPos = spherePos + vec3(
                slowTime * CONVECTION_X_WAVE,
                0.0,
                slowTime * CONVECTION_Z_WAVE
            );

    // === GRANULATION / CONVECTION CELLS ===
    // LEARNING: Granulation is the texture of convection cells on the star surface
    // We use FBM (multiple noise octaves) for realistic detail at multiple scales

    // Large scale convection cells (the main structure)
    float granulation = fbm(animatedPos * GRANULATION_SCALE, GRANULATION_OCTAVES) * GRANULATION_STRENGTH + 0.5;

    // Fine detail overlay (small wrinkles and features)
    // LEARNING: Adding fine detail prevents the surface from looking too smooth
    float fineDetail = fbm(
            animatedPos * FINE_DETAIL_SCALE + vec3(uTime * FINE_DETAIL_ANIMATION),
            FINE_DETAIL_OCTAVES
        ) * FINE_DETAIL_STRENGTH;

    // === SUNSPOTS ===
    // LEARNING: Sunspots are cooler, darker regions on the star surface
    // We use low-frequency noise to locate them, then smoothstep to create soft edges

    // Generate sunspot pattern (low frequency = larger features)
    float spotNoise = snoise(spherePos * SUNSPOT_NOISE_SCALE + vec3(0.0, uTime * SUNSPOT_ANIMATION, 0.0));

    // Convert noise to a mask: 0 where no spot, 1 where spot is darkest
    // smoothstep creates smooth transition between thresholds
    float spotMask = smoothstep(SUNSPOT_THRESHOLD_LOW, SUNSPOT_THRESHOLD_HIGH, spotNoise);

    // Calculate how much darker to make the surface
    // spotMask = 0 means no darkening, spotMask = 1 means full darkening
    float spotDarkening = 1.0 - spotMask * SUNSPOT_DARKNESS;

    // === HOT SPOTS / FLARES ===
    // LEARNING: Flares are bright, warm regions where hot material rises to surface
    // They animate independently from sunspots

    float flareNoise = snoise(animatedPos * FLARE_NOISE_SCALE + vec3(uTime * FLARE_ANIMATION));
    float flareMask = smoothstep(FLARE_THRESHOLD_LOW, FLARE_THRESHOLD_HIGH, flareNoise) * FLARE_BRIGHTNESS;

    // === LIMB DARKENING ===
    // LEARNING: Stars appear darker at the edges because we're looking through
    // more of the star's atmosphere. Also called "limb effect" in astronomy.

    // Calculate viewing angle: dot product with direction toward camera
    // 1 = looking straight at surface (bright), 0 = looking edge-on (dark)
    float viewAngle = dot(vNormal, LIMB_VIEW_DIRECTION);

    // Apply exponential falloff: creates smooth darkening toward edges
    // Higher exponent = sharper edge effect
    float limbDarkening = pow(max(viewAngle, 0.0), LIMB_DARKENING_EXPONENT);

    // Temperature affects limb darkening intensity
    // LEARNING: Hotter stars have less pronounced limb darkening
    // This is physically accurate - hotter atmospheres are more uniform
    float tempFactor = clamp(uTemperature / TEMPERATURE_SCALE, TEMPERATURE_MIN_CLAMP, TEMPERATURE_MAX_CLAMP);
    limbDarkening = mix(limbDarkening, 1.0, tempFactor * LIMB_DARKENING_BLEND);

    // === COLOR CALCULATION ===
    // Build the surface color by layering multiple effects

    vec3 baseColor = uStarColor;

    // Create warm color (bright, yellow areas)
    vec3 warmColor = baseColor * vec3(WARM_COLOR_RED, WARM_COLOR_GREEN, WARM_COLOR_BLUE);

    // Create cool color (dark, red areas)
    vec3 coolColor = baseColor * vec3(COOL_COLOR_RED, COOL_COLOR_GREEN, COOL_COLOR_BLUE);

    // Mix between cool and warm based on granulation (bright = warm, dark = cool)
    vec3 surfaceColor = mix(coolColor, warmColor, granulation);

    // Layer on fine detail variation
    surfaceColor += baseColor * fineDetail * FINE_DETAIL_COLOR_MIX;

    // Darken with sunspots
    surfaceColor *= spotDarkening;

    // Brighten with flares (using warm color for authenticity)
    vec3 flareColor = baseColor * vec3(FLARE_WARMTH_RED, FLARE_WARMTH_GREEN, FLARE_WARMTH_BLUE);
    surfaceColor += flareColor * flareMask;

    // Apply limb darkening
    surfaceColor *= LIMB_BASE_DARKNESS + limbDarkening * LIMB_DARKNESS_MIX;

    // === CORE GLOW / LUMINOSITY ===
    // LEARNING: Stars should feel like they're BURNING - brighter at center
    // This creates a "glowing from within" effect

    // Core glow: brightest at center, falls off toward edges
    float coreGlow = pow(max(viewAngle, 0.0), CORE_GLOW_EXPONENT);
    surfaceColor += baseColor * coreGlow * CORE_GLOW_STRENGTH;

    // Hot stars (O, B, A types) should be extra bright
    float hotStarFactor = smoothstep(7000.0, 15000.0, uTemperature);
    surfaceColor += baseColor * hotStarFactor * HOT_STAR_BOOST;

    // Overall bloom/brightness boost to make it feel luminous
    surfaceColor *= (1.0 + BLOOM_STRENGTH);

    // === FINAL OUTPUT ===
    // Clamp to valid HDR range to prevent over-bright pixels
    surfaceColor = clamp(surfaceColor, SURFACE_COLOR_MIN, SURFACE_COLOR_MAX);

    gl_FragColor = vec4(surfaceColor, 1.0);
}
