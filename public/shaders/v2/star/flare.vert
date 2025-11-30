/**
 * Solar Flare Vertex Shader
 *
 * Creates a plasma blob that travels outward through space.
 * The mesh position is animated in JS - this just handles the shape.
 * Features:
 * - Blob-like shape (not a streak)
 * - Slight elongation in travel direction
 * - Fades as it travels (phase = distance)
 */

uniform float uFlareLength;     // Base size
uniform float uFlarePhase;      // 0 = at star, 1 = far away (fading)
uniform float uFlareSeed;       // For variation

varying vec2 vUv;
varying float vPhase;

void main() {
    vUv = uv;
    vPhase = uFlarePhase;

    vec3 scaledPos = position;

    // Size: starts small, grows as it launches, then stays consistent
    float sizeRamp = smoothstep(0.0, 0.2, uFlarePhase);  // Quick grow at start
    float baseSize = uFlareLength * sizeRamp;

    // Slight elongation in Y (travel direction) - like a comet
    scaledPos.y *= baseSize * 1.5;
    scaledPos.x *= baseSize * 1.0;

    // Add some wobble/variation based on seed
    float wobble = sin(uFlareSeed * 20.0 + uFlarePhase * 6.28) * 0.1;
    scaledPos.x += wobble * baseSize;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPos, 1.0);
}
