/**
 * Gas Giant Fragment Shader V2
 * 
 * Creates Jupiter/Saturn-like gas giants with:
 * - Atmospheric banding with seed-varied count/width
 * - Storm systems (Great Red Spot-like features)
 * - Turbulent flow patterns
 * - Domain-warped cloud structures
 * - Proper limb darkening
 * 
 * Physics: Large H/He dominated worlds with deep atmospheres
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/lighting.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uBaseColor;                  // Base planet color
uniform float uTime;                      // Animation time
uniform float uTemperature;               // Equilibrium temperature (K)
uniform float uHasAtmosphere;             // Always 1.0 for gas giants
uniform float uSeed;                      // Unique seed for variation
uniform float uDensity;                   // Normalized density (affects storm intensity)
uniform float uInsolation;                // Stellar energy input
uniform float uStarTemp;                  // Host star temperature
uniform float uDetailLevel;               // LOD (0 = simple, 1 = detailed)

// =============================================================================
// GAS GIANT CONSTANTS
// =============================================================================

// --- Atmospheric Bands ---
const float BAND_COUNT_BASE = 8.0;        // Base number of bands
const float BAND_COUNT_VARIATION = 6.0;   // Seed-based variation in count
const float BAND_WIDTH_BASE = 0.5;        // Base band width
const float BAND_WIDTH_VARIATION = 0.3;   // Band width variation
const float BAND_CONTRAST = 0.4;          // Color contrast between bands
const float BAND_WOBBLE_SCALE = 8.0;      // Noise scale for band edges
const float BAND_WOBBLE_STRENGTH = 0.03;  // How much bands wobble

// --- Storm Systems ---
const float STORM_PROBABILITY = 0.7;      // Chance of having major storm
const float STORM_SIZE_MIN = 0.03;        // Minimum storm size
const float STORM_SIZE_MAX = 0.12;        // Maximum storm size
const float STORM_LATITUDE_MIN = 0.15;    // Storms avoid polar regions
const float STORM_LATITUDE_MAX = 0.85;    // Storms avoid polar regions
const float STORM_ROTATION_SPEED = 0.1;   // Internal storm rotation
const float STORM_COLOR_BOOST = 1.3;      // Color intensity in storms
const int MAX_STORMS = 3;                 // Maximum number of storms

// --- Turbulence ---
const float TURB_SCALE_LARGE = 4.0;       // Large-scale turbulence
const float TURB_SCALE_MEDIUM = 12.0;     // Medium-scale turbulence
const float TURB_SCALE_SMALL = 30.0;      // Small-scale turbulence (detail mode)
const float TURB_STRENGTH = 0.15;         // Turbulence displacement strength
const float TURB_TIME_SCALE = 0.02;       // Turbulence animation speed

// --- Cloud Layers ---
const float CLOUD_SCALE = 6.0;            // Cloud pattern scale
const float CLOUD_SPEED = 0.01;           // Cloud drift speed
const float CLOUD_WARP_STRENGTH = 0.5;    // Domain warping intensity
const int CLOUD_OCTAVES = 4;              // FBM octaves for clouds

// --- Zonal Flow (jet streams) ---
const float ZONAL_FLOW_STRENGTH = 0.08;   // Jet stream displacement
const float ZONAL_FLOW_SPEED = 0.03;      // Flow animation speed

// --- Color Palettes (6 distinct gas giant types) ---
// Jupiter-like (tan/orange bands)
const vec3 PALETTE_JUPITER_WARM = vec3(0.95, 0.75, 0.55);
const vec3 PALETTE_JUPITER_COOL = vec3(0.8, 0.65, 0.5);
// Saturn-like (golden/cream)
const vec3 PALETTE_SATURN_WARM = vec3(0.95, 0.85, 0.6);
const vec3 PALETTE_SATURN_COOL = vec3(0.85, 0.78, 0.55);
// Red-brown (high contrast)
const vec3 PALETTE_RED_WARM = vec3(0.9, 0.55, 0.4);
const vec3 PALETTE_RED_COOL = vec3(0.7, 0.5, 0.45);
// Blue-grey (cold gas giant)
const vec3 PALETTE_BLUE_WARM = vec3(0.65, 0.7, 0.85);
const vec3 PALETTE_BLUE_COOL = vec3(0.55, 0.65, 0.8);
// Green-brown (exotic)
const vec3 PALETTE_GREEN_WARM = vec3(0.7, 0.8, 0.55);
const vec3 PALETTE_GREEN_COOL = vec3(0.6, 0.7, 0.5);
// Purple-pink (warm/irradiated)
const vec3 PALETTE_PURPLE_WARM = vec3(0.85, 0.6, 0.8);
const vec3 PALETTE_PURPLE_COOL = vec3(0.7, 0.55, 0.75);
// Storm colors (more saturated)
const vec3 STORM_COLOR_MULT = vec3(1.4, 0.9, 0.7);

// --- Limb Effects ---
const float LIMB_DARK_EDGE = -0.1;        // Lower edge of limb darkening
const float LIMB_DARK_CENTER = 0.7;       // Upper edge of limb darkening
const float LIMB_MIN_BRIGHTNESS = 0.5;    // Minimum brightness of limb darkening
const float HAZE_POWER = 3.0;             // Power of haze
const float HAZE_STRENGTH = 0.25;         // Strength of haze

// --- Temperature Effects ---
const float TEMP_WARM_THRESHOLD = 400.0;  // Above this, more active storms
const float TEMP_HOT_THRESHOLD = 800.0;   // Above this, starts glowing

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// STORM FUNCTION
// =============================================================================

/**
 * Calculate storm contribution at a point
 * Returns: x = storm mask, y = rotation angle
 */
vec2 stormContribution(vec2 uv, vec2 stormCenter, float stormSize, float time) {
    vec2 delta = uv - stormCenter;
    
    // Wrap around for seamless texture
    if (delta.x > 0.5) delta.x -= 1.0;
    if (delta.x < -0.5) delta.x += 1.0;
    
    float dist = length(delta);
    float normalizedDist = dist / stormSize;
    
    // Storm mask with soft edges
    float mask = 1.0 - smoothstep(0.0, 1.0, normalizedDist);
    mask = mask * mask;  // Sharper falloff
    
    // Rotation angle for spiral
    float angle = atan(delta.y, delta.x) + time * STORM_ROTATION_SPEED;
    
    return vec2(mask, angle);
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 spherePos = normalize(vPosition);
    
    // === SEED-BASED VARIATION ===
    float bandCount = BAND_COUNT_BASE + seedHash(uSeed) * BAND_COUNT_VARIATION;
    vec3 scales = seedScales(uSeed);
    float phaseOffset = seedPhase(uSeed);
    float hueShift = seedHueShift(uSeed);
    
    // === COLOR PALETTE SELECTION ===
    float paletteSelector = seedHash(uSeed + 0.77);
    float saturationVar = 0.75 + seedHash(uSeed + 0.88) * 0.5;  // 0.75 to 1.25
    float contrastVar = 0.7 + seedHash(uSeed + 0.99) * 0.6;     // 0.7 to 1.3
    
    // === USE 3D POSITION FOR SEAMLESS SAMPLING ===
    // This avoids UV seam and polar artifacts
    vec3 samplePos = spherePos;
    
    // Apply seed-based rotation for variety
    float seedAngle = uSeed * 6.283;
    float ca = cos(seedAngle);
    float sa = sin(seedAngle);
    samplePos = vec3(
        samplePos.x * ca - samplePos.z * sa,
        samplePos.y,
        samplePos.x * sa + samplePos.z * ca
    );
    
    // === LATITUDE FROM 3D POSITION (avoids UV distortion) ===
    float latitude = samplePos.y * 0.5 + 0.5;  // -1 to 1 -> 0 to 1
    
    // Longitude for flow calculations (avoids seam by using atan2 carefully)
    float longitude = atan(samplePos.z, samplePos.x) / 6.283 + 0.5;
    
    // === ZONAL FLOW (jet streams) ===
    // Use wrapped time to prevent precision loss in Chrome/ANGLE
    float wrappedTime = wrapTime(uTime);
    float zonalOffset = sin(latitude * 3.14159 * bandCount * 0.5) * ZONAL_FLOW_STRENGTH;
    zonalOffset += wrappedTime * ZONAL_FLOW_SPEED * (latitude - 0.5);
    
    // === ATMOSPHERIC BANDS ===
    // Use 3D noise for wobble to avoid seam artifacts
    float bandWobble = snoise3D(samplePos * BAND_WOBBLE_SCALE + vec3(phaseOffset)) * BAND_WOBBLE_STRENGTH;
    float bandPosition = latitude + bandWobble;
    
    // Calculate band pattern
    float bandPattern = sin(bandPosition * 3.14159 * bandCount);
    bandPattern = bandPattern * 0.5 + 0.5;  // Normalize to 0-1
    
    // Vary band width by seed and latitude
    float bandWidth = BAND_WIDTH_BASE + seedBandWidth(uSeed, latitude) * BAND_WIDTH_VARIATION;
    bandPattern = smoothstep(0.5 - bandWidth * 0.5, 0.5 + bandWidth * 0.5, bandPattern);
    
    // === CLOUD TURBULENCE (3D position-based for seamless) ===
    vec3 turbCoord = samplePos * TURB_SCALE_LARGE + vec3(wrappedTime * TURB_TIME_SCALE + phaseOffset);
    float turbulence = fbmWarped3D(turbCoord * scales.x, CLOUD_OCTAVES, CLOUD_WARP_STRENGTH);
    
    // Add medium-scale detail
    if (uDetailLevel > 0.5) {
        float medTurb = fbm3D(samplePos * TURB_SCALE_MEDIUM * scales.y, 3);
        turbulence = turbulence * 0.7 + medTurb * 0.3;
    }
    
    // Displace bands with turbulence
    bandPattern += turbulence * TURB_STRENGTH;
    bandPattern = clamp(bandPattern, 0.0, 1.0);
    
    // === STORM SYSTEMS (use UV for storms since they need lat/lon positioning) ===
    float stormMask = 0.0;
    vec3 stormColor = uBaseColor * STORM_COLOR_MULT;
    
    // UV for storm positioning (use original vUv to avoid polar artifacts in storm placement)
    vec2 stormUV = vec2(longitude, latitude);
    
    if (seedHasCommonFeature(uSeed, 0.0)) {
        for (int i = 0; i < MAX_STORMS; i++) {
            if (!seedHasUncommonFeature(uSeed, float(i) + 1.0)) continue;
            
            vec2 stormPos = seedStormPosition(uSeed, float(i));
            float stormSize = STORM_SIZE_MIN + seedStormSize(uSeed, float(i)) * (STORM_SIZE_MAX - STORM_SIZE_MIN);
            
            // Increase storm activity with temperature
            if (uTemperature > TEMP_WARM_THRESHOLD) {
                stormSize *= 1.0 + (uTemperature - TEMP_WARM_THRESHOLD) / 500.0 * 0.5;
            }
            
            vec2 stormData = stormContribution(stormUV, stormPos, stormSize, wrappedTime);
            
            if (stormData.x > 0.01) {
                // Add spiral structure using 3D noise for seamless spirals
                float spiralNoise = snoise3D(samplePos * 20.0 + vec3(stormData.y * 2.0));
                float spiral = spiralNoise * 0.5 + 0.5;
                stormMask = max(stormMask, stormData.x * (0.7 + spiral * 0.3));
            }
        }
    }
    
    // === COLOR CALCULATION ===
    // Select palette based on seed
    vec3 warmBand, coolBand;
    if (paletteSelector < 0.17) {
        warmBand = PALETTE_JUPITER_WARM;
        coolBand = PALETTE_JUPITER_COOL;
    } else if (paletteSelector < 0.33) {
        warmBand = PALETTE_SATURN_WARM;
        coolBand = PALETTE_SATURN_COOL;
    } else if (paletteSelector < 0.5) {
        warmBand = PALETTE_RED_WARM;
        coolBand = PALETTE_RED_COOL;
    } else if (paletteSelector < 0.67) {
        warmBand = PALETTE_BLUE_WARM;
        coolBand = PALETTE_BLUE_COOL;
    } else if (paletteSelector < 0.83) {
        warmBand = PALETTE_GREEN_WARM;
        coolBand = PALETTE_GREEN_COOL;
    } else {
        warmBand = PALETTE_PURPLE_WARM;
        coolBand = PALETTE_PURPLE_COOL;
    }
    
    // Temperature affects palette - hot giants shift toward red/orange
    float hotShift = smoothstep(300.0, 800.0, uTemperature);
    warmBand = mix(warmBand, PALETTE_RED_WARM, hotShift * 0.4);
    coolBand = mix(coolBand, PALETTE_RED_COOL, hotShift * 0.3);
    
    // Apply hue shift for additional variety
    vec3 warmHSV = rgb2hsv(warmBand);
    vec3 coolHSV = rgb2hsv(coolBand);
    warmHSV.x = fract(warmHSV.x + hueShift);
    coolHSV.x = fract(coolHSV.x + hueShift);
    warmHSV.y *= saturationVar;
    coolHSV.y *= saturationVar;
    warmBand = hsv2rgb(warmHSV);
    coolBand = hsv2rgb(coolHSV);
    
    // Mix bands with variable contrast
    vec3 bandColor = mix(coolBand, warmBand, bandPattern * contrastVar);
    
    // Blend with uBaseColor for system-specific tinting
    bandColor = mix(bandColor, bandColor * uBaseColor * 1.3, 0.2);
    
    // Apply turbulence to color
    float colorTurb = turbulence * 0.5 + 0.5;
    bandColor = mix(bandColor * 0.9, bandColor * 1.1, colorTurb);
    
    // Add storm coloring
    bandColor = mix(bandColor, stormColor, stormMask * STORM_COLOR_BOOST);
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseHalfLambert(vNormal, lightDir);
    
    // Limb darkening
    float limb = limbDarkeningStylized(vNormal, LIMB_DARK_EDGE, LIMB_DARK_CENTER, LIMB_MIN_BRIGHTNESS);
    
    // Apply lighting
    vec3 litColor = bandColor * diff * limb;
    
    // === ATMOSPHERIC HAZE ===
    vec3 hazeColor = mix(warmBand, coolBand, 0.5) * vec3(0.9, 0.95, 1.1);
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float haze = pow(edgeFactor, HAZE_POWER) * HAZE_STRENGTH;
    litColor += hazeColor * haze;
    
    // === HOT PLANET GLOW ===
    if (uTemperature > TEMP_HOT_THRESHOLD) {
        float glowFactor = smoothstep(TEMP_HOT_THRESHOLD, 1500.0, uTemperature);
        vec3 glowColor = vec3(1.0, 0.6, 0.3);
        litColor += glowColor * glowFactor * 0.3;
    }
    
    // === STAR TINT ===
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= starTint;
    
    gl_FragColor = vec4(litColor, 1.0);
}

