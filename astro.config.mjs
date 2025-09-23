// @ts-check

import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  base: '/~LeTour/v0.02/dist/', //where the project is deployed
  vite: {
    css: {
      postcss: './postcss.config.js',
    },
  },

  integrations: [react()],
});