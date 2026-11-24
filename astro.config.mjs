import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Dominio canonico: da qui derivano URL assoluti, hreflang, Open Graph e sitemap.
  site: 'https://devastante.studio',
  // Font scaricati da Google in fase di build e serviti dal sito stesso, con
  // fallback dalle metriche allineate. Solo i pesi usati.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Sora',
      cssVariable: '--font-display',
      // Solo titoli: titolo grande, Profilo/Portfolio, loader, voci del menu.
      weights: [600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Helvetica', 'Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-text',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Helvetica', 'Arial', 'sans-serif'],
    },
  ],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Le alternative di lingua stanno nell'<head> di ogni pagina (hreflang): la
  // sitemap non le ripete, perché i percorsi tradotti (/servizi/ ↔
  // /en/services/) non seguono lo schema che l'integrazione presume.
  integrations: [sitemap()],
});
