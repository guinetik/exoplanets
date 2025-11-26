import AppData from '../data/app.data';
import { useState, useEffect } from 'react';
import { FcNext, FcPrevious } from 'react-icons/fc';
import { Button } from 'flowbite-react';
import FirebaseData from '../data/db';

export default function Apod() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const d = new Date();
  d.setHours(12, 0, 0);
  const [apodDate, setApodDate] = useState(d);
  const [nextEnabled, setNextEnabled] = useState(false);
  const today = AppData.getFormattedDate(d);
  const [apod, setApod] = useState(null);

  const isYouTubeUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const isVideo = (url) => {
    return url.match(/\.(mp4|webm|ogg)$/i) || isYouTubeUrl(url);
  };

  const renderMedia = () => {
    if (!apod) return null;

    if (isYouTubeUrl(apod.url)) {
      return (
        <div className='relative w-full h-0 pb-[56.25%]'>
          <iframe
            className='absolute top-0 left-0 w-full h-full'
            src={getYouTubeEmbedUrl(apod.url)}
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
            title={apod.title}
          />
        </div>
      );
    } else if (isVideo(apod.url)) {
      return (
        <video
          className='w-full h-auto max-h-[80vh]'
          controls
          autoPlay
          muted
          loop
        >
          <source src={apod.url} type={`video/${apod.url.split('.').pop()}`} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <a
          href={apod.hdurl || apod.url}
          target='_blank'
          rel='noopener noreferrer'
        >
          <img
            className='object-cover w-full h-full object-bottom'
            src={apod.url}
            alt={apod.title}
          />
        </a>
      );
    }
  };

  const doLoadPreviousDay = (e) => {
    if (e) e.preventDefault();
    const newDate = new Date(apodDate);
    newDate.setDate(newDate.getDate() - 1);
    setApodDate(newDate);
    setNextEnabled(true);
    fetchData(newDate);
  };

  const doLoadNextDay = (e) => {
    e.preventDefault();
    if (nextEnabled) {
      const newDate = new Date(apodDate);
      newDate.setDate(newDate.getDate() + 1);
      setApodDate(newDate);
      setNextEnabled(AppData.getFormattedDate(newDate) !== today);
      fetchData(newDate);
    }
  };

  async function fetchData(date = apodDate) {
    const dateString = AppData.getFormattedDate(date);
    const apodResponse = await AppData.loadAstronomyPictureOfTheDay(dateString);

    if (apodResponse.error) {
      FirebaseData.messageHandler(apodResponse.error.message);
      return;
    }
    if (apodResponse.code) {
      FirebaseData.messageHandler(apodResponse.msg);
      if (apodResponse.code === 404) {
        doLoadPreviousDay();
      }
      return;
    }
    setApod(apodResponse);
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className='w-full min-h-[calc(100vh-4rem)] flex flex-col items-center py-4 px-4'>
      <div className='w-full max-w-3xl'>
        <h1 className='text-white glow lettering uppercase font-light mb-6 text-center text-3xl md:text-4xl'>
          Astronomy Picture of the Day
        </h1>

        {!apod && (
          <div className='flex justify-center items-center py-16'>
            <h1 className='text-xl lettering glow uppercase text-white'>
              Loading...
            </h1>
          </div>
        )}

        {apod && (
          <div className='w-full space-y-6'>
            {/* Media Section */}
            <div className='w-full rounded-xl bg-gradient-to-b p-1 from-teal-500 to-purple-900'>
              <figure className='w-full relative overflow-hidden rounded-lg'>
                {renderMedia()}
                {apod.copyright && (
                  <footer className='py-2 px-3 bg-slate-800 text-xs text-white font-mono absolute bottom-0 right-0 left-0 rounded-b-lg bg-opacity-80'>
                    <aside>© {apod.copyright}</aside>
                  </footer>
                )}
              </figure>
            </div>

            {/* Content Section */}
            <div className='w-full rounded-lg bg-black bg-opacity-80 p-4 border border-slate-600'>
              <h2 className='lettering mb-3 leading-tight text-cyan-200 text-xl md:text-2xl'>
                {apod.date}: <strong>{apod.title}</strong>
              </h2>
              <p className='font-light text-sm md:text-base italic text-slate-300 leading-relaxed'>
                {apod.explanation}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className='flex justify-center gap-2 mt-4'>
              <Button
                onClick={doLoadPreviousDay}
                outline={true}
                gradientDuoTone='purpleToBlue'
                size='xl'
                className='px-4 py-2'
              >
                <FcPrevious className='text-xl group-hover:animate-bounce_x transition-all' />
                <span className='ml-2'>Yesterday</span>
              </Button>
              <Button
                disabled={!nextEnabled}
                onClick={doLoadNextDay}
                outline={true}
                gradientDuoTone='purpleToBlue'
                size='xl'
                className='px-4 py-2'
              >
                <span className='mr-2'>Tomorrow</span>
                <FcNext className='text-xl group-hover:animate-bounce_x transition-all' />
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
