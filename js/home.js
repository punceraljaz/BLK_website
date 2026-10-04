// Home page scripts (index.html). Loaded after scroll-sequence.js, site.js
// and strip-gallery.js.

// Reveal on entry: [data-sc-in] gets .sc-in once it scrolls into view.
(function () {
  var els = document.querySelectorAll('[data-sc-in]');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('sc-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('sc-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  els.forEach(function (el) { io.observe(el); });
})();

// Floorplan (package 04): measure the two drawn paths once, so CSS can draw
// them in with stroke-dashoffset.
(function () {
  var shell = document.querySelector('.plan-shell');
  var wall = document.querySelector('.plan-wall-new');
  if (shell) shell.style.setProperty('--len-shell', shell.getTotalLength());
  if (wall) wall.style.setProperty('--len-wall', wall.getTotalLength());
})();

// Hero: while the image band at the top is on screen (below the header's
// height), html.hero-on hides the fixed header, which would repeat its logo
// and package menu.
(function () {
  var hero = document.querySelector('.pf-hero');
  var root = document.documentElement;
  if (!hero || !('IntersectionObserver' in window)) { root.classList.remove('hero-on'); return; }
  new IntersectionObserver(function (entries) {
    root.classList.toggle('hero-on', entries[entries.length - 1].isIntersecting);
  }, { rootMargin: '-76px 0px 0px 0px' }).observe(hero);
})();

// Package rail: highlights whichever package is crossing the screen's
// centre (a -48%/-48% rootMargin collapses the trigger zone to a thin band).
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.pf-rail__item'));
  if (!items.length) return;
  var byId = {};
  items.forEach(function (it) { byId[it.dataset.target] = it; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var match = entry.isIntersecting && byId[entry.target.id];
      if (!match) return;
      items.forEach(function (it) { it.classList.toggle('is-active', it === match); });
    });
  }, { threshold: 0, rootMargin: '-48% 0px -48% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });
})();

// Current package: marks the package section (01-04) whose top is nearest
// the scroll position with .is-current, which shows its fixed text page (it
// swaps halfway between two packages; none while the hero above fills the
// screen). The one it replaces gets .is-leaving
// for the slide-out. Once the first section after the room fills half the
// screen, none is current and the text leaves with the room.
(function () {
  var els = ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4'].map(function (id) { return document.getElementById(id); });
  var after = document.getElementById('why');
  if (els.some(function (el) { return !el; })) return;
  var current = null, queued = false;
  function update() {
    queued = false;
    var best = null, bestD = Infinity;
    els.forEach(function (el) {
      var d = Math.abs(el.getBoundingClientRect().top);
      if (d < bestD) { bestD = d; best = el; }
    });
    if (after && after.getBoundingClientRect().top < innerHeight * 0.5) best = null;
    if (els[0].getBoundingClientRect().top > innerHeight * 0.3) best = null;   // the hero is still in the way
    if (best === current) return;
    if (current) {
      var old = current;
      old.classList.remove('is-current');
      old.classList.add('is-leaving');
      setTimeout(function () { old.classList.remove('is-leaving'); }, 650);
    }
    if (best) { best.classList.remove('is-leaving'); best.classList.add('is-current'); }
    current = best;
    document.documentElement.classList.toggle('room-wide', best === els[3]);
    document.dispatchEvent(new CustomEvent('pf:current', { detail: best ? best.id : null }));
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  addEventListener('load', queue);
  update();
})();

// Room views (the thumbnails under each package). The chosen view is
// remembered while scrolling:
//   Bedroom (data-view="bedroom") - the main room chain.
//   Dining / TV corner (data-view="tv") - the second chain (.pf-tv-view),
//     scrubbed by the same scroll, so moving to another package plays that
//     corner's transition. Picking it also plays the current package's
//     transition once in place.
//   Kitchen / Bathroom (data-full) - a photo over the view, package 01 only;
//     changing package clears it.
// The hidden chain stops drawing (setActive) once the cross-fade is over.
(function () {
  var btns = Array.prototype.slice.call(document.querySelectorAll('.pf-room'));
  var mainEl = document.querySelector('.pf-room-layer');
  var tvEl = document.querySelector('.pf-tv-view');
  var still = document.querySelector('.pf-room-frame .pf-room-view--still');
  if (!btns.length || !mainEl || !tvEl || !still) return;
  var root = document.documentElement, FADE = 750, view = 'bedroom', fadeTimer = 0;
  function seq(el) { return el.__seq; }
  function pkgIndex(btn) {                      // pkg-3 -> 2
    var s = btn.closest('section[id^="pkg-"]');
    return s ? parseInt(s.id.slice(4), 10) - 1 : 0;
  }
  function markRow(btn) {
    btn.closest('.pf-rooms').querySelectorAll('.pf-room').forEach(function (b) {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
  }
  function markAll() {                          // every row shows the current view
    document.querySelectorAll('.pf-rooms').forEach(function (row) {
      var pick = row.querySelector('.pf-room[data-view="' + view + '"]');
      if (pick) markRow(pick);
    });
  }
  function setView(v) {
    if (!seq(mainEl) || !seq(tvEl)) return;
    view = v;
    clearTimeout(fadeTimer);
    if (v === 'tv') {
      seq(tvEl).start();
      seq(tvEl).setActive(true);
      root.classList.add('view-tv');
      fadeTimer = setTimeout(function () { if (view === 'tv') seq(mainEl).setActive(false); }, FADE);
    } else {
      seq(mainEl).setActive(true);
      root.classList.remove('view-tv');
      fadeTimer = setTimeout(function () { if (view === 'bedroom') seq(tvEl).setActive(false); }, FADE);
    }
  }
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      markRow(btn);
      if (btn.dataset.full) {                   // a photo over the current view
        still.src = btn.dataset.full;
        still.classList.add('is-shown');
        return;
      }
      still.classList.remove('is-shown');
      setView(btn.dataset.view === 'tv' ? 'tv' : 'bedroom');
      if (view === 'tv') seq(tvEl).playClip(pkgIndex(btn));
      markAll();
    });
    // Start downloading the TV view when the pointer reaches its thumbnail.
    if (btn.dataset.view === 'tv') btn.addEventListener('pointerenter', function () {
      if (seq(tvEl)) seq(tvEl).start();
    }, { once: true });
  });
  document.addEventListener('pf:current', function () {
    still.classList.remove('is-shown');
    markAll();
  });
  // Until the TV view is first picked, its (lazy) chain draws nothing.
  function park() { if (seq(tvEl)) seq(tvEl).setActive(false); else setTimeout(park, 50); }
  park();
})();

// About: the studio's local time, refreshed every 20 s.
(function () {
  var el = document.querySelector('.pf-about-time');
  if (!el || !window.Intl) return;
  var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: el.getAttribute('data-tz') });
  function tick() { el.textContent = fmt.format(new Date()); }
  tick(); setInterval(tick, 20000);
})();

// "Our work" photo strip (StripGallery). Vertical wheel is left to the page
// (wheelMode 'horizontal'); drag, arrows and sideways trackpad move it.
// Built only when the visitor gets within ~1.5 screens of it: it requests
// every photo at once (5 MB), which must not compete with the room frames.
(function () {
  var root = document.getElementById('work-strip');
  if (!root) return;
  // assets/gallery/<name>.webp (+ <name>-thumb.webp). 10-34 are from
  // Desktop\PICS, converted by tools/import-photos.mjs; 33 (same shot as 19) removed.
  var PHOTOS = [
    ['01-living-dining', 'Living & Dining'], ['02-guest-bathroom', 'Guest Bathroom'], ['03-studio-living', 'Studio — Living'],
    ['04-studio-bedroom', 'Studio — Bedroom'], ['05-master-bedroom', 'Master Bedroom'], ['06-bedroom', 'Bedroom'],
    ['07-vanity-detail', 'Vanity Detail'], ['08-bathroom', 'Bathroom'], ['09-living-room', 'Living Room'],
    ['10-living-room', 'Living Room'], ['11-bathroom', 'Bathroom'], ['12-bedroom', 'Bedroom'],
    ['13-kitchen', 'Kitchen'], ['14-living-dining', 'Living & Dining'], ['15-bathtub', 'Bathtub'],
    ['16-bedroom', 'Bedroom'], ['17-work-corner', 'Work Corner'], ['18-open-plan-living', 'Open-Plan Living'],
    ['19-marble-bathroom', 'Marble Bathroom'], ['20-bedroom', 'Bedroom'], ['21-living-room', 'Living Room'],
    ['22-guest-bathroom', 'Guest Bathroom'], ['23-studio', 'Studio'], ['24-living-dining', 'Living & Dining'],
    ['25-bathroom-vanity', 'Bathroom Vanity'], ['26-master-bedroom', 'Master Bedroom'], ['27-living-detail', 'Living Detail'],
    ['28-bathroom', 'Bathroom'], ['29-studio-bedroom', 'Studio — Bedroom'], ['30-hallway', 'Hallway'],
    ['31-living-room', 'Living Room'], ['32-vanity-detail', 'Vanity Detail'], ['34-guest-bathroom', 'Guest Bathroom']
  ];
  var items = PHOTOS.map(function (p) {
    var base = 'assets/gallery/' + p[0];
    return { src: base + '.webp', thumb: base + '-thumb.webp', title: p[1] };
  });
  var wa = document.getElementById('work-wa');
  // The WhatsApp message names the photo on screen.
  function updateWa(item) {
    if (!wa || !item) return;
    var msg = 'Hi! I saw the "' + item.title + '" project on your website and would like a quote for my apartment.';
    wa.href = 'https://wa.me/971545979814?text=' + encodeURIComponent(msg);
    wa.setAttribute('data-wa-text', msg);       // the number chooser adds it to both numbers
  }
  function init() {
    if (!window.StripGallery) return;
    root.addEventListener('sg:change', function (e) { updateWa(e.detail.item); });
    var strip = StripGallery(root, {
      label: 'Our work',
      wheelMode: 'horizontal',
      slide: true,            // the row glides
      growDuration: 0.55,     // s: the new photo grows, the old one shrinks
      springScale: 0.45,      // calmer glide to the next photo
      dragFriction: 0.35,     // a flick glides about one photo, not several
      maxFlickSpeed: 3,
      wheelStep: 180,         // sideways trackpad needs a longer swipe per photo
      items: items
    });
    updateWa(strip.item);
  }
  if (!('IntersectionObserver' in window)) { init(); return; }
  var io = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    init();
  }, { rootMargin: '150% 0px' });
  io.observe(root);
})();

// Test aid, off unless asked for in the address:
//   ?fps  corner readout: frames per second and how frames are decoded
(function () {
  if (!/[?&]fps\b/.test(location.search)) return;
  var badge = document.createElement('div');
  badge.className = 'pf-fps';
  document.body.appendChild(badge);
  var frames = 0, worst = 0, last = performance.now(), prev = last;
  (function tick(now) {
    frames++; worst = Math.max(worst, now - prev); prev = now;
    if (now - last >= 1000) {
      var s = document.querySelector('[data-seq-chain]').__seq;
      var mode = s && s.clips.every(function (c) { return c.set.useVideo; }) ? 'GPU video' : 'slike (CPU)';
      badge.textContent = Math.round(frames * 1000 / (now - last)) + ' fps · najdaljša ' +
        Math.round(worst) + ' ms · ' + mode + (location.protocol === 'file:' ? ' · file://' : '');
      frames = 0; worst = 0; last = now;
    }
    requestAnimationFrame(tick);
  })(last);
})();
