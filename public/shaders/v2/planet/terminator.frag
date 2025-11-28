/**
 * Terminator Overlay Fragment Shader
 *
 * Creates a day/night overlay for tidally locked planets.
 * This is rendered as a separate layer on top of the planet surface.
 *
 * Features:
 * - Transparent on day side (facing star)
 * - Gradual darkening through terminator zone
 * - Dark overlay on night side
 * - Optional frozen/icy effect for tidally locked worlds
 */

// Precision qualifiers for Chrome/ANGLE compatibility
#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// =============================================================================
// UNIFORMS
// =============================================================================

uniform vec3 uStarDirection;      // Normalized direction TO the star
uniform float uTerminatorWidth;   // Width of terminator transition (0.1-0.3)
uniform float uShowFrozenNight;   // 1.0 = show icy effect, 0.0 = just dark
uniform float uNightOpacity;      // Max opacity of night side (0.0-1.0)

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// =============================================================================
// CONSTANTS
// =============================================================================

// Night side colors
const vec3 NIGHT_DARK = vec3(0.02, 0.02, 0.03);        // Nearly black
const vec3 NIGHT_FROZEN = vec3(0.08, 0.12, 0.18);      // Icy blue tint
const vec3 TERMINATOR_GLOW = vec3(0.15, 0.08, 0.05);   // Warm terminator edge

// =============================================================================
// MAIN
// =============================================================================

void main() {
    // Calculate how much this fragment faces the star
    // facing = 1.0 when directly facing star (day side)
    // facing = -1.0 when directly away from star (night side)
    // facing = 0.0 at terminator
    vec3 sphereNormal = normalize(vPosition);
    float facing = dot(sphereNormal, uStarDirection);

    // Calculate terminator zone
    // dayFactor: 1.0 on day side, 0.0 on night side
    float halfWidth = uTerminatorWidth * 0.5;
    float dayFactor = smoothstep(-halfWidth, halfWidth, facing);

    // Night side gets darker
    float nightFactor = 1.0 - dayFactor;

    // Calculate night color based on frozen effect
    vec3 nightColor = mix(NIGHT_DARK, NIGHT_FROZEN, uShowFrozenNight);

    // Add subtle warm glow at terminator edge
    float terminatorGlow = smoothstep(0.0, halfWidth * 2.0, abs(facing));
    terminatorGlow = 1.0 - terminatorGlow;
    terminatorGlow *= terminatorGlow * 0.5;

    // Final color: dark on night side with optional terminator glow
    vec3 overlayColor = nightColor;
    overlayColor = mix(overlayColor, TERMINATOR_GLOW, terminatorGlow * (1.0 - uShowFrozenNight));

    // Alpha: fully transparent on day side, opaque on night side
    float alpha = nightFactor * uNightOpacity;

    // Add slight edge darkening for more natural look
    float edgeFactor = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    alpha *= 1.0 + edgeFactor * 0.2;

    gl_FragColor = vec4(overlayColor, alpha);
}
