/* 
SNATCHED FROM: https://www.coltborg.com/style-a-blockquote-using-tailwind-css/ 
very cool accessibility points btw
*/

import React from 'react';

const Quote = () => (
  <blockquote className='relative p-4 text-xl italic border-l-4 bg-slate-900 text-slate-300 border-slate-700 quote bg-opacity-50'>
    <div className='stylistic-quote-mark' aria-hidden='true'>
      &ldquo;
    </div>
    <p className='mb-4'>
      On average, it is estimated that there is at least one planet for every
      star in the galaxy. That means there's something on the order of billions
      of planets in our galaxy alone, many in Earth's size range. These planets
      outside of our solar system are known as{' '}
      <strong className='rainbowText font-bold'>Exoplanets</strong>
    </p>
    <cite className='flex items-center'>
      <div className='flex flex-col items-start'>
        <span className='mb-1 text-sm italic font-bold'>
          exoplanets.nasa.gov
        </span>
        <a
          href='...'
          target='_blank'
          rel='noopener noreferrer'
          className='text-sm'
        ></a>
      </div>
    </cite>
  </blockquote>
);

export default Quote;
