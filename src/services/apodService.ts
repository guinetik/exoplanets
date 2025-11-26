/**
 * NASA Astronomy Picture of the Day (APOD) Service
 * Fetches and manages APOD data from NASA's API
 */

import type { ApodResponse } from '../types';

/** NASA API key for APOD requests */
const NASA_API_KEY = 'buEpNbTXwpkoPmCnvOBpGbDZgr5x5JgdmPoD8sfQ';

/** NASA APOD API base URL */
const APOD_BASE_URL = 'https://api.nasa.gov/planetary/apod';

/**
 * APOD Service class for handling NASA's Astronomy Picture of the Day API
 */
class ApodService {
  /**
   * Formats a Date object to YYYY-MM-DD string format
   * @param date - The date to format
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Fetches the Astronomy Picture of the Day for a specific date
   * @param date - Optional date string in YYYY-MM-DD format. Defaults to today.
   * @returns Promise resolving to APOD data or error response
   */
  async fetchApod(date?: string): Promise<ApodResponse> {
    const queryDate = date ?? this.formatDate(new Date());
    
    try {
      const response = await fetch(
        `${APOD_BASE_URL}?api_key=${NASA_API_KEY}&date=${queryDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: true,
          code: response.status,
          message: errorData.msg || errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      
      // Check for API-level errors
      if (data.code || data.error) {
        return {
          error: true,
          code: data.code || 500,
          message: data.msg || data.error?.message || 'Unknown error',
        };
      }

      return {
        error: false,
        data: {
          title: data.title,
          explanation: data.explanation,
          url: data.url,
          hdurl: data.hdurl,
          date: data.date,
          copyright: data.copyright,
          mediaType: data.media_type,
        },
      };
    } catch (err) {
      return {
        error: true,
        code: 500,
        message: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  /**
   * Checks if a URL is a YouTube video
   * @param url - The URL to check
   * @returns True if the URL is a YouTube video
   */
  isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  /**
   * Converts a YouTube URL to an embeddable format
   * @param url - The YouTube URL to convert
   * @returns Embeddable YouTube URL
   */
  getYouTubeEmbedUrl(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  /**
   * Checks if a URL is a video (including YouTube)
   * @param url - The URL to check
   * @returns True if the URL is a video
   */
  isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url) || this.isYouTubeUrl(url);
  }

  /**
   * Gets the media type for a given URL
   * @param url - The URL to check
   * @param mediaType - Optional media type from API
   * @returns 'youtube' | 'video' | 'image'
   */
  getMediaType(url: string, mediaType?: string): 'youtube' | 'video' | 'image' {
    if (this.isYouTubeUrl(url)) return 'youtube';
    if (mediaType === 'video' || this.isVideo(url)) return 'video';
    return 'image';
  }
}

/** Singleton instance of ApodService */
export const apodService = new ApodService();

