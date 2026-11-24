// Scheda Profilo, la prima dello scroll in Home. Su desktop è larga quanto
// serve perché la prima foto parta esattamente sotto la "D" di "Devastante"
// (bordo sinistro del disegno della lettera, non della sua casella); il testo
// è il più grande possibile senza uscire dalla scheda. Sul telefono la "D" è
// troppo vicina al bordo: la scheda resta larga come da CSS.
import { isMobile } from './env';

const MIN = 15;
const MAX = 34;

/** Bordo sinistro, a schermo, del disegno della prima lettera della seconda parola. */
function secondWordInkLeft(headline: HTMLElement): number | null {
  const node = headline.firstChild;
  if (!(node instanceof Text)) return null;
  const i = node.data.lastIndexOf(' ') + 1;
  if (i <= 0 || i >= node.data.length) return null;
  const r = document.createRange();
  r.setStart(node, i);
  r.setEnd(node, i + 1);
  const box = r.getBoundingClientRect();
  // Distanza tra il bordo della casella e l'inizio del disegno della lettera.
  const cs = getComputedStyle(headline);
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return box.left;
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText(node.data[i]);
  return box.left - m.actualBoundingBoxLeft;
}

export function fitProfile(track: HTMLElement, stage: HTMLElement, headline: HTMLElement) {
  const panels = [...track.querySelectorAll<HTMLElement>('.panel.profile')];
  if (!panels.length) return;

  if (isMobile()) {
    panels.forEach((p) => { p.style.width = ''; });
  } else {
    const ink = secondWordInkLeft(headline);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    if (ink !== null) {
      const w = Math.max(240, ink - stage.getBoundingClientRect().left - gap);
      panels.forEach((p) => { p.style.width = `${w.toFixed(1)}px`; });
    }
  }

  // Grandezza del testo: ricerca binaria sulla prima scheda, poi uguale per tutte.
  const probe = panels[0];
  const content = probe.querySelector<HTMLElement>('.content');
  if (!content) return;
  let lo = MIN, hi = MAX;
  const fits = (size: number) => {
    probe.style.fontSize = `${size}px`;
    return content.scrollHeight <= probe.clientHeight * 0.94;
  };
  if (fits(hi)) lo = hi;
  else {
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid; else hi = mid;
    }
  }
  panels.forEach((p) => { p.style.fontSize = `${lo.toFixed(2)}px`; });
}
