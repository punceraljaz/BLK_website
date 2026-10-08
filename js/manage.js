// Property management page (manage/index.html). Loaded after site.js.

// Assessment form: nothing is sent to this website; it writes the same
// message as the client's old site and opens WhatsApp, where the visitor
// sends it themselves.
(function () {
  var form = document.querySelector('.mg-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    function v(k, fallback) { return String(d.get(k) || '').trim() || fallback; }
    var text = [
      'Hello BLK Orlovic, I would like a free property assessment.',
      '',
      'Name: ' + v('name', ''),
      'Phone: ' + v('phone', ''),
      'Email: ' + v('email', ''),
      'Location: ' + v('location', ''),
      'Building / community: ' + v('building', ''),
      'Unit: ' + v('unitType', ''),
      'Furnishing: ' + v('furnished', ''),
      'Status: ' + v('status', ''),
      'Owner location: ' + v('ownerLocation', 'Not provided'),
      'Notes: ' + v('message', 'None')
    ].join('\n');
    window.open('https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  // "Start this pathway" links preselect the apartment's current status.
  document.querySelectorAll('a[data-status]').forEach(function (a) {
    a.addEventListener('click', function () { form.elements.status.value = a.getAttribute('data-status'); });
  });
})();

// The dock steps aside while the request section is on screen (html.cta-on).
(function () {
  var cta = document.querySelector('.pk-go');
  if (!cta || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    document.documentElement.classList.toggle('cta-on', entries[entries.length - 1].isIntersecting);
  }, { rootMargin: '0px 0px -10% 0px' }).observe(cta);
})();
