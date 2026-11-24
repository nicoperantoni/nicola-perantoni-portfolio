// Tasto "Menu" in alto a sinistra: apre un menu a tutto schermo con le
// voci (link alle altre pagine); il tasto resta visibile e diventa "Chiudi".
import { gsap } from 'gsap';
import { reduced } from './env';

export function initMenu() {
  const btn = document.getElementById('menu-btn') as HTMLButtonElement;
  const label = document.getElementById('menu-label')!;
  const menu = document.getElementById('menu')!;
  const items = [...menu.querySelectorAll<HTMLElement>('.menu-list a')];
  const aside = menu.querySelector('.menu-aside')!;
  const [lineA, lineB] = btn.querySelectorAll('.menu-icon i');
  let open = false;
  let tl: gsap.core.Timeline | null = null;

  const setOpen = (value: boolean) => {
    if (value === open) return;
    open = value;
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = (open ? btn.dataset.close : btn.dataset.open) ?? '';
    document.body.classList.toggle('menu-open', open);
    tl?.kill();
    const d = reduced ? 0 : 1;
    if (open) {
      menu.hidden = false;
      tl = gsap
        .timeline()
        // Le due linee dell'icona si incrociano in una X.
        .to(lineA, { y: 5, rotate: 45, duration: 0.35 * d, ease: 'power3.inOut' }, 0)
        .to(lineB, { y: -5, rotate: -45, duration: 0.35 * d, ease: 'power3.inOut' }, 0)
        // Il fondo scende dall'alto, poi le voci salgono una dopo l'altra.
        .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7 * d, ease: 'expo.inOut' }, 0)
        .fromTo(items, { yPercent: 105 }, { yPercent: 0, duration: 0.8 * d, ease: 'expo.out', stagger: 0.06 * d }, 0.35 * d)
        .fromTo(aside, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 * d }, 0.6 * d);
      items[0]?.focus({ preventScroll: true });
    } else {
      tl = gsap
        .timeline({ onComplete: () => { menu.hidden = true; } })
        .to([lineA, lineB], { y: 0, rotate: 0, duration: 0.35 * d, ease: 'power3.inOut' }, 0)
        .to(items, { yPercent: -105, duration: 0.45 * d, ease: 'expo.in', stagger: 0.03 * d }, 0)
        .to(aside, { autoAlpha: 0, duration: 0.25 * d }, 0)
        .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.6 * d, ease: 'expo.inOut' }, 0.2 * d);
      btn.focus({ preventScroll: true });
    }
  };

  btn.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && open) setOpen(false);
  });
}
