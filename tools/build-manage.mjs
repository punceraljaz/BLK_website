// Builds the property management page, manage/index.html (the "Manage 03"
// link in the home hero). Edit the text and the apartment list here, then run
// from the project root:  node tools/build-manage.mjs
// Layout: css/package.css (shared pk-* classes) + css/manage.css; script:
// js/manage.js (apartment filter, request form -> WhatsApp, dock hiding).
// Content moved over from the client's ChatGPT site
// blk-corporate-apartments.bradekeco.chatgpt.site (2026-10-07): same text,
// apartments, prices and Drive links, in this site's style. Photos copied to
// assets/manage/ (tools/manage-photos.mjs), so no image is loaded from Google.
import fs from 'node:fs';
import { footer } from './partials.mjs';

const BRAND = 'BLK Orlovic Management';
const WA = '971504985529';                                  // Branko
const IMG = '../assets/manage/';

// [unit, building, type, size, price per month, pictures folder, video, photo w, h]
const APARTMENTS = [
  ['A427', 'Pacific', 'Studio', '445 sq ft', 'AED 4,250', 'https://drive.google.com/drive/folders/1ORTnBs4q5vM9kYROuMBV5HRz-DQzGWCJ?usp=sharing', 'https://drive.google.com/file/d/1ynj0MWfdVuDvMb-nsQxjZm7w_4AZlPge/view?usp=sharing', 960, 1280],
  ['A734', 'Pacific', 'Studio', '445 sq ft', 'AED 4,250', 'https://drive.google.com/drive/folders/1PNa3ymZkJa-5lj-BVnFxcyFDAxXIJVek?usp=sharing', 'https://drive.google.com/file/d/1s11iNGN4ajkMXSsJSskEnQx_FD5BHt-K/view?usp=drivesdk', 960, 1280],
  ['A738', 'Pacific', 'Studio', '445 sq ft', 'AED 4,250', 'https://drive.google.com/drive/folders/19J_R-uYhlFXVpYaxmIKhQ1M3MTAyc4cB', 'https://drive.google.com/file/d/1Baa5_jfuyPZOIBfhqMLPxlxqtU0Sp_-t/view?usp=drivesdk', 960, 720],
  ['B139', 'Pacific', 'Studio', '445 sq ft', 'AED 4,250', 'https://drive.google.com/drive/folders/1LCXnDWk2tmP1hGFfB9TQ1ztrhVMw6rRw?usp=sharing', 'https://drive.google.com/file/d/1g4hLH7zOFOQ1DLyX1y79IBSAVjifqMXi/view?usp=sharing', 960, 1280],
  ['B211', 'Pacific', 'Studio', '445 sq ft', 'AED 4,250', 'https://drive.google.com/drive/folders/1ZuEXlLkBBOTXJ2NzzB-gKl0JWaG_D2hm', 'https://drive.google.com/file/d/1vD1XJtibbyrRv-S3h33BYAJInCahqnNd/view?usp=drivesdk', 960, 1280],
  ['B431', 'Pacific', '1 bedroom', '773 sq ft', 'AED 7,000', 'https://drive.google.com/drive/folders/1sSHGqS5uNdYqFjNOofZOE0TDZosh7HX6?usp=sharing', 'https://drive.google.com/file/d/1zQGS8BniAL5U5nfh_bySRzKP-XkZi9sb/view?usp=drive_link', 960, 1280],
  ['F009', 'Bab Al Bahar', 'Studio', '520 sq ft', 'AED 5,000', 'https://drive.google.com/drive/folders/1y5E1Z4z85WRB4DUQuhrvV6XTmog8c_Sd', 'https://drive.google.com/file/d/117JMqcprD8hXUhtsjxVI_ZliwYRlmL3A/view?usp=drive_link', 960, 1279],
  ['F306', 'Bab Al Bahar', '2 bedrooms', '1,100 sq ft', 'AED 12,000', 'https://drive.google.com/drive/folders/1_OYvCC1mQIjreggLyVKwUWYiv_veaJ4Z?usp=sharing', 'https://drive.google.com/file/d/1bDGIEHYC2z764cwR0R6KwPBR6zM77X5X/view?usp=drive_link', 960, 720],
];
const TYPES = ['Studio', '1 bedroom', '2 bedrooms'];

const INCLUDED = [
  ['Electricity &amp; water', 'Included in the rent.'],
  ['Fast internet', 'Connected and ready.'],
  ['Fully furnished', 'Kitchenware and bedding.'],
  ['Local support', 'Check-in, checkout and tenancy help.'],
];
const STEPS = [
  ['Share your requirements', 'Number of employees, dates, duration and budget.'],
  ['Review real apartments', 'Receive suitable units with pictures, videos and clear prices.'],
  ['Move in with support', 'We coordinate contracts, check-in, utilities and the stay.'],
];

const ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 3 5.6 2 2 0 0 1 5 3.5Z"/></svg>';
const ICON_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21a9 9 0 1 0-7.8-4.5L3 21l4.7-1.2A9 9 0 0 0 12 21Z"/></svg>';
const label = (n, text) => `<p class="pk-label"><span>${n}</span><span class="pk-label__rule" aria-hidden="true"></span><span>${text}</span></p>`;
const two = k => String(k + 1).padStart(2, '0');
const ext = 'target="_blank" rel="noopener"';

const card = ([unit, building, type, size, price, pics, video, w, h]) => `      <li class="mg-apt" data-type="${type}">
        <a class="mg-apt__img" href="${pics}" ${ext} aria-label="Pictures of apartment ${unit}">
          <img src="${IMG}${unit.toLowerCase()}.webp" width="${w}" height="${h}" loading="lazy" alt="Apartment ${unit}, ${type.toLowerCase()} in ${building}">
        </a>
        <p class="mg-apt__meta"><span>${unit}</span><span>${building} &middot; Al Marjan Island</span></p>
        <h3 class="mg-apt__type">${type}<span>${size}</span></h3>
        <p class="mg-apt__price">${price}<span>per month, bills included</span></p>
        <p class="mg-apt__links"><a class="pk-link" href="${pics}" ${ext}>Pictures</a><a class="pk-link" href="${video}" ${ext}>Video</a></p>
      </li>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Corporate Apartments · ${BRAND}</title>
<meta name="description" content="Fully furnished apartments in Ras Al Khaimah for company staff, project teams and visiting professionals. Bills included, flexible stays, no agent fees. ${BRAND}.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23161009'/><path d='M9 22V10h5.2c2.6 0 4.2 1.3 4.2 3.5 0 1.5-.8 2.5-2 3 1.5.4 2.5 1.5 2.5 3.2 0 2.5-1.8 3.8-4.5 3.8H9zm3-7h2c1 0 1.6-.5 1.6-1.3S15 12.4 14 12.4h-2v2.3zm0 4.7h2.3c1.1 0 1.8-.5 1.8-1.5s-.7-1.4-1.8-1.4H12v2.9z' fill='%23C1502E'/></svg>">
<link rel="preload" href="../assets/fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../css/fonts.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/site.css">
<link rel="stylesheet" href="../css/consent.css">
<link rel="stylesheet" href="../css/package.css">
<link rel="stylesheet" href="../css/manage.css">
<link rel="stylesheet" href="../css/type.css">
</head>
<body>
<!-- Generated by tools/build-manage.mjs. Edit the copy there, not here. -->

<header class="site-bar">
  <a class="site-bar__mark" href="../index.html">BLK<span>·</span>REMODELLING</a>
  <nav class="pf-rail" aria-label="On this page">
    <a class="pf-rail__item" href="#apartments"><span class="pf-rail__label">Apartments</span></a>
    <a class="pf-rail__item" href="#included"><span class="pf-rail__label">What&rsquo;s included</span></a>
    <a class="pf-rail__item" href="#process"><span class="pf-rail__label">How it works</span></a>
    <a class="pf-rail__item" href="#contact"><span class="pf-rail__label">Contact</span></a>
  </nav>
</header>

<main class="pk mg">
  <!-- 1. Hero: who it is for, the four facts, a finished apartment. -->
  <section class="pk-hero">
    <div class="pk-hero__copy">
      ${label('Manage', 'Corporate living &middot; Ras Al Khaimah')}
      <h1 class="pk-title mg-title">A place to call home, <em>while work brings you here.</em></h1>
      <p class="pk-lead">Fully furnished apartments for company staff, project teams and visiting professionals. Thoughtfully prepared, ready to live in and supported locally.</p>
      <ul class="pk-points">
        <li>Studios, 1 and 2 bedrooms</li>
        <li>Flexible stays</li>
        <li>No agent fees</li>
        <li>Ready for staff move-in</li>
      </ul>
      <p class="mg-hero__actions">
        <a class="pk-btn" href="#apartments">Check availability</a>
        <a class="pk-link" href="https://wa.me/${WA}" ${ext}>WhatsApp us</a>
      </p>
    </div>
    <figure class="mg-hero__img">
      <img src="${IMG}hero.webp" width="1449" height="1086" fetchpriority="high" alt="A furnished studio: bed, sofa corner, cove lighting and a balcony.">
      <figcaption>Welcoming homes in Pacific and Bab Al Bahar, Al Marjan Island</figcaption>
    </figure>
  </section>

  <!-- 2. What the rent includes. -->
  <section class="pk-sec" id="included" aria-labelledby="inc-h">
    ${label('01', 'What&rsquo;s included')}
    <h2 class="pk-h2 pk-h2--wide" id="inc-h">Everything in <em>the rent</em></h2>
    <ul class="pk-list" style="--n:2">
${INCLUDED.map(([t, d], k) => `      <li><span>${two(k)}</span><div>${t}<small>${d}</small></div></li>`).join('\n')}
    </ul>
  </section>

  <!-- 3. The apartments, filterable by type (js/manage.js). Photos and
       videos open the client's Google Drive folders. -->
  <section class="pk-sec" id="apartments" aria-labelledby="apt-h">
    ${label('02', 'Selected homes &middot; Real media')}
    <h2 class="pk-h2 pk-h2--wide" id="apt-h">A selection from <em>our apartment portfolio</em></h2>
    <p class="pk-note mg-note">This page shows only some of our apartments. Contact us for the complete current availability. Every photo, gallery and video belongs to the apartment number shown.</p>
    <div class="mg-filters" role="group" aria-label="Filter apartments">
      <button type="button" aria-pressed="true" data-filter="">All homes</button>
${TYPES.map(t => `      <button type="button" aria-pressed="false" data-filter="${t}">${t}</button>`).join('\n')}
    </div>
    <ul class="mg-apts">
${APARTMENTS.map(card).join('\n')}
    </ul>
    <div class="pk-more mg-more">
      <p class="pk-more__q">Need several apartments?</p>
      <p class="mg-more__text">Tell us the team size, dates and preferred apartment types. We will prepare one suitable shortlist.</p>
      <a class="pk-link" href="#contact">Request a corporate offer</a>
    </div>
  </section>

  <!-- 4. How it works. -->
  <section class="pk-sec" id="process" aria-labelledby="how-h">
    ${label('03', 'Simple for your company')}
    <h2 class="pk-h2 pk-h2--wide" id="how-h">One local contact <em>from shortlist to checkout</em></h2>
    <ol class="pk-steps mg-steps">
${STEPS.map(([t, d], k) => `      <li><span>${two(k)}</span><h3>${t}</h3><p>${d}</p></li>`).join('\n')}
    </ol>
  </section>

  <!-- 5. The request: the form only writes a WhatsApp message (js/manage.js);
       nothing is sent to or stored on this website. -->
  <section class="pk-sec pk-go mg-contact" id="contact" aria-labelledby="go-h">
    <div class="mg-contact__intro">
      ${label('04', 'Corporate accommodation request')}
      <h2 class="pk-h2 pk-h2--wide" id="go-h">Tell us what <em>your team needs.</em></h2>
      <p class="pk-note">Send the essentials and continue directly in WhatsApp. Branko will reply with current options.</p>
      <p class="mg-person">Branko Podpe&ccaron;an
        <a href="tel:+${WA}">+971 50 498 5529</a>
        <a href="mailto:blkremoddeling@gmail.com">blkremoddeling@gmail.com</a>
      </p>
    </div>
    <form class="mg-form" data-wa="${WA}" data-brand="${BRAND}">
      <label class="mg-form__wide">Company name<input name="company" required placeholder="Your company" autocomplete="organization"></label>
      <label>Number of employees<input name="employees" type="number" min="1" inputmode="numeric" placeholder="e.g. 6"></label>
      <label>Apartment type<select name="type">
        <option value="">Flexible</option>
${[...TYPES, 'Mix of apartments'].map(t => `        <option>${t}</option>`).join('\n')}
      </select></label>
      <label>Move-in date<input name="moveIn" type="date"></label>
      <label>Rental duration<input name="duration" placeholder="e.g. 6 months"></label>
      <button class="pk-btn mg-form__send" type="submit">${ICON_WA} Continue in WhatsApp</button>
    </form>
  </section>
</main>

<nav class="pf-dock" aria-label="Contact">
  <a class="pf-dock__call" href="tel:+${WA}">
    ${ICON_PHONE}
    Call Branko
  </a>
  <a class="pf-dock__book" href="#contact">
    ${ICON_WA}
    Request an offer
  </a>
</nav>

${footer()}

<script src="../js/site.js"></script>
<script src="../js/consent.js"></script>
<script src="../js/meta-pixel.js"></script>
<script src="../js/manage.js"></script>
</body>
</html>
`;

fs.mkdirSync('manage', { recursive: true });
fs.writeFileSync('manage/index.html', html);
console.log('manage/index.html');
