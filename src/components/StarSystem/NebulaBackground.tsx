/**
 * NebulaBackground Component
 *
 * Renders procedural nebula clouds in the background of the star system.
 * Uses seed-based generation for unique nebulae per system.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderService } from '../../services/shaderService';

// Generate a deterministic seed from star name
function generateSeed(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 10000) / 10000;
}

// Generate nebula colors based on seed
function generateNebulaColors(seed: number): { primary: THREE.Color; secondary: THREE.Color } {
  // Different nebula color themes based on seed
  const theme = Math.floor(seed * 6);

  switch (theme) {
    case 0:
      // Blue-purple (emission nebula)
      return {
        primary: new THREE.Color().setHSL(0.7 + seed * 0.1, 0.6, 0.5),
        secondary: new THREE.Color().setHSL(0.8 + seed * 0.05, 0.5, 0.4),
      };
    case 1:
      // Red-orange (star-forming region)
      return {
        primary: new THREE.Color().setHSL(0.0 + seed * 0.05, 0.7, 0.5),
        secondary: new THREE.Color().setHSL(0.05 + seed * 0.05, 0.6, 0.4),
      };
    case 2:
      // Teal-cyan (reflection nebula)
      return {
        primary: new THREE.Color().setHSL(0.5 + seed * 0.05, 0.5, 0.5),
        secondary: new THREE.Color().setHSL(0.55 + seed * 0.05, 0.4, 0.4),
      };
    case 3:
      // Green-yellow (planetary nebula)
      return {
        primary: new THREE.Color().setHSL(0.25 + seed * 0.1, 0.5, 0.45),
        secondary: new THREE.Color().setHSL(0.15 + seed * 0.1, 0.4, 0.4),
      };
    case 4:
      // Pink-magenta (HII region)
      return {
        primary: new THREE.Color().setHSL(0.9 + seed * 0.05, 0.6, 0.55),
        secondary: new THREE.Color().setHSL(0.85 + seed * 0.05, 0.5, 0.45),
      };
    default:
      // Deep blue-violet (dark nebula with stars)
      return {
        primary: new THREE.Color().setHSL(0.65 + seed * 0.1, 0.4, 0.35),
        secondary: new THREE.Color().setHSL(0.7 + seed * 0.1, 0.3, 0.3),
      };
  }
}

interface NebulaBackgroundProps {
  /** Star system name for seed generation */
  systemName: string;
  /** Nebula density (0-1), 0 = no nebula */
  density?: number;
  /** Sphere radius for the nebula background */
  radius?: number;
}

export function NebulaBackground({
  systemName,
  density = 0.3,
  radius = 400,
}: NebulaBackgroundProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate deterministic seed and colors
  const seed = useMemo(() => generateSeed(systemName), [systemName]);
  const colors = useMemo(() => generateNebulaColors(seed), [seed]);

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed },
      uDensity: { value: density },
      uPrimaryColor: { value: colors.primary },
      uSecondaryColor: { value: colors.secondary },
    }),
    [seed, density, colors]
  );

  // Animate
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Don't render if density is 0
  if (density <= 0) {
    return null;
  }

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={shaderService.get('v2NebulaVert')}
        fragmentShader={shaderService.get('v2NebulaFrag')}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export default NebulaBackground;
