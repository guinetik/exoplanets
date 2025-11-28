/**
 * Lava World Fragment Shader V2
 * 
 * Creates volcanic hellscapes with:
 * - Molten lava flows and lakes
 * - Glowing fractures and cracks
 * - Dark solidified crust
 * - Heat distortion effects
 * - Volcanic highlands
 * 
 * Physics: Extremely hot rocky worlds with active volcanism
 * Examples: CoRoT-7 b, Kepler-10 b
 * Based on Morgan McGuire's "Vulcan" Shadertoy
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
// LAVA WORLD CONSTANTS
// =============================================================================

// --- Terrain/Crust ---
const float CRUST_SCALE = 5.0;
const float CRUST_ROUGHNESS = 0.7;
const int CRUST_OCTAVES = 5;
const vec3 CRUST_COLOR_DARK = vec3(0.08, 0.05, 0.03);
const vec3 CRUST_COLOR_LIGHT = vec3(0.25, 0.18, 0.12);

// --- Lava/Magma ---
const float LAVA_THRESHOLD = 0.4;                   // Height below which is lava
const float LAVA_FLOW_SCALE = 8.0;                  // Scale of lava flow    
const float LAVA_FLOW_SPEED = 0.02;                 // Speed of lava flow
const float LAVA_PULSE_SPEED = 0.5;                 // Pulsing glow speed
const float LAVA_PULSE_STRENGTH = 0.2;              // Strength of pulsing glow
const vec3 LAVA_COLOR_HOT = vec3(1.0, 0.9, 0.5);    // White-hot center
const vec3 LAVA_COLOR_WARM = vec3(1.0, 0.5, 0.1);   // Orange
const vec3 LAVA_COLOR_COOL = vec3(0.8, 0.2, 0.0);   // Dark red edges

// --- Cracks/Fissures ---
const float CRACK_SCALE = 12.0;
const float CRACK_THRESHOLD = 0.7;                  // How common cracks are
const float CRACK_WIDTH = 0.15;                     // Visual width of cracks
const float CRACK_GLOW_INTENSITY = 1.5;             // Brightness of glowing cracks
const float CRACK_GLOW_FALLOFF = 3.0;               // How quickly glow fades

// --- Heat Glow ---
const float HEAT_GLOW_POWER = 2.0;                  // Edge glow concentration
const float HEAT_GLOW_INTENSITY = 0.6;              // Overall thermal glow

// --- Temperature Effects ---
const float TEMP_LAVA_MIN = 800.0;                  // Minimum temp for visible lava
const float TEMP_LAVA_FULL = 1500.0;                // Temperature for maximum activity
const float TEMP_WHITE_HOT = 2500.0;                // White-hot lava

// --- Volcanic Features ---
const float VOLCANO_SCALE = 2.0;                    // Scale of volcanic features
const float VOLCANO_HEIGHT = 0.3;                   // How tall volcanoes are
const int VOLCANO_COUNT = 3;                        // Number of volcanic hotspots

// --- Emission ---
const float EMISSION_STRENGTH = 2.0;                // Self-illumination intensity
const float AMBIENT_GLOW = 0.15;                    // Minimum glow from heat

// --- Limb Effects ---
const float LIMB_GLOW_POWER = 3.0;                  // Power of limb glow
const float LIMB_GLOW_COLOR_SHIFT = 0.3;            // Shift towards orange at edges

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// LAVA PATTERN FUNCTION
// =============================================================================

/**
 * Generate flowing lava pattern
 */
float lavaPattern(vec3 pos, float time, float seed) {
    vec3 flowCoord = pos * LAVA_FLOW_SCALE;
    flowCoord += vec3(time * LAVA_FLOW_SPEED, 0.0, time * LAVA_FLOW_SPEED * 0.7);
    flowCoord = seedOffset3D(flowCoord, seed);
    
    float flow = fbmWarped3D(flowCoord, 4, 0.5);
    
    // Add pulsing
    float pulse = sin(time * LAVA_PULSE_SPEED + seed * 10.0) * LAVA_PULSE_STRENGTH;
    flow += pulse;
    
    return flow * 0.5 + 0.5;
}

/**
 * Generate crack pattern
 */
float crackPattern(vec3 pos, float seed) {
    vec3 crackCoord = pos * CRACK_SCALE;
    crackCoord = seedOffset3D(crackCoord, seed);
    
    // Use absolute value of noise for vein-like cracks
    float cracks = abs(snoise3D(crackCoord));
    cracks = 1.0 - smoothstep(0.0, CRACK_WIDTH, cracks);
    
    // Add smaller secondary cracks
    float smallCracks = abs(snoise3D(crackCoord * 2.5));
    smallCracks = 1.0 - smoothstep(0.0, CRACK_WIDTH * 0.7, smallCracks);
    
    return max(cracks, smallCracks * 0.6);
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
    float hueShift = seedHueShift(uSeed) * 0.3;  // Subtle color variation
    
    // === TEMPERATURE FACTOR ===
    float tempFactor = smoothstep(TEMP_LAVA_MIN, TEMP_LAVA_FULL, uTemperature);
    float whiteHotFactor = smoothstep(TEMP_LAVA_FULL, TEMP_WHITE_HOT, uTemperature);
    
    // === TERRAIN/CRUST ===
    vec3 crustCoord = spherePos * CRUST_SCALE * scales.x;
    crustCoord = seedOffset3D(crustCoord, uSeed);
    
    int octaves = uDetailLevel > 0.5 ? CRUST_OCTAVES : 3;
    float terrain = fbm3D(crustCoord, octaves);
    terrain = terrain * 0.5 + 0.5;
    
    // Add volcanic features using 3D position
    vec3 p = rotateVectorBySeed(spherePos, uSeed);
    float longitude = atan(p.x, p.z) / TAU + 0.5;
    float latitude = p.y * 0.5 + 0.5;
    
    for (int i = 0; i < VOLCANO_COUNT; i++) {
        if (!seedHasCommonFeature(uSeed, float(i))) continue;
        
        vec2 volcanoPos = seedStormPosition(uSeed, float(i));
        vec2 coordForVolcano = vec2(longitude, latitude);
        vec2 delta = coordForVolcano - volcanoPos;
        if (delta.x > 0.5) delta.x -= 1.0;
        if (delta.x < -0.5) delta.x += 1.0;
        
        float volcDist = length(delta);
        float volcHeight = (1.0 - smoothstep(0.0, 0.15, volcDist)) * VOLCANO_HEIGHT;
        terrain += volcHeight;
    }
    
    terrain = clamp(terrain, 0.0, 1.0);
    
    // === LAVA LAKES ===
    float lavaLevel = LAVA_THRESHOLD + (1.0 - tempFactor) * 0.2;  // More lava when hotter
    bool isLava = terrain < lavaLevel;
    float lavaDepth = isLava ? 1.0 - (terrain / lavaLevel) : 0.0;
    
    // Lava flow animation
    float lavaFlow = lavaPattern(spherePos, wrappedTime, uSeed);
    
    // === CRACKS IN CRUST ===
    float cracks = 0.0;
    if (uDetailLevel > 0.5) {
        cracks = crackPattern(spherePos, uSeed);
        cracks *= (1.0 - lavaDepth);  // No cracks in lava lakes
        cracks *= tempFactor;  // More visible when hotter
    }
    
    // === COLOR CALCULATION ===
    vec3 surfaceColor;
    
    if (isLava) {
        // Lava color gradient based on depth and flow
        float lavaTemp = lavaDepth * 0.7 + lavaFlow * 0.3;
        lavaTemp = clamp(lavaTemp, 0.0, 1.0);
        
        // Three-way gradient: cool edge -> warm -> hot center
        vec3 lavaColor;
        if (lavaTemp < 0.5) {
            lavaColor = mix(LAVA_COLOR_COOL, LAVA_COLOR_WARM, lavaTemp * 2.0);
        } else {
            lavaColor = mix(LAVA_COLOR_WARM, LAVA_COLOR_HOT, (lavaTemp - 0.5) * 2.0);
        }
        
        // White-hot effect
        lavaColor = mix(lavaColor, vec3(1.0, 1.0, 0.9), whiteHotFactor * lavaTemp);
        
        surfaceColor = lavaColor;
    } else {
        // Crust color varies with height
        float crustHeight = (terrain - lavaLevel) / (1.0 - lavaLevel);
        surfaceColor = mix(CRUST_COLOR_LIGHT, CRUST_COLOR_DARK, crustHeight);
        
        // Add height-based detail
        float crustDetail = vnoise3D(spherePos * 20.0 + vec3(phaseOffset));
        surfaceColor *= 0.9 + crustDetail * 0.2;
    }
    
    // === GLOWING CRACKS ===
    if (cracks > 0.0) {
        // Crack glow color
        vec3 crackGlow = mix(LAVA_COLOR_WARM, LAVA_COLOR_HOT, cracks);
        crackGlow *= CRACK_GLOW_INTENSITY;
        
        // Blend cracks into surface
        float crackBlend = cracks * pow(tempFactor, 0.5);
        surfaceColor = mix(surfaceColor, crackGlow, crackBlend);
    }
    
    // Apply base color influence
    vec3 baseHSV = rgb2hsv(uBaseColor);
    vec3 surfaceHSV = rgb2hsv(surfaceColor);
    surfaceHSV.x = fract(surfaceHSV.x + hueShift);
    surfaceColor = hsv2rgb(surfaceHSV);
    
    // === LIGHTING ===
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = diffuseLambert(vNormal, lightDir);
    
    // Self-illumination for lava
    float emission = 0.0;
    if (isLava) {
        emission = lavaDepth * EMISSION_STRENGTH * tempFactor;
    }
    emission += cracks * CRACK_GLOW_INTENSITY * tempFactor;
    emission += AMBIENT_GLOW * tempFactor;  // Overall heat glow
    
    // Combine reflected and emitted light
    vec3 litColor = surfaceColor * (diff * 0.3 + 0.1);  // Dim reflected
    litColor += surfaceColor * emission;  // Strong emission
    
    // === EDGE HEAT GLOW ===
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float edgeGlow = pow(edgeFactor, LIMB_GLOW_POWER) * HEAT_GLOW_INTENSITY * tempFactor;
    
    vec3 edgeColor = mix(LAVA_COLOR_WARM, LAVA_COLOR_COOL, LIMB_GLOW_COLOR_SHIFT);
    litColor += edgeColor * edgeGlow;
    
    // === STAR TINT ===
    // Less star tint for self-luminous lava worlds
    vec3 starTint = starLightTint(uStarTemp);
    litColor *= mix(vec3(1.0), starTint, 0.3);
    
    gl_FragColor = vec4(litColor, 1.0);
}

