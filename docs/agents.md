# Project Agents

## Build Conventions

- Max 250 lines per file — extract components early
- Mobile-first: design for 390px, scale up
- Every async operation needs loading and error states
- Use Geist Sans for UI text, Geist Mono for SKUs/quantities/numbers
- All colors via semantic tokens — never hardcode colors in components
- Demo mode and real auth share the same components; data source is abstracted

## Patterns to Follow

- TanStack Router: use Navigate component for redirects, not beforeLoad (avoids hydration warnings)
- Sidebar collapse: conditional render (`{!collapsed && ...}`) not CSS max-h trick (Playwright visibility)
- Mobile sidebar: Sheet component from left, pass onNavigate callback to close on link click
- Font loading: variable woff2 in public/fonts/, @font-face in styles.css, register in @theme inline

## Mistakes to Avoid

- Don't use max-h-0/overflow-hidden for collapsible sections — elements remain "visible" to testing tools
- Don't use beforeLoad + throw redirect() — causes React hydration warnings in SSR

## Testing Notes

- Filter "Failed to load resource" from console error checks (missing favicon etc.)
- Playwright toBeVisible/toBeHidden checks DOM visibility, not CSS visual hiding
- Toaster (sonner) must be mounted in root layout — without it, toast() calls are silently dropped
