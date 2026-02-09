import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/CoupleLink/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // Custom service worker for push notifications
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'CoupleLink',
        short_name: 'CoupleLink',
        description: 'The operating system for your relationship.',
        theme_color: '#F43F5E',
        background_color: '#F43F5E',
        start_url: '/CoupleLink/',
        scope: '/CoupleLink/',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Allows access from network (for phone)
  },
})
