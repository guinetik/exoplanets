import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Starfield } from '../components/Starfield';
import SEO from '../components/SEO';
import { getHomeSEO } from '../utils/seo';
import type { Star } from '../types';
import { nameToSlug } from '../utils/urlSlug';

export default function Home() {
  const { getAllStars } = useData();
  const navigate = useNavigate();
  const stars = getAllStars();

  const handleStarClick = useCallback(
    (star: Star) => {
      navigate(`/stars/${nameToSlug(star.hostname)}`);
    },
    [navigate]
  );

  const seoData = getHomeSEO();

  return (
    <>
      <SEO {...seoData} />
      <Starfield stars={stars} onStarClick={handleStarClick} />
    </>
  );
}
