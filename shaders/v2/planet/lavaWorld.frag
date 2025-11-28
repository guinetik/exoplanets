/**
 * Lava World Fragment Shader V2
 *
 * Creates realistic volcanic hellscapes with:
 * - Tectonic plate-like cooling crust
 * - Convection cells in molten lava
 * - Dramatic glowing fractures
 * - Temperature-accurate color gradients
 * - Volcanic hotspots
 *
 * Based on real volcanic and lava physics
 * 
 * @author guinetik
 * @see https://github.com/guinetik
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
uniform float uZoomLevel;
uniform float uBodyDiameter;

uniform float uColorTempFactor;
uniform float uColorCompositionFactor;
uniform float uColorIrradiationFactor;
uniform float uColorMetallicityFactor;

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// CHROME-SAFE HASH FUNCTIONS
// Using integer-based hashing to avoid sin() precision issues in ANGLE
// =============================================================================

vec3 hash33_lava(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}

float hash11_lava(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

// =============================================================================
// REALISTIC LAVA COLORS (temperature-based)
// =============================================================================

// Real lava color temperatures (in Kelvin approximations)
const vec3 LAVA_BLACK = vec3(0.05, 0.02, 0.01);       // Cooled crust ~700K
const vec3 LAVA_DARK_RED = vec3(0.3, 0.05, 0.0);      // ~900K
const vec3 LAVA_RED = vec3(0.6, 0.1, 0.0);            // ~1000K
const vec3 LAVA_ORANGE = vec3(0.95, 0.4, 0.05);       // ~1200K
const vec3 LAVA_YELLOW = vec3(1.0, 0.75, 0.2);        // ~1400K
const vec3 LAVA_WHITE = vec3(1.0, 0.95, 0.8);         // ~1600K+

// Crust colors (cooled basalt)
const vec3 CRUST_DARK = vec3(0.06, 0.04, 0.03);
const vec3 CRUST_MID = vec3(0.12, 0.08, 0.06);
const vec3 CRUST_LIGHT = vec3(0.2, 0.14, 0.1);

// =============================================================================
// TECTONIC PLATES (Voronoi-based)
// =============================================================================

/**
 * Creates tectonic plate pattern with cracks between plates
 */
float tectonicPlates(vec3 p, float scale, out float plateId, out float crackDist) {
    vec3 pos = p * scale;
    vec3 cell = floor(pos);
    vec3 local = fract(pos);
    
    float minDist = 10.0;
    float secondDist = 10.0;
    vec3 nearestCell = cell;
    
    // Find nearest and second nearest cell centers
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            for (int z = -1; z <= 1; z++) {
                vec3 neighbor = vec3(float(x), float(y), float(z));
                vec3 cellPos = cell + neighbor;
                
                // Random point within cell - using Chrome-safe hash
                vec3 h = hash33_lava(cellPos);
                vec3 point = h * 0.6 + 0.2;
                
                vec3 diff = neighbor + point - local;
                float d = length(diff);
                
                if (d < minDist) {
                    secondDist = minDist;
                    minDist = d;
                    nearestCell = cellPos;
                } else if (d < secondDist) {
                    secondDist = d;
                }
            }
        }
    }
    
    // Plate ID for color variation - using Chrome-safe hash
    plateId = hash33_lava(nearestCell).x;
    
    // Distance to crack (boundary between plates)
    crackDist = secondDist - minDist;
    
    return minDist;
}

// =============================================================================
// CONVECTION CELLS
// =============================================================================

/**
 * Simulates convection in molten lava
 * Hot material rises (bright), cool material sinks (darker)
 */
float convectionCells(vec3 p, float time, float seed) {
    // Large convection cells
    float cells = 0.0;
    
    // Animated position for convection motion
    vec3 pos = p + vec3(0.0, time * 0.02, 0.0);
    
    // Primary cells
    float n1 = snoise3D(pos * 4.0 + seed);
    float cell1 = n1 * 0.5 + 0.5;
    
    // Rising plumes (bright spots)
    float plumes = smoothstep(0.6, 0.9, cell1);
    
    // Sinking regions (darker)
    float sinks = smoothstep(0.4, 0.1, cell1);
    
    // Secondary turbulence
    float turb = snoise3D(pos * 12.0 + seed * 2.0) * 0.3;
    
    cells = cell1 + plumes * 0.3 - sinks * 0.2 + turb;
    
    return clamp(cells, 0.0, 1.0);
}

// =============================================================================
// VOLCANIC HOTSPOTS
// =============================================================================

/**
 * Creates volcanic hotspot regions - extra active areas
 */
float volcanicHotspots(vec3 p, float seed, float time) {
    float hotspots = 0.0;
    
    // Create several hotspot centers
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        
        // Random hotspot position - using Chrome-safe hash
        vec3 h = hash33_lava(vec3(seed, fi * 0.1, seed * 0.5 + fi));
        vec3 center = normalize(h * 2.0 - 1.0);
        
        // Distance to hotspot
        float d = length(p - center);
        
        // Hotspot intensity with pulsing (time is already wrapped)
        float pulsePhase = hash11_lava(seed + fi) * 6.28318;
        float pulse = sin(time * 0.5 + pulsePhase) * 0.3 + 0.7;
        float intensity = (1.0 - smoothstep(0.0, 0.4, d)) * pulse;
        
        hotspots = max(hotspots, intensity);
    }
    
    return hotspots;
}

// =============================================================================
// LAVA TEMPERATURE TO COLOR
// =============================================================================

/**
 * Maps lava temperature/intensity to realistic color
 */
vec3 lavaColor(float temp) {
    // temp: 0 = cool crust, 1 = white hot
    
    if (temp < 0.15) {
        // Cooled crust - black
        return mix(LAVA_BLACK, LAVA_DARK_RED, temp / 0.15);
    } else if (temp < 0.3) {
        // Dark red glow
        return mix(LAVA_DARK_RED, LAVA_RED, (temp - 0.15) / 0.15);
    } else if (temp < 0.5) {
        // Bright red to orange
        return mix(LAVA_RED, LAVA_ORANGE, (temp - 0.3) / 0.2);
    } else if (temp < 0.75) {
        // Orange to yellow
        return mix(LAVA_ORANGE, LAVA_YELLOW, (temp - 0.5) / 0.25);
    } else {
        // Yellow to white hot
        return mix(LAVA_YELLOW, LAVA_WHITE, (temp - 0.75) / 0.25);
    }
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 spherePos = normalize(vPosition);
    float time = wrapTime(uTime);
    
    // === SEED VARIATION ===
    float seed = seedHash(uSeed) * 100.0;
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    
    // === PLANET HEAT LEVEL ===
    // How hot is this lava world? (affects how much molten vs crust)
    float planetHeat = smoothstep(800.0, 2000.0, uTemperature);
    float extremeHeat = smoothstep(1500.0, 3000.0, uTemperature);
    
    // === TECTONIC PLATES ===
    // Plate size varies by seed: some worlds have few large plates, others many small
    float plateSizeVar = hash11_lava(seed * 7.89);  // 0-1, Chrome-safe
    float plateScale = 0.8 + plateSizeVar * 2.0;  // Range: 0.8 (huge plates) to 2.8 (smaller plates)
    float fineScale = plateScale * 2.5 + 1.0;     // Secondary cracks scale with main plates
    
    float plateId, crackDist;
    float plateNoise = tectonicPlates(p, plateScale, plateId, crackDist);
    
    // Cracks between plates - this is where lava shows through
    // Wider cracks on worlds with larger plates
    float crackWidth = 0.1 + (1.0 - plateSizeVar) * 0.1;
    float crackIntensity = 1.0 - smoothstep(0.0, crackWidth, crackDist);
    
    // Finer cracks within plates (secondary fractures)
    float fineId, fineCrackDist;
    tectonicPlates(p, fineScale, fineId, fineCrackDist);
    float fineCracks = 1.0 - smoothstep(0.0, 0.08, fineCrackDist);
    
    // === CONVECTION IN LAVA ===
    float convection = convectionCells(p, time, seed);
    
    // === VOLCANIC HOTSPOTS ===
    float hotspots = volcanicHotspots(p, seed, time);
    
    // === DETERMINE SURFACE TYPE ===
    // More cracks and less crust when hotter
    float crustThreshold = 0.15 - planetHeat * 0.1;
    
    // Is this point crust or exposed lava?
    float isCrust = step(crustThreshold, crackDist);
    float lavaExposure = 1.0 - isCrust;
    
    // Add fine cracks that glow
    lavaExposure = max(lavaExposure, fineCracks * 0.7);
    
    // Hotspots break through crust
    lavaExposure = max(lavaExposure, hotspots * 0.8);
    
    // === LAVA TEMPERATURE ===
    // Base temperature from convection
    float lavaTemp = convection * 0.6 + 0.2;
    
    // Cracks are hotter (fresh lava)
    lavaTemp = mix(lavaTemp, 0.8, crackIntensity * 0.5);
    
    // Hotspots are hottest
    lavaTemp = mix(lavaTemp, 0.95, hotspots);
    
    // Fine cracks are cooler (less exposed)
    float fineCrackTemp = lavaTemp * 0.6;
    
    // Planet heat affects overall temperature
    lavaTemp *= 0.6 + planetHeat * 0.4;
    lavaTemp += extremeHeat * 0.2;  // Boost for very hot planets
    
    // === CRUST APPEARANCE ===
    // Cooled lava crust with slight color variation per plate
    vec3 crustColor = mix(CRUST_DARK, CRUST_MID, plateId * 0.5);
    
    // Add texture variation
    float crustTex = fbm3D(p * 15.0 + seed, 3) * 0.5 + 0.5;
    crustColor = mix(crustColor, CRUST_LIGHT, crustTex * 0.3);
    
    // Crust near cracks is warmer colored
    float edgeWarmth = 1.0 - smoothstep(0.0, 0.25, crackDist);
    crustColor = mix(crustColor, LAVA_DARK_RED * 0.5, edgeWarmth * 0.4);
    
    // === COMBINE CRUST AND LAVA ===
    vec3 lavaCol = lavaColor(lavaTemp);
    vec3 fineCrackCol = lavaColor(fineCrackTemp);
    
    vec3 surfaceColor;
    
    // Main surface is crust
    surfaceColor = crustColor;
    
    // Add glowing fine cracks
    surfaceColor = mix(surfaceColor, fineCrackCol, fineCracks * 0.8);
    
    // Major cracks and exposed lava
    surfaceColor = mix(surfaceColor, lavaCol, crackIntensity);
    
    // Hotspot glow
    surfaceColor = mix(surfaceColor, lavaCol, hotspots * 0.6);
    
    // === EMISSION (SELF-ILLUMINATION) ===
    float emission = 0.0;
    
    // Lava emits light
    emission += lavaExposure * lavaTemp * 1.5;
    
    // Fine cracks glow
    emission += fineCracks * fineCrackTemp * 0.8;
    
    // Hotspots are very bright
    emission += hotspots * 1.2;
    
    // Crust edges glow faintly
    emission += edgeWarmth * 0.2;
    
    // Scale by planet heat
    emission *= 0.5 + planetHeat * 0.5;
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    
    // Diffuse for crust only (lava is self-lit)
    float diff = max(dot(vNormal, lightDir), 0.0);
    diff = mix(diff, 0.5, lavaExposure);  // Lava doesn't need external light
    
    // Apply lighting
    vec3 litColor = surfaceColor * (diff * 0.2 + 0.1);  // Dim ambient/diffuse
    litColor += surfaceColor * emission;  // Strong emission
    
    // === LIMB GLOW (heat escaping at edges) ===
    float edge = 1.0 - abs(dot(vNormal, viewDir));
    float limbGlow = pow(edge, 2.5) * 0.5 * planetHeat;
    vec3 limbColor = mix(LAVA_ORANGE, LAVA_RED, 0.5);
    litColor += limbColor * limbGlow;
    
    // === ATMOSPHERIC HAZE (if present) ===
    if (uHasAtmosphere > 0.0) {
        float haze = pow(edge, 2.0) * 0.3 * uHasAtmosphere;
        vec3 hazeColor = mix(LAVA_ORANGE, vec3(0.5, 0.3, 0.2), 0.5);
        litColor += hazeColor * haze;
    }
    
    // === STAR TINT (minimal for self-luminous world) ===
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= mix(vec3(1.0), starTint, 0.2);
    
    // === HDR BOOST for hot areas ===
    litColor *= 1.0 + emission * 0.3;
    
    gl_FragColor = vec4(litColor, 1.0);
}
