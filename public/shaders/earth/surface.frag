/**
 * Earth Surface Fragment Shader
 * Kepler-inspired procedural planet with atmosphere, clouds, and ice caps
 */

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// Simplex Noise
// =============================================================================

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// =============================================================================
// Main
// =============================================================================

void main() {
    vec3 nPos = normalize(vPosition);

    // ==========================================================================
    // Atmosphere color (kepler-style blue atmosphere)
    // ==========================================================================
    float atmosphereDensity = 1.45 + nPos.z;
    vec3 atmosphereColor = vec3(0.075, 0.35, 0.99) * 0.45;

    // ==========================================================================
    // Generate noise for terrain
    // ==========================================================================
    float noise = snoise(vUv * 2.0) * 0.5;
    noise += snoise(vUv * 4.0) * 0.25;
    noise += snoise(vUv * 8.0) * 0.125;
    noise = noise / 1.875;

    // Detail noise for texture variation
    float detailNoise = snoise(vUv * 16.0) * 0.5 + 0.5;

    // ==========================================================================
    // Ocean (kepler-style deep blue)
    // ==========================================================================
    vec3 deepOcean = vec3(0.02, 0.06, 0.15);
    vec3 shallowOcean = vec3(0.05, 0.12, 0.25);
    vec3 oceanColor = mix(deepOcean, shallowOcean, noise * 0.5);

    // ==========================================================================
    // Land (kepler-style green/brown terrain)
    // ==========================================================================
    float isLand = smoothstep(0.47, 0.57, noise);

    // Green lowlands
    vec3 landGreen = vec3(0.13, 0.65, 0.01) * 0.15;
    // Brown/tan highlands
    vec3 landBrown = vec3(0.8, 0.4, 0.01) * 0.12;

    // Mix based on detail noise
    vec3 landColor = mix(landGreen, landBrown, detailNoise);
    landColor *= (detailNoise * 0.5 + 0.75); // Add texture variation

    // ==========================================================================
    // Ice caps at poles (kepler-style)
    // ==========================================================================
    float iceFactor = pow(abs(nPos.y), 2.0);
    vec3 iceColor = vec3(0.9, 0.92, 0.95) * isLand * 0.8;

    // ==========================================================================
    // Clouds (kepler-style spiral clouds)
    // ==========================================================================
    float cloudNoise1 = snoise(vUv * 6.0);
    float cloudNoise2 = snoise(vUv * 12.0);
    float cloudDensity = max(0.0, pow(cloudNoise1 * cloudNoise2 + 0.5, 0.7) * 1.5);

    // ==========================================================================
    // Combine surface
    // ==========================================================================
    vec3 surfaceColor = mix(oceanColor, landColor, isLand);

    // Add ice at poles
    surfaceColor = mix(surfaceColor, iceColor, iceFactor * isLand);

    // Add atmosphere tint
    vec3 finalAtmosphere = atmosphereColor * atmosphereDensity;
    surfaceColor += finalAtmosphere * 0.15;

    // Add clouds
    surfaceColor = mix(surfaceColor, vec3(0.85, 0.88, 0.92), cloudDensity * 0.5);

    // ==========================================================================
    // City lights on dark side
    // ==========================================================================
    float lightNoise = snoise(vUv * 20.0);
    float cityLights = smoothstep(0.7, 0.9, lightNoise) * isLand * 0.12;
    vec3 cityColor = vec3(1.0, 0.9, 0.6);

    // ==========================================================================
    // Lighting (view from above, sun from the side)
    // ==========================================================================
    float limb = dot(vNormal, vec3(0.0, 1.0, 0.0));
    limb = smoothstep(-0.3, 0.6, limb);
    float lighting = 0.4 + limb * 0.6;

    // Add city lights on darker areas
    float darkSide = 1.0 - limb;
    surfaceColor += cityColor * cityLights * darkSide * 2.0;

    // Apply lighting
    surfaceColor *= lighting;

    gl_FragColor = vec4(surfaceColor, 1.0);
}
