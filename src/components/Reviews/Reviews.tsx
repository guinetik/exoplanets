/**
 * Reviews Component
 * Main container for planet reviews
 * Supports Firebase auth and local user fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlanetReview, ReviewUser } from '../../types';
import { reviewService } from '../../services/reviewService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { UserPrompt } from './UserPrompt';

interface ReviewsProps {
  planetId: string;
}

export function Reviews({ planetId }: ReviewsProps) {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<PlanetReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUserPrompt, setShowUserPrompt] = useState(false);
  const [localUser, setLocalUser] = useState<ReviewUser | null>(null);

  // Current user is either Firebase profile or local user
  const currentUser = profile || localUser;

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

  // Check for existing local user on mount (fallback when Firebase not configured)
  useEffect(() => {
    const user = userService.getUser();
    if (user) {
      setLocalUser(user);
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

  // Handle user creation from prompt (local fallback)
  const handleUserCreate = (name: string) => {
    const user = userService.createUser(name);
    setLocalUser(user);
    setShowUserPrompt(false);
    setShowForm(true);
  };

  // Handle closing user prompt (Firebase auth was successful)
  const handleUserPromptClose = () => {
    setShowUserPrompt(false);
    // If user is now authenticated via Firebase, show the form
    if (profile) {
      setShowForm(true);
    }
  };

  // Handle review submission
  const handleSubmitReview = async (data: {
    rate: number;
    title: string;
    text: string;
  }) => {
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

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="reviews-section">
        <div className="reviews-loading">Loading...</div>
      </div>
    );
  }

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
          onClose={handleUserPromptClose}
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
