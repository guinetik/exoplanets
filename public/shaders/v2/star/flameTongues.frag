/**
 * Star Flame Tongues Fragment Shader
 *
 * Creates visible fire protrusions that break the circular star silhouette.
 * Ported from starstudy.glsl.
 *
 * Features:
 * - Multiple flame layers at different frequencies
 * - Height-based color gradient (hot at base, cooler at tips)
 * - Rotates with star surface
 * - Only renders at the silhouette edge
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uStarColor;
uniform float uTime;
uniform float uSeed;
uniform float uActivityLevel;

// =============================================================================
// CONSTANTS
// =============================================================================

const float FLAME_INNER_RADIUS = 0.85;   // Start of flame zone (relative to mesh)
const float FLAME_OUTER_RADIUS = 1.0;    // End of flame zone
const float FLAME_MAX_HEIGHT = 0.25;     // Maximum flame extension

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vViewPosition;

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 spherePos = normalize(vPosition);
    float wrappedTime = wrapTime(uTime);

    // === VIEW GEOMETRY ===
    vec3 viewDir = normalize(-vViewPosition);
    float viewAngle = max(dot(vNormal, viewDir), 0.0);
    float rimFactor = 1.0 - viewAngle;

    // Render in wider zone to break circular silhouette (like starstudy.glsl)
    // Wider range allows flames to be visible as protrusions
    if (rimFactor < 0.4 || rimFactor > 0.98) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // === STAR ROTATION ===
    // Rotate coordinates with star so flames rotate together
    float starRot = wrappedTime * 0.5;
    float cosR = cos(starRot);
    float sinR = sin(starRot);
    vec3 rotDir = vec3(
        spherePos.x * cosR - spherePos.z * sinR,
        spherePos.y,
        spherePos.x * sinR + spherePos.z * cosR
    );

    // === POLAR COORDINATES (rotated) ===
    float angle = atan(rotDir.y, rotDir.x);
    float elev = acos(clamp(rotDir.z, -1.0, 1.0));

    // === MULTIPLE FLAME LAYERS ===

    // Large slow-moving tongues
    float tongue1 = tiledNoise3D(
        vec3(angle / TAU * 8.0, elev / PI * 4.0, wrappedTime * 0.08),
        8.0
    );
    tongue1 = pow(max(tongue1, 0.0), 1.5);

    // Medium flames
    float tongue2 = tiledNoise3D(
        vec3(angle / TAU * 16.0, elev / PI * 8.0, wrappedTime * 0.12),
        16.0
    );
    tongue2 = pow(max(tongue2, 0.0), 2.0);

    // Small flickering details
    float tongue3 = snoise3D(vec3(angle * 6.0, elev * 4.0, wrappedTime * 0.3));
    tongue3 = pow(max(tongue3, 0.0), 2.5);

    // Combine flame layers
    float flames = tongue1 * 0.5 + tongue2 * 0.35 + tongue3 * 0.15;

    // === FLAME HEIGHT CALCULATION ===
    // Each flame extends to different heights based on noise
    float flameHeight = 0.15 + flames * FLAME_MAX_HEIGHT;

    // Distance from star surface (rimFactor maps roughly to distance)
    float distFromSurface = (rimFactor - 0.3) / 0.65;  // Normalize to 0-1

    // Flame is visible if we're within its reach
    float flameReach = smoothstep(flameHeight, 0.0, distFromSurface);
    flameReach *= smoothstep(0.25, 0.35, rimFactor);  // Fade in from star surface

    // Intensity varies with height (brighter at base)
    float heightFade = 1.0 - (distFromSurface / (flameHeight + 0.001));
    heightFade = pow(max(heightFade, 0.0), 0.7);

    float intensity = flames * flameReach * heightFade;

    // Apply activity level
    intensity *= 0.6 + uActivityLevel * 0.4;

    // Lower threshold to show more flames - creates organic protrusions
    intensity = smoothstep(0.15, 0.4, intensity) * intensity;

    // === COLOR CALCULATION ===
    vec3 baseColor = uStarColor * 1.5 + vec3(0.2);

    // Hot at base (near star), cooler at tips
    vec3 baseFlameColor = baseColor * vec3(1.4, 1.1, 0.8);
    vec3 tipFlameColor = baseColor * vec3(1.1, 0.7, 0.4);
    vec3 flameColor = mix(baseFlameColor, tipFlameColor, distFromSurface);

    // Apply intensity - higher multiplier for visible protrusions
    flameColor *= intensity * 1.2;

    // === ALPHA - more visible for breaking silhouette ===
    float alpha = intensity;
    alpha = pow(alpha, 0.9);  // Lower power = more flames visible
    alpha = clamp(alpha, 0.0, 0.6);  // Higher max alpha for visibility

    // Smooth edges - wider fade range
    alpha *= smoothstep(0.4, 0.55, rimFactor) * smoothstep(0.98, 0.85, rimFactor);

    gl_FragColor = vec4(flameColor, alpha);
}
