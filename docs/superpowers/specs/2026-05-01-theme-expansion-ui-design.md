# Design Spec: Theme Expansion and UI Enhancements

**Goal:** Clean up the existing theme library to focus on Overseer branding and biological/mythological themes, add new categories (Aliens, Warhammer, Fantasy, Mythology, Classic Monsters), and improve the theme selection UI with arrow buttons and keyboard navigation.

## 1. Theme Library Cleanup
- **Remove Standard Themes:** The following themes will be removed from `BUILTIN_THEMES` in `src/renderer/store/theme.ts`:
  - Monokai
  - Solarized Dark
  - Nord
  - Code Red
  - Amber Alert
  - Matrix
  - Cyberpunk
  - Deep Sea
- **Retain:**
  - Overseer Dark
  - Overseer Light
  - All themes in `ANIMAL_THEMES` (includes current animals and cryptids).

## 2. New Theme Categories
New themes will be implemented as individual files in `src/renderer/themes/` and aggregated in `src/renderer/themes/index.ts`.

### 2.1 Aliens
- **Xenomorph:** Pitch black, biomechanical grey, acid green accents.
- **Predator:** Jungle dark green, thermal vision red, plasma blue.
- **Sectoid (XCom):** Psi-purple, sterile lab white/grey.
- **Reaper (Mass Effect):** Synthetic metallic blue, sinister red glow.
- **Elite (Halo):** Sangheili purple, energy sword cyan.
- **Ridley (Metroid):** Purple/Magenta hide, orange fire glow.

### 2.2 Warhammer (Grimdark)
- **Tyranid (Leviathan):** Bone white, purple carapace, red bio-details.
- **Necron:** Gunmetal grey, glowing gauss green.
- **Bloodletter (Khorne):** Brass and blood red.
- **Horror (Tzeentch):** Shifting blue, pink, and gold.

### 2.3 Fantasy & Mythology
- **Dragon:** Charcoal black, gold leaf, embers orange.
- **Phoenix:** Deep crimson, bright orange, white-hot yellow.
- **Valkyrie:** Sky blue, silver armor, gold trim.
- **Cerberus:** Ash grey, lava orange, hellfire red.
- **Pegasus:** Pure white, soft blue, golden aura.

### 2.4 Classic Monsters
- **Vampire:** Velvet red, black lace, pale skin white.
- **Werewolf:** Midnight blue, fur brown, yellow eyes.
- **Ghost:** Spectral teal, translucent grey, white glow.
- **Frankenstein:** Sickly green, bolted metal grey, electric blue.

## 3. UI Enhancements

### 3.1 Theme Selector Layout
In `SettingsModal.tsx`, the theme selector will be updated:
- The `<select>` element will be flanked by "Previous" (`<`) and "Next" (`>`) buttons.
- Buttons will use standard Overseer styling (ghost buttons with icons or simple text).

### 3.2 Keyboard Navigation
- While the `SettingsModal` is open and the theme selector is focused (or globally within the modal if appropriate), the `Left` and `Right` arrow keys will cycle through the `allThemes` array.
- This will trigger `setActiveTheme` immediately, allowing for rapid visual preview.

## 4. Implementation Details
- **Store Update:** `src/renderer/store/theme.ts` will be updated to export categorized theme lists if useful, or just a flattened `BUILTIN_THEMES`.
- **Theme Files:** 19 new `.ts` files in `src/renderer/themes/`.
- **Component Update:** `src/renderer/components/SettingsModal.tsx` will handle the new UI and event listeners.

## 5. Verification Plan
- **Visual Check:** Verify each of the 19 new themes applies correctly and covers all 12 color keys.
- **UI Interaction:** Verify arrow buttons cycle themes in the correct order (circularly).
- **Keyboard Interaction:** Verify `Left` and `Right` keys work as expected.
- **Regression:** Ensure "Overseer Dark/Light" still work and are at the top of the list.
