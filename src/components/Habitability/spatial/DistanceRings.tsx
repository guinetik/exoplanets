/**
 * DistanceRings
 * Concentric rings showing distance from Earth in light-years
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';

// Distance rings in light-years, scaled to scene units
// 1 parsec ≈ 3.26 light-years, our SCALE_FACTOR is 0.75
const LIGHT_YEAR_TO_SCENE = 0.75 / 3.26;

const RING_DISTANCES = [10, 50, 100, 500, 1000]; // in light-years

interface RingProps {
  distance: number;
  color: string;
  opacity: number;
  showPrefix?: boolean;
}

function Ring({ distance, color, opacity, showPrefix = false }: RingProps) {
  const radius = distance * LIGHT_YEAR_TO_SCENE;
  const segments = 64;

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [radius]);

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={1}
        opacity={opacity}
        transparent
      />
      {/* Label */}
      <Text
        position={[radius, 0, 5]}
        fontSize={3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {showPrefix ? `LY ${distance}` : distance}
      </Text>
    </group>
  );
}

export default function DistanceRings() {
  return (
    <group rotation={[0, 0, 0]}>
      {RING_DISTANCES.map((dist, i) => (
        <Ring
          key={dist}
          distance={dist}
          color="#ffffff"
          opacity={0.15 - i * 0.02}
          showPrefix={i === 0}
        />
      ))}

      {/* Grid lines on XZ plane */}
      <gridHelper
        args={[1000, 20, '#333333', '#222222']}
        position={[0, -0.1, 0]}
      />

      {/* Axis indicators */}
      <Line
        points={[[0, 0, 0], [50, 0, 0]]}
        color="#ff4444"
        lineWidth={2}
        opacity={0.5}
        transparent
      />
      <Line
        points={[[0, 0, 0], [0, 50, 0]]}
        color="#44ff44"
        lineWidth={2}
        opacity={0.5}
        transparent
      />
      <Line
        points={[[0, 0, 0], [0, 0, 50]]}
        color="#4444ff"
        lineWidth={2}
        opacity={0.5}
        transparent
      />
    </group>
  );
}
