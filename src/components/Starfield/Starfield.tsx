/**
 * Starfield Component
 * Main Three.js canvas for the star visualization
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { Stars } from './Stars';
import { EarthHorizon } from './EarthHorizon';
import { Satellites } from './Satellites';
import type { Star } from '../../types';
import {
  ObserverLocation,
  formatLatitude,
  formatLongitude,
  formatAzimuth,
  formatAltitude,
  LOCATIONS,
} from '../../utils/astronomy';

interface StarfieldProps {
  stars: Star[];
  onStarClick?: (star: Star) => void;
}

// Easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface IntroState {
  phase: 'earth-spin' | 'camera-swoop' | 'stars-fade' | 'complete';
  progress: number;
}

/**
 * Intro Earth - larger, rotating planet during intro
 */
function IntroEarth({ opacity, swoopProgress }: { opacity: number; swoopProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  if (opacity <= 0) return null;

  // During swoop, Earth moves down from center view to horizon
  // Start Y: -300 (center of view), End Y: -600 (at horizon level)
  const yPosition = -300 - swoopProgress * 300;

  return (
    <group ref={groupRef} position={[0, yPosition, -400]}>
      {/* Main Earth body */}
      <mesh>
        <sphereGeometry args={[250, 64, 64]} />
        <meshBasicMaterial color={0x0a1628} transparent opacity={opacity} />
      </mesh>

      {/* Ocean hints */}
      <mesh>
        <sphereGeometry args={[251, 64, 64]} />
        <meshBasicMaterial
          color={0x1a4a7a}
          transparent
          opacity={opacity * 0.3}
          wireframe
        />
      </mesh>

      {/* Inner atmosphere */}
      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[250, 32, 32]} />
        <meshBasicMaterial
          color={0x3388cc}
          transparent
          opacity={opacity * 0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[250, 32, 32]} />
        <meshBasicMaterial
          color={0x66aaff}
          transparent
          opacity={opacity * 0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Camera controller - handles intro animation and user controls
 */
function CameraController({
  introState,
  onBearingChange,
  controlsEnabled,
}: {
  introState: IntroState;
  onBearingChange: (azimuth: number, altitude: number) => void;
  controlsEnabled: boolean;
}) {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ azimuth: 180, altitude: -10 });

  // Intro animation
  useFrame(() => {
    const { phase, progress } = introState;

    if (phase === 'earth-spin') {
      // Camera positioned to view Earth from space
      const angle = progress * Math.PI * 0.3; // Slight orbit
      camera.position.set(
        Math.sin(angle) * 100,
        50 + Math.sin(progress * Math.PI) * 30,
        400 - progress * 100
      );
      camera.lookAt(0, -300, -400);
      camera.updateProjectionMatrix();
    } else if (phase === 'camera-swoop') {
      // Swoop from space view to surface view
      const eased = easeOutCubic(progress);

      // Start position (viewing Earth from space)
      const startPos = new THREE.Vector3(0, 80, 300);
      // End position (at surface, origin)
      const endPos = new THREE.Vector3(0, 0, 0);

      camera.position.lerpVectors(startPos, endPos, eased);

      // Start looking at Earth center, end looking at horizon
      const startLook = new THREE.Vector3(0, -300, -400);
      const azRad = (180 * Math.PI) / 180;
      const altRad = (-10 * Math.PI) / 180;
      const endLook = new THREE.Vector3(
        -Math.sin(azRad) * Math.cos(altRad) * 100,
        Math.sin(altRad) * 100,
        -Math.cos(azRad) * Math.cos(altRad) * 100
      );

      const lookTarget = new THREE.Vector3().lerpVectors(startLook, endLook, eased);
      camera.lookAt(lookTarget);
      camera.updateProjectionMatrix();

      onBearingChange(180, -10 * eased);
    } else if (phase === 'stars-fade' || phase === 'complete') {
      // Final position maintained by user controls or default
      if (!controlsEnabled) {
        camera.position.set(0, 0, 0);
        const azRad = (rotation.current.azimuth * Math.PI) / 180;
        const altRad = (rotation.current.altitude * Math.PI) / 180;
        camera.lookAt(
          -Math.sin(azRad) * Math.cos(altRad) * 100,
          Math.sin(altRad) * 100,
          -Math.cos(azRad) * Math.cos(altRad) * 100
        );
        camera.updateProjectionMatrix();
      }
    }
  });

  // User controls (only when enabled)
  useEffect(() => {
    if (!controlsEnabled) return;

    const canvas = gl.domElement;

    const updateCameraPosition = () => {
      const { azimuth, altitude } = rotation.current;
      const azRad = (azimuth * Math.PI) / 180;
      const altRad = (altitude * Math.PI) / 180;

      camera.position.set(0, 0, 0);
      camera.lookAt(
        -Math.sin(azRad) * Math.cos(altRad) * 100,
        Math.sin(altRad) * 100,
        -Math.cos(azRad) * Math.cos(altRad) * 100
      );
      camera.updateProjectionMatrix();
      onBearingChange(azimuth, altitude);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;

      rotation.current.azimuth -= deltaX * 0.3;
      rotation.current.altitude += deltaY * 0.3;
      rotation.current.azimuth = ((rotation.current.azimuth % 360) + 360) % 360;
      rotation.current.altitude = Math.max(-10, Math.min(90, rotation.current.altitude));

      previousMouse.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Set initial position
    updateCameraPosition();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [gl, camera, controlsEnabled, onBearingChange]);

  return null;
}

/**
 * Background stars (random small stars for ambiance)
 */
function BackgroundStars({ opacity }: { opacity: number }) {
  const count = 3000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 800;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

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
        size={0.8}
        color={0x888888}
        transparent
        opacity={opacity * 0.5}
        sizeAttenuation={false}
      />
    </points>
  );
}

/**
 * Stars wrapper with opacity control
 */
function StarsWithOpacity({
  stars,
  observer,
  date,
  opacity,
  onStarClick,
  onStarHover,
}: {
  stars: Star[];
  observer: ObserverLocation;
  date: Date;
  opacity: number;
  onStarClick?: (star: Star) => void;
  onStarHover?: (star: Star | null, mousePos?: { x: number; y: number }) => void;
}) {
  if (opacity <= 0) return null;

  return (
    <group>
      <Stars
        stars={stars}
        observer={observer}
        date={date}
        onStarClick={onStarClick}
        onStarHover={onStarHover}
      />
    </group>
  );
}

/**
 * Custom hook for intro sequence
 */
function useIntroSequence() {
  const [state, setState] = useState<IntroState>({
    phase: 'earth-spin',
    progress: 0,
  });

  const phaseStartTime = useRef(Date.now());

  const EARTH_SPIN_DURATION = 3000;
  const CAMERA_SWOOP_DURATION = 2500;
  const STARS_FADE_DURATION = 2000;

  // Skip intro function
  const skipIntro = useCallback(() => {
    setState({ phase: 'complete', progress: 1 });
  }, []);

  useEffect(() => {
    let frameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - phaseStartTime.current;

      setState((prev) => {
        // Don't animate if already complete
        if (prev.phase === 'complete') return prev;

        if (prev.phase === 'earth-spin') {
          const progress = Math.min(elapsed / EARTH_SPIN_DURATION, 1);
          if (progress >= 1) {
            phaseStartTime.current = now;
            return { phase: 'camera-swoop', progress: 0 };
          }
          return { ...prev, progress };
        }

        if (prev.phase === 'camera-swoop') {
          const progress = Math.min(elapsed / CAMERA_SWOOP_DURATION, 1);
          if (progress >= 1) {
            phaseStartTime.current = now;
            return { phase: 'stars-fade', progress: 0 };
          }
          return { ...prev, progress };
        }

        if (prev.phase === 'stars-fade') {
          const progress = Math.min(elapsed / STARS_FADE_DURATION, 1);
          if (progress >= 1) {
            return { phase: 'complete', progress: 1 };
          }
          return { ...prev, progress };
        }

        return prev;
      });

      if (state.phase !== 'complete') {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [state.phase]);

  // Calculate derived values
  const introEarthOpacity =
    state.phase === 'earth-spin'
      ? 1
      : state.phase === 'camera-swoop'
        ? 1 - easeInOutCubic(state.progress)
        : 0;

  const starsOpacity =
    state.phase === 'stars-fade'
      ? easeInOutCubic(state.progress)
      : state.phase === 'complete'
        ? 1
        : 0;

  const controlsEnabled = state.phase === 'complete';

  // Progress of the swoop phase (0-1), used to animate Earth moving down
  const swoopProgress =
    state.phase === 'camera-swoop'
      ? easeOutCubic(state.progress)
      : state.phase === 'stars-fade' || state.phase === 'complete'
        ? 1
        : 0;

  return {
    state,
    introEarthOpacity,
    starsOpacity,
    controlsEnabled,
    swoopProgress,
    skipIntro,
  };
}

/**
 * Hook for animated location transitions
 */
function useAnimatedLocation(initialLocation: ObserverLocation) {
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [targetLocation, setTargetLocation] = useState(initialLocation);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationStart = useRef(Date.now());
  const startLocation = useRef(initialLocation);

  const ANIMATION_DURATION = 2000; // 2 seconds

  useEffect(() => {
    if (!isAnimating) return;

    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - animationStart.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const eased = easeInOutCubic(progress);

      // Interpolate lat/long
      const lat =
        startLocation.current.latitude +
        (targetLocation.latitude - startLocation.current.latitude) * eased;
      const lon =
        startLocation.current.longitude +
        (targetLocation.longitude - startLocation.current.longitude) * eased;

      setCurrentLocation({ latitude: lat, longitude: lon });

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCurrentLocation(targetLocation);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating, targetLocation]);

  const changeLocation = useCallback((newLocation: ObserverLocation) => {
    startLocation.current = currentLocation;
    animationStart.current = Date.now();
    setTargetLocation(newLocation);
    setIsAnimating(true);
  }, [currentLocation]);

  return { currentLocation, changeLocation, isAnimating };
}

/**
 * Welcome info card component
 */
interface WelcomeCardProps {
  starCount: number;
  planetCount: number;
  onDismiss: () => void;
  isExiting: boolean;
}

function WelcomeCard({ starCount, planetCount, onDismiss, isExiting }: WelcomeCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`welcome-card-container ${isExiting ? 'exiting' : ''}`}>
      <div className="welcome-card">
        <h2 className="welcome-title">
          {t('pages.home.infoCard.title')}
        </h2>
        <p className="welcome-description">
          {t('pages.home.infoCard.description')}
        </p>
        <div className="welcome-stats">
          {t('pages.home.infoCard.stats', {
            starCount: starCount.toLocaleString(),
            planetCount: planetCount.toLocaleString(),
          })}
        </div>
        <p className="welcome-hint">
          {t('pages.home.infoCard.hint')}
        </p>
        <button className="welcome-dismiss" onClick={onDismiss}>
          {t('pages.home.infoCard.dismiss')}
        </button>
      </div>
    </div>
  );
}

/**
 * Main Starfield component
 */
export function Starfield({ stars, onStarClick }: StarfieldProps) {
  const { currentLocation: observer, changeLocation, isAnimating: isLocationAnimating } =
    useAnimatedLocation(LOCATIONS['São Paulo']);
  const [date] = useState(() => new Date());
  const [bearing, setBearing] = useState({ azimuth: 180, altitude: -10 });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [locationName, setLocationName] = useState('São Paulo');
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [isWelcomeCardExiting, setIsWelcomeCardExiting] = useState(false);
  const welcomeCardDismissed = useRef(false);

  const { state, introEarthOpacity, starsOpacity, controlsEnabled, swoopProgress, skipIntro } = useIntroSequence();

  // Show welcome card when intro completes (only once)
  useEffect(() => {
    if (state.phase === 'complete' && !welcomeCardDismissed.current && !showWelcomeCard) {
      const timer = setTimeout(() => {
        setShowWelcomeCard(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.phase, showWelcomeCard]);

  /**
   * Handle welcome card dismissal with exit animation
   */
  const handleDismissWelcome = useCallback(() => {
    welcomeCardDismissed.current = true;
    setIsWelcomeCardExiting(true);
    setTimeout(() => {
      setShowWelcomeCard(false);
      setIsWelcomeCardExiting(false);
    }, 300);
  }, []);

  const handleBearingChange = useCallback(
    (azimuth: number, altitude: number) => {
      setBearing({ azimuth, altitude });
    },
    []
  );

  const handleLocationChange = useCallback((name: string, location: ObserverLocation) => {
    changeLocation(location);
    setLocationName(name);
    setShowLocationPicker(false);
  }, [changeLocation]);

  const handleStarHover = useCallback(
    (star: Star | null, pos?: { x: number; y: number }) => {
      setHoveredStar(star);
      setMousePos(pos ?? null);
    },
    []
  );

  // Hide UI during intro
  const showUI = state.phase === 'complete';

  return (
    <div className="starfield-container">
      <Canvas
        camera={{
          fov: 60,
          near: 0.1,
          far: 2000,
          position: [0, 50, 400],
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000' }}
      >
        <color attach="background" args={['#000000']} />

        <CameraController
          introState={state}
          onBearingChange={handleBearingChange}
          controlsEnabled={controlsEnabled}
        />

        {/* Ambient light */}
        <ambientLight intensity={0.3} />

        {/* Intro Earth (fades out) */}
        <IntroEarth opacity={introEarthOpacity} swoopProgress={swoopProgress} />

        {/* Background stars */}
        <BackgroundStars opacity={starsOpacity} />

        {/* Main stars from dataset */}
        <StarsWithOpacity
          stars={stars}
          observer={observer}
          date={date}
          opacity={starsOpacity}
          onStarClick={onStarClick}
          onStarHover={handleStarHover}
        />

        {/* Earth horizon (fades in with stars, rotates with location) */}
        {starsOpacity > 0 && <EarthHorizon longitude={observer.longitude} />}

        {/* Satellites cruising across the sky (only after intro) */}
        {starsOpacity > 0.5 && <Satellites />}
      </Canvas>

      {/* Telescope Bearing Display */}
      {showUI && (
        <div className="starfield-bearing">
          <div className="bearing-title">Telescope Bearing</div>
          <div className="bearing-value">
            <span className="bearing-icon">↔</span> {formatAzimuth(bearing.azimuth)}
          </div>
          <div className="bearing-value">
            <span className="bearing-icon">↕</span> {formatAltitude(bearing.altitude)}
          </div>
        </div>
      )}

      {/* Hovered Star Tooltip */}
      {hoveredStar && mousePos && showUI && (
        <div
          className="starfield-tooltip"
          style={{
            left: mousePos.x + 20,
            top: mousePos.y - 10,
          }}
        >
          <div className="tooltip-name">{hoveredStar.hostname}</div>
          <div className="tooltip-info">
            {hoveredStar.sy_pnum} planet{hoveredStar.sy_pnum !== 1 ? 's' : ''}
            {hoveredStar.distance_ly && (
              <> · {hoveredStar.distance_ly.toFixed(1)} ly</>
            )}
          </div>
          <div className="tooltip-hint">Click to explore</div>
        </div>
      )}

      {/* Location Display */}
      {showUI && (
        <div className="starfield-location">
          {isLocationAnimating ? (
            <span className="location-coords location-animating">
              Traveling to {locationName}...
            </span>
          ) : (
            <span className="location-coords">
              {locationName} · {formatLatitude(observer.latitude)},{' '}
              {formatLongitude(observer.longitude)}
            </span>
          )}
          <button
            className="location-button"
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            disabled={isLocationAnimating}
          >
            CHANGE LOCATION
          </button>

          {showLocationPicker && !isLocationAnimating && (
            <div className="location-picker">
              {Object.entries(LOCATIONS).map(([name, loc]) => (
                <button
                  key={name}
                  className="location-option"
                  onClick={() => handleLocationChange(name, loc)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Star count indicator */}
      {showUI && (
        <div className="starfield-info">
          <span>{stars.length.toLocaleString()} exoplanet host stars</span>
        </div>
      )}

      {/* Intro text overlay - click to skip */}
      {state.phase !== 'complete' && (
        <div className="intro-overlay" onClick={skipIntro}>
          {state.phase === 'earth-spin' && (
            <div className="intro-text intro-text-fade-in">
              <span className="intro-title">EXOPLANETS</span>
            </div>
          )}
          {state.phase === 'camera-swoop' && (
            <div className="intro-text">
              <span className="intro-subtitle">Explore the cosmos</span>
            </div>
          )}
          <div className="intro-skip">Click anywhere to skip</div>
        </div>
      )}

      {/* Welcome info card - appears after intro */}
      {showWelcomeCard && (
        <WelcomeCard
          starCount={stars.length}
          planetCount={stars.reduce((acc, s) => acc + (s.sy_pnum || 0), 0)}
          onDismiss={handleDismissWelcome}
          isExiting={isWelcomeCardExiting}
        />
      )}
    </div>
  );
}

export default Starfield;
