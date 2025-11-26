/**
 * StarSystem Component
 * Full-screen 3D visualization of a star system with orbiting planets
 */

import { useState, useMemo, useCallback, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Star, Exoplanet } from '../../types';
import { generateSolarSystem, type StellarBody } from '../../utils/solarSystem';
import { CelestialBody } from './CelestialBody';
import { OrbitRing } from './OrbitRing';
import { StarSystemInfo } from './StarSystemInfo';

interface StarSystemProps {
  star: Star;
  planets: Exoplanet[];
  onPlanetClick?: (planet: Exoplanet) => void;
}

// Separate component to control camera with manual rotation
function CameraControls({ shouldAutoRotate, maxDistance }: { shouldAutoRotate: boolean; maxDistance: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Manual auto-rotation using useFrame
  useFrame((_, delta) => {
    if (controlsRef.current && shouldAutoRotate) {
      // Manually rotate the azimuthal angle
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() + delta * 0.1
      );
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={maxDistance}
      autoRotate={false}
    />
  );
}

export function StarSystem({ star, planets, onPlanetClick: _onPlanetClick }: StarSystemProps) {
  const navigate = useNavigate();
  const [hoveredBody, setHoveredBody] = useState<StellarBody | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Generate solar system data
  const bodies = useMemo(() => generateSolarSystem(star, planets), [star, planets]);

  // Calculate camera distance based on outermost orbit AND star size
  const cameraDistance = useMemo(() => {
    const maxOrbit = Math.max(...bodies.map(b => b.orbitRadius), 10);
    const starBody = bodies.find(b => b.type === 'star');
    const starDiameter = starBody?.diameter ?? 3;

    // Ensure camera is far enough to see the star + some orbits
    // For big stars, we need more distance
    const minDistanceForStar = starDiameter * 4;
    const distanceForOrbits = maxOrbit * 2.5;

    return Math.max(minDistanceForStar, distanceForOrbits);
  }, [bodies]);

  const handleBodyHover = useCallback((body: StellarBody | null, pos?: { x: number; y: number }) => {
    setHoveredBody(body);
    setMousePos(pos ?? null);
  }, []);

  const handleBodyClick = useCallback((body: StellarBody) => {
    if (body.type === 'planet') {
      navigate(`/planets/${encodeURIComponent(body.id)}`);
    }
  }, [navigate]);

  return (
    <div className="starsystem-container">
      <Canvas
        camera={{ position: [0, cameraDistance * 0.5, cameraDistance], fov: 50 }}
        style={{ background: 'black' }}
      >
        <Suspense fallback={null}>
          {/* Ambient light for base visibility */}
          <ambientLight intensity={0.6} />

          {/* Hemisphere light for better planet illumination */}
          <hemisphereLight args={['#ffffff', '#444444', 0.5]} />

          {/* Space background with stars */}
          <Stars
            radius={300}
            depth={60}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />

          {/* Render all celestial bodies */}
          {bodies.map((body) => (
            <CelestialBody
              key={body.id}
              body={body}
              isHovered={hoveredBody?.id === body.id}
              onHover={handleBodyHover}
              onClick={handleBodyClick}
            />
          ))}

          {/* Render orbit rings for planets */}
          {bodies
            .filter((b) => b.type === 'planet')
            .map((body) => (
              <OrbitRing
                key={`orbit-${body.id}`}
                radius={body.orbitRadius}
                isHighlighted={hoveredBody?.id === body.id}
              />
            ))}

          {/* Camera controls */}
          <CameraControls
            shouldAutoRotate={!hoveredBody}
            maxDistance={cameraDistance * 3}
          />
        </Suspense>
      </Canvas>

      {/* Info overlay */}
      <StarSystemInfo
        star={star}
        bodies={bodies}
        hoveredBody={hoveredBody}
        onBodyHover={(body) => handleBodyHover(body)}
      />

      {/* Cursor tooltip for hovered planet - shows all planet details */}
      {hoveredBody && hoveredBody.type === 'planet' && mousePos && hoveredBody.planetData && (
        <div
          className="starsystem-cursor-tooltip"
          style={{
            left: mousePos.x + 20,
            top: mousePos.y - 10,
          }}
        >
          <div className="cursor-tooltip-header">
            <div className="cursor-tooltip-name">{hoveredBody.planetData.pl_name}</div>
            <div className="cursor-tooltip-type">{hoveredBody.planetData.planet_type}</div>
          </div>

          <div className="cursor-tooltip-details">
            {hoveredBody.planetData.pl_rade && (
              <div className="cursor-tooltip-detail">
                <span className="cursor-tooltip-label">Radius</span>
                <span className="cursor-tooltip-value">{hoveredBody.planetData.pl_rade.toFixed(2)} R⊕</span>
              </div>
            )}

            {hoveredBody.planetData.pl_bmasse && (
              <div className="cursor-tooltip-detail">
                <span className="cursor-tooltip-label">Mass</span>
                <span className="cursor-tooltip-value">{hoveredBody.planetData.pl_bmasse.toFixed(2)} M⊕</span>
              </div>
            )}

            {hoveredBody.planetData.pl_orbper && (
              <div className="cursor-tooltip-detail">
                <span className="cursor-tooltip-label">Orbital Period</span>
                <span className="cursor-tooltip-value">{hoveredBody.planetData.pl_orbper.toFixed(2)} days</span>
              </div>
            )}

            {hoveredBody.planetData.pl_orbsmax && (
              <div className="cursor-tooltip-detail">
                <span className="cursor-tooltip-label">Semi-major Axis</span>
                <span className="cursor-tooltip-value">{hoveredBody.planetData.pl_orbsmax.toFixed(3)} AU</span>
              </div>
            )}

            {hoveredBody.planetData.pl_eqt && (
              <div className="cursor-tooltip-detail">
                <span className="cursor-tooltip-label">Eq. Temperature</span>
                <span className="cursor-tooltip-value">{hoveredBody.planetData.pl_eqt.toFixed(0)} K</span>
              </div>
            )}

            {hoveredBody.planetData.disc_year && (
              <div className="cursor-tooltip-detail">
                <span className="cursor-tooltip-label">Discovered</span>
                <span className="cursor-tooltip-value">{hoveredBody.planetData.disc_year}</span>
              </div>
            )}

            {hoveredBody.planetData.discoverymethod && (
              <div className="cursor-tooltip-detail">
                <span className="cursor-tooltip-label">Method</span>
                <span className="cursor-tooltip-value">{hoveredBody.planetData.discoverymethod}</span>
              </div>
            )}
          </div>

          <div className="cursor-tooltip-hint">Click to view details</div>
        </div>
      )}
    </div>
  );
}

export default StarSystem;
