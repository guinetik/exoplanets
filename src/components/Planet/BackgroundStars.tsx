/**
 * BackgroundStars Component
 * Renders procedurally generated background stars for depth in 3D scenes
 */

import { useMemo } from 'react';

interface BackgroundStarsProps {
  /** Number of stars to render (default 2000) */
  count?: number;
}

/**
 * Renders a field of background stars on a sphere
 * Uses spherical coordinate distribution for even coverage
 * @param count - Number of stars to generate
 */
export function BackgroundStars({ count = 2000 }: BackgroundStarsProps) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Spherical coordinates for even distribution
      const theta = Math.random() * Math.PI * 2; // azimuth
      const phi = Math.acos(2 * Math.random() - 1); // polar angle
      const r = 200; // radius

      // Convert to Cartesian
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

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
        size={1.2}
        color={0xffffff}
        transparent
        opacity={0.5}
        sizeAttenuation={false}
      />
    </points>
  );
}

export default BackgroundStars;
