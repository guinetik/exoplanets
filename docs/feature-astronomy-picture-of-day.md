# Astronomy Picture of the Day (APOD)

The APOD page displays NASA's Astronomy Picture of the Day with date navigation support.

## Features

- **Daily Images**: Fetches the astronomy picture of the day from NASA's APOD API
- **Date Navigation**: Navigate between past days using Yesterday/Tomorrow buttons
- **Multiple Media Types**: Supports images, videos, and YouTube embeds
- **Copyright Display**: Shows copyright information when available
- **Internationalization**: Full support for English and Portuguese translations
- **HD Images**: Click images to view full-size versions

## Architecture

### Service Layer

The APOD functionality is handled by a dedicated service at `src/services/apodService.ts`:

```typescript
import { apodService } from '../services';

// Fetch APOD for a specific date
const response = await apodService.fetchApod('2025-11-26');

// Format date to YYYY-MM-DD
const dateString = apodService.formatDate(new Date());

// Check media type
const mediaType = apodService.getMediaType(url, mediaType);
```

### Types

APOD types are defined in `src/types/index.ts`:

- `ApodData` - The APOD content (title, explanation, url, etc.)
- `ApodSuccessResponse` - Successful API response
- `ApodErrorResponse` - Error response with code and message
- `ApodResponse` - Union type for API responses

### Translations

Translations are in `src/i18n/en.json` and `src/i18n/pt.json`:

```json
{
  "pages": {
    "apod": {
      "title": "Astronomy Picture of the Day",
      "loading": "Loading today's cosmic wonder...",
      "yesterday": "Yesterday",
      "tomorrow": "Tomorrow",
      "error": "Could not load the picture",
      "videoNotSupported": "Your browser does not support the video tag.",
      "viewFullSize": "Click to view full size"
    }
  }
}
```

## API

The NASA APOD API is accessed via:

```
GET https://api.nasa.gov/planetary/apod?api_key={API_KEY}&date={YYYY-MM-DD}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Image/video title |
| `explanation` | string | Description of the content |
| `url` | string | URL to standard resolution media |
| `hdurl` | string? | URL to high-resolution image |
| `date` | string | Date in YYYY-MM-DD format |
| `copyright` | string? | Copyright holder |
| `media_type` | string | "image" or "video" |

## Styling

The APOD page uses a Vercel-inspired dark theme with:

- Pure black background (#000)
- Muted neutral text colors
- Subtle borders with low opacity
- Clean, minimal card design
- Monospace font for dates and copyright

Styles are defined in `src/styles/index.css` under the "APOD PAGE" section.

## Usage

Navigate to `/apod` (or `/#/apod` with HashRouter) to view the page.

The page automatically loads today's APOD on mount and provides navigation buttons to browse historical images.

## See Also

- [System Architecture Overview](architecture-system-overview.md) - Page routing
- [i18n Overview](i18n-overview.md) - Translation system
