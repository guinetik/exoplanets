/**
 * PersistentISS Component
 * Renders the International Space Station in a circular orbit around Earth
 * Orbits continuously at realistic altitude with left-to-right motion
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PERSISTENT_ISS, EARTH_HORIZON, SATELLITE_PHYSICS } from '../../utils/starfieldVisuals';

export function PersistentISS() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Calculate current orbital angle
    const angle =
      PERSISTENT_ISS.START_ANGLE +
      PERSISTENT_ISS.ORBIT_DIRECTION * state.clock.elapsedTime * PERSISTENT_ISS.ANGULAR_VELOCITY;

    // Calculate orbital position around Earth center
    // Orbit in the XY plane so it traces left-right around the visible edge from camera perspective
    const x = PERSISTENT_ISS.ORBITAL_RADIUS * Math.sin(angle);
    const y = EARTH_HORIZON.POSITION_Y + PERSISTENT_ISS.ORBITAL_RADIUS * Math.cos(angle);
    const z = 0;

    groupRef.current.position.set(x, y, z);

    // Gentle rotation (tumble)
    groupRef.current.rotation.x += PERSISTENT_ISS.ROTATION_X;
    groupRef.current.rotation.y += PERSISTENT_ISS.ROTATION_Y;
  });

  const size = SATELLITE_PHYSICS.BASE_SIZE * PERSISTENT_ISS.SIZE_MULTIPLIER;

  return (
    <group ref={groupRef}>
      {/* Central truss - thin backbone of ISS */}
      <mesh>
        <boxGeometry args={[size * 0.3, size * 0.15, size * 1.2]} />
        <meshBasicMaterial color="#d3d3d3" toneMapped={false} />
      </mesh>

      {/* Habitation module - main pressure vessel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[size * 0.6, size * 0.4, size * 0.5]} />
        <meshBasicMaterial color="#e8e8e8" toneMapped={false} />
      </mesh>

      {/* Left solar panel - large and prominent */}
      <mesh position={[size * 2.0, size * 0.1, 0]}>
        <boxGeometry args={[size * 3.0, size * 0.08, size * 0.6]} />
        <meshBasicMaterial color="#1e90ff" toneMapped={false} />
      </mesh>

      {/* Right solar panel - large and prominent */}
      <mesh position={[-size * 2.0, size * 0.1, 0]}>
        <boxGeometry args={[size * 3.0, size * 0.08, size * 0.6]} />
        <meshBasicMaterial color="#1e90ff" toneMapped={false} />
      </mesh>

      {/* Front docking module */}
      <mesh position={[0, 0, size * 0.7]}>
        <boxGeometry args={[size * 0.4, size * 0.3, size * 0.3]} />
        <meshBasicMaterial color="#d3d3d3" toneMapped={false} />
      </mesh>

      {/* Rear module */}
      <mesh position={[0, 0, -size * 0.7]}>
        <boxGeometry args={[size * 0.4, size * 0.3, size * 0.3]} />
        <meshBasicMaterial color="#d3d3d3" toneMapped={false} />
      </mesh>

      {/* Port truss extension */}
      <mesh position={[-size * 1.2, -size * 0.08, 0]}>
        <boxGeometry args={[size * 0.15, size * 0.15, size * 0.8]} />
        <meshBasicMaterial color="#a9a9a9" toneMapped={false} />
      </mesh>

      {/* Starboard truss extension */}
      <mesh position={[size * 1.2, -size * 0.08, 0]}>
        <boxGeometry args={[size * 0.15, size * 0.15, size * 0.8]} />
        <meshBasicMaterial color="#a9a9a9" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default PersistentISS;
