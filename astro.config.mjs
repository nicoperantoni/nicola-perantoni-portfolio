import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { routes } from './src/i18n/ui';

// Dominio canonico: da qui derivano URL assoluti, hreflang, Open Graph e sitemap.
const SITE = 'https://devastante.studio';

export default defineConfig({
  site: SITE,
  // Font serviti dal sito stesso, con fallback dalle metriche allineate. Solo i
  // pesi usati: Space Grotesk (file locale) per i titoli, Archivo (scaricato da
  // Google in fase di build) per il testo.
  fonts: [
    {
      // Space Grotesk dal progetto originale (OFL, licenza accanto al file):
      // la versione di Google Fonts non ha le alternative stilistiche (salt).
      // Peso 600 e caratteri latini, con tutte le funzioni OpenType.
      provider: fontProviders.local(),
      name: 'Space Grotesk',
      cssVariable: '--font-display',
      // Solo titoli: titolo grande, loader, parola del passaggio tra le
      // pagine, voci del menu.
      options: {
        variants: [{ src: ['./src/assets/fonts/SpaceGrotesk-SemiBold.woff2'], weight: 600, style: 'normal' }],
      },
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
  integrations: [
    // Sitemap (sitemap-index.xml + sitemap-0.xml, indicata in robots.txt e
    // nell'<head>). Per ogni pagina: data della build e versioni nelle due
    // lingue. Le alternative si aggiungono qui dalla tabella dei percorsi,
    // perché quelli tradotti (/servizi/ ↔ /en/services/) non seguono lo
    // schema che l'opzione i18n dell'integrazione presume.
    sitemap({
      lastmod: new Date(),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const page = Object.values(routes).find((r) => r.it === path || r.en === path);
        if (page) {
          const abs = (p) => new URL(p, SITE).href;
          item.links = [
            { lang: 'it', url: abs(page.it) },
            { lang: 'en', url: abs(page.en) },
            { lang: 'x-default', url: abs(page.it) },
          ];
        }
        return item;
      },
    }),
  ],
});
