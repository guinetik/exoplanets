/**
 * CelestialBody Component
 * Renders a star or planet as a 3D sphere with procedural shaders
 */

import { useRef, useMemo, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { StellarBody } from '../../utils/solarSystem';
import { shaderService } from '../../services/shaderService';
import { CameraContext } from './StarSystem';
import {
  createPlanetUniforms,
  getV2PlanetShaderType,
  getV2ShaderFileName,
  getPlanetVertexShader,
  getStarSurfaceShaders,
  getStarCoronaShaders,
  getStarRaysShaders,
  generateSeed,
  getStarActivityLevel,
  getRingShaders,
} from '../../utils/planetUniforms';
import { SolarFlares } from './SolarFlares';

// Speed multiplier for orbital animation (lower = slower, 1.0 = original speed)
const ORBIT_SPEED = 0.15;

interface CelestialBodyProps {
  body: StellarBody;
  isHovered: boolean;
  onHover: (
    body: StellarBody | null,
    mousePos?: { x: number; y: number }
  ) => void;
  onClick?: (body: StellarBody) => void;
  /** Callback to report current position each frame (for camera tracking) */
  onPositionUpdate?: (id: string, position: THREE.Vector3) => void;
}

export function CelestialBody({
  body,
  isHovered,
  onHover,
  onClick,
  onPositionUpdate,
}: CelestialBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const starMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2); // Random starting position

  // Get camera distance for zoom-based detail
  const cameraContext = useContext(CameraContext);

  // Star shader uniforms with seed and activity for dynamic effects
  const starSeed = useMemo(() => generateSeed(body.id ?? body.name), [body.id, body.name]);
  const activityLevel = useMemo(() => getStarActivityLevel(body.spectralType), [body.spectralType]);

  const starUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uTemperature: { value: body.temperature ?? 5778 },
      uSeed: { value: starSeed },
      uActivityLevel: { value: activityLevel },
    }),
    [body.color, body.temperature, starSeed, activityLevel]
  );

  // Corona shader uniforms with seed and activity for dynamic effects
  const coronaMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const coronaUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uIntensity: { value: body.emissiveIntensity ?? 1.0 },
      uSeed: { value: starSeed },
      uActivityLevel: { value: activityLevel },
    }),
    [body.color, body.emissiveIntensity, starSeed, activityLevel]
  );

  // Star rays shader uniforms
  const raysMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const raysUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uTemperature: { value: body.temperature ?? 5778 },
      uSeed: { value: starSeed },
      uActivityLevel: { value: activityLevel },
      uStarRadius: { value: 0.125 }, // Star takes up 12.5% of billboard width (radius) - billboard is 4x diameter
    }),
    [body.color, body.temperature, starSeed, activityLevel]
  );

  // Planet shader uniforms using the factory (detailed mode for full visual quality)
  const planetUniforms = useMemo(() => {
    if (body.planetData) {
      // Use real exoplanet data for data-driven visuals
      const uniforms = createPlanetUniforms({
        planet: body.planetData,
        detailLevel: 'detailed', // Full detail for best visual quality
        starTemp: body.planetData.st_teff ?? undefined,
        showTerminator: false, // Disable dark side - star provides illumination
      });
      // Add zoom level uniform for camera distance-based detail
      return {
        ...uniforms,
        uZoomLevel: { value: 0.0 },
        uBodyDiameter: { value: body.diameter },
      };
    }
    // Fallback for bodies without full exoplanet data
    return {
      uBaseColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uTemperature: { value: body.temperature ?? 300 },
      uHasAtmosphere: { value: body.hasAtmosphere ?? 0.5 },
      uSeed: { value: Math.random() },
      uDensity: { value: 0.5 },
      uInsolation: { value: 0.5 },
      uStarTemp: { value: 5778 },
      uDetailLevel: { value: 1.0 }, // Full detail mode
      uEnableTerminator: { value: 0.0 }, // Disable dark side on star map
      // Physical color factors - defaults for fallback
      uColorTempFactor: { value: 0.5 },
      uColorCompositionFactor: { value: 0.5 },
      uColorIrradiationFactor: { value: 0.5 },
      uColorMetallicityFactor: { value: 0.5 },
      uZoomLevel: { value: 0.0 },
      uBodyDiameter: { value: body.diameter },
    };
  }, [body.planetData, body.color, body.temperature, body.hasAtmosphere, body.diameter]);

  // Get the appropriate planet shader using V2 system for better variety
  const planetShaderType = useMemo(
    () => body.planetData 
      ? getV2PlanetShaderType(body.planetData) 
      : 'rocky',
    [body.planetData]
  );
  const planetFragShader = useMemo(
    () => getV2ShaderFileName(planetShaderType),
    [planetShaderType]
  );
  
  // Get V2 star shaders
  const starShaders = useMemo(() => getStarSurfaceShaders('v2'), []);
  const coronaShaders = useMemo(() => getStarCoronaShaders('v2'), []);
  const raysShaders = useMemo(() => getStarRaysShaders(), []);

  // Get ring shaders for gas giants
  const ringShaders = useMemo(() => getRingShaders(), []);
  const ringMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Ring uniforms - color based on planet temperature (icy vs rocky)
  const ringUniforms = useMemo(() => {
    const seed = body.id ? generateSeed(body.id) : Math.random();
    const density = body.planetData?.pl_bmasse
      ? Math.min(body.planetData.pl_bmasse / 300, 1.0)
      : 0.5;
    const insolation = body.planetData?.pl_insol
      ? Math.min(body.planetData.pl_insol / 2, 1.0)
      : 0.5;

    // Get planet temperature - use equilibrium temp or estimate from insolation
    const temp = body.planetData?.pl_eqt
      ?? (body.planetData?.pl_insol ? Math.sqrt(body.planetData.pl_insol) * 255 : 150);

    // Seed-based variation within the temperature category
    const variation = (seed * 0.3) - 0.15; // -0.15 to +0.15

    let ringColor: THREE.Color;

    if (temp < 120) {
      // Very cold: Pure ice rings - bright white/blue
      ringColor = new THREE.Color().setHSL(
        0.55 + variation * 0.1,  // Blue-ish hue
        0.25 + seed * 0.15,      // Low-medium saturation
        0.8 + seed * 0.1         // Bright
      );
    } else if (temp < 200) {
      // Cold: Mixed ice/rock - pale blue-gray
      ringColor = new THREE.Color().setHSL(
        0.58 + variation * 0.08, // Slightly blue
        0.15 + seed * 0.1,       // Low saturation
        0.7 + seed * 0.1         // Fairly bright
      );
    } else if (temp < 350) {
      // Cool: Rocky/dusty - tans, browns, grays
      const subType = Math.floor(seed * 3);
      if (subType === 0) {
        // Tan/beige rocky
        ringColor = new THREE.Color().setHSL(0.08 + variation, 0.35, 0.6);
      } else if (subType === 1) {
        // Gray rocky
        ringColor = new THREE.Color().setHSL(0.6, 0.08 + seed * 0.1, 0.55);
      } else {
        // Brown dusty
        ringColor = new THREE.Color().setHSL(0.06 + variation, 0.4, 0.5);
      }
    } else if (temp < 600) {
      // Warm: Dark rocky/metallic
      const subType = Math.floor(seed * 2);
      if (subType === 0) {
        // Dark gray metallic
        ringColor = new THREE.Color().setHSL(0.0, 0.05, 0.4 + seed * 0.15);
      } else {
        // Rusty/oxidized
        ringColor = new THREE.Color().setHSL(0.05 + variation * 0.5, 0.45, 0.45);
      }
    } else {
      // Hot: Silicate/volcanic debris - dark with orange/red hints
      ringColor = new THREE.Color().setHSL(
        0.03 + variation * 0.3,  // Orange-red hue
        0.5 + seed * 0.2,        // Medium-high saturation
        0.35 + seed * 0.15       // Darker
      );
    }

    // Ring geometry dimensions (must match ringGeometry args)
    const innerRadius = body.diameter * 0.6;
    const outerRadius = body.diameter * 1.3;

    return {
      uBaseColor: { value: ringColor },
      uRingColor: { value: ringColor },
      uTime: { value: 0 },
      uSeed: { value: seed },
      uDensity: { value: density },
      uInsolation: { value: insolation },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
    };
  }, [body.id, body.planetData, body.diameter]);

  // Animate orbit - always keep moving (no pause on hover/focus)
  useFrame((state, delta) => {
    // Animate planets - always orbit
    if (
      body.type === 'planet' &&
      groupRef.current &&
      body.orbitPeriod > 0
    ) {
      orbitAngleRef.current +=
        (Math.PI * 2 * delta * ORBIT_SPEED) / (body.orbitPeriod / 60);
    }

    // Animate stars in binary systems (both primary and companion orbit the barycenter)
    if (
      body.type === 'star' &&
      body.orbitRadius > 0 &&
      groupRef.current &&
      body.orbitPeriod > 0
    ) {
      // Stars orbit faster than planets for visual effect
      orbitAngleRef.current +=
        (Math.PI * 2 * delta * ORBIT_SPEED * 2) / (body.orbitPeriod / 60);
    }

    // Update planet position - elliptical orbit with star at focus
    if (body.type === 'planet' && groupRef.current) {
      const e = Math.min(Math.max(body.orbitEccentricity || 0, 0), 0.99);
      const a = body.orbitRadius; // Semi-major axis
      const b = a * Math.sqrt(1 - e * e); // Semi-minor axis
      const focusOffset = a * e; // Distance from center to focus

      // Parametric ellipse with star at focus
      const x = a * Math.cos(orbitAngleRef.current) - focusOffset;
      const z = b * Math.sin(orbitAngleRef.current);

      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }

    // Update star positions in binary systems
    // Primary star orbits one side, companion orbits opposite side (PI offset)
    if (body.type === 'star' && body.orbitRadius > 0 && groupRef.current) {
      const e = Math.min(Math.max(body.orbitEccentricity || 0, 0), 0.99);
      const a = body.orbitRadius;
      const b = a * Math.sqrt(1 - e * e);

      // Companion orbits on opposite side (add PI to angle)
      const angleOffset = body.isCompanionStar ? Math.PI : 0;
      const x = a * Math.cos(orbitAngleRef.current + angleOffset);
      const z = b * Math.sin(orbitAngleRef.current + angleOffset);

      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }

    // Report current position for camera tracking
    if (groupRef.current && onPositionUpdate) {
      onPositionUpdate(body.id, groupRef.current.position);
    }

    // Rotate on own axis - use physics-based rotation speed and axial tilt
    if (meshRef.current) {
      // Apply axial tilt (rotation around X axis to tilt the spin axis)
      meshRef.current.rotation.x = body.axialTilt;
      
      if (body.isTidallyLocked && body.type === 'planet') {
        // Tidally locked: one face always toward the star (at origin)
        // The planet's rotation matches its orbital angle so same face points to star
        meshRef.current.rotation.y = -orbitAngleRef.current + Math.PI;
      } else {
        // Normal rotation: spin on axis using physics-based speed
        meshRef.current.rotation.y += delta * body.rotationSpeed;
      }
    }

    // Update shader time uniforms
    const time = state.clock.elapsedTime;
    if (body.type === 'star') {
      if (starMaterialRef.current) {
        starMaterialRef.current.uniforms.uTime.value = time;
      }
      if (coronaMaterialRef.current) {
        coronaMaterialRef.current.uniforms.uTime.value = time;
      }
      if (raysMaterialRef.current) {
        raysMaterialRef.current.uniforms.uTime.value = time;
      }
    } else if (body.type === 'planet') {
      if (planetMaterialRef.current) {
        planetMaterialRef.current.uniforms.uTime.value = time;

        // Calculate zoom level based on camera distance relative to body size
        // Higher zoom level = camera is closer = more detail
        if (cameraContext && groupRef.current) {
          const camDist = cameraContext.cameraDistance.current;
          const bodyPos = groupRef.current.position;
          // Distance from camera to this specific body
          const distToBody = Math.sqrt(
            Math.pow(bodyPos.x, 2) +
            Math.pow(bodyPos.y - camDist * 0.4, 2) + // Account for camera Y offset
            Math.pow(bodyPos.z - camDist, 2)
          );
          // Zoom level: 1.0 when very close (4x diameter), 0.0 when far (20x+ diameter)
          const closeThreshold = body.diameter * 4;
          const farThreshold = body.diameter * 20;
          const zoomLevel = 1.0 - Math.min(1.0, Math.max(0.0,
            (distToBody - closeThreshold) / (farThreshold - closeThreshold)
          ));
          planetMaterialRef.current.uniforms.uZoomLevel.value = zoomLevel;
        }
      }
      if (ringMaterialRef.current) {
        ringMaterialRef.current.uniforms.uTime.value = time;
      }
    }
  });

  // Scale up when hovered
  const scale = isHovered ? 1.3 : 1;

  if (body.type === 'star') {
    // Calculate scaled visual effect sizes for this star
    const starRadius = body.diameter / 2;
    
    // Star content - same for primary and companion
    const StarContent = (
      <>
        {/* Point light for illuminating planets */}
        <pointLight
          position={[0, 0, 0]}
          color={body.color}
          intensity={body.isCompanionStar ? 1.5 : 2}
          distance={body.isCompanionStar ? 40 : 50}
        />

        {/* Outer glow - billboard always faces camera */}
        <Billboard>
          <mesh>
            <planeGeometry args={[body.diameter * 1.8, body.diameter * 1.8]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              uniforms={{
                uColor: { value: new THREE.Color(body.color) },
                uIntensity: { value: body.emissiveIntensity ?? 1.0 },
              }}
              vertexShader={`
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform vec3 uColor;
                uniform float uIntensity;
                varying vec2 vUv;
                void main() {
                  vec2 center = vUv - 0.5;
                  float dist = length(center) * 2.0;
                  // Start glow from edge of star (around 0.55 radius in UV space)
                  float glow = 1.0 - smoothstep(0.55, 1.0, dist);
                  // Clamp intensity: min 0.7, max 1.8 to prevent huge glows
                  float clampedIntensity = clamp(uIntensity, 0.7, 1.8);
                  glow = pow(glow, 2.5) * clampedIntensity * 0.35;
                  gl_FragColor = vec4(uColor, glow);
                }
              `}
            />
          </mesh>
        </Billboard>

        {/* Star surface - V2 procedural shader with burning effects */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[body.diameter / 2, 64, 64]} />
          <shaderMaterial
            ref={starMaterialRef}
            vertexShader={shaderService.get(starShaders.vert)}
            fragmentShader={shaderService.get(starShaders.frag)}
            uniforms={starUniforms}
          />
        </mesh>

        {/* Corona layer - V2 fiery flames extending outward */}
        <mesh>
          <sphereGeometry args={[starRadius * 1.5, 64, 64]} />
          <shaderMaterial
            ref={coronaMaterialRef}
            vertexShader={shaderService.get(coronaShaders.vert)}
            fragmentShader={shaderService.get(coronaShaders.frag)}
            uniforms={coronaUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Solar flares - dramatic eruptions */}
        <SolarFlares
          starRadius={starRadius}
          starColor={body.color}
          starSeed={starSeed}
          activityLevel={activityLevel}
        />

        {/* Star rays - radiating light effect using 4D noise */}
        <Billboard>
          <mesh>
            <planeGeometry args={[body.diameter * 4, body.diameter * 4]} />
            <shaderMaterial
              ref={raysMaterialRef}
              vertexShader={shaderService.get(raysShaders.vert)}
              fragmentShader={shaderService.get(raysShaders.frag)}
              uniforms={raysUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Billboard>
      </>
    );

    // Stars in binary systems orbit the barycenter, so wrap in a group with ref
    if (body.orbitRadius > 0) {
      return <group ref={groupRef}>{StarContent}</group>;
    }

    // Single star systems: star is stationary at center
    // Still use groupRef for position tracking (position 0,0,0)
    return <group ref={groupRef}>{StarContent}</group>;
  }

  // Planet
  return (
    <group ref={groupRef}>
      {/* Planet sphere with procedural shader */}
      <mesh
        ref={meshRef}
        scale={[scale, scale, scale]}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          const clientX =
            (e as unknown as { clientX?: number }).clientX ??
            e.nativeEvent?.clientX;
          const clientY =
            (e as unknown as { clientY?: number }).clientY ??
            e.nativeEvent?.clientY;
          onHover(
            body,
            clientX && clientY ? { x: clientX, y: clientY } : undefined
          );
        }}
        onPointerMove={(e) => {
          if (isHovered) {
            const clientX =
              (e as unknown as { clientX?: number }).clientX ??
              e.nativeEvent?.clientX;
            const clientY =
              (e as unknown as { clientY?: number }).clientY ??
              e.nativeEvent?.clientY;
            if (clientX && clientY) {
              onHover(body, { x: clientX, y: clientY });
            }
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'grab';
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(body);
        }}
      >
        <sphereGeometry args={[body.diameter / 2, 48, 48]} />
        <shaderMaterial
          ref={planetMaterialRef}
          vertexShader={shaderService.get(getPlanetVertexShader('v2'))}
          fragmentShader={shaderService.get(planetFragShader)}
          uniforms={planetUniforms}
        />
      </mesh>

      {/* Rings for gas giants - with varied internal bands */}
      {body.hasRings && (
        <mesh rotation={[Math.PI / 2 + body.axialTilt, 0, 0]}>
          <ringGeometry args={[body.diameter * 0.6, body.diameter * 1.3, 64]} />
          <shaderMaterial
            ref={ringMaterialRef}
            vertexShader={shaderService.get(ringShaders.vert)}
            fragmentShader={shaderService.get(ringShaders.frag)}
            uniforms={ringUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Highlight when hovered */}
      {isHovered && (
        <mesh scale={[1.4, 1.4, 1.4]}>
          <sphereGeometry args={[body.diameter / 2, 24, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default CelestialBody;
