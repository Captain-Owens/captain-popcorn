# Captain Popcorn - Frontend Guidelines

## Design Philosophy

Old-timey cinema meets modern minimal. Warm, cozy, like settling into a theater seat. The app should feel like movie night, not a spreadsheet.

## UX Principles (Non-Negotiable)

These rules apply to every screen, every component, every interaction:

1. Every interaction completes in under 100ms (perceived)
2. No product tours or onboarding modals
3. URL slugs are short: `/home`, `/add`, `/browse`, `/pick`. No UUIDs in URLs
4. Persistent resumable state via local storage
5. Not more than 3 colors (palette below)
6. No visible scrollbars (use `scrollbar-width: none` / `::-webkit-scrollbar { display: none }`)
7. All navigation is under 3 taps
8. Skeleton loading states for all async content
9. Larger hit targets: minimum 48px for all buttons and inputs
10. One-tap cancel for any action, no confirmation dialogs for reversible actions
11. Cmd+K (or tap search icon) opens quick search from any screen
12. Tooltips are minimal and only on hover (desktop), never on mobile
13. All copy is active voice, max 7 words per sentence
14. Optical alignment over geometric (visually centered, not mathematically)
15. Optimized for left-to-right reading flow
16. Reassurance on destructive actions: "You can undo this anytime"
17. Copy-to-clipboard on tap for share links

## Color Palette (3 Colors + Neutrals)

| Token | Hex | Usage |
|-------|-----|-------|
| `--warm-gold` | `#E8A317` | Primary accent. Buttons, active states, the "lucky" spin. Old cinema marquee gold. |
| `--deep-red` | `#8B1A1A` | Secondary accent. Rating stars, badges, highlights. Velvet theater curtain red. |
| `--cream` | `#FAF3E0` | Text on dark backgrounds. Warm, not stark white. Popcorn-colored. |
| `--rich-black` | `#1A1A1A` | Primary background. Dark theater. |
| `--charcoal` | `#2A2A2A` | Card backgrounds, elevated surfaces. |
| `--smoke` | `#3A3A3A` | Borders, dividers, subtle separations. |
| `--muted` | `#8A8A7A` | Secondary text, timestamps, metadata. |

## Typography

- **Headings:** System font stack, bold (700). No custom font load for speed.
  - `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Body:** Same stack, regular (400)
- **Sizes:**
  - Hero heading: 28px mobile / 36px desktop
  - Section heading: 20px mobile / 24px desktop
  - Card title: 16px mobile / 18px desktop
  - Body text: 14px mobile / 16px desktop
  - Caption/metadata: 12px mobile / 13px desktop
- **Line height:** 1.4 for body, 1.2 for headings
- **Letter spacing:** Normal. No tracking adjustments.

## Spacing Scale

All spacing uses multiples of 4px:
4, 8, 12, 16, 20, 24, 32, 48, 64

- Card padding: 16px
- Section gaps: 24px
- Page margins: 16px mobile / 24px desktop
- Between cards in a grid: 12px

## Border Radius

- Cards: 12px
- Buttons: 8px
- Inputs: 8px
- Poster images: 8px
- Full-round (pills, avatars): 9999px

## Shadows

- Card shadow: `0 2px 8px rgba(0, 0, 0, 0.3)`
- Elevated card (hover/focus): `0 4px 16px rgba(0, 0, 0, 0.4)`
- No shadows on flat elements

## Layout

- Mobile-first, single column default
- Max content width: 480px (phone-optimized, not wide desktop)
- Centered on desktop with dark background flanking
- Bottom navigation bar: 3 items (Home, Add, Browse)
- Bottom nav height: 64px with safe area padding for notched phones

## Responsive Breakpoints

- Mobile: 0-639px (primary target)
- Tablet: 640-1023px (single column, wider cards)
- Desktop: 1024px+ (centered 480px container, same layout as mobile)

This app is phone-first. Desktop is just a wider viewport showing the same phone layout, centered.

## Component Patterns

### Recommendation Card
- Horizontal layout: Poster thumbnail (left, 80px wide) + text content (right)
- Text stack: Title (bold), Year + Genre (muted), Platform icon + RT score, Recommender name + their rating
- Bottom row: "Mark Watched" button, "X/16 watched" counter
- Tap card to expand full detail (inline expand, not new page)

### Platform Picker
- Row of circular logo icons (40px each)
- Tap to select (gold ring highlight on selected)
- Logos: Netflix (N), HBO (purple), Prime (blue arrow), Disney+ (D+), Hulu (green), Paramount+ (blue mountain), Other (?)

### Rating Input
- 5 numbered buttons in a row (1-5)
- Tap to select (gold fill on selected)
- No half-stars, no slider

### Skeleton Loading
- Match exact card layout with pulsing grey blocks
- Poster placeholder: grey rounded rectangle
- Text placeholders: 3 lines of varying width grey bars
- Animation: subtle pulse (`animate-pulse` in Tailwind)

### Slot Machine Animation
- 3 vertical reels spinning (posters blurring vertically)
- Reels stop one by one (left, center, right) over 1.5s
- Final result: single card reveal with a subtle bounce
- Use Framer Motion for spring physics

### Empty States
- Illustrated or text-only, warm tone
- "No recommendations yet. Be the first." (on empty feed)
- "You've watched everything. Impressive." (on all-watched feed)
- "No matches found." (on empty search)

## Animation Timing

- Button press: `scale(0.97)` for 100ms
- Card expand: 200ms ease-out
- Page transitions: 150ms fade
- Slot machine spin: 1500ms total
- Skeleton pulse: 1.5s infinite

## Accessibility

- Color contrast: Cream on dark backgrounds meets WCAG AA
- All interactive elements have focus-visible outlines (gold)
- Touch targets: minimum 48x48px
- Alt text on all poster images (movie/show title)
- Reduced motion: Respect `prefers-reduced-motion`, skip slot animation and show instant result

## Icons

- Minimal icon set, inline SVG
- Custom popcorn icon for logo/brand
- Standard icons: plus (add), search, home, chevron, X (close), check (watched)
- No icon library needed, hand-craft or use Lucide for the basics

## Logo / Brand Kit

- SVG popcorn bucket icon with "Captain Popcorn" text
- Copyable SVG available in app settings or share screen
- Colors: warm-gold bucket, cream popcorn, deep-red stripes
