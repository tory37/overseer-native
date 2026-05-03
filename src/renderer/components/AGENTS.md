# UI Components & Sprite System Architecture

This directory (`src/renderer/components/`) contains the React UI components for the Overseer application, with a significant focus on the Sprite companion subsystem.

## The Sprite System

The Sprite System provides visual representations of AI personas within the terminal environment. It involves both the frontend UI and the main process parser.

- **`SpriteStudio.tsx`:** The editor interface for creating and modifying Sprites. Uses DiceBear avatars (`lib/dicebear-styles.ts`) for rendering, styles, and seeds.
- **`SpritePanel.tsx`:** Displays the active Sprite alongside the terminal. Handles speech bubbles, layout constraints, and animation states (e.g., idle, talking, thinking).
- **State Management:** Sprite state (creation, editing, selection) is managed globally via Zustand in `src/renderer/store/sprites.ts`.
- **Backend Parsing:** While the UI is here, `src/main/sprite-parser.ts` handles the parsing of raw terminal output to identify Sprite actions or speech, relaying it back to these components via IPC.

## General UI Guidelines

- **State Management:** Prefer Zustand (`useSpritesStore`, `useSessionsStore`, etc.) for shared state over prop-drilling.
- **Responsiveness:** Components like `TerminalPane` and `SpritePanel` must respond cleanly to window resizing events and split views.
- **Separation of Concerns:** Keep complex logic (like parsing terminal output or managing PTYs) in the Main process. The UI components should strictly handle rendering and user interactions.
