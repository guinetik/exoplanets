import { Link } from 'react-router-dom';
import { Accordion } from 'flowbite-react';

const StarSystemPlanets = ({ planets, solarSystem }) => {
  const handlePlanetHover = (planetName) => {
    if (solarSystem) solarSystem.highlightPlanet(planetName);
  };

  const handlePlanetLeave = () => {
    if (solarSystem) solarSystem.resetHighlight();
  };

  const planetLinks = planets.map((planet) => {
    if (!planet.displayName) return null;

    let link, className;
    switch (planet.type) {
      case 'star':
        link = `/star/${planet.id}`;
        className =
          'text-orange-500 hover:text-white active:text-white transition-all';
        break;
      case 'moon':
        link = `/planets/${planet.id}`;
        className =
          'text-blue-500 hover:text-white active:text-white transition-all';
        break;
      default:
        link = `/planets/${planet.id}`;
        className =
          'text-green-500 hover:text-white active:text-white transition-all';
        break;
    }

    return (
      <li key={planet.name}>
        <Link
          onMouseOver={() => handlePlanetHover(planet.name)}
          onMouseOut={handlePlanetLeave}
          className={className}
          style={{ color: planet.color }}
          to={link}
        >
          {planet.displayName}
        </Link>
      </li>
    );
  });

  return (
    <div className='rounded-lg absolute z-10 p-4 h-auto lg:h-full'>
      <Accordion alwaysOpen={true}>
        <Accordion.Panel>
          <Accordion.Title>Planetary Bodies</Accordion.Title>
          <Accordion.Content>
            <ul className='text-white'>{planetLinks}</ul>
            <aside className='text-sm text-slate-300 mt-2'>
              Click to visit a planet
            </aside>
          </Accordion.Content>
        </Accordion.Panel>
      </Accordion>
    </div>
  );
};
export default StarSystemPlanets;
