/**
 * CelestialBody Component
 * Renders a star or planet as a 3D sphere with procedural shaders
 */

import { useRef, useMemo, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { StellarBody } from '../../utils/solarSystem';
import { shaderService } from '../../services/shaderService';
import { CameraContext } from './StarSystem';
import {
  createPlanetUniforms,
  getV2PlanetShaderType,
  getV2ShaderFileName,
  getPlanetVertexShader,
  getStarSurfaceShaders,
  getStarCoronaShaders,
  getStarRaysShaders,
  getStarFlameTonguesShaders,
  generateSeed,
  getStarActivityLevel,
  getRingShaders,
} from '../../utils/planetUniforms';
import { SolarFlares } from './SolarFlares';
import {
  ORBIT_SPEED,
  STAR_RENDERING,
  RING_GEOMETRY,
  ORBITAL_MECHANICS,
  generateRingColor,
  normalizeDensity,
  normalizeInsolation,
  calculateZoomLevel,
} from '../../utils/celestialBodyVisuals';

interface CelestialBodyProps {
  body: StellarBody;
  isHovered: boolean;
  onHover: (
    body: StellarBody | null,
    mousePos?: { x: number; y: number }
  ) => void;
  onClick?: (body: StellarBody) => void;
  /** Callback to report current position each frame (for camera tracking) */
  onPositionUpdate?: (id: string, position: THREE.Vector3) => void;
}

export function CelestialBody({
  body,
  isHovered,
  onHover,
  onClick,
  onPositionUpdate,
}: CelestialBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const starMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const glowMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2); // Random starting position

  // Get camera distance for zoom-based detail
  const cameraContext = useContext(CameraContext);

  // Star shader uniforms with seed and activity for dynamic effects
  const starSeed = useMemo(() => generateSeed(body.id ?? body.name), [body.id, body.name]);
  const activityLevel = useMemo(() => getStarActivityLevel(body.spectralType), [body.spectralType]);

  const starUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uTemperature: { value: body.temperature ?? 5778 },
      uSeed: { value: starSeed },
      uActivityLevel: { value: activityLevel },
    }),
    [body.color, body.temperature, starSeed, activityLevel]
  );

  // Corona shader uniforms with seed and activity for dynamic effects
  const coronaMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const coronaUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uIntensity: { value: body.emissiveIntensity ?? 1.0 },
      uSeed: { value: starSeed },
      uActivityLevel: { value: activityLevel },
    }),
    [body.color, body.emissiveIntensity, starSeed, activityLevel]
  );

  // Star rays shader uniforms
  const raysMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const raysUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uTemperature: { value: body.temperature ?? 5778 },
      uSeed: { value: starSeed },
      uActivityLevel: { value: activityLevel },
      uStarRadius: { value: STAR_RENDERING.RAY_STAR_RADIUS },
    }),
    [body.color, body.temperature, starSeed, activityLevel]
  );

  // Flame tongues shader uniforms - breaks circular silhouette
  const flameTonguesMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const flameTonguesUniforms = useMemo(
    () => ({
      uStarColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uSeed: { value: starSeed },
      uActivityLevel: { value: activityLevel },
    }),
    [body.color, starSeed, activityLevel]
  );

  // Planet shader uniforms using the factory (detailed mode for full visual quality)
  const planetUniforms = useMemo(() => {
    if (body.planetData) {
      // Use real exoplanet data for data-driven visuals
      const uniforms = createPlanetUniforms({
        planet: body.planetData,
        detailLevel: 'detailed', // Full detail for best visual quality
        starTemp: body.planetData.st_teff ?? undefined,
        showTerminator: false, // Disable dark side - star provides illumination
      });
      // Add zoom level uniform for camera distance-based detail
      return {
        ...uniforms,
        uZoomLevel: { value: 0.0 },
        uBodyDiameter: { value: body.diameter },
      };
    }
    // Fallback for bodies without full exoplanet data
    return {
      uBaseColor: { value: new THREE.Color(body.color) },
      uTime: { value: 0 },
      uTemperature: { value: body.temperature ?? 300 },
      uHasAtmosphere: { value: body.hasAtmosphere ?? 0.5 },
      uSeed: { value: Math.random() },
      uDensity: { value: 0.5 },
      uInsolation: { value: 0.5 },
      uStarTemp: { value: 5778 },
      uDetailLevel: { value: 1.0 }, // Full detail mode
      uEnableTerminator: { value: 0.0 }, // Disable dark side on star map
      // Physical color factors - defaults for fallback
      uColorTempFactor: { value: 0.5 },
      uColorCompositionFactor: { value: 0.5 },
      uColorIrradiationFactor: { value: 0.5 },
      uColorMetallicityFactor: { value: 0.5 },
      uZoomLevel: { value: 0.0 },
      uBodyDiameter: { value: body.diameter },
    };
  }, [body.planetData, body.color, body.temperature, body.hasAtmosphere, body.diameter]);

  // Get the appropriate planet shader using V2 system for better variety
  const planetShaderType = useMemo(
    () => body.planetData 
      ? getV2PlanetShaderType(body.planetData) 
      : 'rocky',
    [body.planetData]
  );
  const planetFragShader = useMemo(
    () => getV2ShaderFileName(planetShaderType),
    [planetShaderType]
  );
  
  // Get V2 star shaders
  const starShaders = useMemo(() => getStarSurfaceShaders('v2'), []);
  const coronaShaders = useMemo(() => getStarCoronaShaders('v2'), []);
  const raysShaders = useMemo(() => getStarRaysShaders(), []);
  const flameTonguesShaders = useMemo(() => getStarFlameTonguesShaders(), []);

  // Get ring shaders for gas giants
  const ringShaders = useMemo(() => getRingShaders(), []);
  const ringMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Ring uniforms - color based on planet temperature (icy vs rocky)
  const ringUniforms = useMemo(() => {
    const seed = body.id ? generateSeed(body.id) : Math.random();
    const density = normalizeDensity(body.planetData?.pl_bmasse);
    const insolation = normalizeInsolation(body.planetData?.pl_insol);

    // Get planet temperature - use equilibrium temp or estimate from insolation
    const temp = body.planetData?.pl_eqt
      ?? (body.planetData?.pl_insol ? Math.sqrt(body.planetData.pl_insol) * 255 : 150);

    // Generate ring color with temperature-based variation
    const ringColorData = generateRingColor(temp, seed, density, insolation);
    const ringColor = ringColorData.base;

    // Ring geometry dimensions using centralized constants
    const innerRadius = body.diameter * RING_GEOMETRY.INNER_RADIUS_MULTIPLIER;
    const outerRadius = body.diameter * RING_GEOMETRY.OUTER_RADIUS_MULTIPLIER;

    return {
      uBaseColor: { value: ringColor },
      uRingColor: { value: ringColor },
      uTime: { value: 0 },
      uSeed: { value: seed },
      uDensity: { value: density },
      uInsolation: { value: insolation },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
    };
  }, [body.id, body.planetData, body.diameter]);

  // Animate orbit - always keep moving (no pause on hover/focus)
  useFrame((state, delta) => {
    // Animate planets - always orbit
    if (
      body.type === 'planet' &&
      groupRef.current &&
      body.orbitPeriod > 0
    ) {
      orbitAngleRef.current +=
        (Math.PI * 2 * delta * ORBIT_SPEED) / (body.orbitPeriod / 60);
    }

    // Animate stars in binary systems (both primary and companion orbit the barycenter)
    if (
      body.type === 'star' &&
      body.orbitRadius > 0 &&
      groupRef.current &&
      body.orbitPeriod > 0
    ) {
      // Stars orbit faster than planets for visual effect
      orbitAngleRef.current +=
        (Math.PI * 2 * delta * ORBIT_SPEED * 2) / (body.orbitPeriod / 60);
    }

    // Update planet position - elliptical orbit with star at focus
    if (body.type === 'planet' && groupRef.current) {
      const e = Math.min(Math.max(body.orbitEccentricity || 0, 0), ORBITAL_MECHANICS.MAX_ECCENTRICITY);
      const a = body.orbitRadius; // Semi-major axis
      const b = a * Math.sqrt(1 - e * e); // Semi-minor axis
      const focusOffset = a * e; // Distance from center to focus

      // Parametric ellipse with star at focus
      const x = a * Math.cos(orbitAngleRef.current) - focusOffset;
      const z = b * Math.sin(orbitAngleRef.current);

      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }

    // Update star positions in binary systems
    // Primary star orbits one side, companion orbits opposite side (PI offset)
    if (body.type === 'star' && body.orbitRadius > 0 && groupRef.current) {
      const e = Math.min(Math.max(body.orbitEccentricity || 0, 0), ORBITAL_MECHANICS.MAX_ECCENTRICITY);
      const a = body.orbitRadius;
      const b = a * Math.sqrt(1 - e * e);

      // Companion orbits on opposite side (add PI to angle)
      const angleOffset = body.isCompanionStar ? Math.PI : 0;
      const x = a * Math.cos(orbitAngleRef.current + angleOffset);
      const z = b * Math.sin(orbitAngleRef.current + angleOffset);

      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }

    // Report current position for camera tracking
    if (groupRef.current && onPositionUpdate) {
      onPositionUpdate(body.id, groupRef.current.position);
    }

    // Rotate on own axis - use physics-based rotation speed and axial tilt
    if (meshRef.current) {
      // Apply axial tilt (rotation around X axis to tilt the spin axis)
      meshRef.current.rotation.x = body.axialTilt;
      
      if (body.isTidallyLocked && body.type === 'planet') {
        // Tidally locked: one face always toward the star (at origin)
        // The planet's rotation matches its orbital angle so same face points to star
        meshRef.current.rotation.y = -orbitAngleRef.current + Math.PI;
      } else {
        // Normal rotation: spin on axis using physics-based speed
        meshRef.current.rotation.y += delta * body.rotationSpeed;
      }
    }

    // Update shader time uniforms
    const time = state.clock.elapsedTime;
    if (body.type === 'star') {
      if (starMaterialRef.current) {
        starMaterialRef.current.uniforms.uTime.value = time;
      }
      if (glowMaterialRef.current) {
        glowMaterialRef.current.uniforms.uTime.value = time;
      }
      if (coronaMaterialRef.current) {
        coronaMaterialRef.current.uniforms.uTime.value = time;
      }
      if (raysMaterialRef.current) {
        raysMaterialRef.current.uniforms.uTime.value = time;
      }
      if (flameTonguesMaterialRef.current) {
        flameTonguesMaterialRef.current.uniforms.uTime.value = time;
      }
    } else if (body.type === 'planet') {
      if (planetMaterialRef.current) {
        planetMaterialRef.current.uniforms.uTime.value = time;

        // Calculate zoom level based on camera distance relative to body size
        // Higher zoom level = camera is closer = more detail
        if (cameraContext && groupRef.current) {
          const camDist = cameraContext.cameraDistance.current;
          const bodyPos = groupRef.current.position;
          // Distance from camera to this specific body
          const distToBody = Math.sqrt(
            Math.pow(bodyPos.x, 2) +
            Math.pow(bodyPos.y - camDist * 0.4, 2) + // Account for camera Y offset
            Math.pow(bodyPos.z - camDist, 2)
          );
          const zoomLevel = calculateZoomLevel(distToBody, body.diameter);
          planetMaterialRef.current.uniforms.uZoomLevel.value = zoomLevel;
        }
      }
      if (ringMaterialRef.current) {
        ringMaterialRef.current.uniforms.uTime.value = time;
      }
    }
  });

  // Scale up when hovered
  const scale = isHovered ? 1.3 : 1;

  if (body.type === 'star') {
    // Calculate scaled visual effect sizes for this star
    const starRadius = body.diameter / 2;
    
    // Star content - same for primary and companion
    const StarContent = (
      <>
        {/* Point light for illuminating planets */}
        <pointLight
          position={[0, 0, 0]}
          color={body.color}
          intensity={body.isCompanionStar ? STAR_RENDERING.COMPANION_LIGHT_INTENSITY : STAR_RENDERING.PRIMARY_LIGHT_INTENSITY}
          distance={body.isCompanionStar ? STAR_RENDERING.COMPANION_LIGHT_DISTANCE : STAR_RENDERING.PRIMARY_LIGHT_DISTANCE}
        />

        {/* Outer glow - billboard always faces camera, animated */}
        <Billboard>
          <mesh>
            <planeGeometry args={[body.diameter * STAR_RENDERING.GLOW_SIZE_MULTIPLIER, body.diameter * STAR_RENDERING.GLOW_SIZE_MULTIPLIER]} />
            <shaderMaterial
              ref={glowMaterialRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              uniforms={{
                uColor: { value: new THREE.Color(body.color) },
                uIntensity: { value: body.emissiveIntensity ?? 1.0 },
                uTime: { value: 0 },
                uSeed: { value: starSeed },
              }}
              vertexShader={`
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform vec3 uColor;
                uniform float uIntensity;
                uniform float uTime;
                uniform float uSeed;
                varying vec2 vUv;

                // Simple noise for animation
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

                void main() {
                  vec2 center = vUv - 0.5;
                  float dist = length(center);  // 0 to 0.707 at corners
                  float angle = atan(center.y, center.x);

                  // Hard circular mask - forces circular shape, no box
                  float circularMask = 1.0 - smoothstep(0.35, 0.5, dist);

                  // Rotating glow with star
                  float rotAngle = angle + uTime * 0.5;

                  // Animated noise for organic variation
                  float n1 = noise(vec2(rotAngle * 3.0, dist * 8.0 + uTime * 0.3 + uSeed));
                  float n2 = noise(vec2(rotAngle * 5.0 + 10.0, dist * 12.0 - uTime * 0.2));
                  float noiseVal = n1 * 0.6 + n2 * 0.4;

                  // Exponential falloff from center
                  float glow = exp(-dist * dist * 12.0);

                  // Add noise variation (subtle)
                  glow *= 0.85 + noiseVal * 0.25;

                  // Pulsing intensity
                  float pulse = 1.0 + sin(uTime * 0.8 + uSeed * 6.28) * 0.08;

                  // Clamp intensity
                  float clampedIntensity = clamp(uIntensity, 0.7, 1.8);
                  glow = glow * clampedIntensity * 0.7 * pulse * circularMask;

                  gl_FragColor = vec4(uColor, glow);
                }
              `}
            />
          </mesh>
        </Billboard>

        {/* Star surface - V2 procedural shader with burning effects */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[body.diameter / 2, 64, 64]} />
          <shaderMaterial
            ref={starMaterialRef}
            vertexShader={shaderService.get(starShaders.vert)}
            fragmentShader={shaderService.get(starShaders.frag)}
            uniforms={starUniforms}
          />
        </mesh>

        {/* Corona layer - V2 fiery flames extending outward */}
        <mesh>
          <sphereGeometry args={[starRadius * STAR_RENDERING.CORONA_SCALE_MULTIPLIER, 64, 64]} />
          <shaderMaterial
            ref={coronaMaterialRef}
            vertexShader={shaderService.get(coronaShaders.vert)}
            fragmentShader={shaderService.get(coronaShaders.frag)}
            uniforms={coronaUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Flame tongues - visible fire protrusions breaking circular silhouette */}
        <mesh>
          <sphereGeometry args={[starRadius * 1.4, 64, 64]} />
          <shaderMaterial
            ref={flameTonguesMaterialRef}
            vertexShader={shaderService.get(flameTonguesShaders.vert)}
            fragmentShader={shaderService.get(flameTonguesShaders.frag)}
            uniforms={flameTonguesUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Solar flares - dramatic eruptions */}
        <SolarFlares
          starRadius={starRadius}
          starColor={body.color}
          starSeed={starSeed}
          activityLevel={activityLevel}
        />

        {/* Star rays - radiating light effect using 4D noise */}
        <Billboard>
          <mesh>
            <planeGeometry args={[body.diameter * STAR_RENDERING.RAYS_SIZE_MULTIPLIER, body.diameter * STAR_RENDERING.RAYS_SIZE_MULTIPLIER]} />
            <shaderMaterial
              ref={raysMaterialRef}
              vertexShader={shaderService.get(raysShaders.vert)}
              fragmentShader={shaderService.get(raysShaders.frag)}
              uniforms={raysUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Billboard>
      </>
    );

    // Stars in binary systems orbit the barycenter, so wrap in a group with ref
    if (body.orbitRadius > 0) {
      return <group ref={groupRef}>{StarContent}</group>;
    }

    // Single star systems: star is stationary at center
    // Still use groupRef for position tracking (position 0,0,0)
    return <group ref={groupRef}>{StarContent}</group>;
  }

  // Planet
  return (
    <group ref={groupRef}>
      {/* Planet sphere with procedural shader */}
      <mesh
        ref={meshRef}
        scale={[scale, scale, scale]}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          const clientX =
            (e as unknown as { clientX?: number }).clientX ??
            e.nativeEvent?.clientX;
          const clientY =
            (e as unknown as { clientY?: number }).clientY ??
            e.nativeEvent?.clientY;
          onHover(
            body,
            clientX && clientY ? { x: clientX, y: clientY } : undefined
          );
        }}
        onPointerMove={(e) => {
          if (isHovered) {
            const clientX =
              (e as unknown as { clientX?: number }).clientX ??
              e.nativeEvent?.clientX;
            const clientY =
              (e as unknown as { clientY?: number }).clientY ??
              e.nativeEvent?.clientY;
            if (clientX && clientY) {
              onHover(body, { x: clientX, y: clientY });
            }
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'grab';
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(body);
        }}
      >
        <sphereGeometry args={[body.diameter / 2, 48, 48]} />
        <shaderMaterial
          ref={planetMaterialRef}
          vertexShader={shaderService.get(getPlanetVertexShader('v2'))}
          fragmentShader={shaderService.get(planetFragShader)}
          uniforms={planetUniforms}
        />
      </mesh>

      {/* Rings for gas giants - with varied internal bands */}
      {body.hasRings && (
        <mesh rotation={[RING_GEOMETRY.BASE_ROTATION_X + body.axialTilt, 0, 0]}>
          <ringGeometry args={[body.diameter * RING_GEOMETRY.INNER_RADIUS_MULTIPLIER, body.diameter * RING_GEOMETRY.OUTER_RADIUS_MULTIPLIER, 64]} />
          <shaderMaterial
            ref={ringMaterialRef}
            vertexShader={shaderService.get(ringShaders.vert)}
            fragmentShader={shaderService.get(ringShaders.frag)}
            uniforms={ringUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Highlight when hovered */}
      {isHovered && (
        <mesh scale={[1.4, 1.4, 1.4]}>
          <sphereGeometry args={[body.diameter / 2, 24, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default CelestialBody;
