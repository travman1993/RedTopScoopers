/* Red Top Scoopers — "Break Into the Landfill" Easter egg.
 *
 * Loaded on demand by js/egg-loader.js when someone clicks the footer's
 * "Restricted Area" tag. Frontend only: no backend, no API, no database.
 *
 * Flow:  gate lock -> security panel (screws) -> 10s wire puzzle
 *        -> control room (saved in localStorage) -> 4-stage cleanup game
 *        -> claim a reward code.
 */
(function () {
  'use strict';
  if (window.RTSEgg) return;

  // ======================================================================
  // CONFIG — safe to edit
  // ======================================================================
  var TERMS = {
    minJob: '$75',
    maxDiscount: '$50',
    lines: ['Cannot be combined with other offers.', 'One reward redemption per service.']
  };
  var CODE_PREFIXES = ['SCOOP', 'HAUL', 'REDTOP', 'JUNK'];
  // Keep in sync with tools/verify_code.py — changing it invalidates old codes.
  var CODE_SALT = 'rts-landfill-2026';

  var STAGES = [
    { n: 1, pct: 5,  time: 45, target: 300, initial: 8, spawn: [1100, 1900],             size: [64, 84], pts: [10, 20], max: 14,
      title: '🏆 Stage 1 Complete', blurb: 'Big junk, plenty of time. Warm up.' },
    { n: 2, pct: 10, time: 35, target: 350, initial: 4, spawn: [550, 1000],              size: [46, 62], pts: [5, 15],  max: 18, bonus: 0.03,
      title: '🔥 Stage 2 Complete', blurb: 'Smaller junk, faster piles, less time.' },
    { n: 3, pct: 15, time: 25, target: 300, initial: 3, spawn: [330, 650],               size: [34, 48], pts: [4, 11],  max: 22, bonus: 0.04,
      life: [1800, 3200], lifeChance: 0.45, edges: true,
      title: '💀 Stage 3 Complete', blurb: 'Some junk vanishes if you wait. It pops up anywhere.' },
    { n: 4, pct: 20, time: 15, target: 200, initial: 5, spawn: [380, 560], spawnEnd: [110, 200], size: [26, 40], pts: [3, 8], max: 30, bonus: 0.05,
      life: [1200, 2400], lifeChance: 0.55, edges: true, overlap: true, frenzy: true,
      title: '🏆 Jackpot', blurb: 'Fifteen seconds of pure chaos. It only gets faster.' }
  ];

  var JUNK = ['🛋️', '📦', '📺', '🧸', '🖨️', '🥫', '🛏️', '🚲', '🧺', '🖼️', '💡', '🗑️', '🧳', '📻', '🧹', '🥾', '🛒', '⌨️', '🧰', '🗄️'];

  // Lock order clues. key: which property orders the numbers; dir: 1 ascending, -1 descending.
  var LOCK_RULES = [
    { key: 'y', dir: 1,  text: ['Read it top to bottom.', 'Start at the top and work your way down.', 'Highest on the lock goes first.'] },
    { key: 'y', dir: -1, text: ['Read it from the ground up.', 'Start at the bottom and climb.', 'Lowest on the lock goes first.'] },
    { key: 'x', dir: -1, text: ['Right to left — the way the gate swings.', 'Start on the right side and move left.', 'Backwards: right side first.'] },
    { key: 's', dir: -1, text: ['Biggest printed number first, tiniest last.', 'Big, medium, small.', 'Start with the largest lettering.'] },
    { key: 's', dir: 1,  text: ['Tiniest printed number first, biggest last.', 'Small, medium, big.', 'Start with the smallest lettering.'] },
    { key: 'd', dir: -1, text: ['Count down: highest value first.', 'Like a launch countdown — high to low.'] },
    { key: 'd', dir: 1,  text: ['Count up: lowest value first.', 'Smallest value first, largest last.'] }
  ];

  var RIDDLES = {
    green: [
      'Cut the wire the color of fresh-cut grass.',
      'Summer leaves and pond frogs share this wire\'s color.',
      'The traffic light says GO. Cut the color that means it.',
      'Every forest wears it in spring.',
      'Moss on a stone, a four-leaf clover — match them.'
    ],
    white: [
      'Fresh snow, clean paper, a cloudy sky — one wire matches all three.',
      'Milk, ghosts, and marshmallows agree on one color.',
      'Blank as an empty page. Cut that one.',
      'The flag you wave when you surrender.',
      'A polar bear\'s coat, a wedding dress, a sheet of copy paper.'
    ],
    red: [
      'The night is dark, the coal is black, but blood is what the vampires lack.',
      'Stop signs, fire trucks, and the Red Top logo share one color.',
      'Roses are ___. Finish the poem, cut the wire.',
      'It means STOP on every street corner.',
      'A ripe tomato, a fire engine, a warning light.'
    ],
    black: [
      'Coal, ink, and midnight — cut the wire that matches them all.',
      'Your shadow only comes in one color.',
      'A crow\'s feathers and a tire\'s rubber.',
      'The darkest wire in the box.',
      'The space between the stars.'
    ]
  };
  var RIDDLE_INTROS = ['Sticky note left by a technician:', 'Scribbled inside the panel:', 'Written on masking tape:', 'Etched next to the wires:'];
  var WIRES = ['green', 'white', 'red', 'black'];

  // ======================================================================
  // Helpers
  // ======================================================================
  var STORE_KEY = 'rts-landfill-v1';
  var TEST = /[?&]eggtest\b/.test(location.search); // exposes answers for automated testing only

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function $(sel, el) { return (el || stage).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || stage).querySelectorAll(sel)); }

  function loadStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  function saveStore(patch) {
    var d = loadStore();
    for (var k in patch) d[k] = patch[k];
    try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { /* private mode: unlock lasts this visit only */ }
    memory = d;
  }
  var memory = loadStore(); // fallback if localStorage is unavailable

  // Every timer goes through these so a screen change or close clears everything.
  var timers = new Set();
  function later(fn, ms) { var id = setTimeout(function () { timers.delete(id); fn(); }, ms); timers.add(id); return id; }
  function every(fn, ms) { var id = setInterval(fn, ms); timers.add(id); return id; }
  function cancel(id) { clearTimeout(id); clearInterval(id); timers.delete(id); }
  function stopAll() { timers.forEach(function (id) { clearTimeout(id); clearInterval(id); }); timers.clear(); }

  // ======================================================================
  // Modal shell
  // ======================================================================
  var overlay, frame, stage, lastFocus, attempt = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'egg';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Restricted area');
    overlay.innerHTML =
      '<div class="egg__frame"><button type="button" class="egg__close" aria-label="Close">✕</button>' +
      '<div class="egg__stage"></div></div>';
    frame = overlay.firstChild;
    stage = frame.querySelector('.egg__stage');
    frame.querySelector('.egg__close').addEventListener('click', close);
    overlay.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('button:not([disabled]), input:not([disabled]), [tabindex="0"]', frame).filter(function (el) { return el.offsetParent; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(trigger) {
    lastFocus = trigger || document.activeElement;
    if (!overlay) build();
    if (!overlay.parentNode) document.body.appendChild(overlay);
    document.documentElement.classList.add('egg-open');
    if (loadStore().controlRoom || memory.controlRoom) controlRoom(false);
    else gate(newAttempt());
  }

  function close() {
    stopAll();
    attempt = null;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.documentElement.classList.remove('egg-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function render(html, opts) {
    opts = opts || {};
    stopAll();
    frame.classList.toggle('is-wide', !!opts.wide);
    frame.classList.toggle('is-alarm', !!opts.alarm);
    stage.innerHTML = html;
    frame.scrollTop = 0;
    var h = stage.querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  // ======================================================================
  // Attempt generation (fresh every time the entrance restarts)
  // ======================================================================
  function newLock() {
    var X = [20, 50, 80], Y = [24, 52, 80], S = [1.15, 1.75, 2.5];
    var nums, rule, answer, ltr;
    do {
      var digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      var xs = shuffle([0, 1, 2]), ys = shuffle([0, 1, 2]), ss = shuffle([0, 1, 2]);
      nums = digits.map(function (d, i) { return { d: d, x: xs[i], y: ys[i], s: ss[i] }; });
      rule = pick(LOCK_RULES);
      answer = nums.slice().sort(function (a, b) { return (a[rule.key] - b[rule.key]) * rule.dir; }).map(function (n) { return n.d; }).join('');
      ltr = nums.slice().sort(function (a, b) { return a.x - b.x; }).map(function (n) { return n.d; }).join('');
    } while (answer === ltr); // never the plain left-to-right reading
    nums.forEach(function (n) {
      n.left = X[n.x] + rand(-5, 5);
      n.top = Y[n.y] + rand(-4, 4);
      n.size = S[n.s];
      n.rot = rand(-14, 14);
    });
    return { nums: nums, clue: pick(rule.text), answer: answer };
  }

  function newAttempt() {
    var color = pick(WIRES);
    attempt = {
      lock: newLock(),
      wire: { color: color, riddle: pick(RIDDLES[color]), intro: pick(RIDDLE_INTROS), order: shuffle(WIRES) }
    };
    return attempt;
  }

  // ======================================================================
  // Scene 1 — landfill gate lock
  // ======================================================================
  function gate(a, notice) {
    var nums = a.lock.nums.map(function (n) {
      return '<span class="lock__num" style="left:' + n.left.toFixed(1) + '%;top:' + n.top.toFixed(1) + '%;font-size:' + n.size +
        'rem;--r:' + n.rot.toFixed(1) + 'deg">' + n.d + '</span>';
    }).join('');

    render(
      '<div class="egg-scene--gate">' +
        '<p class="egg__kicker">Landfill Access</p>' +
        '<div class="egg-sign">RESTRICTED</div>' +
        '<h2>Security Lock Active</h2>' +
        '<div class="lock" aria-hidden="true"><div class="lock__shackle"></div><div class="lock__body">' + nums + '</div></div>' +
        '<p class="egg__hint">Three faint numbers. One combination.</p>' +
        '<p class="egg__note-label">Scratched into the gate:</p>' +
        '<p class="egg__note">“' + esc(a.lock.clue) + '”</p>' +
        '<form class="combo" autocomplete="off" novalidate>' +
          '<input inputmode="numeric" pattern="[0-9]" maxlength="1" aria-label="First digit">' +
          '<input inputmode="numeric" pattern="[0-9]" maxlength="1" aria-label="Second digit">' +
          '<input inputmode="numeric" pattern="[0-9]" maxlength="1" aria-label="Third digit">' +
          '<button type="submit" class="egg-btn egg-btn--yellow">Unlock</button>' +
        '</form>' +
        '<p class="egg__msg' + (notice ? ' is-bad' : '') + '" role="status">' + (notice || '') + '</p>' +
      '</div>'
    );

    var form = $('.combo'), inputs = $$('.combo input'), msg = $('.egg__msg'), lock = $('.lock');
    var tries = 0;

    inputs.forEach(function (inp, i) {
      inp.addEventListener('input', function () {
        var v = inp.value.replace(/\D/g, '');
        if (v.length > 1) { // pasted several digits
          v.split('').slice(0, 3 - i).forEach(function (ch, k) { inputs[i + k].value = ch; });
          (inputs[Math.min(i + v.length, 2)]).focus();
          return;
        }
        inp.value = v;
        if (v && inputs[i + 1]) inputs[i + 1].focus();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && inputs[i - 1]) inputs[i - 1].focus();
      });
    });
    later(function () { inputs[0].focus({ preventScroll: true }); }, 50);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var guess = inputs.map(function (inp) { return inp.value; }).join('');
      if (guess.length < 3) { msg.className = 'egg__msg is-bad'; msg.textContent = 'Enter all three numbers.'; return; }

      if (guess === a.lock.answer) {
        inputs.concat($('button', form)).forEach(function (el) { el.disabled = true; });
        msg.className = 'egg__msg is-good';
        msg.textContent = 'Click…';
        lock.classList.add('is-open');
        later(gateOpened, 1000);
        return;
      }

      tries++;
      lock.classList.remove('is-shaking'); void lock.offsetWidth; lock.classList.add('is-shaking');
      msg.className = 'egg__msg is-bad';
      if (tries >= 3) {
        msg.textContent = 'Lock jammed — the numbers are resetting…';
        inputs.forEach(function (inp) { inp.disabled = true; });
        later(function () { gate(newAttempt(), 'New combination. Look again.'); }, 1500);
        return;
      }
      msg.textContent = 'Access denied — ' + (3 - tries) + (3 - tries === 1 ? ' try' : ' tries') + ' before the lock resets.';
      inputs.forEach(function (inp) { inp.value = ''; });
      inputs[0].focus();
    });
  }

  function gateOpened() {
    render(
      '<p class="egg__kicker">Landfill Access</p>' +
      '<h2>🔓 Landfill Gate Unlocked</h2>' +
      '<div class="egg__story">' +
        '<p style="animation-delay:.3s">“We broke through the landfill gate…”</p>' +
        '<p style="animation-delay:1.4s">“But I think they know we’re here.”</p>' +
      '</div>' +
      '<div class="egg-btns egg__delayed" style="animation-delay:2.2s"><button type="button" class="egg-btn" data-next>Keep Moving →</button></div>'
    );
    $('[data-next]').addEventListener('click', securityPanel);
  }

  // ======================================================================
  // Scene 2 — security panel, screws, 10-second wire puzzle
  // ======================================================================
  function securityPanel() {
    var w = attempt.wire;
    render(
      '<p class="egg__kicker">Security System</p>' +
      '<h2><span class="egg__status egg__status--red">Active</span></h2>' +
      '<div class="alert" hidden>' +
        '<div class="alert__title">⚠️ ALERT!</div>' +
        '<p class="alert__sub">Security system detected</p>' +
        '<div class="alert__timer" aria-live="off">10</div>' +
        '<p class="alert__sub">seconds until sirens</p>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel__inside"></div>' +
        '<div class="panel__cover">' +
          '<button type="button" class="screw" aria-label="Unscrew top-left screw"></button>' +
          '<button type="button" class="screw" aria-label="Unscrew top-right screw"></button>' +
          '<button type="button" class="screw" aria-label="Unscrew bottom-left screw"></button>' +
          '<button type="button" class="screw" aria-label="Unscrew bottom-right screw"></button>' +
          '<div class="panel__plate">⚡ HIGH VOLTAGE ⚡</div>' +
          '<div class="panel__leds"><span></span><span></span><span></span></div>' +
        '</div>' +
      '</div>' +
      '<p class="egg__hint" data-hint>Tap each screw to remove the cover. <b data-count>0/4</b></p>'
    );

    var removed = 0;
    $$('.screw').forEach(function (s) {
      s.addEventListener('click', function () {
        if (s.classList.contains('is-out')) return;
        s.classList.add('is-out');
        s.disabled = true;
        removed++;
        $('[data-count]').textContent = removed + '/4';
        if (removed === 4) later(function () { revealWires(w); }, 700);
      });
    });
  }

  function revealWires(w) {
    var inside = $('.panel__inside');
    inside.innerHTML =
      '<p class="riddle"><small>' + esc(w.intro) + '</small>' + esc(w.riddle) + '</p>' +
      '<div class="wires">' + w.order.map(function (c) {
        return '<button type="button" class="wire wire--' + c + '" data-color="' + c + '" aria-label="Cut the ' + c + ' wire">' +
          '<span class="wire__term"></span><span class="wire__cable"></span><span class="wire__term"></span>' +
          '<span class="wire__label">' + c.toUpperCase() + '</span></button>';
      }).join('') + '</div>';
    $('.panel__cover').classList.add('is-open');
    $('[data-hint]').hidden = true;

    var alert = $('.alert'), timerEl = $('.alert__timer');
    alert.hidden = false;

    // Real 10-second countdown, measured against the clock so throttling can't stretch it.
    var deadline = Date.now() + 10000, shown = 10, done = false;
    var tick = every(function () {
      var left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (left !== shown) {
        shown = left;
        timerEl.textContent = left;
        timerEl.classList.remove('tick'); void timerEl.offsetWidth; timerEl.classList.add('tick');
        if (left <= 3) alert.classList.add('is-critical');
      }
      if (left <= 0 && !done) { done = true; cancel(tick); lockdown('timeout'); }
    }, 100);

    $$('.wire').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (done) return;
        done = true;
        cancel(tick);
        $('.wires').classList.add('is-locked');
        btn.classList.add('is-cut');
        if (btn.getAttribute('data-color') === w.color) {
          alert.hidden = true;
          var panel = $('.panel');
          panel.classList.add('is-disabled');
          panel.insertAdjacentHTML('beforeend', '<div class="panel__done">SYSTEM DISABLED</div>');
          later(securityDisabled, 2000);
        } else {
          $('.panel').classList.add('is-wrong');
          later(function () { lockdown('wire'); }, 700);
        }
      });
    });
  }

  function lockdown(kind) {
    var body = kind === 'wire'
      ? '<span class="egg-fail__siren">⚡</span><h2 class="egg-fail__big">Wrong Wire!</h2>' +
        '<h3>🚨 Security Lockdown</h3><div class="egg__story"><p style="animation-delay:.2s">“You tripped the alarm.”</p></div>'
      : '<span class="egg-fail__siren">🚨</span><h2 class="egg-fail__big">Sirens Activated</h2>' +
        '<div class="egg__story"><p style="animation-delay:.2s">“Too slow.”</p><p style="animation-delay:.9s">“The security system locked everything down.”</p></div>';
    render(body +
      '<p class="egg__hint">The gate re-locked with a brand-new combination.</p>' +
      '<div class="egg-btns"><button type="button" class="egg-btn egg-btn--yellow" data-retry>Back to the Gate</button></div>',
      { alarm: true });
    $('[data-retry]').addEventListener('click', function () { gate(newAttempt()); });
  }

  function securityDisabled() {
    render(
      '<p class="egg__kicker">Security System</p>' +
      '<h2>🟢 Security Disabled</h2>' +
      '<p><span class="egg__status egg__status--green">Offline</span></p>' +
      '<div class="egg__story">' +
        '<p style="animation-delay:.3s">“The alarms are offline.”</p>' +
        '<p style="animation-delay:1.3s">“We made it inside.”</p>' +
      '</div>' +
      '<div class="egg-btns egg__delayed" style="animation-delay:2s"><button type="button" class="egg-btn egg-btn--green" data-next>Enter the Control Room →</button></div>'
    );
    $('[data-next]').addEventListener('click', function () { controlRoom(true); });
  }

  // ======================================================================
  // Scene 3 — control room (unlock is saved from here on)
  // ======================================================================
  function controlRoom(firstVisit) {
    saveStore({ controlRoom: true, unlockedAt: loadStore().unlockedAt || new Date().toISOString() });
    attempt = null;
    var last = loadStore().lastReward || memory.lastReward;

    render(
      '<p class="egg__kicker">Landfill HQ</p>' +
      '<h2>🖥️ Main Control Room</h2>' +
      '<div class="monitor">' +
        '<p style="animation-delay:.1s">&gt; LANDFILL ACCESS: <b>BREACHED</b></p>' +
        '<p style="animation-delay:.4s">&gt; SECURITY SYSTEM: <b>OFFLINE</b></p>' +
        (firstVisit ? '<p style="animation-delay:.9s">&gt; “You’ve made it this far.”</p><p style="animation-delay:1.5s">&gt; “Now let’s see if you can handle the cleanup.”</p>'
                    : '<p style="animation-delay:.7s">&gt; Welcome back. The cleanup crew is standing by.</p>') +
      '</div>' +
      '<div class="challenge">' +
        '<h2 style="font-size:clamp(1.3rem,5.5vw,1.8rem)">🗑️ Red Top Cleanup Challenge</h2>' +
        '<p style="font-family:var(--font-heading);letter-spacing:.12em;color:var(--gray-300);margin:0 !important">BEAT THE STAGES · RISK YOUR REWARD</p>' +
        '<div class="ladder"><span>5%</span><i>→</i><span>10%</span><i>→</i><span>15%</span><i>→</i><span>20%</span></div>' +
        '<div class="challenge__rules">' +
          '<p>Every stage gets harder.</p>' +
          '<p>Claim your reward whenever you’re ready.</p>' +
          '<p>Risk it for a bigger discount.</p>' +
          '<p><strong>If you lose, your reward returns to 0%.</strong></p>' +
        '</div>' +
        '<div class="egg-btns"><button type="button" class="egg-btn" data-begin>Begin Challenge</button></div>' +
        (last ? '<p class="saved-code">Your last reward: <b>' + last.pct + '% off</b> — <code>' + esc(last.code) + '</code></p>' : '') +
      '</div>' +
      '<button type="button" class="egg-link" data-relock>Re-lock the landfill gate</button>'
    );
    $('[data-begin]').addEventListener('click', function () { playStage(0, 0); });
    $('[data-relock]').addEventListener('click', function () {
      saveStore({ controlRoom: false });
      gate(newAttempt());
    });
  }

  // ======================================================================
  // Scene 4 — the cleanup game
  // ======================================================================
  function playStage(idx, banked) {
    var cfg = STAGES[idx];
    render(
      '<div class="hud">' +
        '<div><small>Stage</small><b>' + cfg.n + ' / 4</b></div>' +
        '<div><small>Score</small><b data-score>0 / ' + cfg.target + '</b></div>' +
        '<div class="hud__time"><small>Time</small><b data-time>' + cfg.time + 's</b></div>' +
      '</div>' +
      '<div class="hud__bar"><span data-bar></span></div>' +
      (banked ? '<p class="hud__risk">At risk: <b>' + banked + '% off</b> — playing for ' + cfg.pct + '%</p>' : '') +
      '<div class="arena">' +
        '<div class="arena__overlay"><div class="arena__card">' +
          '<h2>Stage ' + cfg.n + ' — ' + cfg.pct + '% Off</h2>' +
          '<p>' + esc(cfg.blurb) + '</p>' +
          '<p>Tap junk to haul it. Reach <b style="color:#fff">' + cfg.target + ' points</b> in <b style="color:#fff">' + cfg.time + ' seconds</b>.</p>' +
          '<div class="egg-btns"><button type="button" class="egg-btn egg-btn--yellow" data-go>Start</button></div>' +
        '</div></div>' +
      '</div>',
      { wide: true }
    );
    $('[data-go]').addEventListener('click', function () { countIn(cfg, idx, banked); });
  }

  function countIn(cfg, idx, banked) {
    var ov = $('.arena__overlay');
    var n = 3;
    (function step() {
      if (n === 0) { ov.remove(); runStage(cfg, idx, banked); return; }
      ov.innerHTML = '<div class="arena__count">' + n + '</div>';
      n--;
      later(step, 650);
    })();
  }

  function runStage(cfg, idx, banked) {
    var arena = $('.arena'), scoreEl = $('[data-score]'), timeEl = $('[data-time]'), bar = $('[data-bar]'), hud = $('.hud');
    var total = cfg.time * 1000, start = Date.now(), score = 0, items = [], ended = false, shownSec = cfg.time;

    function collides(x, y, hit) {
      return items.some(function (it) { return Math.abs(it.x - x) < (it.hit + hit) / 2 && Math.abs(it.y - y) < (it.hit + hit) / 2; });
    }

    function spawn() {
      if (ended || items.length >= cfg.max) return;
      var W = arena.clientWidth, H = arena.clientHeight;
      var bonus = cfg.bonus && Math.random() < cfg.bonus;
      var size = bonus ? cfg.size[0] : randInt(cfg.size[0], cfg.size[1]);
      var hit = Math.max(size, 44), pad = hit / 2 + 4;
      var x, y, tries = 0;
      do {
        if (cfg.edges && Math.random() < 0.5) { // hug an edge or corner
          x = Math.random() < 0.5 ? rand(pad, pad + W * 0.14) : rand(W - pad - W * 0.14, W - pad);
          y = Math.random() < 0.5 ? rand(pad, H - pad) : (Math.random() < 0.5 ? rand(pad, pad + H * 0.14) : rand(H - pad - H * 0.14, H - pad));
        } else {
          x = rand(pad, W - pad);
          y = rand(pad, H - pad);
        }
        tries++;
      } while (!cfg.overlap && tries < 12 && collides(x, y, hit));

      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'junk' + (bonus ? ' junk--bonus' : '');
      el.setAttribute('aria-label', bonus ? 'Bonus item' : 'Junk');
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.setProperty('--s', size + 'px');
      el.textContent = bonus ? '⭐' : pick(JUNK);

      var item = { el: el, x: x, y: y, hit: hit, pts: bonus ? 25 : randInt(cfg.pts[0], cfg.pts[1]), timer: null, done: false };
      if (bonus || (cfg.life && Math.random() < cfg.lifeChance)) {
        var life = bonus ? 1500 : randInt(cfg.life[0], cfg.life[1]);
        el.classList.add('junk--timed');
        el.style.setProperty('--life', life + 'ms');
        item.timer = later(function () { drop(item, false); }, life);
      }
      var hitIt = function (e) { e.preventDefault(); collect(item); };
      el.addEventListener('pointerdown', hitIt);
      el.addEventListener('click', hitIt); // keyboard users
      arena.appendChild(el);
      items.push(item);
    }

    function drop(item, collected) {
      if (item.removed) return;
      item.removed = true;
      cancel(item.timer);
      var i = items.indexOf(item);
      if (i > -1) items.splice(i, 1);
      if (!collected) { item.el.remove(); return; }
      item.el.classList.add('is-gone');
      item.el.addEventListener('animationend', function () { item.el.remove(); }, { once: true });
      setTimeout(function () { item.el.remove(); }, 400); // in case animationend doesn't fire
    }

    function collect(item) {
      if (item.done || ended) return;
      item.done = true;
      score += item.pts;
      var pop = document.createElement('span');
      pop.className = 'pop';
      pop.style.left = item.x + 'px';
      pop.style.top = item.y + 'px';
      pop.textContent = '+' + item.pts;
      pop.addEventListener('animationend', function () { pop.remove(); }, { once: true });
      arena.appendChild(pop);
      drop(item, true);
      scoreEl.textContent = Math.min(score, cfg.target) + ' / ' + cfg.target;
      if (score >= cfg.target) finish(true);
    }

    function nextDelay() {
      var p = Math.min(1, (Date.now() - start) / total);
      var lo = cfg.spawn[0], hi = cfg.spawn[1];
      if (cfg.spawnEnd) { lo += (cfg.spawnEnd[0] - lo) * p; hi += (cfg.spawnEnd[1] - hi) * p; }
      var d = rand(lo, hi);
      if (cfg.frenzy && total - (Date.now() - start) < 4000) d *= 0.65; // final seconds get hectic
      return d;
    }
    function scheduleSpawn() { later(function () { spawn(); if (!ended) scheduleSpawn(); }, nextDelay()); }

    function finish(win) {
      if (ended) return;
      ended = true;
      stopAll();
      items.forEach(function (it) { it.el.disabled = true; });
      arena.insertAdjacentHTML('beforeend',
        '<div class="arena__overlay"><div class="arena__flash">' + (win ? 'CLEARED!' : 'TIME!') + '</div></div>');
      later(function () { win ? stageWon(idx) : stageLost(idx, banked, score, cfg); }, 900);
    }

    for (var i = 0; i < cfg.initial; i++) spawn();
    scheduleSpawn();
    every(function () {
      var left = Math.max(0, total - (Date.now() - start));
      bar.style.transform = 'scaleX(' + (left / total).toFixed(3) + ')';
      var sec = Math.ceil(left / 1000);
      if (sec !== shownSec) { shownSec = sec; timeEl.textContent = sec + 's'; }
      hud.classList.toggle('is-hurry', left <= 5000);
      if (left <= 0) finish(false);
    }, 100);
  }

  function stageWon(idx) {
    var cfg = STAGES[idx], next = STAGES[idx + 1];
    render(
      '<p class="egg__kicker">Cleanup Challenge</p>' +
      '<h2>' + cfg.title + '</h2>' +
      '<p style="font-family:var(--font-heading);letter-spacing:.1em;margin:0 !important">YOU’VE EARNED</p>' +
      '<div class="result__pct">' + cfg.pct + '% OFF</div>' +
      '<div class="egg-btns">' +
        '<button type="button" class="egg-btn egg-btn--yellow" data-claim>Claim ' + cfg.pct + '%</button>' +
        (next ? '<button type="button" class="egg-btn" data-risk><span>Risk It → ' + next.pct + '%<small>Stage ' + next.n + ': ' + next.time +
          's · lose and your reward resets to 0%</small></span></button>' : '') +
      '</div>',
      { wide: false }
    );
    $('[data-claim]').addEventListener('click', function () { reward(cfg.pct); });
    if (next) $('[data-risk]').addEventListener('click', function () { playStage(idx + 1, cfg.pct); });
  }

  function stageLost(idx, banked, score, cfg) {
    var html = banked
      ? '<h2 class="egg-fail__big">💥 You Lost</h2><h3>Your reward has been reset to 0%</h3>'
      : '<h2 class="egg-fail__big">Cleanup Failed</h2><div class="result__pct" style="color:var(--gray-300)">Reward: 0%</div>';
    render(
      '<p class="egg__kicker">Cleanup Challenge — Stage ' + cfg.n + '</p>' + html +
      '<p class="result__score">You hauled ' + score + ' of ' + cfg.target + ' points.</p>' +
      '<div class="egg-btns">' +
        '<button type="button" class="egg-btn egg-btn--yellow" data-retry>Try Again</button>' +
        '<button type="button" class="egg-btn egg-btn--ghost" data-room>Back to Control Room</button>' +
      '</div>'
    );
    $('[data-retry]').addEventListener('click', function () { playStage(0, 0); });
    $('[data-room]').addEventListener('click', function () { controlRoom(false); });
  }

  // ======================================================================
  // Reward code — only generated when the player presses CLAIM
  // ======================================================================
  var ALPH = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 31 chars, no 0/O/1/I/L

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // PREFIX-XXXXX: three random chars plus two check chars tied to the discount
  // level, so a 5% code can't be passed off as 20% (see tools/verify_code.py).
  function makeCode(pct) {
    var prefix = pick(CODE_PREFIXES);
    var r = pick(ALPH) + pick(ALPH) + pick(ALPH);
    var h = fnv1a(prefix + '|' + r + '|' + pct + '|' + CODE_SALT);
    var c0 = ALPH[h % 31], c1 = ALPH[Math.floor(h / 31) % 31];
    return prefix + '-' + r[0] + c0 + r[1] + r[2] + c1;
  }

  function reward(pct) {
    var code = makeCode(pct);
    var issued = new Date();
    saveStore({ lastReward: { code: code, pct: pct, issued: issued.toISOString() } });

    render(
      '<div class="reward">' +
        '<div class="reward__head"><p>RED TOP SCOOPERS JUNK REMOVAL</p><h2>🏆 Reward Unlocked</h2></div>' +
        '<div class="reward__body">' +
          '<div class="reward__pct">' + pct + '% OFF</div>' +
          '<p class="reward__label">YOUR CODE</p>' +
          '<div class="reward__code" data-code>' + code + '</div>' +
          '<p class="reward__shot">📸 SCREENSHOT THIS SCREEN</p>' +
          '<p class="reward__how">Present this reward code when booking or receiving your junk removal service.</p>' +
          '<ul class="reward__terms">' +
            '<li>Minimum qualifying job: <strong>' + esc(TERMS.minJob) + '</strong></li>' +
            '<li>Maximum discount: <strong>' + esc(TERMS.maxDiscount) + '</strong></li>' +
            TERMS.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') +
          '</ul>' +
          '<p class="reward__issued">Issued ' + issued.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' · Call or text 404-649-4654</p>' +
        '</div>' +
      '</div>' +
      '<div class="egg-btns reward-actions">' +
        '<button type="button" class="egg-btn egg-btn--yellow" data-copy>Copy Code</button>' +
        '<button type="button" class="egg-btn egg-btn--ghost" data-again>Play Again</button>' +
      '</div>'
    );
    $('[data-copy]').addEventListener('click', function () { copyCode(code, this); });
    $('[data-again]').addEventListener('click', function () { controlRoom(false); });
  }

  function copyCode(code, btn) {
    function ok() { btn.textContent = '✓ Copied'; later(function () { btn.textContent = 'Copy Code'; }, 2000); }
    function fallback() {
      var t = document.createElement('textarea');
      t.value = code;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      overlay.appendChild(t);
      t.select();
      try { document.execCommand('copy') ? ok() : (btn.textContent = 'Press & hold the code to copy'); }
      catch (e) { btn.textContent = 'Press & hold the code to copy'; }
      t.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(ok, fallback);
    else fallback();
  }

  window.RTSEgg = { open: open, close: close };
  if (TEST) {
    window.RTSEgg._peek = function () { return attempt ? { combo: attempt.lock.answer, wire: attempt.wire.color } : null; };
    window.RTSEgg._verify = function (code) {
      var m = /^([A-Z]+)-(.)(.)(.)(.)(.)$/.exec(code);
      if (!m) return null;
      for (var i = 0; i < STAGES.length; i++) {
        var h = fnv1a(m[1] + '|' + m[2] + m[4] + m[5] + '|' + STAGES[i].pct + '|' + CODE_SALT);
        if (ALPH[h % 31] === m[3] && ALPH[Math.floor(h / 31) % 31] === m[6]) return STAGES[i].pct;
      }
      return null;
    };
  }
})();
