// @ts-check

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const base = '/~LeTour/v0.02/dist/' // make this the directory where all the pages go


// https://astro.build/config
export default defineConfig({
  base: base, //where the project is deployed
  vite: {
    css: {
      postcss: './postcss.config.js',
    },
  },

  integrations: [react()],
});