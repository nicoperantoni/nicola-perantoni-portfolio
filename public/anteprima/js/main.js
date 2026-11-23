// Punto d'ingresso dell'anteprima: monta lo scroll e avvia il loader.
// GSAP e ScrambleTextPlugin arrivano dagli script CDN in <head> (globali).
import { PHOTOS, buildTrack, fitTitles, fillContacts } from './contenuto.js';
import { initScroll } from './scroll.js';
import { initCursor } from './cursore.js';
import { initLoader } from './loader.js';
import { idleRoll } from './titolo.js';
import { initMenu } from './menu.js';

const TITLE = 'Studio Devastante';
const stage = document.getElementById('stage');
const track = document.getElementById('track');
const headline = document.getElementById('headline');

const { panels, imgs, perCopy } = buildTrack(track);
document.fonts.ready.then(() => fitTitles(track));
fillContacts(track);

const { layout, goTo } = initScroll({ stage, track, panels, imgs, perCopy });
initMenu({ goTo });
initCursor(stage, document.getElementById('cursor'));
initLoader({ title: TITLE, photos: PHOTOS, panels, layout, onDone: () => idleRoll(headline, TITLE) });
