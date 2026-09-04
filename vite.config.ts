import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Baked in at build time so the UI can prove which build is actually served.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the Spring Boot backend (context path /api)
      '/api': {
        target: 'http://backend.zerosmet.url:8080',
        changeOrigin: true,
      },
    },
  },
});
