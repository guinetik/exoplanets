/**
 * Icy World Fragment Shader V2
 *
 * Creates frozen worlds like Europa and Enceladus with:
 * - Ice fracture patterns (lineae)
 * - Subsurface ocean hints
 * - Impact craters
 * - Smooth ice plains
 * - Subtle color variations in ice
 *
 * Physics: Frozen surfaces over possible subsurface oceans
 * Examples: Europa, Enceladus, TRAPPIST-1 f/g
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
// ICY WORLD CONSTANTS
// =============================================================================

// --- Ice Surface ---
const float ICE_SCALE = 4.0;                         // Scale of ice surface
const int ICE_OCTAVES = 4;                           // Number of octaves for ice surface
const vec3 ICE_COLOR_WHITE = vec3(0.92, 0.94, 0.96); // White ice color
const vec3 ICE_COLOR_BLUE = vec3(0.75, 0.85, 0.95);  // Blue ice color
const vec3 ICE_COLOR_GREY = vec3(0.65, 0.68, 0.72);  // Grey ice color
const vec3 ICE_COLOR_BROWN = vec3(0.55, 0.48, 0.42); // Brown ice color (dirty ice/organics)

// --- Fractures (Lineae) ---
const float FRACTURE_SCALE = 8.0;                    // Scale of fractures
const float FRACTURE_THRESHOLD = 0.12;               // Width of fractures
const float FRACTURE_DEPTH = 0.3;                    // How dark fractures are
const vec3 FRACTURE_COLOR = vec3(0.4, 0.35, 0.32);   // Brownish fractures
const float FRACTURE_GLOW = 0.1;                     // Hint of subsurface warmth

// --- Impact Craters ---
const float CRATER_PROBABILITY = 0.6;                // Probability of impact craters
const float CRATER_SIZE_MIN = 0.02;                  // Minimum crater size
const float CRATER_SIZE_MAX = 0.08;                  // Maximum crater size
const int MAX_CRATERS = 5;                           // Maximum number of craters
const float CRATER_RIM_BRIGHTNESS = 1.15;            // Brightness of crater rim
const float CRATER_FLOOR_DARKNESS = 0.85;            // Darkness of crater floor

// --- Chaos Terrain ---
// Disrupted ice indicating subsurface activity
const float CHAOS_SCALE = 6.0;                       // Scale of chaos terrain
const float CHAOS_THRESHOLD = 0.7;                   // How rare chaos terrain is
const float CHAOS_ROUGHNESS = 0.25;                  // Roughness of chaos terrain

// --- Smooth Plains ---
const float PLAIN_SMOOTHNESS = 0.8;                  // How smooth ice plains are
const float PLAIN_COLOR_VARIATION = 0.1;             // Variation of ice plains color

// --- Subsurface Hints ---
const float SUBSURFACE_HINT = 0.08;                  // Visibility of subsurface features
const vec3 SUBSURFACE_COLOR = vec3(0.3, 0.5, 0.6);   // Blue-grey subsurface

// --- Atmosphere (thin) ---
const float ATMO_SCALE = 0.15;                       // Very thin atmosphere haze

// --- Limb Darkening ---
const float LIMB_EDGE_LOW = -0.1;                    // Lower edge of limb darkening
const float LIMB_EDGE_HIGH = 0.85;                   // Upper edge of limb darkening
const float LIMB_MIN_BRIGHTNESS = 0.5;               // Minimum brightness of limb darkening

// --- Albedo ---
const float ICE_ALBEDO = 0.7;                       // Ice is highly reflective

// --- Zoom Detail ---
const float ICE_CRACK_SCALE = 50.0;                // Fine ice cracks scale
const float CRYSTAL_SCALE = 80.0;                  // Crystalline structure scale

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// ZOOM DETAIL FUNCTION
// =============================================================================

/**
 * Add fine ice details when zoomed in - cracks, crystals, and texture
 */
vec3 iceZoomDetail(vec3 p, vec3 iceColor, float zoomLevel, float seed) {
    if (zoomLevel < 0.15) {
        return iceColor;
    }

    float detailFade = smoothstep(0.15, 0.5, zoomLevel);

    // Fine surface cracks
    float crackNoise = abs(snoise3D(p * ICE_CRACK_SCALE + vec3(seed * 10.0)));
    float cracks = 1.0 - smoothstep(0.0, 0.08, crackNoise);
    iceColor = mix(iceColor, iceColor * 0.7, cracks * 0.4 * detailFade);

    // Crystalline structure highlights
    float crystalNoise = vnoise3D(p * CRYSTAL_SCALE + vec3(seed * 5.0));
    float crystals = smoothstep(0.6, 0.8, crystalNoise);
    iceColor += vec3(0.1, 0.12, 0.15) * crystals * 0.3 * detailFade;

    // Small impact pits at high zoom
    if (zoomLevel > 0.4) {
        float pitFade = smoothstep(0.4, 0.7, zoomLevel);
        float pitNoise = vnoise3D(p * 40.0 + vec3(seed * 8.0));
        float pits = smoothstep(0.65, 0.8, pitNoise);
        iceColor *= (1.0 - pits * 0.15 * pitFade);
    }

    // Fine ice grain at maximum zoom
    if (zoomLevel > 0.6) {
        float grainFade = smoothstep(0.6, 0.9, zoomLevel);
        float grain = snoise3D(p * 150.0 + vec3(seed * 3.0)) * 0.5 + 0.5;
        iceColor *= 0.96 + grain * 0.08 * grainFade;
    }

    return iceColor;
}

// =============================================================================
// FRACTURE FUNCTION
// =============================================================================

/**
 * Generate Europa-like fracture pattern
 */
float fracturePattern(vec3 pos, float seed) {
    vec3 fractureCoord = pos * FRACTURE_SCALE;
    fractureCoord = seedOffset3D(fractureCoord, seed);
    
    // Voronoi-like fracture edges
    float fractures = 0.0;
    
    // Main fractures
    float f1 = abs(snoise3D(fractureCoord));
    f1 = 1.0 - smoothstep(0.0, FRACTURE_THRESHOLD, f1);
    
    // Secondary fractures (smaller, more numerous)
    float f2 = abs(snoise3D(fractureCoord * 2.3 + vec3(seed * 10.0)));
    f2 = 1.0 - smoothstep(0.0, FRACTURE_THRESHOLD * 0.7, f2);
    
    // Cross-cutting fractures
    float f3 = abs(snoise3D(fractureCoord.zxy * 1.7));
    f3 = 1.0 - smoothstep(0.0, FRACTURE_THRESHOLD * 0.8, f3);
    
    fractures = max(f1, max(f2 * 0.6, f3 * 0.4));
    
    return fractures;
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
    float hueShift = seedHueShift(uSeed) * 0.2;  // Subtle variation
    
    // Determine if this is more Europa-like (fractures) or Enceladus-like (smooth)
    float europaFactor = seedHash(uSeed + 0.3);
    
    // === 3D POSITION SETUP (avoids UV seams/polar artifacts) ===
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    float latitude = p.y * 0.5 + 0.5;
    
    // === BASE ICE TERRAIN ===
    vec3 iceCoord = p * ICE_SCALE * scales.x;
    iceCoord = seedOffset3D(iceCoord, uSeed);
    
    int octaves = uDetailLevel > 0.5 ? ICE_OCTAVES : 2;
    float terrain = fbm3D(iceCoord, octaves);
    terrain = terrain * 0.5 + 0.5;
    
    // Smooth out terrain for ice plains
    terrain = mix(terrain, 0.5, PLAIN_SMOOTHNESS * (1.0 - europaFactor * 0.5));
    
    // === FRACTURE PATTERN ===
    float fractures = 0.0;
    if (uDetailLevel > 0.5) {
        fractures = fracturePattern(p, uSeed);
        fractures *= europaFactor;  // More fractures on Europa-like moons
    }
    
    // === CHAOS TERRAIN ===
    float chaos = 0.0;
    if (europaFactor > 0.4 && uDetailLevel > 0.5) {
        float chaosNoise = fbm3D(p * CHAOS_SCALE + vec3(phaseOffset), 3);
        chaos = smoothstep(CHAOS_THRESHOLD, 1.0, chaosNoise * 0.5 + 0.5);
        chaos *= CHAOS_ROUGHNESS;
    }
    
    // === IMPACT CRATERS ===
    float craterMask = 0.0;
    float craterRim = 0.0;
    
    if (seedHasCommonFeature(uSeed, 10.0)) {
        for (int i = 0; i < MAX_CRATERS; i++) {
            if (!seedHasUncommonFeature(uSeed, float(i) + 20.0)) continue;
            
            vec2 craterPos = seedHash2(uSeed + float(i) * 0.1);
            float craterSize = CRATER_SIZE_MIN + seedHash(uSeed + float(i) * 0.2) * (CRATER_SIZE_MAX - CRATER_SIZE_MIN);
            
            // Use longitude/latitude derived from 3D position
            vec2 coordForCrater = vec2(longitude, latitude);
            vec2 delta = coordForCrater - craterPos;
            if (delta.x > 0.5) delta.x -= 1.0;
            if (delta.x < -0.5) delta.x += 1.0;
            
            float dist = length(delta);
            float normalizedDist = dist / craterSize;
            
            // Crater floor
            float floor = 1.0 - smoothstep(0.0, 0.8, normalizedDist);
            craterMask = max(craterMask, floor);
            
            // Crater rim
            float rim = smoothstep(0.7, 0.9, normalizedDist) * (1.0 - smoothstep(0.9, 1.1, normalizedDist));
            craterRim = max(craterRim, rim);
        }
    }
    
    // === COLOR CALCULATION ===
    // Generate physical base color for data-driven variety
    vec3 physColor = physicalPlanetColor(
        uColorTempFactor,
        uColorCompositionFactor,
        uColorIrradiationFactor,
        uColorMetallicityFactor,
        uSeed
    );

    // Blend physical color with ice palette (ice dominates but physical adds variety)
    vec3 iceBlue = mix(ICE_COLOR_BLUE, physColor, 0.2);
    vec3 iceWhite = mix(ICE_COLOR_WHITE, physColor * 1.1, 0.15);

    // Base ice color varies with terrain
    vec3 iceColor = mix(iceBlue, iceWhite, terrain);

    // Add grey/brown variations
    float dirtiness = vnoise3D(p * 8.0 + vec3(phaseOffset)) * 0.5 + 0.5;
    dirtiness *= seedHash(uSeed + 0.7) * 0.5;  // Seed determines overall dirtiness
    vec3 greyTinted = mix(ICE_COLOR_GREY, physColor * 0.8, 0.2);
    iceColor = mix(iceColor, greyTinted, dirtiness * 0.3);

    // Density affects color - higher density = more rock/mineral content
    vec3 brownTinted = mix(ICE_COLOR_BROWN, physColor * 0.7, 0.25);
    iceColor = mix(iceColor, brownTinted, uDensity * 0.15);

    // Apply fractures
    if (fractures > 0.0) {
        // Fractures are darker with hint of warmth - tinted by physical color
        vec3 fractureBase = mix(FRACTURE_COLOR, physColor * 0.5, 0.2);
        vec3 fractureCol = mix(fractureBase, SUBSURFACE_COLOR, FRACTURE_GLOW);
        iceColor = mix(iceColor, fractureCol, fractures * FRACTURE_DEPTH);
    }

    // Apply chaos terrain
    iceColor *= 1.0 - chaos * 0.3;
    iceColor = mix(iceColor, greyTinted, chaos * 0.5);

    // Apply craters
    iceColor *= mix(1.0, CRATER_FLOOR_DARKNESS, craterMask);
    iceColor *= mix(1.0, CRATER_RIM_BRIGHTNESS, craterRim);

    // Subsurface hints (blue-ish undertones with physical tint)
    float subsurface = vnoise3D(p * 3.0 + vec3(phaseOffset * 2.0)) * 0.5 + 0.5;
    vec3 subsurfaceTinted = mix(SUBSURFACE_COLOR, physColor * 0.7, 0.15);
    iceColor = mix(iceColor, subsurfaceTinted, subsurface * SUBSURFACE_HINT * (1.0 - fractures));

    // Apply hue shift for seed-based variety
    vec3 iceHSV = rgb2hsv(iceColor);
    iceHSV.x = fract(iceHSV.x + hueShift);
    iceColor = hsv2rgb(iceHSV);

    // === ZOOM-BASED DETAIL ===
    // Add fine ice cracks, crystals and texture when zoomed in
    iceColor = iceZoomDetail(p, iceColor, uZoomLevel, uSeed);

    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseLambert(vNormal, lightDir);
    
    // Ice has high albedo
    diff = diff * ICE_ALBEDO + (1.0 - ICE_ALBEDO) * 0.1;
    
    // Specular for ice
    float spec = specularBlinn(vNormal, vec3(0.0, 0.0, 1.0), lightDir, 32.0) * 0.3;
    
    // Limb darkening
    float limb = limbDarkeningStylized(vNormal, LIMB_EDGE_LOW, LIMB_EDGE_HIGH, LIMB_MIN_BRIGHTNESS);
    
    vec3 litColor = iceColor * diff * limb;
    litColor += vec3(1.0, 0.98, 0.95) * spec;
    
    // === THIN ATMOSPHERE HAZE ===
    if (uHasAtmosphere > 0.0) {
        float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        float haze = pow(edgeFactor, 2.5) * ATMO_SCALE * uHasAtmosphere;
        litColor += vec3(0.7, 0.8, 1.0) * haze;
    }
    
    // === STAR TINT ===
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= starTint;
    
    gl_FragColor = vec4(litColor, 1.0);
}

