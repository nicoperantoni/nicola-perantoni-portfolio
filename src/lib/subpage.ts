// Pagine interne (Servizi, Manifesto, Contatti): titolo fermo a tutta
// larghezza, righe che compaiono scorrendo, stesso menu della home.
// Arrivando dal menu la pagina parte dal loader (lib/loader.ts).
import { gsap } from 'gsap';
import { reduced } from './env';
import { initMenu } from './menu';
import { fillContacts } from './contacts';
import { fitWidth, fontsFor } from './fit';
import { initServicePreview } from './service-preview';
import { initLoader, isLoading } from './loader';

const headline = document.getElementById('headline')!;
const points = [...document.querySelectorAll<HTMLElement>('.rows > li')];

initMenu();
fillContacts();
const svcList = document.querySelector<HTMLElement>('.svc-list');
const svcBox = document.querySelector<HTMLElement>('.svc-preview');
if (svcList && svcBox) initServicePreview(svcList, svcBox);

const ready = fontsFor([headline]).then(() => {
  fitWidth(headline);
  document.body.classList.add('is-ready');
});

if (isLoading()) initLoader({ waitFor: [ready], reveal: revealRows });
else ready.then(revealRows);

function revealRows() {
  if (reduced) return;

  // I punti compaiono quando entrano nello schermo: la riga si allunga e
  // il testo sale.
  gsap.set(points, { '--line': 0 });
  gsap.set(points.map((li) => [...li.children]), { yPercent: 30, autoAlpha: 0 });
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        gsap
          .timeline()
          .to(e.target, { '--line': 1, duration: 1, ease: 'expo.inOut' }, 0)
          .to(e.target.children, { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.25);
      }),
    { threshold: 0.25 },
  );
  points.forEach((li) => io.observe(li));
}
