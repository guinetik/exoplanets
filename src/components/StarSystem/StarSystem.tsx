/**
 * StarSystem Component
 * Pure 3D visualization of a star system with orbiting planets
 * All UI overlays should be handled by the parent page
 */

import { useMemo, useCallback, Suspense, useRef, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Star, Exoplanet } from '../../types';
import { generateSolarSystem, type StellarBody } from '../../utils/solarSystem';
import { CelestialBody } from './CelestialBody';
import { OrbitRing } from './OrbitRing';

/** Context for sharing body positions between components */
interface BodyPositionsContextType {
  positions: React.MutableRefObject<Map<string, THREE.Vector3>>;
  registerPosition: (id: string, position: THREE.Vector3) => void;
}

const BodyPositionsContext = createContext<BodyPositionsContextType | null>(null);

interface StarSystemProps {
  /** Star data */
  star: Star;
  /** Planets in the system */
  planets: Exoplanet[];
  /** Currently hovered body (controlled by parent) */
  hoveredBody?: StellarBody | null;
  /** Currently focused body for camera zoom */
  focusedBody?: StellarBody | null;
  /** Callback when a body is hovered */
  onBodyHover?: (body: StellarBody | null, mousePos?: { x: number; y: number }) => void;
  /** Callback when a body is clicked */
  onBodyClick?: (body: StellarBody) => void;
  /** Callback when clicking empty space (background) */
  onBackgroundClick?: () => void;
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

/** Baseline aspect ratio - the "reference" viewport for camera distance calculations */
const BASELINE_ASPECT = 1.5;

/**
 * Calculates responsive multiplier based on viewport aspect ratio.
 * Fully proportional: zooms out on narrow screens, zooms in on wide screens.
 * @param aspect - Current viewport aspect ratio (width/height)
 * @returns Multiplier for camera distance (>1 = zoom out, <1 = zoom in)
 */
function getResponsiveMultiplier(aspect: number): number {
  return BASELINE_ASPECT / aspect;
}

/**
 * Camera controls with auto-rotation, focus-on-body animation,
 * and responsive adjustment for different screen aspect ratios
 */
function CameraControls({
  shouldAutoRotate,
  maxDistance,
  focusedBody,
  baseCameraDistance,
}: {
  shouldAutoRotate: boolean;
  maxDistance: number;
  focusedBody?: StellarBody | null;
  /** Base camera distance before responsive adjustment */
  baseCameraDistance: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, viewport } = useThree();
  const positionsContext = useContext(BodyPositionsContext);
  
  // Store the default target (center of system)
  const defaultTarget = useRef(new THREE.Vector3(0, 0, 0));
  
  // Animation state
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  
  // Track last responsive multiplier to detect viewport changes
  const lastMultiplier = useRef(1);
  // Track if we're currently adjusting for a resize
  const isResizeAdjusting = useRef(false);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    
    // Calculate responsive multiplier based on current viewport aspect ratio
    const aspect = viewport.width / viewport.height;
    const responsiveMultiplier = getResponsiveMultiplier(aspect);
    
    // Detect if the viewport aspect ratio changed significantly (resize event)
    const multiplierDelta = Math.abs(responsiveMultiplier - lastMultiplier.current);
    if (multiplierDelta > 0.01) {
      isResizeAdjusting.current = true;
    }
    
    // Calculate the responsive camera distance and default position
    const responsiveDistance = baseCameraDistance * responsiveMultiplier;
    const defaultPosition = new THREE.Vector3(
      0,
      responsiveDistance * 0.5,
      responsiveDistance
    );
    
    // Smoothly transition multiplier for fluid resize behavior
    lastMultiplier.current = THREE.MathUtils.lerp(
      lastMultiplier.current,
      responsiveMultiplier,
      0.1
    );
    
    // Stop resize adjustment once we've caught up
    if (multiplierDelta < 0.001) {
      isResizeAdjusting.current = false;
    }

    if (focusedBody && positionsContext) {
      // Get the current position of the focused body
      const bodyPosition = positionsContext.positions.current.get(focusedBody.id);
      
      if (bodyPosition) {
        isAnimating.current = true;
        // Ramp up animation progress quickly (controls how tightly we follow)
        animationProgress.current = Math.min(animationProgress.current + delta * 3, 1);
        
        // Calculate camera offset based on body size
        const offsetDistance = focusedBody.diameter * 4;
        
        // Position camera behind and above the body, looking at it
        // The offset is relative to the body's position, so camera follows
        const targetCameraPos = new THREE.Vector3(
          bodyPosition.x,
          bodyPosition.y + offsetDistance * 0.4,
          bodyPosition.z + offsetDistance
        );
        
        // Start with faster chase, then tighten follow once arrived
        // This lets the camera catch up to the moving planet smoothly
        const baseLerp = 0.06;
        const followLerp = 0.12;
        const lerpFactor = baseLerp + animationProgress.current * (followLerp - baseLerp);
        
        // Smoothly chase the camera position to follow the body
        camera.position.lerp(targetCameraPos, lerpFactor);
        
        // Keep controls target locked on the body (slightly faster for smooth look-at)
        controlsRef.current.target.lerp(bodyPosition, lerpFactor * 1.5);
        controlsRef.current.update();
      }
    } else {
      // Return to default view (or adjust for responsive changes)
      if (isAnimating.current || animationProgress.current > 0) {
        animationProgress.current = Math.max(animationProgress.current - delta * 2, 0);
        
        // Lerp back to responsive default position
        camera.position.lerp(defaultPosition, 0.03);
        controlsRef.current.target.lerp(defaultTarget.current, 0.03);
        controlsRef.current.update();
        
        if (animationProgress.current <= 0) {
          isAnimating.current = false;
        }
      } else if (isResizeAdjusting.current) {
        // Only adjust camera when viewport aspect ratio is actively changing
        // This preserves user's manual camera position during normal interaction
        camera.position.lerp(defaultPosition, 0.02);
        controlsRef.current.target.lerp(defaultTarget.current, 0.02);
        controlsRef.current.update();
      } else if (shouldAutoRotate) {
        // Normal auto-rotation when not animating or resizing
        controlsRef.current.setAzimuthalAngle(
          controlsRef.current.getAzimuthalAngle() + delta * 0.1
        );
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
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
  focusedBody,
  onBodyHover,
  onBodyClick,
  onBackgroundClick,
}: StarSystemProps) {
  // Ref map to track body positions in real-time
  const bodyPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
  
  // Context value for sharing positions
  const positionsContextValue = useMemo(() => ({
    positions: bodyPositionsRef,
    registerPosition: (id: string, position: THREE.Vector3) => {
      bodyPositionsRef.current.set(id, position.clone());
    },
  }), []);

  // Generate solar system data
  const bodies = useMemo(
    () => generateSolarSystem(star, planets),
    [star, planets]
  );

  // Calculate base camera distance based on outermost orbit AND star size
  // This is the desktop baseline - responsive adjustments happen inside CameraControls
  const baseCameraDistance = useMemo(() => {
    const maxOrbit = Math.max(...bodies.map((b) => b.orbitRadius), 10);
    const starBody = bodies.find((b) => b.type === 'star');
    const starDiameter = starBody?.diameter ?? 3;

    // Ensure camera is far enough to see the star + some orbits
    // For big stars, we need more distance
    const minDistanceForStar = starDiameter * 4;
    const distanceForOrbits = maxOrbit * 2.5;

    return Math.max(minDistanceForStar, distanceForOrbits);
  }, [bodies]);

  // Initial camera position for Canvas (will be adjusted responsively by CameraControls)
  // Use a conservative multiplier for initial render to avoid flash on mobile
  const initialCameraDistance = useMemo(() => {
    // Check if we're on a narrow screen initially
    const aspect = typeof window !== 'undefined' 
      ? window.innerWidth / window.innerHeight 
      : BASELINE_ASPECT;
    const multiplier = getResponsiveMultiplier(aspect);
    return baseCameraDistance * multiplier;
  }, [baseCameraDistance]);

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
          position: [0, initialCameraDistance * 0.5, initialCameraDistance],
          fov: 50,
        }}
        style={{ background: 'black' }}
        onPointerMissed={() => onBackgroundClick?.()}
      >
        <BodyPositionsContext.Provider value={positionsContextValue}>
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
                onPositionUpdate={positionsContextValue.registerPosition}
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

            {/* Camera controls with focus animation and responsive adjustment */}
            <CameraControls
              shouldAutoRotate={!hoveredBody && !focusedBody}
              maxDistance={baseCameraDistance * 3}
              focusedBody={focusedBody}
              baseCameraDistance={baseCameraDistance}
            />
          </Suspense>
        </BodyPositionsContext.Provider>
      </Canvas>
    </div>
  );
}


// Re-export StellarBody type for parent components
export type { StellarBody } from '../../utils/solarSystem';

export default StarSystem;
