import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 构建配置 - 管理后台
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
