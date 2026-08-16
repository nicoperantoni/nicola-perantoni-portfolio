import type { ImageMetadata } from 'astro';

const photoModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/*.webp',
  { eager: true }
);

function photo(filename: string): ImageMetadata {
  const mod = photoModules[`/src/assets/photos/${filename}`];
  if (!mod) throw new Error(`Foto mancante in src/assets/photos: ${filename}`);
  return mod.default;
}

interface ProjectGroup {
  label: string;
  files: string[];
}

// Ordine e numerazione dei file per progetto — vedi README "Assets".
const projectGroups: ProjectGroup[] = [
  { label: 'PH Apparel × Cérvelo', files: [1, 2, 3, 4].map((n) => `ph-x-cervelo-${n}.webp`) },
  { label: 'Zullo Bike', files: [1, 6, 3, 4].map((n) => `zullo-${n}.webp`) },
  { label: 'Ristora', files: [1, 2, 6, 4].map((n) => `ristora-${n}.webp`) },
  { label: 'PH Apparel Spring Camp', files: [3, 9, 8, 12].map((n) => `ph-training-camp-${n}.webp`) },
];

// Note manifesto, copy definitivo — vedi README "Content".
const manifestoNotes: string[] = [
  'Amo il movimento, l’adrenalina, la tranquillità e il silenzio che anticipano la performance, il sogno del record personale, la forza, la mentalità e la grinta necessarie per raggiungere il proprio obiettivo. Qualsiasi esso sia.',
  'Mi nutro di tutto ciò che può stimolare la mia creatività: arte, musica, libri, cinema e design.',
  'Cerco il silenzio, la natura, il tempo passato con il proprio sé.',
  'Coltivo la contaminazione tra persone, discipline e arti.',
  'La fotografia è la mia cura.',
];

export const services: { n: string; title: string }[] = [
  { n: '01', title: 'Gare ed Eventi' },
  { n: '02', title: 'Training Camp' },
  { n: '03', title: 'Campagne ed editoriali' },
  { n: '04', title: 'Ritratti' },
  { n: '05', title: 'Video' },
];

export interface FlowImage {
  kind: 'image';
  image: ImageMetadata;
  alt: string;
}

export interface FlowText {
  kind: 'text';
  body: string;
}

export type FlowItem = FlowImage | FlowText;

/**
 * Interlaccia le foto dei quattro progetti (una per progetto, a giro) e poi
 * inserisce le note manifesto a posizioni fisse, con il vincolo che l'ultima
 * nota non chiuda il flusso (resta almeno una foto sotto). Algoritmo fedele
 * al prototipo (buildFlow) — vedi README "Work — flusso fotografico".
 */
export function buildFlow(): FlowItem[] {
  const flow: FlowItem[] = [];
  const maxLen = Math.max(...projectGroups.map((g) => g.files.length));
  for (let r = 0; r < maxLen; r++) {
    for (const g of projectGroups) {
      const file = g.files[r];
      if (!file) continue;
      flow.push({
        kind: 'image',
        image: photo(file),
        alt: `Fotografia sportiva di Nicola Perantoni — ${g.label}`,
      });
    }
  }

  const imgs = flow.length;
  const positions = [3, 7, 11, 13, Math.max(14, imgs - 2)];
  positions.forEach((at, i) => {
    const index = Math.min(at + i, flow.length - 1);
    flow.splice(index, 0, { kind: 'text', body: manifestoNotes[i] });
  });

  return flow;
}
