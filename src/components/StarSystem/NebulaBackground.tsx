/**
 * NebulaBackground Component
 *
 * Renders procedural nebula clouds in the background of the star system.
 * Uses seed-based generation for unique nebulae per system.
 */

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderService } from '../../services/shaderService';
import {
  NEBULA_ANIMATION,
  NEBULA_GEOMETRY,
  generateNebulaColors,
} from '../../utils/nebulaVisuals';

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


interface NebulaBackgroundProps {
  /** Star system name for seed generation */
  systemName: string;
  /** Nebula density (0-1), 0 = no nebula */
  density?: number;
  /** Sphere radius for the nebula background */
  radius?: number;
  /** Quality level: 'low' | 'medium' | 'high' - affects performance */
  quality?: 'low' | 'medium' | 'high';
}

export function NebulaBackground({
  systemName,
  density = 0.3,
  radius = 400,
  quality = 'high',
}: NebulaBackgroundProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate deterministic seed and colors
  const seed = useMemo(() => generateSeed(systemName), [systemName]);
  const colors = useMemo(() => generateNebulaColors(seed), [seed]);

  // Convert quality string to numeric value
  const qualityValue = useMemo(() => {
    switch (quality) {
      case 'low': return 0.0;
      case 'medium': return 0.5;
      case 'high': return 1.0;
      default: return 1.0;
    }
  }, [quality]);

  // Track fade-in start time
  const fadeStartTime = useRef<number | null>(null);
  const [isFullyVisible, setIsFullyVisible] = useState(false);

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed },
      uDensity: { value: density },
      uOpacity: { value: 0 }, // Start invisible for fade-in
      uPrimaryColor: { value: colors.primary },
      uSecondaryColor: { value: colors.secondary },
      uQuality: { value: qualityValue },
    }),
    [seed, density, colors, qualityValue]
  );

  // Animate time and fade-in
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      // Initialize fade start time on first frame
      if (fadeStartTime.current === null) {
        fadeStartTime.current = state.clock.elapsedTime;
      }

      // Calculate and apply fade-in opacity
      if (!isFullyVisible) {
        const elapsed = state.clock.elapsedTime - fadeStartTime.current;
        // Ease-out cubic for smooth deceleration
        const t = Math.min(elapsed / NEBULA_ANIMATION.FADE_DURATION, 1);
        const opacity = 1 - Math.pow(1 - t, NEBULA_ANIMATION.FADE_EASING_POWER);

        materialRef.current.uniforms.uOpacity.value = opacity;

        if (t >= 1) {
          setIsFullyVisible(true);
        }
      }
    }
  });

  // Don't render if density is 0
  if (density <= 0) {
    return null;
  }

  return (
    <mesh>
      <sphereGeometry args={[radius, NEBULA_GEOMETRY.WIDTH_SEGMENTS, NEBULA_GEOMETRY.HEIGHT_SEGMENTS]} />
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
