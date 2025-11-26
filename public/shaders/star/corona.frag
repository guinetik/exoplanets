/**
 * Star Corona Fragment Shader
 * Creates a soft glowing corona effect around stars
 *
 * LEARNING NOTES:
 * - Fresnel effect: Makes objects glow more when viewed at oblique angles
 * - Perlin noise: Adds organic variation to prevent static/artificial appearance
 * - Fragment shader: Runs for every pixel, so performance is critical
 */

uniform vec3 uStarColor; // The star's color passed from CPU (e.g., blue for hot stars)
uniform float uTime; // Elapsed time - used to animate the corona
uniform float uIntensity; // How bright the corona glow should be

// Varying: Interpolated values from vertex shader for each pixel
varying vec3 vNormal; // Surface normal at this pixel (perpendicular to surface)
varying vec3 vViewPosition; // Position relative to camera - used for Fresnel calc

// ============================================================================
// NOISE FUNCTION - Simplex Noise
// ============================================================================
// Why use noise? Static patterns look fake. Noise adds natural variation.
// Simplex noise is faster than Perlin but similar quality.

vec2 mod289(vec2 x) {
    // Keep values in 0-289 range (wraps around for seamless tiling)
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 mod289(vec3 x) {
    // Same as above but for 3D
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    // Permutation: pseudo-random shuffling
    // Formula: ((x * 34) + 1) * x creates a pseudo-random mapping
    // Using mod289 keeps values bounded
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    // Simplex noise implementation
    // Takes 2D input coordinate, returns smooth -1 to 1 noise value

    // Magic constants for simplex grid geometry
    const vec4 C = vec4(0.211324865405187, // (3 - sqrt(3)) / 6
            0.366025403784439, // 0.5 * (sqrt(3) - 1)
            -0.577350269189626, // -1 / sqrt(3)
            0.024390243902439); // 1 / 41

    // Find grid cell containing v
    // dot(v, C.yy) adds coordinates together weighted
    vec2 i = floor(v + dot(v, C.yy));

    // Get coordinates within the grid cell (0-1 range)
    vec2 x0 = v - i + dot(i, C.xx);

    // Determine which of 2 triangles we're in
    // If x > y, we're in one triangle; otherwise the other
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

    // Relative positions of all 3 corners of our simplex (triangle)
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1; // Adjust for triangle orientation

    // Wrap grid indices (tiling)
    i = mod289(i);

    // Permutation: get unique pseudo-random values for each grid point
    // Permuting 3 times: adds complexity to the randomness
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));

    // Distance falloff (Gaussian-like curve centered at each point)
    // 0.5 is the radius where influence becomes zero
    // We calculate for all 3 corners
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);

    // Apply falloff curve twice (smoothstep-like effect)
    m = m * m;
    m = m * m;

    // Get pseudo-random gradient vectors for each corner
    // fract() gives us fractional part (0-1), *2-1 converts to (-1 to 1)
    vec3 x = 2.0 * fract(p * C.www) - 1.0;

    // Distance from gradient vector
    vec3 h = abs(x) - 0.5;

    // Prepare gradient contributions
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Fade and normalize contributions
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    // Dot product with gradients (contribution from each corner)
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;

    // Final noise value: weighted sum of gradient contributions
    // 130.0 is scale factor to get reasonable -1 to 1 range
    return 130.0 * dot(m, g);
}

void main() {
    // ========================================================================
    // FRESNEL EFFECT
    // ========================================================================
    // Fresnel: The more oblique the viewing angle, the more light we see
    // Think: looking at a window straight on vs from the side - side view is brighter!

    // Normalize view direction (camera looking at this pixel)
    vec3 viewDir = normalize(vViewPosition);

    // dot(viewDir, vNormal) is close to 1 when looking straight at surface,
    // close to 0 when looking at surface edge-on
    // 1 - abs(...) inverts this: 1 at edges, 0 at center
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));

    // ========================================================================
    // ANIMATED NOISE VARIATION
    // ========================================================================
    // Why animate? Static patterns look dead. Animation adds life to the corona.

    // Convert normal to angle in cylindrical coordinates
    // atan(y, x) gives angle from -π to π
    float angle = atan(vNormal.y, vNormal.x);

    // Sample 2D noise at:
    //   - angle * 4.0: Spatial variation (4 full cycles around the sphere)
    //   - uTime * 0.3: Temporal variation (0.3 controls animation speed)
    // Result is -1 to 1, so remap to 0 to 1 range for easier use
    float noise1 = snoise(vec2(angle * 4.0, uTime * 0.3)) * 0.5 + 0.5;

    // ========================================================================
    // CALCULATE CORONA GLOW
    // ========================================================================

    // Start with Fresnel (stronger at edges due to viewing angle)
    float glow = pow(fresnel, 3.0);
    // pow(fresnel, 3.0) creates steep falloff:
    // - If fresnel = 0.5 → 0.5^3 = 0.125 (gets darker quickly)
    // - If fresnel = 0.9 → 0.9^3 = 0.729 (bright at edges)

    // Add subtle noise: vary glow by ±30% based on animated noise
    // 0.7 + noise1 * 0.3 gives range 0.7 to 1.0
    glow *= 0.7 + noise1 * 0.3;

    // Apply intensity uniform, scaled for visible glow
    // Higher multiplier = more prominent corona
    glow *= uIntensity * 0.6;

    // ========================================================================
    // COLOR AND ALPHA
    // ========================================================================

    // Keep the star's natural color (don't wash out to white)
    vec3 coronaColor = uStarColor;

    // Alpha (transparency) also uses Fresnel and smoothstep
    // smoothstep(0.0, 0.8, fresnel):
    //   - Below 0.0: returns 0 (fully transparent)
    //   - Between 0.0-0.8: smooth curve (increasing opacity)
    //   - Above 0.8: returns 1 (fully opaque)
    // This creates a soft edge that fades out gradually
    float alpha = glow * smoothstep(0.0, 0.8, fresnel);

    // Final color with alpha blending
    // Alpha determines how much this glow contributes to final image
    gl_FragColor = vec4(coronaColor, alpha);
}
