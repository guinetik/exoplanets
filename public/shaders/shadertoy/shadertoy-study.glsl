/**
 * Exoplanet Shader Showcase for Shadertoy
 * ========================================
 * A procedural solar system with a realistic star and three different planet types
 *
 * Scene:
 * - Central star with boiling plasma surface, corona flames, and rays
 * - Rocky planet (inner orbit) - Earth/Mars-like with terrain
 * - Gas giant (middle orbit) - Jupiter-like with bands and storms
 * - Ice giant (outer orbit) - Neptune-like with soft atmosphere
 *
 * Controls:
 * - Mouse X: Orbit camera horizontally (full 360°)
 * - Mouse Y: Orbit camera vertically (pitch up/down)
 * - Click anywhere: Change star temperature (cycles through spectral types)
 * - No interaction: Camera gently auto-orbits
 *
 * Star temperatures cycle through: Y-dwarf (purple) -> M (red) -> K (orange) ->
 *                                   G (yellow) -> F (white) -> A (blue-white) -> O (blue)
 *
 * Created from the Exoplanets visualization project
 * https://github.com/guinetik/exoplanets
 */

// =============================================================================
// CONFIGURATION - Adjust these to customize the scene
// =============================================================================

// 3D positions - Star at center, planets orbiting
#define STAR_CENTER vec3(0.0, 0.0, 0.0)
#define STAR_RADIUS 1.0
#define CORONA_RADIUS 1.5              // Corona extends to 1.5x star radius
#define RAY_LENGTH 0.8                 // How far rays extend beyond star

// Rocky planet (closest to star - like Mercury/Venus/Earth)
#define ROCKY_CENTER vec3(2.5, 0.0, 0.0)
#define ROCKY_RADIUS 0.3

// Gas giant (middle distance - like Jupiter/Saturn)
#define GAS_CENTER vec3(0.0, 0.0, 4.0)
#define GAS_RADIUS 0.7

// Ice giant (farthest - like Uranus/Neptune)
#define ICE_CENTER vec3(-3.5, 0.5, -2.0)
#define ICE_RADIUS 0.5

// Camera settings
#define CAMERA_DISTANCE 8.0
#define CAMERA_FOV 1.8

// Planet base colors - vivid and distinct
#define ROCKY_COLOR vec3(0.3, 0.5, 0.8)
#define GAS_GIANT_COLOR vec3(0.95, 0.6, 0.3)
#define ICE_GIANT_COLOR vec3(0.2, 0.5, 0.95)

// =============================================================================
// SHADER CONSTANTS
// =============================================================================

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float MOD_DIVISOR = 289.0;

// Star surface constants (from v2 shaders)
const float PLASMA_SCALE = 3.0;
const float PLASMA_SPEED = 0.12;
const float FLAME_SCALE_COARSE = 15.0;
const float FLAME_SCALE_FINE = 45.0;
const float FLAME_FLOW_SPEED = 0.35;
const int FLAME_OCTAVES = 5;

// Corona constants
const float CORONA_FLAME_INTENSITY = 2.0;
const int NUM_PROMINENCES = 5;
const float PROMINENCE_BRIGHTNESS = 3.0;

// Star rays constants
const int NUM_MAIN_RAYS = 6;
const int NUM_SECONDARY_RAYS = 8;
const float RAY_INTENSITY = 1.2;
const float RAY_FADE_POWER = 3.0;

// Planet constants
const float BAND_FREQ_BASE = 10.0;
const float TURBULENCE_STRENGTH = 0.15;
const float STORM_SIZE = 0.06;

// =============================================================================
// TEMPERATURE TO COLOR - Full spectral range including brown dwarfs
// =============================================================================

// Brown dwarfs (substellar objects) - non-blackbody due to methane absorption
const vec3 TEMP_300K = vec3(0.35, 0.2, 0.45);      // Dark purple (Y-dwarf, ultra-cool)
const vec3 TEMP_500K = vec3(0.5, 0.25, 0.55);      // Purple (Y-dwarf)
const vec3 TEMP_800K = vec3(0.6, 0.27, 0.65);      // Magenta-purple (T-dwarf, methane)
const vec3 TEMP_1300K = vec3(0.8, 0.3, 0.35);      // Deep red-magenta (L-dwarf boundary)

// Main sequence stars
const vec3 TEMP_2000K = vec3(1.0, 0.35, 0.1);      // Deep red (late L-dwarf/early M)
const vec3 TEMP_3000K = vec3(1.0, 0.65, 0.35);     // Orange-red (M-dwarf)
const vec3 TEMP_4000K = vec3(1.0, 0.78, 0.55);     // Orange (K-dwarf)
const vec3 TEMP_5778K = vec3(1.0, 0.96, 0.91);     // Yellow-white (Sun, G-type)
const vec3 TEMP_7500K = vec3(0.92, 0.93, 1.0);     // White (F-type)
const vec3 TEMP_10000K = vec3(0.80, 0.85, 1.0);    // Blue-white (A-type)
const vec3 TEMP_20000K = vec3(0.70, 0.78, 1.0);    // Blue (B-type)
const vec3 TEMP_40000K = vec3(0.62, 0.72, 1.0);    // Deep blue (O-type)

/**
 * Convert temperature (Kelvin) to RGB color
 * Full range from Y-dwarfs (300K) to O-stars (40000K)
 */
vec3 temperatureToColor(float tempK) {
    tempK = clamp(tempK, 300.0, 40000.0);

    // Brown dwarf range (Y, T, L types) - purple/magenta colors
    if (tempK < 500.0) {
        float t = (tempK - 300.0) / 200.0;
        return mix(TEMP_300K, TEMP_500K, t);
    } else if (tempK < 800.0) {
        float t = (tempK - 500.0) / 300.0;
        return mix(TEMP_500K, TEMP_800K, t);
    } else if (tempK < 1300.0) {
        float t = (tempK - 800.0) / 500.0;
        return mix(TEMP_800K, TEMP_1300K, t);
    } else if (tempK < 2000.0) {
        float t = (tempK - 1300.0) / 700.0;
        return mix(TEMP_1300K, TEMP_2000K, t);
    } else if (tempK < 3000.0) {
        float t = (tempK - 2000.0) / 1000.0;
        return mix(TEMP_2000K, TEMP_3000K, t);
    } else if (tempK < 4000.0) {
        float t = (tempK - 3000.0) / 1000.0;
        return mix(TEMP_3000K, TEMP_4000K, t);
    } else if (tempK < 5778.0) {
        float t = (tempK - 4000.0) / 1778.0;
        return mix(TEMP_4000K, TEMP_5778K, t);
    } else if (tempK < 7500.0) {
        float t = (tempK - 5778.0) / 1722.0;
        return mix(TEMP_5778K, TEMP_7500K, t);
    } else if (tempK < 10000.0) {
        float t = (tempK - 7500.0) / 2500.0;
        return mix(TEMP_7500K, TEMP_10000K, t);
    } else if (tempK < 20000.0) {
        float t = (tempK - 10000.0) / 10000.0;
        return mix(TEMP_10000K, TEMP_20000K, t);
    } else {
        float t = (tempK - 20000.0) / 20000.0;
        return mix(TEMP_20000K, TEMP_40000K, t);
    }
}

// =============================================================================
// NOISE FUNCTIONS
// =============================================================================

vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec4 mod289_4(vec4 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }

vec4 permute(vec4 x) { return mod289_4(((x * 34.0) + 1.0) * x); }
vec3 permute3(vec3 x) { return mod289_3(((x * 34.0) + 1.0) * x); }

vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float hash(float n) { return fract(sin(n) * 43758.5453123); }

float seedHash(float seed) {
    return fract(sin(seed * 127.1 + seed * seed * 0.013) * 43758.5453);
}

float wrapTime(float t) { return mod(t, 1000.0); }

// 3D Simplex Noise
float snoise3D(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289_3(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// 2D Simplex Noise
float snoise2D(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289_2(i);
    vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Tiled noise for seamless flame patterns
float tiledNoise3D(vec3 uv, float res) {
    uv *= res;
    vec3 uv0 = floor(mod(uv, res)) * vec3(1.0, 100.0, 10000.0);
    vec3 uv1 = floor(mod(uv + vec3(1.0), res)) * vec3(1.0, 100.0, 10000.0);
    vec3 f = fract(uv);
    f = f * f * (3.0 - 2.0 * f);

    vec4 v = vec4(uv0.x + uv0.y + uv0.z, uv1.x + uv0.y + uv0.z,
                  uv0.x + uv1.y + uv0.z, uv1.x + uv1.y + uv0.z);

    vec4 r = fract(sin(v * 0.001) * 100000.0);
    float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

    r = fract(sin((v + uv1.z - uv0.z) * 0.001) * 100000.0);
    float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

    return mix(r0, r1, f.z) * 2.0 - 1.0;
}

// FBM variants
float fbm3D(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise3D(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

float fbm2D(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * snoise2D(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Plasma noise with flowing distortion
float plasmaNoise(vec3 p, float time) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float totalAmp = 0.0;

    for (int i = 0; i < 5; i++) {
        vec3 offset = vec3(
            sin(time * 0.1 + float(i)) * 0.5,
            cos(time * 0.15 + float(i) * 0.7) * 0.5,
            time * 0.05
        );
        value += amplitude * snoise3D((p + offset) * frequency);
        totalAmp += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value / totalAmp;
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// =============================================================================
// OUTWARD TRAVELING WAVE (for star rays)
// =============================================================================

float outwardWave(float edgeDist, float time, float frequency, float speed) {
    float wave = fract(edgeDist * frequency - time * speed);
    wave = smoothstep(0.0, 0.3, wave) * smoothstep(1.0, 0.5, wave);
    return wave;
}

// =============================================================================
// STAR SURFACE SHADER - Boiling plasma with spherical distortion
// =============================================================================

vec3 renderStarSurface(vec3 spherePos, vec3 normal, vec3 rayDir, vec3 baseColor, float activityLevel, float seed) {
    float time = wrapTime(iTime);

    // Spherical coordinates
    float angle = atan(spherePos.y, spherePos.x);
    float elevation = acos(clamp(spherePos.z, -1.0, 1.0));

    // View angle (for limb darkening)
    float viewAngle = max(dot(normal, -rayDir), 0.0);
    float edgeDist = 1.0 - viewAngle;

    // === SPHERICAL DISTORTION (the key boiling effect) ===
    vec2 sp = spherePos.xy;
    float brightness = 0.25;
    float distortStrength = 2.0 - brightness;
    vec2 distortedSP = sp * distortStrength;
    float r = dot(distortedSP, distortedSP);
    float f = (1.0 - sqrt(abs(1.0 - r))) / (r + 0.001) + brightness * 0.5;

    vec2 warpedUV;
    warpedUV.x = distortedSP.x * f;
    warpedUV.y = distortedSP.y * f;
    warpedUV += vec2(time * 0.1, 0.0);

    // === PLASMA TEXTURE ===
    vec3 plasmaCoord = vec3(warpedUV * PLASMA_SCALE, time * PLASMA_SPEED);
    float plasma1 = plasmaNoise(plasmaCoord, time);
    vec3 plasma2Coord = vec3(warpedUV * PLASMA_SCALE * 1.3, time * PLASMA_SPEED * 0.8);
    float plasma2 = plasmaNoise(plasma2Coord + vec3(50.0, 50.0, 0.0), time * 1.2);
    float plasma = plasma1 * 0.6 + plasma2 * 0.4;
    plasma = plasma * 0.5 + 0.5;

    // Extra warping for more chaos
    float plasmaDistort = plasma * brightness * PI;
    vec2 extraWarp = warpedUV + vec2(plasmaDistort, 0.0);
    float plasma3 = plasmaNoise(vec3(extraWarp * PLASMA_SCALE * 0.8, time * PLASMA_SPEED * 1.5), time);
    plasma = mix(plasma, plasma3 * 0.5 + 0.5, 0.3);

    // === OUTWARD FLOWING FLAMES ===
    vec3 flameCoord = vec3(angle / TAU, elevation / PI, time * 0.1);

    float newTime1 = abs(tiledNoise3D(
        flameCoord + vec3(0.0, -time * FLAME_FLOW_SPEED, time * 0.08),
        FLAME_SCALE_COARSE
    ));
    float newTime2 = abs(tiledNoise3D(
        flameCoord + vec3(0.0, -time * FLAME_FLOW_SPEED * 0.5, time * 0.08),
        FLAME_SCALE_FINE
    ));

    float flameVal1 = 1.0 - edgeDist;
    float flameVal2 = 1.0 - edgeDist;

    for (int i = 1; i <= FLAME_OCTAVES; i++) {
        float power = pow(2.0, float(i + 1));
        float contribution = 0.5 / power;
        flameVal1 += contribution * tiledNoise3D(
            flameCoord + vec3(0.0, -time * 0.1, time * 0.2),
            power * 10.0 * (newTime1 + 1.0)
        );
        flameVal2 += contribution * tiledNoise3D(
            flameCoord + vec3(0.0, -time * 0.1, time * 0.2),
            power * 25.0 * (newTime2 + 1.0)
        );
    }

    float flames = (flameVal1 + flameVal2) * 0.5;
    flames = clamp(flames, 0.0, 1.0);

    // Edge flame boost
    float edgeBoost = pow(edgeDist, 0.5) * 2.5 * activityLevel;
    flames += edgeBoost * flames * 0.5;

    // === CONVECTION CELLS ===
    float cells = snoise3D(spherePos * 6.0 + vec3(0.0, time * 0.02, 0.0));
    cells = cells * 0.5 + 0.5 + snoise3D(spherePos * 6.0 + vec3(0.0, time * 0.04, 0.0)) * 0.2;

    // === SUNSPOTS ===
    float spotNoise = snoise3D(spherePos * 3.0 + vec3(0.0, time * 0.005, 0.0));
    float spotMask = smoothstep(0.55, 0.75, spotNoise);
    float spotDarkening = 1.0 - spotMask * 0.5;

    // === PULSATION ===
    float pulse1 = cos(time * 0.5 + seedHash(seed) * TAU);
    float pulse2 = sin(time * 0.25 + seedHash(seed + 1.0) * TAU);
    float pulse = (pulse1 * 0.6 + pulse2 * 0.4) * 0.3 * activityLevel;

    // === COMBINE INTENSITIES ===
    float totalIntensity = plasma * 0.5 + flames * 0.35 + cells * 0.3 * 0.15;
    totalIntensity *= spotDarkening;
    totalIntensity *= 1.0 + pulse * 0.5;
    totalIntensity = clamp(totalIntensity, 0.0, 1.5);

    // === COLOR ===
    vec3 hotColor = baseColor * vec3(1.5, 1.3, 1.2);
    hotColor = min(hotColor, vec3(1.8));
    vec3 coolColor = baseColor * vec3(0.7, 0.4, 0.3);
    vec3 warmColor = baseColor * vec3(1.2, 1.0, 0.85);

    vec3 surfaceColor;
    if (totalIntensity < 0.4) {
        surfaceColor = mix(coolColor, warmColor, totalIntensity / 0.4);
    } else if (totalIntensity < 0.7) {
        surfaceColor = mix(warmColor, hotColor, (totalIntensity - 0.4) / 0.3);
    } else {
        surfaceColor = hotColor * (1.0 + (totalIntensity - 0.7) * 1.8);
    }

    // Base glow
    surfaceColor *= 0.6 + brightness * 0.4;

    // === LIMB DARKENING ===
    float limbDark = pow(viewAngle, 0.4);
    surfaceColor *= 0.85 + limbDark * 0.15;

    // === EDGE GLOW ===
    float edgeGlow = pow(edgeDist, 0.3) * flames * 0.4 * activityLevel;
    surfaceColor += warmColor * edgeGlow;

    // Center boost
    surfaceColor += baseColor * pow(viewAngle, 1.5) * 0.3;

    return clamp(surfaceColor, 0.0, 2.5);
}

// =============================================================================
// CORONA FLAMES - 3D version
// =============================================================================

vec3 renderCorona3D(vec3 rayOrigin, vec3 rayDir, vec3 starCenter, float starRadius,
                    vec3 baseColor, float activityLevel, float seed) {
    float time = wrapTime(iTime);

    // Find closest point on ray to star center
    vec3 toStar = starCenter - rayOrigin;
    float t = max(dot(toStar, rayDir), 0.0);
    vec3 closestPoint = rayOrigin + rayDir * t;
    float dist = length(closestPoint - starCenter);

    // Don't render corona inside the star
    if (dist < starRadius) return vec3(0.0);

    // Normalized distance from star edge
    float normalizedDist = (dist - starRadius) / (CORONA_RADIUS * starRadius - starRadius);
    if (normalizedDist > 1.2) return vec3(0.0);
    normalizedDist = clamp(normalizedDist, 0.0, 1.2);

    // Direction from star center to closest point (for angular variation)
    vec3 dir = normalize(closestPoint - starCenter);
    float angle = atan(dir.y, dir.x);

    // === FLAME NOISE ===
    float flameTime = time * 0.3;
    vec3 flameCoord = vec3(angle * 3.0, normalizedDist * 2.0, flameTime * 2.0);
    float flameNoise = fbm3D(flameCoord, 3);
    flameNoise = flameNoise * 0.5 + 0.5;

    // Turbulence
    vec3 turbCoord = vec3(angle * 6.0 + time * 0.5, normalizedDist * 4.0, time * 0.25);
    float flameTurbulence = fbm3D(turbCoord, 4);

    // Flame intensity with falloff
    float flameIntensity = flameNoise * (0.5 + flameTurbulence * 0.5);
    flameIntensity *= smoothstep(0.0, 0.2, normalizedDist);  // Fade in from star edge
    flameIntensity *= smoothstep(1.2, 0.4, normalizedDist);  // Fade out toward edge
    flameIntensity *= activityLevel * 0.7 + 0.3;

    // === SOLAR PROMINENCES ===
    float prominenceTotal = 0.0;
    float flareTime = time * 0.4;

    for (int i = 0; i < NUM_PROMINENCES; i++) {
        float fi = float(i);
        float prominenceAngle = seedHash(seed + fi) * TAU;
        float prominencePhase = seedHash(seed + fi + 10.0) * TAU;

        float angleDiff = abs(mod(angle - prominenceAngle + PI, TAU) - PI);
        float spatialMask = exp(-angleDiff * angleDiff * 12.0);

        // Lifecycle
        float cycleSpeed = 0.5 + seedHash(seed + fi + 20.0) * 0.5;
        float lifecycle = sin(flareTime * cycleSpeed + prominencePhase);
        lifecycle = max(lifecycle, 0.0);
        lifecycle = pow(lifecycle, 0.7);

        float prominenceIntensity = spatialMask * lifecycle * normalizedDist;

        // Noise for organic shape
        float pNoise = snoise3D(vec3(angle * 8.0, normalizedDist * 5.0, time * 0.25 + fi));
        prominenceIntensity *= 0.7 + pNoise * 0.3;

        prominenceTotal += prominenceIntensity;
    }

    prominenceTotal *= PROMINENCE_BRIGHTNESS * activityLevel;

    // === COMBINE ===
    float totalIntensity = flameIntensity * CORONA_FLAME_INTENSITY + prominenceTotal;

    // === COLOR ===
    vec3 hotColor = baseColor * vec3(1.3, 1.1, 0.9) * 1.5 + vec3(0.2);
    vec3 coolColor = baseColor * vec3(1.2, 0.7, 0.4) * 1.5 + vec3(0.2);
    vec3 prominenceColor = baseColor * vec3(1.5, 1.0, 0.5) * 1.5;

    vec3 flameColor = mix(hotColor, coolColor, normalizedDist);
    flameColor = mix(flameColor, prominenceColor, min(prominenceTotal * 0.5, 1.0));
    flameColor *= totalIntensity;

    // Alpha falloff
    float alpha = totalIntensity * smoothstep(0.0, 0.15, normalizedDist);
    alpha = pow(alpha, 0.7);
    alpha = clamp(alpha, 0.0, 0.8);

    return flameColor * alpha;
}

// =============================================================================
// STAR RAYS - 3D version
// =============================================================================

vec3 renderStarRays3D(vec3 rayOrigin, vec3 rayDir, vec3 starCenter, float starRadius,
                      vec3 baseColor, float activityLevel, float seed) {
    float time = wrapTime(iTime);

    // Find closest point on ray to star center
    vec3 toStar = starCenter - rayOrigin;
    float t = max(dot(toStar, rayDir), 0.0);
    vec3 closestPoint = rayOrigin + rayDir * t;
    float dist = length(closestPoint - starCenter);

    // Distance from star edge
    float edgeDist = dist - starRadius;
    if (edgeDist < 0.0) return vec3(0.0);

    float normalizedDist = edgeDist / (RAY_LENGTH * starRadius);
    if (normalizedDist > 1.5) return vec3(0.0);

    // Fade with distance
    float distanceFade = exp(-normalizedDist * RAY_FADE_POWER);

    // Direction for angular variation
    vec3 dir = normalize(closestPoint - starCenter);
    float angle = atan(dir.y, dir.x);

    float rayTime = time * 0.4;
    float rays = 0.0;
    float baseSharpness = 6.0;

    // Main rays
    for (int i = 0; i < NUM_MAIN_RAYS; i++) {
        float fi = float(i);
        float rayAngle = seedHash(seed + fi * 0.13) * TAU;

        float angleDiff = angle - rayAngle;
        angleDiff = mod(angleDiff + PI, TAU) - PI;

        float angularFalloff = exp(-abs(angleDiff) * baseSharpness);

        float waveFreq = 3.0 + seedHash(seed + fi * 0.7) * 2.0;
        float waveSpeed = 0.8 + seedHash(seed + fi * 0.9) * 0.4;
        float wave = outwardWave(normalizedDist, rayTime, waveFreq, waveSpeed);
        float wave2 = outwardWave(normalizedDist, rayTime * 0.7, waveFreq * 1.5, waveSpeed * 0.8);

        float waveIntensity = 0.6 + wave * 0.3 + wave2 * 0.2;
        float rayBrightness = 0.6 + seedHash(seed + fi * 0.5) * 0.4;

        rays += angularFalloff * waveIntensity * rayBrightness;
    }

    // Secondary rays
    for (int i = 0; i < NUM_SECONDARY_RAYS; i++) {
        float fi = float(i);
        float rayAngle = seedHash(seed + fi * 0.19 + 5.0) * TAU;

        float angleDiff = angle - rayAngle;
        angleDiff = mod(angleDiff + PI, TAU) - PI;

        float angularFalloff = exp(-abs(angleDiff) * baseSharpness * 0.5) * 0.4;
        float wave = outwardWave(normalizedDist, rayTime * 0.9, 4.0, 0.6);
        float waveIntensity = 0.5 + wave * 0.3;

        rays += angularFalloff * waveIntensity * 0.5;
    }

    rays *= distanceFade;
    rays *= 0.6 + activityLevel * 0.4;

    // Color
    vec3 rayColor = mix(vec3(1.0, 0.98, 0.95), baseColor, clamp(normalizedDist * 0.8, 0.0, 1.0));
    rayColor *= rays * RAY_INTENSITY;

    // Alpha
    float alpha = rays * 0.7;
    alpha *= smoothstep(0.0, starRadius * 0.1, edgeDist);

    return rayColor * alpha;
}

// =============================================================================
// OUTER GLOW - Simple atmospheric haze
// =============================================================================

vec3 renderOuterGlow3D(vec3 rayOrigin, vec3 rayDir, vec3 starCenter, float starRadius, vec3 baseColor) {
    vec3 toStar = starCenter - rayOrigin;
    float t = max(dot(toStar, rayDir), 0.0);
    vec3 closestPoint = rayOrigin + rayDir * t;
    float dist = length(closestPoint - starCenter);

    if (dist < starRadius) return vec3(0.0);

    float glowDist = (dist - starRadius) / (starRadius * 2.0);
    float glow = exp(-glowDist * 2.0) * 0.4;

    return baseColor * vec3(1.1, 0.9, 0.7) * glow;
}

// =============================================================================
// ROCKY PLANET SHADER
// =============================================================================

vec3 renderRockyPlanet(vec2 uv, vec3 normal, vec3 baseColor, float seed, float temperature) {
    float time = iTime;
    vec2 terrainUv = uv + vec2(seed * 10.0, seed * 7.0);

    vec3 hsv = rgb2hsv(baseColor);
    hsv.x = fract(hsv.x + seed * 0.15);
    hsv.y = clamp(hsv.y * 1.3, 0.5, 1.0);
    hsv.z = clamp(hsv.z * 1.1, 0.4, 1.0);
    vec3 variedColor = hsv2rgb(hsv);

    float terrain = fbm2D(terrainUv * (3.0 + seed * 3.0));

    float iceFactor = smoothstep(250.0, 180.0, temperature);
    float volcanicFactor = smoothstep(400.0, 800.0, temperature);

    vec3 lowland = variedColor * 0.7;
    vec3 highland = variedColor * 1.2;
    vec3 peak = variedColor * 1.4;

    vec3 iceColor = vec3(0.8 + seed * 0.15, 0.85 + seed * 0.1, 0.9 + seed * 0.1);
    lowland = mix(lowland, iceColor * 0.6, iceFactor);
    highland = mix(highland, iceColor * 0.8, iceFactor);
    peak = mix(peak, iceColor, iceFactor);

    vec3 lavaColor = vec3(1.0, 0.2 + seed * 0.3, 0.05 + seed * 0.15);
    vec3 ashColor = vec3(0.15 + seed * 0.1, 0.1 + seed * 0.1, 0.05 + seed * 0.1);
    lowland = mix(lowland, lavaColor * 0.8, volcanicFactor * 0.5);
    highland = mix(highland, ashColor, volcanicFactor);

    vec3 surfaceColor = mix(lowland, highland, smoothstep(0.3, 0.6, terrain));
    surfaceColor = mix(surfaceColor, peak, smoothstep(0.7, 0.9, terrain));

    float craters = snoise2D(terrainUv * (25.0 + seed * 15.0));
    float craterMask = smoothstep(0.8, 0.7, craters) * (1.0 - min(iceFactor + volcanicFactor, 1.0));
    surfaceColor *= (1.0 - craterMask * 0.3);

    if (volcanicFactor > 0.0) {
        float cracks = snoise2D(terrainUv * (15.0 + seed * 10.0));
        float crackMask = smoothstep(0.7, 0.6, abs(cracks));
        surfaceColor = mix(surfaceColor, lavaColor * 1.2, crackMask * volcanicFactor * 0.6);
    }

    float detail = snoise2D(terrainUv * 40.0) * 0.05;
    surfaceColor += surfaceColor * detail;

    float limb = smoothstep(-0.2, 0.8, normal.z);
    surfaceColor *= 0.4 + limb * 0.6;

    return surfaceColor;
}

// =============================================================================
// GAS GIANT SHADER
// =============================================================================

vec3 renderGasGiant(vec2 uv, vec3 normal, vec3 baseColor, float seed) {
    float time = iTime;
    float latitude = uv.y;

    float bandFreq = BAND_FREQ_BASE + seed * 6.0;
    float bands = sin(latitude * PI * bandFreq) * 0.5 + 0.5;

    float turbulence = snoise2D(vec2(
        uv.x * 8.0 + time * 0.02 + seed * 10.0,
        latitude * 20.0
    )) * TURBULENCE_STRENGTH;
    bands += turbulence;

    float smallBands = sin(latitude * PI * bandFreq * 3.0 + seed * 5.0) * 0.5 + 0.5;
    bands = mix(bands, smallBands * 0.3, 0.3);

    vec2 stormCenter = vec2(fract(seed * 3.7), 0.4 + fract(seed * 2.3) * 0.3);
    float stormDist = length(uv - stormCenter);
    float stormSize = STORM_SIZE + fract(seed * 5.1) * 0.06;
    float storm = smoothstep(stormSize + 0.03, stormSize, stormDist);

    vec2 storm2Center = vec2(fract(seed * 7.1 + 0.5), 0.3 + fract(seed * 4.7) * 0.4);
    float storm2 = smoothstep(0.05, 0.01, length(uv - storm2Center)) * 0.6;

    vec3 hsv = rgb2hsv(baseColor);
    hsv.x = fract(hsv.x + (seed - 0.5) * 0.1);
    hsv.y = clamp(hsv.y * 1.4, 0.6, 1.0);
    hsv.z = clamp(hsv.z * 1.2, 0.5, 1.0);
    vec3 variedColor = hsv2rgb(hsv);

    vec3 lightBand = variedColor * 1.4;
    vec3 darkBand = variedColor * vec3(0.5, 0.4, 0.35);

    vec3 stormHsv = hsv;
    stormHsv.x = fract(stormHsv.x - 0.05);
    stormHsv.y = min(stormHsv.y * 1.3, 1.0);
    stormHsv.z *= 0.85;
    vec3 stormColor = hsv2rgb(stormHsv);

    vec3 surfaceColor = mix(darkBand, lightBand, bands);
    surfaceColor = mix(surfaceColor, stormColor, storm + storm2);

    float swirl = snoise2D(vec2(uv.x * 15.0 + time * 0.01, uv.y * 10.0 + seed * 20.0)) * 0.1;
    surfaceColor += surfaceColor * swirl;

    float limb = smoothstep(-0.2, 0.8, normal.z);
    surfaceColor *= 0.4 + limb * 0.6;

    return surfaceColor;
}

// =============================================================================
// ICE GIANT SHADER
// =============================================================================

vec3 renderIceGiant(vec2 uv, vec3 normal, vec3 baseColor, float seed) {
    float time = iTime;
    float latitude = uv.y;

    vec3 hsv = rgb2hsv(baseColor);
    hsv.x = fract(hsv.x + (seed - 0.5) * 0.05);
    hsv.y = clamp(hsv.y * 1.5, 0.7, 1.0);
    hsv.z = clamp(hsv.z * 1.15, 0.5, 1.0);
    vec3 variedColor = hsv2rgb(hsv);

    float bandFreq = 5.0 + seed * 4.0;
    float bandPattern = sin(latitude * PI * bandFreq + seed * 3.0) * 0.5 + 0.5;
    float bands = smoothstep(0.3, 0.7, bandPattern);

    float flow = snoise2D(vec2(
        uv.x * 4.0 + time * 0.015 + seed * 5.0,
        latitude * 8.0
    )) * 0.2;
    bands += flow;

    float haze = snoise2D(vec2(uv.x * 6.0 + time * 0.01, uv.y * 6.0 + seed * 10.0)) * 0.5 + 0.5;
    float hazeMask = smoothstep(0.4, 0.8, haze) * 0.3;

    vec3 deepColor = variedColor * 0.7;
    vec3 brightColor = variedColor * 1.2;
    vec3 hazeColor = vec3(0.8, 0.9, 1.0);

    vec3 atmosphereColor = mix(deepColor, brightColor, bands);

    float methane = snoise2D(vec2(uv.x * 3.0 + seed * 7.0, uv.y * 5.0 + time * 0.005)) * 0.5 + 0.5;
    vec3 methaneTint = vec3(0.7, 0.9, 1.1);
    atmosphereColor *= mix(vec3(1.0), methaneTint, methane * 0.3);

    atmosphereColor = mix(atmosphereColor, hazeColor * variedColor, hazeMask);

    vec2 spotCenter = vec2(0.3 + fract(seed * 4.3) * 0.4, 0.4 + fract(seed * 2.7) * 0.3);
    float spotDist = length(uv - spotCenter);
    float spotSize = 0.05 + fract(seed * 6.1) * 0.08;
    float spotMask = smoothstep(spotSize + 0.04, spotSize, spotDist);
    atmosphereColor *= (1.0 - spotMask * 0.4);

    float limb = smoothstep(-0.3, 0.7, normal.z);
    atmosphereColor *= 0.3 + limb * 0.7;

    float edgeGlow = 1.0 - abs(normal.z);
    edgeGlow = pow(edgeGlow, 3.0) * 0.2;
    atmosphereColor += variedColor * edgeGlow;

    return atmosphereColor;
}

// =============================================================================
// 3D RAY-SPHERE INTERSECTION
// =============================================================================

float intersectSphere3D(vec3 rayOrigin, vec3 rayDir, vec3 sphereCenter, float radius) {
    vec3 oc = rayOrigin - sphereCenter;
    float b = dot(oc, rayDir);
    float c = dot(oc, oc) - radius * radius;
    float h = b * b - c;

    if (h < 0.0) return -1.0;

    h = sqrt(h);
    float t = -b - h;

    if (t < 0.0) t = -b + h;
    if (t < 0.0) return -1.0;

    return t;
}

void getSphereInfo(vec3 hitPoint, vec3 sphereCenter, out vec3 normal, out vec2 sphereUv) {
    normal = normalize(hitPoint - sphereCenter);
    float latitude = 0.5 + asin(normal.y) / PI;
    float longitude = 0.5 + atan(normal.x, normal.z) / (2.0 * PI);
    sphereUv = vec2(longitude, latitude);
}

// =============================================================================
// CAMERA UTILITIES
// =============================================================================

mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotateX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

mat3 setCamera(vec3 ro, vec3 ta) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

// =============================================================================
// MAIN IMAGE
// =============================================================================

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    // =========================================================================
    // CAMERA SETUP - Mouse controls orbit
    // =========================================================================

    vec2 mouse;
    if (iMouse.z > 0.0) {
        mouse = iMouse.xy / iResolution.xy;
    } else {
        float lastY = (iMouse.xy == vec2(0.0)) ? 0.5 : iMouse.y / iResolution.y;
        mouse = vec2(fract(iTime * 0.03), lastY);
    }

    float angleY = (mouse.x - 0.5) * PI * 2.0;
    float angleX = (mouse.y - 0.5) * PI * 0.8;
    angleX = clamp(angleX, -PI * 0.4, PI * 0.4);

    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 cameraPos = vec3(0.0, 0.0, CAMERA_DISTANCE);

    cameraPos = rotateX(angleX) * cameraPos;
    cameraPos = rotateY(angleY) * cameraPos;

    mat3 cameraMat = setCamera(cameraPos, target);
    vec3 rayDir = cameraMat * normalize(vec3(uv, CAMERA_FOV));
    vec3 rayOrigin = cameraPos;

    // =========================================================================
    // STAR TEMPERATURE - Click to cycle through spectral types
    // =========================================================================

    // Use click count to cycle through temperatures
    // Temperature cycles: Y-dwarf (400K) -> M -> K -> G -> F -> A -> O (25000K)
    float tempIndex = mod(floor(iTime * 0.1), 8.0); // Auto-cycle slowly, or use mouse

    // If mouse has been clicked, use position to select temperature
    if (iMouse.z > 0.0 || iMouse.w > 0.0) {
        tempIndex = floor(mouse.x * 8.0);
    }

    float starTemperature;
    if (tempIndex < 1.0) {
        starTemperature = 400.0;   // Y-dwarf (purple)
    } else if (tempIndex < 2.0) {
        starTemperature = 800.0;   // T-dwarf (magenta)
    } else if (tempIndex < 3.0) {
        starTemperature = 2500.0;  // M-dwarf (red)
    } else if (tempIndex < 4.0) {
        starTemperature = 4000.0;  // K-dwarf (orange)
    } else if (tempIndex < 5.0) {
        starTemperature = 5778.0;  // G-type Sun (yellow)
    } else if (tempIndex < 6.0) {
        starTemperature = 7500.0;  // F-type (white)
    } else if (tempIndex < 7.0) {
        starTemperature = 10000.0; // A-type (blue-white)
    } else {
        starTemperature = 25000.0; // O/B-type (blue)
    }

    vec3 starColor = temperatureToColor(starTemperature);

    // Normalize star color to prevent washout
    float maxComp = max(starColor.r, max(starColor.g, starColor.b));
    if (maxComp > 0.01) {
        starColor = starColor / maxComp * 0.85;
    }

    float activityLevel = 0.7;
    float starSeed = 42.0;

    // =========================================================================
    // SCENE RENDERING
    // =========================================================================

    // Background - pure black space
    vec3 color = vec3(0.0);

    // Procedural star field
    vec3 starFieldDir = rayDir;
    float stars = snoise3D(starFieldDir * 80.0);
    if (stars > 0.94) {
        float brightness = smoothstep(0.94, 1.0, stars);
        color += vec3(brightness * 0.5);
    }

    // Planet seeds
    float rockySeed = 0.3;
    float gasSeed = 0.6;
    float iceSeed = 0.8;

    float closestHit = 1e10;
    vec3 hitColor = color;

    // -------------------------------------------------------------------------
    // STAR EFFECTS (rendered behind star surface)
    // -------------------------------------------------------------------------

    // Outer glow
    color += renderOuterGlow3D(rayOrigin, rayDir, STAR_CENTER, STAR_RADIUS, starColor);

    // Star rays
    color += renderStarRays3D(rayOrigin, rayDir, STAR_CENTER, STAR_RADIUS,
                              starColor, activityLevel, starSeed);

    // Corona flames
    color += renderCorona3D(rayOrigin, rayDir, STAR_CENTER, STAR_RADIUS,
                            starColor, activityLevel, starSeed);

    // -------------------------------------------------------------------------
    // STAR SURFACE
    // -------------------------------------------------------------------------
    float starDist = intersectSphere3D(rayOrigin, rayDir, STAR_CENTER, STAR_RADIUS);

    if (starDist > 0.0 && starDist < closestHit) {
        closestHit = starDist;

        vec3 hitPoint = rayOrigin + rayDir * starDist;
        vec3 starNormal;
        vec2 starUv;
        getSphereInfo(hitPoint, STAR_CENTER, starNormal, starUv);

        vec3 spherePos = normalize(hitPoint - STAR_CENTER);
        hitColor = renderStarSurface(spherePos, starNormal, rayDir, starColor, activityLevel, starSeed);
    }

    // -------------------------------------------------------------------------
    // ROCKY PLANET
    // -------------------------------------------------------------------------
    float rockyDist = intersectSphere3D(rayOrigin, rayDir, ROCKY_CENTER, ROCKY_RADIUS);

    if (rockyDist > 0.0 && rockyDist < closestHit) {
        closestHit = rockyDist;

        vec3 hitPoint = rayOrigin + rayDir * rockyDist;
        vec3 planetNormal;
        vec2 planetUv;
        getSphereInfo(hitPoint, ROCKY_CENTER, planetNormal, planetUv);

        vec3 viewNormal = planetNormal;
        viewNormal.z = dot(planetNormal, -rayDir);

        vec3 planetColor = renderRockyPlanet(planetUv, viewNormal, ROCKY_COLOR, rockySeed, 300.0);

        vec3 lightDir = normalize(STAR_CENTER - hitPoint);
        float diffuse = max(dot(planetNormal, lightDir), 0.0);
        float ambient = 0.12;
        float shadow = (intersectSphere3D(hitPoint + planetNormal * 0.01, lightDir, STAR_CENTER, STAR_RADIUS) > 0.0) ? 1.0 : 0.0;

        hitColor = planetColor * (ambient + diffuse * 0.88 * shadow);
        hitColor += starColor * pow(1.0 - max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0) * 0.15;
    }

    // -------------------------------------------------------------------------
    // GAS GIANT
    // -------------------------------------------------------------------------
    float gasDist = intersectSphere3D(rayOrigin, rayDir, GAS_CENTER, GAS_RADIUS);

    if (gasDist > 0.0 && gasDist < closestHit) {
        closestHit = gasDist;

        vec3 hitPoint = rayOrigin + rayDir * gasDist;
        vec3 planetNormal;
        vec2 planetUv;
        getSphereInfo(hitPoint, GAS_CENTER, planetNormal, planetUv);

        vec3 viewNormal = planetNormal;
        viewNormal.z = dot(planetNormal, -rayDir);

        vec3 planetColor = renderGasGiant(planetUv, viewNormal, GAS_GIANT_COLOR, gasSeed);

        vec3 lightDir = normalize(STAR_CENTER - hitPoint);
        float diffuse = max(dot(planetNormal, lightDir), 0.0);
        float ambient = 0.1;
        float shadow = (intersectSphere3D(hitPoint + planetNormal * 0.01, lightDir, STAR_CENTER, STAR_RADIUS) > 0.0) ? 1.0 : 0.0;

        hitColor = planetColor * (ambient + diffuse * 0.9 * shadow);
        hitColor += starColor * pow(1.0 - max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0) * 0.2;
    }

    // -------------------------------------------------------------------------
    // ICE GIANT
    // -------------------------------------------------------------------------
    float iceDist = intersectSphere3D(rayOrigin, rayDir, ICE_CENTER, ICE_RADIUS);

    if (iceDist > 0.0 && iceDist < closestHit) {
        closestHit = iceDist;

        vec3 hitPoint = rayOrigin + rayDir * iceDist;
        vec3 planetNormal;
        vec2 planetUv;
        getSphereInfo(hitPoint, ICE_CENTER, planetNormal, planetUv);

        vec3 viewNormal = planetNormal;
        viewNormal.z = dot(planetNormal, -rayDir);

        vec3 planetColor = renderIceGiant(planetUv, viewNormal, ICE_GIANT_COLOR, iceSeed);

        vec3 lightDir = normalize(STAR_CENTER - hitPoint);
        float diffuse = max(dot(planetNormal, lightDir), 0.0);
        float ambient = 0.08;
        float shadow = (intersectSphere3D(hitPoint + planetNormal * 0.01, lightDir, STAR_CENTER, STAR_RADIUS) > 0.0) ? 1.0 : 0.0;

        hitColor = planetColor * (ambient + diffuse * 0.92 * shadow);
        hitColor += ICE_GIANT_COLOR * pow(1.0 - max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5) * 0.25;
    }

    // Use hit color if we hit something
    if (closestHit < 1e9) {
        color = hitColor;
    }

    // =========================================================================
    // POST PROCESSING
    // =========================================================================

    // Tone mapping (Reinhard)
    color = color / (color + vec3(1.0));

    // Vignette
    float vignette = 1.0 - dot(uv * 0.4, uv * 0.4) * 0.4;
    color *= vignette;

    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    fragColor = vec4(color, 1.0);
}
