// ---------------------------------------------------------------------
// Loader della Home al primo ingresso nella sessione.
//
// Adattato da "Willem Loading Animation" di Osmo
// (https://codepen.io/osmosupply/pen/wBGYEMd), licenza MIT,
// Copyright (c) 2026 Osmo.
//
// 1. Le lettere di "Studio" e "Devastante" salgono una per una.
// 2. Tra le due parole si apre un rettangolo e la foto si allarga dal centro.
// 3. Durante il caricamento le foto cambiano di colpo ogni quarto di secondo.
// 4. A caricamento finito il rettangolo si allarga e spinge fuori le parole;
//    la foto diventa la foto centrale della scala e il titolo entra
//    dall'alto lettera per lettera.
// 5. Le altre foto si scoprono dal centro verso i lati, poi le frecce.
// ---------------------------------------------------------------------
import { gsap } from 'gsap';
import type { Scale } from './scale';
import { reduced } from './env';

/** sessionStorage: la Home ha già fatto il loader iniziale. */
export const INTRO_KEY = 'sd-intro';

/** Il loader iniziale è attivo (classe messa in <head> da BaseLayout). */
export const isIntro = () => document.documentElement.classList.contains('is-intro');

const loaded = (img: HTMLImageElement) =>
  img.complete ? Promise.resolve() : new Promise<void>((r) => { img.addEventListener('load', () => r(), { once: true }); img.addEventListener('error', () => r(), { once: true }); });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runIntro(scale: Scale, fonts: Promise<unknown>): Promise<void> {
  const html = document.documentElement;
  const intro = document.getElementById('intro')!;
  const box = document.getElementById('intro-box')!;
  const grow = document.getElementById('intro-grow')!;
  const wrap = document.getElementById('intro-wrap')!;
  const start = document.getElementById('intro-start')!;
  const end = document.getElementById('intro-end')!;
  const headline = document.getElementById('headline')!;

  const done = () => {
    intro.remove();
    html.classList.remove('is-intro');
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* sessione non disponibile */ }
    scale.enable();
  };

  await fonts;
  if (reduced) { done(); return; }

  // Foto del rettangolo: in cima quelle che cambiano durante il caricamento,
  // sotto quella che sarà al centro della scala (resta l'ultima).
  const ci = scale.centerIndex();
  const pick = scale.items.map((_, i) => i).filter((i) => i !== ci).slice(0, 4);
  const addImg = (i: number, z: number) => {
    const im = document.createElement('img');
    im.alt = '';
    im.src = scale.imgs[i].currentSrc || scale.imgs[i].src;
    im.style.zIndex = String(z);
    wrap.appendChild(im);
    return im;
  };
  const extras = pick.map((i, k) => addImg(i, pick.length - k + 1));
  const cover = addImg(ci, 1);

  // 1–2. Curve di Osmo, tempi accorciati.
  const D = 0.8;
  const opening = gsap.timeline({ defaults: { ease: 'expo.inOut' } })
    .from('.intro-letter', { yPercent: 100, stagger: 0.018, duration: D })
    .fromTo(box, { width: '0em' }, { width: '1em', duration: D }, `<${D}`)
    .fromTo(grow, { width: '0%' }, { width: '100%', duration: D }, '<')
    .fromTo(start, { x: '0em' }, { x: '-0.05em', duration: D }, '<')
    .fromTo(end, { x: '0em' }, { x: '0.05em', duration: D }, '<');

  // Caricamento reale: foto del rettangolo e foto visibili della scala.
  let isLoaded = false;
  const visible = scale.items.map((_, i) => i).filter(scale.isVisible);
  Promise.all([...extras, cover].map(loaded).concat(visible.map((i) => loaded(scale.imgs[i])))).then(() => { isLoaded = true; });

  // 3. A rettangolo aperto le foto cambiano di colpo ogni quarto di secondo
  // (quella sopra sparisce); se il caricamento non è finito il giro
  // ricomincia. Alla fine resta la foto centrale.
  await opening.then();
  for (;;) {
    for (const im of extras) { await wait(250); gsap.to(im, { opacity: 0, duration: 0.05, ease: 'none' }); }
    if (isLoaded) break;
    await wait(250);
    gsap.set(extras, { opacity: 1 });
  }
  await wait(250);

  // 4. La foto passa in un livello a sé, con lo stesso ritaglio delle foto
  // della scala, e va al posto della foto centrale. Il rettangolo si allarga
  // quanto basta per spingere fuori dallo schermo entrambe le parole (non è
  // al centro esatto: conta il lato più lontano dal bordo).
  const from = grow.getBoundingClientRect();
  const fly = document.createElement('div');
  fly.className = 'intro-fly';
  fly.appendChild(cover.cloneNode());
  Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  document.body.appendChild(fly);
  grow.style.visibility = 'hidden';

  const bx = box.getBoundingClientRect();
  const c = bx.left + bx.width / 2;
  const pushOut = 2 * (Math.max(c, window.innerWidth - c) + (parseFloat(getComputedStyle(box).marginLeft) || 0)) + 40;
  const others = scale.items.map((_, i) => i).filter((i) => i !== ci).sort((a, b) => scale.distance(a) - scale.distance(b));

  // Finisce quando anche l'ultima lettera del titolo è arrivata.
  await new Promise<void>((resolve) => gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: () => { fly.remove(); done(); resolve(); } })
    .to(box, { width: pushOut, duration: 1.1 }, 0)
    .to(fly, { ...scale.centerRect(), duration: 1.1 }, 0)
    // Titolo dall'alto, lettera per lettera.
    .add(() => { headline.style.visibility = 'visible'; }, 0.65)
    .from('.hl', { yPercent: -100, duration: 0.9, ease: 'expo.out', stagger: 0.018 }, 0.65)
    // La foto centrale prende il posto del livello volante.
    .add(() => { gsap.set(scale.imgs[ci], { clipPath: 'inset(0% 0% 0% 0%)' }); fly.style.visibility = 'hidden'; }, 1.1)
    // 5. Le altre foto si scoprono dal basso, dal centro verso i lati.
    .to(others.map((i) => scale.imgs[i]), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out', stagger: 0.05 }, 1.0)
    .fromTo('.scale-arrows', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 1.3));
}
