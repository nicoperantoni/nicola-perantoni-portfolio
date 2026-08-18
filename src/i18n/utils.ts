import { ui, defaultLocale, type Locale } from './ui';

export function useTranslations(lang: Locale) {
  return ui[lang] ?? ui[defaultLocale];
}

/** Percorso assoluto della pagina gemella nell'altra lingua, per hreflang e language switcher. */
export function alternatePath(lang: Locale): string {
  return lang === 'en' ? '/' : '/en/';
}

export function otherLocale(lang: Locale): Locale {
  return lang === 'it' ? 'en' : 'it';
}
