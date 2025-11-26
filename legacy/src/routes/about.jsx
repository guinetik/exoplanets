import { Button } from 'flowbite-react';
import { IoIosPlanet } from 'react-icons/io';
import { GrSolaris } from 'react-icons/gr';

export default function About() {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <main className='w-full min-h-[calc(100vh-4rem)] flex flex-col items-center'>
      <section className='w-full max-w-6xl px-4 md:px-8'>
        <h1 className='text-white glow lettering uppercase font-light px-2 mb-8 text-center text-3xl md:text-5xl lg:text-5xl xl:text-6xl'>
          About this Site
        </h1>
        <div className='w-full flex items-center justify-center px-4 md:px-8'>
          <div className='w-full'>
            <div className='w-full rounded-xl bg-gradient-to-b p-[5px] from-purple-800 to-fuchsia-500'>
              <div className='xl:flex'>
                <figure className='bg-slate-600 w-full relative overflow-hidden rounded-tl-xl lg:rounded-bl-none rounded-tr-lg xl:rounded-tr-none xl:rounded-bl-lg'>
                  <img
                    className='object-cover w-full h-full object-bottom'
                    src='https://exoplanets.nasa.gov/system/feature_items/images/465_HD260655b_1600x900.jpg'
                    alt='Rocky exoplanets'
                  />
                  <footer className='py-3 px-3 bg-slate-800 text-xs text-white font-mono absolute bottom-0 right-0 left-0 rounded-bl-lg bg-opacity-80 border-t-[1px] border-slate-900'>
                    <aside>Image: Rocky exoplanets</aside>
                  </footer>
                </figure>
                <section className='border-l-[1px] border-slate-500 p-4 space-y-3 w-full rounded-bl-lg rounded-br-lg xl:rounded-bl-none xl:rounded-tr-lg bg-black bg-opacity-80'>
                  <div className='place-self-center'>
                    <h1 className='w-full lettering mb-4 tracking-tight leading-none text-cyan-200 text-2xl sm:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl'>
                      Hi there 👋,
                    </h1>
                    <p className='w-full px-1 font-light md:text-lg lg:text-xl text-slate-300 mt-4 drop-shadow-md'>
                      This is{' '}
                      <a
                        href='https://guinetik.github.io/guinetik'
                        className='text-purple-400 hover:text-white'
                      >
                        Guinetik
                      </a>
                      , the creator of this site. This is a technology study on
                      frontend technologies. Some time ago I bookmarked the{' '}
                      <a
                        href='https://api.nasa.gov/'
                        className='text-purple-400 hover:text-white'
                      >
                        NASA APIs
                      </a>{' '}
                      site and never got to do anything with it. Then I heard
                      about Vite release and the new changes in React, so I
                      decided to try it using the NASA API as an inspiration.
                      <br />
                      The exoplanet data research is a fascinating topic to me
                      and the idea of having all that data available is a truly
                      wonderful thing. I recommend checking out these sites by
                      NASA to learn more about the discovery process:
                    </p>
                    <ul className='list-disc ml-6 mt-2 text-white'>
                      <li>
                        <a
                          className='text-purple-400 hover:text-white'
                          href='https://exoplanets.nasa.gov/eyes-on-exoplanets/'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Eyes on Exoplanets
                        </a>
                      </li>
                      <li>
                        <a
                          className='text-purple-400 hover:text-white'
                          href='https://exoplanets.nasa.gov/'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Exoplanets travel bureau
                        </a>
                      </li>
                      <li>
                        <a
                          className='text-purple-400 hover:text-white'
                          href='https://exoplanetarchive.ipac.caltech.edu/'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Exoplanets Archive
                        </a>
                      </li>
                    </ul>

                    <h2 className='w-full lettering tracking-tight leading-none text-cyan-200 text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl mt-4 ml-1'>
                      About the Data
                    </h2>
                    <p className='w-full px-1 font-light md:text-lg lg:text-xl text-slate-300 mt-4 drop-shadow-md'>
                      The data is from the NASA API. Initially I wanted to do
                      all API calls on the fly, but I was getting hit by NASA's
                      API limits, so I decided to make my own datasets based on
                      theirs. All the data extraction was done in a NodeJS
                      script, you can download the script{' '}
                      <a
                        href='https://github.com/guinetik/exoplanets-review/blob/master/data/exploration.js'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-purple-400 hover:text-white'
                      >
                        here
                      </a>
                      . If you want to explore the data, or maybe use it in your
                      Kaggle or other project, you can download it from here:
                    </p>
                    <ul className='list-disc ml-6 mt-2 text-white'>
                      {[
                        'https://raw.githubusercontent.com/guinetik/exoplanets-review/master/data/out/exoplanets.json',
                        'https://raw.githubusercontent.com/guinetik/exoplanets-review/master/data/out/exostars.json',
                        'https://raw.githubusercontent.com/guinetik/exoplanets-review/master/data/raw/planets.json',
                        'https://raw.githubusercontent.com/guinetik/exoplanets-review/master/data/raw/stars.json',
                        'https://github.com/guinetik/exoplanets-review/blob/master/data/raw/tess-planets.csv',
                      ].map((link, index) => (
                        <li key={index}>
                          <a
                            className='text-purple-400 hover:text-white'
                            href={link}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {link.split('/').pop()}
                          </a>
                        </li>
                      ))}
                    </ul>

                    <h2 className='w-full lettering tracking-tight leading-none text-cyan-200 text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl mt-4 ml-1'>
                      Libs Used
                    </h2>
                    <ul className='list-disc ml-6 mt-2 text-white'>
                      {[
                        {
                          name: 'React',
                          url: 'https://reactjs.org/',
                          desc: 'on the frontend',
                        },
                        {
                          name: 'Z-Dog',
                          url: 'https://zzz.dog/',
                          desc: 'for the pseudo-3d graphics',
                        },
                        {
                          name: 'Vite',
                          url: 'https://vitejs.dev/',
                          desc: 'as a build tool',
                        },
                        {
                          name: 'Tailwind CSS',
                          url: 'https://tailwindcss.com/',
                          desc: 'stylesheet',
                        },
                        {
                          name: 'Flowbite',
                          url: 'https://flowbite.com/',
                          desc: 'UI components',
                        },
                        {
                          name: 'Firebase',
                          url: 'https://firebase.google.com/',
                          desc: 'on the backend',
                        },
                      ].map((lib, index) => (
                        <li key={index}>
                          <a
                            className='text-purple-400 hover:text-white'
                            href={lib.url}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {lib.name}
                          </a>{' '}
                          {lib.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
