import type { ImageMetadata } from 'astro';
import { useTranslations } from '../i18n/utils';
import type { Locale } from '../i18n/ui';

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
  { label: 'PH Apparel × Cérvelo', files: [4].map((n) => `ph-x-cervelo-${n}.webp`) },
  { label: 'Ristora', files: [6].map((n) => `ristora-${n}.webp`) },
  { label: 'PH Apparel Spring Camp', files: [8, 13].map((n) => `ph-training-camp-${n}.webp`) },
  { label: 'Zullo Bike', files: [6].map((n) => `zullo-${n}.webp`) },
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
 * Interlaccia le foto dei progetti (una per progetto, a giro) e poi
 * inserisce le note manifesto a posizioni fisse, con il vincolo che l'ultima
 * nota non chiuda il flusso (resta almeno una foto sotto). Algoritmo fedele
 * al prototipo (buildFlow) — vedi README "Work — flusso fotografico".
 */
export function buildFlow(lang: Locale): FlowItem[] {
  const t = useTranslations(lang);
  const flow: FlowItem[] = [];
  const maxLen = Math.max(...projectGroups.map((g) => g.files.length));
  for (let r = 0; r < maxLen; r++) {
    for (const g of projectGroups) {
      const file = g.files[r];
      if (!file) continue;
      flow.push({
        kind: 'image',
        image: photo(file),
        alt: `${t.work.altPrefix} — ${g.label}`,
      });
    }
  }

  const positions = [1, 7, 13];
  positions.forEach((at, i) => {
    const index = Math.min(at + i, flow.length - 1);
    flow.splice(index, 0, { kind: 'text', body: t.work.manifesto[i] });
  });

  return flow;
}
