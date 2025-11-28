/**
 * Planet Visualization Component
 * Procedural SVG visualization of exoplanets based on their properties
 * Replicates shader color logic from planet shaders (rocky.frag, icyWorld.frag, lavaWorld.frag)
 */

import type { Exoplanet } from '../types';
import { shouldHaveRings } from '../utils/solarSystem';

interface PlanetVisualizationProps {
  planet: Exoplanet;
  size?: number;
}

// Color palettes by planet type - matching planetUniforms.ts exactly
const PLANET_COLORS: Record<string, string> = {
  'Gas Giant': '#d4a854',     // Warm golden (Saturn-like)
  'Neptune-like': '#3b8fd9',  // Rich blue
  'Sub-Neptune': '#4eb8e0',   // Cyan-blue
  'Super-Earth': '#b5885a',   // Warm tan/ochre
  'Earth-sized': '#5a9668',   // Verdant green
  'Sub-Earth': '#c4623a',     // Mars-like rust
  'Terrestrial': '#d9a050',   // Desert tan
};

// Normalization ranges (matching planetUniforms.ts)
const DENSITY_MIN = 0.3;
const DENSITY_MAX = 13.0;
const INSOL_MIN = 0.01;
const INSOL_MAX = 10000;

// Temperature thresholds (from rocky.frag shader)
const TEMP_ICE_LOW = 180.0;
const TEMP_ICE_HIGH = 250.0;
const TEMP_VOLCANIC_LOW = 400.0;
const TEMP_VOLCANIC_HIGH = 800.0;

// Shader constants (from rocky.frag) - adjusted for brighter SVG thumbnails
const HUE_SHIFT_RANGE = 0.15;
const DENSITY_HUE_SHIFT = 0.08;
const SAT_BASE_MULT = 0.9;      // Slightly higher saturation for thumbnails
const SAT_SEED_MULT = 0.2;
const SAT_MIN_CLAMP = 0.4;      // Higher minimum saturation
const SAT_MAX_CLAMP = 1.0;
const DENSITY_SAT_BOOST = 0.15;
const LOWLAND_BRIGHTNESS = 1.0;  // Full brightness for daytime look (was 0.7)
const INSOL_VOLCANIC_BOOST = 200.0;
const INSOL_ICE_PENALTY = 100.0;
const STAR_TINT_STRENGTH = 0.2;  // Reduced star tinting for brighter colors

// Thumbnail brightness boost (SVG doesn't have 3D lighting, so we brighten)
const THUMBNAIL_BRIGHTNESS_BOOST = 1.3;

// Ice world colors (from rocky.frag and icyWorld.frag)
const ICE_BASE_RED = 0.8;
const ICE_SEED_RED_RANGE = 0.15;
const ICE_BASE_GREEN = 0.85;
const ICE_SEED_GREEN_RANGE = 0.1;
const ICE_BASE_BLUE = 0.9;
const ICE_SEED_BLUE_RANGE = 0.1;
const ICE_LOWLAND_TINT = 0.6;

// Volcanic world colors (from rocky.frag)
const LAVA_RED = 1.0;
const LAVA_GREEN_BASE = 0.2;
const LAVA_GREEN_SEED_RANGE = 0.3;
const LAVA_BLUE_BASE = 0.05;
const LAVA_BLUE_SEED_RANGE = 0.15;
const VOLCANIC_LAVA_BRIGHTNESS = 0.8;
const VOLCANIC_LOWLAND_MIX = 0.5;

// Star temperature constants (from rocky.frag)
const STAR_TEMP_RED_DWARF = 3500.0;
const STAR_TEMP_SUN = 5778.0;
const STAR_TEMP_HOT = 8000.0;

/**
 * Generate a deterministic seed from planet name (0-1 range)
 * Matches the algorithm in planetUniforms.ts
 */
function generateSeed(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Normalize a value to 0-1 range with clamping
 */
function normalize(value: number | null, min: number, max: number, fallback: number = 0.5): number {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * GLSL-style smoothstep function
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Linear interpolation (GLSL mix equivalent)
 */
function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

/**
 * Mix two RGB color arrays
 */
function mixColor(a: number[], b: number[], t: number): number[] {
  return [
    mix(a[0], b[0], t),
    mix(a[1], b[1], t),
    mix(a[2], b[2], t)
  ];
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Fractional part (GLSL fract equivalent)
 */
function fract(x: number): number {
  return x - Math.floor(x);
}

/**
 * Convert RGB (0-1 normalized) to HSV (0-1 normalized)
 * Matches GLSL rgb2hsv function from rocky.frag
 */
function rgb2hsv(r: number, g: number, b: number): [number, number, number] {
  const RGB_TO_HSV_EPSILON = 1.0e-10;
  
  // GLSL-style conversion matching shader
  const p = b < g 
    ? [g, b, -1.0, 2.0 / 3.0]
    : [b, g, 0.0, -1.0 / 3.0];
  
  const q = p[0] < r
    ? [r, p[1], p[3], p[0]]
    : [p[0], p[1], p[2], r];
  
  const delta = q[0] - Math.min(q[3], q[1]);
  
  const h = Math.abs(q[2] + (q[3] - q[1]) / (6.0 * delta + RGB_TO_HSV_EPSILON));
  const s = delta / (q[0] + RGB_TO_HSV_EPSILON);
  const v = q[0];
  
  return [h, s, v];
}

/**
 * Convert HSV (0-1 normalized) to RGB (0-1 normalized)
 * Matches GLSL hsv2rgb function from rocky.frag
 */
function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const k = [1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0];
  
  const px = Math.abs(fract(h + k[0]) * 6.0 - k[3]);
  const py = Math.abs(fract(h + k[1]) * 6.0 - k[3]);
  const pz = Math.abs(fract(h + k[2]) * 6.0 - k[3]);
  
  const r = v * mix(k[0], clamp(px - k[0], 0.0, 1.0), s);
  const g = v * mix(k[0], clamp(py - k[0], 0.0, 1.0), s);
  const b = v * mix(k[0], clamp(pz - k[0], 0.0, 1.0), s);
  
  return [r, g, b];
}

/**
 * Parse hex color to normalized RGB (0-1 range)
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Get star tint color based on temperature
 * Matches getStarTint function from rocky.frag
 */
function getStarTint(starTemp: number): [number, number, number] {
  const redDwarfTint: [number, number, number] = [1.0, 0.7, 0.5];
  const sunTint: [number, number, number] = [1.0, 0.98, 0.95];
  const hotStarTint: [number, number, number] = [0.85, 0.9, 1.0];
  
  if (starTemp < STAR_TEMP_SUN) {
    const t = smoothstep(STAR_TEMP_RED_DWARF, STAR_TEMP_SUN, starTemp);
    return mixColor(redDwarfTint, sunTint, t) as [number, number, number];
  } else {
    const t = smoothstep(STAR_TEMP_SUN, STAR_TEMP_HOT, starTemp);
    return mixColor(sunTint, hotStarTint, t) as [number, number, number];
  }
}

/**
 * Get lava world color (from lavaWorld.frag shader)
 * Creates volcanic rock with prominent orange/red lava glow for thumbnails
 */
function getLavaWorldColor(seed: number, temperature: number, insolation: number): [number, number, number] {
  // Lava world colors - brightened for thumbnail visibility
  const MAGMA_YELLOW: [number, number, number] = [1.0, 0.7, 0.2];
  const MAGMA_ORANGE: [number, number, number] = [1.0, 0.5, 0.15];
  const MAGMA_RED: [number, number, number] = [0.95, 0.25, 0.1];
  const ROCK_WARM: [number, number, number] = [0.35, 0.18, 0.1];
  const ROCK_HOT: [number, number, number] = [0.5, 0.25, 0.12];
  
  // Temperature affects overall activity
  const tempFactor = clamp((temperature - 800) / 2200, 0, 1);
  const activity = 0.7 + tempFactor * 0.3 + insolation * 0.15;
  
  // Start with warm rock base (brighter than before)
  const rockMix = seed * 0.5 + 0.5;
  let colorR = mix(ROCK_WARM[0], ROCK_HOT[0], rockMix);
  let colorG = mix(ROCK_WARM[1], ROCK_HOT[1], rockMix);
  let colorB = mix(ROCK_WARM[2], ROCK_HOT[2], rockMix);
  
  // Add strong lava glow based on activity (more prominent for thumbnails)
  const lavaGlow = activity * 0.6;
  const lavaColor = tempFactor > 0.6 ? MAGMA_YELLOW : (tempFactor > 0.3 ? MAGMA_ORANGE : MAGMA_RED);
  colorR = mix(colorR, lavaColor[0], lavaGlow);
  colorG = mix(colorG, lavaColor[1], lavaGlow);
  colorB = mix(colorB, lavaColor[2], lavaGlow);
  
  // Add emission glow for that hot planet look
  colorR += lavaColor[0] * activity * 0.25;
  colorG += lavaColor[1] * activity * 0.15;
  colorB += lavaColor[2] * activity * 0.08;
  
  return [clamp(colorR, 0, 1.2), clamp(colorG, 0, 1), clamp(colorB, 0, 1)];
}

/**
 * Get ice world color (from icyWorld.frag shader)
 * Creates bright, vibrant icy surfaces with blue tints for thumbnails
 */
function getIceWorldColor(seed: number, temperature: number): [number, number, number] {
  // Ice world colors - bright and vibrant for thumbnails
  const ICE_WHITE: [number, number, number] = [0.95, 0.97, 1.0];
  const ICE_BLUE: [number, number, number] = [0.75, 0.88, 1.0];
  const ICE_CYAN: [number, number, number] = [0.65, 0.92, 1.0];
  
  // Cold factor affects ice appearance
  const coldFactor = clamp((250 - temperature) / 150, 0, 1);
  
  // Base ice color - predominantly white with blue variation
  const iceMix = seed * 0.5 + 0.5;
  let colorR = mix(ICE_BLUE[0], ICE_WHITE[0], iceMix);
  let colorG = mix(ICE_BLUE[1], ICE_WHITE[1], iceMix);
  let colorB = mix(ICE_BLUE[2], ICE_WHITE[2], iceMix);
  
  // Add cyan tint variation for visual interest
  const cyanFactor = seed * 0.35;
  colorR = mix(colorR, ICE_CYAN[0], cyanFactor);
  colorG = mix(colorG, ICE_CYAN[1], cyanFactor);
  colorB = mix(colorB, ICE_CYAN[2], cyanFactor);
  
  // Ice worlds are bright - full daytime brightness
  const brightnessFactor = 1.0 + coldFactor * 0.15;
  colorR *= brightnessFactor;
  colorG *= brightnessFactor;
  colorB *= brightnessFactor;
  
  return [clamp(colorR, 0, 1.1), clamp(colorG, 0, 1.1), clamp(colorB, 0, 1.1)];
}

/**
 * Get planet color based on type/subtype and apply shader-like modifications
 * Checks planet_subtype first for specialized shaders, then falls back to rocky.frag logic
 */
function getPlanetColor(planet: Exoplanet): string {
  const planetType = planet.planet_type || 'Terrestrial';
  const planetSubtype = planet.planet_subtype;
  const baseColorHex = PLANET_COLORS[planetType] || '#888888';
  
  // Generate seed for variation
  const seed = generateSeed(planet.pl_name);
  
  // Normalize planet properties
  const density = normalize(planet.pl_dens, DENSITY_MIN, DENSITY_MAX, 0.5);
  const insolation = normalize(planet.pl_insol, INSOL_MIN, INSOL_MAX, 0.5);
  const temperature = planet.pl_eqt ?? 300;
  const starTemp = planet.st_teff ?? STAR_TEMP_SUN;
  
  let colorR: number, colorG: number, colorB: number;
  
  // === CHECK FOR SPECIALIZED SUBTYPES (matching getPlanetShaderType from planetUniforms.ts) ===
  if (planetSubtype === 'Lava World') {
    // Use lavaWorld.frag colors
    [colorR, colorG, colorB] = getLavaWorldColor(seed, temperature, insolation);
  } else if (planetSubtype === 'Ice World') {
    // Use icyWorld.frag colors
    [colorR, colorG, colorB] = getIceWorldColor(seed, temperature);
  } else {
    // Parse base color to normalized RGB (0-1 range like GLSL)
    const [baseR, baseG, baseB] = hexToRgb(baseColorHex);
    
    // Check planet classification
    const isRocky = ['Sub-Earth', 'Earth-sized', 'Super-Earth', 'Terrestrial'].includes(planetType);
    
    // === COLOR VARIATION FROM SEED AND DENSITY (matching shader exactly) ===
    let [h, s, v] = rgb2hsv(baseR, baseG, baseB);
    
    // Rotate hue based on seed for variety
    const seedHueShift = seed * HUE_SHIFT_RANGE;
    h = fract(h + seedHueShift);
    
    // Density affects color: high density = iron-rich (shift toward red/orange)
    const densityHueShift = (density - 0.5) * DENSITY_HUE_SHIFT;
    h = fract(h - densityHueShift + 1.0); // +1.0 ensures positive result
    
    // Vary saturation based on seed and density
    const densitySatBoost = density * DENSITY_SAT_BOOST;
    s = clamp(s * (SAT_BASE_MULT + seed * SAT_SEED_MULT) + densitySatBoost, SAT_MIN_CLAMP, SAT_MAX_CLAMP);
    
    // Convert back to RGB - this is seedVariedBaseColor in the shader
    [colorR, colorG, colorB] = hsv2rgb(h, s, v);
    
    if (isRocky) {
      // === TEMPERATURE ANALYSIS (matching shader) ===
      let effectiveTemp = temperature;
      effectiveTemp += (insolation - 0.5) * INSOL_VOLCANIC_BOOST;
      if (insolation < 0.5) {
        effectiveTemp -= (0.5 - insolation) * INSOL_ICE_PENALTY;
      }
      
      const iceFactor = smoothstep(TEMP_ICE_HIGH, TEMP_ICE_LOW, effectiveTemp);
      const volcanicFactor = smoothstep(TEMP_VOLCANIC_LOW, TEMP_VOLCANIC_HIGH, effectiveTemp);
      
      // === BASE TERRAIN COLOR (lowland) - multiply RGB by brightness ===
      let lowlandR = colorR * LOWLAND_BRIGHTNESS;
      let lowlandG = colorG * LOWLAND_BRIGHTNESS;
      let lowlandB = colorB * LOWLAND_BRIGHTNESS;
      
      // === ICE WORLD COLORING ===
      if (iceFactor > 0) {
        const iceR = (ICE_BASE_RED + seed * ICE_SEED_RED_RANGE) * ICE_LOWLAND_TINT;
        const iceG = (ICE_BASE_GREEN + seed * ICE_SEED_GREEN_RANGE) * ICE_LOWLAND_TINT;
        const iceB = (ICE_BASE_BLUE + seed * ICE_SEED_BLUE_RANGE) * ICE_LOWLAND_TINT;
        
        lowlandR = mix(lowlandR, iceR, iceFactor);
        lowlandG = mix(lowlandG, iceG, iceFactor);
        lowlandB = mix(lowlandB, iceB, iceFactor);
      }
      
      // === VOLCANIC WORLD COLORING ===
      if (volcanicFactor > 0) {
        const lavaR = LAVA_RED * VOLCANIC_LAVA_BRIGHTNESS;
        const lavaG = (LAVA_GREEN_BASE + seed * LAVA_GREEN_SEED_RANGE) * VOLCANIC_LAVA_BRIGHTNESS;
        const lavaB = (LAVA_BLUE_BASE + seed * LAVA_BLUE_SEED_RANGE) * VOLCANIC_LAVA_BRIGHTNESS;
        
        const volcanicMixFactor = volcanicFactor * VOLCANIC_LOWLAND_MIX;
        lowlandR = mix(lowlandR, lavaR, volcanicMixFactor);
        lowlandG = mix(lowlandG, lavaG, volcanicMixFactor);
        lowlandB = mix(lowlandB, lavaB, volcanicMixFactor);
      }
      
      colorR = lowlandR;
      colorG = lowlandG;
      colorB = lowlandB;
    } else {
      // Gas giant/ice giant - apply lowland brightness
      colorR *= LOWLAND_BRIGHTNESS;
      colorG *= LOWLAND_BRIGHTNESS;
      colorB *= LOWLAND_BRIGHTNESS;
      
      // Hot gas giants get warmer colors
      const TEMP_THRESHOLD_LOW = 500;
      const TEMP_THRESHOLD_HIGH = 2000;
      const tempFactor = clamp((temperature - TEMP_THRESHOLD_LOW) / (TEMP_THRESHOLD_HIGH - TEMP_THRESHOLD_LOW), 0, 1);
      
      if (tempFactor > 0) {
        // Shift toward red-orange for hot gas giants
        const warmShift = tempFactor * 0.3;
        colorR = colorR * (1 + warmShift * 0.5);
        colorG = colorG * (1 - warmShift * 0.2);
        colorB = colorB * (1 - warmShift * 0.4);
      }
    }
  }
  
  // === STAR TEMPERATURE TINTING (matching shader) ===
  const [tintR, tintG, tintB] = getStarTint(starTemp);
  colorR = mix(colorR, colorR * tintR, STAR_TINT_STRENGTH);
  colorG = mix(colorG, colorG * tintG, STAR_TINT_STRENGTH);
  colorB = mix(colorB, colorB * tintB, STAR_TINT_STRENGTH);
  
  // === THUMBNAIL BRIGHTNESS BOOST ===
  // SVG thumbnails don't have 3D lighting effects, so we brighten them
  // to simulate a well-lit "daytime" view of the planet
  colorR *= THUMBNAIL_BRIGHTNESS_BOOST;
  colorG *= THUMBNAIL_BRIGHTNESS_BOOST;
  colorB *= THUMBNAIL_BRIGHTNESS_BOOST;
  
  // Convert to 0-255 range and clamp
  const finalR = Math.round(clamp(colorR * 255, 0, 255));
  const finalG = Math.round(clamp(colorG * 255, 0, 255));
  const finalB = Math.round(clamp(colorB * 255, 0, 255));
  
  return `rgb(${finalR}, ${finalG}, ${finalB})`;
}

/**
 * Normalize planet radius for visualization (0-1 range)
 */
function normalizeRadius(radius: number | null): number {
  if (radius === null || radius === undefined) return 0.5;
  // Earth radius = 1, Jupiter radius ≈ 11.2
  // Normalize to 0.1-1.0 range for visualization
  return Math.max(0.1, Math.min(1.0, radius / 11.2));
}

export function PlanetVisualization({ planet, size = 64 }: PlanetVisualizationProps) {
  const planetType = planet.planet_type || 'Terrestrial';
  const baseColor = getPlanetColor(planet); // Now uses full planet data
  const seed = generateSeed(planet.pl_name);
  const radius = normalizeRadius(planet.pl_rade);
  const planetRadius = (size / 2) * (0.65 + radius * 0.3); // 65-95% of size (larger thumbnails)
  
  // Use physics-based heuristic for rings (Hill/Roche ratio, temperature, size, age)
  const hasRings = shouldHaveRings(planet);
  const isRocky = ['Sub-Earth', 'Earth-sized', 'Super-Earth', 'Terrestrial'].includes(planetType);
  const isGasGiant = planetType === 'Gas Giant';
  
  // Generate surface pattern seed values
  const patternSeed1 = Math.floor(seed * 10);
  const patternSeed2 = Math.floor(seed * 20);
  const patternSeed3 = Math.floor(seed * 30);
  
  // Extract RGB values from baseColor (now in rgb(r, g, b) format)
  const rgbMatch = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const r = rgbMatch ? parseInt(rgbMatch[1]) : 200;
  const g = rgbMatch ? parseInt(rgbMatch[2]) : 200;
  const b = rgbMatch ? parseInt(rgbMatch[3]) : 200;
  const glowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
  const innerGlowColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Pre-compute transform values for rings
  const outerRingRotation = patternSeed1 * 360;
  const middleRingRotation = (patternSeed1 * 360) + 5;
  const innerRingRotation = (patternSeed1 * 360) - 3;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="planet-visualization"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filter */}
        <filter id={`glow-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Surface pattern for rocky planets */}
        {isRocky && (
          <pattern
            id={`surface-${patternSeed1}`}
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx={patternSeed1} cy={patternSeed2} r="0.5" fill={baseColor} opacity="0.3"/>
            <circle cx={patternSeed2 + 10} cy={patternSeed3} r="0.3" fill={baseColor} opacity="0.2"/>
            <circle cx={patternSeed3 + 5} cy={patternSeed1 + 10} r="0.4" fill={baseColor} opacity="0.25"/>
          </pattern>
        )}
        
        {/* Cloud pattern for gas giants */}
        {isGasGiant && (
          <pattern
            id={`clouds-${patternSeed1}`}
            x="0"
            y="0"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <ellipse cx={patternSeed1 * 10} cy={patternSeed2 * 10} rx="3" ry="1.5" fill="white" opacity="0.1"/>
            <ellipse cx={patternSeed2 * 10 + 15} cy={patternSeed3 * 10} rx="2" ry="1" fill="white" opacity="0.08"/>
            <ellipse cx={patternSeed3 * 10 + 5} cy={patternSeed1 * 10 + 15} rx="2.5" ry="1.2" fill="white" opacity="0.12"/>
          </pattern>
        )}
        
        {/* Band pattern for Neptune-like */}
        {planetType === 'Neptune-like' && (
          <linearGradient id={`bands-${patternSeed1}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={baseColor} stopOpacity="1"/>
            <stop offset="30%" stopColor={baseColor} stopOpacity="0.8"/>
            <stop offset="50%" stopColor={baseColor} stopOpacity="0.9"/>
            <stop offset="70%" stopColor={baseColor} stopOpacity="0.8"/>
            <stop offset="100%" stopColor={baseColor} stopOpacity="1"/>
          </linearGradient>
        )}
      </defs>
      
      {/* Outer glow */}
      <circle
        cx={centerX}
        cy={centerY}
        r={planetRadius + 4}
        fill={glowColor}
        opacity="0.3"
      />
      
      {/* Inner glow */}
      <circle
        cx={centerX}
        cy={centerY}
        r={planetRadius + 2}
        fill={innerGlowColor}
        opacity="0.5"
      />
      
      {/* Planet body */}
      <circle
        cx={centerX}
        cy={centerY}
        r={planetRadius}
        fill={planetType === 'Neptune-like' ? `url(#bands-${patternSeed1})` : baseColor}
        filter={`url(#glow-${seed})`}
        style={{
          fill: isRocky ? `url(#surface-${patternSeed1})` : isGasGiant ? `url(#clouds-${patternSeed1})` : baseColor,
        }}
      />
      
      {/* Surface details for rocky planets */}
      {isRocky && (
        <>
          {/* Crater-like features */}
          <circle cx={centerX - planetRadius * 0.3} cy={centerY - planetRadius * 0.2} r={planetRadius * 0.08} fill="black" opacity="0.2"/>
          <circle cx={centerX + planetRadius * 0.4} cy={centerY + planetRadius * 0.3} r={planetRadius * 0.06} fill="black" opacity="0.15"/>
          <ellipse cx={centerX + planetRadius * 0.2} cy={centerY - planetRadius * 0.4} rx={planetRadius * 0.1} ry={planetRadius * 0.05} fill="black" opacity="0.18"/>
        </>
      )}
      
      {/* Rings for gas giants and Neptune-like */}

      {hasRings && (
        <>
          {/* Outer ring */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={planetRadius * 1.4}
            ry={planetRadius * 0.15}
            fill="transparent"
            stroke={baseColor}
            strokeWidth={1}
            opacity={0.4}
            transform={`rotate(${outerRingRotation} ${centerX} ${centerY})`}
          />
          {/* Middle ring */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={planetRadius * 1.25}
            ry={planetRadius * 0.12}
            fill="transparent"
            stroke={baseColor}
            strokeWidth={0.8}
            opacity={0.5}
            transform={`rotate(${middleRingRotation} ${centerX} ${centerY})`}
          />
          {/* Inner ring */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={planetRadius * 1.1}
            ry={planetRadius * 0.1}
            fill="transparent"
            stroke={baseColor}
            strokeWidth={0.6}
            opacity={0.6}
            transform={`rotate(${innerRingRotation} ${centerX} ${centerY})`}
          />
        </>
      )}
    </svg>
  );
}

