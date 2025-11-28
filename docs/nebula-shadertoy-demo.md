# Nebula Shadertoy Demo

A standalone Shadertoy demo showcasing the procedural nebula generation system.

## Location

`public/shaders/v2/background/demo.glsl`

## Features

- **Click to regenerate**: Each click generates a new nebula with a different seed
- **Mouse drag rotation**: Click and drag to rotate the view around the nebula
- **Auto-rotation**: When not interacting, the camera slowly rotates automatically
- **Procedural generation**: Uses spiral noise and FBM for organic cloud structures
- **Dynamic coloring**: HSV-based coloring with seed-derived hue variations
- **Background stars**: Two layers of procedural stars for depth

## How to Use

1. Copy the contents of `demo.glsl`
2. Go to [Shadertoy.com](https://www.shadertoy.com/)
3. Click "New" to create a new shader
4. Paste the code and run

## Controls

| Action | Effect |
|--------|--------|
| Click + Drag | Rotate camera around the nebula (nebula stays the same) |
| Click at new location | Generate a new random nebula |
| No interaction | Slow auto-rotation |

> **Note**: The nebula seed is based on where you *click*, not where you drag. So you can freely rotate the view without changing the nebula. Click at a different screen position to generate a new one.

## Technical Details

The demo is self-contained and includes all necessary functions:

- **Seed hashing**: Stable, fract-based hash (avoids sin() precision issues)
- **3D Simplex noise**: For detailed cloud structures
- **FBM (Fractional Brownian Motion)**: Layered noise for natural patterns
- **Spiral noise**: Creates organic, swirling nebula shapes
- **HSV color generation**: Vibrant, varied nebula colors

## Based On

- "Type 2 Supernova" by Duke (Shadertoy)
- otaviogood's spiral noise technique
- Dave Hoskins' stable hash functions

