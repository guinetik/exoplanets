# Shader V2 System

The V2 shader system is a complete rewrite of the procedural planet and star shaders, designed for increased variety, realism, and physics-grounded visuals.

## Overview

### Key Improvements over V1

1. **Shared Utility Libraries** - Common noise, color, lighting, and seed functions are shared via `#include` directives, eliminating code duplication.

2. **Increased Variety** - 10 planet shader types (vs 6 in V1) plus improved seed-based variation ensures no two planets look identical.

3. **Physics-Grounded** - Planet properties (temperature, density, insolation) directly influence appearance in scientifically accurate ways.

4. **Higher Realism** - Domain-warped noise, proper limb darkening, atmospheric scattering, and detailed surface features.

5. **Burning Stars** - Stars now show actual flame patterns, granulation, and temperature-accurate colors instead of simple glows.

## Naming Conventions

To avoid conflicts with THREE.js built-in functions and other GLSL definitions, V2 utility functions use a `v2_` prefix:

- `v2_luminance()` instead of `luminance()` (THREE.js has a built-in luminance function)

When adding new utility functions, always check if the name conflicts with WebGL/THREE.js built-ins.

## File Structure

```
public/shaders/v2/
├── common/
│   ├── noise.glsl      # Simplex, value noise, FBM, domain warping
│   ├── color.glsl      # HSV/RGB, temperature-to-color, palettes
│   ├── lighting.glsl   # Fresnel, limb darkening, specular, atmosphere
│   └── seed.glsl       # Deterministic variation from planet seed
├── planet/
│   ├── planet.vert     # Shared vertex shader
│   ├── rocky.frag      # Terrestrial worlds with biomes
│   ├── gasGiant.frag   # Jupiter/Saturn-like with storms
│   ├── hotJupiter.frag # Tidally locked ultra-hot giants
│   ├── iceGiant.frag   # Neptune/Uranus-like
│   ├── subNeptune.frag # Mini-Neptunes with thick haze
│   ├── lavaWorld.frag  # Volcanic hellscapes
│   ├── icyWorld.frag   # Europa/Enceladus-like frozen moons
│   ├── oceanWorld.frag # Water worlds (NEW)
│   ├── desertWorld.frag # Arid/dune worlds (NEW)
│   └── tidallyLocked.frag # Day/night divided worlds (NEW)
└── star/
    ├── surface.vert
    ├── surface.frag    # Burning star surface with flames
    ├── corona.vert
    └── corona.frag     # Outer glow with flare structures
```

## Usage

### Loading V2 Shaders

```typescript
import { shaderService } from '@/services/shaderService';
import { getV2PlanetShaderType, getV2ShaderFileName, getPlanetVertexShader } from '@/utils/planetUniforms';

// Load all shaders (includes V2)
await shaderService.loadShaders();

// Get shader type for a planet
const shaderType = getV2PlanetShaderType(planet);  // e.g., 'oceanWorld'

// Get shader names
const vertName = getPlanetVertexShader('v2');      // 'v2PlanetVert'
const fragName = getV2ShaderFileName(shaderType);  // 'v2OceanWorldFrag'

// Create material
const material = new THREE.ShaderMaterial({
  vertexShader: shaderService.get(vertName),
  fragmentShader: shaderService.get(fragName),
  uniforms: createPlanetUniforms({ planet, detailLevel: 'detailed' }),
});
```

### Star Shaders

```typescript
import { getStarSurfaceShaders, getStarCoronaShaders } from '@/utils/planetUniforms';

const surface = getStarSurfaceShaders('v2');
const corona = getStarCoronaShaders('v2');

const starMaterial = new THREE.ShaderMaterial({
  vertexShader: shaderService.get(surface.vert),
  fragmentShader: shaderService.get(surface.frag),
  uniforms: {
    uStarColor: { value: new THREE.Color('#ffdd88') },
    uTime: { value: 0 },
    uTemperature: { value: 5778 },  // Kelvin
    uSeed: { value: 0.5 },
  },
});
```

## Include System

V2 shaders use `#include` directives to share code:

```glsl
#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"
#include "v2/common/lighting.glsl"
#include "v2/common/seed.glsl"
```

The `shaderService` resolves these at load time, replacing directives with actual file contents.

To add a utility file:

1. Create the `.glsl` file in `public/shaders/v2/common/`
2. Add to `manifest.json` with `"utility": true`:
   ```json
   { "name": "v2NewUtilGlsl", "path": "v2/common/newUtil.glsl", "utility": true }
   ```
3. Use `#include "v2/common/newUtil.glsl"` in other shaders

## Planet Shader Types

### Gas Giants

| Shader | Description | Selection Criteria |
|--------|-------------|-------------------|
| `gasGiant` | Jupiter/Saturn-like with bands and storms | Gas Giant type, temp < 1000K |
| `hotJupiter` | Ultra-hot, tidally locked giants | Hot Jupiter subtype or temp > 1000K |
| `iceGiant` | Neptune/Uranus-like with haze | Neptune-like type |
| `subNeptune` | Mini-Neptunes with thick atmospheres | Sub-Neptune type |

### Rocky Planets

| Shader | Description | Selection Criteria |
|--------|-------------|-------------------|
| `rocky` | Earth/Mars-like with biomes | Default rocky, temperate |
| `lavaWorld` | Volcanic with molten surface | Lava World subtype or temp > 800K |
| `icyWorld` | Europa-like with fractures | Ice World subtype or temp < 200K |
| `oceanWorld` | Water-dominated worlds | Low density + temperate |
| `desertWorld` | Arid with dunes and canyons | High temp (400-800K) + rocky density |
| `tidallyLocked` | Permanent day/night division | Short orbital period around M-dwarf |

## Uniforms

All planet shaders use the same uniform interface:

| Uniform | Type | Description |
|---------|------|-------------|
| `uBaseColor` | vec3 | Base color from planet type |
| `uTime` | float | Animation time (update each frame) |
| `uTemperature` | float | Equilibrium temperature in Kelvin |
| `uHasAtmosphere` | float | Atmosphere factor (0-1) |
| `uSeed` | float | Deterministic seed from planet name (0-1) |
| `uDensity` | float | Normalized density (0-1) |
| `uInsolation` | float | Normalized stellar flux (0-1) |
| `uStarTemp` | float | Host star temperature in Kelvin |
| `uDetailLevel` | float | LOD: 0 = simple, 1 = detailed |

Star shaders use:

| Uniform | Type | Description |
|---------|------|-------------|
| `uStarColor` | vec3 | Base star color |
| `uTime` | float | Animation time |
| `uTemperature` | float | Star temperature in Kelvin |
| `uSeed` | float | Variation seed (0-1) |

## Seed Variation System

The seed system ensures:
- **Same planet** always looks the same (deterministic)
- **Different planets** look visually distinct

Seed-derived properties:

```glsl
float seedScale = seedScale(uSeed);           // Feature scale variation
float seedRotation = seedRotation(uSeed);     // UV rotation angle
float seedPhase = seedPhase(uSeed);           // Noise phase offset
float seedHue = seedHueShift(uSeed);          // Color hue variation
bool hasFeature = seedHasCommonFeature(uSeed, 0.0); // Feature toggle
```

## Physics Mapping

### Temperature Effects

| Range | Effect |
|-------|--------|
| < 200K | Ice surfaces, frozen features |
| 200-320K | Temperate, possible life |
| 320-500K | Hot, arid, desert conditions |
| 500-800K | Volcanic activity begins |
| > 800K | Lava surfaces, thermal glow |
| > 1500K | White-hot, atmospheric escape |

### Density Effects

| Range | Effect |
|-------|--------|
| < 2 g/cm³ | Volatile-rich, smooth surfaces, bluer tones |
| 2-4 g/cm³ | Mixed composition, Earth-like |
| 4-7 g/cm³ | Rocky, rugged terrain |
| > 7 g/cm³ | Iron-rich, reddish tones, cratered |

### Insolation Effects

| Range | Effect |
|-------|--------|
| < 0.3 | Thick atmospheres, frost, ice caps |
| 0.3-2 | Earth-like conditions |
| 2-10 | Thin atmospheres, surface glow |
| > 10 | Atmospheric escape visible |

### Star Temperature Effects

| Star Type | Effect |
|-----------|--------|
| M-dwarf (< 4000K) | Warm orange-red lighting tint |
| K-dwarf (4000-5200K) | Yellow-orange tint |
| G-type (5200-6000K) | Neutral (Sun-like) |
| F-type (6000-7500K) | Slightly cool tint |
| A/B-type (> 7500K) | Blue-white tint |

## Performance Considerations

- Use `uDetailLevel = 0` for thumbnails and distant views
- Use `uDetailLevel = 1` for close-up planet pages
- FBM octaves are reduced in simple mode
- Domain warping is skipped in simple mode
- Cloud rendering is skipped in simple mode

## Adding New Shaders

1. Create fragment shader in `public/shaders/v2/planet/`:
   ```glsl
   #include "v2/common/noise.glsl"
   #include "v2/common/color.glsl"
   #include "v2/common/lighting.glsl"
   #include "v2/common/seed.glsl"

   uniform vec3 uBaseColor;
   // ... other uniforms

   void main() {
       // Your shader code
   }
   ```

2. Add to `manifest.json`:
   ```json
   { "name": "v2NewPlanetFrag", "path": "v2/planet/newPlanet.frag" }
   ```

3. Add type to `planetUniforms.ts`:
   - Add to `V2ShaderType` union
   - Add mapping in `getV2PlanetShaderType()`
   - Add to `getV2ShaderFileName()` map

4. Add selection logic in `getV2PlanetShaderType()` based on planet properties

## Credits

Shader techniques based on:
- **Noise functions**: Morgan McGuire, Inigo Quilez
- **Star flames**: trisomie21 (Shadertoy)
- **Lava worlds**: Morgan McGuire's "Vulcan"
- **Atmospheric scattering**: Various PBR references

