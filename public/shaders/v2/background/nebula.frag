/**
 * Nebula Background Fragment Shader
 *
 * Creates procedural nebula clouds inspired by Shadertoy techniques.
 * Uses spiral noise for organic shapes and HSV coloring for variety.
 *
 * Based on "Type 2 Supernova" by Duke and adapted for Three.js
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform float uTime;
uniform float uSeed;          // System seed for unique nebula per system
uniform float uDensity;       // Overall nebula density (0-1)
uniform vec3 uPrimaryColor;   // Primary nebula color
uniform vec3 uSecondaryColor; // Secondary nebula color

// =============================================================================
// CONSTANTS (PI and TAU provided by color.glsl)
// =============================================================================

// Nebula structure
const float NEBULA_SCALE = 0.5;           // Overall scale (smaller = larger features)
const float NEBULA_DETAIL = 2.0;          // Detail level
const int SPIRAL_NOISE_ITER = 4;          // Spiral noise iterations
const float NUDGE = 3.0;                  // Perpendicular offset for spiral

// Animation
const float TIME_SCALE = 0.01;            // Animation speed
const float FLOW_SPEED = 0.05;            // Cloud flow speed

// Density
const float DENSITY_THRESHOLD = 0.1;      // Where nebula becomes visible (lower = more visible)
const float DENSITY_FALLOFF = 0.5;        // Edge softness

// Colors
const float COLOR_VARIATION = 0.3;        // Color variation amount
const float BRIGHTNESS_BASE = 0.4;        // Base brightness
const float BRIGHTNESS_RANGE = 0.6;       // Brightness variation range

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vPosition;
varying vec3 vWorldPosition;

// =============================================================================
// HSV TO RGB (from iq's Smooth HSV)
// =============================================================================

vec3 hsv2rgb(float h, float s, float v) {
    return v + v * s * (clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0) - 1.0);
}

// =============================================================================
// SPIRAL NOISE (adapted from otaviogood's technique)
// Creates organic, swirling cloud structures
// =============================================================================

float spiralNoise(vec3 p, float seed) {
    float normalizer = 1.0 / sqrt(1.0 + NUDGE * NUDGE);
    float n = 1.5 - seed * 0.5;
    float iter = 2.0;

    for (int i = 0; i < SPIRAL_NOISE_ITER; i++) {
        // Add sin and cos scaled inverse with frequency
        n += -abs(sin(p.y * iter) + cos(p.x * iter)) / iter;

        // Rotate by adding perpendicular and scaling
        p.xy += vec2(p.y, -p.x) * NUDGE;
        p.xy *= normalizer;
        p.xz += vec2(p.z, -p.x) * NUDGE;
        p.xz *= normalizer;

        // Increase frequency
        iter *= 1.5 + seed * 0.2;
    }

    return n;
}

// =============================================================================
// NEBULA DENSITY FIELD
// =============================================================================

float nebulaDensity(vec3 p, float seed) {
    float k = 1.5 + seed * 0.5;

    // Spiral noise for main structure
    float spiral = spiralNoise(p * NEBULA_SCALE, seed);

    // Add some FBM detail
    float detail = fbm3D(p * NEBULA_DETAIL, 3) * 0.3;

    // Combine
    return k * (0.5 + spiral * 0.5 + detail);
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 dir = normalize(vPosition);

    // Wrap time for precision
    float time = mod(uTime * TIME_SCALE, 1000.0);

    // Generate seed-based parameters for this nebula
    float seedHash1 = seedHash(uSeed);
    float seedHash2 = seedHash(uSeed + 1.0);
    float seedHash3 = seedHash(uSeed + 2.0);
    float seedHash4 = seedHash(uSeed + 3.0);

    // Animate position
    vec3 animPos = dir + vec3(
        time * FLOW_SPEED * (seedHash1 - 0.5),
        time * FLOW_SPEED * 0.5,
        time * FLOW_SPEED * (seedHash2 - 0.5)
    );

    // === NEBULA CLOUDS ===
    vec4 nebula = vec4(0.0);

    // Only render if density is above threshold
    if (uDensity > 0.01) {
        // Sample density at multiple offsets for volumetric look
        float density = 0.0;
        vec3 lightDir = normalize(vec3(seedHash1 - 0.5, 0.3, seedHash2 - 0.5));

        // Main density sample
        float mainDensity = nebulaDensity(animPos * 2.0, seedHash1);

        // Offset samples for depth
        float offsetDensity = nebulaDensity(animPos * 2.0 + lightDir * 0.1, seedHash1);

        // Combine for soft shadows
        density = mainDensity * 0.7 + offsetDensity * 0.3;

        // Apply threshold
        float cloudMask = smoothstep(DENSITY_THRESHOLD, DENSITY_THRESHOLD + DENSITY_FALLOFF, density);
        cloudMask *= uDensity;

        // === COLOR ===
        // Use noise for color variation
        float colorNoise = fbm3D(animPos * 1.5 + vec3(seedHash3 * 10.0), 2);
        colorNoise = colorNoise * 0.5 + 0.5; // 0 to 1

        // HSV-based coloring for vibrant nebulae
        float hue = seedHash1 + colorNoise * COLOR_VARIATION;

        // Some nebulae are more saturated
        float saturation = 0.4 + seedHash2 * 0.4;
        saturation *= (1.0 - cloudMask * 0.3); // Denser areas slightly less saturated

        // Brightness varies with density
        float value = BRIGHTNESS_BASE + cloudMask * BRIGHTNESS_RANGE;
        value *= 0.8 + seedHash4 * 0.4;

        vec3 nebulaColor = hsv2rgb(hue, saturation, value);

        // Mix with provided colors
        nebulaColor = mix(nebulaColor, uPrimaryColor, 0.3);
        nebulaColor = mix(nebulaColor, uSecondaryColor, colorNoise * 0.2);

        // Edge glow effect
        float edgeGlow = pow(cloudMask, 0.5) - pow(cloudMask, 2.0);
        nebulaColor += uPrimaryColor * edgeGlow * 0.5;

        // Internal lighting variation
        float internalLight = fbm3D(animPos * 3.0 + vec3(time * 0.5), 2);
        nebulaColor *= 0.8 + internalLight * 0.4;

        nebula = vec4(nebulaColor, cloudMask * 0.5);
    }

    // === BACKGROUND STARS (sparse, for depth) ===
    float starField = 0.0;

    // Hash position for star placement
    vec3 starPos = floor(dir * 200.0);
    float starHash = seedHash(dot(starPos, vec3(127.1, 311.7, 74.7)) + uSeed);

    if (starHash > 0.995) {
        // Bright star
        vec3 starCenter = (starPos + 0.5) / 200.0;
        float dist = length(dir - normalize(starCenter));
        starField = exp(-dist * 800.0) * (0.5 + starHash * 0.5);
    }

    // Star color varies with hash
    vec3 starColor = vec3(1.0);
    if (starField > 0.0) {
        float colorHash = seedHash(starHash * 100.0);
        if (colorHash < 0.3) {
            starColor = vec3(1.0, 0.9, 0.8); // Warm
        } else if (colorHash < 0.6) {
            starColor = vec3(0.9, 0.95, 1.0); // Cool
        }
    }

    // === COMBINE ===
    vec3 finalColor = nebula.rgb;
    float finalAlpha = nebula.a;

    // Add stars behind nebula
    finalColor += starColor * starField * (1.0 - nebula.a * 0.5);
    finalAlpha = max(finalAlpha, starField * 0.8);

    // Very subtle base glow
    finalAlpha = max(finalAlpha, 0.02);

    gl_FragColor = vec4(finalColor, finalAlpha);
}
