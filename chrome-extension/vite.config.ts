import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';

// Plugin to copy static files to dist
const copyStaticFiles = () => ({
  name: 'copy-static-files',
  closeBundle() {
    // Copy manifest.json
    copyFileSync(
      path.resolve(__dirname, 'public/manifest.json'),
      path.resolve(__dirname, 'dist/manifest.json')
    );
    
    // Copy icons
    const iconsDir = path.resolve(__dirname, 'public/icons');
    const distIconsDir = path.resolve(__dirname, 'dist/icons');
    if (!existsSync(distIconsDir)) {
      mkdirSync(distIconsDir, { recursive: true });
    }
    const iconFiles = readdirSync(iconsDir);
    for (const file of iconFiles) {
      copyFileSync(
        path.resolve(iconsDir, file),
        path.resolve(distIconsDir, file)
      );
    }
  }
});

export default defineConfig({
  plugins: [react(), copyStaticFiles()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
