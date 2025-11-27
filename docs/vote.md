# Earth 2.0 Voting Feature

A community voting feature where users predict which exoplanet will become humanity's next home.

## Overview

The Vote page displays the top 20 habitable exoplanet candidates (by habitability score) and allows users to cast a single vote for their favorite. Users can change their vote at any time, and results are displayed in real-time.

## Data Model

### Firestore Collection: `exoplanets_poll`

Each document represents a single user's vote:

```typescript
interface ExoplanetVote {
  id?: string;           // Firestore doc ID (same as userid for uniqueness)
  planet: string;        // Planet name (e.g., "TRAPPIST-1 e")
  userid: string;        // User's unique ID
  timestamp: number;     // Vote timestamp (ms since epoch)
}
```

**Key Design Decision**: Using `userid` as the document ID ensures one vote per user (upsert behavior).

## Components

### Vote Page (`src/routes/Vote.tsx`)

Main page component that:
- Fetches top 20 habitable candidates from `DataContext`
- Loads vote counts and user's existing vote from Firebase
- Renders a grid of `VoteCard` components
- Handles voting flow with authentication

### Poll Service (`src/services/pollService.ts`)

Firebase operations:

| Function | Description |
|----------|-------------|
| `castVote(planet, userid)` | Create/update user's vote |
| `getUserVote(userid)` | Get user's current vote |
| `getVoteCounts()` | Aggregate votes by planet |
| `getTotalVotes()` | Total votes cast |

## User Flow

1. **Browse**: User visits `/vote` and sees top 20 candidates with current vote tallies
2. **Select**: User clicks "Vote" on their chosen planet
3. **Authenticate**: If not logged in, `UserPrompt` modal appears (Google or guest sign-in)
4. **Vote**: Vote is saved to Firebase, UI updates with new counts
5. **Change Vote**: User can vote again to change their selection (replaces previous vote)

## Visual Features

- **Leader Highlight**: The planet with the most votes shows a crown badge and golden border
- **Your Choice**: User's selected planet is highlighted with a cyan accent
- **Vote Counts**: Each card shows the current vote count
- **Badges**: Habitable Zone and Earth-like indicators on each card

## Route Configuration

```typescript
{
  path: '/vote',
  element: Vote,
  labelKey: 'nav.vote',
  showInNav: true,
}
```

Positioned in navigation between "Habitability" and "Pic of the Day".

## i18n Keys

| Key | EN | PT |
|-----|----|----|
| `nav.vote` | Vote | Votar |
| `pages.vote.title` | Vote for Earth 2.0 | Vote na Terra 2.0 |
| `pages.vote.subtitle` | Which exoplanet will become humanity's next home? Cast your vote! | Qual exoplaneta será o próximo lar da humanidade? Vote agora! |
| `pages.vote.totalVotes` | {{count}} votes cast | {{count}} votos registrados |
| `pages.vote.yourPick` | Your pick: {{planet}} | Sua escolha: {{planet}} |
| `pages.vote.voteButton` | Vote | Votar |
| `pages.vote.voted` | Voted ✓ | Votado ✓ |
| `pages.vote.yourChoice` | Your Choice | Sua Escolha |

## Styling

Styles are defined in `src/styles/index.css` using Tailwind `@apply` patterns:

- `.vote-page` - Page container with gradient background
- `.vote-header` - Hero section with title and stats
- `.vote-grid` - Responsive grid layout
- `.vote-card` - Individual planet card
- `.vote-card-leader` - Golden highlight for leading planet
- `.vote-card-selected` - Cyan highlight for user's vote
- `.vote-button` - Gradient vote button

## Dependencies

- `DataContext` - Access to `getTopHabitable(20)` for candidates
- `AuthContext` - User authentication state
- `pollService` - Firebase vote operations
- `UserPrompt` - Reused from Reviews for authentication modal

