// ---------------------------------------------------------------------
// Ingresso nella pagina, in due modi (lo decide lo script in <head> di
// BaseLayout):
//
// - Primo ingresso in Home nella sessione: loader completo. Lettere che si
//   rimescolano, barra nera che avanza col caricamento reale (font e foto),
//   testo bianco sulla barra e nero sul bianco; a fine caricamento la barra
//   esce, la parola vola al posto del titolo e lo scroll sale dal basso.
//
// - Arrivo da una voce del menu, su qualsiasi pagina: niente barra né lettere
//   rimescolate. La parola è dove il menu l'ha lasciata (centrata, alla sua
//   altezza) e sale dritta al posto del titolo mentre la pagina compare.
//   Verso la Home "Home" diventa "Studio Devastante" con le lettere che si
//   rimescolano (ScrambleText) prima di salire.
// ---------------------------------------------------------------------
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { reduced } from './env';

gsap.registerPlugin(ScrambleTextPlugin);

// Lettere per lo scramble: solo minuscole di larghezza media, perché lettere
// più larghe farebbero uscire la parola dallo schermo.
const CHARS = 'abcdeghknopqsuvxyz';

/** sessionStorage: la Home ha già fatto il loader iniziale. */
export const INTRO_KEY = 'sd-intro';
/** sessionStorage: navigazione dal menu in corso ({label, ts}). */
export const TRANSITION_KEY = 'sd-transition';

/** Il loader (o l'arrivo dal menu) è attivo su questa pagina. */
export const isLoading = () => document.documentElement.classList.contains('is-loading');
const viaMenu = () => document.documentElement.classList.contains('via-menu');

interface LoaderOptions {
  /** Promesse da attendere: la prima sono i font (e le misure che ne
   *  dipendono), poi le foto. Arrivando dal menu si attende solo la prima. */
  waitFor: Promise<unknown>[];
  /** Chiamata quando il contenuto torna visibile, prima che la parola arrivi. */
  layout?: () => void;
  /** Animazione d'ingresso del contenuto: "intro" dopo il loader iniziale,
   *  "arrive" quando la pagina sale insieme alla parola (arrivo dal menu). */
  reveal?: (mode: 'intro' | 'arrive') => void;
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

const els = () => ({
  html: document.documentElement,
  loader: document.getElementById('loader')!,
  bar: document.getElementById('loader-bar')!,
  wordDark: document.getElementById('word-dark')!,
  wordLight: document.getElementById('word-light')!,
  headline: document.getElementById('headline')!,
  head: document.querySelector<HTMLElement>('.site-head')!,
  content: [...document.querySelectorAll<HTMLElement>('.stage, .sub-body')],
  isHome: document.body.dataset.page === 'home',
});

/** Spostamento che porta la parola del loader esattamente sul titolo. */
function toHeadline(word: HTMLElement, headline: HTMLElement) {
  const from = word.getBoundingClientRect();
  const to = headline.getBoundingClientRect();
  return {
    x: `+=${to.left + to.width / 2 - (from.left + from.width / 2)}`,
    y: `+=${to.top + to.height / 2 - (from.top + from.height / 2)}`,
    scale: to.width / from.width,
  };
}

export function initLoader(opts: LoaderOptions): Promise<void> {
  return viaMenu() ? arrive(opts) : intro(opts);
}

// --- Arrivo da una voce del menu ---------------------------------------
function arrive({ waitFor, layout, reveal }: LoaderOptions): Promise<void> {
  const { html, loader, bar, wordDark, headline, head, content, isHome } = els();
  const title = headline.textContent?.trim() ?? '';
  const start = wordDark.textContent?.trim() || title;

  const finish = () => {
    html.classList.remove('is-loading', 'via-menu');
    head.style.visibility = '';
    content.forEach((el) => { el.style.visibility = ''; });
    loader.remove();
    layout?.();
  };

  // Solo i font, e al massimo un attimo: la pagina è già in cache.
  const wait = Promise.race([waitFor[0] ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);

  return wait.then(() => new Promise<void>((resolve) => {
    if (reduced) { finish(); reveal?.('arrive'); resolve(); return; }
    const tl = gsap.timeline({ onComplete: () => { finish(); resolve(); } });

    // Verso la Home: "Home" diventa "Studio Devastante" con le lettere che si
    // rimescolano (ScrambleText, come nel loader iniziale). Intanto la parola
    // rimpicciolisce alla grandezza del loader iniziale, nella prima parte del
    // rimescolamento, così la parola più lunga resta dentro lo schermo.
    if (isHome && start !== title) {
      const inner = loader.clientWidth - 2 * parseFloat(getComputedStyle(loader).paddingLeft);
      tl.to(wordDark, { duration: 0.8, scrambleText: { text: title, chars: CHARS, speed: 0.6, revealDelay: 0.25 } }, 0)
        .to(wordDark, { fontSize: inner * 0.084, duration: 0.35, ease: 'power2.out' }, 0);
    }

    // La parola sale al posto del titolo e la pagina entra dal basso nello
    // stesso momento, con la stessa durata e la stessa curva: sembra che la
    // parola se la porti dietro. Il fondo del loader si dissolve subito, così
    // la pagina si vede salire. Lo spostamento si misura quando la salita
    // parte (dopo l'eventuale cambio di parola).
    let move: ReturnType<typeof toHeadline> | null = null;
    const m = () => (move ??= toHeadline(wordDark, headline));
    const RISE = { duration: 1.05, ease: 'expo.inOut' };
    tl.add(() => {
      content.forEach((el) => { el.style.visibility = 'visible'; });
      layout?.();
      reveal?.('arrive');
    })
      .addLabel('rise')
      .to(wordDark, { x: () => m().x, y: () => m().y, scale: () => m().scale, ...RISE }, 'rise')
      .fromTo(content, { y: () => window.innerHeight * 0.6 }, { y: 0, clearProps: 'transform', ...RISE }, 'rise')
      .to(bar, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 'rise');
  }));
}

// --- Primo ingresso in Home --------------------------------------------
function intro({ waitFor, layout, reveal }: LoaderOptions): Promise<void> {
  const { html, loader, bar, wordDark, wordLight, headline, head, content, isHome } = els();
  const title = headline.textContent?.trim() ?? '';

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
  const syncWords = () => { wordLight.textContent = wordDark.textContent; paint(); };
  const scrambleLoop = reduced
    ? null
    : gsap
        .timeline({ repeat: -1, repeatDelay: 0.35 })
        .to(wordDark, { duration: 1.5, scrambleText: { text: title, chars: CHARS, speed: 0.55, revealDelay: 0.45 }, onUpdate: syncWords });

  // Avanzamento reale. La barra lo insegue con morbidezza, con una durata
  // minima perché l'animazione si legga anche con la cache.
  let count = 0;
  const MIN_TIME = 1.8;
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
      // Ultimo giro che si chiude sul titolo, poi l'uscita.
      scrambleLoop?.kill();
      gsap.to(wordDark, {
        duration: 0.7,
        scrambleText: { text: title, chars: CHARS, speed: 0.55, revealDelay: 0.15 },
        onUpdate: syncWords,
        onComplete: () => { wordDark.textContent = title; syncWords(); exitLoader(); },
      });
    });

  function exitLoader() {
    const move = toHeadline(wordDark, headline);
    gsap
      .timeline({ onComplete: finish })
      .to(edges, { R: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: paint })
      // La barra esce verso destra scoprendo di nuovo il fondo.
      .to(edges, { L: 100, duration: 0.9, ease: 'expo.inOut', onUpdate: paint }, '+=0.15')
      // La parola va al posto del titolo.
      .to([wordDark, wordLight], { ...move, duration: 1, ease: 'expo.inOut' }, '-=0.35')
      .add(() => {
        html.classList.remove('is-loading');
        head.style.visibility = '';
        content.forEach((el) => { el.style.visibility = ''; });
        gsap.set(loader, { autoAlpha: 0 });
        layout?.();
        reveal?.('intro');
      });
  }

  function finish() {
    html.classList.remove('is-loading', 'via-menu');
    head.style.visibility = '';
    content.forEach((el) => { el.style.visibility = ''; });
    loader.remove();
    layout?.();
    if (isHome) {
      try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* sessione non disponibile */ }
    }
    resolveDone();
  }

  return done;
}
