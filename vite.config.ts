import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true
  },
  server: {
    port: 5005
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => [
            // @github/time-elements
            'relative-time',
            'time-until',
            'time-ago',
            'local-time'
          ].includes(tag)
        }
      }
    }),
    Unocss(),
    Icons({
      compiler: 'vue3'
    }),
    VitePWA({
      manifest: {
        name: 'RopeScore Live',
        short_name: 'RSLive',
        orientation: 'portrait',
        display: 'standalone',
        lang: 'en',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        categories: ['sports', 'productivity'],
        dir: 'ltr',
        shortcuts: [],
        icons: [
          {
            src: '/icons/android-icon-36x36.png',
            sizes: '36x36',
            type: 'image/png',
            density: '0.75'
          },
          {
            src: '/icons/android-icon-48x48.png',
            sizes: '48x48',
            type: 'image/png',
            density: '1.0'
          },
          {
            src: '/icons/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            density: '1.5'
          },
          {
            src: '/icons/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            density: '2.0'
          },
          {
            src: '/icons/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            density: '3.0'
          },
          {
            src: '/icons/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            density: '4.0'
          },
          {
            src: '/icons/android-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/monochrome-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'monochrome'
          },
          {
            src: '/icons/monochrome-icon-256x256.png',
            sized: '256x256',
            type: 'image/png',
            purpose: 'monochrome'
          },
          {
            src: '/icons/monochrome-icon-192x192.png',
            sized: '192x192',
            type: 'image/png',
            purpose: 'monochrome'
          }
        ]
      }
    })
  ]
})
