# Captain Popcorn - App Flow

## Screen Inventory

| Screen | Route | Purpose |
|--------|-------|---------|
| Landing / Invite | `/` | First-time visitors join the group |
| Who Are You? | `/pick` | Returning users tap their name |
| Home | `/home` | Hero section + recent feed |
| Add Recommendation | `/add` | Add a movie or show |
| Browse | `/browse` | Full list with filters and search |
| Spin Result | (modal on `/home`) | I'm Feeling Lucky result |

## Flow 1: First-Time User (Invite Link)

1. User receives a shared URL from Evan (e.g., `captainpopcorn.app`)
2. App detects no stored identity in local storage
3. Screen: "Join Captain Popcorn" with a name input field
4. User types their first name
5. User selects their partner from a dropdown (or "No partner" / "Add later")
6. User taps "Join the Crew"
7. Identity stored in local storage + saved to database
8. Redirect to `/home`

## Flow 2: Returning User

1. User opens the URL
2. App checks local storage for stored identity
3. If found: go directly to `/home` (zero friction)
4. If not found (cleared cache, new device): show `/pick` screen with list of all members
5. User taps their name
6. Identity restored, redirect to `/home`

## Flow 3: Home Screen

1. Top section: Two hero cards side by side (or stacked on mobile)
   - Left/Top: "I'm Feeling Lucky" button with popcorn/film reel icon
   - Right/Bottom: "Top Rated" card showing the #1 rated item with poster
2. Below heroes: "Recently Added" feed
   - Each item is a recommendation card (poster, title, who added it, rating)
   - Sorted newest first
   - Only shows items the current user hasn't marked as watched
3. Bottom nav or top nav: Home | Add | Browse
4. Max 2 taps to any action from home

## Flow 4: I'm Feeling Lucky

1. User taps "I'm Feeling Lucky" on home screen
2. Slot-machine animation plays (1.5-2 seconds, reels spinning)
3. Animation lands on one random recommendation card
4. Card expands to full detail: poster, title, year, genre, RT score, platform, who recommended, their rating, their comment
5. Two actions available:
   - "Spin Again" triggers new animation and new result
   - "Mark Watched" marks it and returns to home
6. Tapping outside the card / X button dismisses back to home
7. Only serves items the user hasn't watched

## Flow 5: Add a Recommendation

1. User taps "+" or "Add" from any screen
2. Screen: Add form
   - Text input: "What did you watch?" (required)
   - As user types, TMDB search results appear below (autocomplete)
   - User taps a result: poster, genre, year, RT score auto-fill
   - Platform picker: Row of streaming service logos (tap to select, optional)
   - Rating: 1-5 stars or numbered buttons (tap to rate, optional)
   - Comment: Short text input, placeholder "One-liner for the group..." (optional)
3. User taps "Add to the List"
4. Recommendation saved with user's name and timestamp
5. Skeleton loading state while saving
6. Success: brief confirmation, redirect to home
7. The new recommendation now appears in everyone's feed

## Flow 6: Browse and Filter

1. User taps "Browse" from nav
2. Default: All recommendations, newest first, excluding user's watched items
3. Filter bar at top:
   - Type toggle: All | Movies | Shows
   - Platform filter: Tap logo icons to filter
   - Person filter: Dropdown of all 16 members
   - Household filter: Dropdown of 8 couples
   - Rating filter: Minimum rating slider or buttons
4. Search bar: Type to search by title (instant filter, no submit button)
5. Sort options: Newest | Top Rated | Most Watched
6. Each result is a recommendation card
7. Tapping a card expands inline or opens detail view
8. "Mark Watched" available on every card

## Flow 7: Mark as Watched

1. User taps "Mark Watched" on any recommendation card
2. Immediate UI response (button changes to checkmark "Watched")
3. Item fades or is removed from current feed view
4. "X of 16 watched" counter increments
5. Reversible: if user sees item elsewhere (search, filter), they can tap "Watched ✓" to unmark

## Error States

- TMDB search fails: "Couldn't find that title. Add it manually?" with manual title entry fallback
- Network offline: "You're offline. We saved your pick and will sync when you're back." (optimistic local save)
- Empty feed (all watched): "You've watched everything the group recommended. Tell your friends to add more."
- Empty search results: "No matches. Try a different title."
- Spin with nothing to show: "You've seen it all. Time to rewatch something."

## Navigation Rules

- Max 2 taps from home to any action
- Bottom nav: 3 items max (Home, Add, Browse)
- No nested navigation deeper than 2 levels
- Back button always returns to previous screen
- All modals dismissible by tapping outside or X
