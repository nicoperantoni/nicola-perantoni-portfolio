# Handoff: Portfolio Nicola Perantoni — fotografo sportivo

## Overview
Sito portfolio one-page per Nicola Perantoni, fotografo sportivo con base a Verona. La metafora visiva è la **cartografia topografica**: curve di livello generate proceduralmente, quote in metri, marker GPS che si muovono lungo le curve e si collegano tra loro con linee di telemetria (incluso uno stato "CONNECTION FAILED"). Il portfolio è un flusso masonry di fotografie verticali, interrotto ogni pochi scatti da frasi del manifesto personale.

Sezioni, nell'ordine: **hero** (pannello nero con mappa topografica animata, headline con parola rotante, tre indicatori di stato, testo introduttivo) → **work** (griglia foto + note manifesto, con lightbox) → **studio** (chi sono + elenco servizi) → **contatti** → footer.

## About the Design Files
I file di questo pacchetto sono **riferimenti di design realizzati in HTML** — un prototipo che mostra aspetto e comportamento desiderati, non codice di produzione da copiare così com'è.

Il compito è **ricreare questi design nell'ambiente del codebase di destinazione** (React, Vue, Astro, Next, SwiftUI, native…) usando i pattern e le librerie già in uso. Se non esiste ancora un codebase, scegliere il framework più adatto (per un sito di questo tipo: un generatore statico o Next/Astro con immagini ottimizzate) e implementare lì.

Nota tecnica sul file sorgente: `Nicola Perantoni.dc.html` è un componente scritto per un runtime di prototipazione proprietario (`<x-dc>`, `renderVals()`, `<sc-for>`, `<sc-if>`). **Non riusare quel runtime**: leggere il file come specifica e riscrivere markup + logica nei costrutti del progetto (`.map()` invece di `<sc-for>`, rendering condizionale invece di `<sc-if>`, stato del componente invece di `renderVals()`). Tutti gli stili sono inline per necessità del prototipo: **in produzione portarli in CSS/Tailwind/CSS-in-JS** secondo la convenzione del progetto.

## Fidelity
**High-fidelity (hifi).** Colori, tipografia, spaziature, animazioni e copy sono definitivi. La UI va ricreata fedelmente. Le uniche parti deliberatamente aperte sono: i meta SEO con URL assoluti (dominio non ancora deciso) e l'immagine di preview social.

---

## Screens / Views

Il sito è una singola pagina scrollabile. Sotto, ogni sezione.

### 0. Veil di caricamento (overlay iniziale)
- **Scopo**: nascondere il layout fino al caricamento delle foto del flusso, mostrando un progresso.
- **Layout**: `position:fixed; inset:0; z-index:99`, sfondo `#000000`, contenuto centrato.
- **Componenti**:
  - Anello di progresso SVG 150×150 px, ruotato −90°: cerchio di sfondo `stroke rgba(255,255,255,0.16)`, `stroke-width:1.5`, `r:70`; cerchio di progresso `stroke #ffffff`, `stroke-width:1.5`, `stroke-linecap:round`, `stroke-dasharray:439.8`, `stroke-dashoffset = 439.8 × (1 − progresso)`, transizione `.4s ease`.
  - Al centro il glifo `✣` a 72px, `color:#ffffff`, `opacity:.9`, in rotazione continua (`glyphSpin`, 1.6s lineare infinita).
- **Comportamento**: si precaricano **tutte** le immagini del flusso; ogni `load`/`error` incrementa il progresso. Durata minima visibile 1000 ms, timeout di sicurezza 12 000 ms. All'uscita: `veilOut .55s ease forwards` (opacity → 0, visibility hidden), rimozione dal DOM 700 ms dopo.

### 1. Hero
- **Scopo**: dichiarazione d'identità + atmosfera del progetto.
- **Layout**: sezione `min-height:100dvh`. Dentro, un pannello nero (`#000000`) a piena larghezza con `overflow:hidden`, in colonna centrata, padding `clamp(20px, 3vw, 44px)`, gap `clamp(22px, 4vh, 56px)`.
- **Componenti**:
  1. **Mappa topografica** (due `<canvas>` sovrapposti, `position:absolute; top:0; left:0; right:0; height:min(78%, 1000px)`, `pointer-events:none`). Maschera di dissolvenza verso il basso:
     `mask-image: linear-gradient(to bottom, #000 0%, #000 58%, rgba(0,0,0,.88) 72%, rgba(0,0,0,.62) 82%, rgba(0,0,0,.34) 90%, rgba(0,0,0,.14) 96%, transparent 100%)`.
     - Canvas 1 (statico): curve di livello + quote. Canvas 2 (animato): marker, etichette, linee di collegamento.
  2. **Headline**: tre righe, `font-size:clamp(2.2rem, 7.6vw, 7rem)`, `line-height:1.14`, `letter-spacing:-0.035em`, colore `#ffffff`.
     - Riga 1: parola rotante in **Archivio 600** dentro una finestra `overflow:hidden` alta `1.14em`, `min-width:7.4ch`, testo centrato. Parole: `Corro`, `Pedalo`, `Cammino`, `Viaggio`.
     - Riga 2: `quindi` in **Instrument Serif italic 400**.
     - Riga 3: `fotografo` in **Archivo 600**.
  3. **Blocco stato** (griglia `auto auto 8.6em`, column-gap 10px, row-gap 8px, `font: IBM Plex Mono 400 clamp(10px,1vw,12px)`, `letter-spacing:.18em`, uppercase, `color:rgba(255,255,255,.62)`). Tre righe: `GPS Signal:`, `Device:`, `Athlete:`. La terza colonna ha larghezza fissa (8.6em) perché il testo cambia e non deve spostare nulla.
     - LED: cerchio 6px. **Boot**: `#e8912f` con glow `rgba(232,145,47,.6)`, animazione `ledBoot` (lampeggio a passi, 0.62/0.78/0.70s). **Attivo**: `#5ee08a`, glow `rgba(94,224,138,.55)`, animazione `ledFlicker` (2.7/2.3/2.9s, sfalsata).
     - Testi: da `Searching`/`Turning on`/`Warming up` a `Active`/`Enabled`/`Ready`.
  4. **Testo introduttivo**: colonna centrata, `max-width:1000px`, `font-weight:300`, `font-size:clamp(1.05rem,1.6vw,1.6rem)`, `line-height:1.45`, `color:rgba(255,255,255,.66)`, gap `clamp(16px,2.4vh,26px)`. Tre paragrafi (copy in *Content* sotto).

### 2. Work — flusso fotografico
- **Scopo**: il portfolio.
- **Layout**: griglia masonry. `display:grid`, `grid-auto-rows:8px`, `grid-auto-flow:row dense`, `row-gap:0`, `column-gap:clamp(16px,2.4vw,36px)`; padding orizzontale `calc(clamp(18px,5vw,64px) + 44px)`.
  - Colonne per breakpoint (misurate sulla **larghezza utile**, cioè `clientWidth − padding`): ≥1000px → **3 colonne**; ≥620px → **2**; sotto → **1**.
  - Ogni cella occupa una colonna; l'altezza in righe di 8px è calcolata dall'altezza reale (`ceil((h + gap) / 8)`), da cui il masonry.
- **Celle foto**: `border-radius:clamp(8px,1vw,14px)`, `overflow:hidden`, larghezza 90% della colonna (`justify-self:center`), **rapporto 4:5 verticale** (`height = larghezzaCella × 1.25`). `<img>` `object-fit:cover`, `width/height:100%`, background di attesa `rgba(16,17,20,0.08)`, `cursor:pointer`, `draggable:false`, `decoding:async`.
- **Celle testo (note manifesto)**: altezza automatica, `max-width:26ch`, padding `clamp(4px,.8vw,12px) clamp(6px,1.4vw,22px) 0 0`, `font-weight:300`, `font-size:clamp(1.6rem,2.7vw,2.9rem)`, `line-height:1.2`, `letter-spacing:-0.02em`, `color:rgba(16,17,20,0.82)`, `text-wrap:pretty`.
  - **Regola**: due note non devono mai risultare consecutive nella stessa colonna — a ciascuna nota si assegna una colonna esplicita a rotazione (`(indiceNota % nColonne) + 1`), così c'è sempre una foto di stacco.
- **Ordine del flusso**: le foto sono interlacciate fra i quattro progetti (una per progetto, a giro), poi le cinque note vengono inserite a posizioni fisse (indici 3, 7, 11, 13 e `max(14, nFoto − 2)`), con il vincolo che **l'ultima nota non chiuda il flusso**: sotto di essa resta almeno una foto.

### 3. Lightbox
- `position:fixed; inset:0; z-index:140`, sfondo `rgba(12,12,14,.95)`, `backdrop-filter:blur(6px)`, `cursor:zoom-out`, fade `opacity .32s ease`, padding `clamp(16px,4vh,56px) clamp(16px,5vw,96px)`.
- Immagine centrata `object-fit:contain`, `border-radius:clamp(4px,.6vw,8px)`, `box-shadow:0 30px 90px rgba(0,0,0,.55)`.
- Tre pulsanti circolari (prev 52px, next 52px, chiudi 44px): `border:1px solid rgba(255,255,255,.22)`, `background:rgba(255,255,255,.06)`, `color:rgba(255,255,255,.86)`, mono 15–16px; hover `background:rgba(255,255,255,.16)`, `border-color:rgba(255,255,255,.5)`; transizione `.25s ease`.
- Contatore in basso al centro: mono 11px, `letter-spacing:.18em`, uppercase, `rgba(255,255,255,.6)`, formato `03 / 17`.
- Tastiera: `Esc` chiude, `←`/`→` navigano. Alla apertura `document.body.style.overflow = 'hidden'`, ripristinato alla chiusura (anche in unmount).

### 4. Studio
- **Layout**: colonna, gap `clamp(30px,5vh,64px)`, padding `clamp(56px,9vh,120px) calc(clamp(18px,5vw,64px) + 44px) clamp(40px,7vh,90px)`.
- **Blocco intro**: griglia `repeat(auto-fit, minmax(320px, 1fr))`, gap `clamp(24px,4vw,72px)`, `align-items:start`.
  - `h2`: `font-weight:300`, `font-size:clamp(1.9rem,4.2vw,3.6rem)`, `line-height:1.02`, `letter-spacing:-0.04em`, `text-wrap:balance`; la parola *sportivo* in Instrument Serif italic.
  - Paragrafi: `max-width:56ch`, `font-weight:300`, `font-size:clamp(1rem,1.25vw,1.2rem)`, `line-height:1.55`, `color:rgba(16,17,20,0.68)`, gap `clamp(14px,2vh,22px)`.
- **Card servizi**: `background:rgba(16,17,20,0.07)`, `border-radius:clamp(8px,1vw,14px)`, `padding:clamp(20px,2.2vw,32px)`, colonna con gap `clamp(10px,1.4vh,16px)`.
  - Etichetta `Servizi`: mono `clamp(9px,1.05vw,11px)`, `letter-spacing:.16em`, uppercase, `rgba(16,17,20,0.55)`, `margin-bottom:clamp(6px,1.2vh,14px)`.
  - Ogni voce: griglia `auto 1fr`, gap `clamp(10px,1.2vw,18px)`, `align-items:baseline`. Numero in mono 11px `letter-spacing:.16em` `rgba(16,17,20,0.45)`; titolo `h3` `font-weight:300`, `font-size:clamp(1.3rem,2.2vw,2rem)`, `line-height:1.1`, `letter-spacing:-0.03em`. **Nessuna linea divisoria.**

### 5. Contatti
- `min-height:72dvh`, colonna centrata verticalmente, gap `clamp(24px,4vh,48px)`, padding `clamp(56px,9vh,110px) calc(clamp(18px,5vw,64px) + 44px)`.
- `h2` centrato, `max-width:20ch`, `font-weight:300`, `font-size:clamp(2.2rem,6vw,5.4rem)`, `line-height:.98`, `letter-spacing:-0.04em`, `text-wrap:balance`; le parole *storie* e *squadre e atleti* in Instrument Serif italic (la congiunzione "e" resta in Archivo).
- Riga contatti: **flex** con `flex-wrap:wrap`, `justify-content:center`, gap `clamp(20px,3vw,56px) clamp(32px,6vw,96px)`, `text-align:center`, mono `clamp(11px,1.2vw,14px)`, `letter-spacing:.06em`. Tre blocchi (Email, Instagram, Sede): etichetta 10px `letter-spacing:.2em` uppercase `rgba(16,17,20,0.5)`; valore `rgba(16,17,20,0.92)`, hover `#000000`.

### 6. Footer
Centrato, padding `clamp(24px,4vh,48px) clamp(18px,3.4vw,40px)`, mono `clamp(10px,1.15vw,13px)`, `letter-spacing:.08em`, `color:rgba(16,17,20,0.6)`. Testo: `© 2026 Nicola Perantoni`.

---

## Interactions & Behavior

### Boot degli indicatori di stato
Sequenza dopo 4400 ms dal mount, poi a intervalli di 1100 ms: GPS → Device → Athlete. Ogni transizione usa un **effetto scramble**: durata 760 ms, per carattere `i` di `n` lo start è `(i/n) × (760 − 260)`, per 260 ms si mostrano caratteri casuali da `A–Z0–9`, poi il carattere finale. Al termine di ciascuna, il LED passa a verde.

### Parola rotante (hero)
Web Animations API, 1900 ms lineari per ciclo: `translateY(-100%)/opacity 0` → (16%) `translateY(0)/opacity 1` con `cubic-bezier(.3,.75,.25,1)` → (84%) invariato → (100%) `translateY(100%)/opacity 0`. `onfinish` avanza l'indice e riavvia.

### Reveal allo scroll
`IntersectionObserver` (`threshold:0.1`, `rootMargin:'0px 0px -6% 0px'`), `unobserve` al primo ingresso, attributo `data-seen="1"`. Rescan ogni 600 ms per i nodi aggiunti dopo.
- **Blocchi generici** (`[data-reveal="up"]`): `revealUp .85s cubic-bezier(.2,.7,.2,1) both` — da `opacity:0; translateY(24px)`.
- **Foto — "contour wipe"**: l'immagine ha una maschera a bande orizzontali
  `mask-image: linear-gradient(to bottom, #000 0 46%, transparent 46%)`, `mask-repeat:repeat`, `mask-size:100% 320%`.
  Animazione `contourWipe 1.15s cubic-bezier(.2,.7,.2,1) both`, `transform-origin:50% 60%`:
  `0%` → `opacity:0; mask-size:100% 9px; rotateX(10deg) rotateY(-5deg) translateZ(-120px) scale(1.05)`;
  `30%` → `opacity:1`; `100%` → `mask-size:100% 320%; rotateX(0) rotateY(0) translateZ(0) scale(1)`.
  Il contenitore `.flow` fornisce la prospettiva: `perspective:1600px`, `perspective-origin:50% 40%`.
- **Note manifesto**: due livelli.
  1. La cella ruota in ingresso: `textTilt 1s cubic-bezier(.2,.7,.2,1) both`, da `rotateX(9deg) translateZ(-90px)` a piatto (la cella ha `transform-style:preserve-3d`).
  2. Il testo è spezzato **in righe reali** e ogni riga sale dal basso: ogni riga è un `<span>` `display:block; overflow:hidden` che contiene un inner `display:block` con `transform:translateY(108%)` → `0`, `transition:transform .82s cubic-bezier(.2,.7,.2,1)`, `transition-delay: indiceRiga × 90ms`.
  La suddivisione in righe si ottiene misurando `offsetTop` di ogni parola (tolleranza 3px) e va **ricalcolata** quando la larghezza della cella cambia di oltre 4px (`ResizeObserver`, debounce 120 ms).

### Mappa topografica (canvas)
1. **Campo di altitudine**: value noise deterministico (LCG seed `20240917`, tabella 4096 valori, smoothstep) su tre ottave: `f=2.2 × .68 + f=4.6 × .24 + f=9.5 × .08`. Griglia di campionamento 210 colonne × proporzionale in righe.
2. **Curve di livello**: marching squares su 18 livelli (offset `+0.137` di passo per evitare artefatti), risoluzione dei casi ambigui con il valore medio della cella; i segmenti vengono ricuciti in polilinee (chiavi a mezzo pixel), scartate quelle sotto 6 punti, poi lisciate (5 passate di media pesata 1-2-1) e ricampionate a passo 6px.
   - Curve **indice** (ogni 5ª): `lineWidth 1.5`, `rgba(255,255,255,0.22)`. Intermedie: `lineWidth 0.8`, `rgba(255,255,255,0.1)`. `lineCap`/`lineJoin` round.
3. **Quote**: valore = `round((320 + normalizzato × 340) / 20) × 20` → da 320 a 660 m con equidistanza 20 m. Font mono 10px (indice) / 9px, colore `rgba(255,255,255,0.26)` / `rgba(255,255,255,0.14)`, ruotato lungo la tangente (normalizzata tra ±90°), con "buco" nella curva sotto l'etichetta (`destination-out` su un rettangolo `tw+8 × 14`). Filtri: solo curve con ≥95 punti, niente etichette a meno di 40px dai bordi orizzontali / 24px dai verticali, distanza minima 260px tra etichette uguali e 110px tra etichette diverse.
4. **Marker**: 10 di default (prop `markers`, 0–16) distribuiti sulle 8 curve indice più lunghe; raggio 3.4–3.9px, colore = accento. Velocità 7–10.2 px/s, un marker su tre in direzione opposta. Due marker aggiuntivi vengono ancorati nell'area in alto a sinistra (x<50%, y<42%) per riempirla. Vincoli: marker sulla stessa curva condividono velocità e direzione con `t` equidistanti (non si raggiungono mai); spaziatura minima globale 90px (fino a 9 tentativi di spostamento, altrimenti il marker viene scartato).
5. **Etichette dei marker** (mono 500 11px, `accento @ 55%`, sopra il punto, clampate nei bordi):
   - **Coordinate GPS** casuali in gradi/minuti/secondi (`45°12'33"N 11°53'07"E`). Ciclo: attesa 1.5–15.5s → in 900 ms (scramble su `0123456789°'"NSEW`) → hold 4400 ms → out 700 ms → attesa 6–24s.
   - Quando il marker non mostra coordinate mostra un'**attività** da un pool di 16 (`THRESHOLD EFFORT`, `HILL REPEATS`, `ZONE 4`, `NEGATIVE SPLIT`, `LONG RIDE`, `RECOVERY SPIN`, `COOLING DOWN`, `OFF SEASON`, `RUNNING`, `CLIMBING`, `DESCENDING`, `TRACK SESSION`, `TIME TRIAL`, `OPEN WATER SWIM`, `TRAIL SESSION`, `TEAM CAMP`), evitando duplicati entro 520px; in 800 ms, out 620 ms, scramble su `A–Z`.
   - I marker nella zona centrale-bassa (|x/w − .5| < .3 e y/h > .42) non mostrano etichette, per non disturbare la headline.
6. **Linee di collegamento**: al massimo 4 attive, nuova ogni 350–1250 ms tra due marker "accesi" a distanza 120–520px. Tracciamento progressivo con easing `1−(1−x)³` in 900 ms, hold 3200 ms (minimo 1500), uscita 700 ms. Tratto `lineWidth 1`, colore accento con **flicker** casuale di opacità (0.30–0.52, con calo a ~0.06 nel 5% dei frame) e tratteggio casuale nel 12% dei frame.
7. **"Connection failed"**: ogni 22–38s una coppia a distanza 200–460px genera un collegamento che dopo ~810 ms diventa rosso `rgba(214,67,47,…)`, con anelli attorno ai due marker (raggio +3.5px, `lineWidth 1`) e la scritta `CONNECTION FAILED` (mono 600 11px) al centro, ruotata lungo la linea, in scramble su `A–Z#/*`, con blink (25% di opacità nel 7% dei frame). Vita 3400 ms, poi i marker tornano al ciclo normale.

### prefers-reduced-motion
Quando attivo: nessuno scroll smooth; tutte le animazioni/transizioni azzerate (`.001ms`); maschere del wipe rimosse e foto a `opacity:1` senza trasformazioni; parola rotante ferma; scramble sostituito da un cambio diretto dopo 1200 ms; mappa disegnata **un solo frame** (marker fermi, nessuna linea né etichetta animata); righe di testo già in posizione.

### Responsive
Unico punto di rottura sostanziale: le colonne del flusso (3 / 2 / 1) alle soglie 1000px e 620px di larghezza utile. Tutto il resto scala con `clamp()`. Le griglie `auto-fit minmax(320px, 1fr)` di Studio collassano a una colonna sotto ~700px.

---

## State Management
Stato del componente principale:
- `prog` (0–1), `veilFading`, `veilDone` — overlay di caricamento.
- `st1/st2/st3` (testi di stato) e `ok1/ok2/ok3` (LED verdi).
- `lbList: string[]`, `lbIdx: number`, `lbOpen: boolean`, `lbShown: boolean` — lightbox (`lbShown` separato da `lbOpen` per avere il fade in/out).
Stato fuori da React (ref/istanza, per non ri-renderizzare a 60fps): `topoPaths`, `topoMarks` (con `t`, `sp`, `dir`, `r`, `pos`, `ang`, `gps`, `act`), `links`, timer del boot, `wordI`.
Nessun fetch: le immagini sono statiche e non c'è backend. Il grafico/widget Strava è stato **rimosso** dal design: se in futuro si vuole reintrodurre, servirà OAuth Strava e un piccolo servizio server-side per il token (non fattibile da pagina statica).

Props/tweak esposti dal prototipo (utili come configurazione):
| prop | tipo | default | note |
|---|---|---|---|
| `accent` | color | `#c8b892` | colore marker, etichette e linee; alternative `#5ee08a`, `#e8912f`, `#9fb8c8` |
| `markers` | int 0–16 | `10` | numero di marker GPS |
| `showElevation` | boolean | `true` | mostra/nasconde le quote sulle curve |

### Topo Map Module — API (implementazione)

La logica del canvas è stata estratta in `src/lib/topo-map.ts`, un modulo TypeScript isolato senza dipendenze da Astro o da altri framework (nessun import al di fuori di `topo-map.ts` stesso). Espone una singola factory:

```ts
import { createTopoMap } from './lib/topo-map';

const controller = createTopoMap(staticCanvas, markerCanvas, {
  accent: '#c8b892',   // colore marker, etichette e linee
  markers: 10,         // int 0–16, numero di marker GPS
  showElevation: true, // mostra/nasconde le quote sulle curve
});

controller.setOptions({ accent: '#5ee08a' }); // ridisegna con i nuovi parametri
controller.destroy();                          // ferma il loop e rimuove i listener
```

- `staticCanvas`: il `<canvas>` delle curve di livello + quote (disegnato una volta, ridisegnato su resize).
- `markerCanvas`: il `<canvas>` sovrapposto dei marker/etichette/linee (animato via `requestAnimationFrame`).
- Rispetta `prefers-reduced-motion` internamente: se attivo, disegna un solo frame (marker fermi, nessuna linea né etichetta) e non richiede altri frame.
- Istanziato in `src/components/Hero.astro`, con i default sopra passati come props del componente e configurati in `src/pages/index.astro`.

---

## Design Tokens

### Colori
| Ruolo | Valore |
|---|---|
| Sfondo pagina | `rgb(175,175,175)` |
| Testo principale | `#101114` |
| Testo secondario su grigio | `rgba(16,17,20,0.68)` |
| Testo tenue / etichette | `rgba(16,17,20,0.55)` · `rgba(16,17,20,0.45)` |
| Card servizi | `rgba(16,17,20,0.07)` |
| Pannello hero / lightbox | `#000000` · `rgba(12,12,14,0.95)` |
| Testo su nero | `#ffffff` · `rgba(255,255,255,0.66)` · `rgba(255,255,255,0.62)` |
| Accento (mappa) | `#c8b892` |
| LED ok | `#5ee08a` (glow `rgba(94,224,138,0.55)`) |
| LED boot | `#e8912f` (glow `rgba(232,145,47,0.6)`) |
| Errore / connection failed | `rgba(214,67,47,…)` |
| Curve indice / intermedie | `rgba(255,255,255,0.22)` / `rgba(255,255,255,0.1)` |
| Quote indice / intermedie | `rgba(255,255,255,0.26)` / `rgba(255,255,255,0.14)` |

### Tipografia
- **Archivo** (Google Fonts) pesi 300 / 400 / 500 / 600 — titoli e testo corrente. Il peso di base del sito è **300**.
- **IBM Plex Mono** 400 / 500 — etichette, dati, footer, contatti.
- **Instrument Serif** italic 400 — accenti editoriali dentro i titoli.
- Scala (tutte con `clamp`): hero headline `2.2–7rem` / `line-height 1.14` / `-0.035em`; h2 contatti `2.2–5.4rem` / `.98` / `-0.04em`; h2 studio `1.9–3.6rem` / `1.02` / `-0.04em`; note manifesto `1.6–2.9rem` / `1.2` / `-0.02em`; h3 servizi `1.3–2rem` / `1.1` / `-0.03em`; intro hero `1.05–1.6rem` / `1.45`; corpo studio `1–1.2rem` / `1.55`; mono dati `10–14px` / `letter-spacing .06–.2em`.
- `text-wrap: balance` sui titoli, `pretty` sui paragrafi.

### Spaziature
Tutte fluide: padding di sezione `clamp(56px, 9vh, 120px)` verticale e `calc(clamp(18px, 5vw, 64px) + 44px)` orizzontale; gap di griglia foto `clamp(16px, 2.4vw, 36px)`; gap interni `8px`, `clamp(10px,1.4vh,16px)`, `clamp(14px,2vh,22px)`, `clamp(24px,4vw,72px)`.

### Raggi e ombre
- Raggio celle/card: `clamp(8px, 1vw, 14px)`. Lightbox immagine: `clamp(4px, .6vw, 8px)`. Pulsanti: cerchio.
- Unica ombra: `0 30px 90px rgba(0,0,0,0.55)` sull'immagine del lightbox. Glow dei LED via `box-shadow: 0 0 8px <colore>`.

### Easing e durate
`cubic-bezier(.2,.7,.2,1)` è l'easing firma (reveal, wipe, righe). Durate ricorrenti: 320 ms (fade lightbox), 550 ms (uscita veil), 820 ms (righe di testo), 850 ms (revealUp), 1000 ms (tilt testo), 1150 ms (contour wipe), 1900 ms (parola rotante).

---

## Assets
17 fotografie WebP verticali in `uploads/`, raggruppate per progetto:
- **PH Apparel × Cérvelo** — `ph-x-cervelo-1,2,3,4.webp`
- **Zullo Bike** — `zullo-1,6,3,4.webp`
- **Ristora** — `ristora-1,2,6,4.webp`
- **PH Apparel Spring Camp** — `ph-training-camp-3,9,8,12.webp`

Sono foto del cliente, incluse nel pacchetto. In produzione: generare varianti responsive (`srcset`), mantenere WebP/AVIF, `loading="eager"` per le prime (sono precaricate dal veil) e `decoding="async"`. Nessuna icona: gli unici glifi sono caratteri tipografici (`✣`, `←`, `→`, `✕`, `↗`).

Il pool `uploads/` del progetto originale contiene anche `race-day-*` e `trail-run-*`, **non usati** nel design attuale.

## Content (copy definitivo)

**Hero** — headline: `Corro / Pedalo / Cammino / Viaggio` (rotante) + *quindi* + **fotografo**.
Intro, tre paragrafi:
1. `Mi occupo di fotografia sportiva. Sono di Verona, ma mi sposto ovunque.`
2. `Seguo squadre, atleti e federazioni durante tutta la stagione: dal ritiro estivo alla volata finale. Realizzo editoriali e campagne per brand, in studio e sul campo.`
3. `Cerco il gesto vero, l'istante prima del risultato. Su qualsiasi terreno.`

**Note manifesto** (nel flusso, nell'ordine):
1. `Amo il movimento, l'adrenalina, la tranquillità e il silenzio che anticipano la performance, il sogno del record personale, la forza, la mentalità e la grinta necessarie per raggiungere il proprio obiettivo. Qualsiasi esso sia.`
2. `Mi nutro di tutto ciò che può stimolare la mia creatività: arte, musica, libri, cinema e design.`
3. `Cerco il silenzio, la natura, il tempo passato con il proprio sé.`
4. `Coltivo la contaminazione tra persone, discipline e arti.`
5. `La fotografia è la mia cura.`

**Studio** — titolo: `Sono un fotografo sportivo, ma anche un atleta.` Paragrafi:
1. `Conosco lo sport perché lo vivo in prima persona ed è questo che mi permette di lavorare a stretto contatto con atleti e brand.`
2. `Lavoro da Verona su tutta Italia e all'estero, con squadre, federazioni e brand tecnici — tra gli altri PH Apparel, Cérvelo, Zullo Bike e Ristora.`

**Servizi**: `01 Gare ed Eventi` · `02 Training Camp` · `03 Campagne ed editoriali` · `04 Ritratti` · `05 Video`.

**Contatti** — titolo: `Racconto storie di brand, gare, squadre e atleti.`
Email `nicola.perantoni@gmail.com` · Instagram `@nicolaperantoni` (`https://instagram.com/nicolaperantoni`) · Sede `Italia — Disponibile ovunque`.

**Footer**: `© 2026 Nicola Perantoni`.

## SEO — stato attuale

Dominio definitivo: **`nicolaperantoni.com`** (servito su `www.nicolaperantoni.com`: su Vercel l'apex fa redirect 308 a `www`, quindi tutti gli URL assoluti/canonici usano la forma con `www` per farla coincidere con l'URL realmente servito).

Già nel design e implementato in `src/layouts/BaseLayout.astro`: `<title>`, `description`, `author`, `robots`, `theme-color: #afafaf`, Open Graph (`type`, `locale it_IT`, `site_name`, `title`, `description`, `image`, `image:alt`), Twitter card `summary_large_image`, JSON-LD `ProfessionalService` (sede Verona, email, `sameAs` Instagram, `makesOffer` con i cinque servizi), `alt` su tutte le foto (`Fotografia sportiva di Nicola Perantoni — <progetto>`).

Completato in fase di sviluppo:
1. URL **assoluti** (`https://www.nicolaperantoni.com/...`) per `og:image`, `twitter:image` e l'`image` del JSON-LD.
2. `og:url` e `<link rel="canonical">` puntano a `https://www.nicolaperantoni.com/`.
3. Immagine di preview social dedicata, **JPG 1200×630** (`public/og-image.jpg`), generata da `scripts/generate-og-image.mjs` (foto di copertina + overlay con nome e claim) — le foto del flusso restano verticali e in WebP, non adatte a un crop 1200×630.
4. `lang="it"` sull'elemento `<html>`, `sitemap.xml`/`sitemap-index.xml` generata a build tramite `@astrojs/sitemap` (richiede `site` in `astro.config.mjs`), `public/robots.txt`, favicon (`public/favicon.svg` + `favicon.ico` + `apple-touch-icon.png`, generati da `scripts/generate-icons.mjs`).

## Files
- `Nicola Perantoni.dc.html` — il design completo (markup + logica + stili inline). Riferimento unico; vedere la nota sul runtime in *About the Design Files*.
- `uploads/` — le 17 fotografie usate dal flusso.
