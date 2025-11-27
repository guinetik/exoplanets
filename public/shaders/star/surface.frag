/**
 * Star Surface Fragment Shader
 * Creates a burning star surface with detailed granulation
 * Features:
 * - Bright glowing center with spherical falloff (burning effect)
 * - Outward-flowing flame patterns
 * - Surface granulation and convection cell detail
 * - Procedural generation from star properties
 */

uniform vec3 uStarColor;
uniform float uTime;
uniform float uTemperature;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// NOISE FUNCTIONS
// =============================================================================

// Reference-style noise for flame effects
float snoise(vec3 uv, float res) {
    const vec3 s = vec3(1e0, 1e2, 1e4);

    uv *= res;

    vec3 uv0 = floor(mod(uv, res)) * s;
    vec3 uv1 = floor(mod(uv + vec3(1.0), res)) * s;

    vec3 f = fract(uv);
    f = f * f * (3.0 - 2.0 * f);

    vec4 v = vec4(uv0.x + uv0.y + uv0.z, uv1.x + uv0.y + uv0.z,
            uv0.x + uv1.y + uv0.z, uv1.x + uv1.y + uv0.z);

    vec4 r = fract(sin(v * 1e-3) * 1e5);
    float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

    r = fract(sin((v + uv1.z - uv0.z) * 1e-3) * 1e5);
    float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

    return mix(r0, r1, f.z) * 2.0 - 1.0;
}

// Simplex noise for surface detail
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float simplex3d(vec3 v) {
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

    i = mod289(i);
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

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// FBM for layered detail
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * simplex3d(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value;
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 spherePos = normalize(vPosition);

    // View angle for limb effects
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float viewAngle = max(dot(vNormal, viewDir), 0.0);
    float edgeDist = 1.0 - viewAngle;

    // === BURNING GLOW FACTOR (from reference) ===
    float r = edgeDist * edgeDist * 4.0;
    float f = (1.0 - sqrt(abs(1.0 - r))) / (r + 0.001) + 0.5;
    f = clamp(f, 0.0, 2.0);

    // === POLAR COORDINATES FOR FLAME FLOW ===
    float angle = atan(spherePos.y, spherePos.x) / 6.2832;
    float elevation = atan(length(spherePos.xy), spherePos.z) / 3.1416;

    float time = uTime * 0.1;
    float tempFactor = clamp(uTemperature / 10000.0, 0.3, 1.5);
    float brightness = 0.15 + tempFactor * 0.1;

    // === OUTWARD FLOWING FLAMES ===
    vec3 coord = vec3(angle, elevation, time * 0.1);

    float newTime1 = abs(snoise(coord + vec3(0.0, -time * (0.35 + brightness * 0.001), time * 0.015), 15.0));
    float newTime2 = abs(snoise(coord + vec3(0.0, -time * (0.15 + brightness * 0.001), time * 0.015), 45.0));

    float fVal1 = 1.0 - edgeDist;
    float fVal2 = 1.0 - edgeDist;

    for (int i = 1; i <= 7; i++) {
        float power = pow(2.0, float(i + 1));
        fVal1 += (0.5 / power) * snoise(coord + vec3(0.0, -time, time * 0.2), power * 10.0 * (newTime1 + 1.0));
        fVal2 += (0.5 / power) * snoise(coord + vec3(0.0, -time, time * 0.2), power * 25.0 * (newTime2 + 1.0));
    }

    float flames = (fVal1 + fVal2) * 0.5;
    flames = flames * 0.5 + 0.5;

    // === SURFACE GRANULATION (convection cells) ===
    float slowTime = uTime * 0.02;
    vec3 granulePos = spherePos + vec3(slowTime * 0.1, 0.0, slowTime * 0.05);

    // Large convection cells
    float granulation = fbm(granulePos * 8.0, 4) * 0.5 + 0.5;

    // Fine surface detail
    float fineDetail = fbm(granulePos * 20.0 + vec3(uTime * 0.01), 3) * 0.3;

    // === SUNSPOTS ===
    float spotNoise = simplex3d(spherePos * 3.0 + vec3(0.0, uTime * 0.005, 0.0));
    float spotMask = smoothstep(0.55, 0.75, spotNoise);
    float spotDarkening = 1.0 - spotMask * 0.5;

    // === COLOR CALCULATION ===
    // Base colors
    vec3 warmColor = uStarColor * vec3(1.2, 1.0, 0.8);
    vec3 hotColor = uStarColor * vec3(1.4, 1.2, 1.0);
    vec3 coolColor = uStarColor * vec3(0.8, 0.5, 0.3);
    vec3 granuleWarm = uStarColor * vec3(1.1, 1.05, 0.95);
    vec3 granuleCool = uStarColor * vec3(0.85, 0.75, 0.7);

    // Burning glow base
    vec3 baseGlow = f * (0.75 + brightness * 0.3) * warmColor;

    // Flame color layer
    vec3 flameColor = mix(coolColor, hotColor, flames);

    // Granulation color layer (convection detail)
    vec3 granuleColor = mix(granuleCool, granuleWarm, granulation);
    granuleColor += uStarColor * fineDetail * 0.2;

    // Apply sunspot darkening to granulation
    granuleColor *= spotDarkening;

    // Combine: burning glow + flames + surface detail
    vec3 surfaceColor = baseGlow * 0.4 + flameColor * 0.3 + granuleColor * 0.4;

    // === STAR GLOW (warm radiance) ===
    float starGlow = clamp(1.0 - edgeDist * (1.0 - brightness), 0.0, 1.0);
    vec3 glowColor = uStarColor * vec3(1.0, 0.6, 0.3);
    surfaceColor += starGlow * glowColor * 0.3;

    // === LIMB DARKENING ===
    float limbDark = pow(viewAngle, 0.35);
    limbDark = mix(limbDark, 1.0, tempFactor * 0.25);
    surfaceColor *= 0.6 + limbDark * 0.4;

    // === BRIGHT CENTER ===
    float centerBoost = pow(viewAngle, 1.5) * 0.35;
    surfaceColor += uStarColor * centerBoost;

    // Hot star boost
    float hotBoost = smoothstep(7000.0, 15000.0, uTemperature) * 0.25;
    surfaceColor += uStarColor * hotBoost;

    // HDR clamp
    surfaceColor = clamp(surfaceColor, 0.0, 2.5);

    gl_FragColor = vec4(surfaceColor, 1.0);
}
