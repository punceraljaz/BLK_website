// Builds the property management page, manage/index.html (the "Manage 03"
// link in the home hero). Edit the text here, then run from the project root:
//   node tools/build-manage.mjs
// Layout: css/package.css (shared pk-* classes) + css/manage.css; script:
// js/manage.js (FAQ, assessment form -> WhatsApp, pathway prefill, dock hiding).
// Content moved over from the client's ChatGPT site
// blk-orlovic-management.bradekeco.chatgpt.site (2026-10-08; replaces the
// corporate-apartments page of 2026-10-07, which was the wrong site): same
// text in this site's style, arrows and check marks dropped (client rule), the
// stock photos behind the 12 services left out. Photos copied to assets/manage/
// (tools/manage-photos.mjs), so nothing is loaded from another host.
import fs from 'node:fs';
import { stamp } from './stamp.mjs';
import { footer } from './partials.mjs';

const BRAND = 'BLK Orlovic Management';
const WA = '971504985529';
const PHONE = '+971 50 498 5529';
const EMAIL = 'blkremoddeling@gmail.com';
const IMG = '../assets/manage/';

const WHY = [
  'Local oversight for vacant or occupied apartments',
  'Tenant calls, access and viewing coordination',
  'Rent collection, bills and payment follow-up',
  'Maintenance coordination with owner approval',
  'Check-in, check-out and condition inspections',
  'One management contact with wider agent distribution',
];
// [typical agency model, BLK Orlovic model]
const COMPARE = [
  ['Usually one agency&rsquo;s own team', '150+ independent real estate agents'],
  ['Brokerage first; management as an add-on', 'Management is our core service'],
  ['That agency markets the property', 'Multiple agencies can bring a tenant or buyer'],
  ['Transaction-focused handoff', 'Ongoing operations, reporting and owner support'],
];
const SERVICES = [
  ['Rental &amp; sale distribution', 'We prepare the property offer and circulate it through our network of independent real estate agents, for rent or, when requested, for sale.'],
  ['Enquiries &amp; viewings', 'One point of coordination for tenant questions, access, viewing times and follow-up.'],
  ['Tenancy contracts', 'Clear documentation, signatures, move-in requirements and renewal coordination.'],
  ['Rent collection', 'Payment schedules, collection follow-up and owner communication.'],
  ['Bills &amp; utilities', 'Utility and service-bill handling can be included for owners who need local support.'],
  ['Check-in &amp; check-out', 'Documented handovers, key coordination and condition checks at both ends of a tenancy.'],
  ['Property inspections', 'Practical on-site checks with issues reported clearly to the owner.'],
  ['Maintenance coordination', 'Quotes, access and works are coordinated; the owner remains in control of approvals.'],
  ['Furnishing &amp; remodeling', 'Preparation, furnishing refreshes and remodeling managed as a separate agreed scope.'],
  ['Owner updates &amp; reporting', 'Structured communication on tenancy, property condition, maintenance and open actions.'],
  ['Purchase, sale &amp; POA support', 'For managed clients, we can advise and coordinate a purchase or sale and act under a valid Power of Attorney when separately agreed.'],
  ['Vacant-property oversight', 'Local eyes on an empty apartment, with inspections and issue coordination when agreed.'],
];
// [title, text, first outcome, form status it preselects]
const PATHS = [
  ['My apartment is vacant', 'Prepare the unit, position it for the right rental term, coordinate viewings and move from empty to occupied.', 'Vacancy-to-tenant plan', 'Vacant'],
  ['My handover is approaching', 'Coordinate snagging priorities, furnishing or renovation, access and rental readiness from one local point.', 'Handover readiness plan', 'Handover pending'],
  ['I live outside the UAE', 'Create a practical operating rhythm for inspections, bills, maintenance approvals, tenancy and owner updates.', 'Remote-owner plan', ''],
];
const STEPS = [
  ['Property assessment', 'We review the location, condition, furnishing, current status and your priorities.'],
  ['Preparation', 'Any cleaning, furnishing, repairs or presentation work is agreed before launch.'],
  ['Market launch', 'The rental (or agreed sale) offer is prepared and circulated through our network of independent real estate agents.'],
  ['Tenant onboarding', 'Agents bring enquiries; we coordinate access, viewings, documentation, contract and handover.'],
  ['Ongoing management', 'Rent, communication, bills, inspections, approvals and reporting continue under one process.'],
];
const OVERSEAS = [
  'Utility and service-bill handling',
  'Maintenance quotes and approval requests',
  'Inspections and property-condition updates',
  'Tenant communication and access coordination',
  'Clear updates on payments and open actions',
  'Purchase, sale and POA coordination when agreed',
];
// [decision factor, furnished medium-term, annual tenancy]
const STRATEGY = [
  ['Best suited to', 'Ready, well-presented furnished units', 'Owners prioritising longer occupancy'],
  ['Typical owner priority', 'Flexibility and market positioning', 'Stability and fewer tenant changes'],
  ['Operational attention', 'More active coordination', 'Lower turnover frequency'],
  ['BLK assessment', 'Demand, presentation and viable term', 'Rent positioning and tenant fit'],
];
// [area, where, photo, w, h]
const AREAS = [
  ['Pacific', 'Al Marjan Island', 'area-pacific', 668, 452],
  ['Bab Al Bahr', 'Al Marjan Island', 'area-bab-al-bahr', 668, 452],
  ['Al Marjan Island', 'Ras Al Khaimah', 'area-al-marjan-island', 536, 388],
  ['Al Hamra Village', 'Ras Al Khaimah', 'area-al-hamra', 475, 398],
  ['Royal Breeze', 'Al Hamra Village', 'area-royal-breeze', 720, 480],
  ['Mina Al Arab', 'Ras Al Khaimah', 'area-mina-al-arab', 720, 465],
  ['Ras Al Khaimah', 'Selected communities', 'area-ras-al-khaimah', 720, 348],
  ['Umm Al Quwain', 'Selected communities', 'area-umm-al-quwain', 720, 540],
];
const UPDATE = ['Occupancy &amp; payments', 'Property condition', 'Maintenance &amp; approvals', 'Open actions &amp; next steps'];
const FAQ = [
  ['Is BLK Orlovic a real-estate agency?', 'BLK Orlovic is management-first, not a traditional brokerage. Our core work is operating managed apartments. Instead of keeping rental or sale exposure inside one agency, we distribute the property through a broad network of independent real estate agents.'],
  ['Do I need to be in the UAE?', 'No. Our service is particularly useful for overseas owners. Assessment details, approvals, documents and updates can be coordinated remotely, subject to the documents and authorisations required for your property.'],
  ['How do you find tenants?', 'We prepare the property offer and circulate availability through a network of 150+ independent real estate agents. Interested agents bring suitable tenants; BLK coordinates access, viewings, documentation and onboarding.'],
  ['Must the apartment be furnished?', 'Our strongest rental model is furnished medium-term accommodation. If a unit is unfurnished, we can first assess whether furnishing or preparation makes sense and provide a separate proposal.'],
  ['What is the minimum rental period?', 'We generally focus on stays of three months and above. The appropriate term still depends on the apartment, building rules, current demand and the owner&rsquo;s objectives.'],
  ['Who approves repairs?', 'The owner does. We identify the issue, coordinate access and quotations where needed, and seek approval before non-emergency works according to the agreed management process.'],
  ['Can you handle property bills?', 'Yes, utility and service-bill handling can form part of the agreed scope, especially for owners living abroad.'],
  ['How will I receive updates?', 'The reporting format and frequency are agreed during onboarding. Updates can cover occupancy, payments, inspections, maintenance, approvals and open actions.'],
  ['Can BLK help me purchase or sell a property?', 'Yes. For managed clients, we can advise and coordinate the purchase or sale process, work with the relevant agencies and service providers, and, where separately agreed and legally authorised, act under a valid Power of Attorney.'],
  ['Do you require exclusivity?', 'This is discussed during the assessment because the right arrangement depends on the unit and the services required. Our operating model is designed to broaden agent reach, not confine exposure to one internal team.'],
  ['How do I start?', 'Send the property location, building, unit type, furnishing and occupancy status through the form below. We will review the basics and arrange a rental assessment.'],
];
// [name, photo object-position, quote]
const CLIENTS = [
  ['Aljosa', '50% 35%', 'BLK takes care of the apartment as if it were their own. Communication is quick, issues are handled without me having to chase anyone, and I always know where things stand.'],
  ['Gugi', '50% 35%', 'What I value most is that BLK handles the whole process: tenant communication, payments, maintenance and follow-up. It makes owning an apartment in Ras Al Khaimah much easier.'],
  ['Dejan', '50% 35%', 'The management is practical, transparent and reliable. I don&rsquo;t need to be in Ras Al Khaimah to know that my property is being looked after properly.'],
  ['Simona', '50% 50%', 'BLK gives me peace of mind. They respond quickly, keep me informed and solve problems before they become bigger issues.'],
  ['Peter', '50% 30%', 'I wanted a management company that would be hands-on and accountable. BLK has been exactly that: professional, responsive and focused on keeping the apartment rented and maintained.'],
];
const ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 3 5.6 2 2 0 0 1 5 3.5Z"/></svg>';
const ICON_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21a9 9 0 1 0-7.8-4.5L3 21l4.7-1.2A9 9 0 0 0 12 21Z"/></svg>';
const label = (n, text) => `<p class="pk-label"><span>${n}</span><span class="pk-label__rule" aria-hidden="true"></span><span>${text}</span></p>`;
const two = k => String(k + 1).padStart(2, '0');
const ext = 'target="_blank" rel="noopener"';
const select = (name, first, options) => `<select name="${name}" required>
          <option value="" disabled selected>${first}</option>
${options.map(o => `          <option>${o}</option>`).join('\n')}
        </select>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Property Management in Ras Al Khaimah · ${BRAND}</title>
<meta name="description" content="Furnished apartment management in Ras Al Khaimah for owners and investors: tenants, rent, bills, inspections and maintenance from one local team, with availability shared across 150+ independent real estate agents. ${BRAND}.">
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
    <a class="pf-rail__item" href="#difference"><span class="pf-rail__label">Why BLK</span></a>
    <a class="pf-rail__item" href="#services"><span class="pf-rail__label">Services</span></a>
    <a class="pf-rail__item" href="#process"><span class="pf-rail__label">How it works</span></a>
    <a class="pf-rail__item" href="#areas"><span class="pf-rail__label">Areas</span></a>
    <a class="pf-rail__item" href="#contact"><span class="pf-rail__label">Contact</span></a>
  </nav>
</header>

<main class="pk mg">
  <!-- Hero: who it is for, what BLK does, one managed apartment. -->
  <section class="pk-hero">
    <div class="pk-hero__copy">
      ${label('Manage', 'Furnished apartment management')}
      <h1 class="pk-title mg-title">Property management in Ras Al Khaimah <em>for owners and investors</em></h1>
      <p class="pk-lead">One management team. A wider market for your property.</p>
      <p class="pk-note mg-intro">BLK manages the practical work behind a furnished investment apartment: tenant coordination, rent collection, utilities, inspections, maintenance, check-in and check-out, and ongoing owner support. Current availability can also be shared with our network of 150+ independent real estate agents.</p>
      <ul class="pk-points">
        <li>Ras Al Khaimah coverage</li>
        <li>Furnished apartment management</li>
        <li>Overseas-owner support</li>
        <li>150+ independent-agent network</li>
      </ul>
      <p class="mg-hero__actions">
        <a class="pk-btn" href="#contact">Request a free rental assessment</a>
        <a class="pk-link" href="#process">See how it works</a>
      </p>
    </div>
    <figure class="mg-hero__img">
      <img src="${IMG}hero.webp" width="1600" height="1200" fetchpriority="high" alt="One of our managed apartments: bed, sofa corner, cove lighting and a balcony door.">
      <figcaption><span>One of our managed apartments</span><span><b>150+</b> independent agents in the distribution network</span></figcaption>
    </figure>
  </section>

  <!-- 01 Why owners choose BLK. -->
  <section class="pk-sec" id="why" aria-labelledby="why-h">
    ${label('01', 'The owner&rsquo;s reality')}
    <h2 class="pk-h2 pk-h2--wide" id="why-h">Why owners <em>choose BLK</em></h2>
    <p class="pk-note mg-text">Owners choose BLK when they want one local team to coordinate the continuous chain of details around a furnished apartment, while keeping them informed and in control of important decisions.</p>
    <ul class="pk-list" style="--n:2">
${WHY.map((t, k) => `      <li><span>${two(k)}</span><div>${t}</div></li>`).join('\n')}
    </ul>
  </section>

  <!-- 02 The difference: one manager, many agents. -->
  <section class="pk-sec" id="difference" aria-labelledby="dif-h">
    ${label('02', 'The BLK difference')}
    <h2 class="pk-h2 pk-h2--wide" id="dif-h">A wider rental market <em>for your property</em></h2>
    <p class="pk-note mg-text">BLK keeps day-to-day apartment management with one team while distributing current availability to independent real estate agents who may already be working with suitable tenants. Owners get broader market reach without having to coordinate multiple contacts themselves.</p>
    <div class="pk-sec__grid">
      <table class="mg-table mg-table--compare">
        <thead><tr><th scope="col">Typical agency model</th><th scope="col">BLK Orlovic model</th></tr></thead>
        <tbody>
${COMPARE.map(([a, b]) => `          <tr><td>${a}</td><td>${b}</td></tr>`).join('\n')}
        </tbody>
      </table>
      <figure class="mg-graphic">
        <a href="${IMG}comparison.webp" ${ext}><img src="${IMG}comparison.webp" width="1536" height="1024" loading="lazy" alt="Diagram showing BLK apartment management with wider distribution through independent real estate agents"></a>
        <figcaption>Tap or click to view the full-resolution graphic</figcaption>
      </figure>
    </div>
  </section>

  <!-- 03 The twelve services. -->
  <section class="pk-sec" id="services" aria-labelledby="svc-h">
    ${label('03', 'What we manage')}
    <h2 class="pk-h2 pk-h2--wide" id="svc-h">Everything your apartment needs, <em>managed in one place</em></h2>
    <p class="pk-note mg-text">BLK coordinates the operating work around each apartment, from preparing it for the market and handling tenant enquiries to rent collection, utilities, inspections, maintenance and owner updates.</p>
    <ul class="pk-list" style="--n:3">
${SERVICES.map(([t, d], k) => `      <li><span>${two(k)}</span><div>${t}<small>${d}</small></div></li>`).join('\n')}
    </ul>
    <div class="pk-more">
      <p class="pk-more__q">Furnishing or remodeling first?</p>
      <p class="pk-more__also">BLK Remodelling prepares apartments for the market, from furnishing an empty unit to the finished Donna Branka standard. <a href="../index.html#pkg-1">See the four packages</a>.</p>
    </div>
  </section>

  <!-- 04 Owner pathways; each link preselects the form's status (js/manage.js). -->
  <section class="pk-sec" id="owner-paths" aria-labelledby="path-h">
    ${label('04', 'Local operating experience')}
    <h2 class="pk-h2 pk-h2--wide" id="path-h">Local experience <em>across Ras Al Khaimah</em></h2>
    <p class="pk-note mg-text">BLK works with furnished apartments in established Ras Al Khaimah communities. That local operating experience shapes how we assess a unit, prepare it, coordinate access and support the owner.</p>
    <div class="pk-cols mg-paths">
${PATHS.map(([t, d, o, s], k) => `      <article class="pk-col">
        <span class="pk-col__n">${two(k)}</span>
        <h3>${t}</h3>
        <p>${d}</p>
        <p class="mg-outcome"><span>First outcome</span>${o}</p>
        <a class="pk-link" href="#contact"${s ? ` data-status="${s}"` : ''}>Start this pathway</a>
      </article>`).join('\n')}
    </div>
  </section>

  <!-- 05 How it works. -->
  <section class="pk-sec" id="process" aria-labelledby="how-h">
    ${label('05', 'How it works')}
    <h2 class="pk-h2 pk-h2--wide" id="how-h">How BLK property management <em>works</em></h2>
    <ol class="pk-steps mg-steps">
${STEPS.map(([t, d], k) => `      <li><span>${two(k)}</span><h3>${t}</h3><p>${d}</p></li>`).join('\n')}
    </ol>
  </section>

  <!-- 06 Owners abroad. -->
  <section class="pk-sec" id="overseas" aria-labelledby="abr-h">
    ${label('06', 'For overseas owners')}
    <div class="pk-sec__grid mg-split">
      <figure class="mg-photo">
        <img src="${IMG}view.webp" width="1600" height="1200" loading="lazy" alt="Coastal view from a BLK-managed apartment in Ras Al Khaimah: balcony, palms and the pool">
        <figcaption>View from one of our managed apartments</figcaption>
      </figure>
      <div>
        <h2 class="pk-h2" id="abr-h">Management for owners <em>living abroad</em></h2>
        <p class="pk-note mg-text">BLK gives owners outside the UAE a practical local point of contact. You keep decision control while we coordinate tenant communication, utilities, inspections, maintenance access, payments and the work that must happen on site.</p>
        <ul class="pk-points mg-checks">
${OVERSEAS.map(t => `          <li>${t}</li>`).join('\n')}
        </ul>
        <a class="pk-link" href="#contact">Discuss your property</a>
      </div>
    </div>
  </section>

  <!-- 07 Rental focus and strategy. -->
  <section class="pk-sec" id="rental" aria-labelledby="ren-h">
    ${label('07', 'Our rental focus')}
    <div class="pk-sec__grid">
      <p class="mg-big"><b>3+</b><span>Months and above</span></p>
      <div>
        <h2 class="pk-h2" id="ren-h">Furnished <em>medium&#8209;term rentals</em></h2>
        <p class="pk-note mg-text">BLK generally focuses on furnished stays of three months and above. We coordinate apartment readiness, tenant onboarding, utilities, check-in, ongoing support and check-out so the owner does not have to rebuild the operating process for every tenancy.</p>
        <p class="mg-small">Suitability and rental terms depend on the property, building rules, market conditions and the owner&rsquo;s objectives. We do not promise a particular return.</p>
      </div>
    </div>
    <h3 class="mg-h3">Medium-term or annual? Start with the property, not a slogan.</h3>
    <p class="pk-note mg-text">BLK&rsquo;s focus is furnished stays of three months and above, but the right recommendation depends on building rules, readiness, demand and the owner&rsquo;s priorities.</p>
    <div class="mg-scroll">
      <table class="mg-table mg-table--strategy">
        <thead><tr><th scope="col">Decision factor</th><th scope="col">Furnished medium-term</th><th scope="col">Annual tenancy</th></tr></thead>
        <tbody>
${STRATEGY.map(([f, a, b]) => `          <tr><th scope="row">${f}</th><td data-label="Furnished medium-term">${a}</td><td data-label="Annual tenancy">${b}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <p class="mg-small">No return is guaranteed. Recommendations are property-specific and subject to current market conditions and applicable building or regulatory requirements.</p>
  </section>

  <!-- 08 Areas. -->
  <section class="pk-sec" id="areas" aria-labelledby="area-h">
    ${label('08', 'Areas served')}
    <h2 class="pk-h2 pk-h2--wide" id="area-h">Areas <em>we manage</em></h2>
    <p class="pk-note mg-text">BLK manages furnished apartments across established residential and investment communities in Ras Al Khaimah, with selected support in Umm Al Quwain.</p>
    <ul class="mg-areas">
${AREAS.map(([a, w, f, iw, ih], k) => `      <li>
        <img src="${IMG}${f}.webp" width="${iw}" height="${ih}" loading="lazy" alt="${a}">
        <p class="mg-areas__n">${two(k)}</p>
        <h3>${a}</h3>
        <p class="mg-areas__where">${w}</p>
      </li>`).join('\n')}
    </ul>
  </section>

  <!-- 09 The agent network and what owners get. -->
  <section class="pk-sec" id="network" aria-labelledby="net-h">
    ${label('09', 'Wider market reach')}
    <h2 class="pk-h2 pk-h2--wide" id="net-h">Our network of <em>150+ independent real estate agents</em></h2>
    <p class="pk-note mg-text">BLK regularly shares current apartment availability with independent agents who may already have suitable tenants. The agents remain independent, while BLK keeps management, owner communication and rental administration centralized.</p>
    <div class="pk-sec__grid mg-split">
      <figure class="mg-photo">
        <img src="${IMG}living.webp" width="1280" height="960" loading="lazy" alt="Living room of a BLK-managed apartment: sofa, dining table and a balcony">
        <figcaption>Real managed-apartment example</figcaption>
      </figure>
      <dl class="mg-facts">
        <div><dt>Managed property types</dt><dd>Studios &middot; 1 Bed &middot; 2 Bed &middot; 3 Bed &middot; Villas</dd></div>
        <div><dt>Agent distribution network</dt><dd><b>150+</b> independent real estate agents</dd></div>
        <div><dt>Owner control</dt><dd>Quotes and approval before non-emergency works. You keep the decision.</dd></div>
        <div><dt>Your owner update, at an agreed frequency</dt><dd><ul>
${UPDATE.map(t => `          <li>${t}</li>`).join('\n')}
        </ul>A clear operating snapshot.</dd></div>
      </dl>
    </div>
  </section>

  <!-- 10 FAQ. -->
  <section class="pk-sec" id="faq" aria-labelledby="faq-h">
    ${label('10', 'Questions owners ask')}
    <h2 class="pk-h2 pk-h2--wide" id="faq-h">Direct answers, <em>before we start</em></h2>
    <div class="mg-faq">
${FAQ.map(([q, a], k) => `      <details>
        <summary><span>${two(k)}</span>${q}</summary>
        <p>${a}</p>
      </details>`).join('\n')}
    </div>
  </section>

  <!-- 11 Clients. -->
  <section class="pk-sec" id="clients" aria-labelledby="cli-h">
    ${label('11', 'Our clients')}
    <h2 class="pk-h2 pk-h2--wide" id="cli-h">What our <em>clients say</em></h2>
    <ul class="pk-quotes mg-quotes">
${CLIENTS.map(([n, pos, q]) => `      <li><figure class="pf-quote">
        <blockquote>${q}</blockquote>
        <figcaption><img src="${IMG}client-${n.toLowerCase()}.webp" width="88" height="88" loading="lazy" alt="Portrait of ${n}" style="object-position: ${pos}">${n}</figcaption>
      </figure></li>`).join('\n')}
    </ul>
  </section>

  <!-- 12 The assessment request: the form only writes a WhatsApp message
       (js/manage.js); nothing is sent to or stored on this website. -->
  <section class="pk-sec pk-go mg-contact" id="contact" aria-labelledby="go-h">
    <div class="mg-contact__intro">
      ${label('12', 'Free rental assessment')}
      <h2 class="pk-h2 pk-h2--wide" id="go-h">Request your free <em>property assessment</em></h2>
      <p class="pk-note">Tell us the building, unit type, furnishing and current status. BLK will review the practical management needs and contact you to discuss a suitable rental approach.</p>
      <p class="mg-person"><span>Prefer WhatsApp?</span>
        <a href="https://wa.me/${WA}" ${ext}>${PHONE}</a>
        <a href="mailto:${EMAIL}">${EMAIL}</a>
      </p>
      <p class="mg-small">No invented prices. No automatic commitment. Your assessment starts with the facts of your property.</p>
    </div>
    <form class="mg-form" data-wa="${WA}">
      <label>Name *<input name="name" required placeholder="Your full name" autocomplete="name"></label>
      <label>Phone / WhatsApp *<input name="phone" type="tel" required placeholder="+971..." autocomplete="tel"></label>
      <label class="mg-form__wide">Email *<input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label>
      <label>Property location *${select('location', 'Select emirate / area', ['Ras Al Khaimah', 'Umm Al Quwain', 'Other'])}</label>
      <label>Building / community *<input name="building" required placeholder="e.g. Pacific"></label>
      <label>Unit type *${select('unitType', 'Select unit type', ['Studio', '1 bedroom', '2 bedrooms', '3+ bedrooms', 'Other'])}</label>
      <label>Furnishing *${select('furnished', 'Select', ['Furnished', 'Partly furnished', 'Unfurnished'])}</label>
      <label>Current status *${select('status', 'Select', ['Vacant', 'Currently rented', 'Handover pending'])}</label>
      <label>Where are you based?<input name="ownerLocation" placeholder="Country / city"></label>
      <label class="mg-form__wide">Message<textarea name="message" rows="4" placeholder="Anything we should know about the apartment or your objectives?"></textarea></label>
      <label class="mg-form__wide mg-form__agree"><input type="checkbox" name="agree" required> I agree to be contacted about this property enquiry.</label>
      <button class="pk-btn mg-form__send" type="submit">${ICON_WA} Send assessment request on WhatsApp</button>
    </form>
  </section>
</main>

<nav class="pf-dock" aria-label="Contact">
  <a class="pf-dock__call" href="tel:+${WA}">
    ${ICON_PHONE}
    Call us
  </a>
  <a class="pf-dock__book" href="#contact">
    ${ICON_WA}
    Free assessment
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
stamp();                                   // ?v= on css/js links (tools/stamp.mjs)
