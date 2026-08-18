/**
 * Overlay di caricamento: precarica tutte le foto del flusso prima di
 * mostrarle. Timeout di sicurezza 12000ms. All'uscita: fade (.55s, gestito
 * via CSS) e rimozione dal DOM 700ms dopo.
 */

const SAFETY_TIMEOUT_MS = 12000;
const FADE_OUT_MS = 700;

export interface VeilElements {
  overlay: HTMLElement;
}

export function initVeil(els: VeilElements, photoSrcs: string[]): void {
  let done = false;
  let safetyTimer: ReturnType<typeof setTimeout>;

  const hide = () => {
    if (done) return;
    done = true;
    clearTimeout(safetyTimer);
    els.overlay.classList.add('is-fading');
    setTimeout(() => els.overlay.classList.add('is-done'), FADE_OUT_MS);
  };

  let left = photoSrcs.length;
  const onSettle = () => {
    if (--left <= 0) hide();
  };

  photoSrcs.forEach((src) => {
    const img = new Image();
    img.onload = onSettle;
    img.onerror = onSettle;
    img.src = src;
  });

  safetyTimer = setTimeout(hide, SAFETY_TIMEOUT_MS);
  if (!photoSrcs.length) hide();
}
