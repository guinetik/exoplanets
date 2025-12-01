# SEO & Social Meta Tags Implementation

## Overview

This document describes the SEO and social media meta tags implementation for the Exoplanets application. The implementation uses `react-helmet-async` to dynamically manage meta tags for improved search engine optimization and social media sharing.

## Architecture

### Components

- **`src/components/SEO.tsx`**: Reusable SEO component that manages all meta tags
- **`src/utils/seo.ts`**: Utility functions for generating route-specific SEO metadata

### Integration

- **`src/main.tsx`**: Wrapped with `HelmetProvider` from `react-helmet-async`
- **`index.html`**: Contains default meta tags as fallback
- **All route components**: Include the `<SEO />` component with appropriate metadata

## Meta Tags Structure

### Standard SEO Meta Tags

- `title`: Page title (appended with site name)
- `description`: Meta description for search engines
- `keywords`: Comma-separated keywords
- `author`: Author name
- `canonical`: Canonical URL to prevent duplicate content

### Open Graph Meta Tags (Facebook, LinkedIn, etc.)

- `og:title`: Page title for social sharing
- `og:description`: Description for social sharing
- `og:image`: Image URL (1200x630px recommended)
- `og:url`: Absolute URL of the page
- `og:type`: Content type (website, article, etc.)
- `og:site_name`: Site name
- `og:locale`: Locale (default: en_US)

### Twitter Card Meta Tags

- `twitter:card`: Card type (`summary_large_image` for better visual impact)
- `twitter:title`: Page title
- `twitter:description`: Description
- `twitter:image`: Image URL

## Usage

### Basic Usage

```tsx
import SEO from '../components/SEO';
import { getHomeSEO } from '../utils/seo';

export default function Home() {
  const seoData = getHomeSEO();
  
  return (
    <>
      <SEO {...seoData} />
      {/* Page content */}
    </>
  );
}
```

### Dynamic SEO for Detail Pages

```tsx
import SEO from '../components/SEO';
import { getPlanetSEO } from '../utils/seo';

export default function Planet() {
  const planet = getPlanetBySlug(planetId);
  const seoData = planet ? getPlanetSEO(planet) : null;
  
  return (
    <>
      {seoData && <SEO {...seoData} />}
      {/* Page content */}
    </>
  );
}
```

## SEO Utility Functions

All utility functions are located in `src/utils/seo.ts`:

### Page-Specific Functions

- `getHomeSEO()`: Home page metadata
- `getCatalogSEO(pageType)`: Catalog pages (planets/stars)
- `getHabitabilitySEO()`: Habitability analysis page
- `getAPODSEO()`: Astronomy Picture of the Day page
- `getVoteSEO()`: Vote/Earth 2.0 page
- `getAboutSEO()`: About page
- `getTourSEO()`: Tour page

### Dynamic Functions

- `getPlanetSEO(planet)`: Generates SEO metadata from planet data
- `getStarSEO(star)`: Generates SEO metadata from star data

## Default Configuration

### Site Information

- **Site Name**: Exoplanets
- **Site URL**: https://exoplanets.guinetik.com
- **Default OG Image**: `/images/og-default.png`
- **Twitter Card Type**: `summary_large_image`

### Default Meta Tags

Default meta tags are defined in `index.html` and serve as fallback values. These are overridden by the `<SEO />` component when pages load.

## Adding Custom OG Images

To add custom Open Graph images for specific routes:

1. Create an image file (1200x630px recommended) in `public/images/`
2. Update the route component to pass a custom image:

```tsx
const seoData = {
  ...getHomeSEO(),
  image: '/images/custom-og-image.png'
};

return (
  <>
    <SEO {...seoData} />
    {/* Page content */}
  </>
);
```

### Image Requirements

- **Recommended Size**: 1200x630px
- **Minimum Size**: 600x315px
- **Format**: PNG or JPG
- **Aspect Ratio**: 1.91:1

## Dynamic Content Generation

### Planet Detail Pages

The `getPlanetSEO()` function generates descriptions based on:
- Planet name and type
- Distance from Earth
- Radius (Earth radii)
- Equilibrium temperature
- Habitability zone status

Example generated description:
> "Kepler-452b is a Super-Earth located 1402.5 light-years away, 1.63× Earth's radius, with an equilibrium temperature of 265K, in the habitable zone. Explore detailed information, 3D visualization, and habitability analysis."

### Star Detail Pages

The `getStarSEO()` function generates descriptions based on:
- Star name and spectral type
- Distance from Earth
- Surface temperature
- Number of planets
- Binary system status

Example generated description:
> "Kepler-452 is a G2 star located 1402.5 light-years away, with a surface temperature of 5757K, hosting 1 confirmed planet. Explore the star system, planetary orbits, and detailed stellar properties."

## URL Generation

All URLs are generated as absolute URLs using the base `https://exoplanets.guinetik.com`. The SEO component automatically converts relative URLs to absolute URLs for Open Graph and canonical tags.

## Testing

### Validate Meta Tags

1. **Browser DevTools**: Inspect the `<head>` section to verify meta tags are present
2. **Social Media Validators**:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Testing Dynamic Updates

1. Navigate between routes
2. Verify meta tags update in the `<head>` section
3. Check that canonical URLs match the current route
4. Verify Open Graph images load correctly

## Best Practices

1. **Always use absolute URLs** for Open Graph images and canonical URLs
2. **Keep descriptions concise** (150-160 characters recommended)
3. **Use descriptive titles** that include the site name
4. **Include relevant keywords** but avoid keyword stuffing
5. **Update meta tags** when content changes significantly
6. **Test social sharing** before deploying major changes

## Troubleshooting

### Meta Tags Not Updating

- Ensure `HelmetProvider` wraps the app in `main.tsx`
- Verify the `<SEO />` component is included in the route
- Check browser cache (meta tags may be cached)

### Images Not Displaying

- Verify image path is correct and accessible
- Check image size meets minimum requirements
- Ensure absolute URL is used for Open Graph images
- Test image URL directly in browser

### Social Media Preview Not Working

- Use social media validators to debug
- Clear social media cache (Facebook, Twitter, etc.)
- Verify all required meta tags are present
- Check that images are publicly accessible

## Future Enhancements

Potential improvements:

1. **Dynamic OG Image Generation**: Generate OG images programmatically for each planet/star
2. **i18n Support**: Add localized meta descriptions for different languages
3. **Structured Data**: Add JSON-LD structured data for rich snippets
4. **Sitemap Generation**: Automatically generate sitemap.xml
5. **Robots.txt**: Configure robots.txt for better crawling

