/* Meta Pixel (Facebook and Instagram ads), ready for when Meta ads start.
   OFF until META_PIXEL_ID is filled in. Even then it loads only after the
   visitor allows "Marketing" in the cookie banner (js/consent.js); before
   that nothing is sent to Meta. Load this after consent.js.

   Turning it on (all three, or the legal pages are wrong):
     1. META_PIXEL_ID below = the Pixel ID from Meta Events Manager.
     2. tools/build-legal.mjs: META_ADS = true, then node tools/build-legal.mjs
     3. In Events Manager: accept the Meta Business Tools Terms; leave
        "Automatic Advanced Matching" OFF (it would send what visitors type).

   Events sent (named in the Privacy Policy): PageView on each page,
   Schedule on a click to Calendly, Contact on a click to WhatsApp / phone. */
(function () {
  var META_PIXEL_ID = '';
  if (!META_PIXEL_ID || !window.BLKConsent) return;

  function load() {
    if (window.fbq) return;
    /* Meta's standard base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
  BLKConsent.on('marketing', load);

  // Clicks that matter for the ads, only once the pixel runs.
  document.addEventListener('click', function (e) {
    if (!window.fbq || !BLKConsent.allowed('marketing')) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (/calendly\.com/.test(h)) fbq('track', 'Schedule');
    else if (/wa\.me|^tel:/.test(h) || a.hasAttribute('data-choose')) fbq('track', 'Contact');
  }, true);

  // Consent withdrawn: remove Meta's cookies on this site (_fbp, _fbc).
  // The pixel no longer loads from the next page on.
  window.addEventListener('blk:consent', function (e) {
    if (e.detail && e.detail.marketing) return;
    var host = location.hostname, parts = host.split('.'), domains = ['', host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    domains.push('.' + host);
    ['_fbp', '_fbc'].forEach(function (name) {
      domains.forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
      });
    });
  });
})();
