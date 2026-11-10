/* Hand-rolled SVG charts. No library: the page has no build step, and drawing
   them directly keeps full control of the draw-on animation and the palette.

   Palette is the validated dark-surface categorical set — see css/app.css.
   Every chart ships a legend, a table fallback and a hover layer. */

(function (global) {
  'use strict';

  var REDUCED = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  var C = {
    mint:   '#00AB78',
    amber:  '#B68700',
    violet: '#A870E1',
    red:    '#E0615C',
    grid:   'rgba(154,163,214,.16)',
    ink:    '#F9E3D0',
    muted:  '#9AA3D6',
  };

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    if (n >= 1) return n.toFixed(0);
    return n.toExponential(1);
  }

  /* ------------------------------------------------------------ line chart */
  /* opts: { series:[{name,color,points:[y...]}], xLabels, yFormat, logScale,
             yTitle, xTitle } */
  function lineChart(mount, opts) {
    var W = 720, H = 300, P = { t: 18, r: 18, b: 38, l: 58 };
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var n = opts.series[0].points.length;

    var all = [];
    opts.series.forEach(function (s) { all = all.concat(s.points); });
    var lo = opts.logScale ? Math.max(1e-12, Math.min.apply(null, all.filter(function (v) { return v > 0; })))
                           : Math.min(0, Math.min.apply(null, all));
    var hi = Math.max.apply(null, all);

    var ty = opts.logScale
      ? function (v) { v = Math.max(v, lo); return (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)); }
      : function (v) { return (v - lo) / (hi - lo); };

    var X = function (i) { return P.l + (i / (n - 1)) * iw; };
    var Y = function (v) { return P.t + ih - ty(v) * ih; };

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H, class: 'chart',
      role: 'img', 'aria-label': opts.label || 'line chart'
    });

    // grid + y axis
    var ticks = 4;
    for (var g = 0; g <= ticks; g++) {
      var frac = g / ticks;
      var yPix = P.t + ih - frac * ih;
      svg.appendChild(el('line', {
        x1: P.l, x2: P.l + iw, y1: yPix, y2: yPix, stroke: C.grid, 'stroke-width': 1
      }));
      var val = opts.logScale
        ? Math.pow(10, Math.log10(lo) + frac * (Math.log10(hi) - Math.log10(lo)))
        : lo + frac * (hi - lo);
      var t = el('text', { x: P.l - 9, y: yPix + 4, 'text-anchor': 'end', class: 'ctick' });
      t.textContent = (opts.yFormat || fmt)(val);
      svg.appendChild(t);
    }

    // x labels, thinned so they never collide
    var step = Math.ceil(n / 7);
    for (var i = 0; i < n; i += step) {
      var xt = el('text', { x: X(i), y: H - 12, 'text-anchor': 'middle', class: 'ctick' });
      xt.textContent = opts.xLabels[i];
      svg.appendChild(xt);
    }

    // series
    opts.series.forEach(function (s, si) {
      var d = s.points.map(function (v, i) { return (i ? 'L' : 'M') + X(i) + ' ' + Y(v); }).join(' ');

      if (s.fill) {
        var area = el('path', {
          d: d + ' L' + X(n - 1) + ' ' + (P.t + ih) + ' L' + X(0) + ' ' + (P.t + ih) + ' Z',
          fill: s.color, opacity: '.13'
        });
        svg.appendChild(area);
      }

      var path = el('path', {
        d: d, fill: 'none', stroke: s.color, 'stroke-width': 2,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      svg.appendChild(path);

      if (!REDUCED) {
        // draw-on: one orchestrated reveal, staggered per series
        var len = path.getTotalLength ? 2400 : 0;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(.3,.8,.4,1) ' + (si * 0.22) + 's';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { path.style.strokeDashoffset = 0; });
        });
      }

      // direct label at the series end
      var lastY = Y(s.points[n - 1]);
      var lbl = el('text', {
        x: X(n - 1) - 4, y: lastY - 9, 'text-anchor': 'end', class: 'clabel', fill: s.color
      });
      lbl.textContent = s.name;
      svg.appendChild(lbl);
    });

    // hover layer: crosshair + tooltip
    var hover = el('line', { y1: P.t, y2: P.t + ih, stroke: C.muted, 'stroke-width': 1, opacity: 0 });
    svg.appendChild(hover);
    var dots = opts.series.map(function (s) {
      var c = el('circle', { r: 4.5, fill: s.color, stroke: '#0C1030', 'stroke-width': 2, opacity: 0 });
      svg.appendChild(c);
      return c;
    });

    mount.appendChild(svg);
    var tip = document.createElement('div');
    tip.className = 'ctip';
    tip.hidden = true;
    mount.appendChild(tip);

    svg.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width) * W;
      var i = Math.round(((px - P.l) / iw) * (n - 1));
      if (i < 0 || i >= n) return;

      hover.setAttribute('x1', X(i));
      hover.setAttribute('x2', X(i));
      hover.setAttribute('opacity', '.45');
      dots.forEach(function (c, si) {
        c.setAttribute('cx', X(i));
        c.setAttribute('cy', Y(opts.series[si].points[i]));
        c.setAttribute('opacity', 1);
      });

      tip.hidden = false;
      tip.innerHTML = '<b>' + opts.xLabels[i] + '</b>' + opts.series.map(function (s) {
        return '<span><i style="background:' + s.color + '"></i>' + s.name +
               '<em>' + (opts.yFormat || fmt)(s.points[i]) + '</em></span>';
      }).join('');
      var left = (X(i) / W) * r.width;
      tip.style.left = Math.min(Math.max(left, 70), r.width - 70) + 'px';
    });
    svg.addEventListener('pointerleave', function () {
      hover.setAttribute('opacity', 0);
      dots.forEach(function (c) { c.setAttribute('opacity', 0); });
      tip.hidden = true;
    });

    return svg;
  }

  /* ----------------------------------------------------------- donut chart */
  /* opts: { slices:[{name,value,color}], centerLabel, centerValue } */
  function donut(mount, opts) {
    var S = 210, R = 78, SW = 26, cx = S / 2, cy = S / 2;
    var total = opts.slices.reduce(function (a, s) { return a + s.value; }, 0);
    var circ = 2 * Math.PI * R;

    var svg = el('svg', {
      viewBox: '0 0 ' + S + ' ' + S, class: 'donut',
      role: 'img', 'aria-label': opts.label || 'donut chart'
    });

    svg.appendChild(el('circle', {
      cx: cx, cy: cy, r: R, fill: 'none', stroke: 'rgba(154,163,214,.1)', 'stroke-width': SW
    }));

    var offset = 0;
    opts.slices.forEach(function (s, i) {
      var frac = total ? s.value / total : 0;
      var len = frac * circ;
      // 2px surface gap between segments
      var arc = el('circle', {
        cx: cx, cy: cy, r: R, fill: 'none', stroke: s.color,
        'stroke-width': SW, 'stroke-linecap': 'butt',
        'stroke-dasharray': Math.max(0, len - 2) + ' ' + (circ - Math.max(0, len - 2)),
        'stroke-dashoffset': -offset,
        transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
      });
      if (!REDUCED) {
        arc.style.strokeDasharray = '0 ' + circ;
        arc.style.transition = 'stroke-dasharray .9s cubic-bezier(.3,.85,.35,1) ' + (i * 0.12) + 's';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            arc.style.strokeDasharray = Math.max(0, len - 2) + ' ' + (circ - Math.max(0, len - 2));
          });
        });
      }
      arc.appendChild(el('title', {})).textContent =
        s.name + ' — ' + (frac * 100).toFixed(1) + '%';
      svg.appendChild(arc);
      offset += len;
    });

    if (opts.centerValue) {
      var v = el('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'dcenter' });
      v.textContent = opts.centerValue;
      svg.appendChild(v);
      var l = el('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', class: 'ctick' });
      l.textContent = opts.centerLabel || '';
      svg.appendChild(l);
    }

    mount.appendChild(svg);

    var leg = document.createElement('ul');
    leg.className = 'legend';
    leg.innerHTML = opts.slices.map(function (s) {
      var pct = total ? (s.value / total * 100).toFixed(1) : '0.0';
      return '<li><i style="background:' + s.color + '"></i>' + s.name +
             '<em>' + pct + '%</em></li>';
    }).join('');
    mount.appendChild(leg);
    return svg;
  }

  /* ------------------------------------------------------- stacked bar row */
  function stackRow(mount, rows, maxV) {
    rows.forEach(function (r, ri) {
      var wrap = document.createElement('div');
      wrap.className = 'srow';
      var total = r.parts.reduce(function (a, p) { return a + p.value; }, 0);
      var bar = r.parts.map(function (p) {
        return '<span style="flex:' + p.value + ';background:' + p.color + '" title="' +
               p.name + ' +' + p.value.toFixed(2) + 'x"></span>';
      }).join('');
      wrap.innerHTML =
        '<span class="slabel">' + r.name + '</span>' +
        '<span class="sbar" style="width:' + (total / maxV * 100) + '%">' + bar + '</span>' +
        '<span class="svalue">' + total.toFixed(2) + 'x</span>';
      mount.appendChild(wrap);
      if (!REDUCED) {
        var sb = wrap.querySelector('.sbar');
        sb.style.transform = 'scaleX(0)';
        sb.style.transformOrigin = 'left';
        sb.style.transition = 'transform .7s cubic-bezier(.3,.85,.35,1) ' + (ri * 0.1) + 's';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { sb.style.transform = 'scaleX(1)'; });
        });
      }
    });
  }

  /* --------------------------------------------------------- count-up ---- */
  function countUp(node, to, opts) {
    opts = opts || {};
    var dur = opts.duration || 1400;
    var fmtFn = opts.format || function (v) { return v.toFixed(0); };
    if (REDUCED) { node.textContent = fmtFn(to); return; }
    var from = opts.from || 0, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      node.textContent = fmtFn(from + (to - from) * eased);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* reveal a chart only when it scrolls into view, so the draw-on is seen */
  function onReveal(node, fn) {
    if (!('IntersectionObserver' in global)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { fn(); io.disconnect(); }
      });
    }, { threshold: 0.25 });
    io.observe(node);
  }

  global.Charts = {
    colors: C, fmt: fmt, lineChart: lineChart, donut: donut,
    stackRow: stackRow, countUp: countUp, onReveal: onReveal, REDUCED: REDUCED
  };
})(window);
