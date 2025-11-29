# Planets & Planet Pages Internationalization

This document describes the i18n implementation for the Planets listing page (`src/routes/Planets.tsx`), Planet detail page (`src/routes/Planet.tsx`), and related components.

## Translation Keys

All translation keys for the Planets page are namespaced under `pages.planets`:

### Basic Strings
| Key | EN | PT |
|-----|----|----|
| `title` | Planets | Planetas |
| `loading` | Loading planets... | Carregando planetas... |
| `errorTitle` | Error Loading Planets | Erro ao Carregar Planetas |
| `searchPlaceholder` | Search planets by name or host star... | Buscar planetas por nome ou estrela hospedeira... |

### Filters (`pages.planets.filters`)
| Key | EN | PT |
|-----|----|----|
| `planetType` | Planet Type: | Tipo de Planeta: |
| `starClass` | Star Class: | Classe Estelar: |
| `sortBy` | Sort by: | Ordenar por: |
| `habitableOnly` | Habitable Zone Only | Apenas Zona Habitável |
| `earthLikeOnly` | Earth-like Only | Apenas Semelhantes à Terra |
| `clearFilters` | Clear Filters | Limpar Filtros |

### Sort Options (`pages.planets.sort`)
| Key | EN | PT |
|-----|----|----|
| `name` | Name | Nome |
| `distance` | Distance | Distância |
| `mass` | Mass | Massa |
| `radius` | Radius | Raio |
| `discoveryYear` | Discovery Date | Data de Descoberta |
| `habitability` | Habitability Score | Pontuação de Habitabilidade |

### Results (`pages.planets.results`)
| Key | EN | PT |
|-----|----|----|
| `showing` | Showing {{start}}–{{end}} of {{filtered}} planet | Mostrando {{start}}–{{end}} de {{filtered}} planeta |
| `showing_plural` | Showing {{start}}–{{end}} of {{filtered}} planets | Mostrando {{start}}–{{end}} de {{filtered}} planetas |
| `total` | ({{total}} total) | ({{total}} no total) |
| `noResults` | No planets match your filters. Try adjusting your search. | Nenhum planeta corresponde aos seus filtros. Tente ajustar sua busca. |

### Pagination (`pages.planets.pagination`)
| Key | EN | PT |
|-----|----|----|
| `previous` | ← Previous | ← Anterior |
| `next` | Next → | Próximo → |
| `pageOf` | Page {{current}} of {{total}} | Página {{current}} de {{total}} |

## Interpolation Variables

The following keys use interpolation:

- `results.showing` / `results.showing_plural`: `{{start}}`, `{{end}}`, `{{filtered}}`
- `results.total`: `{{total}}`
- `pagination.pageOf`: `{{current}}`, `{{total}}`

## Usage Example

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Simple string
<h1>{t('pages.planets.title')}</h1>

// With interpolation
{t('pages.planets.pagination.pageOf', { current: 1, total: 10 })}

// Conditional plural
{t(count !== 1 ? 'pages.planets.results.showing_plural' : 'pages.planets.results.showing', {
  start: 1,
  end: 24,
  filtered: 100
})}
```

---

## Planet Detail Page (`pages.planet`)

### Basic Strings
| Key | EN | PT |
|-----|----|----|
| `loading` | Loading planet data... | Carregando dados do planeta... |
| `back` | ← Back | ← Voltar |
| `exoplanet` | Exoplanet | Exoplaneta |
| `viewSystem` | View {{hostname}} System → | Ver Sistema {{hostname}} → |

### Not Found (`pages.planet.notFound`)
| Key | EN | PT |
|-----|----|----|
| `title` | Planet Not Found | Planeta Não Encontrado |
| `message` | Could not find planet: {{planetId}} | Não foi possível encontrar o planeta: {{planetId}} |
| `browseAll` | ← Browse all planets | ← Ver todos os planetas |

### Visualization Dialog (`pages.planet.visualization`)
| Key | EN | PT |
|-----|----|----|
| `title` | How We Visualize This Planet | Como Visualizamos Este Planeta |
| `intro` | Our planet visualizations are generated... | Nossas visualizações de planetas são geradas... |
| `density.title` | Density | Densidade |
| `insolation.title` | Insolation Flux | Fluxo de Insolação |
| `starTemp.title` | Star Temperature | Temperatura Estelar |
| `planetType.title` | Planet Type | Tipo de Planeta |
| `disclaimer` | Note: These visualizations are... | Nota: Estas visualizações são... |

### Info Sections (`pages.planet.info.sections`)
| Key | EN | PT |
|-----|----|----|
| `properties` | Planet Properties | Propriedades do Planeta |
| `hostStar` | Host Star | Estrela Hospedeira |
| `discovery` | Discovery | Descoberta |
| `reviews` | Reviews | Avaliações |

### Info Fields (`pages.planet.info.fields`)
| Key | EN | PT |
|-----|----|----|
| `hostStar` | Host Star | Estrela Hospedeira |
| `planetType` | Planet Type | Tipo de Planeta |
| `radius` | Radius | Raio |
| `mass` | Mass | Massa |
| `density` | Density | Densidade |
| `insolationFlux` | Insolation Flux | Fluxo de Insolação |
| `eqTemperature` | Eq. Temperature | Temp. de Equilíbrio |
| `orbitalPeriod` | Orbital Period | Período Orbital |
| `semiMajorAxis` | Semi-major Axis | Semieixo Maior |
| `orbitalEccentricity` | Orbital Eccentricity | Excentricidade Orbital |
| `starTemperature` | Star Temperature | Temperatura Estelar |
| `starMetallicity` | Star Metallicity | Metalicidade Estelar |
| `starAge` | Star Age | Idade da Estrela |
| `discoveryYear` | Discovery Year | Ano de Descoberta |
| `discoveryMethod` | Discovery Method | Método de Descoberta |
| `facility` | Facility | Instalação |

### Earth Reference Labels (`pages.planet.info.earthRef`)
| Key | EN | PT |
|-----|----|----|
| `earthRadius` | Earth radius | Raio da Terra |
| `earthMass` | Earth mass | Massa da Terra |
| `earthDensity` | Earth density | Densidade da Terra |
| `earthEqTemp` | Earth equilibrium temp | Temp. de equilíbrio da Terra |
| `earthInsolation` | Earth insolation | Insolação da Terra |
| `earthOrbitalPeriod` | Earth orbital period | Período orbital da Terra |
| `earthSemiMajorAxis` | Earth semi-major axis | Semieixo maior da Terra |
| `earthOrbitalEccentricity` | Earth orbital eccentricity | Excentricidade orbital da Terra |
| `sunTemperature` | Sun temperature | Temperatura do Sol |
| `sunMetallicity` | Sun metallicity | Metalicidade do Sol |
| `sunAge` | Sun age | Idade do Sol |

### Flags & Other (`pages.planet.info`)
| Key | EN | PT |
|-----|----|----|
| `earthComparison` | 🌍 = hover for Earth comparison | 🌍 = passe o mouse para comparação com a Terra |
| `unknown` | Unknown | Desconhecido |
| `flags.habitableZone` | In Habitable Zone | Na Zona Habitável |
| `flags.earthLike` | Earth-like | Tipo Terrestre |
| `reviews.placeholder` | Reviews coming soon!... | Avaliações em breve!... |
| `reviews.writeReview` | Write a Review | Escrever Avaliação |

---

## Adding New Languages

To add support for a new language:

1. Create a new file `src/i18n/{lang}.json`
2. Copy the structure from `en.json`
3. Translate all values under `pages.planets` and `pages.planet`
4. Register the language in `src/i18n/index.ts`

## See Also

- [i18n Overview](i18n-overview.md) - System setup and best practices
- [i18n Stars Pages](i18n-stars-pages.md) - Stars-related translation keys
- [Planet Catalog](feature-planet-catalog.md) - Feature using these keys
