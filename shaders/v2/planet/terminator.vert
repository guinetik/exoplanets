/**
 * Terminator Overlay Vertex Shader
 *
 * Simple vertex shader for the day/night terminator overlay sphere.
 * Passes position and normal to fragment shader for lighting calculations.
 */

// Precision qualifiers for Chrome/ANGLE compatibility
#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// Varyings passed to fragment shader
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
    // Pass normal in view space
    vNormal = normalize(normalMatrix * normal);

    // Pass local position for sphere calculations
    vPosition = position;

    // Pass world position for lighting
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
