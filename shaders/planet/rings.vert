/**
 * Planetary Rings Vertex Shader
 * Simple pass-through with UV coordinates for ring bands
 */

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
