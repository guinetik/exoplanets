/**
 * CelestialBody Component
 * Renders a star or planet as a 3D sphere with procedural shaders
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { StellarBody } from '../../utils/solarSystem';
import { shaderService } from '../../services/shaderService';
import {
  createPlanetUniforms,
  getPlanetShaderType,
  getShaderFileName,
} from '../../utils/planetUniforms';

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

  // Star shader uniforms
  const starUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uTemperature: { value: body.temperature ?? 5778 },
    }),
    [body.color, body.temperature]
  );

  // Corona shader uniforms
  const coronaMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const coronaUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uIntensity: { value: body.emissiveIntensity ?? 1.0 },
    }),
    [body.color, body.emissiveIntensity]
  );

  // Planet shader uniforms using the factory (simple mode for StarSystem view)
  const planetUniforms = useMemo(() => {
    if (body.planetData) {
      // Use real exoplanet data for data-driven visuals
      return createPlanetUniforms({
        planet: body.planetData,
        detailLevel: 'simple', // Color-focused, performant for StarSystem
        starTemp: body.planetData.st_teff ?? undefined,
      });
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
      uDetailLevel: { value: 0.0 },
    };
  }, [body.planetData, body.color, body.temperature, body.hasAtmosphere]);

  // Get the appropriate planet shader (prefer subtype for accuracy)
  const planetShaderType = useMemo(
    () => getPlanetShaderType(body.planetData?.planet_subtype, body.planetType),
    [body.planetData?.planet_subtype, body.planetType]
  );
  const planetFragShader = useMemo(
    () => getShaderFileName(planetShaderType),
    [planetShaderType]
  );

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
    } else if (body.type === 'planet') {
      if (planetMaterialRef.current) {
        planetMaterialRef.current.uniforms.uTime.value = time;
      }
    }
  });

  // Scale up when hovered
  const scale = isHovered ? 1.3 : 1;

  if (body.type === 'star') {
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

        {/* Star surface - procedural shader does all the visual work */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[body.diameter / 2, 64, 64]} />
          <shaderMaterial
            ref={starMaterialRef}
            vertexShader={shaderService.get('starSurfaceVert')}
            fragmentShader={shaderService.get('starSurfaceFrag')}
            uniforms={starUniforms}
          />
        </mesh>

        {/* Corona layer - fiery tendrils radiating outward */}
        <mesh>
          <sphereGeometry args={[body.diameter / 2 * 1.15, 64, 64]} />
          <shaderMaterial
            ref={coronaMaterialRef}
            vertexShader={shaderService.get('starCoronaVert')}
            fragmentShader={shaderService.get('starCoronaFrag')}
            uniforms={coronaUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
          />
        </mesh>
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
          vertexShader={shaderService.get('planetVert')}
          fragmentShader={shaderService.get(planetFragShader)}
          uniforms={planetUniforms}
        />
      </mesh>

      {/* Rings for gas giants - tilted with the planet's axial tilt */}
      {body.hasRings && (
        <mesh rotation={[Math.PI / 2 + body.axialTilt, 0, 0]}>
          <ringGeometry args={[body.diameter * 0.7, body.diameter * 1.2, 64]} />
          <meshBasicMaterial
            color={new THREE.Color(body.color).lerp(
              new THREE.Color('#ffffff'),
              0.4
            )}
            transparent
            opacity={0.5}
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
