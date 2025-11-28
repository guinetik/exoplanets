/**
 * Star Surface Fragment Shader V2
 *
 * Creates dramatic burning star surfaces with:
 * - Boiling plasma effect (surface appears to bubble and flow)
 * - Spherical UV distortion (flames billow outward from center)
 * - Outward-flowing flame patterns
 * - Convective cells that rise and fall
 * - Temperature-based coloring
 * - Pulsating brightness
 *
 * Inspired by trisomie21's Shadertoy star technique
 * 
 * @author guinetik
 * @see https://github.com/guinetik
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/lighting.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uStarColor;        // Base star color
uniform float uTime;            // Animation time
uniform float uTemperature;     // Star temperature in Kelvin
uniform float uSeed;            // Deterministic seed for this star
uniform float uActivityLevel;   // Stellar activity level (0-1)

// =============================================================================
// CONSTANTS
// =============================================================================

// Plasma boiling effect
const float PLASMA_SCALE = 3.0;             // Scale of plasma bubbles
const float PLASMA_SPEED = 0.12;            // Boiling speed

// Flame flow  
const float FLAME_SCALE_COARSE = 15.0;
const float FLAME_SCALE_FINE = 45.0;
const float FLAME_FLOW_SPEED = 0.35;
const float FLAME_RISE_SPEED = 0.08;
const int FLAME_OCTAVES = 7;

// Convection cells
const float CELL_SCALE = 6.0;
const float CELL_SPEED = 0.02;
const float CELL_DEPTH = 0.3;

// Colors
const float COLOR_HOTSPOT_BOOST = 1.8;

// Limb effects
const float LIMB_DARK_POWER = 0.4;
const float EDGE_FLAME_POWER = 2.5;

// Pulsation
const float PULSE_SPEED1 = 0.5;
const float PULSE_SPEED2 = 0.25;
const float PULSE_STRENGTH = 0.3;

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;
varying float vDisplacement;  // From vertex shader - height of displacement

// =============================================================================
// PLASMA NOISE with flowing distortion
// =============================================================================

float plasmaNoise(vec3 p, float time) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float totalAmp = 0.0;
    
    for (int i = 0; i < 5; i++) {
        vec3 offset = vec3(
            sin(time * 0.1 + float(i)) * 0.5,
            cos(time * 0.15 + float(i) * 0.7) * 0.5,
            time * 0.05
        );
        
        value += amplitude * snoise3D((p + offset) * frequency);
        totalAmp += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value / totalAmp;
}

// =============================================================================
// RISING PLASMA CELLS
// =============================================================================

float risingCells(vec3 p, float time) {
    float cells = snoise3D(p * CELL_SCALE + vec3(0.0, time * CELL_SPEED, 0.0));
    float detail = snoise3D(p * CELL_SCALE * 2.5 + vec3(time * CELL_SPEED * 0.5, 0.0, time * 0.01));
    cells = cells * 0.7 + detail * 0.3;
    float rise = snoise3D(p * CELL_SCALE + vec3(0.0, time * CELL_SPEED * 2.0, 0.0));
    return cells * 0.5 + 0.5 + rise * 0.2;
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 spherePos = normalize(vPosition);
    float time = wrapTime(uTime);
    
    // === VIEW GEOMETRY ===
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float viewAngle = max(dot(vNormal, viewDir), 0.0);
    float edgeDist = 1.0 - viewAngle;
    
    // === PULSATION ===
    float pulse1 = cos(time * PULSE_SPEED1 + seedHash(uSeed) * TAU);
    float pulse2 = sin(time * PULSE_SPEED2 + seedHash(uSeed + 1.0) * TAU);
    float pulse = (pulse1 * 0.6 + pulse2 * 0.4) * PULSE_STRENGTH * uActivityLevel;
    float brightness = 0.15 + (uTemperature / 10000.0) * 0.1;
    brightness *= 1.0 + pulse;
    
    // === SPHERICAL COORDINATES ===
    float angle = atan(spherePos.y, spherePos.x);
    float elevation = acos(clamp(spherePos.z, -1.0, 1.0));
    
    // ==========================================================================
    // SPHERICAL DISTORTION - THE KEY EFFECT
    // This makes the surface appear to bulge outward like boiling plasma
    // ==========================================================================
    
    // Screen-space position on the sphere (like looking at it from front)
    vec2 sp = spherePos.xy;
    float r = dot(sp, sp);  // Squared distance from center
    
    // The magic distortion formula from trisomie21
    // Creates a lens-like effect where center bulges toward viewer
    float distortStrength = 2.0 - brightness;  // Brighter = more distortion
    sp *= distortStrength;
    r = dot(sp, sp);
    
    // Distortion factor - creates the bulging effect
    float f = (1.0 - sqrt(abs(1.0 - r))) / (r + 0.001) + brightness * 0.5;
    
    // Apply distortion to create warped UVs
    vec2 warpedUV;
    warpedUV.x = sp.x * f;
    warpedUV.y = sp.y * f;
    
    // Animate the warped UVs - this creates the flowing effect
    warpedUV += vec2(time * 0.1, 0.0);
    
    // ==========================================================================
    // PLASMA TEXTURE using warped coordinates
    // ==========================================================================
    
    // Sample noise with the distorted, animated coordinates
    vec3 plasmaCoord = vec3(warpedUV * PLASMA_SCALE, time * PLASMA_SPEED);
    float plasma1 = plasmaNoise(plasmaCoord, time);
    
    // Secondary layer with different phase
    vec3 plasma2Coord = vec3(warpedUV * PLASMA_SCALE * 1.3, time * PLASMA_SPEED * 0.8);
    float plasma2 = plasmaNoise(plasma2Coord + vec3(50.0, 50.0, 0.0), time * 1.2);
    
    // Combine plasma layers
    float plasma = plasma1 * 0.6 + plasma2 * 0.4;
    plasma = plasma * 0.5 + 0.5;  // Normalize to 0-1
    
    // Add more distortion influence from brightness variation
    float plasmaDistort = plasma * brightness * 3.14159;
    vec2 extraWarp = warpedUV + vec2(plasmaDistort, 0.0);
    
    // Third plasma layer with extra warping for more chaos
    float plasma3 = plasmaNoise(vec3(extraWarp * PLASMA_SCALE * 0.8, time * PLASMA_SPEED * 1.5), time);
    plasma = mix(plasma, plasma3 * 0.5 + 0.5, 0.3);
    
    // === OUTWARD FLOWING FLAMES ===
    vec3 flameCoord = vec3(angle / TAU, elevation / PI, time * 0.1);
    
    float newTime1 = abs(tiledNoise3D(
        flameCoord + vec3(0.0, -time * FLAME_FLOW_SPEED, time * FLAME_RISE_SPEED),
        FLAME_SCALE_COARSE
    ));
    float newTime2 = abs(tiledNoise3D(
        flameCoord + vec3(0.0, -time * FLAME_FLOW_SPEED * 0.5, time * FLAME_RISE_SPEED),
        FLAME_SCALE_FINE
    ));
    
    float flameVal1 = 1.0 - edgeDist;
    float flameVal2 = 1.0 - edgeDist;
    
    for (int i = 1; i <= FLAME_OCTAVES; i++) {
        float power = pow(2.0, float(i + 1));
        float contribution = 0.5 / power;
        
        flameVal1 += contribution * tiledNoise3D(
            flameCoord + vec3(0.0, -time * 0.1, time * 0.2),
            power * 10.0 * (newTime1 + 1.0)
        );
        flameVal2 += contribution * tiledNoise3D(
            flameCoord + vec3(0.0, -time * 0.1, time * 0.2),
            power * 25.0 * (newTime2 + 1.0)
        );
    }
    
    float flames = (flameVal1 + flameVal2) * 0.5;
    flames = clamp(flames, 0.0, 1.0);
    
    // Edge flame overflow
    float edgeBoost = pow(edgeDist, 0.5) * EDGE_FLAME_POWER * uActivityLevel;
    flames += edgeBoost * flames * 0.5;
    
    // === CONVECTION CELLS ===
    float cells = risingCells(spherePos, time);
    
    // === SUNSPOTS ===
    float spotNoise = snoise3D(spherePos * 3.0 + vec3(0.0, time * 0.005, 0.0));
    float spotMask = smoothstep(0.55, 0.75, spotNoise);
    float spotDarkening = 1.0 - spotMask * 0.5;
    
    // === COLOR CALCULATION ===
    vec3 baseColor = temperatureToColor(uTemperature);
    baseColor = mix(baseColor, uStarColor, 0.3);
    
    // Normalize to prevent washout
    float maxComp = max(baseColor.r, max(baseColor.g, baseColor.b));
    if (maxComp > 0.01) {
        baseColor = baseColor / maxComp * 0.85;
    }
    
    // Color variants
    vec3 hotColor = baseColor * vec3(1.5, 1.3, 1.2);
    hotColor = min(hotColor, vec3(1.8));
    vec3 coolColor = baseColor * vec3(0.7, 0.4, 0.3);
    vec3 warmColor = baseColor * vec3(1.2, 1.0, 0.85);
    
    // === COMBINE ALL EFFECTS ===
    
    // Plasma creates the base boiling texture (DOMINANT)
    float plasmaIntensity = plasma;
    
    // Flames add streaks
    float flameIntensity = flames * 0.6;
    
    // Cells add larger variation
    float cellIntensity = cells * CELL_DEPTH;
    
    // Combined - plasma is the main visual, flames and cells modulate it
    float totalIntensity = plasmaIntensity * 0.5 + flameIntensity * 0.35 + cellIntensity * 0.15;
    totalIntensity *= spotDarkening;
    totalIntensity *= 1.0 + pulse * 0.5;
    
    // Raised areas (positive displacement) are hotter/brighter
    float displacementBoost = vDisplacement * 8.0;  // Amplify the effect
    totalIntensity += displacementBoost * 0.5;
    totalIntensity = clamp(totalIntensity, 0.0, 1.5);
    
    // Map intensity to color
    vec3 surfaceColor;
    if (totalIntensity < 0.4) {
        surfaceColor = mix(coolColor, warmColor, totalIntensity / 0.4);
    } else if (totalIntensity < 0.7) {
        surfaceColor = mix(warmColor, hotColor, (totalIntensity - 0.4) / 0.3);
    } else {
        surfaceColor = hotColor * (1.0 + (totalIntensity - 0.7) * COLOR_HOTSPOT_BOOST);
    }
    
    // Base glow
    float burnGlow = 0.6 + brightness * 0.4;
    surfaceColor *= burnGlow;
    
    // === LIMB DARKENING ===
    float limbDark = pow(viewAngle, LIMB_DARK_POWER);
    float tempInfluence = clamp(uTemperature / 10000.0, 0.3, 1.5);
    limbDark = mix(limbDark, 1.0, tempInfluence * 0.3);
    surfaceColor *= 0.85 + limbDark * 0.15;
    
    // === EDGE GLOW ===
    float edgeGlow = pow(edgeDist, 0.3) * flames * 0.4 * uActivityLevel;
    surfaceColor += warmColor * edgeGlow;
    
    // === CENTER BOOST ===
    float centerBoost = pow(viewAngle, 1.5) * 0.3;
    surfaceColor += baseColor * centerBoost;
    
    // === HOT STAR BRIGHTNESS ===
    float hotBoost = smoothstep(7000.0, 15000.0, uTemperature) * 0.2;
    surfaceColor += baseColor * hotBoost;
    
    // === FINAL OUTPUT ===
    surfaceColor = clamp(surfaceColor, 0.0, 2.5);
    
    gl_FragColor = vec4(surfaceColor, 1.0);
}
