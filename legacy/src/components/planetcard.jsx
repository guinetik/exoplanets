import { Link } from 'react-router-dom';

import { BiPlanet } from 'react-icons/bi';
import { IoMdRocket } from 'react-icons/io';
import { GrSolaris } from 'react-icons/gr';
import { Button } from 'flowbite-react';
const PlanetCard = (props) => {
  return (
    <div className='min-w-[285px] flex flex-col h-full w-full rounded-lg overflow-hidden bg-gradient-to-b p-0.5 from-cyan-500 to-green-500'>
      <img
        className='lg:h-80 md:h-60 w-full object-cover object-center rounded-tl-lg rounded-tr-lg'
        src={'https://exoplanets.nasa.gov' + props.planet.list_image}
        alt='blog'
      />
      <div className='p-6 bg-black rounded-bl-lg rounded-br-lg flex-auto justify-items-stretch'>
        <h1 className='text-slate-100 lettering font-extralight text-2xl md:text-3xl lg:text-4xl w-full'>
          {props.planet.display_name}
        </h1>
        <h3 className='tracking-widest font-medium text-sky-500 mb-1 text-lg md:text-xl w-full'>
          {props.planet.subtitle}
        </h3>
        <h2 className='leading-relaxed mb-4 text-slate-400 italic text-sm md:text-md lg:text-lg w-full justify-self-stretch h-max'>
          {props.planet.short_description}
        </h2>
        <div className='flex items-center justify-between'>
          <Button
            href={'/#/planets/' + props.planet.id}
            outline={true}
            gradientDuoTone='cyanToBlue'
            size='lg'
          >
            <IoMdRocket className='text-xl group-hover:bounce_y transition-all' />
            <span className='sm:text-xs md:text-md lg:text-lg group'>
              Visit Planet
            </span>
          </Button>
          <Button
            href={'/#/stars/' + props.planet.pl_hostname}
            outline={true}
            gradientDuoTone='pinkToOrange'
            size='lg'
          >
            <GrSolaris className='text-xl group-hover:bounce_y transition-all' />
            <span className='sm:text-xs md:text-md lg:text-lg'>Visit Star</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanetCard;
