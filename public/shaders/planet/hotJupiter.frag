/**
 * Hot Jupiter Fragment Shader
 * Tidally locked gas giants with extreme temperatures and violent atmospheres
 * Uses star data for realistic illumination and day/night contrast
 */

uniform vec3 uBaseColor;
uniform float uTime;
uniform float uTemperature;      // Planet equilibrium temp (often 1000-3000K)
uniform float uHasAtmosphere;
uniform float uSeed;
uniform float uDensity;
uniform float uInsolation;       // Stellar energy - affects dayside intensity
uniform float uStarTemp;         // Host star temperature - affects lighting color
uniform float uDetailLevel;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// =============================================================================
// CONSTANTS
// =============================================================================

const float PI = 3.14159265359;
const float MOD_DIVISOR = 289.0;

// Hot Jupiter color palette - fiery atmosphere
const vec3 BAND_BRIGHT_HOT = vec3(1.0, 0.85, 0.5);    // Bright yellow-white (ultra-hot)
const vec3 BAND_BRIGHT = vec3(1.0, 0.6, 0.25);        // Bright orange
const vec3 BAND_MID = vec3(0.85, 0.35, 0.15);         // Deep orange-red
const vec3 BAND_DARK = vec3(0.5, 0.15, 0.08);         // Dark red-brown
const vec3 BAND_SHADOW = vec3(0.15, 0.05, 0.03);      // Deep shadow

// Night side colors
const vec3 NIGHT_GLOW = vec3(0.4, 0.1, 0.05);         // Faint thermal glow
const vec3 NIGHT_DARK = vec3(0.02, 0.01, 0.01);       // Near black

// Storm colors
const vec3 STORM_BRIGHT = vec3(1.0, 0.9, 0.6);        // Bright storm tops
const vec3 STORM_DARK = vec3(0.6, 0.2, 0.1);          // Storm depths

// Atmospheric glow
const vec3 ATMO_GLOW_HOT = vec3(1.0, 0.5, 0.2);       // Orange atmospheric glow
const vec3 ATMO_GLOW_COOL = vec3(0.8, 0.3, 0.1);      // Cooler glow

// Star temperature ranges (Kelvin)
const float STAR_M_DWARF = 3200.0;    // Red dwarf
const float STAR_K_TYPE = 4500.0;     // Orange star
const float STAR_G_TYPE = 5778.0;     // Sun-like
const float STAR_F_TYPE = 6500.0;     // Yellow-white
const float STAR_A_TYPE = 8500.0;     // White-blue

// Animation
const float BAND_FLOW_SPEED = 0.03;       // Zonal wind flow
const float JET_STREAM_SPEED = 0.08;      // Fast jet streams
const float STORM_ROTATION_SPEED = 0.15;  // Storm rotation
const float TURBULENCE_SPEED = 0.05;      // Chaotic motion

const vec3 VIEW_DIR = vec3(0.0, 0.0, 1.0);

// =============================================================================
// Noise Functions
// =============================================================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / MOD_DIVISOR)) * MOD_DIVISOR; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m * m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// =============================================================================
// Star Light Color based on Temperature
// =============================================================================

vec3 getStarLightColor(float temp) {
    // Physically-inspired star colors
    vec3 mDwarfLight = vec3(1.0, 0.6, 0.4);      // Red-orange
    vec3 kTypeLight = vec3(1.0, 0.8, 0.6);       // Orange-yellow
    vec3 gTypeLight = vec3(1.0, 0.97, 0.92);     // Warm white
    vec3 fTypeLight = vec3(1.0, 1.0, 0.98);      // Pure white
    vec3 aTypeLight = vec3(0.9, 0.93, 1.0);      // Blue-white

    if (temp < STAR_K_TYPE) {
        return mix(mDwarfLight, kTypeLight, smoothstep(STAR_M_DWARF, STAR_K_TYPE, temp));
    } else if (temp < STAR_G_TYPE) {
        return mix(kTypeLight, gTypeLight, smoothstep(STAR_K_TYPE, STAR_G_TYPE, temp));
    } else if (temp < STAR_F_TYPE) {
        return mix(gTypeLight, fTypeLight, smoothstep(STAR_G_TYPE, STAR_F_TYPE, temp));
    } else {
        return mix(fTypeLight, aTypeLight, smoothstep(STAR_F_TYPE, STAR_A_TYPE, temp));
    }
}

// Star intensity based on insolation and temperature
float getStarIntensity(float insolation, float starTemp) {
    // Hotter stars are more intense
    float tempBoost = smoothstep(STAR_G_TYPE, STAR_A_TYPE, starTemp) * 0.3;
    return 0.8 + insolation * 0.4 + tempBoost;
}

// =============================================================================
// Main Shader
// =============================================================================

void main() {
    vec2 uv = vUv;
    float time = uTime;

    // Seed-based variation
    float seed = uSeed;
    vec2 seedOffset = vec2(seed * 10.0, seed * 7.0);

    // ==========================================================
    // STAR PROPERTIES
    // ==========================================================
    vec3 starLight = getStarLightColor(uStarTemp);
    float starIntensity = getStarIntensity(uInsolation, uStarTemp);

    // Temperature factor (how "ultra-hot" is this Hot Jupiter)
    float tempFactor = clamp((uTemperature - 1000.0) / 2000.0, 0.0, 1.0);

    // ==========================================================
    // DAY/NIGHT - Tidally locked illumination
    // ==========================================================
    // Substellar point (where star is directly overhead)
    // Use seed to vary the substellar longitude
    float substellarLon = seed * PI * 2.0;

    // Calculate illumination based on position
    // uv.x is longitude (0-1), convert to angle
    float longitude = (uv.x - 0.5) * PI * 2.0;
    float latitude = (uv.y - 0.5) * PI;

    // Angle from substellar point
    float angleFromStar = cos(longitude - substellarLon) * cos(latitude);
    float daylight = smoothstep(-0.2, 0.5, angleFromStar);

    // Terminator zone (transition region with interesting weather)
    float terminator = smoothstep(0.0, 0.3, angleFromStar) * smoothstep(0.6, 0.3, angleFromStar);

    // ==========================================================
    // ATMOSPHERIC BANDS - Extreme zonal winds
    // ==========================================================
    float bandFreq = 8.0 + seed * 4.0;

    // Fast-moving zonal bands (east-west jet streams)
    float flowOffset = time * BAND_FLOW_SPEED;
    float jetOffset = time * JET_STREAM_SPEED;

    // Latitude-based banding with wind shear
    float lat = uv.y;
    float bandBase = sin(lat * PI * bandFreq + seed * 3.0);

    // Add turbulent distortion to bands
    float turbulence = 0.0;
    if (uDetailLevel > 0.5) {
        vec2 turbUV = uv * vec2(4.0, 8.0) + seedOffset;
        turbulence = fbm(turbUV + vec2(flowOffset, 0.0), 4) * 0.3;
        turbulence += fbm(turbUV * 2.0 + vec2(jetOffset * 1.5, 0.0), 3) * 0.15;
    }

    float bands = bandBase + turbulence;
    bands = bands * 0.5 + 0.5; // Normalize to 0-1

    // Sharper band edges for hot Jupiters (strong zonal flow)
    bands = smoothstep(0.3, 0.7, bands);

    // ==========================================================
    // STORMS - Violent atmospheric features
    // ==========================================================
    float storms = 0.0;

    if (uDetailLevel > 0.5) {
        // Large persistent storm (like Great Red Spot but hotter)
        vec2 stormCenter = vec2(0.3 + seed * 0.4, 0.4 + seed * 0.2);
        float stormDist = length((uv - stormCenter) * vec2(1.5, 1.0));
        float stormSize = 0.08 + seed * 0.06;

        // Rotating storm
        float stormAngle = atan(uv.y - stormCenter.y, uv.x - stormCenter.x);
        float stormRotation = stormAngle + time * STORM_ROTATION_SPEED;
        float stormSpiral = sin(stormRotation * 3.0 + stormDist * 20.0) * 0.5 + 0.5;

        float mainStorm = smoothstep(stormSize, stormSize * 0.3, stormDist);
        mainStorm *= stormSpiral;

        // Smaller chaotic storms
        float smallStorms = fbm(uv * 15.0 + seedOffset + vec2(time * TURBULENCE_SPEED, 0.0), 3);
        smallStorms = smoothstep(0.5, 0.8, smallStorms) * 0.5;

        storms = mainStorm + smallStorms * (1.0 - mainStorm);

        // More storms on terminator (temperature gradient drives convection)
        storms *= 1.0 + terminator * 0.5;
    }

    // ==========================================================
    // COLOR MIXING - Temperature-based palette
    // ==========================================================

    // Base band color varies with temperature
    vec3 brightBand = mix(BAND_BRIGHT, BAND_BRIGHT_HOT, tempFactor);
    vec3 darkBand = mix(BAND_DARK, BAND_MID, tempFactor);

    // Mix bands
    vec3 bandColor = mix(darkBand, brightBand, bands);

    // Add storm coloring
    vec3 stormColor = mix(STORM_DARK, STORM_BRIGHT, storms * tempFactor);
    bandColor = mix(bandColor, stormColor, storms * 0.7);

    // ==========================================================
    // DAY/NIGHT COLORING
    // ==========================================================

    // Dayside - heated by star, apply star light color
    vec3 daysideColor = bandColor * starLight * starIntensity;

    // Extra heating on dayside (thermal emission)
    float thermalGlow = daylight * tempFactor * 0.4;
    daysideColor += brightBand * thermalGlow;

    // Nightside - thermal emission only (planet's own heat)
    float nightGlow = tempFactor * 0.3 + 0.1;
    vec3 nightsideColor = mix(NIGHT_DARK, NIGHT_GLOW, nightGlow);

    // Faint band structure visible on nightside from thermal emission
    nightsideColor += bandColor * nightGlow * 0.3;

    // Blend day and night
    vec3 surfaceColor = mix(nightsideColor, daysideColor, daylight);

    // ==========================================================
    // TERMINATOR EFFECTS - Weather at day/night boundary
    // ==========================================================
    if (uDetailLevel > 0.5) {
        // Enhanced turbulence at terminator
        float terminatorTurb = fbm(uv * 20.0 + vec2(time * 0.1, 0.0) + seedOffset, 3);
        terminatorTurb = terminatorTurb * 0.5 + 0.5;

        // Dramatic clouds at terminator
        vec3 terminatorGlow = mix(BAND_MID, BAND_BRIGHT, terminatorTurb);
        surfaceColor = mix(surfaceColor, terminatorGlow, terminator * 0.4);
    }

    // ==========================================================
    // ATMOSPHERIC LIMB EFFECTS
    // ==========================================================
    float limb = dot(vNormal, VIEW_DIR);
    float limbEdge = 1.0 - abs(limb);

    // Limb darkening on dayside
    float limbDarkening = smoothstep(-0.1, 0.7, limb);
    surfaceColor *= 0.5 + limbDarkening * 0.5;

    // Atmospheric glow at limb
    float atmoGlow = pow(limbEdge, 2.0) * 0.6;

    // Glow color depends on star type
    vec3 glowColor = mix(ATMO_GLOW_COOL, ATMO_GLOW_HOT, tempFactor);
    glowColor *= starLight; // Tinted by star

    // Stronger glow on dayside limb
    float daysideLimb = max(0.0, daylight * 2.0 - 0.5);
    surfaceColor += glowColor * atmoGlow * (0.5 + daysideLimb * 0.5);

    // ==========================================================
    // HEAT SHIMMER / ESCAPING ATMOSPHERE (ultra-hot only)
    // ==========================================================
    if (tempFactor > 0.5 && uDetailLevel > 0.5) {
        float escaping = pow(limbEdge, 3.0) * (tempFactor - 0.5) * 2.0;
        float shimmer = snoise(uv * 30.0 + vec2(time * 0.3, 0.0)) * 0.5 + 0.5;
        surfaceColor += vec3(1.0, 0.7, 0.4) * escaping * shimmer * 0.3;
    }

    gl_FragColor = vec4(clamp(surfaceColor, 0.0, 1.5), 1.0);
}
