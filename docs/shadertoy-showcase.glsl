/**
 * Exoplanet Shader Showcase for Shadertoy
 * ========================================
 * A procedural solar system with a star and three different planet types
 * 
 * Scene:
 * - Central star (Sun-like G-type) with animated surface
 * - Rocky planet (inner orbit) - Earth/Mars-like with terrain
 * - Gas giant (middle orbit) - Jupiter-like with bands and storms  
 * - Ice giant (outer orbit) - Neptune-like with soft atmosphere
 * 
 * Controls:
 * - Mouse X: Orbit camera horizontally (full 360°)
 * - Mouse Y: Orbit camera vertically (pitch up/down)
 * - No interaction: Camera gently auto-orbits
 * 
 * Created from the Exoplanets visualization project
 * https://github.com/guinetik/exoplanets
 */

// =============================================================================
// CONFIGURATION - Adjust these to customize the scene
// =============================================================================

// 3D positions - Star at center, planets orbiting
#define STAR_CENTER vec3(0.0, 0.0, 0.0)    // Star at center of system
#define STAR_RADIUS 1.0                     // Star size

// Rocky planet (closest to star - like Mercury/Venus/Earth)
#define ROCKY_CENTER vec3(2.5, 0.0, 0.0)   // Inner orbit
#define ROCKY_RADIUS 0.3                    // Smaller terrestrial world

// Gas giant (middle distance - like Jupiter/Saturn)  
#define GAS_CENTER vec3(0.0, 0.0, 4.0)     // Middle orbit
#define GAS_RADIUS 0.7                      // Large gas giant

// Ice giant (farthest - like Uranus/Neptune)
#define ICE_CENTER vec3(-3.5, 0.5, -2.0)   // Outer orbit
#define ICE_RADIUS 0.5                      // Medium ice giant

// Camera settings
#define CAMERA_DISTANCE 8.0                 // How far camera orbits (increased for wider view)
#define CAMERA_FOV 1.8                      // Field of view (lower = more zoom)

// Star colors by spectral class (pick one or interpolate)
#define STAR_COLOR_O vec3(0.6, 0.7, 1.0)   // Blue-white (hottest)
#define STAR_COLOR_B vec3(0.7, 0.8, 1.0)   // Blue-white
#define STAR_COLOR_A vec3(0.9, 0.9, 1.0)   // White
#define STAR_COLOR_F vec3(1.0, 1.0, 0.9)   // Yellow-white
#define STAR_COLOR_G vec3(1.0, 0.9, 0.6)   // Yellow Sun - warmer and more golden
#define STAR_COLOR_K vec3(1.0, 0.7, 0.4)   // Orange
#define STAR_COLOR_M vec3(1.0, 0.4, 0.2)   // Red (coolest)

// Planet base colors - vivid and distinct
#define ROCKY_COLOR vec3(0.3, 0.5, 0.8)    // Earth-like blue with oceans
#define GAS_GIANT_COLOR vec3(0.95, 0.6, 0.3) // Jupiter-like orange/amber
#define ICE_GIANT_COLOR vec3(0.2, 0.5, 0.95) // Neptune-like vivid blue

// =============================================================================
// SHADER CONSTANTS
// =============================================================================

const float PI = 3.14159265359;
const float MOD_DIVISOR = 289.0;

// Star surface constants
const float CONVECTION_SPEED = 0.05;
const float GRANULATION_SCALE = 8.0;
const float GRANULATION_STRENGTH = 0.4;   // Slightly reduced for brighter look
const float SUNSPOT_SCALE = 3.0;
const float SUNSPOT_THRESHOLD_LOW = 0.65;  // Fewer sunspots
const float SUNSPOT_THRESHOLD_HIGH = 0.85;
const float SUNSPOT_DARKNESS = 0.3;        // Sunspots less dark
const float FLARE_SCALE = 5.0;
const float FLARE_THRESHOLD_LOW = 0.6;     // More flares
const float FLARE_THRESHOLD_HIGH = 0.85;
const float FLARE_BRIGHTNESS = 0.5;        // Brighter flares
const float LIMB_DARKENING_POWER = 0.25;   // Less limb darkening = brighter edges
const float CORE_GLOW_STRENGTH = 0.6;      // Stronger core glow
const float BLOOM_STRENGTH = 0.35;         // More bloom for that burning look

// Planet constants
const float BAND_FREQ_BASE = 10.0;
const float TURBULENCE_STRENGTH = 0.15;
const float STORM_SIZE = 0.06;

// =============================================================================
// NOISE FUNCTIONS
// =============================================================================

vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec4 mod289_4(vec4 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }

vec4 permute(vec4 x) { return mod289_4(((x * 34.0) + 1.0) * x); }
vec3 permute3(vec3 x) { return mod289_3(((x * 34.0) + 1.0) * x); }

vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// 3D Simplex Noise (for star surface)
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

// 2D Simplex Noise (for planets)
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

// Fractional Brownian Motion
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
// STAR SURFACE SHADER
// =============================================================================

vec3 renderStar(vec3 spherePos, vec3 normal, vec3 starColor, float temperature) {
    float time = iTime;
    
    // Animated position for convection
    float slowTime = time * CONVECTION_SPEED;
    vec3 animatedPos = spherePos + vec3(slowTime * 0.1, 0.0, slowTime * 0.05);
    
    // Granulation (convection cells)
    float granulation = fbm3D(animatedPos * GRANULATION_SCALE, 4) * GRANULATION_STRENGTH + 0.5;
    
    // Fine detail
    float fineDetail = fbm3D(animatedPos * 20.0 + vec3(time * 0.02), 3) * 0.3;
    
    // Sunspots
    float spotNoise = snoise3D(spherePos * SUNSPOT_SCALE + vec3(0.0, time * 0.01, 0.0));
    float spotMask = smoothstep(SUNSPOT_THRESHOLD_LOW, SUNSPOT_THRESHOLD_HIGH, spotNoise);
    float spotDarkening = 1.0 - spotMask * SUNSPOT_DARKNESS;
    
    // Hot spots / flares
    float flareNoise = snoise3D(animatedPos * FLARE_SCALE + vec3(time * 0.1));
    float flareMask = smoothstep(FLARE_THRESHOLD_LOW, FLARE_THRESHOLD_HIGH, flareNoise) * FLARE_BRIGHTNESS;
    
    // Limb darkening
    float viewAngle = normal.z;
    float limbDarkening = pow(max(viewAngle, 0.0), LIMB_DARKENING_POWER);
    float tempFactor = clamp(temperature / 10000.0, 0.3, 1.0);
    limbDarkening = mix(limbDarkening, 1.0, tempFactor * 0.3);
    
    // Color calculation - enhance yellow tones
    vec3 warmColor = starColor * vec3(1.15, 1.0, 0.8);   // More yellow in bright areas
    vec3 coolColor = starColor * vec3(1.0, 0.85, 0.6);   // Orange-yellow in darker areas
    vec3 surfaceColor = mix(coolColor, warmColor, granulation);
    
    // Apply effects
    surfaceColor += starColor * fineDetail * 0.2;
    surfaceColor *= spotDarkening;
    surfaceColor += starColor * vec3(1.2, 1.1, 0.9) * flareMask;
    surfaceColor *= 0.6 + limbDarkening * 0.4;
    
    // Core glow
    float coreGlow = pow(max(viewAngle, 0.0), 2.0);
    surfaceColor += starColor * coreGlow * CORE_GLOW_STRENGTH;
    
    // Bloom
    surfaceColor *= (1.0 + BLOOM_STRENGTH);
    
    return clamp(surfaceColor, 0.0, 2.0);
}

// =============================================================================
// ROCKY PLANET SHADER
// =============================================================================

vec3 renderRockyPlanet(vec2 uv, vec3 normal, vec3 baseColor, float seed, float temperature) {
    float time = iTime;
    
    // Terrain offset by seed
    vec2 terrainUv = uv + vec2(seed * 10.0, seed * 7.0);
    
    // Color variation from seed - boost saturation for vivid colors
    vec3 hsv = rgb2hsv(baseColor);
    hsv.x = fract(hsv.x + seed * 0.15);  // Less hue shift to keep base color
    hsv.y = clamp(hsv.y * 1.3, 0.5, 1.0); // Boost saturation
    hsv.z = clamp(hsv.z * 1.1, 0.4, 1.0); // Slightly brighter
    vec3 variedColor = hsv2rgb(hsv);
    
    // Terrain height
    float terrain = fbm2D(terrainUv * (3.0 + seed * 3.0));
    
    // Temperature effects
    float iceFactor = smoothstep(250.0, 180.0, temperature);
    float volcanicFactor = smoothstep(400.0, 800.0, temperature);
    
    // Base terrain colors
    vec3 lowland = variedColor * 0.7;
    vec3 highland = variedColor * 1.2;
    vec3 peak = variedColor * 1.4;
    
    // Ice coloring
    vec3 iceColor = vec3(0.8 + seed * 0.15, 0.85 + seed * 0.1, 0.9 + seed * 0.1);
    lowland = mix(lowland, iceColor * 0.6, iceFactor);
    highland = mix(highland, iceColor * 0.8, iceFactor);
    peak = mix(peak, iceColor, iceFactor);
    
    // Volcanic coloring
    vec3 lavaColor = vec3(1.0, 0.2 + seed * 0.3, 0.05 + seed * 0.15);
    vec3 ashColor = vec3(0.15 + seed * 0.1, 0.1 + seed * 0.1, 0.05 + seed * 0.1);
    lowland = mix(lowland, lavaColor * 0.8, volcanicFactor * 0.5);
    highland = mix(highland, ashColor, volcanicFactor);
    
    // Mix by height
    vec3 surfaceColor = mix(lowland, highland, smoothstep(0.3, 0.6, terrain));
    surfaceColor = mix(surfaceColor, peak, smoothstep(0.7, 0.9, terrain));
    
    // Craters (airless)
    float craters = snoise2D(terrainUv * (25.0 + seed * 15.0));
    float craterMask = smoothstep(0.8, 0.7, craters) * (1.0 - min(iceFactor + volcanicFactor, 1.0));
    surfaceColor *= (1.0 - craterMask * 0.3);
    
    // Lava cracks
    if (volcanicFactor > 0.0) {
        float cracks = snoise2D(terrainUv * (15.0 + seed * 10.0));
        float crackMask = smoothstep(0.7, 0.6, abs(cracks));
        surfaceColor = mix(surfaceColor, lavaColor * 1.2, crackMask * volcanicFactor * 0.6);
    }
    
    // Surface detail
    float detail = snoise2D(terrainUv * 40.0) * 0.05;
    surfaceColor += surfaceColor * detail;
    
    // Limb darkening
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
    
    // Band frequency varies by seed
    float bandFreq = BAND_FREQ_BASE + seed * 6.0;
    
    // Main bands
    float bands = sin(latitude * PI * bandFreq) * 0.5 + 0.5;
    
    // Turbulence
    float turbulence = snoise2D(vec2(
        uv.x * 8.0 + time * 0.02 + seed * 10.0,
        latitude * 20.0
    )) * TURBULENCE_STRENGTH;
    bands += turbulence;
    
    // Small bands for detail
    float smallBands = sin(latitude * PI * bandFreq * 3.0 + seed * 5.0) * 0.5 + 0.5;
    bands = mix(bands, smallBands * 0.3, 0.3);
    
    // Great Red Spot style storm
    vec2 stormCenter = vec2(fract(seed * 3.7), 0.4 + fract(seed * 2.3) * 0.3);
    float stormDist = length(uv - stormCenter);
    float stormSize = STORM_SIZE + fract(seed * 5.1) * 0.06;
    float storm = smoothstep(stormSize + 0.03, stormSize, stormDist);
    
    // Second storm
    vec2 storm2Center = vec2(fract(seed * 7.1 + 0.5), 0.3 + fract(seed * 4.7) * 0.4);
    float storm2 = smoothstep(0.05, 0.01, length(uv - storm2Center)) * 0.6;
    
    // Color palette - vivid Jupiter-like orange bands
    vec3 hsv = rgb2hsv(baseColor);
    hsv.x = fract(hsv.x + (seed - 0.5) * 0.1);  // Keep orange hue
    hsv.y = clamp(hsv.y * 1.4, 0.6, 1.0);       // High saturation
    hsv.z = clamp(hsv.z * 1.2, 0.5, 1.0);       // Brighter
    vec3 variedColor = hsv2rgb(hsv);
    
    vec3 lightBand = variedColor * 1.4;         // Bright orange bands
    vec3 darkBand = variedColor * vec3(0.5, 0.4, 0.35); // Darker brown bands
    
    // Storm color - Great Red Spot style
    vec3 stormHsv = hsv;
    stormHsv.x = fract(stormHsv.x - 0.05);     // Shift toward red
    stormHsv.y = min(stormHsv.y * 1.3, 1.0);   // More saturated
    stormHsv.z *= 0.85;                         // Slightly darker
    vec3 stormColor = hsv2rgb(stormHsv);
    
    // Compose
    vec3 surfaceColor = mix(darkBand, lightBand, bands);
    surfaceColor = mix(surfaceColor, stormColor, storm + storm2);
    
    // Swirl detail
    float swirl = snoise2D(vec2(uv.x * 15.0 + time * 0.01, uv.y * 10.0 + seed * 20.0)) * 0.1;
    surfaceColor += surfaceColor * swirl;
    
    // Limb darkening
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
    
    // Color variation - vivid Neptune blue
    vec3 hsv = rgb2hsv(baseColor);
    hsv.x = fract(hsv.x + (seed - 0.5) * 0.05); // Keep blue hue
    hsv.y = clamp(hsv.y * 1.5, 0.7, 1.0);       // Very saturated blue
    hsv.z = clamp(hsv.z * 1.15, 0.5, 1.0);      // Bright
    vec3 variedColor = hsv2rgb(hsv);
    
    // Soft bands
    float bandFreq = 5.0 + seed * 4.0;
    float bandPattern = sin(latitude * PI * bandFreq + seed * 3.0) * 0.5 + 0.5;
    float bands = smoothstep(0.3, 0.7, bandPattern);
    
    // Atmospheric flow
    float flow = snoise2D(vec2(
        uv.x * 4.0 + time * 0.015 + seed * 5.0,
        latitude * 8.0
    )) * 0.2;
    bands += flow;
    
    // High altitude haze
    float haze = snoise2D(vec2(uv.x * 6.0 + time * 0.01, uv.y * 6.0 + seed * 10.0)) * 0.5 + 0.5;
    float hazeMask = smoothstep(0.4, 0.8, haze) * 0.3;
    
    // Colors
    vec3 deepColor = variedColor * 0.7;
    vec3 brightColor = variedColor * 1.2;
    vec3 hazeColor = vec3(0.8, 0.9, 1.0);
    
    // Compose
    vec3 atmosphereColor = mix(deepColor, brightColor, bands);
    
    // Methane tint
    float methane = snoise2D(vec2(uv.x * 3.0 + seed * 7.0, uv.y * 5.0 + time * 0.005)) * 0.5 + 0.5;
    vec3 methaneTint = vec3(0.7, 0.9, 1.1);
    atmosphereColor *= mix(vec3(1.0), methaneTint, methane * 0.3);
    
    // Haze layer
    atmosphereColor = mix(atmosphereColor, hazeColor * variedColor, hazeMask);
    
    // Dark spot
    vec2 spotCenter = vec2(0.3 + fract(seed * 4.3) * 0.4, 0.4 + fract(seed * 2.7) * 0.3);
    float spotDist = length(uv - spotCenter);
    float spotSize = 0.05 + fract(seed * 6.1) * 0.08;
    float spotMask = smoothstep(spotSize + 0.04, spotSize, spotDist);
    atmosphereColor *= (1.0 - spotMask * 0.4);
    
    // Limb darkening (stronger for ice giants)
    float limb = smoothstep(-0.3, 0.7, normal.z);
    atmosphereColor *= 0.3 + limb * 0.7;
    
    // Edge glow
    float edgeGlow = 1.0 - abs(normal.z);
    edgeGlow = pow(edgeGlow, 3.0) * 0.2;
    atmosphereColor += variedColor * edgeGlow;
    
    return atmosphereColor;
}


// =============================================================================
// 3D RAY-SPHERE INTERSECTION
// =============================================================================

/**
 * Ray-sphere intersection for 3D scene
 * Returns distance to intersection, or -1.0 if no hit
 */
float intersectSphere3D(vec3 rayOrigin, vec3 rayDir, vec3 sphereCenter, float radius) {
    vec3 oc = rayOrigin - sphereCenter;
    float b = dot(oc, rayDir);
    float c = dot(oc, oc) - radius * radius;
    float h = b * b - c;
    
    if (h < 0.0) return -1.0; // No intersection
    
    h = sqrt(h);
    float t = -b - h; // Near intersection
    
    if (t < 0.0) t = -b + h; // Try far intersection
    if (t < 0.0) return -1.0; // Both behind camera
    
    return t;
}

/**
 * Get normal and UV for a point on sphere surface
 */
void getSphereInfo(vec3 hitPoint, vec3 sphereCenter, out vec3 normal, out vec2 sphereUv) {
    normal = normalize(hitPoint - sphereCenter);
    
    // Spherical UV mapping (lat/long projection)
    float latitude = 0.5 + asin(normal.y) / PI;
    float longitude = 0.5 + atan(normal.x, normal.z) / (2.0 * PI);
    sphereUv = vec2(longitude, latitude);
}

// =============================================================================
// CAMERA UTILITIES
// =============================================================================

/**
 * Create a rotation matrix around Y axis
 */
mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

/**
 * Create a rotation matrix around X axis
 */
mat3 rotateX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, s,
        0.0, -s, c
    );
}

/**
 * Build camera matrix from position looking at target
 */
mat3 setCamera(vec3 ro, vec3 ta) {
    vec3 cw = normalize(ta - ro);           // Forward
    vec3 cp = vec3(0.0, 1.0, 0.0);          // World up
    vec3 cu = normalize(cross(cw, cp));     // Right
    vec3 cv = cross(cu, cw);                // Up
    return mat3(cu, cv, cw);
}

// =============================================================================
// 3D CORONA GLOW (for 3D space)
// =============================================================================

vec3 renderCorona3D(vec3 rayOrigin, vec3 rayDir, vec3 starCenter, float starRadius, vec3 starColor) {
    // Find closest point on ray to star center
    vec3 toStar = starCenter - rayOrigin;
    float t = max(dot(toStar, rayDir), 0.0);
    vec3 closestPoint = rayOrigin + rayDir * t;
    float dist = length(closestPoint - starCenter);
    
    // Don't render corona inside the star (will be covered by star surface)
    if (dist < starRadius) return vec3(0.0);
    
    // Tight glow falloff - corona stays close to the star
    float glow = starRadius / dist;
    glow = pow(glow, 3.0) * 0.4;  // Steeper falloff, less intense
    
    // Fade out corona close to star edge to blend smoothly
    float edgeFade = smoothstep(starRadius, starRadius * 1.15, dist);
    glow *= edgeFade;
    
    // Cut off corona at a reasonable distance so space stays dark
    float distanceFade = smoothstep(starRadius * 4.0, starRadius * 1.5, dist);
    glow *= distanceFade;
    
    // Subtle flicker
    float flicker = snoise2D(rayDir.xy * 2.0 + vec2(iTime * 0.1)) * 0.1 + 1.0;
    
    return starColor * glow * flicker;
}

// =============================================================================
// MAIN IMAGE - 3D Ray Traced Scene with Camera Controls
// =============================================================================

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized pixel coordinates (-1 to 1, aspect corrected)
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    
    // =========================================================================
    // CAMERA SETUP - Mouse controls orbit
    // =========================================================================
    
    vec2 mouse;
    
    // When dragging: full mouse control
    // When released: auto-rotate horizontally but keep vertical angle
    if (iMouse.z > 0.0) {
        // Mouse is pressed - full control
        mouse = iMouse.xy / iResolution.xy;
    } else {
        // Auto-rotate horizontally, keep last vertical position
        float lastY = (iMouse.xy == vec2(0.0)) ? 0.5 : iMouse.y / iResolution.y;
        mouse = vec2(
            fract(iTime * 0.03),  // Slow horizontal orbit
            lastY                  // Keep vertical angle where user left it
        );
    }
    
    // Convert mouse to camera angles
    float angleY = (mouse.x - 0.5) * PI * 2.0;  // Horizontal orbit: full 360°
    float angleX = (mouse.y - 0.5) * PI * 0.8;  // Vertical orbit: limited to ±72°
    angleX = clamp(angleX, -PI * 0.4, PI * 0.4); // Prevent flipping
    
    // Camera position: orbit around scene center
    vec3 target = vec3(0.0, 0.0, 0.0);  // Look at center of scene
    vec3 cameraPos = vec3(0.0, 0.0, CAMERA_DISTANCE);
    
    // Apply rotations
    cameraPos = rotateX(angleX) * cameraPos;
    cameraPos = rotateY(angleY) * cameraPos;
    
    // Build camera matrix
    mat3 cameraMat = setCamera(cameraPos, target);
    
    // Ray direction for this pixel
    vec3 rayDir = cameraMat * normalize(vec3(uv, CAMERA_FOV));
    vec3 rayOrigin = cameraPos;
    
    // =========================================================================
    // SCENE RENDERING
    // =========================================================================
    
    // Background - pure black space
    vec3 color = vec3(0.0);
    
    // Procedural star field (fixed in world space)
    vec3 starFieldDir = rayDir;
    float stars = snoise3D(starFieldDir * 80.0);
    if (stars > 0.94) {
        float brightness = smoothstep(0.94, 1.0, stars);
        color += vec3(brightness * 0.5);  // Dimmer distant stars
    }
    
    // Unique seeds for each planet (based on position, so they stay consistent)
    float rockySeed = 0.3;
    float gasSeed = 0.6;
    float iceSeed = 0.8;
    
    // Track closest hit for proper depth ordering
    float closestHit = 1e10;
    vec3 hitColor = color;
    
    // -------------------------------------------------------------------------
    // STAR (at center of the system)
    // -------------------------------------------------------------------------
    float starDist = intersectSphere3D(rayOrigin, rayDir, STAR_CENTER, STAR_RADIUS);
    
    // Corona glow (always visible, even when star is behind)
    color += renderCorona3D(rayOrigin, rayDir, STAR_CENTER, STAR_RADIUS, STAR_COLOR_G);
    
    if (starDist > 0.0 && starDist < closestHit) {
        closestHit = starDist;
        
        vec3 hitPoint = rayOrigin + rayDir * starDist;
        vec3 starNormal;
        vec2 starUv;
        getSphereInfo(hitPoint, STAR_CENTER, starNormal, starUv);
        
        // Transform normal to view space for limb darkening
        vec3 viewNormal = starNormal;
        viewNormal.z = dot(starNormal, -rayDir); // Face toward camera
        
        vec3 spherePos = normalize(hitPoint - STAR_CENTER);
        hitColor = renderStar(spherePos, viewNormal, STAR_COLOR_G, 5800.0);
    }
    
    // -------------------------------------------------------------------------
    // ROCKY PLANET (inner orbit - Earth-like)
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
        
        // Lighting from star
        vec3 lightDir = normalize(STAR_CENTER - hitPoint);
        float diffuse = max(dot(planetNormal, lightDir), 0.0);
        float ambient = 0.12;
        float shadow = (intersectSphere3D(hitPoint + planetNormal * 0.01, lightDir, STAR_CENTER, STAR_RADIUS) > 0.0) ? 1.0 : 0.0;
        
        hitColor = planetColor * (ambient + diffuse * 0.88 * shadow);
        
        // Rim lighting
        float rim = pow(1.0 - max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0) * 0.3;
        hitColor += STAR_COLOR_G * rim * 0.15;
    }
    
    // -------------------------------------------------------------------------
    // GAS GIANT (middle orbit - Jupiter-like)
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
        
        // Lighting from star
        vec3 lightDir = normalize(STAR_CENTER - hitPoint);
        float diffuse = max(dot(planetNormal, lightDir), 0.0);
        float ambient = 0.1;
        float shadow = (intersectSphere3D(hitPoint + planetNormal * 0.01, lightDir, STAR_CENTER, STAR_RADIUS) > 0.0) ? 1.0 : 0.0;
        
        hitColor = planetColor * (ambient + diffuse * 0.9 * shadow);
        
        // Rim lighting
        float rim = pow(1.0 - max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0) * 0.25;
        hitColor += STAR_COLOR_G * rim * 0.2;
    }
    
    // -------------------------------------------------------------------------
    // ICE GIANT (outer orbit - Neptune-like)
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
        
        // Lighting from star (dimmer for outer planets)
        vec3 lightDir = normalize(STAR_CENTER - hitPoint);
        float diffuse = max(dot(planetNormal, lightDir), 0.0);
        float ambient = 0.08; // Less ambient light out here
        float shadow = (intersectSphere3D(hitPoint + planetNormal * 0.01, lightDir, STAR_CENTER, STAR_RADIUS) > 0.0) ? 1.0 : 0.0;
        
        hitColor = planetColor * (ambient + diffuse * 0.92 * shadow);
        
        // Rim lighting (more pronounced on ice giants due to atmosphere)
        float rim = pow(1.0 - max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5) * 0.35;
        hitColor += ICE_GIANT_COLOR * rim * 0.25;
    }
    
    // Use the hit color if we hit something
    if (closestHit < 1e9) {
        color = hitColor;
    }
    
    // =========================================================================
    // POST PROCESSING
    // =========================================================================
    
    // Tone mapping (Reinhard)
    color = color / (color + vec3(1.0));
    
    // Vignette for cinematic dark edges
    float vignette = 1.0 - dot(uv * 0.4, uv * 0.4) * 0.4;
    color *= vignette;
    
    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));
    
    fragColor = vec4(color, 1.0);
}

