/**
 * Dizionario di tutti i testi del sito, per lingua, e percorsi delle pagine.
 * Unica fonte di verità per le stringhe visibili: componenti e SEO leggono
 * da qui via `useTranslations(lang)` (vedi utils.ts).
 */

export const locales = ['it', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'it';

export const pages = ['home', 'services', 'manifesto', 'contact'] as const;
export type Page = (typeof pages)[number];

/** Percorso di ogni pagina in ciascuna lingua (italiano senza prefisso). */
export const routes: Record<Page, Record<Locale, string>> = {
  home: { it: '/', en: '/en/' },
  services: { it: '/servizi/', en: '/en/services/' },
  manifesto: { it: '/manifesto/', en: '/en/manifesto/' },
  contact: { it: '/contatti/', en: '/en/contact/' },
};

export const ui = {
  it: {
    site: {
      name: 'Studio Devastante',
      legal: '© 2026 Studio Devastante di Nicola Perantoni · P.IVA 04623590231',
      langLabel: 'Lingua',
    },
    seo: {
      ogLocale: 'it_IT',
      jobTitle: 'Fotografo',
      offers: ['Reportage di gare ed eventi', 'Campagne ed editoriali', 'Fotografia still-life', 'Ritratti'],
      ogImageAlt: 'Studio Devastante — fotografia di Nicola Perantoni, Verona',
      pages: {
        home: {
          title: 'Studio Devastante — Fotografia di Nicola Perantoni, Verona',
          description:
            'Studio Devastante è lo studio fotografico di Nicola Perantoni, con base a Verona: reportage, editoriali e campagne, in studio o outdoor. Still-life e video.',
        },
        services: {
          title: 'Servizi — Studio Devastante',
          description:
            'Reportage di gare ed eventi, campagne ed editoriali, fotografia still-life e ritratti. Studio Devastante, Verona: disponibile in Italia e all’estero.',
        },
        manifesto: {
          title: 'Manifesto — Studio Devastante',
          description:
            'Il movimento, la creatività, il silenzio, la contaminazione tra persone e discipline: il manifesto di Nicola Perantoni, fotografo.',
        },
        contact: {
          title: 'Contatti — Studio Devastante',
          description:
            'Contatta Studio Devastante: email, WhatsApp e Instagram. Con base a Verona, disponibile ovunque.',
        },
      },
    },
    menu: {
      open: 'Menu',
      close: 'Chiudi',
      aria: 'Sezioni',
      items: { home: 'Home', services: 'Servizi', manifesto: 'Manifesto', contact: 'Contatti' },
    },
    contacts: {
      email: 'Email',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      location: 'Sede',
      locationValue: 'Italia — Disponibile ovunque',
    },
    home: {
      stageAria: 'Foto e informazioni. Scorri con la rotella, trascina o usa le frecce.',
      photoAlt: (i: number, n: number) => `Fotografia di Nicola Perantoni, ${i} di ${n}`,
      cursor: '← Scorri →',
      profileTitle: 'Profilo',
      profile: [
        'Sono Nicola. Fotografo con base a Verona. Realizzo reportage, editoriali e campagne, in studio o outdoor. Still‑life e video.',
        "Con le mie immagini voglio raccontare una storia. Grazie a essa cerco sempre di alzare l'asticella, come un atleta.",
        'Amo il movimento, l’adrenalina, la tranquillità e il silenzio che anticipano la performance, il sogno del record personale, la forza, la mentalità e la grinta necessarie per raggiungere il proprio obiettivo.',
      ],
      portfolioTitle: 'Portfolio',
      portfolioButton: 'Scarica il Portfolio (PDF)',
      portfolioPdf: '/portfolio-it.pdf',
    },
    services: {
      title: 'Servizi',
      items: [
        { title: 'Reportage di gare ed eventi', desc: 'Dalla partenza al traguardo.', photo: 'DSC00026' },
        { title: 'Campagne ed editoriali', desc: 'Shooting per brand e magazine, in studio oppure on site.', photo: 'DSC08227' },
        { title: 'Fotografia still-life', desc: 'Prodotti, materiali, texture e componenti tecnici.', photo: 'DSC08237' },
        { title: 'Ritratti', desc: 'Dinamici, primi piani e contestualizzati.', photo: 'DSC02021' },
      ],
    },
    manifesto: {
      title: 'Manifesto',
      points: [
        'Amo il movimento, l’adrenalina, la tranquillità e il silenzio che anticipano la performance, il sogno del record personale, la forza, la mentalità e la grinta necessarie per raggiungere il proprio obiettivo. Qualsiasi esso sia',
        'Mi nutro di tutto ciò che può stimolare la mia creatività: arte, musica, libri, cinema e design',
        'Cerco il silenzio, la natura, il tempo passato con il proprio sé',
        'Coltivo la contaminazione tra persone, discipline e arti',
        'La fotografia è la mia cura',
      ],
    },
    contact: {
      title: 'Contatti',
      intro:
        'Mi piace conoscere nuove persone. Mi piace affrontare nuove sfide. Mi piace anche il caffè: contattami, e prendiamone uno insieme.',
    },
  },
  en: {
    site: {
      name: 'Studio Devastante',
      legal: '© 2026 Studio Devastante by Nicola Perantoni · VAT IT04623590231',
      langLabel: 'Language',
    },
    seo: {
      ogLocale: 'en_US',
      jobTitle: 'Photographer',
      offers: ['Race and event coverage', 'Campaigns and editorials', 'Still-life photography', 'Portraits'],
      ogImageAlt: 'Studio Devastante — photography by Nicola Perantoni, Verona',
      pages: {
        home: {
          title: 'Studio Devastante — Photography by Nicola Perantoni, Verona',
          description:
            'Studio Devastante is the photography studio of Nicola Perantoni, based in Verona, Italy: reportage, editorials and campaigns, in studio or outdoors. Still-life and video.',
        },
        services: {
          title: 'Services — Studio Devastante',
          description:
            'Race and event coverage, campaigns and editorials, still-life photography and portraits. Studio Devastante, Verona: available in Italy and abroad.',
        },
        manifesto: {
          title: 'Manifesto — Studio Devastante',
          description:
            'Movement, creativity, silence, the cross-pollination of people and disciplines: the manifesto of photographer Nicola Perantoni.',
        },
        contact: {
          title: 'Contact — Studio Devastante',
          description:
            'Get in touch with Studio Devastante: email, WhatsApp and Instagram. Based in Verona, available anywhere.',
        },
      },
    },
    menu: {
      open: 'Menu',
      close: 'Close',
      aria: 'Sections',
      items: { home: 'Home', services: 'Services', manifesto: 'Manifesto', contact: 'Contact' },
    },
    contacts: {
      email: 'Email',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      location: 'Location',
      locationValue: 'Italy — Available anywhere',
    },
    home: {
      stageAria: 'Photos and information. Scroll with the wheel, drag or use the arrow keys.',
      photoAlt: (i: number, n: number) => `Photograph by Nicola Perantoni, ${i} of ${n}`,
      cursor: '← Scroll →',
      profileTitle: 'Profile',
      profile: [
        "I'm Nicola. Photographer based in Verona. I shoot reportage, editorials and campaigns, in studio or outdoors. Still‑life and video.",
        'With my images I want to tell a story. Through it, I always try to raise the bar, like an athlete.',
        'I love movement, adrenaline, the calm and silence that come before a performance, the dream of a personal best, the strength, the mindset and the grit it takes to reach your goal.',
      ],
      portfolioTitle: 'Portfolio',
      portfolioButton: 'Download the Portfolio (PDF)',
      portfolioPdf: '/portfolio-en.pdf',
    },
    services: {
      title: 'Services',
      items: [
        { title: 'Race and event coverage', desc: 'From start to finish.', photo: 'DSC00026' },
        { title: 'Campaigns and editorials', desc: 'Shoots for brands and magazines, in studio or on site.', photo: 'DSC08227' },
        { title: 'Still-life photography', desc: 'Products, materials, textures and technical components.', photo: 'DSC08237' },
        { title: 'Portraits', desc: 'Dynamic, close-up and in context.', photo: 'DSC02021' },
      ],
    },
    manifesto: {
      title: 'Manifesto',
      points: [
        'I love movement, adrenaline, the calm and silence that come before a performance, the dream of a personal best, the strength, the mindset and the grit it takes to reach your goal. Whatever it may be',
        'I feed on everything that can stimulate my creativity: art, music, books, cinema and design',
        'I seek silence, nature, time spent with oneself',
        'I cultivate the cross-pollination of people, disciplines and arts',
        'Photography is my cure',
      ],
    },
    contact: {
      title: 'Contact',
      intro:
        "I like meeting new people. I like taking on new challenges. I also like coffee: get in touch, and let's have one together.",
    },
  },
} as const;
