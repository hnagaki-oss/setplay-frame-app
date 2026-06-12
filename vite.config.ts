import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';

function localBackupDataPlugin() {
  const backupPath = path.resolve(process.cwd(), 'data', 'setplay-backup.json');

  return {
    name: 'local-backup-data',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/__local-data/setplay-backup.json', (_req, res, next) => {
        if (!existsSync(backupPath)) {
          res.statusCode = 404;
          res.end('data/setplay-backup.json not found');
          return;
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        createReadStream(backupPath).on('error', next).pipe(res);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localBackupDataPlugin()],
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
