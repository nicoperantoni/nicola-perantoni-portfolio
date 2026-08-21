/**
 * Mappa topografica animata — modulo isolato, indipendente da qualsiasi
 * framework. Riceve due <canvas> sovrapposti (curve statiche + marker
 * animati) e disegna:
 *  - un campo di altitudine con value-noise deterministico (seed fisso),
 *  - curve di livello via marching squares, con quote opzionali,
 *  - marker GPS che si muovono lungo le curve indice,
 *  - etichette (coordinate GPS o attività) e linee di collegamento fra
 *    marker.
 *
 * Parametri (vedi anche README → "Topo Map Module — API"):
 *  - accent (string, colore CSS): marker, etichette e linee di collegamento. Default '#c8b892'.
 *  - markers (number 0–16): numero di marker GPS. Default 10.
 *  - showElevation (boolean): mostra/nasconde le quote sulle curve. Default true.
 *  - lineColor (string, hex): curve di livello e quote. Default '#ffffff' (sfondo scuro);
 *    su sfondo chiaro passare un colore scuro, es. '#101114'.
 *  - labelColor (string, hex): testo di coordinate GPS e attività sopra i marker.
 *    Default coincide con accent; su sfondo chiaro l'oro è troppo poco leggibile,
 *    passare un colore scuro, es. '#101114'.
 *
 * Rispetta prefers-reduced-motion: in quel caso disegna un solo frame
 * (marker fermi nella posizione iniziale, nessuna linea né etichetta).
 */

export interface TopoMapOptions {
  accent?: string;
  markers?: number;
  showElevation?: boolean;
  lineColor?: string;
  labelColor?: string;
}

export interface TopoMapController {
  setOptions(opts: Partial<TopoMapOptions>): void;
  destroy(): void;
}

type Point = [number, number];

interface ScrambleState {
  txt: string;
  phase: 'wait' | 'in' | 'hold' | 'out';
  at: number;
}

interface Mark {
  path: Point[];
  t: number;
  sp: number;
  dir: number;
  r: number;
  pos?: Point;
  ang?: number;
  gps?: ScrambleState;
  act?: ScrambleState | null;
}

interface Link {
  a: Mark;
  b: Mark;
  at: number;
  end?: number;
}

interface LevelLine {
  lines: Point[][];
  idx: boolean;
  k: number;
  lv: number;
}

interface ElevLabel {
  pt: Point;
  ang: number;
  txt: string;
  idx: boolean;
}

const NOISE_SEED = 20240917;
const NOISE_TABLE_SIZE = 4096;
const NOISE_GRID = 64;
const LEVELS = 18;
const LEVEL_OFFSET = 0.137;
const GRID_COLS = 210;

const ACTIVITIES = [
  'THRESHOLD EFFORT', 'HILL REPEATS', 'ZONE 4', 'NEGATIVE SPLIT', 'LONG RIDE',
  'RECOVERY SPIN', 'COOLING DOWN', 'OFF SEASON', 'RUNNING', 'CLIMBING',
  'DESCENDING', 'TRACK SESSION', 'TIME TRIAL',
  'TRAIL SESSION', 'TEAM CAMP',
];

const SCRAMBLE_CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const GPS_CH = '0123456789°\'"NSEW';

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function buildNoise() {
  let s = NOISE_SEED;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const table = new Float32Array(NOISE_TABLE_SIZE);
  for (let i = 0; i < NOISE_TABLE_SIZE; i++) table[i] = rnd();

  const valueNoise = (x: number, y: number, f: number): number => {
    const xi = Math.floor(x * f);
    const yi = Math.floor(y * f);
    const xf = x * f - xi;
    const yf = y * f - yi;
    const at = (p: number, q: number) =>
      table[((((p % NOISE_GRID) + NOISE_GRID) % NOISE_GRID) * NOISE_GRID +
        (((q % NOISE_GRID) + NOISE_GRID) % NOISE_GRID)) % NOISE_TABLE_SIZE];
    const u = smoothstep(xf);
    const v = smoothstep(yf);
    const A = at(xi, yi), B = at(xi + 1, yi), C = at(xi, yi + 1), D = at(xi + 1, yi + 1);
    const t1 = A + (B - A) * u;
    const t2 = C + (D - C) * u;
    return t1 + (t2 - t1) * v;
  };

  return (x: number, y: number) =>
    valueNoise(x, y, 2.2) * 0.68 + valueNoise(x, y, 4.6) * 0.24 + valueNoise(x, y, 9.5) * 0.08;
}

function stitchSegments(segs: [Point, Point][]): Point[][] {
  const key = (p: Point) => `${Math.round(p[0] * 2)}:${Math.round(p[1] * 2)}`;
  const map = new Map<string, number[]>();
  segs.forEach((s, i) => {
    [0, 1].forEach((e) => {
      const k = key(s[e as 0 | 1]);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    });
  });
  const used = new Array(segs.length).fill(false);
  const out: Point[][] = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const line: Point[] = [segs[i][0], segs[i][1]];
    for (let end = 0; end < 2; end++) {
      for (;;) {
        const tip = end === 0 ? line[line.length - 1] : line[0];
        const cand = (map.get(key(tip)) || []).find((j) => !used[j]);
        if (cand === undefined) break;
        used[cand] = true;
        const s = segs[cand];
        const next = key(s[0]) === key(tip) ? s[1] : s[0];
        if (end === 0) line.push(next);
        else line.unshift(next);
      }
    }
    if (line.length > 3) out.push(line);
  }
  return out;
}

function smoothLine(p: Point[], passes: number, spacing: number): Point[] {
  const closed = Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < 2;
  let q = p;
  for (let pass = 0; pass < passes; pass++) {
    const r: Point[] = [];
    for (let i = 0; i < q.length; i++) {
      const A = q[i === 0 ? (closed ? q.length - 2 : 0) : i - 1];
      const B = q[i];
      const C = q[i === q.length - 1 ? (closed ? 1 : q.length - 1) : i + 1];
      r.push([(A[0] + 2 * B[0] + C[0]) / 4, (A[1] + 2 * B[1] + C[1]) / 4]);
    }
    if (closed) r[r.length - 1] = r[0].slice() as Point;
    q = r;
  }
  let total = 0;
  for (let i = 1; i < q.length; i++) total += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
  if (total < 1) return q;
  const n = Math.max(16, Math.round(total / spacing));
  const out: Point[] = [];
  let seg = 0, acc = 0;
  for (let i = 0; i < n; i++) {
    const target = (total * i) / (n - 1);
    while (seg < q.length - 2) {
      const d = Math.hypot(q[seg + 1][0] - q[seg][0], q[seg + 1][1] - q[seg][1]);
      if (acc + d >= target) break;
      acc += d;
      seg++;
    }
    const d = Math.hypot(q[seg + 1][0] - q[seg][0], q[seg + 1][1] - q[seg][1]) || 1;
    const k = Math.min(1, Math.max(0, (target - acc) / d));
    out.push([q[seg][0] + (q[seg + 1][0] - q[seg][0]) * k, q[seg][1] + (q[seg + 1][1] - q[seg][1]) * k]);
  }
  return out;
}

export function createTopoMap(
  staticCanvas: HTMLCanvasElement,
  markerCanvas: HTMLCanvasElement,
  initial: TopoMapOptions = {}
): TopoMapController {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const opts: Required<TopoMapOptions> = {
    accent: initial.accent ?? '#c8b892',
    markers: initial.markers ?? 10,
    showElevation: initial.showElevation ?? true,
    lineColor: initial.lineColor ?? '#ffffff',
    labelColor: initial.labelColor ?? initial.accent ?? '#c8b892',
  };

  const field = buildNoise();
  let topoPaths: Point[][] = [];
  let topoMarks: Mark[] = [];
  let links: Link[] = [];
  let nextLink = 0;
  let lastMark: number | undefined;
  let raf = 0;
  let resizeRaf = 0;
  let destroyed = false;

  function accA(a: number): string {
    return hexToRgba(opts.accent, a);
  }

  function lineA(a: number): string {
    return hexToRgba(opts.lineColor, a);
  }

  function labelA(a: number): string {
    return hexToRgba(opts.labelColor, a);
  }

  function renderTopo() {
    const w = staticCanvas.clientWidth, h = staticCanvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    staticCanvas.width = Math.round(w * dpr);
    staticCanvas.height = Math.round(h * dpr);
    const ctx = staticCanvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cols = GRID_COLS, rows = Math.max(40, Math.round(cols * (h / w)));
    const gw = w / cols, gh = h / rows;
    const G: Float32Array[] = [];
    for (let j = 0; j <= rows; j++) {
      const row = new Float32Array(cols + 1);
      for (let i = 0; i <= cols; i++) {
        row[i] = field((i / cols) * 2.1, ((j / rows) * 2.1 * (h / w)) * 2.2);
      }
      G.push(row);
    }

    let lo = 1, hi = 0;
    for (const r of G) for (const v of r) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const step = (hi - lo) / LEVELS;
    const ip = (p: number, q: number, t: number) => (t - p) / (q - p || 1e-6);
    const marks: Point[][] = [];
    const elevLabels: ElevLabel[] = [];
    const levelData: LevelLine[] = [];

    for (let k = 1; k < LEVELS; k++) {
      const lv = lo + step * (k + LEVEL_OFFSET);
      const isIdx = k % 5 === 0;
      const segs: [Point, Point][] = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const tl = G[j][i], tr = G[j][i + 1], br = G[j + 1][i + 1], bl = G[j + 1][i];
          const x0 = i * gw, y0 = j * gh, x1 = x0 + gw, y1 = y0 + gh;
          const T: Point | null = (tl < lv) !== (tr < lv) ? [x0 + gw * ip(tl, tr, lv), y0] : null;
          const R: Point | null = (tr < lv) !== (br < lv) ? [x1, y0 + gh * ip(tr, br, lv)] : null;
          const B: Point | null = (br < lv) !== (bl < lv) ? [x0 + gw * ip(bl, br, lv), y1] : null;
          const L: Point | null = (bl < lv) !== (tl < lv) ? [x0, y0 + gh * ip(tl, bl, lv)] : null;
          const n = (T ? 1 : 0) + (R ? 1 : 0) + (B ? 1 : 0) + (L ? 1 : 0);
          if (n === 2) {
            const p = [T, R, B, L].filter(Boolean) as Point[];
            segs.push([p[0], p[1]]);
          } else if (n === 4) {
            const center = (tl + tr + br + bl) / 4;
            if ((center < lv) === (tl < lv)) { segs.push([T!, R!]); segs.push([B!, L!]); }
            else { segs.push([T!, L!]); segs.push([R!, B!]); }
          }
        }
      }
      const lines = stitchSegments(segs).filter((p) => p.length > 6).map((p) => smoothLine(p, 5, 6));
      ctx.beginPath();
      lines.forEach((p) => {
        ctx.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
      });
      ctx.lineWidth = isIdx ? 1.5 : 0.8;
      ctx.strokeStyle = isIdx ? lineA(0.22) : lineA(0.1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      if (isIdx) lines.forEach((p) => { if (p.length > 40) marks.push(p); });
      levelData.push({ lines, idx: isIdx, k, lv });
    }

    if (opts.showElevation) {
      levelData
        .slice()
        .sort((a, b) => (b.idx ? 1 : 0) - (a.idx ? 1 : 0))
        .forEach((lv) => {
          const isIdx = lv.idx;
          const elev = Math.round((320 + ((lv.lv - lo) / (hi - lo || 1)) * 340) / 20) * 20;
          lv.lines.forEach((p) => {
            if (p.length < 95) return;
            const i0 = Math.round(p.length * ((0.16 + 0.19 * (lv.k % 5)) % 0.92));
            const a = p[Math.max(0, i0 - 3)], b = p[Math.min(p.length - 1, i0 + 3)];
            const pt = p[i0];
            if (!a || !b || !pt) return;
            if (pt[0] < 40 || pt[0] > w - 40 || pt[1] < 24 || pt[1] > h - 24) return;
            const near = elevLabels.some((q) => {
              const d = Math.hypot(q.pt[0] - pt[0], q.pt[1] - pt[1]);
              return q.txt === String(elev) ? d < 260 : d < 110;
            });
            if (near) return;
            let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
            if (ang > Math.PI / 2) ang -= Math.PI;
            if (ang < -Math.PI / 2) ang += Math.PI;
            elevLabels.push({ pt, ang, txt: String(elev), idx: isIdx });
          });
        });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      elevLabels.forEach((l) => {
        ctx.font = (l.idx ? '400 10px ' : '400 9px ') + 'ui-monospace, SFMono-Regular, Menlo, monospace';
        const tw = ctx.measureText(l.txt).width;
        ctx.save();
        ctx.translate(l.pt[0], l.pt[1]);
        ctx.rotate(l.ang);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        ctx.fillRect(-tw / 2 - 4, -7, tw + 8, 14);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = l.idx ? lineA(0.26) : lineA(0.14);
        ctx.fillText(l.txt, 0, 0.5);
        ctx.restore();
      });
      ctx.restore();
    }

    topoPaths = marks.sort((a, b) => b.length - a.length).slice(0, 8).map((p) => smoothLine(p, 0, 2.2));
    const paths = topoPaths;
    const N = Math.max(0, Math.round(opts.markers)), L = paths.length;
    topoMarks = (L && N)
      ? Array.from({ length: N }, (_, i) => {
          const pi = i % L;
          const occ = Math.floor(i / L);
          const perPath = Math.ceil((N - pi) / L);
          return {
            path: paths[pi],
            t: ((occ + 0.5 * (pi % 2)) / perPath) % 1,
            sp: 7 + (i % 3) * 1.6,
            dir: i % 3 === 1 ? -1 : 1,
            r: 3.4 + (i % 2) * 0.5,
          };
        })
      : [];

    if (L && N) {
      const tl: { p: Point[]; t: number; d: number }[] = [];
      paths.forEach((p) => {
        let best = -1, bestD = Infinity;
        for (let i = 0; i < p.length; i++) {
          const dx = p[i][0] / w, dy = p[i][1] / h;
          if (dx > 0.5 || dy > 0.42) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
        if (best >= 0) tl.push({ p, t: best / (p.length - 1), d: bestD });
      });
      const added: Mark[] = [];
      tl.sort((a, b) => a.d - b.d).forEach((c) => {
        if (added.length >= 2) return;
        const clash = topoMarks.concat(added).some((m) => m.path === c.p && Math.abs(m.t - c.t) < 0.1);
        if (clash) return;
        added.push({ path: c.p, t: c.t, sp: 6.6, dir: 1, r: 3.6 });
      });
      added.forEach((m) => topoMarks.push(m));
    }

    // stesso tracciato: stessa velocità, t equidistanti -> i marker non si raggiungono mai
    {
      const groups = new Map<Point[], Mark[]>();
      topoMarks.forEach((m) => {
        const g = groups.get(m.path) || [];
        g.push(m);
        groups.set(m.path, g);
      });
      groups.forEach((g) => {
        if (g.length < 2) return;
        const sp = g[0].sp, dir = g[0].dir, base = g[0].t;
        g.forEach((m, i) => { m.sp = sp; m.dir = dir; m.t = (base + i / g.length) % 1; });
      });
    }

    // spaziatura minima globale: nessun marker a meno di 90px da un altro
    {
      const at = (m: Mark): Point => m.path[Math.min(m.path.length - 1, Math.round(m.t * (m.path.length - 1)))];
      const placed: Point[] = [];
      topoMarks = topoMarks.filter((m) => {
        const free = () => {
          const p = at(m);
          return !placed.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 90);
        };
        for (let k = 0; k < 9 && !free(); k++) m.t = (m.t + 0.11) % 1;
        if (!free()) return false;
        placed.push(at(m));
        return true;
      });
    }
  }

  function drawLabel(ctx: CanvasRenderingContext2D, txt: string, m: Mark, pos: Point) {
    ctx.save();
    ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = labelA(0.72);
    const cw = ctx.canvas.clientWidth || 1;
    const tw = ctx.measureText(txt).width;
    ctx.fillText(txt, Math.max(tw / 2 + 8, Math.min(pos[0], cw - tw / 2 - 8)), Math.max(18, pos[1] - m.r - 9));
    ctx.restore();
  }

  function gpsText(): string {
    const pad = (v: number, n: number) => String(v).padStart(n, '0');
    const dms = (max: number) =>
      pad(Math.floor(Math.random() * max), 2) + '°' + pad(Math.floor(Math.random() * 60), 2) + "'" +
      pad(Math.floor(Math.random() * 60), 2) + '"';
    return dms(90) + (Math.random() < 0.5 ? 'N' : 'S') + ' ' + dms(180) + (Math.random() < 0.5 ? 'E' : 'W');
  }

  function drawActivity(ctx: CanvasRenderingContext2D, m: Mark, pos: Point, now: number, central: boolean) {
    if (!m.act) m.act = { txt: '', phase: 'wait', at: now + Math.random() * 1200 };
    const a = m.act;
    const IN = 800, OUT = 620;
    // Il marker può entrare nella zona "central" (sotto al titolo/testo
    // dell'hero) anche a etichetta già visibile, non solo al momento della
    // rivelazione — senza questo controllo continuo l'etichetta resta
    // visibile e attraversa il testo mentre il marker ci passa sopra.
    if (central && (a.phase === 'in' || a.phase === 'hold')) { a.phase = 'out'; a.at = now; }
    if (a.phase === 'wait') {
      if (now < a.at || central) return;
      const used = topoMarks
        .filter((o) => o !== m && o.act && o.act.txt && o.pos && m.pos && Math.hypot(o.pos[0] - m.pos[0], o.pos[1] - m.pos[1]) < 520)
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
    const t = now - a.at;
    const n = a.txt.length;
    let out = '';
    for (let i = 0; i < n; i++) {
      const c = a.txt[i];
      if (c === ' ') { out += ' '; continue; }
      if (a.phase === 'hold') { out += c; continue; }
      const start = a.phase === 'in' ? (i / n) * (IN - 240) : ((n - 1 - i) / n) * (OUT - 160);
      const p = t - start;
      if (a.phase === 'in') out += p < 0 ? ' ' : p < 240 ? SCRAMBLE_CH[(Math.floor(p / 40) + i * 3) % SCRAMBLE_CH.length] : c;
      else out += p < 0 ? c : p < 160 ? SCRAMBLE_CH[(Math.floor(p / 35) + i * 5) % SCRAMBLE_CH.length] : ' ';
    }
    drawLabel(ctx, out, m, pos);
  }

  function drawGps(ctx: CanvasRenderingContext2D, m: Mark, pos: Point, now: number) {
    if (!m.gps) m.gps = { txt: '', phase: 'wait', at: now + 1500 + Math.random() * 14000 };
    const g = m.gps;
    const IN = 900, HOLD = 4400, OUT = 700;
    const cv = ctx.canvas, cw = cv.clientWidth || 1, ch = cv.clientHeight || 1;
    const central = Math.abs(pos[0] / cw - 0.5) < 0.44 && pos[1] / ch > 0.42;
    // Vedi commento in drawActivity: la soppressione deve valere anche a
    // rivelazione già avvenuta, non solo al suo avvio.
    if (central && (g.phase === 'in' || g.phase === 'hold')) { g.phase = 'out'; g.at = now; }
    if (g.phase === 'wait') {
      if (now < g.at || central) { drawActivity(ctx, m, pos, now, central); return; }
      g.txt = gpsText();
      g.phase = 'in';
      g.at = now;
    }
    const el = now - g.at;
    if (g.phase === 'in' && el > IN) { g.phase = 'hold'; g.at = now; }
    else if (g.phase === 'hold' && el > HOLD) { g.phase = 'out'; g.at = now; }
    else if (g.phase === 'out' && el > OUT) { g.phase = 'wait'; g.at = now + 6000 + Math.random() * 18000; m.act = null; return; }
    const t = now - g.at;
    const n = g.txt.length;
    let out = '';
    for (let i = 0; i < n; i++) {
      const c = g.txt[i];
      if (g.phase === 'hold') { out += c; continue; }
      const start = g.phase === 'in' ? (i / n) * (IN - 260) : ((n - 1 - i) / n) * (OUT - 180);
      const p = t - start;
      if (g.phase === 'in') out += p < 0 ? ' ' : p < 260 ? GPS_CH[(Math.floor(p / 40) + i * 3) % GPS_CH.length] : c;
      else out += p < 0 ? c : p < 180 ? GPS_CH[(Math.floor(p / 35) + i * 5) % GPS_CH.length] : ' ';
    }
    drawLabel(ctx, out, m, pos);
  }

  function drawLinks(ctx: CanvasRenderingContext2D, now: number) {
    const lit = (m: Mark) => !!m.gps && (m.gps.phase === 'in' || m.gps.phase === 'hold');
    const marks = topoMarks.filter((m) => m.pos && lit(m));
    if (!nextLink) nextLink = now + 700;
    const IN = 900, HOLD = 3200, OUT = 700;
    if (now > nextLink && links.length < 4) {
      const busy = new Set<Mark>();
      links.forEach((l) => { busy.add(l.a); busy.add(l.b); });
      const free = marks.filter((m) => !busy.has(m));
      if (free.length >= 2) {
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
      }
      nextLink = now + 350 + Math.random() * 900;
    }
    ctx.save();
    ctx.lineWidth = 1;
    links = links.filter((l) => {
      const minLife = IN + 1500;
      if (!l.end && ((now - l.at > minLife && (!lit(l.a) || !lit(l.b))) || now - l.at > IN + HOLD)) l.end = now;
      if (l.end && now > l.end + OUT) return false;
      const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
      const p1 = ease((now - l.at) / IN);
      const p0 = l.end ? ease((now - l.end) / OUT) : 0;
      const A = l.a.pos!, B = l.b.pos!;
      const x = (p: number) => A[0] + (B[0] - A[0]) * p;
      const y = (p: number) => A[1] + (B[1] - A[1]) * p;
      const flick = 0.3 + Math.random() * 0.22 + (Math.random() < 0.05 ? -0.24 : 0);
      ctx.strokeStyle = accA(Number(Math.max(0.06, flick).toFixed(3)));
      ctx.setLineDash(Math.random() < 0.12 ? [Math.random() * 30 + 8, Math.random() * 14 + 4] : []);
      ctx.lineDashOffset = Math.random() * 20;
      ctx.beginPath();
      ctx.moveTo(x(p0), y(p0));
      ctx.lineTo(x(p1), y(p1));
      ctx.stroke();
      ctx.setLineDash([]);
      return true;
    });
    ctx.restore();
  }

  function drawTopoMarks(now: number): boolean {
    const w = markerCanvas.clientWidth, h = markerCanvas.clientHeight;
    if (!w || !h || !topoMarks.length) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (markerCanvas.width !== Math.round(w * dpr)) {
      markerCanvas.width = Math.round(w * dpr);
      markerCanvas.height = Math.round(h * dpr);
    }
    const ctx = markerCanvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const dt = reduced || !lastMark ? 0 : Math.min((now - lastMark) / 1000, 0.05);
    lastMark = now;
    const fill = opts.accent;
    topoMarks.forEach((m) => {
      const p = m.path, n = p.length;
      m.t += (m.sp * dt * (m.dir || 1)) / 420;
      if (m.t >= 1) m.t -= 1;
      if (m.t < 0) m.t += 1;
      const closed = Math.hypot(p[0][0] - p[n - 1][0], p[0][1] - p[n - 1][1]) < 3;
      const idxf = (((m.t % 1) + 1) % 1) * (n - 1);
      const i0 = Math.floor(idxf), i1 = Math.min(i0 + 1, n - 1), kk = idxf - i0;
      const pos: Point = [p[i0][0] + (p[i1][0] - p[i0][0]) * kk, p[i0][1] + (p[i1][1] - p[i0][1]) * kk];
      const wrap = (i: number) => (closed ? ((i % (n - 1)) + (n - 1)) % (n - 1) : Math.min(n - 1, Math.max(0, i)));
      const A = p[wrap(i0 - 1)], B = p[wrap(i0 + 2)];
      m.ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      m.pos = pos;
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], m.r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (!reduced) drawGps(ctx, m, pos, now);
    });
    if (!reduced) drawLinks(ctx, now);
    return true;
  }

  function loop(now: number) {
    const drawn = drawTopoMarks(now);
    if (reduced && drawn) return;
    raf = requestAnimationFrame(loop);
  }

  function onResize() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(renderTopo);
  }

  renderTopo();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', onResize);

  return {
    setOptions(next) {
      if (destroyed) return;
      Object.assign(opts, next);
      renderTopo();
      if (reduced) drawTopoMarks(performance.now());
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
    },
  };
}
