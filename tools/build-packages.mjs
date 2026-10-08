// Builds the four package pages, packages/<slug>.html, from the copy below.
// Edit the text here, then run from the project root:  node tools/build-packages.mjs
// Layout/style: css/package.css (+ css/site.css for header, dock, footer);
// script: js/package.js (before/after slider, dock hiding).
// Copy is based only on what the client has given: the package definitions,
// the old BB Remodeling site and the home page texts. No prices or timelines.
//
// Short pages, package first (client 2026-10-04: "too much on the page,
// optimise for the customer"). Four parts: the hero with a before/after
// slider and four points · what's included + the next package up · a real
// apartment · clients' words and the booking buttons. The longer "two
// seconds" / "beautiful is not enough" / reviews sections that opened these
// pages before (tools/stories.html, css/stories.css, js/stories.js) are no
// longer used here.
import fs from 'node:fs';
import { stamp } from './stamp.mjs';
import { footer } from './partials.mjs';

const CAL = 'https://calendly.com/blkremoddeling/30min';
const F = '../assets/frames/';

const QUOTES = [
  ['I couldn’t believe it. I thought it was nice before; now it’s incredible. My apartment is booked out and earning much more than before.', 'Branko · JBR, Dubai'],
  ['No words. It looks like a completely different apartment.', 'Nastja · Dubai Marina'],
  ['What a difference. Rented within a week, and rented ever since.', 'Marko · Dubai Marina'],
];

const PACKAGES = [
  {
    slug: 'furnishing', n: '01', name: 'Furnishing', titleHtml: '<em>Furnishing</em>',
    lead: 'Every home starts empty. We deliver and assemble the essential furniture, so it is liveable from day one.',
    points: ['The essential furniture', 'Bed, wardrobe and a bedside chair', 'Delivery and assembly', 'Liveable from day one'],
    moreQ: 'Want decoration, appliances and linens too?',
    heroAlt: 'The studio furnished: an upholstered bed and an armchair by the sea-view window.',
    included: [
      ['Essential furniture', 'Bed, wardrobe and a bedside chair: the basics for every room.'],
      ['Delivery and assembly', 'We receive, carry in and build everything.'],
      ['One contact', 'From the first visit to the handover.'],
    ],
    who: [
      ['You just got the keys', 'A new, empty unit and no time to furnish it piece by piece.'],
      ['You rent long-term', 'Tenants want it furnished; the appliances are already there or you choose them yourself.'],
      ['You live abroad', 'Someone has to pick, order, wait for deliveries and assemble. We do it for you.'],
    ],
    before: F + 'room/0001.webp', after: F + 'room/0122.webp',
    extra: [
      ['../assets/img/01-furnishing-dining.webp', 'Dining'],
      ['../assets/img/01-furnishing-kitchen.webp', 'Kitchen'],
      ['../assets/img/01-furnishing-bathroom.webp', 'Bathroom'],
    ],
    examples: [['../assets/img/pk-furnishing-example-1.webp', 'A bedroom furnished with this package: upholstered bed, bedside tables, an armchair by the window.']],
  },
  {
    slug: 'basic-airbnb', n: '02', name: 'Basic Airbnb', titleHtml: 'Basic <em>Airbnb</em>',
    lead: 'Furnished. Fitted. Ready to host. A guest can arrive and feel at home from day one.',
    points: ['Everything in Furnishing', 'Appliances, TV and air conditioning', 'Linens, towels and kitchenware', 'Toiletries and first-stay essentials'],
    moreQ: 'Finer pieces and listing photos too?',
    heroAlt: 'The studio with bedding, curtains, bedside lamps and wall art.',
    included: [
      ['Essential furniture', 'Bed, wardrobe and bedside chair, delivered and assembled.'],
      ['Decoration', 'Curtains, lights, art and plants.'],
      ['Kitchen appliances', 'Fridge, oven, hob and dishwasher.'],
      ['Washing machine', 'Installed and tested.'],
      ['TV', 'Mounted or placed, connected and working.'],
      ['Air conditioning', 'Checked and serviced, with the drainage.'],
      ['Bed linen and towels', 'Everything a guest needs from the first night.'],
      ['Kitchenware', 'Plates, glasses, cutlery, pots and pans.'],
      ['Toiletries and first-stay essentials', 'The basics guests expect to find.'],
    ],
    who: [
      ['You will host it yourself', 'You want a working apartment and prefer to choose the linens and kitchenware yourself.'],
      ['You rent long-term', 'A fully equipped apartment lets faster and to better tenants.'],
      ['You are testing the market', 'Start short-term rentals without paying for every last detail up front.'],
    ],
    before: F + 'room2/0001.webp', after: F + 'room2/0121.webp',
    extra: [[F + 'tv2/0121.webp', 'TV corner']],
    figures: true,
    examples: [['../assets/img/pk-basic-airbnb-example-1.webp', 'The same bedroom with Basic Airbnb: bedding, curtains, bedside lamps and art.']],
  },
  {
    slug: 'upscale-airbnb', n: '03', name: 'Upscale Airbnb', titleHtml: 'Upscale <em>Airbnb</em>',
    lead: 'The finer things, already in place. Ready to photograph, list and book.',
    points: ['Everything in Basic Airbnb', 'Finer furniture and decoration', 'Premium linens, towels and toiletries', 'A photo shoot for the listing'],
    moreQ: 'The signature finish, chosen by Branka?',
    heroAlt: 'The studio finished with a green feature wall, wood floor, leather armchair, throw and fresh towels.',
    included: [
      ['Everything in Basic Airbnb', 'Furniture, decoration, appliances, linens, kitchenware and toiletries.'],
      ['Finer furniture and decoration', 'Every piece upgraded: better materials, more considered styling.'],
      ['Premium bed linen and towels', 'Higher-quality fabrics and more layers: the difference guests feel.'],
      ['Premium kitchenware', 'Better plates, glasses and utensils that match the feel of the apartment.'],
      ['Premium toiletries', 'The kind guests photograph and mention in reviews.'],
      ['Styling for the listing', 'Every room set up to look its best in photos.'],
      ['Professional photo shoot', 'Pictures that make guests stop swiping.'],
      ['A reliable host, if you need one', 'We help you find a property manager to run it.'],
    ],
    who: [
      ['You want to start earning now', 'First-time host, no time to learn what guests expect. Day one is booking day.'],
      ['You own several units', 'One team equips them all to the same standard, fast.'],
      ['You are not in the UAE', 'Hand over the keys, get back an apartment that is ready to list.'],
    ],
    before: F + 'room3/0001.webp', after: F + 'room3/0121.webp',
    extra: [[F + 'tv3/0121.webp', 'TV corner']],
    figures: true,
    examples: [['../assets/img/pk-upscale-airbnb-example-1.webp', 'The same bedroom with Upscale Airbnb: a feature wall, wood floor, sofa corner, throws, cushions and plants.']],
  },
  {
    slug: 'donna-branka', n: '04', name: 'Donna Branka', titleHtml: 'Donna <em>Branka</em>',
    badge: 'Signature · Best seller',
    lead: 'Our signature, designed by Branka and finished to the last detail.',
    points: ['Everything in Upscale Airbnb', 'Designed and styled by Branka', 'Signature pieces, art and textiles', 'A personal handover'],
    moreQ: 'Something simpler?',
    heroAlt: 'The studio finished: a living corner with a sofa, shelves with plants and a reading lamp beside the bed.',
    included: [
      ['Everything in Upscale Airbnb', 'Furniture, appliances, linens, kitchenware, toiletries and the photo shoot.'],
      ['Designed by Branka', 'One personal design for the whole apartment, from where the furniture goes to the colours.'],
      ['Signature pieces', 'Statement furniture, lighting and art, chosen piece by piece.'],
      ['Layered textiles', 'Curtains, rugs, throws and cushions that make a room feel finished.'],
      ['Plants and objects', 'Greenery, books, vases and the small things that give a home its character.'],
      ['The finishing check', 'Every room, surface and detail checked before the first guest.'],
      ['A personal handover', 'Branka walks you through the finished apartment.'],
    ],
    who: [
      ['You want the best result', 'Branka’s personal design, every detail chosen for your apartment.'],
      ['You are investing long-term', 'The best apartments command the best rates and the best guests.'],
      ['You want it done once, done right', 'The whole apartment, from the first meeting to the handover.'],
    ],
    before: F + 'room4/0001.webp', after: F + 'room4/0121.webp',
    extra: [[F + 'tv4/0121.webp', 'Living corner']],
    figures: true,
    examples: [
      ['../assets/img/pk-donna-branka-example-1.webp', 'A studio finished as Donna Branka: cove lighting, a pendant cluster, layered art, a sofa corner and fresh towels on the bed.', 1600, 1200],
      ['../assets/img/pk-donna-branka-example-2.webp', 'Another Donna Branka studio: a textured feature wall, framed botanical prints, warm lamps and a marble side table.', 1280, 960],
      ['../assets/img/pk-donna-branka-example-3.webp', 'A Donna Branka living room at Bay Residence: a slatted wood panel behind the TV, floating walnut shelves, a ring pendant and a terrace with an olive tree.', 1600, 1200],
    ],
  },
];

const ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 3 5.6 2 2 0 0 1 5 3.5Z"/></svg>';
const esc = s => s.replace(/&(?![a-z#0-9]+;)/g, '&amp;').replace(/"/g, '&quot;');
const label = (n, text) => `<p class="pk-label"><span>${n}</span><span class="pk-label__rule" aria-hidden="true"></span><span>${text}</span></p>`;

function page(p, i) {
  const last = i === PACKAGES.length - 1;
  const up = last ? PACKAGES[i - 1] : PACKAGES[i + 1];          // the next package up (Donna Branka: the one below)
  const signature = PACKAGES[PACKAGES.length - 1];
  const waText = `Hi BLK Remodelling, I'd like to know more about the ${p.name} package.`;
  const rail = PACKAGES.map(q => `    <a class="pf-rail__item${q === p ? ' is-active' : ''}" href="${q.slug}.html"${q === p ? ' aria-current="page"' : ''}><span class="pf-rail__label">${q.name}</span></a>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.name} · BLK Remodelling</title>
<meta name="description" content="${esc(p.name)}, package ${p.n} by BLK Remodelling, Ras Al Khaimah: ${esc(p.lead)} What it includes and how it works.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23161009'/><path d='M9 22V10h5.2c2.6 0 4.2 1.3 4.2 3.5 0 1.5-.8 2.5-2 3 1.5.4 2.5 1.5 2.5 3.2 0 2.5-1.8 3.8-4.5 3.8H9zm3-7h2c1 0 1.6-.5 1.6-1.3S15 12.4 14 12.4h-2v2.3zm0 4.7h2.3c1.1 0 1.8-.5 1.8-1.5s-.7-1.4-1.8-1.4H12v2.9z' fill='%23C1502E'/></svg>">
<link rel="preload" href="../assets/fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../css/fonts.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/site.css">
<link rel="stylesheet" href="../css/consent.css">
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
  <!-- 1. What the package is, at a glance: name, one line, four points, and
       the same studio before and after (drag the line to compare). -->
  <section class="pk-hero">
    <div class="pk-hero__copy">
      ${label('Package ' + p.n, p.name)}
${p.badge ? `      <p class="pf-badge">${p.badge}</p>\n` : ''}      <h1 class="pk-title">${p.titleHtml}</h1>
      <p class="pk-lead">${p.lead}</p>
      <ul class="pk-points">
${p.points.map(t => `        <li>${t}</li>`).join('\n')}
      </ul>
      <a class="pk-link" href="https://wa.me/971545979814" target="_blank" rel="noopener" data-choose="wa" data-wa-text="${esc(waText)}" aria-haspopup="menu">Ask about ${p.name} on WhatsApp</a>
    </div>
    <figure class="pk-ba" style="--pos: 50%">
      <img class="pk-ba__img" src="${p.before}" width="1904" height="1088" alt="Before ${esc(p.name)}: the studio as it was.">
      <img class="pk-ba__img pk-ba__after" src="${p.after}" width="1904" height="1088" alt="After ${esc(p.name)}: ${esc(p.heroAlt)}">
      <span class="pk-ba__tag" aria-hidden="true">Before</span>
      <span class="pk-ba__tag pk-ba__tag--after" aria-hidden="true">After</span>
      <input class="pk-ba__range" type="range" min="0" max="100" value="50" aria-label="Before and after: move to compare">
      <figcaption>Drag to compare</figcaption>
    </figure>
  </section>

  <!-- 2. Everything in it, and the next package up. -->
  <section class="pk-sec" aria-labelledby="inc-h">
    ${label('01', 'What’s included')}
    <h2 class="pk-h2 pk-h2--wide" id="inc-h">Everything in <em>${p.name}</em></h2>
    <p class="pk-note">One team, one contact, one price.</p>
    <ul class="pk-list"${p.included.length >= 5 ? ' style="--n:2"' : ''}>
${p.included.map(([t, d], k) => `      <li><span>${String(k + 1).padStart(2, '0')}</span><div>${t}<small>${d}</small></div></li>`).join('\n')}
    </ul>
    <div class="pk-more">
      <p class="pk-more__q">${p.moreQ}</p>
      <a class="pk-more__pkg" href="${up.slug}.html"><span>Package ${up.n}</span>${up.name}</a>
${!last && up !== signature ? `      <p class="pk-more__also">Or the whole thing, finished to the last detail: <a href="${signature.slug}.html">${signature.name}</a>, our signature.</p>\n` : ''}    </div>
  </section>

  <!-- 3. Who it's for: three short profiles. -->
  <section class="pk-sec" aria-labelledby="who-h">
    ${label('02', 'Who it’s for')}
    <h2 class="pk-h2 pk-h2--wide" id="who-h">The right package <em>if&hellip;</em></h2>
    <div class="pk-cols">
${p.who.map(([t, d], k) => `      <div class="pk-col"><span class="pk-col__n">${String(k + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></div>`).join('\n')}
    </div>
  </section>

  <!-- 4. A real apartment finished with this package (client photos), and
       other corners of the studio. -->
  <section class="pk-sec" aria-labelledby="ex-h">
    ${label('03', 'A real apartment')}
    <h2 class="pk-h2 pk-h2--wide" id="ex-h">What <em>${p.name}</em> looks like</h2>
    <div class="pk-photos" style="--n:${Math.min(p.examples.length, 3)}">
${p.examples.map(([src, alt, w = 1672, h = 941]) => `      <img src="${src}" width="${w}" height="${h}" loading="lazy" alt="${esc(alt)}">`).join('\n')}
    </div>
    <div class="pk-extra" style="--n:${Math.max(p.extra.length, 2)}">
${p.extra.map(([src, cap]) => `      <figure><img src="${src}" loading="lazy" alt="${esc(cap)}."><figcaption>${cap}</figcaption></figure>`).join('\n')}
    </div>
  </section>

  <!-- 5. How it works + quotes + CTA. Dock steps aside while buttons are
       on screen (html.cta-on, js/package.js). -->
  <section class="pk-sec pk-close" aria-labelledby="how-h">
    ${label('04', 'How it works')}
    <h2 class="pk-h2 pk-h2--wide" id="how-h">From the first visit <em>to the keys</em></h2>
${p.figures ? `    <ul class="pk-figs">
      <li><b>+20%</b><span>more bookings</span></li>
      <li><b>+50%</b><span>higher daily rate</span></li>
      <li><b>200+</b><span>details taken care of</span></li>
    </ul>
    <p class="pk-figs-note">Based on our experience with the apartments we have remodelled.</p>
` : ''}    <ol class="pk-steps">
      <li><span>01</span><h3>A visit</h3><p>We see the apartment, measure it and listen to what you want from it.</p></li>
      <li><span>02</span><h3>A plan and a quote</h3><p>The design, the full list of what goes in and one clear price.</p></li>
      <li><span>03</span><h3>We do the work</h3><p>Sourcing, delivery and assembly. You do not need to be there.</p></li>
      <li><span>04</span><h3>The handover</h3><p>You get the keys back to a finished apartment, ready for a guest or tenant.</p></li>
    </ol>
    <ul class="pk-quotes">
${QUOTES.map(([q, who]) => `      <li><figure class="pf-quote"><blockquote>&ldquo;${q}&rdquo;</blockquote><figcaption>${who}</figcaption></figure></li>`).join('\n')}
    </ul>
    <div class="pk-go">
      <h2 class="pk-h2" id="go-h">Ready to see what your apartment <em>could become?</em></h2>
      <div class="pk-actions">
        <a class="pk-btn" href="${CAL}" target="_blank" rel="noopener">${ICON_CAL} Book a session</a>
        <a class="pk-link" href="https://wa.me/971545979814" target="_blank" rel="noopener" data-choose="wa" data-wa-text="${esc(waText)}" aria-haspopup="menu">Ask on WhatsApp</a>
      </div>
      <a class="pk-link pk-all" href="../index.html#pkg-1">See all four packages</a>
    </div>
  </section>
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

${footer()}

<script src="../js/site.js"></script>
<script src="../js/consent.js"></script>
<script src="../js/meta-pixel.js"></script>
<script src="../js/package.js"></script>
</body>
</html>
`;
}

fs.mkdirSync('packages', { recursive: true });
PACKAGES.forEach((p, i) => {
  fs.writeFileSync(`packages/${p.slug}.html`, page(p, i));
  console.log(`packages/${p.slug}.html`);
});
stamp();                                   // ?v= on css/js links (tools/stamp.mjs)
