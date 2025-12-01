/**
 * Astronomy Picture of the Day (APOD) Page Component
 * Displays NASA's daily astronomy picture with navigation between dates
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apodService } from '../services';
import SEO from '../components/SEO';
import { getAPODSEO } from '../utils/seo';
import type { ApodData } from '../types';

/**
 * APOD Page Component
 * Fetches and displays NASA's Astronomy Picture of the Day
 * with date navigation support
 */
export default function Apod() {
  const { t } = useTranslation();

  // Initialize with today's date at noon to avoid timezone issues
  const getInitialDate = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const [apodDate, setApodDate] = useState<Date>(getInitialDate);
  const [apod, setApod] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextEnabled, setNextEnabled] = useState(false);

  const today = apodService.formatDate(getInitialDate());

  /**
   * Fetches APOD data for the specified date
   */
  const fetchApod = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);

    const dateString = apodService.formatDate(date);
    const response = await apodService.fetchApod(dateString);

    if (response.error) {
      // If 404 (no image for date), try previous day
      if (response.code === 404) {
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        setApodDate(prevDate);
        fetchApod(prevDate);
        return;
      }
      setError(response.message);
      setLoading(false);
      return;
    }

    setApod(response.data);
    setLoading(false);
  }, []);

  /**
   * Navigates to the previous day's APOD
   */
  const handlePreviousDay = useCallback(() => {
    const newDate = new Date(apodDate);
    newDate.setDate(newDate.getDate() - 1);
    setApodDate(newDate);
    setNextEnabled(true);
    fetchApod(newDate);
  }, [apodDate, fetchApod]);

  /**
   * Navigates to the next day's APOD
   */
  const handleNextDay = useCallback(() => {
    if (!nextEnabled) return;

    const newDate = new Date(apodDate);
    newDate.setDate(newDate.getDate() + 1);
    setApodDate(newDate);
    setNextEnabled(apodService.formatDate(newDate) !== today);
    fetchApod(newDate);
  }, [apodDate, nextEnabled, today, fetchApod]);

  // Initial fetch
  useEffect(() => {
    fetchApod(apodDate);
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Renders the media content (image, video, or YouTube embed)
   */
  const renderMedia = () => {
    if (!apod) return null;

    const mediaType = apodService.getMediaType(apod.url, apod.mediaType);

    switch (mediaType) {
      case 'youtube':
        return (
          <div className="apod-video-container">
            <iframe
              className="apod-iframe"
              src={apodService.getYouTubeEmbedUrl(apod.url)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={apod.title}
            />
          </div>
        );

      case 'video':
        return (
          <video
            className="apod-video"
            controls
            autoPlay
            muted
            loop
          >
            <source src={apod.url} type={`video/${apod.url.split('.').pop()}`} />
            {t('pages.apod.videoNotSupported')}
          </video>
        );

      default:
        return (
          <a
            href={apod.hdurl || apod.url}
            target="_blank"
            rel="noopener noreferrer"
            title={t('pages.apod.viewFullSize')}
          >
            <img
              className="apod-image"
              src={apod.url}
              alt={apod.title}
            />
          </a>
        );
    }
  };

  const seoData = getAPODSEO();

  return (
    <>
      <SEO {...seoData} />
      <div className="page-container">
        <h1 className="page-title">{t('pages.apod.title')}</h1>

        {/* Loading State */}
        {loading && (
          <div className="apod-loading">
            <div className="apod-loading-spinner" />
            <p className="apod-loading-text">{t('pages.apod.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="apod-error">
            <p className="apod-error-text">{t('pages.apod.error')}</p>
            <p className="apod-error-detail">{error}</p>
          </div>
        )}

        {/* Content */}
        {apod && !loading && (
          <div className="apod-content">
            {/* Media Section */}
            <div className="apod-media-wrapper">
              <figure className="apod-figure">
                {renderMedia()}
                {apod.copyright && (
                  <figcaption className="apod-copyright">
                    © {apod.copyright}
                  </figcaption>
                )}
              </figure>
            </div>

            {/* Info Section */}
            <div className="apod-info">
              <h2 className="apod-info-title">
                <span className="apod-date">{apod.date}</span>
                <span className="apod-name">{apod.title}</span>
              </h2>
              <p className="apod-explanation">{apod.explanation}</p>
            </div>

            {/* Navigation */}
            <div className="apod-navigation">
              <button
                onClick={handlePreviousDay}
                className="apod-nav-button"
              >
                <ChevronLeftIcon />
                <span>{t('pages.apod.yesterday')}</span>
              </button>
              <button
                onClick={handleNextDay}
                disabled={!nextEnabled}
                className="apod-nav-button"
              >
                <span>{t('pages.apod.tomorrow')}</span>
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Chevron Left Icon Component
 */
function ChevronLeftIcon() {
  return (
    <svg
      className="apod-nav-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

/**
 * Chevron Right Icon Component
 */
function ChevronRightIcon() {
  return (
    <svg
      className="apod-nav-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
