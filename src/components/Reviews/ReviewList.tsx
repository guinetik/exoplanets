/**
 * ReviewList Component
 * Displays a list of reviews or empty state
 */

import { useTranslation } from 'react-i18next';
import type { PlanetReview } from '../../types';
import { ReviewCard } from './ReviewCard';

interface ReviewListProps {
  reviews: PlanetReview[];
  loading?: boolean;
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="reviews-loading-spinner" />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        <p>{t('pages.planet.info.reviews.empty')}</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

export default ReviewList;
