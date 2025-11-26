/**
 * Stars Component
 * Renders stars as 3D sprite objects that can be clicked
 */

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '../../types';
import {
  ObserverLocation,
  starTo3D,
  getStarColorHex,
  magnitudeToSize,
} from '../../utils/astronomy';

interface StarsProps {
  stars: Star[];
  observer: ObserverLocation;
  date: Date;
  onStarClick?: (star: Star) => void;
  onStarHover?: (star: Star | null, mousePos?: { x: number; y: number }) => void;
}

/**
 * Create a star texture with glow effect
 */
function createStarTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;

  // Clear
  ctx.clearRect(0, 0, size, size);

  // Outer glow
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw cross/star spikes
  ctx.save();
  ctx.translate(center, center);

  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);

    const spikeGradient = ctx.createLinearGradient(0, 0, 0, -center);
    spikeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    spikeGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
    spikeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = spikeGradient;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(0, -center * 0.9);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Bright center core
  const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.15);
  coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  coreGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
  coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = coreGradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generate a hash from string for consistent random values per star
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Individual Star Sprite Component
 */
function StarSprite({
  star,
  position,
  color,
  size,
  texture,
  onStarClick,
  onStarHover,
  isHovered,
}: {
  star: Star;
  position: [number, number, number];
  color: THREE.Color;
  size: number;
  texture: THREE.Texture;
  onStarClick?: (star: Star) => void;
  onStarHover?: (star: Star | null, event?: PointerEvent) => void;
  isHovered: boolean;
}) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const materialRef = useRef<THREE.SpriteMaterial>(null);
  const { gl } = useThree();
  const baseScale = size * 20;
  const hoverScale = 40; // Fixed size for all stars when hovered
  const targetScale = isHovered ? hoverScale : baseScale;

  // Generate unique twinkle parameters for this star
  const twinkleParams = useMemo(() => {
    const hash = hashString(star.hostname);
    return {
      speed: 0.5 + (hash % 100) / 50, // 0.5 to 2.5 cycles per second
      phase: (hash % 1000) / 1000 * Math.PI * 2, // Random starting phase
      intensity: 0.15 + (hash % 50) / 200, // 0.15 to 0.4 intensity variation
    };
  }, [star.hostname]);

  // Animate scale on hover and twinkle effect
  useFrame((state) => {
    if (spriteRef.current && materialRef.current) {
      // Hover scale animation
      const current = spriteRef.current.scale.x;
      const twinkle = Math.sin(state.clock.elapsedTime * twinkleParams.speed + twinkleParams.phase);
      const twinkleScale = 1 + twinkle * twinkleParams.intensity;
      const finalTargetScale = targetScale * twinkleScale;
      const newScale = current + (finalTargetScale - current) * 0.15;
      spriteRef.current.scale.setScalar(newScale);

      // Twinkle opacity
      const baseOpacity = isHovered ? 1 : 0.9;
      const opacityTwinkle = 1 + twinkle * (twinkleParams.intensity * 0.5);
      materialRef.current.opacity = Math.min(1, baseOpacity * opacityTwinkle);
    }
  });

  return (
    <sprite
      ref={spriteRef}
      position={position}
      scale={[baseScale, baseScale, 1]}
      onClick={(e) => {
        e.stopPropagation();
        onStarClick?.(star);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        gl.domElement.style.cursor = 'pointer';
        onStarHover?.(star, e.nativeEvent);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onStarHover?.(star, e.nativeEvent);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        gl.domElement.style.cursor = 'grab';
        onStarHover?.(null);
      }}
    >
      <spriteMaterial
        ref={materialRef}
        map={texture}
        color={color}
        transparent
        opacity={isHovered ? 1 : 0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

export function Stars({
  stars,
  observer,
  date,
  onStarClick,
  onStarHover,
}: StarsProps) {
  const [hoveredStar, setHoveredStar] = useState<string | null>(null);
  const texture = useMemo(() => createStarTexture(), []);

  // Handle hover with callback to parent
  const handleHover = useCallback(
    (star: Star | null, event?: PointerEvent) => {
      setHoveredStar(star?.hostname ?? null);
      const mousePos = event ? { x: event.clientX, y: event.clientY } : undefined;
      onStarHover?.(star, mousePos);
    },
    [onStarHover]
  );

  // Calculate visible stars with positions
  const visibleStars = useMemo(() => {
    const result: {
      star: Star;
      position: [number, number, number];
      color: THREE.Color;
      size: number;
    }[] = [];

    for (const star of stars) {
      if (star.ra === null || star.dec === null) continue;

      const pos = starTo3D(star.ra, star.dec, observer, date, 500);

      // Only include stars above horizon
      if (!pos.visible) continue;

      const color = new THREE.Color(getStarColorHex(star.star_class));
      const size = magnitudeToSize(star.sy_vmag);

      result.push({
        star,
        position: [pos.x, pos.y, pos.z],
        color,
        size,
      });
    }

    return result;
  }, [stars, observer, date]);

  // Cleanup texture on unmount
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <group>
      {visibleStars.map(({ star, position, color, size }) => (
        <StarSprite
          key={star.hostname}
          star={star}
          position={position}
          color={color}
          size={size}
          texture={texture}
          onStarClick={onStarClick}
          onStarHover={handleHover}
          isHovered={hoveredStar === star.hostname}
        />
      ))}
    </group>
  );
}

export default Stars;
