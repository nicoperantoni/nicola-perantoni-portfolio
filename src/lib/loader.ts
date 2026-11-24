// ---------------------------------------------------------------------
// Loader: lettere che si rimescolano, barra nera che avanza col caricamento
// reale, testo bianco sulla barra e nero sul bianco. A fine caricamento la
// barra esce, la parola vola al posto del titolo e compare la pagina.
//
// Parte in due casi (vedi lo script in <head> di BaseLayout):
// - primo ingresso in Home nella sessione: attende font e foto;
// - arrivo da una voce del menu, su qualsiasi pagina: parte dalla voce
//   scelta, già al centro come l'ha lasciata il menu, ed è più breve.
// ---------------------------------------------------------------------
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { reduced } from './env';

gsap.registerPlugin(ScrambleTextPlugin);

/** sessionStorage: la Home ha già fatto il loader iniziale. */
export const INTRO_KEY = 'sd-intro';
/** sessionStorage: navigazione dal menu in corso ({label, ts}). */
export const TRANSITION_KEY = 'sd-transition';

/** Il loader è attivo su questa pagina (classe messa in <head>). */
export const isLoading = () => document.documentElement.classList.contains('is-loading');
const viaMenu = () => document.documentElement.classList.contains('via-menu');

interface LoaderOptions {
  /** Promesse da attendere (font, foto). */
  waitFor: Promise<unknown>[];
  /** Chiamata quando il contenuto torna visibile, prima che la parola arrivi. */
  layout?: () => void;
  /** Animazione d'ingresso del contenuto, a parola arrivata al titolo. */
  reveal?: () => void;
}

const loaded = (img: HTMLImageElement) =>
  img.complete
    ? Promise.resolve()
    : new Promise<void>((res) => {
        img.addEventListener('load', () => res(), { once: true });
        img.addEventListener('error', () => res(), { once: true });
      });

/** Attende il caricamento delle immagini date. */
export const imagesLoaded = (imgs: HTMLImageElement[]) => Promise.all(imgs.map(loaded));

export function initLoader({ waitFor, layout, reveal }: LoaderOptions): Promise<void> {
  const html = document.documentElement;
  const loader = document.getElementById('loader')!;
  const bar = document.getElementById('loader-bar')!;
  const wordDark = document.getElementById('word-dark')!;
  const wordLight = document.getElementById('word-light')!;
  const headline = document.getElementById('headline')!;
  const isHome = document.body.dataset.page === 'home';
  const fromMenu = viaMenu();
  const title = headline.textContent?.trim() ?? '';
  const start = wordDark.textContent?.trim() || title;

  let resolveDone: () => void;
  const done = new Promise<void>((r) => { resolveDone = r; });

  // Bordo sinistro (L) e destro (R) della barra, in % dello schermo: la
  // copia bianca del titolo è ritagliata esattamente sulla stessa porzione.
  const edges = { L: 0, R: 0 };
  const paint = () => {
    bar.style.clipPath = `inset(0 ${100 - edges.R}% 0 ${edges.L}%)`;
    const vw = window.innerWidth;
    const r = wordLight.getBoundingClientRect();
    const toWord = (pct: number) => Math.max(0, Math.min(100, (((pct / 100) * vw - r.left) / r.width) * 100));
    wordLight.style.clipPath = `inset(-30% ${100 - toWord(edges.R)}% -30% ${toWord(edges.L)}%)`;
  };

  // Lo scramble gira sulla copia nera; la bianca ne copia il testo a ogni
  // fotogramma, così il passaggio di colore sul bordo della barra resta netto.
  // Solo lettere minuscole di larghezza media: lettere più larghe farebbero
  // uscire la parola dallo schermo.
  const syncWords = () => { wordLight.textContent = wordDark.textContent; paint(); };
  const CHARS = 'abcdeghknopqsuvxyz';
  const scrambleLoop = reduced
    ? null
    : gsap
        // Dal menu la parola resta un attimo ferma, così si legge che è la
        // stessa voce appena scelta.
        .timeline({ repeat: -1, repeatDelay: 0.35, delay: fromMenu ? 0.4 : 0 })
        .to(wordDark, { duration: 1.5, scrambleText: { text: start, chars: CHARS, speed: 0.55, revealDelay: 0.45 }, onUpdate: syncWords });

  // Avanzamento reale. La barra lo insegue con morbidezza, con una durata
  // minima perché l'animazione si legga anche con la cache.
  let count = 0;
  const MIN_TIME = fromMenu ? 0.9 : 1.8;
  const startedAt = performance.now();
  let barTween: gsap.core.Tween | null = null;
  const advance = () => {
    const elapsed = (performance.now() - startedAt) / 1000;
    const cap = Math.min(1, elapsed / MIN_TIME + 0.1);
    const goal = Math.min(count / waitFor.length, cap) * 100;
    if (goal <= edges.R) return;
    barTween?.kill();
    barTween = gsap.to(edges, { R: goal, duration: 0.6, ease: 'power2.out', onUpdate: paint });
  };
  waitFor.forEach((t) => t.then(() => { count++; advance(); }));
  const pulse = setInterval(advance, 200);
  paint();

  Promise.all(waitFor)
    .then(() => new Promise((res) => setTimeout(res, Math.max(0, MIN_TIME * 1000 - (performance.now() - startedAt)))))
    .then(() => {
      clearInterval(pulse);
      barTween?.kill();
      if (reduced) { finish(); return; }
      scrambleLoop?.kill();
      // Ultimo giro che si chiude sul titolo della pagina. Arrivando in Home
      // dal menu "Home" diventa "Studio Devastante": la parola rimpicciolisce
      // alla grandezza del loader iniziale, così resta dentro lo schermo.
      const tl = gsap.timeline({ onComplete: () => { wordDark.textContent = title; syncWords(); exitLoader(); } });
      tl.to(wordDark, { duration: 0.7, scrambleText: { text: title, chars: CHARS, speed: 0.55, revealDelay: 0.15 }, onUpdate: syncWords }, 0);
      if (fromMenu && isHome && start !== title) {
        const inner = loader.clientWidth - 2 * parseFloat(getComputedStyle(loader).paddingLeft);
        tl.to([wordDark, wordLight], { fontSize: inner * 0.09, duration: 0.7, ease: 'expo.inOut', onUpdate: paint }, 0);
      }
    });

  function exitLoader() {
    // Il titolo vero è già al suo posto (solo invisibile): da lì si calcola
    // lo spostamento della parola del loader.
    const head = document.querySelector<HTMLElement>('.site-head')!;
    const content = [...document.querySelectorAll<HTMLElement>('.stage, .sub-body')];
    const from = wordDark.getBoundingClientRect();
    const to = headline.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const s = to.width / from.width;

    gsap
      .timeline({ onComplete: finish })
      .to(edges, { R: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: paint })
      // La barra esce verso destra scoprendo di nuovo il bianco.
      .to(edges, { L: 100, duration: 0.9, ease: 'expo.inOut', onUpdate: paint }, '+=0.15')
      // La parola va al posto del titolo.
      .to([wordDark, wordLight], { x: `+=${dx}`, y: `+=${dy}`, scale: s, duration: 1, ease: 'expo.inOut' }, '-=0.35')
      .add(() => {
        html.classList.remove('is-loading');
        head.style.visibility = '';
        content.forEach((el) => { el.style.visibility = ''; });
        gsap.set(loader, { autoAlpha: 0 });
        layout?.();
        reveal?.();
      });
  }

  function finish() {
    html.classList.remove('is-loading', 'via-menu');
    document.querySelectorAll<HTMLElement>('.site-head, .stage, .sub-body').forEach((el) => { el.style.visibility = ''; });
    loader.remove();
    layout?.();
    if (isHome) {
      try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* sessione non disponibile */ }
    }
    resolveDone();
  }

  return done;
}
