/**
 * Icy World Fragment Shader
 * Frozen rocky worlds with ice sheets, cryovolcanism, and subsurface oceans
 * Think Europa, Enceladus, or cold super-Earths like TRAPPIST-1 f
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uTemperature;      // Surface temp (typically < 250K)
uniform float uHasAtmosphere;
uniform float uSeed;
uniform float uDensity;
uniform float uInsolation;       // Low for distant frozen worlds
uniform float uStarTemp;         // Star color affects ice tint
uniform float uDetailLevel;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// CONSTANTS
// =============================================================================

const float PI = 3.14159265359;
const float MOD_DIVISOR = 289.0;

// Ice color palette - whiter and bluer for frozen emphasis
const vec3 ICE_WHITE = vec3(0.98, 0.99, 1.0);         // Brilliant white ice
const vec3 ICE_BLUE = vec3(0.8, 0.92, 1.0);           // Pale blue ice
const vec3 ICE_DEEP = vec3(0.5, 0.7, 0.9);            // Deep glacial blue
const vec3 ICE_CYAN = vec3(0.7, 0.95, 1.0);           // Bright cyan ice
const vec3 ICE_SHADOW = vec3(0.4, 0.55, 0.75);        // Blue-tinted shadows

// Cold glow color
const vec3 COLD_GLOW = vec3(0.6, 0.85, 1.0);          // Ethereal cold blue glow

// Subsurface/geological features
const vec3 OCEAN_GLOW = vec3(0.3, 0.6, 0.85);         // Brighter subsurface glow
const vec3 CRYO_PLUME = vec3(0.95, 0.98, 1.0);        // Bright white plume
const vec3 MINERAL_TINT = vec3(0.7, 0.75, 0.85);      // Muted blue-grey minerals

// Rocky patches (less prominent)
const vec3 ROCK_DARK = vec3(0.2, 0.22, 0.28);         // Blue-tinted dark rock
const vec3 ROCK_FROST = vec3(0.5, 0.55, 0.65);        // Heavily frosted rock

// Star temperature ranges
const float STAR_M_DWARF = 3200.0;
const float STAR_K_TYPE = 4500.0;
const float STAR_G_TYPE = 5778.0;
const float STAR_A_TYPE = 8500.0;

// Animation
const float SHIMMER_SPEED = 0.02;
const float CRACK_SHIFT_SPEED = 0.005;  // Very slow tectonic movement

const vec3 VIEW_DIR = vec3(0.0, 0.0, 1.0);

// =============================================================================
// Noise Functions
// =============================================================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m * m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Ridged FBM for cracks
float ridgedFBM(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        float n = 1.0 - abs(snoise(p));
        n = n * n; // Sharpen ridges
        value += amplitude * n;
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Voronoi for ice plates/polygons
vec2 voronoi(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float minDist = 1.0;
    float secondDist = 1.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = vec2(
                fract(sin(dot(i + neighbor, vec2(127.1, 311.7))) * 43758.5453),
                fract(sin(dot(i + neighbor, vec2(269.5, 183.3))) * 43758.5453)
            );
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            if (dist < minDist) {
                secondDist = minDist;
                minDist = dist;
            } else if (dist < secondDist) {
                secondDist = dist;
            }
        }
    }
    return vec2(minDist, secondDist);
}

// =============================================================================
// Star Light Color
// =============================================================================

vec3 getStarLightColor(float temp) {
    vec3 mDwarfLight = vec3(1.0, 0.65, 0.5);     // Red-orange (TRAPPIST-1 type)
    vec3 kTypeLight = vec3(1.0, 0.85, 0.7);      // Orange-yellow
    vec3 gTypeLight = vec3(1.0, 0.98, 0.95);     // Warm white
    vec3 aTypeLight = vec3(0.9, 0.95, 1.0);      // Blue-white

    if (temp < STAR_K_TYPE) {
        return mix(mDwarfLight, kTypeLight, smoothstep(STAR_M_DWARF, STAR_K_TYPE, temp));
    } else if (temp < STAR_G_TYPE) {
        return mix(kTypeLight, gTypeLight, smoothstep(STAR_K_TYPE, STAR_G_TYPE, temp));
    } else {
        return mix(gTypeLight, aTypeLight, smoothstep(STAR_G_TYPE, STAR_A_TYPE, temp));
    }
}

// =============================================================================
// Main Shader
// =============================================================================

void main() {
    vec2 uv = vUv;
    float time = uTime;
    float seed = uSeed;
    vec2 seedOffset = vec2(seed * 10.0, seed * 7.0);

    // Star properties
    vec3 starLight = getStarLightColor(uStarTemp);
    float starIntensity = 0.6 + uInsolation * 0.5;

    // Temperature factor (colder = more frozen features)
    float coldFactor = clamp((250.0 - uTemperature) / 150.0, 0.0, 1.0);

    // ==========================================================
    // ICE PLATE STRUCTURE (Voronoi polygons like Europa)
    // ==========================================================
    float plateScale = 4.0 + seed * 3.0;
    vec2 plates = voronoi(uv * plateScale + seedOffset);

    // Plate edges (cracks between ice sheets)
    float crackWidth = 0.06 + (1.0 - uDensity) * 0.04;
    float cracks = smoothstep(crackWidth, crackWidth * 0.3, plates.y - plates.x);

    // ==========================================================
    // LINEAE - Linear cracks (Europa's famous features)
    // ==========================================================
    float lineae = 0.0;
    if (uDetailLevel > 0.5) {
        // Multiple crack directions
        vec2 crackUV = uv * 12.0 + seedOffset;

        // Slow tectonic shift
        float shift = time * CRACK_SHIFT_SPEED;

        // Primary lineae (roughly east-west)
        float line1 = ridgedFBM(crackUV * vec2(1.0, 3.0) + vec2(shift, 0.0), 3);

        // Secondary lineae (diagonal)
        vec2 rotUV = vec2(crackUV.x * 0.7 + crackUV.y * 0.7, crackUV.y * 0.7 - crackUV.x * 0.7);
        float line2 = ridgedFBM(rotUV * vec2(1.0, 2.5) - vec2(0.0, shift * 0.7), 3);

        // Combine
        lineae = max(line1, line2 * 0.8);
        lineae = smoothstep(0.5, 0.8, lineae);
    }

    // Combined crack pattern
    float allCracks = max(cracks, lineae * 0.7);

    // ==========================================================
    // ICE SURFACE TEXTURE
    // ==========================================================

    // Large-scale ice variation
    float iceVariation = fbm(uv * 8.0 + seedOffset, 4) * 0.5 + 0.5;

    // Fine frost texture
    float frost = 0.0;
    if (uDetailLevel > 0.5) {
        frost = fbm(uv * 40.0 + seedOffset * 2.0, 3) * 0.5 + 0.5;
    }

    // ==========================================================
    // ICE COLOR MIXING (favoring white and blue)
    // ==========================================================

    // Base ice color - predominantly white with blue variation
    vec3 iceColor = mix(ICE_BLUE, ICE_WHITE, iceVariation * 0.7 + 0.3);

    // Add cyan tint in some areas (more prominent)
    float cyanPatch = smoothstep(0.3, 0.6, fbm(uv * 5.0 + seed * 3.0, 3) * 0.5 + 0.5);
    iceColor = mix(iceColor, ICE_CYAN, cyanPatch * 0.4);

    // Fine frost brightens surface significantly
    iceColor = mix(iceColor, ICE_WHITE, frost * 0.35);

    // ==========================================================
    // CRACKS AND CREVASSES
    // ==========================================================

    // Deep blue in cracks
    vec3 crackColor = ICE_DEEP;

    // Subsurface ocean glow in cracks (internal heating)
    float internalHeat = (1.0 - coldFactor) * 0.5 + uDensity * 0.3; // Denser = more radiogenic heating
    crackColor = mix(crackColor, OCEAN_GLOW, internalHeat * 0.4);

    // Mineral deposits along crack edges (salts, like Europa's brown lineae)
    float mineralDeposit = smoothstep(0.3, 0.5, allCracks) * smoothstep(0.7, 0.5, allCracks);
    crackColor = mix(crackColor, MINERAL_TINT, mineralDeposit * 0.4 * seed);

    // Blend cracks into ice
    vec3 surfaceColor = mix(iceColor, crackColor, allCracks);

    // ==========================================================
    // POLAR CAPS / LATITUDE VARIATION
    // ==========================================================
    float latitude = abs(uv.y - 0.5) * 2.0;

    // Poles are extra frozen with thicker ice
    float polarIce = smoothstep(0.6, 0.9, latitude);
    surfaceColor = mix(surfaceColor, ICE_WHITE * 0.95, polarIce * 0.4);

    // Equatorial regions might show hints of rock (very subtle)
    float equatorial = 1.0 - smoothstep(0.0, 0.2, latitude);
    if (coldFactor < 0.6) {
        // Only warmest icy worlds show rock, and barely
        float rockShow = equatorial * (1.0 - coldFactor) * 0.15;
        float rockNoise = fbm(uv * 20.0 + seedOffset, 3) * 0.5 + 0.5;
        vec3 rockColor = mix(ROCK_DARK, ROCK_FROST, rockNoise);
        surfaceColor = mix(surfaceColor, rockColor, rockShow * smoothstep(0.5, 0.7, rockNoise));
    }

    // ==========================================================
    // CRYOVOLCANISM (ice geysers)
    // ==========================================================
    if (uDetailLevel > 0.5 && internalHeat > 0.3) {
        // Geyser locations based on cracks
        float geyserChance = allCracks * internalHeat;

        // Animated plume
        float plumeNoise = snoise(uv * 30.0 + vec2(0.0, time * 0.1) + seedOffset);
        float plume = smoothstep(0.7, 0.9, geyserChance) * smoothstep(0.3, 0.7, plumeNoise);

        surfaceColor = mix(surfaceColor, CRYO_PLUME, plume * 0.5);
    }

    // ==========================================================
    // LIGHTING
    // ==========================================================

    // Apply star light color (reduced influence to keep ice blue/white)
    vec3 tintedLight = mix(vec3(1.0), starLight, 0.4); // Less star tint
    surfaceColor *= tintedLight * (starIntensity + 0.2); // Brighter base

    // Ice is highly reflective - strong specular-like highlights
    float fresnel = pow(1.0 - abs(dot(vNormal, VIEW_DIR)), 2.5);
    surfaceColor += ICE_WHITE * fresnel * 0.25 * starIntensity;

    // Limb darkening (softer for icy glow effect)
    float limb = dot(vNormal, VIEW_DIR);
    limb = smoothstep(-0.3, 0.7, limb);
    surfaceColor *= 0.5 + limb * 0.5;

    // ==========================================================
    // COLD GLOW EFFECT (always-on ethereal blue rim)
    // ==========================================================
    float edge = 1.0 - abs(dot(vNormal, VIEW_DIR));

    // Inner cold glow - subtle blue tint across surface
    float innerGlow = pow(edge, 1.5) * 0.15;
    surfaceColor += COLD_GLOW * innerGlow;

    // Outer cold glow - stronger blue rim light
    float outerGlow = pow(edge, 3.0) * 0.4;
    surfaceColor += COLD_GLOW * outerGlow * (0.7 + coldFactor * 0.3);

    // Atmospheric haze on top (if present)
    if (uHasAtmosphere > 0.2) {
        float haze = pow(edge, 4.0) * uHasAtmosphere * 0.25;
        surfaceColor += ICE_CYAN * haze;
    }

    // ==========================================================
    // ICE SHIMMER (subtle sparkle from ice crystals)
    // ==========================================================
    if (uDetailLevel > 0.5) {
        float shimmer = snoise(uv * 100.0 + time * SHIMMER_SPEED);
        shimmer = smoothstep(0.7, 1.0, shimmer) * 0.15;
        surfaceColor += ICE_WHITE * shimmer * starIntensity;
    }

    // Boost overall brightness for that frozen gleam
    surfaceColor *= 1.1;

    gl_FragColor = vec4(clamp(surfaceColor, 0.0, 1.3), 1.0);
}
