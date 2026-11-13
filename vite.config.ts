import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The whole studio builds to one self-contained dist/index.html (JS + CSS inlined),
// so it can be opened from disk, dropped on any static host, or published as a single page.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
