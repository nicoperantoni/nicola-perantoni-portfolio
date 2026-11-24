// Pagine interne (Servizi, Manifesto, Contatti): titolo fermo a tutta larghezza,
// righe che compaiono scorrendo, stesso menu della home.
import { reduced } from './env.js';
import { initMenu } from './menu.js';
import { fillContacts, fitWidth } from './contenuto.js';
import { initServicePreview } from './anteprima-foto.js';

const headline = document.getElementById('headline');
const points = [...document.querySelectorAll('.rows > li')];

initMenu();
fillContacts(document);
const svcList = document.querySelector('.svc-list');
if (svcList) initServicePreview(svcList, document.querySelector('.svc-preview'));

document.fonts.ready.then(() => {
  fitWidth(headline);
  document.body.classList.add('is-ready');
  if (reduced) return;

  // I punti compaiono quando entrano nello schermo: la riga si allunga e
  // il testo sale.
  gsap.set(points, { '--line': 0 });
  gsap.set(points.map((li) => li.children), { yPercent: 30, autoAlpha: 0 });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    gsap.timeline()
      .to(e.target, { '--line': 1, duration: 1, ease: 'expo.inOut' }, 0)
      .to(e.target.children, { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.25);
  }), { threshold: 0.25 });
  points.forEach((li) => io.observe(li));
});
