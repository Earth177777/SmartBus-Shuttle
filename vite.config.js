import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000, // three.js + baked map data; camera/Firebase chunks load on demand
    rollupOptions: { input: { main: 'index.html', phone: 'phone.html' } },
  },
  test: { environment: 'node' },
});
