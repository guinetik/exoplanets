import { useState, useEffect, useRef } from 'react';
import { Tooltip, Button, Accordion } from 'flowbite-react';
import { StarSystemEngine } from './StarSystemEngine';
import StarSystemPlanets from './starsystemplanets';

export default function StarSystem({ planets }) {
  const [solarSystem, setSolarSystem] = useState(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new StarSystemEngine('canvas', planets);
      setSolarSystem(engineRef.current);
    }

    return () => {
      // Cleanup if needed
    };
  }, [planets]);

  return (
    <div className='bg-black rounded-lg w-full h-full relative overflow-hidden'>
      <div className='absolute bottom-4 left-4 right-4 z-50'>
        <Tooltip
          content="This is an hypothetical visualization of the planetary system. 
          Orbits not to scale.
          Star color infered from star type. Planet sizes proportional to
          planet's radius in Jupiter units. Planet orbital duration proportional
          to orbital period in days and orbital tilt proportinal to orbit's real
          eccentricity. Planet colors infered from planet type and visualization
          type provided by NASA."
          trigger='click'
        >
          <Button size='xs' pill={true} color='dark'>
            What is this?
          </Button>
        </Tooltip>
      </div>

      <StarSystemPlanets planets={planets} solarSystem={solarSystem} />

      <canvas
        id='canvas'
        className='w-full h-full block cursor-move absolute'
      ></canvas>
    </div>
  );
}
