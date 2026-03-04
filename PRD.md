# Captain Popcorn - Product Requirements Document

## What Is This

Captain Popcorn is a shared movie and TV show recommendation app for a private friend group of 8 couples (16 people). When someone watches something worth talking about, they add it. The whole group benefits. When you're stuck on what to watch, open the app and find your next pick in seconds.

## Who Is This For

A closed group of 16 adults (8 men, 8 women, all couples). Everyone knows each other. Trust-based, no formal authentication. The primary use case is browsing recommendations on a phone while sitting on the couch deciding what to watch.

## Core Problem

The group regularly discusses movies and shows at dinners and gatherings. By the time everyone gets home, they've forgotten the recommendations. Captain Popcorn is the shared memory.

## Success Criteria

- All 16 people can access the app from a shared URL on their phone
- Adding a recommendation takes under 30 seconds
- Finding something to watch takes under 10 seconds
- The "I'm Feeling Lucky" spin delivers instant delight
- Watched items disappear from a user's feed so they only see fresh picks

## Features (V1 Scope)

### 1. Onboarding via Invite Link
- Evan (admin) shares a link with the group
- Each person taps the link, enters their name, and picks their household partner
- Name picker for subsequent visits (tap your name, you're in)
- No passwords, no email, no phone number

### 2. Add a Recommendation
- Required: Title (typed, triggers TMDB auto-search)
- Auto-filled from TMDB: Poster image, genre, year, Rotten Tomatoes score
- Optional: Platform (tap a logo: Netflix, HBO, Amazon Prime, Disney+, Hulu, Paramount+, or "Other")
- Optional: Rating (1-5 scale, tap to rate)
- Optional: Comment (short text, one-liner)
- Submitted with the user's name and timestamp

### 3. Home Screen
- Two hero elements at the top:
  - "I'm Feeling Lucky" button: Slot-machine-style spin animation, lands on one random unwatched recommendation
  - "Top Rated" card: The group's highest-rated pick right now
- Below: Recent additions feed (newest first)
- Navigation to filters, search, and add

### 4. I'm Feeling Lucky
- Tap triggers a slot-machine / reel-spin animation
- Lands on one random movie or show the user hasn't marked as watched
- Shows full card: poster, title, year, genre, RT score, who recommended it, their rating, their comment
- "Spin Again" button to re-roll
- "Mark Watched" button on the result

### 5. Browse and Filter
- Default view: All recommendations, newest first
- Filters:
  - Type: Movies / Shows / All
  - Platform: Netflix, HBO, Prime, Disney+, Hulu, Paramount+, Other
  - Person: Filter by who recommended it
  - Household: Filter by couple
  - Rating: Minimum rating threshold
- Search: Type to search by title
- Sort: Newest, Highest Rated, Most Watched by group

### 6. Mark as Watched
- Any recommendation card has a "Watched" button
- Once tapped, that item no longer appears in the user's default feed
- Reversible (can unmark)
- Shows group engagement: "4 of 16 watched this"

### 7. Recommendation Card
- Poster image (from TMDB)
- Title, year, genre
- Rotten Tomatoes score (from TMDB/OMDb)
- Platform icon
- Who recommended it + their rating (1-5) + their comment
- "X of 16 watched" counter
- "Mark Watched" / "Watched" toggle

### 8. User Identity
- Name picker on app open (list of joined members)
- Persisted in local storage so you don't re-pick every visit
- No authentication, trust-based

## Features (V2 - Future, Out of Scope for V1)

- User profile pages (watch history, recommendation history)
- Push notifications when someone adds a recommendation
- "Save for later" watchlist
- Comments/reactions on others' recommendations
- Genre-based discovery sections
- Seasonal collections ("Halloween picks", "Holiday movies")
- Couple vs couple recommendation battles
- Integration with streaming service "continue watching"

## Non-Goals (Explicitly Out of Scope)

- No social media features (likes, follows, shares)
- No public access (closed group only)
- No native iOS/Android app (PWA web app only)
- No user-uploaded images (posters come from TMDB)
- No spoiler-length reviews (comments are one-liners)
- No algorithmic recommendations (this is human-curated)
- No monetization
