/**
 * Hot Jupiter Fragment Shader V2
 *
 * Creates ultra-hot, tidally locked gas giants with:
 * - Dramatic day/night contrast
 * - Molten/glowing dayside
 * - Cooler nightside with visible heat transport
 * - Violent atmospheric dynamics
 * - Heat redistribution patterns
 *
 * Physics: Tidally locked giants receiving extreme stellar irradiation
 * Examples: 51 Pegasi b, HD 189733 b, WASP-12 b
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
// HOT JUPITER CONSTANTS
// =============================================================================

// --- Day/Night Division ---
const float TERMINATOR_WIDTH = 0.15;      // Width of twilight zone
const float TERMINATOR_POSITION = 0.5;    // Where day meets night (0.5 = center)
const float DAYSIDE_GLOW_POWER = 2.0;     // How concentrated dayside heat is

// --- Thermal Emission ---
const float THERMAL_BASE_TEMP = 1000.0;   // Temperature where thermal emission starts
const float THERMAL_FULL_TEMP = 2500.0;   // Temperature at full glow
const float THERMAL_MAX_TEMP = 4000.0;    // Cap for extreme temperatures
const float THERMAL_INTENSITY = 0.8;      // Maximum thermal glow intensity
const vec3 THERMAL_COLOR_LOW = vec3(0.8, 0.2, 0.0);   // Cooler thermal color (1000K)
const vec3 THERMAL_COLOR_MID = vec3(1.0, 0.7, 0.3);   // Medium thermal color (2000K)
const vec3 THERMAL_COLOR_HIGH = vec3(1.0, 0.9, 0.6);  // Hotter thermal color (2500K)
const vec3 THERMAL_COLOR_EXTREME = vec3(1.0, 0.95, 0.9); // Extreme white-hot (3000K+)

// --- Heat Transport ---
const float HEAT_FLOW_SCALE = 5.0;        // Scale of heat transport patterns
const float HEAT_FLOW_SPEED = 0.05;       // Animation speed
const float HEAT_FLOW_STRENGTH = 0.3;     // How visible heat transport is
const float HEAT_REDISTRIBUTION = 0.4;    // How much heat reaches nightside

// --- Atmospheric Dynamics ---
const float TURB_DAYSIDE_SCALE = 8.0;     // Turbulence on hot side
const float TURB_NIGHTSIDE_SCALE = 4.0;   // Turbulence on cool side
const float TURB_INTENSITY_DAY = 0.4;     // Dayside is more turbulent
const float TURB_INTENSITY_NIGHT = 0.2;   // Nightside is calmer
const int TURB_OCTAVES = 5;

// --- Bands (weaker than regular gas giants) ---
const float BAND_COUNT = 4.0;             // Fewer bands on hot Jupiters
const float BAND_VISIBILITY = 0.15;       // Bands are less visible due to heat

// --- Hotspot Offset ---
// Real hot Jupiters have hotspot shifted east due to winds
const float HOTSPOT_OFFSET = 0.1;         // Eastward shift of hottest point

// --- Nightside ---
const vec3 NIGHTSIDE_COLOR = vec3(0.15, 0.1, 0.2);  // Deep purple-black
const float NIGHTSIDE_GLOW = 0.1;         // Faint infrared glow

// --- Limb Effects ---
const float LIMB_GLOW_POWER = 4.0;        // Edge glow concentration
const float LIMB_GLOW_STRENGTH = 0.5;     // Edge brightness

// --- Atmospheric Escape ---
const float ESCAPE_THRESHOLD = 2000.0;    // Temp where atmosphere visibly escapes
const float ESCAPE_INTENSITY = 0.2;       // Visibility of escaping gas

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
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    
    // Derive longitude from 3D position (0-1 range)
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    float latitude = p.y * 0.5 + 0.5;
    
    // === DAY/NIGHT CALCULATION ===
    // Apply hotspot offset
    float adjustedLon = longitude - HOTSPOT_OFFSET;
    
    // Day factor: 1.0 on dayside, 0.0 on nightside
    float dayFactor = smoothstep(TERMINATOR_POSITION - TERMINATOR_WIDTH, 
                                  TERMINATOR_POSITION + TERMINATOR_WIDTH, 
                                  adjustedLon);
    
    // Wrap around (both edges are dayside center)
    float dayFactorWrap = smoothstep(TERMINATOR_POSITION - TERMINATOR_WIDTH,
                                      TERMINATOR_POSITION + TERMINATOR_WIDTH,
                                      1.0 - adjustedLon);
    dayFactor = max(dayFactor, dayFactorWrap);
    
    // Hotspot is brightest at center of dayside
    float hotspotDist = abs(adjustedLon - 0.5);
    if (adjustedLon < 0.0) hotspotDist = abs(adjustedLon + 0.5);
    if (adjustedLon > 1.0) hotspotDist = abs(adjustedLon - 1.5);
    float hotspotFactor = pow(1.0 - min(hotspotDist * 2.0, 1.0), DAYSIDE_GLOW_POWER);
    
    // === THERMAL EMISSION ===
    // Cap temperature to prevent shader issues at extreme values
    float cappedTemp = min(uTemperature, THERMAL_MAX_TEMP);
    
    // Multi-stage thermal factor for better color gradients
    float thermalFactor = smoothstep(THERMAL_BASE_TEMP, THERMAL_FULL_TEMP, cappedTemp);
    float extremeFactor = smoothstep(THERMAL_FULL_TEMP, 3500.0, cappedTemp);
    
    // 4-stage color gradient: low -> mid -> high -> extreme (white-hot)
    vec3 thermalColor;
    if (cappedTemp < 1500.0) {
        thermalColor = mix(THERMAL_COLOR_LOW, THERMAL_COLOR_MID, (cappedTemp - 1000.0) / 500.0);
    } else if (cappedTemp < 2500.0) {
        thermalColor = mix(THERMAL_COLOR_MID, THERMAL_COLOR_HIGH, (cappedTemp - 1500.0) / 1000.0);
    } else {
        thermalColor = mix(THERMAL_COLOR_HIGH, THERMAL_COLOR_EXTREME, extremeFactor);
    }
    
    // Dayside thermal emission
    float daysideThermal = dayFactor * hotspotFactor * thermalFactor * THERMAL_INTENSITY;
    
    // Some heat redistributed to nightside
    float nightsideThermal = (1.0 - dayFactor) * thermalFactor * HEAT_REDISTRIBUTION * 0.3;
    
    // === HEAT TRANSPORT PATTERNS ===
    vec3 flowCoord = p * HEAT_FLOW_SCALE + vec3(wrappedTime * HEAT_FLOW_SPEED, 0.0, wrappedTime * HEAT_FLOW_SPEED * 0.5) + vec3(phaseOffset);
    float heatFlow = fbmWarped3D(flowCoord * scales.x, 4, 0.6);
    heatFlow = heatFlow * 0.5 + 0.5;
    
    // Heat flows from day to night side
    float flowDirection = sin(latitude * 3.14159 * 3.0) * 0.5 + 0.5;
    heatFlow *= mix(0.5, 1.0, flowDirection);
    
    // === ATMOSPHERIC TURBULENCE ===
    float turbScale = mix(TURB_NIGHTSIDE_SCALE, TURB_DAYSIDE_SCALE, dayFactor);
    float turbIntensity = mix(TURB_INTENSITY_NIGHT, TURB_INTENSITY_DAY, dayFactor);
    
    vec3 turbCoord = p * turbScale * scales.y + vec3(wrappedTime * 0.03, 0.0, wrappedTime * 0.02) + vec3(phaseOffset);
    float turbulence = fbm3D(turbCoord, TURB_OCTAVES);
    
    // === WEAK BANDING ===
    float bandPattern = sin(latitude * 3.14159 * BAND_COUNT) * 0.5 + 0.5;
    bandPattern *= BAND_VISIBILITY * (1.0 - thermalFactor * 0.5);  // Bands fade with heat
    
    // === COLOR CALCULATION ===
    // Base color with seed variation
    vec3 baseHSV = rgb2hsv(uBaseColor);
    baseHSV.x = fract(baseHSV.x + hueShift);
    vec3 variedBase = hsv2rgb(baseHSV);
    
    // Dayside: dominated by thermal emission
    vec3 daysideColor = mix(variedBase * 1.5, thermalColor, daysideThermal);
    daysideColor *= 1.0 + turbulence * turbIntensity;
    daysideColor += thermalColor * heatFlow * HEAT_FLOW_STRENGTH * dayFactor;
    
    // Nightside: dark with faint glow
    vec3 nightsideColor = NIGHTSIDE_COLOR;
    nightsideColor += thermalColor * nightsideThermal;
    nightsideColor += variedBase * NIGHTSIDE_GLOW * (1.0 + turbulence * 0.3);
    
    // Heat transport visible on nightside
    nightsideColor += thermalColor * heatFlow * HEAT_FLOW_STRENGTH * 0.3 * (1.0 - dayFactor);
    
    // Blend day and night
    vec3 surfaceColor = mix(nightsideColor, daysideColor, dayFactor);
    
    // Add bands
    surfaceColor *= 1.0 + (bandPattern - 0.5) * 0.2;
    
    // === LIGHTING ===
    // Light comes from the star (locked to one side)
    vec3 lightDir = normalize(vec3(1.0, 0.2, 0.5));
    float diff = max(dot(vNormal, lightDir), 0.0);
    
    // On hot Jupiters, thermal emission dominates over reflected light
    float reflectedLight = diff * (1.0 - thermalFactor * 0.7);
    
    // === LIMB EFFECTS ===
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    
    // Glowing edge from thermal emission
    float limbGlow = pow(edgeFactor, LIMB_GLOW_POWER) * LIMB_GLOW_STRENGTH * thermalFactor;
    surfaceColor += thermalColor * limbGlow;
    
    // === ATMOSPHERIC ESCAPE (extreme cases) ===
    if (cappedTemp > ESCAPE_THRESHOLD) {
        float escapeFactor = smoothstep(ESCAPE_THRESHOLD, 3500.0, cappedTemp);
        vec3 escapeCoord = p * 4.0 + vec3(wrappedTime * 0.1, 0.0, wrappedTime * 0.05);
        float escapePattern = snoise3D(escapeCoord);
        escapePattern = max(0.0, escapePattern);
        
        // Visible gas escaping on dayside edge - more intense at extreme temps
        float escapeZone = edgeFactor * dayFactor * escapeFactor;
        vec3 escapeColor = mix(vec3(1.0, 0.8, 0.5), vec3(1.0, 0.95, 0.85), extremeFactor);
        surfaceColor += escapeColor * escapePattern * escapeZone * ESCAPE_INTENSITY * (1.0 + extremeFactor * 0.5);
    }
    
    // === STAR TINT ===
    vec3 starTint = starLightTint(uStarTemp);
    surfaceColor *= mix(vec3(1.0), starTint, reflectedLight * 0.5);
    
    // Ensure we don't over-darken
    surfaceColor = max(surfaceColor, vec3(0.02));
    
    gl_FragColor = vec4(surfaceColor, 1.0);
}

