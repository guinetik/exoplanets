/**
 * Planetary Rings Fragment Shader
 * Creates dusty, particle-like ring bands with visible grain
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uSeed;
uniform float uDensity;
uniform float uInsolation;
uniform vec3 uRingColor;
uniform float uInnerRadius;
uniform float uOuterRadius;

varying vec2 vUv;
varying vec3 vPosition;
varying float vRadialPos;  // 0 at inner edge, 1 at outer edge
varying float vAngle;      // 0 to 2PI around ring

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// Fast hash functions for particle generation
float hash1(float p) {
    return fract(sin(p * 127.1) * 43758.5453);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Standard noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash2(i);
    float b = hash2(i + vec2(1.0, 0.0));
    float c = hash2(i + vec2(0.0, 1.0));
    float d = hash2(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    float r = clamp(vRadialPos, 0.0, 1.0);
    float angle = vAngle;
    float seedBase = uSeed * 100.0;

    // === RING BAND STRUCTURE ===
    // Create broad ring zones (like Saturn's A, B, C rings)
    float ringDensity = 0.0;
    float numRings = 5.0 + floor(uSeed * 4.0);  // 5-8 main ring bands
    float margin = 0.03;
    float availableSpace = 1.0 - 2.0 * margin;

    for (float i = 0.0; i < 9.0; i++) {
        if (i >= numRings) break;

        // Ring position and width
        float ringPos = margin + (i + 0.5) / numRings * availableSpace;
        ringPos += (hash1(seedBase + i * 7.1) - 0.5) * 0.08;
        float ringWidth = 0.04 + hash1(seedBase + i * 13.3) * 0.08;

        // Soft gaussian-ish falloff instead of hard edges
        float dist = abs(r - ringPos);
        float ring = exp(-dist * dist / (ringWidth * ringWidth * 0.5));

        // Vary intensity per ring
        float ringIntensity = 0.4 + hash1(seedBase + i * 19.7) * 0.6;
        ringDensity = max(ringDensity, ring * ringIntensity);
    }

    // === PARTICLE/DUST TEXTURE ===
    // Layer 1: Large particle clumps - noise based
    float clumpScale = 60.0;
    float clumps = noise(vec2(r * clumpScale + seedBase, angle * clumpScale * 0.3));
    clumps = 0.5 + clumps * 0.5;  // Range 0.5-1.0

    // Layer 2: Medium debris/rocks
    float medScale = 200.0;
    float medDebris = noise(vec2(r * medScale + seedBase * 2.0, angle * medScale * 0.4));
    medDebris = 0.4 + medDebris * 0.6;  // Range 0.4-1.0

    // Layer 3: Fine dust particles - higher frequency for grainy look
    float dustScale = 600.0;
    float dust = noise(vec2(r * dustScale, angle * dustScale * 0.3 + seedBase * 3.0));
    dust = 0.3 + dust * 0.7;  // Range 0.3-1.0

    // Layer 4: Micro grain - very high frequency
    float microScale = 1500.0;
    float micro = noise(vec2(r * microScale + seedBase * 4.0, angle * microScale * 0.25));
    micro = 0.5 + micro * 0.5;  // Range 0.5-1.0

    // Combine particle layers
    float particleField = clumps * medDebris * dust * micro;

    // Add sparkle for ice particles
    float sparkleNoise = noise(vec2(r * 2000.0 + uTime * 0.5, angle * 500.0));
    float sparkle = pow(sparkleNoise, 6.0);

    // === RADIAL GAPS (Cassini division style) ===
    // Occasional gaps between rings
    float gapNoise = noise(vec2(r * 80.0 + seedBase * 5.0, 0.0));
    float gaps = smoothstep(0.2, 0.35, gapNoise);  // Most areas have rings

    // === ANGULAR STREAKS ===
    float streak = noise(vec2(angle * 3.0 + seedBase, r * 20.0));
    streak = 0.9 + streak * 0.2;

    // === COMBINE EVERYTHING ===
    float finalDensity = ringDensity * particleField * gaps * streak;

    // === EDGE FADE ===
    float edgeFade = smoothstep(0.0, 0.04, r) * (1.0 - smoothstep(0.96, 1.0, r));
    finalDensity *= edgeFade;

    // === COLOR ===
    vec3 col = uRingColor;

    // Radial color gradient (inner warmer, outer cooler like real rings)
    float radialTint = r - 0.5;
    col.r += radialTint * 0.15;
    col.g += radialTint * 0.05;
    col.b -= radialTint * 0.1;

    // Per-particle color variation (some brighter, some darker)
    float colorNoise = noise(vec2(r * 400.0 + seedBase * 7.0, angle * 100.0));
    col *= 0.7 + colorNoise * 0.5;

    // Ice sparkle highlights
    col += vec3(1.0, 0.98, 0.95) * sparkle * 0.8;

    // Dust reddening in dense areas
    float dustTint = (1.0 - particleField) * 0.15;
    col.r += dustTint;
    col.b -= dustTint * 0.5;

    // Insolation (light from star)
    col *= 0.5 + uInsolation * 0.7;

    // === FINAL OUTPUT ===
    float opacity = finalDensity * (0.4 + uDensity * 0.4);
    opacity = clamp(opacity, 0.0, 0.75);

    // Hard cutoff for true gaps
    if (finalDensity < 0.05) {
        opacity = 0.0;
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.5), opacity);
}
