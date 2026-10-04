// Home page intro: the client's picture, text and crest sharpening out of a
// blur (css/intro.css), then at 3 s the picture fades into the page (client:
// "3 seconds, no more"). Runs only when the inline script in <head> switched
// it on (<html class="intro-run intro-on" data-seq-hold>): once per browser
// tab, not under reduced motion, not when arriving at a #section; ?intro
// forces it. A click, key, wheel or touch skips to the page at once.
(function () {
  var root = document.documentElement;
  var intro = document.querySelector('.pf-intro');
  if (!intro || !root.classList.contains('intro-run')) return;
  // 3 s of text, then a 1.8 s dissolve (css .is-out: the words blur back, the
  // picture drifts closer and fades). A skip fades out quickly instead.
  var TEXT_MS = 3000, DISSOLVE_MS = 1800, SKIP_FADE_MS = 450;
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
    document.dispatchEvent(new Event('seq:release'));
    root.removeAttribute('data-seq-hold');
    root.classList.remove('intro-on');
    if (dissolve) intro.classList.add('is-out');
    else if (intro.animate) intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease', fill: 'forwards' });
    later(finish, ms);
  }
  function finish() {
    mark('done');
    root.classList.remove('intro-run', 'intro-on');
    root.removeAttribute('data-seq-hold');
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
  var img = intro.querySelector('.pf-intro__img');
  var ready = img && img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  Promise.race([ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () {
    requestAnimationFrame(function () { requestAnimationFrame(start); });
  });
  // Test aid: window.__pfIntro.log lists each phase with its time (ms since page start).
  window.__pfIntro = { skip: function () { reveal(SKIP_FADE_MS); }, log: log };
})();
