import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        id: '/',
        start_url: '/',
        name: 'StroyGetter',
        short_name: 'StroyGetter',
        description: 'StroyGetter - Download any youtube video for free !',
        theme_color: '#102F42',
        dir: 'ltr',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        edge_side_panel: {
          preferred_width: 400,
        },
        handle_links: 'auto',
        categories: ['youtube', 'music', 'video', 'download'],
        launch_handler: {
          client_mode: 'auto',
        },
        orientation: 'portrait',
        screenshots: [
          {
            src: 'screenshot.jpg',
            sizes: '1080x2255',
            type: 'image/jpg',
          },
        ],
        file_handlers: [],
        prefer_related_applications: false,
        protocol_handlers: [],
        related_applications: [],
        scope_extensions: [
          {
            origin: '*.stroyco.eu',
          },
        ],
        shortcuts: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
