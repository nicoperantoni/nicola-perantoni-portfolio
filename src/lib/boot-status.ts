/**
 * Boot degli indicatori di stato (GPS Signal / Device / Athlete): sequenza
 * a 4400ms dal mount poi ogni 1100ms, con effetto scramble di 760ms per
 * riga. Il LED passa da "boot" (ambra, lampeggio a passi) ad "attivo"
 * (verde, flicker) al termine della propria riga.
 */

const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BOOT_DELAY = 4400;
const ROW_INTERVAL = 1100;
const SCRAMBLE_DURATION = 760;
const SCRAMBLE_WINDOW = 260;
const REDUCED_DELAY = 1200;

export interface BootRow {
  ledEl: HTMLElement;
  textEl: HTMLElement;
  from: string;
  to: string;
}

const FLICKER_DURATIONS = [2.7, 2.3, 2.9];
const FLICKER_DELAYS = [0.7, 0.3, 0.9];

function setLedOk(led: HTMLElement, index: number) {
  led.classList.remove('is-boot');
  led.classList.add('is-ok');
  led.style.animation = `ledFlicker ${FLICKER_DURATIONS[index]}s steps(1, end) infinite ${FLICKER_DELAYS[index]}s`;
}

function scramble(el: HTMLElement, from: string, to: string, done: () => void) {
  const n = Math.max(from.length, to.length);
  const t0 = performance.now();
  const step = (now: number) => {
    const t = now - t0;
    let out = '';
    for (let i = 0; i < n; i++) {
      const p = t - (i / n) * (SCRAMBLE_DURATION - SCRAMBLE_WINDOW);
      const c = to[i] || '';
      if (p < 0) out += from[i] || ' ';
      else if (p < SCRAMBLE_WINDOW) out += c === ' ' ? ' ' : CH[(Math.floor(p / 40) + i * 3) % CH.length];
      else out += c;
    }
    el.textContent = out.replace(/\s+$/, '');
    if (t < SCRAMBLE_DURATION) requestAnimationFrame(step);
    else { el.textContent = to; done(); }
  };
  requestAnimationFrame(step);
}

export function runBootSequence(rows: BootRow[]): () => void {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers: ReturnType<typeof setTimeout>[] = [];

  if (reduced) {
    timers.push(
      setTimeout(() => {
        rows.forEach((row, i) => {
          row.textEl.textContent = row.to;
          setLedOk(row.ledEl, i);
        });
      }, REDUCED_DELAY)
    );
    return () => timers.forEach(clearTimeout);
  }

  const runRow = (i: number) => {
    const row = rows[i];
    scramble(row.textEl, row.from, row.to, () => setLedOk(row.ledEl, i));
    if (i + 1 < rows.length) timers.push(setTimeout(() => runRow(i + 1), ROW_INTERVAL));
  };
  timers.push(setTimeout(() => runRow(0), BOOT_DELAY));

  return () => timers.forEach(clearTimeout);
}
