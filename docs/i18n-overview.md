# Internationalization (i18n) Overview

## Overview

The Exoplanets application supports multiple languages using the `react-i18next` library. Language files contain all user-facing text, making it easy to translate the app into new languages.

**Current Languages**: English (en), Portuguese (pt)

**Framework**: react-i18next

**Location**: `src/i18n/`

## How i18n Works

### Translation Flow

```
Component renders text
  ↓
useTranslation() hook
  ↓
Looks up key in language JSON
  ↓
Returns translated string
  ↓
Renders to user
```

### Example

**Component**:
```typescript
const PlanetCard = ({ planet }) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{planet.name}</h2>
      <p>{t('pages.planet.type')}: {planet.planet_type}</p>
    </div>
  );
};
```

**English (en.json)**:
```json
{
  "pages": {
    "planet": {
      "type": "Planet Type"
    }
  }
}
```

**Portuguese (pt.json)**:
```json
{
  "pages": {
    "planet": {
      "type": "Tipo de Planeta"
    }
  }
}
```

**Result**: User sees "Planet Type" (EN) or "Tipo de Planeta" (PT)

## File Structure

### Language Files

```
src/i18n/
├── index.ts           # i18n configuration
├── en.json            # English translations
└── pt.json            # Portuguese translations
```

### Key Namespacing Convention

**Structure**: `{scope}.{page}.{component}.{field}`

**Examples**:
- `pages.planets.title` - Planets page title
- `pages.planet.properties.radius` - Planet detail, properties section
- `components.header.navigation` - Header component
- `common.buttons.submit` - Shared button text

**Hierarchy**:
```
pages/
  ├── planets/
  │   ├── title
  │   ├── catalog/
  │   │   ├── title
  │   │   └── filters/
  │   │       ├── type
  │   │       ├── temperature
  │   │       └── ...
  │   └── ...
  ├── planet/
  │   ├── properties/
  │   │   ├── radius
  │   │   ├── mass
  │   │   └── ...
  │   ├── habitability/
  │   │   ├── score
  │   │   └── assessment
  │   └── ...
  └── ...

components/
  ├── header/
  │   ├── title
  │   └── navigation
  ├── filters/
  │   ├── title
  │   └── apply
  └── ...

common/
  ├── buttons/
  │   ├── submit
  │   ├── cancel
  │   └── ...
  └── messages/
      ├── loading
      ├── error
      └── ...
```

## Setup & Configuration

### Initialization (index.ts)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './en.json';
import ptTranslations from './pt.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    pt: { translation: ptTranslations }
  },
  lng: 'en',                    // Default language
  fallbackLng: 'en',            // Fallback if translation missing
  interpolation: {
    escapeValue: false          // React handles escaping
  }
});

export default i18n;
```

### Language Detection (Optional)

To auto-detect user's language:

```typescript
import LanguageDetector from 'i18next-browser-languagedetector';

i18n.use(LanguageDetector).init({
  // ... config
  lng: undefined,  // Let detector choose
});
```

## Using Translations in Components

### Basic Usage

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return <h1>{t('pages.planets.title')}</h1>;
};
```

### With Interpolation (Variables)

**JSON**:
```json
{
  "planet": {
    "welcome": "Welcome to {{planetName}}"
  }
}
```

**Component**:
```typescript
const { t } = useTranslation();

return <p>{t('planet.welcome', { planetName: 'Kepler-452 b' })}</p>;
```

**Output**: "Welcome to Kepler-452 b"

### With Pluralization

**JSON**:
```json
{
  "planets": {
    "count": "Found {{count}} planet",
    "count_plural": "Found {{count}} planets"
  }
}
```

**Component**:
```typescript
return <p>{t('planets.count', { count: 5 })}</p>;
```

**Output**: "Found 5 planets" (automatically uses plural form)

### Language Switching

```typescript
const { i18n } = useTranslation();

const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  // All components re-render with new language
};

return (
  <div>
    <button onClick={() => changeLanguage('en')}>English</button>
    <button onClick={() => changeLanguage('pt')}>Português</button>
  </div>
);
```

## File Format & Structure

### JSON Format

Each language file is a single JSON object with nested structure:

**English (en.json)**:
```json
{
  "pages": {
    "planets": {
      "title": "Exoplanet Catalog",
      "description": "Browse and discover...",
      "catalog": {
        "title": "Planets",
        "filters": {
          "type": "Planet Type",
          "temperature": "Temperature",
          "sort": "Sort by..."
        }
      }
    },
    "planet": {
      "title": "{{name}}",
      "properties": {
        "radius": "Radius",
        "mass": "Mass",
        "temperature": "Equilibrium Temperature"
      }
    }
  },
  "common": {
    "buttons": {
      "back": "Back",
      "close": "Close",
      "submit": "Submit",
      "cancel": "Cancel"
    }
  }
}
```

### Key Naming Rules

✅ **Do**:
- Use camelCase for keys: `pl_radius` (matches CSV)
- Use dot notation for hierarchy: `pages.planet.properties`
- Use descriptive names: `habitability.score.label`
- Use {{variable}} for interpolation

❌ **Don't**:
- Use spaces in keys: `"planet type"` → `"planetType"`
- Use ALL_CAPS unless acronym: `"RADIUS"` → `"radius"`
- Mix notations: `"planet-type"` (inconsistent)

## Adding a New Language

### Step 1: Create Language File

Create `src/i18n/{lang}.json` with all keys from `en.json`:

```json
// src/i18n/es.json (Spanish)
{
  "pages": {
    "planets": {
      "title": "Catálogo de Exoplanetas",
      // ... all other keys translated
    }
  }
}
```

**Tip**: Use a translation service (Google Translate) as starting point, then have native speaker review.

### Step 2: Register Language

**Update `src/i18n/index.ts`**:

```typescript
import esTranslations from './es.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    pt: { translation: ptTranslations },
    es: { translation: esTranslations }  // ADD THIS
  },
  supportedLngs: ['en', 'pt', 'es'],    // ADD THIS
  // ... rest of config
});
```

### Step 3: Update UI

Add language selector button (optional):

```typescript
const { i18n } = useTranslation();

<select onChange={(e) => i18n.changeLanguage(e.target.value)}>
  <option value="en">English</option>
  <option value="pt">Português</option>
  <option value="es">Español</option>
</select>
```

### Step 4: Test

- Switch language and verify all text displays correctly
- Check for missing translations (will show key if missing)
- Test with RTL languages (Hebrew, Arabic) if adding

## Common Patterns

### Page Titles

```json
{
  "pages": {
    "pageName": {
      "title": "Page Title",
      "description": "Optional description"
    }
  }
}
```

### Form Fields

```json
{
  "forms": {
    "filterForm": {
      "fields": {
        "type": "Type",
        "temperature": "Temperature Range",
        "habitableZone": "In Habitable Zone"
      },
      "buttons": {
        "apply": "Apply Filters",
        "reset": "Reset Filters"
      }
    }
  }
}
```

### Error Messages

```json
{
  "errors": {
    "dataLoad": "Failed to load planet data",
    "network": "Network error. Please check your connection.",
    "notFound": "{{itemType}} not found"
  }
}
```

### Chart Labels

```json
{
  "charts": {
    "habitability": {
      "title": "Habitability Score Distribution",
      "xAxis": "Habitability Score",
      "yAxis": "Number of Planets"
    }
  }
}
```

## Translation Maintenance

### Checking for Missing Keys

If a translation key doesn't exist in language file:
- i18n shows the key itself: `"pages.planet.unknown"`
- Console warning: "missing key error"
- English fallback usually works

### Updating Translations

When adding new feature with text:

1. **Add English translation first** (en.json)
2. **Use key in component** (with useTranslation)
3. **Test in English** - ensure key works
4. **Translate to other languages** (pt.json, es.json, etc.)
5. **Test in other languages** - verify display

### Quality Assurance

Before merging:
- All keys present in all language files ✓
- No typos in keys ✓
- Variables match between translations (e.g., {{count}}) ✓
- Context appropriate to language ✓
- Native speaker review ✓

## Performance

### Optimization

- **Lazy loading**: Not needed (small JSON files, <100 KB each)
- **Code splitting**: Not needed (used on every page anyway)
- **Caching**: Browser cache handles it automatically

### File Sizes

| File | Size | Notes |
|------|------|-------|
| en.json | ~45 KB | English |
| pt.json | ~48 KB | Portuguese (slightly longer) |
| Combined | ~93 KB | Both languages loaded |
| Gzipped | ~20 KB | Compressed for delivery |

## RTL Language Support (Future)

If adding Arabic, Hebrew, Urdu:

```typescript
i18n.use(LanguageDetector).init({
  // ... config
  react: {
    bindI18n: 'languageChanged',
    useSuspense: false
  }
});

// Set text direction
const { i18n } = useTranslation();
const isRTL = ['ar', 'he', 'ur'].includes(i18n.language);
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
```

## See Also

- [i18n Planets Pages](i18n-planets-pages.md) - All planets-related keys
- [i18n Stars Pages](i18n-stars-pages.md) - All stars-related keys
- [System Architecture Overview](architecture-system-overview.md) - i18n in context
- [react-i18next Documentation](https://react.i18next.com/) - Official docs
