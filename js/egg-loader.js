/* Tiny loader for the landfill Easter egg (included in the site footer).
 * The game's CSS/JS only download when someone clicks the "Restricted Area"
 * tag (or visits a page with #restricted), so regular visitors pay nothing. */
(function () {
  'use strict';
  var me = document.currentScript;
  var base = me ? me.src.replace(/js\/egg-loader\.js(\?.*)?$/, '') : '';
  var loading = null;

  function load() {
    if (window.RTSEgg) return Promise.resolve();
    if (loading) return loading;
    loading = Promise.all([
      new Promise(function (resolve) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = base + 'css/egg.css';
        link.onload = link.onerror = resolve;
        document.head.appendChild(link);
      }),
      new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = base + 'js/egg.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      })
    ]).catch(function () { loading = null; });
    return loading;
  }

  function open(trigger) {
    load().then(function () { if (window.RTSEgg) window.RTSEgg.open(trigger); });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-egg-trigger]');
    if (!t) return;
    e.preventDefault();
    open(t);
  });

  if (location.hash === '#restricted') open(null);
})();
