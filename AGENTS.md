# Overseer Architecture Map

## 1. App Summary
Overseer is an Electron-based terminal manager featuring a native PTY backend, a React frontend, integrated Git tools, and Sprite companions for AI-assisted workflows.

## 2. Core Tech Stack
- **Languages:** TypeScript, Node.js, HTML/CSS
- **Frameworks:** Electron, React, Node-PTY, Zustand (State Management), Simple-Git
- **Build Tools:** Vite (Renderer), tsc (Main), electron-builder
- **Testing:** Jest, ts-jest, React Testing Library

## 3. Architecture Boundaries & IPC
- **Main Process:** Handles native system access, PTY lifecycle, and Git operations.
- **Renderer Process:** Handles the React UI and user interactions.
- **IPC Communication:** Mediated through context bridge (`src/main/preload.ts`).
- **Channel Definitions:** All IPC channels are strictly defined in `src/renderer/types/ipc.ts`.
- **IPC Handlers:** Main process listeners are registered in `src/main/ipc-handlers.ts`.

## 4. Strategic Index
- **`src/main/`**: Core Main process logic.
  - `session-service/`: PTY lifecycle and terminal buffers.
  - `services/`: Configuration, sync, update, and shell environment utilities.
  - `index.ts`: Application entry point and window creation.
- **`src/renderer/`**: React frontend.
  - `components/`: UI components (TerminalPane, GitPanel, SpritePanel, Settings).
  - `store/`: Zustand state definitions (`sessions.ts`, `sprites.ts`, `theme.ts`).
  - `themes/`: Application color themes.
  - `types/`: Shared TypeScript definitions.
- **`tests/`**: Contains all unit and integration tests.
- **`docs/`**: Project documentation, skills, and plans.

## 5. Complex Subsystems
- **PTY Session Service (`src/main/session-service/`)**:
  - Handles shell processes, scrollback buffers, and PTY I/O.
  - *If working on this subsystem, first read `src/main/session-service/AGENTS.md`.*
- **Sprite System (`src/renderer/components/` & `src/main/sprite-parser.ts`)**:
  - Handles companion character logic, parsing, and rendering.
  - *If working on this subsystem, first read `src/renderer/components/AGENTS.md`.*

## 6. Testing Strategy & Dev Guidelines
- **Tests Location:** `tests/main/` (Node environment) and `tests/renderer/` (JSDOM environment).
- **Run Dev Server:** `npm run dev` (starts Vite dev server and Electron app).
- **Run Tests:** `npm test` runs the full Jest test suite.
- **Conventions:**
  - Never bypass the typed IPC interface. All new channels must be added to `src/renderer/types/ipc.ts`.
  - Prefer explicit functional composition and Zustand over complex state threading.
