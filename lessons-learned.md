# Lisa Loops — Lessons Learned

This file is read before every test run and updated after. It accumulates practical knowledge about testing this specific app. Lisa never makes the same mistake twice.

## App-Specific Quirks

- The app uses demo mode (no real auth). All `/app/*` routes require demo mode to be active — without it, users are redirected to `/`.
- Demo mode is entered by clicking "Try Demo" on the landing page, which calls `enterDemoMode()` and navigates to `/app/dashboard`.
- An onboarding tour auto-starts on first demo dashboard visit (500ms delay). Tests should account for this overlay and dismiss it when testing other dashboard features.
- To dismiss the onboarding tour: click "Next" 5 times, then click the finish/done/complete button. The tour has 6 steps total. Without dismissing, the tour overlay blocks interaction with buttons behind it and causes timeouts.
- Role switching is done via the demo banner (Admin/Manager/Requestor buttons), not through a settings page.
- The sidebar is only visible on `md:` breakpoints and above (≥768px). On mobile, a bottom nav + "More" sheet is used instead.
- Permissions gate both UI visibility (PermissionGate component) and route access (useEffect redirects in Settings/Analytics).

## Timing & Loading

- Onboarding tour appears after a 500ms setTimeout on first demo visit.
- Page transitions use framer-motion AnimatePresence — slight animation delays between route changes.
- Demo data is generated synchronously in-memory (no async loading), so pages should render quickly.
- After navigating between routes, wait for the specific h1 text (e.g., `getByRole('heading', { level: 1, name: /product catalog/i })`) rather than a generic h1, because framer-motion page transitions may briefly show the previous page's h1.

## Selectors & DOM Notes

- Dashboard metric cards are wrapped in `[data-tour="metrics"]`.
- ItemFormSheet inputs use `name` attributes (e.g., `input[name="name"]`, `input[name="sku"]`) but no `id` or proper `htmlFor` label association — use `page.locator('input[name="..."]')` instead of `getByLabel`.
- The needs-attention section uses `[data-tour="needs-attention"]`.
- Demo banner contains role switcher buttons with text "Admin", "Manager", "Requestor".
- Demo banner dismiss button has `aria-label="Dismiss demo banner"`.
- Catalog uses a standard `<table>` with `<thead>` and `<tbody>` elements.
- The onboarding tour uses an overlay component — look for "Welcome to Stackwise!" text.
- Command palette is triggered by `Ctrl+K` / `Meta+K` keyboard shortcut.
- User dropdown is in the Header component — contains "Exit Demo" option.

## Common Failure Patterns

- The sidebar has collapsible group buttons labeled "Admin", "Operations", etc. — when targeting banner role buttons, use `.first()` or scope to avoid strict mode violations with duplicate button names.
- "Low Stock", "In Stock", "Out of Stock" text appears both in metric cards and as StatusBadge labels throughout the page. Scope to `[data-tour="metrics"]` when checking dashboard metric cards.

- There are 3 "Try Demo" buttons on the landing page (nav bar + 2 in sections). Use `.nth(1)` to click the hero section one, as `.first()` may target the hidden nav button on smaller viewports. Alternatively scope via `page.locator('section').filter({ hasText: 'AI-Powered Inventory' }).getByRole('button', { name: /try demo/i })`.
- Sidebar navigation groups (Operations, Procurement, Intelligence, Admin) are collapsible. Links like "Movements", "Suppliers" are hidden until the group is expanded. Clicking the group button text may conflict with demo banner buttons of the same name. In some test sessions, sidebar links are visible by default; in others they are collapsed. This is session-dependent.
- When sidebar links are not accessible, try using command palette (Ctrl+K) to navigate, but note that clicking command palette results can also time out.
- Always set `page.setViewportSize({ width: 1280, height: 800 })` to ensure desktop sidebar is visible.
- When sidebar links are in collapsed groups, use `document.querySelectorAll('a')` in `page.evaluate()` to find and click links by href (e.g., `a.href.includes('/app/locations')`) — this bypasses visibility issues. Wait 3s after for the page transition to complete. First expand the parent group button (e.g., "Operations") before using evaluate.
- Clicking sidebar links with Playwright's `.click()` can time out even when the link is visible. Prefer `page.evaluate()` to click links via href matching — it's more reliable.
- `page.goto('/app/...')` does NOT work for in-app navigation because demo mode state is in-memory and lost on full page reload. Always use client-side navigation (sidebar clicks or `page.evaluate`).
- Radix Select dropdowns in the PO LineItemsEditor render options outside the viewport, causing "Element is outside of the viewport" errors in Playwright. Using `force: true` doesn't help. The `page.evaluate(() => el.click())` approach selects the DOM element but doesn't trigger Radix's internal state change. **WORKAROUND**: Use keyboard navigation instead — click the trigger, then `ArrowDown` + `Enter` to select the first option. This works reliably.
- When using `page.evaluate` to find sidebar links right after `waitForURL`, sidebar may not yet be mounted if wait time is too short. Use `waitForTimeout(8000)` after demo button click instead of `waitForURL` + short delay, to ensure the full app shell (sidebar, header) renders before querying links.
- Request form: Title input has placeholder "Short description", default line item row exists (no need to click Add Item), use `.first()` for "Select item" when multiple rows exist.

## Fix Patterns

When a bug is found and fixed, document the pattern here so similar bugs can be fixed faster.
