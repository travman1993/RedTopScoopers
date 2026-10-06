document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.textContent = isOpen ? '✕' : '☰';
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      });
    });
  }

  var yearEl = document.querySelector('[data-current-year]');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

/* Hidden Cheat Code Terminal: tap the footer logo five times, or open a URL
 * ending in #terminal. Also runs the spots around the site where its codes are
 * hidden. js/cheat.js and css/cheat.css only download when one of those is used. */
(function () {
  var me = document.currentScript;
  var base = me ? me.src.replace(/js\/main\.js(\?.*)?$/, '') : '';
  var loading = null, taps = 0, last = 0;

  function load() {
    if (window.RTSCheat) return Promise.resolve();
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = base + 'css/cheat.css';
        document.head.appendChild(link);
        var s = document.createElement('script');
        s.src = base + 'js/cheat.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      loading.catch(function () { loading = null; });
    }
    return loading;
  }

  function open(trigger) {
    load().then(function () { if (window.RTSCheat) window.RTSCheat.open(trigger); }, function () {});
  }

  // Hiding spots for the codes: <button data-rts-secret="N"> with an optional
  // data-rts-taps count. The code text itself only lives in js/cheat.js and is
  // written into the matching [data-rts-secret-out="N"] element when found.
  document.addEventListener('click', function (e) {
    var spot = e.target.closest && e.target.closest('[data-rts-secret]');
    if (!spot) return;
    var n = spot.getAttribute('data-rts-secret');
    var out = document.querySelector('[data-rts-secret-out="' + n + '"]');
    if (!out) return;
    if (spot.classList.contains('is-revealed')) {
      spot.classList.remove('is-revealed');
      out.classList.remove('is-revealed');
      out.textContent = '';
      spot.rtsTaps = 0;
      spot.style.removeProperty('--turns');
      return;
    }
    spot.rtsTaps = (spot.rtsTaps || 0) + 1;
    spot.style.setProperty('--turns', spot.rtsTaps);
    if (spot.rtsTaps < (+spot.getAttribute('data-rts-taps') || 1)) return;
    load().then(function () {
      if (!window.RTSCheat) return;
      out.textContent = window.RTSCheat.code(n);
      out.classList.add('is-revealed');
      spot.classList.add('is-revealed');
    }, function () {});
  });

  function tap(logo) {
    var now = Date.now();
    taps = now - last < 1200 ? taps + 1 : 1;
    last = now;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (logo.animate && !still) {
      var d = 3 + taps * 2; // rattles a little harder each tap
      logo.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-' + d + 'deg)' }, { transform: 'rotate(' + d + 'deg)' }, { transform: 'rotate(0)' }], { duration: 220 });
    }
    if (taps >= 5) { taps = 0; open(logo); }
  }

  function init() {
    var logo = document.querySelector('.site-footer .brand__logo');
    if (logo) {
      logo.setAttribute('tabindex', '0');
      logo.setAttribute('role', 'button');
      logo.style.touchAction = 'manipulation'; // no double-tap zoom while tapping
      logo.style.webkitTapHighlightColor = 'transparent';
      logo.addEventListener('click', function () { tap(logo); });
      logo.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(logo); }
      });
    }
    if (location.hash === '#terminal') open(null);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Impossible Run: opens from any [data-impossible-entrance] element, or a URL
 * ending in #impossible. js/impossible.js decides whether the visitor is allowed
 * in. Its files only download when the entrance is used. */
(function () {
  var me = document.currentScript;
  var base = me ? me.src.replace(/js\/main\.js(\?.*)?$/, '') : '';
  var loading = null;

  function open(trigger) {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = base + 'css/impossible.css';
        link.onload = link.onerror = function () {
          var s = document.createElement('script');
          s.src = base + 'js/impossible.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        };
        document.head.appendChild(link);
      });
      loading.catch(function () { loading = null; });
    }
    loading.then(function () { if (window.RTSImpossible) window.RTSImpossible.open(trigger); }, function () {});
  }

  // The entrance is in the page but hidden. It only appears once Cheat Terminal
  // code #6 has been authenticated in this browser.
  function reveal() {
    var done = false;
    try { var t = JSON.parse(localStorage.getItem('rts-cheat-terminal-v1')) || {}; done = !!(t.auth && t.auth[6]); } catch (e) { /* no storage */ }
    if (!done) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-impossible-entrance][hidden]'), function (el) { el.hidden = false; });
  }
  reveal();
  document.addEventListener('rts:terminal-complete', reveal);

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-impossible-entrance]');
    if (t) open(t);
  });
  if (location.hash === '#impossible') open(null);
})();
