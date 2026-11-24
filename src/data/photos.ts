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

// Sequenza della scala in Home: gare (DSC/PRN) alternate a shooting e
// dettagli (PH, studio).
export const HOME_PHOTOS = [
  'DSC08227', 'PRN04059', '260304-PH-Divise_PHCC-34', 'DSC00026', 'ph-x-cervelo-4',
  'PRN04158', 'DSC02021', 'DSC00553', '260304-PH-Divise_PHCC-35', 'PRN04242',
  'DSC08237', 'DSC00422', 'ph-training-camp-3', 'PRN04091', 'PRN09662',
];

// Larghezze generate e larghezza a schermo delle foto della scala. Le foto
// sono disegnate alla grandezza più grande che raggiungono (ben oltre la
// metà dello schermo a destra) e ridimensionate: servono sorgenti larghe.
export const SCALE_WIDTHS = [540, 720, 960, 1280, 1600];
export const SCALE_SIZES = '(max-width: 700px) 120vw, 70vw';
