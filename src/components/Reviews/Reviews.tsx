/**
 * Reviews Component
 * Main container for planet reviews
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlanetReview, ReviewUser } from '../../types';
import { reviewService } from '../../services/reviewService';
import { userService } from '../../services/userService';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { UserPrompt } from './UserPrompt';

interface ReviewsProps {
  planetId: string;
}

export function Reviews({ planetId }: ReviewsProps) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<PlanetReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUserPrompt, setShowUserPrompt] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReviewUser | null>(null);

  // Load reviews on mount
  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewService.getReviews(planetId);
      setReviews(data);
    } finally {
      setLoading(false);
    }
  }, [planetId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Check for existing user on mount
  useEffect(() => {
    const user = userService.getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Handle write review click
  const handleWriteReview = () => {
    if (currentUser) {
      setShowForm(true);
    } else {
      setShowUserPrompt(true);
    }
  };

  // Handle user creation from prompt
  const handleUserCreate = (name: string) => {
    const user = userService.createUser(name);
    setCurrentUser(user);
    setShowUserPrompt(false);
    setShowForm(true);
  };

  // Handle review submission
  const handleSubmitReview = async (data: { rate: number; title: string; text: string }) => {
    if (!currentUser) return;

    await reviewService.createReview(
      {
        planet: planetId,
        userid: currentUser.uid,
        rate: data.rate,
        title: data.title,
        text: data.text,
      },
      currentUser
    );

    setShowForm(false);
    await loadReviews();
  };

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <button className="reviews-write-button" onClick={handleWriteReview}>
          {t('pages.planet.info.reviews.writeReview')}
        </button>
      </div>

      <ReviewList reviews={reviews} loading={loading} />

      {showUserPrompt && (
        <UserPrompt
          onSubmit={handleUserCreate}
          onClose={() => setShowUserPrompt(false)}
        />
      )}

      {showForm && currentUser && (
        <ReviewForm
          user={currentUser}
          onSubmit={handleSubmitReview}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default Reviews;
