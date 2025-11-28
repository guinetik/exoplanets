/**
 * Rocky Planet Fragment Shader V2
 *
 * Creates Earth-like and Mars-like terrestrial worlds with:
 * - Domain-warped terrain generation
 * - Biome system (desert, forest, ice, ocean)
 * - Specular oceans
 * - Cloud layers
 * - Polar ice caps
 * - Atmospheric scattering
 *
 * Physics: Solid silicate surfaces, possible atmospheres and water
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
uniform float uZoomLevel;      // 0 = far, 1 = close - controls surface detail visibility
uniform float uBodyDiameter;   // Body diameter for scale reference

// Physical color factors for data-driven variety
uniform float uColorTempFactor;
uniform float uColorCompositionFactor;
uniform float uColorIrradiationFactor;
uniform float uColorMetallicityFactor;

// =============================================================================
// ROCKY PLANET CONSTANTS
// =============================================================================

// --- Terrain Generation ---
const float TERRAIN_SCALE_BASE = 4.0;
const float TERRAIN_SCALE_VARIATION = 2.0;
const int TERRAIN_OCTAVES_SIMPLE = 3;
const int TERRAIN_OCTAVES_DETAIL = 6;
const float TERRAIN_WARP_STRENGTH = 0.4;

// --- Height Thresholds ---
const float HEIGHT_OCEAN = 0.35;          // Below = water
const float HEIGHT_BEACH = 0.38;          // Beach/shore zone
const float HEIGHT_LOWLAND = 0.50;        // Lowland terrain
const float HEIGHT_HIGHLAND = 0.70;       // Highland/mountain start
const float HEIGHT_PEAK = 0.85;           // Snow-capped peaks

// --- Temperature Regimes ---
const float TEMP_FROZEN = 220.0;          // Below = ice world
const float TEMP_COLD = 260.0;            // Cold/tundra
const float TEMP_TEMPERATE = 320.0;       // Temperate zone
const float TEMP_HOT = 380.0;             // Hot/arid
const float TEMP_SCORCHED = 500.0;        // Volcanic activity

// --- Biome Colors ---
const vec3 OCEAN_COLOR = vec3(0.1, 0.25, 0.5);
const vec3 OCEAN_DEEP = vec3(0.05, 0.12, 0.3);
const vec3 BEACH_COLOR = vec3(0.76, 0.70, 0.50);
const vec3 FOREST_COLOR = vec3(0.15, 0.4, 0.15);
const vec3 GRASSLAND_COLOR = vec3(0.35, 0.5, 0.2);
const vec3 DESERT_COLOR = vec3(0.76, 0.6, 0.4);
const vec3 TUNDRA_COLOR = vec3(0.5, 0.55, 0.5);
const vec3 SNOW_COLOR = vec3(0.9, 0.92, 0.95);
const vec3 ROCK_COLOR = vec3(0.45, 0.42, 0.38);
const vec3 MOUNTAIN_COLOR = vec3(0.55, 0.52, 0.48);

// --- Polar Ice Caps ---
const float POLAR_START = 0.7;            // Latitude where ice begins
const float POLAR_FULL = 0.9;             // Latitude of full ice coverage
const float POLAR_VARIATION = 0.1;        // Seed-based variation

// --- Clouds ---
const float CLOUD_SCALE = 6.0;
const float CLOUD_SPEED = 0.015;
const float CLOUD_THRESHOLD = 0.45;
const float CLOUD_OPACITY = 0.5;
const int CLOUD_OCTAVES = 4;

// --- Ocean Properties ---
const float OCEAN_SPECULAR_POWER = 64.0;
const float OCEAN_SPECULAR_INTENSITY = 0.7;
const float OCEAN_WAVE_SCALE = 80.0;
const float OCEAN_WAVE_SPEED = 0.1;

// --- Atmospheric Haze ---
const float ATMO_HAZE_POWER = 2.5;
const float ATMO_HAZE_STRENGTH = 0.3;

// --- Density Effects ---
const float DENSITY_ROUGHNESS_MIN = 0.6;
const float DENSITY_ROUGHNESS_MAX = 1.4;

// --- Limb Darkening ---
const float LIMB_EDGE_LOW = -0.2;
const float LIMB_EDGE_HIGH = 0.8;
const float LIMB_MIN_BRIGHTNESS = 0.4;

// --- Crater Generation (zoom-based) ---
const float CRATER_SCALE = 25.0;          // Base scale for crater distribution
const float CRATER_DETAIL_SCALE = 80.0;   // Finer crater detail scale
const float CRATER_DEPTH = 0.15;          // How much craters darken the surface
const float CRATER_RIM_BRIGHTNESS = 0.08; // Brightness boost at crater rims

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// CRATER FUNCTIONS (for zoom-based detail)
// =============================================================================

/**
 * Generate procedural crater field
 * Uses Voronoi-like cellular noise to create crater shapes
 */
float craterField(vec3 p, float scale, float seed) {
    vec3 scaledP = p * scale + vec3(seed * 10.0);

    // Cellular noise for crater positions
    float cellNoise = vnoise3D(scaledP);

    // Create crater shapes - deeper in center, raised rim
    float crater = smoothstep(0.3, 0.5, cellNoise) - smoothstep(0.5, 0.7, cellNoise) * 0.5;

    // Add some variation
    float variation = snoise3D(scaledP * 2.0 + vec3(seed)) * 0.3;

    return crater + variation * 0.2;
}

/**
 * Generate crater rim highlights
 */
float craterRims(vec3 p, float scale, float seed) {
    vec3 scaledP = p * scale + vec3(seed * 10.0);

    float cellNoise = vnoise3D(scaledP);

    // Rim is at the edge of crater (around 0.45-0.55)
    float rim = smoothstep(0.4, 0.48, cellNoise) * smoothstep(0.56, 0.48, cellNoise);

    return rim;
}

/**
 * Multi-scale crater detail combining large and small craters
 */
vec3 zoomBasedCraterDetail(vec3 p, vec3 surfaceColor, float zoomLevel, float seed) {
    if (zoomLevel < 0.1) {
        return surfaceColor;
    }

    // Fade in detail based on zoom
    float detailFade = smoothstep(0.1, 0.5, zoomLevel);

    // Large craters (visible at medium zoom)
    float largeCraters = craterField(p, CRATER_SCALE, seed);
    float largeRims = craterRims(p, CRATER_SCALE, seed);

    // Small craters (visible at high zoom)
    float smallCraters = craterField(p, CRATER_DETAIL_SCALE, seed + 5.0);
    float smallRims = craterRims(p, CRATER_DETAIL_SCALE, seed + 5.0);

    // Combine crater effects
    float totalCrater = largeCraters * 0.7 + smallCraters * 0.3 * smoothstep(0.3, 0.7, zoomLevel);
    float totalRim = largeRims * 0.6 + smallRims * 0.4 * smoothstep(0.4, 0.8, zoomLevel);

    // Apply crater darkening
    vec3 result = surfaceColor * (1.0 - totalCrater * CRATER_DEPTH * detailFade);

    // Add rim highlights
    result += vec3(1.0) * totalRim * CRATER_RIM_BRIGHTNESS * detailFade;

    // Fine surface texture at maximum zoom
    if (zoomLevel > 0.6) {
        float fineTexture = snoise3D(p * 150.0 + vec3(seed * 3.0)) * 0.5 + 0.5;
        float fineFade = smoothstep(0.6, 0.9, zoomLevel);
        result *= 0.95 + fineTexture * 0.1 * fineFade;
    }

    return result;
}

// =============================================================================
// BIOME FUNCTION
// =============================================================================

/**
 * Determine biome color based on height, temperature, and humidity
 */
vec3 getBiomeColor(float height, float temp, float humidity, float seed) {
    // Ice world - everything frozen
    if (temp < TEMP_FROZEN) {
        float iceVariation = seedHash(seed + height) * 0.1;
        return mix(SNOW_COLOR, vec3(0.8, 0.85, 0.9), iceVariation);
    }
    
    // Ocean
    if (height < HEIGHT_OCEAN) {
        float depth = 1.0 - (height / HEIGHT_OCEAN);
        return mix(OCEAN_COLOR, OCEAN_DEEP, depth);
    }
    
    // Beach
    if (height < HEIGHT_BEACH) {
        return mix(OCEAN_COLOR, BEACH_COLOR, (height - HEIGHT_OCEAN) / (HEIGHT_BEACH - HEIGHT_OCEAN));
    }
    
    // Calculate temperature factor for biome selection
    float tempFactor = smoothstep(TEMP_COLD, TEMP_HOT, temp);
    float humidityFactor = humidity;
    
    // Lowland biomes
    if (height < HEIGHT_LOWLAND) {
        vec3 coldBiome = mix(TUNDRA_COLOR, GRASSLAND_COLOR, humidityFactor);
        vec3 warmBiome = mix(DESERT_COLOR, FOREST_COLOR, humidityFactor);
        return mix(coldBiome, warmBiome, tempFactor);
    }
    
    // Highland biomes
    if (height < HEIGHT_HIGHLAND) {
        vec3 lowColor = mix(GRASSLAND_COLOR, FOREST_COLOR, humidityFactor);
        vec3 highColor = mix(ROCK_COLOR, TUNDRA_COLOR, humidityFactor);
        float t = (height - HEIGHT_LOWLAND) / (HEIGHT_HIGHLAND - HEIGHT_LOWLAND);
        return mix(lowColor, highColor, t);
    }
    
    // Mountain peaks
    if (height < HEIGHT_PEAK) {
        float t = (height - HEIGHT_HIGHLAND) / (HEIGHT_PEAK - HEIGHT_HIGHLAND);
        return mix(MOUNTAIN_COLOR, ROCK_COLOR, t);
    }
    
    // Snow-capped peaks
    float snowiness = (height - HEIGHT_PEAK) / (1.0 - HEIGHT_PEAK);
    snowiness *= (1.0 - tempFactor * 0.5);  // Less snow on hot planets
    return mix(ROCK_COLOR, SNOW_COLOR, snowiness);
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
    float hueShift = seedHueShift(uSeed);
    vec3 scales = seedScales(uSeed);
    float densityRoughness = mix(DENSITY_ROUGHNESS_MIN, DENSITY_ROUGHNESS_MAX, uDensity);
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float latitude = abs(p.y);  // 0 at equator, 1 at poles
    
    // === TERRAIN HEIGHT ===
    vec3 terrainCoord = spherePos * TERRAIN_SCALE_BASE * scales.x * densityRoughness;
    terrainCoord = seedOffset3D(terrainCoord, uSeed);
    
    int octaves = uDetailLevel > 0.5 ? TERRAIN_OCTAVES_DETAIL : TERRAIN_OCTAVES_SIMPLE;
    float height;
    
    if (uDetailLevel > 0.5) {
        height = fbmWarped3D(terrainCoord, octaves, TERRAIN_WARP_STRENGTH);
    } else {
        height = fbm3D(terrainCoord, octaves);
    }
    height = height * 0.5 + 0.5;  // Normalize to 0-1
    
    // Density affects terrain - denser = more rugged
    height = pow(height, 1.0 / densityRoughness);
    
    // === HUMIDITY (for biome selection) ===
    float humidityNoise = snoise3D(spherePos * 3.0 + vec3(phaseOffset));
    float humidity = humidityNoise * 0.5 + 0.5;
    // More humidity near equator on temperate worlds
    if (uTemperature > TEMP_COLD && uTemperature < TEMP_HOT) {
        humidity += (1.0 - latitude) * 0.3;
    }
    humidity = clamp(humidity, 0.0, 1.0);
    
    // === OCEAN PRESENCE ===
    // Hot planets have less water, frozen planets have ice
    float oceanLevel = HEIGHT_OCEAN;
    if (uTemperature > TEMP_HOT) {
        oceanLevel *= max(0.0, 1.0 - (uTemperature - TEMP_HOT) / 200.0);
    }
    bool isOcean = height < oceanLevel && uTemperature > TEMP_FROZEN && uHasAtmosphere > 0.3;
    
    // === BIOME COLOR ===
    float effectiveHeight = isOcean ? height : max(height, oceanLevel);
    vec3 surfaceColor = getBiomeColor(effectiveHeight, uTemperature, humidity, uSeed);

    // Generate physical base color for data-driven variety
    vec3 physColor = physicalPlanetColor(
        uColorTempFactor,
        uColorCompositionFactor,
        uColorIrradiationFactor,
        uColorMetallicityFactor,
        uSeed
    );

    // Apply physical color influence - blend with biome colors for variety
    // Physical color tints the biome palette rather than replacing it
    vec3 surfaceHSV = rgb2hsv(surfaceColor);
    vec3 physHSV = rgb2hsv(physColor);

    // Apply hue shift from seed + subtle influence from physical color
    surfaceHSV.x = fract(surfaceHSV.x + hueShift * 0.4 + (physHSV.x - 0.5) * 0.15);
    // Physical color affects saturation and brightness
    surfaceHSV.y *= 0.85 + physHSV.y * 0.3;
    surfaceHSV.z *= 0.9 + physHSV.z * 0.2;

    surfaceColor = hsv2rgb(surfaceHSV);

    // Blend with physical color for additional variety (subtle)
    surfaceColor = mix(surfaceColor, surfaceColor * physColor * 1.5, 0.2);
    
    // === POLAR ICE CAPS ===
    if (uTemperature < TEMP_HOT && uHasAtmosphere > 0.2) {
        float polarThreshold = POLAR_START - seedHash(uSeed + 0.5) * POLAR_VARIATION;
        // Larger caps on colder planets
        polarThreshold -= max(0.0, (TEMP_TEMPERATE - uTemperature) / 200.0) * 0.2;
        
        float iceCap = smoothstep(polarThreshold, POLAR_FULL, latitude);
        surfaceColor = mix(surfaceColor, SNOW_COLOR, iceCap * 0.8);
    }
    
    // === FINE DETAIL ===
    if (uDetailLevel > 0.5 && !isOcean) {
        float detail = vnoise3D(p * 40.0 + vec3(phaseOffset));
        surfaceColor *= 0.95 + detail * 0.1;
    }

    // === ZOOM-BASED CRATER DETAIL ===
    // Apply craters and fine surface features when zoomed in close
    // Only on non-ocean surfaces with minimal atmosphere (exposed rock)
    if (!isOcean && uHasAtmosphere < 0.7) {
        surfaceColor = zoomBasedCraterDetail(p, surfaceColor, uZoomLevel, uSeed);
    }
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseLambert(vNormal, lightDir);
    
    // Ocean specular
    float spec = 0.0;
    if (isOcean) {
        // Wave distortion using 3D position
        vec3 wavePos = p * OCEAN_WAVE_SCALE + vec3(wrappedTime * OCEAN_WAVE_SPEED, 0.0, wrappedTime * OCEAN_WAVE_SPEED * 0.5);
        float wave = snoise3D(wavePos) * 0.02;
        vec3 oceanNormal = normalize(vNormal + vec3(wave, wave, 0.0));
        
        spec = specularBlinn(oceanNormal, vec3(0.0, 0.0, 1.0), lightDir, OCEAN_SPECULAR_POWER);
        spec *= OCEAN_SPECULAR_INTENSITY;
    }
    
    // Limb darkening
    float limb = limbDarkeningStylized(vNormal, LIMB_EDGE_LOW, LIMB_EDGE_HIGH, LIMB_MIN_BRIGHTNESS);
    
    vec3 litColor = surfaceColor * (diff * 0.8 + 0.2) * limb;
    litColor += vec3(1.0, 0.95, 0.9) * spec;
    
    // === CLOUDS ===
    if (uHasAtmosphere > 0.3 && uDetailLevel > 0.5) {
        // Use 3D position for seamless cloud noise
        vec3 cloudCoord = p * CLOUD_SCALE * scales.y + vec3(wrappedTime * CLOUD_SPEED, 0.0, wrappedTime * CLOUD_SPEED * 0.7) + vec3(phaseOffset);
        float clouds = fbm3D(cloudCoord, CLOUD_OCTAVES);
        clouds = smoothstep(CLOUD_THRESHOLD, 0.7, clouds * 0.5 + 0.5);
        
        float cloudLit = diff * 0.9 + 0.1;
        vec3 cloudColor = vec3(cloudLit);
        
        litColor = mix(litColor, cloudColor, clouds * CLOUD_OPACITY * uHasAtmosphere);
    }
    
    // === ATMOSPHERIC HAZE ===
    if (uHasAtmosphere > 0.0) {
        float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        float haze = pow(edgeFactor, ATMO_HAZE_POWER) * ATMO_HAZE_STRENGTH * uHasAtmosphere;
        
        // Haze color based on temperature
        vec3 hazeColor = vec3(0.5, 0.7, 1.0);  // Blue for Earth-like
        if (uTemperature > TEMP_HOT) {
            hazeColor = mix(hazeColor, vec3(0.9, 0.7, 0.5), 
                           smoothstep(TEMP_HOT, TEMP_SCORCHED, uTemperature));
        }
        
        litColor += hazeColor * haze;
    }
    
    // === STAR TINT ===
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= starTint;
    
    gl_FragColor = vec4(litColor, 1.0);
}

