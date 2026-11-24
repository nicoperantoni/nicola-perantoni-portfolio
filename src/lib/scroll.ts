// ---------------------------------------------------------------------
// Scroll orizzontale infinito con inerzia (desktop: rotella, trascinamento,
// frecce; telefono: scroll nativo) e parallasse dentro le foto.
// ---------------------------------------------------------------------
import { gsap } from 'gsap';
import { reduced, isMobile } from './env';

interface ScrollOptions {
  stage: HTMLElement;
  track: HTMLElement;
  panels: HTMLElement[];
  imgs: HTMLImageElement[];
  perCopy: number;
}

// Restituisce layout(), da chiamare quando lo scroll diventa visibile.
export function initScroll({ stage, track, panels, imgs, perCopy }: ScrollOptions) {
  // W = larghezza di una copia (gap compreso). target/current sono posizioni
  // "libere" (anche negative o enormi); a schermo si mostra wrap(x) + W,
  // cioè sempre un punto della copia centrale.
  let target = 0, current = 0, W = 0;
  const wrap = (x: number) => ((x % W) + W) % W;
  const measure = () => { W = panels[perCopy].offsetLeft - panels[0].offsetLeft; };
  const frames = imgs.map((img) => img.closest<HTMLElement>('.panel')!);

  function render(shown: number) {
    if (reduced) return;
    const wStage = stage.clientWidth;
    imgs.forEach((img, i) => {
      const p = frames[i];
      const center = p.offsetLeft - shown + p.offsetWidth / 2;
      // Solo le foto vicine allo schermo: le altre restano ferme (risparmio).
      if (center < -wStage || center > 2 * wStage) return;
      const n = Math.max(-1, Math.min(1, (center - wStage / 2) / (wStage / 2 + p.offsetWidth)));
      // Foto larghe il 140% del riquadro: ±14% della foto = ±19,6% del
      // riquadro, appena dentro al margine del 20% su ciascun lato.
      img.style.transform = `translate3d(${(-n * 14).toFixed(2)}%, 0, 0)`;
    });
  }

  const showDesktop = () => {
    const shown = wrap(current) + W;
    track.style.transform = `translate3d(${-shown}px, 0, 0)`;
    render(shown);
  };

  let shownAt: number | null = null;
  gsap.ticker.add(() => {
    if (isMobile() || !W) return;
    const d = target - current;
    if (Math.abs(d) < 0.05 && shownAt === current) return;
    current += d * (reduced ? 1 : 0.085);
    if (Math.abs(d) < 0.05) current = target;
    shownAt = current;
    showDesktop();
  });

  stage.addEventListener('wheel', (ev) => {
    if (isMobile()) return;
    ev.preventDefault();
    target += (Math.abs(ev.deltaY) > Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX) * 1.2;
  }, { passive: false });

  let drag: { x: number; start: number } | null = null;
  stage.addEventListener('pointerdown', (ev) => {
    if (isMobile() || ev.pointerType !== 'mouse' || (ev.target as Element).closest('a, .panel.text')) return;
    drag = { x: ev.clientX, start: target };
    stage.setPointerCapture(ev.pointerId);
  });
  stage.addEventListener('pointermove', (ev) => { if (drag) target = drag.start - (ev.clientX - drag.x) * 1.4; });
  const endDrag = () => { drag = null; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // Frecce: un pannello alla volta, all'infinito.
  document.addEventListener('keydown', (ev) => {
    const body = document.body.classList;
    if (body.contains('is-loading') || body.contains('menu-open')) return;
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault();
    const dir = ev.key === 'ArrowRight' ? 1 : -1;
    // Bordi sinistri dei pannelli di una copia, relativi all'inizio copia.
    const lefts = panels.slice(0, perCopy).map((p) => p.offsetLeft - panels[0].offsetLeft);
    const nextFrom = (x: number) =>
      dir > 0
        ? (lefts.find((l) => l > x + 2) ?? W)
        : ([...lefts].reverse().find((l) => l < x - 2) ?? lefts[perCopy - 1] - W);
    if (isMobile()) {
      stage.scrollTo({ left: nextFrom(stage.scrollLeft - W) + W, behavior: reduced ? 'auto' : 'smooth' });
    } else {
      const base = Math.floor(target / W) * W;
      target = base + nextFrom(target - base);
    }
  });

  // Telefono: scroll nativo; quando si esce dalla copia centrale si salta
  // della larghezza di una copia (stesso contenuto, nessun salto visibile).
  stage.addEventListener('scroll', () => {
    if (!isMobile() || !W) return;
    if (stage.scrollLeft < W * 0.5) stage.scrollLeft += W;
    else if (stage.scrollLeft > W * 1.5) stage.scrollLeft -= W;
    render(stage.scrollLeft);
  }, { passive: true });

  const layout = () => {
    measure();
    if (isMobile()) {
      track.style.transform = '';
      if (stage.scrollLeft < W * 0.5) stage.scrollLeft = W;
      render(stage.scrollLeft);
    } else {
      stage.scrollLeft = 0;
      current = target;
      showDesktop();
    }
  };
  window.addEventListener('resize', layout);

  return { layout };
}
