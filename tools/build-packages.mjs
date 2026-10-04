// Builds the four package pages, packages/<slug>.html, from the copy below.
// Edit the text here, then run from the project root:  node tools/build-packages.mjs
// Layout/style: css/package.css (+ css/site.css for header, dock, footer).
// Copy is based only on what the client has given: the package definitions,
// the old BB Remodeling site and the home page texts. No prices or timelines.
import fs from 'node:fs';

const CAL = 'https://calendly.com/blkremoddeling/30min';
const F = '../assets/frames/';

const PACKAGES = [
  {
    slug: 'furnishing', n: '01', name: 'Furnishing', titleHtml: '<em>Furnishing</em>',
    lead: 'Every home starts empty.',
    intro: 'You have the keys to an empty apartment. We furnish it from bare floor to finished room: we choose the pieces, deliver them, assemble them and set up every room, so you walk into a home rather than a shell.',
    hero: F + 'room/0122.webp', heroAlt: 'The studio furnished: an upholstered bed and an armchair by the sea-view window.',
    included: [
      ['Layout and style', 'A plan for every room and one calm look throughout.'],
      ['Furniture for every room', 'Bed, wardrobe, sofa, dining table and chairs.'],
      ['Decoration', 'Curtains, lights, art, shelves and plants.'],
      ['Delivery and assembly', 'We receive, carry in and build everything.'],
      ['Placement and styling', 'Every piece set where it works best.'],
      ['One contact', 'From the first visit to the handover.'],
    ],
    notIncluded: [
      ['Appliances', 'basic-airbnb', 'Basic Airbnb'],
      ['Linens, towels and kitchenware', 'upscale-airbnb', 'Upscale Airbnb'],
    ],
    who: [
      ['You just got the keys', 'A new, empty unit and no time to furnish it piece by piece.'],
      ['You rent long-term', 'Tenants want it furnished; the appliances are already there or you prefer to choose them yourself.'],
      ['You live abroad', 'Someone has to pick, order, wait for deliveries and assemble. We do it for you.'],
    ],
    before: F + 'room/0001.webp', after: F + 'room/0122.webp',
    extra: [
      ['../assets/img/01-furnishing-dining.webp', 'Dining'],
      ['../assets/img/01-furnishing-kitchen.webp', 'Kitchen'],
      ['../assets/img/01-furnishing-bathroom.webp', 'Bathroom'],
    ],
    handover: 'a furnished apartment, ready to live in or to rent',
  },
  {
    slug: 'basic-airbnb', n: '02', name: 'Basic Airbnb', titleHtml: 'Basic <em>Airbnb</em>',
    lead: 'Furnished. Fitted. Functioning.',
    intro: 'Everything in Furnishing, plus the appliances that make an apartment work: the kitchen, the laundry, the screen and the air conditioning. A guest or tenant can move in and live there; the finishing touches for short stays stay with you.',
    hero: F + 'room2/0121.webp', heroAlt: 'The studio with bedding, curtains, bedside lamps and wall art.',
    included: [
      ['Everything in Furnishing', 'Layout, furniture, decoration, delivery and assembly.'],
      ['Kitchen appliances', 'Fridge, oven, hob and dishwasher.'],
      ['Washing machine', 'Installed and tested.'],
      ['TV', 'Mounted or placed, connected and working.'],
      ['Air conditioning', 'Checked and serviced, with the drainage.'],
      ['Installation and testing', 'Every appliance running before we hand over.'],
    ],
    notIncluded: [
      ['Linens, towels, kitchenware and toiletries', 'upscale-airbnb', 'Upscale Airbnb'],
    ],
    who: [
      ['You will host it yourself', 'You want a working apartment and prefer to choose the linens and kitchenware yourself.'],
      ['You rent long-term', 'A fully equipped apartment lets faster and to better tenants.'],
      ['You are testing the market', 'Start short-term rentals without paying for every last detail up front.'],
    ],
    before: F + 'room2/0001.webp', after: F + 'room2/0121.webp',
    extra: [[F + 'tv2/0121.webp', 'TV corner']],
    handover: 'a fully working apartment, ready for a guest or tenant',
  },
  {
    slug: 'upscale-airbnb', n: '03', name: 'Upscale Airbnb', titleHtml: 'Upscale <em>Airbnb</em>',
    lead: 'The finer things, already in place.',
    intro: 'Everything a short-term rental needs, a step up. Finer furniture, lighting and decoration, plus the more than 200 details guests notice, from plates and glasses to soft towels, linens and toiletries. We hand over an apartment that is ready to photograph, list and book.',
    hero: F + 'room3/0121.webp', heroAlt: 'The studio finished with a green feature wall, wood floor, leather armchair, throw and fresh towels.',
    included: [
      ['Everything in Basic Airbnb', 'Furniture, decoration, appliances, delivery and installation.'],
      ['Finer pieces', 'Upgraded furniture, lighting and decoration throughout.'],
      ['Bed linen and towels', 'With throws and cushions, ready for the first guest.'],
      ['Kitchenware', 'Plates, glasses, cutlery, pots and pans.'],
      ['Toiletries and first-stay essentials', 'The small things guests notice when they are missing.'],
      ['Styling for the listing', 'Every room set up to look its best in photos.'],
      ['Professional photo shoot', 'Pictures that make guests stop swiping.'],
      ['A reliable host, if you need one', 'We help you find a property manager to run it.'],
    ],
    notIncluded: [
      ['The signature finish: pieces, art and styling chosen by Branka', 'donna-branka', 'Donna Branka'],
    ],
    who: [
      ['You want to start earning now', 'First-time host, no time to learn what guests expect. Day one is booking day.'],
      ['You own several units', 'One team equips them all to the same standard, fast.'],
      ['You are not in the UAE', 'Hand over the keys, get back an apartment that is ready to list.'],
    ],
    figures: true,
    before: F + 'room3/0001.webp', after: F + 'room3/0121.webp',
    extra: [[F + 'tv3/0121.webp', 'TV corner']],
    handover: 'a turnkey apartment, photographed and ready to list',
  },
  {
    slug: 'donna-branka', n: '04', name: 'Donna Branka', titleHtml: 'Donna <em>Branka</em>',
    badge: 'Signature · Best seller',
    lead: 'Our signature. Finished to the last detail.',
    intro: 'Our most complete and most chosen package. Everything in Upscale Airbnb, designed and styled by Branka herself: every piece, fabric and object chosen for the apartment, every room layered and finished, nothing left to add. The apartment is ready for its first guest the day we hand it over.',
    hero: F + 'room4/0121.webp', heroAlt: 'The studio finished: a living corner with a sofa, shelves with plants and a reading lamp beside the bed.',
    included: [
      ['Everything in Upscale Airbnb', 'Furniture, appliances, linens, kitchenware, toiletries and the photo shoot.'],
      ['Designed by Branka', 'One personal design for the whole apartment, from where the furniture goes to the colours.'],
      ['Signature pieces', 'Statement furniture, lighting and art, chosen piece by piece.'],
      ['Layered textiles', 'Curtains, rugs, throws and cushions that make a room feel finished.'],
      ['Plants and objects', 'Greenery, books, vases and the small things that give a home its character.'],
      ['The finishing check', 'Every room, surface and detail checked before the first guest.'],
      ['A personal handover', 'Branka walks you through the finished apartment.'],
    ],
    notIncluded: [],
    who: [
      ['You want the best in the building', 'An apartment guests pick first, at a higher nightly rate.'],
      ['You want it done once, properly', 'No second round of buying and fixing later: it is complete from day one.'],
      ['You will not be there', 'Hand over the keys and get back an apartment finished to the last detail.'],
    ],
    before: F + 'room4/0001.webp', after: F + 'room4/0121.webp',
    extra: [[F + 'tv4/0121.webp', 'Living corner']],
    handover: 'a finished apartment, ready for its first guest',
  },
];

const ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 3 5.6 2 2 0 0 1 5 3.5Z"/></svg>';
const esc = s => s.replace(/&(?![a-z#0-9]+;)/g, '&amp;').replace(/"/g, '&quot;');
const label = (n, text) => `<p class="pk-label"><span>${n}</span><span class="pk-label__rule" aria-hidden="true"></span><span>${text}</span></p>`;

function page(p, i) {
  const next = PACKAGES[i + 1];
  const prev = PACKAGES[i - 1];
  const waText = `Hi BLK Remodelling, I'd like to know more about the ${p.name} package.`;
  const steps = [
    ['A visit', 'We see the apartment, measure it and listen to what you want from it.'],
    ['A plan and a quote', 'The design, the full list of what goes in and one clear price.'],
    ['We do the work', 'Sourcing, delivery and assembly. You do not need to be there.'],
    ['The handover', `You get the keys back to ${p.handover}.`],
  ];
  const rail = PACKAGES.map(q => `    <a class="pf-rail__item${q === p ? ' is-active' : ''}" href="${q.slug}.html"${q === p ? ' aria-current="page"' : ''}><span class="pf-rail__label">${q.name}</span></a>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.name} · BLK Remodelling</title>
<meta name="description" content="${esc(p.name)}, package ${p.n} by BLK Remodelling, Ras Al Khaimah: ${esc(p.lead)} What it includes, who it is for and how it works.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23161009'/><path d='M9 22V10h5.2c2.6 0 4.2 1.3 4.2 3.5 0 1.5-.8 2.5-2 3 1.5.4 2.5 1.5 2.5 3.2 0 2.5-1.8 3.8-4.5 3.8H9zm3-7h2c1 0 1.6-.5 1.6-1.3S15 12.4 14 12.4h-2v2.3zm0 4.7h2.3c1.1 0 1.8-.5 1.8-1.5s-.7-1.4-1.8-1.4H12v2.9z' fill='%23C1502E'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/site.css">
<link rel="stylesheet" href="../css/package.css">
<link rel="stylesheet" href="../css/type.css">
</head>
<body>
<!-- Generated by tools/build-packages.mjs. Edit the copy there, not here. -->

<header class="site-bar">
  <a class="site-bar__mark" href="../index.html">BLK<span>·</span>REMODELLING</a>
  <nav class="pf-rail" aria-label="Packages">
${rail}
  </nav>
</header>

<main class="pk">
  <section class="pk-hero">
    <div class="pk-hero__copy">
      ${label('Package ' + p.n, p.name)}
${p.badge ? `      <p class="pf-badge">${p.badge}</p>\n` : ''}      <h1 class="pk-title">${p.titleHtml}</h1>
      <p class="pk-lead">${p.lead}</p>
      <p class="pk-intro">${p.intro}</p>
      <div class="pk-actions">
        <a class="pk-btn" href="${CAL}" target="_blank" rel="noopener">${ICON_CAL} Book a session</a>
        <a class="pk-link" href="https://wa.me/971545979814" target="_blank" rel="noopener" data-choose="wa" data-wa-text="${esc(waText)}" aria-haspopup="menu">Ask on WhatsApp <span aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
    <figure class="pk-hero__media">
      <img src="${p.hero}" width="1904" height="1088" alt="${esc(p.heroAlt)}">
      <figcaption>The studio after ${p.name}</figcaption>
    </figure>
  </section>

  <section class="pk-sec" aria-labelledby="inc-h">
    ${label('01', 'What’s included')}
    <div class="pk-sec__grid">
      <div>
        <h2 class="pk-h2" id="inc-h">Everything in <em>${p.name}</em></h2>
        <p class="pk-note">One team does all of it, with our own suppliers and subcontractors, so you deal with one contact and one price.</p>
${p.notIncluded.length ? `        <div class="pk-not">
          <h3>Not in this package</h3>
          <ul>
${p.notIncluded.map(([what, slug, name]) => `            <li>${what}: see <a href="${slug}.html">${name}</a></li>`).join('\n')}
          </ul>
        </div>` : ''}
      </div>
      <ul class="pk-list">
${p.included.map(([t, d], k) => `        <li><span>${String(k + 1).padStart(2, '0')}</span><div>${t}<small>${d}</small></div></li>`).join('\n')}
      </ul>
    </div>
  </section>

  <section class="pk-sec" aria-labelledby="who-h">
    ${label('02', 'Who it’s for')}
    <h2 class="pk-h2" id="who-h" style="margin-top:clamp(2rem,6vh,3.5rem)">The right package <em>if&hellip;</em></h2>
    <div class="pk-cols">
${p.who.map(([t, d], k) => `      <div class="pk-col"><span class="pk-col__n">${String(k + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></div>`).join('\n')}
    </div>
  </section>
${p.figures ? `
  <section class="pk-sec" aria-labelledby="fig-h">
    ${label('03', 'What it does')}
    <h2 class="pk-h2" id="fig-h" style="margin-top:clamp(2rem,6vh,3.5rem)">Beautiful is <em>not enough.</em></h2>
    <ul class="pk-figs">
      <li><b>+20%</b><span>more bookings</span></li>
      <li><b>+50%</b><span>higher daily rate</span></li>
      <li><b>200+</b><span>details taken care of</span></li>
    </ul>
    <p class="pk-figs-note">Based on our experience with the apartments we have remodelled.</p>
  </section>
` : ''}
  <section class="pk-sec" aria-labelledby="ba-h">
    ${label(p.figures ? '04' : '03', 'Before &amp; after')}
    <h2 class="pk-h2" id="ba-h" style="margin-top:clamp(2rem,6vh,3.5rem)">The same studio, <em>${p.slug === 'furnishing' ? 'filled' : p.slug === 'donna-branka' ? 'perfected' : 'finished'}</em></h2>
    <div class="pk-ba">
      <figure><img src="${p.before}" width="1904" height="1088" loading="lazy" alt="Before ${esc(p.name)}."><figcaption>Before</figcaption></figure>
      <figure><img src="${p.after}" width="1904" height="1088" loading="lazy" alt="After ${esc(p.name)}."><figcaption>After</figcaption></figure>
    </div>
${p.extra.length ? `    <div class="pk-extra" style="--n:${Math.max(p.extra.length, 2)}">
${p.extra.map(([src, cap]) => `      <figure><img src="${src}" loading="lazy" alt="${esc(cap)}."><figcaption>${cap}</figcaption></figure>`).join('\n')}
    </div>` : ''}
  </section>

  <section class="pk-sec" aria-labelledby="how-h">
    ${label(p.figures ? '05' : '04', 'How it works')}
    <h2 class="pk-h2" id="how-h" style="margin-top:clamp(2rem,6vh,3.5rem)">From the first visit <em>to the keys</em></h2>
    <ol class="pk-steps">
${steps.map(([t, d], k) => `      <li><span>${String(k + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></li>`).join('\n')}
    </ol>
    <div class="pk-actions">
      <a class="pk-btn" href="${CAL}" target="_blank" rel="noopener">${ICON_CAL} Book a session</a>
      <a class="pk-link" href="https://wa.me/971545979814" target="_blank" rel="noopener" data-choose="wa" data-wa-text="${esc(waText)}" aria-haspopup="menu">Ask on WhatsApp <span aria-hidden="true">&rarr;</span></a>
    </div>
  </section>

  <nav class="pk-next" aria-label="More packages">
${next ? `    <a class="pk-next__big" href="${next.slug}.html">
      ${label('Next · ' + next.n, next.lead)}
      <strong>${next.name} <i aria-hidden="true">&rarr;</i></strong>
    </a>` : `    <a class="pk-next__big" href="${prev.slug}.html">
      ${label('Something simpler? · ' + prev.n, prev.lead)}
      <strong>${prev.name} <i aria-hidden="true">&rarr;</i></strong>
    </a>`}
    <a class="pk-link" href="../index.html#pkg-1">All four packages <span aria-hidden="true">&rarr;</span></a>
  </nav>
</main>

<nav class="pf-dock" aria-label="Contact">
  <a class="pf-dock__call" href="tel:+971545979814" data-choose="call" aria-haspopup="menu">
    ${ICON_PHONE}
    Get in touch
  </a>
  <a class="pf-dock__book" href="${CAL}" target="_blank" rel="noopener">
    ${ICON_CAL}
    Book a session
  </a>
</nav>

<footer class="pf-site-foot">
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
    <span class="pf-site-foot__copy">&copy; 2026 BLK Remodelling &middot; Ras Al Khaimah, UAE</span>
  </div>
</footer>

<script src="../js/site.js"></script>
</body>
</html>
`;
}

fs.mkdirSync('packages', { recursive: true });
PACKAGES.forEach((p, i) => {
  fs.writeFileSync(`packages/${p.slug}.html`, page(p, i));
  console.log(`packages/${p.slug}.html`);
});
