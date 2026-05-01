# Design Spec: Better Themes (Animal & Cryptid Collection)

## Overview
This specification outlines the addition of 25 new built-in themes to Overseer, themed after animals and cryptids. The goal is to provide a wide variety of visual options with a slight bias towards darker palettes (18 dark, 7 light).

## Architecture
- **Directory:** A new directory `src/renderer/themes/` will be created to house individual theme files.
- **File Format:** Each theme will be defined in its own `.ts` file (e.g., `src/renderer/themes/raven.ts`) and exported as a `Theme` object.
- **Aggregation:** An `index.ts` in `src/renderer/themes/` will import and export an array of all themes.
- **Integration:** `src/renderer/store/theme.ts` will import the aggregated themes from `src/renderer/themes/index.ts` and merge them with the core "Overseer" themes.
- **Data Structure:** Each theme follows the `Theme` interface defined in `src/renderer/types/ipc.ts`.
- **UI Integration:** Themes are automatically discovered by `SettingsModal.tsx` and applied via CSS variables in `App.tsx`.

## Theme Definitions

### Animal Themes (Dark - 11)

1.  **Raven** (`raven`)
    - bg-main: `#0c0c0d`, bg-header: `#1a1a1c`, bg-sidebar: `#121214`, bg-active-tab: `#2d2d35`, bg-inactive-tab: `#1a1a1c`, bg-terminal: `#0c0c0d`, text-main: `#d1d1d6`, text-muted: `#6e6e73`, accent: `#5856d6`, border: `#2c2c2e`, terminal-bg: `#0c0c0d`, terminal-fg: `#d1d1d6`

2.  **Bat** (`bat`)
    - bg-main: `#121212`, bg-header: `#1f1f1f`, bg-sidebar: `#181818`, bg-active-tab: `#3a3a3a`, bg-inactive-tab: `#1f1f1f`, bg-terminal: `#121212`, text-main: `#e0e0e0`, text-muted: `#7a7a7a`, accent: `#8b4513`, border: `#333333`, terminal-bg: `#121212`, terminal-fg: `#e0e0e0`

3.  **Panther** (`panther`)
    - bg-main: `#0a0e14`, bg-header: `#141b24`, bg-sidebar: `#0f151c`, bg-active-tab: `#1b2631`, bg-inactive-tab: `#141b24`, bg-terminal: `#0a0e14`, text-main: `#b2c1d1`, text-muted: `#5c6b7a`, accent: `#c0ff00`, border: `#24303d`, terminal-bg: `#0a0e14`, terminal-fg: `#b2c1d1`

4.  **Owl** (`owl`)
    - bg-main: `#1b1b13`, bg-header: `#2a2a1e`, bg-sidebar: `#222218`, bg-active-tab: `#3d3d2c`, bg-inactive-tab: `#2a2a1e`, bg-terminal: `#1b1b13`, text-main: `#d4d4c9`, text-muted: `#707060`, accent: `#6b8e23`, border: `#3a3a2a`, terminal-bg: `#1b1b13`, terminal-fg: `#d4d4c9`

5.  **Viper** (`viper`)
    - bg-main: `#081208`, bg-header: `#102410`, bg-sidebar: `#0c1a0c`, bg-active-tab: `#1a3a1a`, bg-inactive-tab: `#102410`, bg-terminal: `#081208`, text-main: `#a0d0a0`, text-muted: `#508050`, accent: `#00ff41`, border: `#153015`, terminal-bg: `#081208`, terminal-fg: `#a0d0a0`

6.  **Squid** (`squid`)
    - bg-main: `#050a1a`, bg-header: `#0a1430`, bg-sidebar: `#070f25`, bg-active-tab: `#102550`, bg-inactive-tab: `#0a1430`, bg-terminal: `#050a1a`, text-main: `#80c0ff`, text-muted: `#406080`, accent: `#00f0ff`, border: `#0e204a`, terminal-bg: `#050a1a`, terminal-fg: `#80c0ff`

7.  **Beetle** (`beetle`)
    - bg-main: `#0f0a14`, bg-header: `#1e1428`, bg-sidebar: `#160f1e`, bg-active-tab: `#2e1e3e`, bg-inactive-tab: `#1e1428`, bg-terminal: `#0f0a14`, text-main: `#c0a0e0`, text-muted: `#605070`, accent: `#39ff14`, border: `#2a1c38`, terminal-bg: `#0f0a14`, terminal-fg: `#c0a0e0`

8.  **Wolf** (`wolf`)
    - bg-main: `#1a1c1e`, bg-header: `#262a2e`, bg-sidebar: `#202327`, bg-active-tab: `#3a4149`, bg-inactive-tab: `#262a2e`, bg-terminal: `#1a1c1e`, text-main: `#d0d7de`, text-muted: `#6e7681`, accent: `#f0f6fc`, border: `#30363d`, terminal-bg: `#1a1c1e`, terminal-fg: `#d0d7de`

9.  **Scorpion** (`scorpion`)
    - bg-main: `#0d0c0b`, bg-header: `#1a1816`, bg-sidebar: `#141211`, bg-active-tab: `#2d2a27`, bg-inactive-tab: `#1a1816`, bg-terminal: `#0d0c0b`, text-main: `#cbbba9`, text-muted: `#665e55`, accent: `#e27100`, border: `#2b2824`, terminal-bg: `#0d0c0b`, terminal-fg: `#cbbba9`

10. **Crow** (`crow`)
    - bg-main: `#0a0a0c`, bg-header: `#14141a`, bg-sidebar: `#101015`, bg-active-tab: `#1e1e2d`, bg-inactive-tab: `#14141a`, bg-terminal: `#0a0a0c`, text-main: `#b8b8c8`, text-muted: `#5c5c64`, accent: `#7b68ee`, border: `#1c1c28`, terminal-bg: `#0a0a0c`, terminal-fg: `#b8b8c8`

11. **Moth** (`moth`)
    - bg-main: `#1c1a19`, bg-header: `#2b2826`, bg-sidebar: `#24211f`, bg-active-tab: `#423d3a`, bg-inactive-tab: `#2b2826`, bg-terminal: `#1c1a19`, text-main: `#dcd6d0`, text-muted: `#7a736d`, accent: `#e6db74`, border: `#3b3734`, terminal-bg: `#1c1a19`, terminal-fg: `#dcd6d0`

12. **Orca** (`orca`)
    - bg-main: `#0d1117`, bg-header: `#161b22`, bg-sidebar: `#0d1117`, bg-active-tab: `#30363d`, bg-inactive-tab: `#161b22`, bg-terminal: `#0d1117`, text-main: `#c9d1d9`, text-muted: `#8b949e`, accent: `#58a6ff`, border: `#30363d`, terminal-bg: `#0d1117`, terminal-fg: `#c9d1d9`

13. **Spider** (`spider`)
    - bg-main: `#0a0a0a`, bg-header: `#1a1a1a`, bg-sidebar: `#121212`, bg-active-tab: `#333333`, bg-inactive-tab: `#1a1a1a`, bg-terminal: `#0a0a0a`, text-main: `#d0d0d0`, text-muted: `#666666`, accent: `#ff0000`, border: `#2a2a2a`, terminal-bg: `#0a0a0a`, terminal-fg: `#d0d0d0`

### Animal Themes (Light - 7)

14. **Swan** (`swan`)
    - bg-main: `#fcfcfc`, bg-header: `#f2f2f2`, bg-sidebar: `#f7f7f7`, bg-active-tab: `#e0f0ff`, bg-inactive-tab: `#f2f2f2`, bg-terminal: `#fcfcfc`, text-main: `#333333`, text-muted: `#888888`, accent: `#007aff`, border: `#dddddd`, terminal-bg: `#fcfcfc`, terminal-fg: `#333333`

15. **Fox** (`fox`)
    - bg-main: `#fffaf0`, bg-header: `#fdf2e9`, bg-sidebar: `#fdf5ef`, bg-active-tab: `#fce4d6`, bg-inactive-tab: `#fdf2e9`, bg-terminal: `#fffaf0`, text-main: `#5d4037`, text-muted: `#8d6e63`, accent: `#e67e22`, border: `#eddcd2`, terminal-bg: `#fffaf0`, terminal-fg: `#5d4037`

16. **Tiger** (`tiger`)
    - bg-main: `#fffaf4`, bg-header: `#fdf1e8`, bg-sidebar: `#fdf5ef`, bg-active-tab: `#f9d8c4`, bg-inactive-tab: `#fdf1e8`, bg-terminal: `#fffaf4`, text-main: `#4a3728`, text-muted: `#7a6352`, accent: `#f39c12`, border: `#eddbce`, terminal-bg: `#fffaf4`, terminal-fg: `#4a3728`

17. **Dolphin** (`dolphin`)
    - bg-main: `#f0f8ff`, bg-header: `#e6f3ff`, bg-sidebar: `#ebf5ff`, bg-active-tab: `#cce6ff`, bg-inactive-tab: `#e6f3ff`, bg-terminal: `#f0f8ff`, text-main: `#2c3e50`, text-muted: `#5d6d7e`, accent: `#3498db`, border: `#d4e6f1`, terminal-bg: `#f0f8ff`, terminal-fg: `#2c3e50`

18. **Bee** (`bee`)
    - bg-main: `#fffffa`, bg-header: `#fffbe6`, bg-sidebar: `#fffdf0`, bg-active-tab: `#fff3bf`, bg-inactive-tab: `#fffbe6`, bg-terminal: `#fffffa`, text-main: `#333300`, text-muted: `#666633`, accent: `#f1c40f`, border: `#f9e79f`, terminal-bg: `#fffffa`, terminal-fg: `#333300`

19. **Flamingo** (`flamingo`)
    - bg-main: `#fff5f7`, bg-header: `#ffebee`, bg-sidebar: `#fff0f3`, bg-active-tab: `#ffd1dc`, bg-inactive-tab: `#ffebee`, bg-terminal: `#fff5f7`, text-main: `#880e4f`, text-muted: `#c2185b`, accent: `#ff4081`, border: `#f8bbd0`, terminal-bg: `#fff5f7`, terminal-fg: `#880e4f`

20. **Rabbit** (`rabbit`)
    - bg-main: `#fcf9f2`, bg-header: `#f7f2e8`, bg-sidebar: `#faf7ef`, bg-active-tab: `#f0e6d2`, bg-inactive-tab: `#f7f2e8`, bg-terminal: `#fcf9f2`, text-main: `#5d4037`, text-muted: `#8d6e63`, accent: `#2ecc71`, border: `#e8dfcc`, terminal-bg: `#fcf9f2`, terminal-fg: `#5d4037`

### Cryptid Themes (Dark - 5)

21. **Chupacabra** (`chupacabra`)
    - bg-main: `#14100d`, bg-header: `#241d18`, bg-sidebar: `#1c1612`, bg-active-tab: `#3a2e26`, bg-inactive-tab: `#241d18`, bg-terminal: `#14100d`, text-main: `#d2b48c`, text-muted: `#8b7d6b`, accent: `#b22222`, border: `#332822`, terminal-bg: `#14100d`, terminal-fg: `#d2b48c`

22. **Bigfoot** (`bigfoot`)
    - bg-main: `#1a1410`, bg-header: `#2d231c`, bg-sidebar: `#241c16`, bg-active-tab: `#45362b`, bg-inactive-tab: `#2d231c`, bg-terminal: `#1a1410`, text-main: `#c0b0a0`, text-muted: `#6d5d4d`, accent: `#4b3621`, border: `#3a2d24`, terminal-bg: `#1a1410`, terminal-fg: `#c0b0a0`

23. **Mothman** (`mothman`)
    - bg-main: `#0a0a0a`, bg-header: `#151515`, bg-sidebar: `#0f0f0f`, bg-active-tab: `#252525`, bg-inactive-tab: `#151515`, bg-terminal: `#0a0a0a`, text-main: `#a0a0a0`, text-muted: `#505050`, accent: `#ff0000`, border: `#1c1c1c`, terminal-bg: `#0a0a0a`, terminal-fg: `#a0a0a0`

24. **Kraken** (`kraken`)
    - bg-main: `#000c14`, bg-header: `#001a2c`, bg-sidebar: `#001320`, bg-active-tab: `#002e4d`, bg-inactive-tab: `#001a2c`, bg-terminal: `#000c14`, text-main: `#70a0c0`, text-muted: `#3d5a6d`, accent: `#800080`, border: `#00223d`, terminal-bg: `#000c14`, terminal-fg: `#70a0c0`

25. **Wendigo** (`wendigo`)
    - bg-main: `#0c1218`, bg-header: `#182430`, bg-sidebar: `#121b24`, bg-active-tab: `#243648`, bg-inactive-tab: `#182430`, bg-terminal: `#0c1218`, text-main: `#e0f0ff`, text-muted: `#7090b0`, accent: `#b0c4de`, border: `#203040`, terminal-bg: `#0c1218`, terminal-fg: `#e0f0ff`

## Testing Strategy
- **Visual Verification:** Manually verify each theme in the `SettingsModal` and ensure all UI elements (tabs, sidebar, terminal) are legible and consistent.
- **Contrast Check:** Verify that `text-main` against `bg-main` and `terminal-fg` against `terminal-bg` meets a minimum contrast ratio of 4.5:1.
- **Regression:** Ensure existing built-in themes (Overseer Dark, Overseer Light, etc.) are unaffected.
