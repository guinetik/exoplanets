/**
 * Star Corona Fragment Shader
 * Creates a burning, outward-flowing corona effect around stars
 * Inspired by Shadertoy reference - flames radiate outward from the star
 */

uniform vec3 uStarColor;
uniform float uTime;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;

// =============================================================================
// NOISE FUNCTION (from reference)
// =============================================================================

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

// =============================================================================
// MAIN
// =============================================================================

void main() {
    // Fresnel - how edge-on we're viewing (1 at edges, 0 at center)
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));

    // Fade factor from reference - controls corona falloff
    float fade = pow(fresnel, 0.5);
    float fVal1 = 1.0 - fade;
    float fVal2 = 1.0 - fade;

    // === POLAR COORDINATES FOR OUTWARD FLAME FLOW ===
    float angle = atan(vNormal.y, vNormal.x) / 6.2832;
    // Use fresnel as "distance" - flames flow from center outward
    float dist = fresnel;

    // Time - the -time on dist axis makes flames flow OUTWARD
    float time = uTime * 0.1;
    float brightness = uIntensity * 0.25;

    // Coordinate for noise - dist in Y means flames radiate out
    vec3 coord = vec3(angle, dist, time * 0.1);

    // Generate animated noise seeds
    float newTime1 = abs(snoise(coord + vec3(0.0, -time * (0.35 + brightness * 0.001), time * 0.015), 15.0));
    float newTime2 = abs(snoise(coord + vec3(0.0, -time * (0.15 + brightness * 0.001), time * 0.015), 45.0));

    // === ACCUMULATE FLAME DETAIL (7 octaves like reference) ===
    for (int i = 1; i <= 7; i++) {
        float power = pow(2.0, float(i + 1));
        // The -time makes the noise flow outward along the dist axis
        fVal1 += (0.5 / power) * snoise(coord + vec3(0.0, -time, time * 0.2), power * 10.0 * (newTime1 + 1.0));
        fVal2 += (0.5 / power) * snoise(coord + vec3(0.0, -time, time * 0.2), power * 25.0 * (newTime2 + 1.0));
    }

    // === CORONA CALCULATION (from reference) ===
    // This creates the flame tendrils shooting outward
    float corona = pow(fVal1 * max(1.1 - fade, 0.0), 2.0) * 50.0;
    corona += pow(fVal2 * max(1.1 - fade, 0.0), 2.0) * 50.0;
    corona *= 1.2 - newTime1; // Animated variation
    corona *= uIntensity * 0.4;

    // === STAR GLOW (warm radiance underneath) ===
    float starGlow = clamp(1.0 - dist * (1.0 - brightness), 0.0, 1.0);
    starGlow *= uIntensity * 0.5;

    // === COLORS ===
    // Main corona color (star's natural color)
    vec3 coronaColor = uStarColor;

    // Warmer edge color for that burning look
    vec3 warmEdge = uStarColor * vec3(1.0, 0.7, 0.4);

    // Combine corona flames + warm glow
    vec3 finalColor = corona * coronaColor + starGlow * warmEdge;

    // === ALPHA ===
    // Corona is visible where there are flames or glow
    float alpha = corona + starGlow * 0.6;
    alpha *= smoothstep(0.0, 0.5, fresnel); // Fade in from center
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
}
