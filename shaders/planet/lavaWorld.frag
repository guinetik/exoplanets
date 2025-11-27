/**
 * Lava World Fragment Shader
 * Molten hellscapes with flowing magma rivers and volcanic rock
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uTemperature;
uniform float uHasAtmosphere;
uniform float uSeed;
uniform float uDensity;
uniform float uInsolation;
uniform float uStarTemp;
uniform float uDetailLevel;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// CONSTANTS
// =============================================================================

const float MOD_DIVISOR = 289.0;

// Magma colors - vibrant lava palette
const vec3 MAGMA_WHITE = vec3(1.0, 0.95, 0.7);    // White-hot core
const vec3 MAGMA_YELLOW = vec3(1.0, 0.8, 0.2);    // Yellow-hot
const vec3 MAGMA_ORANGE = vec3(1.0, 0.45, 0.1);   // Bright orange
const vec3 MAGMA_RED = vec3(0.9, 0.15, 0.05);     // Deep red edges

// Crust colors - volcanic basalt
const vec3 ROCK_BLACK = vec3(0.02, 0.02, 0.02);   // Obsidian black
const vec3 ROCK_CHARCOAL = vec3(0.08, 0.07, 0.06);
const vec3 ROCK_WARM = vec3(0.18, 0.08, 0.04);    // Warm near lava
const vec3 ROCK_HIGHLIGHT = vec3(0.12, 0.1, 0.08); // Edge highlights

// Animation speeds
const float FLOW_SPEED = 0.08;          // Main lava flow
const float TURBULENCE_SPEED = 0.15;    // Turbulent motion
const float PULSE_SPEED = 0.5;          // Glow pulsing

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

// FBM with ridged noise option
float fbm(vec2 p, int octaves, bool ridged) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        float n = snoise(p * frequency);
        if (ridged) n = 1.0 - abs(n); // Ridged noise for cracks
        value += amplitude * n;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Voronoi for tectonic plates
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
// Main Shader
// =============================================================================

void main() {
    vec2 uv = vUv + vec2(uSeed * 10.0, uSeed * 7.0);
    float time = uTime;

    // Temperature affects overall activity
    float tempFactor = clamp((uTemperature - 800.0) / 2200.0, 0.0, 1.0);
    float activity = 0.6 + tempFactor * 0.4 + uInsolation * 0.2;

    // ==========================================================
    // TECTONIC PLATES (Voronoi-based)
    // ==========================================================
    float plateScale = 3.0 + uSeed * 2.0;
    vec2 plates = voronoi(uv * plateScale);

    // Edge detection - where plates meet (lava rivers)
    float plateEdge = smoothstep(0.0, 0.15, plates.y - plates.x);
    float crackWidth = 0.08 + (1.0 - uDensity) * 0.08; // Lower density = wider cracks
    float lavaMask = 1.0 - smoothstep(0.0, crackWidth, plates.y - plates.x);

    // ==========================================================
    // FLOWING LAVA - Animated rivers between plates
    // ==========================================================

    // Main flow direction along cracks
    vec2 flowUV = uv * 6.0;
    float flowTime = time * FLOW_SPEED;

    // Multi-layer flow for realistic movement
    float flow1 = snoise(flowUV + vec2(flowTime, flowTime * 0.7));
    float flow2 = snoise(flowUV * 1.5 + vec2(-flowTime * 0.8, flowTime * 0.5));
    float flow3 = snoise(flowUV * 2.5 + vec2(flowTime * 0.6, -flowTime * 0.9));

    // Combine flows with turbulence
    float turbulence = (flow1 * 0.5 + flow2 * 0.3 + flow3 * 0.2);
    float flowIntensity = turbulence * 0.5 + 0.5;

    // Animated heat spots (convection cells)
    float convection = snoise(uv * 4.0 + vec2(time * TURBULENCE_SPEED, 0.0));
    convection += snoise(uv * 8.0 - vec2(0.0, time * TURBULENCE_SPEED * 0.7)) * 0.5;
    convection = convection * 0.5 + 0.5;

    // Pulse effect
    float pulse = sin(time * PULSE_SPEED + uSeed * 6.28) * 0.1 + 1.0;
    pulse += sin(time * PULSE_SPEED * 1.7 + flow1 * 3.0) * 0.05;

    // ==========================================================
    // LAVA COLOR - Temperature-based gradient
    // ==========================================================
    float lavaHeat = flowIntensity * activity * pulse;
    lavaHeat += convection * 0.3; // Hot spots from convection
    lavaHeat = clamp(lavaHeat, 0.0, 1.0);

    vec3 lavaColor;
    if (lavaHeat > 0.85) {
        lavaColor = mix(MAGMA_YELLOW, MAGMA_WHITE, (lavaHeat - 0.85) / 0.15);
    } else if (lavaHeat > 0.6) {
        lavaColor = mix(MAGMA_ORANGE, MAGMA_YELLOW, (lavaHeat - 0.6) / 0.25);
    } else if (lavaHeat > 0.3) {
        lavaColor = mix(MAGMA_RED, MAGMA_ORANGE, (lavaHeat - 0.3) / 0.3);
    } else {
        lavaColor = MAGMA_RED * (0.5 + lavaHeat);
    }

    // Boost brightness for hotter worlds
    lavaColor *= 1.0 + tempFactor * 0.3;

    // ==========================================================
    // VOLCANIC ROCK TEXTURE
    // ==========================================================

    // Base rock noise - multiple scales for detail
    float rockNoise1 = fbm(uv * 15.0 + uSeed, 4, false) * 0.5 + 0.5;
    float rockNoise2 = fbm(uv * 40.0 + uSeed * 2.0, 3, false) * 0.5 + 0.5;
    float rockDetail = rockNoise1 * 0.7 + rockNoise2 * 0.3;

    // Ridged noise for surface cracks on the rock itself
    float rockCracks = fbm(uv * 25.0 + uSeed * 3.0, 3, true);
    rockCracks = smoothstep(0.3, 0.7, rockCracks);

    // Combine into rock color
    vec3 rockColor = mix(ROCK_BLACK, ROCK_CHARCOAL, rockDetail);

    // Add subtle highlights on ridges
    rockColor = mix(rockColor, ROCK_HIGHLIGHT, rockCracks * 0.3);

    // Warm the rock near lava (subsurface glow)
    float nearLava = smoothstep(crackWidth + 0.15, crackWidth, plates.y - plates.x);
    rockColor = mix(rockColor, ROCK_WARM, nearLava * 0.7);

    // Add subtle glow bleeding through thin crust
    float subsurfaceGlow = smoothstep(crackWidth + 0.25, crackWidth, plates.y - plates.x);
    rockColor += MAGMA_RED * subsurfaceGlow * 0.15 * activity;

    // ==========================================================
    // COMBINE ROCK AND LAVA
    // ==========================================================

    // Smooth transition at edges
    float lavaBlend = smoothstep(0.0, 0.3, lavaMask);
    vec3 surfaceColor = mix(rockColor, lavaColor, lavaBlend);

    // Add bright emission from lava
    float emission = lavaBlend * activity * pulse;
    surfaceColor += lavaColor * emission * 0.4;

    // ==========================================================
    // LIGHTING & ATMOSPHERE
    // ==========================================================

    // Limb darkening (less on bright lava)
    float limb = dot(vNormal, VIEW_DIR);
    limb = smoothstep(-0.1, 0.7, limb);
    float limbDark = mix(0.4, 1.0, limb);
    limbDark = mix(limbDark, 1.0, emission * 0.6); // Lava glows through
    surfaceColor *= limbDark;

    // Heat haze at edges
    if (uDetailLevel > 0.5) {
        float edge = 1.0 - abs(dot(vNormal, VIEW_DIR));
        float haze = pow(edge, 2.5) * 0.5 * activity;
        surfaceColor += vec3(1.0, 0.4, 0.1) * haze;
    }

    // Star tint (subtle - planet glows on its own)
    vec3 starTint = vec3(1.0);
    if (uStarTemp < 5778.0) {
        starTint = mix(vec3(1.0, 0.7, 0.5), vec3(1.0), smoothstep(3500.0, 5778.0, uStarTemp));
    }
    surfaceColor = mix(surfaceColor, surfaceColor * starTint, 0.15);

    gl_FragColor = vec4(clamp(surfaceColor, 0.0, 1.5), 1.0);
}
