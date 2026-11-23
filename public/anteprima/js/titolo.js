// Ogni tanto una o due lettere del titolo scorrono verso l'alto: la
// lettera esce in alto e una sua copia rientra dal basso, con ease-in-out.
// La lettera animata sta in una casella larga quanto l'originale e
// ritagliata in verticale, così il resto del titolo non si sposta.
import { reduced } from './env.js';

export function idleRoll(headline, title) {
  if (reduced) return;
  headline.setAttribute('aria-label', title);
  const ctx = document.createElement('canvas').getContext('2d');
  const cs = getComputedStyle(headline);
  ctx.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
  const adv = (c) => (ctx.measureText(c).width / 100 - 0.035).toFixed(4);
  const slots = [...title].map((c, i) => (c === ' ' ? -1 : i)).filter((i) => i >= 0);
  const tick = () => {
    const picks = gsap.utils.shuffle([...slots]).slice(0, Math.random() < 0.6 ? 1 : 2).sort((a, b) => a - b);
    headline.innerHTML = [...title].map((c, i) => (picks.includes(i)
      ? `<span class="roll" style="width:${adv(c)}em"><span class="roll-in">${c}<span aria-hidden="true">${c}</span></span></span>`
      : c)).join('');
    // Ritaglio stretto sull'altezza della singola lettera (dalla sua cima
    // alla linea di base), non su tutta la riga: così la lettera
    // sparisce davvero appena supera il bordo del titolo.
    const fs = parseFloat(getComputedStyle(headline).fontSize);
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0';
    headline.appendChild(probe);
    const base = probe.getBoundingClientRect().top;
    probe.remove();
    const pad = fs * 0.03;
    headline.querySelectorAll('.roll').forEach((r) => {
      const b = r.getBoundingClientRect();
      const asc = (ctx.measureText(r.textContent[0]).actualBoundingBoxAscent / 100) * fs;
      r.style.clipPath = `inset(${base - asc - pad - b.top}px -0.3em ${b.bottom - base - pad}px)`;
    });
    gsap.to(headline.querySelectorAll('.roll-in'), {
      yPercent: -100, duration: 0.8, ease: 'power3.inOut', stagger: 0.09,
      onComplete: () => { headline.textContent = title; gsap.delayedCall(gsap.utils.random(2.5, 6), tick); },
    });
  };
  gsap.delayedCall(2.5, tick);
}
