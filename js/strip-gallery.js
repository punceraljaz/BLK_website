/*!
 * StripGallery — horizontal photo strip: small tiles side by side, the active one grows large in place.
 * Endless loop, drag/flick with momentum, mouse wheel / trackpad, arrows, keyboard, click-to-enlarge.
 * No dependencies.
 *   const g = StripGallery(document.getElementById('projects'), { items: [...] })
 *   g.next(); g.prev(); g.goTo(3); g.open(); g.index; g.item; g.destroy();
 *   root fires 'sg:change' with { index, item } whenever the active photo changes.
 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    items: [],               // [{ src, thumb?, title?, meta?, alt? }]
    label: 'Project gallery',

    // Sizes (px at referenceWidth; scaled down on smaller screens)
    bigWidth: 560,           // active photo width
    bigAspect: 4 / 3,        // active photo width / height (your photos are 4:3)
    smallAspect: 4 / 3,      // small tiles width / height. Same as bigAspect = the photo just scales, no re-cropping (calmest).
                             // 3/4 gives portrait thumbnails like the reference, but the crop shifts as they grow.
    smallScale: 0.3,         // small tile height relative to the big photo's height
    slide: false,            // false = frames stay put, photos jump from frame to frame (no sliding). true = the row slides.
    growDuration: 0,         // s — 0 = the new photo appears big instantly (no zoom). e.g. 0.16 for a quick grow.
    gap: 14,                 // px between tiles
    referenceWidth: 1400,
    mobileBreakpoint: 700,
    mobileBigWidth: 66,      // % of screen width for the active photo on phones (leaves neighbours peeking in)
    edgeFade: 10,            // % of width faded out at each edge (0 = off)

    // Motion
    dragFriction: 0.85,      // 0.1–1, higher = glides further after a flick
    maxFlickSpeed: 5,        // photos per second, cap on flick speed
    minStepInterval: 160,    // ms — no-slide mode: photos change at most once per this many ms, so it never looks jumpy
    snap: true,
    springScale: 1,          // < 1 = slower, softer arrival on a photo (no overshoot either way)
    wheelMode: 'all',        // 'all' | 'horizontal' (sideways trackpad only) | 'none'
    wheelStep: 100,          // px of wheel scroll per photo
    wheelNeedsFullView: 0.85,// vertical wheel only moves the strip once this share of it is on screen
    keyboard: true,
    autoplay: 5000,          // ms between photos (0 = off); pauses on hover/touch/offscreen
    autoplayResume: 10000,
    lightbox: true,
    padding: 40              // px above and below (desktop)
  };

  var ICON_PREV = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mod(a, n) { return ((a % n) + n) % n; }
  function wrapSigned(d, n) { d = mod(d + n / 2, n) - n / 2; return d; }   // -n/2 … n/2
  function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function StripGallery(root, options) {
    if (!root) throw new Error('StripGallery: root element missing');
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    for (k in (options || {})) o[k] = options[k];
    var items = (o.items || []).filter(function (it) { return it && it.src; });
    if (!items.length) throw new Error('StripGallery: no items');
    var N = items.length;

    var reduceMotion = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) o.autoplay = 0;

    // ---------- DOM ----------
    root.classList.add('sg');
    root.innerHTML = '';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', o.label);
    if (o.keyboard) root.tabIndex = 0;

    var track = el('div', 'sg__track');
    root.appendChild(track);

    var cap = el('div', 'sg__cap');
    var capIdx = el('span', 'sg__idx');
    var capTitle = el('span', 'sg__title');
    var capMeta = el('span', 'sg__meta');
    cap.appendChild(capIdx); cap.appendChild(capTitle); cap.appendChild(capMeta);
    root.appendChild(cap);

    var controls = el('div', 'sg__controls');
    var btnPrev = el('button', 'sg__btn'); btnPrev.type = 'button'; btnPrev.innerHTML = ICON_PREV; btnPrev.setAttribute('aria-label', 'Previous photo');
    var btnNext = el('button', 'sg__btn'); btnNext.type = 'button'; btnNext.innerHTML = ICON_NEXT; btnNext.setAttribute('aria-label', 'Next photo');
    var countEl = el('span', 'sg__count');
    controls.appendChild(countEl); controls.appendChild(btnPrev); controls.appendChild(btnNext);
    root.appendChild(controls);

    var live = el('div', 'sg__sr');
    live.setAttribute('aria-live', 'polite');
    root.appendChild(live);

    // tiles are created in layout(): enough copies of the photos to fill wide screens without gaps
    var tiles = [];      // { el, img, item, w, h, x, vis }
    var K = 0;           // number of tiles (a multiple of N)

    function buildTiles(count) {
      if (count === K) return;
      track.innerHTML = '';
      tiles = [];
      K = count;
      for (var j = 0; j < K; j++) {
        var it = items[j % N];
        var t = el('div', 'sg__tile');
        var img = el('img');
        if (it.thumb) img.srcset = it.thumb + ' 480w, ' + it.src + ' 1600w';
        img.src = it.src;
        img.alt = j < N ? (it.alt || it.title || '') : '';
        img.draggable = false;
        img.decoding = 'async';
        t.appendChild(img);
        track.appendChild(t);
        tiles.push({ el: t, img: img, w: -1, h: -1, x: NaN, vis: '', g: 0 });
      }
      tiles[mod(shownPos(), K)].g = 1;     // the current photo starts big (no grow-in on load)
      // decode up front so nothing stutters the first time it grows
      if (K === N || !buildTiles.decoded) {
        tiles.forEach(function (t) { if (t.img.decode) t.img.decode().catch(function () {}); });
        buildTiles.decoded = true;
      }
    }

    // ---------- state ----------
    var pos = 0;                 // float, in photos; the photo at round(pos) is the big one
    var shown = 0, lastStep = 0; // no-slide mode: the position actually on screen, moved one step at a time
    var L = {};
    var active = -1;
    var drag = null, dragTarget = 0;
    var anim = null;
    var inView = true, rafId = 0, lastT = 0, layoutDirty = true;
    var lastRendered = NaN;
    var hovering = false, focused = false;
    var lastInteraction = -Infinity, lastAdvance = now();
    var wheelSettleTimer = 0;

    function interacted() { lastInteraction = now(); }

    // ---------- layout ----------
    function layout() {
      var W = root.clientWidth || o.referenceWidth;
      var mobile = W <= o.mobileBreakpoint;
      var bigW = mobile ? W * clamp(o.mobileBigWidth, 40, 100) / 100
                        : Math.min(o.bigWidth, Math.max(o.bigWidth * W / o.referenceWidth, W * 0.42));
      var bigH = bigW / o.bigAspect;
      var smallH = bigH * o.smallScale;
      var smallW = smallH * o.smallAspect;
      var gap = mobile ? Math.max(8, o.gap * 0.7) : o.gap;

      L.W = W; L.mobile = mobile;
      L.bw = bigW; L.bh = bigH; L.sw = smallW; L.sh = smallH; L.gap = gap;
      L.s = smallW + gap;                       // spacing between small tiles
      L.E = (bigW - smallW) / 2;                // extra half-width of the big one
      L.dragPx = L.s;                           // finger travel per photo: the row follows the finger 1:1
      L.scaleMode = Math.abs(o.smallAspect - o.bigAspect) < 0.001;  // grow with a GPU scale instead of resizing

      // enough tiles so the wrap-around point is always off screen
      var half = W / 2 + bigW;
      var needed = Math.ceil((half - L.E) / L.s) * 2 + 2;
      buildTiles(N * Math.max(1, Math.ceil(needed / N)));

      root.classList.toggle('is-narrow', mobile);
      var padY = mobile ? 20 : o.padding;
      var capH = cap.offsetHeight || 40, ctrlH = controls.offsetHeight || 40;
      var gapY = mobile ? 12 : 16;
      var h = Math.round(padY * 2 + capH + gapY + bigH + gapY + ctrlH);
      root.style.height = h + 'px';
      L.cy = padY + capH + gapY + bigH / 2;
      track.style.top = '0px';

      var left = W / 2 - bigW / 2;
      cap.style.left = left + 'px';
      cap.style.width = bigW + 'px';
      cap.style.top = padY + 'px';
      controls.style.left = left + 'px';
      controls.style.width = bigW + 'px';
      controls.style.top = (L.cy + bigH / 2 + gapY) + 'px';

      var fade = clamp(o.edgeFade, 0, 40);
      var mask = fade > 0 ? 'linear-gradient(to right, transparent 0, #000 ' + fade + '%, #000 ' + (100 - fade) + '%, transparent 100%)' : 'none';
      track.style.webkitMaskImage = mask;
      track.style.maskImage = mask;

      tiles.forEach(function (t) { t.w = t.h = -1; t.x = NaN; t.img.sizes = Math.round(bigW) + 'px'; });
      layoutDirty = true;
      wake();
    }

    // ---------- render ----------
    // The row slides as one piece; only the active photo is big. When the active photo changes,
    // the old one shrinks and the new one grows quickly (growDuration) instead of morphing with every pixel of movement.
    function shownPos() { return o.slide ? Math.round(pos) : shown; }
    function activeTile() { return mod(shownPos(), K); }

    function stepGrow(dt) {
      var at = activeTile(), busy = false;
      var tau = Math.max(0, o.growDuration) / 3;
      var a = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
      for (var j = 0; j < K; j++) {
        var t = tiles[j], target = j === at ? 1 : 0;
        if (t.g === target) continue;
        t.g += (target - t.g) * a;
        if (Math.abs(t.g - target) < 0.002) t.g = target;
        busy = true;
      }
      return busy;
    }

    function render() {
      var cx = L.W / 2, cy = L.cy;
      var P = o.slide ? pos : shown;             // no-slide mode: frames are fixed, photos step from frame to frame
      // tiles that are (partly) big push their neighbours outwards
      var grown = [];
      for (var j = 0; j < K; j++) if (tiles[j].g > 0) grown.push({ j: j, d: wrapSigned(j - P, K), g: tiles[j].g });

      for (j = 0; j < K; j++) {
        var t = tiles[j];
        var d = wrapSigned(j - P, K);
        var x = d * L.s;
        for (var n = 0; n < grown.length; n++) {
          var q = grown[n];
          if (q.j === j) continue;
          x += (q.d < d ? 1 : -1) * L.E * q.g;
        }
        var g = t.g;
        var w = L.sw + (L.bw - L.sw) * g;
        var h = L.sh + (L.bh - L.sh) * g;
        var vis = Math.abs(x) - w / 2 > cx + 20 ? 'hidden' : 'visible';
        var st = t.el.style;
        if (vis !== t.vis) { st.visibility = vis; t.vis = vis; }
        if (vis === 'hidden') continue;
        if (L.scaleMode) {
          if (t.w !== L.bw || t.h !== L.bh) { st.width = L.bw + 'px'; st.height = L.bh + 'px'; t.w = L.bw; t.h = L.bh; }
          st.transform = 'translate3d(' + (cx + x - L.bw / 2).toFixed(2) + 'px,' + (cy - L.bh / 2).toFixed(2) + 'px,0) scale(' + (w / L.bw).toFixed(4) + ')';
        } else {
          var wr = Math.round(w * 10) / 10, hr = Math.round(h * 10) / 10;
          if (wr !== t.w || hr !== t.h) { st.width = wr + 'px'; st.height = hr + 'px'; t.w = wr; t.h = hr; }
          st.transform = 'translate3d(' + (cx + x - wr / 2).toFixed(2) + 'px,' + (cy - hr / 2).toFixed(2) + 'px,0)';
        }
        var isActive = g > 0.5;
        if (t.isActive !== isActive) { t.el.classList.toggle('is-active', isActive); t.isActive = isActive; }
      }
      var a = mod(shownPos(), N);
      if (a !== active) setActive(a);
    }

    function setActive(i) {
      active = i;
      var it = items[i];
      capIdx.textContent = '(' + pad2(i + 1) + ')';
      capTitle.textContent = it.title || '';
      capMeta.textContent = it.meta || '';
      countEl.textContent = pad2(i + 1) + ' / ' + pad2(N);
      live.textContent = (i + 1) + ' / ' + N + (it.title ? ' — ' + it.title : '') + (it.meta ? ', ' + it.meta : '');
      root.dispatchEvent(new CustomEvent('sg:change', { detail: { index: i, item: it } }));
    }

    // ---------- animation ----------
    var GLIDE_EXP = 2.6;
    function stopAnim() { anim = null; }

    function springTo(target, velocity, strength) {
      var s = clamp(strength == null ? 0.6 : strength, 0, 1);
      // springScale < 1 slows the spring down; c scales with its square root,
      // so the damping ratio (no overshoot) stays the same.
      var sc = clamp(o.springScale || 1, 0.1, 2);
      anim = { type: 'spring', target: target, v: velocity || 0, k: (140 + s * 280) * sc, c: (28 + s * 18) * Math.sqrt(sc), m: 0.9 + (1 - s) * 0.45 };
      wake();
    }

    function startGlide(v) {            // v in photos/second
      stopAnim();
      var f = clamp(o.dragFriction, 0.1, 1);
      if (Math.abs(v) < 0.45) return springTo(o.snap ? Math.round(pos) : pos, v, 0.6);
      var target = pos + (0.2 + f * 0.8) * v;
      if (o.snap) target = Math.round(target);
      var d = target - pos;
      if (Math.abs(d) < 0.001) return;
      if (Math.sign(d) !== Math.sign(v) || Math.abs(d) < 0.5) return springTo(target, v, 0.7);
      // starts at the release speed, eases out and stops dead on a photo (no slipping to the next one)
      anim = { type: 'glide', from: pos, d: d, T: clamp((GLIDE_EXP * d / v) * 1000, 300, 3000), t0: now() };
      wake();
    }

    function stepAnim(dt, t) {
      if (!anim) return;
      if (anim.type === 'glide') {
        var u = clamp((t - anim.t0) / anim.T, 0, 1);
        pos = anim.from + anim.d * (1 - Math.pow(1 - u, GLIDE_EXP));
        if (u >= 1) { pos = anim.from + anim.d; anim = null; }
      } else {
        var steps = Math.ceil(dt / (1 / 240)), h = dt / steps;
        for (var i = 0; i < steps; i++) {
          var acc = (-anim.k * (pos - anim.target) - anim.c * anim.v) / anim.m;
          anim.v += acc * h;
          pos += anim.v * h;
        }
        if (Math.abs(pos - anim.target) < 0.0005 && Math.abs(anim.v) < 0.002) { pos = anim.target; anim = null; }
      }
    }

    var growing = true;
    var stepping = false;
    function isBusy() { return !!drag || !!anim || layoutDirty || growing || stepping; }

    function frame(t) {
      rafId = 0;
      var dt = lastT ? clamp((t - lastT) / 1000, 0, 1 / 20) : 1 / 60;
      lastT = t;
      stepAnim(dt, t);
      if (drag && drag.captured) {
        var g = dragTarget - pos;
        pos = Math.abs(g) < 0.0001 ? dragTarget : pos + g * (1 - Math.exp(-dt * 38));   // smooth uneven touch input
      }
      if (!o.slide) {
        // step the visible photo toward the real position, one photo at a time, at a calm pace
        var want = Math.round(pos);
        if (want !== shown && t - lastStep >= o.minStepInterval) {
          shown += want > shown ? 1 : -1;
          lastStep = t;
        }
        stepping = want !== shown;
      }
      growing = stepGrow(dt);
      var rk = o.slide ? pos : shown;
      if (layoutDirty || growing || rk !== lastRendered) { render(); lastRendered = rk; layoutDirty = false; }
      // keep numbers small during endless looping
      if (!drag && !anim && !stepping && Math.abs(pos) > K * 4) {
        var shift = mod(pos, K) - pos;            // a whole number of laps
        pos += shift; shown += Math.round(shift);
        lastRendered = o.slide ? pos : shown;
      }
      if (inView && isBusy()) { if (!rafId) rafId = requestAnimationFrame(frame); }
      else lastT = 0;
    }
    function wake() { if (!rafId && inView) rafId = requestAnimationFrame(frame); }

    // ---------- autoplay ----------
    var autoplayTimer = 0;
    if (o.autoplay > 0 && N > 1) {
      autoplayTimer = setInterval(function () {
        var t = now();
        if (!inView || hovering || focused || lbOpen || drag || anim) { lastAdvance = t; return; }
        if (document.hidden || t - lastInteraction < o.autoplayResume || t - lastAdvance < o.autoplay) return;
        lastAdvance = t;
        api.next();
      }, 250);
    }

    // ---------- input ----------
    function tileAt(x, y) {
      for (var j = 0; j < K; j++) {
        if (tiles[j].vis === 'hidden') continue;
        var r = tiles[j].el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return j;
      }
      return -1;
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('.sg__btn')) return;
      interacted();
      stopAnim();
      dragTarget = pos;
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, lt: now(), captured: false, samples: [] };
      wake();
    }

    function onPointerMove(e) {
      if (e.pointerType === 'mouse' && !drag) {
        var j = tileAt(e.clientX, e.clientY);
        root.classList.toggle('is-over-active', j >= 0 && tiles[j].isActive && o.lightbox);
        root.classList.toggle('is-over-tile', j >= 0 && !tiles[j].isActive);
      }
      if (!drag || drag.id !== e.pointerId) return;
      if (!drag.captured && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) {
        try { root.setPointerCapture(e.pointerId); } catch (_) {}
        drag.captured = true;
        root.classList.add('is-dragging');
      }
      if (!drag.captured) return;
      interacted();
      var t = now();
      var dP = -(e.clientX - drag.lx) / L.dragPx;           // drag left = move to next photo
      dragTarget += dP;
      drag.samples.push({ t: t, v: dP / Math.max(1, t - drag.lt) * 1000 });
      drag.samples = drag.samples.filter(function (s) { return t - s.t <= 120; });
      drag.lx = e.clientX; drag.lt = t;
      wake();
    }

    function endDrag(e, cancelled) {
      if (!drag || drag.id !== e.pointerId) return;
      var d = drag;
      if (d.captured) pos = dragTarget;
      drag = null;
      interacted();
      root.classList.remove('is-dragging');
      if (d.captured) { try { root.releasePointerCapture(e.pointerId); } catch (_) {} }
      if (cancelled) return startGlide(0);
      if (!d.captured) {                                     // a click / tap
        var j = tileAt(e.clientX, e.clientY);
        if (j >= 0) {
          if (tiles[j].isActive) { if (o.lightbox) openLightbox(active); }
          else goToTile(j);
          return;
        }
        return startGlide(0);
      }
      var t = now();
      var recent = d.samples.filter(function (s) { return t - s.t <= 120; });
      var v = recent.length ? recent.reduce(function (a, s) { return a + s.v; }, 0) / recent.length : 0;
      startGlide(clamp(v, -o.maxFlickSpeed, o.maxFlickSpeed));
    }
    function onPointerUp(e) { endDrag(e, false); }
    function onPointerCancel(e) { endDrag(e, true); }
    function onPointerEnter(e) { if (e.pointerType === 'mouse') hovering = true; }
    function onPointerLeave(e) {
      if (e.pointerType !== 'mouse') return;
      hovering = false;
      root.classList.remove('is-over-active', 'is-over-tile');
    }

    function onWheel(e) {
      if (lbOpen || o.wheelMode === 'none') return;
      var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (o.wheelMode === 'horizontal' && !horizontal) return;
      if (!horizontal) {
        var r = root.getBoundingClientRect(), vh = global.innerHeight || r.height;
        var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        if (visible < Math.min(r.height, vh) * clamp(o.wheelNeedsFullView, 0, 1)) return;
      }
      e.preventDefault();
      interacted();
      var dom = horizontal ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) dom *= 33; else if (e.deltaMode === 2) dom *= 400;
      var base = anim && anim.type === 'spring' ? anim.target : pos;
      var lead = o.slide ? 8 : 3;               // don't queue up a long run of steps after the wheel stops
      var target = clamp(base + dom / Math.max(20, o.wheelStep), pos - lead, pos + lead);
      springTo(target, anim && anim.type === 'spring' ? anim.v : 0, 0.5);
      clearTimeout(wheelSettleTimer);
      wheelSettleTimer = setTimeout(function () {
        if (!o.snap || drag) return;
        var tg = anim && anim.type === 'spring' ? anim.target : pos;
        springTo(Math.round(tg), anim && anim.type === 'spring' ? anim.v : 0, 0.5);
      }, 140);
    }

    function onKey(e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); interacted(); api.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); interacted(); api.prev(); }
      else if ((e.key === 'Enter' || e.key === ' ') && e.target === root && o.lightbox) { e.preventDefault(); openLightbox(active); }
    }
    function onFocusIn(e) { focused = !!(e.target.matches && e.target.matches(':focus-visible')); }
    function onFocusOut() { focused = false; }
    function onDragStart(e) { e.preventDefault(); }

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    if (o.keyboard) root.addEventListener('keydown', onKey);
    btnPrev.addEventListener('click', function () { interacted(); api.prev(); });
    btnNext.addEventListener('click', function () { interacted(); api.next(); });

    var ro = null, io = null, lastW = -1, roPending = 0;
    if (global.ResizeObserver) {
      ro = new ResizeObserver(function () {
        if (roPending) return;
        roPending = requestAnimationFrame(function () {
          roPending = 0;
          if (root.clientWidth !== lastW) { lastW = root.clientWidth; layout(); }
        });
      });
      ro.observe(root);
    } else global.addEventListener('resize', layout);
    if (global.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) wake();
      }, { threshold: 0 });
      io.observe(root);
    }

    // ---------- lightbox ----------
    var lb = null, lbOpen = false, lbIndex = 0, lbReturnFocus = null, lbEls = {}, lbSwipe = null;

    function buildLightbox() {
      lb = el('div', 'sg-lb');
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', o.label);
      lb.innerHTML =
        '<button type="button" class="sg-lb__btn sg-lb__close" aria-label="Close">' + ICON_CLOSE + '</button>' +
        '<button type="button" class="sg-lb__btn sg-lb__nav sg-lb__prev" aria-label="Previous photo">' + ICON_PREV + '</button>' +
        '<figure class="sg-lb__fig"><img class="sg-lb__img" alt="" draggable="false">' +
        '<figcaption class="sg-lb__cap"><span class="sg-lb__text"><span class="sg-lb__title"></span><span class="sg-lb__meta"></span></span>' +
        '<span class="sg-lb__count"></span></figcaption></figure>' +
        '<button type="button" class="sg-lb__btn sg-lb__nav sg-lb__next" aria-label="Next photo">' + ICON_NEXT + '</button>';
      document.body.appendChild(lb);
      ['close', 'prev', 'next', 'img', 'title', 'meta', 'count'].forEach(function (n) { lbEls[n] = lb.querySelector('.sg-lb__' + n); });
      lbEls.close.addEventListener('click', closeLightbox);
      lbEls.prev.addEventListener('click', function () { showLb(lbIndex - 1); });
      lbEls.next.addEventListener('click', function () { showLb(lbIndex + 1); });
      lbEls.img.addEventListener('load', function () { lbEls.img.classList.remove('is-loading'); });
      lb.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.sg-lb__btn')) return;
        lbSwipe = { x: e.clientX, y: e.clientY, onPhoto: !!e.target.closest('.sg-lb__img, .sg-lb__cap') };
      });
      lb.addEventListener('pointerup', function (e) {
        if (!lbSwipe) return;
        var dx = e.clientX - lbSwipe.x, dy = e.clientY - lbSwipe.y, onPhoto = lbSwipe.onPhoto;
        lbSwipe = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) return showLb(lbIndex + (dx < 0 ? 1 : -1));
        if (Math.hypot(dx, dy) < 8 && !onPhoto) closeLightbox();
      });
      lb.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    }

    function onLbKey(e) {
      if (!lbOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); showLb(lbIndex + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showLb(lbIndex - 1); }
      else if (e.key === 'Tab') {
        var f = [lbEls.close, lbEls.prev, lbEls.next];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    }

    function showLb(i) {
      i = mod(i, N);
      lbIndex = i;
      var it = items[i];
      if (lbEls.img.getAttribute('src') !== it.src) {
        lbEls.img.classList.add('is-loading');
        lbEls.img.src = it.src;
        if (lbEls.img.complete) lbEls.img.classList.remove('is-loading');
      }
      lbEls.img.alt = it.alt || it.title || '';
      lbEls.title.textContent = it.title || '';
      lbEls.meta.textContent = it.meta || '';
      lbEls.count.textContent = pad2(i + 1) + ' / ' + pad2(N);
      if (lbOpen && i !== active) api.goTo(i);   // keep the strip in sync behind the overlay
    }

    function openLightbox(i) {
      if (!o.lightbox || i < 0) return;
      if (!lb) buildLightbox();
      lbReturnFocus = document.activeElement;
      lbIndex = i;
      showLb(i);
      lbOpen = true;
      lb.classList.add('is-open');
      document.documentElement.classList.add('sg-lb-lock');
      document.addEventListener('keydown', onLbKey);
      lbEls.close.focus({ preventScroll: true });
      root.classList.remove('is-over-active');
    }

    function closeLightbox() {
      if (!lbOpen) return;
      lbOpen = false;
      lb.classList.remove('is-open');
      document.documentElement.classList.remove('sg-lb-lock');
      document.removeEventListener('keydown', onLbKey);
      interacted();
      if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus({ preventScroll: true });
    }

    // ---------- public API ----------
    function goToTile(j) {          // shortest way to that tile
      springTo(pos + wrapSigned(j - pos, K), 0, 0.6);
      anim.goal = mod(j, N);
      lastAdvance = now();
    }
    function currentTarget() {
      return anim ? (anim.type === 'spring' ? anim.target : anim.from + anim.d) : Math.round(pos);
    }

    var api = {
      goTo: function (i) {
        var base = Math.round(currentTarget());
        springTo(base + wrapSigned(mod(i, N) - mod(base, N), N), 0, 0.6);
        lastAdvance = now();
      },
      next: function () { springTo(Math.round(currentTarget()) + 1, anim && anim.v || 0, 0.6); lastAdvance = now(); },
      prev: function () { springTo(Math.round(currentTarget()) - 1, anim && anim.v || 0, 0.6); lastAdvance = now(); },
      open: function (i) { openLightbox(i == null ? active : i); },
      close: closeLightbox,
      get index() { return active; },
      get item() { return items[active]; },
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        if (autoplayTimer) clearInterval(autoplayTimer);
        clearTimeout(wheelSettleTimer);
        closeLightbox();
        if (lb) lb.remove();
        ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerenter', 'pointerleave', 'dragstart', 'focusin', 'focusout', 'keydown']
          .forEach(function (ev, n) { root.removeEventListener(ev, [onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerEnter, onPointerLeave, onDragStart, onFocusIn, onFocusOut, onKey][n]); });
        root.removeEventListener('wheel', onWheel);
        if (ro) ro.disconnect(); else global.removeEventListener('resize', layout);
        if (io) io.disconnect();
        root.innerHTML = '';
        root.style.height = '';
      }
    };

    layout();
    render();
    return api;
  }

  StripGallery.defaults = DEFAULTS;
  global.StripGallery = StripGallery;
})(typeof window !== 'undefined' ? window : this);
