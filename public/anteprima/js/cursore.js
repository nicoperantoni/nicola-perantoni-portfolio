// Cursore personalizzato "← Scorri →" (nascosto sui pannelli di testo,
// dove si seleziona, e sulla scheda Portfolio, dove si clicca). Solo con mouse e senza riduzione del movimento.
import { reduced, fine } from './env.js';

export function initCursor(stage, cursor) {
  if (!fine || reduced) return;
  stage.classList.add('fine');
  const qx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const qy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  stage.addEventListener('pointermove', (ev) => {
    qx(ev.clientX); qy(ev.clientY);
    const onText = !!ev.target.closest('.panel.text, .panel.cta');
    stage.style.cursor = onText ? 'auto' : '';
    gsap.to(cursor, { opacity: onText ? 0 : 1, duration: 0.2, overwrite: 'auto' });
  });
  stage.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.25 }));
}
