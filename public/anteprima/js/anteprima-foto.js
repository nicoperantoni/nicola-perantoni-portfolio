// Servizi: passando col mouse su un servizio compare la sua foto, che segue
// il puntatore con un leggero ritardo e si inclina secondo la velocità del
// movimento. Cambiando servizio la nuova foto si scopre dal basso sopra la
// precedente. Solo con mouse; sui dispositivi touch la foto è nella riga.
import { reduced } from './env.js';

export function initServicePreview(list, box) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const rows = [...list.querySelectorAll('.svc')];
  const imgs = rows.map((r) => {
    const im = document.createElement('img');
    im.src = r.dataset.img; im.alt = ''; im.decoding = 'async';
    box.appendChild(im);
    return im;
  });

  const k = reduced ? 0 : 1;
  // La foto sta a destra del puntatore, così non copre il nome del servizio.
  gsap.set(box, { xPercent: 12, yPercent: -50, scale: 0.6, autoAlpha: 0, transformOrigin: '0% 50%' });
  const qx = gsap.quickTo(box, 'x', { duration: 0.6 * k, ease: 'power3' });
  const qy = gsap.quickTo(box, 'y', { duration: 0.6 * k, ease: 'power3' });
  const qr = gsap.quickTo(box, 'rotation', { duration: 0.5 * k, ease: 'power3' });

  // Inclinazione proporzionale alla velocità orizzontale, che si smorza da sola.
  let px = 0, py = 0, vel = 0;
  window.addEventListener('pointermove', (ev) => {
    vel += ev.clientX - px;
    px = ev.clientX; py = ev.clientY;
    qx(px); qy(py);
  });
  if (!reduced) gsap.ticker.add(() => { vel *= 0.85; qr(gsap.utils.clamp(-10, 10, vel * 0.4)); });

  let active = -1, z = 1;
  const show = (i) => {
    if (i === active) return;
    if (active < 0) {
      gsap.set(box, { x: px, y: py });
      gsap.to(box, { autoAlpha: 1, scale: 1, duration: 0.5 * k, ease: 'expo.out', overwrite: 'auto' });
    }
    active = i;
    gsap.set(imgs[i], { zIndex: ++z });
    gsap.fromTo(imgs[i], { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.7 * k, ease: 'expo.out', overwrite: 'auto' });
  };
  const hide = () => {
    active = -1;
    gsap.to(box, { autoAlpha: 0, scale: 0.6, duration: 0.4 * k, ease: 'expo.in', overwrite: 'auto' });
  };
  rows.forEach((r, i) => r.addEventListener('pointerenter', () => show(i)));
  list.addEventListener('pointerleave', hide);
}
