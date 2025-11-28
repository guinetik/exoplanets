/**
 * Nebula Background Shadertoy Demo
 * 
 * @author guinetik
 * @see https://github.com/guinetik
 * 
 * Click to generate a new nebula with random seed.
 * Drag mouse to rotate the view around the nebula.
 * 
 * Features procedural variety:
 * - Main nebula with emission colors
 * - Distant gas clouds in contrasting colors
 * - Dark nebulae (Bok globules)
 * - Bright emission knots
 * - Distant galaxies
 * - Heterogeneous density (bright regions, voids, dust lanes)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

#define PI 3.14159265359
#define TAU 6.28318530718

// Nebula structure
const float NEBULA_SCALE = 0.5;
const float NEBULA_DETAIL = 2.0;
const int SPIRAL_NOISE_ITER = 5;
const float NUDGE = 3.0;

// Animation
const float TIME_SCALE = 0.008;
const float FLOW_SPEED = 0.03;

// Density
const float DENSITY_THRESHOLD = 0.08;
const float DENSITY_FALLOFF = 0.6;

// Colors
const float COLOR_VARIATION = 0.2;
const float BRIGHTNESS_BASE = 0.3;
const float BRIGHTNESS_RANGE = 0.5;

// Noise constants
const float MOD_DIVISOR = 289.0;
const vec4 TAYLOR_INV_SQRT = vec4(1.79284291400159, 0.85373472095314, 0.0, 0.0);
const float NOISE_OUTPUT_SCALE_3D = 42.0;
const float FBM_LACUNARITY = 2.0;
const float FBM_PERSISTENCE = 0.5;
const int FBM_MAX_OCTAVES = 8;

// Hash constants
const float HASH_K1 = 0.1031;
const float HASH_K2 = 0.1030;
const float HASH_K3 = 0.0973;
const float HASH_K4 = 33.33;

// =============================================================================
// HASH FUNCTIONS
// =============================================================================

float seedHash(float seed) {
    vec3 p3 = fract(vec3(seed) * vec3(HASH_K1, HASH_K2, HASH_K3));
    p3 += dot(p3, p3.yzx + HASH_K4);
    return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}

// =============================================================================
// NOISE FUNCTIONS
// =============================================================================

vec3 mod289_3(vec3 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec4 mod289_4(vec4 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec4 permute_4(vec4 x) {
    return mod289_4(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return TAYLOR_INV_SQRT.x - TAYLOR_INV_SQRT.y * r;
}

float snoise3D(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
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
    vec4 p = permute_4(permute_4(permute_4(
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
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    
    return NOISE_OUTPUT_SCALE_3D * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm3D(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = FBM_PERSISTENCE;
    float frequency = 1.0;
    vec3 shift = vec3(100.0);
    
    for (int i = 0; i < FBM_MAX_OCTAVES; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise3D(p * frequency);
        p += shift;
        frequency *= FBM_LACUNARITY;
        amplitude *= FBM_PERSISTENCE;
    }
    
    return value;
}

// =============================================================================
// HSV TO RGB
// =============================================================================

vec3 hsv2rgb(float h, float s, float v) {
    return v + v * s * (clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0) - 1.0);
}

// =============================================================================
// SPIRAL NOISE
// =============================================================================

float spiralNoise(vec3 p, float seed) {
    float normalizer = 1.0 / sqrt(1.0 + NUDGE * NUDGE);
    float n = 1.5 - seed * 0.5;
    float iter = 2.0;

    for (int i = 0; i < SPIRAL_NOISE_ITER; i++) {
        n += -abs(sin(p.y * iter) + cos(p.x * iter)) / iter;
        p.xy += vec2(p.y, -p.x) * NUDGE;
        p.xy *= normalizer;
        p.xz += vec2(p.z, -p.x) * NUDGE;
        p.xz *= normalizer;
        iter *= 1.5 + seed * 0.2;
    }

    return n;
}

// =============================================================================
// NEBULA DENSITY (with voids and bright regions)
// =============================================================================

float nebulaDensity(vec3 p, float seed) {
    float k = 1.5 + seed * 0.5;
    float spiral = spiralNoise(p * NEBULA_SCALE, seed);
    float detail = fbm3D(p * NEBULA_DETAIL, 4) * 0.35;
    float fine = fbm3D(p * NEBULA_DETAIL * 3.0, 2) * 0.15;
    return k * (0.5 + spiral * 0.5 + detail + fine);
}

// Large-scale density variation - creates bright regions and voids
float densityVariation(vec3 p, float seed) {
    // Very large scale blobs for major bright/dark regions
    float largeBright = fbm3D(p * 0.3 + seed * 50.0, 2);
    largeBright = smoothstep(-0.3, 0.5, largeBright); // 0 to 1, biased toward darker
    
    // Medium scale variation
    float mediumVar = fbm3D(p * 0.8 + seed * 30.0, 2);
    mediumVar = mediumVar * 0.5 + 0.5;
    
    // Combine - creates patchy distribution
    float variation = largeBright * (0.5 + mediumVar * 0.5);
    
    return variation;
}

// Creates voids - empty regions in the nebula
float voidMask(vec3 p, float seed) {
    // Large void regions
    float voidNoise = fbm3D(p * 0.4 + seed * 70.0, 3);
    
    // Sharp cutoff for void edges
    float voids = smoothstep(-0.2, 0.1, voidNoise);
    
    // Additional smaller void pockets
    float smallVoids = fbm3D(p * 1.2 + seed * 90.0, 2);
    smallVoids = smoothstep(-0.4, 0.0, smallVoids);
    
    return voids * (0.3 + smallVoids * 0.7);
}

// Bright emission regions - localized bright spots
float brightRegions(vec3 p, float seed) {
    float bright = 0.0;
    
    // Large bright patches
    float patch1 = fbm3D(p * 0.5 + seed * 40.0, 2);
    patch1 = pow(max(patch1 + 0.3, 0.0), 2.0);
    
    // Concentrated bright cores
    float cores = fbm3D(p * 1.5 + seed * 60.0, 2);
    cores = pow(max(cores + 0.5, 0.0), 3.0) * 0.5;
    
    bright = patch1 + cores;
    
    return bright;
}

// =============================================================================
// ROTATION MATRIX
// =============================================================================

mat3 rotationMatrix(float yaw, float pitch) {
    float cy = cos(yaw);
    float sy = sin(yaw);
    float cp = cos(pitch);
    float sp = sin(pitch);
    
    return mat3(
        cy, 0.0, -sy,
        sy * sp, cp, cy * sp,
        sy * cp, -sp, cy * cp
    );
}

// =============================================================================
// STAR COLORS
// =============================================================================

vec3 starColorFromTemp(float temp) {
    if (temp < 0.2) {
        return mix(vec3(1.0, 0.6, 0.4), vec3(1.0, 0.75, 0.5), temp / 0.2);
    } else if (temp < 0.4) {
        return mix(vec3(1.0, 0.75, 0.5), vec3(1.0, 0.9, 0.75), (temp - 0.2) / 0.2);
    } else if (temp < 0.6) {
        return mix(vec3(1.0, 0.9, 0.75), vec3(1.0, 1.0, 1.0), (temp - 0.4) / 0.2);
    } else if (temp < 0.8) {
        return mix(vec3(1.0, 1.0, 1.0), vec3(0.85, 0.9, 1.0), (temp - 0.6) / 0.2);
    } else {
        return mix(vec3(0.85, 0.9, 1.0), vec3(0.7, 0.8, 1.0), (temp - 0.8) / 0.2);
    }
}

// =============================================================================
// EMISSION NEBULA COLORS
// =============================================================================

vec3 nebulaEmissionColor(float hue, float variation) {
    vec3 hAlpha = vec3(0.9, 0.3, 0.35);
    vec3 oiii = vec3(0.2, 0.7, 0.65);
    vec3 sii = vec3(0.8, 0.25, 0.2);
    vec3 hBeta = vec3(0.3, 0.5, 0.8);
    
    vec3 color;
    if (hue < 0.25) {
        color = mix(hAlpha, oiii, hue / 0.25);
    } else if (hue < 0.5) {
        color = mix(oiii, hBeta, (hue - 0.25) / 0.25);
    } else if (hue < 0.75) {
        color = mix(hBeta, sii, (hue - 0.5) / 0.25);
    } else {
        color = mix(sii, hAlpha, (hue - 0.75) / 0.25);
    }
    
    color += (variation - 0.5) * 0.15;
    return color;
}

// =============================================================================
// DISTANT GAS CLOUDS (different from main nebula)
// =============================================================================

vec4 distantGasCloud(vec3 dir, float seed, vec3 cloudCenter, float cloudSize, vec3 cloudColor) {
    float dist = length(dir - cloudCenter);
    
    // Soft falloff
    float mask = 1.0 - smoothstep(0.0, cloudSize, dist);
    mask = pow(mask, 1.5);
    
    if (mask < 0.01) return vec4(0.0);
    
    // Internal structure with voids
    vec3 localPos = (dir - cloudCenter) / cloudSize;
    float noise = fbm3D(localPos * 3.0 + seed * 10.0, 3) * 0.5 + 0.5;
    float detail = fbm3D(localPos * 8.0 + seed * 20.0, 2) * 0.5 + 0.5;
    
    // Internal voids
    float voidNoise = fbm3D(localPos * 2.0 + seed * 30.0, 2);
    float voids = smoothstep(-0.3, 0.2, voidNoise);
    
    // Bright cores within the cloud
    float brightCore = fbm3D(localPos * 4.0 + seed * 40.0, 2);
    brightCore = pow(max(brightCore + 0.4, 0.0), 2.5);
    
    float density = mask * noise * (0.7 + detail * 0.3) * voids;
    density += brightCore * mask * 0.3;
    
    // Wispy edges
    float edge = smoothstep(0.0, 0.3, mask) * (1.0 - smoothstep(0.7, 1.0, mask));
    density *= 0.4 + edge * 0.6;
    
    // Color variation within cloud
    float colorVar = fbm3D(localPos * 2.5 + seed * 15.0, 2) * 0.15;
    vec3 variedColor = cloudColor * (0.85 + colorVar * 2.0);
    
    // Bright cores are slightly different color
    variedColor = mix(variedColor, cloudColor * 1.3, brightCore);
    
    vec3 color = variedColor * (0.12 + density * 0.28);
    
    return vec4(color, density * 0.45);
}

// =============================================================================
// DARK NEBULA / BOK GLOBULE
// =============================================================================

float darkNebula(vec3 dir, float seed, vec3 center, float size) {
    float dist = length(dir - center);
    float mask = 1.0 - smoothstep(0.0, size, dist);
    
    if (mask < 0.01) return 0.0;
    
    // Irregular shape
    vec3 localPos = (dir - center) / size;
    float noise = fbm3D(localPos * 4.0 + seed * 15.0, 3);
    
    float density = mask * (0.5 + noise * 0.5);
    density = smoothstep(0.2, 0.6, density);
    
    return density;
}

// =============================================================================
// BRIGHT EMISSION KNOT (HII region)
// =============================================================================

vec4 emissionKnot(vec3 dir, float seed, vec3 center, float size, vec3 knotColor) {
    float dist = length(dir - center);
    float mask = 1.0 - smoothstep(0.0, size, dist);
    mask = pow(mask, 2.0);
    
    if (mask < 0.01) return vec4(0.0);
    
    // Compact bright core
    vec3 localPos = (dir - center) / size;
    float noise = fbm3D(localPos * 5.0 + seed * 25.0, 2) * 0.5 + 0.5;
    
    float density = mask * noise;
    
    // Bright center
    float core = exp(-dist * 30.0 / size) * 0.8;
    density += core;
    
    vec3 color = knotColor * density * 0.6;
    
    return vec4(color, min(density * 0.5, 1.0));
}

// =============================================================================
// DISTANT GALAXY
// =============================================================================

vec3 distantGalaxy(vec3 dir, float seed, vec3 center, float size) {
    float dist = length(dir - center);
    
    if (dist > size * 2.0) return vec3(0.0);
    
    // Galaxy disk plane (tilted)
    vec3 toCenter = dir - center;
    vec3 tiltAxis = normalize(hash33(vec3(seed * 100.0)) - 0.5);
    
    // Project onto disk
    float diskDist = length(toCenter - tiltAxis * dot(toCenter, tiltAxis));
    float heightDist = abs(dot(toCenter, tiltAxis));
    
    // Spiral arms (simplified)
    float angle = atan(toCenter.y, toCenter.x);
    float spiral = sin(angle * 2.0 + diskDist * 20.0 / size + seed * TAU) * 0.5 + 0.5;
    
    // Disk profile
    float disk = exp(-diskDist * 8.0 / size) * exp(-heightDist * 40.0 / size);
    
    // Core bulge
    float bulge = exp(-dist * 15.0 / size) * 0.8;
    
    float brightness = (disk * (0.3 + spiral * 0.7) + bulge) * 0.15;
    
    // Warm galaxy color
    vec3 galaxyColor = mix(vec3(1.0, 0.9, 0.7), vec3(0.9, 0.85, 1.0), seedHash(seed + 0.5));
    
    return galaxyColor * brightness;
}

// =============================================================================
// STAR SCINTILLATION
// =============================================================================

float starScintillation(float baseIntensity, float starHash, float time) {
    if (baseIntensity < 0.5) return baseIntensity;
    
    float scint = 1.0;
    scint += 0.03 * sin(time * 1.5 + starHash * TAU);
    scint += 0.02 * sin(time * 2.7 + starHash * TAU * 1.3);
    return baseIntensity * scint;
}

// =============================================================================
// MAIN IMAGE
// =============================================================================

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);
    
    // === MOUSE INTERACTION ===
    float yaw = 0.0;
    float pitch = 0.0;
    
    if (iMouse.z > 0.0) {
        yaw = (iMouse.x / iResolution.x - 0.5) * TAU;
        pitch = (iMouse.y / iResolution.y - 0.5) * PI * 0.8;
    } else {
        yaw = iTime * 0.04;
        pitch = sin(iTime * 0.025) * 0.25;
    }
    
    // === SEED GENERATION ===
    float uSeed;
    if (iMouse.z > 0.0 || iMouse.w != 0.0) {
        float clickX = iMouse.z;
        float clickY = abs(iMouse.w);
        uSeed = seedHash(clickX * 0.0073 + clickY * 0.0129 + 1.0);
    } else {
        uSeed = 0.42;
    }
    
    // === RAY DIRECTION ===
    mat3 rot = rotationMatrix(yaw, pitch);
    vec3 dir = rot * normalize(vec3(uv, 1.0));
    
    float time = mod(iTime * TIME_SCALE, 1000.0);
    float realTime = iTime;
    
    // Seed-based parameters
    float sh1 = seedHash(uSeed);
    float sh2 = seedHash(uSeed + 1.0);
    float sh3 = seedHash(uSeed + 2.0);
    float sh4 = seedHash(uSeed + 3.0);
    float sh5 = seedHash(uSeed + 4.0);
    float sh6 = seedHash(uSeed + 5.0);
    
    // Animated position for main nebula
    vec3 animPos = dir + vec3(
        time * FLOW_SPEED * (sh1 - 0.5),
        time * FLOW_SPEED * 0.5,
        time * FLOW_SPEED * (sh2 - 0.5)
    );
    
    // === DEEP SPACE BACKGROUND ===
    vec3 finalColor = vec3(0.005, 0.005, 0.008);
    
    // === DISTANT GALAXIES (very far background) ===
    // Generate 2-4 distant galaxies based on seed
    int numGalaxies = 2 + int(sh5 * 3.0);
    for (int i = 0; i < 4; i++) {
        if (i >= numGalaxies) break;
        
        float galSeed = seedHash(uSeed + float(i) * 7.0 + 100.0);
        vec3 galCenter = normalize(vec3(
            seedHash(galSeed) - 0.5,
            seedHash(galSeed + 0.1) - 0.5,
            seedHash(galSeed + 0.2) - 0.5
        ));
        float galSize = 0.03 + seedHash(galSeed + 0.3) * 0.04;
        
        finalColor += distantGalaxy(dir, galSeed, galCenter, galSize);
    }
    
    // === STARS (behind everything) ===
    float starField = 0.0;
    vec3 starColor = vec3(1.0);
    
    // Bright stars
    vec3 starPos1 = floor(dir * 180.0);
    float starHash1 = seedHash(dot(starPos1, vec3(127.1, 311.7, 74.7)) + uSeed);
    
    if (starHash1 > 0.994) {
        vec3 starCenter = (starPos1 + 0.5) / 180.0;
        float dist = length(dir - normalize(starCenter));
        float star = exp(-dist * 700.0) * (0.6 + starHash1 * 0.4);
        star = starScintillation(star, starHash1, realTime);
        starField = star;
        starColor = starColorFromTemp(seedHash(starHash1 * 77.7));
    }
    
    // Medium stars
    vec3 starPos2 = floor(dir * 300.0);
    float starHash2Val = seedHash(dot(starPos2, vec3(93.1, 157.3, 211.7)) + uSeed * 2.0);
    
    if (starHash2Val > 0.990) {
        vec3 starCenter2 = (starPos2 + 0.5) / 300.0;
        float dist2 = length(dir - normalize(starCenter2));
        float star2 = exp(-dist2 * 900.0) * (0.35 + starHash2Val * 0.35);
        if (star2 > starField) {
            starField = star2;
            starColor = starColorFromTemp(seedHash(starHash2Val * 77.7));
        }
    }
    
    // Faint stars
    vec3 starPos3 = floor(dir * 500.0);
    float starHash3 = seedHash(dot(starPos3, vec3(41.1, 89.3, 173.7)) + uSeed * 3.0);
    if (starHash3 > 0.982) {
        vec3 starCenter3 = (starPos3 + 0.5) / 500.0;
        float dist3 = length(dir - normalize(starCenter3));
        starField = max(starField, exp(-dist3 * 1200.0) * 0.2);
    }
    
    // Very faint stars
    vec3 starPos4 = floor(dir * 800.0);
    float starHash4Val = seedHash(dot(starPos4, vec3(17.3, 43.7, 97.1)) + uSeed * 4.0);
    if (starHash4Val > 0.975) {
        vec3 starCenter4 = (starPos4 + 0.5) / 800.0;
        float dist4 = length(dir - normalize(starCenter4));
        starField = max(starField, exp(-dist4 * 1800.0) * 0.08);
    }
    
    finalColor += starColor * starField;
    
    // === DISTANT GAS CLOUDS (background, different colors) ===
    // Generate 3-6 distant clouds
    int numClouds = 3 + int(sh4 * 4.0);
    for (int i = 0; i < 6; i++) {
        if (i >= numClouds) break;
        
        float cloudSeed = seedHash(uSeed + float(i) * 13.0 + 50.0);
        
        // Position on sphere
        vec3 cloudCenter = normalize(vec3(
            seedHash(cloudSeed) - 0.5,
            seedHash(cloudSeed + 0.1) - 0.5,
            seedHash(cloudSeed + 0.2) - 0.5
        ));
        
        float cloudSize = 0.15 + seedHash(cloudSeed + 0.3) * 0.25;
        
        // Color - contrasting with main nebula
        float cloudHue = fract(sh1 + 0.3 + seedHash(cloudSeed + 0.4) * 0.4);
        vec3 cloudColor = nebulaEmissionColor(cloudHue, seedHash(cloudSeed + 0.5));
        
        vec4 cloud = distantGasCloud(dir, cloudSeed, cloudCenter, cloudSize, cloudColor);
        finalColor = mix(finalColor, finalColor + cloud.rgb, cloud.a);
    }
    
    // === DARK NEBULAE (Bok globules) ===
    float totalDarkness = 0.0;
    int numDark = 2 + int(sh6 * 3.0);
    for (int i = 0; i < 4; i++) {
        if (i >= numDark) break;
        
        float darkSeed = seedHash(uSeed + float(i) * 17.0 + 200.0);
        vec3 darkCenter = normalize(vec3(
            seedHash(darkSeed) - 0.5,
            seedHash(darkSeed + 0.1) - 0.5,
            seedHash(darkSeed + 0.2) - 0.5
        ));
        float darkSize = 0.05 + seedHash(darkSeed + 0.3) * 0.1;
        
        totalDarkness += darkNebula(dir, darkSeed, darkCenter, darkSize);
    }
    totalDarkness = min(totalDarkness, 1.0);
    
    // === MAIN NEBULA ===
    vec3 nebulaColor = vec3(0.0);
    float nebulaAlpha = 0.0;
    
    vec3 lightDir = normalize(vec3(sh1 - 0.5, 0.3, sh2 - 0.5));
    
    // Base density
    float mainDensity = nebulaDensity(animPos * 2.0, sh1);
    float offsetDensity = nebulaDensity(animPos * 2.0 + lightDir * 0.15, sh1);
    float density = mainDensity * 0.65 + offsetDensity * 0.35;
    
    // === HETEROGENEOUS DENSITY ===
    // Apply large-scale variation (bright regions vs dim regions)
    float variation = densityVariation(animPos, sh1);
    density *= 0.3 + variation * 1.2; // Range from very faint to very bright
    
    // Apply voids - carve out empty regions
    float voids = voidMask(animPos, sh2);
    density *= voids;
    
    // Add bright emission regions
    float brightSpots = brightRegions(animPos, sh3);
    density += brightSpots * 0.4;
    
    float cloudMask = smoothstep(DENSITY_THRESHOLD, DENSITY_THRESHOLD + DENSITY_FALLOFF, density);
    cloudMask *= 0.85;
    
    // === COLOR VARIATION ACROSS NEBULA ===
    // Different regions have different dominant colors
    float colorNoise = fbm3D(animPos * 1.2 + vec3(sh3 * 10.0), 3);
    colorNoise = colorNoise * 0.5 + 0.5;
    
    // Regional color shifts - some areas more red, some more blue/teal
    float regionalHue = fbm3D(animPos * 0.4 + sh4 * 20.0, 2) * 0.3;
    float hue = fract(sh1 + colorNoise * COLOR_VARIATION + regionalHue);
    nebulaColor = nebulaEmissionColor(hue, colorNoise);
    
    // === BRIGHTNESS VARIATION ===
    float brightness = BRIGHTNESS_BASE + cloudMask * BRIGHTNESS_RANGE;
    brightness *= 0.85 + sh4 * 0.3;
    
    // Bright regions get extra boost
    brightness *= 0.6 + brightSpots * 0.8;
    
    // Variation makes some areas extra bright
    brightness *= 0.7 + variation * 0.6;
    
    nebulaColor *= brightness;
    
    // Structure
    float structure = fbm3D(animPos * 4.0, 2) * 0.5 + 0.5;
    nebulaColor *= 0.85 + structure * 0.3;
    
    // Edge glow (ionization fronts at density boundaries)
    float edgeGlow = pow(cloudMask, 0.6) - pow(cloudMask, 1.8);
    nebulaColor += nebulaColor * edgeGlow * 0.5;
    
    // Bright regions have extra edge glow
    float brightEdge = pow(max(brightSpots - 0.2, 0.0), 0.5);
    nebulaColor += nebulaEmissionColor(hue + 0.1, 0.8) * brightEdge * 0.3;
    
    // Dust lanes - dark filaments
    float dustLane = fbm3D(animPos * 1.5 + vec3(sh2 * 5.0), 3);
    dustLane = smoothstep(0.2, 0.5, dustLane);
    nebulaColor *= 0.5 + dustLane * 0.5;
    
    // Void regions should be very dark
    nebulaColor *= 0.2 + voids * 0.8;
    
    nebulaAlpha = cloudMask * 0.7 * voids;
    
    // === BRIGHT EMISSION KNOTS (within main nebula) ===
    int numKnots = 2 + int(sh3 * 4.0);
    for (int i = 0; i < 5; i++) {
        if (i >= numKnots) break;
        
        float knotSeed = seedHash(uSeed + float(i) * 23.0 + 300.0);
        
        // Position knots within nebula region
        vec3 knotCenter = normalize(vec3(
            (seedHash(knotSeed) - 0.5) * 0.8,
            (seedHash(knotSeed + 0.1) - 0.5) * 0.8,
            0.5 + seedHash(knotSeed + 0.2) * 0.3
        ));
        
        float knotSize = 0.02 + seedHash(knotSeed + 0.3) * 0.03;
        
        // Bright contrasting color
        float knotHue = fract(sh1 + 0.15 + seedHash(knotSeed + 0.4) * 0.2);
        vec3 knotColor = nebulaEmissionColor(knotHue, 0.7);
        knotColor *= 1.5; // Brighter
        
        vec4 knot = emissionKnot(dir, knotSeed, knotCenter, knotSize, knotColor);
        nebulaColor += knot.rgb;
        nebulaAlpha = max(nebulaAlpha, knot.a);
    }
    
    // === COMBINE NEBULA WITH BACKGROUND ===
    float obscuration = nebulaAlpha * 0.8;
    finalColor = mix(finalColor, nebulaColor, obscuration);
    
    // Stars punch through slightly
    finalColor += starColor * starField * (1.0 - obscuration) * 0.3;
    
    // === APPLY DARK NEBULAE ===
    finalColor *= 1.0 - totalDarkness * 0.85;
    
    // === FINAL ADJUSTMENTS ===
    float vignette = 1.0 - length(uv) * 0.12;
    finalColor *= vignette;
    
    finalColor = pow(max(finalColor, 0.0), vec3(0.95));
    
    fragColor = vec4(finalColor, 1.0);
}
