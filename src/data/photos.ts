import type { ImageMetadata } from 'astro';

// Tutte le foto in src/assets/photos, per nome file (senza estensione):
// Astro ne genera le varianti AVIF/WebP alle varie larghezze in fase di build.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.webp', { eager: true });
const byName = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.split('/').pop()!.replace(/\.webp$/, ''), mod.default]),
);

export function photo(name: string): ImageMetadata {
  const img = byName[name];
  if (!img) throw new Error(`Foto mancante in src/assets/photos: ${name}.webp`);
  return img;
}

// Sequenza dello scroll in home: gare (DSC/PRN) alternate a shooting e
// dettagli (PH, studio).
export const HOME_PHOTOS = [
  'DSC08227', 'PRN04059', '260304-PH-Divise_PHCC-34', 'DSC00026', 'ph-x-cervelo-4',
  'PRN04158', 'DSC02021', 'DSC00553', '260304-PH-Divise_PHCC-35', 'PRN04242',
  'DSC08237', 'DSC00422', 'ph-training-camp-3', 'PRN04091', 'PRN09662',
];

// Schede nello scroll oltre alle foto: il Profilo apre ogni copia della
// sequenza (vedi views/Home.astro), Portfolio viene dopo la quarta foto.
export const PORTFOLIO_AFTER = 3;

// Scroll infinito: la sequenza (foto + testi) è ripetuta COPIES volte di
// fila; la posizione si riporta sempre dentro la copia centrale.
export const COPIES = 3;

// Larghezze generate e larghezza a schermo delle foto dello scroll. La foto
// è larga il 140% della scheda (spazio per la parallasse) e la scheda è 2:3
// alta quasi quanto lo schermo: ~65vh su desktop, ~170vw su telefono.
export const TRACK_WIDTHS = [480, 720, 960, 1280, 1600];
export const TRACK_SIZES = '(max-width: 900px) 170vw, 65vh';
