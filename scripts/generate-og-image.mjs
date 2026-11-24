// Genera public/og-image.jpg (1200x630) per le preview social — le foto
// sorgente sono in WebP, qui serve un JPG orizzontale dedicato.
// Uso: node scripts/generate-og-image.mjs
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourcePhoto = path.join(root, 'src/assets/photos/PRN09662.webp');
const outPath = path.join(root, 'public/og-image.jpg');

const WIDTH = 1200;
const HEIGHT = 630;

const overlaySvg = Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0" />
      <stop offset="40%" stop-color="#000000" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.92" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)" />
  <text x="64" y="${HEIGHT - 168}" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="3"
    fill="rgba(255,255,255,0.75)">FOTOGRAFIA DI NICOLA PERANTONI — VERONA</text>
  <text x="60" y="${HEIGHT - 70}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="84"
    letter-spacing="-2" fill="#ffffff">Studio Devastante</text>
</svg>
`);

await sharp(sourcePhoto)
  .resize(WIDTH, HEIGHT, { fit: 'cover', position: sharp.strategy.attention })
  .composite([{ input: overlaySvg, top: 0, left: 0 }])
  .flatten({ background: '#000000' })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(outPath);

console.log('✓ public/og-image.jpg');
