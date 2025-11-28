/**
 * Satellites Component
 * Renders satellites (ISS, etc.) cruising across the sky at realistic altitudes
 */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SATELLITE_SPAWN,
  SATELLITE_PHYSICS,
  SATELLITE_SPAWN_POSITION,
  SATELLITE_TYPES,
  SATELLITE_VISUALS,
  selectSatelliteType,
} from '../../utils/starfieldVisuals';

type SatelliteType = (typeof SATELLITE_TYPES)[number];

interface SatelliteData {
  id: number;
  type: SatelliteType;
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  createdAt: number;
  altitude: number;
}

// =============================================================================
// SATELLITE MESH COMPONENT
// =============================================================================

interface SatelliteMeshProps {
  satellite: SatelliteData;
  onExpired: (id: number) => void;
}

function SatelliteMesh({ satellite, onExpired }: SatelliteMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(satellite.createdAt);

  useFrame((state) => {
    if (!groupRef.current) return;

    const elapsed = state.clock.elapsedTime - startTime.current;

    // Remove satellite after lifetime
    if (elapsed > SATELLITE_PHYSICS.LIFETIME_S) {
      onExpired(satellite.id);
      return;
    }

    // Move satellite along its path
    const distance = elapsed * satellite.speed;
    const newPos = satellite.startPosition
      .clone()
      .add(satellite.direction.clone().multiplyScalar(distance));

    groupRef.current.position.copy(newPos);

    // Rotate slowly (tumbling in space)
    groupRef.current.rotation.x += SATELLITE_PHYSICS.TUMBLE_X;
    groupRef.current.rotation.y += SATELLITE_PHYSICS.TUMBLE_Y;
  });

  const size = SATELLITE_PHYSICS.BASE_SIZE * satellite.type.size;

  return (
    <group ref={groupRef} position={satellite.startPosition}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[size, size * SATELLITE_VISUALS.BODY_HEIGHT_MULTIPLIER, size * SATELLITE_VISUALS.BODY_DEPTH_MULTIPLIER]} />
        <meshBasicMaterial color={satellite.type.color} />
      </mesh>

      {/* Solar panels (if applicable) */}
      {satellite.type.panels && (
        <>
          <mesh position={[size * SATELLITE_VISUALS.PANEL_X_OFFSET, 0, 0]}>
            <boxGeometry args={[size * SATELLITE_VISUALS.PANEL_WIDTH, size * SATELLITE_VISUALS.PANEL_THICKNESS, size * SATELLITE_VISUALS.PANEL_DEPTH]} />
            <meshBasicMaterial color={SATELLITE_VISUALS.PANEL_COLOR} />
          </mesh>
          <mesh position={[-size * SATELLITE_VISUALS.PANEL_X_OFFSET, 0, 0]}>
            <boxGeometry args={[size * SATELLITE_VISUALS.PANEL_WIDTH, size * SATELLITE_VISUALS.PANEL_THICKNESS, size * SATELLITE_VISUALS.PANEL_DEPTH]} />
            <meshBasicMaterial color={SATELLITE_VISUALS.PANEL_COLOR} />
          </mesh>
        </>
      )}
    </group>
  );
}

// =============================================================================
// SATELLITES MANAGER COMPONENT
// =============================================================================

export function Satellites() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const nextIdRef = useRef(0);
  const clockRef = useRef<THREE.Clock | null>(null);

  // Get clock reference from first frame
  useFrame((state) => {
    if (!clockRef.current) {
      clockRef.current = state.clock;
    }
  });

  // Spawn satellites periodically
  useEffect(() => {
    const spawnSatellite = () => {
      if (!clockRef.current) return;

      setSatellites((prev) => {
        // Don't spawn if at max capacity
        if (prev.length >= SATELLITE_SPAWN.MAX_ACTIVE) return prev;

        // Spawn from left or right side of view, traveling across
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? -SATELLITE_PHYSICS.ALTITUDE : SATELLITE_PHYSICS.ALTITUDE;
        const startY = SATELLITE_SPAWN_POSITION.START_Y_BASE + Math.random() * SATELLITE_SPAWN_POSITION.START_Y_RANGE;
        const startZ = -SATELLITE_PHYSICS.ALTITUDE * (SATELLITE_SPAWN_POSITION.START_Z_LOWER + Math.random() * SATELLITE_SPAWN_POSITION.START_Z_RANGE);

        // Direction: across the sky with slight variation
        const dirX = fromLeft ? 1 : -1;
        const dirY = (Math.random() - 0.5) * SATELLITE_SPAWN_POSITION.DIR_Y_SCALE;
        const dirZ = (Math.random() - 0.5) * SATELLITE_SPAWN_POSITION.DIR_Z_SCALE;
        const direction = new THREE.Vector3(dirX, dirY, dirZ).normalize();

        // Random satellite type
        const typeRoll = Math.random();
        const type = selectSatelliteType(typeRoll);

        const newSatellite: SatelliteData = {
          id: nextIdRef.current++,
          type,
          startPosition: new THREE.Vector3(startX, startY, startZ),
          direction,
          speed: SATELLITE_PHYSICS.SPEED * (SATELLITE_PHYSICS.SPEED_MIN_FACTOR + Math.random() * SATELLITE_PHYSICS.SPEED_VARIATION),
          createdAt: clockRef.current?.elapsedTime ?? 0,
          altitude: SATELLITE_PHYSICS.ALTITUDE,
        };

        return [...prev, newSatellite];
      });
    };

    // Schedule spawns at random intervals
    const scheduleNextSpawn = () => {
      const interval =
        SATELLITE_SPAWN.MIN_INTERVAL_MS +
        Math.random() * (SATELLITE_SPAWN.MAX_INTERVAL_MS - SATELLITE_SPAWN.MIN_INTERVAL_MS);
      return setTimeout(() => {
        spawnSatellite();
        timeoutId = scheduleNextSpawn();
      }, interval);
    };

    // Initial spawn after a short delay
    let timeoutId = setTimeout(() => {
      spawnSatellite();
      timeoutId = scheduleNextSpawn();
    }, SATELLITE_SPAWN.INITIAL_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  // Remove expired satellites
  const handleExpired = (id: number) => {
    setSatellites((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <group>
      {satellites.map((satellite) => (
        <SatelliteMesh
          key={satellite.id}
          satellite={satellite}
          onExpired={handleExpired}
        />
      ))}
    </group>
  );
}

export default Satellites;
