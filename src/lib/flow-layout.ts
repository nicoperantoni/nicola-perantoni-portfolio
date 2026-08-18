/**
 * Masonry del flusso fotografico: 3 / 2 / 1 colonne sulla larghezza utile
 * (clientWidth − padding) a 1000px / 620px, celle su griglia a righe di 8px
 * la cui altezza è calcolata dall'altezza reale del contenuto. Le note
 * manifesto ricevono una colonna esplicita a rotazione così non risultano
 * mai consecutive nella stessa colonna.
 */

const UNIT = 8;
const RATIO = 1.25; // 4:5 verticale

export interface FlowLayoutOptions {
  onPhotoClick?: (src: string, list: string[]) => void;
}

export function initFlowLayout(container: HTMLElement, options: FlowLayoutOptions = {}): () => void {
  const columnsFor = (w: number) => (w >= 1000 ? 3 : w >= 620 ? 2 : 1);

  const layout = () => {
    const shots = Array.from(container.querySelectorAll<HTMLElement>('.shot'));
    if (!shots.length) return;
    const cs = getComputedStyle(container);
    const w = container.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
    const nCols = columnsFor(w);
    const gap = parseFloat(getComputedStyle(container).columnGap) || 24;

    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${nCols}, 1fr)`;
    container.style.gridAutoRows = `${UNIT}px`;
    container.style.gridAutoFlow = 'row dense';
    container.style.rowGap = '0px';
    container.style.columnGap = `${gap}px`;

    const colW = (w - gap * (nCols - 1)) / nCols;
    let ti = 0;
    shots.forEach((el) => {
      const txt = el.querySelector('[data-lines-src]');
      if (txt && nCols > 1) el.dataset.txtCol = String(((ti++ + 1) % nCols) + 1);
      else delete el.dataset.txtCol;
      el.style.width = '100%';
      el.style.gridColumn = el.dataset.txtCol ? `${el.dataset.txtCol} / span 1` : 'span 1';
      el.style.gridRowEnd = 'span 1000';
      el.style.alignSelf = 'start';
      if (txt) {
        el.style.height = 'auto';
        el.style.minHeight = '0';
      } else {
        el.style.height = `${Math.round(colW * RATIO)}px`;
      }
      el.style.display = 'block';
    });

    shots.forEach((el) => {
      const inner = el.firstElementChild as HTMLElement | null;
      const h = el.style.height && el.style.height !== 'auto'
        ? parseFloat(el.style.height)
        : Math.max(el.scrollHeight, inner ? inner.getBoundingClientRect().height : 0, parseFloat(el.style.minHeight) || 0);
      el.style.gridRowEnd = `span ${Math.max(1, Math.ceil((h + gap) / UNIT))}`;
    });
  };

  const onClick = (e: MouseEvent) => {
    const img = (e.target as HTMLElement).closest?.('img');
    if (!img) return;
    const list = Array.from(container.querySelectorAll('img'))
      .map((n) => n.getAttribute('src'))
      .filter((s): s is string => !!s);
    const src = img.getAttribute('src');
    if (src) options.onPhotoClick?.(src, list);
  };

  let layoutTimer: ReturnType<typeof setTimeout>;
  const onLoad = () => {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(layout, 60);
  };

  container.addEventListener('click', onClick);
  container.addEventListener('load', onLoad, true);
  window.addEventListener('resize', layout);
  document.fonts?.ready?.then(layout).catch(() => {});

  layout();
  const delayedTimers = [300, 900, 2000].map((t) => setTimeout(layout, t));

  return () => {
    container.removeEventListener('click', onClick);
    container.removeEventListener('load', onLoad, true);
    window.removeEventListener('resize', layout);
    clearTimeout(layoutTimer);
    delayedTimers.forEach(clearTimeout);
  };
}
