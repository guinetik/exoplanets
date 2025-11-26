/**
 * Earth Horizon Component
 * Simple solid-color Earth horizon that matches the intro planet's atmosphere
 */

import * as THREE from 'three';

interface EarthHorizonProps {
  longitude?: number; // Observer longitude in degrees (kept for API compatibility)
}

export function EarthHorizon({ longitude = 0 }: EarthHorizonProps) {
  // Solid color matching the intro planet's atmosphere rim
  const earthColor = 0x80aae2; // rgb(128, 170, 226)

  return (
    <group>
      {/* Main Earth body - solid color matching intro planet atmosphere */}
      <mesh position={[0, -600, 0]}>
        <sphereGeometry args={[580, 64, 32]} />
        <meshBasicMaterial color={earthColor} />
      </mesh>

      {/* Thin bright atmosphere line at horizon */}
      <mesh position={[0, -600, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[580, 588, 128]} />
        <meshBasicMaterial
          color={0xd0e4f4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer atmospheric glow */}
      <mesh position={[0, -600, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[578, 610, 128]} />
        <meshBasicMaterial
          color={0xa0c0e0}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default EarthHorizon;
