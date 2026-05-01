import React from 'react'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import { createRoot } from 'react-dom/client'
import App from './App'

// Expose the React singleton for sidebar plugins. Plugins load via file://
// dynamic import (native ESM) and cannot resolve bare specifiers, so they
// read the host's React instance from window instead of bundling their own.
// Two React copies in one renderer = useState dispatcher is null → crash.
;(window as unknown as Record<string, unknown>).__OVERSEER_REACT__ = React
;(window as unknown as Record<string, unknown>).__OVERSEER_REACT_JSX__ = ReactJSXRuntime

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
