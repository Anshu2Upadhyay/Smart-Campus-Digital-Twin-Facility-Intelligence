import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Optional safe loading of vite-plugin-pwa so Vite never crashes if npm install hasn't been executed
let pwaPlugin = null;
try {
  const pwaModule = await import('vite-plugin-pwa');
  if (pwaModule && pwaModule.VitePWA) {
    pwaPlugin = pwaModule.VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Smart Campus Digital Twin & Facility Intelligence',
        short_name: 'SmartCampus',
        description: 'Command Center & Mobile Field Staff PWA for Guards and Maintenance Technicians',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'https://assets.smartcampus.io/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'https://assets.smartcampus.io/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-cdn-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
              },
            },
          },
        ],
      },
    });
  }
} catch (e) {
  // Graceful fallback when running before npm install
}

export default defineConfig({
  plugins: [react(), ...(pwaPlugin ? [pwaPlugin] : [])],
  server: {
    port: 5173,
    host: true,
  },
});
