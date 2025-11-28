/**
 * Ice Giant Fragment Shader V2
 * 
 * Creates Neptune/Uranus-like ice giants with:
 * - Subtle atmospheric banding
 * - Methane-blue coloring (varies with seed)
 * - High-altitude haze layers
 * - Occasional storm features
 * - Deep atmospheric structure hints
 * 
 * Physics: Smaller than gas giants, water/ammonia/methane mantles
 * Examples: Neptune, Uranus, many "mini-Neptunes"
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
// ICE GIANT CONSTANTS
// =============================================================================

// --- Atmospheric Banding ---
const float BAND_COUNT_BASE = 5.0;        // Fewer, subtler bands than gas giants
const float BAND_COUNT_VARIATION = 3.0;
const float BAND_VISIBILITY = 0.12;       // Subtle banding
const float BAND_WOBBLE_STRENGTH = 0.015; // Less wobble than gas giants

// --- Color Palettes ---
// Different ice giant compositions lead to different colors
const vec3 COLOR_NEPTUNE_BLUE = vec3(0.4, 0.6, 0.95);    // Deep blue (methane-rich)
const vec3 COLOR_URANUS_CYAN = vec3(0.6, 0.9, 0.95);     // Cyan-green (methane + haze)
const vec3 COLOR_WARM_PURPLE = vec3(0.7, 0.55, 0.9);     // Purple (warm ice giant)
const vec3 COLOR_GREY_GREEN = vec3(0.65, 0.8, 0.7);      // Grey-green (different composition)
const vec3 COLOR_PALE_BLUE = vec3(0.75, 0.85, 0.98);     // Pale blue (hazy)
const vec3 COLOR_TEAL = vec3(0.45, 0.8, 0.8);            // Teal (ammonia-rich)

// --- Haze Layers ---
const float HAZE_LAYER_COUNT = 3.0;       // Multiple haze layers
const float HAZE_LAYER_STRENGTH = 0.15;   // Visibility of layers
const float HAZE_EDGE_POWER = 2.5;        // Edge haze concentration
const float HAZE_EDGE_STRENGTH = 0.35;    // Edge haze brightness
const vec3 HAZE_COLOR = vec3(0.7, 0.85, 1.0);  // Bluish haze

// --- Cloud Features ---
const float CLOUD_SCALE = 8.0;            // Cloud pattern scale
const float CLOUD_SPEED = 0.008;          // Slow-moving clouds
const float CLOUD_BRIGHTNESS = 0.2;       // Cloud brightness boost
const int CLOUD_OCTAVES = 4;

// --- Storm Systems ---
const float STORM_PROBABILITY = 0.4;      // Less common than gas giants
const float STORM_SIZE = 0.04;            // Smaller storms
const float STORM_BRIGHTNESS = 1.3;       // Bright storm features

// --- Deep Atmosphere ---
const float DEEP_ATMO_TINT = 0.15;        // Hint of deeper layers
const vec3 DEEP_ATMO_COLOR = vec3(0.3, 0.4, 0.6);  // Darker blue-grey

// --- Axial Tilt Effect ---
// Uranus has extreme axial tilt affecting appearance
const float TILT_EFFECT_STRENGTH = 0.1;   // How much tilt affects bands

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
    float bandCount = BAND_COUNT_BASE + seedHash(uSeed) * BAND_COUNT_VARIATION;
    float phaseOffset = seedPhase(uSeed);
    float hueShift = seedHueShift(uSeed);  // Full hue shift range
    vec3 scales = seedScales(uSeed);
    
    // === COLOR PALETTE SELECTION (seed-based) ===
    // Pick a base color palette from 6 different options
    float colorSelector = seedHash(uSeed + 0.5);
    float saturationVar = 0.7 + seedHash(uSeed + 0.6) * 0.6;  // 0.7 to 1.3
    float brightnessVar = 0.8 + seedHash(uSeed + 0.7) * 0.4;  // 0.8 to 1.2
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float latitude = p.y * 0.5 + 0.5;
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    
    // === AXIAL TILT EFFECT ===
    // Some ice giants (like Uranus) have extreme tilts
    float tiltFactor = seedHash(uSeed + 0.3) * TILT_EFFECT_STRENGTH;
    float tiltedLat = latitude + sin(longitude * TAU) * tiltFactor;
    
    // === ATMOSPHERIC BANDING ===
    float bandWobble = snoise3D(vec3(p.x * 6.0 + phaseOffset, latitude * 2.0, p.z * 6.0)) * BAND_WOBBLE_STRENGTH;
    float bandPattern = sin((tiltedLat + bandWobble) * 3.14159 * bandCount);
    bandPattern = bandPattern * 0.5 + 0.5;
    bandPattern *= BAND_VISIBILITY;
    
    // === CLOUD STRUCTURES ===
    vec3 cloudCoord = p * CLOUD_SCALE * scales.x + vec3(wrappedTime * CLOUD_SPEED, 0.0, wrappedTime * CLOUD_SPEED * 0.5) + vec3(phaseOffset);
    float clouds = fbm3D(cloudCoord, CLOUD_OCTAVES);
    clouds = clouds * 0.5 + 0.5;
    
    // High-altitude bright clouds
    float brightClouds = smoothstep(0.55, 0.75, clouds) * CLOUD_BRIGHTNESS;
    
    // === HAZE LAYERS ===
    float hazePattern = 0.0;
    for (float i = 0.0; i < HAZE_LAYER_COUNT; i++) {
        float layerLat = (i + 0.5) / HAZE_LAYER_COUNT;
        float layerDist = abs(latitude - layerLat);
        float layer = smoothstep(0.1, 0.0, layerDist) * HAZE_LAYER_STRENGTH;
        hazePattern += layer;
    }
    
    // === STORM FEATURES ===
    float stormMask = 0.0;
    if (seedHasUncommonFeature(uSeed, 0.0)) {
        vec2 stormPos = seedStormPosition(uSeed, 0.0);
        // Use longitude/latitude derived from 3D position
        vec2 coordForStorm = vec2(longitude, latitude);
        vec2 delta = coordForStorm - stormPos;
        if (delta.x > 0.5) delta.x -= 1.0;
        if (delta.x < -0.5) delta.x += 1.0;
        float stormDist = length(delta) / STORM_SIZE;
        stormMask = 1.0 - smoothstep(0.0, 1.0, stormDist);
        stormMask *= stormMask;
    }
    
    // === DEEP ATMOSPHERE HINTS ===
    float depthNoise = fbm3D(spherePos * 3.0 + vec3(phaseOffset), 3);
    depthNoise = depthNoise * 0.5 + 0.5;
    float depthHint = depthNoise * DEEP_ATMO_TINT * (1.0 - clouds * 0.5);
    
    // === COLOR CALCULATION ===
    // Select base palette based on seed - creates distinct looks
    vec3 paletteColor;
    if (colorSelector < 0.17) {
        paletteColor = COLOR_NEPTUNE_BLUE;
    } else if (colorSelector < 0.33) {
        paletteColor = COLOR_URANUS_CYAN;
    } else if (colorSelector < 0.5) {
        paletteColor = COLOR_WARM_PURPLE;
    } else if (colorSelector < 0.67) {
        paletteColor = COLOR_GREY_GREEN;
    } else if (colorSelector < 0.83) {
        paletteColor = COLOR_PALE_BLUE;
    } else {
        paletteColor = COLOR_TEAL;
    }
    
    // Mix with temperature - warmer ice giants get more purple/grey tones
    float warmFactor = smoothstep(100.0, 400.0, uTemperature);
    paletteColor = mix(paletteColor, COLOR_WARM_PURPLE, warmFactor * 0.4);
    
    // Apply hue shift for additional variety
    vec3 paletteHSV = rgb2hsv(paletteColor);
    paletteHSV.x = fract(paletteHSV.x + hueShift);
    paletteHSV.y *= saturationVar;
    paletteHSV.z *= brightnessVar;
    vec3 variedPalette = hsv2rgb(paletteHSV);
    
    // Blend with base color from data (allows system-specific tinting)
    vec3 atmosphereColor = mix(variedPalette, variedPalette * uBaseColor * 1.5, 0.25);
    
    // Banding affects color subtly
    vec3 bandColorWarm = atmosphereColor * 1.05;
    vec3 bandColorCool = atmosphereColor * 0.95;
    atmosphereColor = mix(bandColorCool, bandColorWarm, bandPattern);
    
    // Add cloud brightness
    atmosphereColor += vec3(brightClouds) * variedPalette;
    
    // Add haze layers
    atmosphereColor = mix(atmosphereColor, HAZE_COLOR, hazePattern * 0.5);
    
    // Add storm brightness
    atmosphereColor = mix(atmosphereColor, atmosphereColor * STORM_BRIGHTNESS, stormMask);
    
    // Add deep atmosphere hint
    atmosphereColor = mix(atmosphereColor, DEEP_ATMO_COLOR, depthHint);
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseHalfLambert(vNormal, lightDir);
    
    // Limb darkening
    float limb = limbDarkeningStylized(vNormal, LIMB_EDGE_LOW, LIMB_EDGE_HIGH, LIMB_MIN_BRIGHTNESS);
    
    vec3 litColor = atmosphereColor * diff * limb;
    
    // === EDGE HAZE ===
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float edgeHaze = pow(edgeFactor, HAZE_EDGE_POWER) * HAZE_EDGE_STRENGTH;
    litColor += HAZE_COLOR * edgeHaze;
    
    // === STAR TINT ===
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= starTint;
    
    gl_FragColor = vec4(litColor, 1.0);
}

