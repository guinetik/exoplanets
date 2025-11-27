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
import { createPlanetUniforms, getPlanetShaderType, getShaderFileName } from '../../utils/planetUniforms';

// Speed multiplier for orbital animation (lower = slower, 1.0 = original speed)
const ORBIT_SPEED = 0.15;

interface CelestialBodyProps {
  body: StellarBody;
  isHovered: boolean;
  onHover: (body: StellarBody | null, mousePos?: { x: number; y: number }) => void;
  onClick?: (body: StellarBody) => void;
}

export function CelestialBody({
  body,
  isHovered,
  onHover,
  onClick,
}: CelestialBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const starMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2); // Random starting position

  // Star shader uniforms
  const starUniforms = useMemo(() => ({
    uStarColor: { value: new THREE.Color(body.color) },
    uTime: { value: 0 },
    uTemperature: { value: body.temperature ?? 5778 },
  }), [body.color, body.temperature]);

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

  // Get the appropriate planet shader
  const planetShaderType = useMemo(() => getPlanetShaderType(body.planetType), [body.planetType]);
  const planetFragShader = useMemo(() => getShaderFileName(planetShaderType), [planetShaderType]);

  // Animate orbit (pause when hovered)
  useFrame((state, delta) => {
    if (body.type === 'planet' && groupRef.current && body.orbitPeriod > 0 && !isHovered) {
      orbitAngleRef.current += (Math.PI * 2 * delta * ORBIT_SPEED) / (body.orbitPeriod / 60);
    }

    // Always update position (needed for initial placement)
    if (body.type === 'planet' && groupRef.current) {
      const x = Math.cos(orbitAngleRef.current) * body.orbitRadius;
      const z = Math.sin(orbitAngleRef.current) * body.orbitRadius;

      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }

    // Rotate on own axis (also pause when hovered)
    if (meshRef.current && !isHovered) {
      meshRef.current.rotation.y += delta * 0.2;
    }

    // Update shader time uniforms
    const time = state.clock.elapsedTime;
    if (body.type === 'star') {
      if (starMaterialRef.current) {
        starMaterialRef.current.uniforms.uTime.value = time;
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
    return (
      <group>
        {/* Point light for illuminating planets */}
        <pointLight
          position={[0, 0, 0]}
          color={body.color}
          intensity={2}
          distance={50}
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
      </group>
    );
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
          const clientX = (e as unknown as { clientX?: number }).clientX ?? e.nativeEvent?.clientX;
          const clientY = (e as unknown as { clientY?: number }).clientY ?? e.nativeEvent?.clientY;
          onHover(body, clientX && clientY ? { x: clientX, y: clientY } : undefined);
        }}
        onPointerMove={(e) => {
          if (isHovered) {
            const clientX = (e as unknown as { clientX?: number }).clientX ?? e.nativeEvent?.clientX;
            const clientY = (e as unknown as { clientY?: number }).clientY ?? e.nativeEvent?.clientY;
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

      {/* Rings for gas giants - color derived from planet */}
      {body.hasRings && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[body.diameter * 0.7, body.diameter * 1.2, 64]} />
          <meshBasicMaterial
            color={new THREE.Color(body.color).lerp(new THREE.Color('#ffffff'), 0.4)}
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
