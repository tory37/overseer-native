// ToolContext is the complete API surface between Overseer and your tool.
// This file is intentionally self-contained — do not import from Overseer.
export interface ToolContext {
  version: 1
  cwd: string        // absolute path to the active session's working directory
  sessionId: string  // active session ID (opaque string)
}
