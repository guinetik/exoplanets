/**
 * TerminatorOverlay Component
 *
 * Renders a day/night terminator overlay for tidally locked planets.
 * This is a transparent sphere slightly larger than the planet that
 * shows the dark night side while leaving the day side visible.
 *
 * Used on the Planet detail page to show the dramatic day/night
 * contrast of tidally locked worlds. NOT used on the star map view
 * where the star already provides illumination.
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { shaderService } from '../../services/shaderService';

interface TerminatorOverlayProps {
  /** Radius of the planet sphere */
  radius: number;
  /** Direction vector pointing toward the star (normalized) */
  starDirection?: THREE.Vector3;
  /** Width of the terminator transition zone (0.1-0.3) */
  terminatorWidth?: number;
  /** Show frozen/icy effect on night side */
  showFrozenNight?: boolean;
  /** Maximum opacity of night side overlay (0-1) */
  nightOpacity?: number;
}

export function TerminatorOverlay({
  radius,
  starDirection = new THREE.Vector3(1, 0, 0.3).normalize(),
  terminatorWidth = 0.2,
  showFrozenNight = true,
  nightOpacity = 0.85,
}: TerminatorOverlayProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create uniforms for the terminator shader
  const uniforms = useMemo(
    () => ({
      uStarDirection: { value: starDirection.clone().normalize() },
      uTerminatorWidth: { value: terminatorWidth },
      uShowFrozenNight: { value: showFrozenNight ? 1.0 : 0.0 },
      uNightOpacity: { value: nightOpacity },
    }),
    [starDirection, terminatorWidth, showFrozenNight, nightOpacity]
  );

  // Overlay sphere is slightly larger than the planet
  const overlayRadius = radius * 1.002;

  return (
    <mesh>
      <sphereGeometry args={[overlayRadius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={shaderService.get('v2TerminatorVert')}
        fragmentShader={shaderService.get('v2TerminatorFrag')}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default TerminatorOverlay;
