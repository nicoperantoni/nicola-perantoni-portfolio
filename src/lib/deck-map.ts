/**
 * Mappa reale animata per l'hero — alternativa a topo-map.ts basata su
 * deck.gl. Disegna:
 *  - la cartografia vera di Verona (strade e acqua da tile vettoriali
 *    OpenFreeMap/OpenMapTiles, nessuna API key) in monocromia,
 *  - marker che percorrono anelli reali (corsa e bici) generati da
 *    scripts/generate-hero-routes.mjs, con scia sfumata,
 *  - su un <canvas> 2D sovrapposto: coordinate GPS reali del marker o
 *    attività, e linee di collegamento fra marker (stessa grammatica
 *    visiva di topo-map.ts).
 *
 * Il modulo è pensato per essere caricato con import() dinamico: deck.gl
 * pesa, e non deve rallentare il primo render della pagina.
 *
 * Rispetta prefers-reduced-motion: un solo frame, marker fermi, niente
 * etichette né collegamenti. Si ferma quando l'hero esce dallo schermo.
 */

import { Deck, WebMercatorViewport } from '@deck.gl/core';
import { LineLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { MVTLayer } from '@deck.gl/geo-layers';
import routesData from '../data/hero-routes.json';

export interface DeckMapOptions {
  accent?: string;
  markers?: number;
  lineColor?: string;
  labelColor?: string;
  /** Elementi (titolo, testo) che le etichette non devono mai coprire. */
  avoid?: HTMLElement[];
  /** Chiamata una volta, quando le tile visibili sono caricate. */
  onReady?: () => void;
}

export interface DeckMapController {
  destroy(): void;
}

type LonLat = [number, number];
type RGBA = [number, number, number, number];

interface Route {
  profile: 'foot' | 'bike';
  path: LonLat[];
  cum: number[]; // distanza cumulativa in metri per vertice
  length: number;
}

interface ScrambleState {
  txt: string;
  phase: 'wait' | 'in' | 'hold' | 'out';
  at: number;
}

interface Mark {
  route: Route;
  d: number; // metri percorsi sull'anello
  pxSpeed: number; // velocità a schermo, px/s
  r: number;
  lonLat?: LonLat;
  pos?: [number, number];
  gps?: ScrambleState;
  act?: ScrambleState | null;
}

interface Link {
  a: Mark;
  b: Mark;
  at: number;
  end?: number;
}

const TILEJSON = 'https://tiles.openfreemap.org/planet';
const CENTER: LonLat = [10.985, 45.452];
const VIEW_WIDTH_M = 26000;
const MIN_ZOOM = 11.8;
const MAX_ZOOM = 13.6;
// Inclinazione della vista in gradi: la mappa si allontana verso l'alto,
// in prospettiva. Oltre ~50° le tile lontane diventano tante e illeggibili.
const PITCH = 45;
const EARTH_CIRC = 40075016.686;
const TILE_PX = 512;
const TRAIL_PX = 150;
const TRAIL_STEPS = 28;

const ACTIVITIES = [
  'THRESHOLD EFFORT', 'HILL REPEATS', 'ZONE 4', 'NEGATIVE SPLIT', 'LONG RIDE',
  'RECOVERY SPIN', 'COOLING DOWN', 'OFF SEASON', 'RUNNING', 'CLIMBING',
  'DESCENDING', 'TRACK SESSION', 'TIME TRIAL',
  'TRAIL SESSION', 'TEAM CAMP',
];

const SCRAMBLE_CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const GPS_CH = '0123456789°\'"NSEW';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function haversine(a: LonLat, b: LonLat): number {
  const R = 6371008.8;
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLon = (b[0] - a[0]) * toRad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function buildRoutes(): Route[] {
  return (routesData as unknown as { profile: 'foot' | 'bike'; path: LonLat[] }[]).map((r) => {
    const cum = [0];
    for (let i = 1; i < r.path.length; i++) cum.push(cum[i - 1] + haversine(r.path[i - 1], r.path[i]));
    return { profile: r.profile, path: r.path, cum, length: cum[cum.length - 1] };
  });
}

/** Punto sull'anello a distanza d (metri, già ridotta modulo lunghezza). */
function pointAt(route: Route, d: number): LonLat {
  const { path, cum } = route;
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const k = (d - cum[lo]) / seg;
  return [path[lo][0] + (path[hi][0] - path[lo][0]) * k, path[lo][1] + (path[hi][1] - path[lo][1]) * k];
}

function wrapD(route: Route, d: number): number {
  return ((d % route.length) + route.length) % route.length;
}

function toDms(v: number, pos: string, neg: string): string {
  const a = Math.abs(v);
  const deg = Math.floor(a);
  const minF = (a - deg) * 60;
  const min = Math.floor(minF);
  const sec = Math.floor((minF - min) * 60);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(deg)}°${pad(min)}'${pad(sec)}"${v >= 0 ? pos : neg}`;
}

export function createDeckMap(
  container: HTMLElement,
  labelCanvas: HTMLCanvasElement,
  initial: DeckMapOptions = {}
): DeckMapController {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const accent = initial.accent ?? '#c8b892';
  const lineColor = initial.lineColor ?? '#ffffff';
  const labelColor = initial.labelColor ?? accent;
  const accentRgb = hexToRgb(accent);
  const lineRgb = hexToRgb(lineColor);
  const lineA = (a: number): RGBA => [lineRgb[0], lineRgb[1], lineRgb[2], Math.round(a * 255)];

  const routes = buildRoutes();

  const N = Math.max(0, Math.round(initial.markers ?? 10));
  const marks: Mark[] = Array.from({ length: N }, (_, i) => {
    const route = routes[i % routes.length];
    const occ = Math.floor(i / routes.length);
    const perRoute = Math.ceil((N - (i % routes.length)) / routes.length);
    return {
      route,
      d: route.length * ((occ + 0.37 * (i % 3)) / perRoute),
      pxSpeed: route.profile === 'bike' ? 26 : 17,
      r: 4 + (i % 2) * 0.5,
    };
  });

  let links: Link[] = [];
  let nextLink = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let destroyed = false;
  let ready = false;
  let metersPerPixel = 10;

  // Vista fissa sul centro storico: lo zoom mostra ~VIEW_WIDTH_M metri in
  // larghezza, così i giri esterni riempiono i lati su desktop. Su schermi
  // stretti lo zoom minimo taglia i giri esterni ma lascia leggibile la città.
  function fitView() {
    const w = container.clientWidth || 1;
    const mPerPx = VIEW_WIDTH_M / w;
    const zoom = Math.log2((EARTH_CIRC * Math.cos((CENTER[1] * Math.PI) / 180)) / (TILE_PX * mPerPx));
    return { longitude: CENTER[0], latitude: CENTER[1], zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)), pitch: PITCH, bearing: 0 };
  }

  let viewState = fitView();

  const baseLayer = new MVTLayer({
    id: 'basemap',
    data: TILEJSON,
    // Tile di un livello più basso: meno byte e meno sentieri minori,
    // che a questa scala sarebbero solo rumore.
    zoomOffset: -1,
    maxZoom: 14,
    binary: false,
    loadOptions: { mvt: { layers: ['water', 'waterway', 'transportation'] } },
    stroked: false,
    filled: true,
    lineWidthUnits: 'pixels',
    lineCapRounded: true,
    lineJointRounded: true,
    getFillColor: (f: any) => (f.properties.layerName === 'water' ? lineA(0.07) : [0, 0, 0, 0]),
    getLineColor: (f: any) => {
      const p = f.properties;
      if (p.layerName === 'waterway') return lineA(0.14);
      switch (p.class) {
        case 'motorway': case 'trunk': case 'primary': return lineA(0.2);
        case 'secondary': case 'tertiary': return lineA(0.15);
        case 'minor': case 'service': return lineA(0.08);
        case 'rail': case 'transit': return lineA(0.06);
        default: return lineA(0.05);
      }
    },
    getLineWidth: (f: any) => {
      const p = f.properties;
      if (p.layerName === 'waterway') return 1;
      switch (p.class) {
        case 'motorway': case 'trunk': case 'primary': return 1.4;
        case 'secondary': case 'tertiary': return 1;
        default: return 0.7;
      }
    },
    onViewportLoad: () => {
      if (ready) return;
      ready = true;
      initial.onReady?.();
    },
  });

  const deck = new Deck({
    parent: container as HTMLDivElement,
    width: '100%',
    height: '100%',
    viewState,
    controller: false,
    useDevicePixels: Math.min(window.devicePixelRatio || 1, 2),
    layers: [baseLayer],
    style: { position: 'absolute', inset: '0', pointerEvents: 'none' },
    onResize: () => {
      viewState = fitView();
      deck.setProps({ viewState });
      sizeLabelCanvas();
    },
  });

  function sizeLabelCanvas() {
    const w = labelCanvas.clientWidth, h = labelCanvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (labelCanvas.width !== Math.round(w * dpr)) labelCanvas.width = Math.round(w * dpr);
    if (labelCanvas.height !== Math.round(h * dpr)) labelCanvas.height = Math.round(h * dpr);
  }

  function project(): (p: LonLat) => [number, number] {
    const vp = new WebMercatorViewport({
      width: container.clientWidth || 1,
      height: container.clientHeight || 1,
      ...viewState,
    });
    metersPerPixel = vp.metersPerPixel;
    return (p) => {
      const [x, y] = vp.project(p);
      return [x, y];
    };
  }

  interface Seg { from: LonLat; to: LonLat; a: number }

  function trailFor(m: Mark, trailM: number): Seg[] {
    const out: Seg[] = [];
    const step = trailM / TRAIL_STEPS;
    let prev = pointAt(m.route, wrapD(m.route, m.d - trailM));
    for (let i = 1; i <= TRAIL_STEPS; i++) {
      const cur = pointAt(m.route, wrapD(m.route, m.d - trailM + step * i));
      out.push({ from: prev, to: cur, a: (i / TRAIL_STEPS) ** 1.6 });
      prev = cur;
    }
    return out;
  }

  // Tracciati GPS completi, appena accennati: sotto le scie dei marker.
  const tracksLayer = new PathLayer<Route>({
    id: 'tracks',
    data: routes,
    getPath: (r) => r.path,
    getColor: [accentRgb[0], accentRgb[1], accentRgb[2], 140],
    getWidth: 1.3,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
  });

  function renderLayers() {
    const trailM = TRAIL_PX * metersPerPixel;
    const segs = reduced ? [] : marks.flatMap((m) => trailFor(m, trailM));
    deck.setProps({
      layers: [
        baseLayer,
        tracksLayer,
        new LineLayer<Seg>({
          id: 'trails',
          data: segs,
          getSourcePosition: (s) => s.from,
          getTargetPosition: (s) => s.to,
          getColor: (s) => [accentRgb[0], accentRgb[1], accentRgb[2], Math.round(s.a * 255)],
          getWidth: 3,
          widthUnits: 'pixels',
        }),
        new ScatterplotLayer<Mark>({
          id: 'markers',
          data: marks.slice(),
          getPosition: (m) => m.lonLat!,
          getRadius: (m) => m.r,
          radiusUnits: 'pixels',
          getFillColor: [accentRgb[0], accentRgb[1], accentRgb[2], 255],
        }),
      ],
    });
  }

  // ---------- etichette e collegamenti (canvas 2D) ----------

  // Rettangoli delle etichette già disegnate nel frame corrente: i giri
  // reali si incrociano, e due marker vicini non devono sovrapporre il
  // testo — il secondo cede e la sua etichetta sfuma.
  let frameRects: [number, number, number, number][] = [];
  const LABEL_FONT = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';

  function labelRect(ctx: CanvasRenderingContext2D, txt: string, m: Mark, pos: [number, number]) {
    ctx.font = LABEL_FONT;
    const cw = labelCanvas.clientWidth || 1;
    const tw = ctx.measureText(txt).width;
    const x = Math.max(tw / 2 + 8, Math.min(pos[0], cw - tw / 2 - 8));
    const y = Math.max(18, pos[1] - m.r - 9);
    return { x, y, rect: [x - tw / 2 - 6, y - 12, x + tw / 2 + 6, y + 4] as [number, number, number, number] };
  }

  function blocked(ctx: CanvasRenderingContext2D, txt: string, m: Mark, pos: [number, number]): boolean {
    const [x0, y0, x1, y1] = labelRect(ctx, txt, m, pos).rect;
    return frameRects.some(([a0, b0, a1, b1]) => x0 < a1 && x1 > a0 && y0 < b1 && y1 > b0);
  }

  function drawLabel(ctx: CanvasRenderingContext2D, txt: string, m: Mark, pos: [number, number]) {
    const { x, y, rect } = labelRect(ctx, txt, m, pos);
    frameRects.push(rect);
    ctx.save();
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = hexToRgba(labelColor, 0.72);
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  function scramble(s: ScrambleState, now: number, IN: number, OUT: number, chars: string, keepSpaces: boolean): string {
    const t = now - s.at;
    const n = s.txt.length;
    let out = '';
    for (let i = 0; i < n; i++) {
      const c = s.txt[i];
      if (keepSpaces && c === ' ') { out += ' '; continue; }
      if (s.phase === 'hold') { out += c; continue; }
      const start = s.phase === 'in' ? (i / n) * (IN - 250) : ((n - 1 - i) / n) * (OUT - 170);
      const p = t - start;
      if (s.phase === 'in') out += p < 0 ? ' ' : p < 250 ? chars[(Math.floor(p / 40) + i * 3) % chars.length] : c;
      else out += p < 0 ? c : p < 170 ? chars[(Math.floor(p / 35) + i * 5) % chars.length] : ' ';
    }
    return out;
  }

  function drawActivity(ctx: CanvasRenderingContext2D, m: Mark, pos: [number, number], now: number, suppress: boolean) {
    if (!m.act) m.act = { txt: '', phase: 'wait', at: now + Math.random() * 1200 };
    const a = m.act;
    const IN = 800, OUT = 620;
    suppress = suppress || blocked(ctx, a.txt || 'THRESHOLD EFFORT', m, pos);
    if (suppress && (a.phase === 'in' || a.phase === 'hold')) { a.phase = 'out'; a.at = now; }
    if (a.phase === 'wait') {
      if (now < a.at || suppress) return;
      const used = marks
        .filter((o) => o !== m && o.act && o.act.txt && o.pos && Math.hypot(o.pos[0] - pos[0], o.pos[1] - pos[1]) < 520)
        .map((o) => o.act!.txt);
      const pool = ACTIVITIES.filter((x) => used.indexOf(x) < 0);
      const src = pool.length ? pool : ACTIVITIES;
      a.txt = src[Math.floor(Math.random() * src.length)];
      a.phase = 'in';
      a.at = now;
    }
    const el = now - a.at;
    if (a.phase === 'in' && el > IN) { a.phase = 'hold'; a.at = now; }
    else if (a.phase === 'out' && el > OUT) { a.phase = 'wait'; a.at = now + 400; return; }
    drawLabel(ctx, scramble(a, now, IN, OUT, SCRAMBLE_CH, true), m, pos);
  }

  function drawGps(ctx: CanvasRenderingContext2D, m: Mark, pos: [number, number], now: number) {
    if (!m.gps) m.gps = { txt: '', phase: 'wait', at: now + 1500 + Math.random() * 14000 };
    const g = m.gps;
    const IN = 900, HOLD = 4400, OUT = 700;
    const cw = labelCanvas.clientWidth || 1, ch = labelCanvas.clientHeight || 1;
    // Nella metà bassa la mappa sfuma (mask CSS): lì le etichette
    // resterebbero a mezz'aria sul fondo chiaro.
    const offscreen = pos[0] < 0 || pos[0] > cw || pos[1] < 0 || pos[1] / ch > 0.62;
    const suppress = offscreen || blocked(ctx, g.txt || `00°00'00"N 00°00'00"E`, m, pos);
    if (suppress && (g.phase === 'in' || g.phase === 'hold')) { g.phase = 'out'; g.at = now; }
    if (g.phase === 'wait') {
      if (now < g.at || suppress) { drawActivity(ctx, m, pos, now, suppress); return; }
      g.phase = 'in';
      g.at = now;
    }
    const el = now - g.at;
    if (g.phase === 'in' && el > IN) { g.phase = 'hold'; g.at = now; }
    else if (g.phase === 'hold' && el > HOLD) { g.phase = 'out'; g.at = now; }
    else if (g.phase === 'out' && el > OUT) { g.phase = 'wait'; g.at = now + 6000 + Math.random() * 18000; m.act = null; return; }
    // Coordinate vere del pallino, aggiornate a ogni frame finché
    // l'etichetta è visibile: i secondi scorrono mentre si sposta. In
    // uscita il testo resta fermo sull'ultimo valore, mentre si dissolve.
    if (g.phase !== 'out') g.txt = `${toDms(m.lonLat![1], 'N', 'S')} ${toDms(m.lonLat![0], 'E', 'W')}`;
    drawLabel(ctx, scramble(g, now, IN, OUT, GPS_CH, false), m, pos);
  }

  function drawLinks(ctx: CanvasRenderingContext2D, now: number) {
    const lit = (m: Mark) => !!m.gps && (m.gps.phase === 'in' || m.gps.phase === 'hold');
    const litMarks = marks.filter((m) => m.pos && lit(m));
    if (!nextLink) nextLink = now + 700;
    const IN = 900, HOLD = 3200, OUT = 700;
    if (now > nextLink && links.length < 4) {
      const busy = new Set<Mark>();
      links.forEach((l) => { busy.add(l.a); busy.add(l.b); });
      const free = litMarks.filter((m) => !busy.has(m));
      const pairs: [Mark, Mark][] = [];
      for (let i = 0; i < free.length; i++) {
        for (let j = i + 1; j < free.length; j++) {
          const d = Math.hypot(free[i].pos![0] - free[j].pos![0], free[i].pos![1] - free[j].pos![1]);
          if (d > 120 && d < 520) pairs.push([free[i], free[j]]);
        }
      }
      if (pairs.length) {
        const p = pairs[Math.floor(Math.random() * pairs.length)];
        p.forEach((m) => { m.gps!.phase = 'hold'; m.gps!.at = now; });
        links.push({ a: p[0], b: p[1], at: now });
      }
      nextLink = now + 350 + Math.random() * 900;
    }
    ctx.save();
    ctx.lineWidth = 1;
    const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
    links = links.filter((l) => {
      if (!l.end && ((now - l.at > IN + 1500 && (!lit(l.a) || !lit(l.b))) || now - l.at > IN + HOLD)) l.end = now;
      if (l.end && now > l.end + OUT) return false;
      const p1 = ease((now - l.at) / IN);
      const p0 = l.end ? ease((now - l.end) / OUT) : 0;
      const A = l.a.pos!, B = l.b.pos!;
      const flick = 0.3 + Math.random() * 0.22 + (Math.random() < 0.05 ? -0.24 : 0);
      ctx.strokeStyle = hexToRgba(accent, Number(Math.max(0.06, flick).toFixed(3)));
      ctx.setLineDash(Math.random() < 0.12 ? [Math.random() * 30 + 8, Math.random() * 14 + 4] : []);
      ctx.lineDashOffset = Math.random() * 20;
      ctx.beginPath();
      ctx.moveTo(A[0] + (B[0] - A[0]) * p0, A[1] + (B[1] - A[1]) * p0);
      ctx.lineTo(A[0] + (B[0] - A[0]) * p1, A[1] + (B[1] - A[1]) * p1);
      ctx.stroke();
      ctx.setLineDash([]);
      return true;
    });
    ctx.restore();
  }

  // ---------- ciclo ----------

  function frame(now: number) {
    const dt = reduced || !last ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    const toScreen = project();
    marks.forEach((m) => {
      m.d = wrapD(m.route, m.d + m.pxSpeed * metersPerPixel * dt);
      m.lonLat = pointAt(m.route, m.d);
      m.pos = toScreen(m.lonLat);
    });
    renderLayers();

    sizeLabelCanvas();
    const ctx = labelCanvas.getContext('2d')!;
    const dpr = labelCanvas.width / (labelCanvas.clientWidth || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, labelCanvas.clientWidth, labelCanvas.clientHeight);
    // Titolo e testo dell'hero entrano come rettangoli già "occupati":
    // nessuna etichetta può comparire sotto di loro. Letti a ogni frame
    // perché la parola del titolo cambia larghezza.
    const origin = labelCanvas.getBoundingClientRect();
    frameRects = (initial.avoid ?? []).map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left - origin.left - 8, r.top - origin.top - 6, r.right - origin.left + 8, r.bottom - origin.top + 6];
    });
    if (!reduced && ready) {
      marks.forEach((m) => drawGps(ctx, m, m.pos!, now));
      drawLinks(ctx, now);
    }
  }

  function loop(now: number) {
    if (!running) return;
    frame(now);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || destroyed) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  let io: IntersectionObserver | null = null;
  if (reduced) {
    frame(performance.now());
  } else if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    });
    io.observe(container);
  } else {
    start();
  }

  return {
    destroy() {
      destroyed = true;
      stop();
      io?.disconnect();
      deck.finalize();
    },
  };
}
