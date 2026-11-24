// ---------------------------------------------------------------------
// Passaggio tra le pagine dal menu (arrivo nella pagina nuova).
//
// Il menu (lib/menu.ts) lascia la voce scelta centrata in orizzontale alla
// sua altezza e salva parola e posizione; lo script in <head> di BaseLayout
// la rimette nello stesso punto prima che la pagina compaia. Qui la parola
// sale dritta al posto del titolo e la pagina entra dal basso nello stesso
// momento, con la stessa durata e la stessa curva, come se la parola se la
// portasse dietro. Verso la Home "Home" diventa "Studio Devastante" con le
// lettere che si rimescolano (ScrambleText) prima di salire.
// ---------------------------------------------------------------------
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { reduced } from './env';

gsap.registerPlugin(ScrambleTextPlugin);

/** sessionStorage: passaggio dal menu in corso ({label, y, ts}). */
export const TRANSITION_KEY = 'sd-transition';

/** La pagina è stata aperta dal menu (classe messa in <head>). */
export const isArriving = () => document.documentElement.classList.contains('is-arriving');

// Lettere per lo scramble: solo minuscole di larghezza media, perché lettere
// più larghe farebbero uscire la parola dallo schermo.
const CHARS = 'abcdeghknopqsuvxyz';

interface ArrivalOptions {
  /** Da attendere prima della salita (font e misure che ne dipendono). */
  ready: Promise<unknown>;
  /** Chiamata quando il contenuto torna visibile, prima della salita. */
  layout?: () => void;
  /** Animazione propria del contenuto, all'inizio della salita. */
  reveal?: () => void;
}

/** Spostamento che porta la parola esattamente sul titolo. */
function toHeadline(word: HTMLElement, headline: HTMLElement) {
  const from = word.getBoundingClientRect();
  const to = headline.getBoundingClientRect();
  return {
    x: `+=${to.left + to.width / 2 - (from.left + from.width / 2)}`,
    y: `+=${to.top + to.height / 2 - (from.top + from.height / 2)}`,
    scale: to.width / from.width,
  };
}

export async function initArrival({ ready, layout, reveal }: ArrivalOptions): Promise<void> {
  const html = document.documentElement;
  const overlay = document.getElementById('arrival')!;
  const bg = document.getElementById('arrival-bg')!;
  const word = document.getElementById('arrival-word')!;
  const headline = document.getElementById('headline')!;
  const head = document.querySelector<HTMLElement>('.site-head')!;
  // Ciò che entra dal basso insieme alla parola.
  const body = [...document.querySelectorAll<HTMLElement>('.scale, .scale-arrows, .sub-body')];
  const title = headline.getAttribute('aria-label') ?? headline.textContent?.trim() ?? '';
  const start = word.textContent?.trim() || title;

  const finish = () => {
    html.classList.remove('is-arriving');
    overlay.remove();
    [head, ...body].forEach((el) => { el.style.visibility = ''; });
    layout?.();
  };

  // Solo i font, e al massimo un attimo: la pagina è già in cache.
  await Promise.race([ready, new Promise((r) => setTimeout(r, 1200))]);
  if (reduced) { finish(); reveal?.(); return; }

  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({ onComplete: () => { finish(); resolve(); } });

    // Verso la Home: "Home" diventa "Studio Devastante" con le lettere che si
    // rimescolano; intanto la parola rimpicciolisce, nella prima parte del
    // rimescolamento, così la parola più lunga resta dentro lo schermo.
    if (start !== title) {
      const inner = overlay.clientWidth - 2 * parseFloat(getComputedStyle(overlay).paddingLeft);
      tl.to(word, { duration: 0.8, scrambleText: { text: title, chars: CHARS, speed: 0.6, revealDelay: 0.25 } }, 0)
        .to(word, { fontSize: inner * 0.084, duration: 0.35, ease: 'power2.out' }, 0);
    }

    // La parola sale al titolo e la pagina entra dal basso insieme a lei. Il
    // fondo si dissolve subito, così la pagina si vede salire. Lo spostamento
    // si misura quando la salita parte (dopo l'eventuale cambio di parola).
    let move: ReturnType<typeof toHeadline> | null = null;
    const m = () => (move ??= toHeadline(word, headline));
    const RISE = { duration: 1.05, ease: 'expo.inOut' };
    tl.add(() => {
      // Il titolo vero resta nascosto finché la parola non lo raggiunge.
      head.style.visibility = 'hidden';
      body.forEach((el) => { el.style.visibility = 'visible'; });
      layout?.();
      reveal?.();
    })
      .addLabel('rise')
      .to(word, { x: () => m().x, y: () => m().y, scale: () => m().scale, ...RISE }, 'rise')
      .fromTo(body, { y: () => window.innerHeight * 0.6 }, { y: 0, clearProps: 'transform', ...RISE }, 'rise')
      .to(bg, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 'rise');
  });
}
