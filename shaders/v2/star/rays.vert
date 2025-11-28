/**
 * Star Rays Vertex Shader
 *
 * For billboard rendering of star rays around the star.
 */

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
