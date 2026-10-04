// Package pages: the shared sections at the top (tools/stories.html).
// Loaded after site.js.

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

// Reviews: the background shows one room before -> during -> after, one
// stage every few seconds while the section is on screen (stopped when it is
// not). Reduced motion: the finished room only. The dock steps aside while
// the section's own buttons are on screen (html.cta-on).
(function () {
  var sec = document.getElementById('reviews');
  if (!sec) return;
  var STAGE_MS = 3200, stage = 0, timer = null;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(n) { stage = n; sec.setAttribute('data-stage', String(n)); }
  show(still ? 2 : 0);
  if (!('IntersectionObserver' in window)) return;
  if (!still) new IntersectionObserver(function (entries) {
    var on = entries[entries.length - 1].isIntersecting;
    if (on && !timer) timer = setInterval(function () { show((stage + 1) % 3); }, STAGE_MS);
    if (!on && timer) { clearInterval(timer); timer = null; }
  }).observe(sec);
  var cta = sec.querySelector('.pf-cta');
  if (cta) new IntersectionObserver(function (entries) {
    document.documentElement.classList.toggle('cta-on', entries[entries.length - 1].isIntersecting);
  }, { rootMargin: '0px 0px -8% 0px' }).observe(cta);
})();
