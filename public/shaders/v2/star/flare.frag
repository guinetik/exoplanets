/**
 * Solar Flare Fragment Shader
 *
 * Creates a fiery streak effect for solar flares.
 * Features:
 * - Bright core fading to edges
 * - Color gradient from white-hot to orange/red
 * - Animated turbulence
 * - Lifecycle-based intensity
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

uniform vec3 uStarColor;
uniform float uTime;
uniform float uFlarePhase;      // 0 = start, 0.5 = peak, 1 = end
uniform float uFlareSeed;

varying vec2 vUv;
varying float vPhase;

void main() {
    // Wrap time for precision
    float wrappedTime = wrapTime(uTime);

    // UV coordinates: x = width (-0.5 to 0.5), y = length (0 = base, 1 = tip)
    vec2 uv = vUv - 0.5;
    float lengthPos = vUv.y;      // 0 at base, 1 at tip
    float widthPos = abs(uv.x);   // 0 at center, 0.5 at edge

    // === FLARE SHAPE ===
    // Smooth inner/outer fades instead of hard cutoffs (from starstudy.glsl)

    // Center falloff - smooth from center outward
    float innerFade = smoothstep(0.0, 0.15, 0.5 - widthPos);  // Fade in from center
    float outerFade = exp(-widthPos * 4.0);  // Exponential fade outward

    // Combine for center falloff
    float centerFalloff = innerFade * outerFade;

    // Tip falloff - smoother exponential fade toward tip
    float tipFade = exp(-lengthPos * 2.0);  // Exponential falloff
    float tipFalloff = tipFade * (1.0 - pow(lengthPos, 2.0));

    // Combine falloffs
    float shape = centerFalloff * tipFalloff;

    // === TURBULENCE (makes it look like fire) ===
    vec2 noiseCoord = vec2(
        uv.x * 5.0 + wrappedTime * 0.5,
        lengthPos * 3.0 - wrappedTime * 2.0  // Flows outward
    );
    float turbulence = snoise2D(noiseCoord + uFlareSeed * 10.0);
    turbulence = turbulence * 0.5 + 0.5;

    // Apply turbulence to shape
    shape *= 0.7 + turbulence * 0.5;

    // === LIFECYCLE INTENSITY ===
    // Flare brightens quickly, fades slowly
    float lifecycle = sin(vPhase * 3.14159);
    lifecycle = pow(lifecycle, 0.7);  // Asymmetric - faster rise, slower fall

    // === COLOR ===
    vec3 baseColor = uStarColor * 1.5 + vec3(0.3);

    // Hot white at base, cooling to orange/red at tip
    vec3 hotColor = vec3(1.5, 1.3, 1.0);  // White-hot
    vec3 coolColor = baseColor * vec3(1.2, 0.6, 0.3);  // Orange-red

    vec3 flareColor = mix(hotColor, coolColor, lengthPos);

    // Add some color variation from turbulence
    flareColor = mix(flareColor, baseColor * vec3(1.4, 0.8, 0.4), turbulence * 0.3);

    // Apply shape and lifecycle
    float intensity = shape * lifecycle * 2.0;
    flareColor *= intensity;

    // === ALPHA ===
    float alpha = shape * lifecycle;
    alpha = clamp(alpha, 0.0, 1.0);

    // Fully transparent if phase is 0 or 1
    alpha *= smoothstep(0.0, 0.1, vPhase) * smoothstep(1.0, 0.9, vPhase);

    gl_FragColor = vec4(flareColor, alpha);
}
