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
    topbar: {
      pdfLink: 'Scarica il mio Portfolio',
      instagramAria: 'Apri il profilo Instagram',
      emailAria: 'Invia una email',
      whatsappAria: 'Scrivi su WhatsApp',
    },
    hero: {
      words: ['Corro', 'Pedalo', 'Cammino', 'Viaggio'],
      then: 'quindi',
      role: 'fotografo',
      tagline: 'Creo ergo sum',
      paragraphs: [
        'Sono Nicola. Fotografo con base a Verona. Realizzo reportage, editoriali e campagne, in studio o outdoor. Still‑life e video.',
        'Con le mie immagini voglio raccontare una storia. Grazie a essa cerco sempre di alzare l\'asticella, come un atleta.',
      ],
    },
    work: {
      altPrefix: 'Fotografia sportiva di Nicola Perantoni',
      manifesto: [
        'Amo il movimento, l’adrenalina, la tranquillità e il silenzio che anticipano la performance, il sogno del record personale, la forza, la mentalità e la grinta necessarie per raggiungere il proprio obiettivo.',
      ],
      ctaTitle: 'Vuoi vedere tutto il mio lavoro?',
      ctaButton: 'Scarica il mio Portfolio',
    },
    studio: {
      servicesLabel: 'Servizi',
      services: [
        { n: '01', title: 'Reportage di gare ed eventi', desc: 'Dalla partenza al traguardo.' },
        { n: '02', title: 'Campagne ed editoriali', desc: 'Shooting per brand e magazine, in studio oppure on site.' },
        { n: '03', title: 'Fotografia still-life', desc: 'Prodotti, materiali, texture e componenti tecnici.' },
        { n: '04', title: 'Ritratti', desc: 'Dinamici, primi piani e contestualizzati.' },
        { n: '05', title: 'Video', desc: 'Contenuti social oriented ed editoriali.' },
      ],
    },
    contacts: {
      emailLabel: 'Email',
      whatsappLabel: 'WhatsApp',
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
    topbar: {
      pdfLink: 'Download my Portfolio',
      instagramAria: 'Open Instagram profile',
      emailAria: 'Send an email',
      whatsappAria: 'Message on WhatsApp',
    },
    hero: {
      words: ['Run', 'Ride', 'Walk', 'Travel'],
      then: 'then',
      role: 'shoot',
      tagline: 'Creo ergo sum',
      paragraphs: [
        "I'm Nicola. Sports photographer based in Verona. I shoot reportage, editorials and campaigns, in studio or outdoors. Still‑life and video.",
        'With my images I want to tell a story. Through it, I always try to raise the bar, like an athlete.',
      ],
    },
    work: {
      altPrefix: 'Sports photography by Nicola Perantoni',
      manifesto: [
        'I love movement, adrenaline, the calm and silence that come before performance, the dream of a personal best, the strength, the mindset and the grit needed to reach your goal.',
      ],
      ctaTitle: 'Want to see all my work?',
      ctaButton: 'Download my Portfolio',
    },
    studio: {
      servicesLabel: 'Services',
      services: [
        { n: '01', title: 'Race & event coverage', desc: 'Start to finish.' },
        { n: '02', title: 'Campaigns & editorials', desc: 'Shoots for brands and magazines, in studio or on site.' },
        { n: '03', title: 'Still-life photography', desc: 'Products, materials, textures and technical components.' },
        { n: '04', title: 'Portraits', desc: 'Dynamic, close-ups and in context.' },
        { n: '05', title: 'Video', desc: 'Social-oriented and editorial content.' },
      ],
    },
    contacts: {
      emailLabel: 'Email',
      whatsappLabel: 'WhatsApp',
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
