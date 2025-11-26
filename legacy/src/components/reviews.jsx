import '../data/types';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import FirebaseData from '../data/db';

const ReviewsComponent = forwardRef((props, ref) => {
  /**
   * @type {String} - The ID of the Planet
   */
  const planetId = props.planet_id;
  /**
   * @type {Array<PlanetReviews>}
   */
  const [reviews, setReviews] = useState(null);
  /**
   * Fetches all reviews for the planet and updates our reviews hook.
   * TODO: Make this subscribe to firebase to get auto updates and remove the imperative handler below.
   */
  async function fetchData() {
    FirebaseData.getReviews(planetId)
      .then((res) => {
        //console.log("ReviewsComponent.res:", res);
        setReviews(res);
      })
      .catch((err) => {
        console.log('err', err);
        FirebaseData.errorHandler(err.message);
      });
  }
  /**
   * Temporary imperative handler to refresh the reviews once a user has posted a new review.
   * TODO: Remove this once we have a subscription to the review collection.
   */
  useImperativeHandle(ref, () => ({
    refresh() {
      fetchData();
    },
  }));
  /**
   * Fetches the review when the screen loads
   */
  useEffect(() => {
    if (reviews == null) fetchData();
  }, [reviews]);
  /**
   * Renders the reviews in a component
   * @param {Array<PlanetReviews>} items - the reviews to display
   * @returns {JSX.Element} The reviews component with the reviews
   */
  const renderReviewCards = (items) => {
    //console.log("ReviewsComponent.renderReviewCards.items:", items);
    if (items) {
      // display reviews
      if (items.length > 0) {
        return items.map((review) => {
          return <ReviewCardComponent key={review.id} review={review} />;
        });
      } else {
        //no reviews
        return <div className='text-slate-400'>No reviews yet</div>;
      }
    } else {
      //loading
      return <div className='text-slate-500'>Loading...</div>;
    }
  };
  return (
    <div className='pl-2 pr-2 pt-1 w-full h-full bg-black rounded-lg'>
      <section className='grid grid-cols-1 gap-5 xl:overflow-y-scroll xl:max-h-[605px]'>
        {renderReviewCards(reviews)}
      </section>
    </div>
  );
});
/**
 * A component to render a review card.
 * @param {Object} props component props
 * @returns A functional component to render a review card
 */
const ReviewCardComponent = (props) => {
  /**
   * @type {PlanetReviews}
   */
  const review = props.review;
  console.log('ReviewCardComponent.review:', review);
  return (
    <article>
      <div className='flex items-center mb-2 space-x-4'>
        <img
          className='w-10 h-10 rounded-full'
          src={review.author?.avatar}
          alt='avatar'
        />
        <div className='space-y-1 font-medium text-teal-300 text-xl'>
          <p>
            {review.author.name}
            <time className='block text-sm text-teal-400'>
              {new Date(review.date).toLocaleDateString()}
            </time>
          </p>
        </div>
      </div>
      <div className='flex items-center mb-1'>
        <svg
          className='w-5 h-5'
          fill={review.rate >= 1 ? '#faca15' : '#EEEEEE'}
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'></path>
        </svg>
        <svg
          className='w-5 h-5'
          fill={review.rate >= 2 ? '#faca15' : '#EEEEEE'}
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'></path>
        </svg>
        <svg
          className='w-5 h-5'
          fill={review.rate >= 3 ? '#faca15' : '#EEEEEE'}
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'></path>
        </svg>
        <svg
          className='w-5 h-5'
          fill={review.rate >= 4 ? '#faca15' : '#EEEEEE'}
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'></path>
        </svg>
        <svg
          className='w-5 h-5'
          fill={review.rate >= 5 ? '#faca15' : '#EEEEEE'}
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'></path>
        </svg>
        <h3 className='ml-2 text-lh font-semibold text-yellow-300'>
          {review.title}
        </h3>
      </div>
      <p className='mb-2 font-light text-slate-200'>{review.text}</p>
    </article>
  );
};

export default ReviewsComponent;
