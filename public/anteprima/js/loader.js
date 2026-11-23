// ---------------------------------------------------------------------
// Loader: lettere animate, barra nera che avanza col caricamento reale
// (foto + font), testo bianco sulla barra e nero sul bianco. A fine
// caricamento la barra esce, il titolo va al suo posto e lo scroll sale.
// ---------------------------------------------------------------------
import { reduced } from './env.js';

gsap.registerPlugin(ScrambleTextPlugin);

// title: testo del titolo; photos: foto da precaricare; panels: pannelli
// dello scroll; layout(): misura lo scroll; onDone() (facoltativo): a pagina pronta.
export function initLoader({ title, photos, panels, layout, onDone }) {
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loader-bar');
  const wordDark = document.getElementById('word-dark');
  const wordLight = document.getElementById('word-light');
  const headline = document.getElementById('headline');
  const head = document.querySelector('.site-head');
  const stage = document.querySelector('.stage');

  // Bordo sinistro (L) e destro (R) della barra, in % dello schermo: la
  // copia bianca del titolo è ritagliata esattamente sulla stessa porzione.
  const edges = { L: 0, R: 0 };
  const paint = () => {
    bar.style.clipPath = `inset(0 ${100 - edges.R}% 0 ${edges.L}%)`;
    const vw = window.innerWidth;
    const r = wordLight.getBoundingClientRect();
    const toWord = (pct) => Math.max(0, Math.min(100, (((pct / 100) * vw - r.left) / r.width) * 100));
    wordLight.style.clipPath = `inset(-30% ${100 - toWord(edges.R)}% -30% ${toWord(edges.L)}%)`;
  };

  // ScrambleText in loop finché si carica: lettere casuali che si
  // ricompongono nel titolo. Lo scramble gira sulla copia nera; la bianca ne
  // copia il testo a ogni fotogramma, così le due mostrano sempre le stesse
  // lettere e il passaggio di colore sul bordo della barra resta netto.
  const syncWords = () => { wordLight.textContent = wordDark.textContent; paint(); };
  // Solo lettere minuscole di larghezza media (niente m, w, maiuscole): il
  // titolo occupa tutta la larghezza e lettere più larghe lo farebbero
  // uscire dallo schermo durante lo scramble.
  const SCRAMBLE = { text: title, chars: 'abcdeghknopqsuvxyz', speed: 0.55, revealDelay: 0.45 };
  const scrambleLoop = reduced ? null : gsap.timeline({ repeat: -1, repeatDelay: 0.35 })
    .to(wordDark, { duration: 1.5, scrambleText: SCRAMBLE, onUpdate: syncWords });

  // Avanzamento reale: font + foto. La barra lo insegue con morbidezza,
  // con una durata minima perché l'animazione si legga anche con la cache.
  const tasks = [document.fonts.ready, ...photos.map((f) => new Promise((res) => {
    const im = new Image(); im.onload = im.onerror = res; im.src = `img/${f}.webp`;
  }))];
  let done = 0;
  const MIN_TIME = 1.8;
  const startedAt = performance.now();
  let barTween = null;
  const advance = () => {
    const elapsed = (performance.now() - startedAt) / 1000;
    // Senza cache segue il caricamento; con la cache non corre oltre il ritmo minimo.
    const cap = Math.min(1, elapsed / MIN_TIME + 0.1);
    const goal = Math.min(done / tasks.length, cap) * 100;
    if (goal <= edges.R) return;
    barTween?.kill();
    barTween = gsap.to(edges, { R: goal, duration: 0.6, ease: 'power2.out', onUpdate: paint });
  };
  tasks.forEach((t) => t.then(() => { done++; advance(); }));
  const pulse = setInterval(advance, 200);
  paint();

  Promise.all(tasks)
    .then(() => new Promise((res) => setTimeout(res, Math.max(0, MIN_TIME * 1000 - (performance.now() - startedAt)))))
    .then(() => {
      clearInterval(pulse);
      barTween?.kill();
      if (reduced) { finish(); return; }
      // Ultimo giro di scramble che si chiude sul titolo, poi l'uscita.
      scrambleLoop?.kill();
      gsap.to(wordDark, { duration: 0.7, scrambleText: { ...SCRAMBLE, revealDelay: 0.15 }, onUpdate: syncWords, onComplete: () => { wordDark.textContent = title; syncWords(); exitLoader(); } });
    });

  function exitLoader() {
    // Il titolo vero diventa misurabile (resta invisibile) per calcolare
    // lo spostamento della copia del loader fino alla sua posizione.
    head.style.visibility = 'hidden';
    document.body.classList.remove('is-loading');
    stage.style.visibility = 'hidden';
    const from = wordDark.getBoundingClientRect();
    const to = headline.getBoundingClientRect();
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    const s = to.width / from.width;

    gsap.timeline({ onComplete: finish })
      .to(edges, { R: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: paint })
      // La barra esce verso destra scoprendo di nuovo il bianco.
      .to(edges, { L: 100, duration: 0.9, ease: 'expo.inOut', onUpdate: paint }, '+=0.15')
      // Il titolo si sposta al suo posto, in alto.
      .to([wordDark, wordLight], { x: `+=${dx}`, y: `+=${dy}`, scale: s, duration: 1, ease: 'expo.inOut' }, '-=0.35')
      .add(() => {
        head.style.visibility = '';
        gsap.set(loader, { autoAlpha: 0 });
        stage.style.visibility = '';
        layout();
        // Lo scroll gigante sale dal basso.
        const inView = panels.filter((p) => { const r = p.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth; });
        gsap.from(inView, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' });
      });
  }

  function finish() {
    document.body.classList.remove('is-loading');
    head.style.visibility = '';
    stage.style.visibility = '';
    loader.remove();
    layout();
    onDone?.();
  }
}
