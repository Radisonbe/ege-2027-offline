import { defineConfig } from 'vite';
import { offlinePwa } from './scripts/pwa-plugin.mjs';

export default defineConfig({
  base: './',
  plugins: [offlinePwa()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { target: 'es2022' },
});
