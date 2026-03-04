# Captain Popcorn - Tech Stack

## Framework

- **Next.js 14.2.x** (App Router)
- **React 18.2.x**
- **TypeScript 5.4.x**

## Styling

- **Tailwind CSS 3.4.x**
- No component library (custom components, small app)
- **Framer Motion 11.x** for animations (slot machine spin, card transitions, micro-interactions)

## Backend / Database

- **Supabase** (free tier)
  - PostgreSQL database
  - Realtime subscriptions (so the feed updates live when someone adds a recommendation)
  - Row Level Security disabled (trust-based private group, no auth)
- **Supabase JS Client 2.x** (`@supabase/supabase-js`)

## External APIs

- **TMDB API v3** (The Movie Database)
  - Movie and TV show search
  - Poster images
  - Genre, year, overview
  - Free API key required
  - Rate limit: 40 requests per 10 seconds (more than enough)
- Note: Rotten Tomatoes does not have a public API. TMDB provides vote_average (community score) which serves the same purpose. We display TMDB rating as the community score.

## Deployment

- **Vercel** (free tier)
  - Automatic deploys from GitHub
  - Edge functions for API routes
  - HTTPS included
  - Custom domain support

## Version Control

- **Git + GitHub** (private repository)

## PWA

- **next-pwa 5.x** or manual service worker
  - Add-to-home-screen support
  - Offline fallback page
  - App manifest with Captain Popcorn branding

## Dev Tools

- **ESLint** (Next.js default config)
- **Prettier** for formatting

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
TMDB_API_KEY=<tmdb api key>
```

## What We Are NOT Using

- No Redux or Zustand (React state + Supabase realtime is enough for 16 users)
- No Clerk or Auth0 (no authentication, trust-based name picker)
- No Stripe (no payments)
- No email service (no notifications in V1)
- No testing framework in V1 (manual testing for 16 users is fine)
