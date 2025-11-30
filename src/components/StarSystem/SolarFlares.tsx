/**
 * SolarFlares Component
 * Renders animated solar flare eruptions around a star
 */

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderService } from '../../services/shaderService';
import { getStarFlareShaders, generateSeed } from '../../utils/planetUniforms';

interface SolarFlaresProps {
  starRadius: number;
  starColor: string;
  starSeed: number;
  activityLevel: number;
}

// Number of potential flare sites
const NUM_FLARES = 4;

// Flare cycle duration in seconds (longer = less frequent)
const FLARE_CYCLE_DURATION = 60;

// Minimum flare size so small stars still have visible flares
const MIN_FLARE_SIZE = 1.0314879;

// Debug: expose flare controls on window
declare global {
  interface Window {
    solarFlares?: {
      trigger: (index?: number) => void;
      triggerAll: () => void;
      setActivity: (level: number) => void;
      status: () => void;
    };
  }
}

interface FlareData {
  angle: number;      // Angle around star (radians)
  elevation: number;  // Vertical angle (-PI/2 to PI/2)
  phase: number;      // Current phase offset
  speed: number;      // Cycle speed multiplier
  size: number;       // Size multiplier
}

export function SolarFlares({ starRadius, starColor, starSeed, activityLevel }: SolarFlaresProps) {
  const flareRefs = useRef<(THREE.Mesh | null)[]>([]);
  const materialRefs = useRef<(THREE.ShaderMaterial | null)[]>([]);

  // Manual trigger state: stores trigger time for each flare
  const manualTriggers = useRef<number[]>(new Array(NUM_FLARES).fill(-1000));
  const currentActivityRef = useRef(activityLevel);
  currentActivityRef.current = activityLevel;

  // Generate flare positions based on star seed
  const flareData = useMemo<FlareData[]>(() => {
    const flares: FlareData[] = [];
    for (let i = 0; i < NUM_FLARES; i++) {
      const seed = starSeed + i * 0.1;
      flares.push({
        angle: generateSeed(`${seed}-angle`) * Math.PI * 2,
        elevation: (generateSeed(`${seed}-elev`) - 0.5) * Math.PI * 0.8, // Avoid poles
        phase: generateSeed(`${seed}-phase`) * Math.PI * 2,
        speed: 0.7 + generateSeed(`${seed}-speed`) * 0.6,
        size: 0.8 + generateSeed(`${seed}-size`) * 0.4,
      });
    }
    return flares;
  }, [starSeed]);

  // Get flare shaders
  const flareShaders = useMemo(() => getStarFlareShaders(), []);

  // Create uniforms for each flare
  const flareUniforms = useMemo(() => {
    return flareData.map((data) => ({
      uStarColor: { value: new THREE.Color(starColor) },
      uTime: { value: 0 },
      uFlarePhase: { value: 0 },
      uFlareLength: { value: Math.max(starRadius * 0.3 * data.size, MIN_FLARE_SIZE) },
      uFlareSeed: { value: data.phase },
    }));
  }, [starColor, starRadius, flareData]);

  // Manual trigger function
  const triggerFlare = useCallback((index?: number) => {
    const time = performance.now() / 1000;
    if (index !== undefined && index >= 0 && index < NUM_FLARES) {
      manualTriggers.current[index] = time;
      console.log(`🔥 Triggered flare ${index}`);
    } else {
      // Trigger random flare
      const randomIndex = Math.floor(Math.random() * NUM_FLARES);
      manualTriggers.current[randomIndex] = time;
      console.log(`🔥 Triggered random flare ${randomIndex}`);
    }
  }, []);

  const triggerAllFlares = useCallback(() => {
    const time = performance.now() / 1000;
    for (let i = 0; i < NUM_FLARES; i++) {
      manualTriggers.current[i] = time + i * 0.2; // Stagger slightly
    }
    console.log('🔥🔥🔥 Triggered ALL flares!');
  }, []);

  // Expose debug controls on window
  useEffect(() => {
    console.log('🌟 SolarFlares component mounting...');
    console.log(`   Star radius: ${starRadius}, Activity: ${activityLevel}`);

    window.solarFlares = {
      trigger: triggerFlare,
      triggerAll: triggerAllFlares,
      setActivity: (level: number) => {
        console.log(`Activity level set to ${level} (only affects new cycles)`);
      },
      status: () => {
        console.log('Solar Flares Status:');
        console.log(`  - Number of flares: ${NUM_FLARES}`);
        console.log(`  - Activity level: ${currentActivityRef.current}`);
        console.log(`  - Cycle duration: ${FLARE_CYCLE_DURATION}s`);
        console.log(`  - Star radius: ${starRadius}`);
        console.log('Commands:');
        console.log('  solarFlares.trigger()      - Trigger random flare');
        console.log('  solarFlares.trigger(0-3)   - Trigger specific flare');
        console.log('  solarFlares.triggerAll()   - Trigger all flares');
      }
    };
    console.log('✅ Solar flares ready! Type solarFlares.status() for commands');

    return () => {
      console.log('🌟 SolarFlares component unmounting...');
      delete window.solarFlares;
    };
  }, [triggerFlare, triggerAllFlares, starRadius, activityLevel]);

  // Animate flares - they TRAVEL outward through space
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const currentTime = performance.now() / 1000;

    flareData.forEach((data, i) => {
      const material = materialRefs.current[i];
      const mesh = flareRefs.current[i];
      if (!material || !mesh) return;

      // Check for manual trigger
      const triggerTime = manualTriggers.current[i];
      const timeSinceTrigger = currentTime - triggerTime;
      const manualDuration = 5.0; // Manual flares last 5 seconds

      let activePhase = 0;

      if (timeSinceTrigger >= 0 && timeSinceTrigger < manualDuration) {
        // Manual trigger active
        activePhase = timeSinceTrigger / manualDuration;
      } else {
        // Normal cycle-based animation
        const cycleTime = (time * data.speed + data.phase) % FLARE_CYCLE_DURATION;
        const phase = cycleTime / FLARE_CYCLE_DURATION;

        // Flares are only visible part of the time based on activity
        // Lower multiplier = rarer flares (0.15 means max 15% of cycle is active)
        const activeThreshold = 1.0 - currentActivityRef.current * 0.15;
        const isActive = phase > activeThreshold;

        // Remap phase to 0-1 within active window
        activePhase = isActive
          ? (phase - activeThreshold) / (1.0 - activeThreshold)
          : 0;
      }

      // === KEY CHANGE: Move the flare OUTWARD through space ===
      // Get the base direction (normalized position on star surface)
      const baseTransform = flareTransforms[i];
      const direction = baseTransform.position.clone().normalize();

      // Calculate how far the flare has traveled based on phase
      // Forms/burns on star for 60%, then escapes rapidly
      let travelDistance = 1.0;
      if (activePhase < 0.6) {
        // Forms and burns on star - barely moves (1.0 to 1.2)
        travelDistance = 1.0 + activePhase * 0.33;
      } else {
        // Escapes! Accelerates outward rapidly
        const escapePhase = (activePhase - 0.6) / 0.4;  // 0 to 1 for escape portion
        travelDistance = 1.2 + escapePhase * escapePhase * 10.0;  // Fast escape
      }
      const currentDistance = starRadius * travelDistance;

      // Update mesh position - it moves outward!
      mesh.position.copy(direction.multiplyScalar(currentDistance));

      material.uniforms.uTime.value = time;
      material.uniforms.uFlarePhase.value = activePhase;
    });
  });

  // Calculate flare positions and rotations
  const flareTransforms = useMemo(() => {
    return flareData.map((data) => {
      // Position on sphere surface
      const x = Math.cos(data.elevation) * Math.cos(data.angle);
      const y = Math.sin(data.elevation);
      const z = Math.cos(data.elevation) * Math.sin(data.angle);

      const position = new THREE.Vector3(x, y, z).multiplyScalar(starRadius * 1.05);

      // Rotation to point outward from star center
      const direction = position.clone().normalize();
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

      return { position, quaternion };
    });
  }, [flareData, starRadius]);

  return (
    <group>
      {flareData.map((data, i) => (
        <mesh
          key={i}
          ref={(el) => (flareRefs.current[i] = el)}
          position={flareTransforms[i].position}
          quaternion={flareTransforms[i].quaternion}
        >
          {/* Plasma flare - with minimum size for small stars */}
          <planeGeometry args={[
            Math.max(starRadius * 0.25 * data.size, MIN_FLARE_SIZE),
            Math.max(starRadius * 0.35 * data.size, MIN_FLARE_SIZE * 1.4)
          ]} />
          <shaderMaterial
            ref={(el) => (materialRefs.current[i] = el)}
            vertexShader={shaderService.get(flareShaders.vert)}
            fragmentShader={shaderService.get(flareShaders.frag)}
            uniforms={flareUniforms[i]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default SolarFlares;
