/**
 * Planetary Rings Vertex Shader
 * Passes position for proper radial calculation
 */

uniform float uInnerRadius;
uniform float uOuterRadius;

varying vec2 vUv;
varying vec3 vPosition;
varying float vRadialPos;  // Normalized 0-1 from inner to outer
varying float vAngle;      // Angle around ring

const float PI = 3.14159265359;

void main() {
    vUv = uv;
    vPosition = position;

    // Calculate actual radial position from vertex position
    // RingGeometry is in XY plane before rotation
    float radius = length(position.xy);
    vRadialPos = (radius - uInnerRadius) / (uOuterRadius - uInnerRadius);
    vAngle = atan(position.y, position.x) + PI; // 0 to 2PI

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
