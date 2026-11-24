// Scheda Portfolio: col mouse sopra la scritta "Portfolio" cade e si ferma sul
// fondo della scheda; al centro il pulsante per scaricare il PDF compare piccolo e si
// ingrandisce; uscendo il pulsante si rimpicciolisce e la scritta torna al
// centro. Su touch il primo tocco apre la scheda; con la tastiera basta
// arrivare sul pulsante.
import { reduced } from './env.js';

export function initPortfolioCards(track) {
  const k = reduced ? 0 : 1;
  track.querySelectorAll('.panel.cta').forEach((card) => {
    const title = card.querySelector('.cta-title');
    const btn = card.querySelector('.cta-btn');
    let open = false;
    let tl = null;
    // Spostamento che porta la scritta dal centro al fondo della scheda,
    // lasciando sotto lo stesso margine che ha ai lati.
    const restY = () => {
      const inner = title.parentElement;
      const pad = parseFloat(getComputedStyle(inner).paddingLeft);
      return inner.clientHeight / 2 - title.offsetHeight / 2 - pad;
    };

    const show = () => {
      if (open) return;
      open = true;
      tl?.kill();
      tl = gsap.timeline()
        // La scritta cade lentamente e si ferma sul fondo della scheda con un
        // piccolo rimbalzo, a filo del margine laterale.
        .to(title, { y: restY, duration: 1.3 * k, ease: 'bounce.out' }, 0)
        .to(title, { keyframes: [{ rotation: 5, duration: 0.45 * k }, { rotation: 0, duration: 0.85 * k, ease: 'power2.out' }] }, 0)
        // Il pulsante nasce piccolo e si ingrandisce con un leggero rimbalzo.
        .fromTo(btn, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.7 * k, ease: 'back.out(1.8)' }, 0.3 * k);
    };
    const hide = () => {
      if (!open) return;
      open = false;
      tl?.kill();
      tl = gsap.timeline()
        .to(btn, { scale: 0.3, autoAlpha: 0, duration: 0.3 * k, ease: 'power2.in' }, 0)
        // La scritta risale dal fondo al centro.
        .to(title, { y: 0, rotation: 0, duration: 0.8 * k, ease: 'expo.out' }, 0.1 * k);
    };

    card.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') show(); });
    card.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') hide(); });
    // Touch: il primo tocco apre la scheda (il pulsante diventa cliccabile).
    card.addEventListener('click', (ev) => {
      if (!open) { ev.preventDefault(); show(); }
    });
    btn.addEventListener('focus', show);
    btn.addEventListener('blur', () => { if (!card.matches(':hover')) hide(); });
  });
}
