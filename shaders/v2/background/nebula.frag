/**
 * Nebula Background Fragment Shader
 *
 * Creates procedural nebula clouds with dramatic variation.
 * Features: storms with lightning, brightness hotspots, emission colors.
 *
 * Based on Shadertoy study and adapted for Three.js
 */

#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/seed.glsl"

// =============================================================================
// UNIFORMS
// =============================================================================

uniform float uTime;
uniform float uSeed;          // System seed for unique nebula per system
uniform float uDensity;       // Overall nebula density (0-1)
uniform float uOpacity;       // Fade-in opacity (0-1)
uniform vec3 uPrimaryColor;   // Primary nebula color
uniform vec3 uSecondaryColor; // Secondary nebula color
uniform float uQuality;       // Quality level: 0.0 = low, 0.5 = medium, 1.0 = high

// =============================================================================
// CONSTANTS
// =============================================================================

// Nebula structure
const float NEBULA_SCALE = 0.5;
const float NEBULA_DETAIL = 2.0;
const int SPIRAL_NOISE_ITER = 5;
const float NUDGE = 3.0;

// Animation
const float TIME_SCALE = 0.008;
const float FLOW_SPEED = 0.03;

// Density
const float DENSITY_THRESHOLD = 0.02;
const float DENSITY_FALLOFF = 0.5;

// Colors & Brightness
const float COLOR_VARIATION = 0.25;
const float BRIGHTNESS_BASE = 0.5;
const float BRIGHTNESS_RANGE = 0.8;

// Storm constants
const float STORM_DURATION = 10.0;
const float STORM_FADE_IN = 1.5;
const float STORM_FADE_OUT = 3.0;
const float STORM_CYCLE = 12.0;

// =============================================================================
// VARYINGS
// =============================================================================

varying vec3 vPosition;
varying vec3 vWorldPosition;

// =============================================================================
// EMISSION NEBULA COLORS
// =============================================================================

vec3 nebulaEmissionColor(float hue, float variation) {
    vec3 hAlpha = vec3(0.9, 0.3, 0.35);  // Hydrogen alpha - red/pink
    vec3 oiii = vec3(0.2, 0.7, 0.65);    // Oxygen III - teal
    vec3 sii = vec3(0.8, 0.25, 0.2);     // Sulfur II - deep red
    vec3 hBeta = vec3(0.3, 0.5, 0.8);    // Hydrogen beta - blue

    vec3 color;
    if (hue < 0.25) {
        color = mix(hAlpha, oiii, hue / 0.25);
    } else if (hue < 0.5) {
        color = mix(oiii, hBeta, (hue - 0.25) / 0.25);
    } else if (hue < 0.75) {
        color = mix(hBeta, sii, (hue - 0.5) / 0.25);
    } else {
        color = mix(sii, hAlpha, (hue - 0.75) / 0.25);
    }

    color += (variation - 0.5) * 0.15;
    return color;
}

// =============================================================================
// SPIRAL NOISE
// =============================================================================

float spiralNoise(vec3 p, float seed) {
    float normalizer = 1.0 / sqrt(1.0 + NUDGE * NUDGE);
    float n = 1.5 - seed * 0.5;
    float iter = 2.0;

    for (int i = 0; i < SPIRAL_NOISE_ITER; i++) {
        n += -abs(sin(p.y * iter) + cos(p.x * iter)) / iter;
        p.xy += vec2(p.y, -p.x) * NUDGE;
        p.xy *= normalizer;
        p.xz += vec2(p.z, -p.x) * NUDGE;
        p.xz *= normalizer;
        iter *= 1.5 + seed * 0.2;
    }

    return n;
}

// =============================================================================
// NEBULA DENSITY
// =============================================================================

float nebulaDensity(vec3 p, float seed) {
    float k = 1.5 + seed * 0.5;
    float spiral = spiralNoise(p * NEBULA_SCALE, seed);
    float detail = fbm3D(p * NEBULA_DETAIL, 4) * 0.35;
    float fine = fbm3D(p * NEBULA_DETAIL * 3.0, 2) * 0.15;
    return k * (0.5 + spiral * 0.5 + detail + fine);
}

// Large-scale density variation - more contrast between bright/dark
float densityVariation(vec3 p, float seed) {
    float largeBright = fbm3D(p * 0.3 + seed * 50.0, 2);
    // Sharper cutoff for more distinct bright regions
    largeBright = smoothstep(-0.1, 0.5, largeBright);
    largeBright = pow(largeBright, 1.5);  // Push towards extremes

    float mediumVar = fbm3D(p * 0.8 + seed * 30.0, 2);
    mediumVar = mediumVar * 0.5 + 0.5;

    // Lower base (0.15) for darker darks, higher multiplier for brighter brights
    float variation = 0.15 + largeBright * (0.6 + mediumVar * 0.4);
    return variation;
}

// Voids - empty regions
float voidMask(vec3 p, float seed) {
    float voidNoise = fbm3D(p * 0.6 + seed * 70.0, 2);
    float voids = smoothstep(-0.5, 0.2, voidNoise);

    float smallVoids = fbm3D(p * 1.5 + seed * 90.0, 2);
    smallVoids = smoothstep(-0.5, 0.1, smallVoids);

    return 0.4 + voids * smallVoids * 0.6;
}

// Bright emission regions - more concentrated hotspots
float brightRegions(vec3 p, float seed) {
    // Larger bright patches - rarer but more intense
    float patch1 = fbm3D(p * 0.4 + seed * 40.0, 2);
    patch1 = pow(max(patch1 + 0.1, 0.0), 2.5);  // Higher threshold, sharper falloff

    // Concentrated bright cores - small intense spots
    float cores = fbm3D(p * 2.0 + seed * 60.0, 2);
    cores = pow(max(cores + 0.3, 0.0), 4.0);  // Very concentrated

    // Extra rare super-bright knots
    float knots = fbm3D(p * 3.0 + seed * 80.0, 2);
    knots = pow(max(knots + 0.6, 0.0), 5.0) * 0.8;

    return patch1 + cores + knots;
}

// =============================================================================
// DISTANT STORM WITH LIGHTNING
// =============================================================================

vec4 distantStorm(vec3 dir, float time, float seed, vec3 stormCenter, float stormSize) {
    float dist = length(dir - stormCenter);

    float stormMask = 1.0 - smoothstep(0.0, stormSize, dist);
    if (stormMask < 0.01) return vec4(0.0);

    // Lifecycle
    float cycleTime = mod(time + seed * STORM_CYCLE, STORM_CYCLE);
    float lifecycle = 0.0;

    if (cycleTime < STORM_FADE_IN) {
        lifecycle = cycleTime / STORM_FADE_IN;
    } else if (cycleTime < STORM_DURATION - STORM_FADE_OUT) {
        lifecycle = 1.0;
    } else if (cycleTime < STORM_DURATION) {
        lifecycle = 1.0 - (cycleTime - (STORM_DURATION - STORM_FADE_OUT)) / STORM_FADE_OUT;
    } else {
        return vec4(0.0);
    }

    lifecycle = smoothstep(0.0, 1.0, lifecycle);

    vec3 localPos = (dir - stormCenter) / stormSize;

    // Dust cloud
    float dustNoise = fbm3D(localPos * 4.0 + seed * 10.0, 3) * 0.5 + 0.5;
    float dustDetail = fbm3D(localPos * 8.0 + seed * 20.0, 2) * 0.5 + 0.5;
    float dust = stormMask * dustNoise * (0.6 + dustDetail * 0.4);

    float swirl = fbm3D(localPos * 3.0 + vec3(time * 0.1, time * 0.05, seed), 2);
    dust *= 0.7 + swirl * 0.3;

    vec3 dustColor = mix(
        vec3(0.5, 0.3, 0.5),
        vec3(0.8, 0.5, 0.3),
        dustNoise
    );

    // Lightning bolts
    float lightning = 0.0;
    vec3 lightningColor = vec3(0.9, 0.95, 1.0);

    for (int i = 0; i < 3; i++) {
        float boltSeed = seed + float(i) * 7.0;
        float boltHash = seedHash(boltSeed);

        float flashFreq = 1.5 + boltHash * 2.0;
        float flashTime = time * flashFreq + boltHash * TAU;

        float flash = 0.0;
        flash += step(0.85, sin(flashTime));
        flash += step(0.9, sin(flashTime * 1.7 + 1.0)) * 0.8;
        flash = min(flash, 1.0);

        float flicker = seedHash(floor(time * 12.0) + boltSeed);
        flash *= step(0.5, flicker);

        if (flash < 0.01) continue;

        // Bolt geometry
        vec3 boltStart = stormCenter + normalize(vec3(
            seedHash(boltSeed + 0.1) - 0.5,
            seedHash(boltSeed + 0.2) + 0.3,
            seedHash(boltSeed + 0.3) - 0.5
        )) * stormSize * 0.3;

        vec3 boltEnd = stormCenter + normalize(vec3(
            seedHash(boltSeed + 0.4) - 0.5,
            seedHash(boltSeed + 0.5) - 0.6,
            seedHash(boltSeed + 0.6) - 0.5
        )) * stormSize * 0.4;

        float boltTime = floor(time * flashFreq * 0.5 + boltHash * 10.0);

        vec3 boltDir = boltEnd - boltStart;
        float boltLen = length(boltDir);
        vec3 boltNorm = boltDir / boltLen;

        vec3 toPoint = dir - boltStart;
        float alongBolt = dot(toPoint, boltNorm);
        float t = clamp(alongBolt / boltLen, 0.0, 1.0);

        // Jagged displacement
        float jagSeed = boltSeed + boltTime * 13.7;
        float jag1 = sin(t * 15.0 + jagSeed) * 0.02;
        float jag2 = sin(t * 31.0 + jagSeed * 2.3) * 0.01;
        vec3 perpOffset = normalize(cross(boltNorm, vec3(0.0, 1.0, 0.1)));

        vec3 jaggedPoint = boltStart + boltNorm * alongBolt;
        jaggedPoint += perpOffset * (jag1 + jag2);

        float distToBolt = length(dir - jaggedPoint);

        float boltCore = exp(-distToBolt * 400.0 / stormSize);
        float boltGlow = exp(-distToBolt * 40.0 / stormSize);

        float taper = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.85, t);

        lightning += (boltCore * 1.5 + boltGlow * 0.4) * flash * taper;
    }

    vec3 litDust = dustColor + lightningColor * lightning * 0.8;

    vec3 stormColor = litDust * dust * 0.6;
    stormColor += lightningColor * lightning * 2.0;

    stormColor *= lifecycle;
    float alpha = dust * 0.6 * lifecycle;

    return vec4(stormColor, alpha);
}

// =============================================================================
// MAIN
// =============================================================================

void main() {
    vec3 dir = normalize(vPosition);

    float time = mod(uTime * TIME_SCALE, 1000.0);
    float realTime = uTime;

    // Quality levels: 0.0 = low, 0.5 = medium, 1.0 = high
    bool isLowQuality = uQuality < 0.3;
    bool isMediumQuality = uQuality >= 0.3 && uQuality < 0.7;
    bool isHighQuality = uQuality >= 0.7;

    // Seed-based parameters
    float sh1 = seedHash(uSeed);
    float sh2 = seedHash(uSeed + 1.0);
    float sh3 = seedHash(uSeed + 2.0);
    float sh4 = seedHash(uSeed + 3.0);
    float sh5 = seedHash(uSeed + 4.0);
    float sh6 = seedHash(uSeed + 5.0);

    // Dramatic nebula (25% chance) - only on medium/high quality
    float dramaticChance = seedHash(uSeed + 10.0);
    bool isDramatic = isHighQuality && dramaticChance > 0.75;
    float dramaticBoost = isDramatic ? 1.8 : 1.0;
    float colorBoost = isDramatic ? 1.5 : 1.0;

    // Animated position
    vec3 animPos = dir + vec3(
        time * FLOW_SPEED * (sh1 - 0.5),
        time * FLOW_SPEED * 0.5,
        time * FLOW_SPEED * (sh2 - 0.5)
    );

    // === BACKGROUND ===
    vec3 finalColor = vec3(0.005, 0.005, 0.008);

    // === STARS ===
    float starField = 0.0;
    vec3 starColor = vec3(1.0);

    vec3 starPos1 = floor(dir * 200.0);
    float starHash1 = seedHash(dot(starPos1, vec3(127.1, 311.7, 74.7)) + uSeed);

    if (starHash1 > 0.994) {
        vec3 starCenter = (starPos1 + 0.5) / 200.0;
        float dist = length(dir - normalize(starCenter));
        starField = exp(-dist * 700.0) * (0.5 + starHash1 * 0.5);

        float colorHash = seedHash(starHash1 * 77.7);
        if (colorHash < 0.3) {
            starColor = vec3(1.0, 0.9, 0.8);
        } else if (colorHash > 0.7) {
            starColor = vec3(0.85, 0.9, 1.0);
        }
    }

    // Faint stars
    vec3 starPos2 = floor(dir * 400.0);
    float starHash2 = seedHash(dot(starPos2, vec3(41.1, 89.3, 173.7)) + uSeed * 3.0);
    if (starHash2 > 0.985) {
        vec3 starCenter2 = (starPos2 + 0.5) / 400.0;
        float dist2 = length(dir - normalize(starCenter2));
        starField = max(starField, exp(-dist2 * 1000.0) * 0.15);
    }

    finalColor += starColor * starField;

    // === NEBULA ===
    vec3 nebulaColor = vec3(0.0);
    float nebulaAlpha = 0.0;

    if (uDensity > 0.01) {
        vec3 lightDir = normalize(vec3(sh1 - 0.5, 0.3, sh2 - 0.5));

        // Density calculation - simplified on low quality
        float mainDensity = nebulaDensity(animPos * 2.0, sh1);
        float density;

        if (isLowQuality) {
            // Low: single sample, no offset
            density = mainDensity;
        } else {
            // Medium/High: dual sample for soft shadows
            float offsetDensity = nebulaDensity(animPos * 2.0 + lightDir * 0.15, sh1);
            density = mainDensity * 0.65 + offsetDensity * 0.35;
        }

        // Heterogeneous density - skip on low quality
        float variation = 0.5;
        float voids = 1.0;
        float brightSpots = 0.0;

        if (!isLowQuality) {
            variation = densityVariation(animPos, sh1);
            density *= 0.3 + variation * 1.2;

            voids = voidMask(animPos, sh2);
            density *= voids;

            brightSpots = brightRegions(animPos, sh3);
            density += brightSpots * 0.4;
        }

        float cloudMask = smoothstep(DENSITY_THRESHOLD, DENSITY_THRESHOLD + DENSITY_FALLOFF, density);
        cloudMask *= uDensity;

        // Color variation - reduced octaves on low quality
        int colorOctaves = isLowQuality ? 2 : 3;
        float colorNoise = fbm3D(animPos * 1.2 + vec3(sh3 * 10.0), colorOctaves);
        colorNoise = colorNoise * 0.5 + 0.5;

        float colorVarAmount = isDramatic ? 0.5 : 0.3;
        float hue = fract(sh1 + colorNoise * COLOR_VARIATION * colorBoost);

        if (!isLowQuality) {
            float regionalHue = fbm3D(animPos * 0.4 + sh4 * 20.0, 2) * colorVarAmount;
            hue = fract(hue + regionalHue);
        }

        nebulaColor = nebulaEmissionColor(hue, colorNoise);

        // Mix with provided colors
        nebulaColor = mix(nebulaColor, uPrimaryColor, 0.25);
        nebulaColor = mix(nebulaColor, uSecondaryColor, colorNoise * 0.15);

        // Extra color layers for dramatic (high quality only)
        if (isDramatic) {
            float secondHue = fract(hue + 0.3 + fbm3D(animPos * 0.8, 2) * 0.2);
            vec3 secondColor = nebulaEmissionColor(secondHue, 0.7);
            float blend = fbm3D(animPos * 1.5 + sh5 * 15.0, 2) * 0.5 + 0.5;
            nebulaColor = mix(nebulaColor, secondColor, blend * 0.4);
        }

        // Brightness variation
        float brightness = BRIGHTNESS_BASE + cloudMask * BRIGHTNESS_RANGE;
        brightness *= 0.7 + sh4 * 0.3;

        if (isLowQuality) {
            // Low: simple brightness
            brightness *= 0.8;
        } else if (isMediumQuality) {
            // Medium: basic hotspots
            float hotspots = fbm3D(animPos * 2.0 + sh6 * 30.0, 2);
            hotspots = pow(max(hotspots + 0.2, 0.0), 2.0);
            brightness *= 0.5 + brightSpots * 1.2;
            brightness *= 0.7 + hotspots * 0.8;
            brightness *= 0.6 + variation * 0.8;
        } else {
            // High: full hotspots with intense cores
            float hotspots = fbm3D(animPos * 2.0 + sh6 * 30.0, 2);
            hotspots = pow(max(hotspots + 0.2, 0.0), 3.0);

            float intenseCores = fbm3D(animPos * 4.0 + sh5 * 50.0, 2);
            intenseCores = pow(max(intenseCores + 0.5, 0.0), 4.0) * 1.5;

            brightness *= 0.4 + brightSpots * 1.8;
            brightness *= 0.6 + hotspots * 1.2 + intenseCores;
            brightness *= 0.5 + variation * 1.0;
        }

        brightness *= dramaticBoost;
        nebulaColor *= brightness;

        if (isDramatic) {
            nebulaColor = pow(nebulaColor, vec3(0.85));
        }

        // Structure and edge glow - skip on low quality
        if (!isLowQuality) {
            float structure = fbm3D(animPos * 4.0, 2) * 0.5 + 0.5;
            nebulaColor *= 0.85 + structure * 0.3;

            float edgeGlow = pow(cloudMask, 0.6) - pow(cloudMask, 1.8);
            nebulaColor += nebulaColor * edgeGlow * (isDramatic ? 0.8 : 0.5);

            float brightEdge = pow(max(brightSpots - 0.2, 0.0), 0.5);
            nebulaColor += nebulaEmissionColor(hue + 0.1, 0.8) * brightEdge * (isDramatic ? 0.5 : 0.3);

            // Dust lanes
            float dustLane = fbm3D(animPos * 1.5 + vec3(sh2 * 5.0), 3);
            dustLane = smoothstep(0.2, 0.5, dustLane);
            nebulaColor *= isDramatic ? (0.65 + dustLane * 0.35) : (0.5 + dustLane * 0.5);

            nebulaColor *= 0.2 + voids * 0.8;
        }

        nebulaAlpha = cloudMask * 0.7 * (isLowQuality ? 1.0 : voids);
    }

    // Combine nebula with background
    float obscuration = nebulaAlpha * 0.8;
    finalColor = mix(finalColor, nebulaColor, obscuration);
    finalColor += starColor * starField * (1.0 - obscuration) * 0.3;

    // === STORMS (medium/high quality only) ===
    if (!isLowQuality) {
        // Fewer storms on medium, full on high
        int maxStorms = isMediumQuality ? 2 : 5;
        int numStorms = min(3 + int(sh6 * 3.0), maxStorms);

        for (int i = 0; i < 5; i++) {
            if (i >= numStorms) break;

            float stormSeed = seedHash(uSeed + float(i) * 31.0 + 400.0);

            vec3 stormCenter = normalize(vec3(
                seedHash(stormSeed) - 0.5,
                seedHash(stormSeed + 0.1) - 0.5,
                seedHash(stormSeed + 0.2) - 0.5
            ));

            float stormSize = 0.15 + seedHash(stormSeed + 0.3) * 0.2;
            float stormTimeOffset = float(i) * 2.5;

            vec4 storm = distantStorm(dir, realTime + stormTimeOffset, stormSeed, stormCenter, stormSize);
            finalColor = mix(finalColor, finalColor + storm.rgb, storm.a);
        }
    }

    // Final alpha
    float finalAlpha = max(nebulaAlpha, starField * 0.8);
    finalAlpha = max(finalAlpha, 0.02);

    gl_FragColor = vec4(finalColor, finalAlpha * uOpacity);
}
