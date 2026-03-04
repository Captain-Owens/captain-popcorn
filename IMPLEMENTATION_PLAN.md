# Captain Popcorn - Implementation Plan

Each step is small enough to complete and test independently. Do not skip ahead. Complete each step before starting the next.

## Phase 1: Project Scaffold

### Step 1.1 - Initialize Next.js Project
- `npx create-next-app@14 captain-popcorn --typescript --tailwind --app --src-dir`
- Verify it runs with `npm run dev`

### Step 1.2 - Install Dependencies
- `npm install @supabase/supabase-js framer-motion`
- Verify versions match TECH_STACK.md

### Step 1.3 - Create Folder Structure
```
src/
  app/
    layout.tsx
    page.tsx (redirects to /home or /pick)
    home/page.tsx
    add/page.tsx
    browse/page.tsx
    pick/page.tsx
    api/
      members/route.ts
      households/route.ts
      recommendations/route.ts
      recommendations/random/route.ts
      recommendations/top/route.ts
      watched/route.ts
      search/route.ts
  components/
    BottomNav.tsx
    RecommendationCard.tsx
    PlatformPicker.tsx
    RatingInput.tsx
    SlotMachine.tsx
    SkeletonCard.tsx
    SearchBar.tsx
    FilterBar.tsx
    MemberPicker.tsx
    HeroSection.tsx
  lib/
    supabase.ts
    tmdb.ts
    types.ts
    constants.ts
  styles/
    globals.css
```

### Step 1.4 - Configure Environment Variables
- Create `.env.local` with Supabase URL, anon key, TMDB API key placeholders
- Add `.env.local` to `.gitignore`

### Step 1.5 - Set Up Supabase
- Create Supabase project
- Run SQL to create tables: members, households, recommendations, watched
- Create indexes per BACKEND_STRUCTURE.md
- Enable Realtime on recommendations and watched tables

### Step 1.6 - Initialize Git
- `git init`, create `.gitignore`, first commit
- Push to private GitHub repo

## Phase 2: Design System Foundation

### Step 2.1 - Global Styles and CSS Variables
- Define color tokens in globals.css as CSS custom properties
- Set dark background, hide scrollbars, set base font
- Apply per FRONTEND_GUIDELINES.md

### Step 2.2 - Layout Shell
- Build root layout.tsx with dark background, centered 480px container
- Build BottomNav component (Home, Add, Browse icons)
- Bottom nav fixed, 64px height, safe area padding

### Step 2.3 - Skeleton Loading Component
- Build SkeletonCard matching RecommendationCard dimensions
- Pulsing grey blocks per FRONTEND_GUIDELINES.md

## Phase 3: Identity (No Auth)

### Step 3.1 - Join Flow (First-Time User)
- Root page `/` checks local storage for member ID
- If none: show join screen with name input + household partner dropdown
- On submit: POST to /api/members, save member ID to local storage
- Redirect to /home

### Step 3.2 - Name Picker (Returning User, New Device)
- `/pick` page: fetch all members, show list of names
- Tap name, save to local storage, redirect to /home

### Step 3.3 - Supabase Client + Member Helpers
- `lib/supabase.ts`: initialize Supabase client
- `lib/types.ts`: TypeScript interfaces for all tables
- Helper functions: getCurrentMember(), setCurrentMember()

## Phase 4: Core Data Layer

### Step 4.1 - TMDB Search API Route
- `/api/search?q=&type=` proxies to TMDB search endpoint
- Returns: title, tmdb_id, poster_url, year, genre, tmdb_rating
- Handles errors gracefully

### Step 4.2 - Recommendations API Routes
- `GET /api/recommendations` with query params for filtering and sorting
- `POST /api/recommendations` to create new recommendation
- `GET /api/recommendations/random?exclude_watched_by=` for lucky spin
- `GET /api/recommendations/top?exclude_watched_by=` for top rated

### Step 4.3 - Watched API Routes
- `POST /api/watched` to mark watched
- `DELETE /api/watched` to unmark
- Both take member_id and recommendation_id

### Step 4.4 - Members and Households API Routes
- `GET /api/members` list all
- `POST /api/members` create member
- `GET /api/households` list all
- `POST /api/households` create household

## Phase 5: Add Recommendation Flow

### Step 5.1 - Add Page UI
- Title input with TMDB autocomplete dropdown
- Auto-fill poster, genre, year, tmdb_rating on selection
- PlatformPicker component (row of logos)
- RatingInput component (1-5 buttons)
- Comment text input
- "Add to the List" submit button

### Step 5.2 - TMDB Autocomplete
- Debounced search as user types (300ms)
- Dropdown shows poster thumbnail + title + year for each result
- Tap result to select and auto-fill
- Handle no results and API errors

### Step 5.3 - Submit Flow
- Validate title is present
- POST to /api/recommendations
- Skeleton loading state during save
- Success: brief confirmation, redirect to /home
- Error: show inline error message

## Phase 6: Home Screen

### Step 6.1 - Hero Section
- Two cards side by side (stacked on small mobile)
- Left: "I'm Feeling Lucky" button with animation-ready container
- Right: Top Rated card with poster, title, rating
- Fetch top rated from API on mount

### Step 6.2 - Recent Feed
- Fetch recommendations excluding current user's watched items
- Render RecommendationCard for each
- Skeleton loading states while fetching
- Empty state if no recommendations exist

### Step 6.3 - RecommendationCard Component
- Horizontal layout: poster left, text right
- Title, year, genre, tmdb_rating, platform icon, recommender name, their rating, comment
- "Mark Watched" button
- "X/16 watched" counter
- Tap to expand/collapse additional detail

## Phase 7: I'm Feeling Lucky

### Step 7.1 - Slot Machine Component
- Three vertical reels with poster images
- Framer Motion animation: reels spin vertically, decelerate, stop one by one
- Duration: 1.5s total
- Preload 10+ random posters for reel animation frames

### Step 7.2 - Lucky Flow Integration
- Tap "I'm Feeling Lucky" on home → trigger SlotMachine modal
- Fetch random unwatched recommendation from API
- Animation plays → lands on result
- Show full recommendation card on landing
- "Spin Again" button reruns the flow
- "Mark Watched" button marks and closes
- Respect prefers-reduced-motion: skip animation, show instant result

## Phase 8: Browse and Filter

### Step 8.1 - Browse Page UI
- SearchBar at top (instant filter)
- FilterBar below: type toggle (All/Movies/Shows), platform icons, person dropdown, household dropdown
- Sort toggle: Newest / Top Rated / Most Watched
- Results grid of RecommendationCards

### Step 8.2 - Filter Logic
- All filters applied client-side on fetched data (dataset is small, 16 users)
- Search filters by title substring (case insensitive)
- Combine filters with AND logic
- URL query params reflect active filters (bookmarkable/shareable state)

### Step 8.3 - Cmd+K Quick Search
- Global keyboard shortcut opens search overlay
- Mobile: search icon in top nav opens same overlay
- Type to search titles across all recommendations
- Results update instantly as you type

## Phase 9: Mark Watched

### Step 9.1 - Watch/Unwatch Toggle
- "Mark Watched" button on every card
- Optimistic UI: button changes immediately, API call follows
- Watched items removed from feed with fade animation
- Unwatching restores item to feed

### Step 9.2 - Watch Counter
- Each card shows "X of 16 watched"
- Updates via Supabase Realtime subscription
- Counter is live across all connected clients

## Phase 10: Realtime Updates

### Step 10.1 - Supabase Realtime Subscriptions
- Subscribe to INSERT on recommendations table
- Subscribe to INSERT/DELETE on watched table
- New recommendations appear in everyone's feed live
- Watch counts update live

### Step 10.2 - Optimistic UI
- All mutations (add, watch, unwatch) update local state immediately
- Rollback on API error with error toast

## Phase 11: PWA and Polish

### Step 11.1 - PWA Configuration
- App manifest: name, icons, theme color (rich-black), background color
- Service worker: cache app shell, offline fallback page
- Add-to-home-screen meta tags

### Step 11.2 - Logo and Brand
- SVG popcorn bucket logo
- Warm gold bucket, cream popcorn, deep-red accent stripes
- Used in: manifest icons, bottom nav, loading screen, favicon

### Step 11.3 - Micro-Interactions
- Button press: scale(0.97) for 100ms
- Card hover (desktop): subtle elevation increase
- Watched button: checkmark bounce animation
- Feed items: staggered fade-in on load

### Step 11.4 - Error States and Edge Cases
- Network offline handling
- Empty states per APP_FLOW.md
- TMDB API failure fallback (manual entry)
- Graceful handling of all watched items

## Phase 12: Deploy

### Step 12.1 - Vercel Deployment
- Connect GitHub repo to Vercel
- Add environment variables in Vercel dashboard
- Deploy and verify on live URL

### Step 12.2 - Mobile Testing
- Test on iPhone Safari
- Test on Android Chrome
- Verify touch targets, scrolling, bottom nav safe areas
- Test PWA install flow

### Step 12.3 - Share with the Group
- Generate invite link
- Send to the 8 friends and their wives
- Monitor for issues in first 24 hours
