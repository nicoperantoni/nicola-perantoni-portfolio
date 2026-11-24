// Tasto "Menu" in alto a sinistra: apre un menu a tutto schermo con le
// voci (link alle altre pagine); il tasto resta visibile e diventa "Chiudi".
// Scegliendo una voce: la voce va al centro dello schermo, le altre escono a
// sinistra, i recapiti a destra; poi si apre la pagina, che parte dal loader
// con la stessa parola (lib/loader.ts).
import { gsap } from 'gsap';
import { reduced } from './env';
import { TRANSITION_KEY } from './loader';

export function initMenu() {
  const btn = document.getElementById('menu-btn') as HTMLButtonElement;
  const label = document.getElementById('menu-label')!;
  const menu = document.getElementById('menu')!;
  const items = [...menu.querySelectorAll<HTMLAnchorElement>('.menu-list a')];
  const rows = [...menu.querySelectorAll<HTMLElement>('.menu-list li')];
  const aside = menu.querySelector<HTMLElement>('.menu-aside')!;
  const [lineA, lineB] = btn.querySelectorAll('.menu-icon i');
  let open = false;
  let leaving = false;
  let tl: gsap.core.Timeline | null = null;

  // A menu aperto la pagina sotto non scorre: blocco dello scroll, con lo
  // spazio della barra di scorrimento compensato (niente salto laterale). Il
  // tasto, che fa parte della testata, viene fissato al suo posto in alto a
  // sinistra (dove sta a pagina non scorsa), così "Chiudi" è sempre visibile
  // anche se la pagina era scorsa in giù.
  const html = document.documentElement;
  const topbar = btn.parentElement!;
  const lockPage = () => {
    const r = btn.getBoundingClientRect();
    html.style.setProperty('--scrollbar', `${window.innerWidth - html.clientWidth}px`);
    topbar.style.height = `${topbar.offsetHeight}px`;
    Object.assign(btn.style, { position: 'fixed', top: `${r.top + window.scrollY}px`, left: `${r.left + window.scrollX}px` });
    html.classList.add('scroll-locked');
  };
  const unlockPage = () => {
    html.classList.remove('scroll-locked');
    html.style.removeProperty('--scrollbar');
    topbar.style.height = '';
    Object.assign(btn.style, { position: '', top: '', left: '' });
  };

  const setOpen = (value: boolean) => {
    if (value === open || leaving) return;
    open = value;
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = (open ? btn.dataset.close : btn.dataset.open) ?? '';
    document.body.classList.toggle('menu-open', open);
    tl?.kill();
    const d = reduced ? 0 : 1;
    if (open) {
      lockPage();
      menu.hidden = false;
      prefetch();
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
        .timeline({ onComplete: () => { menu.hidden = true; unlockPage(); } })
        .to([lineA, lineB], { y: 0, rotate: 0, duration: 0.35 * d, ease: 'power3.inOut' }, 0)
        .to(items, { yPercent: -105, duration: 0.45 * d, ease: 'expo.in', stagger: 0.03 * d }, 0)
        .to(aside, { autoAlpha: 0, duration: 0.25 * d }, 0)
        .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.6 * d, ease: 'expo.inOut' }, 0.2 * d);
      btn.focus({ preventScroll: true });
    }
  };

  // Uscita verso un'altra pagina.
  const leave = (link: HTMLAnchorElement) => {
    leaving = true;
    tl?.kill();
    // Altezza (centro della riga) da cui la parola ripartirà nella pagina
    // nuova: la voce resta alla sua altezza e da lì sale direttamente al titolo.
    const box = link.getBoundingClientRect();
    const y = box.top + box.height / 2;
    try {
      sessionStorage.setItem(TRANSITION_KEY, JSON.stringify({ label: link.textContent?.trim() ?? '', y, ts: Date.now() }));
    } catch { /* senza sessione la pagina si apre senza transizione */ }
    const go = () => { window.location.href = link.href; };
    if (reduced) { go(); return; }

    // La voce scorre in orizzontale fino al centro, sulla sua riga, mentre
    // le altre escono a sinistra e i recapiti a destra: non passa mai sopra
    // alle altre voci. Poi si apre la pagina nuova (già scaricata, vedi
    // prefetch), dove la parola sale dritta al posto del titolo.
    const range = document.createRange();
    range.selectNodeContents(link);
    const word = range.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (word.left + word.width / 2);
    rows.forEach((li) => { li.style.overflow = 'visible'; });
    const others = items.filter((a) => a !== link);

    gsap
      .timeline({ onComplete: go })
      .to(btn, { autoAlpha: 0, duration: 0.25, ease: 'power2.out' }, 0)
      .to(others, { x: () => -window.innerWidth, duration: 0.48, ease: 'power3.in', stagger: 0.035 }, 0)
      .to(aside, { x: () => window.innerWidth, duration: 0.48, ease: 'power3.in' }, 0)
      .to(link, { x: dx, color: getComputedStyle(document.body).color, duration: 0.46, ease: 'power3.inOut' }, 0);
  };

  // Aprendo il menu si scaricano in anticipo le altre pagine, così dopo il
  // clic il loader della pagina nuova parte senza attese.
  let prefetched = false;
  const prefetch = () => {
    if (prefetched) return;
    prefetched = true;
    items.forEach((a) => {
      if (a.getAttribute('aria-current') === 'page') return;
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = a.href;
      document.head.appendChild(l);
    });
  };

  btn.addEventListener('click', () => setOpen(!open));
  items.forEach((a) => a.addEventListener('click', (ev) => {
    // Lasciamo al browser i clic con tasti modificatori (nuova scheda ecc.).
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
    ev.preventDefault();
    if (leaving) return;
    if (a.getAttribute('aria-current') === 'page') { setOpen(false); return; }
    leave(a);
  }));
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && open) setOpen(false);
  });

  // Tornando indietro col browser la pagina può riapparire com'era a metà
  // uscita (cache del browser): si rimette il menu chiuso e in ordine.
  window.addEventListener('pageshow', (ev) => {
    if (!ev.persisted || !leaving) return;
    leaving = false;
    open = false;
    tl?.kill();
    gsap.set([...items, aside, btn, lineA, lineB], { clearProps: 'all' });
    rows.forEach((li) => { li.style.overflow = ''; });
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    label.textContent = btn.dataset.open ?? '';
    document.body.classList.remove('menu-open');
    unlockPage();
  });
}
