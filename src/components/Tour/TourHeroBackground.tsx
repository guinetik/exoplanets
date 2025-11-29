/**
 * TourHeroBackground
 * Procedural planet background for the Tour hero section
 * Simplified version of the intro Earth from Starfield
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural planet shaders (from Starfield intro)
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) {
      sum += noise(p) * amp;
      p *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 nPos = normalize(vPosition);
    float longitude = atan(nPos.x, nPos.z) + uTime * 0.15;
    float latitude = asin(nPos.y);
    vec2 uv = vec2(longitude / 3.14159, latitude / 1.5708 + 0.5);

    // Ocean base
    vec3 oceanColor = vec3(0.02, 0.08, 0.15);

    // Land generation
    float landNoise = fbm(uv * 8.0);
    float landMask = smoothstep(0.45, 0.55, landNoise);

    vec3 landLow = vec3(0.08, 0.25, 0.05);
    vec3 landHigh = vec3(0.3, 0.2, 0.1);
    vec3 landColor = mix(landLow, landHigh, fbm(uv * 16.0));

    // Ice caps
    float iceMask = smoothstep(0.7, 0.9, abs(nPos.y));
    vec3 iceColor = vec3(0.9, 0.95, 1.0);

    // Clouds
    float cloudNoise = fbm(uv * 6.0 + uTime * 0.03);
    float cloudMask = smoothstep(0.5, 0.7, cloudNoise);

    // Combine
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);
    surfaceColor = mix(surfaceColor, iceColor, iceMask);
    surfaceColor = mix(surfaceColor, vec3(1.0), cloudMask * 0.5);

    // Lighting
    vec3 lightDir = normalize(vec3(0.5, 0.3, 1.0));
    float light = max(0.0, dot(vNormal, lightDir));
    float ambient = 0.1;

    // Atmosphere rim
    float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    vec3 rimGlow = vec3(0.3, 0.6, 1.0) * pow(rim, 3.0) * 0.4;

    vec3 finalColor = surfaceColor * (light + ambient) + rimGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function Planet() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group position={[0, 0, -3]}>
      {/* Main planet */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#0066ff"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function BackgroundStars() {
  const positions = useMemo(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 50;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={500}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={1.5} color="#ffffff" transparent opacity={0.6} sizeAttenuation={false} />
    </points>
  );
}

export default function TourHeroBackground() {
  return (
    <div className="tour-hero-canvas">
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 5] }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        <BackgroundStars />
        <Planet />
      </Canvas>
    </div>
  );
}
