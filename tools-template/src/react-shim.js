// Shim: redirect 'react' → the host renderer's React singleton.
// Plugins load via file:// (native ESM) and cannot resolve bare specifiers,
// so they read the exact React instance the host is already running.
// Two copies → dispatcher is null → useState throws.
const R = window.__OVERSEER_REACT__
export default R
export const useState = R.useState
export const useEffect = R.useEffect
export const useCallback = R.useCallback
export const useMemo = R.useMemo
export const useRef = R.useRef
export const useContext = R.useContext
export const createContext = R.createContext
export const forwardRef = R.forwardRef
export const memo = R.memo
export const Fragment = R.Fragment
export const Children = R.Children
export const cloneElement = R.cloneElement
export const createElement = R.createElement
export const isValidElement = R.isValidElement
