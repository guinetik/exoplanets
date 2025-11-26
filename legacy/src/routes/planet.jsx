import { Table } from 'flowbite-react';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../data/context';
import AppData from '../data/app.data';
import PlanetView from '../components/planet';
import { TiInfoLarge } from 'react-icons/ti';
import ReviewsComponent from '../components/reviews';
import { Button } from 'flowbite-react';
import { MdOutlineRateReview } from 'react-icons/md';
import { BiPlanet } from 'react-icons/bi';
import FirebaseData from '../data/db';
import { ReviewModal } from '../components/modals';
//
export default function PlanetPage() {
  const childRef = useRef();
  //
  const { planet_id } = useParams();
  /**
   * Controls the modal
   */
  const [isModalOpen, setModalOpen] = useState(false);
  /**
   * Hooking up to the user's context
   */
  const { user } = useContext(AuthContext);
  //
  /**
   * flowbite-react doesnt expose a target attribute on the Button component.
   * so we hack the click and prevent default to then call window API to open url on a new tab
   * @param {MouseEvent} e - the event to override
   */
  const openLinkNewTab = (e) => {
    e.preventDefault();
    window.open('https://exoplanets.nasa.gov' + planet.url, '_newtab');
  };
  /**
   * @type {Array<Planet>}
   */
  const [planet, setPlanet] = useState({});
  /**
   * @type {Array<Boolean>}
   */
  const [loading, setLoading] = useState(true);
  const openCreateReviewModal = (e) => {
    e.preventDefault();
    if (user) {
      setModalOpen(true);
    } else {
      FirebaseData.messageHandler('Please login to leave a review');
    }
  };
  useEffect(() => {
    async function fetchData() {
      /**
       * @type {Planet}
       */
      const p = AppData.findExoplanetById(planet_id);
      if (p.id) {
        setPlanet(p);
        if (planet.id) {
          //console.log("planet", planet);
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [planet_id, planet]);
  return (
    <main className='w-full flex justify-center items-center'>
      <ReviewModal
        show={isModalOpen}
        user={user}
        planet_id={planet_id}
        onClose={() => {
          setModalOpen(false);
          childRef.current.refresh();
        }}
      />
      {!loading && planet && (
        <section className='w-full h-full m-auto mt-14'>
          <header className='bg-black  bg-opacity-50'>
            <div className='w-full border-b-2 border-slate-900'>
              <div className='relative'>
                <img
                  className='w-full object-cover object-center h-[calc(95vh)]'
                  src={'https://exoplanets.nasa.gov' + planet.image}
                  alt='blog'
                />
                <div className='z-10 w-full flex items-center justify-center absolute -bottom-40'>
                  <div className='shadow-xl rounded-full w-80 h-80 overflow-hidden bg-black border-2 border-slate-800 bg-opacity-50'>
                    <PlanetView planet={planet} />
                  </div>
                </div>
              </div>
            </div>
            <h1
              className='text-white glow lettering uppercase font-light text-center w-full 
        text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-8xl mt-44'
            >
              {planet.display_name}
            </h1>
            <h2
              className='text-center w-full text-cyan-500
            text-xl md:text-2xl lg:text-3xl xl:text-3xl 2xl:text-4xl italic'
            >
              {planet.subtitle}
            </h2>
          </header>
          <div className='px-4 bg-black h-full w-full py-8 bg-opacity-50'>
            <div className='mb-14'>
              <article
                className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5
             h-full w-full rounded-lg overflow-hidden'
              >
                <div className='bg-gradient-to-b from-cyan-500 to-green-500 p-1 rounded-lg xl:col-span-1 2xl:col-span-1'>
                  <div className='bg-black rounded-lg h-full'>
                    <p className='text-lg lg:text-lg xl:text-xl italic text-slate-400 p-4'>
                      {planet.description}
                    </p>
                    <div className='grid items-center grid-cols-1 justify-items-stretch fluid-button-bar gap-4 my-4 mx-4'>
                      <Button
                        href='/reviews/create'
                        outline={true}
                        onClick={openCreateReviewModal}
                        gradientDuoTone='pinkToOrange'
                        size='xl'
                      >
                        <MdOutlineRateReview className='text-xl group-hover:animate-bounce_x transition-all' />
                        Write a Review
                      </Button>
                      <Button
                        onClick={openLinkNewTab}
                        href={'https://exoplanets.nasa.gov' + planet.url}
                        outline={true}
                        gradientDuoTone='cyanToBlue'
                        size='xl'
                      >
                        <BiPlanet className='text-xl group-hover:animate-spin3d transition-all' />
                        Exoplanet Archives
                      </Button>
                    </div>
                  </div>
                </div>
                <div className='w-full bg-gradient-to-b from-cyan-500 to-green-500 p-1 rounded-lg xl:col-span-1 2xl:col-span-1  overflow-hidden'>
                  <div className='bg-black rounded-lg overflow-hidden h-full'>
                    <PlanetTable planet={planet} />
                  </div>
                </div>
                <div className='bg-gradient-to-b from-cyan-500 to-green-500 p-1 rounded-lg overflow-hidden md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2'>
                  <div className='bg-black rounded-lg overflow-hidden h-full p-2'>
                    <h2
                      className='text-center w-full text-cyan-500
            text-xl md:text-2xl lg:text-3xl xl:text-3xl 2xl:text-4xl italic'
                    >
                      Planet Reviews
                    </h2>
                    <ReviewsComponent planet_id={planet_id} ref={childRef} />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
//
const PlanetTable = (props) => {
  const tableRow = AppData.planetFields.map((field) => {
    return (
      <Table.Row key={field.id}>
        <Table.Cell className='whitespace-nowrap text-sm text-slate-300 font-bold'>
          <a
            title={field.description}
            href={field.link}
            className='hover:text-cyan-500'
            target='_blank'
          >
            {field.label}
            <TiInfoLarge className='inline -mt-3' size={14} />
          </a>
        </Table.Cell>
        <Table.Cell className='text-sm text-cyan-400 font-medium'>
          <span className='text-ellipsis'>{props.planet[field.id]}</span>
        </Table.Cell>
      </Table.Row>
    );
  });
  //console.log("tableRow", tableRow);
  return (
    <Table className='w-full bg-black'>
      <Table.Head>
        <Table.HeadCell className='text-white'>Planet Property</Table.HeadCell>
        <Table.HeadCell className='text-white'>Value</Table.HeadCell>
      </Table.Head>
      <Table.Body className='divide-y'>{tableRow}</Table.Body>
    </Table>
  );
};
