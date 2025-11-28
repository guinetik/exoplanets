/**
 * Star Rays Fragment Shader
 *
 * Creates beautiful radiating star rays that emanate outward and fade into space.
 * Uses sawtooth waves for unidirectional outward flow.
 *
 * Features:
 * - Rays ONLY flow outward (no bounce back)
 * - Waves travel from star edge into space
 * - Fade with distance
 * - Ray thickness scales with star size
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
const float RAY_INTENSITY = 1.8;         // Overall ray brightness
const float RAY_LENGTH = 0.3;            // How far rays extend beyond star
const float RAY_SPEED = 0.4;             // How fast waves travel outward
const float RAY_FADE_POWER = 3.0;        // How quickly rays fade with distance

// Number of ray spokes
const int NUM_MAIN_RAYS = 6;
const int NUM_SECONDARY_RAYS = 8;

// =============================================================================
// VARYINGS
// =============================================================================

varying vec2 vUv;

// =============================================================================
// SIMPLE HASH FOR VARIATION
// =============================================================================

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// =============================================================================
// OUTWARD TRAVELING WAVE
// Creates a wave that ONLY moves outward using fract()
// =============================================================================

float outwardWave(float edgeDist, float time, float frequency, float speed) {
    // fract() creates a sawtooth wave from 0 to 1
    // As time increases, the wave moves to larger edgeDist (outward)
    float wave = fract(edgeDist * frequency - time * speed);

    // Shape the wave - sharp leading edge, gradual fade
    // This creates a "pulse" that travels outward
    wave = smoothstep(0.0, 0.3, wave) * smoothstep(1.0, 0.5, wave);

    return wave;
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center);
    float angle = atan(center.y, center.x);

    // Distance from star edge (0 at edge, positive outward)
    float edgeDist = dist - uStarRadius;

    // Only render outside the star
    if (edgeDist < 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Normalize edge distance for consistent look regardless of star size
    float normalizedDist = edgeDist / RAY_LENGTH;

    // Fade with distance (exponential falloff into space)
    float distanceFade = exp(-normalizedDist * RAY_FADE_POWER);

    // Time for animation
    float time = uTime * RAY_SPEED;

    // === RAY SPOKES ===
    float rays = 0.0;

    // Scale ray sharpness based on star size (smaller stars = sharper rays)
    float baseSharpness = 6.0 + (1.0 - uStarRadius * 4.0) * 4.0;
    baseSharpness = max(baseSharpness, 4.0);

    // Main rays - bright, defined spokes
    for (int i = 0; i < NUM_MAIN_RAYS; i++) {
        float fi = float(i);

        // Seed-based ray angle
        float rayAngle = seedHash(uSeed + fi * 0.13) * TAU;

        // Angular distance from this ray
        float angleDiff = angle - rayAngle;
        angleDiff = mod(angleDiff + PI, TAU) - PI;

        // Sharp angular falloff for ray spoke
        float angularFalloff = exp(-abs(angleDiff) * baseSharpness);

        // Outward traveling waves along this ray
        float waveFreq = 3.0 + seedHash(uSeed + fi * 0.7) * 2.0;
        float waveSpeed = 0.8 + seedHash(uSeed + fi * 0.9) * 0.4;
        float wave = outwardWave(normalizedDist, time, waveFreq, waveSpeed);

        // Second wave layer at different frequency
        float wave2 = outwardWave(normalizedDist, time * 0.7, waveFreq * 1.5, waveSpeed * 0.8);

        // Combine waves
        float waveIntensity = 0.6 + wave * 0.3 + wave2 * 0.2;

        // Ray intensity varies by seed
        float rayBrightness = 0.6 + seedHash(uSeed + fi * 0.5) * 0.4;

        rays += angularFalloff * waveIntensity * rayBrightness;
    }

    // Secondary rays - softer, fill gaps
    for (int i = 0; i < NUM_SECONDARY_RAYS; i++) {
        float fi = float(i);

        // Different seed offset for secondary rays
        float rayAngle = seedHash(uSeed + fi * 0.19 + 5.0) * TAU;

        float angleDiff = angle - rayAngle;
        angleDiff = mod(angleDiff + PI, TAU) - PI;

        // Softer angular falloff
        float angularFalloff = exp(-abs(angleDiff) * baseSharpness * 0.5) * 0.4;

        // Simpler wave for secondary rays
        float wave = outwardWave(normalizedDist, time * 0.9, 4.0, 0.6);
        float waveIntensity = 0.5 + wave * 0.3;

        rays += angularFalloff * waveIntensity * 0.5;
    }

    // Add subtle overall glow that pulses outward
    float glowWave = outwardWave(normalizedDist, time * 0.5, 2.0, 0.3);
    rays += glowWave * 0.15 * distanceFade;

    // Apply distance fade
    rays *= distanceFade;

    // Scale by activity level
    rays *= 0.6 + uActivityLevel * 0.4;

    // === COLOR ===
    vec3 baseColor = temperatureToColor(uTemperature);
    baseColor = mix(baseColor, uStarColor, 0.3);

    // Rays are bright white at base, fade to star color
    vec3 rayColor = mix(vec3(1.0, 0.98, 0.95), baseColor, clamp(normalizedDist * 0.8, 0.0, 1.0));

    // Apply intensity
    rayColor *= rays * RAY_INTENSITY;

    // === ALPHA ===
    float alpha = rays * 0.85;
    alpha = clamp(alpha, 0.0, 0.8);

    // Smooth edge at star boundary
    alpha *= smoothstep(0.0, uStarRadius * 0.15, edgeDist);

    gl_FragColor = vec4(rayColor, alpha);
}
