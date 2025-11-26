import { Table } from 'flowbite-react';
import StarSystem from '../components/starsystem';
import AppData from '../data/app.data';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TiInfoLarge } from 'react-icons/ti';
export default function Star() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const params = useParams();
  const starId = params.star_id;
  //console.log("starId", starId);
  const [star, setStar] = useState({});
  const [loading, setLoading] = useState(true);
  const [solarSystem, setSolarSystem] = useState(null);
  useEffect(() => {
    async function fetchData() {
      const currentStar = AppData.getStar(starId);
      if (currentStar) {
        setStar(currentStar);
        //console.log("star", star);
        if (star.displayName) {
          setSolarSystem(AppData.generateSolarSystem(star));
          //console.log("AppSolarSystem", AppStates.solarSystem);
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [star]);
  return (
    <div className='w-full flex justify-center items-center'>
      {!loading && (
        <section className='w-full h-full m-auto'>
          <h1 className='text-white glow lettering uppercase font-light px-2 mb-8 text-center w-full text-3xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-6xl'>
            {star.displayName}
          </h1>
          {star ? (
            <div className='w-full h-full p-4 gap-4'>
              <div
                className='col-span-1 xl:col-span-3 2xl:col-span-3
                h-[calc(50vh)]
                xl:h-[calc(100vh-15rem)]
            rounded-lg bg-gradient-to-tr p-0.5 from-cyan-300 to-fuchsia-500'
              >
                <div className='w-full h-full relative'>
                  {solarSystem && (
                    <StarSystem planets={solarSystem} star={AppData.star} />
                  )}
                </div>
              </div>
              <div
                className='col-span-1 xl:col-span-2 2xl:col-span-2 overflow-hidden mt-10
              h-full rounded-lg bg-gradient-to-tr p-0.5 from-cyan-300 to-fuchsia-500'
              >
                <StarTable star={star} />
              </div>
            </div>
          ) : (
            ''
          )}
        </section>
      )}
    </div>
  );
}

const StarTable = (props) => {
  const tableRow = AppData.stellarFields.map((field) => {
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
          {props.star[field.id]}
        </Table.Cell>
      </Table.Row>
    );
  });
  //console.log("tableRow", tableRow);
  return (
    <Table className='w-full bg-black'>
      <Table.Head>
        <Table.HeadCell className='text-white'>Stelar Property</Table.HeadCell>
        <Table.HeadCell className='text-white'>Value</Table.HeadCell>
      </Table.Head>
      <Table.Body className='divide-y'>{tableRow}</Table.Body>
    </Table>
  );
};
