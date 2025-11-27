/**
 * HabitablePlanetCloud
 * Renders all planets as a point cloud using Three.js Points for performance
 */

import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SpatialPoint } from '../../../utils/habitabilityAnalytics';

// =============================================================================
// CONSTANTS
// =============================================================================

const SCALE_FACTOR = 0.75; // Scale parsecs to scene units
const BASE_SIZE = 2;
const MAX_SIZE = 8;

// =============================================================================
// COLOR FUNCTIONS
// =============================================================================

function getPlanetColor(
  planet: SpatialPoint,
  topScores: Set<string>
): THREE.Color {
  // Top candidates: Gold
  if (topScores.has(planet.id)) {
    return new THREE.Color('#ffd700');
  }
  // Habitable + Earth-like: Bright green
  if (planet.isHabitable && planet.isEarthLike) {
    return new THREE.Color('#00ff88');
  }
  // Habitable zone: Cyan
  if (planet.isHabitable) {
    return new THREE.Color('#00ccff');
  }
  // High score (60+): Orange
  if (planet.score >= 60) {
    return new THREE.Color('#ff8800');
  }
  // Default: Gray (dimmer for low scores)
  const brightness = 0.2 + (planet.score / 100) * 0.3;
  return new THREE.Color(brightness, brightness, brightness);
}

function getPlanetSize(score: number): number {
  // Size based on habitability score
  const normalized = score / 100;
  return BASE_SIZE + normalized * (MAX_SIZE - BASE_SIZE);
}

// =============================================================================
// TEXTURE
// =============================================================================

function createPlanetTexture(): THREE.Texture {
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
// SHADER
// =============================================================================

const vertexShader = `
  attribute vec3 planetColor;
  attribute float planetSize;

  varying vec3 vColor;

  void main() {
    vColor = planetColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = planetSize * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 30.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;

  varying vec3 vColor;

  void main() {
    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * 0.9);
  }
`;

// =============================================================================
// COMPONENT
// =============================================================================

interface HabitablePlanetCloudProps {
  planets: SpatialPoint[];
  onPlanetClick?: (planet: SpatialPoint) => void;
  onPlanetHover?: (
    planet: SpatialPoint | null,
    pos?: { x: number; y: number }
  ) => void;
}

export default function HabitablePlanetCloud({
  planets,
  onPlanetClick,
  onPlanetHover,
}: HabitablePlanetCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const { gl, camera } = useThree();

  // Track mouse down position to distinguish clicks from drags
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 5; // pixels

  // Create texture once
  const texture = useMemo(() => createPlanetTexture(), []);

  // Get top 20 for gold highlighting
  const topScores = useMemo(() => {
    const sorted = [...planets].sort((a, b) => b.score - a.score);
    return new Set(sorted.slice(0, 20).map((p) => p.id));
  }, [planets]);

  // Create buffer data
  const bufferData = useMemo(() => {
    const count = planets.length;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    planets.forEach((planet, i) => {
      // Position (scaled from parsecs)
      positions[i * 3] = planet.x * SCALE_FACTOR;
      positions[i * 3 + 1] = planet.y * SCALE_FACTOR;
      positions[i * 3 + 2] = planet.z * SCALE_FACTOR;

      // Color
      const color = getPlanetColor(planet, topScores);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Size
      sizes[i] = getPlanetSize(planet.score);
    });

    return { positions, colors, sizes };
  }, [planets, topScores]);

  // Update geometry when data changes
  useEffect(() => {
    if (!geometryRef.current) return;

    const geo = geometryRef.current;
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(bufferData.positions, 3)
    );
    geo.setAttribute(
      'planetColor',
      new THREE.BufferAttribute(bufferData.colors, 3)
    );
    geo.setAttribute(
      'planetSize',
      new THREE.BufferAttribute(bufferData.sizes, 1)
    );
    geo.computeBoundingSphere();
  }, [bufferData]);

  // Handle pointer events
  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (planets.length === 0) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      let closestIndex = -1;
      let closestDistance = Infinity;
      const threshold = 20;

      for (let i = 0; i < planets.length; i++) {
        const planet = planets[i];

        // Project to screen
        const pos = new THREE.Vector3(
          planet.x * SCALE_FACTOR,
          planet.y * SCALE_FACTOR,
          planet.z * SCALE_FACTOR
        );
        const projected = pos.project(camera);

        if (projected.z > 1) continue;

        const screenX = ((projected.x + 1) / 2) * rect.width;
        const screenY = ((1 - projected.y) / 2) * rect.height;

        const dx = mouseX - screenX;
        const dy = mouseY - screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < threshold && dist < closestDistance) {
          closestIndex = i;
          closestDistance = dist;
        }
      }

      if (closestIndex !== hoveredIndex) {
        setHoveredIndex(closestIndex);

        if (closestIndex >= 0) {
          gl.domElement.style.cursor = 'pointer';
          onPlanetHover?.(planets[closestIndex], {
            x: event.clientX,
            y: event.clientY,
          });
        } else {
          gl.domElement.style.cursor = 'grab';
          onPlanetHover?.(null);
        }
      } else if (closestIndex >= 0) {
        onPlanetHover?.(planets[closestIndex], {
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [planets, hoveredIndex, gl, camera, onPlanetHover]
  );

  const handleMouseDown = useCallback((event: PointerEvent) => {
    mouseDownPos.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Check if this was a drag (mouse moved too much)
      if (mouseDownPos.current) {
        const dx = event.clientX - mouseDownPos.current.x;
        const dy = event.clientY - mouseDownPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > DRAG_THRESHOLD) {
          // This was a drag, not a click
          return;
        }
      }

      if (hoveredIndex >= 0 && planets[hoveredIndex]) {
        onPlanetClick?.(planets[hoveredIndex]);
      }
    },
    [hoveredIndex, planets, onPlanetClick]
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredIndex(-1);
    gl.domElement.style.cursor = 'grab';
    onPlanetHover?.(null);
  }, [gl, onPlanetHover]);

  // Attach event listeners
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handleMouseDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handleMouseDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [gl, handleMouseDown, handlePointerMove, handleClick, handlePointerLeave]);

  // Cleanup
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  if (planets.length === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTexture: { value: texture },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
