/**
 * Dizionario di tutti i testi del sito, per lingua. Unica fonte di verità
 * per le stringhe visibili — componenti e SEO leggono da qui via
 * `useTranslations(lang)` (vedi utils.ts), non hanno mai copy hardcoded.
 */

export const locales = ['it', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'it';

export const ui = {
  it: {
    seo: {
      title: 'Nicola Perantoni — Fotografo sportivo, Verona',
      description:
        "Fotografo sportivo con base a Verona. Gare ed eventi, ritiri e training camp, campagne e editoriali per brand, ritratti d'atleta e video. Disponibile in Italia e all'estero.",
      ogDescription:
        'Seguo squadre, atleti e federazioni durante tutta la stagione: dal ritiro estivo alla volata finale. Editoriali e campagne per brand, in studio e sul campo.',
      twitterDescription: 'Fotografia sportiva: gare, ritiri, editoriali e campagne per brand. Verona, Italia.',
      ogImageAlt: 'Nicola Perantoni — fotografo sportivo, Verona',
      ogLocale: 'it_IT',
      jsonLdDescription:
        "Fotografia sportiva: gare ed eventi, ritiri e training camp, campagne e editoriali per brand, ritratti d'atleta e video.",
      jsonLdJobTitle: 'Fotografo sportivo',
      jsonLdOffers: ['Gare ed eventi', 'Ritiri e training camp', 'Campagne e editoriali', "Ritratti d'atleta", 'Video'],
    },
    hero: {
      words: ['Corro', 'Pedalo', 'Cammino', 'Viaggio'],
      then: 'quindi',
      role: 'fotografo',
      paragraphs: [
        'Sono un fotografo di sport con base a Verona.',
        "Realizzo reportage, editoriali e campagne, in studio o all'aperto. Still-life e video.",
        'Le mie immagini raccontano una storia: cerco sempre di andare oltre, come un atleta che insegue il proprio limite.',
      ],
    },
    work: {
      altPrefix: 'Fotografia sportiva di Nicola Perantoni',
      manifesto: [
        'Amo il movimento, l’adrenalina, la tranquillità e il silenzio che anticipano la performance, il sogno del record personale, la forza, la mentalità e la grinta necessarie per raggiungere il proprio obiettivo. Qualsiasi esso sia.',
        'Mi nutro di tutto ciò che può stimolare la mia creatività: arte, musica, libri, cinema e design.',
        'Coltivo la contaminazione tra persone, discipline e arti.',
      ],
    },
    studio: {
      servicesLabel: 'Servizi',
      services: [
        { n: '01', title: 'Gare ed Eventi' },
        { n: '02', title: 'Training Camp' },
        { n: '03', title: 'Campagne ed editoriali' },
        { n: '04', title: 'Ritratti' },
        { n: '05', title: 'Video' },
      ],
    },
    contacts: {
      emailLabel: 'Email',
      instagramLabel: 'Instagram',
      locationLabel: 'Sede',
      locationValue: 'Italia — Disponibile ovunque',
    },
    lightbox: {
      prev: 'Foto precedente',
      next: 'Foto successiva',
      close: 'Chiudi',
    },
    langSwitch: {
      label: 'EN',
      aria: 'Switch to English',
    },
  },
  en: {
    seo: {
      title: 'Nicola Perantoni — Sports Photographer, Verona',
      description:
        'Sports photographer based in Verona, Italy. Races and events, training camps, brand campaigns and editorials, athlete portraits and video. Available in Italy and abroad.',
      ogDescription:
        'I follow teams, athletes and federations throughout the season: from summer training camps to the final sprint. Editorials and brand campaigns, in studio and on location.',
      twitterDescription: 'Sports photography: races, training camps, editorials and brand campaigns. Verona, Italy.',
      ogImageAlt: 'Nicola Perantoni — sports photographer, Verona',
      ogLocale: 'en_US',
      jsonLdDescription:
        'Sports photography: races and events, training camps, brand campaigns and editorials, athlete portraits and video.',
      jsonLdJobTitle: 'Sports Photographer',
      jsonLdOffers: ['Races and events', 'Training camps', 'Campaigns and editorials', 'Athlete portraits', 'Video'],
    },
    hero: {
      words: ['Run', 'Ride', 'Walk', 'Travel'],
      then: 'then',
      role: 'shoot',
      paragraphs: [
        "I'm a sports photographer based in Verona.",
        'I shoot reportage, editorials and campaigns, in studio or outdoors. Still life and video.',
        'My images tell a story: I always try to go further, like an athlete chasing their own limit.',
      ],
    },
    work: {
      altPrefix: 'Sports photography by Nicola Perantoni',
      manifesto: [
        'I love movement, adrenaline, the calm and silence that come before performance, the dream of a personal best, the strength, the mindset and the grit needed to reach your goal. Whatever it may be.',
        'I feed on everything that can spark my creativity: art, music, books, film and design.',
        'I cultivate cross-pollination between people, disciplines and arts.',
      ],
    },
    studio: {
      servicesLabel: 'Services',
      services: [
        { n: '01', title: 'Races & Events' },
        { n: '02', title: 'Training Camps' },
        { n: '03', title: 'Campaigns & Editorials' },
        { n: '04', title: 'Portraits' },
        { n: '05', title: 'Video' },
      ],
    },
    contacts: {
      emailLabel: 'Email',
      instagramLabel: 'Instagram',
      locationLabel: 'Location',
      locationValue: 'Italy — Available anywhere',
    },
    lightbox: {
      prev: 'Previous photo',
      next: 'Next photo',
      close: 'Close',
    },
    langSwitch: {
      label: 'IT',
      aria: 'Passa all’italiano',
    },
  },
} as const;
