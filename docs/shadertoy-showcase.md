# Shadertoy Showcase Shader

This document explains how to use the Exoplanets shader showcase on Shadertoy.

## Quick Start

1. Go to [Shadertoy](https://www.shadertoy.com/)
2. Click **"New Shader"**
3. Delete all existing code in the editor
4. Copy the entire contents of [`shadertoy-showcase.glsl`](./shadertoy-showcase.glsl)
5. Paste into Shadertoy and click **▶ Play**

## Features

The showcase includes:

| Feature | Description |
|---------|-------------|
| 🎥 **3D Camera** | Full orbit controls - fly around the scene! |
| 🌟 **Realistic Star** | Animated convection cells, sunspots, limb darkening, flares |
| 🪨 **Rocky Planets** | Terrain generation, ice caps, volcanic features, craters |
| 🌀 **Gas Giants** | Banded atmosphere, great red spot storms, turbulence |
| 🧊 **Ice Giants** | Soft atmospheric bands, methane tinting, dark spots |
| ✨ **Corona Glow** | 3D star glow visible from any angle |
| 🌌 **Star Field** | Procedural 3D background stars |
| 💡 **Real Lighting** | Planet lit by the star with shadows |

## Interactive Controls

| Control | Effect |
|---------|--------|
| **Mouse X** | Orbit camera horizontally (full 360°) |
| **Mouse Y** | Orbit camera vertically (pitch up/down) |
| **No interaction** | Camera gently auto-rotates |

## Scene Layout

The shader displays a complete mini solar system:

```
                    ☀️ STAR (center)
                         |
    🧊 Ice Giant    ←    |    →    🪨 Rocky Planet
    (outer orbit)        |         (inner orbit)
                         ↓
                    🌀 Gas Giant
                    (middle orbit)
```

All three planet types are visible simultaneously - orbit around to see them all!

## Customization

Edit the configuration section at the top of the shader:

```glsl
// Star at the center of the system
#define STAR_CENTER vec3(0.0, 0.0, 0.0)    // Star position
#define STAR_RADIUS 1.0                     // Star size

// Rocky planet (closest - like Earth)
#define ROCKY_CENTER vec3(2.5, 0.0, 0.0)   // Inner orbit
#define ROCKY_RADIUS 0.3                    // Small terrestrial

// Gas giant (middle - like Jupiter)  
#define GAS_CENTER vec3(0.0, 0.0, 4.0)     // Middle orbit
#define GAS_RADIUS 0.7                      // Large gas giant

// Ice giant (farthest - like Neptune)
#define ICE_CENTER vec3(-3.5, 0.5, -2.0)   // Outer orbit
#define ICE_RADIUS 0.5                      // Medium ice giant

// Camera settings
#define CAMERA_DISTANCE 8.0                 // How far camera orbits
#define CAMERA_FOV 1.8                      // Field of view
```

### Planet Positioning Tips

| Axis | Effect |
|------|--------|
| `X` | Left (-) / Right (+) |
| `Y` | Down (-) / Up (+) |
| `Z` | Toward camera (-) / Away (+) |

### Camera Adjustments

| Setting | Effect |
|---------|--------|
| `CAMERA_DISTANCE` | Increase to zoom out, decrease to zoom in |
| `CAMERA_FOV` | Lower values = more telephoto, higher = wider angle |

### Adding More Planets

To add a fourth planet, add these defines and copy a planet intersection block:

```glsl
#define MOON_CENTER vec3(3.0, 0.0, 0.5)   // Near the rocky planet
#define MOON_RADIUS 0.1                    // Tiny moon
```

### Star Spectral Classes

Change `STAR_COLOR_G` in the `renderCorona` and `renderStar` calls to use different star types:

| Class | Color | Temperature |
|-------|-------|-------------|
| O | `STAR_COLOR_O` | 30,000K+ (Blue-white) |
| B | `STAR_COLOR_B` | 10,000-30,000K (Blue-white) |
| A | `STAR_COLOR_A` | 7,500-10,000K (White) |
| F | `STAR_COLOR_F` | 6,000-7,500K (Yellow-white) |
| G | `STAR_COLOR_G` | 5,200-6,000K (Yellow, like our Sun) |
| K | `STAR_COLOR_K` | 3,700-5,200K (Orange) |
| M | `STAR_COLOR_M` | 2,400-3,700K (Red) |

## Shader Structure

```
shadertoy-showcase.glsl
├── Configuration defines
├── Noise Functions
│   ├── snoise3D() - 3D Simplex noise for star surface
│   ├── snoise2D() - 2D Simplex noise for planets
│   ├── fbm3D()    - Fractional Brownian Motion 3D
│   └── fbm2D()    - Fractional Brownian Motion 2D
├── Color Utilities
│   ├── hsv2rgb()  - HSV to RGB conversion
│   └── rgb2hsv()  - RGB to HSV conversion
├── Celestial Renderers
│   ├── renderStar()        - Star surface with all effects
│   ├── renderRockyPlanet() - Terrestrial world shader
│   ├── renderGasGiant()    - Jupiter-like planet shader
│   ├── renderIceGiant()    - Neptune-like planet shader
│   └── renderCorona()      - Star glow effect
├── Utilities
│   └── intersectSphere()   - Ray-sphere intersection
└── mainImage()             - Main entry point
```

## Differences from Three.js Version

The original shaders use Three.js uniforms and varyings. Key adaptations:

| Three.js | Shadertoy |
|----------|-----------|
| `uniform float uTime` | `iTime` |
| `uniform vec3 uBaseColor` | Direct parameter |
| `varying vec3 vNormal` | Computed from sphere intersection |
| `varying vec2 vUv` | Computed as lat/long projection |
| `gl_FragColor` | `fragColor` output parameter |
| Actual sphere geometry | Implicit sphere via ray intersection |

## Creating Your Own Variations

### Single Planet View

Replace `mainImage` with:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    vec3 color = vec3(0.01);
    
    vec3 normal;
    vec2 sphereUv;
    if (intersectSphere(uv, vec2(0.0), 0.8, normal, sphereUv)) {
        color = renderGasGiant(sphereUv, normal, GAS_GIANT_COLOR, 0.5);
    }
    
    fragColor = vec4(pow(color, vec3(1.0/2.2)), 1.0);
}
```

### Multiple Planets (Solar System)

```glsl
// Add multiple intersectSphere calls at different positions
vec2 positions[4] = vec2[4](
    vec2(-0.6, 0.0),  // Mercury
    vec2(-0.2, 0.0),  // Venus  
    vec2(0.2, 0.0),   // Earth
    vec2(0.7, 0.0)    // Mars
);
```

## Performance Notes

- The shader uses multiple octaves of noise which can be heavy on mobile
- Reduce `fbm` octave counts for better performance
- The star surface is the most expensive to render

## Links

- [Shadertoy](https://www.shadertoy.com/) - Create and share shaders
- [Book of Shaders](https://thebookofshaders.com/) - Learn GLSL
- [Exoplanets Project](https://github.com/guinetik/exoplanets) - Original project

## License

This shader is part of the Exoplanets visualization project.
Feel free to use, modify, and share!

