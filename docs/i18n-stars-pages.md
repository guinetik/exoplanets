# Stars Pages Internationalization

This document describes the i18n implementation for the Stars listing page (`src/routes/Stars.tsx`), Star detail page (`src/routes/Star.tsx`), and related components.

## Translation Keys

All translation keys for the Stars pages are namespaced under `pages.stars`, `pages.star`, `pages.starCard`, and `pages.starSystem`.

---

## Stars Listing Page (`pages.stars`)

### Basic Strings
| Key | EN | PT |
|-----|----|----|
| `title` | Stars | Estrelas |
| `loading` | Loading stars... | Carregando estrelas... |
| `errorTitle` | Error Loading Stars | Erro ao Carregar Estrelas |
| `searchPlaceholder` | Search stars by name... | Buscar estrelas por nome... |

### Filters (`pages.stars.filters`)
| Key | EN | PT |
|-----|----|----|
| `starClass` | Star Class: | Classe Estelar: |
| `sortBy` | Sort by: | Ordenar por: |
| `clearFilters` | Clear Filters | Limpar Filtros |

### Sort Options (`pages.stars.sort`)
| Key | EN | PT |
|-----|----|----|
| `name` | Name | Nome |
| `distance` | Distance | Distância |
| `planets` | Planet Count | Número de Planetas |
| `temperature` | Temperature | Temperatura |

### Results (`pages.stars.results`)
| Key | EN | PT |
|-----|----|----|
| `showing` | Showing {{start}}–{{end}} of {{filtered}} star | Mostrando {{start}}–{{end}} de {{filtered}} estrela |
| `showing_plural` | Showing {{start}}–{{end}} of {{filtered}} stars | Mostrando {{start}}–{{end}} de {{filtered}} estrelas |
| `total` | ({{total}} total) | ({{total}} no total) |
| `noResults` | No stars match your filters. Try adjusting your search. | Nenhuma estrela corresponde aos seus filtros. Tente ajustar sua busca. |

### Pagination (`pages.stars.pagination`)
| Key | EN | PT |
|-----|----|----|
| `previous` | ← Previous | ← Anterior |
| `next` | Next → | Próximo → |
| `pageOf` | Page {{current}} of {{total}} | Página {{current}} de {{total}} |

---

## Star Card Component (`pages.starCard`)

### Properties (`pages.starCard.properties`)
| Key | EN | PT |
|-----|----|----|
| `temperature` | Temperature | Temperatura |
| `radius` | Radius | Raio |
| `mass` | Mass | Massa |
| `distance` | Distance | Distância |
| `planets` | Planets | Planetas |
| `vMagnitude` | V Magnitude | Magnitude V |

### Other
| Key | EN | PT |
|-----|----|----|
| `viewSystem` | View system → | Ver sistema → |

---

## Star Detail Page (`pages.star`)

### Basic Strings
| Key | EN | PT |
|-----|----|----|
| `title` | Star Details | Detalhes da Estrela |
| `loading` | Loading... | Carregando... |
| `backToStarfield` | ← Back to Starfield | ← Voltar ao Campo Estelar |

### Not Found (`pages.star.notFound`)
| Key | EN | PT |
|-----|----|----|
| `title` | Star Not Found | Estrela Não Encontrada |
| `message` | The star "{{starId}}" could not be found. | A estrela "{{starId}}" não foi encontrada. |
| `returnToStarfield` | ← Return to starfield | ← Voltar ao campo estelar |

---

## Star System Info (`pages.starSystem`)

### Info Labels (`pages.starSystem.info`)
| Key | EN | PT |
|-----|----|----|
| `type` | Type | Tipo |
| `temperature` | Temperature | Temperatura |
| `radius` | Radius | Raio |
| `mass` | Mass | Massa |
| `distance` | Distance | Distância |
| `age` | Age | Idade |
| `planet` | Planet | Planeta |
| `planets` | Planets | Planetas |
| `planetaryBodies` | Planetary Bodies | Corpos Planetários |
| `star` | Star | Estrela |
| `unknown` | Unknown | Desconhecido |

### Other
| Key | EN | PT |
|-----|----|----|
| `hint` | Drag to rotate • Scroll to zoom • Hover planets for info | Arraste para girar • Role para zoom • Passe o mouse nos planetas para informações |

---

## Interpolation Variables

The following keys use interpolation:

- `stars.results.showing` / `stars.results.showing_plural`: `{{start}}`, `{{end}}`, `{{filtered}}`
- `stars.results.total`: `{{total}}`
- `stars.pagination.pageOf`: `{{current}}`, `{{total}}`
- `star.notFound.message`: `{{starId}}`

## Usage Example

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Simple string
<h1>{t('pages.stars.title')}</h1>

// With interpolation
{t('pages.stars.pagination.pageOf', { current: 1, total: 10 })}

// Conditional plural
{t(count !== 1 ? 'pages.stars.results.showing_plural' : 'pages.stars.results.showing', {
  start: 1,
  end: 24,
  filtered: 100
})}
```

## Adding New Languages

To add support for a new language:

1. Create a new file `src/i18n/{lang}.json`
2. Copy the structure from `en.json`
3. Translate all values under `pages.stars`, `pages.star`, `pages.starCard`, and `pages.starSystem`
4. Register the language in `src/i18n/index.ts`

## See Also

- [i18n Overview](i18n-overview.md) - System setup and best practices
- [i18n Planets Pages](i18n-planets-pages.md) - Planets-related translation keys
- [Star Catalog](feature-star-catalog.md) - Feature using these keys
- [Star System Overview](feature-star-system-overview.md) - Feature using these keys

