/**
 * UserPrompt Component
 * Modal to prompt for authentication before writing a review
 * Supports Google sign-in or anonymous (guest) sign-in
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

interface UserPromptProps {
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function UserPrompt({ onSubmit, onClose }: UserPromptProps) {
  const { t } = useTranslation();
  const { signInWithGoogle, signInAnonymously, isConfigured } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setError('Firebase is not configured. Please use guest sign-in.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await signInWithGoogle();
      onClose(); // Close modal, auth state will be picked up by Reviews component
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
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

    if (isConfigured) {
      // Use Firebase anonymous auth
      try {
        setIsLoading(true);
        setError('');
        await signInAnonymously(trimmedName);
        onClose();
      } catch (err) {
        console.error('Anonymous sign-in failed:', err);
        // Fallback to local-only user
        onSubmit(trimmedName);
      } finally {
        setIsLoading(false);
      }
    } else {
      // No Firebase, use local user
      onSubmit(trimmedName);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="user-prompt-overlay" onClick={handleBackdropClick}>
      <div className="user-prompt-modal">
        <button
          className="user-prompt-close"
          onClick={onClose}
          aria-label="Close"
          disabled={isLoading}
        >
          &times;
        </button>

        <h2 className="user-prompt-title">
          {t('pages.planet.info.reviews.userPrompt.title')}
        </h2>
        <p className="user-prompt-subtitle">
          {t('pages.planet.info.reviews.userPrompt.subtitle')}
        </p>

        {/* Google Sign-in Button */}
        {isConfigured && (
          <>
            <button
              type="button"
              className="user-prompt-google"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="user-prompt-divider">
              <span>or</span>
            </div>
          </>
        )}

        {/* Guest Sign-in Form */}
        <form onSubmit={handleGuestSubmit} className="user-prompt-form">
          <input
            type="text"
            className="user-prompt-input"
            placeholder={t('pages.planet.info.reviews.userPrompt.placeholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            autoFocus={!isConfigured}
            maxLength={30}
            disabled={isLoading}
          />

          {error && <span className="user-prompt-error">{error}</span>}

          <button
            type="submit"
            className="user-prompt-submit"
            disabled={name.trim().length < 2 || isLoading}
          >
            {isLoading
              ? 'Signing in...'
              : t('pages.planet.info.reviews.userPrompt.continue', {
                  name: name.trim() || '...',
                })}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserPrompt;
