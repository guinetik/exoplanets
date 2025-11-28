/**
 * Shared Noise Functions for V2 Shaders
 * 
 * Provides:
 * - 2D/3D Simplex noise
 * - Value noise (faster, less quality)
 * - Fractional Brownian Motion (FBM) with domain warping
 * - Tiled noise for seamless patterns
 * 
 * Based on techniques from Morgan McGuire, Inigo Quilez, and others
 */

// =============================================================================
// PRECISION QUALIFIERS (Critical for Chrome/ANGLE compatibility)
// =============================================================================
// Chrome uses ANGLE which translates WebGL to DirectX. Without explicit
// precision, floating-point errors can cause flickering artifacts.

#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// =============================================================================
// TIME UTILITIES (Prevent precision loss from large time values)
// =============================================================================

/**
 * Wrap time value to prevent floating-point precision loss
 * Large time values cause flickering in Chrome/ANGLE
 * 
 * @param t - Raw time value (potentially very large)
 * @return Wrapped time in safe range [0, 1000)
 */
float wrapTime(float t) {
    return mod(t, 1000.0);
}

/**
 * Create a stable time coordinate for noise sampling
 * Combines position-based offset with wrapped time
 * 
 * @param baseTime - Raw time value
 * @param spatialSeed - Position-based value to offset time
 * @return Stable time coordinate
 */
float stableTime(float baseTime, float spatialSeed) {
    return fract(baseTime * 0.001 + spatialSeed) * 100.0;
}

// =============================================================================
// MATHEMATICAL CONSTANTS
// =============================================================================

// --- Modular Arithmetic ---
const float MOD_DIVISOR = 289.0;                        // Large prime for permutation wrapping

// --- Simplex Noise Algorithm Constants ---
// Derived from the geometry of the simplex (equilateral triangle in 2D)
const float SIMPLEX_SKEW_2D = 0.366025403784439;        // (3 - sqrt(3)) / 6 - skews square to rhombus
const float SIMPLEX_UNSKEW_2D = 0.211324865405187;      // (3 - sqrt(3)) / 6 - unskews back
const float SIMPLEX_CORNER_OFFSET = -0.577350269189626; // -1 + 2 * SIMPLEX_UNSKEW_2D
const float SIMPLEX_GRADIENT_SCALE = 0.024390243902439; // 1/41 for gradient distribution

// --- Taylor Series Approximation ---
// Used for fast inverse square root in noise normalization
const float TAYLOR_INV_SQRT_A = 1.79284291400159;       // First coefficient
const float TAYLOR_INV_SQRT_B = 0.85373472095314;       // Second coefficient

// --- Noise Output Scaling ---
const float NOISE_OUTPUT_SCALE_2D = 130.0;              // Scales 2D noise to roughly [-1, 1]
const float NOISE_OUTPUT_SCALE_3D = 42.0;               // Scales 3D noise to roughly [-1, 1]

// --- Gradient Threshold ---
const float GRADIENT_FALLOFF_THRESHOLD = 0.5;           // Distance threshold for gradient contribution

// --- Hash Function Constants ---
// Prime-based stepping for 3D value noise
const vec3 HASH_STEP = vec3(110.0, 241.0, 171.0);
const float HASH_MULT = 0.011;                          // Multiplier for initial hash

// --- FBM Defaults ---
const float FBM_LACUNARITY = 2.0;                       // Frequency multiplier per octave
const float FBM_PERSISTENCE = 0.5;                      // Amplitude multiplier per octave
const int FBM_MAX_OCTAVES = 8;                          // Maximum octaves to prevent GPU hangs

// --- Domain Warping ---
const float WARP_STRENGTH = 0.5;                        // Default warp displacement strength
const float WARP_SCALE = 4.0;                           // Scale of the warping noise

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Modular arithmetic for permutation (prevents overflow)
 */
vec3 mod289_3(vec3 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec2 mod289_2(vec2 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec4 mod289_4(vec4 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

/**
 * Permutation polynomial for pseudo-random distribution
 * p(x) = (x * 34 + 1) * x mod 289
 */
vec3 permute_3(vec3 x) {
    return mod289_3(((x * 34.0) + 1.0) * x);
}

vec4 permute_4(vec4 x) {
    return mod289_4(((x * 34.0) + 1.0) * x);
}

/**
 * Fast inverse square root approximation using Taylor series
 */
vec4 taylorInvSqrt(vec4 r) {
    return TAYLOR_INV_SQRT_A - TAYLOR_INV_SQRT_B * r;
}

/**
 * Simple hash function for value noise
 */
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float hash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

// =============================================================================
// 2D SIMPLEX NOISE
// =============================================================================

/**
 * 2D Simplex noise
 * Returns value in range [-1, 1]
 * 
 * @param v - 2D input coordinate
 * @return Noise value
 */
float snoise2D(vec2 v) {
    // Skew input space to determine which simplex cell we're in
    vec2 i = floor(v + dot(v, vec2(SIMPLEX_SKEW_2D)));
    vec2 x0 = v - i + dot(i, vec2(SIMPLEX_UNSKEW_2D));
    
    // Determine which simplex we're in (lower or upper triangle)
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    
    // Offset corners
    vec4 x12 = x0.xyxy + vec4(SIMPLEX_UNSKEW_2D, SIMPLEX_UNSKEW_2D, 
                              SIMPLEX_CORNER_OFFSET, SIMPLEX_CORNER_OFFSET);
    x12.xy -= i1;
    
    // Permutations
    i = mod289_2(i);
    vec3 p = permute_3(permute_3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    
    // Calculate contribution from each corner
    vec3 m = max(GRADIENT_FALLOFF_THRESHOLD - vec3(dot(x0, x0), dot(x12.xy, x12.xy), 
                                                    dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    
    // Gradients
    vec3 x = 2.0 * fract(p * SIMPLEX_GRADIENT_SCALE) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    
    // Normalize gradients
    m *= taylorInvSqrt(vec4(a0 * a0 + h * h, 0.0)).xyz;
    
    // Compute final noise value
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    
    return NOISE_OUTPUT_SCALE_2D * dot(m, g);
}

// =============================================================================
// 3D SIMPLEX NOISE
// =============================================================================

/**
 * 3D Simplex noise
 * Returns value in range [-1, 1]
 * 
 * @param v - 3D input coordinate
 * @return Noise value
 */
float snoise3D(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    // Permutations
    i = mod289_3(i);
    vec4 p = permute_4(permute_4(permute_4(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    // Gradients
    float n_ = 0.142857142857; // 1/7
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
    
    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    
    return NOISE_OUTPUT_SCALE_3D * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// =============================================================================
// VALUE NOISE (faster but lower quality)
// =============================================================================

/**
 * 3D Value noise - faster than simplex, good for less critical details
 * Returns value in range [0, 1]
 * 
 * @param x - 3D input coordinate
 * @return Noise value
 */
float vnoise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    
    // Cubic Hermite interpolation (smoother than linear)
    f = f * f * (3.0 - 2.0 * f);
    
    float n = dot(i, HASH_STEP);
    
    return mix(
        mix(mix(hash(n + dot(HASH_STEP, vec3(0, 0, 0))), 
                hash(n + dot(HASH_STEP, vec3(1, 0, 0))), f.x),
            mix(hash(n + dot(HASH_STEP, vec3(0, 1, 0))), 
                hash(n + dot(HASH_STEP, vec3(1, 1, 0))), f.x), f.y),
        mix(mix(hash(n + dot(HASH_STEP, vec3(0, 0, 1))), 
                hash(n + dot(HASH_STEP, vec3(1, 0, 1))), f.x),
            mix(hash(n + dot(HASH_STEP, vec3(0, 1, 1))), 
                hash(n + dot(HASH_STEP, vec3(1, 1, 1))), f.x), f.y), f.z
    );
}

// =============================================================================
// TILED NOISE (for stars - based on trisomie21's technique)
// =============================================================================

// --- Tiled Noise Constants ---
const vec3 TILED_SCALE = vec3(1.0, 100.0, 10000.0);  // Scales for x, y, z components
const float TILED_SIN_SCALE = 0.001;                  // Sin input scaling
const float TILED_SIN_MULT = 100000.0;                // Sin output multiplier

/**
 * Tiled 3D noise that wraps at resolution boundaries
 * Good for seamless flame/fire effects on spheres
 * Returns value in range [-1, 1]
 * 
 * @param uv - 3D input coordinate
 * @param res - Resolution for tiling
 * @return Noise value
 */
float tiledNoise3D(vec3 uv, float res) {
    uv *= res;
    
    vec3 uv0 = floor(mod(uv, res)) * TILED_SCALE;
    vec3 uv1 = floor(mod(uv + vec3(1.0), res)) * TILED_SCALE;
    
    vec3 f = fract(uv);
    f = f * f * (3.0 - 2.0 * f);  // Smoothstep interpolation
    
    vec4 v = vec4(uv0.x + uv0.y + uv0.z, uv1.x + uv0.y + uv0.z,
                  uv0.x + uv1.y + uv0.z, uv1.x + uv1.y + uv0.z);
    
    vec4 r = fract(sin(v * TILED_SIN_SCALE) * TILED_SIN_MULT);
    float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    
    r = fract(sin((v + uv1.z - uv0.z) * TILED_SIN_SCALE) * TILED_SIN_MULT);
    float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    
    return mix(r0, r1, f.z) * 2.0 - 1.0;
}

// =============================================================================
// FRACTIONAL BROWNIAN MOTION (FBM)
// =============================================================================

/**
 * FBM using 2D Simplex noise
 * Combines multiple octaves for natural-looking patterns
 * 
 * @param p - 2D input coordinate
 * @param octaves - Number of octaves (1-8)
 * @return FBM value (roughly in range [-1, 1])
 */
float fbm2D(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = FBM_PERSISTENCE;
    float frequency = 1.0;
    
    for (int i = 0; i < FBM_MAX_OCTAVES; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise2D(p * frequency);
        frequency *= FBM_LACUNARITY;
        amplitude *= FBM_PERSISTENCE;
    }
    
    return value;
}

/**
 * FBM using 3D Simplex noise
 * 
 * @param p - 3D input coordinate
 * @param octaves - Number of octaves (1-8)
 * @return FBM value (roughly in range [-1, 1])
 */
float fbm3D(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = FBM_PERSISTENCE;
    float frequency = 1.0;
    vec3 shift = vec3(100.0);  // Offset per octave to reduce artifacts
    
    for (int i = 0; i < FBM_MAX_OCTAVES; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise3D(p * frequency);
        p += shift;
        frequency *= FBM_LACUNARITY;
        amplitude *= FBM_PERSISTENCE;
    }
    
    return value;
}

/**
 * FBM using value noise (faster)
 * 
 * @param p - 3D input coordinate
 * @param octaves - Number of octaves (1-8)
 * @return FBM value (roughly in range [0, 1])
 */
float fbmValue3D(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = FBM_PERSISTENCE;
    float frequency = 1.0;
    vec3 shift = vec3(100.0);
    
    for (int i = 0; i < FBM_MAX_OCTAVES; i++) {
        if (i >= octaves) break;
        value += amplitude * vnoise3D(p * frequency);
        p += shift;
        frequency *= FBM_LACUNARITY;
        amplitude *= FBM_PERSISTENCE;
    }
    
    return value;
}

// =============================================================================
// DOMAIN WARPING
// =============================================================================

/**
 * Domain-warped FBM for more organic, flowing patterns
 * Uses one noise to offset the input of another
 * 
 * @param p - 3D input coordinate
 * @param octaves - Number of octaves for base FBM
 * @param warpStrength - How much to warp (0 = none, 1 = strong)
 * @return Warped FBM value
 */
float fbmWarped3D(vec3 p, int octaves, float warpStrength) {
    // First pass: generate warp offset
    vec3 q = vec3(
        fbm3D(p, 3),
        fbm3D(p + vec3(5.2, 1.3, 2.8), 3),
        fbm3D(p + vec3(1.7, 9.2, 4.1), 3)
    );
    
    // Second pass: sample with warped coordinates
    return fbm3D(p + q * warpStrength * WARP_SCALE, octaves);
}

/**
 * Double domain warping for even more complex patterns
 * Good for gas giant atmospheres and cloud formations
 * 
 * @param p - 3D input coordinate
 * @param octaves - Number of octaves
 * @return Double-warped FBM value
 */
float fbmDoubleWarped3D(vec3 p, int octaves) {
    // First warp layer
    vec3 q = vec3(
        fbm3D(p, 4),
        fbm3D(p + vec3(5.2, 1.3, 2.8), 4),
        fbm3D(p + vec3(1.7, 9.2, 4.1), 4)
    );
    
    // Second warp layer
    vec3 r = vec3(
        fbm3D(p + WARP_SCALE * q + vec3(1.7, 9.2, 0.0), 4),
        fbm3D(p + WARP_SCALE * q + vec3(8.3, 2.8, 0.0), 4),
        fbm3D(p + WARP_SCALE * q + vec3(2.1, 6.4, 0.0), 4)
    );
    
    return fbm3D(p + WARP_SCALE * r, octaves);
}

