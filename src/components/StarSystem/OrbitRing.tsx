/**
 * OrbitRing Component
 * Renders an orbital path ring, supporting both circular and elliptical orbits
 * For eccentric orbits, the star is positioned at one focus of the ellipse
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

  // Clamp eccentricity to valid range [0, 0.99] to prevent degenerate ellipses
  const e = Math.min(Math.max(eccentricity, 0), 0.99);

  // Calculate ellipse parameters
  // Semi-major axis (a) = radius
  // Semi-minor axis (b) = a * sqrt(1 - e²)
  // Focus offset (c) = a * e (distance from center to focus)
  const a = radius;
  const b = a * Math.sqrt(1 - e * e);
  const focusOffset = isBinaryOrbit ? 0 : a * e; // Binary orbits are centered on barycenter

  // Determine visual style based on orbit type and eccentricity
  const isEccentric = e > 0.1;

  // Create the Line object with geometry and material
  const line = useMemo(() => {
    const segments = 128;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
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

  // Update material properties reactively
  useFrame(() => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;

      // Binary orbits: golden/orange to represent the stellar dance
      // Eccentric planet orbits: blue-ish tint
      // Normal planet orbits: gray
      let baseColor: string;
      let opacity: number;

      if (isHighlighted) {
        baseColor = '#ffffff';
        opacity = 0.8;
      } else if (isBinaryOrbit) {
        baseColor = '#ffaa44'; // Golden orange for binary star orbit
        opacity = 0.5;
      } else if (isEccentric) {
        baseColor = '#aaaaff'; // Blue-ish for eccentric planet orbits
        opacity = 0.45;
      } else {
        baseColor = '#888888'; // Gray for circular orbits
        opacity = 0.3;
      }

      material.color.set(baseColor);
      material.opacity = opacity;
    }
  });

  return <primitive ref={lineRef} object={line} />;
}

export default OrbitRing;
