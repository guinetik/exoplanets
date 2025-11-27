/**
 * Atmosphere Fragment Shader
 * Creates realistic atmospheric glow with Rayleigh scattering effect
 */

varying vec3 vNormal;
varying vec3 vPosition;

// Sun direction (should match surface shader)
const vec3 SUN_DIR = normalize(vec3(0.5, 0.3, 0.8));

// Atmosphere colors
const vec3 ATMOSPHERE_DAY = vec3(0.4, 0.7, 1.0);      // Bright blue scatter
const vec3 ATMOSPHERE_SUNSET = vec3(1.0, 0.4, 0.2);   // Orange/red at terminator
const vec3 ATMOSPHERE_NIGHT = vec3(0.05, 0.1, 0.2);   // Dark blue night side

// View direction (camera looking at planet)
const vec3 VIEW_DIR = vec3(0.0, 0.0, 1.0);

void main() {
    vec3 N = normalize(vNormal);

    // Fresnel effect - atmosphere glows more at edges
    float fresnel = 1.0 - max(dot(N, VIEW_DIR), 0.0);
    fresnel = pow(fresnel, 2.5);

    // Sun angle for day/night coloring
    float NdotL = dot(N, SUN_DIR);

    // Day side intensity
    float daySide = smoothstep(-0.1, 0.3, NdotL);

    // Sunset/sunrise zone (terminator)
    float sunsetZone = smoothstep(-0.2, 0.0, NdotL) * smoothstep(0.3, 0.0, NdotL);

    // Mix atmosphere colors based on sun position
    vec3 atmosColor = mix(ATMOSPHERE_NIGHT, ATMOSPHERE_DAY, daySide);
    atmosColor = mix(atmosColor, ATMOSPHERE_SUNSET, sunsetZone * 0.6);

    // Intensity varies with viewing angle and sun position
    float intensity = fresnel * (0.4 + daySide * 0.6);

    // Boost the glow at the limb (edge)
    float limbGlow = pow(fresnel, 4.0) * 0.5;
    intensity += limbGlow;

    // Height-based fade (upper atmosphere thinner)
    float height = (vPosition.y / 580.0 + 1.0) * 0.5; // Normalize to 0-1
    float heightFade = 1.0 - smoothstep(0.3, 0.8, height) * 0.4;

    // Final alpha
    float alpha = intensity * heightFade;
    alpha = clamp(alpha, 0.0, 0.9);

    gl_FragColor = vec4(atmosColor, alpha);
}
