/**
 * PlanetScene Component
 * Renders a large 3D planet shifted to the left side of the screen
 * with drag-to-rotate controls
 */

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Exoplanet } from '../../types';
import { shaderService } from '../../services/shaderService';
import {
  createPlanetUniforms,
  getV2PlanetShaderType,
  getV2ShaderFileName,
  getPlanetVertexShader,
} from '../../utils/planetUniforms';
import { estimateRotationSpeed, estimateAxialTilt, shouldHaveRings } from '../../utils/solarSystem';
import { normalize, getEffectiveTemperature } from '../../utils/math';
import { createRingColorFromTemperature } from '../../utils/ringVisuals';
import BackgroundStars from './BackgroundStars';

interface PlanetMeshProps {
  planet: Exoplanet;
}

// Generate a deterministic seed from planet name (0-1 range)
function generateSeed(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

function PlanetMesh({ planet }: PlanetMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const ringMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Get shader type and file name using V2 system for better variety
  const shaderType = useMemo(() => getV2PlanetShaderType(planet), [planet]);
  const fragShaderName = useMemo(() => getV2ShaderFileName(shaderType), [shaderType]);
  const vertShaderName = useMemo(() => getPlanetVertexShader('v2'), []);

  // Create uniforms with detailed mode for the Planet page (full features)
  const uniforms = useMemo(() => createPlanetUniforms({
    planet,
    detailLevel: 'detailed', // Full detail for planet page
    starTemp: planet.st_teff ?? undefined,
  }), [planet]);

  // Physics-based rotation speed and axial tilt from shared utilities
  const rotationSpeed = useMemo(() => estimateRotationSpeed(planet), [planet]);
  const axialTilt = useMemo(() => estimateAxialTilt(planet), [planet]);
  const isTidallyLocked = planet.is_likely_tidally_locked ?? false;

  // Ring uniforms - temperature-based color (matches StarSystem view)
  const ringUniforms = useMemo(() => {
    const seed = generateSeed(planet.pl_name);
    const density = normalize(planet.pl_dens, 0.3, 13.0, 0.5);
    const insolation = normalize(planet.pl_insol, 0.01, 10000, 0.5);

    // Get planet temperature using centralized resolution (NASA → calculated → insolation → default)
    const tempResult = getEffectiveTemperature(planet);
    const temp = tempResult.temperatureK;

    // Get ring color from centralized system (no scattered HSL magic numbers)
    const ringColor = createRingColorFromTemperature(temp, seed);

    // Ring geometry dimensions (must match ringGeometry args below)
    const innerRadius = 2.5;
    const outerRadius = 4.0;

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
  }, [planet]);

  // Animate rotation and update time uniforms
  useFrame((state, delta) => {
    // Apply axial tilt and physics-based rotation
    if (groupRef.current) {
      // Apply axial tilt (rotation around X axis to tilt the spin axis)
      groupRef.current.rotation.x = axialTilt;
      
      if (isTidallyLocked) {
        // Tidally locked: very slow or no visible rotation
        // For the planet page view, show minimal rotation to indicate locked state
        groupRef.current.rotation.y += delta * 0.02;
      } else {
        // Normal rotation using physics-based speed
        groupRef.current.rotation.y += delta * rotationSpeed;
      }
    }
    // Update shader time uniforms
    const time = state.clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
    }
    if (ringMaterialRef.current) {
      ringMaterialRef.current.uniforms.uTime.value = time;
    }
  });

  // Determine if planet should have rings using physics-based heuristic
  // Uses Hill/Roche ratio, temperature, size, and system age
  const hasRings = useMemo(() => shouldHaveRings(planet), [planet]);

  // Ring tilt uses physics-based axial tilt for consistency
  const ringTilt = useMemo(() => {
    // Rings are in the equatorial plane, so they're perpendicular to spin axis
    // The axial tilt is already applied to the group, so rings just need base rotation
    return Math.PI / 2;
  }, []);

  return (
    <group position={[0, 0.2, 0]}>
      {/* Rotating group for planet and rings */}
      <group ref={groupRef}>
        {/* Main planet sphere - large to fill viewport (V2 shaders) */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[2, 64, 64]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={shaderService.get(vertShaderName)}
            fragmentShader={shaderService.get(fragShaderName)}
            uniforms={uniforms}
          />
        </mesh>

        {/* Procedural rings for gas/ice giants */}
        {hasRings && (
          <mesh rotation={[ringTilt, 0, 0]}>
            <ringGeometry args={[2.5, 4.0, 128, 1]} />
            <shaderMaterial
              ref={ringMaterialRef}
              vertexShader={shaderService.get('ringsVert')}
              fragmentShader={shaderService.get('ringsFrag')}
              uniforms={ringUniforms}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

interface PlanetSceneProps {
  planet: Exoplanet;
}

export function PlanetScene({ planet }: PlanetSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 50 }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <hemisphereLight args={['#ffffff', '#444444', 0.4]} />
        <directionalLight position={[5, 3, 5]} intensity={1} />

        {/* Background stars */}
        <BackgroundStars count={2000} />

        {/* The planet */}
        <PlanetMesh planet={planet} />

        {/* Drag to rotate + auto-rotate (no zoom to allow page scroll) */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Suspense>
    </Canvas>
  );
}

export default PlanetScene;
