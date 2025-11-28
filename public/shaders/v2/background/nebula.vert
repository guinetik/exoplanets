/**
 * Nebula Background Vertex Shader
 * Renders on a large sphere around the scene
 */

varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
