import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// ZY-05-01 PWA: workbox-powered SW + manifest. No external SaaS — push goes
// through Supabase realtime (ZY-05-06) instead of WebPush / OneSignal.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'offline.html'],
      manifest: {
        name: 'Zhiyu · 知语',
        short_name: 'Zhiyu',
        description: 'Reshape Chinese learning with glass-grade UI.',
        theme_color: '#e11d48',
        background_color: '#fafafa',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'en',
        orientation: 'portrait',
        icons: [
          { src: '/icons/zhiyu-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/icons/zhiyu-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_debug/],
        globPatterns: ['**/*.{js,css,html,svg,woff2,webp,png}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'zhiyu-html' },
          },
          {
            urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
            handler: 'CacheFirst',
            options: { cacheName: 'zhiyu-static', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30, maxEntries: 60 } },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'zhiyu-img', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30, maxEntries: 120 } },
          },
          {
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'zhiyu-api',
              networkTimeoutSeconds: 5,
              expiration: { maxAgeSeconds: 60 * 5, maxEntries: 80 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
  build: { outDir: 'dist', sourcemap: true },
});
