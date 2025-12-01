/**
 * SEO Component
 * Manages meta tags for social media sharing (Open Graph, Twitter Cards) and SEO
 * Uses react-helmet-async for dynamic head tag management
 */

import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  /** Page title (appended to site name) */
  title?: string;
  /** Meta description */
  description?: string;
  /** Open Graph image URL (absolute URL recommended) */
  image?: string;
  /** Open Graph type (default: 'website') */
  type?: string;
  /** Canonical URL (absolute URL) */
  url?: string;
  /** Keywords for SEO */
  keywords?: string;
  /** Author name */
  author?: string;
  /** Twitter card type (default: 'summary_large_image') */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** Site name (default: 'Exoplanets') */
  siteName?: string;
  /** Locale (default: 'en_US') */
  locale?: string;
}

const DEFAULT_SITE_NAME = 'Exoplanets';
const DEFAULT_SITE_URL = 'https://exoplanets.guinetik.com';
const DEFAULT_OG_IMAGE = `${DEFAULT_SITE_URL}/images/og-default.png`;
const DEFAULT_DESCRIPTION = 'Exploring 6,000+ confirmed worlds beyond our solar system';
const DEFAULT_TITLE = 'Exoplanets';

/**
 * SEO component for managing meta tags
 * @param props - SEO configuration props
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  url,
  keywords,
  author = 'guinetik',
  twitterCard = 'summary_large_image',
  siteName = DEFAULT_SITE_NAME,
  locale = 'en_US',
}: SEOProps) {
  // Construct full title
  const fullTitle = title ? `${title} | ${DEFAULT_SITE_NAME}` : DEFAULT_TITLE;
  
  // Construct absolute URL
  const absoluteUrl = url ? (url.startsWith('http') ? url : `${DEFAULT_SITE_URL}${url}`) : DEFAULT_SITE_URL;
  
  // Construct absolute image URL
  const absoluteImageUrl = image.startsWith('http') ? image : `${DEFAULT_SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Standard SEO Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={absoluteUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />
    </Helmet>
  );
}

