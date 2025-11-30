/**
 * Star Rays Fragment Shader
 *
 * Creates soft god rays emanating from the star.
 * Based on the Shadertoy starstudy.glsl lightRays approach.
 *
 * Features:
 * - Soft sine-wave based rays (not hard spokes)
 * - Multiple frequency layers for organic look
 * - Smooth radial falloff
 * - Rotates with star surface
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
// VARYINGS
// =============================================================================

varying vec2 vUv;

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center);  // 0 to 0.707 at corners

    // Circular mask - forces circular shape, eliminates box
    float circularMask = 1.0 - smoothstep(0.35, 0.5, dist);

    // Only render outside the star
    if (dist < uStarRadius * 0.95) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Rotate UV with time - matches star rotation speed from Shadertoy
    float starRot = uTime * 0.5;
    float cosR = cos(starRot);
    float sinR = sin(starRot);
    vec2 rotCenter = vec2(
        center.x * cosR - center.y * sinR,
        center.x * sinR + center.y * cosR
    );

    float angle = atan(rotCenter.y, rotCenter.x);

    // === SOFT DIFFUSE RAYS (natural light haze) ===
    float rays = 0.0;

    // Multiple soft frequency layers - very gentle
    for (float i = 1.0; i < 4.0; i++) {
        float rayFreq = 4.0 + i * 2.0;

        // Sine wave creates smooth variation
        float ray = sin(angle * rayFreq + uSeed * i) * 0.5 + 0.5;

        // Very soft shaping - barely visible rays (pow 3 instead of 8)
        ray = pow(ray, 3.0);

        // Each layer contributes less
        rays += ray / (i * 1.5);
    }

    // Subtle seed variation
    float seedOffset = seedHash(uSeed) * TAU;
    float extraRay = sin(angle * 5.0 + seedOffset) * 0.5 + 0.5;
    extraRay = pow(extraRay, 4.0);
    rays += extraRay * 0.15;

    // Normalize to keep values reasonable
    rays *= 0.4;

    // === SMOOTH RADIAL FALLOFF ===
    // Gaussian falloff - naturally reaches zero at edges
    float falloff = exp(-dist * dist * 6.0);

    // Soft fade in from star center
    float rayMask = smoothstep(uStarRadius * 0.5, uStarRadius * 3.0, dist);

    // Combine
    rays = rays * falloff + falloff * 0.2;
    rays *= rayMask;

    // Scale by activity level
    rays *= 0.6 + uActivityLevel * 0.4;

    // === COLOR ===
    vec3 baseColor = temperatureToColor(uTemperature);
    baseColor = mix(baseColor, uStarColor, 0.3);

    // Warm tint for natural glow
    vec3 rayColor = baseColor * vec3(1.05, 0.98, 0.92);

    // Subtle intensity
    rayColor *= rays * 0.2;

    // === ALPHA - very subtle, with circular mask ===
    float alpha = rays * 0.35 * circularMask;
    alpha = clamp(alpha, 0.0, 0.35);

    gl_FragColor = vec4(rayColor * circularMask, alpha);
}
