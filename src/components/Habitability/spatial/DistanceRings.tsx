/**
 * DistanceRings
 * Concentric rings showing distance from Earth in light-years
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import {
  SPATIAL_SCALING,
  DISTANCE_RINGS,
  GRID_VISUALIZATION,
  AXIS_INDICATORS,
} from '../../../utils/habitabilityVisuals';

interface RingProps {
  distance: number;
  color: string;
  opacity: number;
  showPrefix?: boolean;
}

function Ring({ distance, color, opacity, showPrefix = false }: RingProps) {
  const radius = distance * SPATIAL_SCALING.LIGHT_YEAR_TO_SCENE;

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= DISTANCE_RINGS.SEGMENTS; i++) {
      const angle = (i / DISTANCE_RINGS.SEGMENTS) * Math.PI * 2;
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
        lineWidth={DISTANCE_RINGS.LINE_WIDTH}
        opacity={opacity}
        transparent
      />
      {/* Label */}
      <Text
        position={[radius, 0, DISTANCE_RINGS.LABEL_OFFSET]}
        fontSize={DISTANCE_RINGS.LABEL_FONT_SIZE}
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
      {DISTANCE_RINGS.RING_DISTANCES.map((dist, i) => (
        <Ring
          key={dist}
          distance={dist}
          color={DISTANCE_RINGS.COLOR}
          opacity={DISTANCE_RINGS.INITIAL_OPACITY - i * DISTANCE_RINGS.OPACITY_STEP}
          showPrefix={i === 0}
        />
      ))}

      {/* Grid lines on XZ plane */}
      <gridHelper
        args={[GRID_VISUALIZATION.GRID_SIZE, GRID_VISUALIZATION.GRID_DIVISIONS, GRID_VISUALIZATION.GRID_COLOR, GRID_VISUALIZATION.GRID_SECONDARY_COLOR]}
        position={[0, GRID_VISUALIZATION.GRID_Y_OFFSET, 0]}
      />

      {/* Axis indicators */}
      <Line
        points={[[0, 0, 0], [AXIS_INDICATORS.LENGTH, 0, 0]]}
        color={AXIS_INDICATORS.X_AXIS_COLOR}
        lineWidth={AXIS_INDICATORS.LINE_WIDTH}
        opacity={AXIS_INDICATORS.OPACITY}
        transparent
      />
      <Line
        points={[[0, 0, 0], [0, AXIS_INDICATORS.LENGTH, 0]]}
        color={AXIS_INDICATORS.Y_AXIS_COLOR}
        lineWidth={AXIS_INDICATORS.LINE_WIDTH}
        opacity={AXIS_INDICATORS.OPACITY}
        transparent
      />
      <Line
        points={[[0, 0, 0], [0, 0, AXIS_INDICATORS.LENGTH]]}
        color={AXIS_INDICATORS.Z_AXIS_COLOR}
        lineWidth={AXIS_INDICATORS.LINE_WIDTH}
        opacity={AXIS_INDICATORS.OPACITY}
        transparent
      />
    </group>
  );
}
