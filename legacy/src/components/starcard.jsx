import { BiPlanet } from 'react-icons/bi';
import AppData from '../data/app.data';
import { MdOutlineClass } from 'react-icons/md';
import { Button } from 'flowbite-react';
import { IoMdRocket } from 'react-icons/io';

const StarCard = (props) => {
  return (
    <div className='min-w-[285px] flex flex-col h-full w-full rounded-lg overflow-hidden bg-gradient-to-b p-0.5 from-orange-500 to-purple-500'>
      <img
        className='lg:h-48 md:h-36 w-full object-cover object-center rounded-tl-lg rounded-tr-lg'
        src={AppData.getStellarImage(props.star.starType)}
        alt='blog'
      />
      <div className='p-6 bg-black rounded-bl-lg rounded-br-lg flex-auto '>
        <h1 className='text-slate-100 lettering font-extralight text-2xl md:text-3xl lg:text-4xl'>
          {props.star.displayName}
        </h1>
        <h3 className='tracking-widest font-medium text-sky-500 mb-1 text-lg md:text-xl'>
          Constellation: {props.star.constellation}
        </h3>
        <h2 className='leading-relaxed mb-4 text-slate-400 italic text-lg md:text-xl lg:text-2xl'>
          {props.star.planets.length > 1
            ? `${props.star.planets.length} planets orbit`
            : `${props.star.planets.length} planet orbits`}{' '}
          a {props.star.starType}-type star,{' '}
          <span className='text-yellow-400'>
            {props.star.distanceFromEarth}
          </span>{' '}
          from Earth.
        </h2>
        <div className='flex items-center justify-between'>
          <Button
            href={'/#/stars/' + props.star.id}
            outline={true}
            gradientDuoTone='cyanToBlue'
            size='lg'
          >
            <IoMdRocket className='text-xl group-hover:animate-bounce_y transition-all' />
            <span className='sm:text-md md:text-md lg:text-lg'>Visit Star</span>
          </Button>
          <div>
            <span
              title={'Star Type: ' + props.star.starType}
              className='text-purple-400 mr-3 inline-flex items-center lg:ml-auto md:ml-0 ml-auto leading-none text-sm pr-3 py-1 border-r-2 border-gray-200'
            >
              <MdOutlineClass className='text-xl'></MdOutlineClass>
              <aside className='ml-2'>{props.star.starType}</aside>
            </span>
            <span
              title='Planets'
              className='text-green-400 inline-flex items-center leading-none text-sm'
              alt='Planets'
            >
              <BiPlanet className='text-xl'></BiPlanet>
              <aside className='ml-2'>{props.star.planets.length || 0}</aside>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StarCard;
