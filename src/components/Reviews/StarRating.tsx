/**
 * StarRating Component
 * Displays and/or allows selection of 1-5 star rating
 */

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const sizeClass = SIZES[size];

  const handleClick = (star: number) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  };

  const handleKeyDown = (star: number, e: React.KeyboardEvent) => {
    if (!readonly && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(star);
    }
  };

  return (
    <div className={`star-rating ${readonly ? 'star-rating-readonly' : 'star-rating-interactive'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-rating-star ${rating >= star ? 'filled' : 'empty'}`}
          onClick={() => handleClick(star)}
          onKeyDown={(e) => handleKeyDown(star, e)}
          disabled={readonly}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          tabIndex={readonly ? -1 : 0}
        >
          <svg
            className={sizeClass}
            fill={rating >= star ? '#faca15' : '#4b5563'}
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default StarRating;
