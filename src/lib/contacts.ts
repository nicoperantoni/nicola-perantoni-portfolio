// Recapiti ricomposti lato client: nell'HTML non ci sono né l'email né il
// numero, così i raccoglitori di indirizzi non li trovano.
export function fillContacts() {
  const email = 'alocin'.split('').reverse().join('') + '@' + 'oiduts.etnatsaved'.split('').reverse().join('');
  const ph = '4562717643 93'.replace(/\s/g, '').split('').reverse().join('');
  document.querySelectorAll<HTMLAnchorElement>('[data-email]').forEach((e) => {
    e.href = 'mailto:' + email;
    e.textContent = email;
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-wa]').forEach((w) => {
    w.href = 'https://wa.me/' + ph;
    w.textContent = `+${ph.slice(0, 2)} ${ph.slice(2, 5)} ${ph.slice(5, 8)} ${ph.slice(8)} ↗\uFE0E`; // \uFE0E: freccia come testo, non emoji (iPhone)
  });
}
