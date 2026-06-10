import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/official-site': {
        target: 'https://www.streetfighter.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/official-site/, ''),
      },
    },
  },
});
