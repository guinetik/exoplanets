/**
 * Planetary Rings Fragment Shader
 * Creates thin, sharp concentric ring bands
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

float hash1(float p) {
    return fract(sin(p * 127.1) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Sharp step function - creates hard edges
float sharpStep(float edge, float x, float sharpness) {
    return clamp((x - edge) * sharpness, 0.0, 1.0);
}

void main() {
    // Use properly calculated radial position (0 = inner, 1 = outer)
    float r = clamp(vRadialPos, 0.0, 1.0);
    float angle = vAngle + uTime * 0.01;

    // === GENERATE MANY THIN CONCENTRIC RING BANDS ===
    float ringDensity = 0.0;

    // More rings! 8-15 thin bands
    float numRings = 8.0 + floor(uSeed * 8.0);
    float seedBase = uSeed * 100.0;

    // Evenly distribute rings across the radial space
    float margin = 0.05;
    float availableSpace = 1.0 - 2.0 * margin;
    float spacing = availableSpace / numRings;

    for (float i = 0.0; i < 16.0; i++) {
        if (i >= numRings) break;

        // Place ring in its designated slot with small random offset
        float slotCenter = margin + spacing * (i + 0.5);
        float randomOffset = (hash1(seedBase + i * 7.1) - 0.5) * spacing * 0.4;
        float ringCenter = slotCenter + randomOffset;

        // Very thin rings! 0.01-0.04
        float ringWidth = 0.01 + hash1(seedBase + i * 13.3) * 0.03;

        // Sharp edges
        float innerEdge = sharpStep(ringCenter - ringWidth * 0.5, r, 300.0);
        float outerEdge = 1.0 - sharpStep(ringCenter + ringWidth * 0.5, r, 300.0);

        float ring = innerEdge * outerEdge;

        // Vary opacity per ring
        float ringOpacity = 0.5 + hash1(seedBase + i * 19.7) * 0.5;
        ringDensity = max(ringDensity, ring * ringOpacity);
    }

    // === SANDY PARTICLE TEXTURE ===
    // Large scale clumping
    float clumps = noise(vec2(r * 50.0 + uSeed * 10.0, angle * 8.0));
    clumps = smoothstep(0.2, 0.6, clumps);

    // Medium grain - creates visible gaps
    float medGrain = noise(vec2(r * 200.0 + uSeed * 30.0, angle * 40.0));
    medGrain = smoothstep(0.35, 0.65, medGrain);

    // Fine sand particles
    float fineGrain = noise(vec2(r * 500.0, angle * 100.0 + uSeed * 70.0));
    fineGrain = smoothstep(0.3, 0.7, fineGrain);

    // Combine all layers for sandy porous look
    float sandy = clumps * medGrain * (0.5 + fineGrain * 0.5);
    ringDensity *= sandy;

    // === ANGULAR VARIATION ===
    float angularVar = noise(vec2(sin(angle) * 5.0 + uSeed * 30.0, r * 10.0));
    ringDensity *= 0.9 + angularVar * 0.1;

    // === EDGE CLEANUP ===
    float edgeFade = smoothstep(0.0, 0.02, r) * (1.0 - smoothstep(0.98, 1.0, r));
    ringDensity *= edgeFade;

    // === COLOR ===
    vec3 col = uRingColor;

    // Radial color variation - inner rings slightly warmer, outer cooler
    col.r += (r - 0.5) * 0.2;
    col.g += (r - 0.5) * 0.05;
    col.b -= (r - 0.5) * 0.15;

    // Per-ring color tint variation
    float colorVar = noise(vec2(r * 30.0 + uSeed * 50.0, 0.0));
    col.r *= 0.85 + colorVar * 0.3;
    col.b *= 0.9 + (1.0 - colorVar) * 0.2;

    // Brightness variation from sandy texture
    col *= 0.8 + sandy * 0.4;

    // Angular brightness variation
    col *= 0.9 + angularVar * 0.15;

    // Ice/dust sparkle
    float sparkle = pow(noise(vec2(r * 300.0, angle * 60.0)), 5.0);
    col += uRingColor * sparkle * 0.4;

    // Insolation brightness
    col *= 0.6 + uInsolation * 0.6;

    // === FINAL OUTPUT ===
    // More transparent rings
    float opacity = ringDensity * (0.3 + uDensity * 0.25);
    opacity = clamp(opacity, 0.0, 0.6); // Max 60% opacity

    // Hard cutoff for gaps
    if (ringDensity < 0.1) {
        opacity = 0.0;
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.2), opacity);
}
