/**
 * Earth Horizon Component
 * Realistic Earth horizon using procedural shaders with continents, oceans, clouds, and atmosphere
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderService } from '../../services/shaderService';

interface EarthHorizonProps {
  longitude?: number; // Observer longitude in degrees
}

export function EarthHorizon({ longitude = 0 }: EarthHorizonProps) {
  const [shadersReady, setShadersReady] = useState(false);
  const [shaders, setShaders] = useState<{
    surfaceVert: string;
    surfaceFrag: string;
    atmosphereVert: string;
    atmosphereFrag: string;
  } | null>(null);

  const targetRotation = useRef(0);
  const currentRotation = useRef(0);

  // Create uniforms object that persists across renders
  const uniforms = useMemo(() => ({
    uRotation: { value: 0 },
  }), []);

  // Check shader availability
  useEffect(() => {
    const checkShaders = () => {
      try {
        if (shaderService.isLoaded()) {
          setShaders({
            surfaceVert: shaderService.get('earthSurfaceVert'),
            surfaceFrag: shaderService.get('earthSurfaceFrag'),
            atmosphereVert: shaderService.get('atmosphereVert'),
            atmosphereFrag: shaderService.get('atmosphereFrag'),
          });
          setShadersReady(true);
        } else {
          // Retry after a short delay
          setTimeout(checkShaders, 100);
        }
      } catch (error) {
        console.warn('Earth shaders not available, using fallback:', error);
        setShadersReady(true); // Mark as ready to show fallback
      }
    };

    checkShaders();
  }, []);

  // Update target rotation when longitude changes
  useEffect(() => {
    // Convert longitude to radians (negative because we rotate opposite to observer movement)
    targetRotation.current = (-longitude * Math.PI) / 180;
  }, [longitude]);

  // Animate rotation smoothly
  useFrame(() => {
    // Smoothly interpolate current rotation towards target
    const diff = targetRotation.current - currentRotation.current;
    currentRotation.current += diff * 0.05;

    // Update uniform
    uniforms.uRotation.value = currentRotation.current;
  });

  // Always render something - show fallback until shaders are ready
  if (!shadersReady || !shaders) {
    return (
      <group>
        <mesh position={[0, -600, 0]}>
          <sphereGeometry args={[580, 64, 32]} />
          <meshBasicMaterial color={0x80aae2} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Main Earth body with realistic surface shader */}
      {/* Features: continents, oceans, ice caps, clouds, city lights, and atmospheric rim lighting */}
      <mesh position={[0, -600, 0]}>
        <sphereGeometry args={[580, 64, 64]} />
        <shaderMaterial
          vertexShader={shaders.surfaceVert}
          fragmentShader={shaders.surfaceFrag}
          uniforms={uniforms}
        />
      </mesh>

      {/* Realistic atmosphere layer with Fresnel effect */}
      {/* Creates the blue atmospheric glow at the horizon edge */}
      <mesh position={[0, -600, 0]} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[580, 64, 64]} />
        <shaderMaterial
          vertexShader={shaders.atmosphereVert}
          fragmentShader={shaders.atmosphereFrag}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default EarthHorizon;
