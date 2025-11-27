/**
 * Satellites Component
 * Renders satellites (ISS, etc.) cruising across the sky at realistic altitudes
 */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// =============================================================================
// CONSTANTS
// =============================================================================

// Satellite spawn settings
const MIN_SPAWN_INTERVAL_MS = 5000; // Minimum time between spawns
const MAX_SPAWN_INTERVAL_MS = 12000; // Maximum time between spawns
const MAX_ACTIVE_SATELLITES = 3; // Max satellites visible at once
const SATELLITE_LIFETIME_S = 20; // How long a satellite lives (seconds)

// Satellite visual settings
const SATELLITE_BASE_SIZE = 0.8;
const SATELLITE_ALTITUDE = 80; // Distance from camera (simulates LEO altitude)
const SATELLITE_SPEED = 15; // Units per second

// Satellite types with different appearances
const SATELLITE_TYPES = [
  { name: 'ISS', color: '#ffffff', size: 1.0, panels: true },
  { name: 'Satellite', color: '#aaaaaa', size: 0.6, panels: true },
  { name: 'Debris', color: '#666666', size: 0.3, panels: false },
] as const;

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
    if (elapsed > SATELLITE_LIFETIME_S) {
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
    groupRef.current.rotation.x += 0.01;
    groupRef.current.rotation.y += 0.02;
  });

  const size = SATELLITE_BASE_SIZE * satellite.type.size;

  return (
    <group ref={groupRef} position={satellite.startPosition}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[size, size * 0.5, size * 0.5]} />
        <meshBasicMaterial color={satellite.type.color} />
      </mesh>

      {/* Solar panels (if applicable) */}
      {satellite.type.panels && (
        <>
          <mesh position={[size * 0.8, 0, 0]}>
            <boxGeometry args={[size * 0.8, size * 0.05, size * 0.4]} />
            <meshBasicMaterial color="#1a3a5c" />
          </mesh>
          <mesh position={[-size * 0.8, 0, 0]}>
            <boxGeometry args={[size * 0.8, size * 0.05, size * 0.4]} />
            <meshBasicMaterial color="#1a3a5c" />
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
        if (prev.length >= MAX_ACTIVE_SATELLITES) return prev;

        // Spawn from left or right side of view, traveling across
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? -SATELLITE_ALTITUDE : SATELLITE_ALTITUDE;
        const startY = 10 + Math.random() * 40; // 10-50 units above horizon
        const startZ = -SATELLITE_ALTITUDE * (0.3 + Math.random() * 0.7); // In front of camera

        // Direction: across the sky with slight variation
        const dirX = fromLeft ? 1 : -1;
        const dirY = (Math.random() - 0.5) * 0.3; // Slight vertical drift
        const dirZ = (Math.random() - 0.5) * 0.5; // Some depth variation
        const direction = new THREE.Vector3(dirX, dirY, dirZ).normalize();

        // Random satellite type (ISS is rarer)
        const typeRoll = Math.random();
        const type =
          typeRoll < 0.15
            ? SATELLITE_TYPES[0] // ISS - 15%
            : typeRoll < 0.7
              ? SATELLITE_TYPES[1] // Satellite - 55%
              : SATELLITE_TYPES[2]; // Debris - 30%

        const newSatellite: SatelliteData = {
          id: nextIdRef.current++,
          type,
          startPosition: new THREE.Vector3(startX, startY, startZ),
          direction,
          speed: SATELLITE_SPEED * (0.8 + Math.random() * 0.4),
          createdAt: clockRef.current?.elapsedTime ?? 0,
          altitude: SATELLITE_ALTITUDE,
        };

        return [...prev, newSatellite];
      });
    };

    // Schedule spawns at random intervals
    const scheduleNextSpawn = () => {
      const interval =
        MIN_SPAWN_INTERVAL_MS +
        Math.random() * (MAX_SPAWN_INTERVAL_MS - MIN_SPAWN_INTERVAL_MS);
      return setTimeout(() => {
        spawnSatellite();
        timeoutId = scheduleNextSpawn();
      }, interval);
    };

    // Initial spawn after a short delay
    let timeoutId = setTimeout(() => {
      spawnSatellite();
      timeoutId = scheduleNextSpawn();
    }, 3000);

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
