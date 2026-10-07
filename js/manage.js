// Property management page (manage/index.html). Loaded after site.js.

// Apartment filter: one type at a time, "All homes" shows every card.
(function () {
  var buttons = document.querySelectorAll('.mg-filters button');
  var cards = document.querySelectorAll('.mg-apt');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-filter');
      buttons.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      cards.forEach(function (c) { c.hidden = !!t && c.getAttribute('data-type') !== t; });
    });
  });
})();

// Request form: nothing is sent to this website; it writes the message and
// opens WhatsApp with it, where the visitor sends it themselves.
(function () {
  var form = document.querySelector('.mg-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    function v(k, fallback) { return String(d.get(k) || '').trim() || fallback; }
    var text = [
      'Hello ' + form.getAttribute('data-brand') + ',',
      '',
      'We need corporate accommodation in Ras Al Khaimah.',
      'Company: ' + v('company', 'Not specified'),
      'Employees: ' + v('employees', 'Not specified'),
      'Apartment type: ' + v('type', 'Flexible'),
      'Move-in: ' + v('moveIn', 'Not specified'),
      'Duration: ' + v('duration', 'Not specified')
    ].join('\n');
    window.open('https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
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
