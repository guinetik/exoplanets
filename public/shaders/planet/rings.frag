/**
 * Planetary Rings Fragment Shader
 * Creates Saturn-like ring bands with gaps, transparency variations, and color
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uSeed;
uniform float uDensity;      // Affects ring density/opacity
uniform float uInsolation;   // Affects ring brightness

varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// Constants
// =============================================================================

const float PI = 3.14159265359;

// Ring structure - defines gaps and bands
const float RING_BANDS = 12.0;          // Number of major ring bands
const float GAP_FREQUENCY = 3.0;        // Frequency of gaps within bands
const float CASSINI_POSITION = 0.45;    // Position of main gap (like Cassini Division)
const float CASSINI_WIDTH = 0.08;       // Width of main gap

// Noise for variation
const float NOISE_SCALE = 50.0;
const float NOISE_STRENGTH = 0.15;

// =============================================================================
// Noise Functions
// =============================================================================

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// =============================================================================
// Main Shader
// =============================================================================

void main() {
    // Ring radial position (0 = inner edge, 1 = outer edge)
    // For ringGeometry, vUv.x goes from inner to outer radius
    float radialPos = vUv.x;
    float angularPos = vUv.y;

    // === RING BAND STRUCTURE ===
    // Create concentric bands
    float bandPattern = sin(radialPos * PI * RING_BANDS + uSeed * 10.0) * 0.5 + 0.5;

    // Add smaller variations within bands
    float fineDetail = sin(radialPos * PI * RING_BANDS * GAP_FREQUENCY + uSeed * 5.0) * 0.5 + 0.5;
    bandPattern = mix(bandPattern, fineDetail, 0.3);

    // === CASSINI-LIKE DIVISION (main gap) ===
    float cassiniGap = smoothstep(CASSINI_POSITION - CASSINI_WIDTH, CASSINI_POSITION - CASSINI_WIDTH * 0.5, radialPos) *
                       (1.0 - smoothstep(CASSINI_POSITION + CASSINI_WIDTH * 0.5, CASSINI_POSITION + CASSINI_WIDTH, radialPos));
    bandPattern *= (1.0 - cassiniGap * 0.8); // Reduce but don't eliminate completely

    // === SECONDARY GAPS ===
    // Encke-like gap near outer edge
    float enckeGap = smoothstep(0.75, 0.77, radialPos) * (1.0 - smoothstep(0.78, 0.80, radialPos));
    bandPattern *= (1.0 - enckeGap * 0.6);

    // Inner gap
    float innerGap = smoothstep(0.15, 0.17, radialPos) * (1.0 - smoothstep(0.18, 0.20, radialPos));
    bandPattern *= (1.0 - innerGap * 0.5);

    // === NOISE FOR NATURAL VARIATION ===
    vec2 noiseCoord = vec2(radialPos * NOISE_SCALE, angularPos * NOISE_SCALE + uSeed * 100.0);
    float noiseVal = noise(noiseCoord) * NOISE_STRENGTH;
    bandPattern += noiseVal - NOISE_STRENGTH * 0.5;

    // === EDGE FALLOFF ===
    // Fade out at inner and outer edges
    float innerFade = smoothstep(0.0, 0.1, radialPos);
    float outerFade = 1.0 - smoothstep(0.9, 1.0, radialPos);
    bandPattern *= innerFade * outerFade;

    // === COLOR VARIATION ===
    // Base color with subtle radial gradient
    vec3 innerColor = uBaseColor * 0.8;  // Slightly darker inner rings
    vec3 outerColor = uBaseColor * 1.1;  // Slightly brighter outer rings
    vec3 ringColor = mix(innerColor, outerColor, radialPos);

    // Add subtle warm/cool variation based on seed
    float colorShift = sin(radialPos * PI * 4.0 + uSeed * 7.0) * 0.1;
    ringColor.r += colorShift;
    ringColor.b -= colorShift * 0.5;

    // Brighten based on insolation
    ringColor *= 0.8 + uInsolation * 0.4;

    // === OPACITY ===
    // Base opacity affected by density
    float baseOpacity = 0.3 + uDensity * 0.3;
    float opacity = bandPattern * baseOpacity;

    // Clamp values
    opacity = clamp(opacity, 0.0, 0.7);
    ringColor = clamp(ringColor, 0.0, 1.0);

    gl_FragColor = vec4(ringColor, opacity);
}
