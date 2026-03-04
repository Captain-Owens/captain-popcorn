# CLAUDE.md - Captain Popcorn AI Operating Manual

## Read These First, Every Session
1. Read `progress.txt` for current project state
2. Read `lessons.md` for past corrections (if it exists)
3. Reference canonical docs before any implementation

## Project Summary
Captain Popcorn: A shared movie/TV recommendation app for a private friend group of 16 people (8 couples). Web app (PWA), no authentication, trust-based name picker. Core features: add recommendations (auto-filled from TMDB), browse/filter, "I'm Feeling Lucky" slot machine spin, mark as watched (hides from personal feed).

## Tech Stack (Locked)
- Next.js 14 (App Router) + React 18 + TypeScript 5.4
- Tailwind CSS 3.4
- Framer Motion 11 for animations
- Supabase (PostgreSQL + Realtime)
- TMDB API v3 for movie/show metadata
- Vercel for deployment

## File Conventions
- Components: `src/components/ComponentName.tsx` (PascalCase)
- Pages: `src/app/route-name/page.tsx` (kebab-case routes)
- API routes: `src/app/api/resource-name/route.ts`
- Lib/utils: `src/lib/filename.ts` (camelCase)
- Types: `src/lib/types.ts` (single file, all interfaces)
- Constants: `src/lib/constants.ts` (platforms, colors, etc.)

## Component Rules
- Functional components with hooks only
- No class components
- No inline styles. Tailwind classes only.
- All async data: show SkeletonCard while loading
- All buttons: minimum 48px touch target
- All animations: respect `prefers-reduced-motion`

## Design Tokens (Use These Exact Values)
- `--warm-gold: #E8A317` (primary accent)
- `--deep-red: #8B1A1A` (secondary accent)
- `--cream: #FAF3E0` (text on dark)
- `--rich-black: #1A1A1A` (background)
- `--charcoal: #2A2A2A` (card surfaces)
- `--smoke: #3A3A3A` (borders)
- `--muted: #8A8A7A` (secondary text)
- Border radius: cards 12px, buttons 8px, inputs 8px
- Spacing: multiples of 4px only (4, 8, 12, 16, 20, 24, 32, 48, 64)

## UX Rules (Non-Negotiable)
- Every interaction under 100ms perceived
- No product tours, no onboarding modals
- Short URL slugs, no UUIDs in URLs
- Max 3 taps to any action
- No visible scrollbars
- Skeleton loading states, never spinners
- Active voice copy, max 7 words per sentence
- Reassurance on any destructive action: "You can undo this"
- Mobile-first. Desktop is just centered 480px container.

## Forbidden Actions
- Do NOT add new npm dependencies without asking
- Do NOT use Redux, Zustand, or any state management library
- Do NOT add authentication (no Clerk, no Auth0, no passwords)
- Do NOT create files outside the defined folder structure
- Do NOT use inline styles
- Do NOT add commented-out code
- Do NOT use `any` type in TypeScript
- Do NOT skip skeleton loading states for async content
- Do NOT use alert() or confirm() dialogs
- Do NOT hardcode colors (use CSS variables)

## Reference Docs
- `PRD.md` - What to build, scope, non-goals
- `APP_FLOW.md` - Every screen, every flow, error states
- `TECH_STACK.md` - Locked dependencies and versions
- `FRONTEND_GUIDELINES.md` - Complete design system
- `BACKEND_STRUCTURE.md` - Database schema, API contracts, queries
- `IMPLEMENTATION_PLAN.md` - Step-by-step build sequence

## Session Protocol
1. Read `progress.txt` first
2. Read `lessons.md` if it exists
3. Confirm current step in IMPLEMENTATION_PLAN.md
4. Build only the current step
5. Test the step works
6. Update `progress.txt` with what was completed
7. Commit to git with descriptive message
