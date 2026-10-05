// Builds the legal pages: legal/privacy.html, legal/cookies.html,
// legal/terms.html. Run from the project folder: node tools/build-legal.mjs
//
// Written 2026-10-05 for the site as it is: no forms, no accounts, a cookie
// banner (js/consent.js; no analytics or marketing tool chosen yet), no
// third-party loads, fonts and images served from this site; contact is
// by phone, WhatsApp, email and Calendly (links only). If any of that
// changes (a contact form, analytics, an embedded map or video...), these
// texts must change too. Not legal advice: have them checked by a UAE lawyer.
//
// TODO() marks facts only the business can give (trade licence, legal name,
// hosting). They show on the page as bracketed, highlighted text until filled.
import fs from 'node:fs';
import { footer, LEGAL } from './partials.mjs';

const UPDATED = '5 October 2026';
const EMAIL = '<a href="mailto:branka.kugler@gmail.com">branka.kugler@gmail.com</a>';
const PHONE = '<a href="tel:+971545979814">+971 54 597 9814</a>';
const TODO = t => `<span class="lg-todo" data-todo>[${t}]</span>`;
const OPERATOR = `BLK Remodelling, Ras Al Khaimah, United Arab Emirates (${TODO('legal name of the business as on the trade licence')}, trade licence no. ${TODO('number')}, issued by ${TODO('RAK Department of Economic Development or free zone authority')}; address: ${TODO('business address')})`;

const PAGES = {
  privacy: {
    title: 'Privacy Policy',
    intro: `This policy explains what personal data BLK Remodelling collects when you use this website or contact us, why we collect it, and the rights you have. It follows the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) and, for visitors in the European Union and the United Kingdom, the General Data Protection Regulation (GDPR).`,
    sections: [
      ['Who we are', `
        <p>The website and the services on it are run by ${OPERATOR}. We decide how and why your personal data is used; in data protection terms we are the controller.</p>
        <p>For anything about your personal data, contact Branka Kugler at ${EMAIL} or ${PHONE}.</p>`],
      ['What we collect', `
        <p><strong>When you visit the website.</strong> The website has no contact forms and no user accounts. Analytics and marketing cookies are used only if you allow them in the cookie banner; see the <a href="cookies.html">Cookie Policy</a>. Like every website, the server that hosts it (${TODO('hosting provider')}) receives the technical data needed to deliver the pages: your IP address, browser and device type, the page requested, and the date and time. This is kept in the server's logs for security and troubleshooting and deleted after ${TODO('number of days, per the hosting provider')}.</p>
        <p><strong>When you contact us</strong> by phone, WhatsApp or email, or book a session through Calendly: your name, phone number and email address, the messages you send, the details of your property you share with us (location, size, photos, plans) and what you would like done, and the date and time of any appointment.</p>
        <p><strong>When you become a client:</strong> in addition, what we need to prepare the quote and the contract, carry out the work, invoice and receive payment, and access the property.</p>
        <p>We do not ask for, and ask you not to send us, sensitive data such as health information or religious beliefs.</p>`],
      ['Why we use it', `
        <ul>
          <li>To answer your enquiry and arrange a visit, because you asked us to (steps before a contract).</li>
          <li>To prepare a quote, carry out the work and hand over the apartment (performance of a contract).</li>
          <li>To keep accounting, tax and commercial records (legal obligation).</li>
          <li>To keep the website secure and working (our legitimate interest).</li>
        </ul>
        <p>Photos of apartments we have finished are shown in our portfolio only with the owner's permission and without anything that identifies the owner or guests.</p>
        <p>We do not sell personal data, we do not use it for profiling or automated decisions, and we do not send marketing messages unless you ask for them.</p>`],
      ['Who we share it with', `
        <ul>
          <li>Providers that help us work: website hosting, email (Google), WhatsApp (Meta), appointment booking (Calendly) and our telephone providers.</li>
          <li>Contractors and suppliers working on your project, and only what they need (for example the address and access times).</li>
          <li>Public authorities, where the law requires it.</li>
        </ul>
        <p>The links to WhatsApp, Calendly, Instagram and Facebook take you to those companies' own websites and apps, where their privacy policies apply.</p>`],
      ['Transfers outside the UAE', `
        <p>Some of the providers above (Google, Meta, Calendly) store data outside the UAE, including in the United States. We use them only as the UAE Personal Data Protection Law allows and, for visitors from the EU and the UK, rely on the safeguards these providers offer, such as standard contractual clauses.</p>`],
      ['How long we keep it', `
        <ul>
          <li>Enquiries that do not lead to a project: up to 24 months after our last contact, then deleted.</li>
          <li>Client and project records: for as long as UAE commercial and tax law requires us to keep them (generally five to seven years).</li>
          <li>Server logs: as stated above.</li>
        </ul>`],
      ['Your rights', `
        <p>You can ask us to tell you what personal data we hold about you and give you a copy, to correct it, to delete it, to restrict or stop using it, or to send it to you or another company in a common format. Where we use your data because you agreed to it, you can withdraw that agreement at any time.</p>
        <p>Write to ${EMAIL}. We will answer within 30 days and may ask you to confirm who you are first. If you are not satisfied, you can complain to the UAE Data Office or, if you live in the EU or the UK, to the data protection authority where you live.</p>`],
      ['Security', `<p>We protect personal data with reasonable technical and organisational measures and give access only to those who need it. No transmission over the internet is completely secure, so please do not send us more than we need.</p>`],
      ['Children', `<p>This website and our services are meant for adults. We do not knowingly collect personal data from anyone under 18.</p>`],
      ['Changes to this policy', `<p>We may update this policy when our website or services change. The date at the top shows when it was last changed.</p>`],
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    intro: `This policy explains which cookies and similar technologies this website uses, what they do, and how you choose which ones you allow. When you first visit, a banner asks for your choice. Only strictly necessary cookies are used without it; analytics and marketing cookies are used only if you allow them.`,
    sections: [
      ['What cookies are', `
        <p>Cookies are small text files a website stores in your browser. Similar technologies, such as your browser's local and session storage, work the same way; in this policy, "cookies" covers all of them. Cookies set by this website are first-party cookies; cookies set by another company's service on this website are third-party cookies.</p>`],
      ['Strictly necessary', `
        <p>These are needed for the website to work and to remember your cookie choice. They do not need your consent and cannot be switched off in the banner.</p>
        <table class="lg-table">
          <thead><tr><th>Name</th><th>Purpose</th><th>Provider</th><th>How long</th></tr></thead>
          <tbody>
            <tr>
              <td>blk-consent</td>
              <td>Remembers which cookie categories you allowed, so the banner does not ask again on every page.</td>
              <td>This website (local storage)</td>
              <td>12 months, then you are asked again</td>
            </tr>
            <tr>
              <td>pf-intro-seen</td>
              <td>Remembers that you have seen the opening animation, so it does not play again each time you return to the home page.</td>
              <td>This website (session storage)</td>
              <td>Until you close the browser tab</td>
            </tr>
          </tbody>
        </table>
        <p>Neither contains personal data, and neither is sent to us or to anyone else.</p>`],
      ['Analytics', `
        <p>Analytics cookies help us understand how visitors use the website (for example which pages are visited and for how long), so we can improve it. They are set only if you allow "Analytics" in the banner.</p>
        <p>Tools and cookies used: ${TODO('name of the analytics tool, its cookie names, provider and how long each lasts, once chosen; if none is used at launch, write "None at present."')}</p>`],
      ['Marketing', `
        <p>Marketing cookies are set by advertising partners to show you relevant ads on other websites and to measure them. They are set only if you allow "Marketing" in the banner.</p>
        <p>Tools and cookies used: ${TODO('for example the Meta Pixel or Google Ads, with cookie names, provider and duration, once chosen; if none is used at launch, write "None at present."')}</p>`],
      ['Your choices', `
        <p>You choose in the banner when you first visit: <strong>Accept all</strong>, <strong>Reject all</strong>, or <strong>Settings</strong> to choose by category. You can change or withdraw your choice at any time with <button type="button" class="lg-inline" data-consent-open>Cookie settings</button>, also at the bottom of every page. Withdrawing consent does not affect use before you withdrew it.</p>
        <p>You can also delete or block cookies in your browser's settings. The website works without analytics and marketing cookies.</p>`],
      ['Other websites', `
        <p>The links to WhatsApp, Calendly, Instagram and Facebook, and the phone and email links, only open those services when you click them. Nothing is loaded from them before that. Once you are on their websites or apps, their own cookie and privacy policies apply.</p>`],
      ['Changes', `
        <p>We update this policy whenever we add or remove a tool that uses cookies. The date at the top shows when it last changed. Questions: ${EMAIL}.</p>`],
    ],
  },

  terms: {
    title: 'Terms of Use',
    intro: `These terms apply to your use of this website. By using it you accept them. If you do not agree, please do not use the website.`,
    sections: [
      ['Who runs this website', `<p>${OPERATOR}. Contact: ${EMAIL}, ${PHONE}.</p>`],
      ['Information, not an offer', `
        <p>The packages and descriptions on this website are general information about our services. They are not an offer or a binding quote. What a project includes, its price and its timeline are agreed in a written quote or contract after we have seen the property, and that document takes precedence over anything on this website.</p>`],
      ['Pictures and visualisations', `
        <p>The room animations and some of the pictures on this website, including the opening picture and the kitchen picture at the top of the home page, are computer-generated visualisations made to show the idea of each package. They are not photographs of a particular apartment. Furniture, materials and colours in a real project depend on the apartment, your choices and what suppliers have available.</p>
        <p>The photos under "Our work" and "A real apartment" show apartments we have finished.</p>`],
      ['Client stories and figures', `
        <p>The client stories are from our clients, shortened and lightly edited. Figures such as "+20% more bookings" and "+50% higher daily rate" come from our experience with apartments we have remodelled. Results depend on the location, the price, how the apartment is managed and the market, so they are not a promise of what any one apartment will achieve.</p>`],
      ['Copyright', `
        <p>The text, pictures, videos and design of this website belong to BLK Remodelling or to those who licensed them to us. You may view and share links to the website for personal use; any other copying or use needs our written permission.</p>`],
      ['Links to other websites', `<p>Links to WhatsApp, Calendly, Instagram, Facebook and other websites are provided for convenience. We are not responsible for their content or how they handle your data.</p>`],
      ['Liability', `
        <p>We take care to keep this website accurate and available, but we may change or remove content at any time and cannot promise it is always complete, current or free of errors. To the extent UAE law allows, we are not liable for loss arising from the use of this website. Nothing in these terms limits any liability that cannot be limited by law, or your rights as a consumer under UAE law (including Federal Law No. 15 of 2020 on Consumer Protection).</p>`],
      ['Governing law', `<p>These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Ras Al Khaimah. The courts of Ras Al Khaimah have jurisdiction over any dispute about them.</p>`],
      ['Changes', `<p>We may update these terms; the date at the top shows when they last changed.</p>`],
    ],
  },
};

const RAIL = [['furnishing', 'Furnishing'], ['basic-airbnb', 'Basic Airbnb'], ['upscale-airbnb', 'Upscale Airbnb'], ['donna-branka', 'Donna Branka']];

function page(slug) {
  const p = PAGES[slug];
  const tabs = LEGAL.map(([s, name]) => `    <a href="${s}.html"${s === slug ? ' aria-current="page"' : ''}>${name}</a>`).join('\n');
  const body = p.sections.map(([h, html], i) => `    <section>
      <h2><span>${String(i + 1).padStart(2, '0')}</span>${h}</h2>${html.replace(/\n {8}/g, '\n      ')}
    </section>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.title} · BLK Remodelling</title>
<meta name="description" content="${p.title} of BLK Remodelling, Ras Al Khaimah.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23161009'/><path d='M9 22V10h5.2c2.6 0 4.2 1.3 4.2 3.5 0 1.5-.8 2.5-2 3 1.5.4 2.5 1.5 2.5 3.2 0 2.5-1.8 3.8-4.5 3.8H9zm3-7h2c1 0 1.6-.5 1.6-1.3S15 12.4 14 12.4h-2v2.3zm0 4.7h2.3c1.1 0 1.8-.5 1.8-1.5s-.7-1.4-1.8-1.4H12v2.9z' fill='%23C1502E'/></svg>">
<link rel="preload" href="../assets/fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../css/fonts.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/site.css">
<link rel="stylesheet" href="../css/consent.css">
<link rel="stylesheet" href="../css/legal.css">
<link rel="stylesheet" href="../css/type.css">
</head>
<body>
<!-- Generated by tools/build-legal.mjs. Edit the text there, not here. -->

<header class="site-bar">
  <a class="site-bar__mark" href="../index.html">BLK<span>·</span>REMODELLING</a>
  <nav class="pf-rail" aria-label="Packages">
${RAIL.map(([s, n]) => `    <a class="pf-rail__item" href="../packages/${s}.html"><span class="pf-rail__label">${n}</span></a>`).join('\n')}
  </nav>
</header>

<main class="lg">
  <nav class="lg-tabs" aria-label="Legal">
${tabs}
  </nav>
  <h1 class="lg-title">${p.title}</h1>
  <p class="lg-date">Last updated ${UPDATED}</p>
  <p class="lg-intro">${p.intro}</p>
  <div class="lg-body">
${body}
  </div>
</main>

${footer('../')}

<script src="../js/site.js"></script>
<script src="../js/consent.js"></script>
</body>
</html>
`;
}

fs.mkdirSync('legal', { recursive: true });
for (const [slug] of LEGAL) {
  fs.writeFileSync(`legal/${slug}.html`, page(slug));
  console.log(`legal/${slug}.html`);
}
