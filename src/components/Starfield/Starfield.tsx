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
import {
  INTRO_ANIMATION,
  INTRO_EARTH,
  CAMERA_CONTROLLER,
  BACKGROUND_STARS_SETTINGS,
  STARFIELD_SCENE,
  LOCATION_ANIMATION,
  EASING,
} from '../../utils/starfieldVisuals';

interface StarfieldProps {
  stars: Star[];
  onStarClick?: (star: Star) => void;
}

// Easing functions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutBack(t: number): number {
  const c1 = EASING.INOUT_BACK_C1;
  const c2 = c1 * EASING.INOUT_BACK_C2_MULTIPLIER;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

interface IntroState {
  phase: 'earth-spin' | 'camera-swoop' | 'stars-fade' | 'complete';
  progress: number;
}

// Simplified procedural planet shader (inspired by kepler.glsl)
const introPlanetVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const introPlanetFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Simple noise function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) {
      sum += noise(p) * amp;
      p *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    // Convert position to spherical coordinates for texture mapping
    vec3 nPos = normalize(vPosition);
    float longitude = atan(nPos.x, nPos.z) + uTime * 0.1;
    float latitude = asin(nPos.y);
    vec2 uv = vec2(longitude / 3.14159, latitude / 1.5708 + 0.5);

    // Ocean base color
    vec3 oceanColor = vec3(0.02, 0.08, 0.15);
    vec3 oceanHighlight = vec3(0.05, 0.15, 0.3);

    // Land generation using noise
    float landNoise = fbm(uv * 8.0);
    float landMask = smoothstep(0.45, 0.55, landNoise);

    // Land colors
    vec3 landLow = vec3(0.08, 0.25, 0.05); // Green lowlands
    vec3 landHigh = vec3(0.3, 0.2, 0.1);   // Brown highlands
    vec3 landColor = mix(landLow, landHigh, fbm(uv * 16.0));

    // Ice caps at poles
    float iceMask = smoothstep(0.7, 0.9, abs(nPos.y));
    vec3 iceColor = vec3(0.9, 0.95, 1.0);

    // Clouds
    float cloudNoise = fbm(uv * 6.0 + uTime * 0.05);
    float cloudMask = smoothstep(0.5, 0.7, cloudNoise);
    vec3 cloudColor = vec3(1.0, 1.0, 1.0);

    // Combine layers
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);
    surfaceColor = mix(surfaceColor, iceColor, iceMask);
    surfaceColor = mix(surfaceColor, cloudColor, cloudMask * 0.7);

    // Simple lighting from camera direction
    vec3 lightDir = normalize(vec3(0.5, 0.3, 1.0));
    float light = max(0.0, dot(vNormal, lightDir));
    float ambient = 0.15;

    // Atmosphere rim lighting
    float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
    vec3 rimGlow = atmosphereColor * pow(rim, 3.0) * 0.5;

    vec3 finalColor = surfaceColor * (light + ambient) + rimGlow;

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;

/**
 * Intro Earth - centered planet that scales down and moves away
 * Uses procedural shader for realistic planet appearance
 */
function IntroEarth({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Stable uniforms object - only created once
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * INTRO_EARTH.ROTATION_SPEED;
    }
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  // Don't render when fully transitioned
  if (progress >= 1) return null;

  // Animate: scale down and move away as progress goes 0 -> 1
  const scale = INTRO_EARTH.SCALE_MULTIPLIER * (1 - progress);
  const zPos = INTRO_EARTH.INITIAL_Z - progress * INTRO_EARTH.Z_MOVEMENT_DISTANCE;

  return (
    <group ref={groupRef} position={[0, 0, zPos]} scale={[scale, scale, scale]}>
      {/* Main Earth body with procedural shader */}
      <mesh>
        <sphereGeometry args={[INTRO_EARTH.BASE_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={introPlanetVertexShader}
          fragmentShader={introPlanetFragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={[INTRO_EARTH.ATMOSPHERE_SCALE, INTRO_EARTH.ATMOSPHERE_SCALE, INTRO_EARTH.ATMOSPHERE_SCALE]}>
        <sphereGeometry args={[INTRO_EARTH.BASE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={INTRO_EARTH.ATMOSPHERE_COLOR}
          transparent
          opacity={INTRO_EARTH.ATMOSPHERE_OPACITY}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={[INTRO_EARTH.OUTER_GLOW_SCALE, INTRO_EARTH.OUTER_GLOW_SCALE, INTRO_EARTH.OUTER_GLOW_SCALE]}>
        <sphereGeometry args={[INTRO_EARTH.BASE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={INTRO_EARTH.OUTER_GLOW_COLOR}
          transparent
          opacity={INTRO_EARTH.OUTER_GLOW_OPACITY}
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
  const rotation = useRef<{ azimuth: number; altitude: number }>({ azimuth: CAMERA_CONTROLLER.INITIAL_AZIMUTH, altitude: CAMERA_CONTROLLER.INITIAL_ALTITUDE });

  // Intro animation
  useFrame(() => {
    const { phase } = introState;

    if (phase === 'earth-spin' || phase === 'camera-swoop') {
      // Camera stays fixed at origin looking forward during intro
      camera.position.set(0, 0, 0);
      camera.lookAt(0, 0, -CAMERA_CONTROLLER.LOOKAT_DISTANCE);
      camera.updateProjectionMatrix();
    } else if (phase === 'stars-fade' || phase === 'complete') {
      // Final position maintained by user controls or default
      if (!controlsEnabled) {
        camera.position.set(0, 0, 0);
        const azRad = (rotation.current.azimuth * Math.PI) / 180;
        const altRad = (rotation.current.altitude * Math.PI) / 180;
        camera.lookAt(
          -Math.sin(azRad) * Math.cos(altRad) * CAMERA_CONTROLLER.LOOKAT_DISTANCE,
          Math.sin(altRad) * CAMERA_CONTROLLER.LOOKAT_DISTANCE,
          -Math.cos(azRad) * Math.cos(altRad) * CAMERA_CONTROLLER.LOOKAT_DISTANCE
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
      canvas.style.cursor = CAMERA_CONTROLLER.DRAGGING_CURSOR;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = CAMERA_CONTROLLER.DEFAULT_CURSOR;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;

      rotation.current.azimuth -= deltaX * CAMERA_CONTROLLER.DRAG_SENSITIVITY;
      rotation.current.altitude += deltaY * CAMERA_CONTROLLER.DRAG_SENSITIVITY;
      rotation.current.azimuth = ((rotation.current.azimuth % 360) + 360) % 360;
      rotation.current.altitude = Math.max(
        CAMERA_CONTROLLER.MIN_ALTITUDE,
        Math.min(CAMERA_CONTROLLER.MAX_ALTITUDE, rotation.current.altitude)
      );

      previousMouse.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      canvas.style.cursor = CAMERA_CONTROLLER.DEFAULT_CURSOR;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isDragging.current = true;
      const touch = e.touches[0];
      previousMouse.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - previousMouse.current.x;
      const deltaY = touch.clientY - previousMouse.current.y;

      rotation.current.azimuth -= deltaX * CAMERA_CONTROLLER.DRAG_SENSITIVITY;
      rotation.current.altitude += deltaY * CAMERA_CONTROLLER.DRAG_SENSITIVITY;
      rotation.current.azimuth = ((rotation.current.azimuth % 360) + 360) % 360;
      rotation.current.altitude = Math.max(
        CAMERA_CONTROLLER.MIN_ALTITUDE,
        Math.min(CAMERA_CONTROLLER.MAX_ALTITUDE, rotation.current.altitude)
      );

      previousMouse.current = { x: touch.clientX, y: touch.clientY };
      updateCameraPosition();
    };

    canvas.style.cursor = CAMERA_CONTROLLER.DEFAULT_CURSOR;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Set initial position
    updateCameraPosition();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gl, camera, controlsEnabled, onBearingChange]);

  return null;
}

/**
 * Background stars (random small stars for ambiance)
 */
function BackgroundStars({ opacity }: { opacity: number }) {
  const count = BACKGROUND_STARS_SETTINGS.COUNT;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = BACKGROUND_STARS_SETTINGS.SPHERE_RADIUS;

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
        size={BACKGROUND_STARS_SETTINGS.POINT_SIZE}
        color={BACKGROUND_STARS_SETTINGS.COLOR}
        transparent
        opacity={opacity * BACKGROUND_STARS_SETTINGS.OPACITY_MULTIPLIER}
        sizeAttenuation={false}
      />
    </points>
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
          const progress = Math.min(elapsed / INTRO_ANIMATION.EARTH_SPIN_DURATION, 1);
          if (progress >= 1) {
            phaseStartTime.current = now;
            return { phase: 'camera-swoop', progress: 0 };
          }
          return { ...prev, progress };
        }

        if (prev.phase === 'camera-swoop') {
          const progress = Math.min(elapsed / INTRO_ANIMATION.CAMERA_SWOOP_DURATION, 1);
          if (progress >= 1) {
            phaseStartTime.current = now;
            return { phase: 'stars-fade', progress: 0 };
          }
          return { ...prev, progress };
        }

        if (prev.phase === 'stars-fade') {
          const progress = Math.min(elapsed / INTRO_ANIMATION.STARS_FADE_DURATION, 1);
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

  // Stars fade in during stars-fade phase
  const starsOpacity =
    state.phase === 'stars-fade'
      ? easeInOutCubic(state.progress)
      : state.phase === 'complete'
        ? 1
        : 0;

  // Intro Earth exit progress (0 = visible, 1 = gone)
  // Exit during camera-swoop phase, before the overlay appears
  const introEarthExitProgress =
    state.phase === 'camera-swoop'
      ? easeInOutBack(state.progress)
      : state.phase === 'stars-fade' || state.phase === 'complete'
        ? 1
        : 0;

  const controlsEnabled = state.phase === 'complete';

  return {
    state,
    introEarthExitProgress,
    starsOpacity,
    controlsEnabled,
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

  useEffect(() => {
    if (!isAnimating) return;

    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - animationStart.current;
      const progress = Math.min(elapsed / LOCATION_ANIMATION.DURATION_MS, 1);
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

  const changeLocation = useCallback(
    (newLocation: ObserverLocation) => {
      startLocation.current = currentLocation;
      animationStart.current = Date.now();
      setTargetLocation(newLocation);
      setIsAnimating(true);
    },
    [currentLocation]
  );

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

function WelcomeCard({
  starCount,
  planetCount,
  onDismiss,
  isExiting,
}: WelcomeCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`welcome-card-container ${isExiting ? 'exiting' : ''}`}>
      <div className="welcome-card">
        <h2 className="welcome-title">{t('pages.home.infoCard.title')}</h2>
        <p className="welcome-description">
          {t('pages.home.infoCard.description')}
        </p>
        <div className="welcome-stats">
          {t('pages.home.infoCard.stats', {
            starCount: starCount.toLocaleString(),
            planetCount: planetCount.toLocaleString(),
          })}
        </div>
        <p className="welcome-hint">{t('pages.home.infoCard.hint')}</p>
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
  const {
    currentLocation: observer,
    changeLocation,
    isAnimating: isLocationAnimating,
  } = useAnimatedLocation(LOCATIONS['São Paulo']);
  const [date] = useState(() => new Date());
  const [bearing, setBearing] = useState({ azimuth: 180, altitude: -10 });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [locationName, setLocationName] = useState('São Paulo');
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [isWelcomeCardExiting, setIsWelcomeCardExiting] = useState(false);
  const welcomeCardDismissed = useRef(false);

  const {
    state,
    introEarthExitProgress,
    starsOpacity,
    controlsEnabled,
    skipIntro,
  } = useIntroSequence();

  // Show welcome card when intro completes (only once)
  useEffect(() => {
    if (
      state.phase === 'complete' &&
      !welcomeCardDismissed.current &&
      !showWelcomeCard
    ) {
      const timer = setTimeout(() => {
        setShowWelcomeCard(true);
      }, INTRO_ANIMATION.WELCOME_CARD_DELAY);
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
    }, INTRO_ANIMATION.WELCOME_CARD_DISMISS_DURATION);
  }, []);

  const handleBearingChange = useCallback(
    (azimuth: number, altitude: number) => {
      setBearing({ azimuth, altitude });
    },
    []
  );

  const handleLocationChange = useCallback(
    (name: string, location: ObserverLocation) => {
      changeLocation(location);
      setLocationName(name);
      setShowLocationPicker(false);
    },
    [changeLocation]
  );

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
          fov: STARFIELD_SCENE.CAMERA_FOV,
          near: STARFIELD_SCENE.CAMERA_NEAR,
          far: STARFIELD_SCENE.CAMERA_FAR,
          position: [STARFIELD_SCENE.CAMERA_INITIAL_X, STARFIELD_SCENE.CAMERA_INITIAL_Y, STARFIELD_SCENE.CAMERA_INITIAL_Z],
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: STARFIELD_SCENE.BACKGROUND_COLOR }}
      >
        <color attach="background" args={[STARFIELD_SCENE.BACKGROUND_COLOR_ALT]} />

        <CameraController
          introState={state}
          onBearingChange={handleBearingChange}
          controlsEnabled={controlsEnabled}
        />

        {/* Ambient light */}
        <ambientLight intensity={STARFIELD_SCENE.AMBIENT_LIGHT_INTENSITY} />

        {/* Intro Earth (scales down and moves away) */}
        <IntroEarth progress={introEarthExitProgress} />

        {/* Main scene - only rendered after intro Earth fades */}
        {(state.phase === 'stars-fade' || state.phase === 'complete') && (
          <>
            <BackgroundStars opacity={1} />

            <Stars
              stars={stars}
              observer={observer}
              date={date}
              onStarClick={onStarClick}
              onStarHover={handleStarHover}
            />

            <EarthHorizon longitude={observer.longitude} />

            {state.phase === 'complete' && <Satellites />}
          </>
        )}
      </Canvas>

      {/* Fade overlay - only shown during stars-fade phase to fade in the scene */}
      {(state.phase === 'stars-fade' || state.phase === 'complete') && (
        <div
          className="scene-fade-overlay"
          style={{
            opacity: 1 - starsOpacity,
            pointerEvents: starsOpacity >= 1 ? 'none' : 'auto',
          }}
        />
      )}

      {/* Telescope Bearing Display */}
      {showUI && (
        <div className="starfield-bearing">
          <div className="bearing-title">Telescope Bearing</div>
          <div className="bearing-value">
            <span className="bearing-icon">↔</span>{' '}
            {formatAzimuth(bearing.azimuth)}
          </div>
          <div className="bearing-value">
            <span className="bearing-icon">↕</span>{' '}
            {formatAltitude(bearing.altitude)}
          </div>
        </div>
      )}

      {/* Hovered Star Tooltip */}
      {hoveredStar && mousePos && showUI && (
        <div
          className="starfield-tooltip"
          style={{
            left: `${mousePos.x + 20}px`,
            top: `${mousePos.y - 10}px`,
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
            <div className="intro-text">
              <div className="intro-title-container">
                <div className="intro-title-line intro-title-line-exo">
                  {'EXO'.split('').map((letter, i) => (
                    <span
                      key={i}
                      className="intro-letter"
                      style={{
                        animationDelay: `${i * INTRO_ANIMATION.LETTER_ANIMATION_DELAY}s`,
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
                <div className="intro-title-line intro-title-line-planets">
                  {'PLANETS'.split('').map((letter, i) => (
                    <span
                      key={i}
                      className="intro-letter"
                      style={{
                        animationDelay: `${INTRO_ANIMATION.PLANETS_LINE_START_OFFSET * INTRO_ANIMATION.LETTER_ANIMATION_DELAY + i * INTRO_ANIMATION.LETTER_ANIMATION_DELAY}s`,
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {(state.phase === 'camera-swoop' || state.phase === 'stars-fade') && (
            <div
              className="intro-text"
              style={{
                opacity: state.phase === 'stars-fade' ? 1 - starsOpacity : 1,
              }}
            >
              <span className="intro-subtitle">Explore the cosmos</span>
            </div>
          )}
          {state.phase !== 'stars-fade' && (
            <div className="intro-skip">Click anywhere to skip</div>
          )}
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
