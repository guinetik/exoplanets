/**
 * Stars Component
 * Renders stars using Points with custom shader for performance
 * Single draw call with GPU-based twinkle animation
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
import {
  STARS_RENDERING,
  STAR_TWINKLE,
  STAR_INTERACTION,
} from '../../utils/starfieldVisuals';

// =============================================================================
// TYPES
// =============================================================================

interface StarsProps {
  stars: Star[];
  observer: ObserverLocation;
  date: Date;
  onStarClick?: (star: Star) => void;
  onStarHover?: (star: Star | null, mousePos?: { x: number; y: number }) => void;
  focusedStarName?: string | null;
  onFocusedStarScreenPos?: (pos: { x: number; y: number } | null) => void;
}

interface VisibleStar {
  star: Star;
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  twinkleSpeed: number;
  twinklePhase: number;
  twinkleIntensity: number;
}

// =============================================================================
// TEXTURE CREATION
// =============================================================================

/**
 * Create a star texture with glow effect and spikes
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

// =============================================================================
// HASH FUNCTION
// =============================================================================

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

// =============================================================================
// CUSTOM SHADER MATERIAL
// =============================================================================

const vertexShader = `
  attribute vec3 starColor;
  attribute float starSize;
  attribute float twinkleSpeed;
  attribute float twinklePhase;
  attribute float twinkleIntensity;
  attribute float isHovered;

  uniform float uTime;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vColor = starColor;

    // Subtle twinkle - very gentle brightness variation
    float twinkle = sin(uTime * twinkleSpeed * 0.3 + twinklePhase);
    float twinkleScale = 1.0 + twinkle * twinkleIntensity * 0.15;

    // Stable opacity - minimal twinkle effect
    float baseOpacity = isHovered > 0.5 ? 1.0 : 0.95;
    vOpacity = baseOpacity;

    // Calculate final size - interpolate between base and hover scale
    float baseScale = starSize * 20.0;
    float hoverScale = 40.0;
    float targetScale = mix(baseScale, hoverScale, isHovered);
    float finalSize = targetScale * twinkleScale;

    // Position
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation - scale by distance from camera
    // Using higher multiplier to match original sprite sizes
    gl_PointSize = finalSize * (1500.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vOpacity);
  }
`;

// =============================================================================
// STARS COMPONENT
// =============================================================================

export function Stars({
  stars,
  observer,
  date,
  onStarClick,
  onStarHover,
  focusedStarName,
  onFocusedStarScreenPos,
}: StarsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const { gl, camera } = useThree();

  // Create texture once
  const texture = useMemo(() => createStarTexture(), []);

  // Calculate visible stars with all their properties
  const visibleStars = useMemo((): VisibleStar[] => {
    const result: VisibleStar[] = [];

    for (const star of stars) {
      if (star.ra === null || star.dec === null) continue;

      const pos = starTo3D(star.ra, star.dec, observer, date, STARS_RENDERING.STAR_DISTANCE);
      if (!pos.visible) continue;

      const hash = hashString(star.hostname);

      result.push({
        star,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        color: new THREE.Color(getStarColorHex(star.star_class)),
        size: magnitudeToSize(star.sy_vmag),
        twinkleSpeed: STAR_TWINKLE.MIN_SPEED + (hash % STAR_TWINKLE.SPEED_MODULO) / STAR_TWINKLE.SPEED_DIVISOR,
        twinklePhase: ((hash % 1000) / 1000) * Math.PI * 2,
        twinkleIntensity: STAR_TWINKLE.MIN_INTENSITY + (hash % STAR_TWINKLE.INTENSITY_MODULO) / STAR_TWINKLE.INTENSITY_DIVISOR,
      });
    }

    return result;
  }, [stars, observer, date]);

  // Create buffer attributes
  const bufferData = useMemo(() => {
    const count = visibleStars.length;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);
    const twinklePhases = new Float32Array(count);
    const twinkleIntensities = new Float32Array(count);
    const isHovered = new Float32Array(count);

    visibleStars.forEach((star, i) => {
      // Position
      positions[i * 3] = star.position.x;
      positions[i * 3 + 1] = star.position.y;
      positions[i * 3 + 2] = star.position.z;

      // Color
      colors[i * 3] = star.color.r;
      colors[i * 3 + 1] = star.color.g;
      colors[i * 3 + 2] = star.color.b;

      // Other attributes
      sizes[i] = star.size;
      twinkleSpeeds[i] = star.twinkleSpeed;
      twinklePhases[i] = star.twinklePhase;
      twinkleIntensities[i] = star.twinkleIntensity;
      isHovered[i] = 0;
    });

    return {
      positions,
      colors,
      sizes,
      twinkleSpeeds,
      twinklePhases,
      twinkleIntensities,
      isHovered,
    };
  }, [visibleStars]);

  // Store hover attribute ref for updates
  const hoverAttrRef = useRef<THREE.BufferAttribute | null>(null);

  // Find focused star index
  const focusedIndex = useMemo(() => {
    if (!focusedStarName) return -1;
    const searchName = focusedStarName.toLowerCase().split(' ')[0];
    return visibleStars.findIndex(vs =>
      vs.star.hostname.toLowerCase().includes(searchName)
    );
  }, [focusedStarName, visibleStars]);

  // Update geometry when buffer data changes
  useEffect(() => {
    if (!geometryRef.current) return;

    const geo = geometryRef.current;

    geo.setAttribute('position',
      new THREE.BufferAttribute(bufferData.positions, 3));
    geo.setAttribute('starColor',
      new THREE.BufferAttribute(bufferData.colors, 3));
    geo.setAttribute('starSize',
      new THREE.BufferAttribute(bufferData.sizes, 1));
    geo.setAttribute('twinkleSpeed',
      new THREE.BufferAttribute(bufferData.twinkleSpeeds, 1));
    geo.setAttribute('twinklePhase',
      new THREE.BufferAttribute(bufferData.twinklePhases, 1));
    geo.setAttribute('twinkleIntensity',
      new THREE.BufferAttribute(bufferData.twinkleIntensities, 1));

    const hoverAttr = new THREE.BufferAttribute(bufferData.isHovered, 1);
    geo.setAttribute('isHovered', hoverAttr);
    hoverAttrRef.current = hoverAttr;

    geo.computeBoundingSphere();
  }, [bufferData]);

  // Update time uniform and hover state each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Smooth hover/focus transitions
    if (hoverAttrRef.current) {
      const arr = hoverAttrRef.current.array as Float32Array;
      let needsUpdate = false;

      for (let i = 0; i < arr.length; i++) {
        // Either hovered or focused star should be highlighted
        const target = (i === hoveredIndex || i === focusedIndex) ? 1 : 0;
        const diff = target - arr[i];

        if (Math.abs(diff) > 0.001) {
          arr[i] += diff * STAR_INTERACTION.HOVER_LERP;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        hoverAttrRef.current.needsUpdate = true;
      }
    }

    // Calculate focused star screen position
    if (focusedIndex >= 0 && onFocusedStarScreenPos) {
      const focusedStar = visibleStars[focusedIndex];
      if (focusedStar) {
        const projected = focusedStar.position.clone().project(camera);
        if (projected.z <= 1) {
          const rect = gl.domElement.getBoundingClientRect();
          const screenX = (projected.x + 1) / 2 * rect.width + rect.left;
          const screenY = (1 - projected.y) / 2 * rect.height + rect.top;
          onFocusedStarScreenPos({ x: screenX, y: screenY });
        }
      }
    } else if (onFocusedStarScreenPos && focusedIndex === -1) {
      onFocusedStarScreenPos(null);
    }
  });

  // Handle pointer events - screen-space hit testing
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (visibleStars.length === 0) return;

    const rect = gl.domElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Find closest star to mouse in screen space
    let closestIndex = -1;
    let closestDistance = Infinity;

    for (let i = 0; i < visibleStars.length; i++) {
      const star = visibleStars[i];

      // Project star position to screen
      const projected = star.position.clone().project(camera);

      // Skip stars behind camera
      if (projected.z > 1) continue;

      const screenX = (projected.x + 1) / 2 * rect.width;
      const screenY = (1 - projected.y) / 2 * rect.height;

      // Calculate screen distance
      const dx = mouseX - screenX;
      const dy = mouseY - screenY;
      const screenDist = Math.sqrt(dx * dx + dy * dy);

      // Scale threshold by star size for larger stars to be easier to hit
      const adjustedThreshold = STAR_INTERACTION.BASE_HIT_THRESHOLD + star.size * STARS_RENDERING.BASE_SCALE * STAR_INTERACTION.SIZE_SCALE_MULTIPLIER;

      if (screenDist < adjustedThreshold && screenDist < closestDistance) {
        closestIndex = i;
        closestDistance = screenDist;
      }
    }

    if (closestIndex !== hoveredIndex) {
      setHoveredIndex(closestIndex);

      if (closestIndex >= 0) {
        gl.domElement.style.cursor = STAR_INTERACTION.POINTER_CURSOR;
        onStarHover?.(visibleStars[closestIndex].star, {
          x: event.clientX,
          y: event.clientY
        });
      } else {
        gl.domElement.style.cursor = STAR_INTERACTION.DEFAULT_CURSOR;
        onStarHover?.(null);
      }
    } else if (closestIndex >= 0) {
      // Update mouse position for tooltip tracking
      onStarHover?.(visibleStars[closestIndex].star, {
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [visibleStars, hoveredIndex, gl, camera, onStarHover]);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleClick = useCallback((event: MouseEvent) => {
    // Only trigger click if mouse didn't move much (not a drag)
    if (pointerDownPos.current) {
      const dx = event.clientX - pointerDownPos.current.x;
      const dy = event.clientY - pointerDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > STAR_INTERACTION.CLICK_DISTANCE_THRESHOLD) {
        // This was a drag, not a click
        return;
      }
    }

    if (hoveredIndex >= 0 && visibleStars[hoveredIndex]) {
      onStarClick?.(visibleStars[hoveredIndex].star);
    }
  }, [hoveredIndex, visibleStars, onStarClick]);

  const handlePointerLeave = useCallback(() => {
    setHoveredIndex(-1);
    gl.domElement.style.cursor = STAR_INTERACTION.DEFAULT_CURSOR;
    onStarHover?.(null);
  }, [gl, onStarHover]);

  // Attach event listeners
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [gl, handlePointerDown, handlePointerMove, handleClick, handlePointerLeave]);

  // Cleanup texture on unmount
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  if (visibleStars.length === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uTexture: { value: texture },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default Stars;
