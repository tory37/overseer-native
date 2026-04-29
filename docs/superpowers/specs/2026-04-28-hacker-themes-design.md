# Design Spec: Hacker Themes Expansion

Adding high-contrast, "hacker-style" dark themes to the Overseer terminal application.

## 1. Problem Statement
Users want more diverse dark theme options, specifically high-contrast "hacker" aesthetics like red, orange (amber), green (matrix), purple (cyberpunk), and cyan (deep sea).

## 2. Proposed Approach
Add 5 new builtin themes to the `BUILTIN_THEMES` array in `src/renderer/store/theme.ts`. Each theme will follow the established schema for Overseer themes, focusing on high-contrast accents against very dark or pure black backgrounds.

## 3. Theme Definitions

### 3.1 Code Red
- **ID**: `code-red`
- **Name**: `Code Red`
- **Colors**:
  - `bg-main`: `#0a0a0a`
  - `bg-header`: `#151515`
  - `bg-sidebar`: `#121212`
  - `bg-active-tab`: `#4a0000`
  - `bg-inactive-tab`: `#1a1a1a`
  - `bg-terminal`: `#0a0a0a`
  - `text-main`: `#ffffff`
  - `text-muted`: `#880000`
  - `accent`: `#ff0000`
  - `border`: `#330000`
  - `terminal-bg`: `#0a0a0a`
  - `terminal-fg`: `#ff0000`

### 3.2 Amber Alert
- **ID**: `amber-alert`
- **Name**: `Amber Alert`
- **Colors**:
  - `bg-main`: `#0d0d0d`
  - `bg-header`: `#1a1a1a`
  - `bg-sidebar`: `#141414`
  - `bg-active-tab`: `#b37700`
  - `bg-inactive-tab`: `#1a1a1a`
  - `bg-terminal`: `#0d0d0d`
  - `text-main`: `#ffb000`
  - `text-muted`: `#805800`
  - `accent`: `#ffb000`
  - `border`: `#332200`
  - `terminal-bg`: `#0d0d0d`
  - `terminal-fg`: `#ffb000`

### 3.3 Matrix
- **ID**: `matrix`
- **Name**: `Matrix`
- **Colors**:
  - `bg-main`: `#000500`
  - `bg-header`: `#000a00`
  - `bg-sidebar`: `#000700`
  - `bg-active-tab`: `#00330d`
  - `bg-inactive-tab`: `#000a00`
  - `bg-terminal`: `#000500`
  - `text-main`: `#00ff41`
  - `text-muted`: `#008020`
  - `accent`: `#00ff41`
  - `border`: `#002209`
  - `terminal-bg`: `#000500`
  - `terminal-fg`: `#00ff41`

### 3.4 Cyberpunk
- **ID**: `cyberpunk`
- **Name**: `Cyberpunk`
- **Colors**:
  - `bg-main`: `#0d0221`
  - `bg-header`: `#1a0442`
  - `bg-sidebar`: `#130330`
  - `bg-active-tab`: `#ff00ff`
  - `bg-inactive-tab`: `#1a0442`
  - `bg-terminal`: `#0d0221`
  - `text-main`: `#ffffff`
  - `text-muted`: `#ff00ff`
  - `accent`: `#ff00ff`
  - `border`: `#1a0442`
  - `terminal-bg`: `#0d0221`
  - `terminal-fg`: `#ff00ff`

### 3.5 Deep Sea
- **ID**: `deep-sea`
- **Name**: `Deep Sea`
- **Colors**:
  - `bg-main`: `#010a10`
  - `bg-header`: `#021a2b`
  - `bg-sidebar`: `#021421`
  - `bg-active-tab`: `#00f0ff`
  - `bg-inactive-tab`: `#021a2b`
  - `bg-terminal`: `#010a10`
  - `text-main`: `#ffffff`
  - `text-muted`: `#00f0ff`
  - `accent`: `#00f0ff`
  - `border`: `#021a2b`
  - `terminal-bg`: `#010a10`
  - `terminal-fg`: `#00f0ff`

## 4. Implementation Plan
1.  Update `src/renderer/store/theme.ts` to include the new themes in the `BUILTIN_THEMES` array.
2.  Verify the themes are correctly applied by switching to them in the UI.

## 5. Testing
1.  Verify that all new themes appear in the Settings/Theme selection.
2.  Verify that selecting a theme updates the application's CSS variables as expected.
3.  Verify that the terminal foreground/background colors update correctly.
