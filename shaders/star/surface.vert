/**
 * Star Surface Vertex Shader
 * Passes through position, normal, and UV for fragment shader
 */

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
