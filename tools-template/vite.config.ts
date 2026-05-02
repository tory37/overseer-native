import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // vite dev — runs the dev harness as a full browser app
    return { plugins: [react()] }
  }

  // vite build — library mode: one entry per tool, outputs to dist/
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Redirect React imports to thin shims that read from the host renderer's
        // window.__OVERSEER_REACT__ singleton. Two React instances in one renderer
        // = null dispatcher = useState crash. The host exposes the singleton in
        // src/renderer/main.tsx before any plugin is loaded.
        'react/jsx-runtime': path.resolve(__dirname, 'src/react-jsx-shim.js'),
        'react': path.resolve(__dirname, 'src/react-shim.js'),
      },
    },
    // Replace process.env.NODE_ENV at build time — React references it, and
    // the renderer has no Node globals (contextIsolation:true, nodeIntegration:false).
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      lib: {
        entry: { git: path.resolve(__dirname, 'src/git/index.tsx') },
        formats: ['es'],
      },
      rollupOptions: {
        // No externals: plugins run in Electron's renderer with contextIsolation:true
        // and nodeIntegration:false, so there is no require() and no Node built-ins.
        // Node APIs are reached exclusively via window.overseer IPC (contextBridge).
        // React is NOT bundled — resolve.alias redirects to window shims above.
        output: { entryFileNames: '[name].js' },
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
