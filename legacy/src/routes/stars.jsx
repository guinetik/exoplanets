import AppData from '../data/app.data';
import { BiPlanet } from 'react-icons/bi';
import { IoMdRocket } from 'react-icons/io';
import { MdOutlineClass } from 'react-icons/md';
import { useState } from 'react';
import StarCard from '../components/starcard';
import { Button, Dropdown } from 'flowbite-react';

export default function StarsPage() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const itemsPerPage = 300;
  const allStars = AppData.stars.slice(0, itemsPerPage);

  // Initialize all state at the top
  const [sortPlanets, setSortPlanets] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Get all unique star types for the filter
  const allStarTypes = [...new Set(allStars.map((star) => star.starType))];

  // Toggle star type filter
  const toggleStarType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Apply filters and sorting
  const filteredStars = allStars
    .filter(
      (star) =>
        selectedTypes.length === 0 || selectedTypes.includes(star.starType)
    )
    .sort((a, b) => {
      // Sort by planets if active
      if (sortPlanets === 'most') {
        return b.planets.length - a.planets.length;
      } else if (sortPlanets === 'least') {
        return a.planets.length - b.planets.length;
      }
      return 0;
    });

  return (
    <div className='w-full flex justify-center items-center'>
      <section className='m-auto w-full max-w-7xl'>
        <h1 className='text-white glow lettering uppercase font-light px-2 mb-8 text-center w-full text-3xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-6xl'>
          DISCOVER THE STARS
        </h1>

        {/* Filter/Sort Controls */}
        <div className='rounded-xl bg-gradient-to-b p-[2px] from-purple-800 to-fuchsia-500 table mx-auto'>
          <div className='bg-black w-full rounded-xl'>
            {/* Planet Sort Buttons */}
            <div className='flex items-center gap-1 p-2 items-center justify-center'>
              <span className='text-white mr-2 text-xs'>
                Sort by Number of Planets:
              </span>
              <Button
                pill
                outline={sortPlanets !== 'most'}
                gradientDuoTone='greenToBlue'
                size='xs'
                onClick={() =>
                  setSortPlanets(sortPlanets === 'most' ? null : 'most')
                }
              >
                <BiPlanet className='mr-2' />
                Most
              </Button>
              <Button
                pill
                outline={sortPlanets !== 'least'}
                gradientDuoTone='greenToBlue'
                size='xs'
                onClick={() =>
                  setSortPlanets(sortPlanets === 'least' ? null : 'least')
                }
              >
                <BiPlanet className='mr-2' />
                Least
              </Button>
              {/* Star Type Filter Dropdown */}
              <Dropdown
                pill
                outline={true}
                gradientDuoTone='greenToBlue'
                size='xs'
                color='white'
                label='Filter by Star Type'
              >
                {allStarTypes.map((type) => (
                  <Dropdown.Item
                    key={type}
                    onClick={() => toggleStarType(type)}
                  >
                    <div className='flex items-center'>
                      {selectedTypes.includes(type) ? (
                        <span className='text-green-400 mr-2'>✓</span>
                      ) : (
                        <span className='w-4 mr-2'></span>
                      )}
                      {type}
                    </div>
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => setSelectedTypes([])}>
                  Clear All
                </Dropdown.Item>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Stars Grid */}
        <div className='w-full flex items-center justify-center px-8'>
          <div className='flex flex-wrap'>
            {filteredStars.length > 0 ? (
              filteredStars.map((s) => (
                <div
                  className='p-4 w-full md:w-1/2 xl:w-1/3'
                  key={s.displayName}
                >
                  <StarCard star={s} />
                </div>
              ))
            ) : (
              <div className='text-white text-center py-12 w-full'>
                No stars match your filters. Try different types.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
