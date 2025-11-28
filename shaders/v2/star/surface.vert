/**
 * Star Surface Vertex Shader V2
 * 
 * Displaces vertices to create bubbling, churning star surface.
 * The sphere actually deforms with noise-based displacement.
 * 
 * @author guinetik
 * @see https://github.com/guinetik
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

// Uniforms for animation
uniform float uTime;
uniform float uSeed;
uniform float uActivityLevel;

// Displacement parameters (tuned down ~5%)
const float DISPLACEMENT_AMOUNT = 0.075;     // Base displacement strength
const float DISPLACEMENT_SCALE = 3.0;        // Noise frequency
const float DISPLACEMENT_SPEED = 0.4;        // Animation speed (faster!)

const float BUBBLE_SCALE = 5.0;              // Larger bubbles
const float BUBBLE_SPEED = 0.25;             // Bubble rise speed (faster!)
const float BUBBLE_AMOUNT = 0.045;           // Bubble displacement

const float RIPPLE_SCALE = 8.0;              // Fine ripples
const float RIPPLE_SPEED = 0.8;              // Ripple animation (faster!)
const float RIPPLE_AMOUNT = 0.018;           // Ripple displacement

// Varyings to pass to fragment shader
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;
varying float vDisplacement;  // Pass displacement to fragment for coloring

void main() {
    // Wrap time to prevent precision loss
    float time = mod(uTime, 1000.0);
    
    // Normalized position on sphere
    vec3 spherePos = normalize(position);
    
    // === LARGE SCALE CHURNING ===
    // Big slow-moving displacement like convection cells
    vec3 noisePos1 = spherePos * DISPLACEMENT_SCALE + vec3(0.0, time * DISPLACEMENT_SPEED, 0.0);
    float churn = snoise3D(noisePos1);
    
    // Add seed variation so each star is unique
    float seedOffset = seedHash(uSeed) * 100.0;
    churn += snoise3D(noisePos1 + vec3(seedOffset)) * 0.5;
    
    // === RISING BUBBLES ===
    // Faster upward-moving displacement
    vec3 noisePos2 = spherePos * BUBBLE_SCALE + vec3(0.0, time * BUBBLE_SPEED, time * 0.02);
    float bubbles = snoise3D(noisePos2);
    bubbles = max(bubbles, 0.0); // Only outward bubbles
    bubbles = pow(bubbles, 1.5); // Sharpen the bubbles
    
    // === FINE RIPPLES ===
    // Quick surface ripples
    vec3 noisePos3 = spherePos * RIPPLE_SCALE + vec3(time * RIPPLE_SPEED * 0.5, time * RIPPLE_SPEED, 0.0);
    float ripples = snoise3D(noisePos3);
    
    // === COMBINE DISPLACEMENTS ===
    float totalDisplacement = 0.0;
    totalDisplacement += churn * DISPLACEMENT_AMOUNT;
    totalDisplacement += bubbles * BUBBLE_AMOUNT;
    totalDisplacement += ripples * RIPPLE_AMOUNT;
    
    // Scale by activity level (more active stars = more displacement)
    totalDisplacement *= 0.5 + uActivityLevel * 1.0;
    
    // Add pulsation
    float pulse = sin(time * 0.5 + seedHash(uSeed) * 6.28) * 0.3 + 0.7;
    totalDisplacement *= pulse;
    
    // === DISPLACE VERTEX ===
    // Move vertex along its normal (outward from sphere center)
    vec3 displacedPosition = position + normal * totalDisplacement;
    
    // === RECALCULATE NORMAL ===
    // Approximate new normal by sampling displacement at nearby points
    float eps = 0.01;
    vec3 tangent1 = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    if (length(tangent1) < 0.1) tangent1 = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
    vec3 tangent2 = normalize(cross(normal, tangent1));
    
    // Sample displacement at offset positions
    vec3 pos1 = normalize(position + tangent1 * eps);
    vec3 pos2 = normalize(position + tangent2 * eps);
    
    vec3 nPos1_1 = pos1 * DISPLACEMENT_SCALE + vec3(0.0, time * DISPLACEMENT_SPEED, 0.0);
    vec3 nPos1_2 = pos2 * DISPLACEMENT_SCALE + vec3(0.0, time * DISPLACEMENT_SPEED, 0.0);
    
    float d1 = snoise3D(nPos1_1) * DISPLACEMENT_AMOUNT * (0.5 + uActivityLevel);
    float d2 = snoise3D(nPos1_2) * DISPLACEMENT_AMOUNT * (0.5 + uActivityLevel);
    
    vec3 p0 = displacedPosition;
    vec3 p1 = pos1 * length(position) + normalize(pos1) * d1;
    vec3 p2 = pos2 * length(position) + normalize(pos2) * d2;
    
    vec3 newNormal = normalize(cross(p1 - p0, p2 - p0));
    // Blend with original normal to avoid too harsh changes
    newNormal = normalize(mix(normal, newNormal, 0.7));
    
    // === OUTPUT ===
    vNormal = normalize(normalMatrix * newNormal);
    vUv = uv;
    vPosition = displacedPosition;
    vDisplacement = totalDisplacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
