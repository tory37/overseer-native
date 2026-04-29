# Design Spec: Active Tab Visibility Improvement

## Goal
Make the active session tab in the `TabBar` significantly more visible and "elevated" compared to inactive tabs, following a modern UI aesthetic.

## Proposed Changes

### 1. `TabBar.tsx` Component
Modify the styling of the active tab to include:
- **Background Color**: Use `var(--bg-active-tab)` instead of `var(--bg-main)`.
- **Accent Indicator**: Add a `border-top` of 3px using `var(--accent)`.
- **Typography**: Change `font-weight` to `bold` for the active session name.
- **Elevation**: Add a subtle `box-shadow` to the active tab to make it "pop" from the header.
- **Sizing**: Increase `padding` slightly for the active tab to make it more prominent.
- **Border Radius**: Adjust `border-radius` for a more modern look (e.g., `6px 6px 0 0`).

### 2. Style Details
```tsx
// Active tab style draft
{
  padding: '6px 16px', // Increased from 4px 12px
  background: 'var(--bg-active-tab)',
  color: 'var(--text-main)', // High contrast might be needed
  border: 'none',
  borderTop: '3px solid var(--accent)',
  borderRadius: '6px 6px 0 0',
  fontWeight: 'bold',
  boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  zIndex: 1, // Ensure shadow/border is on top
}
```

## Success Criteria
- The active tab is immediately identifiable at a glance.
- The design feels modern and integrated with the existing themes.
- No regressions in tab killing (confirm kill state) visibility.
