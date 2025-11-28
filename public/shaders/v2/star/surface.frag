/**
 * Star Surface Fragment Shader V2
 * 
 * Creates realistic burning star surfaces with:
 * - Outward-flowing flame patterns
 * - Surface granulation (convection cells)
 * - Sunspots
 * - Temperature-based coloring (M-type red to O-type blue)
 * - Proper limb darkening
 * 
 * Based on trisomie21's Shadertoy technique, enhanced with
 * physically-grounded temperature mapping.
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/lighting.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uStarColor;        // Base star color
uniform float uTime;            // Animation time
uniform float uTemperature;     // Star temperature in Kelvin

// =============================================================================
// STAR SURFACE CONSTANTS
// =============================================================================

// --- Burning Effect (spherical glow) ---
const float BURN_EDGE_POWER = 4.0;          // How quickly brightness falls off at edge
const float BURN_SINGULARITY_GUARD = 0.001; // Prevents division by zero
const float BURN_BASE_BRIGHTNESS = 0.5;     // Minimum brightness at center
const float BURN_CLAMP_MAX = 2.0;           // Maximum brightness value

// --- Flame Animation ---
const float FLAME_TIME_SCALE = 0.1;         // Overall animation speed
const float FLAME_LAYER1_SPEED = 0.35;      // First flame layer speed
const float FLAME_LAYER2_SPEED = 0.15;      // Second flame layer speed
const float FLAME_BRIGHTNESS_INFLUENCE = 0.001;  // How brightness affects speed
const float FLAME_Z_SPEED = 0.015;          // Z-axis animation speed

// --- Flame Noise Resolutions ---
const float FLAME_RES_COARSE = 15.0;        // Coarse flame detail
const float FLAME_RES_FINE = 45.0;          // Fine flame detail
const float FLAME_OCTAVE_BASE_COARSE = 10.0; // Base multiplier for coarse
const float FLAME_OCTAVE_BASE_FINE = 25.0;   // Base multiplier for fine
const int FLAME_OCTAVES = 7;                // Number of octave layers

// --- Flame Blend ---
const float FLAME_MIX_OFFSET = 0.5;         // Centering offset for flame mix

// --- Surface Granulation (Convection Cells) ---
const float GRANULE_TIME_SCALE = 0.02;      // Granulation animation speed
const float GRANULE_DRIFT_X = 0.1;          // X-axis drift rate
const float GRANULE_DRIFT_Z = 0.05;         // Z-axis drift rate
const float GRANULE_SCALE_LARGE = 8.0;      // Large convection cell scale
const float GRANULE_SCALE_FINE = 20.0;      // Fine surface detail scale
const int GRANULE_OCTAVES_LARGE = 4;        // Octaves for large cells
const int GRANULE_OCTAVES_FINE = 3;         // Octaves for fine detail
const float GRANULE_FINE_STRENGTH = 0.3;    // Fine detail contribution

// --- Sunspots ---
const float SUNSPOT_SCALE = 3.0;            // Sunspot pattern scale
const float SUNSPOT_TIME_SCALE = 0.005;     // Sunspot drift speed
const float SUNSPOT_THRESHOLD_LOW = 0.55;   // Where sunspots start appearing
const float SUNSPOT_THRESHOLD_HIGH = 0.75;  // Where sunspots are fully dark
const float SUNSPOT_DARKNESS = 0.5;         // How dark sunspots get (0 = black, 1 = no effect)

// --- Color Mixing ---
const float COLOR_WARM_RED = 1.2;           // Red boost for warm color
const float COLOR_WARM_BLUE = 0.8;          // Blue reduction for warm color
const float COLOR_HOT_RED = 1.4;            // Red boost for hot color
const float COLOR_HOT_GREEN = 1.2;          // Green boost for hot color
const float COLOR_COOL_RED = 0.8;           // Red reduction for cool (spot) color
const float COLOR_COOL_GREEN = 0.5;         // Green reduction for cool color
const float COLOR_COOL_BLUE = 0.3;          // Blue reduction for cool color

// --- Granule Colors ---
const float GRANULE_WARM_RED = 1.1;
const float GRANULE_WARM_GREEN = 1.05;
const float GRANULE_WARM_BLUE = 0.95;
const float GRANULE_COOL_RED = 0.85;
const float GRANULE_COOL_GREEN = 0.75;
const float GRANULE_COOL_BLUE = 0.7;

// --- Layer Blend Weights ---
const float LAYER_BASE_GLOW = 0.4;          // Weight of burning glow
const float LAYER_FLAMES = 0.3;             // Weight of flame layer
const float LAYER_GRANULES = 0.4;           // Weight of granulation

// --- Star Glow (radiance) ---
const float GLOW_COLOR_RED = 1.0;
const float GLOW_COLOR_GREEN = 0.6;
const float GLOW_COLOR_BLUE = 0.3;
const float GLOW_STRENGTH = 0.3;            // Glow contribution

// --- Limb Darkening ---
const float LIMB_POWER = 0.35;              // Limb darkening curve power
const float LIMB_TEMP_INFLUENCE = 0.25;     // How much temperature affects limb
const float LIMB_DARK_BASE = 0.6;           // Minimum limb brightness
const float LIMB_BRIGHT_RANGE = 0.4;        // Brightness range

// --- Center Boost ---
const float CENTER_POWER = 1.5;             // Center brightness power
const float CENTER_STRENGTH = 0.35;         // Center boost amount

// --- Temperature Normalization ---
const float TEMP_NORMALIZE = 10000.0;       // Divide temperature for normalization
const float TEMP_CLAMP_MIN = 0.3;           // Minimum temp factor
const float TEMP_CLAMP_MAX = 1.5;           // Maximum temp factor

// --- Hot Star Boost ---
const float HOT_STAR_TEMP_LOW = 7000.0;     // Where hot boost starts
const float HOT_STAR_TEMP_HIGH = 15000.0;   // Where hot boost maxes out
const float HOT_STAR_BOOST = 0.25;          // Maximum hot star brightness boost

// --- Output Clamping ---
const float OUTPUT_MAX = 2.5;               // HDR clamp maximum

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
    
    // === VIEW ANGLE CALCULATIONS ===
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float viewAngle = max(dot(vNormal, viewDir), 0.0);
    float edgeDist = 1.0 - viewAngle;
    
    // === TEMPERATURE FACTOR ===
    float tempFactor = clamp(uTemperature / TEMP_NORMALIZE, TEMP_CLAMP_MIN, TEMP_CLAMP_MAX);
    float brightness = 0.15 + tempFactor * 0.1;
    
    // === BURNING GLOW (spherical falloff) ===
    float r = edgeDist * edgeDist * BURN_EDGE_POWER;
    float burnFactor = (1.0 - sqrt(abs(1.0 - r))) / (r + BURN_SINGULARITY_GUARD) + BURN_BASE_BRIGHTNESS;
    burnFactor = clamp(burnFactor, 0.0, BURN_CLAMP_MAX);
    
    // === POLAR COORDINATES FOR FLAMES ===
    float angle = atan(spherePos.y, spherePos.x) / TAU;
    float elevation = atan(length(spherePos.xy), spherePos.z) / 3.1416;
    
    float time = wrappedTime * FLAME_TIME_SCALE;
    
    // === OUTWARD FLOWING FLAMES ===
    vec3 flameCoord = vec3(angle, elevation, time * FLAME_TIME_SCALE);
    
    // Time distortion for organic movement
    float newTime1 = abs(tiledNoise3D(flameCoord + vec3(0.0, -time * (FLAME_LAYER1_SPEED + brightness * FLAME_BRIGHTNESS_INFLUENCE), time * FLAME_Z_SPEED), FLAME_RES_COARSE));
    float newTime2 = abs(tiledNoise3D(flameCoord + vec3(0.0, -time * (FLAME_LAYER2_SPEED + brightness * FLAME_BRIGHTNESS_INFLUENCE), time * FLAME_Z_SPEED), FLAME_RES_FINE));
    
    // Accumulate flame intensity across octaves
    float flameVal1 = 1.0 - edgeDist;
    float flameVal2 = 1.0 - edgeDist;
    
    for (int i = 1; i <= FLAME_OCTAVES; i++) {
        float power = pow(2.0, float(i + 1));
        float contribution = 0.5 / power;
        flameVal1 += contribution * tiledNoise3D(flameCoord + vec3(0.0, -time, time * 0.2), power * FLAME_OCTAVE_BASE_COARSE * (newTime1 + 1.0));
        flameVal2 += contribution * tiledNoise3D(flameCoord + vec3(0.0, -time, time * 0.2), power * FLAME_OCTAVE_BASE_FINE * (newTime2 + 1.0));
    }
    
    // Combine and normalize flames
    float flames = (flameVal1 + flameVal2) * FLAME_MIX_OFFSET;
    flames = flames * FLAME_MIX_OFFSET + FLAME_MIX_OFFSET;
    
    // === SURFACE GRANULATION (convection cells) ===
    float slowTime = wrappedTime * GRANULE_TIME_SCALE;
    vec3 granulePos = spherePos + vec3(slowTime * GRANULE_DRIFT_X, 0.0, slowTime * GRANULE_DRIFT_Z);
    
    // Large convection cells
    float granulation = fbm3D(granulePos * GRANULE_SCALE_LARGE, GRANULE_OCTAVES_LARGE) * 0.5 + 0.5;
    
    // Fine surface detail
    float fineDetail = fbm3D(granulePos * GRANULE_SCALE_FINE + vec3(wrappedTime * 0.01), GRANULE_OCTAVES_FINE) * GRANULE_FINE_STRENGTH;
    
    // === SUNSPOTS ===
    float spotNoise = snoise3D(spherePos * SUNSPOT_SCALE + vec3(0.0, wrappedTime * SUNSPOT_TIME_SCALE, 0.0));
    float spotMask = smoothstep(SUNSPOT_THRESHOLD_LOW, SUNSPOT_THRESHOLD_HIGH, spotNoise);
    float spotDarkening = 1.0 - spotMask * (1.0 - SUNSPOT_DARKNESS);
    
    // === COLOR CALCULATION ===
    // Get base color from temperature
    vec3 baseColor = temperatureToColor(uTemperature);
    
    // Mix with provided star color for consistency
    baseColor = mix(baseColor, uStarColor, 0.3);
    
    // Create color variants
    vec3 warmColor = baseColor * vec3(COLOR_WARM_RED, 1.0, COLOR_WARM_BLUE);
    vec3 hotColor = baseColor * vec3(COLOR_HOT_RED, COLOR_HOT_GREEN, 1.0);
    vec3 coolColor = baseColor * vec3(COLOR_COOL_RED, COLOR_COOL_GREEN, COLOR_COOL_BLUE);
    vec3 granuleWarm = baseColor * vec3(GRANULE_WARM_RED, GRANULE_WARM_GREEN, GRANULE_WARM_BLUE);
    vec3 granuleCool = baseColor * vec3(GRANULE_COOL_RED, GRANULE_COOL_GREEN, GRANULE_COOL_BLUE);
    
    // Burning glow base
    vec3 baseGlow = burnFactor * (0.75 + brightness * 0.3) * warmColor;
    
    // Flame color layer
    vec3 flameColor = mix(coolColor, hotColor, flames);
    
    // Granulation color layer
    vec3 granuleColor = mix(granuleCool, granuleWarm, granulation);
    granuleColor += baseColor * fineDetail * 0.2;
    
    // Apply sunspot darkening
    granuleColor *= spotDarkening;
    
    // Combine layers
    vec3 surfaceColor = baseGlow * LAYER_BASE_GLOW + flameColor * LAYER_FLAMES + granuleColor * LAYER_GRANULES;
    
    // === STAR GLOW (warm radiance) ===
    float starGlow = clamp(1.0 - edgeDist * (1.0 - brightness), 0.0, 1.0);
    vec3 glowColor = baseColor * vec3(GLOW_COLOR_RED, GLOW_COLOR_GREEN, GLOW_COLOR_BLUE);
    surfaceColor += starGlow * glowColor * GLOW_STRENGTH;
    
    // === LIMB DARKENING ===
    float limbDark = pow(viewAngle, LIMB_POWER);
    limbDark = mix(limbDark, 1.0, tempFactor * LIMB_TEMP_INFLUENCE);
    surfaceColor *= LIMB_DARK_BASE + limbDark * LIMB_BRIGHT_RANGE;
    
    // === CENTER BRIGHTNESS BOOST ===
    float centerBoost = pow(viewAngle, CENTER_POWER) * CENTER_STRENGTH;
    surfaceColor += baseColor * centerBoost;
    
    // === HOT STAR BOOST ===
    float hotBoost = smoothstep(HOT_STAR_TEMP_LOW, HOT_STAR_TEMP_HIGH, uTemperature) * HOT_STAR_BOOST;
    surfaceColor += baseColor * hotBoost;
    
    // === HDR CLAMP ===
    surfaceColor = clamp(surfaceColor, 0.0, OUTPUT_MAX);
    
    gl_FragColor = vec4(surfaceColor, 1.0);
}

