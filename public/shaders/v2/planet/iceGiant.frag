/**
 * Ice Giant Fragment Shader V2
 *
 * Creates frozen ice worlds with:
 * - Actual blue/cyan ice colors (NOT grey!)
 * - Jagged ice fracture patterns
 * - Snow/frost patches
 * - Crystalline sparkle
 * - Frozen atmosphere haze
 *
 * @author guinetik
 * @see https://github.com/guinetik
 */

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
// ICE COLORS - FORCED BLUE, NOT GREY
// =============================================================================

// These are the ACTUAL colors we want - frozen blue ice
const vec3 ICE_SURFACE = vec3(0.65, 0.82, 0.95);    // Light frozen blue
const vec3 ICE_DEEP = vec3(0.25, 0.45, 0.75);       // Deep glacier blue  
const vec3 ICE_CRACK = vec3(0.15, 0.35, 0.65);      // Dark blue in cracks
const vec3 SNOW_WHITE = vec3(0.92, 0.95, 0.98);     // Bright snow
const vec3 FROST_BLUE = vec3(0.75, 0.88, 1.0);      // Frosty blue-white

// =============================================================================
// HASH FUNCTION
// =============================================================================

vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}

// =============================================================================
// JAGGED ICE CRACKS (not smooth marble veins)
// =============================================================================

float iceCracks(vec3 p, float scale, float seed) {
    vec3 pos = p * scale;
    
    // Multiple layers of cracks at different scales
    float cracks = 0.0;
    
    // Large primary fractures
    float n1 = snoise3D(pos * 1.0 + seed);
    float crack1 = abs(n1);
    crack1 = 1.0 - smoothstep(0.0, 0.08, crack1);  // Sharp edges
    
    // Medium secondary cracks
    float n2 = snoise3D(pos * 2.5 + seed * 2.0);
    float crack2 = abs(n2);
    crack2 = 1.0 - smoothstep(0.0, 0.06, crack2);
    
    // Fine hairline cracks
    float n3 = snoise3D(pos * 6.0 + seed * 3.0);
    float crack3 = abs(n3);
    crack3 = 1.0 - smoothstep(0.0, 0.04, crack3);
    
    cracks = crack1 * 0.6 + crack2 * 0.3 + crack3 * 0.2;
    
    return cracks;
}

// =============================================================================
// SNOW/FROST PATCHES
// =============================================================================

float snowPatches(vec3 p, float time) {
    // Large snow accumulation areas
    float snow = fbm3D(p * 3.0 + vec3(0.0, time * 0.002, 0.0), 4);
    snow = snow * 0.5 + 0.5;
    
    // Boost high areas (snow accumulates on "top")
    float heightBias = p.y * 0.3 + 0.5;
    snow = snow * heightBias;
    
    // Make it patchy
    snow = smoothstep(0.35, 0.7, snow);
    
    return snow;
}

// =============================================================================
// CRYSTALLINE TEXTURE
// =============================================================================

float crystalTexture(vec3 p, float scale) {
    float crystals = 0.0;
    
    // Voronoi-like crystal cells
    vec3 pos = p * scale;
    vec3 cell = floor(pos);
    vec3 local = fract(pos);
    
    float minDist = 1.0;
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            for (int z = -1; z <= 1; z++) {
                vec3 neighbor = vec3(float(x), float(y), float(z));
                vec3 point = hash33(cell + neighbor);
                float d = length(neighbor + point - local);
                minDist = min(minDist, d);
            }
        }
    }
    
    crystals = minDist;
    return crystals;
}

// =============================================================================
// SPARKLE EFFECT
// =============================================================================

float iceSparkle(vec3 p, float time, float seed) {
    vec3 sparkleCell = floor(p * 300.0);
    float h = hash33(sparkleCell + vec3(seed)).x;
    
    if (h > 0.985) {
        float twinkle = sin(time * 4.0 + h * 50.0) * 0.5 + 0.5;
        twinkle *= sin(time * 9.0 + h * 100.0) * 0.5 + 0.5;
        return twinkle * 0.9;
    }
    return 0.0;
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
    
    // === HOW FROZEN IS IT? ===
    // Colder = more intense blue, more frost, more sparkle
    float frozen = smoothstep(400.0, 50.0, uTemperature);  // 1.0 at 50K
    float extremeFrozen = smoothstep(150.0, 20.0, uTemperature);  // Extra boost below 150K
    
    // === ICE CRACKS ===
    float cracks = iceCracks(p, 4.0, seed);
    
    // === SNOW PATCHES ===
    float snow = snowPatches(p, time);
    // More snow on colder planets
    snow *= 0.5 + frozen * 0.7;
    
    // === CRYSTAL TEXTURE ===
    float crystals = crystalTexture(p, 8.0);
    
    // === DEEP ICE STRUCTURE ===
    float deepIce = fbm3D(p * 2.0 + vec3(seed * 0.1), 3);
    deepIce = deepIce * 0.5 + 0.5;
    
    // ==========================================================
    // COLOR - FORCE BLUE ICE COLORS
    // ==========================================================
    
    // Start with frozen blue surface
    vec3 surfaceColor = ICE_SURFACE;
    
    // Vary blue hue slightly based on seed (but STAY BLUE)
    float hueVar = (seedHash(uSeed + 0.5) - 0.5) * 0.08;  // Small variation
    vec3 hsv = rgb2hsv(surfaceColor);
    hsv.x = fract(hsv.x + hueVar);  // Shift hue slightly
    hsv.y *= 0.85 + frozen * 0.3;   // More saturated when colder
    surfaceColor = hsv2rgb(hsv);
    
    // Blend with deep ice based on structure
    vec3 color = mix(ICE_DEEP, surfaceColor, deepIce * 0.5 + 0.5);
    
    // Add crystal variation (subtle brightness changes)
    color *= 0.9 + crystals * 0.2;
    
    // CRACKS are darker, deeper blue
    color = mix(color, ICE_CRACK, cracks * 0.7);
    
    // SNOW patches are bright white-blue
    vec3 snowColor = mix(FROST_BLUE, SNOW_WHITE, 0.6 + frozen * 0.3);
    color = mix(color, snowColor, snow * 0.6);
    
    // Frozen boost - colder = more vibrant blue
    color = mix(color, color * vec3(0.85, 0.95, 1.15), frozen * 0.4);
    
    // === SPARKLE ===
    float sparkle = iceSparkle(spherePos, time, uSeed);
    sparkle *= 1.0 + extremeFrozen * 2.0;  // More sparkles when very cold
    color += vec3(sparkle) * vec3(0.95, 0.98, 1.0);
    
    // === SUBSURFACE SCATTERING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float backlight = max(dot(-vNormal, lightDir), 0.0);
    float sss = pow(backlight, 2.5) * 0.2 * (1.0 + frozen * 0.5);
    color += ICE_SURFACE * sss * 1.5;
    
    // === LIGHTING ===
    float diff = max(dot(vNormal, lightDir), 0.0) * 0.5 + 0.5;  // Half-lambert
    
    // Specular (ice is shiny)
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 48.0);
    
    // Apply lighting
    vec3 litColor = color * diff;
    litColor += vec3(1.0, 0.98, 0.95) * spec * 0.4;  // White specular
    
    // === LIMB DARKENING ===
    float limb = max(dot(vNormal, viewDir), 0.0);
    limb = 0.5 + limb * 0.5;
    litColor *= limb;
    
    // === ATMOSPHERIC HAZE ===
    float edge = 1.0 - abs(dot(vNormal, viewDir));
    float haze = pow(edge, 2.0) * 0.35;
    vec3 hazeColor = mix(vec3(0.7, 0.85, 1.0), vec3(0.85, 0.92, 1.0), frozen);
    litColor += hazeColor * haze;
    
    // === MINIMAL STAR TINT ===
    // Don't let star color wash out our ice colors too much
    vec3 starTint = starLightTint(uStarTemp);
    // Reduce star influence on cold ice planets
    starTint = mix(vec3(1.0), starTint, 0.3);
    litColor *= starTint;
    
    // === FINAL BRIGHTNESS BOOST FOR FROZEN PLANETS ===
    litColor *= 1.0 + frozen * 0.15;
    
    gl_FragColor = vec4(litColor, 1.0);
}
