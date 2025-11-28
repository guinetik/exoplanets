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

// Background stars for depth
function BackgroundStars({ count = 2000 }: { count?: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 200;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.2}
        color={0xffffff}
        transparent
        opacity={0.5}
        sizeAttenuation={false}
      />
    </points>
  );
}

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

// Normalize a value to 0-1 range
function normalize(value: number | null, min: number, max: number, fallback: number = 0.5): number {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
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

    // Get planet temperature - use equilibrium temp or estimate from insolation
    const temp = planet.pl_eqt
      ?? (planet.pl_insol ? Math.sqrt(planet.pl_insol) * 255 : 150);

    // Seed-based variation within the temperature category
    const variation = (seed * 0.3) - 0.15;

    let ringColor: THREE.Color;

    if (temp < 120) {
      // Very cold: Pure ice rings - bright white/blue
      ringColor = new THREE.Color().setHSL(
        0.55 + variation * 0.1,
        0.25 + seed * 0.15,
        0.8 + seed * 0.1
      );
    } else if (temp < 200) {
      // Cold: Mixed ice/rock - pale blue-gray
      ringColor = new THREE.Color().setHSL(
        0.58 + variation * 0.08,
        0.15 + seed * 0.1,
        0.7 + seed * 0.1
      );
    } else if (temp < 350) {
      // Cool: Rocky/dusty - tans, browns, grays
      const subType = Math.floor(seed * 3);
      if (subType === 0) {
        ringColor = new THREE.Color().setHSL(0.08 + variation, 0.35, 0.6);
      } else if (subType === 1) {
        ringColor = new THREE.Color().setHSL(0.6, 0.08 + seed * 0.1, 0.55);
      } else {
        ringColor = new THREE.Color().setHSL(0.06 + variation, 0.4, 0.5);
      }
    } else if (temp < 600) {
      // Warm: Dark rocky/metallic
      const subType = Math.floor(seed * 2);
      if (subType === 0) {
        ringColor = new THREE.Color().setHSL(0.0, 0.05, 0.4 + seed * 0.15);
      } else {
        ringColor = new THREE.Color().setHSL(0.05 + variation * 0.5, 0.45, 0.45);
      }
    } else {
      // Hot: Silicate/volcanic debris
      ringColor = new THREE.Color().setHSL(
        0.03 + variation * 0.3,
        0.5 + seed * 0.2,
        0.35 + seed * 0.15
      );
    }

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
