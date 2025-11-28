/**
 * Sub-Neptune Fragment Shader V2
 *
 * Creates mini-Neptune/sub-Neptune worlds with:
 * - Thick, hazy atmospheres obscuring any surface
 * - Smooth, featureless appearance at low detail
 * - Subtle atmospheric structure at high detail
 * - Varied coloring from hydrogen-rich to water-rich
 *
 * Physics: 2-4 Earth radii, low density, thick H/He envelopes
 * These are the most common type of exoplanet found
 * Examples: Kepler-11 planets, many K2 discoveries
 */

// Precision qualifiers MUST be before includes for Chrome/ANGLE compatibility
#ifdef GL_ES
precision highp float;
precision highp int;
#endif

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

// Physical color factors for data-driven variety
uniform float uColorTempFactor;
uniform float uColorCompositionFactor;
uniform float uColorIrradiationFactor;
uniform float uColorMetallicityFactor;

// =============================================================================
// SUB-NEPTUNE CONSTANTS
// =============================================================================

// --- Haze Dominance ---
// Sub-Neptunes are characterized by thick photochemical haze
const float HAZE_THICKNESS = 0.8;         // Overall haze opacity
const float HAZE_LAYERS = 4.0;            // Number of haze layers
const float HAZE_LAYER_SEPARATION = 0.08; // Vertical separation
const float HAZE_EDGE_POWER = 2.0;        // Edge brightening
const float HAZE_EDGE_INTENSITY = 0.4;    // Edge glow strength

// --- Banding (more visible than before) ---
const float BAND_COUNT_BASE = 4.0;        // Base band count
const float BAND_COUNT_VAR = 3.0;         // Variation in count
const float BAND_VISIBILITY = 0.15;       // More visible bands
const float BAND_WOBBLE = 0.025;          // More wobble for interest

// --- Color Palettes (6 distinct sub-Neptune types) ---
// Classic blue (Neptune-like mini)
const vec3 PALETTE_BLUE = vec3(0.45, 0.6, 0.9);
// Cyan/teal (ammonia-rich)
const vec3 PALETTE_CYAN = vec3(0.5, 0.8, 0.85);
// Purple/lavender (photochemical haze)
const vec3 PALETTE_PURPLE = vec3(0.65, 0.55, 0.85);
// Grey-green (exotic chemistry)
const vec3 PALETTE_GREY_GREEN = vec3(0.55, 0.7, 0.6);
// Pale pink (warm, hazy)
const vec3 PALETTE_PINK = vec3(0.8, 0.65, 0.75);
// Yellow-tan (sulfur compounds)
const vec3 PALETTE_TAN = vec3(0.8, 0.75, 0.55);

// --- Haze Colors (per palette) ---
const vec3 HAZE_BLUE = vec3(0.7, 0.8, 1.0);
const vec3 HAZE_PURPLE = vec3(0.85, 0.75, 0.95);
const vec3 HAZE_WARM = vec3(0.95, 0.85, 0.8);

// --- Deep Atmosphere ---
const float DEEP_VISIBILITY = 0.1;        // Barely visible through haze
const vec3 DEEP_COLOR = vec3(0.4, 0.5, 0.7);  // Dark blue undertone

// --- Smooth Gradients ---
const float GRADIENT_LATITUDE_STRENGTH = 0.1;  // Pole-equator color difference
const float GRADIENT_SMOOTH = 0.05;       // Very smooth transitions

// --- Photochemical Activity ---
const float PHOTOCHEM_SCALE = 8.0;        // Scale of haze variations
const float PHOTOCHEM_SPEED = 0.005;      // Slightly faster changes
const float PHOTOCHEM_STRENGTH = 0.15;    // More visible variations

// --- Cloud/Storm Features ---
const float CLOUD_SCALE = 6.0;
const float CLOUD_SPEED = 0.008;
const float CLOUD_BRIGHTNESS = 0.2;
const float STORM_PROBABILITY = 0.5;
const float STORM_SIZE = 0.06;

// --- Temperature Effects ---
const float WARM_THRESHOLD = 500.0;       // Warmer sub-Neptunes
const float WARM_BRIGHTENING = 0.15;      // Thermal brightening

// --- Limb Effects ---
const float LIMB_EDGE_LOW = 0.0;
const float LIMB_EDGE_HIGH = 0.8;
const float LIMB_MIN_BRIGHTNESS = 0.55;   // Sub-Neptunes are quite bright

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
    float hueShift = seedHueShift(uSeed);
    vec3 scales = seedScales(uSeed);
    
    // === COLOR PALETTE SELECTION ===
    float paletteSelector = seedHash(uSeed + 0.55);
    float saturationVar = 0.8 + seedHash(uSeed + 0.66) * 0.4;
    float bandCount = BAND_COUNT_BASE + seedHash(uSeed + 0.77) * BAND_COUNT_VAR;
    
    // Select base palette
    vec3 baseColor;
    vec3 hazeColor;
    if (paletteSelector < 0.17) {
        baseColor = PALETTE_BLUE;
        hazeColor = HAZE_BLUE;
    } else if (paletteSelector < 0.33) {
        baseColor = PALETTE_CYAN;
        hazeColor = HAZE_BLUE;
    } else if (paletteSelector < 0.5) {
        baseColor = PALETTE_PURPLE;
        hazeColor = HAZE_PURPLE;
    } else if (paletteSelector < 0.67) {
        baseColor = PALETTE_GREY_GREEN;
        hazeColor = HAZE_WARM;
    } else if (paletteSelector < 0.83) {
        baseColor = PALETTE_PINK;
        hazeColor = HAZE_PURPLE;
    } else {
        baseColor = PALETTE_TAN;
        hazeColor = HAZE_WARM;
    }
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    float latitude = p.y * 0.5 + 0.5;
    
    // === BANDING ===
    float bandWobble = snoise3D(vec3(p.x * 5.0 + phaseOffset, latitude * 2.0, p.z * 5.0)) * BAND_WOBBLE;
    float bandPattern = sin((latitude + bandWobble) * 3.14159 * bandCount);
    bandPattern = bandPattern * 0.5 + 0.5;
    bandPattern *= BAND_VISIBILITY;
    
    // === HAZE STRUCTURE ===
    // Multiple haze layers create depth
    float hazePattern = 0.0;
    
    if (uDetailLevel > 0.5) {
        for (float i = 0.0; i < HAZE_LAYERS; i++) {
            float layerDepth = (i + 0.5) / HAZE_LAYERS;
            float layerScale = PHOTOCHEM_SCALE * (1.0 + i * 0.3);
            
            // Use 3D position for seamless haze
            vec3 hazeCoord = p * layerScale * scales.x + vec3(wrappedTime * PHOTOCHEM_SPEED + phaseOffset + i);
            float layer = fbm3D(hazeCoord, 3) * 0.5 + 0.5;
            
            // Layers are less visible at depth
            float layerVisibility = 1.0 - layerDepth * 0.5;
            hazePattern += layer * HAZE_LAYER_SEPARATION * layerVisibility;
        }
    }
    
    // === CLOUD FEATURES ===
    float cloudPattern = 0.0;
    if (uDetailLevel > 0.5) {
        vec3 cloudCoord = p * CLOUD_SCALE * scales.x + vec3(wrappedTime * CLOUD_SPEED, 0.0, wrappedTime * CLOUD_SPEED * 0.5) + vec3(phaseOffset);
        cloudPattern = fbm3D(cloudCoord, 4);
        cloudPattern = smoothstep(0.3, 0.7, cloudPattern * 0.5 + 0.5);
    }
    
    // === STORM FEATURES ===
    float stormMask = 0.0;
    if (seedHasUncommonFeature(uSeed, 5.0)) {
        vec2 stormPos = seedStormPosition(uSeed, 5.0);
        vec2 coordForStorm = vec2(longitude, latitude);
        vec2 delta = coordForStorm - stormPos;
        if (delta.x > 0.5) delta.x -= 1.0;
        if (delta.x < -0.5) delta.x += 1.0;
        float stormDist = length(delta) / STORM_SIZE;
        stormMask = 1.0 - smoothstep(0.0, 1.0, stormDist);
        stormMask *= stormMask;
    }
    
    // === LATITUDE GRADIENT ===
    float latGradient = abs(latitude - 0.5) * 2.0;
    latGradient = smoothstep(0.0, 1.0, latGradient) * GRADIENT_LATITUDE_STRENGTH;
    
    // === COLOR CALCULATION ===
    // Apply hue shift to base palette
    vec3 baseHSV = rgb2hsv(baseColor);
    baseHSV.x = fract(baseHSV.x + hueShift);
    baseHSV.y *= saturationVar;
    vec3 variedBase = hsv2rgb(baseHSV);
    
    // Temperature affects color - warmer = more muted/tan
    float warmFactor = smoothstep(300.0, 700.0, uTemperature);
    variedBase = mix(variedBase, PALETTE_TAN, warmFactor * 0.3);
    
    // Start with varied base
    vec3 atmosphereColor = variedBase;
    
    // Apply banding - alternate between base and slightly different shade
    vec3 bandColor = variedBase * vec3(0.9, 0.95, 1.05);
    atmosphereColor = mix(atmosphereColor, bandColor, bandPattern);
    
    // Add haze structure
    atmosphereColor *= 1.0 + hazePattern * PHOTOCHEM_STRENGTH;
    
    // Add cloud brightness
    atmosphereColor += vec3(cloudPattern) * CLOUD_BRIGHTNESS * hazeColor;
    
    // Add storm brightness
    if (stormMask > 0.0) {
        vec3 stormColor = variedBase * 1.3;
        atmosphereColor = mix(atmosphereColor, stormColor, stormMask * 0.5);
    }
    
    // Latitude gradient - poles slightly cooler colored
    vec3 poleColor = atmosphereColor * vec3(0.92, 0.95, 1.05);
    atmosphereColor = mix(atmosphereColor, poleColor, latGradient);
    
    // Deep atmosphere hints
    float depthNoise = vnoise3D(p * 4.0 + vec3(phaseOffset));
    vec3 deepColor = variedBase * 0.6;
    atmosphereColor = mix(atmosphereColor, deepColor, depthNoise * DEEP_VISIBILITY);
    
    // === TEMPERATURE EFFECTS ===
    // Warmer sub-Neptunes have some thermal emission
    if (uTemperature > WARM_THRESHOLD) {
        float warmFactor = smoothstep(WARM_THRESHOLD, 1000.0, uTemperature);
        atmosphereColor += vec3(0.2, 0.1, 0.05) * warmFactor * WARM_BRIGHTENING;
    }
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseHalfLambert(vNormal, lightDir);
    
    // Gentle limb darkening
    float limb = limbDarkeningStylized(vNormal, LIMB_EDGE_LOW, LIMB_EDGE_HIGH, LIMB_MIN_BRIGHTNESS);
    
    vec3 litColor = atmosphereColor * diff * limb;
    
    // === EDGE HAZE GLOW ===
    // Sub-Neptunes have prominent atmospheric edge
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float edgeGlow = pow(edgeFactor, HAZE_EDGE_POWER) * HAZE_EDGE_INTENSITY;
    
    vec3 glowColor = mix(atmosphereColor, hazeColor, 0.5);
    litColor += glowColor * edgeGlow;
    
    // === STAR TINT ===
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= starTint;
    
    gl_FragColor = vec4(litColor, 1.0);
}

