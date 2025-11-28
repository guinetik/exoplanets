/**
 * Star Rays Fragment Shader
 *
 * Creates beautiful radiating star rays that emanate outward and fade into space.
 * Inspired by "Awesome star" by Foxes on Shadertoy.
 *
 * Features:
 * - Rays radiate OUTWARD from star surface
 * - 4D noise for animated ray patterns
 * - Fade into space with distance
 * - Temperature-based coloring
 * - Seed-based unique ray patterns per star
 */

#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uStarColor;
uniform float uTime;
uniform float uTemperature;
uniform float uSeed;
uniform float uActivityLevel;
uniform float uStarRadius;      // Normalized star radius in UV space (0-1)

// =============================================================================
// CONSTANTS (PI and TAU provided by color.glsl)
// =============================================================================

// Ray parameters
const float RAY_INTENSITY = 2.0;         // Overall ray brightness
const float RAY_LENGTH = 0.35;           // How far rays extend beyond star
const float RAY_TIME_SCALE = 0.3;        // Animation speed (outward drift)
const float RAY_FADE_POWER = 2.0;        // How quickly rays fade with distance

// Number of main ray spokes
const int NUM_RAYS = 6;
const float RAY_SHARPNESS = 8.0;         // Angular sharpness of rays

// =============================================================================
// VARYINGS
// =============================================================================

varying vec2 vUv;

// =============================================================================
// 4D NOISE (from Foxes' Awesome Star)
// =============================================================================

vec4 hash4(const in vec4 n) {
    return fract(sin(n) * 1399763.5453123);
}

float noise4q(vec4 x) {
    vec4 n3 = vec4(0.0, 0.25, 0.5, 0.75);
    vec4 p2 = floor(x.wwww + n3);
    vec4 b = floor(x.xxxx + n3) + floor(x.yyyy + n3) * 157.0 + floor(x.zzzz + n3) * 113.0;
    vec4 p1 = b + fract(p2 * 0.00390625) * vec4(164352.0, -164352.0, 163840.0, -163840.0);
    p2 = b + fract((p2 + 1.0) * 0.00390625) * vec4(164352.0, -164352.0, 163840.0, -163840.0);

    vec4 f1 = fract(x.xxxx + n3);
    vec4 f2 = fract(x.yyyy + n3);
    f1 *= f1 * (3.0 - f1 - f1);
    f2 *= f2 * (3.0 - f2 - f2);

    vec4 n1 = vec4(0.0, 1.0, 157.0, 158.0);
    vec4 n2 = vec4(113.0, 114.0, 270.0, 271.0);

    vec4 vs1 = mix(hash4(p1), hash4(n1.yyyy + p1), f1);
    vec4 vs2 = mix(hash4(n1.zzzz + p1), hash4(n1.wwww + p1), f1);
    vec4 vs3 = mix(hash4(p2), hash4(n1.yyyy + p2), f1);
    vec4 vs4 = mix(hash4(n1.zzzz + p2), hash4(n1.wwww + p2), f1);

    vs1 = mix(vs1, vs2, f2);
    vs3 = mix(vs3, vs4, f2);

    vs2 = mix(hash4(n2.xxxx + p1), hash4(n2.yyyy + p1), f1);
    vs4 = mix(hash4(n2.zzzz + p1), hash4(n2.wwww + p1), f1);
    vs2 = mix(vs2, vs4, f2);

    vs4 = mix(hash4(n2.xxxx + p2), hash4(n2.yyyy + p2), f1);
    vec4 vs5 = mix(hash4(n2.zzzz + p2), hash4(n2.wwww + p2), f1);
    vs4 = mix(vs4, vs5, f2);

    f1 = fract(x.zzzz + n3);
    f2 = fract(x.wwww + n3);
    f1 *= f1 * (3.0 - f1 - f1);
    f2 *= f2 * (3.0 - f2 - f2);

    vs1 = mix(vs1, vs2, f1);
    vs3 = mix(vs3, vs4, f1);
    vs1 = mix(vs1, vs3, f2);

    float r = dot(vs1, vec4(0.25));
    return r * r * (3.0 - r - r);
}

// =============================================================================
// OUTWARD RADIATING RAYS
// =============================================================================

float radiatingRays(vec2 uv, float starRadius, float time, float seed) {
    vec2 center = uv - 0.5;
    float dist = length(center);
    float angle = atan(center.y, center.x);

    // Only render rays outside the star
    if (dist < starRadius * 0.95) {
        return 0.0;
    }

    // Distance from star edge (0 at edge, increases outward)
    float edgeDist = dist - starRadius;

    // Fade rays as they extend into space
    float distanceFade = exp(-edgeDist * RAY_FADE_POWER / RAY_LENGTH);

    // Create ray spokes at seed-based angles
    float rays = 0.0;

    for (int i = 0; i < NUM_RAYS; i++) {
        float fi = float(i);

        // Each ray at a different angle based on seed
        float rayAngle = seedHash(seed + fi * 0.1) * TAU;

        // Angular distance from this ray
        float angleDiff = angle - rayAngle;
        // Wrap to -PI to PI
        angleDiff = mod(angleDiff + PI, TAU) - PI;

        // Sharp ray falloff
        float rayStrength = exp(-abs(angleDiff) * RAY_SHARPNESS);

        // Add noise variation along the ray
        // Key: use (edgeDist - time) for OUTWARD flow
        // Pattern at edge moves outward as time increases
        float noiseCoord = edgeDist * 10.0 - time * 3.0;
        float rayNoise = noise4q(vec4(
            cos(rayAngle) * 5.0,
            sin(rayAngle) * 5.0,
            noiseCoord,
            seed * 10.0 + fi
        ));

        // Vary ray intensity
        float rayIntensity = 0.5 + seedHash(seed + fi * 0.3) * 0.5;
        rayIntensity *= (0.7 + rayNoise * 0.6);

        rays += rayStrength * rayIntensity;
    }

    // Add secondary diffuse glow rays (more of them, softer)
    for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float rayAngle = seedHash(seed + fi * 0.17 + 10.0) * TAU;
        float angleDiff = mod(angle - rayAngle + PI, TAU) - PI;

        // Softer secondary rays
        float rayStrength = exp(-abs(angleDiff) * RAY_SHARPNESS * 0.5) * 0.3;

        // Animated noise - flows OUTWARD (edgeDist - time)
        float noiseCoord = edgeDist * 8.0 - time * 2.0;
        float rayNoise = noise4q(vec4(
            cos(rayAngle) * 3.0,
            sin(rayAngle) * 3.0,
            noiseCoord,
            seed * 7.0 + fi + 20.0
        ));

        rays += rayStrength * (0.5 + rayNoise * 0.5);
    }

    // Apply distance fade
    rays *= distanceFade;

    // Boost near the star edge for a bright rim
    float edgeBoost = smoothstep(0.0, starRadius * 0.3, edgeDist);
    edgeBoost = 1.0 - edgeBoost * 0.5;
    rays *= edgeBoost;

    return rays;
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center);

    // Wrap time
    float time = mod(uTime * RAY_TIME_SCALE, 1000.0);

    // === RADIATING RAYS ===
    float rays = radiatingRays(uv, uStarRadius, time, uSeed);

    // Scale by activity level
    rays *= 0.5 + uActivityLevel * 0.5;

    // === COLOR ===
    vec3 baseColor = temperatureToColor(uTemperature);
    baseColor = mix(baseColor, uStarColor, 0.3);

    // Rays are warm/white at base, fade to star color
    float edgeDist = max(0.0, dist - uStarRadius);
    float colorFade = edgeDist / RAY_LENGTH;
    vec3 rayColor = mix(vec3(1.0, 0.95, 0.9), baseColor, clamp(colorFade, 0.0, 1.0));

    // Apply intensity
    rayColor *= rays * RAY_INTENSITY;

    // === ALPHA ===
    float alpha = rays * 0.9;
    alpha = clamp(alpha, 0.0, 0.85);

    // Hide inside star
    alpha *= smoothstep(uStarRadius * 0.9, uStarRadius * 1.05, dist);

    gl_FragColor = vec4(rayColor, alpha);
}
