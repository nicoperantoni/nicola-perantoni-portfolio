/**
 * Genera src/data/hero-routes.json: percorsi reali (strade/sentieri OSM)
 * intorno a Verona per i marker animati della mappa deck.gl nell'hero.
 * Usa il router OSRM pubblico di routing.openstreetmap.de — da lanciare
 * solo quando si vogliono cambiare i percorsi, l'output è versionato.
 *
 *   node scripts/generate-hero-routes.mjs
 */
import { writeFile } from 'node:fs/promises';

// [profilo, [lon, lat] waypoint...] — ogni percorso è un anello chiuso.
const ROUTES = [
  ['foot', [10.9944, 45.4390], [10.9878, 45.4400], [10.9985, 45.4475], [11.0010, 45.4485], [11.0060, 45.4420], [10.9944, 45.4390]],
  ['bike', [11.0130, 45.4380], [11.0270, 45.4660], [11.0050, 45.4590], [10.9985, 45.4475], [11.0130, 45.4380]],
  ['bike', [10.9790, 45.4427], [10.9460, 45.4480], [10.9460, 45.4760], [10.9750, 45.4650], [10.9790, 45.4427]],
  ['foot', [10.9686, 45.4353], [10.9820, 45.4290], [10.9944, 45.4390], [10.9790, 45.4427], [10.9686, 45.4353]],
  ['bike', [11.0130, 45.4380], [11.0420, 45.4280], [11.0600, 45.4580], [11.0270, 45.4660], [11.0130, 45.4380]],
  ['bike', [10.9820, 45.4290], [11.0000, 45.4150], [11.0300, 45.4330], [11.0130, 45.4380], [10.9820, 45.4290]],
  ['foot', [10.9800, 45.4545], [10.9880, 45.4700], [10.9985, 45.4475], [10.9800, 45.4545]],
  ['bike', [10.9460, 45.4480], [10.9300, 45.4300], [10.9686, 45.4353], [10.9790, 45.4427], [10.9460, 45.4480]],
  // Anelli più esterni: riempiono i lati della vista su desktop.
  ['bike', [10.9460, 45.4480], [10.8680, 45.4830], [10.8510, 45.4710], [10.8900, 45.4450], [10.9460, 45.4480]],
  ['bike', [10.9460, 45.4760], [10.8860, 45.5170], [10.9400, 45.5300], [10.9460, 45.4760]],
  ['bike', [11.0270, 45.4660], [11.0400, 45.4830], [11.0170, 45.5180], [10.9980, 45.4900], [11.0270, 45.4660]],
  ['bike', [11.0420, 45.4280], [11.0950, 45.4200], [11.1200, 45.4450], [11.0600, 45.4580], [11.0420, 45.4280]],
  ['bike', [10.9300, 45.4300], [10.8700, 45.4050], [10.8300, 45.4000], [10.8900, 45.4450], [10.9300, 45.4300]],
  ['bike', [11.0000, 45.4150], [10.9670, 45.3870], [11.0300, 45.3950], [11.0300, 45.4330], [11.0000, 45.4150]],
];

const BASE = { foot: 'https://routing.openstreetmap.de/routed-foot', bike: 'https://routing.openstreetmap.de/routed-bike' };

// Douglas–Peucker in gradi (sufficiente a questa scala): ~1e-5 ≈ 1 m.
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1e-12;
    const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}

const out = [];
for (const [profile, ...wps] of ROUTES) {
  const coords = wps.map((p) => p.join(',')).join(';');
  const url = `${BASE[profile]}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code !== 'Ok') throw new Error(`${url} -> ${json.code}`);
  // Anello chiuso (primo = ultimo punto): Douglas–Peucker degenera, quindi
  // si semplificano separatamente le due metà divise al punto più lontano.
  const raw = json.routes[0].geometry.coordinates;
  let far = 0;
  raw.forEach((p, i) => { if (Math.hypot(p[0] - raw[0][0], p[1] - raw[0][1]) > Math.hypot(raw[far][0] - raw[0][0], raw[far][1] - raw[0][1])) far = i; });
  const path = [...simplify(raw.slice(0, far + 1), 0.00003).slice(0, -1), ...simplify(raw.slice(far), 0.00003)].map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  out.push({ profile, distance: Math.round(json.routes[0].distance), path });
  console.log(profile, Math.round(json.routes[0].distance), 'm,', path.length, 'punti');
  await new Promise((r) => setTimeout(r, 1200));
}

await writeFile(new URL('../src/data/hero-routes.json', import.meta.url), JSON.stringify(out));
