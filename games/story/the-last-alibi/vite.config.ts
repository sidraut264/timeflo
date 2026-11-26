import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function copyAssetsPlugin(): Plugin {
  const assetsSrc = path.resolve(__dirname, 'assets');
  return {
    name: 'copy-manor-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const cleanPath = (req.url || '/').split('?')[0].replace(/^\/+/, '');
        const filePath = path.join(assetsSrc, cleanPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mime =
            ext === '.webp'
              ? 'image/webp'
              : ext === '.png'
              ? 'image/png'
              : ext === '.jpg' || ext === '.jpeg'
              ? 'image/jpeg'
              : ext === '.json'
              ? 'application/json'
              : 'application/octet-stream';
          res.setHeader('Content-Type', mime);
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },
    closeBundle() {
      const distAssets = path.resolve(__dirname, 'dist/assets');
      if (fs.existsSync(assetsSrc)) {
        // Ship only runtime artwork; preserve full-resolution masters in the source tree.
        const manifestPath = path.join(assetsSrc, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const collectPaths = (value: unknown): string[] =>
          typeof value === 'string' ? [value] :
          value && typeof value === 'object' ? Object.values(value).flatMap(collectPaths) : [];
        fs.mkdirSync(distAssets, { recursive: true });
        fs.copyFileSync(manifestPath, path.join(distAssets, 'manifest.json'));
        for (const url of new Set(collectPaths(manifest))) {
          const source = path.resolve(__dirname, url);
          const relative = path.relative(assetsSrc, source);
          if (relative.startsWith('..') || path.isAbsolute(relative)) {
            throw new Error(`Artwork must be inside assets/: ${url}`);
          }
          const target = path.join(distAssets, relative);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(source, target);
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
