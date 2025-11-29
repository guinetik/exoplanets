# ShaderService API

## Overview

`ShaderService` is a singleton service that manages GLSL shader compilation, caching, and delivery. It loads shader source code from disk, compiles them for use with Three.js, and handles `#include` directive resolution for code reuse.

**Location**: `src/services/shaderService.ts`

## Initialization

ShaderService is initialized once at application startup:

```typescript
// In src/services/index.ts
import ShaderService from './shaderService';

export const shaderService = new ShaderService();

// In App
useEffect(() => {
  shaderService.loadShaders();
}, []);
```

## Core Methods

### loadShaders()

**Purpose**: Load and parse all shader files from manifest

**Signature**:
```typescript
async loadShaders(): Promise<void>
```

**Behavior**:
1. Reads `public/shaders/manifest.json` to get shader file paths
2. Fetches each shader file from disk
3. Parses shader source code
4. Resolves `#include` directives recursively
5. Caches compiled shader source
6. Ready for use via `get()`

**Error Handling**:
- Logs error if shader file not found
- Warns if `#include` reference is missing
- Service still initializes with available shaders

**Usage**:
```typescript
try {
  await shaderService.loadShaders();
  // Shaders now ready to use
} catch (error) {
  console.error('Failed to load shaders:', error);
}
```

### get(name)

**Purpose**: Retrieve compiled shader source code

**Signature**:
```typescript
get(name: string): string
```

**Parameters**:
- `name`: Shader identifier from manifest (e.g., "planetRockyFrag", "starSurfaceFrag")

**Returns**: Full shader source code as string, with `#include` directives resolved

**Performance**: O(1) - lookup in cache

**Usage**:
```typescript
// Get planet shader
const rockySahder = shaderService.get('planetRockyFrag');

// Get star shader
const starShader = shaderService.get('starSurfaceFrag');

// Use with Three.js material
const material = new THREE.ShaderMaterial({
  vertexShader: shaderService.get('planetVert'),
  fragmentShader: shaderService.get('planetRockyFrag'),
  uniforms: planetUniforms
});
```

## Shader Manifest

### File Location

`public/shaders/manifest.json`

### Format

```json
[
  {
    "name": "planetVert",
    "path": "v2/planet/planet.vert"
  },
  {
    "name": "planetRockyFrag",
    "path": "v2/planet/rocky.frag"
  },
  {
    "name": "starSurfaceVert",
    "path": "v2/star/surface.vert"
  },
  {
    "name": "starSurfaceFrag",
    "path": "v2/star/surface.frag"
  }
]
```

### Naming Conventions

- **Vertex shaders**: `{feature}Vert` (e.g., "planetVert", "starCoronaVert")
- **Fragment shaders**: `{feature}Frag` (e.g., "planetRockyFrag", "starSurfaceFrag")
- **Names are camelCase**: "planetGasGiantFrag" not "planet-gas-giant.frag"

## Available Shaders

### Planet Shaders

**Vertex Shader** (shared for all planet types):
- Name: `planetVert`
- Purpose: Transform vertex positions, prepare for fragment shader

**Fragment Shaders** (one per planet type):
| Name | Planet Type | Purpose |
|------|-------------|---------|
| `planetRockyFrag` | Terrestrial | Earth-like with biomes |
| `planetGasGiantFrag` | Gas Giant | Jupiter/Saturn-like |
| `planetHotJupiterFrag` | Hot Jupiter | Tidally-locked ultra-hot |
| `planetIceGiantFrag` | Ice Giant | Neptune/Uranus-like |
| `planetSubNeptuneFrag` | Sub-Neptune | Mini-Neptunes with haze |
| `planetLavaWorldFrag` | Lava World | Volcanic hellscapes |
| `planetIcyWorldFrag` | Icy World | Frozen/icy moons |
| `planetOceanWorldFrag` | Ocean World | Water worlds |
| `planetDesertWorldFrag` | Desert World | Arid/dune worlds |
| `planetTidallyLockedFrag` | Tidally Locked | Day/night divided |

### Star Shaders

| Name | Purpose |
|------|---------|
| `starSurfaceVert` | Transform star geometry |
| `starSurfaceFrag` | Burning surface with flames |
| `starCoronaVert` | Corona glow geometry |
| `starCoronaFrag` | Corona halo effect |

## Include System

### Purpose

GLSL `#include` directives allow code reuse across shaders. Commonly used functions (noise, color, lighting) are in shared utility files that multiple shaders import.

### Syntax

```glsl
#include "v2/common/noise.glsl"
#include "v2/common/lighting.glsl"
```

### Shared Libraries

Located in `public/shaders/v2/common/`:

| File | Contents |
|------|----------|
| `noise.glsl` | Simplex, value noise, FBM, domain warping |
| `color.glsl` | HSV↔RGB, temperature-to-color, palettes |
| `lighting.glsl` | Fresnel, limb darkening, specular, atmosphere |
| `seed.glsl` | Deterministic variation from planet seed |

### Include Resolution

During `loadShaders()`:

```
1. Read shader file
2. Find all #include "path/to/file" lines
3. Recursively read included files
4. Replace #include directives with actual code
5. Cache final resolved shader
```

**Recursive Includes**: Includes can include other files (2+ levels deep)

**Missing Includes**: Warning logged, shader still loads with unresolved directive

## Uniforms (Shader Parameters)

Shaders accept uniforms that vary per-planet or per-frame:

### Planet-Specific Uniforms

Set by `planetUniforms.ts`:

```typescript
const uniforms = {
  uSeed: { value: planetSeed },           // Deterministic variation
  uTemperature: { value: equilibriumTemp }, // K, drives colors
  uDensity: { value: planetDensity },      // Affects appearance
  uRotation: { value: rotationAngle },     // Current rotation
  uOrbitalPhase: { value: orbitalPhase },  // Orbital position
  uTidalLocked: { value: isTidallyLocked }
};
```

### Per-Frame Uniforms

Updated each animation frame:

```typescript
uniforms.uTime = { value: time };           // Elapsed time (s)
uniforms.uRotation.value += deltaTime * rotationSpeed;
```

### Accessing Uniforms in Shaders

```glsl
// Fragment shader
uniform float uTemperature;
uniform vec3 uPlanetColor;
uniform float uSeed;

void main() {
  vec3 color = mix(cold, hot, normalize(uTemperature, 0.0, 3000.0));
  gl_FragColor = vec4(color, 1.0);
}
```

## Shader Selection

### How the App Chooses Shaders

```
getPlanet() → Exoplanet data
  ↓
planetUniforms.ts::getV2ShaderFileName()
  ↓
Looks at: planet_type, equilibrium_temperature, density
  ↓
Returns appropriate shader name
  ↓
shaderService.get("planetRockyFrag")
  ↓
Creates material with shader
```

**Example**:
```typescript
function getV2ShaderFileName(planet: Exoplanet): string {
  if (planet.planet_type === 'Earth-sized' && planet.is_earth_like) {
    return 'planetRockyFrag';
  }
  if (planet.planet_type === 'Gas Giant') {
    return 'planetGasGiantFrag';
  }
  // ... more cases
  return 'planetRockyFrag'; // default
}
```

## Adding a New Shader

### Step 1: Create Shader Files

```glsl
// public/shaders/v2/planet/myNewPlanet.vert
// public/shaders/v2/planet/myNewPlanet.frag

// Include shared libraries
#include "v2/common/noise.glsl"
#include "v2/common/color.glsl"

// Write shader code
void main() {
  // ... shader logic
}
```

### Step 2: Register in Manifest

```json
// public/shaders/manifest.json
[
  // ... existing entries ...
  {
    "name": "planetMyNewPlanetFrag",
    "path": "v2/planet/myNewPlanet.frag"
  }
]
```

### Step 3: Add Type Definition

```typescript
// src/types/shaders.ts
export type V2ShaderType =
  | 'planetRockyFrag'
  | 'planetGasGiantFrag'
  | 'planetMyNewPlanetFrag';  // ADD HERE
```

### Step 4: Add to Selection Logic

```typescript
// src/utils/planetUniforms.ts
function getV2ShaderFileName(planet: Exoplanet): string {
  // ... existing cases ...

  if (planet.planet_type === 'MyNewType') {
    return 'planetMyNewPlanetFrag';
  }

  return 'planetRockyFrag';
}
```

### Step 5: Test

Create a test planet with the appropriate properties to trigger shader selection.

## Caching

### What's Cached

- **Loaded Shader Code**: Once loaded, shader source is cached in memory
- **Resolved Includes**: Includes are resolved once, result is cached
- **Compiled Materials**: Three.js caches compiled shader programs

### Cache Invalidation

Caches are not cleared during runtime. To reload shaders:

```typescript
// Not typically used in production
// For development, restart the dev server
```

## Performance

### Load Time

- Initial load: ~100-200ms (depends on number of shaders)
- Per shader lookup: O(1) - <1ms

### Compilation

- Three.js compiles shaders on GPU
- ~50-100ms per material on typical hardware
- Occurs once per shader, then cached by Three.js

## Error Handling

```typescript
// Shader not found
const shader = shaderService.get('invalidName');
// Returns empty string, logs warning

// Missing include
#include "v2/common/missing.glsl"
// Warning logged during loadShaders(), shader loads with unresolved directive
```

## Usage in Components

### Planet Rendering

```typescript
// In PlanetScene.tsx
const shaderName = getV2ShaderFileName(planet);
const material = new THREE.ShaderMaterial({
  vertexShader: shaderService.get('planetVert'),
  fragmentShader: shaderService.get(shaderName),
  uniforms: planetUniforms.getUniforms(planet),
  side: THREE.DoubleSide
});
```

### Star Rendering

```typescript
// In StarScene.tsx
const material = new THREE.ShaderMaterial({
  vertexShader: shaderService.get('starSurfaceVert'),
  fragmentShader: shaderService.get('starSurfaceFrag'),
  uniforms: getStarUniforms(star)
});
```

## Shader System Details

See [Shader System V2](visualization-shader-system-v2.md) for in-depth shader documentation and techniques.

## See Also

- [Shader System V2](visualization-shader-system-v2.md) - Shader code and techniques
- [Service Layer Overview](api-service-layer.md) - Other services
- [Component Hierarchy](architecture-component-hierarchy.md) - Where shaders are used
- [Planet Rotation & Axial Tilt](visualization-planet-rotation.md) - Rotation uniforms
