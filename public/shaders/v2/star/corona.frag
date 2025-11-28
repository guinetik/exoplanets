/**
 * Star Corona Fragment Shader V2
 *
 * Creates the outer glow and flare structures around stars.
 * Features:
 * - Radial falloff with softer edge
 * - Seed-based asymmetric flare structures
 * - Turbulent corona edges
 * - Activity-based intensity
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uStarColor;                // Base star color
uniform float uTime;                    // Animation time
uniform float uIntensity;               // Corona intensity/brightness
uniform float uSeed;                    // Deterministic seed for this star
uniform float uActivityLevel;           // Stellar activity level (0-1)

// =============================================================================
// CORONA CONSTANTS
// =============================================================================

// --- Flame Intensity ---
const float FLAME_BASE_INTENSITY = 2.0;             // Base flame brightness

// --- Flare Structures (seed-based asymmetric) ---
const float FLARE_BRIGHTNESS = 3.0;                 // Flare intensity (boosted for visibility)
const float FLARE_TIME_SCALE = 0.4;                 // Flare pulsation speed (5x faster!)
const int NUM_FLARES = 5;                           // Number of major flare sites
const float FLARE_RADIAL_SPEED = 0.8;               // How fast flares shoot outward

// --- Turbulence (FAST - visible swirling) ---
const float TURBULENCE_SCALE = 2.5;                 // Scale of turbulent noise
const float TURBULENCE_TIME_SCALE = 0.5;            // Animation speed (4x faster!)
const float TURBULENCE_STRENGTH = 1.2;              // How much turbulence affects corona
const int TURBULENCE_OCTAVES = 4;                   // FBM octaves for turbulence

// --- Noise Animation (FAST - visible flow) ---
const float NOISE_SCALE = 2.0;                      // Scale of corona noise
const float NOISE_TIME_SCALE = 0.3;                 // Animation speed (6x faster!)
const float NOISE_STRENGTH = 0.5;                   // How much noise affects corona
const int NOISE_OCTAVES = 3;                        // FBM octaves for corona detail

// --- Prominence/Ejection Settings ---
const float PROMINENCE_HEIGHT = 0.4;                // How far prominences extend
const float PROMINENCE_WIDTH = 0.15;                // Angular width of prominences
const float PROMINENCE_SPEED = 0.25;                // How fast prominences evolve

// --- Color Shifts ---
const float EDGE_COLOR_SHIFT_RED = 1.2;             // Red boost at edges
const float EDGE_COLOR_SHIFT_GREEN = 0.8;           // Green reduction at edges
const float EDGE_COLOR_SHIFT_BLUE = 0.5;            // Blue reduction at edges

// --- Alpha/Transparency ---
const float ALPHA_OUTER = 0.8;                      // Alpha at corona peak
const float ALPHA_FADE_POWER = 2.0;                 // Fade curve power

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
    vec3 spherePos = normalize(vPosition);  // Object space - for consistent flame patterns

    // Wrap time to prevent precision loss in Chrome/ANGLE
    float wrappedTime = wrapTime(uTime);

    // === VIEW-SPACE CALCULATIONS (for proper alignment from any angle) ===
    // View direction in view space is toward -Z (looking at the object)
    vec3 viewDir = normalize(-vViewPosition);

    // How much is this surface facing the camera
    float viewAngle = max(dot(vNormal, viewDir), 0.0);

    // Rim factor: 0 at center (facing camera), 1 at silhouette edge
    float rimFactor = 1.0 - viewAngle;

    // === POLAR COORDINATES (object space for consistent flame patterns) ===
    float angle = atan(spherePos.y, spherePos.x);
    float elevation = spherePos.z; // -1 to 1

    // === FLAME VISIBILITY ===
    // Corona mesh is 1.5x star radius. Star surface is at 1/1.5 = 0.667 of corona radius.
    // Flames should be visible where we're seeing "above" the star surface.
    // At the visual rim (rimFactor high), we see more flame height.
    // At the center (rimFactor low), flames are mostly hidden by the star in front.

    // Smooth transition - flames fade in as we move toward the rim
    float flameVisibility = smoothstep(0.15, 0.5, rimFactor);

    // Additional boost at the very edge (silhouette)
    float edgeBoost = pow(rimFactor, 2.0);

    // Combine for overall flame mask
    float flameMask = flameVisibility + edgeBoost * 0.5;

    // === FLAME NOISE - determines flame intensity at each point ===
    float flameTime = wrappedTime * NOISE_TIME_SCALE;

    // Use angle + elevation for flame variation around the star
    vec3 flameCoord = vec3(
        angle * 3.0,                           // Angular variation
        elevation * 2.0,                       // Vertical variation
        flameTime * 2.0                        // Time animation
    );

    // Flame intensity noise
    float flameNoise = fbm3D(flameCoord, NOISE_OCTAVES);
    flameNoise = flameNoise * 0.5 + 0.5; // 0 to 1

    // Second layer of turbulence for detail and motion
    vec3 turbCoord = vec3(
        angle * 6.0 + wrappedTime * TURBULENCE_TIME_SCALE,
        elevation * 4.0,
        wrappedTime * TURBULENCE_TIME_SCALE * 0.5
    );
    float flameTurbulence = fbm3D(turbCoord, TURBULENCE_OCTAVES);

    // === FLAME INTENSITY ===
    // Base intensity from noise, modulated by rim factor
    float flameIntensity = flameNoise * (0.5 + flameTurbulence * 0.5);
    flameIntensity *= flameMask;  // Apply visibility mask
    flameIntensity *= uActivityLevel * 0.7 + 0.3;  // Activity level influence

    // Boost flames at the very edge for dramatic silhouette
    flameIntensity += edgeBoost * flameNoise * uActivityLevel;

    // === SOLAR PROMINENCES (large eruptions shooting outward) ===
    float prominenceTotal = 0.0;
    float flareTime = wrappedTime * FLARE_TIME_SCALE;

    for (int i = 0; i < NUM_FLARES; i++) {
        float fi = float(i);

        // Each prominence at a seed-based position
        float prominenceAngle = seedHash(uSeed + fi) * TAU;
        float prominenceElev = seedHash(uSeed + fi + 5.0) * 2.0 - 1.0;
        float prominencePhase = seedHash(uSeed + fi + 10.0) * TAU;

        // Angular distance from this prominence
        float angleDiff = abs(mod(angle - prominenceAngle + 3.1416, TAU) - 3.1416);
        float elevDiff = abs(elevation - prominenceElev);

        // Prominence appears in a localized region
        float spatialMask = exp(-angleDiff * angleDiff * 12.0 - elevDiff * elevDiff * 6.0);

        // Prominence lifecycle: grows, peaks, fades
        float cycleSpeed = 0.5 + seedHash(uSeed + fi + 20.0) * 0.5;
        float lifecycle = sin(flareTime * cycleSpeed + prominencePhase);
        lifecycle = max(lifecycle, 0.0);
        lifecycle = pow(lifecycle, 0.7);

        // Prominence intensity based on rim and lifecycle
        float prominenceIntensity = spatialMask * lifecycle * rimFactor;

        // Add noise for organic shape
        float pNoise = snoise3D(vec3(angle * 8.0, rimFactor * 5.0, wrappedTime * PROMINENCE_SPEED + fi));
        prominenceIntensity *= 0.7 + pNoise * 0.3;

        prominenceTotal += prominenceIntensity;
    }

    prominenceTotal *= FLARE_BRIGHTNESS * uActivityLevel;

    // === COMBINE INTENSITY ===
    float totalIntensity = flameIntensity * FLAME_BASE_INTENSITY;
    totalIntensity += prominenceTotal;
    totalIntensity *= uIntensity;

    // === COLOR CALCULATION ===
    vec3 baseColor = uStarColor;
    baseColor = baseColor * 1.5 + vec3(0.2);

    // Flames get warmer/redder toward edges (cooling as they extend)
    vec3 hotColor = baseColor * vec3(1.3, 1.1, 0.9);
    vec3 coolColor = baseColor * vec3(1.2, 0.7, 0.4);

    // Prominences are especially bright
    vec3 prominenceColor = baseColor * vec3(1.5, 1.0, 0.5);

    // Blend based on rim factor (further out = cooler color)
    vec3 flameColor = mix(hotColor, coolColor, rimFactor);
    flameColor = mix(flameColor, prominenceColor, min(prominenceTotal * 0.5, 1.0));

    // Apply intensity
    flameColor *= totalIntensity;

    // === ALPHA CALCULATION ===
    // Flames visible based on intensity and rim factor
    float alpha = totalIntensity * flameMask;
    alpha = pow(alpha, 0.7);
    alpha = clamp(alpha, 0.0, ALPHA_OUTER);

    gl_FragColor = vec4(flameColor, alpha);
}
