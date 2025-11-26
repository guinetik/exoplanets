import AppData from '../data/app.data';
import { useState } from 'react';
import '../data/types';
import PlanetCard from '../components/planetcard';
export default function PlanetPage() {
  /* todo: add infinite scrolling here */
  const itemsPerPage = 300;
  //const [count, setCount] = useState(0);
  const [planets, setPlanets] = useState(
    AppData.exoplanets.slice(0, itemsPerPage)
  );
  window.scrollTo({ top: 0, behavior: 'smooth' });
  /* console.log(
    planets
      .map(p => p?.id)
      .filter(Boolean)
      .join(', ')
  ); */
  //
  return (
    <div className='w-full flex justify-center items-center'>
      <section className='m-auto'>
        <h1 className='text-white glow lettering uppercase font-light px-2 mb-8 text-center w-full text-3xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-6xl'>
          EXOPLANETS
        </h1>
        <div className='w-full flex items-center justify-center'>
          <div className='flex flex-wrap'>
            {planets.map((s, index) => {
              return (
                <div className='p-4 w-full md:w-1/2 xl:w-1/3' key={index}>
                  <PlanetCard planet={s} />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
