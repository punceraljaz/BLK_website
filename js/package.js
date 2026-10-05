// Package pages (packages/*.html). Loaded after site.js.

// Before / after: drag (or tap) anywhere on the picture to move the line;
// the hidden range input does the same from the keyboard. Vertical swipes
// still scroll the page (touch-action: pan-y in package.css).
(function () {
  document.querySelectorAll('.pk-ba').forEach(function (fig) {
    var range = fig.querySelector('.pk-ba__range');
    function set(v) {
      v = Math.max(0, Math.min(100, v));
      fig.style.setProperty('--pos', v + '%');
      range.value = String(Math.round(v));
    }
    function fromX(x) { var r = fig.getBoundingClientRect(); set((x - r.left) / r.width * 100); }
    var dragging = false;
    fig.addEventListener('pointerdown', function (e) {
      if (e.target === range && e.pointerType !== 'mouse') return;
      dragging = true; fig.classList.add('is-dragging');
      try { fig.setPointerCapture(e.pointerId); } catch (_) {}
      fromX(e.clientX);
    });
    fig.addEventListener('pointermove', function (e) { if (dragging) fromX(e.clientX); });
    function stop() { dragging = false; fig.classList.remove('is-dragging'); }
    fig.addEventListener('pointerup', stop);
    fig.addEventListener('pointercancel', stop);
    range.addEventListener('input', function () { set(+range.value); });
  });
})();

// The dock steps aside once the closing block with the page's own buttons
// comes on screen (html.cta-on), so the two pairs never overlap.
(function () {
  var cta = document.querySelector('.pk-go');
  if (!cta || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    document.documentElement.classList.toggle('cta-on', entries[entries.length - 1].isIntersecting);
  }, { rootMargin: '0px 0px -10% 0px' }).observe(cta);
})();
