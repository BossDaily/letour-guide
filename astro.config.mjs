// @ts-check
import dotenv from 'dotenv';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

dotenv.config();

const base = process.env.PUBLIC_BASE;

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