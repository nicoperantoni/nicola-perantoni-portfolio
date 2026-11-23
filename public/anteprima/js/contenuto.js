// ---------------------------------------------------------------------
// Contenuto dello scroll: foto con i pannelli di testo in mezzo.
// ---------------------------------------------------------------------
export const PHOTOS = [
  'ph-x-cervelo-4', 'ph-training-camp-12', 'ristora-6', 'ph-x-cervelo-1',
  'ph-training-camp-14', 'ristora-2', 'ph-x-cervelo-3', 'ph-training-camp-9',
  'ristora-4', 'ph-x-cervelo-2', 'ph-training-camp-3', 'ristora-1',
];
// A metà sequenza il Profilo; il Portfolio chiude lo scroll.
const TEXT_AFTER = { 5: 't-profilo', 11: 't-fine' };

// Scroll infinito: la sequenza (foto + testi) è ripetuta COPIES volte di
// fila; la posizione si riporta sempre dentro la copia centrale, così
// scorrendo non si arriva mai a una fine, in nessuna direzione.
const COPIES = 3;

// Riempie il track e restituisce pannelli, immagini e pannelli per copia.
export function buildTrack(track) {
  const imgs = [];
  for (let c = 0; c < COPIES; c++) {
    PHOTOS.forEach((f, i) => {
      const fig = document.createElement('figure');
      fig.className = 'panel photo';
      // Solo la copia centrale è letta dagli screen reader; le altre sono ripetizioni.
      if (c !== 1) fig.setAttribute('aria-hidden', 'true');
      fig.innerHTML = `<img src="img/${f}.webp" alt="${c === 1 ? `Fotografia di Nicola Perantoni, ${i + 1} di ${PHOTOS.length}` : ''}" draggable="false">`;
      track.appendChild(fig);
      imgs.push(fig.firstElementChild);
      if (TEXT_AFTER[i]) {
        const t = document.getElementById(TEXT_AFTER[i]).content.firstElementChild.cloneNode(true);
        if (c !== 1) { t.setAttribute('aria-hidden', 'true'); t.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1')); }
        track.appendChild(t);
      }
    });
  }
  const panels = [...track.children];
  return { panels, imgs, perCopy: panels.length / COPIES };
}

// Titoli delle sezioni a tutta larghezza del pannello: si misura la parola
// a 100px e si imposta la grandezza come frazione della larghezza (cqi).
export function fitTitles(track) {
  track.querySelectorAll('.panel.text h2').forEach((h) => {
    h.style.fontSize = '100px';
    const r = document.createRange(); r.selectNodeContents(h);
    const ratio = r.getBoundingClientRect().width / 100;
    h.style.fontSize = `calc(100cqi / ${ratio.toFixed(4)})`;
  });
}

// Recapiti ricomposti lato client (stesso schema del sito attuale).
export function fillContacts(root) {
  const email = 'inotnarep.alocin'.split('').reverse().join('') + '@' + 'moc.liamg'.split('').reverse().join('');
  const ph = '4562717643 93'.replace(/\s/g, '').split('').reverse().join('');
  root.querySelectorAll('[data-email]').forEach((e) => { e.href = 'mailto:' + email; e.textContent = email; });
  root.querySelectorAll('[data-wa]').forEach((w) => {
    w.href = 'https://wa.me/' + ph;
    w.textContent = `+${ph.slice(0, 2)} ${ph.slice(2, 5)} ${ph.slice(5, 8)} ${ph.slice(8)} ↗`;
  });
}
