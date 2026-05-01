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
    build: {
      lib: {
        entry: { git: path.resolve(__dirname, 'src/git/index.tsx') },
        formats: ['es'],
      },
      rollupOptions: {
        // No externals: plugins run in Electron's renderer with contextIsolation:true
        // and nodeIntegration:false, so there is no require() and no Node built-ins.
        // Node APIs are reached exclusively via window.overseer IPC (contextBridge).
        // React is bundled per-plugin (~45KB) because bare 'react' specifiers cannot
        // be resolved by the native ESM loader used for file:// dynamic imports.
        output: { entryFileNames: '[name].js' },
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
