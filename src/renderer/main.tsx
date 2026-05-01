import React from 'react'
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'
import { createRoot } from 'react-dom/client'
import App from './App'

// Expose the React singleton for sidebar plugins. Plugins load via file://
// dynamic import (native ESM) and cannot resolve bare specifiers, so they
// read the host's React instance from window instead of bundling their own.
// Two React copies in one renderer = useState dispatcher is null → crash.
// Use a plain object (not a Module Namespace Object) so property access is
// reliable across the file:// module boundary.
const w = window as unknown as Record<string, unknown>
w.__OVERSEER_REACT__ = React
w.__OVERSEER_REACT_JSX__ = { jsx, jsxs, Fragment }

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
