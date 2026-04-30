# HUD Terminal Indicators Design

Replace the clipped border-based active terminal highlight with a floating HUD-style badge in the top-right corner of each terminal pane.

## Requirements

- **Floating HUD Badge:** A small, rounded label ("MAIN", "COMPANION A", "COMPANION B") in the top-right of every terminal pane.
- **Active State:** Solid background using `var(--accent)`, bold text (likely white or high contrast).
- **Inactive State:** Transparent background with an outline in `var(--text-muted)`.
- **Non-intrusive:** `pointer-events: none` ensures the badge doesn't block text selection or clicks.
- **Removal:** Remove the existing `2px solid var(--accent)` outline that is currently being clipped/pushed off-screen.

## Architecture & Components

### `TerminalPane.tsx`
This component manages the layout of the terminal panes. It will be updated to:
1.  Remove the `outline`, `outlineOffset`, and `zIndex` logic related to the active focus border.
2.  Inject the HUD badge into each pane container.

### Component Structure
Each pane (Main, Companion A, Companion B) will have its container updated:
```tsx
<div style={{ position: 'relative', ... }}>
  {/* The terminal stack */}
  {children}
  
  {/* The HUD Badge */}
  <div style={{
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    pointerEvents: 'none',
    zIndex: 20,
    backgroundColor: focused ? 'var(--accent)' : 'transparent',
    color: focused ? '#fff' : 'var(--text-muted)',
    border: focused ? '1px solid var(--accent)' : '1px solid var(--text-muted)',
    textTransform: 'uppercase'
  }}>
    {label}
  </div>
</div>
```

## Data Flow
The `focused` state is already passed down or calculated in `TerminalPane.tsx` (e.g., `splitFocused === 'main'`). This state will now drive the visual appearance of the HUD badge instead of the container outline.

## Testing Strategy
- **Visual Verification:** Manually verify that switching focus between panes updates the HUD badges correctly.
- **Regression:** Ensure that clicking the terminal panes still focuses them (the HUD badge's `pointer-events: none` is critical here).
- **Clipping Check:** Verify the badge is clearly visible and not clipped by the pane boundaries.
