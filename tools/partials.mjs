// Pieces shared by the generated pages (tools/build-packages.mjs,
// tools/build-legal.mjs). index.html has its own copy of the footer: keep the
// two in step. `up` is the path back to the site root ('../' from a subfolder).

export const LEGAL = [
  ['privacy', 'Privacy Policy'],
  ['cookies', 'Cookie Policy'],
  ['terms', 'Terms of Use'],
];

export function footer(up = '../') {
  return `<footer class="pf-site-foot">
  <div class="pf-site-foot__inner">
    <span class="pf-site-foot__brand">BLK&middot;Remodelling</span>
    <p class="pf-site-foot__contact">
      <a href="tel:+971545979814">+971 54 597 9814</a>
      <a href="tel:+971504985529">+971 50 498 5529</a>
      <a href="mailto:branka.kugler@gmail.com">branka.kugler@gmail.com</a>
    </p>
    <nav class="pf-social" aria-label="Social media">
      <a href="https://www.instagram.com/bnb_remodelling_apartments/" aria-label="Instagram" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>
      </a>
      <a href="https://www.facebook.com/profile.php?id=61593609083694" aria-label="Facebook" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 21v-7h2.3l.4-3h-2.7V9.2c0-.9.2-1.5 1.5-1.5h1.4V5.1C16.9 5 16 5 15 5c-2.2 0-3.5 1.3-3.5 3.9V11H9v3h2.5v7Z"/></svg>
      </a>
      <a href="https://wa.me/971545979814" aria-label="WhatsApp" target="_blank" rel="noopener" data-choose="wa" aria-haspopup="menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21a9 9 0 1 0-7.8-4.5L3 21l4.7-1.2A9 9 0 0 0 12 21Z"/><path d="M8.6 9.2c0 4 3.2 7.2 7.2 7.2.5 0 1-.5.9-1.1-.1-.7-1.9-1.6-2.3-1.4-.3.1-.5.6-.9.6-.7 0-2.4-1.4-2.6-2.5-.1-.3.5-.6.7-.9.2-.3-.5-2-1.2-2.2-.6-.1-.8.3-.8.3Z" fill="currentColor" stroke="none"/></svg>
      </a>
    </nav>
    <nav class="pf-legal" aria-label="Legal">
${LEGAL.map(([slug, name]) => `      <a href="${up}legal/${slug}.html">${name}</a>`).join('\n')}
      <button type="button" data-consent-open>Cookie settings</button>
    </nav>
    <span class="pf-site-foot__copy">&copy; 2026 BLK Remodelling &middot; Ras Al Khaimah, UAE</span>
  </div>
</footer>`;
}
