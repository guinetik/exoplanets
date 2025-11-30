/**
 * Star Flame Tongues Vertex Shader
 *
 * Renders visible fire protrusions that break the circular star silhouette.
 * Uses a sphere slightly larger than the star surface.
 */

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;  // Object space - for flame pattern coordinates

    // View space position - for view-dependent calculations
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
}
