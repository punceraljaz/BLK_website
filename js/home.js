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

// Package rail in the header: highlight the active tab when it changes.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.pf-rail__item'));
  if (!items.length) return;
  document.addEventListener('pf:pkg', function (e) {
    items.forEach(function (it) { it.classList.toggle('is-active', it.getAttribute('href') === '#pkg-' + (e.detail + 1)); });
  });
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
  // Order (client 2026-10-04): photos that look like the same apartment are
  // kept at least three apart, and no two bathrooms sit side by side.
  // The strip loops, so the list is a circle: it starts at the work corner
  // (client 2026-10-05: open on that view), same neighbours as before.
  var PHOTOS = [
    ['17-work-corner', 'Work Corner'], ['34-guest-bathroom', 'Guest Bathroom'], ['09-living-room', 'Living Room'],
    ['25-bathroom-vanity', 'Bathroom Vanity'], ['18-open-plan-living', 'Open-Plan Living'], ['03-studio-living', 'Studio — Living'],
    ['10-living-room', 'Living Room'], ['28-bathroom', 'Bathroom'], ['24-living-dining', 'Living & Dining'],
    ['04-studio-bedroom', 'Studio — Bedroom'], ['12-bedroom', 'Bedroom'], ['20-bedroom', 'Bedroom'],
    ['26-master-bedroom', 'Master Bedroom'], ['21-living-room', 'Living Room'], ['02-guest-bathroom', 'Guest Bathroom'],
    ['29-studio-bedroom', 'Studio — Bedroom'], ['27-living-detail', 'Living Detail'], ['31-living-room', 'Living Room'],
    ['11-bathroom', 'Bathroom'], ['13-kitchen', 'Kitchen'], ['30-hallway', 'Hallway'],
    ['15-bathtub', 'Bathtub'], ['23-studio', 'Studio'], ['19-marble-bathroom', 'Marble Bathroom'],
    ['01-living-dining', 'Living & Dining'], ['14-living-dining', 'Living & Dining'], ['22-guest-bathroom', 'Guest Bathroom'],
    ['05-master-bedroom', 'Master Bedroom'], ['07-vanity-detail', 'Vanity Detail'], ['16-bedroom', 'Bedroom'],
    ['32-vanity-detail', 'Vanity Detail'], ['06-bedroom', 'Bedroom'], ['08-bathroom', 'Bathroom']
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

// Package switcher: tablist rail (desktop) / 2×2 grid (mobile).
// Tabs and panels are built from PK data; JS handles selection, indicator
// animation, Prev/Next, keyboard navigation, and hash routing.
(function () {
  var tabsEl = document.getElementById('pf-sw-tabs');
  var panelsEl = document.getElementById('pf-sw-panels');
  if (!tabsEl || !panelsEl) return;

  var WA = 'https://wa.me/971545979814';
  var PK = [
    { id: 'pkg-1', n: '01', name: 'Furnishing', short: 'Furnish', tag: 'The empty shell, furnished',
      lede: 'Every home starts empty.', desc: 'The essential furniture, delivered and assembled.',
      href: 'packages/furnishing.html',
      wa: "Hi BLK Remodelling, I'd like to know more about the Furnishing package.",
      imgs: [
        { label: 'Bedroom',  view: 'anim',  src: 'assets/img/pk-furnishing-example-1.webp', thumb: 'assets/img/01-bedroom-thumb.webp' },
        { label: 'Dining',   view: 'tv',    src: '', thumb: 'assets/img/01-dining-end-thumb.webp' },
        { label: 'Kitchen',  view: 'still', src: 'assets/img/01-furnishing-kitchen.png',   thumb: 'assets/img/01-furnishing-kitchen.png' },
        { label: 'Bathroom', view: 'still', src: 'assets/img/01-furnishing-bathroom.png',  thumb: 'assets/img/01-furnishing-bathroom.png' }
      ]
    },
    { id: 'pkg-2', n: '02', name: 'Basic Airbnb', short: 'Basic', tag: 'Ready to host',
      lede: 'Furnished. Fitted. Ready to host.', desc: 'Furniture, appliances, linens and kitchenware. Ready for the first guest.',
      href: 'packages/basic-airbnb.html',
      wa: "Hi BLK Remodelling, I'd like to know more about the Basic Airbnb package.",
      imgs: [
        { label: 'Bedroom',   view: 'anim',  src: 'assets/img/pk-basic-airbnb-example-1.webp', thumb: 'assets/img/02-bedroom-thumb.webp' },
        { label: 'TV corner', view: 'tv',    src: '', thumb: 'assets/img/02-tv-end-thumb.webp' },
        { label: 'Kitchen',   view: 'still', src: 'assets/img/02-basic-kitchen.png',            thumb: 'assets/img/02-basic-kitchen.png' },
        { label: 'Bathroom',  view: 'still', src: 'assets/img/02-basic-bathroom.png',           thumb: 'assets/img/02-basic-bathroom.png' }
      ]
    },
    { id: 'pkg-3', n: '03', name: 'High-End Airbnb', short: 'High-End', tag: 'The finer things',
      lede: 'The finer things, already in place.', desc: 'Finer pieces, soft linens, every detail guests notice. Ready to list.',
      href: 'packages/high-end-airbnb.html',
      wa: "Hi BLK Remodelling, I'd like to know more about the High-End Airbnb package.",
      imgs: [
        { label: 'Bedroom',   view: 'anim',  src: 'assets/img/pk-upscale-airbnb-example-1.webp', thumb: 'assets/img/03-bedroom-thumb.webp' },
        { label: 'TV corner', view: 'tv',    src: '', thumb: 'assets/img/03-tv-end-thumb.webp' },
        { label: 'Kitchen',   view: 'still', src: 'assets/img/03-highend-kitchen.png',            thumb: 'assets/img/03-highend-kitchen.png' },
        { label: 'Bathroom',  view: 'still', src: 'assets/img/03-highend-bathroom.png',           thumb: 'assets/img/03-highend-bathroom.png' }
      ]
    },
    { id: 'pkg-4', n: '04', name: 'Donna Branka', short: 'Donna B.', tag: 'The signature package',
      lede: 'Our signature. Finished to the last detail.', desc: 'Designed and styled by Branka. Nothing left to add.',
      note: 'Same apartment as the other packages — layout redesigned through complete remodelling.',
      badge: 'Signature · Best seller',
      href: 'packages/donna-branka.html',
      wa: "Hi BLK Remodelling, I'd like to know more about the Donna Branka package.",
      imgs: [
        { label: 'Bedroom',   view: 'anim',  src: 'assets/img/pk-donna-branka-example-1.webp', thumb: 'assets/img/04-bedroom-thumb.webp' },
        { label: 'TV corner', view: 'tv',    src: '', thumb: 'assets/img/04-tv-end-thumb.webp' },
        { label: 'Kitchen',   view: 'still', src: 'assets/img/03-highend-kitchen.png',           thumb: 'assets/img/03-highend-kitchen.png' },
        { label: 'Bathroom',  view: 'still', src: 'assets/img/04-donna-bathroom.jpg',            thumb: 'assets/img/04-donna-bathroom.jpg' }
      ]
    }
  ];

  var lvl = function (i) {
    return '<span class="pf-sw__level" aria-hidden="true">' +
      [0,1,2,3].map(function (k) { return '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('') +
      '</span>';
  };

  // Build tabs
  var tabs = PK.map(function (p, i) {
    var t = document.createElement('button');
    t.className = 'pf-sw__tab'; t.type = 'button'; t.id = 'pf-sw-tab-' + (i + 1);
    t.setAttribute('role', 'tab'); t.setAttribute('aria-controls', p.id);
    t.setAttribute('aria-selected', 'false'); t.tabIndex = -1;
    t.innerHTML =
      '<span class="pf-sw__tthumb" aria-hidden="true"><img src="' + p.imgs[0].thumb + '" alt="" loading="lazy"></span>' +
      '<span class="pf-sw__ttext">' +
        '<span class="pf-sw__tn">' + p.n + '</span>' +
        '<span class="pf-sw__tname">' + p.name + '</span>' +
        '<span class="pf-sw__tshort">' + (p.short || p.name) + '</span>' +
        '<span class="pf-sw__ttag">' + p.tag + '</span>' +
      '</span>' +
      '<span class="pf-sw__tgo" aria-hidden="true">→</span>';
    t.addEventListener('click', function () { go(i); });
    tabsEl.appendChild(t);
    return t;
  });

  // Build panels (copy-only; the frame lives in the shared pf-sw__seq-wrap above)
  var panels = PK.map(function (p, i) {
    var sec = document.createElement('article');
    sec.className = 'pf-sw__panel'; sec.id = p.id;
    sec.setAttribute('role', 'tabpanel'); sec.setAttribute('aria-labelledby', 'pf-sw-tab-' + (i + 1));
    sec.inert = true;

    sec.innerHTML =
      '<div class="pf-sw__copy">' +
        '<span class="pf-sw__big" aria-hidden="true">' + p.n + '</span>' +
        '<div class="pf-sw__copymain">' +
          '<div class="pf-sw__meta"><span>Package ' + p.n + ' of 04</span>' + lvl(i) + '</div>' +
          '<h2 class="pf-sw__name">' + p.name + '</h2>' +
          '<p class="pf-sw__lede">' + p.lede + '</p>' +
          '<p class="pf-sw__desc">' + p.desc + '</p>' +
          (p.note ? '<p class="pf-sw__note-mobile pf-sw__note">' + p.note + '</p>' : '') +
        '</div>' +
        '<div class="pf-sw__ctas">' +
          '<a class="pf-sw__link pf-sw__link--primary" href="' + p.href + '">More about the package and price →</a>' +
          '<a class="pf-sw__link" href="' + WA + '?text=' + encodeURIComponent(p.wa) + '" target="_blank" rel="noopener" data-choose="wa" data-wa-text="' + p.wa + '" aria-haspopup="menu">Ask on WhatsApp</a>' +
        '</div>' +
      '</div>';

    panelsEl.appendChild(sec);
    return sec;
  });

  // Shared frame helpers (the canvas + still overlay in pf-sw__seq-frame)
  var seqEl = document.getElementById('pf-sw-seq');
  var tvEl = document.getElementById('pf-sw-tv-seq');
  var seqRoomChip = document.getElementById('pf-sw-seq-room');
  var seqBadge = document.getElementById('pf-sw-seq-badge');
  var seqNote = document.getElementById('pf-sw-seq-note');
  var seqStill = document.getElementById('pf-sw-seq-still');
  var seqThumbsEl = document.getElementById('pf-sw-thumbs');

  function showAnimation() {
    if (seqEl) seqEl.classList.remove('show-still', 'show-tv');
  }
  function showStill(src, label) {
    if (!seqEl || !seqStill) return;
    seqStill.src = src;
    seqStill.alt = label || '';
    seqEl.classList.add('show-still');
    seqEl.classList.remove('show-tv');
  }
  function showTv(i) {
    if (!seqEl || !tvEl || !tvEl.__seq) return;
    tvEl.__seq.start();       // no-op if already started; downloads lazily on first call
    tvEl.__seq.playClip(i);
    seqEl.classList.add('show-tv');
    seqEl.classList.remove('show-still');
  }

  function updateThumbs(i) {
    if (!seqThumbsEl) return;
    seqThumbsEl.innerHTML = PK[i].imgs.map(function (im, j) {
      return '<button type="button" class="pf-sw__th" aria-pressed="' + (j === 0 ? 'true' : 'false') +
        '" aria-label="Show ' + im.label + '" data-src="' + (im.src || '') + '" data-view="' + (im.view || 'still') + '">' +
        '<img src="' + im.thumb + '" alt="' + im.label + '" loading="lazy"></button>';
    }).join('');
    seqThumbsEl.querySelectorAll('.pf-sw__th').forEach(function (b) {
      b.addEventListener('click', function () {
        seqThumbsEl.querySelectorAll('.pf-sw__th').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        if (seqRoomChip) seqRoomChip.textContent = b.getAttribute('aria-label').replace('Show ', '');
        var view = b.dataset.view;
        if (view === 'tv') {
          showTv(cur);
        } else if (view === 'anim') {
          showAnimation();
        } else {
          showStill(b.dataset.src, b.getAttribute('aria-label').replace('Show ', ''));
        }
      });
    });
  }

  // Indicator + fill line placement
  var indEl = document.getElementById('pf-sw-ind');
  var hlboxEl = document.getElementById('pf-sw-hlbox');
  function placeInd(i) {
    var t = tabs[i]; if (!t || !indEl) return;
    var y = t.offsetTop + t.offsetHeight / 2;
    indEl.style.transform = 'translateY(' + (y - 5.5) + 'px)';
    tabsEl.style.setProperty('--fill', Math.max(0, y - 36) + 'px');
    if (hlboxEl) { hlboxEl.style.transform = 'translateY(' + t.offsetTop + 'px)'; hlboxEl.style.height = t.offsetHeight + 'px'; }
  }

  var cur = -1;
  var firstGo = true;   // clip 0 plays on load automatically; skip playClip on first call
  var prevBtn = document.getElementById('pf-sw-prev');
  var nextBtn = document.getElementById('pf-sw-next');
  var countEl = document.getElementById('pf-sw-count');
  var segs = Array.prototype.slice.call(document.querySelectorAll('#pf-sw-segs i'));

  function go(i, opts) {
    opts = opts || {};
    i = Math.max(0, Math.min(PK.length - 1, i));
    if (i === cur) return;
    cur = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('is-done', k < i);
    });
    panels.forEach(function (p, k) {
      var on = k === i;
      p.classList.toggle('is-active', on);
      p.inert = !on;
      p.setAttribute('aria-hidden', !on);
    });
    segs.forEach(function (s, k) { s.classList.toggle('on', k <= i); });
    if (prevBtn) prevBtn.disabled = (i === 0);
    if (nextBtn) nextBtn.disabled = (i === PK.length - 1);
    if (countEl) countEl.innerHTML = PK[i].n + ' <span>/ 04</span>';
    requestAnimationFrame(function () { placeInd(i); });
    document.dispatchEvent(new CustomEvent('pf:pkg', { detail: i }));
    if (opts.focus) tabs[i].focus();
    if (!opts.noHistory) try { history.replaceState(null, '', '#' + PK[i].id); } catch (e) {}

    // Play the room animation clip for this package.
    // Skip on first call: clip 0 plays automatically on load.
    if (seqEl && seqEl.__seq && !firstGo) seqEl.__seq.playClip(i);
    firstGo = false;

    // Update badge chip
    if (seqBadge) {
      seqBadge.textContent = PK[i].badge || '';
      seqBadge.style.display = PK[i].badge ? '' : 'none';
    }
    // Update note chip (bottom-left)
    if (seqNote) {
      seqNote.textContent = PK[i].note || '';
      seqNote.style.display = PK[i].note ? '' : 'none';
    }

    // Reset to animation view and update thumbnails
    showAnimation();
    if (seqRoomChip) seqRoomChip.textContent = PK[i].imgs[0].label;
    updateThumbs(i);
  }

  // Keyboard nav within tablist
  tabsEl.addEventListener('keydown', function (e) {
    var vert = getComputedStyle(tabsEl).gridTemplateColumns.split(' ').length === 1;
    var to = null;
    if (e.key === 'ArrowDown') to = cur + (vert ? 1 : 2);
    if (e.key === 'ArrowUp')   to = cur - (vert ? 1 : 2);
    if (e.key === 'ArrowRight') to = cur + 1;
    if (e.key === 'ArrowLeft')  to = cur - 1;
    if (e.key === 'Home') to = 0;
    if (e.key === 'End')  to = PK.length - 1;
    if (to !== null) { e.preventDefault(); go(Math.max(0, Math.min(3, to)), { focus: true }); }
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { go(cur - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(cur + 1); });

  // Swipe on the shared animation frame
  var sx = null, sy = null;
  var swipeTarget = seqEl || panelsEl;
  swipeTarget.addEventListener('touchstart', function (e) {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  swipeTarget.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
  });

  // Clicks on header rail or anchor links
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#pkg-"]');
    if (a) {
      e.preventDefault();
      var idx = parseInt(a.getAttribute('href').slice(5), 10) - 1;
      go(idx);
      document.getElementById('packages').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  window.addEventListener('resize', function () { placeInd(cur); });
  document.fonts && document.fonts.ready.then(function () { placeInd(cur); });

  // Always start on Furnishing (pkg-1); suppress hash so browser doesn't scroll to anchor on next load
  go(0, { focus: false, noHistory: true });
  if (/^#pkg-[1-4]$/.test(location.hash)) {
    setTimeout(function () { document.getElementById('packages').scrollIntoView({ block: 'start' }); }, 100);
  }
})();

// Hide packages section and dock until user scrolls to them; re-hide when scrolling back up.
// Arrow fades out when packages appear, fades back in when hidden again.
(function () {
  var sw = document.getElementById('packages');
  var dock = document.querySelector('.pf-dock');
  var arrow = document.querySelector('.pf-sw-intro__arrow');
  if (!sw || !('IntersectionObserver' in window)) return;
  sw.classList.add('pf-sw--pre');
  if (dock) dock.classList.add('pf-dock--pre');
  new IntersectionObserver(function (entries) {
    var e = entries[0];
    if (e.isIntersecting) {
      sw.classList.remove('pf-sw--pre');
      if (dock) dock.classList.remove('pf-dock--pre');
      if (arrow) arrow.classList.add('pf-sw-intro__arrow--gone');
    } else if (e.boundingClientRect.top > 0) {
      sw.classList.add('pf-sw--pre');
      if (dock) dock.classList.add('pf-dock--pre');
      if (arrow) arrow.classList.remove('pf-sw-intro__arrow--gone');
    }
  }, { rootMargin: '0px 0px -35% 0px', threshold: 0.01 }).observe(sw);
})();

