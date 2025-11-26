/**
 * Atmosphere Fragment Shader
 * Creates the thin blue line atmospheric glow
 */

varying vec3 vNormal;
varying vec3 vPosition;

// Constants
const float FRESNEL_POWER = 2.0;
const float FRESNEL_BASE = 0.65;
const vec3 INNER_ATMOSPHERE_COLOR = vec3(0.4, 0.7, 1.0); // Bright cyan-blue
const vec3 OUTER_ATMOSPHERE_COLOR = vec3(0.1, 0.3, 0.7); // Deeper blue
const float HEIGHT_SMOOTHSTEP_MIN = -0.2;
const float HEIGHT_SMOOTHSTEP_MAX = 0.4;
const float HEIGHT_SCALE = 100.0;
const float ALPHA_MAX_ALPHA = 0.85;
const float ALPHA_HEIGHT_FADE = 0.7;
const vec3 UP_VECTOR = vec3(0.0, 1.0, 0.0);

void main() {
    // Calculate how much we're looking at the edge (atmosphere)
    float intensity = pow(FRESNEL_BASE - dot(vNormal, UP_VECTOR), FRESNEL_POWER);

    // Mix based on height
    float heightFactor = smoothstep(HEIGHT_SMOOTHSTEP_MIN, HEIGHT_SMOOTHSTEP_MAX, vPosition.y / HEIGHT_SCALE);
    vec3 finalColor = mix(OUTER_ATMOSPHERE_COLOR, INNER_ATMOSPHERE_COLOR, 1.0 - heightFactor);

    // Fade out as we look up
    float alpha = intensity * (1.0 - heightFactor * ALPHA_HEIGHT_FADE);
    alpha = clamp(alpha, 0.0, ALPHA_MAX_ALPHA);

    gl_FragColor = vec4(finalColor, alpha);
}
