/**
 * Solar Flare Vertex Shader
 *
 * Renders elongated billboard sprites for solar flares.
 * The flare extends outward from the star surface.
 */

uniform float uFlareLength;     // How far the flare extends
uniform float uFlarePhase;      // Lifecycle phase (0-1)
uniform vec3 uFlareDirection;   // Direction the flare points (normalized)

varying vec2 vUv;
varying float vPhase;

void main() {
    vUv = uv;
    vPhase = uFlarePhase;

    // Scale the flare based on phase (grows then shrinks)
    float scale = sin(uFlarePhase * 3.14159) * uFlareLength;

    // Apply scaling to position
    vec3 scaledPos = position;
    scaledPos.y *= scale;  // Stretch along Y (flare length)
    scaledPos.x *= 0.3 + uFlarePhase * 0.2;  // Width varies with phase

    gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPos, 1.0);
}
