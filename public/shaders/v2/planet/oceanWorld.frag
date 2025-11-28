/**
 * Ocean World Fragment Shader V2
 * 
 * Creates water-dominated worlds with:
 * - Deep global oceans with wave patterns
 * - Optional small landmasses/islands
 * - Dynamic cloud systems
 * - Specular reflections
 * - Depth color gradients
 * 
 * Physics: Low density rocky worlds with significant water content
 * Possibly tidally heated moons or planets in habitable zone
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/lighting.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uTemperature;
uniform float uHasAtmosphere;
uniform float uSeed;
uniform float uDensity;
uniform float uInsolation;
uniform float uStarTemp;
uniform float uDetailLevel;

// =============================================================================
// OCEAN WORLD CONSTANTS
// =============================================================================

// --- Ocean Colors ---
const vec3 OCEAN_SHALLOW = vec3(0.15, 0.45, 0.55);
const vec3 OCEAN_MID = vec3(0.08, 0.25, 0.45);
const vec3 OCEAN_DEEP = vec3(0.03, 0.10, 0.25);
const vec3 OCEAN_ABYSS = vec3(0.01, 0.03, 0.08);

// --- Ocean Properties ---
const float OCEAN_DEPTH_SCALE = 3.0;
const int OCEAN_DEPTH_OCTAVES = 4;
const float DEPTH_VARIATION = 0.6;        // How much depth varies

// --- Waves ---
const float WAVE_SCALE_LARGE = 40.0;
const float WAVE_SCALE_SMALL = 120.0;
const float WAVE_SPEED_LARGE = 0.03;
const float WAVE_SPEED_SMALL = 0.08;
const float WAVE_HEIGHT_LARGE = 0.015;
const float WAVE_HEIGHT_SMALL = 0.005;

// --- Islands/Land ---
const float LAND_PROBABILITY = 0.5;       // Chance of having land
const float LAND_COVERAGE = 0.15;         // Maximum land coverage
const float LAND_THRESHOLD = 0.85;        // Height threshold for land
const vec3 LAND_COLOR_BEACH = vec3(0.8, 0.75, 0.6);
const vec3 LAND_COLOR_VEGETATION = vec3(0.2, 0.5, 0.25);
const vec3 LAND_COLOR_ROCK = vec3(0.45, 0.4, 0.35);

// --- Clouds ---
const float CLOUD_SCALE = 5.0;
const float CLOUD_SPEED = 0.01;
const float CLOUD_THRESHOLD = 0.4;
const float CLOUD_OPACITY = 0.6;
const int CLOUD_OCTAVES = 5;

// --- Specular ---
const float SPEC_POWER = 48.0;
const float SPEC_INTENSITY = 0.8;

// --- Atmospheric Haze ---
const float HAZE_POWER = 2.5;
const float HAZE_INTENSITY = 0.35;
const vec3 HAZE_COLOR = vec3(0.5, 0.7, 0.9);

// --- Limb Darkening ---
const float LIMB_EDGE_LOW = -0.15;
const float LIMB_EDGE_HIGH = 0.75;
const float LIMB_MIN_BRIGHTNESS = 0.45;

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
    
    // === SEED VARIATION ===
    float phaseOffset = seedPhase(uSeed);
    vec3 scales = seedScales(uSeed);
    float hueShift = seedHueShift(uSeed);
    
    // Determine ocean characteristics
    float hasLand = seedHash(uSeed + 0.5) < LAND_PROBABILITY ? 1.0 : 0.0;
    float oceanWarmth = seedHash(uSeed + 0.3);  // Affects color temperature
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    float latitude = p.y * 0.5 + 0.5;
    
    // === OCEAN DEPTH ===
    vec3 depthCoord = spherePos * OCEAN_DEPTH_SCALE * scales.x;
    depthCoord = seedOffset3D(depthCoord, uSeed);
    
    float oceanDepth = fbm3D(depthCoord, OCEAN_DEPTH_OCTAVES);
    oceanDepth = oceanDepth * 0.5 + 0.5;
    oceanDepth = pow(oceanDepth, 1.0 + (1.0 - DEPTH_VARIATION));
    
    // === WAVES ===
    vec3 waveNormal = vNormal;
    if (uDetailLevel > 0.5) {
        // Large waves using 3D position
        vec3 wavePos1 = p * WAVE_SCALE_LARGE + vec3(wrappedTime * WAVE_SPEED_LARGE, 0.0, wrappedTime * WAVE_SPEED_LARGE * 0.5);
        float wave1 = snoise3D(wavePos1) * WAVE_HEIGHT_LARGE;
        
        // Small waves
        vec3 wavePos2 = p * WAVE_SCALE_SMALL + vec3(wrappedTime * WAVE_SPEED_SMALL * 1.3, wrappedTime * WAVE_SPEED_SMALL, 0.0);
        float wave2 = snoise3D(wavePos2) * WAVE_HEIGHT_SMALL;
        
        // Perturb normal for wave reflections
        waveNormal = normalize(vNormal + vec3(wave1 + wave2, wave1 - wave2, 0.0));
    }
    
    // === LAND MASSES ===
    float landMask = 0.0;
    vec3 landColor = LAND_COLOR_BEACH;
    
    if (hasLand > 0.0) {
        // Generate landmass pattern
        vec3 landCoord = p * 4.0;
        landCoord = seedOffset3D(landCoord, uSeed + 0.8);
        
        float landNoise = fbm3D(landCoord, 3);
        landNoise = landNoise * 0.5 + 0.5;
        
        // Threshold for land
        float landThreshold = LAND_THRESHOLD - LAND_COVERAGE * hasLand;
        landMask = smoothstep(landThreshold, landThreshold + 0.05, landNoise);
        
        // Land color based on latitude (using 3D derived latitude)
        float absLatitude = abs(p.y);
        float vegetation = (1.0 - absLatitude) * (1.0 - landNoise);
        
        landColor = mix(LAND_COLOR_BEACH, LAND_COLOR_VEGETATION, vegetation * 0.7);
        landColor = mix(landColor, LAND_COLOR_ROCK, smoothstep(0.88, 0.95, landNoise));
    }
    
    // === OCEAN COLOR ===
    // Depth-based color gradient
    vec3 oceanColor;
    if (oceanDepth < 0.3) {
        oceanColor = mix(OCEAN_SHALLOW, OCEAN_MID, oceanDepth / 0.3);
    } else if (oceanDepth < 0.6) {
        oceanColor = mix(OCEAN_MID, OCEAN_DEEP, (oceanDepth - 0.3) / 0.3);
    } else {
        oceanColor = mix(OCEAN_DEEP, OCEAN_ABYSS, (oceanDepth - 0.6) / 0.4);
    }
    
    // Warmer oceans are more cyan, cooler are more blue
    oceanColor = mix(oceanColor, oceanColor * vec3(0.9, 1.1, 1.0), oceanWarmth);
    
    // Apply hue shift
    vec3 oceanHSV = rgb2hsv(oceanColor);
    oceanHSV.x = fract(oceanHSV.x + hueShift * 0.5);
    oceanColor = hsv2rgb(oceanHSV);
    
    // Blend with base color
    oceanColor = mix(oceanColor, oceanColor * uBaseColor * 1.5, 0.3);
    
    // === COMBINE OCEAN AND LAND ===
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseHalfLambert(vNormal, lightDir);
    
    // Specular reflections (ocean only)
    float spec = 0.0;
    if (landMask < 0.5) {
        spec = specularBlinn(waveNormal, vec3(0.0, 0.0, 1.0), lightDir, SPEC_POWER);
        spec *= SPEC_INTENSITY * (1.0 - landMask);
    }
    
    // Limb darkening
    float limb = limbDarkeningStylized(vNormal, LIMB_EDGE_LOW, LIMB_EDGE_HIGH, LIMB_MIN_BRIGHTNESS);
    
    vec3 litColor = surfaceColor * diff * limb;
    litColor += vec3(1.0, 0.95, 0.9) * spec;
    
    // === CLOUDS ===
    if (uHasAtmosphere > 0.3 && uDetailLevel > 0.5) {
        vec3 cloudCoord = p * CLOUD_SCALE * scales.y + vec3(wrappedTime * CLOUD_SPEED, 0.0, wrappedTime * CLOUD_SPEED * 0.7) + vec3(phaseOffset);
        float clouds = fbmWarped3D(cloudCoord, CLOUD_OCTAVES, 0.4);
        clouds = smoothstep(CLOUD_THRESHOLD, 0.7, clouds * 0.5 + 0.5);
        
        float cloudLit = diff * 0.9 + 0.1;
        vec3 cloudColor = vec3(cloudLit);
        
        litColor = mix(litColor, cloudColor, clouds * CLOUD_OPACITY * uHasAtmosphere);
    }
    
    // === ATMOSPHERIC HAZE ===
    if (uHasAtmosphere > 0.0) {
        float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        float haze = pow(edgeFactor, HAZE_POWER) * HAZE_INTENSITY * uHasAtmosphere;
        litColor += HAZE_COLOR * haze;
    }
    
    // === STAR TINT ===
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= starTint;
    
    gl_FragColor = vec4(litColor, 1.0);
}

