# Service Layer Overview

## Overview

Services are singleton instances that encapsulate business logic and external integrations. The Exoplanets app uses a modular service pattern where each service handles a specific domain.

**Location**: `src/services/`

**Exported From**: `src/services/index.ts`

## Service Pattern

### What is a Service?

A service is:
- **Singleton**: Instantiated once, shared across entire app
- **Stateful**: Maintains data/cache internally
- **Modular**: Handles one domain (data, shaders, API calls)
- **Type-Safe**: Uses TypeScript for strong typing
- **Reusable**: Can be used in components or other services

### Architecture

```
src/services/
├── index.ts           # Export all services
├── dataService.ts     # Data loading and querying
├── shaderService.ts   # Shader management
├── apodService.ts     # NASA APOD API
├── pollService.ts     # Voting/polling backend
├── reviewService.ts   # Planet reviews
├── userService.ts     # User authentication
└── thumbnailService.ts # Image management
```

## Core Services

### DataService

**Purpose**: Load exoplanet CSV data, index it, provide querying APIs

**Methods**:
- `loadData()` - Load and parse CSV
- `getPlanet(slug)` - O(1) lookup by slug
- `getStar(slug)` - Get star with hosted planets
- `getAllPlanets()` - Get full planet array
- `filterPlanets(options)` - Query with criteria
- `getTopHabitable(count)` - Top N by habitability
- `search(query)` - Search by name

**Usage**:
```typescript
const { dataService } = useData();
const planet = dataService.getPlanet("kepler-452-b");
```

**See**: [DataService API](api-data-service.md) for complete reference

### ShaderService

**Purpose**: Load and cache GLSL shaders for 3D rendering

**Methods**:
- `loadShaders()` - Load all shader files
- `get(name)` - Retrieve shader source code

**Uniforms** (shader parameters):
- `uTemperature`, `uSeed`, `uRotation`
- `uTime` (per-frame updates)

**Usage**:
```typescript
const fragmentShader = shaderService.get('planetRockyFrag');
const material = new THREE.ShaderMaterial({
  vertexShader: shaderService.get('planetVert'),
  fragmentShader: fragmentShader,
  uniforms: uniforms
});
```

**See**: [ShaderService API](api-shader-service.md) for complete reference

### APODService

**Purpose**: Fetch NASA Astronomy Picture of the Day

**Methods**:
- `getAPOD(date)` - Fetch APOD for specific date
- `getTodayAPOD()` - Fetch today's APOD

**Returns**:
```typescript
{
  title: string;
  explanation: string;
  media_type: 'image' | 'video';
  url: string;
  copyright?: string;
  date: string;
}
```

**Usage**:
```typescript
const apod = await apodService.getTodayAPOD();
console.log(apod.title, apod.url);
```

**Features**:
- Caches results to avoid duplicate API calls
- Handles API errors gracefully
- Fallback images if API unavailable

## Feature Services

### PollService

**Purpose**: Backend integration for voting feature ("Vote for Earth 2.0")

**Methods**:
- `getVotes()` - Fetch current vote counts
- `submitVote(planetSlug)` - Cast user's vote
- `getLeadingPlanet()` - Get current frontrunner

**Backend**: Firebase Firestore

**Usage**:
```typescript
const votes = await pollService.getVotes();
await pollService.submitVote("kepler-452-b");
```

### ReviewService

**Purpose**: Backend integration for planet reviews

**Methods**:
- `getReviews(planetSlug)` - Fetch reviews for planet
- `submitReview(planetSlug, review)` - Add new review
- `deleteReview(reviewId)` - Remove review

**Backend**: Firebase Firestore

**Usage**:
```typescript
const reviews = await reviewService.getReviews("kepler-452-b");
await reviewService.submitReview("kepler-452-b", {
  rating: 5,
  text: "Amazing discovery!"
});
```

### UserService

**Purpose**: Authentication and user management

**Methods**:
- `login(email, password)` - User login
- `logout()` - User logout
- `getCurrentUser()` - Get logged-in user
- `isAuthenticated()` - Check auth status
- `getUserProfile()` - Get user details

**Backend**: Firebase Authentication

**Usage**:
```typescript
const user = userService.getCurrentUser();
if (user) {
  console.log(`Logged in as ${user.email}`);
}
```

### ThumbnailService

**Purpose**: Generate or fetch planet thumbnail images

**Methods**:
- `getThumbnail(planetSlug, size)` - Get thumbnail URL
- `getCached(planetSlug)` - Get from cache if available

**Returns**:
```typescript
{
  url: string;
  cached: boolean;
}
```

**Usage**:
```typescript
const thumbnail = await thumbnailService.getThumbnail("kepler-452-b", "small");
return <img src={thumbnail.url} />;
```

## Service Initialization

### In App Root

```typescript
// src/main.tsx
ReactDOM.render(
  <App />,
  document.getElementById('root')
);

// services initialize automatically via useEffect in App
```

### In DataContext

```typescript
// src/context/DataContext.tsx
useEffect(() => {
  dataService.loadData().catch(error => {
    setError(error);
  });

  shaderService.loadShaders().catch(error => {
    console.warn('Shaders failed to load:', error);
  });
}, []);
```

## Dependency Injection Pattern

Services can depend on other services:

```typescript
class VoteService {
  constructor(
    private dataService: DataService,
    private userService: UserService,
    private pollService: PollService
  ) {}

  async voteForPlanet(planetSlug: string) {
    // Validate planet exists
    const planet = this.dataService.getPlanet(planetSlug);
    if (!planet) throw new Error('Planet not found');

    // Check user authenticated
    const user = this.userService.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Submit vote
    return this.pollService.submitVote(planetSlug);
  }
}
```

## Error Handling Patterns

### Try-Catch in Components

```typescript
try {
  const data = await dataService.loadData();
} catch (error) {
  setError(error.message);
}
```

### Promise Chains

```typescript
dataService.loadData()
  .then(() => shaderService.loadShaders())
  .catch(error => {
    console.error('Failed to initialize:', error);
  });
```

### Error States in Context

```typescript
const [error, setError] = useState<Error | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  dataService.loadData()
    .catch(error => setError(error))
    .finally(() => setIsLoading(false));
}, []);
```

## Testing Services

Services are testable in isolation:

```typescript
describe('DataService', () => {
  it('loads and indexes planets', async () => {
    const service = new DataService();
    await service.loadData();

    const planet = service.getPlanet('kepler-452-b');
    expect(planet).toBeDefined();
  });

  it('filters planets by criteria', async () => {
    const service = new DataService();
    await service.loadData();

    const habitable = service.filterPlanets({
      inHabitableZone: true
    });

    expect(habitable.length).toBeGreaterThan(0);
    expect(habitable.every(p => p.is_habitable_zone)).toBe(true);
  });
});
```

## Adding a New Service

### Step 1: Create Service Class

```typescript
// src/services/myService.ts
export class MyService {
  async loadData(): Promise<void> {
    // initialization logic
  }

  doSomething(): string {
    // business logic
  }
}
```

### Step 2: Export from Index

```typescript
// src/services/index.ts
export { MyService } from './myService';
export const myService = new MyService();
```

### Step 3: Initialize in DataContext

```typescript
// src/context/DataContext.tsx
useEffect(() => {
  myService.loadData().catch(error => {
    console.error('MyService initialization failed:', error);
  });
}, []);
```

### Step 4: Expose via Custom Hook (Optional)

```typescript
// src/hooks/useMyService.ts
export function useMyService() {
  return myService;
}
```

## Service Best Practices

### ✅ Do

- Keep services focused on one domain
- Expose minimal public API
- Cache results when appropriate
- Handle errors gracefully
- Use TypeScript for type safety
- Write unit tests

### ❌ Don't

- Mix unrelated logic in one service
- Expose internal state directly
- Ignore initialization errors
- Create new instances (use singletons)
- Make synchronous API calls
- Hard-code configuration values

## Performance Considerations

| Service | Load Time | Cache | Lookup |
|---------|-----------|-------|--------|
| DataService | ~200ms | Yes (CSV indexed) | O(1) for getPlanet |
| ShaderService | ~100ms | Yes (compiled) | O(1) for get() |
| APODService | ~500ms | Yes (date-based) | API call cached |
| UserService | ~100ms | Yes (session) | O(1) for user state |

## See Also

- [DataService API](api-data-service.md) - Complete data service methods
- [ShaderService API](api-shader-service.md) - Complete shader service methods
- [Architecture System Overview](architecture-system-overview.md) - Services in context
- [Data Flow & State Management](architecture-data-flow.md) - How services fit into data flow
