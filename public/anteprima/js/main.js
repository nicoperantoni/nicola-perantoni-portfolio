// Punto d'ingresso dell'anteprima: monta lo scroll e avvia il loader.
// GSAP e ScrambleTextPlugin arrivano dagli script CDN in <head> (globali).
import { PHOTOS, buildTrack, fitTitles, fillContacts } from './contenuto.js';
import { initScroll } from './scroll.js';
import { initCursor } from './cursore.js';
import { initLoader } from './loader.js';
import { initMenu } from './menu.js';
import { initPortfolioCards } from './portfolio.js';

const TITLE = 'Studio Devastante';
const stage = document.getElementById('stage');
const track = document.getElementById('track');

const { panels, imgs, perCopy } = buildTrack(track);
document.fonts.ready.then(() => fitTitles(track));
// Recapiti nel menu (email e WhatsApp ricomposti lato client).
fillContacts(document);

const { layout } = initScroll({ stage, track, panels, imgs, perCopy });
initPortfolioCards(track);
initMenu();
initCursor(stage, document.getElementById('cursor'));
initLoader({ title: TITLE, photos: PHOTOS, panels, layout });
