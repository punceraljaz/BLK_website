// Home page intro: the La Casa Branka atrium picture for 1.2 s, then a
// 1.3 s glide into the opening as it dissolves into the page (css/intro.css;
// client: "2 seconds and it is the home page"). Runs only when the inline
// script in <head> switched it on (<html class="intro-run intro-on"
// data-seq-hold>): once per browser tab, not under reduced motion, not when
// arriving at a #section; ?intro forces it. A click, key, wheel or touch
// skips to the page at once.
(function () {
  var root = document.documentElement;
  var intro = document.querySelector('.pf-intro');
  if (!intro || !root.classList.contains('intro-run')) return;
  var TEXT_MS = 1200, DISSOLVE_MS = 1300, SKIP_FADE_MS = 450;
  var RELEASE_AT = 0.7;          // share of the dissolve after which the room starts
  var timers = [], phase = 'wait', log = [];
  function mark(p) { phase = p; log.push(p + ' ' + Math.round(performance.now())); }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function start() {
    if (phase !== 'wait') return;
    mark('in');
    intro.classList.add('is-in');
    later(function () { reveal(DISSOLVE_MS, true); }, TEXT_MS);
  }
  // The page comes in under the dissolving picture; the room starts playing now.
  function reveal(ms, dissolve) {
    if (phase === 'reveal' || phase === 'done') return;
    mark('reveal');
    timers.forEach(clearTimeout); timers = [];
    root.classList.remove('intro-on');
    if (dissolve) intro.classList.add('is-out');
    else if (intro.animate) intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease', fill: 'forwards' });
    // The room starts playing once the zoom is mostly done: starting it with
    // the zoom made phones stutter (its frames are decoded and drawn then).
    if (dissolve) later(release, ms * RELEASE_AT); else release();
    later(finish, ms);
  }
  var released = false;
  function release() {
    if (released) return;
    released = true;
    document.dispatchEvent(new Event('seq:release'));
    root.removeAttribute('data-seq-hold');
  }
  function finish() {
    mark('done');
    root.classList.remove('intro-run', 'intro-on');
    release();
    try { sessionStorage.setItem('pf-intro-seen', '1'); } catch (e) {}
    ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (t) { removeEventListener(t, skip, true); });
    intro.remove();
  }

  // Any input skips straight to the page (and never scrolls it meanwhile).
  function skip(e) {
    if (e.type !== 'pointerdown') e.preventDefault();
    if (phase === 'wait' || phase === 'in') reveal(SKIP_FADE_MS);
  }
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (t) {
    addEventListener(t, skip, { capture: true, passive: false });
  });

  // Start at the top, once the picture is decoded (so it never pops in
  // half-loaded); at most 1.2 s of waiting.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  // The wide or the tall picture, by the screen's shape (same test as <head>).
  var img = intro.querySelector('.pf-intro__img');
  img.src = img.getAttribute(matchMedia('(orientation: portrait)').matches ? 'data-tall' : 'data-wide');
  var ready = img && img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  // ... and once the page underneath is built: parsed, its scripts started
  // (the room player starts on DOMContentLoaded, hence the setTimeout) and
  // laid out once. On a phone that work took ~1 s and ran during the hold,
  // so the intro stuttered (measured). At most 2.5 s of waiting.
  var built = new Promise(function (r) {
    function after() { setTimeout(function () { requestAnimationFrame(function () { requestAnimationFrame(r); }); }, 0); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', after); else after();
  });
  Promise.race([Promise.all([ready, built]), new Promise(function (r) { setTimeout(r, 2500); })]).then(function () {
    requestAnimationFrame(function () { requestAnimationFrame(start); });
  });
  // Test aid: window.__pfIntro.log lists each phase with its time (ms since page start).
  window.__pfIntro = { skip: function () { reveal(SKIP_FADE_MS); }, log: log };
})();
