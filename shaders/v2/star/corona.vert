/**
 * Star Corona Vertex Shader V2
 *
 * Renders the outer glow/corona of stars.
 * Uses a slightly larger sphere than the surface.
 */

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;  // Object space - for flame noise coordinates

    // View space position - for proper view-dependent calculations
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
}

