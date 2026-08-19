import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { reticle } from '@reticlehq/vite-plugin';
import { seo } from './seoPlugin'

// https://vite.dev/config/
export default defineConfig({
  // `seo` last: it rewrites the built index.html and emits one HTML file per
  // public route, so it has to run after the other plugins have finished
  // injecting their asset tags. Set VITE_SITE_URL to stamp the real domain
  // into the canonical/og tags, robots.txt and sitemap.xml — see seoPlugin.js.
  plugins: [reticle(), react(), tailwindcss(), seo()],
})
