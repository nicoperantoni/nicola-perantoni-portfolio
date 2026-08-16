import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.nicolaperantoni.com',
  integrations: [sitemap()],
});
