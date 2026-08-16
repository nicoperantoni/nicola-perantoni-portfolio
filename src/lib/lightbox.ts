/**
 * Lightbox: apertura/chiusura con fade (lbShown separato da lbOpen),
 * navigazione prev/next, contatore "03 / 17", tastiera (Esc, ←, →),
 * blocco dello scroll del body mentre è aperta.
 */

export interface LightboxElements {
  overlay: HTMLElement;
  image: HTMLImageElement;
  prevButton: HTMLElement;
  nextButton: HTMLElement;
  closeButton: HTMLElement;
  counter: HTMLElement;
}

export interface LightboxController {
  open(list: string[], index: number): void;
  destroy(): void;
}

const CLOSE_FADE_MS = 320;

export function initLightbox(els: LightboxElements): LightboxController {
  let list: string[] = [];
  let index = 0;
  let open = false;
  let closeTimer: ReturnType<typeof setTimeout>;

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const syncImage = () => {
    const src = list[index];
    if (open && src) {
      if (els.image.getAttribute('src') !== src) els.image.setAttribute('src', src);
    } else {
      els.image.removeAttribute('src');
    }
    els.counter.textContent = list.length ? `${pad2(index + 1)} / ${pad2(list.length)}` : '';
  };

  const openLb = (l: string[], idx: number) => {
    if (!l.length) return;
    document.body.style.overflow = 'hidden';
    list = l;
    index = idx;
    open = true;
    els.overlay.classList.add('is-open');
    syncImage();
    requestAnimationFrame(() => requestAnimationFrame(() => els.overlay.classList.add('is-shown')));
  };

  const closeLb = () => {
    if (!open) return;
    document.body.style.overflow = '';
    els.overlay.classList.remove('is-shown');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      open = false;
      els.overlay.classList.remove('is-open');
      syncImage();
    }, CLOSE_FADE_MS);
  };

  const stepLb = (d: number) => {
    if (!list.length) return;
    index = (index + d + list.length) % list.length;
    syncImage();
  };

  const onOverlayClick = () => closeLb();
  const onPrev = (e: Event) => { e.stopPropagation(); stepLb(-1); };
  const onNext = (e: Event) => { e.stopPropagation(); stepLb(1); };
  const onClose = (e: Event) => { e.stopPropagation(); closeLb(); };
  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowRight') stepLb(1);
    else if (e.key === 'ArrowLeft') stepLb(-1);
  };

  els.overlay.addEventListener('click', onOverlayClick);
  els.prevButton.addEventListener('click', onPrev);
  els.nextButton.addEventListener('click', onNext);
  els.closeButton.addEventListener('click', onClose);
  window.addEventListener('keydown', onKey);

  return {
    open: openLb,
    destroy() {
      document.body.style.overflow = '';
      clearTimeout(closeTimer);
      els.overlay.removeEventListener('click', onOverlayClick);
      els.prevButton.removeEventListener('click', onPrev);
      els.nextButton.removeEventListener('click', onNext);
      els.closeButton.removeEventListener('click', onClose);
      window.removeEventListener('keydown', onKey);
    },
  };
}
