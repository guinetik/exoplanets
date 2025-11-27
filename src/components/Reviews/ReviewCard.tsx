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
 * Handles ancient dates (negative timestamps) with fun formatting
 */
function formatDate(timestamp: number): string {
  const now = Date.now();
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsAgo = (now - timestamp) / msPerYear;

  // Ancient dates (more than 1000 years ago)
  if (yearsAgo > 1000) {
    const roundedYears = Math.round(yearsAgo);
    if (roundedYears >= 1000000) {
      return `~${(roundedYears / 1000000).toFixed(1)}M years ago`;
    } else if (roundedYears >= 1000) {
      return `~${(roundedYears / 1000).toFixed(1)}k years ago`;
    }
  }

  // Normal dates
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
