/**
 * UserPrompt Component
 * Modal to prompt for username before writing a review
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UserPromptProps {
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function UserPrompt({ onSubmit, onClose }: UserPromptProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(t('pages.planet.info.reviews.userPrompt.errorMinLength'));
      return;
    }

    if (trimmedName.length > 30) {
      setError(t('pages.planet.info.reviews.userPrompt.errorMaxLength'));
      return;
    }

    onSubmit(trimmedName);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="user-prompt-overlay" onClick={handleBackdropClick}>
      <div className="user-prompt-modal">
        <button className="user-prompt-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2 className="user-prompt-title">{t('pages.planet.info.reviews.userPrompt.title')}</h2>
        <p className="user-prompt-subtitle">{t('pages.planet.info.reviews.userPrompt.subtitle')}</p>

        <form onSubmit={handleSubmit} className="user-prompt-form">
          <input
            type="text"
            className="user-prompt-input"
            placeholder={t('pages.planet.info.reviews.userPrompt.placeholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            autoFocus
            maxLength={30}
          />

          {error && <span className="user-prompt-error">{error}</span>}

          <button
            type="submit"
            className="user-prompt-submit"
            disabled={name.trim().length < 2}
          >
            {t('pages.planet.info.reviews.userPrompt.continue', { name: name.trim() || '...' })}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserPrompt;
