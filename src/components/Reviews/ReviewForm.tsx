/**
 * ReviewForm Component
 * Modal form to write and submit a review
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReviewUser } from '../../types';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  user: ReviewUser;
  onSubmit: (data: { rate: number; title: string; text: string }) => Promise<void>;
  onClose: () => void;
}

export function ReviewForm({ user, onSubmit, onClose }: ReviewFormProps) {
  const { t } = useTranslation();
  const [rate, setRate] = useState(4);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; text?: string }>({});

  const validate = (): boolean => {
    const newErrors: { title?: string; text?: string } = {};

    if (title.trim().length < 3) {
      newErrors.title = t('pages.planet.info.reviews.form.errorTitleMin');
    }

    if (text.trim().length < 10) {
      newErrors.text = t('pages.planet.info.reviews.form.errorTextMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        rate,
        title: title.trim(),
        text: text.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  return (
    <div className="review-form-overlay" onClick={handleBackdropClick}>
      <div className="review-form-modal">
        <button
          className="review-form-close"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="review-form-title">{t('pages.planet.info.reviews.form.title')}</h2>

        <div className="review-form-user">
          <img src={user.avatar} alt={user.name} className="review-form-avatar" />
          <span className="review-form-username">{user.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="review-form-field">
            <label className="review-form-label">
              {t('pages.planet.info.reviews.form.ratingLabel')}
            </label>
            <StarRating rating={rate} onChange={setRate} size="lg" />
          </div>

          <div className="review-form-field">
            <label htmlFor="review-title" className="review-form-label">
              {t('pages.planet.info.reviews.form.titleLabel')}
            </label>
            <input
              id="review-title"
              type="text"
              className={`review-form-input ${errors.title ? 'error' : ''}`}
              placeholder={t('pages.planet.info.reviews.form.titlePlaceholder')}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              disabled={submitting}
              maxLength={100}
            />
            {errors.title && <span className="review-form-error">{errors.title}</span>}
          </div>

          <div className="review-form-field">
            <label htmlFor="review-text" className="review-form-label">
              {t('pages.planet.info.reviews.form.textLabel')}
            </label>
            <textarea
              id="review-text"
              className={`review-form-textarea ${errors.text ? 'error' : ''}`}
              placeholder={t('pages.planet.info.reviews.form.textPlaceholder')}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (errors.text) setErrors({ ...errors, text: undefined });
              }}
              disabled={submitting}
              rows={4}
              maxLength={1000}
            />
            {errors.text && <span className="review-form-error">{errors.text}</span>}
          </div>

          <button
            type="submit"
            className="review-form-submit"
            disabled={submitting}
          >
            {submitting ? t('common.loading') : t('pages.planet.info.reviews.form.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReviewForm;
