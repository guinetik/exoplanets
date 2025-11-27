/**
 * StarSystem Component
 * Pure 3D visualization of a star system with orbiting planets
 * All UI overlays should be handled by the parent page
 */

import { useMemo, useCallback, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Star, Exoplanet } from '../../types';
import { generateSolarSystem, type StellarBody } from '../../utils/solarSystem';
import { CelestialBody } from './CelestialBody';
import { OrbitRing } from './OrbitRing';

interface StarSystemProps {
  /** Star data */
  star: Star;
  /** Planets in the system */
  planets: Exoplanet[];
  /** Currently hovered body (controlled by parent) */
  hoveredBody?: StellarBody | null;
  /** Callback when a body is hovered */
  onBodyHover?: (body: StellarBody | null, mousePos?: { x: number; y: number }) => void;
  /** Callback when a body is clicked */
  onBodyClick?: (body: StellarBody) => void;
}

// Static background stars - no animation, attached to camera
function BackgroundStars({ count = 3000 }: { count?: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribute on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 500;

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
        size={1.5}
        color={0xffffff}
        transparent
        opacity={0.6}
        sizeAttenuation={false}
      />
    </points>
  );
}

// Camera controls with slow auto-rotation
function CameraControls({
  shouldAutoRotate,
  maxDistance,
}: {
  shouldAutoRotate: boolean;
  maxDistance: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Auto-rotation
  useFrame((_, delta) => {
    if (controlsRef.current && shouldAutoRotate) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() + delta * 0.1
      );
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={maxDistance}
      autoRotate={false}
    />
  );
}

/**
 * Generates stellar bodies and exposes them via callback for parent use
 */
export function useStarSystemBodies(star: Star, planets: Exoplanet[]) {
  return useMemo(() => generateSolarSystem(star, planets), [star, planets]);
}

export function StarSystem({
  star,
  planets,
  hoveredBody,
  onBodyHover,
  onBodyClick,
}: StarSystemProps) {
  // Generate solar system data
  const bodies = useMemo(
    () => generateSolarSystem(star, planets),
    [star, planets]
  );

  // Calculate camera distance based on outermost orbit AND star size
  const cameraDistance = useMemo(() => {
    const maxOrbit = Math.max(...bodies.map((b) => b.orbitRadius), 10);
    const starBody = bodies.find((b) => b.type === 'star');
    const starDiameter = starBody?.diameter ?? 3;

    // Ensure camera is far enough to see the star + some orbits
    // For big stars, we need more distance
    const minDistanceForStar = starDiameter * 4;
    const distanceForOrbits = maxOrbit * 2.5;

    return Math.max(minDistanceForStar, distanceForOrbits);
  }, [bodies]);

  const handleBodyHover = useCallback(
    (body: StellarBody | null, pos?: { x: number; y: number }) => {
      onBodyHover?.(body, pos);
    },
    [onBodyHover]
  );

  const handleBodyClick = useCallback(
    (body: StellarBody) => {
      onBodyClick?.(body);
    },
    [onBodyClick]
  );

  return (
    <div className="starsystem-container">
      <Canvas
        camera={{
          position: [0, cameraDistance * 0.5, cameraDistance],
          fov: 50,
        }}
        style={{ background: 'black' }}
      >
        <Suspense fallback={null}>
          {/* Ambient light for base visibility */}
          <ambientLight intensity={0.6} />

          {/* Hemisphere light for better planet illumination */}
          <hemisphereLight args={['#ffffff', '#444444', 0.5]} />

          {/* Space background with static stars */}
          <BackgroundStars count={3000} />

          {/* Render all celestial bodies */}
          {bodies.map((body) => (
            <CelestialBody
              key={body.id}
              body={body}
              isHovered={hoveredBody?.id === body.id}
              onHover={handleBodyHover}
              onClick={handleBodyClick}
            />
          ))}

          {/* Render orbit rings for planets */}
          {bodies
            .filter((b) => b.type === 'planet')
            .map((body) => (
              <OrbitRing
                key={`orbit-${body.id}`}
                radius={body.orbitRadius}
                eccentricity={body.orbitEccentricity}
                isHighlighted={hoveredBody?.id === body.id}
              />
            ))}

          {/* Render orbit rings for stars in binary systems */}
          {bodies
            .filter((b) => b.type === 'star' && b.orbitRadius > 0)
            .map((body) => (
              <OrbitRing
                key={`orbit-${body.id}`}
                radius={body.orbitRadius}
                eccentricity={body.orbitEccentricity}
                isHighlighted={hoveredBody?.id === body.id}
                isBinaryOrbit
              />
            ))}

          {/* Camera controls */}
          <CameraControls
            shouldAutoRotate={!hoveredBody}
            maxDistance={cameraDistance * 3}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Re-export StellarBody type for parent components
export type { StellarBody } from '../../utils/solarSystem';

export default StarSystem;
