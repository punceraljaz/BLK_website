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
