// Genera favicon.ico e apple-touch-icon.png da public/favicon.svg.
// Uso: node scripts/generate-icons.mjs (richiede sharp + png-to-ico, devDependencies)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const svgPath = path.join(root, 'public/favicon.svg');
const svg = await readFile(svgPath);

const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(
  icoSizes.map((size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer())
);
const icoBuffer = await pngToIco(icoBuffers);
await writeFile(path.join(root, 'public/favicon.ico'), icoBuffer);
console.log('✓ public/favicon.ico');

await sharp(svg, { density: 384 })
  .resize(180, 180)
  .flatten({ background: '#000000' })
  .png()
  .toFile(path.join(root, 'public/apple-touch-icon.png'));
console.log('✓ public/apple-touch-icon.png');
