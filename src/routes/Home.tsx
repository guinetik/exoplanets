import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Starfield } from '../components/Starfield';
import type { Star } from '../types';

export default function Home() {
  const { getAllStars } = useData();
  const navigate = useNavigate();
  const stars = getAllStars();

  const handleStarClick = useCallback(
    (star: Star) => {
      navigate(`/stars/${encodeURIComponent(star.hostname)}`);
    },
    [navigate]
  );

  return <Starfield stars={stars} onStarClick={handleStarClick} />;
}
