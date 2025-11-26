/**
 * Earth Horizon Component
 * Creates a realistic Earth horizon with atmospheric glow
 * Rotates based on observer longitude for location changes
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderService } from '../../services/shaderService';

interface EarthHorizonProps {
  longitude?: number; // Observer longitude in degrees
}

export function EarthHorizon({ longitude = 0 }: EarthHorizonProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef(0);

  // Convert longitude to rotation (longitude 0 = rotation 0, longitude 180 = rotation PI)
  const longitudeToRotation = (lon: number) => (lon * Math.PI) / 180;

  // Smoothly animate Earth rotation when longitude changes
  useFrame(() => {
    if (!earthRef.current) return;

    const target = longitudeToRotation(longitude);
    targetRotation.current = target;

    // Smooth interpolation
    const current = earthRef.current.rotation.y;
    const diff = target - current;

    // Handle wrap-around for shortest path
    let delta = diff;
    if (Math.abs(diff) > Math.PI) {
      delta = diff > 0 ? diff - Math.PI * 2 : diff + Math.PI * 2;
    }

    earthRef.current.rotation.y += delta * 0.05; // Smooth easing
  });
  // Get shaders from the shader service
  const earthVertexShader = shaderService.get('earthSurfaceVert');
  const earthFragmentShader = shaderService.get('earthSurfaceFrag');
  const atmosphereVertexShader = shaderService.get('atmosphereVert');
  const atmosphereFragmentShader = shaderService.get('atmosphereFrag');

  // Create a large sphere segment for the atmosphere
  const atmosphereGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(
      600, // radius
      64, // width segments
      32, // height segments
      0, // phi start
      Math.PI * 2, // phi length
      Math.PI * 0.4, // theta start (start below horizon)
      Math.PI * 0.2 // theta length (small slice)
    );
    geo.translate(0, -580, 0);
    return geo;
  }, []);

  return (
    <group>
      {/* Main Earth body with procedural surface */}
      <mesh ref={earthRef} position={[0, -600, 0]}>
        <sphereGeometry args={[580, 64, 32]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh geometry={atmosphereGeometry}>
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Thin bright atmosphere line at horizon (the famous "thin blue line") */}
      <mesh position={[0, -600, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[580, 590, 128]} />
        <meshBasicMaterial
          color={0x66ccff}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary atmosphere glow */}
      <mesh position={[0, -600, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[578, 605, 128]} />
        <meshBasicMaterial
          color={0x4499cc}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer atmospheric haze */}
      <mesh position={[0, -600, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[575, 630, 128]} />
        <meshBasicMaterial
          color={0x2266aa}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default EarthHorizon;
