/**
 * ReviewCard Component
 * Displays a single review with author, rating, and content
 */

import type { PlanetReview } from '../../types';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: PlanetReview;
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ReviewCard({ review }: ReviewCardProps) {
  const author = review.author;

  return (
    <article className="review-card">
      <header className="review-header">
        <img
          className="review-avatar"
          src={author?.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${review.userid}`}
          alt={`${author?.name || 'Unknown'}'s avatar`}
        />
        <div className="review-author-info">
          <span className="review-author-name">{author?.name || 'Unknown Traveler'}</span>
          <time className="review-date">{formatDate(review.date)}</time>
        </div>
      </header>

      <div className="review-rating-row">
        <StarRating rating={review.rate} readonly size="sm" />
        <h3 className="review-title">{review.title}</h3>
      </div>

      <p className="review-text">{review.text}</p>
    </article>
  );
}

export default ReviewCard;
