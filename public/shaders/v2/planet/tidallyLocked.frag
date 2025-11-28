/**
 * Tidally Locked World Fragment Shader V2
 * 
 * Creates worlds locked to their star with:
 * - Permanent dayside (possibly scorched/lava)
 * - Permanent nightside (frozen)
 * - Dramatic terminator zone
 * - Heat transport patterns
 * - Potential habitable terminator ring
 * 
 * Physics: Close-in rocky planets around M-dwarfs
 * Examples: Proxima b, TRAPPIST-1 planets
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
// TIDALLY LOCKED CONSTANTS
// =============================================================================

// --- Day/Night Division ---
const float TERMINATOR_WIDTH = 0.12;      // Width of twilight zone
const float TERMINATOR_CENTER = 0.5;      // Position of terminator
const float SUBSTELLAR_RADIUS = 0.3;      // Hottest zone radius

// --- Temperature Regimes ---
const float TEMP_FROZEN = 150.0;          // Nightside freeze
const float TEMP_HABITABLE_LOW = 250.0;   // Terminator habitable zone
const float TEMP_HABITABLE_HIGH = 320.0;
const float TEMP_SCORCHED = 500.0;        // Dayside scorching
const float TEMP_LAVA = 1200.0;           // Molten dayside

// --- Base Dayside Colors (will be tinted by palette) ---
const vec3 COLOR_DAYSIDE_LAVA = vec3(0.9, 0.4, 0.1);
const vec3 COLOR_DAYSIDE_GLOW = vec3(1.0, 0.7, 0.3);

// --- Color Variety ---
const float COLOR_SATURATION_BOOST = 1.6;  // Make colors more vibrant
const float COLOR_VALUE_BOOST = 1.2;       // Brighten colors

// --- Heat Transport ---
const float HEAT_FLOW_SCALE = 6.0;
const float HEAT_FLOW_SPEED = 0.01;
const float HEAT_FLOW_VISIBILITY = 0.15;

// --- Terrain ---
const float TERRAIN_SCALE = 4.0;
const int TERRAIN_OCTAVES = 4;

// --- Atmospheric Effects ---
const float ATMO_HAZE_POWER = 2.5;
const float ATMO_HAZE_DAY = 0.3;
const float ATMO_HAZE_TERMINATOR = 0.4;

// --- Clouds ---
const float CLOUD_SCALE = 5.0;
const float CLOUD_SPEED = 0.008;
const float CLOUD_OPACITY = 0.5;

// --- Limb Effects ---
const float LIMB_EDGE_LOW = -0.1;
const float LIMB_EDGE_HIGH = 0.8;
const float LIMB_MIN_BRIGHTNESS = 0.15;   // Very dark nightside

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// ZONE CALCULATION
// =============================================================================

/**
 * Calculate zone factors (day, terminator, night)
 * Returns: x = dayside, y = terminator, z = nightside
 */
vec3 calculateZones(float longitude) {
    // Distance from terminator (0 at terminator, 0.5 at day/night centers)
    float distFromTerminator = abs(longitude - TERMINATOR_CENTER);
    if (longitude < TERMINATOR_CENTER) distFromTerminator = TERMINATOR_CENTER - longitude;
    else distFromTerminator = longitude - TERMINATOR_CENTER;
    
    // Wrap check
    if (distFromTerminator > 0.5) distFromTerminator = 1.0 - distFromTerminator;
    
    // Zone factors
    float terminator = 1.0 - smoothstep(0.0, TERMINATOR_WIDTH, distFromTerminator);
    float dayside = smoothstep(TERMINATOR_CENTER - TERMINATOR_WIDTH, TERMINATOR_CENTER, longitude);
    float nightside = 1.0 - smoothstep(TERMINATOR_CENTER, TERMINATOR_CENTER + TERMINATOR_WIDTH, longitude);
    
    // Normalize
    float total = dayside + terminator + nightside;
    return vec3(dayside, terminator, nightside) / max(total, 0.01);
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
    
    // === COLOR PALETTE SELECTION (seed-based for variety) ===
    int paletteIndex = int(seedHash(uSeed + 0.1) * 6.0);
    
    // Dayside rock colors - 6 distinct vibrant palettes
    vec3 daysideRock, daysideScorched;
    if (paletteIndex == 0) {
        daysideRock = vec3(0.75, 0.45, 0.3);    // Warm rusty Mars-like
        daysideScorched = vec3(0.5, 0.25, 0.15);
    } else if (paletteIndex == 1) {
        daysideRock = vec3(0.55, 0.55, 0.6);    // Blue-gray volcanic
        daysideScorched = vec3(0.35, 0.3, 0.35);
    } else if (paletteIndex == 2) {
        daysideRock = vec3(0.85, 0.6, 0.35);    // Bright orange-tan
        daysideScorched = vec3(0.6, 0.35, 0.18);
    } else if (paletteIndex == 3) {
        daysideRock = vec3(0.65, 0.4, 0.5);     // Reddish-magenta
        daysideScorched = vec3(0.45, 0.25, 0.35);
    } else if (paletteIndex == 4) {
        daysideRock = vec3(0.5, 0.55, 0.4);     // Olive green
        daysideScorched = vec3(0.35, 0.4, 0.25);
    } else {
        daysideRock = vec3(0.8, 0.65, 0.45);    // Bright golden
        daysideScorched = vec3(0.55, 0.4, 0.25);
    }
    
    // Terminator colors (habitable zone) - vibrant palettes
    vec3 termRock, termVeg, termWater;
    if (paletteIndex == 0) {
        termRock = vec3(0.6, 0.5, 0.45);
        termVeg = vec3(0.35, 0.6, 0.35);        // Bright green vegetation
        termWater = vec3(0.2, 0.45, 0.65);      // Deep blue water
    } else if (paletteIndex == 1) {
        termRock = vec3(0.5, 0.5, 0.6);
        termVeg = vec3(0.3, 0.55, 0.5);         // Teal vegetation
        termWater = vec3(0.2, 0.4, 0.6);
    } else if (paletteIndex == 2) {
        termRock = vec3(0.65, 0.55, 0.45);
        termVeg = vec3(0.5, 0.65, 0.3);         // Bright yellow-green
        termWater = vec3(0.25, 0.5, 0.65);
    } else if (paletteIndex == 3) {
        termRock = vec3(0.55, 0.45, 0.55);
        termVeg = vec3(0.5, 0.4, 0.65);         // Purple alien vegetation
        termWater = vec3(0.35, 0.4, 0.6);       // Purple-tinged water
    } else if (paletteIndex == 4) {
        termRock = vec3(0.5, 0.55, 0.45);
        termVeg = vec3(0.6, 0.55, 0.3);         // Golden-yellow vegetation
        termWater = vec3(0.25, 0.45, 0.5);
    } else {
        termRock = vec3(0.6, 0.55, 0.5);
        termVeg = vec3(0.4, 0.6, 0.55);         // Cyan-green
        termWater = vec3(0.2, 0.5, 0.6);        // Aqua water
    }
    
    // Nightside ice colors - more vibrant and colorful
    vec3 nightIce, nightGlacier, nightDark;
    if (paletteIndex == 0) {
        nightIce = vec3(0.8, 0.85, 0.95);       // Bright blue-white ice
        nightGlacier = vec3(0.6, 0.7, 0.9);
        nightDark = vec3(0.12, 0.15, 0.25);     // Subtle blue glow
    } else if (paletteIndex == 1) {
        nightIce = vec3(0.85, 0.8, 0.92);       // Lavender-pink ice
        nightGlacier = vec3(0.7, 0.6, 0.8);
        nightDark = vec3(0.15, 0.1, 0.22);
    } else if (paletteIndex == 2) {
        nightIce = vec3(0.9, 0.88, 0.82);       // Warm cream ice
        nightGlacier = vec3(0.75, 0.7, 0.6);
        nightDark = vec3(0.18, 0.15, 0.12);
    } else if (paletteIndex == 3) {
        nightIce = vec3(0.75, 0.9, 0.95);       // Bright cyan ice
        nightGlacier = vec3(0.55, 0.8, 0.85);
        nightDark = vec3(0.08, 0.18, 0.22);
    } else if (paletteIndex == 4) {
        nightIce = vec3(0.88, 0.85, 0.78);      // Golden-white ice
        nightGlacier = vec3(0.7, 0.68, 0.55);
        nightDark = vec3(0.15, 0.14, 0.1);
    } else {
        nightIce = vec3(0.78, 0.9, 0.88);       // Mint-white ice
        nightGlacier = vec3(0.6, 0.78, 0.75);
        nightDark = vec3(0.1, 0.18, 0.16);
    }
    
    // Determine characteristics
    float hasWater = (uTemperature > TEMP_FROZEN && uTemperature < TEMP_SCORCHED) ? 1.0 : 0.0;
    hasWater *= uHasAtmosphere;
    float isScorched = smoothstep(TEMP_SCORCHED, TEMP_LAVA, uTemperature);
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    float latitude = abs(p.y);
    
    // === ZONE CALCULATION ===
    vec3 zones = calculateZones(longitude);
    float dayside = zones.x;
    float terminator = zones.y;
    float nightside = zones.z;
    
    // Substellar point (hottest) - use 3D derived coordinates
    float latNormalized = p.y * 0.5 + 0.5;  // 0-1 range
    float substellarDist = length(vec2(longitude - 0.75, latNormalized - 0.5));
    if (longitude < 0.25) substellarDist = length(vec2(longitude + 0.25, latNormalized - 0.5));
    float substellarFactor = 1.0 - smoothstep(0.0, SUBSTELLAR_RADIUS, substellarDist);
    
    // === TERRAIN ===
    vec3 terrainCoord = p * TERRAIN_SCALE * scales.x;
    terrainCoord = seedOffset3D(terrainCoord, uSeed);
    
    float terrain = fbm3D(terrainCoord, TERRAIN_OCTAVES);
    terrain = terrain * 0.5 + 0.5;
    
    // === HEAT TRANSPORT ===
    float heatFlow = 0.0;
    if (uHasAtmosphere > 0.3 && uDetailLevel > 0.5) {
        vec3 flowCoord = p * HEAT_FLOW_SCALE + vec3(wrappedTime * HEAT_FLOW_SPEED, 0.0, wrappedTime * HEAT_FLOW_SPEED * 0.5) + vec3(phaseOffset);
        heatFlow = fbmWarped3D(flowCoord, 3, 0.4);
        heatFlow = heatFlow * 0.5 + 0.5;
    }
    
    // === DAYSIDE COLOR ===
    vec3 daysideColor;
    if (isScorched > 0.0) {
        // Scorched/lava surface
        vec3 rockColor = mix(daysideRock, daysideScorched, isScorched);
        vec3 lavaColor = mix(COLOR_DAYSIDE_LAVA, COLOR_DAYSIDE_GLOW, substellarFactor);
        
        float lavaMask = terrain * isScorched * substellarFactor;
        daysideColor = mix(rockColor, lavaColor, lavaMask);
        
        // Heat glow
        daysideColor += COLOR_DAYSIDE_GLOW * substellarFactor * isScorched * 0.3;
    } else {
        // Warm but not molten
        daysideColor = daysideRock;
        daysideColor = mix(daysideColor, daysideScorched, substellarFactor * 0.5);
    }
    
    // === TERMINATOR COLOR ===
    vec3 terminatorColor;
    if (hasWater > 0.0) {
        // Habitable terminator zone
        float waterLevel = 0.35;
        if (terrain < waterLevel) {
            terminatorColor = termWater;
        } else {
            float vegetation = (1.0 - terrain) * (1.0 - latitude);
            terminatorColor = mix(termRock, termVeg, vegetation);
        }
    } else {
        terminatorColor = termRock;
    }
    
    // === NIGHTSIDE COLOR ===
    vec3 nightsideColor;
    float frozenFactor = 1.0 - smoothstep(TEMP_FROZEN, TEMP_HABITABLE_LOW, uTemperature);
    
    // Ice coverage increases towards antistellar point - use 3D derived coordinates
    float antistellarDist = length(vec2(longitude - 0.25, latNormalized - 0.5));
    if (longitude > 0.75) antistellarDist = length(vec2(longitude - 1.25, latNormalized - 0.5));
    float antistellarFactor = 1.0 - smoothstep(0.0, 0.4, antistellarDist);
    
    nightsideColor = mix(nightDark, nightIce, frozenFactor * 0.7 + antistellarFactor * 0.3);
    nightsideColor = mix(nightsideColor, nightGlacier, terrain * frozenFactor);
    
    // === COMBINE ZONES ===
    vec3 surfaceColor = daysideColor * dayside + terminatorColor * terminator + nightsideColor * nightside;
    
    // Heat transport visible
    if (heatFlow > 0.0) {
        vec3 heatColor = mix(COLOR_DAYSIDE_LAVA, termRock, 0.5);
        surfaceColor = mix(surfaceColor, heatColor, heatFlow * HEAT_FLOW_VISIBILITY * terminator);
    }
    
    // Apply hue shift, saturation and brightness boost for more vibrant colors
    vec3 surfaceHSV = rgb2hsv(surfaceColor);
    surfaceHSV.x = fract(surfaceHSV.x + hueShift * 0.4);  // More hue variation
    surfaceHSV.y = min(surfaceHSV.y * COLOR_SATURATION_BOOST, 1.0);  // Boost saturation
    surfaceHSV.z = min(surfaceHSV.z * COLOR_VALUE_BOOST, 1.0);  // Boost brightness
    surfaceColor = hsv2rgb(surfaceHSV);
    
    // === LIGHTING ===
    // Light comes from locked direction (dayside)
    vec3 lightDir = normalize(vec3(1.0, 0.0, 0.3));
    float diff = max(dot(vNormal, lightDir), 0.0);
    
    // Mix lighting by zone
    float zoneLighting = dayside * (diff * 0.9 + 0.1) + 
                         terminator * (diff * 0.5 + 0.3) + 
                         nightside * 0.05;  // Minimal nightside illumination
    
    // Self-illumination for lava
    float emission = isScorched * substellarFactor * dayside * 0.5;
    
    // Limb darkening varies by zone
    float limb = limbDarkeningStylized(vNormal, LIMB_EDGE_LOW, LIMB_EDGE_HIGH, 
                                        LIMB_MIN_BRIGHTNESS + dayside * 0.3);
    
    vec3 litColor = surfaceColor * zoneLighting * limb;
    litColor += surfaceColor * emission;
    
    // === CLOUDS ===
    if (uHasAtmosphere > 0.3 && uDetailLevel > 0.5) {
        vec3 cloudCoord = p * CLOUD_SCALE * scales.y + vec3(wrappedTime * CLOUD_SPEED, 0.0, wrappedTime * CLOUD_SPEED * 0.7) + vec3(phaseOffset);
        float clouds = fbm3D(cloudCoord, 4);
        clouds = smoothstep(0.3, 0.6, clouds * 0.5 + 0.5);
        
        // Clouds mainly in terminator zone (convection)
        clouds *= terminator + dayside * 0.3;
        
        float cloudLit = zoneLighting * 0.9 + 0.1;
        litColor = mix(litColor, vec3(cloudLit), clouds * CLOUD_OPACITY * uHasAtmosphere);
    }
    
    // === ATMOSPHERIC HAZE ===
    if (uHasAtmosphere > 0.0) {
        float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        
        // Seed-based haze colors
        vec3 atmoDay, atmoTerm, atmoNight;
        if (paletteIndex == 0) {
            atmoDay = vec3(0.8, 0.6, 0.4);
            atmoTerm = vec3(0.5, 0.7, 0.9);
            atmoNight = vec3(0.2, 0.25, 0.4);
        } else if (paletteIndex == 1) {
            atmoDay = vec3(0.7, 0.6, 0.7);
            atmoTerm = vec3(0.6, 0.6, 0.9);
            atmoNight = vec3(0.25, 0.2, 0.4);
        } else if (paletteIndex == 2) {
            atmoDay = vec3(0.9, 0.7, 0.5);
            atmoTerm = vec3(0.6, 0.8, 0.7);
            atmoNight = vec3(0.2, 0.3, 0.35);
        } else if (paletteIndex == 3) {
            atmoDay = vec3(0.75, 0.55, 0.6);
            atmoTerm = vec3(0.55, 0.6, 0.85);
            atmoNight = vec3(0.25, 0.2, 0.35);
        } else if (paletteIndex == 4) {
            atmoDay = vec3(0.8, 0.75, 0.5);
            atmoTerm = vec3(0.5, 0.7, 0.6);
            atmoNight = vec3(0.2, 0.25, 0.25);
        } else {
            atmoDay = vec3(0.7, 0.65, 0.55);
            atmoTerm = vec3(0.55, 0.75, 0.8);
            atmoNight = vec3(0.18, 0.28, 0.35);
        }
        
        // Different haze colors by zone
        vec3 hazeColor = atmoDay * dayside + 
                         atmoTerm * terminator + 
                         atmoNight * nightside;
        
        float hazeStrength = ATMO_HAZE_DAY * dayside + 
                            ATMO_HAZE_TERMINATOR * terminator + 
                            ATMO_HAZE_DAY * 0.3 * nightside;
        
        float haze = pow(edgeFactor, ATMO_HAZE_POWER) * hazeStrength * uHasAtmosphere;
        litColor += hazeColor * haze;
    }
    
    // === STAR TINT ===
    // Strong star tint on dayside
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= mix(vec3(1.0), starTint, dayside * 0.5);
    
    // Ensure nightside isn't completely black
    litColor = max(litColor, vec3(0.01, 0.012, 0.02));
    
    gl_FragColor = vec4(litColor, 1.0);
}

