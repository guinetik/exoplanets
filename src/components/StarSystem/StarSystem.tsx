/**
 * StarSystem Component
 * Pure 3D visualization of a star system with orbiting planets
 * All UI overlays should be handled by the parent page
 */

import { useMemo, useCallback, Suspense, useRef, createContext, useContext, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Star, Exoplanet } from '../../types';
import { generateSolarSystem, type StellarBody } from '../../utils/solarSystem';
import { CelestialBody } from './CelestialBody';
import { OrbitRing } from './OrbitRing';
import { NebulaBackground } from './NebulaBackground';
import { useDeviceCapability } from '../../hooks/useDeviceCapability';
import {
  BACKGROUND_STARS,
  SCENE_LIGHTING,
  CAMERA_BASELINE,
  CAMERA_RESPONSIVENESS,
  CAMERA_FOCUS_ANIMATION,
  CAMERA_RETURN_ANIMATION,
  AUTO_ROTATION,
  CAMERA_DISTANCE,
  NEBULA_BACKGROUND,
  SCENE_CANVAS,
} from '../../utils/starSystemVisuals';

/** Context for sharing body positions between components */
interface BodyPositionsContextType {
  positions: React.MutableRefObject<Map<string, THREE.Vector3>>;
  registerPosition: (id: string, position: THREE.Vector3) => void;
}

const BodyPositionsContext = createContext<BodyPositionsContextType | null>(null);

/** Context for sharing camera distance with celestial bodies */
interface CameraContextType {
  cameraDistance: React.MutableRefObject<number>;
}

export const CameraContext = createContext<CameraContextType | null>(null);

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
  /** Callback when 3D scene is ready and rendering */
  onReady?: () => void;
}

/**
 * Component that signals when the scene has rendered its first frame
 */
function SceneReadyDetector({ onReady }: { onReady?: () => void }) {
  const hasSignaled = useRef(false);

  useFrame(() => {
    if (!hasSignaled.current && onReady) {
      hasSignaled.current = true;
      onReady();
    }
  });

  return null;
}

/**
 * Static background stars with fade-in animation
 * Stars are distributed on a sphere and fade in gracefully on mount
 */
function BackgroundStars({ count = BACKGROUND_STARS.COUNT }: { count?: number }) {
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const fadeStartTime = useRef<number | null>(null);
  const [isFullyVisible, setIsFullyVisible] = useState(false);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribute on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = BACKGROUND_STARS.SPHERE_RADIUS;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  // Animate fade-in
  useFrame((state) => {
    if (!materialRef.current) return;

    // Initialize fade start time on first frame
    if (fadeStartTime.current === null) {
      fadeStartTime.current = state.clock.elapsedTime;
    }

    // Calculate and apply fade-in opacity
    if (!isFullyVisible) {
      const elapsed = state.clock.elapsedTime - fadeStartTime.current;
      // Ease-out cubic for smooth deceleration
      const t = Math.min(elapsed / BACKGROUND_STARS.FADE_DURATION, 1);
      const opacity = (1 - Math.pow(1 - t, BACKGROUND_STARS.FADE_EASING_POWER)) * BACKGROUND_STARS.TARGET_OPACITY;

      materialRef.current.opacity = opacity;

      if (t >= 1) {
        setIsFullyVisible(true);
      }
    }
  });

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
        ref={materialRef}
        size={BACKGROUND_STARS.POINT_SIZE}
        color={BACKGROUND_STARS.COLOR}
        transparent
        opacity={BACKGROUND_STARS.INITIAL_OPACITY}
        sizeAttenuation={false}
      />
    </points>
  );
}

/**
 * Calculates responsive multiplier based on viewport aspect ratio.
 * Fully proportional: zooms out on narrow screens, zooms in on wide screens.
 * @param aspect - Current viewport aspect ratio (width/height)
 * @returns Multiplier for camera distance (>1 = zoom out, <1 = zoom in)
 */
function getResponsiveMultiplier(aspect: number): number {
  return CAMERA_BASELINE.ASPECT_RATIO / aspect;
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
  const cameraContext = useContext(CameraContext);
  
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

    // Update camera distance for zoom-based detail in shaders
    if (cameraContext) {
      cameraContext.cameraDistance.current = camera.position.length();
    }

    // Calculate responsive multiplier based on current viewport aspect ratio
    const aspect = viewport.width / viewport.height;
    const responsiveMultiplier = getResponsiveMultiplier(aspect);
    
    // Detect if the viewport aspect ratio changed significantly (resize event)
    const multiplierDelta = Math.abs(responsiveMultiplier - lastMultiplier.current);
    if (multiplierDelta > CAMERA_RESPONSIVENESS.MULTIPLIER_DELTA_THRESHOLD) {
      isResizeAdjusting.current = true;
    }

    // Calculate the responsive camera distance and default position
    const responsiveDistance = baseCameraDistance * responsiveMultiplier;
    const defaultPosition = new THREE.Vector3(
      0,
      responsiveDistance * CAMERA_BASELINE.INITIAL_Y_MULTIPLIER,
      responsiveDistance
    );

    // Smoothly transition multiplier for fluid resize behavior
    lastMultiplier.current = THREE.MathUtils.lerp(
      lastMultiplier.current,
      responsiveMultiplier,
      CAMERA_RESPONSIVENESS.RESPONSIVE_LERP
    );

    // Stop resize adjustment once we've caught up
    if (multiplierDelta < CAMERA_RESPONSIVENESS.ADJUSTMENT_STOP_THRESHOLD) {
      isResizeAdjusting.current = false;
    }

    if (focusedBody && positionsContext) {
      // Get the current position of the focused body
      const bodyPosition = positionsContext.positions.current.get(focusedBody.id);

      if (bodyPosition) {
        isAnimating.current = true;
        // Ramp up animation progress quickly (controls how tightly we follow)
        animationProgress.current = Math.min(animationProgress.current + delta * CAMERA_FOCUS_ANIMATION.PROGRESS_RAMP_UP, 1);

        // Calculate camera offset based on body size
        const offsetDistance = focusedBody.diameter * CAMERA_FOCUS_ANIMATION.OFFSET_DISTANCE_MULTIPLIER;

        // Position camera behind and above the body, looking at it
        // The offset is relative to the body's position, so camera follows
        const targetCameraPos = new THREE.Vector3(
          bodyPosition.x,
          bodyPosition.y + offsetDistance * CAMERA_FOCUS_ANIMATION.Y_OFFSET_MULTIPLIER,
          bodyPosition.z + offsetDistance
        );

        // Start with faster chase, then tighten follow once arrived
        // This lets the camera catch up to the moving planet smoothly
        const lerpFactor = CAMERA_FOCUS_ANIMATION.BASE_LERP + animationProgress.current * (CAMERA_FOCUS_ANIMATION.FOLLOW_LERP - CAMERA_FOCUS_ANIMATION.BASE_LERP);

        // Smoothly chase the camera position to follow the body
        camera.position.lerp(targetCameraPos, lerpFactor);

        // Keep controls target locked on the body (slightly faster for smooth look-at)
        controlsRef.current.target.lerp(bodyPosition, lerpFactor * CAMERA_FOCUS_ANIMATION.TARGET_LERP_MULTIPLIER);
        controlsRef.current.update();
      }
    } else {
      // Return to default view (or adjust for responsive changes)
      if (isAnimating.current || animationProgress.current > 0) {
        animationProgress.current = Math.max(animationProgress.current - delta * CAMERA_RETURN_ANIMATION.PROGRESS_RAMP_DOWN, 0);

        // Lerp back to responsive default position
        camera.position.lerp(defaultPosition, CAMERA_RETURN_ANIMATION.CAMERA_RETURN_LERP);
        controlsRef.current.target.lerp(defaultTarget.current, CAMERA_RETURN_ANIMATION.TARGET_RETURN_LERP);
        controlsRef.current.update();

        if (animationProgress.current <= 0) {
          isAnimating.current = false;
        }
      } else if (isResizeAdjusting.current) {
        // Only adjust camera when viewport aspect ratio is actively changing
        // This preserves user's manual camera position during normal interaction
        camera.position.lerp(defaultPosition, CAMERA_RETURN_ANIMATION.RESIZE_ADJUST_LERP);
        controlsRef.current.target.lerp(defaultTarget.current, CAMERA_RETURN_ANIMATION.RESIZE_TARGET_LERP);
        controlsRef.current.update();
      } else if (shouldAutoRotate) {
        // Normal auto-rotation when not animating or resizing
        controlsRef.current.setAzimuthalAngle(
          controlsRef.current.getAzimuthalAngle() + delta * AUTO_ROTATION.SPEED
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
      minDistance={CAMERA_BASELINE.MIN_DISTANCE}
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
  onReady,
}: StarSystemProps) {
  // Detect device capabilities for performance scaling
  const { quality: deviceQuality } = useDeviceCapability();

  // Ref map to track body positions in real-time
  const bodyPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());

  // Ref to track camera distance for zoom-based detail
  const cameraDistanceRef = useRef<number>(100);

  // Context value for sharing positions
  const positionsContextValue = useMemo(() => ({
    positions: bodyPositionsRef,
    registerPosition: (id: string, position: THREE.Vector3) => {
      bodyPositionsRef.current.set(id, position.clone());
    },
  }), []);

  // Context value for sharing camera distance
  const cameraContextValue = useMemo(() => ({
    cameraDistance: cameraDistanceRef,
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
    const minDistanceForStar = starDiameter * CAMERA_DISTANCE.STAR_SIZE_MULTIPLIER;
    const distanceForOrbits = maxOrbit * CAMERA_DISTANCE.ORBITS_MULTIPLIER;

    return Math.max(minDistanceForStar, distanceForOrbits);
  }, [bodies]);

  // Initial camera position for Canvas (will be adjusted responsively by CameraControls)
  // Use a conservative multiplier for initial render to avoid flash on mobile
  const initialCameraDistance = useMemo(() => {
    // Check if we're on a narrow screen initially
    const aspect = typeof window !== 'undefined'
      ? window.innerWidth / window.innerHeight
      : CAMERA_BASELINE.ASPECT_RATIO;
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
          position: [0, initialCameraDistance * CAMERA_BASELINE.INITIAL_Y_MULTIPLIER, initialCameraDistance],
          fov: CAMERA_BASELINE.FOV,
        }}
        style={{ background: SCENE_CANVAS.BACKGROUND_COLOR }}
        onPointerMissed={() => onBackgroundClick?.()}
      >
        <CameraContext.Provider value={cameraContextValue}>
          <BodyPositionsContext.Provider value={positionsContextValue}>
            <Suspense fallback={null}>
            {/* Signal when scene is ready */}
            <SceneReadyDetector onReady={onReady} />

            {/* Ambient light for base visibility */}
            <ambientLight intensity={SCENE_LIGHTING.AMBIENT_INTENSITY} />

            {/* Hemisphere light for better planet illumination */}
            <hemisphereLight args={[SCENE_LIGHTING.HEMISPHERE_SKY_COLOR, SCENE_LIGHTING.HEMISPHERE_GROUND_COLOR, SCENE_LIGHTING.HEMISPHERE_INTENSITY]} />

            {/* Space background with static stars */}
            <BackgroundStars count={BACKGROUND_STARS.COUNT} />

            {/* Procedural nebula background */}
            <NebulaBackground
              systemName={star.hostname}
              density={NEBULA_BACKGROUND.DENSITY}
              radius={NEBULA_BACKGROUND.RADIUS}
              quality={deviceQuality}
            />

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
              maxDistance={baseCameraDistance * CAMERA_DISTANCE.MAX_DISTANCE_MULTIPLIER}
              focusedBody={focusedBody}
              baseCameraDistance={baseCameraDistance}
            />
            </Suspense>
          </BodyPositionsContext.Provider>
        </CameraContext.Provider>
      </Canvas>
    </div>
  );
}


// Re-export StellarBody type for parent components
export type { StellarBody } from '../../utils/solarSystem';

export default StarSystem;
