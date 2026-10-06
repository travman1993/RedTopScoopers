/* Red Top Scoopers — The Impossible Run.
 *
 * The third and final hidden Easter egg. Separate from the landfill game
 * (js/egg.js) and the Cheat Code Terminal (js/cheat.js). Loaded on demand by the
 * last block in js/main.js when someone activates a [data-impossible-entrance]
 * element (or opens a URL ending in #impossible).
 *
 * Seven stages, no checkpoints: any mistake sends the run back to stage 1.
 * Finishing all seven in one go unlocks a personalised certificate.
 *
 * Frontend only. Nothing here is secure: stats and the certificate live in
 * localStorage, and one-per-address redemption has to be checked by a person
 * (or a backend wired into recordCompletion below).
 */
(function () {
  'use strict';
  if (window.RTSImpossible) return;

  // ======================================================================
  // CONFIG — location, reward and every difficulty number live here
  // ======================================================================
  var IMPOSSIBLE_RUN_CONFIG = {
    enabled: true,

    // Where the entrance lives. These three are notes for you; the entrance
    // itself is whichever element carries data-impossible-entrance.
    // The wording players see for these is in the CONFIG block of js/cheat.js.
    page: 'contact.html',
    section: 'Body of the page: the map',
    locationClue: 'Faded striped square at the centre of the map (Cartersville). Hidden until code #6 is in.',

    reward: 'LEGENDARY CERTIFICATE',
    maxRedemptionsPerAddress: 1, // printed on the certificate; enforced by you, not by this file
    redeemPhone: '404-649-4654',
    stages: 7,                   // informational: the stage list is STAGE_RUNNERS below

    // true: the game refuses to open until Cheat Terminal code #6 has been
    // authenticated in this browser. false: a URL ending in #impossible opens
    // it for anyone (the map marker itself still only appears after code #6).
    requireFinalCode: true,

    // Optional backend URL. When set, a finished certificate is POSTed there as
    // JSON (see recordCompletion). Leave empty for no recording at all.
    recordEndpoint: '',

    debug: false,       // exposes internal state on window for automated tests
    bannerMs: 1300,     // "STAGE 0N / PROTOCOL ACTIVE" card
    armMs: 1100,        // pause after a stage appears before anything is live
    touchScale: 1.35,   // tap targets are this much bigger on touch screens

    // Stage 1: repeat a flashed sequence of panels. One round per entry.
    memory: {
      panels: 9,
      rounds: [
        { length: 4, flash: 470, gap: 170 },
        { length: 5, flash: 410, gap: 150 },
        { length: 6, flash: 350, gap: 130 }
      ],
      inputBase: 2500,   // ms allowed to repeat it: inputBase + length * inputPerItem
      inputPerItem: 900
    },

    // Stage 2: hit a moving target. Values run from first target to last.
    precision: {
      hits: 8,
      arenaHeight: 300,
      radius: [22, 12],      // px (visible size is the hitbox)
      speed: [120, 320],     // px per second
      jinkEvery: [1400, 450],// ms between direction changes
      time: [5000, 3500]     // ms to hit each target
    },

    // Stage 3: tap the moment the panel changes. One round per window.
    reaction: {
      windows: [420, 370, 330, 300, 280], // ms allowed after the change
      delay: [1100, 4200]                 // random wait before the change
    },

    // Stage 4: number patterns, in order of difficulty. Seconds per question.
    logic: { times: [20, 18, 16, 15], choices: 6 },

    // Stage 5: drag the load down a corridor past crushers, chased by a compactor.
    // Distances are in arena units (the arena is 100 x 100).
    coordination: {
      corridorHalfWidth: 7,
      crateRadius: 3,
      chaserSpeed: 30,      // units per second (the path is about 360 long)
      chaserHeadStart: 30,  // units the compactor starts behind the load. Keep this
                            // above chaserSpeed * (crusherWarn + crusherClosed) / 1000,
                            // or an unlucky wait at the first crusher is unavoidable.
      autoStart: 3500,      // compactor starts after this even if untouched
      crushers: [40, 140, 240, 330], // positions along the path
      crusherHalf: 2.5,
      crusherOpen: 700, crusherWarn: 350, crusherClosed: 550, // ms per cycle
      keySpeed: 42          // arrow-key movement, units per second
    },

    // Stage 6: memorise an order, hit moving symbols in that order, and vent
    // pressure whenever the alarm trips. One round per entry.
    pressure: {
      arenaHeight: 240,
      radius: 21,
      speed: [55, 95],
      ventWindow: 950,
      rounds: [
        { length: 4, show: 2300, time: 11000, vents: [[1200, 3500]] },
        { length: 5, show: 2500, time: 12000, vents: [[1200, 3200], [5200, 8000]] }
      ]
    },

    // Stage 7: four phases built around one key.
    protocol: {
      keyShow: 3200,
      stream: { items: 26, itemMs: 560, matches: 3, decoys: 2, grace: 180 },
      locks: [{ arc: 36, speed: 200 }, { arc: 30, speed: 250 }, { arc: 24, speed: 300 }], // degrees, degrees/sec
      lockTimeout: 7000,
      pads: { count: 6, window: [760, 580], gap: [500, 1500] },
      decisionMs: 6000
    }
  };

  // ======================================================================
  // Helpers
  // ======================================================================
  var C = IMPOSSIBLE_RUN_CONFIG;
  var STORE_KEY = 'rts-impossible-run-v1';
  var TERMINAL_KEY = 'rts-cheat-terminal-v1'; // read only, never written here
  var ID_ALPH = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O/1/I/L
  var SYMBOLS = ['▲', '■', '●', '◆', '✚', '★'];
  var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  var dbg = {};
  if (C.debug) window.__impossibleDebug = dbg;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function lerp(a, b, f) { return a + (b - a) * f; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function $(sel) { return stageEl.querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || stageEl).querySelectorAll(sel)); }

  function loadStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  var memory = loadStore(); // fallback if localStorage is unavailable
  function store() { var d = loadStore(); for (var k in memory) if (!(k in d)) d[k] = memory[k]; return d; }
  function saveStore(patch) {
    var d = store();
    for (var k in patch) d[k] = patch[k];
    memory = d;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { /* private mode: lasts this visit only */ }
  }

  function authorized() {
    if (!C.requireFinalCode) return true;
    try {
      var t = JSON.parse(localStorage.getItem(TERMINAL_KEY)) || {};
      return !!(t.auth && t.auth[6]);
    } catch (e) { return false; }
  }

  // Everything scheduled by a screen is tied to `token`, so changing state
  // cancels all of it at once and stale callbacks can't touch the next screen.
  var token = 0, cleanups = [];
  function later(fn, ms) {
    var t = token, id = setTimeout(function () { if (t === token) fn(); }, ms);
    cleanups.push(function () { clearTimeout(id); });
    return id;
  }
  function frame(fn) {
    var t = token, last = performance.now(), id = 0, stopped = false;
    function tick(now) {
      if (stopped || t !== token) return;
      var dt = Math.min(50, now - last);
      last = now;
      fn(now, dt);
      if (!stopped && t === token) id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    var handle = { stop: function () { stopped = true; cancelAnimationFrame(id); } };
    cleanups.push(handle.stop);
    return handle;
  }
  function on(el, type, fn, opts) {
    el.addEventListener(type, fn, opts || false);
    cleanups.push(function () { el.removeEventListener(type, fn, opts || false); });
  }
  function isPress(e) { return !e.repeat && (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar'); }

  // ======================================================================
  // State machine
  // ======================================================================
  var state = { name: 'CLOSED', stage: 0 };
  var lastFail = null;
  var STATES = {};        // name -> function that draws that screen
  var STAGE_RUNNERS = []; // filled in below; index 0 is stage 1

  // The only moves allowed. A stage can only lead to the next stage or to
  // FAILED, and FAILED only leads back to stage 1, so nothing can be skipped.
  function allowed(from, to) {
    var last = STAGE_RUNNERS.length;
    if (from === 'INTRO' || from === 'FAILED') return to === 'STAGE_1';
    if (/^STAGE_/.test(from)) {
      var n = +from.slice(6);
      return to === 'FAILED' || (n < last ? to === 'STAGE_' + (n + 1) : to === 'COMPLETED');
    }
    if (from === 'COMPLETED') return to === 'CERTIFICATE_FORM' || to === 'CERTIFICATE';
    if (from === 'CERTIFICATE_FORM') return to === 'CERTIFICATE';
    if (from === 'CERTIFICATE') return to === 'INTRO';
    return false;
  }

  function enter(name) {
    token++;
    cleanups.splice(0).forEach(function (fn) { fn(); });
    state.name = name;
    state.stage = /^STAGE_/.test(name) ? +name.slice(6) : 0;
    dbg.state = name;
    frameEl.classList.toggle('is-failed', name === 'FAILED');
    frameEl.classList.toggle('is-live', state.stage > 0);
    STATES[name]();
  }
  function go(name) { if (allowed(state.name, name)) enter(name); }

  function noteStage(n) { if (n > (store().bestStage || 0)) saveStore({ bestStage: n }); }

  function fail(reason) {
    if (!state.stage) return;
    lastFail = { stage: state.stage, reason: reason };
    noteStage(state.stage);
    go('FAILED');
  }
  function win() {
    var n = state.stage;
    if (!n) return;
    if (n < STAGE_RUNNERS.length) { go('STAGE_' + (n + 1)); return; }
    noteStage(n);
    saveStore({ completions: (store().completions || 0) + 1, pendingClaim: true });
    go('COMPLETED');
  }

  // ======================================================================
  // Modal shell
  // ======================================================================
  var overlay, frameEl, stageEl, lastFocus;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'impossible';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Restricted protocol');
    overlay.innerHTML =
      '<div class="impossible__frame">' +
        '<div class="impossible__bar"><span class="impossible__leds" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="impossible__barname">RTS-SEC // PROTOCOL 00</span>' +
        '<button type="button" class="impossible__close" aria-label="Abort and close">✕</button></div>' +
        '<div class="impossible__stage"></div>' +
      '</div>';
    frameEl = overlay.firstChild;
    stageEl = frameEl.querySelector('.impossible__stage');
    frameEl.querySelector('.impossible__close').addEventListener('click', close);
    // No pausing: leaving the tab mid-stage ends the run.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state.stage) fail('SIGNAL LOST');
    });
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('button:not([disabled]), input:not([disabled]), canvas', frameEl).filter(function (el) { return el.offsetParent; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], inside = frameEl.contains(document.activeElement);
    if (e.shiftKey && (!inside || document.activeElement === first)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (!inside || document.activeElement === last)) { e.preventDefault(); first.focus(); }
  }

  function open(trigger) {
    if (!C.enabled || !authorized()) return false;
    if (overlay && overlay.parentNode) return true;
    lastFocus = trigger || document.activeElement;
    if (!overlay) build();
    document.body.appendChild(overlay);
    document.documentElement.classList.add('impossible-open');
    // On the document, not the overlay: screens are redrawn constantly, so focus is often on <body>.
    document.addEventListener('keydown', onKey);
    var s = store();
    enter(s.certificate ? 'CERTIFICATE' : s.pendingClaim ? 'CERTIFICATE_FORM' : 'INTRO');
    return true;
  }

  function close() {
    if (state.stage) noteStage(state.stage); // walking away mid-run still counts as how far you got
    token++;
    cleanups.splice(0).forEach(function (fn) { fn(); });
    state.name = 'CLOSED';
    state.stage = 0;
    document.removeEventListener('keydown', onKey);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.documentElement.classList.remove('impossible-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function render(html) {
    stageEl.innerHTML = html;
    frameEl.scrollTop = 0;
  }
  function focusFirst(sel) {
    var el = $(sel);
    if (el) el.focus({ preventScroll: true });
  }

  // ---------- Shared stage chrome ----------
  function stageShell(n, hint, body) {
    render(
      '<div class="impossible-hud"><span class="impossible-hud__stage">STAGE ' + pad2(n) + '</span>' +
        '<span class="impossible-hud__status" data-status>PROTOCOL ACTIVE</span></div>' +
      '<div class="impossible-timer" aria-hidden="true"><i data-timer></i></div>' +
      '<p class="impossible-hint" data-hint role="status" aria-live="polite">' + hint + '</p>' +
      '<div class="impossible-body" data-body>' + body + '</div>'
    );
  }
  function setHint(t) { var el = $('[data-hint]'); if (el) el.textContent = t; }
  function setStatus(t) { var el = $('[data-status]'); if (el) el.textContent = t; }
  function setBody(html) { $('[data-body]').innerHTML = html; }

  // Draining timer bar. Calls onExpire once when it runs out.
  function countdown(ms, onExpire) {
    var bar = $('[data-timer]'), start = performance.now(), done = false;
    bar.style.transform = 'scaleX(1)';
    var loop = frame(function (now) {
      if (done) return;
      var left = Math.max(0, 1 - (now - start) / ms);
      bar.style.transform = 'scaleX(' + left + ')';
      bar.classList.toggle('is-low', left < 0.3);
      if (left <= 0) { done = true; onExpire(); }
    });
    return { stop: function () { done = true; loop.stop(); } };
  }
  function clearTimer() { var bar = $('[data-timer]'); if (bar) { bar.style.transform = 'scaleX(0)'; bar.classList.remove('is-low'); } }

  // Pointer position inside an element's padding box.
  function localPoint(el, e) {
    var b = el.getBoundingClientRect();
    return { x: e.clientX - b.left - el.clientLeft, y: e.clientY - b.top - el.clientTop };
  }

  // ======================================================================
  // INTRO / FAILED / COMPLETED
  // ======================================================================
  STATES.INTRO = function () {
    var s = store();
    render(
      '<div class="impossible-brief">' +
        '<p class="impossible-kicker">Restricted Protocol</p>' +
        '<h2 class="impossible-title" tabindex="-1">You Were Never Supposed to Find This</h2>' +
        '<p>This protocol is not designed to be easy.</p>' +
        '<p>There are no checkpoints.<br>There are no second chances.<br>One mistake ends the run.</p>' +
        '<p>If you continue, you accept the challenge.</p>' +
        '<button type="button" class="impossible-btn" data-begin>Begin Impossible Run</button>' +
        (s.attempts ? '<p class="impossible-stats">ATTEMPTS: ' + s.attempts + ' · BEST STAGE: ' + pad2(s.bestStage || 1) + '</p>' : '') +
      '</div>'
    );
    on($('[data-begin]'), 'click', function () { go('STAGE_1'); });
    focusFirst('[data-begin]');
  };

  var QUIPS = ['Close.', 'That one hurt.', 'Again?'];

  STATES.FAILED = function () {
    var s = store(), f = lastFail || { stage: 1, reason: '' };
    var quip = '';
    if (Math.random() < 0.3) quip = f.stage >= 5 ? 'You were not supposed to make it this far.' : pick(QUIPS);
    render(
      '<div class="impossible-fail">' +
        '<p class="impossible-kicker impossible-kicker--red">Run Terminated</p>' +
        '<h2 class="impossible-title" tabindex="-1">Protocol Failed</h2>' +
        '<p class="impossible-fail__err">ERROR: HUMAN PERFORMANCE LIMIT</p>' +
        '<p class="impossible-fail__stage">STAGE: <b>' + pad2(f.stage) + '</b></p>' +
        (f.reason ? '<p class="impossible-fail__cause">CAUSE: ' + esc(f.reason) + '</p>' : '') +
        '<button type="button" class="impossible-btn" data-restart disabled>Restart</button>' +
        '<p class="impossible-stats">ATTEMPT: ' + (s.attempts || 1) + ' · BEST STAGE: ' + pad2(s.bestStage || f.stage) + '</p>' +
        (quip ? '<p class="impossible-quip">' + quip + '</p>' : '') +
      '</div>'
    );
    var btn = $('[data-restart]');
    on(btn, 'click', function () { go('STAGE_1'); });
    // Brief lock so a frantic tap from the stage that just ended can't restart by accident.
    later(function () { btn.disabled = false; btn.focus({ preventScroll: true }); }, 450);
  };

  STATES.COMPLETED = function () {
    render(
      '<div class="impossible-brief impossible-brief--done">' +
        '<p class="impossible-kicker impossible-kicker--green">Protocol Complete</p>' +
        '<h2 class="impossible-title" tabindex="-1">System Status: Authorized</h2>' +
        '<p class="impossible-done__line">You actually did it.</p>' +
        '<button type="button" class="impossible-btn impossible-btn--yellow" data-continue disabled>Continue</button>' +
      '</div>'
    );
    var btn = $('[data-continue]');
    on(btn, 'click', function () { go(store().certificate ? 'CERTIFICATE' : 'CERTIFICATE_FORM'); });
    later(function () { btn.disabled = false; btn.focus({ preventScroll: true }); }, 900);
  };

  // Every stage starts with the same anonymous card, then its own runner.
  function stageState(n) {
    return function () {
      if (n === 1) saveStore({ attempts: (store().attempts || 0) + 1 });
      render(
        '<div class="impossible-banner" role="status"><p class="impossible-banner__n">STAGE ' + pad2(n) + '</p>' +
        '<p class="impossible-banner__s">PROTOCOL ACTIVE</p></div>'
      );
      later(STAGE_RUNNERS[n - 1], C.bannerMs);
    };
  }

  // ======================================================================
  // STAGE 1 — memory
  // ======================================================================
  function stageMemory() {
    var cfg = C.memory, round = 0, seq = [], pos = 0, accepting = false, timer = null, html = '';
    for (var i = 0; i < cfg.panels; i++) html += '<button type="button" class="impossible-panel" data-panel="' + i + '" aria-label="Panel ' + (i + 1) + '"></button>';
    stageShell(1, 'WATCH.', '<div class="impossible-grid">' + html + '</div>');
    var panels = $$('[data-panel]');

    function show() {
      var r = cfg.rounds[round], step = r.flash + r.gap;
      seq = [];
      while (seq.length < r.length) {
        var p = randInt(0, cfg.panels - 1);
        if (p !== seq[seq.length - 1]) seq.push(p);
      }
      dbg.memory = { seq: seq, accepting: false };
      accepting = false;
      clearTimer();
      setHint('WATCH.');
      setStatus('SEQUENCE ' + pad2(round + 1));
      seq.forEach(function (p, k) {
        later(function () { panels[p].classList.add('is-lit'); }, C.armMs + k * step);
        later(function () { panels[p].classList.remove('is-lit'); }, C.armMs + k * step + r.flash);
      });
      later(function () {
        pos = 0;
        accepting = true;
        dbg.memory.accepting = true;
        setHint('REPEAT.');
        timer = countdown(cfg.inputBase + r.length * cfg.inputPerItem, function () { accepting = false; fail('TOO SLOW'); });
      }, C.armMs + r.length * step + 200);
    }

    function press(i) {
      if (!accepting) return;
      var el = panels[i];
      if (i !== seq[pos]) { accepting = false; timer.stop(); el.classList.add('is-wrong'); fail('WRONG PANEL'); return; }
      el.classList.add('is-hit');
      later(function () { el.classList.remove('is-hit'); }, 160);
      pos++;
      if (pos < seq.length) return;
      accepting = false;
      dbg.memory.accepting = false;
      timer.stop();
      round++;
      if (round === cfg.rounds.length) { win(); return; }
      setHint('HOLD.');
      later(show, 500);
    }

    panels.forEach(function (el, i) {
      on(el, 'pointerdown', function (e) { e.preventDefault(); press(i); });
      on(el, 'keydown', function (e) { if (isPress(e)) { e.preventDefault(); press(i); } });
    });
    on(document, 'keydown', function (e) { // number keys 1-9 map to the panels
      if (e.repeat || e.key < '1' || e.key > '9' || e.key.length !== 1) return;
      if (+e.key <= cfg.panels) press(+e.key - 1);
    });
    show();
  }

  // ======================================================================
  // STAGE 2 — precision
  // ======================================================================
  function stagePrecision() {
    var cfg = C.precision, scale = coarse ? C.touchScale : 1;
    var hits = 0, live = false, timer = null, x = 0, y = 0, r = 0, speed = 0, heading = 0, jinkIn = 0, jinkEvery = 0;
    stageShell(2, 'HIT THE TARGET. DO NOT MISS.',
      '<div class="impossible-arena" data-arena style="height:' + cfg.arenaHeight + 'px"><span class="impossible-target" data-target hidden></span></div>');
    var arena = $('[data-arena]'), target = $('[data-target]');

    function place() {
      target.style.transform = 'translate(' + (x - r) + 'px,' + (y - r) + 'px)';
      dbg.precision = { x: x, y: y, r: r, live: live };
    }
    function spawn() {
      var f = cfg.hits > 1 ? hits / (cfg.hits - 1) : 0, W = arena.clientWidth, H = arena.clientHeight;
      r = lerp(cfg.radius[0], cfg.radius[1], f) * scale;
      speed = lerp(cfg.speed[0], cfg.speed[1], f);
      jinkEvery = lerp(cfg.jinkEvery[0], cfg.jinkEvery[1], f);
      jinkIn = jinkEvery * rand(0.6, 1.4);
      heading = rand(0, Math.PI * 2);
      x = rand(r, W - r);
      y = rand(r, H - r);
      target.style.width = target.style.height = 2 * r + 'px';
      target.hidden = false;
      live = true;
      place();
      setStatus('TARGET ' + pad2(hits + 1));
      timer = countdown(lerp(cfg.time[0], cfg.time[1], f), function () { live = false; fail('TARGET ESCAPED'); });
    }

    frame(function (now, dt) {
      if (!live) return;
      var W = arena.clientWidth, H = arena.clientHeight;
      jinkIn -= dt;
      if (jinkIn <= 0) { heading += rand(-2.2, 2.2); jinkIn = jinkEvery * rand(0.6, 1.4); }
      x += Math.cos(heading) * speed * dt / 1000;
      y += Math.sin(heading) * speed * dt / 1000;
      if (x < r || x > W - r) { heading = Math.PI - heading; x = Math.min(W - r, Math.max(r, x)); }
      if (y < r || y > H - r) { heading = -heading; y = Math.min(H - r, Math.max(r, y)); }
      place();
    });

    on(arena, 'pointerdown', function (e) {
      e.preventDefault();
      if (!live) return;
      var p = localPoint(arena, e);
      live = false;
      timer.stop();
      if (Math.hypot(p.x - x, p.y - y) > r) { fail('MISS'); return; } // hitbox is exactly the visible circle
      target.hidden = true;
      dbg.precision.live = false;
      hits++;
      if (hits === cfg.hits) { win(); return; }
      clearTimer();
      later(spawn, 450);
    });

    later(spawn, C.armMs);
  }

  // ======================================================================
  // STAGE 3 — reaction
  // ======================================================================
  function stageReaction() {
    var cfg = C.reaction, round = 0, phase = 'idle', goAt = 0, expire = 0;
    stageShell(3, 'WAIT FOR THE SIGNAL.',
      '<button type="button" class="impossible-react" data-react><span data-react-label>STAND BY</span><small data-react-ms></small></button>');
    var padEl = $('[data-react]'), label = $('[data-react-label]'), msEl = $('[data-react-ms]');

    function arm() {
      phase = 'armed';
      dbg.reaction = { phase: phase };
      padEl.className = 'impossible-react is-armed';
      label.textContent = 'HOLD';
      setStatus('SIGNAL ' + pad2(round + 1));
      later(function () {
        // Flip on a frame boundary and time from there, so the window starts when the change is drawn.
        requestAnimationFrame(function () {
          if (phase !== 'armed') return;
          padEl.className = 'impossible-react is-go';
          label.textContent = 'NOW';
          phase = 'go';
          dbg.reaction.phase = phase;
          goAt = performance.now();
          expire = later(function () { if (phase === 'go') { phase = 'idle'; fail('TOO SLOW'); } }, cfg.windows[round] + 17);
        });
      }, rand(cfg.delay[0], cfg.delay[1]));
    }

    function press() {
      if (phase === 'armed') { phase = 'idle'; fail('TOO EARLY'); return; }
      if (phase !== 'go') return;
      var rt = performance.now() - goAt;
      clearTimeout(expire);
      phase = 'idle';
      dbg.reaction.phase = phase;
      if (rt > cfg.windows[round]) { fail('TOO SLOW'); return; }
      padEl.className = 'impossible-react is-ok';
      label.textContent = 'OK';
      msEl.textContent = Math.round(rt) + ' ms';
      round++;
      if (round === cfg.windows.length) { later(win, 500); return; }
      later(arm, 900);
    }

    on(padEl, 'pointerdown', function (e) { e.preventDefault(); press(); });
    on(document, 'keydown', function (e) { if (isPress(e)) { e.preventDefault(); press(); } });
    padEl.focus({ preventScroll: true });
    later(arm, C.armMs);
  }

  // ======================================================================
  // STAGE 4 — logic
  // ======================================================================
  // Each generator returns the terms shown and the next term. Every rule is a
  // standard one with a single sensible continuation.
  var LOGIC = [
    function () { // the gap grows by the same amount each step
      var s = [randInt(2, 9)], d = randInt(2, 5), k = randInt(2, 4);
      for (var i = 0; i < 6; i++) { s.push(s[i] + d); d += k; }
      return s;
    },
    function () { // two progressions interleaved
      var a = randInt(3, 12), da = randInt(2, 6), b = randInt(40, 70), db = randInt(2, 7), s = [];
      if (db === da) db++;
      for (var i = 0; i < 4; i++) { s.push(a + i * da); s.push(b - i * db); }
      return s; // 8 terms: the last one is the answer
    },
    function () { // multiply, then subtract, repeating
      var x = randInt(3, 6), m = pick([2, 3]), k = randInt(1, x - 1), s = [x];
      for (var i = 0; i < 6; i++) s.push(i % 2 === 0 ? s[i] * m : s[i] - k);
      return s;
    },
    function () { // each term is the two before it added together, plus a constant
      var s = [randInt(1, 5), randInt(2, 8)], c = randInt(1, 3);
      for (var i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2] + c);
      return s;
    }
  ];

  function logicChoices(seq, answer, count) {
    var last = seq[seq.length - 1], step = Math.abs(answer - last) || 2, pool = {}, out = [answer];
    [1, -1, 2, -2, 3, -3, step, -step, Math.round(step / 2), 10, -10, 4, -4, 5, 6].forEach(function (d) {
      var v = answer + d;
      if (v > 0 && v !== answer) pool[v] = true;
    });
    shuffle(Object.keys(pool)).slice(0, count - 1).forEach(function (v) { out.push(+v); });
    return shuffle(out);
  }

  function stageLogic() {
    var cfg = C.logic, q = 0, locked = true, timer = null;
    stageShell(4, 'WHAT COMES NEXT?', '<div class="impossible-seq" data-seq></div><div class="impossible-choices" data-choices></div>');

    function ask() {
      var terms = LOGIC[q](), answer = terms.pop();
      dbg.logic = { answer: answer };
      locked = true;
      setStatus('PATTERN ' + pad2(q + 1));
      $('[data-seq]').innerHTML = terms.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '<span class="is-q">?</span>';
      $('[data-choices]').innerHTML = logicChoices(terms, answer, cfg.choices).map(function (v) {
        return '<button type="button" class="impossible-choice" data-choice="' + v + '">' + v + '</button>';
      }).join('');
      $$('[data-choice]').forEach(function (b) {
        on(b, 'click', function () {
          if (locked) return;
          locked = true;
          timer.stop();
          if (+b.getAttribute('data-choice') !== answer) { b.classList.add('is-wrong'); fail('WRONG ANSWER'); return; }
          b.classList.add('is-right');
          q++;
          if (q === LOGIC.length) { later(win, 350); return; }
          later(ask, 600);
        });
      });
      // A beat before answers register, so a stray double tap can't answer the next question.
      later(function () { locked = false; }, 350);
      timer = countdown(cfg.times[q] * 1000, function () { locked = true; fail('OUT OF TIME'); });
    }
    later(ask, C.armMs);
  }

  // ======================================================================
  // STAGE 5 — coordination
  // ======================================================================
  var CORRIDOR = [[10, 12], [88, 12], [88, 36], [12, 36], [12, 60], [88, 60], [88, 84], [30, 84]];

  function stageCoordination() {
    var cfg = C.coordination, w = cfg.corridorHalfWidth, r = cfg.crateRadius;
    stageShell(5, 'DRAG THE LOAD TO THE EXIT. TOUCH NOTHING.',
      '<canvas class="impossible-canvas" data-canvas width="600" height="600" tabindex="0" aria-label="Corridor. Drag anywhere to move the load, or use the arrow keys."></canvas>');
    var canvas = $('[data-canvas]'), ctx = canvas.getContext('2d');
    var mirror = Math.random() < 0.5;
    var pts = CORRIDOR.map(function (p) { return [mirror ? 100 - p[0] : p[0], p[1]]; });
    var segs = [], total = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push({ a: pts[i], b: pts[i + 1], len: len, start: total });
      total += len;
    }
    var cycle = cfg.crusherOpen + cfg.crusherWarn + cfg.crusherClosed;
    var crushers = cfg.crushers.map(function (at) { return { at: at, offset: rand(0, cycle) }; });
    var t0 = performance.now(), live = false, started = false, chaserS = -cfg.chaserHeadStart, dragId = null, lx = 0, ly = 0, keys = {};
    var endS = total - 5;

    function pointAt(s) {
      s = Math.max(0, Math.min(total, s));
      for (var k = 0; k < segs.length; k++) {
        var g = segs[k];
        if (s <= g.start + g.len || k === segs.length - 1) {
          var f = (s - g.start) / g.len, ux = (g.b[0] - g.a[0]) / g.len, uy = (g.b[1] - g.a[1]) / g.len;
          return { x: g.a[0] + (g.b[0] - g.a[0]) * f, y: g.a[1] + (g.b[1] - g.a[1]) * f, ux: ux, uy: uy };
        }
      }
    }
    function project(x, y) {
      var best = { dist: Infinity, s: 0 };
      segs.forEach(function (g) {
        var dx = g.b[0] - g.a[0], dy = g.b[1] - g.a[1];
        var f = Math.max(0, Math.min(1, ((x - g.a[0]) * dx + (y - g.a[1]) * dy) / (g.len * g.len)));
        var d = Math.hypot(x - (g.a[0] + dx * f), y - (g.a[1] + dy * f));
        if (d < best.dist) best = { dist: d, s: g.start + f * g.len };
      });
      return best;
    }
    function crusherState(c, now) {
      var ph = (now - t0 + c.offset) % cycle;
      return ph < cfg.crusherOpen ? 'open' : ph < cfg.crusherOpen + cfg.crusherWarn ? 'warn' : 'closed';
    }

    var start = pointAt(5), cx = start.x, cy = start.y;

    // Returns true when the run left this stage (failed or cleared).
    function check(now) {
      if (!live) return true;
      var p = project(cx, cy), k;
      if (p.dist > w - r) { live = false; fail('WALL CONTACT'); return true; }
      for (k = 0; k < crushers.length; k++) {
        if (crusherState(crushers[k], now) === 'closed' && Math.abs(p.s - crushers[k].at) < cfg.crusherHalf + r) { live = false; fail('CRUSHED'); return true; }
      }
      if (p.s - r <= chaserS) { live = false; fail('COMPACTED'); return true; }
      if (p.s >= endS) { live = false; win(); return true; }
      return false;
    }
    // Moves in small steps so a fast flick can't jump a wall or a crusher.
    function move(dx, dy) {
      if (!live) return;
      started = true;
      var n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.75)), now = performance.now();
      for (var k = 0; k < n; k++) {
        cx += dx / n;
        cy += dy / n;
        if (check(now)) return;
      }
    }

    function strokePath(upTo, width, color, cap) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var k = 0; k < segs.length; k++) {
        var g = segs[k];
        if (upTo >= g.start + g.len) { ctx.lineTo(g.b[0], g.b[1]); continue; }
        var e = pointAt(upTo);
        ctx.lineTo(e.x, e.y);
        break;
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.lineCap = cap || 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    function draw(now) {
      var size = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1));
      if (size && canvas.width !== size) { canvas.width = size; canvas.height = size; }
      var k = canvas.width / 100;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, 100, 100);
      strokePath(total, 2 * w + 1.4, '#7a5d06');
      strokePath(total, 2 * w, '#242424');
      var end = pointAt(total - 2);
      ctx.beginPath(); ctx.arc(end.x, end.y, w - 1.5, 0, 6.2832);
      ctx.fillStyle = 'rgba(61,220,132,0.22)'; ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = '#3ddc84'; ctx.stroke();
      if (chaserS > 0) strokePath(chaserS, 2 * w, 'rgba(196,30,42,0.9)', 'butt');
      crushers.forEach(function (c) {
        var st = crusherState(c, now), p = pointAt(c.at), nx = -p.uy, ny = p.ux;
        var reach = st === 'closed' ? 1 : st === 'warn' ? 0.55 : 0.2;
        ctx.lineWidth = cfg.crusherHalf * 2;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = st === 'closed' ? '#c41e2a' : st === 'warn' ? (Math.floor(now / 90) % 2 ? '#ffc107' : '#b38600') : '#555';
        [1, -1].forEach(function (side) {
          ctx.beginPath();
          ctx.moveTo(p.x + nx * w * side, p.y + ny * w * side);
          ctx.lineTo(p.x + nx * w * side * (1 - reach), p.y + ny * w * side * (1 - reach));
          ctx.stroke();
        });
      });
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832);
      ctx.fillStyle = '#ffc107'; ctx.fill();
      ctx.lineWidth = 0.6; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
      ctx.strokeRect(cx - 1.2, cy - 1.2, 2.4, 2.4);
    }

    dbg.coord = {
      state: function () {
        var now = performance.now(), p = project(cx, cy);
        return {
          live: live, s: p.s, x: cx, y: cy, chaser: chaserS, end: endS, r: r, half: cfg.crusherHalf, cycle: cycle,
          closedFrom: cfg.crusherOpen + cfg.crusherWarn,
          crushers: crushers.map(function (c) { return { at: c.at, state: crusherState(c, now), phase: (now - t0 + c.offset) % cycle }; })
        };
      },
      pointAt: pointAt
    };

    frame(function (now, dt) {
      if (live) {
        if (!started && now - t0 > cfg.autoStart) started = true;
        if (started) chaserS += cfg.chaserSpeed * dt / 1000;
        var vx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), vy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
        if (vx || vy) move(vx * cfg.keySpeed * dt / 1000, vy * cfg.keySpeed * dt / 1000);
        if (live) check(now);
      }
      if (state.stage === 5) draw(now);
    });

    // Relative drag: press anywhere and the load follows the movement, so a finger never has to cover it.
    on(canvas, 'pointerdown', function (e) {
      e.preventDefault();
      if (!live || dragId !== null) return;
      dragId = e.pointerId; lx = e.clientX; ly = e.clientY;
      started = true;
    });
    on(window, 'pointermove', function (e) {
      if (dragId === null || e.pointerId !== dragId) return;
      var upp = 100 / canvas.clientWidth, dx = (e.clientX - lx) * upp, dy = (e.clientY - ly) * upp;
      lx = e.clientX; ly = e.clientY;
      move(dx, dy);
    });
    function release(e) { if (e.pointerId === dragId) dragId = null; }
    on(window, 'pointerup', release);
    on(window, 'pointercancel', release);
    on(canvas, 'keydown', function (e) { if (/^Arrow/.test(e.key)) { e.preventDefault(); keys[e.key] = true; } });
    on(window, 'keyup', function (e) { keys[e.key] = false; });
    on(canvas, 'blur', function () { keys = {}; });

    draw(t0);
    canvas.focus({ preventScroll: true });
    later(function () { t0 = performance.now(); live = true; setStatus('LOAD RELEASED'); }, C.armMs);
  }

  // ======================================================================
  // STAGE 6 — combined pressure
  // ======================================================================
  function stagePressure() {
    var cfg = C.pressure, scale = coarse ? 1.2 : 1, r = cfg.radius * scale;
    var round = 0, seq = [], pos = 0, live = false, targets = [], timer = null, ventOn = false, ventExpire = 0, ventTimers = [];
    stageShell(6, 'MEMORIZE.',
      '<div class="impossible-order" data-order></div>' +
      '<div class="impossible-arena impossible-arena--tight" data-arena style="height:' + cfg.arenaHeight + 'px"></div>' +
      '<button type="button" class="impossible-vent" data-vent>Vent</button>');
    var arena = $('[data-arena]'), order = $('[data-order]'), vent = $('[data-vent]');

    function brief() {
      var rd = cfg.rounds[round];
      seq = shuffle(SYMBOLS).slice(0, rd.length);
      pos = 0;
      live = false;
      arena.innerHTML = '';
      targets = [];
      clearTimer();
      dbg.pressure = { seq: seq, pos: 0, live: false, targets: targets, vent: false };
      setHint('MEMORIZE.');
      setStatus('LOAD ' + pad2(round + 1));
      order.innerHTML = seq.map(function (s) { return '<span>' + s + '</span>'; }).join('');
      later(function () { release(rd); }, C.armMs + rd.show);
    }

    function release(rd) {
      order.innerHTML = seq.map(function () { return '<span class="is-blank">?</span>'; }).join('');
      setHint('HIT THEM IN ORDER. VENT WHEN IT TRIPS.');
      var W = arena.clientWidth, H = arena.clientHeight;
      SYMBOLS.forEach(function (sym) {
        var el = document.createElement('span'), a = rand(0, Math.PI * 2), sp = rand(cfg.speed[0], cfg.speed[1]);
        el.className = 'impossible-symbol';
        el.textContent = sym;
        el.style.width = el.style.height = 2 * r + 'px';
        arena.appendChild(el);
        targets.push({ el: el, sym: sym, x: rand(r, W - r), y: rand(r, H - r), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, alive: true });
      });
      live = true;
      dbg.pressure.live = true;
      timer = countdown(rd.time, function () { live = false; fail('OUT OF TIME'); });
      ventTimers = rd.vents.map(function (range) { return later(tripVent, rand(range[0], range[1])); });
    }

    function tripVent() {
      if (!live) return;
      ventOn = true;
      dbg.pressure.vent = true;
      vent.classList.add('is-alert');
      vent.textContent = 'Vent now';
      ventExpire = later(function () { if (ventOn && live) { live = false; fail('PRESSURE BREACH'); } }, cfg.ventWindow);
    }
    function pressVent() {
      if (!live) return;
      if (!ventOn) { live = false; fail('FALSE VENT'); return; }
      clearTimeout(ventExpire);
      ventOn = false;
      dbg.pressure.vent = false;
      vent.classList.remove('is-alert');
      vent.textContent = 'Vent';
    }

    frame(function (now, dt) {
      if (!live) return;
      var W = arena.clientWidth, H = arena.clientHeight;
      targets.forEach(function (t) {
        if (!t.alive) return;
        t.x += t.vx * dt / 1000;
        t.y += t.vy * dt / 1000;
        if (t.x < r || t.x > W - r) { t.vx = -t.vx; t.x = Math.min(W - r, Math.max(r, t.x)); }
        if (t.y < r || t.y > H - r) { t.vy = -t.vy; t.y = Math.min(H - r, Math.max(r, t.y)); }
        t.el.style.transform = 'translate(' + (t.x - r) + 'px,' + (t.y - r) + 'px)';
      });
    });

    on(arena, 'pointerdown', function (e) {
      e.preventDefault();
      if (!live) return;
      var p = localPoint(arena, e);
      var under = targets.filter(function (t) { return t.alive && Math.hypot(p.x - t.x, p.y - t.y) <= r; });
      if (!under.length) { live = false; fail('MISS'); return; }
      // Overlapping symbols: if the right one is under the pointer, it counts.
      var hit = under.filter(function (t) { return t.sym === seq[pos]; })[0];
      if (!hit) { live = false; fail('WRONG ORDER'); return; }
      hit.alive = false;
      hit.el.remove();
      order.children[pos].textContent = hit.sym;
      order.children[pos].className = '';
      pos++;
      dbg.pressure.pos = pos;
      if (pos < seq.length) return;
      live = false;
      dbg.pressure.live = false;
      timer.stop();
      clearTimeout(ventExpire);
      ventTimers.forEach(clearTimeout); // a vent that hasn't tripped yet must not leak into the next round
      ventOn = false;
      vent.classList.remove('is-alert');
      vent.textContent = 'Vent';
      round++;
      if (round === cfg.rounds.length) { later(win, 400); return; }
      later(brief, 700);
    });
    on(vent, 'pointerdown', function (e) { e.preventDefault(); pressVent(); });
    on(document, 'keydown', function (e) { if (isPress(e)) { e.preventDefault(); pressVent(); } });

    brief();
  }

  // ======================================================================
  // STAGE 7 — Red Top Protocol
  // ======================================================================
  function buildStream(key, cfg) {
    var others = SYMBOLS.filter(function (s) { return s !== key[2]; }), i;
    for (var tries = 0; tries < 300; tries++) {
      var chunks = [];
      for (i = 0; i < cfg.matches; i++) chunks.push(key.slice());
      for (i = 0; i < cfg.decoys; i++) chunks.push([key[0], key[1], pick(others)]);
      for (i = chunks.length * 3; i < cfg.items - 3; i++) chunks.push([pick(SYMBOLS)]);
      var s = [pick(SYMBOLS), pick(SYMBOLS), pick(SYMBOLS)], ends = [], ok = true;
      shuffle(chunks).forEach(function (c) { s = s.concat(c); });
      for (i = 2; i < s.length; i++) if (s[i - 2] === key[0] && s[i - 1] === key[1] && s[i] === key[2]) ends.push(i);
      for (i = 1; i < ends.length; i++) if (ends[i] - ends[i - 1] < 4) ok = false;
      if (ok && ends.length === cfg.matches && ends[0] >= 5) return { items: s, ends: ends };
    }
    // Fallback that is always valid: filler symbol never completes the key.
    var f = SYMBOLS.filter(function (x) { return key.indexOf(x) < 0; })[0], out = [f, f, f, f], e = [];
    for (i = 0; i < cfg.matches; i++) { out = out.concat(key); e.push(out.length - 1); out.push(f, f, f); }
    return { items: out, ends: e };
  }

  function stageProtocol() {
    var cfg = C.protocol, phase = 'key';
    var key = shuffle(SYMBOLS).slice(0, 3);
    dbg.protocol = { key: key.join(''), phase: phase };
    stageShell(7, 'AUTH KEY. DO NOT FORGET IT.', '<div class="impossible-key">' + key.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>');
    setStatus('RED TOP PROTOCOL');
    countdown(C.armMs + cfg.keyShow, function () { clearTimer(); phaseStream(); });

    function setPhase(p) { phase = p; dbg.protocol.phase = p; clearTimer(); }

    // ---- Phase 1: confirm each time the key goes past in a fast stream
    function phaseStream() {
      setPhase('stream');
      var sc = cfg.stream, st = buildStream(key, sc), confirmed = {}, shown = -1, begin = 0, running = false;
      setHint('CONFIRM EACH TIME THE KEY PASSES.');
      setBody('<div class="impossible-stream" data-stream aria-hidden="true"></div><button type="button" class="impossible-btn impossible-btn--yellow" data-confirm>Confirm</button>');
      var view = $('[data-stream]'), btn = $('[data-confirm]');
      dbg.protocol.matchNow = false;

      function confirm() {
        if (phase !== 'stream' || !running) return;
        var now = performance.now(), hit = -1;
        st.ends.forEach(function (e) {
          if (!confirmed[e] && now >= begin + e * sc.itemMs && now <= begin + (e + 1) * sc.itemMs + sc.grace) hit = e;
        });
        if (hit < 0) { running = false; fail('FALSE CONFIRM'); return; }
        confirmed[hit] = true;
        view.classList.add('is-ok');
        later(function () { view.classList.remove('is-ok'); }, 200);
      }
      on(btn, 'pointerdown', function (e) { e.preventDefault(); confirm(); });
      on(document, 'keydown', function (e) { if (phase === 'stream' && isPress(e)) { e.preventDefault(); confirm(); } });
      btn.focus({ preventScroll: true });

      later(function () {
        begin = performance.now();
        running = true;
        var loop = frame(function (now) {
          if (!running) return;
          var t = now - begin, idx = Math.floor(t / sc.itemMs), k;
          for (k = 0; k < st.ends.length; k++) {
            var e = st.ends[k];
            if (!confirmed[e] && t > (e + 1) * sc.itemMs + sc.grace) { running = false; fail('KEY MISSED'); return; }
          }
          dbg.protocol.matchNow = st.ends.some(function (e2) { return !confirmed[e2] && idx === e2; });
          var blank = idx >= st.items.length || t - idx * sc.itemMs > sc.itemMs * 0.82;
          var want = blank ? '' : st.items[idx];
          if (idx !== shown || view.textContent !== want) { shown = idx; view.textContent = want; }
          if (idx >= st.items.length + 1) { running = false; loop.stop(); later(phaseLocks, 500); }
        });
      }, 900);
    }

    // ---- Phase 2: stop a spinning needle inside a shrinking gap
    function phaseLocks() {
      setPhase('locks');
      var n = 0, a0 = rand(0, 360), dir = 1, t0 = 0, arcStart = 0, lock = null, timer = null, liveLock = false;
      setHint('STOP THE NEEDLE IN THE GAP.');
      setBody(
        '<button type="button" class="impossible-dial" data-dial aria-label="Stop the needle">' +
          '<svg viewBox="0 0 200 200" aria-hidden="true">' +
            '<circle class="impossible-dial__track" cx="100" cy="100" r="80"/>' +
            '<circle class="impossible-dial__gap" data-gap cx="100" cy="100" r="80" pathLength="360"/>' +
            '<line class="impossible-dial__needle" data-needle x1="100" y1="100" x2="188" y2="100"/>' +
            '<circle class="impossible-dial__hub" cx="100" cy="100" r="7"/>' +
          '</svg></button>');
      var dial = $('[data-dial]'), gap = $('[data-gap]'), needle = $('[data-needle]');

      function angleAt(now) { return a0 + dir * lock.speed * (now - t0) / 1000; }
      function inGap(now) { return ((((angleAt(now) - arcStart) % 360) + 360) % 360) <= lock.arc; }
      function next() {
        lock = cfg.locks[n];
        var travel = rand(150, 300); // the gap is never right in front of the needle
        arcStart = dir > 0 ? a0 + travel : a0 - travel - lock.arc;
        gap.setAttribute('stroke-dasharray', lock.arc + ' 360');
        gap.setAttribute('transform', 'rotate(' + arcStart + ' 100 100)');
        t0 = performance.now();
        liveLock = true;
        dbg.protocol.inGap = function () { return liveLock && inGap(performance.now()); };
        timer = countdown(cfg.lockTimeout, function () { liveLock = false; fail('LOCK TIMED OUT'); });
      }
      function stop() {
        if (phase !== 'locks' || !liveLock) return;
        var now = performance.now();
        liveLock = false;
        timer.stop();
        if (!inGap(now)) { fail('LOCK JAMMED'); return; }
        a0 = angleAt(now);
        dir = -dir;
        n++;
        clearTimer();
        dial.classList.add('is-ok');
        later(function () { dial.classList.remove('is-ok'); }, 250);
        if (n === cfg.locks.length) { later(phasePads, 600); return; }
        later(next, 450);
      }
      frame(function (now) {
        if (phase !== 'locks') return;
        needle.setAttribute('transform', 'rotate(' + (liveLock ? angleAt(now) : a0) + ' 100 100)');
      });
      on(dial, 'pointerdown', function (e) { e.preventDefault(); stop(); });
      on(document, 'keydown', function (e) { if (phase === 'locks' && isPress(e)) { e.preventDefault(); stop(); } });
      dial.focus({ preventScroll: true });
      lock = cfg.locks[0];
      later(next, 700);
    }

    // ---- Phase 3: hit whichever pad lights, fast
    function phasePads() {
      setPhase('pads');
      var pc = cfg.pads, done = 0, lit = -1, expire = 0, html = '';
      setHint('HIT WHAT LIGHTS UP.');
      for (var i = 0; i < 4; i++) html += '<button type="button" class="impossible-pad" data-pad="' + i + '" aria-label="Pad ' + (i + 1) + '">' + (i + 1) + '</button>';
      setBody('<div class="impossible-pads">' + html + '</div>');
      var pads = $$('[data-pad]');
      dbg.protocol.lit = -1;

      function light() {
        lit = randInt(0, 3);
        dbg.protocol.lit = lit;
        pads[lit].classList.add('is-lit');
        var win2 = lerp(pc.window[0], pc.window[1], pc.count > 1 ? done / (pc.count - 1) : 0);
        expire = later(function () { if (lit >= 0) { lit = -1; fail('TOO SLOW'); } }, win2);
      }
      function press(i) {
        if (phase !== 'pads') return;
        if (lit < 0) { fail('TOO EARLY'); return; }
        if (i !== lit) { fail('WRONG PAD'); return; }
        clearTimeout(expire);
        pads[lit].classList.remove('is-lit');
        lit = -1;
        dbg.protocol.lit = -1;
        done++;
        if (done === pc.count) { phase = 'idle'; later(phaseDecision, 600); return; }
        later(light, rand(pc.gap[0], pc.gap[1]));
      }
      pads.forEach(function (el, i) { on(el, 'pointerdown', function (e) { e.preventDefault(); press(i); }); });
      on(document, 'keydown', function (e) { // keys 1-4 map to the pads
        if (phase !== 'pads' || e.repeat || e.key.length !== 1 || e.key < '1' || e.key > '4') return;
        press(+e.key - 1);
      });
      later(light, 1000 + rand(0, 700));
    }

    // ---- Phase 4: the key from the start of the stage
    function phaseDecision() {
      setPhase('decision');
      var right = key.join(''), seen = {}, opts = [right], locked = true, pool = [];
      seen[right] = true;
      [[0, 2, 1], [1, 0, 2], [2, 1, 0], [1, 2, 0], [2, 0, 1]].forEach(function (p) { pool.push([key[p[0]], key[p[1]], key[p[2]]].join('')); });
      var spare = SYMBOLS.filter(function (s) { return key.indexOf(s) < 0; });
      pool.push([key[0], key[1], pick(spare)].join(''), [key[0], pick(spare), key[2]].join(''));
      shuffle(pool).forEach(function (o) { if (opts.length < 4 && !seen[o]) { seen[o] = true; opts.push(o); } });
      setHint('ENTER THE AUTH KEY.');
      setBody('<div class="impossible-keys">' + shuffle(opts).map(function (o) {
        return '<button type="button" class="impossible-keyopt" data-key="' + o + '" aria-label="Key ' + o.split('').join(' ') + '">' +
          o.split('').map(function (ch) { return '<span>' + ch + '</span>'; }).join('') + '</button>';
      }).join('') + '</div>');
      var timer = countdown(cfg.decisionMs, function () { locked = true; fail('OUT OF TIME'); });
      $$('[data-key]').forEach(function (b) {
        on(b, 'click', function () {
          if (locked) return;
          locked = true;
          timer.stop();
          if (b.getAttribute('data-key') !== right) { fail('WRONG KEY'); return; }
          win();
        });
      });
      later(function () { locked = false; }, 350);
    }
  }

  STAGE_RUNNERS = [stageMemory, stagePrecision, stageReaction, stageLogic, stageCoordination, stagePressure, stageProtocol];
  STAGE_RUNNERS.forEach(function (fn, i) { STATES['STAGE_' + (i + 1)] = stageState(i + 1); });

  // ======================================================================
  // Certificate
  // ======================================================================
  function certificateId() {
    var out = '', buf = new Uint8Array(1), limit = 256 - (256 % ID_ALPH.length);
    while (out.length < 8) {
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(buf); else buf[0] = Math.floor(Math.random() * 256);
      if (buf[0] < limit) out += ID_ALPH.charAt(buf[0] % ID_ALPH.length); // reject the tail so every character is equally likely
    }
    return 'RTS-IMP-' + out.slice(0, 4) + '-' + out.slice(4);
  }

  // ----------------------------------------------------------------------
  // REDEMPTION RECORDING — the one place a backend plugs in.
  // With no recordEndpoint nothing leaves the browser, and nothing here stops
  // the same address claiming twice. Check the certificate ID, name, phone and
  // address by hand, or point recordEndpoint at a service that stores them and
  // rejects a repeat address (maxRedemptionsPerAddress).
  // ----------------------------------------------------------------------
  function recordCompletion(cert) {
    if (!C.recordEndpoint || !window.fetch) return Promise.resolve(false);
    return fetch(C.recordEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificate: cert, maxRedemptionsPerAddress: C.maxRedemptionsPerAddress })
    }).then(function (res) { return res.ok; }, function () { return false; });
  }

  function today() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function prettyDate(iso) {
    var p = String(iso).split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  STATES.CERTIFICATE_FORM = function () {
    function field(id, label, type, extra) {
      return '<label class="impossible-field" for="impossible-' + id + '"><span>' + label + '</span>' +
        '<input id="impossible-' + id + '" name="' + id + '" type="' + type + '" required ' + (extra || '') + '></label>';
    }
    render(
      '<form class="impossible-form" novalidate>' +
        '<p class="impossible-kicker impossible-kicker--green">Certificate Verification</p>' +
        '<h2 class="impossible-title" tabindex="-1">Claim Your Certificate</h2>' +
        '<p class="impossible-form__note">These details are printed on your certificate so Red Top Scoopers can verify it when you redeem. ' +
          (C.recordEndpoint ? 'They are sent to Red Top Scoopers when you generate it.' : 'They stay in this browser until you show us the certificate.') + '</p>' +
        field('name', 'Full name', 'text', 'autocomplete="name" maxlength="60"') +
        field('phone', 'Phone number', 'tel', 'autocomplete="tel" inputmode="tel" maxlength="24"') +
        field('address', 'Service address', 'text', 'autocomplete="street-address" maxlength="120"') +
        field('date', 'Date', 'date', 'value="' + today() + '"') +
        '<p class="impossible-form__err" data-err role="alert"></p>' +
        '<button type="submit" class="impossible-btn impossible-btn--yellow">Generate Certificate</button>' +
      '</form>'
    );
    var form = $('.impossible-form'), err = $('[data-err]');
    on(form, 'submit', function (e) {
      e.preventDefault();
      var v = {};
      var input = function (k) { return $('#impossible-' + k); };
      ['name', 'phone', 'address', 'date'].forEach(function (k) { v[k] = input(k).value.trim(); });
      var bad = v.name.length < 2 ? 'name' : v.phone.replace(/\D/g, '').length < 10 ? 'phone' : v.address.length < 6 ? 'address' : !v.date ? 'date' : '';
      if (bad) {
        err.textContent = { name: 'Enter your full name.', phone: 'Enter a phone number with area code.', address: 'Enter the service address.', date: 'Choose a date.' }[bad];
        input(bad).focus();
        return;
      }
      var cert = { id: certificateId(), name: v.name, phone: v.phone, address: v.address, date: v.date, reward: C.reward, issuedAt: Date.now() };
      saveStore({ certificate: cert, pendingClaim: false });
      recordCompletion(cert);
      go('CERTIFICATE');
    });
    focusFirst('#impossible-name');
  };

  STATES.CERTIFICATE = function () {
    var c = store().certificate;
    render(
      '<div class="impossible-cert-wrap">' +
        '<div class="impossible-cert">' +
          '<p class="impossible-cert__brand">Red Top Scoopers Junk Removal</p>' +
          '<p class="impossible-cert__run">Impossible Run</p>' +
          '<h2 class="impossible-cert__title" tabindex="-1">Certificate of Completion</h2>' +
          '<p class="impossible-cert__small">This certifies that</p>' +
          '<p class="impossible-cert__name">' + esc(c.name) + '</p>' +
          '<p class="impossible-cert__small">successfully completed the<br>Red Top Scoopers Impossible Run.</p>' +
          '<div class="impossible-cert__seal" aria-hidden="true"><span>★</span></div>' +
          '<dl class="impossible-cert__facts">' +
            '<div><dt>Service address</dt><dd>' + esc(c.address) + '</dd></div>' +
            '<div><dt>Date</dt><dd>' + esc(prettyDate(c.date)) + '</dd></div>' +
            '<div><dt>Phone</dt><dd>' + esc(c.phone) + '</dd></div>' +
            '<div><dt>Award</dt><dd>' + esc(c.reward || C.reward) + '</dd></div>' +
          '</dl>' +
          '<p class="impossible-cert__idlabel">Certificate ID</p>' +
          '<p class="impossible-cert__id">' + esc(c.id) + '</p>' +
          '<p class="impossible-cert__status">Status: <b>Protocol Complete</b></p>' +
          '<p class="impossible-cert__fine">One redemption per customer / address. Call or text ' + esc(C.redeemPhone) + ' to verify.</p>' +
        '</div>' +
        '<p class="impossible-cert__tip">Screenshot this. It is saved in this browser and reopens from the same entrance.</p>' +
        '<button type="button" class="impossible-btn impossible-btn--ghost" data-again>Run It Again</button>' +
      '</div>'
    );
    on($('[data-again]'), 'click', function () { go('INTRO'); });
    focusFirst('.impossible-cert__title');
  };

  window.RTSImpossible = { open: open, close: close };
})();
