/**
 * Overlay di caricamento: precarica tutte le foto del flusso aggiornando
 * l'anello di progresso SVG; durata minima visibile 1000ms, timeout di
 * sicurezza 12000ms. All'uscita: fade (.55s, gestito via CSS) e rimozione
 * dal DOM 700ms dopo.
 */

const CIRCUMFERENCE = 439.8;
const MIN_VISIBLE_MS = 1000;
const SAFETY_TIMEOUT_MS = 12000;
const FADE_OUT_MS = 700;

export interface VeilElements {
  overlay: HTMLElement;
  progressCircle: SVGCircleElement;
}

export function initVeil(els: VeilElements, photoSrcs: string[]): void {
  const start = Date.now();
  let done = false;
  let safetyTimer: ReturnType<typeof setTimeout>;
  let minTimer: ReturnType<typeof setTimeout>;

  const setProgress = (p: number) => {
    els.progressCircle.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - Math.min(1, p)));
  };

  const hide = (force = false) => {
    if (done) return;
    const elapsed = Date.now() - start;
    if (!force && elapsed < MIN_VISIBLE_MS) {
      clearTimeout(minTimer);
      minTimer = setTimeout(() => hide(), MIN_VISIBLE_MS - elapsed);
      return;
    }
    done = true;
    clearTimeout(safetyTimer);
    els.overlay.classList.add('is-fading');
    setTimeout(() => els.overlay.classList.add('is-done'), FADE_OUT_MS);
  };

  const total = photoSrcs.length || 1;
  let loaded = 0;
  let left = photoSrcs.length;
  const onSettle = () => {
    loaded++;
    setProgress(loaded / total);
    if (--left <= 0) hide();
  };

  photoSrcs.forEach((src) => {
    const img = new Image();
    img.onload = onSettle;
    img.onerror = onSettle;
    img.src = src;
  });

  safetyTimer = setTimeout(() => hide(true), SAFETY_TIMEOUT_MS);
  if (!photoSrcs.length) hide(true);
}
