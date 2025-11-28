/**
 * Star Corona Fragment Shader V2
 * 
 * Creates the outer glow and flare structures around stars.
 * Features:
 * - Radial falloff
 * - Animated flare structures
 * - Temperature-based coloring
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uStarColor;                // Base star color
uniform float uTime;                    // Animation time
uniform float uIntensity;               // Corona intensity/brightness

// =============================================================================
// CORONA CONSTANTS
// =============================================================================

// --- Radial Falloff ---
const float CORONA_POWER = 2.5;                     // Falloff exponent
const float CORONA_STRENGTH = 0.8;                  // Overall corona brightness
const float CORONA_EDGE_START = 0.2;                // Where corona starts (from edge)
const float CORONA_FADE_START = 0.8;                // Where corona starts fading

// --- Flare Structures ---
const float FLARE_COUNT = 6.0;                      // Number of flare rays
const float FLARE_WIDTH = 0.15;                     // Angular width of flares
const float FLARE_BRIGHTNESS = 0.6;                 // Flare intensity
const float FLARE_ROTATION_SPEED = 0.02;            // How fast flares rotate

// --- Noise Animation ---
const float NOISE_SCALE = 3.0;                      // Scale of corona noise
const float NOISE_TIME_SCALE = 0.05;                // Animation speed
const float NOISE_STRENGTH = 0.3;                   // How much noise affects corona
const int NOISE_OCTAVES = 3;                        // FBM octaves for corona detail

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

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 spherePos = normalize(vPosition);
    
    // Wrap time to prevent precision loss in Chrome/ANGLE
    float wrappedTime = wrapTime(uTime);
    
    // === VIEW ANGLE ===
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float viewAngle = max(dot(vNormal, viewDir), 0.0);
    float edgeDist = 1.0 - viewAngle;
    
    // === POLAR COORDINATES ===
    float angle = atan(spherePos.y, spherePos.x);
    
    // === RADIAL CORONA ===
    float coronaBase = pow(edgeDist, CORONA_POWER);
    
    // Fade at outer edge
    float outerFade = 1.0 - smoothstep(CORONA_FADE_START, 1.0, edgeDist);
    
    // === FLARE STRUCTURES ===
    float flareRotation = wrappedTime * FLARE_ROTATION_SPEED;
    float rotatedAngle = angle + flareRotation;
    float flarePattern = abs(sin(rotatedAngle * FLARE_COUNT));
    flarePattern = pow(flarePattern, 1.0 / FLARE_WIDTH);
    
    // Flares extend further at edge
    float flareIntensity = flarePattern * edgeDist * FLARE_BRIGHTNESS;
    
    // === ANIMATED NOISE ===
    vec3 noiseCoord = spherePos * NOISE_SCALE + vec3(wrappedTime * NOISE_TIME_SCALE);
    float coronaNoise = fbm3D(noiseCoord, NOISE_OCTAVES) * 0.5 + 0.5;
    
    // === COMBINE CORONA ===
    float corona = coronaBase * CORONA_STRENGTH * uIntensity;
    corona *= 1.0 + (coronaNoise - 0.5) * NOISE_STRENGTH;
    corona += flareIntensity * uIntensity;
    corona *= outerFade;
    
    // === COLOR CALCULATION ===
    vec3 baseColor = uStarColor;
    
    // Edge color shift (warmer at edges)
    vec3 edgeColor = baseColor * vec3(EDGE_COLOR_SHIFT_RED, EDGE_COLOR_SHIFT_GREEN, EDGE_COLOR_SHIFT_BLUE);
    
    // Blend based on distance from center
    vec3 coronaColor = mix(baseColor, edgeColor, edgeDist);
    
    // Apply corona intensity
    coronaColor *= corona;
    
    // === ALPHA CALCULATION ===
    // Corona is transparent at inner edge, peaks in middle, fades at outer edge
    float innerMask = smoothstep(CORONA_EDGE_START, CORONA_EDGE_START + 0.2, edgeDist);
    float alpha = innerMask * pow(corona, ALPHA_FADE_POWER);
    alpha = clamp(alpha, 0.0, ALPHA_OUTER);
    
    // Ensure edges are visible
    alpha = max(alpha, edgeDist * 0.3 * outerFade);
    
    gl_FragColor = vec4(coronaColor, alpha);
}
