# Design Brief

## Direction

Vault — a dark, technical secure file-sharing console where encryption and access control feel tangible and trustworthy.

## Tone

Dark, precise, security-operations: deep slate-near-black surfaces, sharp cyan/teal accents, and monospace hashes/tokens — restrained for a productivity app but unmistakably a security product.

## Differentiation

The "terminal-hash" identity: every hash, token, and security status renders in JetBrains Mono with a live status dot, over a faint grid motif — making encryption and integrity visible at a glance.

## Color Palette

| Token      | OKLCH (dark)   | Role                          |
| ---------- | -------------- | ----------------------------- |
| background | 0.135 0.015 260| deep slate-near-black base    |
| foreground | 0.94 0.012 260 | primary text                  |
| card       | 0.17 0.018 260 | elevated surfaces             |
| primary    | 0.72 0.15 195  | cyan/teal — encryption/trust  |
| accent     | 0.72 0.15 195  | active/highlight states       |
| muted      | 0.21 0.02 260  | secondary surfaces            |
| success    | 0.66 0.17 150  | verified/encrypted status     |
| warning    | 0.76 0.15 80   | expiring/attention status     |
| destructive| 0.58 0.22 25   | revoked/error/delete          |

## Typography

- Display: Space Grotesk — headings, hero, dashboard numbers
- Body: DM Sans — paragraphs, UI labels, tables
- Mono: JetBrains Mono — hashes, tokens, timestamps, status codes
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl font-semibold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm text-base`

## Elevation & Depth

Layered surfaces (background → card → popover) with hairline borders and subtle-to-elevated shadows; depth via layering and a faint grid motif, not heavy glows.

## Structural Zones

| Zone    | Background  | Border   | Notes                                  |
| ------- | ----------- | -------- | -------------------------------------- |
| Sidebar | sidebar     | border-r | fixed nav, active item in accent       |
| Header  | card        | border-b | page title + actions, sticky           |
| Content | background  | —        | alternate `bg-muted/30` for sections   |
| Footer  | muted/40    | border-t | subtle, low-emphasis                    |

## Spacing & Rhythm

Section gaps `gap-6 md:gap-8`, card padding `p-5 md:p-6`, micro-spacing `gap-2`/`gap-3`; tight rhythm in tables, generous in dashboards.

## Component Patterns

- Buttons: `rounded-md`, primary uses gradient-primary, destructive red, hover lifts shadow
- Cards: `rounded-lg` on `bg-card` with `border`, `shadow-subtle`, hover `shadow-elevated`
- Badges: `rounded-full` pill, status colors (success/warning/destructive) with status dot

## Motion

- Entrance: `fade-in` 0.3s ease-out on cards/sections
- Hover: `transition-smooth` lift + shadow change
- Decorative: `status-pulse` on live security-status dots only

## Constraints

- Dark mode is the identity; light mode tuned separately, not inverted
- Token-only styling — no raw hex/rgb literals in components
- Mono font reserved for hashes, tokens, timestamps, status codes only
- Grid/scanline motifs kept subtle and never on text-heavy areas

## Signature Detail

Monospace "terminal-hash" identity with live status dots and a faint grid motif — the standout choice that makes encryption feel tangible.
