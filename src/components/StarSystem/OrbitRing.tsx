/**
 * OrbitRing Component
 * Renders an orbital path ring, supporting both circular and elliptical orbits
 * For eccentric orbits, the star is positioned at one focus of the ellipse
 */

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ORBITAL_MECHANICS } from '../../utils/celestialBodyVisuals';
import {
  ORBIT_ANIMATION,
  ORBIT_GEOMETRY,
  getOrbitStyle,
} from '../../utils/orbitVisuals';

interface OrbitRingProps {
  radius: number; // Semi-major axis (a)
  eccentricity?: number; // Orbital eccentricity (0 = circle, <1 = ellipse)
  isHighlighted: boolean;
  isBinaryOrbit?: boolean; // True for binary star orbital path
}

export function OrbitRing({
  radius,
  eccentricity = 0,
  isHighlighted,
  isBinaryOrbit = false,
}: OrbitRingProps) {
  const lineRef = useRef<THREE.Line>(null);
  const fadeStartTime = useRef<number | null>(null);
  const [isFullyVisible, setIsFullyVisible] = useState(false);

  // Clamp eccentricity to valid range [0, max] to prevent degenerate ellipses
  const e = Math.min(Math.max(eccentricity, 0), ORBITAL_MECHANICS.MAX_ECCENTRICITY);

  // Calculate ellipse parameters
  // Semi-major axis (a) = radius
  // Semi-minor axis (b) = a * sqrt(1 - e²)
  // Focus offset (c) = a * e (distance from center to focus)
  const a = radius;
  const b = a * Math.sqrt(1 - e * e);
  const focusOffset = isBinaryOrbit ? 0 : a * e; // Binary orbits are centered on barycenter

  // Determine visual style based on orbit type and eccentricity
  const isEccentric = e > ORBIT_GEOMETRY.ECCENTRICITY_THRESHOLD;

  // Create the Line object with geometry and material
  const line = useMemo(() => {
    const segments = ORBIT_GEOMETRY.SEGMENTS;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * ORBIT_GEOMETRY.FULL_CIRCLE;
      // Parametric ellipse: x = a*cos(θ), z = b*sin(θ)
      // Shift by focus offset so star (at origin) is at one focus
      const x = a * Math.cos(theta) - focusOffset;
      const z = b * Math.sin(theta);
      points.push(new THREE.Vector3(x, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      transparent: true,
      depthWrite: false,
    });

    return new THREE.Line(geometry, material);
  }, [a, b, focusOffset]);

  // Update material properties reactively with fade-in
  useFrame((state) => {
    if (!lineRef.current) return;
    const material = lineRef.current.material as THREE.LineBasicMaterial;

    // Initialize fade start time on first frame
    if (fadeStartTime.current === null) {
      fadeStartTime.current = state.clock.elapsedTime;
    }

    // Calculate fade-in multiplier
    let fadeMultiplier = 1;
    if (!isFullyVisible) {
      const elapsed = state.clock.elapsedTime - fadeStartTime.current;
      // Ease-out cubic for smooth deceleration
      const t = Math.min(elapsed / ORBIT_ANIMATION.FADE_DURATION, 1);
      fadeMultiplier = 1 - Math.pow(1 - t, ORBIT_ANIMATION.FADE_EASING_POWER);

      if (t >= 1) {
        setIsFullyVisible(true);
      }
    }

    // Get visual style based on orbit type and state
    const style = getOrbitStyle(isHighlighted, isBinaryOrbit, isEccentric);

    material.color.set(style.color);
    material.opacity = style.opacity * fadeMultiplier;
  });

  return <primitive ref={lineRef} object={line} />;
}

export default OrbitRing;
