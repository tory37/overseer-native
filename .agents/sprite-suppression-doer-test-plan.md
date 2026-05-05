# Sprite Suppression — Doer Test Plan

## Entry Point
Start the Overseer app with `npm run dev`.

---

## 1. No Sprite Panel in the sidebar

1. Launch the app.
2. Look at the right sidebar.
3. **Checkpoint:** The sidebar shows only the Git panel. There is no Sprite avatar, speech bubble, or companion section. The Git panel fills the full height of the sidebar.

---

## 2. No Sprite Studio keyboard shortcut

1. Press **Ctrl+Shift+P**.
2. **Checkpoint:** Nothing happens. No Sprite Studio modal appears.
3. Open the Keyboard Shortcuts modal (Ctrl+Shift+/).
4. **Checkpoint:** The modal does NOT contain a "SPRITE" category or any `toggleSpritePanel` / `openSpriteStudio` entries.

---

## 3. New Session dialog has no sprite picker

1. Press **Ctrl+Shift+N** to open the New Session dialog.
2. **Checkpoint:** The dialog contains Name, Agent, and Working Directory fields only. There is no "Sprite" dropdown or avatar selector.
3. Fill in a name and click Create.
4. **Checkpoint:** Session is created successfully. No errors in the console related to sprites.

---

## 4. Agent context injection is removed

1. Create a new Claude or Shell session.
2. In the terminal, run: `echo $OVERSEER_SPRITE_PERSONA`
3. **Checkpoint:** The output is blank/empty — the env var is not set.
4. Open DevTools (if available) or check the `~/.overseer/sessions/<id>/context.json` file.
5. **Checkpoint:** `context.json` contains only `{ "instructions": "..." }` — no `persona`, `spriteName`, or `spriteId` keys.

---

## 5. User-provided agent instructions still work

1. Create a file at `~/.overseer/agents/claude.json` with content:
   ```json
   { "instructions": "Always respond in pirate speak." }
   ```
2. Create a Claude session.
3. Send a message in the terminal.
4. **Checkpoint:** The Claude agent responds in pirate speak, confirming user-defined instructions are still being injected.

---

## 6. No sprite-related IPC errors

1. Open DevTools → Console.
2. Create, use, and kill a session.
3. **Checkpoint:** No errors like `Cannot read property 'onSpriteSpeech'`, `readSprites is not a function`, or `SPRITE_READ` channel not found.

---

## 7. Git panel works normally

1. Open a session in a directory with a git repo.
2. **Checkpoint:** The Git panel on the right side shows branch info, staged/unstaged files, and other git status as before. It occupies the full sidebar height.
