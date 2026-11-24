// Lingua scelta dal browser del visitatore (Vercel Routing Middleware): chi
// ha il browser in italiano vede il sito in italiano, chi lo ha in qualsiasi
// altra lingua lo vede in inglese. Il controllo avviene prima di servire la
// pagina, così non c'è il lampo della pagina nell'altra lingua.
//
// Senza intestazione Accept-Language (motori di ricerca, anteprime social)
// non si reindirizza: Google e gli altri continuano a vedere entrambe le
// versioni, collegate dagli hreflang nell'<head> di ogni pagina.
import { next } from '@vercel/functions/middleware';
import { routes, type Locale } from './src/i18n/ui';

export const config = {
  // Solo pagine: niente file statici (/_astro, PDF, immagini, sitemap…).
  matcher: ['/', '/((?!_astro|_vercel)[^.]*)'],
};

// Percorso → pagina gemella nell'altra lingua.
const pairs = new Map<string, { lang: Locale; twin: string }>();
for (const r of Object.values(routes)) {
  pairs.set(r.it, { lang: 'it', twin: r.en });
  pairs.set(r.en, { lang: 'en', twin: r.it });
}

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|facebot|linkedin|whatsapp|telegram|discord|preview|lighthouse|headless/i;

/** Lingua preferita dall'intestazione Accept-Language: "it" o "en", null se assente. */
export function preferredLocale(header: string | null): Locale | null {
  if (!header) return null;
  const langs = header
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((x) => x.trim()).find((x) => x.startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) : 1, i };
    })
    .filter((l) => l.tag && l.tag !== '*' && !Number.isNaN(l.q) && l.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  if (!langs.length) return null;
  return langs[0].tag.split('-')[0] === 'it' ? 'it' : 'en';
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  const path = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
  const page = pairs.get(path);
  if (!page) return next();
  if (BOT.test(request.headers.get('user-agent') ?? '')) return next({ headers: { Vary: 'Accept-Language' } });

  const wanted = preferredLocale(request.headers.get('accept-language'));
  if (!wanted || wanted === page.lang) return next({ headers: { Vary: 'Accept-Language' } });

  // Redirect temporaneo: la stessa pagina nell'altra lingua.
  const target = new URL(page.twin + url.search, url);
  return new Response(null, {
    status: 307,
    headers: { Location: target.href, Vary: 'Accept-Language', 'Cache-Control': 'private, no-store' },
  });
}
