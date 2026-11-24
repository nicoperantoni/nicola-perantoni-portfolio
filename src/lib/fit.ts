// Titoli a tutta larghezza del loro contenitore (container-type: inline-size):
// si misura la parola a 100px e si imposta la grandezza come frazione della
// larghezza (cqi), così il titolo riempie la riga a ogni dimensione.
export function fitWidth(h: HTMLElement) {
  h.style.fontSize = '100px';
  const r = document.createRange();
  r.selectNodeContents(h);
  h.style.fontSize = `calc(100cqi / ${(r.getBoundingClientRect().width / 100).toFixed(4)})`;
}

// Attende il font effettivo degli elementi: document.fonts.ready da solo può
// risolversi prima che il browser abbia iniziato a scaricarlo.
export async function fontsFor(els: Iterable<Element>): Promise<void> {
  const specs = new Set<string>();
  for (const el of els) {
    const s = getComputedStyle(el);
    specs.add(`${s.fontWeight} 100px ${s.fontFamily}`);
  }
  await Promise.all([...specs].map((s) => document.fonts.load(s).catch(() => null)));
  await document.fonts.ready;
}
