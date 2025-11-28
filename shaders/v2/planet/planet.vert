/**
 * Planet Vertex Shader V2
 * 
 * Shared vertex shader for all planet types.
 * Passes position, normal, and UV to fragment shaders.
 */

// Precision qualifiers for Chrome/ANGLE compatibility
#ifdef GL_ES
precision highp float;
precision highp int;
#endif

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
    // Pass data to fragment shader
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    
    // Standard vertex transformation
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

