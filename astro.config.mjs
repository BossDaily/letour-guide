// @ts-check

// Removed incorrect Tailwind Vite plugin import
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    css: {
      postcss: './postcss.config.js',
    },
  },

  integrations: [react()],
});