// ---------------------------------------------------------------------
// Scala della Home: foto allineate in basso, sul fondo della pagina, che
// crescono da sinistra a destra. Da ferme se ne vedono quattro (tre sul
// telefono) e una è al centro della pagina; verso destra crescono ed escono
// dallo schermo. Scorrimento infinito con inerzia: rotella, trascinamento,
// tocco, frecce (tastiera e pulsanti) e click su una foto, che la porta al
// centro.
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

interface Rect { left: number; top: number; width: number; height: number }

export function initScale(stage: HTMLElement) {
  const items = [...stage.querySelectorAll<HTMLElement>('.scale-item')];
  const imgs = items.map((el) => el.querySelector('img')!);
  const n = items.length;

  // --- Geometria ---------------------------------------------------------
  // Ogni foto ha una posizione continua u sulla scala. Altezza:
  // h(u) = HS · R^(u - UC), dove HS è l'altezza della pagina e UC la posizione
  // in cui la foto è centrata nella pagina. Le foto sono attaccate: il bordo
  // sinistro è la somma delle larghezze precedenti e, con la serie
  // geometrica, vale per qualsiasi u reale, quindi il movimento è continuo.
  // U0 è l'inizio della fila, tre gradini a sinistra della foto centrale:
  // lì le foto sono già fuori dallo schermo.
  let W = 0, H = 0, HS = 0, UC = 0, U0 = 0, PHASE = 0, hDraw = 0;
  const wAt = (u: number) => ASPECT * HS * Math.pow(R, u - UC);
  // Foto attaccate l'una all'altra, senza spazio in mezzo.
  const xAt = (u: number) => PAD + (ASPECT * HS * Math.pow(R, -UC) * (Math.pow(R, u) - 1)) / (R - 1);

  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
    // Grandezza della foto al centro, in larghezze di foto centrale da metà
    // pagina al bordo: a sinistra metà centrale più le LEFT precedenti (ognuna
    // R volte più piccola), a destra metà centrale più la successiva. Conta il
    // lato più stretto, così a destra la foto arriva esattamente al bordo e a
    // sinistra la prima esce di pochi pixel: quattro foto da bordo a bordo
    // (tre sul telefono, LEFT = 1). Mai più alta della pagina.
    const LEFT = W <= 900 ? 1 : 2;
    let left = 0.5;
    for (let k = 1; k <= LEFT; k++) left += Math.pow(R, -k);
    const right = 0.5 + R;
    HS = Math.min(H, W / 2 / Math.min(left, right) / ASPECT);
    // UC: la posizione in cui il centro della foto cade a metà pagina
    // (ricerca binaria: il centro cresce con u; può essere anche negativa,
    // se la foto è più larga dello schermo).
    let lo = -12, hi = 12;
    for (let k = 0; k < 40; k++) {
      UC = (lo + hi) / 2;
      if (xAt(UC) + wAt(UC) / 2 < W / 2) lo = UC; else hi = UC;
    }
    UC = (lo + hi) / 2;
    // Gradini di riposo spostati così che, da fermo, una foto sia esattamente
    // al centro con la grandezza standard.
    PHASE = UC - Math.floor(UC);
    U0 = Math.floor(UC) - 3;
    // Le foto sono disegnate alla grandezza più grande che raggiungono (così
    // restano nitide) e ridimensionate con scale().
    hDraw = HS * Math.pow(R, MAX_U);
    items.forEach((el) => {
      el.style.width = `${ASPECT * hDraw}px`;
      el.style.height = `${hDraw}px`;
    });
  }

  // --- Movimento ---------------------------------------------------------
  // target: dove vuole arrivare chi scorre; current lo insegue con inerzia.
  // Fermandosi, target si aggancia al gradino intero più vicino.
  let target = 0, current = 0, snapTimer = 0, enabled = false;
  // Sovrapposizione mentre la scala scorre: le foto si stringono verso il
  // bordo sinistro dello schermo (0 = attaccate, MAX_OVERLAP = 10% della
  // larghezza di ogni foto), in proporzione alla velocità; da ferme tornano
  // attaccate. La prima foto parte fuori schermo e ci resta: il bordo
  // sinistro non si scopre mai.
  const MAX_OVERLAP = 0.1;
  let overlap = 0;
  /** Posizione della foto i sulla scala, ripetuta all'infinito. */
  const uOf = (i: number) => ((((i + current) % n) + n) % n) + U0 + PHASE;
  const isVisible = (i: number) => { const u = uOf(i); return xAt(u) + wAt(u) > 0 && xAt(u) <= W; };

  function render() {
    for (let i = 0; i < n; i++) {
      const u = uOf(i);
      const el = items[i];
      const x = xAt(u) * (1 - overlap);
      if (x + wAt(u) < 0 || x > W) { el.style.visibility = 'hidden'; continue; }
      el.style.visibility = '';
      // La foto più a destra (più grande) sta sopra la precedente.
      el.style.zIndex = String(Math.round((u - U0) * 10));
      const s = (HS * Math.pow(R, u - UC)) / hDraw;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${(H - hDraw).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
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

  // Rotella, trascinamento e tocco in un solo gesto (GSAP Observer).
  Observer.create({
    target: stage,
    type: 'wheel,touch,pointer',
    onChangeX: (self) => nudge(self.deltaX * (self.event.type === 'wheel' ? 0.0035 : 0.006)),
    onChangeY: (self) => { if (self.event.type === 'wheel') nudge(self.deltaY * 0.0035); },
    onPress: () => stage.classList.add('dragging'),
    onRelease: (self) => {
      stage.classList.remove('dragging');
      // Lancio: la velocità al rilascio prosegue un po'.
      nudge(gsap.utils.clamp(-2, 2, self.velocityX * 0.0008));
    },
    tolerance: 2,
    preventDefault: true,
  });

  // Frecce della tastiera (non a menu aperto) e pulsanti: un gradino.
  document.addEventListener('keydown', (ev) => {
    if (document.body.classList.contains('menu-open')) return;
    if (ev.key === 'ArrowRight') { step(1); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft') { step(-1); ev.preventDefault(); }
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
    centerRect: (): Rect => ({ left: xAt(UC), top: H - HS, width: ASPECT * HS, height: HS }),
  };
}

export type Scale = ReturnType<typeof initScale>;
