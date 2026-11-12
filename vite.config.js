import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 800 }, // three.js is one ~690 kB chunk; fine for a demo
  test: { environment: 'node' },
});
