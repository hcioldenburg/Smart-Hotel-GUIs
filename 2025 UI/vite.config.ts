import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr';

import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr(),
    tailwindcss(),

    visualizer({ open: false }),
      ],
  server: {
    host: true, // Allow access from other devices on the network
    proxy: {
      '/api': {
        target: 'http://localhost:8123',
        changeOrigin: true,
        secure: false,
      },
      '/api/zigbee-network-graph': {
           target: 'http://localhost:8099',
           changeOrigin: true,
         },
    },
  },
});
