/* Farm grid: renders the strain cards, wires the mascots, runs the stake sheet.

   Every strain takes SHROOMS or SHROOMS-HYPE LP. Gated strains cost SPORES to
   enter, which is one of the burn sinks — so the card shows the gate before the
   stake field, not after. */

(function () {
  'use strict';
  var S = window.Shrooms;
  var grid = document.getElementById('grid');
  if (!grid) return;

  var TOTAL_WEIGHT = window.STRAINS.reduce(function (a, f) { return a + f.weight; }, 0);
  var active = null;

  function pct(f) { return (f.weight / TOTAL_WEIGHT * 100); }
  function label(f) { return window.STAKE_LABEL[f.stake]; }

  function cardHTML(f, i) {
    var gateRow = f.gate > 0
      ? '<div class="meta"><span>Entry burn</span><b>' + (f.gate / 1000) + 'k SPORES</b></div>'
      : '<div class="meta"><span>Entry burn</span><b style="color:var(--spore)">none</b></div>';

    return '' +
      '<article class="card" style="--tier:' + window.TIER_VAR[f.tier] + '" data-pid="' + f.pid + '">' +
        '<span class="tier"><i></i>' + f.tier + '</span>' +
        '<div class="stage" aria-label="Poke ' + f.name + '">' +
          '<span class="glow"></span>' +
          '<img class="shroom" src="assets/strains/' + f.slug + '.png" alt="' + f.name + '"' +
               ' style="--phase:' + (i * -0.42).toFixed(2) + 's" width="132" height="132" draggable="false">' +
        '</div>' +
        '<h3 class="name">' + f.name + '</h3>' +
        '<p class="pair">Stake ' + label(f) + '<br>Earn SPORES</p>' +
        '<div class="apy"><b>' + pct(f).toFixed(1) + '%</b><span>of every harvest</span></div>' +
        gateRow +
        '<div class="meta"><span>Weight</span><b>' + f.weight.toLocaleString() + '</b></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + (f.weight / 3700 * 100) + '%"></div></div>' +
        '<button class="btn" data-cultivate="' + f.pid + '">' +
          (f.gate > 0 ? 'Unlock &amp; stake' : 'Stake') +
        '</button>' +
      '</article>';
  }

  function render(filter) {
    var list = window.STRAINS.filter(function (f) {
      if (filter === 'all') return true;
      if (filter === 'SHROOMS' || filter === 'SHROOMS_LP') return f.stake === filter;
      return f.tier === filter;
    });
    grid.innerHTML = list.map(cardHTML).join('');

    Array.prototype.forEach.call(grid.querySelectorAll('.card'), function (card) {
      var f = byPid(card.getAttribute('data-pid'));
      // Poking is play: it sparkles and pops, nothing else. Staking is the
      // button's job, so a tap never covers its own animation with a modal.
      S.bindMascot(card, { colors: window.TIER_SPARK[f.tier] });
    });

    Array.prototype.forEach.call(grid.querySelectorAll('[data-cultivate]'), function (b) {
      b.addEventListener('click', function () { open(byPid(b.getAttribute('data-cultivate'))); });
    });
  }

  function byPid(pid) {
    pid = Number(pid);
    return window.STRAINS.filter(function (f) { return f.pid === pid; })[0];
  }

  /* ------------------------------------------------------------- sheet */
  var veil = document.getElementById('veil');
  var amt = document.getElementById('amt');

  function open(f) {
    active = f;
    document.getElementById('sheet-img').src = 'assets/strains/' + f.slug + '.png';
    document.getElementById('sheet-img').alt = f.name;
    document.getElementById('sheet-name').textContent = f.name;
    document.getElementById('sheet-sub').innerHTML =
      '<span style="color:' + window.TIER_VAR[f.tier] + '">' + f.tier + '</span> · ' +
      pct(f).toFixed(1) + '% of every harvest';
    document.getElementById('sheet-blurb').textContent = f.blurb;
    document.getElementById('amt-unit').textContent = label(f);

    var gateBox = document.getElementById('gatebox');
    if (f.gate > 0) {
      gateBox.hidden = false;
      document.getElementById('gate-amt').textContent = f.gate.toLocaleString() + ' SPORES';
    } else {
      gateBox.hidden = true;
    }

    document.getElementById('getlink').href = window.GET_SHROOMS_URL;
    document.getElementById('getlink-label').textContent = 'Get ' + label(f) + ' on Montra';

    veil.hidden = false;
    amt.focus();
  }

  function shut() { veil.hidden = true; active = null; }

  amt.addEventListener('input', function () {
    var v = Math.max(0, parseFloat(amt.value) || 0);
    document.getElementById('fert-cost').textContent =
      (v * 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' SPORES';
  });

  document.getElementById('close').addEventListener('click', shut);
  veil.addEventListener('click', function (e) { if (e.target === veil) shut(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });

  document.getElementById('plant').addEventListener('click', function () {
    if (!S.isConnected()) { document.querySelector('[data-connect]').click(); return; }
    var btn = this;
    btn.disabled = true;
    btn.textContent = active && active.gate > 0 ? 'Unlocking…' : 'Staking…';
    // Stand-in for approve -> (unlockPool) -> stake. Replace with the wagmi calls.
    setTimeout(function () {
      btn.textContent = 'Staked';
      setTimeout(function () { btn.disabled = false; paintPlant(); shut(); }, 900);
    }, 1100);
  });

  function paintPlant() {
    var b = document.getElementById('plant');
    b.textContent = S.isConnected()
      ? (active && active.gate > 0 ? 'Unlock and stake' : 'Stake')
      : 'Connect wallet to stake';
  }
  document.addEventListener('wallet', paintPlant);

  /* ------------------------------------------------------------ filters */
  var filters = document.getElementById('filters');
  filters.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    Array.prototype.forEach.call(filters.children, function (c) {
      c.setAttribute('aria-pressed', String(c === b));
    });
    render(b.getAttribute('data-f'));
  });

  render('all');
  paintPlant();
})();
