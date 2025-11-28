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
const vec3 ICE_COLOR_WHITE = vec3(0.88, 0.93, 0.98); // White-blue ice (not grey!)
const vec3 ICE_COLOR_BLUE = vec3(0.6, 0.78, 0.95);   // Strong blue ice
const vec3 ICE_COLOR_DEEP = vec3(0.35, 0.55, 0.85);  // Deep glacier blue
const vec3 ICE_COLOR_GREY = vec3(0.7, 0.75, 0.82);   // Blue-grey (not pure grey!)
const vec3 ICE_COLOR_BROWN = vec3(0.5, 0.45, 0.4);   // Brown ice color (dirty ice/organics)

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
// HASH FUNCTION (for sparkle effect)
// =============================================================================

vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}

// =============================================================================
// STYLIZED ICE TEXTURE FUNCTIONS
// =============================================================================

/**
 * Dramatic branching cracks - like veins or lightning across the surface
 * Creates that stylized Europa look with organic flowing fractures
 */
float branchingCracks(vec3 pos, float seed) {
    float cracks = 0.0;
    
    // === MAJOR VEINS - thick dramatic cracks ===
    // Use domain warping for organic flow
    vec3 warp1 = vec3(
        snoise3D(pos * 2.0 + seed),
        snoise3D(pos * 2.0 + seed + 100.0),
        snoise3D(pos * 2.0 + seed + 200.0)
    ) * 0.3;
    
    float vein1 = abs(snoise3D((pos + warp1) * 3.0 + seed));
    vein1 = 1.0 - smoothstep(0.0, 0.08, vein1);
    
    // Second major vein system at different angle
    vec3 warp2 = vec3(
        snoise3D(pos * 1.5 + seed + 50.0),
        snoise3D(pos * 1.5 + seed + 150.0),
        snoise3D(pos * 1.5 + seed + 250.0)
    ) * 0.4;
    
    float vein2 = abs(snoise3D((pos.zxy + warp2) * 2.5 + seed * 2.0));
    vein2 = 1.0 - smoothstep(0.0, 0.07, vein2);
    
    // === MEDIUM BRANCHES - spreading from major veins ===
    vec3 warp3 = vec3(
        snoise3D(pos * 4.0 + seed + 300.0),
        snoise3D(pos * 4.0 + seed + 400.0),
        snoise3D(pos * 4.0 + seed + 500.0)
    ) * 0.2;
    
    float branch1 = abs(snoise3D((pos + warp3) * 6.0 + seed));
    branch1 = 1.0 - smoothstep(0.0, 0.05, branch1);
    
    float branch2 = abs(snoise3D((pos.yzx + warp3) * 7.0 + seed * 1.5));
    branch2 = 1.0 - smoothstep(0.0, 0.04, branch2);
    
    // === FINE CAPILLARIES - thin spreading cracks ===
    float fine1 = abs(snoise3D(pos * 12.0 + seed * 3.0));
    fine1 = 1.0 - smoothstep(0.0, 0.03, fine1);
    
    float fine2 = abs(snoise3D(pos * 18.0 + seed * 4.0));
    fine2 = 1.0 - smoothstep(0.0, 0.025, fine2);
    
    // Combine with hierarchy - major veins most prominent
    cracks = vein1 * 0.9 + vein2 * 0.7;
    cracks = max(cracks, branch1 * 0.5 + branch2 * 0.4);
    cracks = max(cracks, fine1 * 0.25 + fine2 * 0.15);
    
    return clamp(cracks, 0.0, 1.0);
}

/**
 * Ice surface variation - lighter and darker patches
 */
float iceVariation(vec3 pos, float seed) {
    // Large scale variation
    float large = fbm3D(pos * 2.0 + vec3(seed), 3) * 0.5 + 0.5;
    
    // Medium detail
    float medium = snoise3D(pos * 5.0 + seed * 2.0) * 0.5 + 0.5;
    
    return large * 0.7 + medium * 0.3;
}

/**
 * Bright frost patches
 */
float frostPatches(vec3 pos, float seed) {
    float frost = fbm3D(pos * 3.5 + vec3(seed * 10.0), 3) * 0.5 + 0.5;
    frost = smoothstep(0.5, 0.75, frost);
    return frost;
}

/**
 * Ice sparkle effect
 */
float iceSparkle(vec3 pos, float time, float seed) {
    vec3 cell = floor(pos * 150.0);
    float h = hash33(cell + vec3(seed)).x;
    if (h > 0.985) {
        float twinkle = sin(time * 6.0 + h * 60.0) * 0.5 + 0.5;
        return twinkle * 0.6;
    }
    return 0.0;
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
    
    // === STYLIZED BRANCHING CRACKS ===
    // Dramatic veins spreading across the surface like the reference image
    float fractures = branchingCracks(p, uSeed);
    // Modulate by Europa factor but always have some cracks
    fractures *= 0.4 + europaFactor * 0.6;
    
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
    // HOW FROZEN: colder = more intense blue ice
    float frozen = smoothstep(300.0, 50.0, uTemperature);  // 1.0 at 50K, 0.0 at 300K
    float extremeFrozen = smoothstep(100.0, 20.0, uTemperature);  // Extra frozen below 100K
    
    // For extremely cold worlds, FORCE blue ice colors (ignore physical color)
    vec3 iceBlue = ICE_COLOR_BLUE;
    vec3 iceWhite = ICE_COLOR_WHITE;
    vec3 iceDeep = ICE_COLOR_DEEP;
    
    // Colder = more saturated blue
    iceBlue = mix(iceBlue, vec3(0.5, 0.75, 1.0), extremeFrozen * 0.4);
    iceWhite = mix(iceWhite, vec3(0.85, 0.92, 1.0), frozen * 0.3);
    iceDeep = mix(iceDeep, vec3(0.25, 0.5, 0.9), extremeFrozen * 0.3);

    // Base ice color varies with terrain - blue to white gradient
    vec3 iceColor = mix(iceDeep, iceBlue, terrain * 0.7);
    iceColor = mix(iceColor, iceWhite, smoothstep(0.6, 0.9, terrain));

    // Add some variation but keep it BLUE (not grey!)
    float variation = vnoise3D(p * 8.0 + vec3(phaseOffset)) * 0.5 + 0.5;
    vec3 variationColor = mix(iceDeep, ICE_COLOR_GREY, 0.3);  // Blue-tinted grey
    iceColor = mix(iceColor, variationColor, variation * 0.15);
    
    // Very slight brown only for high density (rocky material mixed in)
    if (uDensity > 0.6) {
        float brownAmount = (uDensity - 0.6) * 0.15;
        iceColor = mix(iceColor, ICE_COLOR_BROWN, brownAmount * 0.3);
    }

    // === STYLIZED CRACKS - dark blue veins ===
    // The cracks are the DARK areas in the reference - deep blue/navy
    vec3 crackColor = mix(iceDeep * 0.4, vec3(0.1, 0.2, 0.4), 0.5);  // Dark navy blue
    iceColor = mix(iceColor, crackColor, fractures * 0.7);
    
    // === FROST PATCHES - bright white areas ===
    float frost = frostPatches(p, uSeed);
    vec3 frostColor = mix(iceWhite, vec3(0.95, 0.97, 1.0), frozen * 0.5);
    iceColor = mix(iceColor, frostColor, frost * 0.4);

    // Apply chaos terrain - slightly darker
    iceColor *= 1.0 - chaos * 0.2;

    // Apply craters
    iceColor *= mix(1.0, CRATER_FLOOR_DARKNESS, craterMask);
    iceColor *= mix(1.0, CRATER_RIM_BRIGHTNESS, craterRim);

    // Subsurface hints (blue undertones - hint of ocean beneath)
    float subsurface = vnoise3D(p * 3.0 + vec3(phaseOffset * 2.0)) * 0.5 + 0.5;
    iceColor = mix(iceColor, SUBSURFACE_COLOR, subsurface * SUBSURFACE_HINT * (1.0 - fractures));

    // Apply subtle hue shift for seed-based variety (but keep it blue!)
    vec3 iceHSV = rgb2hsv(iceColor);
    iceHSV.x = fract(iceHSV.x + hueShift * 0.5);  // Reduced hue shift
    iceColor = hsv2rgb(iceHSV);
    
    // === ICE SPARKLE ===
    float sparkle = iceSparkle(spherePos, wrappedTime, uSeed);
    sparkle *= 1.0 + extremeFrozen;  // More sparkle on colder worlds
    iceColor += vec3(0.9, 0.95, 1.0) * sparkle;

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
    // Reduce star tint influence so frozen worlds stay blue
    vec3 starTint = starLightTint(uStarTemp);
    starTint = mix(vec3(1.0), starTint, 0.4);  // Only 40% star influence
    litColor *= starTint;
    
    // Boost blue for frozen worlds
    litColor = mix(litColor, litColor * vec3(0.9, 0.95, 1.1), frozen * 0.3);
    
    gl_FragColor = vec4(litColor, 1.0);
}

