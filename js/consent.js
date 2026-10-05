/* Cookie consent (2026-10-05, client: "a cookie notice like every site").
   Loaded on every page. Shows a small banner until the visitor chooses;
   "Accept all" and "Reject all" are equally prominent (GDPR), "Settings"
   opens per-category switches. The choice is kept in localStorage
   ('blk-consent', strictly necessary) for 12 months, then asked again.
   Any link or button with [data-consent-open] reopens it (footer: "Cookie
   settings").

   Gating scripts that set cookies (analytics, marketing): add them as
     <script type="text/plain" data-consent="analytics" src="..."></script>
   They run only once that category is allowed. Code can also use
     BLKConsent.on('analytics', fn)   // runs fn now or when allowed
   and listen for the 'blk:consent' event. Every tool added this way must
   also be listed in tools/build-legal.mjs (Cookie Policy). */
(function () {
  var KEY = 'blk-consent', VERSION = 1, MAX_AGE = 365 * 24 * 3600 * 1000;
  var CATS = [
    ['necessary', 'Strictly necessary', 'Needed for the website to work, for example to remember this choice. Always on.'],
    ['analytics', 'Analytics', 'Help us understand how visitors use the website, so we can improve it. Counted anonymously.'],
    ['marketing', 'Marketing', 'Used by advertising partners to show you relevant ads on other websites and measure them.'],
  ];
  var root = document.documentElement;
  var up = /\/(packages|legal)\//.test(location.pathname) ? '../' : '';
  var state = read(), waiting = { analytics: [], marketing: [] }, box;

  function read() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === VERSION && Date.now() - s.t < MAX_AGE) return s;
    } catch (e) {}
    return null;
  }
  function save(analytics, marketing) {
    state = { v: VERSION, t: Date.now(), necessary: true, analytics: !!analytics, marketing: !!marketing };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    apply();
    close();
    try { window.dispatchEvent(new CustomEvent('blk:consent', { detail: state })); } catch (e) {}
  }
  function allowed(cat) { return cat === 'necessary' || !!(state && state[cat]); }

  // Run what the choice allows: queued callbacks and type="text/plain" scripts.
  function apply() {
    ['analytics', 'marketing'].forEach(function (cat) {
      if (!allowed(cat)) return;
      waiting[cat].splice(0).forEach(function (fn) { try { fn(); } catch (e) {} });
      document.querySelectorAll('script[type="text/plain"][data-consent="' + cat + '"]').forEach(function (old) {
        var s = document.createElement('script');
        for (var i = 0; i < old.attributes.length; i++) {
          var a = old.attributes[i];
          if (a.name !== 'type' && a.name !== 'data-consent') s.setAttribute(a.name, a.value);
        }
        s.text = old.text;
        old.replaceWith(s);
      });
    });
  }

  function build() {
    box = document.createElement('section');
    box.className = 'cc';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'cc-title');
    box.innerHTML =
      '<h2 class="cc__title" id="cc-title">Cookies</h2>' +
      '<p class="cc__text">We use cookies that are needed for the website to work and, only if you allow them, cookies for analytics and marketing. You can change your choice at any time under Cookie settings at the bottom of every page. <a href="' + up + 'legal/cookies.html">Cookie Policy</a></p>' +
      '<div class="cc__prefs" hidden>' + CATS.map(function (c) {
        var fixed = c[0] === 'necessary';
        return '<label class="cc__cat"><span class="cc__cat-text"><b>' + c[1] + '</b><small>' + c[2] + '</small></span>' +
          '<input type="checkbox" class="cc__switch" name="' + c[0] + '"' + (fixed ? ' checked disabled' : '') + '></label>';
      }).join('') + '</div>' +
      '<div class="cc__actions">' +
        '<button type="button" class="cc__btn" data-cc="reject">Reject all</button>' +
        '<button type="button" class="cc__btn" data-cc="accept">Accept all</button>' +
        '<button type="button" class="cc__btn cc__btn--link" data-cc="settings">Settings</button>' +
        '<button type="button" class="cc__btn cc__btn--link" data-cc="save" hidden>Save my choice</button>' +
      '</div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]');
      if (!b) return;
      var act = b.getAttribute('data-cc');
      if (act === 'accept') save(true, true);
      else if (act === 'reject') save(false, false);
      else if (act === 'settings') prefs(true);
      else if (act === 'save') save(box.querySelector('[name=analytics]').checked, box.querySelector('[name=marketing]').checked);
    });
    document.body.appendChild(box);
  }
  function prefs(show) {
    box.querySelector('.cc__prefs').hidden = !show;
    box.querySelector('[data-cc=settings]').hidden = show;
    box.querySelector('[data-cc=save]').hidden = !show;
    if (show) {
      box.querySelector('[name=analytics]').checked = allowed('analytics');
      box.querySelector('[name=marketing]').checked = allowed('marketing');
    }
  }
  function open(withPrefs) {
    if (!box) build();
    prefs(!!withPrefs);
    root.classList.add('cc-open');
    box.classList.add('is-open');
  }
  function close() {
    root.classList.remove('cc-open');
    if (box) box.classList.remove('is-open');
  }

  window.BLKConsent = {
    get: function () { return state; },
    allowed: allowed,
    open: open,
    on: function (cat, fn) { if (allowed(cat)) fn(); else if (waiting[cat]) waiting[cat].push(fn); },
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-consent-open]');
    if (t) { e.preventDefault(); open(true); }
  });

  function start() {
    apply();
    if (state) return;
    // On the home page, wait until the intro has finished.
    if (root.classList.contains('intro-on')) {
      var mo = new MutationObserver(function () {
        if (!root.classList.contains('intro-on')) { mo.disconnect(); setTimeout(function () { open(false); }, 600); }
      });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    } else open(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
