# Design Spec: Power Rangers Theme Expansion

## Overview
Add 11 new "Ranger" themes to the Overseer theme library. These themes follow the established "biological/mythological/archetypal" theme direction by treating the Power Rangers as modern heroic archetypes.

## Goals
- Add 11 Power Ranger themed color palettes.
- Ensure all themes meet WCAG AA contrast ratios (4.5:1).
- Maintain consistency with existing theme modularity.

## Theme List & Color Palettes

All themes will implement the `Theme` interface from `src/renderer/types/ipc.ts`.

| Theme | Background (Main/Sidebar) | Accent | Text Main | Terminal FG |
|-------|---------------------------|--------|-----------|-------------|
| **Red Ranger** | `#1a0505` (Dark Red) | `#ff0000` | `#eeeeee` | `#ff4444` |
| **Yellow Ranger** | `#1a1a05` (Dark Gold) | `#ffcc00` | `#eeeeee` | `#ffcc00` |
| **Green Ranger** | `#051a05` (Deep Green) | `#00ff00` | `#eeeeee` | `#00ff00` |
| **Blue Ranger** | `#05051a` (Deep Blue) | `#00aaff` | `#eeeeee` | `#00aaff` |
| **Black Ranger** | `#0a0a0a` (Jet Black) | `#ffffff` | `#cccccc` | `#ffffff` |
| **Pink Ranger** | `#1a0515` (Dark Pink) | `#ff69b4` | `#eeeeee` | `#ff69b4` |
| **White Ranger** | `#f5f5f5` (Pearl White) | `#ffd700` | `#333333` | `#ffd700` |
| **Purple Ranger** | `#10051a` (Deep Purple) | `#bf00ff` | `#eeeeee` | `#bf00ff` |
| **Silver Ranger** | `#1a1c1e` (Gunmetal) | `#c0c0c0` | `#eeeeee` | `#c0c0c0` |
| **Gold Ranger** | `#1a1505` (Bronze) | `#ffd700` | `#eeeeee` | `#ffd700` |

*Note: Backgrounds are intentionally darkened to ensure text and accents pop while maintaining contrast.*

## Technical Steps
1. Create 11 individual theme files in `src/renderer/themes/`.
2. Export all new themes from `src/renderer/themes/index.ts` within a `RANGER_THEMES` array.
3. Include `RANGER_THEMES` in `BUILTIN_THEMES` in `src/renderer/store/theme.ts`.
4. Update `tests/renderer/ThemeStore.test.tsx` to verify presence of Ranger themes.

## Verification
- Run `npm test` to ensure all tests pass.
- Manually verify contrast ratios using a contrast checker if any color appears borderline.
