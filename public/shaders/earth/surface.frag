/**
 * Earth Surface Fragment Shader
 * Realistic procedural Earth with proper lighting, oceans, continents, clouds
 */

uniform float uRotation; // Rotation based on observer longitude

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// CONSTANTS
// =============================================================================

// Noise constants
const float MOD_DIVISOR = 289.0;
const float SIMPLEX_SKEW_1 = 0.211324865405187;
const float SIMPLEX_UNSKEW = 0.366025403784439;
const float SIMPLEX_SKEW_2 = -0.577350269189626;
const float SIMPLEX_PERMUTE = 0.024390243902439;
const float SIMPLEX_NORMALIZE = 130.0;
const float TAYLOR_A = 1.79284291400159;
const float TAYLOR_B = 0.85373472095314;

// Sun direction - from upper right
const vec3 SUN_DIR = normalize(vec3(0.5, 0.3, 0.8));

// Ocean colors - deep realistic blues
const vec3 OCEAN_DEEP = vec3(0.01, 0.03, 0.08);
const vec3 OCEAN_MID = vec3(0.02, 0.08, 0.18);
const vec3 OCEAN_SHALLOW = vec3(0.04, 0.15, 0.28);
const vec3 OCEAN_SPECULAR = vec3(0.8, 0.9, 1.0);

// Land colors - Earth tones
const vec3 LAND_FOREST = vec3(0.02, 0.08, 0.01);
const vec3 LAND_GRASS = vec3(0.06, 0.12, 0.02);
const vec3 LAND_SAVANNA = vec3(0.15, 0.12, 0.03);
const vec3 LAND_DESERT = vec3(0.22, 0.18, 0.10);
const vec3 LAND_MOUNTAIN = vec3(0.12, 0.10, 0.08);
const vec3 LAND_SNOW = vec3(0.85, 0.88, 0.92);

// Ice caps
const vec3 ICE_COLOR = vec3(0.92, 0.95, 0.98);

// Clouds
const vec3 CLOUD_COLOR = vec3(1.0, 1.0, 1.0);

// City lights
const vec3 CITY_COLOR = vec3(1.0, 0.85, 0.5);

// Atmosphere tint
const vec3 ATMOSPHERE_TINT = vec3(0.4, 0.6, 1.0);

// =============================================================================
// Noise Functions
// =============================================================================

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    vec4 C = vec4(SIMPLEX_SKEW_1, SIMPLEX_UNSKEW, SIMPLEX_SKEW_2, SIMPLEX_PERMUTE);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= TAYLOR_A - TAYLOR_B * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return SIMPLEX_NORMALIZE * dot(m, g);
}

// Fractal Brownian Motion for more natural terrain
float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// =============================================================================
// Main Shader
// =============================================================================

void main() {
    vec3 N = normalize(vNormal);
    vec3 pos = normalize(vPosition);

    // Spherical UV mapping for consistent noise
    // Add uRotation to longitude to rotate Earth based on observer position
    float lon = atan(pos.x, pos.z) + uRotation;
    float lat = asin(pos.y);
    vec2 sphereUv = vec2(lon / 3.14159, lat / 1.5708);

    // =============================================================================
    // TERRAIN GENERATION
    // =============================================================================

    // Multi-scale terrain noise
    float continent = fbm(sphereUv * 2.5, 4);
    float detail = fbm(sphereUv * 8.0, 3);
    float microDetail = snoise(sphereUv * 32.0);

    // Land/ocean threshold with smooth coastlines
    float landMask = smoothstep(0.0, 0.15, continent + 0.05);

    // Elevation for mountains/valleys
    float elevation = smoothstep(0.1, 0.5, continent) * detail;

    // =============================================================================
    // OCEAN
    // =============================================================================

    // Ocean depth variation
    float oceanDepth = smoothstep(-0.3, 0.0, continent);
    vec3 oceanColor = mix(OCEAN_DEEP, OCEAN_MID, oceanDepth);
    oceanColor = mix(oceanColor, OCEAN_SHALLOW, smoothstep(-0.1, 0.05, continent));

    // Ocean specular highlight from sun
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(SUN_DIR + viewDir);
    float specular = pow(max(dot(N, halfDir), 0.0), 128.0);

    // Only add specular on lit side of ocean
    float sunFacing = max(dot(N, SUN_DIR), 0.0);
    oceanColor += OCEAN_SPECULAR * specular * sunFacing * 0.6 * (1.0 - landMask);

    // Subtle wave shimmer
    float waveNoise = snoise(sphereUv * 64.0 + vec2(0.0, 0.0)) * 0.02;
    oceanColor += vec3(waveNoise) * sunFacing;

    // =============================================================================
    // LAND
    // =============================================================================

    // Latitude for biome variation (equator = 0, poles = 1)
    float absLat = abs(pos.y);

    // Temperature gradient (0 = hot equator, 1 = cold poles)
    float temperature = absLat;

    // Moisture based on noise (creates varied biomes)
    float moisture = fbm(sphereUv * 4.0 + vec2(100.0, 0.0), 3) * 0.5 + 0.5;

    // Biome selection
    vec3 landColor;

    // Tropical/temperate forests (high moisture, warm)
    vec3 forestColor = mix(LAND_FOREST, LAND_GRASS, moisture);

    // Dry areas (low moisture)
    vec3 dryColor = mix(LAND_SAVANNA, LAND_DESERT, 1.0 - moisture);

    // Blend based on temperature and moisture
    landColor = mix(forestColor, dryColor, smoothstep(0.3, 0.7, 1.0 - moisture));

    // Mountains at high elevation
    float mountainMask = smoothstep(0.3, 0.5, elevation);
    landColor = mix(landColor, LAND_MOUNTAIN, mountainMask);

    // Snow on mountains and cold regions
    float snowLine = smoothstep(0.6, 0.8, absLat) + mountainMask * smoothstep(0.4, 0.6, elevation);
    snowLine = clamp(snowLine, 0.0, 1.0);
    landColor = mix(landColor, LAND_SNOW, snowLine * 0.8);

    // Add texture variation
    landColor *= 0.85 + microDetail * 0.15;

    // =============================================================================
    // ICE CAPS
    // =============================================================================

    float iceMask = smoothstep(0.75, 0.9, absLat);
    vec3 iceColor = ICE_COLOR * (0.9 + microDetail * 0.1);

    // =============================================================================
    // CLOUDS
    // =============================================================================

    // Multi-layer cloud noise
    float clouds1 = fbm(sphereUv * 5.0, 4);
    float clouds2 = snoise(sphereUv * 12.0);
    float cloudDensity = smoothstep(0.1, 0.4, clouds1 + clouds2 * 0.3);

    // Reduce clouds at poles (less moisture)
    cloudDensity *= 1.0 - smoothstep(0.6, 0.9, absLat) * 0.5;

    // =============================================================================
    // COMBINE SURFACE
    // =============================================================================

    // Mix ocean and land
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);

    // Apply ice caps
    surfaceColor = mix(surfaceColor, iceColor, iceMask);

    // Apply clouds (bright white, partially transparent)
    surfaceColor = mix(surfaceColor, CLOUD_COLOR, cloudDensity * 0.7);

    // =============================================================================
    // LIGHTING
    // =============================================================================

    // Main sun lighting
    float NdotL = dot(N, SUN_DIR);
    float diffuse = max(NdotL, 0.0);

    // Soft terminator (day/night boundary)
    float terminator = smoothstep(-0.1, 0.2, NdotL);

    // Ambient light (slight blue from atmosphere scatter)
    vec3 ambient = vec3(0.02, 0.03, 0.05);

    // Apply lighting
    vec3 litColor = surfaceColor * (diffuse * 0.85 + 0.15) * terminator + ambient;

    // =============================================================================
    // CITY LIGHTS (Night side)
    // =============================================================================

    float nightSide = 1.0 - terminator;
    float cityNoise = snoise(sphereUv * 40.0);
    float cityMask = smoothstep(0.5, 0.8, cityNoise) * landMask;

    // Cities more concentrated in temperate regions
    cityMask *= smoothstep(0.1, 0.3, absLat) * smoothstep(0.7, 0.5, absLat);

    // Add city lights on dark side
    litColor += CITY_COLOR * cityMask * nightSide * 0.15;

    // =============================================================================
    // ATMOSPHERE RIM
    // =============================================================================

    // Fresnel-based atmosphere rim lighting
    float rim = 1.0 - max(dot(N, viewDir), 0.0);
    rim = pow(rim, 3.0);

    // Blue atmosphere scatter on lit side
    vec3 atmosphereGlow = ATMOSPHERE_TINT * rim * 0.3 * (terminator * 0.8 + 0.2);
    litColor += atmosphereGlow;

    gl_FragColor = vec4(litColor, 1.0);
}
