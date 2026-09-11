---
name: responsive-layout-convention
description: How the Smart_Home_UI_Rework app implements mobile responsiveness
metadata:
  type: project
---

The Smart_Home_UI_Rework app is styled entirely with fixed-pixel inline styles (no CSS classes / Tailwind utilities for layout). Responsiveness (added down to ~375px) is done at runtime via the `useIsMobile()` hook in `src/hooks/useMediaQuery.ts` (breakpoint `(max-width: 768px)`), branching inline-style objects on `isMobile`.

Key patterns to reuse when adding views:
- Global chrome: `SidebarRail` becomes a fixed bottom nav on mobile; `App` main sets `marginLeft: 0` and bottom padding `88px` to clear it.
- Detail panels (`DeviceDetailPanel`, `RuleDetailPanel`) render full-width inside `src/components/DetailOverlay.tsx` (a bottom sheet) on mobile instead of a 360px side column.
- Tables (`AllDevices`, `AllRules`) drop secondary grid columns on mobile via conditional `<span>`s + a mobile `gridTemplateColumns`, and switch the page from internal-scroll (`calc(100vh-160px)`) to natural page scroll.
- The floor-map views already scale via `FloorMapFrame` (`width:100%; maxWidth:780; aspectRatio:1/1`) with %-positioned `GraphBubble`s — no change needed there.

**Why:** keeps the desktop design pixel-identical while stacking on phones.
**How to apply:** new pages should call `useIsMobile()` and follow these branches rather than adding CSS media queries.

Verification note: this sandbox cannot download the Playwright/Chromium browser binary (network-blocked), so live headless screenshots aren't possible — verify via `vite` module transforms + `tsc` instead.
