/**
 * Earth Surface Fragment Shader
 * Creates procedural ocean/land texture with city lights
 */

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// Constants - Noise Generation
// =============================================================================

const float NOISE_BASE_SCALE = 2.0;
const float NOISE_SCALE_MULTIPLIER_2 = 2.0;
const float NOISE_SCALE_MULTIPLIER_4 = 4.0;
const float NOISE_AMPLITUDE_1 = 0.5;
const float NOISE_AMPLITUDE_2 = 0.25;
const float NOISE_AMPLITUDE_3 = 0.125;
const float NOISE_NORMALIZATION = 1.875;

// =============================================================================
// Constants - Ocean Colors
// =============================================================================

const vec3 DEEP_OCEAN_COLOR = vec3(0.02, 0.06, 0.15);
const vec3 SHALLOW_OCEAN_COLOR = vec3(0.05, 0.15, 0.30);
const float OCEAN_DEPTH_MIX_FACTOR = 0.5;

// =============================================================================
// Constants - Land Colors
// =============================================================================

const vec3 LAND_COLOR = vec3(0.06, 0.20, 0.08); // More green
const vec3 DESERT_COLOR = vec3(0.25, 0.18, 0.10); // More tan/brown
const float DESERT_NOISE_SCALE = 8.0;

// =============================================================================
// Constants - Land/Ocean Threshold
// =============================================================================

const float LAND_THRESHOLD = 0.52;
const float LAND_THRESHOLD_SOFTNESS = 0.05;

// =============================================================================
// Constants - City Lights
// =============================================================================

const float CITY_LIGHTS_NOISE_SCALE = 20.0;
const float CITY_LIGHTS_SMOOTHSTEP_MIN = 0.7;
const float CITY_LIGHTS_SMOOTHSTEP_MAX = 0.9;
const float CITY_LIGHTS_INTENSITY = 0.15;
const vec3 CITY_LIGHTS_COLOR = vec3(1.0, 0.9, 0.6);

// =============================================================================
// Constants - Limb Darkening
// =============================================================================

const float LIMB_DARKENING_SMOOTHSTEP_MIN = -0.3;
const float LIMB_DARKENING_SMOOTHSTEP_MAX = 0.6;
const float LIMB_DARKENING_MIN_FACTOR = 0.5;
const float LIMB_DARKENING_MAX_FACTOR = 0.5;

// =============================================================================
// Constants - View Direction
// =============================================================================

const vec3 UP_VECTOR = vec3(0.0, 1.0, 0.0);

// =============================================================================
// Simplex Noise (for land/ocean variation)
// =============================================================================

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// =============================================================================
// Main
// =============================================================================

void main() {
    // Generate noise for land masses (lower scale = larger continents)
    float noise = snoise(vUv * NOISE_BASE_SCALE) * NOISE_AMPLITUDE_1;
    noise += snoise(vUv * NOISE_BASE_SCALE * NOISE_SCALE_MULTIPLIER_2) * NOISE_AMPLITUDE_2;
    noise += snoise(vUv * NOISE_BASE_SCALE * NOISE_SCALE_MULTIPLIER_4) * NOISE_AMPLITUDE_3;
    noise = noise / NOISE_NORMALIZATION; // Normalize

    // Mix ocean depths
    vec3 oceanColor = mix(DEEP_OCEAN_COLOR, SHALLOW_OCEAN_COLOR, noise * OCEAN_DEPTH_MIX_FACTOR);

    // Determine land vs ocean (~40% land, lower threshold = more land)
    float isLand = smoothstep(LAND_THRESHOLD - LAND_THRESHOLD_SOFTNESS, LAND_THRESHOLD + LAND_THRESHOLD_SOFTNESS, noise);

    // Mix land types
    vec3 landColor = mix(LAND_COLOR, DESERT_COLOR, snoise(vUv * DESERT_NOISE_SCALE) * 0.5 + 0.5);

    // Final surface color
    vec3 surfaceColor = mix(oceanColor, landColor, isLand);

    // Add subtle city lights on dark side (night)
    float lightNoise = snoise(vUv * CITY_LIGHTS_NOISE_SCALE);
    float cityLights = smoothstep(CITY_LIGHTS_SMOOTHSTEP_MIN, CITY_LIGHTS_SMOOTHSTEP_MAX, lightNoise) * isLand * CITY_LIGHTS_INTENSITY;
    surfaceColor += CITY_LIGHTS_COLOR * cityLights;

    // Darken edges (limb darkening) - less aggressive
    float limb = dot(vNormal, UP_VECTOR);
    limb = smoothstep(LIMB_DARKENING_SMOOTHSTEP_MIN, LIMB_DARKENING_SMOOTHSTEP_MAX, limb);
    surfaceColor *= LIMB_DARKENING_MIN_FACTOR + limb * LIMB_DARKENING_MAX_FACTOR;

    gl_FragColor = vec4(surfaceColor, 1.0);
}
