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
        // Node.js builtins are available in Electron's renderer when nodeIntegration is enabled
        external: ['react', 'react-dom', 'child_process', 'util', 'fs', 'path', 'os'],
        output: { entryFileNames: '[name].js' },
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
