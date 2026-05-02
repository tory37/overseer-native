// Shim: redirect 'react/jsx-runtime' → the host renderer's JSX runtime.
const J = window.__OVERSEER_REACT_JSX__
export const jsx = J.jsx
export const jsxs = J.jsxs
export const Fragment = J.Fragment
