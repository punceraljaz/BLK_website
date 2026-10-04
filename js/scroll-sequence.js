/* ==========================================================================
   scroll-sequence.js — the room animation: clips of one room drawn on a
   canvas, played on load or scrubbed by scroll. Plain JS, no dependencies.

     <div data-seq-chain='[
       {"path":"assets/frames/room/",  "count":122, "play":"load",
        "fps":24, "delay":150, "buffer":40},
       {"path":"assets/frames/room2/", "count":121, "play":"scroll",
        "from":"#pkg-1", "to":"#pkg-2", "blend":8}
     ]'>
       <canvas class="seq__canvas"></canvas>
     </div>

   Per clip:
     "play"   "load"   plays once on page load (fps, delay ms, buffer = frames
                       downloaded before it starts). Reduced motion: last frame.
              "scroll" progress 0 when the top of `from` is at the top of the
                       viewport, 1 when the top of `to` is.
              "manual" rests on its last frame until playClip(i).
     "blend"  cross-fades the first N frames over the previous clip's last
              frame to hide the seam between two AI clips.
     "video"  true: play the .h264 frames next to the images (GPU decode).
     "pad" (default 4), "ext" (default "webp").

   On the element:
     data-seq-lazy           download nothing until .__seq.start()
     data-seq-focus="0.62"   horizontal crop anchor 0..1
     data-seq-assist="smooth" smooth wheel + auto finish (see below)
   From page code: .__seq.start(), .setActive(false) (a hidden chain stops
   drawing), .playClip(i) (plays clip i once in place).

   Performance: the loop only runs while something changes (scroll, a clip
   playing, frames arriving or decoding). At rest it sleeps, so an idle page
   costs nothing.
   ========================================================================== */

(function () {
  'use strict';

  var SMOOTHING = 0.14;         // share of the gap closed per animation frame
  var SNAP = 0.0005;            // snap when closer than this
  var AUTOPLAY_WAIT_MAX_MS = 4000;  // start playback even if frames are still loading

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  // html has scroll-behavior:smooth (base.css). 'instant' stops the browser
  // from smoothing each step of our own eased scrolling.
  function jumpTo(y) { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

  var chains = [];
  function wakeAll() { for (var i = 0; i < chains.length; i++) chains[i].wake(); }

  /* Frames are downloaded as compressed data (all of them, ~100 KB each) but
     only a small window around the playhead is kept decoded: VideoFrames
     (see "video" below) or ImageBitmaps made with createImageBitmap(), which
     decodes on background threads.
     Drawing a plain <img> made Chrome decode each 1904x1088 frame on the
     main thread at draw time (~20 ms each), which is what made scrolling
     stutter; keeping every frame decoded would take ~3 GB of memory. */
  // How many frames stay decoded around the playhead. Image frames:
  var WINDOW_IMAGES = {
    ahead: 30,               // ahead in the direction of travel
    behind: 3,
    idle: 4,                 // either side of the on-screen clip at rest
    lead: 12                 // head start for the move that can come next
  };
  // Video frames decode in ~10 ms, and a hardware decoder has only a small
  // pool of output buffers, so only a few are held.
  var WINDOW_VIDEO = { ahead: 8, behind: 1, idle: 2, lead: 6 };
  var DECODE_PARALLEL = 6;   // decodes in flight at once (all clips together)
  var decodesInFlight = 0;

  /* Hardware video decoding. Even decoded off the main thread, WebP frames
     kept a laptop CPU (i5 + Iris Xe) too busy to keep up. With "video": true
     a clip's frames are also stored as single-frame H.264 key frames
     (0001.h264 ...) that the GPU decodes through WebCodecs (~10 ms, CPU
     nearly idle). Browsers without a hardware H.264 decoder (or without
     WebCodecs, e.g. plain http on a LAN IP) use the image files instead. */
  var H264_CODEC = 'avc1.640028';          // High profile, level 4.0
  var hardwareH264 = (function () {
    if (!window.VideoDecoder || !window.EncodedVideoChunk) return Promise.resolve(false);
    return VideoDecoder.isConfigSupported({ codec: H264_CODEC, hardwareAcceleration: 'prefer-hardware' })
      .then(function (r) { return !!r.supported; }, function () { return false; });
  })();
  // Opened straight from disk (file://) the browser blocks fetch(), so there
  // frames load as plain <img> elements (createImageBitmap accepts those).
  var FROM_DISK = location.protocol === 'file:';
  var VIDEO_SILENT_MS = 2000;   // no decoded frame this long: use the images
  var NEAREST_MAX = 6;          // see nearestIndex

  function FrameSet(spec) {
    this.path = spec.path;
    this.count = spec.count;
    this.pad = spec.pad || 4;
    this.ext = spec.ext || 'webp';
    this.useVideo = !!spec.video;          // decided once hardwareH264 resolves
    this.blobs = new Array(this.count);    // downloaded, compressed
    this.frames = new Array(this.count);   // decoded (windowed)
    this.decoding = {};
    this.requested = {};
    this.loaded = 0;
    this.onLoad = null;
    this.lo = 0; this.hi = -1;             // current keep-decoded window
    this.decoder = null;
    this.decoderErrors = 0;
  }
  FrameSet.prototype.src = function (i) {
    var n = String(i + 1);
    while (n.length < this.pad) n = '0' + n;
    return this.path + n + '.' + (this.useVideo ? 'h264' : this.ext);
  };
  function loadImage(url) {
    var img = new Image();
    img.src = url;
    return img.decode().then(function () { return img; });
  }
  FrameSet.prototype.load = function (i) {
    if (i < 0 || i >= this.count || this.requested[i]) return;
    this.requested[i] = true;
    var self = this, video;
    hardwareH264.then(function (hw) {
      if (!hw || FROM_DISK) self.useVideo = false;
      video = self.useVideo;
      if (!video && FROM_DISK) return loadImage(self.src(i));
      return fetch(self.src(i)).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return video ? r.arrayBuffer() : r.blob();
      });
    }).then(function (data) {
      if (video !== self.useVideo) return;   // switched to images meanwhile
      self.blobs[i] = data;
      self.loaded++;
      if (self.onLoad) self.onLoad(i);
      wakeAll();
    }, function () {
      if (video) self.fallBackToImages();    // e.g. no .h264 files on the server
      else delete self.requested[i];
    });
  };
  FrameSet.prototype.loadAll = function () {
    for (var i = 0; i < this.count; i++) this.load(i);
  };
  FrameSet.prototype.readyThrough = function (n) {   // first n frames downloaded?
    for (var k = 0; k < n; k++) if (!this.blobs[k]) return false;
    return true;
  };
  FrameSet.prototype.fallBackToImages = function () {
    if (!this.useVideo) return;
    this.useVideo = false;
    for (var k = 0; k < this.count; k++) {
      if (this.frames[k]) { release(this.frames[k]); this.frames[k] = null; }
    }
    this.blobs = new Array(this.count);
    this.requested = {};
    this.loaded = 0;
    this.lo = 0; this.hi = -1;
    this.loadAll();
  };
  FrameSet.prototype.getDecoder = function () {
    if (this.decoder && this.decoder.state === 'configured') return this.decoder;
    var self = this;
    this.decoder = new VideoDecoder({
      output: function (vf) { self.onVideoFrame(vf); },
      error: function () { self.onDecoderError(); }
    });
    this.decoder.configure({ codec: H264_CODEC, hardwareAcceleration: 'prefer-hardware', optimizeForLatency: true });
    return this.decoder;
  };
  FrameSet.prototype.onVideoFrame = function (vf) {
    var self = this, i = vf.timestamp;     // timestamp carries the frame index
    this.gotVideoFrame = true;
    this.decodeDone(i);
    // Frames are drawn straight from the VideoFrame (GPU memory, no copy).
    // Copying each into an ImageBitmap first halved the frame rate. Only the
    // kept last frame (the blend base) becomes a bitmap, so it does not tie
    // up one of the decoder's few output buffers.
    if (i === this.count - 1) {
      createImageBitmap(vf).then(function (bmp) {
        if (!self.frames[i]) self.frames[i] = bmp;
      }, function () {}).then(function () { vf.close(); wakeAll(); });
    } else if (this.inWindow(i) && !this.frames[i]) {
      this.frames[i] = vf;
    } else {
      vf.close();
    }
  };
  function release(frame) {
    // VideoFrames must be closed to hand their buffer back to the decoder
    // (cheap). ImageBitmaps are only dropped: their close() frees pixels
    // synchronously on the main thread (~5 ms each); GC does it off it.
    if (window.VideoFrame && frame instanceof VideoFrame) frame.close();
  }
  // A failing decoder is rebuilt; after repeated failures the clip falls
  // back to its image files.
  FrameSet.prototype.onDecoderError = function () {
    for (var k in this.decoding) this.decodeDone(+k);
    if (++this.decoderErrors >= 3) this.fallBackToImages();
  };
  FrameSet.prototype.decodeDone = function (i) {
    if (!this.decoding[i]) return;
    delete this.decoding[i];
    decodesInFlight--;
    wakeAll();                             // a decode slot is free, a frame may be ready
  };
  FrameSet.prototype.inWindow = function (i) {
    return (i >= this.lo && i <= this.hi) || i === this.count - 1;   // last frame: blend base
  };
  // Keep frames lo..hi decoded; `order` lists the indices to decode first.
  FrameSet.prototype.keep = function (lo, hi, order) {
    if (this.useVideo && !this.gotVideoFrame && this.firstDecodeAt &&
        performance.now() - this.firstDecodeAt > VIDEO_SILENT_MS) {
      for (var j in this.decoding) this.decodeDone(+j);
      this.fallBackToImages();
    }
    // Decoded frames only ever sit inside the previous window (or are the
    // kept last frame), so only that range needs checking.
    var oldLo = this.lo, oldHi = this.hi;
    this.lo = lo; this.hi = hi;
    for (var k = oldLo; k <= oldHi; k++) {
      if (this.frames[k] && !this.inWindow(k)) { release(this.frames[k]); this.frames[k] = null; }
    }
    for (var o = 0; o < order.length && decodesInFlight < DECODE_PARALLEL; o++) {
      this.decode(order[o]);
    }
  };
  FrameSet.prototype.decode = function (i) {
    if (i < 0 || i >= this.count || this.frames[i] || this.decoding[i] || !this.blobs[i]) return;
    var self = this;
    this.decoding[i] = true;
    decodesInFlight++;
    if (this.useVideo) {
      if (!this.firstDecodeAt) {
        this.firstDecodeAt = performance.now();
        setTimeout(wakeAll, VIDEO_SILENT_MS + 100);   // so keep() can notice a silent decoder
      }
      try {
        this.getDecoder().decode(new EncodedVideoChunk({ type: 'key', timestamp: i, data: this.blobs[i] }));
      } catch (e) { this.onDecoderError(); }
      return;
    }
    createImageBitmap(this.blobs[i]).then(function (bmp) {
      if (self.inWindow(i) && !self.frames[i]) self.frames[i] = bmp;
    }, function () {}).then(function () { self.decodeDone(i); });
  };
  // Closest decoded frame, looking only a few frames away; a far one (e.g.
  // the kept last frame) would make the room jump.
  FrameSet.prototype.nearestIndex = function (i) {
    if (this.frames[i]) return i;
    for (var d = 1; d <= NEAREST_MAX; d++) {
      if (this.frames[i - d]) return i - d;
      if (this.frames[i + d]) return i + d;
    }
    return -1;
  };

  /* ======================================================================== */

  function SequenceChain(el) {
    var self = this;
    this.el = el;
    this.canvas = el.querySelector('.seq__canvas');
    // Opaque canvas: the frame always covers it, and an opaque canvas can be
    // handed to the screen as a hardware overlay instead of being blended
    // into the page every frame (measured: that blend was the full-screen
    // slowdown). It stays hidden until the first frame, since an opaque
    // canvas starts out black and would cover the poster.
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.canvas.style.visibility = 'hidden';
    var focus = parseFloat(el.getAttribute('data-seq-focus'));
    this.focusX = isNaN(focus) ? 0.5 : Math.min(1, Math.max(0, focus));
    this.clips = JSON.parse(el.getAttribute('data-seq-chain')).map(function (spec) {
      return {
        spec: spec, set: new FrameSet(spec), play: spec.play || 'scroll',
        p: 0, target: 0,
        fromEl: spec.from ? document.querySelector(spec.from) : null,
        toEl: spec.to ? document.querySelector(spec.to) : null
      };
    });
    this.lastKey = '';
    this.active = true;                      // false: keeps tracking scroll, draws nothing
    this.started = false;
    this.raf = 0;
    this.tops = null;                        // cached page positions of the clips' from/to
    this.auto = null;                        // running auto-finish glide
    this.ignoreScroll = false;
    this.smoothWheel = false;
    this.lastY = window.scrollY;
    this.scrollDir = 1;                      // last scroll direction (auto finish)
    this.tick = this.tick.bind(this);
    this.wake = this.wake.bind(this);
    chains.push(this);
    this.resize();

    // data-seq-lazy: nothing is downloaded until start() is called (a second
    // view the visitor may never open).
    if (el.getAttribute('data-seq-lazy') == null) this.start();

    var raf = 0;
    function relayout() { self.tops = null; self.wake(); }
    window.addEventListener('scroll', this.wake, { passive: true });
    window.addEventListener('resize', function () {
      relayout();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { self.resize(); });
    });
    window.addEventListener('load', relayout);
    if (window.ResizeObserver) {
      // The page can also resize the canvas itself (e.g. a wider room for one
      // package); keep the drawing buffer matched to its displayed size.
      // Resized directly in the observer callback (after layout, before
      // paint) so the redraw lands in the same frame as the new size.
      new ResizeObserver(function () { self.resize(); }).observe(this.canvas);
      // The page's height changes (fonts, the gallery): positions may move.
      new ResizeObserver(relayout).observe(document.body);
    }
    if (el.getAttribute('data-seq-assist') === 'smooth') {
      this.bindSmoothWheel();
      this.bindAutoFinish();
    }
    this.wake();
  }

  SequenceChain.prototype.wake = function () {
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  };

  // Page positions of each scroll clip's from/to, measured once per layout
  // (not every frame).
  SequenceChain.prototype.clipTops = function () {
    if (!this.tops) {
      this.tops = this.clips.map(function (c) {
        return c.fromEl && c.toEl ? [docTop(c.fromEl), docTop(c.toEl)] : null;
      });
    }
    return this.tops;
  };

  // Begin downloading. Loading order: the load-played clip first (it is on
  // screen now), then the other clips once it is ready or after the wait cap.
  SequenceChain.prototype.start = function () {
    if (this.started) return;
    this.started = true;
    var self = this, first = this.clips[0];
    first.set.load(0);
    var rest = function () {
      for (var c = 1; c < self.clips.length; c++) {
        self.clips[c].set.load(0);
        self.clips[c].set.loadAll();
      }
    };
    if (first.play === 'load') this.startLoadClip(first, rest);
    else { first.set.loadAll(); rest(); }
  };

  // A hidden chain (another view is on show) stops decoding and drawing but
  // keeps following the scroll, so it is in the right place when shown.
  SequenceChain.prototype.setActive = function (on) {
    this.active = !!on;
    if (on) { this.lastKey = ''; this.wake(); }
  };

  // Play clip i once from its start, over its natural length, regardless of
  // the scroll (a view picked on a package shows that package's transition).
  // Afterwards a scroll clip hands back to the scroll position, which at that
  // package's top is the same last frame. Reduced motion jumps to the end.
  SequenceChain.prototype.playClip = function (i) {
    var clip = this.clips[i];
    if (!clip) return;
    var fps = clip.spec.fps || 24;
    // t0 is set once the clip is fully downloaded, so a first click on a
    // slow connection waits on the start frame instead of skipping ahead.
    clip.forced = { t0: null, dur: reducedMotion.matches ? 0 : (clip.set.count - 1) / fps * 1000 };
    clip.p = 0;
    this.lastKey = '';
    this.wake();
  };

  SequenceChain.prototype.startLoadClip = function (clip, then) {
    var self = this, spec = clip.spec, set = clip.set;
    var fps = spec.fps || 24, delay = spec.delay == null ? 400 : spec.delay;
    var buffer = Math.min(set.count, spec.buffer || set.count);
    clip.duration = (set.count - 1) / fps * 1000;
    clip.elapsed = 0;
    clip.playing = false;

    if (reducedMotion.matches) {           // no motion: straight to the end state
      clip.p = 1;
      set.load(set.count - 1);
      set.onLoad = function () { if (set.blobs[set.count - 1]) then(); };
      return;
    }

    set.loadAll();
    var started = false, restStarted = false;
    function play() {
      setTimeout(function () { clip.playing = true; clip.lastNow = 0; self.wake(); }, delay);
    }
    function go() {
      if (started) return;
      started = true;
      // Hold: while <html data-seq-hold> is set (the home page intro is on),
      // the load clip waits for the "seq:release" event, so it plays when the
      // intro reveals the room instead of unseen behind it.
      if (document.documentElement.hasAttribute('data-seq-hold')) {
        document.addEventListener('seq:release', play, { once: true });
      } else play();
    }
    function startRest() { if (!restStarted) { restStarted = true; then(); } }
    set.onLoad = function () {
      if (set.readyThrough(buffer)) go();
      if (set.loaded >= set.count) startRest();
    };
    setTimeout(function () { go(); startRest(); }, AUTOPLAY_WAIT_MAX_MS);
  };

  // ---- smooth wheel (data-seq-assist="smooth") -----------------------------
  // A wheel notch moves the page by its normal distance, but spread over a
  // few frames (eased toward a target) instead of jumping 100 px in one frame
  // and standing still until the next notch, which made the room stutter.
  // Whole page; touch, keyboard and the scrollbar stay native.
  var SMOOTH_WHEEL_TAU = 110;         // ms: time constant of the ease toward the target

  SequenceChain.prototype.bindSmoothWheel = function () {
    var self = this, target = null, raf = 0, last = 0;
    function maxY() { return document.documentElement.scrollHeight - window.innerHeight; }
    function stop() { target = null; last = 0; self.smoothWheel = false; }
    function step(now) {
      raf = 0;
      if (target == null) return;
      var dt = last ? Math.min(64, now - last) : 16;
      last = now;
      var y = window.scrollY, d = target - y;
      var move = d * (1 - Math.exp(-dt / SMOOTH_WHEEL_TAU));
      // Done when close, or when the step is too small to move a whole pixel
      // (scrollY is rounded, so the ease would otherwise never arrive and the
      // wheel would stay "active" forever, blocking auto finish).
      if (Math.abs(d) < 1.5 || Math.abs(move) < 0.6) { jumpTo(target); stop(); return; }
      jumpTo(y + move);
      raf = requestAnimationFrame(step);
    }
    window.addEventListener('wheel', function (e) {
      if (reducedMotion.matches || e.ctrlKey || e.defaultPrevented) return;   // zoom, lightbox
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;                    // sideways: native
      if (document.documentElement.classList.contains('sg-lb-lock')) return;
      var dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
      e.preventDefault();
      if (target == null) target = window.scrollY;
      target = Math.max(0, Math.min(maxY(), target + dy));
      self.smoothWheel = true;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: false });
    // Any other way of scrolling takes over immediately.
    ['mousedown', 'keydown', 'touchstart'].forEach(function (type) {
      window.addEventListener(type, function () { stop(); self.cancelGlide(); }, { passive: true });
    });
  };

  // ---- auto finish (with "smooth") -----------------------------------------
  // When scrolling stops part-way between two packages (any input: wheel,
  // touch, keys, scrollbar), the page glides to the end of that transition in
  // the direction of travel. A tiny nudge (under FINISH_MIN of the way)
  // returns to where it came from instead, so a small scroll never carries
  // the page a whole package. New input cancels the glide at once.
  var FINISH_IDLE_MS = 160;           // scroll pause before finishing
  var FINISH_MIN = 0.1;               // share of a transition that counts as "going"
  var FINISH_MS_PER_SECTION = 1500, FINISH_MIN_MS = 450, FINISH_MAX_MS = 1400;

  // Glide curve: moves the moment it starts, even middle, soft landing.
  // 35% ease-out-quad + 65% ease-in-out-sine.
  function easeGlide(t) {
    var outQuad = 1 - (1 - t) * (1 - t);
    var inOutSine = -(Math.cos(Math.PI * t) - 1) / 2;
    return 0.35 * outQuad + 0.65 * inOutSine;
  }

  // Package tops the page can land on, in page order.
  SequenceChain.prototype.anchors = function () {
    var list = [];
    this.clipTops().forEach(function (t, i) {
      if (t && this.clips[i].play === 'scroll') list.push(t[0], t[1]);
    }, this);
    list.sort(function (a, b) { return a - b; });
    return list.filter(function (v, i) { return i === 0 || v - list[i - 1] > 1; });
  };

  SequenceChain.prototype.bindAutoFinish = function () {
    var self = this, timer = 0, touching = false;
    function finish() {
      if (self.auto || touching || self.smoothWheel || reducedMotion.matches) return;
      var a = self.anchors(), y = window.scrollY;
      if (a.length < 2 || y <= a[0] + 2 || y >= a[a.length - 1] - 2) return;
      for (var i = 0; i < a.length - 1; i++) {
        if (y > a[i] + 2 && y < a[i + 1] - 2) {
          var p = (y - a[i]) / (a[i + 1] - a[i]);
          var dest = self.scrollDir > 0 ? (p > FINISH_MIN ? a[i + 1] : a[i]) : (p < 1 - FINISH_MIN ? a[i] : a[i + 1]);
          self.glideTo(dest, a);
          return;
        }
      }
    }
    // The scroll direction comes from update(), which reads scrollY anyway.
    window.addEventListener('scroll', function () {
      if (self.auto || self.ignoreScroll) return;
      clearTimeout(timer);
      timer = setTimeout(finish, FINISH_IDLE_MS);
    }, { passive: true });
    window.addEventListener('wheel', function () { if (self.auto) self.cancelGlide(); }, { passive: true, capture: true });
    window.addEventListener('touchstart', function () { touching = true; self.cancelGlide(); }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (t) {
      window.addEventListener(t, function () {
        touching = false;
        clearTimeout(timer); timer = setTimeout(finish, FINISH_IDLE_MS);
      }, { passive: true });
    });
  };

  SequenceChain.prototype.glideTo = function (dest, a) {
    var self = this;
    var from = window.scrollY, dist = dest - from;
    var section = (a[a.length - 1] - a[0]) / (a.length - 1);
    var ms = Math.min(FINISH_MAX_MS, Math.max(FINISH_MIN_MS, Math.abs(dist) / section * FINISH_MS_PER_SECTION));
    if (this.auto) cancelAnimationFrame(this.auto.raf);
    var start = performance.now();
    this.ignoreScroll = true;
    this.auto = { raf: 0 };
    function step(now) {
      if (!self.auto) return;
      var t = Math.min(1, (now - start) / ms);
      jumpTo(from + dist * easeGlide(t));
      if (t < 1) { self.auto.raf = requestAnimationFrame(step); return; }
      self.auto = null;
      // The final step's scroll event arrives next frame; keep ignoring it.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (!self.auto) self.ignoreScroll = false; });
      });
    }
    this.auto.raf = requestAnimationFrame(step);
  };

  SequenceChain.prototype.cancelGlide = function () {
    if (!this.auto) return;
    cancelAnimationFrame(this.auto.raf);
    this.auto = null;
    this.ignoreScroll = false;
  };

  // ---- drawing ---------------------------------------------------------------
  // Resizing clears the canvas, and this canvas is opaque, so it would show
  // black until the next tick draws (a visible flash while the page animates
  // the room's width). So it is redrawn right here, inside the resize; if the
  // wanted frame is not decoded yet, the previous picture is scaled back in.
  SequenceChain.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var c = this.canvas;
    var w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (w === c.width && h === c.height) return;
    var snap = null;
    if (this.lastKey && c.width && c.height) {
      snap = this.snapCanvas || (this.snapCanvas = document.createElement('canvas'));
      snap.width = c.width; snap.height = c.height;
      snap.getContext('2d').drawImage(c, 0, 0);
    }
    c.width = w;
    c.height = h;
    // Resizing resets context state; the default smoothing is 'low', which
    // visibly softens frames when they are scaled to the screen.
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.lastKey = '';
    this.render();
    if (!this.lastKey && snap) this.drawImage(snap, 1);
    this.wake();
  };

  // Advances every clip; returns true while something is still moving.
  SequenceChain.prototype.update = function (now) {
    // Glides and smooth-wheel steps are already smooth; smoothing them again
    // only makes the room lag behind the page.
    var follow = this.auto || this.smoothWheel ? 0.5 : SMOOTHING;
    var tops = this.clipTops(), y = window.scrollY, busy = false;
    if (y !== this.lastY) { this.scrollDir = y > this.lastY ? 1 : -1; this.lastY = y; }
    for (var c = 0; c < this.clips.length; c++) {
      var clip = this.clips[c], t = tops[c];
      if (t) clip.target = clamp01((y - t[0]) / Math.max(t[1] - t[0], 1));
      if (clip.forced) {                       // playClip(): time, not scroll
        var f = clip.forced;
        if (f.t0 === null && clip.set.loaded >= clip.set.count) f.t0 = now;
        clip.p = f.t0 === null ? 0 : f.dur ? clamp01((now - f.t0) / f.dur) : 1;
        if (clip.p >= 1) clip.forced = null;
        busy = true;
        continue;
      }
      if (clip.play === 'manual') { clip.p = 1; continue; }   // rests on its last frame
      if (clip.play === 'load') {
        if (!clip.playing) continue;
        var dt = clip.lastNow ? Math.min(now - clip.lastNow, 100) : 0;
        clip.lastNow = now;
        clip.elapsed += dt;
        clip.p = clamp01(clip.elapsed / clip.duration);
        if (clip.p >= 1) clip.playing = false;
        busy = true;
      } else if (t) {
        var gap = clip.target - clip.p;
        clip.p = Math.abs(gap) < SNAP ? clip.target : clip.p + gap * follow;
        if (clip.p !== clip.target) busy = true;
      }
    }
    // A playClip() playback only holds while the page rests on its package;
    // once the visitor scrolls on, the scroll takes over again.
    for (var i = 0; i < this.clips.length; i++) {
      if (!this.clips[i].forced) continue;
      var here = this.clips[i].play !== 'scroll' || this.clips[i].target > 0.999;
      for (var j = i + 1; j < this.clips.length; j++) {
        if (this.clips[j].play === 'scroll' && this.clips[j].target > 0.001) here = false;
      }
      if (!here) this.clips[i].forced = null;
    }
    return busy;
  };

  // Decide which frames of each clip stay decoded: a long run ahead of the
  // playhead in the direction it is heading, a few behind, and a few either
  // side of clips that are standing still (ready for the next move).
  SequenceChain.prototype.prepare = function () {
    var active = this.activeIndex();         // gets the decode slots first
    for (var n = 0; n < this.clips.length; n++) {
      var c = n === 0 ? active : (n <= active ? n - 1 : n);
      var clip = this.clips[c], set = clip.set, last = set.count - 1;
      var idx = Math.round(clip.p * last);
      var goal = clip.forced ? last
        : clip.play === 'load' ? (clip.p < 1 ? last : idx)
        : clip.play === 'manual' ? idx
        : Math.round(clip.target * last);
      var dir = goal > idx ? 1 : goal < idx ? -1 : 0;
      var lo, hi;
      if (dir === 0 && clip.play === 'scroll' && (c === active || c === active + 1)) {
        // At rest next to this clip: the next move plays it forward from its
        // start or backward from its end, so give that a head start.
        if (idx <= 0) dir = 1;
        else if (idx >= last) dir = -1;
      }
      var w = set.useVideo ? WINDOW_VIDEO : WINDOW_IMAGES;
      if (dir > 0) { lo = idx - w.behind; hi = idx + (goal === idx ? w.lead : w.ahead); }
      else if (dir < 0) { lo = idx - (goal === idx ? w.lead : w.ahead); hi = idx + w.behind; }
      else if (c === active) { lo = idx - w.idle; hi = idx + w.idle; }
      else { lo = 0; hi = -1; }             // off screen: only the kept last frame
      lo = Math.max(0, lo); hi = Math.min(last, hi);
      // Decode order: the playhead, then outward in the direction of travel,
      // then the few frames behind, then the kept last frame.
      var order = [], step = dir < 0 ? -1 : 1, k;
      for (k = idx; k >= lo && k <= hi; k += step) order.push(k);
      for (k = idx - step; k >= lo && k <= hi; k -= step) order.push(k);
      order.push(last);
      set.keep(lo, hi, order);
    }
  };

  // Which clip is on screen: one being played by playClip(), else the latest
  // scroll clip that has started, else the first clip.
  SequenceChain.prototype.activeIndex = function () {
    for (var f = 0; f < this.clips.length; f++) if (this.clips[f].forced) return f;
    for (var c = this.clips.length - 1; c > 0; c--) {
      if (this.clips[c].play === 'scroll' && this.clips[c].p > 0) return c;
    }
    return 0;
  };

  // Near 1:1 the frame is drawn pixel-exact. A tiny "cover" stretch (e.g.
  // 1904px frames on a 1920px canvas = 0.8%) plus a half-pixel offset
  // resamples every pixel and visibly softens the picture. The few pixels a
  // 1:1 frame leaves uncovered at the edges are filled by the scaled frame
  // underneath.
  var PIXEL_EXACT_MAX = 1.025;
  SequenceChain.prototype.drawImage = function (img, alpha) {
    var cw = this.canvas.width, ch = this.canvas.height;
    var iw = img.displayWidth || img.width, ih = img.displayHeight || img.height;
    var scale = Math.max(cw / iw, ch / ih);   // cover
    var dw = iw * scale, dh = ih * scale;
    var exact = scale > 1 / PIXEL_EXACT_MAX && scale <= PIXEL_EXACT_MAX;
    var ctx = this.ctx;
    ctx.globalAlpha = alpha;
    if (!exact) {
      ctx.drawImage(img, (cw - dw) * this.focusX, (ch - dh) / 2, dw, dh);
    } else {
      var x = Math.round((cw - iw) / 2), y = Math.round((ch - ih) / 2);
      if (x > 0 || y > 0) {                 // fill only the uncovered edges
        ctx.save();
        ctx.beginPath();
        if (x > 0) { ctx.rect(0, 0, x, ch); ctx.rect(x + iw, 0, cw - x - iw, ch); }
        if (y > 0) { ctx.rect(0, 0, cw, y); ctx.rect(0, y + ih, cw, ch - y - ih); }
        ctx.clip();
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        ctx.restore();
      }
      ctx.drawImage(img, x, y);
    }
    ctx.globalAlpha = 1;
  };

  // Draws the wanted frame (or the closest decoded one). Returns true while
  // the exact frame is not on the canvas yet.
  SequenceChain.prototype.render = function () {
    var ci = this.activeIndex(), clip = this.clips[ci], set = clip.set;
    var pos = clip.p * (set.count - 1), want = Math.round(pos);
    var i = set.nearestIndex(want);          // closest decoded frame
    if (i < 0) return true;                  // nothing decoded yet: keep the last frame
    var img = set.frames[i];

    // Seam blend: over the first `blend` frames, fade this clip in on top of
    // the previous clip's final frame.
    var blend = clip.spec.blend || 0, under = null, alpha = 1;
    if (ci > 0 && blend > 0 && pos < blend) {
      var prev = this.clips[ci - 1].set;
      under = prev.frames[prev.count - 1];
      alpha = under ? Math.max(pos / blend, 0) : 1;
    }

    var key = ci + ':' + i + ':' + alpha.toFixed(2);
    if (key !== this.lastKey) {
      if (under) this.drawImage(under, 1);
      this.drawImage(img, alpha);
      if (!this.lastKey) this.canvas.style.visibility = '';
      this.lastKey = key;
    }
    return i !== want;
  };

  SequenceChain.prototype.tick = function (now) {
    this.raf = 0;
    var busy = this.update(now);
    if (this.active) {
      this.prepare();
      if (this.render()) busy = true;
    }
    if (busy) this.wake();
  };

  // ---- boot ------------------------------------------------------------------
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-seq-chain]'), function (el) {
      if (!el.__seq) el.__seq = new SequenceChain(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SequenceChain = SequenceChain;
})();
