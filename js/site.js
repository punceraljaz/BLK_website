// Shared by index.html and the package pages.
// Number chooser: anything with data-choose="call" or "wa" opens a small
// menu with both numbers instead of going straight to one. "wa" links keep
// a pre-filled message from their data-wa-text. Without JS the plain href
// (first number) still works.
(function () {
  var NUMBERS = [
    { digits: '971545979814', label: '+971 54 597 9814' },
    { digits: '971504985529', label: '+971 50 498 5529' }
  ];
  var menu = document.createElement('div');
  menu.className = 'pf-choose';
  menu.setAttribute('role', 'menu');
  document.body.appendChild(menu);
  var openFor = null;

  function close() {
    if (!openFor) return;
    menu.classList.remove('is-open');
    openFor.setAttribute('aria-expanded', 'false');
    openFor = null;
  }
  function open(trigger) {
    var kind = trigger.getAttribute('data-choose');
    var text = trigger.getAttribute('data-wa-text');
    menu.innerHTML = '<p class="pf-choose__head">' + (kind === 'wa' ? 'WhatsApp' : 'Call us') + '</p>' +
      NUMBERS.map(function (n) {
        var href = kind === 'wa'
          ? 'https://wa.me/' + n.digits + (text ? '?text=' + encodeURIComponent(text) : '')
          : 'tel:+' + n.digits;
        return '<a role="menuitem" href="' + href + '"' + (kind === 'wa' ? ' target="_blank" rel="noopener"' : '') + '>' +
          n.label + '<span>' + (kind === 'wa' ? 'Chat' : 'Call') + '</span></a>';
      }).join('');
    // above the trigger, centred on it, kept inside the screen
    menu.style.left = '0px'; menu.style.top = '0px';
    menu.classList.add('is-open');
    var r = trigger.getBoundingClientRect(), m = menu.getBoundingClientRect(), pad = 12;
    var left = Math.max(pad, Math.min(innerWidth - m.width - pad, r.left + r.width / 2 - m.width / 2));
    var top = r.top - m.height - 10;
    if (top < pad) top = r.bottom + 10;
    menu.style.left = left + 'px'; menu.style.top = top + 'px';
    openFor = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    menu.querySelector('a').focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-choose]');
    if (trigger) {
      e.preventDefault();
      if (openFor === trigger) close(); else { close(); open(trigger); }
      return;
    }
    if (!menu.contains(e.target)) close();
    else if (e.target.closest('a')) setTimeout(close, 0);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  addEventListener('scroll', close, { passive: true });
  addEventListener('resize', close);
})();

// Before/after compare sliders
document.querySelectorAll('.pk-compare').forEach(function (el) {
  function set(clientX) {
    var r = el.getBoundingClientRect();
    var p = Math.max(0.04, Math.min(0.96, (clientX - r.left) / r.width));
    el.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  }
  var active = false;

  // Hint: pure JS animation so it never conflicts with the drag inline style
  var hintRaf = null;
  var hintTimer = setTimeout(function () {
    var start = null, dur = 2000;
    function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function frame(ts) {
      if (active) return;
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      // 0→40%: slide to 18%, 40→60%: hold, 60→100%: slide back to 50%
      var p = t < 0.4 ? 50 - 32 * ease(t / 0.4)
            : t < 0.6 ? 18
            : 18 + 32 * ease((t - 0.6) / 0.4);
      el.style.setProperty('--p', p.toFixed(1) + '%');
      if (t < 1) { hintRaf = requestAnimationFrame(frame); }
      else { el.style.removeProperty('--p'); }
    }
    hintRaf = requestAnimationFrame(frame);
  }, 800);

  el.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    clearTimeout(hintTimer);
    if (hintRaf) { cancelAnimationFrame(hintRaf); hintRaf = null; }
    active = true;
    el.setPointerCapture(e.pointerId);
    set(e.clientX);
  });
  el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  el.addEventListener('pointermove', function (e) { if (active) set(e.clientX); });
  el.addEventListener('pointerup', function () { active = false; });
  el.addEventListener('pointercancel', function () { active = false; });
});
