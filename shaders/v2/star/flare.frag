/**
 * Solar Flare Fragment Shader
 *
 * Creates a volumetric plasma eruption connected to the star.
 * Phase represents distance traveled (0 = at star, 1 = far away).
 * Features:
 * - Volumetric layered glow appearance
 * - Connected tendril to star surface
 * - Turbulent plasma texture with depth
 * - Color cools as it travels
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

uniform vec3 uStarColor;
uniform float uTime;
uniform float uFlarePhase;      // 0 = at star, 1 = far away
uniform float uFlareSeed;

varying vec2 vUv;
varying float vPhase;

void main() {
    float wrappedTime = wrapTime(uTime);

    // UV coordinates - center is at 0.5, 0.5
    vec2 uv = vUv - 0.5;
    float dist = length(uv);

    // === PHASE-BASED SHAPE TRANSITION ===
    // Near star (low phase): volumetric with tendril
    // Far from star (high phase): straight ray/beam of light

    // Ray shape - stays wide while forming, thins when escaping
    float targetThinness = 500.0;  // Final fixed thinness
    float startThinness = 8.0;     // Wide at start (explosion)
    // Only start thinning after escape (phase > 0.6)
    float thinPhase = smoothstep(0.6, 1.0, vPhase);  // 0 until 0.6, then ramps to 1
    float rayThinness = mix(startThinness, targetThinness, thinPhase);
    float rayCore = exp(-uv.x * uv.x * rayThinness);       // Converges to same width
    float rayGlow = exp(-uv.x * uv.x * rayThinness * 0.2); // Subtle glow

    // Tendril toward star (for when connected)
    float tendril = exp(-uv.x * uv.x * 15.0) * smoothstep(0.5, -0.3, uv.y);
    float softGlow = exp(-dist * dist * 8.0);

    // Light turbulence for organic feel (subtle)
    vec3 noisePos = vec3(uv * 3.0, wrappedTime * 0.2 + uFlareSeed * 10.0);
    float turbulence = snoise3D(noisePos) * 0.5 + 0.5;

    // Blend between connected look and traveling ray
    // Forms on star for 60%, then transitions to ray as it escapes
    float connectedPhase = 1.0 - smoothstep(0.55, 0.7, vPhase);

    // Connected shape: tendril + soft glow
    float connectedShape = tendril * 0.8 + softGlow * 0.6;
    connectedShape *= 0.7 + turbulence * 0.4;

    // Traveling shape: straight ray beam (more subtle)
    float travelingShape = rayCore * 2.0 + rayGlow * 0.5;

    // Blend based on phase
    float shape = mix(travelingShape, connectedShape, connectedPhase);

    // === FADE WITH DISTANCE TRAVELED ===
    // Stays bright most of the journey, quick fade at very end
    float distanceFade = 1.0 - smoothstep(0.75, 1.0, vPhase);  // Bright until 75%, then fade

    float spawnFade = smoothstep(0.0, 0.08, vPhase);
    float opacity = distanceFade * spawnFade;

    // === COLOR ===
    vec3 baseColor = uStarColor * 1.5 + vec3(0.2);
    vec3 hotColor = uStarColor * 2.0 + vec3(0.3);  // Star color, brightened
    vec3 warmColor = baseColor * vec3(1.3, 0.9, 0.6);

    // Stays hot/bright, simple color
    vec3 flareColor = mix(hotColor, warmColor, vPhase * 0.5);

    // Brighter at ray center
    flareColor *= 1.0 + rayCore * 2.0;

    // === CIRCULAR MASK ===
    float edgeMask = 1.0 - smoothstep(0.35, 0.5, dist);

    float alpha = shape * opacity * edgeMask * 0.7;  // More transparent
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(flareColor, alpha);
}
