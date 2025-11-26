/**
 * OrbitRing Component
 * Renders an orbital path ring
 */

import * as THREE from 'three';

interface OrbitRingProps {
  radius: number;
  isHighlighted: boolean;
}

export function OrbitRing({ radius, isHighlighted }: OrbitRingProps) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 128]} />
      <meshBasicMaterial
        color={isHighlighted ? '#ffffff' : '#888888'}
        transparent
        opacity={isHighlighted ? 0.8 : 0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export default OrbitRing;
