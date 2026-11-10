/* Shared behaviour: wallet button, formatting, mascot interactions.
   Deliberately NOT an ES module — these pages must also work when opened
   straight off disk (file://), where module scripts are blocked by CORS. */

(function (global) {
  'use strict';

  var REDUCED = global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  function compact(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }

  /* -------------------------------------------------------------- wallet */
  /* Placeholder until wagmi is wired in — the real connect flow lives in
     web/hooks/useFarms.ts in the contracts repo. */
  var connected = false;

  function initWallet() {
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-connect]'));
    try { if (sessionStorage.getItem('shrooms:connected') === '1') connected = true; } catch (e) {}
    paint();

    btns.forEach(function (b) {
      b.addEventListener('click', function () { connected = !connected; paint(); });
    });

    function paint() {
      try { sessionStorage.setItem('shrooms:connected', connected ? '1' : '0'); } catch (e) {}
      btns.forEach(function (b) {
        b.textContent = connected ? '0x9f…c3a1' : 'Connect wallet';
        b.classList.toggle('btn-ghost', connected);
      });
      document.dispatchEvent(new CustomEvent('wallet', { detail: { connected: connected } }));
    }
  }

  function isConnected() { return connected; }

  /* ------------------------------------------------------------ sparkles */
  /* Burst from wherever the tap landed, so the feedback feels attached to the
     finger rather than to the middle of the card. */
  function sparkle(stage, colors, ev) {
    if (REDUCED) return;
    var rect = stage.getBoundingClientRect();
    var ox = 50, oy = 50;
    if (ev && ev.clientX != null && rect.width) {
      ox = ((ev.clientX - rect.left) / rect.width) * 100;
      oy = ((ev.clientY - rect.top) / rect.height) * 100;
    }

    var n = 14;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'sparkle';
      // jittered ring, so it never reads as a clock face
      var angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var dist = 46 + Math.random() * 60;

      s.style.left = ox + '%';
      s.style.top = oy + '%';
      s.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(angle) * dist - 16).toFixed(1) + 'px');
      s.style.setProperty('--s', (5 + Math.random() * 8).toFixed(1) + 'px');
      s.style.setProperty('--sc', colors[i % colors.length]);
      s.style.setProperty('--dur', (560 + Math.random() * 420).toFixed(0) + 'ms');
      s.style.setProperty('--rot', (90 + Math.random() * 220).toFixed(0) + 'deg');
      s.style.setProperty('--sc2', (0.8 + Math.random() * 0.8).toFixed(2));

      stage.appendChild(s);
      (function (el) {
        el.addEventListener('animationend', function () { el.remove(); }, { once: true });
      })(s);
    }
  }

  /* --------------------------------------------------- mascot behaviour */
  /* Hover is pure CSS. This adds the touch equivalent (phones have no :hover)
     and the one-shot pop, removing the class when the pop ends so the two
     animations never fight. */
  function bindMascot(card, opts) {
    var stage = card.querySelector('.stage');
    var shroom = card.querySelector('.shroom');
    if (!stage || !shroom) return;
    opts = opts || {};
    var colors = opts.colors || ['#FFC53D', '#FFFFFF'];

    function happy() { card.classList.add('is-touched'); }
    function calm() { card.classList.remove('is-touched'); }

    stage.addEventListener('pointerdown', happy);
    stage.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') happy(); });
    stage.addEventListener('pointerup', function () { setTimeout(calm, 900); });
    stage.addEventListener('pointercancel', calm);
    stage.addEventListener('pointerleave', calm);

    stage.addEventListener('click', function (e) {
      sparkle(stage, colors, e);
      if (!REDUCED) {
        shroom.classList.remove('is-popping');
        void shroom.offsetWidth; // force a reflow so the animation restarts
        shroom.classList.add('is-popping');
        shroom.addEventListener('animationend', function () {
          shroom.classList.remove('is-popping');
        }, { once: true });
      }
      if (opts.onActivate) opts.onActivate(e);
    });

    // Keyboard parity with the tap.
    stage.setAttribute('tabindex', '0');
    stage.setAttribute('role', 'button');
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stage.click(); }
    });
  }

  /* ---------------------------------------------------------- live strip */
  function tickerStrip(o) {
    var tvl = o.baseTvl || 0;
    var left = 4 * 3600 - 47;
    function pad(n) { return String(n).padStart(2, '0'); }
    function paint() {
      if (o.tvlEl) o.tvlEl.textContent = money(tvl);
      if (o.clockEl) {
        o.clockEl.textContent =
          pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left / 60) % 60) + ':' + pad(left % 60);
      }
    }
    paint();
    setInterval(function () {
      tvl += Math.random() * 900;
      left = left > 0 ? left - 1 : 4 * 3600;
      paint();
    }, 1000);
  }

  /* --------------------------------------------------------------- nav */
  function markCurrentNav() {
    var here = location.pathname.split('/').pop() || 'index.html';
    Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
      if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
    });
  }

  global.Shrooms = {
    money: money,
    compact: compact,
    initWallet: initWallet,
    isConnected: isConnected,
    sparkle: sparkle,
    bindMascot: bindMascot,
    tickerStrip: tickerStrip,
    markCurrentNav: markCurrentNav,
    REDUCED: REDUCED,
  };
})(window);
