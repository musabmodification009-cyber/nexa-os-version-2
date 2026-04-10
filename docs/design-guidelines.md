# Design Guidelines

## Color Palette

- Primary: oklch(0.55 0.17 162) — teal/emerald for buttons, links, active states
- Secondary: oklch(0.75 0.15 75) — warm amber for alerts, highlights, CTAs
- Background: oklch(0.985 0.005 80) — warm off-white
- Surface: oklch(1 0 0) — cards, modals, elevated elements
- Border: oklch(0.92 0.01 80) — subtle warm gray dividers
- Text: oklch(0.18 0.03 160) — deep teal-charcoal primary text
- Text Muted: oklch(0.55 0.02 160) — secondary text, placeholders
- Error: oklch(0.60 0.22 25) — coral red
- Success: oklch(0.60 0.17 155) — emerald green
- Stock status: green dot (in stock), amber pulse (low), solid red (out of stock)

## Typography

- Font family: Geist Sans (display + body), Geist Mono (SKUs, numbers, quantities)
- Headings: Semibold 600, scale 2xl/xl/lg
- Body: 14px regular
- Small/caption: 12px

## Spacing

- Base unit: 4px — use multiples
- Card padding: 20px (5 units)
- Section gaps: 24px (6 units)
- Page margins: 16px mobile, 32px desktop

## Component Defaults

- Buttons: solid teal primary, amber for CTAs/warnings, 4px radius, 150ms transitions
- Cards: white surface, 1px border, 6px radius, no shadow (matte ceramic)
- Inputs: 1px border, 4px radius, teal focus ring
- Modals/overlays: side-sheets sliding from right for detail views
- Navigation: fixed 260px sidebar, collapsible on mobile

## Layout Patterns

- Mobile breakpoint: 390px
- Content max width: 1400px
- Grid: 12-column on desktop, single column stacked on mobile
- Tables: pagination (no infinite scroll), sticky headers

## Tone

- Dense but breathable command-center aesthetic. Calm teal conveys operational control; amber sparingly draws attention to actions and alerts. Matte surfaces with sharp 4-6px radii, 1px borders, no glassmorphism. Monospace numbers for scanability.
