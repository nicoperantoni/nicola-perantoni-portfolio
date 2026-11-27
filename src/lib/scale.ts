// ---------------------------------------------------------------------
// Scala della Home: foto attaccate l'una all'altra che crescono gradino
// dopo gradino, con una foto al centro della pagina.
// - Orizzontale (pagina larga: computer, telefono o tablet girati): foto
//   appoggiate al fondo della pagina, crescono da sinistra a destra. Da
//   ferme se ne vedono quattro (tre sul telefono); verso destra crescono ed
//   escono dallo schermo.
// - Verticale (pagina alta: telefono o tablet tenuti dritti): la stessa
//   scala girata, con le foto in colonna contro il bordo destro (l'angolo
//   del tasto Menu resta libero), che crescono dall'alto verso il basso e
//   riempiono tutta l'altezza.
// Scorrimento infinito con inerzia: rotella, trascinamento, tocco, frecce
// (tastiera e pulsanti) e click su una foto, che la porta al centro.
// ---------------------------------------------------------------------
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { reduced } from './env';

gsap.registerPlugin(Observer);

/** Formato delle foto (larghezza / altezza), come nel resto del sito. */
const ASPECT = 2 / 3;
/** Ogni gradino è il 32% più grande del precedente. */
const R = 1.32;
/** Oltre il centro + MAX_U gradini la foto è già fuori dallo schermo. */
const MAX_U = 2.6;
/** Margine laterale della pagina (--pad in global.css). */
const PAD = 14;
/** Scala verticale: larghezza della foto al centro, in frazione di pagina,
 * ma alta al massimo CENTER_H della pagina (sul tablet, più largo, così si
 * vedono anche la precedente e la successiva). */
const CENTER_W = 0.6;
const CENTER_H = 0.6;

interface Rect { left: number; top: number; width: number; height: number }

export function initScale(stage: HTMLElement) {
  const items = [...stage.querySelectorAll<HTMLElement>('.scale-item')];
  const imgs = items.map((el) => el.querySelector('img')!);
  const n = items.length;

  // --- Geometria ---------------------------------------------------------
  // Ogni foto ha una posizione continua u sulla scala. Altezza:
  // h(u) = HS · R^(u - UC), dove HS è l'altezza della foto al centro e UC la
  // posizione in cui la foto è centrata nella pagina. Lungo la scala (in
  // larghezza se orizzontale, in altezza se verticale) le foto sono
  // attaccate: l'inizio di ognuna è la somma delle precedenti e, con la serie
  // geometrica, vale per qualsiasi u reale, quindi il movimento è continuo.
  // U0 è l'inizio della fila, tre gradini prima della foto centrale: lì le
  // foto sono già fuori dallo schermo.
  let W = 0, H = 0, HS = 0, UC = 0, U0 = 0, PHASE = 0, hDraw = 0;
  /** Scala verticale (pagina alta: telefono o tablet tenuti dritti). */
  let vertical = false;
  /** Lunghezza della pagina lungo la scala. */
  let L = 0;
  // Misura della foto al centro lungo la scala, e inizio della fila.
  const unit = () => (vertical ? HS : ASPECT * HS);
  const start = () => (vertical ? 0 : PAD);
  /** Misura della foto lungo la scala. */
  const lenAt = (u: number) => unit() * Math.pow(R, u - UC);
  /** Inizio della foto lungo la scala (foto attaccate, senza spazio). */
  const posAt = (u: number) => start() + (unit() * Math.pow(R, -UC) * (Math.pow(R, u) - 1)) / (R - 1);

  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
    // Pagina chiaramente più alta che larga (il margine evita che una
    // finestra quasi quadrata sul computer cambi scala).
    vertical = H > W * 1.1;
    L = vertical ? H : W;
    if (vertical) {
      // Foto al centro larga CENTER_W della pagina: sopra si vede la
      // precedente sotto al titolo, sotto la successiva, più larga, che esce
      // dal fondo.
      HS = Math.min((CENTER_W * W) / ASPECT, CENTER_H * H);
    } else {
      // Grandezza della foto al centro, in larghezze di foto centrale da metà
      // pagina al bordo: a sinistra metà centrale più le LEFT precedenti
      // (ognuna R volte più piccola), a destra metà centrale più la
      // successiva. Conta il lato più stretto, così a destra la foto arriva
      // esattamente al bordo e a sinistra la prima esce di pochi pixel:
      // quattro foto da bordo a bordo (tre sul telefono girato, LEFT = 1).
      // Mai più alta della pagina.
      const LEFT = W <= 900 ? 1 : 2;
      let left = 0.5;
      for (let k = 1; k <= LEFT; k++) left += Math.pow(R, -k);
      const right = 0.5 + R;
      HS = Math.min(H, W / 2 / Math.min(left, right) / ASPECT);
    }
    // UC: la posizione in cui il centro della foto cade a metà pagina
    // (ricerca binaria: il centro cresce con u; può essere anche negativa,
    // se la foto è più grande dello schermo).
    let lo = -12, hi = 12;
    for (let k = 0; k < 40; k++) {
      UC = (lo + hi) / 2;
      if (posAt(UC) + lenAt(UC) / 2 < L / 2) lo = UC; else hi = UC;
    }
    UC = (lo + hi) / 2;
    // Gradini di riposo spostati così che, da fermo, una foto sia esattamente
    // al centro con la grandezza standard.
    PHASE = UC - Math.floor(UC);
    U0 = Math.floor(UC) - 3;
    // Le foto sono disegnate alla grandezza più grande che raggiungono (così
    // restano nitide) e ridimensionate con scale(), a partire dall'angolo
    // fisso: in basso a sinistra in orizzontale, in alto a destra in
    // verticale.
    hDraw = HS * Math.pow(R, MAX_U);
    items.forEach((el) => {
      el.style.width = `${ASPECT * hDraw}px`;
      el.style.height = `${hDraw}px`;
      el.style.transformOrigin = vertical ? '100% 0' : '0 100%';
    });
    // Per le frecce (girate in verticale, in global.css).
    stage.dataset.axis = vertical ? 'y' : 'x';
  }

  // --- Movimento ---------------------------------------------------------
  // target: dove vuole arrivare chi scorre; current lo insegue con inerzia.
  // Fermandosi, target si aggancia al gradino intero più vicino.
  let target = 0, current = 0, snapTimer = 0, enabled = false;
  // Sovrapposizione mentre la scala scorre: le foto si stringono verso
  // l'inizio della fila (0 = attaccate, MAX_OVERLAP = 10% della misura di
  // ogni foto), in proporzione alla velocità; da ferme tornano attaccate. La
  // prima foto parte fuori schermo e ci resta: il bordo non si scopre mai.
  const MAX_OVERLAP = 0.1;
  let overlap = 0;
  /** Posizione della foto i sulla scala, ripetuta all'infinito. */
  const uOf = (i: number) => ((((i + current) % n) + n) % n) + U0 + PHASE;
  const isVisible = (i: number) => { const u = uOf(i); return posAt(u) + lenAt(u) > 0 && posAt(u) <= L; };

  function render() {
    for (let i = 0; i < n; i++) {
      const u = uOf(i);
      const el = items[i];
      const p = posAt(u) * (1 - overlap);
      if (p + lenAt(u) < 0 || p > L) { el.style.visibility = 'hidden'; continue; }
      el.style.visibility = '';
      // La foto più grande sta sopra la precedente.
      el.style.zIndex = String(Math.round((u - U0) * 10));
      const s = (HS * Math.pow(R, u - UC)) / hDraw;
      const at = vertical ? `${(W - ASPECT * hDraw).toFixed(2)}px, ${p.toFixed(2)}px` : `${p.toFixed(2)}px, ${(H - hDraw).toFixed(2)}px`;
      el.style.transform = `translate3d(${at}, 0) scale(${s.toFixed(4)})`;
      // Leggera parallasse dentro la foto, legata alla posizione.
      imgs[i].style.transform = `translate3d(${((u - UC) * -2.2).toFixed(2)}%, 0, 0)`;
    }
  }

  gsap.ticker.add(() => {
    const d = target - current;
    const moving = Math.abs(d) >= 0.0005;
    // La sovrapposizione insegue la velocità, con morbidezza.
    const want = reduced ? 0 : Math.min(MAX_OVERLAP, Math.abs(d * 0.09) * 2.2);
    const settled = Math.abs(want - overlap) < 0.0005;
    if (!moving && settled && overlap === 0) { if (current !== target) { current = target; render(); } return; }
    if (moving) current += d * (reduced ? 1 : 0.09);
    else current = target;
    overlap = settled && want === 0 ? 0 : overlap + (want - overlap) * 0.12;
    render();
  });

  const nudge = (d: number) => {
    if (!enabled) return;
    target += d;
    clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => { target = Math.round(target); }, 140);
  };
  const step = (d: number) => { if (enabled) target = Math.round(target) + d; };

  // Rotella, trascinamento e tocco in un solo gesto (GSAP Observer). Il
  // trascinamento segue la scala (orizzontale o verticale); la rotella in
  // verticale scorre come una pagina: verso il basso salgono le foto
  // successive.
  const WHEEL = 0.0035, DRAG = 0.006;
  Observer.create({
    target: stage,
    type: 'wheel,touch,pointer',
    onChangeX: (self) => {
      if (vertical) return;
      nudge(self.deltaX * (self.event.type === 'wheel' ? WHEEL : DRAG));
    },
    onChangeY: (self) => {
      if (self.event.type === 'wheel') nudge(self.deltaY * WHEEL * (vertical ? -1 : 1));
      else if (vertical) nudge(self.deltaY * DRAG);
    },
    onPress: () => stage.classList.add('dragging'),
    onRelease: (self) => {
      stage.classList.remove('dragging');
      // Lancio: la velocità al rilascio prosegue un po'.
      nudge(gsap.utils.clamp(-2, 2, (vertical ? self.velocityY : self.velocityX) * 0.0008));
    },
    tolerance: 2,
    preventDefault: true,
  });

  // Frecce della tastiera (non a menu aperto) e pulsanti: un gradino.
  document.addEventListener('keydown', (ev) => {
    if (document.body.classList.contains('menu-open')) return;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { step(1); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { step(-1); ev.preventDefault(); }
  });
  document.getElementById('scale-next')?.addEventListener('click', () => step(1));
  document.getElementById('scale-prev')?.addEventListener('click', () => step(-1));

  // Click su una foto: la scala scorre finché quella foto è al centro della
  // pagina. Un trascinamento non conta come click.
  let downX = 0, downY = 0;
  stage.addEventListener('pointerdown', (ev) => { downX = ev.clientX; downY = ev.clientY; });
  items.forEach((el, i) => el.addEventListener('click', (ev) => {
    if (!enabled || Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6) return;
    target = Math.round(target + (UC - uOf(i)));
  }));

  window.addEventListener('resize', () => { measure(); render(); });

  return {
    items,
    imgs,
    measure,
    render,
    /** Attiva comandi e frecce (dopo l'ingresso nella pagina). */
    enable: () => { enabled = true; },
    isVisible,
    /** Indice della foto al centro, da ferma. */
    centerIndex: () => items.findIndex((_, i) => Math.abs(uOf(i) - UC) < 0.01),
    /** Distanza dal centro, in gradini (per far comparire le foto dal centro). */
    distance: (i: number) => Math.abs(uOf(i) - UC),
    /** Rettangolo, a schermo, della foto al centro. */
    centerRect: (): Rect => vertical
      ? { left: W - ASPECT * HS, top: posAt(UC), width: ASPECT * HS, height: HS }
      : { left: posAt(UC), top: H - HS, width: ASPECT * HS, height: HS },
  };
}

export type Scale = ReturnType<typeof initScale>;
