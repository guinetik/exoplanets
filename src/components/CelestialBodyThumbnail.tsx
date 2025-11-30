/**
 * CelestialBodyThumbnail Component
 * Renders shader-accurate thumbnails for planets and stars
 * Uses Firebase Storage for caching across all users
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Exoplanet, Star } from '../types';
import { thumbnailService } from '../services/thumbnailService';
import { isFirebaseConfigured } from '../services/firebase';
import { renderPlanetToBlob, renderStarToBlob } from '../utils/offscreenRenderer';

interface PlanetThumbnailProps {
  /** Planet data */
  planet: Exoplanet;
  /** Display size in pixels */
  size?: number;
  /** CSS class name */
  className?: string;
}

interface StarThumbnailProps {
  /** Star data */
  star: Star;
  /** Display size in pixels */
  size?: number;
  /** CSS class name */
  className?: string;
}

type ThumbnailState = 'loading' | 'loaded' | 'generating' | 'error';

/**
 * Get a simple placeholder color based on planet type
 */
function getPlanetPlaceholderColor(planetType: string | null): string {
  const colors: Record<string, string> = {
    'Gas Giant': '#d4a854',
    'Neptune-like': '#3b8fd9',
    'Sub-Neptune': '#4eb8e0',
    'Super-Earth': '#b5885a',
    'Earth-sized': '#5a9668',
    'Sub-Earth': '#c4623a',
    'Terrestrial': '#d9a050',
  };
  return colors[planetType || 'Terrestrial'] || '#888888';
}

/**
 * Get star color from temperature (simplified)
 */
function getStarPlaceholderColor(temperature: number | null): string {
  const temp = temperature || 5778;
  if (temp < 3500) return '#ff6b35';
  if (temp < 5000) return '#ffa44f';
  if (temp < 6500) return '#fff4e0';
  if (temp < 10000) return '#f0f4ff';
  return '#a8c8ff';
}

/**
 * Placeholder component shown while thumbnail is loading/generating
 */
function ThumbnailPlaceholder({
  size,
  color,
  isGenerating,
  type,
}: {
  size: number;
  color: string;
  isGenerating: boolean;
  type: 'planet' | 'star';
}) {
  return (
    <div
      className="celestial-thumbnail-placeholder"
      style={{
        width: size,
        height: size,
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        position: 'relative',
      }}
    >
      {/* Colored circle placeholder */}
      <div
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: type === 'star' 
            ? `0 0 ${size * 0.3}px ${color}, 0 0 ${size * 0.5}px ${color}40`
            : `0 0 ${size * 0.15}px ${color}40`,
          animation: isGenerating ? 'pulse 1.5s ease-in-out infinite' : undefined,
        }}
      />
      
      {/* Loading indicator overlay */}
      {isGenerating && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.3,
            height: size * 0.3,
            border: `2px solid ${color}40`,
            borderTopColor: color,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
    </div>
  );
}

/**
 * Hook to manage thumbnail loading and generation
 */
function useThumbnail(
  name: string,
  type: 'planet' | 'star',
  generateFn: () => Promise<Blob>,
  isVisible: boolean
) {
  const [state, setState] = useState<ThumbnailState>('loading');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const loadThumbnail = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      // Check memory cache first
      const cached = thumbnailService.getCachedUrl(name, type);
      if (cached) {
        setImageUrl(cached);
        setState('loaded');
        return;
      }

      // Check if Firebase is configured
      if (!isFirebaseConfigured()) {
        // Generate locally but don't upload
        setState('generating');
        try {
          const blob = await generateFn();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setState('loaded');
        } catch {
          setState('error');
        }
        return;
      }

      // Check Firebase Storage
      setState('loading');
      const firebaseUrl = await thumbnailService.getThumbnailUrl(name, type);
      
      if (firebaseUrl) {
        setImageUrl(firebaseUrl);
        setState('loaded');
        return;
      }

      // Check if someone else is already generating this thumbnail
      if (thumbnailService.isGenerating(name, type)) {
        setState('generating');
        const url = await thumbnailService.waitForGeneration(name, type);
        if (url) {
          setImageUrl(url);
          setState('loaded');
        } else {
          setState('error');
        }
        return;
      }

      // We need to generate and upload
      setState('generating');
      thumbnailService.markGenerating(name, type);

      try {
        const blob = await generateFn();
        const uploadedUrl = await thumbnailService.uploadThumbnail(name, type, blob);
        setImageUrl(uploadedUrl);
        setState('loaded');
        thumbnailService.markGenerationComplete(name, type, uploadedUrl);
      } catch (error) {
        console.error(`Failed to generate thumbnail for ${name}:`, error);
        setState('error');
        thumbnailService.markGenerationComplete(name, type, null);
      }
    } catch (error) {
      console.error(`Thumbnail error for ${name}:`, error);
      setState('error');
    }
  }, [name, type, generateFn]);

  useEffect(() => {
    if (isVisible && !hasStartedRef.current) {
      loadThumbnail();
    }
  }, [isVisible, loadThumbnail]);

  return { state, imageUrl };
}

/**
 * Planet Thumbnail Component
 * Renders a shader-accurate thumbnail for a planet
 */
export function PlanetThumbnail({ planet, size = 64, className }: PlanetThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer to detect visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Start loading slightly before visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const generateFn = useCallback(
    () => renderPlanetToBlob(planet),
    [planet]
  );

  const { state, imageUrl } = useThumbnail(
    planet.pl_name,
    'planet',
    generateFn,
    isVisible
  );

  const placeholderColor = getPlanetPlaceholderColor(planet.planet_type);

  return (
    <div
      ref={containerRef}
      className={`celestial-thumbnail ${className || ''}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {state === 'loaded' && imageUrl ? (
        <img
          src={imageUrl}
          alt={planet.pl_name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <ThumbnailPlaceholder
          size={size}
          color={placeholderColor}
          isGenerating={state === 'generating'}
          type="planet"
        />
      )}
    </div>
  );
}

/**
 * Star Thumbnail Component
 * Renders a glowing star thumbnail
 */
export function StarThumbnail({ star, size = 64, className }: StarThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const generateFn = useCallback(
    () => renderStarToBlob(star.st_teff || 5778, star.hostname, star.st_spectype ?? undefined),
    [star.st_teff, star.hostname, star.st_spectype]
  );

  const { state, imageUrl } = useThumbnail(
    star.hostname,
    'star',
    generateFn,
    isVisible
  );

  const placeholderColor = getStarPlaceholderColor(star.st_teff);

  return (
    <div
      ref={containerRef}
      className={`celestial-thumbnail ${className || ''}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {state === 'loaded' && imageUrl ? (
        <img
          src={imageUrl}
          alt={star.hostname}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <ThumbnailPlaceholder
          size={size}
          color={placeholderColor}
          isGenerating={state === 'generating'}
          type="star"
        />
      )}
    </div>
  );
}

// Add CSS for animations
if (typeof document !== 'undefined') {
  const styleId = 'celestial-thumbnail-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      @keyframes spin {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default {
  PlanetThumbnail,
  StarThumbnail,
};

