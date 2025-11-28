/**
 * Nebula Background Shadertoy Demo
 * 
 * Click to generate a new nebula with random seed.
 * Drag mouse to rotate the view around the nebula.
 * 
 * Copy this code to Shadertoy.com to run it.
 * 
 * Based on "Type 2 Supernova" by Duke and adapted for interactive demo.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

#define PI 3.14159265359
#define TAU 6.28318530718

// Nebula structure
const float NEBULA_SCALE = 0.5;
const float NEBULA_DETAIL = 2.0;
const int SPIRAL_NOISE_ITER = 4;
const float NUDGE = 3.0;

// Animation
const float TIME_SCALE = 0.01;
const float FLOW_SPEED = 0.05;

// Density
const float DENSITY_THRESHOLD = 0.1;
const float DENSITY_FALLOFF = 0.5;

// Colors
const float COLOR_VARIATION = 0.3;
const float BRIGHTNESS_BASE = 0.4;
const float BRIGHTNESS_RANGE = 0.6;

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

/**
 * Stable seed hash using fract-based technique (Dave Hoskins)
 * Avoids sin() precision issues
 */
float seedHash(float seed) {
    vec3 p3 = fract(vec3(seed) * vec3(HASH_K1, HASH_K2, HASH_K3));
    p3 += dot(p3, p3.yzx + HASH_K4);
    return fract((p3.x + p3.y) * p3.z);
}

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
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

/**
 * 3D Simplex noise
 */
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

/**
 * FBM using 3D Simplex noise
 */
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
// SPIRAL NOISE (creates organic, swirling cloud structures)
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
// NEBULA DENSITY FIELD
// =============================================================================

float nebulaDensity(vec3 p, float seed) {
    float k = 1.5 + seed * 0.5;
    float spiral = spiralNoise(p * NEBULA_SCALE, seed);
    float detail = fbm3D(p * NEBULA_DETAIL, 3) * 0.3;
    return k * (0.5 + spiral * 0.5 + detail);
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
// MAIN IMAGE
// =============================================================================

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates (centered, aspect-corrected)
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);
    
    // === MOUSE INTERACTION ===
    // iMouse.z > 0 when mouse button is currently pressed (dragging)
    // When released, z becomes 0 and we resume auto-rotation
    
    float yaw = 0.0;
    float pitch = 0.0;
    
    if (iMouse.z > 0.0) {
        // Mouse is being dragged - use mouse position for rotation
        yaw = (iMouse.x / iResolution.x - 0.5) * TAU;
        pitch = (iMouse.y / iResolution.y - 0.5) * PI * 0.8;
    } else {
        // Mouse released or no interaction - slow auto-rotation
        yaw = iTime * 0.05;
        pitch = sin(iTime * 0.03) * 0.3;
    }
    
    // === SEED GENERATION ===
    // In Shadertoy:
    // - iMouse.z stores the X position where the mouse was CLICKED (not dragged)
    // - iMouse.w stores the Y position where the mouse was CLICKED
    // These values persist while dragging, so the seed stays stable during rotation.
    // The seed only changes when you click at a NEW location.
    
    float uSeed;
    if (iMouse.z > 0.0 || iMouse.w != 0.0) {
        // Use the CLICK position (z,w) not the current drag position (x,y)
        // This keeps the nebula stable while rotating
        float clickX = iMouse.z;
        float clickY = abs(iMouse.w);
        uSeed = seedHash(clickX * 0.0073 + clickY * 0.0129 + 1.0);
    } else {
        // No click yet - use a default seed
        uSeed = 0.42;
    }
    
    // === CREATE RAY DIRECTION ===
    // Create a direction vector for this pixel (like looking into a sphere)
    vec3 dir = normalize(vec3(uv, 1.0));
    
    // Apply rotation based on mouse
    mat3 rot = rotationMatrix(yaw, pitch);
    dir = rot * dir;
    
    // Wrap time for precision
    float time = mod(iTime * TIME_SCALE, 1000.0);
    
    // Generate seed-based parameters
    float seedHash1 = seedHash(uSeed);
    float seedHash2 = seedHash(uSeed + 1.0);
    float seedHash3 = seedHash(uSeed + 2.0);
    float seedHash4 = seedHash(uSeed + 3.0);
    
    // Animate position
    vec3 animPos = dir + vec3(
        time * FLOW_SPEED * (seedHash1 - 0.5),
        time * FLOW_SPEED * 0.5,
        time * FLOW_SPEED * (seedHash2 - 0.5)
    );
    
    // === NEBULA CLOUDS ===
    vec4 nebula = vec4(0.0);
    
    float uDensity = 0.8; // Overall nebula density
    
    if (uDensity > 0.01) {
        float density = 0.0;
        vec3 lightDir = normalize(vec3(seedHash1 - 0.5, 0.3, seedHash2 - 0.5));
        
        float mainDensity = nebulaDensity(animPos * 2.0, seedHash1);
        float offsetDensity = nebulaDensity(animPos * 2.0 + lightDir * 0.1, seedHash1);
        
        density = mainDensity * 0.7 + offsetDensity * 0.3;
        
        float cloudMask = smoothstep(DENSITY_THRESHOLD, DENSITY_THRESHOLD + DENSITY_FALLOFF, density);
        cloudMask *= uDensity;
        
        // === COLOR ===
        float colorNoise = fbm3D(animPos * 1.5 + vec3(seedHash3 * 10.0), 2);
        colorNoise = colorNoise * 0.5 + 0.5;
        
        float hue = seedHash1 + colorNoise * COLOR_VARIATION;
        float saturation = 0.4 + seedHash2 * 0.4;
        saturation *= (1.0 - cloudMask * 0.3);
        
        float value = BRIGHTNESS_BASE + cloudMask * BRIGHTNESS_RANGE;
        value *= 0.8 + seedHash4 * 0.4;
        
        vec3 nebulaColor = hsv2rgb(hue, saturation, value);
        
        // Primary and secondary colors based on seed
        vec3 uPrimaryColor = hsv2rgb(seedHash1, 0.7, 0.9);
        vec3 uSecondaryColor = hsv2rgb(seedHash1 + 0.3, 0.6, 0.8);
        
        nebulaColor = mix(nebulaColor, uPrimaryColor, 0.3);
        nebulaColor = mix(nebulaColor, uSecondaryColor, colorNoise * 0.2);
        
        // Edge glow effect
        float edgeGlow = pow(cloudMask, 0.5) - pow(cloudMask, 2.0);
        nebulaColor += uPrimaryColor * edgeGlow * 0.5;
        
        // Internal lighting variation
        float internalLight = fbm3D(animPos * 3.0 + vec3(time * 0.5), 2);
        nebulaColor *= 0.8 + internalLight * 0.4;
        
        nebula = vec4(nebulaColor, cloudMask * 0.5);
    }
    
    // === BACKGROUND STARS (sparse, for depth) ===
    float starField = 0.0;
    
    vec3 starPos = floor(dir * 200.0);
    float starHash = seedHash(dot(starPos, vec3(127.1, 311.7, 74.7)) + uSeed);
    
    if (starHash > 0.995) {
        vec3 starCenter = (starPos + 0.5) / 200.0;
        float dist = length(dir - normalize(starCenter));
        starField = exp(-dist * 800.0) * (0.5 + starHash * 0.5);
    }
    
    // Star color varies with hash
    vec3 starColor = vec3(1.0);
    if (starField > 0.0) {
        float colorHash = seedHash(starHash * 100.0);
        if (colorHash < 0.3) {
            starColor = vec3(1.0, 0.9, 0.8); // Warm
        } else if (colorHash < 0.6) {
            starColor = vec3(0.9, 0.95, 1.0); // Cool
        }
    }
    
    // === MORE BACKGROUND STARS (denser layer) ===
    vec3 starPos2 = floor(dir * 400.0);
    float starHash2 = seedHash(dot(starPos2, vec3(93.1, 157.3, 211.7)) + uSeed * 2.0);
    
    if (starHash2 > 0.992) {
        vec3 starCenter2 = (starPos2 + 0.5) / 400.0;
        float dist2 = length(dir - normalize(starCenter2));
        float star2 = exp(-dist2 * 1200.0) * (0.3 + starHash2 * 0.3);
        starField = max(starField, star2 * 0.5);
    }
    
    // === COMBINE ===
    vec3 finalColor = nebula.rgb;
    float finalAlpha = nebula.a;
    
    // Add stars behind nebula
    finalColor += starColor * starField * (1.0 - nebula.a * 0.5);
    finalAlpha = max(finalAlpha, starField * 0.8);
    
    // Deep space background color (very dark blue-purple)
    vec3 bgColor = hsv2rgb(seedHash1 + 0.6, 0.3, 0.02);
    
    // Blend with background
    finalColor = mix(bgColor, finalColor, finalAlpha + 0.1);
    
    // Vignette effect
    float vignette = 1.0 - length(uv) * 0.4;
    finalColor *= vignette;
    
    // Gamma correction
    finalColor = pow(finalColor, vec3(0.85));
    
    fragColor = vec4(finalColor, 1.0);
}

