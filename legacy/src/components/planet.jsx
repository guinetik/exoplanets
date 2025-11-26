import { useState, useEffect, useRef } from 'react';
import Zdog from 'zdog';
import PlanetGenerator from './PlanetGenerator';

export default function PlanetView({ planet }) {
  const [canvas, setCanvas] = useState(null);
  const planetGenerator = useRef(null);
  const spaceRef = useRef(null); // Add a ref for the space instance

  useEffect(() => {
    planetGenerator.current = new PlanetGenerator();
    return () => planetGenerator.current?.cleanup();
  }, []);

  useEffect(() => {
    if (!planet?.id) return;

    const canvasElement = document.getElementById('spaceCanvas');
    if (!canvasElement) {
      setCanvas(
        <canvas
          id='spaceCanvas'
          className='w-full'
          height='400'
          data-planet={planet.id}
        />
      );
      return;
    }

    // Create the illustration
    spaceRef.current = new Zdog.Illustration({
      element: '#spaceCanvas',
      dragRotate: false,
      resize: true,
      rotate: { x: -Zdog.TAU * 0.05 },
      onDragStart: () => (planetGenerator.current.isSpinning = false),
      onDragEnd: () => (planetGenerator.current.isSpinning = true),
      onResize: (width) => {
        if (spaceRef.current) {
          spaceRef.current.zoom = width / 280;
        }
      },
    });

    planetGenerator.current.generate_world(spaceRef.current, false, planet);
  }, [planet, canvas]);

  return (
    <div className='flex justify-center overflow-hidden'>
      {canvas || (
        <canvas
          id='spaceCanvas'
          className='w-full'
          height='400'
          data-planet={planet?.id}
        />
      )}
    </div>
  );
}
