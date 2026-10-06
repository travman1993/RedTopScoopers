/* Red Top Scoopers — Secret Cheat Code Terminal.
 *
 * A second hidden Easter egg, completely separate from the landfill game
 * (js/egg.js). Loaded on demand by the hook at the bottom of js/main.js when
 * someone taps the footer logo five times (or visits a URL ending in #terminal).
 *
 * Six codes: #1 and #2 are discounts, #3 to #5 are treasure-hunt clues, and #6
 * is the word spelled by the first letters of #1 to #5.
 *
 * Frontend only, for fun. The codes below are readable by anyone who opens this
 * file, and progress is kept in localStorage. None of this is real security.
 */
(function () {
  'use strict';
  if (window.RTSCheat) return;

  // ======================================================================
  // CONFIG — change codes, rewards and clue text here (and only here)
  // ======================================================================

  // The six codes. Each must start with "#". Matching ignores upper/lower case.
  // The first letter after "#" in codes 1 to 5 must spell code 6, so if you
  // change one of those letters, change code 6 to match.
  // Hiding spots read from here too, so a changed code updates everywhere:
  //   #1 home page, "Load Ticket" tag under "Local, Reliable, Upfront"
  //   #2 about.html, the word "junk" in the Our Story paragraph
  //   #3 home page, screw at the right end of the yellow trust strip (3 taps)
  //   #4 service-locations.html, blank pill at the end of the Bartow County town list
  //   #5 faq.html, the question mark of "Are you licensed and insured?"
  var CODES = {
    1: '#eywQGrfFXJ',
    2: '#nxShNfCX',
    3: '#tQcXNeJnk',
    4: '#eTzDrRTjG',
    5: '#rxVmWGGYj',
    6: '#ENTER'
  };

  // true: code 6 is only accepted once codes 1 to 5 are authenticated, so it
  // can't be guessed early. false: it works at any time.
  var CODE6_REQUIRES_FIRST_FIVE = true;

  // Discount percentages for codes 1 and 2.
  var REWARD_PERCENT = { 1: 5, 2: 10 };

  var TERMS = {
    minJob: '$75',
    maxDiscount: '$50',
    lines: ['Cannot be combined with other offers.', 'One reward redemption per service.']
  };
  var REDEEM_PHONE = '404-649-4654';

  // Where the Impossible Run entrance is (the faded marker on the contact page
  // map). Code 6 spells these three out; codes 4 and 5 only hint at them.
  var IMPOSSIBLE_EGG_PAGE = 'CONTACT';
  var IMPOSSIBLE_EGG_SECTION = 'BODY';
  var IMPOSSIBLE_EGG_LOCATION_CLUE = 'THE MAP';

  // Treasure-hunt wording. Each entry is the lines shown for that step.
  var CLUE_AFTER_FIRST_THREE = 'Check your service area.'; // on the terminal once codes 1-3 are in; points at code 4
  var CLUE_CODE_4 = ['The impossible cannot be found.', 'It has to be contacted.', 'Before you reach out, check your FAQ.']; // game is on Contact, code 5 is on FAQ
  var CLUE_CODE_5 = ['Only in the body of the page will it be summoned.'];
  var CLUE_CODE_6 = ['Map your course to the gate of the impossible.'];
  var CLUE_CODE_6_AFTER = 'Something faded is waiting there. Press it.';

  // ======================================================================
  // Helpers
  // ======================================================================
  var STORE_KEY = 'rts-cheat-terminal-v1';
  var SLOTS = [1, 2, 3, 4, 5, 6];
  var REF_ALPH = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O/1/I/L
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  (function checkConfig() {
    var word = '#' + [1, 2, 3, 4, 5].map(function (n) { return CODES[n].charAt(1); }).join('');
    if (word.toLowerCase() !== CODES[6].toLowerCase() && window.console) {
      console.warn('cheat.js: the first letters of codes 1 to 5 no longer spell code 6.');
    }
  })();

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function $(sel) { return stage.querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || stage).querySelectorAll(sel)); }

  function loadStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  var memory = loadStore(); // fallback if localStorage is unavailable
  function authed() {
    var a = loadStore().auth || {}, m = memory.auth || {}, out = {};
    SLOTS.forEach(function (n) { if (a[n] || m[n]) out[n] = a[n] || m[n]; });
    return out;
  }
  function saveAuth(n, record) {
    var d = { auth: authed() };
    d.auth[n] = record;
    memory = d;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { /* private mode: lasts this visit only */ }
  }

  var timers = [];
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function stopAll() { timers.forEach(clearTimeout); timers = []; }

  function refId(n) {
    var out = '', buf = [];
    if (window.crypto && crypto.getRandomValues) { buf = crypto.getRandomValues(new Uint8Array(8)); }
    for (var i = 0; i < 8; i++) {
      var r = buf.length ? buf[i] : Math.floor(Math.random() * 256);
      out += REF_ALPH.charAt(r % REF_ALPH.length);
    }
    return 'RTS-C' + n + '-' + out.slice(0, 4) + '-' + out.slice(4);
  }

  // Which slot a typed code unlocks, or 0 for an invalid code.
  function match(value) {
    var v = value.trim().toLowerCase(), done = authed();
    for (var i = 0; i < SLOTS.length; i++) {
      var n = SLOTS[i];
      if (v !== CODES[n].toLowerCase()) continue;
      if (n === 6 && CODE6_REQUIRES_FIRST_FIVE && !done[6]) {
        for (var k = 1; k <= 5; k++) if (!done[k]) return 0;
      }
      return n;
    }
    return 0;
  }

  // ======================================================================
  // Modal shell
  // ======================================================================
  var overlay, frame, stage, lastFocus, booted = false;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'cheat';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Secure terminal');
    overlay.innerHTML =
      '<div class="cheat__frame">' +
        '<div class="cheat__bar"><span class="cheat__leds" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="cheat__barname">RTS-SEC // TERMINAL 07</span>' +
        '<button type="button" class="cheat__close" aria-label="Close terminal">✕</button></div>' +
        '<div class="cheat__stage"></div>' +
      '</div>';
    frame = overlay.firstChild;
    stage = frame.querySelector('.cheat__stage');
    frame.querySelector('.cheat__close').addEventListener('click', close);
    overlay.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('button:not([disabled]), input:not([disabled])', frame).filter(function (el) { return el.offsetParent; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(trigger) {
    if (overlay && overlay.parentNode) return;
    lastFocus = trigger || document.activeElement;
    if (!overlay) build();
    document.body.appendChild(overlay);
    document.documentElement.classList.add('cheat-open');
    if (booted || reduced) terminal(); else boot();
    booted = true;
  }

  function close() {
    stopAll();
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.documentElement.classList.remove('cheat-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function render(html) {
    stopAll();
    frame.classList.remove('is-denied');
    stage.innerHTML = html;
    frame.scrollTop = 0;
  }

  // ======================================================================
  // Screens
  // ======================================================================
  function boot() {
    var lines = ['RED TOP SCOOPERS FACILITY SYSTEMS', 'LINK ESTABLISHED ........ OK', 'SCANNING SEALED RECORDS .. 6 FOUND', 'AWAITING AUTHORIZATION'];
    render('<div class="cheat-boot" aria-hidden="true"></div><p class="cheat-sr" role="status">Terminal starting.</p>');
    var box = $('.cheat-boot');
    frame.querySelector('.cheat__close').focus({ preventScroll: true });
    lines.forEach(function (text, i) {
      later(function () {
        var p = document.createElement('p');
        p.textContent = '> ' + text;
        box.appendChild(p);
      }, 220 * i);
    });
    later(function () { terminal(); }, 220 * lines.length + 350);
  }

  function slotRow(n, done) {
    if (done[n]) {
      return '<li><button type="button" class="cheat-slot is-auth" data-slot="' + n + '" aria-label="Code ' + n + ' authenticated. View record.">' +
        '<span class="cheat-slot__n">#' + n + '</span><span class="cheat-slot__s">✓ AUTHENTICATED</span></button></li>';
    }
    return '<li><div class="cheat-slot"><span class="cheat-slot__n">#' + n + '</span><span class="cheat-slot__s">🔒 LOCKED</span></div></li>';
  }

  function terminal(focusSlot) {
    var done = authed(), count = Object.keys(done).length;
    render(
      '<p class="cheat__kicker">Sealed Records</p>' +
      '<h2 class="cheat__title">Cheat Code Terminal</h2>' +
      '<p class="cheat__status"><span class="cheat__dot" aria-hidden="true"></span>SYSTEM ONLINE · ' + count + ' / 6 AUTHENTICATED</p>' +
      (done[1] && done[2] && done[3] && !done[4] ? '<p class="cheat__incoming"><b>Incoming transmission</b>' + esc(CLUE_AFTER_FIRST_THREE) + '</p>' : '') +
      '<ol class="cheat-slots">' + SLOTS.map(function (n) { return slotRow(n, done); }).join('') + '</ol>' +
      '<form class="cheat-form" novalidate>' +
        // Once codes 1-5 are in, the label itself becomes the last clue.
        '<label class="cheat-form__label" for="cheat-code">' + (done[1] && done[2] && done[3] && done[4] && done[5] ? '#' : '') + 'ENTER CODE:</label>' +
        '<div class="cheat-form__field"><input id="cheat-code" class="cheat-form__input" type="text" name="code" maxlength="40" placeholder="#" ' +
          'autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-describedby="cheat-msg">' +
          '<span class="cheat-form__scan" aria-hidden="true"></span></div>' +
        '<button type="submit" class="cheat-btn">Authenticate</button>' +
      '</form>' +
      '<p id="cheat-msg" class="cheat-msg" role="status" aria-live="assertive"></p>'
    );

    var form = $('.cheat-form'), input = $('#cheat-code'), btn = $('.cheat-btn'), msg = $('#cheat-msg');
    $$('[data-slot]').forEach(function (b) {
      b.addEventListener('click', function () { record(+b.getAttribute('data-slot'), false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value;
      if (!value.trim() || form.classList.contains('is-busy')) return;
      form.classList.add('is-busy');
      frame.classList.remove('is-denied');
      input.readOnly = true;
      btn.disabled = true;
      msg.className = 'cheat-msg';
      msg.textContent = 'AUTHENTICATING…';
      later(function () {
        var n = match(value);
        if (n) { grant(n); return; }
        form.classList.remove('is-busy');
        input.readOnly = false;
        btn.disabled = false;
        msg.className = 'cheat-msg is-denied';
        msg.innerHTML = '<b>ACCESS DENIED</b>INVALID CODE';
        void frame.offsetWidth; // restart the shake
        frame.classList.add('is-denied');
        input.focus();
        input.select();
      }, reduced ? 150 : 900);
    });

    var target = focusSlot && $('[data-slot="' + focusSlot + '"]');
    (target || input).focus({ preventScroll: true });
  }

  function grant(n) {
    var done = authed(), fresh = !done[n];
    if (fresh) {
      var rec = { at: Date.now() };
      if (REWARD_PERCENT[n]) rec.ref = refId(n);
      saveAuth(n, rec);
      // Lets the page reveal the Impossible Run entrance without a reload (see js/main.js).
      if (n === 6) document.dispatchEvent(new CustomEvent('rts:terminal-complete'));
    }
    record(n, fresh);
  }

  function clue(stamp, lines, value, after, sign) {
    return '<div class="cheat-file">' +
      '<p class="cheat-file__stamp">' + stamp + '</p>' +
      lines.map(function (l) { return '<p>' + l + '</p>'; }).join('') +
      (value != null ? '<p class="cheat-file__value">' + esc(value) + '</p>' : '') +
      (after ? '<p>' + after + '</p>' : '') +
      (sign ? '<p class="cheat-file__sign">' + sign + '</p>' : '') +
    '</div>';
  }

  function record(n, fresh) {
    var rec = authed()[n] || {}, pct = REWARD_PERCENT[n], body;

    if (pct) {
      var issued = new Date(rec.at || Date.now());
      body =
        '<div class="cheat-reward">' +
          '<p class="cheat-reward__label">' + pct + '% Reward Unlocked</p>' +
          '<p class="cheat-reward__pct">' + pct + '% OFF</p>' +
          '<p class="cheat-reward__brand">Red Top Scoopers Junk Removal</p>' +
          '<ul class="cheat-reward__terms">' +
            '<li>Minimum qualifying service: ' + TERMS.minJob + '</li>' +
            '<li>Maximum discount: ' + TERMS.maxDiscount + '</li>' +
            TERMS.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') +
          '</ul>' +
          '<p class="cheat-reward__reflabel">Reference ID</p>' +
          '<p class="cheat-reward__ref">' + esc(rec.ref || '') + '</p>' +
          '<p class="cheat-reward__issued">Issued ' + issued.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
            ' · <span style="white-space:nowrap">Call or text ' + REDEEM_PHONE + '</span></p>' +
        '</div>' +
        '<p class="cheat-note">Screenshot this screen and show it when you book.</p>';
    } else if (n === 3) {
      body = clue('Classified Message',
        ['There is another secret hidden on this website.', 'Look near the footer of the page.'], null, null, '— SYSTEM 03');
    } else if (n === 4) {
      body = clue('Classified Location Data', CLUE_CODE_4.map(esc));
    } else if (n === 5) {
      body = clue('Secondary Location Data', CLUE_CODE_5.map(esc));
    } else {
      body = clue('Final Location Data Decrypted', CLUE_CODE_6.map(esc),
        'PAGE: ' + IMPOSSIBLE_EGG_PAGE + '\nSECTION: ' + IMPOSSIBLE_EGG_SECTION + '\nLOCATION: ' + IMPOSSIBLE_EGG_LOCATION_CLUE, esc(CLUE_CODE_6_AFTER));
    }

    render(
      '<div class="cheat-record' + (fresh ? ' is-fresh' : '') + '">' +
        '<p class="cheat__kicker cheat__kicker--ok">✓ Access Granted</p>' +
        '<h2 class="cheat__title" tabindex="-1">Code #' + n + ' Authenticated</h2>' +
        body +
        '<button type="button" class="cheat-btn cheat-btn--ghost" data-back>Back to Terminal</button>' +
      '</div>'
    );
    $('[data-back]').addEventListener('click', function () { terminal(n); });
    $('h2').focus({ preventScroll: true });
  }

  window.RTSCheat = {
    open: open,
    close: close,
    // Used by the hiding spots (see js/main.js). Code 6 is never handed out.
    code: function (n) { n = +n; return n >= 1 && n <= 5 ? CODES[n] : ''; }
  };
})();
