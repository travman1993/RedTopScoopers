/* Official Launch Countdown (homepage)
 *
 * Reads its target from the markup:
 *   data-launch-date="2027-01-01T00:00:00"   wall-clock time at the launch location
 *   data-launch-tz="America/New_York"        IANA time zone of that wall clock
 * and converts it to one exact instant, so every visitor — whatever their own
 * time zone — counts down to the same moment. When it hits zero the clock is
 * swapped for the "officially open" message automatically.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-launch-countdown]');
  if (!root) return;

  var UNITS = ['days', 'hours', 'minutes', 'seconds'];
  var FLIP_MS = 600; // matches the CSS animation (0.28s + 0.32s)
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Time zone math ------------------------------------------------------

  // Milliseconds that `timeZone` is ahead of UTC at instant `ts`.
  function zoneOffset(ts, timeZone) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date(ts));
    var p = {};
    parts.forEach(function (part) { p[part.type] = +part.value; });
    var asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
    return asUTC - Math.floor(ts / 1000) * 1000;
  }

  // "2027-01-01T00:00:00" in `timeZone` -> UTC epoch ms (DST-safe).
  function zonedToEpoch(local, timeZone) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local);
    if (!m) return NaN;
    var wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    var guess = wall - zoneOffset(wall, timeZone);
    return wall - zoneOffset(guess, timeZone); // second pass settles DST edges
  }

  function launchInstant() {
    var local = root.getAttribute('data-launch-date') || '2027-01-01T00:00:00';
    var tz = root.getAttribute('data-launch-tz') || 'America/New_York';
    try {
      var t = zonedToEpoch(local, tz);
      if (!isNaN(t)) return t;
    } catch (e) { /* very old browser without time zone support */ }
    // Fallback: midnight Jan 1 2027 Eastern = EST (UTC-5).
    return Date.parse('2027-01-01T00:00:00-05:00');
  }

  var TARGET = launchInstant();

  // ---- Flip cards ----------------------------------------------------------

  function half(pos, value, flap) {
    var el = document.createElement('span');
    el.className = 'flip__half flip__half--' + pos + (flap ? ' flip__half--flap' : '');
    var inner = document.createElement('span');
    inner.textContent = value;
    el.appendChild(inner);
    return el;
  }

  function buildCard(card) {
    card.textContent = '';
    var sizer = document.createElement('span');
    sizer.className = 'flip__sizer';
    var top = half('top', '');
    var bottom = half('bottom', '');
    card.appendChild(sizer);
    card.appendChild(top);
    card.appendChild(bottom);
    return { card: card, sizer: sizer, top: top.firstChild, bottom: bottom.firstChild,
             value: null, pending: null, flaps: [], timer: null };
  }

  function settle(c) {
    if (c.pending === null) return;
    c.bottom.textContent = c.pending;
    c.flaps.forEach(function (f) { f.remove(); });
    c.flaps = [];
    clearTimeout(c.timer);
    c.pending = null;
  }

  function show(c, value, animate) {
    if (value === c.value) return; // only animate real changes
    var old = c.value;
    c.value = value;
    settle(c);
    c.sizer.textContent = value;
    c.top.textContent = value;

    if (!animate || old === null || reduceMotion) {
      c.bottom.textContent = value;
      return;
    }
    // Static bottom keeps the old value until the new bottom flap lands on it.
    var flapTop = half('top', old, true);
    var flapBottom = half('bottom', value, true);
    c.card.appendChild(flapTop);
    c.card.appendChild(flapBottom);
    c.flaps = [flapTop, flapBottom];
    c.pending = value;
    flapBottom.addEventListener('animationend', function () { settle(c); });
    c.timer = setTimeout(function () { settle(c); }, FLIP_MS + 300); // safety net
  }

  // ---- Countdown loop ------------------------------------------------------

  var cards = {};
  UNITS.forEach(function (u) {
    var el = root.querySelector('[data-unit="' + u + '"]');
    if (el) cards[u] = buildCard(el);
  });
  var sr = root.querySelector('[data-launch-sr]');
  var lastSr = '';
  var timer = null;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function parts(ms) {
    var s = Math.ceil(ms / 1000); // reaches 0 exactly at the launch instant
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60
    };
  }

  function render(ms, animate) {
    var p = parts(ms);
    UNITS.forEach(function (u) {
      if (cards[u]) show(cards[u], pad(p[u]), animate);
    });
    if (sr) {
      var text = p.days + ' days, ' + p.hours + ' hours, ' + p.minutes + ' minutes until launch';
      if (text !== lastSr) { sr.textContent = text; lastSr = text; }
    }
  }

  function launch() {
    clearTimeout(timer);
    root.classList.add('is-launched');
    var pre = root.querySelector('[data-launch-pre]');
    var open = root.querySelector('[data-launch-open]');
    if (pre) pre.hidden = true;
    if (open) open.hidden = false;
  }

  function tick(animate) {
    clearTimeout(timer);
    var remaining = TARGET - Date.now();
    if (remaining <= 0) { launch(); return; }
    render(remaining, animate);
    // Wake right after the next whole-second boundary before launch.
    timer = setTimeout(function () { tick(true); }, (remaining % 1000 || 1000) + 15);
  }

  tick(false);
  root.classList.add('is-ready');

  // Background tabs throttle timers; resync the moment the page is visible again.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tick(true);
  });
})();
