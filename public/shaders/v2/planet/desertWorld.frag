/**
 * Desert World Fragment Shader V2
 * 
 * Creates arid worlds with:
 * - Dune fields with realistic patterns
 * - Rocky canyons and mesas
 * - Dust storms
 * - Salt flats and dried lakebeds
 * - Minimal or no vegetation
 * 
 * Physics: Rocky worlds that lost their water, or formed dry
 * Examples: Mars, Arrakis-like worlds
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
// DESERT WORLD CONSTANTS
// =============================================================================

// --- Terrain Types ---
const float TERRAIN_SCALE = 5.0;
const int TERRAIN_OCTAVES = 5;

// Height thresholds for terrain types
const float HEIGHT_BASIN = 0.25;                        // Salt flats, dry lakes
const float HEIGHT_DUNES = 0.45;                        // Sand dune fields
const float HEIGHT_PLAINS = 0.60;                       // Rocky plains
const float HEIGHT_MESA = 0.75;                         // Plateaus and mesas
const float HEIGHT_MOUNTAIN = 0.90;                     // Mountains

// --- Colors ---
const vec3 COLOR_SALT_FLAT = vec3(0.85, 0.82, 0.75);    // Salt flat color
const vec3 COLOR_SAND_LIGHT = vec3(0.85, 0.70, 0.50);   // Light sand color
const vec3 COLOR_SAND_DARK = vec3(0.65, 0.45, 0.30);    // Dark sand color
const vec3 COLOR_ROCK_RED = vec3(0.60, 0.35, 0.25);     // Red rock color
const vec3 COLOR_ROCK_GREY = vec3(0.50, 0.45, 0.42);    // Grey rock color
const vec3 COLOR_MESA = vec3(0.55, 0.30, 0.20);         // Mesa color
const vec3 COLOR_SHADOW = vec3(0.35, 0.25, 0.20);       // Shadow color

// --- Dunes ---
const float DUNE_SCALE = 15.0;                          // Scale of dunes
const float DUNE_HEIGHT = 0.08;                         // Height of dunes
const float DUNE_DIRECTION = 0.3;                       // Prevailing wind direction
const float DUNE_SHARPNESS = 2.0;                       // Ridge sharpness

// --- Canyons ---
const float CANYON_SCALE = 8.0;                         // Scale of canyons
const float CANYON_DEPTH = 0.15;                        // Depth of canyons
const float CANYON_WIDTH = 0.12;                        // Width of canyons

// --- Dust Storms ---
const float DUST_SCALE = 4.0;                           // Scale of dust storms
const float DUST_SPEED = 0.02;                          // Speed of dust storms
const float DUST_OPACITY = 0.4;                         // Opacity of dust storms
const vec3 DUST_COLOR = vec3(0.75, 0.55, 0.40);         // Dust color
const float DUST_PROBABILITY = 0.3;                     // Probability of dust storms

// --- Atmosphere ---
const float HAZE_POWER = 3.0;                           // Power of haze
const float HAZE_INTENSITY = 0.2;                       // Intensity of haze
const vec3 HAZE_COLOR = vec3(0.8, 0.6, 0.4);            // Dusty orange haze

// --- Limb Darkening ---
const float LIMB_EDGE_LOW = -0.1;                       // Lower edge of limb darkening
const float LIMB_EDGE_HIGH = 0.8;                       // Upper edge of limb darkening by limb darkening
const float LIMB_MIN_BRIGHTNESS = 0.35;                 // Minimum brightness of limb darkening

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// DUNE FUNCTION
// =============================================================================

/**
 * Generate realistic dune pattern using 3D position
 */
float dunePattern3D(vec3 pos, float seed, float time) {
    // Dunes aligned with wind direction
    float windAngle = DUNE_DIRECTION + seedHash(seed) * 0.5;
    vec3 windDir = vec3(cos(windAngle), 0.0, sin(windAngle));
    
    // Project position onto wind-perpendicular axis
    vec3 perpDir = cross(windDir, vec3(0.0, 1.0, 0.0));
    float dunePos = dot(pos * DUNE_SCALE, perpDir);
    
    // Add variation using 3D noise
    float variation = snoise3D(pos * 3.0 + vec3(seed * 10.0)) * 0.3;
    dunePos += variation;
    
    // Sharp-crested dune profile
    float dune = sin(dunePos);
    dune = sign(dune) * pow(abs(dune), 1.0 / DUNE_SHARPNESS);
    dune = dune * 0.5 + 0.5;
    
    // Slow migration
    dune += time * 0.001;
    
    return dune * DUNE_HEIGHT;
}

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
    
    // Determine desert characteristics
    float isRedDesert = seedHash(uSeed + 0.3);  // Mars-like vs tan
    float hasDustStorm = seedHash(uSeed + 0.5) < DUST_PROBABILITY ? 1.0 : 0.0;
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    float latitude = abs(p.y);
    
    // === BASE TERRAIN ===
    vec3 terrainCoord = p * TERRAIN_SCALE * scales.x;
    terrainCoord = seedOffset3D(terrainCoord, uSeed);
    
    int octaves = uDetailLevel > 0.5 ? TERRAIN_OCTAVES : 3;
    float terrain = fbmWarped3D(terrainCoord, octaves, 0.35);
    terrain = terrain * 0.5 + 0.5;
    
    // === CANYON CARVING ===
    float canyon = 0.0;
    if (uDetailLevel > 0.5) {
        vec3 canyonCoord = p * CANYON_SCALE + vec3(phaseOffset);
        float canyonNoise = abs(snoise3D(canyonCoord));
        canyon = 1.0 - smoothstep(0.0, CANYON_WIDTH, canyonNoise);
        canyon *= smoothstep(HEIGHT_PLAINS, HEIGHT_MESA, terrain);
        terrain -= canyon * CANYON_DEPTH;
    }
    
    terrain = clamp(terrain, 0.0, 1.0);
    
    // === DUNE HEIGHT ===
    float dunes = 0.0;
    if (terrain > HEIGHT_BASIN && terrain < HEIGHT_PLAINS) {
        float duneStrength = 1.0 - abs(terrain - HEIGHT_DUNES) / (HEIGHT_PLAINS - HEIGHT_BASIN);
        dunes = dunePattern3D(p, uSeed, wrappedTime) * duneStrength;
    }
    
    // === COLOR CALCULATION ===
    vec3 surfaceColor;
    
    // Salt flats (lowest areas)
    if (terrain < HEIGHT_BASIN) {
        surfaceColor = COLOR_SALT_FLAT;
        float saltVariation = vnoise3D(p * 30.0) * 0.1;
        surfaceColor *= 1.0 - saltVariation;
    }
    // Dune fields
    else if (terrain < HEIGHT_PLAINS) {
        vec3 sandLight = mix(COLOR_SAND_LIGHT, COLOR_ROCK_RED, isRedDesert * 0.5);
        vec3 sandDark = mix(COLOR_SAND_DARK, COLOR_ROCK_RED * 0.8, isRedDesert * 0.5);
        
        // Dune shading based on dune height
        surfaceColor = mix(sandDark, sandLight, dunes / DUNE_HEIGHT);
        
        // Add ripple detail using 3D position
        if (uDetailLevel > 0.5) {
            float ripples = snoise3D(p * 80.0 + vec3(phaseOffset)) * 0.5 + 0.5;
            surfaceColor *= 0.95 + ripples * 0.1;
        }
    }
    // Rocky plains
    else if (terrain < HEIGHT_MESA) {
        vec3 rockColor = mix(COLOR_ROCK_GREY, COLOR_ROCK_RED, isRedDesert);
        vec3 sandColor = mix(COLOR_SAND_DARK, COLOR_ROCK_RED * 0.9, isRedDesert * 0.5);
        
        float rockiness = (terrain - HEIGHT_PLAINS) / (HEIGHT_MESA - HEIGHT_PLAINS);
        surfaceColor = mix(sandColor, rockColor, rockiness);
    }
    // Mesas and plateaus
    else if (terrain < HEIGHT_MOUNTAIN) {
        surfaceColor = mix(COLOR_MESA, COLOR_ROCK_RED, isRedDesert * 0.5);
        
        // Layered sediment look
        float layers = sin(terrain * 50.0) * 0.5 + 0.5;
        surfaceColor *= 0.9 + layers * 0.15;
    }
    // Mountains
    else {
        surfaceColor = mix(COLOR_ROCK_GREY, COLOR_ROCK_RED * 0.7, isRedDesert);
    }
    
    // Canyon shadows
    if (canyon > 0.0) {
        surfaceColor = mix(surfaceColor, COLOR_SHADOW, canyon * 0.5);
    }
    
    // Apply hue shift
    vec3 surfaceHSV = rgb2hsv(surfaceColor);
    surfaceHSV.x = fract(surfaceHSV.x + hueShift);
    surfaceColor = hsv2rgb(surfaceHSV);
    
    // Blend with base color
    surfaceColor = mix(surfaceColor, surfaceColor * uBaseColor * 1.5, 0.25);
    
    // === POLAR ICE (if cold enough) ===
    if (uTemperature < 280.0) {
        float iceFactor = smoothstep(280.0, 200.0, uTemperature);
        float polarIce = smoothstep(0.6, 0.9, latitude) * iceFactor;
        surfaceColor = mix(surfaceColor, vec3(0.9, 0.92, 0.95), polarIce * 0.7);
    }
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseLambert(vNormal, lightDir);
    
    // Dune self-shadowing
    if (dunes > 0.0) {
        float duneShadow = dunes / DUNE_HEIGHT;
        diff *= 0.7 + duneShadow * 0.3;
    }
    
    // Limb darkening
    float limb = limbDarkeningStylized(vNormal, LIMB_EDGE_LOW, LIMB_EDGE_HIGH, LIMB_MIN_BRIGHTNESS);
    
    vec3 litColor = surfaceColor * diff * limb;
    
    // === DUST STORMS ===
    if (hasDustStorm > 0.0 && uHasAtmosphere > 0.2 && uDetailLevel > 0.5) {
        vec3 dustCoord = p * DUST_SCALE + vec3(wrappedTime * DUST_SPEED, 0.0, wrappedTime * DUST_SPEED * 0.5) + vec3(phaseOffset);
        float dust = fbmWarped3D(dustCoord, 4, 0.5);
        dust = smoothstep(0.2, 0.8, dust * 0.5 + 0.5);
        
        // Dust more common at certain latitudes
        dust *= 1.0 - abs(latitude - 0.3) * 1.5;
        dust = max(0.0, dust);
        
        vec3 dustCol = DUST_COLOR * (diff * 0.8 + 0.2);
        litColor = mix(litColor, dustCol, dust * DUST_OPACITY * hasDustStorm);
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

