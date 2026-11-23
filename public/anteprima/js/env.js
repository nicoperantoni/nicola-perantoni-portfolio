// Preferenze del dispositivo condivise dai moduli.
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(pointer: fine)').matches;
export const isMobile = () => window.innerWidth <= 900;
