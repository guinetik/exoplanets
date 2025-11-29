# Star Surface Shader V2

The star surface shader creates dramatic, dynamic burning star surfaces inspired by real solar imagery and Shadertoy techniques.

## Location

`public/shaders/v2/star/surface.frag`

## Features

### Boiling Plasma Effect
The surface appears to bubble and boil like real solar plasma:
- Multi-octave turbulent noise
- Each octave offset in time for swirling motion
- Creates organic, flowing patterns

### Spherical Distortion
Creates the characteristic "bulging outward" effect:
- Center of star bulges toward viewer
- Edges compress naturally
- UV coordinates distorted based on spherical geometry

### Convection Cells
Simulates rising and sinking plasma:
- Bright cells appear to rise
- Dark cells appear to sink
- Creates granulation-like texture

### Outward-Flowing Flames
Radial flame patterns that flow from center to edge:
- 7 octave noise accumulation
- Time-distorted coordinates for organic movement
- Edge flames more intense (corona-like spillover)

### Color Mapping
Temperature-based coloring with intensity variation:
- **Hot spots**: White-yellow (intensity > 0.7)
- **Medium**: Base temperature color (intensity 0.4-0.7)
- **Cool spots**: Deeper, more saturated (intensity < 0.4)

## Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `uStarColor` | vec3 | Base star color |
| `uTime` | float | Animation time |
| `uTemperature` | float | Star temperature in Kelvin |
| `uSeed` | float | Deterministic seed for this star |
| `uActivityLevel` | float | Stellar activity level (0-1) |

## Technical Details

### Spherical Distortion Formula
```glsl
float f = (1.0 - sqrt(abs(1.0 - r))) / (r + 0.001);
vec2 distortedUV = uv * mix(1.0, f, intensity);
```

### Plasma Noise
Uses 5-octave simplex noise with time-offset swirling:
```glsl
for (int i = 0; i < 5; i++) {
    vec3 offset = vec3(
        sin(time * 0.1 + float(i)) * 0.5,
        cos(time * 0.15 + float(i) * 0.7) * 0.5,
        time * 0.05
    );
    value += amplitude * snoise3D((p + offset) * frequency);
}
```

### Performance Considerations
- Uses `wrapTime()` to prevent Chrome/ANGLE precision loss
- 7 octave flame noise (can reduce for lower-end GPUs)
- 5 octave plasma noise

## Inspiration

Based on trisomie21's Shadertoy star technique, enhanced with:
- Physically-grounded temperature mapping
- Convection cell simulation
- Dynamic activity levels

## See Also

- [Shader System V2](visualization-shader-system-v2.md) - Complete shader architecture
- [Star System Overview](feature-star-system-overview.md) - Where stars are displayed
- [ShaderService API](api-shader-service.md) - Shader loading
