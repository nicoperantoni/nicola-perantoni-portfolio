import { ui, routes, defaultLocale, type Locale, type Page } from './ui';

export function useTranslations(lang: Locale) {
  return ui[lang] ?? ui[defaultLocale];
}

/** Percorso di una pagina nella lingua data. */
export function pagePath(page: Page, lang: Locale): string {
  return routes[page][lang];
}

export function otherLocale(lang: Locale): Locale {
  return lang === 'it' ? 'en' : 'it';
}
