/**
 * Reveal allo scroll: IntersectionObserver su [data-reveal], unobserve al
 * primo ingresso (data-seen="1"). Le celle testo con [data-lines-src]
 * vengono spezzate in righe reali (misurando offsetTop di ogni parola) e
 * ricalcolate quando la larghezza cambia di oltre 4px.
 */

const RESCAN_INTERVAL = 600;
const RESIZE_DEBOUNCE = 120;
const LINE_TOLERANCE = 3;
const WIDTH_TOLERANCE = 4;

interface LinedElement extends HTMLElement {
  _srcText?: string;
  _lineW?: number;
  _ro?: ResizeObserver;
  _roT?: ReturnType<typeof setTimeout>;
}

export function initReveal(root: ParentNode = document): () => void {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const splitLines = (el: LinedElement) => {
    if (el._srcText === undefined) el._srcText = el.textContent || '';
    const words = el._srcText.trim().split(/\s+/).filter(Boolean);
    if (!words.length || el.clientWidth < 80) return;
    el.textContent = '';
    const probes = words.map((w) => {
      const sp = document.createElement('span');
      sp.textContent = w;
      el.appendChild(sp);
      el.appendChild(document.createTextNode(' '));
      return sp;
    });
    const lines: string[][] = [];
    let cur: string[] | null = null;
    let top: number | null = null;
    probes.forEach((sp) => {
      const t = Math.round(sp.offsetTop);
      if (top === null || Math.abs(t - top) > LINE_TOLERANCE) {
        cur = [];
        lines.push(cur);
        top = t;
      }
      cur!.push(sp.textContent || '');
    });
    el.textContent = '';
    const seen = !!el.closest('[data-seen="1"]') || reduced;
    lines.forEach((ws, i) => {
      const outer = document.createElement('span');
      outer.style.cssText = 'display:block; overflow:hidden;';
      const inner = document.createElement('span');
      inner.style.cssText =
        `display:block; transform:translateY(${seen ? '0' : '108%'});` +
        (reduced ? '' : ` transition:transform .82s cubic-bezier(.2,.7,.2,1); transition-delay:${(i * 0.09).toFixed(2)}s;`);
      inner.textContent = ws.join(' ');
      outer.appendChild(inner);
      el.appendChild(outer);
    });
    el.dataset.lines = '1';
    el._lineW = el.clientWidth;
    if (!el._ro && window.ResizeObserver) {
      el._ro = new ResizeObserver(() => {
        clearTimeout(el._roT);
        el._roT = setTimeout(() => {
          if (Math.abs(el.clientWidth - (el._lineW || 0)) > WIDTH_TOLERANCE) {
            delete el.dataset.lines;
            splitLines(el);
          }
        }, RESIZE_DEBOUNCE);
      });
      el._ro.observe(el);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.setAttribute('data-seen', '1');
        en.target.querySelectorAll('[data-lines-src] > span > span').forEach((inn) => {
          (inn as HTMLElement).style.transform = 'translateY(0)';
        });
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
  );

  const scan = () => {
    root.querySelectorAll<LinedElement>('[data-lines-src]:not([data-lines])').forEach(splitLines);
    root.querySelectorAll('[data-reveal]:not([data-seen])').forEach((el) => io.observe(el));
  };

  scan();
  const interval = setInterval(scan, RESCAN_INTERVAL);

  return () => {
    io.disconnect();
    clearInterval(interval);
  };
}
