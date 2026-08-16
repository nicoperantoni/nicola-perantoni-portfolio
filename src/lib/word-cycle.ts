/**
 * Parola rotante dell'hero — Web Animations API, 1900ms lineari per ciclo:
 * entra dall'alto (16%, easing dedicato), resta ferma, esce in basso.
 * Con prefers-reduced-motion la parola resta ferma sulla prima del gruppo.
 */

export function startWordCycle(el: HTMLElement, words: string[]): () => void {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || words.length < 2) {
    el.textContent = words[0] ?? '';
    return () => {};
  }

  let wordIndex = 0;
  let cancelled = false;

  const cycle = () => {
    if (cancelled) return;
    el.getAnimations().forEach((an) => an.cancel());
    const animation = el.animate(
      [
        { transform: 'translateY(-100%)', opacity: 0, offset: 0 },
        { transform: 'translateY(0)', opacity: 1, offset: 0.16, easing: 'cubic-bezier(.3,.75,.25,1)' },
        { transform: 'translateY(0)', opacity: 1, offset: 0.84 },
        { transform: 'translateY(100%)', opacity: 0, offset: 1 },
      ],
      { duration: 1900, easing: 'linear' }
    );
    animation.onfinish = () => {
      if (cancelled) return;
      wordIndex = (wordIndex + 1) % words.length;
      el.textContent = words[wordIndex];
      cycle();
    };
  };
  cycle();

  return () => {
    cancelled = true;
    el.getAnimations().forEach((an) => an.cancel());
  };
}
