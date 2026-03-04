# Captain Popcorn - Backend Structure

## Database: Supabase (PostgreSQL)

### Table: `members`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique member ID |
| `name` | `text` | NOT NULL | Display name (e.g., "Evan") |
| `household_id` | `uuid` | FK → households.id, NULLABLE | Links to partner |
| `created_at` | `timestamptz` | default `now()` | When they joined |

### Table: `households`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique household ID |
| `name` | `text` | NOT NULL | Household label (e.g., "The Owens") |
| `created_at` | `timestamptz` | default `now()` | When created |

### Table: `recommendations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique rec ID |
| `member_id` | `uuid` | FK → members.id, NOT NULL | Who recommended it |
| `title` | `text` | NOT NULL | Movie or show title |
| `type` | `text` | NOT NULL, CHECK (`movie` or `show`) | Content type |
| `tmdb_id` | `integer` | NULLABLE | TMDB ID for metadata |
| `poster_url` | `text` | NULLABLE | Full poster image URL from TMDB |
| `year` | `integer` | NULLABLE | Release year |
| `genre` | `text` | NULLABLE | Primary genre(s), comma-separated |
| `tmdb_rating` | `numeric(3,1)` | NULLABLE | TMDB community score (0-10) |
| `platform` | `text` | NULLABLE | Streaming platform slug |
| `rating` | `integer` | NULLABLE, CHECK (1-5) | Recommender's personal rating |
| `comment` | `text` | NULLABLE | One-liner comment |
| `created_at` | `timestamptz` | default `now()` | When added |

### Table: `watched`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Row ID |
| `member_id` | `uuid` | FK → members.id, NOT NULL | Who watched it |
| `recommendation_id` | `uuid` | FK → recommendations.id, NOT NULL | What they watched |
| `created_at` | `timestamptz` | default `now()` | When marked |

**Unique constraint:** `(member_id, recommendation_id)` on `watched` table. One entry per person per recommendation.

### Platform Enum Values

`netflix`, `hbo`, `prime`, `disney`, `hulu`, `paramount`, `other`

## Indexes

- `recommendations.created_at` DESC (feed sorting)
- `recommendations.member_id` (filter by person)
- `recommendations.rating` DESC (top rated sorting)
- `watched.member_id` (fast lookup for exclusion)
- `watched.recommendation_id` (count watchers)

## Key Queries

### Home Feed (unwatched items for current user)
```sql
SELECT r.*, m.name as recommender_name
FROM recommendations r
JOIN members m ON r.member_id = m.id
WHERE r.id NOT IN (
  SELECT recommendation_id FROM watched WHERE member_id = :current_user_id
)
ORDER BY r.created_at DESC
LIMIT 20
```

### Top Rated (unwatched, highest rated)
```sql
SELECT r.*, m.name as recommender_name
FROM recommendations r
JOIN members m ON r.member_id = m.id
WHERE r.id NOT IN (
  SELECT recommendation_id FROM watched WHERE member_id = :current_user_id
)
AND r.rating IS NOT NULL
ORDER BY r.rating DESC, r.created_at DESC
LIMIT 1
```

### Random Pick (I'm Feeling Lucky)
```sql
SELECT r.*, m.name as recommender_name
FROM recommendations r
JOIN members m ON r.member_id = m.id
WHERE r.id NOT IN (
  SELECT recommendation_id FROM watched WHERE member_id = :current_user_id
)
ORDER BY random()
LIMIT 1
```

### Watch Count per Recommendation
```sql
SELECT recommendation_id, COUNT(*) as watch_count
FROM watched
GROUP BY recommendation_id
```

## API Routes (Next.js App Router)

### Members
- `GET /api/members` - List all members
- `POST /api/members` - Create new member (join flow)

### Households
- `GET /api/households` - List all households
- `POST /api/households` - Create household (during join)

### Recommendations
- `GET /api/recommendations` - List recommendations (supports query params: type, platform, member_id, household_id, min_rating, sort, exclude_watched_by)
- `POST /api/recommendations` - Add new recommendation
- `GET /api/recommendations/random?exclude_watched_by=:member_id` - Random unwatched pick
- `GET /api/recommendations/top?exclude_watched_by=:member_id` - Top rated unwatched

### Watched
- `POST /api/watched` - Mark as watched (body: member_id, recommendation_id)
- `DELETE /api/watched` - Unmark watched (body: member_id, recommendation_id)

### TMDB Proxy
- `GET /api/search?q=:query&type=:movie|tv` - Search TMDB (proxied to hide API key from frontend)

## Realtime

Supabase Realtime subscriptions on:
- `recommendations` table: INSERT events (new recommendation added, update everyone's feed)
- `watched` table: INSERT/DELETE events (watch counts update live)

## Security Notes

- No Row Level Security (trust-based, private group)
- TMDB API key stored server-side only (in env var, proxied through API route)
- Supabase anon key is public-facing (acceptable for this use case, no sensitive data)
- No authentication tokens, no sessions
- Member identity stored in client local storage only

## Data Constraints

- `recommendations.title` max 200 characters
- `recommendations.comment` max 280 characters
- `recommendations.rating` integer 1-5 only
- `members.name` max 50 characters
- `households.name` max 50 characters
