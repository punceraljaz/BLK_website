/* ==========================================================================
   scroll-sequence.js — scroll-scrubbed image-sequence section
   Plain JS, no dependencies. Pairs with scroll-sequence.css.

   Markup (one per animation; any number per page):

     <section class="seq" data-seq
              data-seq-path="assets/frames/room/"   folder, trailing slash
              data-seq-count="122"                  number of frames
              data-seq-pad="4"                      digits in file names (0001)
              data-seq-ext="webp"
              data-seq-captions='[{"below":0.25,"text":"Empty shell"}, ...]'>
       <div class="seq__sticky">
         <canvas class="seq__canvas"></canvas>
         <p class="seq__caption"></p>
         <div class="seq__progress"><span class="seq__progress-fill"></span></div>
       </div>
     </section>

   Captions: the first entry whose "below" is greater than the progress wins;
   the last entry should use a "below" above 1 so it covers the end.

   Autoplay mode: add data-seq-mode="autoplay" (any element holding a
   .seq__canvas, no 400vh section needed). The sequence plays once on page
   load at data-seq-fps (default 24) after data-seq-delay ms (default 400),
   then holds on the last frame. data-seq-buffer="N" starts playback once
   the first N frames are ready instead of waiting for all of them. Scroll does not drive it. With
   prefers-reduced-motion it shows the last frame straight away.
   ========================================================================== */

(function () {
  'use strict';

  var SMOOTHING = 0.14;         // share of the gap closed per animation frame
  var SNAP = 0.0005;            // snap when closer than this
  var IDLE_MS = 140;            // scroll pause before auto-complete kicks in
  var AUTO_MS_PER_SECTION = 2200;
  var AUTO_MIN_MS = 500, AUTO_MAX_MS = 1600;
  var AUTOPLAY_WAIT_MAX_MS = 4000;  // start playback even if frames are still loading

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // html has scroll-behavior:smooth (scrollcraft.css). 'instant' stops the
  // browser from smoothing each step of our own eased auto-scroll.
  function jumpTo(y) { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }

  function ScrollSequence(section) {
    this.section = section;
    this.canvas = section.querySelector('.seq__canvas');
    this.ctx = this.canvas.getContext('2d');
    this.caption = section.querySelector('.seq__caption');
    this.bar = section.querySelector('.seq__progress-fill');

    this.path = section.getAttribute('data-seq-path');
    this.count = parseInt(section.getAttribute('data-seq-count'), 10);
    this.pad = parseInt(section.getAttribute('data-seq-pad') || '4', 10);
    this.ext = section.getAttribute('data-seq-ext') || 'webp';
    this.captions = JSON.parse(section.getAttribute('data-seq-captions') || '[]');
    this.autoplay = section.getAttribute('data-seq-mode') === 'autoplay';

    this.frames = new Array(this.count);   // decoded HTMLImageElements
    this.loadedCount = 0;
    this.requested = {};
    this.loadingStarted = false;
    this.drawnIndex = -1;                  // frame currently on the canvas
    this.drawnImage = null;
    this.captionText = null;

    this.shown = 0;                        // smoothed progress
    this.target = 0;                       // real scroll progress

    // auto-complete state
    this.lastY = window.scrollY;
    this.direction = 1;
    this.idleTimer = 0;
    this.auto = null;                      // { raf } while auto-scrolling
    this.ignoreScroll = false;

    this.resize();
    this.loadFrame(0);                     // frame 1 early: never a blank stage
    this.bindResize();
    if (this.autoplay) {
      this.startAutoplay();
    } else {
      this.watchProximity();
      this.bindScroll();
    }
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  ScrollSequence.prototype.src = function (i) {
    var n = String(i + 1);
    while (n.length < this.pad) n = '0' + n;
    return this.path + n + '.' + this.ext;
  };

  ScrollSequence.prototype.loadFrame = function (i) {
    if (i < 0 || i >= this.count || this.requested[i]) return;
    this.requested[i] = true;
    var self = this, img = new Image();
    img.src = this.src(i);
    // Decode off the main path now, so the first scrub never stalls on it.
    img.decode().then(function () {
      self.frames[i] = img;
      self.loadedCount++;
      if (self.onFrameLoaded) self.onFrameLoaded();
      if (self.drawnIndex === -1 || i === self.wantedIndex()) self.draw(true);
    }, function () { /* missing/broken frame: keep showing the last good one */ });
  };

  ScrollSequence.prototype.loadAll = function () {
    if (this.loadingStarted) return;
    this.loadingStarted = true;
    for (var i = 1; i < this.count; i++) this.loadFrame(i);
  };

  // Start fetching the full sequence when the section is ~1.5 screens away.
  ScrollSequence.prototype.watchProximity = function () {
    var self = this;
    if (!('IntersectionObserver' in window)) { this.loadAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        self.loadAll();
        io.disconnect();
      }
    }, { rootMargin: '150% 0px 150% 0px' });
    io.observe(this.section);
  };

  // ---- geometry ----------------------------------------------------------
  ScrollSequence.prototype.scrollLength = function () {
    return Math.max(this.section.offsetHeight - window.innerHeight, 1);
  };
  ScrollSequence.prototype.sectionTop = function () {
    return this.section.getBoundingClientRect().top + window.scrollY;
  };
  ScrollSequence.prototype.readProgress = function () {
    return clamp01((window.scrollY - this.sectionTop()) / this.scrollLength());
  };

  ScrollSequence.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.draw(true);
  };

  // ---- drawing -----------------------------------------------------------
  ScrollSequence.prototype.wantedIndex = function () {
    return Math.round(this.shown * (this.count - 1));
  };

  ScrollSequence.prototype.draw = function (force) {
    var i = this.wantedIndex();
    var img = this.frames[i];
    if (!img) {
      // Not loaded yet: keep the last drawn frame. If nothing has been drawn
      // at all, fall back to the nearest loaded frame so the stage isn't blank.
      if (this.drawnImage && !force) return;
      img = this.nearestLoaded(i);
      if (!img) return;
    } else if (i === this.drawnIndex && !force) {
      return;
    }

    var cw = this.canvas.width, ch = this.canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(cw / iw, ch / ih);          // "cover"
    var dw = iw * scale, dh = ih * scale;
    this.ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);

    this.drawnIndex = this.frames[i] === img ? i : -2;
    this.drawnImage = img;
  };

  ScrollSequence.prototype.nearestLoaded = function (i) {
    for (var d = 1; d < this.count; d++) {
      if (this.frames[i - d]) return this.frames[i - d];
      if (this.frames[i + d]) return this.frames[i + d];
    }
    return this.frames[i] || null;
  };

  ScrollSequence.prototype.updateUI = function () {
    if (this.bar) this.bar.style.transform = 'scaleX(' + this.shown.toFixed(4) + ')';
    if (!this.caption || !this.captions.length) return;
    var text = this.captions[this.captions.length - 1].text;
    for (var c = 0; c < this.captions.length; c++) {
      if (this.shown < this.captions[c].below) { text = this.captions[c].text; break; }
    }
    if (text === this.captionText) return;
    var el = this.caption, first = this.captionText === null;
    this.captionText = text;
    if (first) { el.textContent = text; return; }
    el.classList.add('is-changing');
    clearTimeout(this.captionTimer);
    this.captionTimer = setTimeout(function () {
      el.textContent = text;
      el.classList.remove('is-changing');
    }, 200);
  };

  // ---- autoplay ----------------------------------------------------------
  // Plays once: wait for the frames (capped), hold frame 1 for the delay,
  // then advance on real elapsed time at the clip's own frame rate.
  ScrollSequence.prototype.startAutoplay = function () {
    var self = this;
    var fps = parseFloat(this.section.getAttribute('data-seq-fps') || '24');
    var delay = parseInt(this.section.getAttribute('data-seq-delay') || '400', 10);
    this.playDuration = (this.count - 1) / fps * 1000;
    this.playElapsed = 0;
    this.playing = false;

    if (reducedMotion.matches) {           // no motion: straight to the end state
      this.shown = 1;
      this.loadFrame(this.count - 1);
      return;
    }

    this.loadAll();
    var started = false;
    function go() {
      if (started) return;
      started = true;
      self.onFrameLoaded = null;
      setTimeout(function () { self.playing = true; self.lastNow = 0; }, delay);
    }
    // Start once the opening stretch is decoded (data-seq-buffer frames,
    // default: all); the rest keeps loading while those play.
    var buffer = Math.min(this.count,
      parseInt(this.section.getAttribute('data-seq-buffer') || String(this.count), 10));
    this.onFrameLoaded = function () {
      var k = 0;
      while (k < buffer && self.frames[k]) k++;
      if (k >= buffer) go();
    };
    setTimeout(go, AUTOPLAY_WAIT_MAX_MS);
  };

  ScrollSequence.prototype.stepAutoplay = function (now) {
    if (!this.playing) return;
    // Cap each step so a backgrounded tab resumes where it left off
    // instead of jumping to the end.
    var dt = this.lastNow ? Math.min(now - this.lastNow, 100) : 0;
    this.lastNow = now;
    this.playElapsed += dt;
    this.shown = clamp01(this.playElapsed / this.playDuration);
    if (this.shown >= 1) this.playing = false;
  };

  // ---- main loop ---------------------------------------------------------
  ScrollSequence.prototype.tick = function (now) {
    if (this.autoplay) {
      this.stepAutoplay(now);
    } else {
      this.target = this.readProgress();
      var gap = this.target - this.shown;
      this.shown = Math.abs(gap) < SNAP ? this.target : this.shown + gap * SMOOTHING;
    }
    this.draw(false);
    this.updateUI();
    requestAnimationFrame(this.tick);
  };

  // ---- input + auto-complete ---------------------------------------------
  ScrollSequence.prototype.bindResize = function () {
    var self = this, resizeRaf = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(function () { self.resize(); });
    });
  };

  ScrollSequence.prototype.bindScroll = function () {
    var self = this;

    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (self.ignoreScroll) { self.lastY = y; return; }   // our own auto-scroll
      if (y !== self.lastY) self.direction = y > self.lastY ? 1 : -1;
      self.lastY = y;
      clearTimeout(self.idleTimer);
      self.idleTimer = setTimeout(function () { self.maybeAutoComplete(); }, IDLE_MS);
    }, { passive: true });

    var cancel = function () { self.cancelAuto(); };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (type) {
      window.addEventListener(type, cancel, { passive: true });
    });
  };

  ScrollSequence.prototype.maybeAutoComplete = function () {
    if (reducedMotion.matches || this.auto) return;
    var p = this.readProgress();
    if (p <= 0.001 || p >= 0.999) return;              // parked at an end, or outside
    var top = this.sectionTop(), len = this.scrollLength();
    var dest = this.direction > 0 ? top + len : top;
    this.autoScrollTo(dest, len);
  };

  ScrollSequence.prototype.autoScrollTo = function (dest, len) {
    var self = this;
    var from = window.scrollY, dist = dest - from;
    var ms = Math.min(AUTO_MAX_MS, Math.max(AUTO_MIN_MS, Math.abs(dist) / len * AUTO_MS_PER_SECTION));
    var start = performance.now();
    this.ignoreScroll = true;
    this.auto = { raf: 0 };

    function step(now) {
      if (!self.auto) return;
      var t = Math.min(1, (now - start) / ms);
      jumpTo(from + dist * easeInOutCubic(t));
      if (t < 1) { self.auto.raf = requestAnimationFrame(step); return; }
      self.auto = null;
      // The scroll event for the final step fires next frame; keep ignoring
      // until it has passed.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (!self.auto) self.ignoreScroll = false; });
      });
    }
    this.auto.raf = requestAnimationFrame(step);
  };

  ScrollSequence.prototype.cancelAuto = function () {
    clearTimeout(this.idleTimer);
    if (!this.auto) return;
    cancelAnimationFrame(this.auto.raf);
    this.auto = null;
    this.ignoreScroll = false;
    this.lastY = window.scrollY;
  };

  /* ========================================================================
     SequenceChain — one canvas, several clips of the same room played back
     to back. The first clip can play on page load; each later clip is
     scrubbed by the scroll distance between two page elements.

       <div data-seq-chain='[
         {"path":"assets/frames/room/",  "count":122, "play":"load",
          "fps":24, "delay":150, "buffer":40},
         {"path":"assets/frames/room2/", "count":121, "play":"scroll",
          "from":"#pkg-1", "to":"#pkg-2", "blend":8}
       ]'>
         <canvas class="seq__canvas"></canvas>
       </div>

     "scroll" clips: progress 0 when the top of `from` is at the top of the
     viewport, 1 when the top of `to` is. "blend" cross-fades the first N
     frames over the previous clip's last frame to hide any seam.
     Optional per clip: "pad" (default 4), "ext" (default "webp"), "video"
     (true: prefer the .h264 frames next to the images, see below).
     "play":"manual" clips rest on their last frame until playClip(i).

     On the element: data-seq-lazy (download nothing until .__seq.start()),
     data-seq-focus (horizontal crop anchor 0..1), data-seq-assist="off".
     From page code: .__seq.setActive(false) stops a hidden chain drawing;
     .__seq.playClip(i) plays clip i once over its natural length.

     Scroll assist (on by default; data-seq-assist="off" disables it): the
     first wheel tick or swipe between two packages glides straight to the
     next one (or back to the previous one when scrolling up). See the
     "scroll assist" section below. Disabled under prefers-reduced-motion.
     ======================================================================== */

  /* Frames are downloaded as compressed blobs (all of them, ~100 KB each) but
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
    lead: 12                 // head start for the glide that can come next
  };
  // Video frames decode in ~10 ms, and a hardware decoder has only a small
  // pool of output buffers, so only a few are held.
  var WINDOW_VIDEO = { ahead: 8, behind: 1, idle: 2, lead: 6 };
  var DECODE_PARALLEL = 6;   // decodes in flight at once (all clips together)
  var decodesInFlight = 0;

  /* Hardware video decoding. Even decoded off the main thread, WebP frames
     kept a laptop CPU (i5 + Iris Xe) too busy to keep up with a glide. With
     "video": true a clip's frames are also stored as single-frame H.264
     key frames (0001.h264 ...) that the GPU decodes through WebCodecs
     (~10 ms, CPU nearly idle). Browsers without a hardware H.264 decoder
     (or without WebCodecs) use the image files instead. */
  var H264_CODEC = 'avc1.640028';          // High profile, level 4.0
  var hardwareH264 = (function () {
    if (!window.VideoDecoder || !window.EncodedVideoChunk) return Promise.resolve(false);
    return VideoDecoder.isConfigSupported({ codec: H264_CODEC, hardwareAcceleration: 'prefer-hardware' })
      .then(function (r) { return !!r.supported; }, function () { return false; });
  })();

  function FrameSet(spec) {
    this.path = spec.path;
    this.count = spec.count;
    this.pad = spec.pad || 4;
    this.ext = spec.ext || 'webp';
    this.useVideo = !!spec.video;          // decided once hardwareH264 resolves
    this.blobs = new Array(this.count);    // downloaded, compressed
    this.frames = new Array(this.count);   // decoded ImageBitmaps (windowed)
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
  // Opened straight from disk (file://) the browser blocks fetch(), so there
  // frames load as plain <img> elements (createImageBitmap accepts those).
  var FROM_DISK = location.protocol === 'file:';
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
    }, function () {
      if (video) self.fallBackToImages();    // e.g. no .h264 files on the server
      else delete self.requested[i];
    });
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
      }, function () {}).then(function () { vf.close(); });
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
  };
  FrameSet.prototype.loadAll = function () {
    for (var i = 0; i < this.count; i++) this.load(i);
  };
  FrameSet.prototype.readyThrough = function (n) {   // first n frames downloaded?
    for (var k = 0; k < n; k++) if (!this.blobs[k]) return false;
    return true;
  };
  FrameSet.prototype.inWindow = function (i) {
    return (i >= this.lo && i <= this.hi) || i === this.count - 1;   // last frame: blend base
  };
  // Keep frames lo..hi decoded; `order` lists the indices to decode first.
  var VIDEO_SILENT_MS = 2000;   // no decoded frame this long: use the images
  FrameSet.prototype.keep = function (lo, hi, order) {
    if (this.useVideo && !this.gotVideoFrame && this.firstDecodeAt &&
        performance.now() - this.firstDecodeAt > VIDEO_SILENT_MS) {
      for (var j in this.decoding) this.decodeDone(+j);
      this.fallBackToImages();
    }
    this.lo = lo; this.hi = hi;
    for (var k = 0; k < this.count; k++) {
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
      if (!this.firstDecodeAt) this.firstDecodeAt = performance.now();
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
  var NEAREST_MAX = 6;
  FrameSet.prototype.nearestIndex = function (i) {
    if (this.frames[i]) return i;
    for (var d = 1; d <= NEAREST_MAX; d++) {
      if (this.frames[i - d]) return i - d;
      if (this.frames[i + d]) return i + d;
    }
    return -1;
  };

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
    // Where a cropped frame is anchored horizontally, 0 (left) .. 1 (right);
    // data-seq-focus, default centred.
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
    this.resize();

    // data-seq-lazy: nothing is downloaded until start() is called (a second
    // view the visitor may never open).
    if (el.getAttribute('data-seq-lazy') == null) this.start();

    var raf = 0;
    function queueResize() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { self.resize(); });
    }
    window.addEventListener('resize', queueResize);
    // The page can also resize the canvas itself (e.g. a wider room for one
    // package); keep the drawing buffer matched to its displayed size.
    // Resized directly in the observer callback (after layout, before paint)
    // so the redraw lands in the same frame as the new size.
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(this.canvas);
    var assist = el.getAttribute('data-seq-assist');
    if (assist === 'smooth') this.bindSmoothWheel();
    else if (assist !== 'off') this.bindAssist();
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  // Begin downloading. Loading order: the load-played clip first (it is on
  // screen now), then the scroll clips once it is ready or after the wait cap.
  SequenceChain.prototype.start = function () {
    if (this.started) return;
    this.started = true;
    var self = this, first = this.clips[0];
    first.set.onLoad = function () { self.lastKey = ''; };
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
    if (on) this.lastKey = '';
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
  };

  // ---- scroll assist -----------------------------------------------------
  // Gesture-driven: the first wheel tick or finger movement inside the
  // assisted zone (first clip start .. last clip end) glides straight to the
  // next / previous package. Waiting for scrolling to stop was too slow:
  // trackpads and phones keep emitting momentum scroll for 1-2 s after the
  // fingers lift. So:
  //   wheel  - intercepted inside the zone; momentum is swallowed during the
  //            glide and until a new gesture starts.
  //   touch  - inside the zone the finger drags the page 1:1 (the animation
  //            follows), and release glides one package in the drag direction.
  //   other  - keyboard / scrollbar: idle fallback glides to the nearer end.
  var ASSIST_MS_PER_SECTION = 3000;   // a full package-to-package glide
  var ASSIST_MIN_MS = 800, ASSIST_MAX_MS = 3000;
  var WHEEL_GESTURE_GAP_MS = 220;     // wheel silence that ends a gesture
  var TOUCH_MIN_SWIPE = 24;           // px; shorter drags spring back

  // Glide curve: moves the moment it starts (so the gesture feels answered),
  // then plays the transformation at an even pace and lands softly.
  // 35% ease-out-quad (start speed 0.7x average) + 65% ease-in-out-sine.
  function easeGlide(t) {
    var outQuad = 1 - (1 - t) * (1 - t);
    var inOutSine = -(Math.cos(Math.PI * t) - 1) / 2;
    return 0.35 * outQuad + 0.65 * inOutSine;
  }

  // Package tops the assist can land on, in page order.
  SequenceChain.prototype.anchors = function () {
    var list = [];
    this.clips.forEach(function (clip) {
      if (clip.play !== 'scroll' || !clip.fromEl || !clip.toEl) return;
      list.push(docTop(clip.fromEl), docTop(clip.toEl));
    });
    list.sort(function (a, b) { return a - b; });
    return list.filter(function (v, i) { return i === 0 || v - list[i - 1] > 1; });
  };

  // Where a gesture in direction `dir` starting at `y` should land, or null
  // when it is outside the zone and native scrolling should take over.
  SequenceChain.prototype.landingFor = function (y, dir) {
    var a = this.anchors(), EPS = 2;
    if (!a.length) return null;
    var first = a[0], last = a[a.length - 1];
    if (dir > 0) {
      if (y >= last - EPS) return null;                     // leaving the zone downward
      for (var i = 0; i < a.length; i++) if (a[i] > y + EPS) return a[i];
    } else {
      if (y <= first + EPS || y > last + EPS) return null;  // above it, or below it
      for (var j = a.length - 1; j >= 0; j--) if (a[j] < y - EPS) return a[j];
    }
    return null;
  };

  SequenceChain.prototype.bindAssist = function () {
    var self = this;
    this.auto = null;          // running glide
    this.wheelLock = false;    // swallowing momentum after a wheel glide
    this.touch = null;         // active touch gesture
    this.ignoreScroll = false;
    this.lastY = window.scrollY;
    this.direction = 1;
    this.idleTimer = 0;
    var active = function () { return !reducedMotion.matches; };

    // ---- wheel (mouse, trackpad) ----
    var lastWheelT = 0, lastMag = 0;
    window.addEventListener('wheel', function (e) {
      if (!active() || e.ctrlKey) return;                  // ctrl+wheel = zoom
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      var now = performance.now();
      var mag = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 800 : 1);
      // A new gesture: a pause, or momentum that suddenly grows again.
      var fresh = now - lastWheelT > WHEEL_GESTURE_GAP_MS || (lastMag < 30 && mag > lastMag * 1.6 + 4);
      lastWheelT = now; lastMag = mag;

      if (self.auto && self.auto.kind === 'wheel') { e.preventDefault(); return; }
      if (self.wheelLock) {
        if (!fresh) { e.preventDefault(); return; }
        self.wheelLock = false;
      }
      var dir = e.deltaY > 0 ? 1 : -1;
      var dest = self.landingFor(window.scrollY, dir);
      if (dest == null) { self.cancelAssist(); return; }  // native scroll
      e.preventDefault();
      self.glideTo(dest, 'wheel');
    }, { passive: false });

    // ---- touch ----
    window.addEventListener('touchstart', function (e) {
      if (!active() || e.touches.length !== 1) { self.touch = { mode: 'native' }; return; }
      self.cancelAssist();
      var y0 = e.touches[0].clientY;
      self.touch = { mode: null, startY: y0, lastY: y0, startScroll: window.scrollY };
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      var t = self.touch;
      if (!t || t.mode === 'native' || e.touches.length !== 1) return;
      var y = e.touches[0].clientY;
      if (t.mode === null) {
        // Decide on the first move: iOS commits to native scrolling if the
        // first touchmove is not prevented.
        var dir = t.startY - y >= 0 ? 1 : -1;
        t.mode = self.landingFor(t.startScroll, dir) == null ? 'native' : 'drag';
        if (t.mode === 'native') return;
      }
      e.preventDefault();
      var a = self.anchors();
      var next = window.scrollY + (t.lastY - y);
      next = Math.max(a[0], Math.min(a[a.length - 1], next));
      self.ignoreScroll = true;
      jumpTo(next);
      t.lastY = y;
    }, { passive: false });

    var endTouch = function () {
      var t = self.touch;
      self.touch = null;
      if (!t || t.mode !== 'drag') return;
      self.ignoreScroll = false;
      var moved = t.startY - t.lastY;
      var dest = Math.abs(moved) < TOUCH_MIN_SWIPE
        ? t.startScroll                                   // too small: spring back
        : self.landingFor(t.startScroll, moved > 0 ? 1 : -1);
      if (dest == null) dest = t.startScroll;
      self.glideTo(dest, 'touch');
    };
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });

    // ---- keyboard / scrollbar fallback ----
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (self.ignoreScroll || self.touch) { self.lastY = y; return; }
      if (y !== self.lastY) self.direction = y > self.lastY ? 1 : -1;
      self.lastY = y;
      clearTimeout(self.idleTimer);
      self.idleTimer = setTimeout(function () { self.idleAssist(); }, IDLE_MS);
    }, { passive: true });
    ['keydown', 'mousedown'].forEach(function (type) {
      window.addEventListener(type, function () { self.cancelAssist(); }, { passive: true });
    });
  };

  // Scrolling stopped part-way between two packages without a wheel/touch
  // gesture (keyboard, scrollbar drag): finish in the last direction.
  SequenceChain.prototype.idleAssist = function () {
    if (reducedMotion.matches || this.auto || this.touch) return;
    var y = window.scrollY, a = this.anchors();
    if (!a.length || y <= a[0] + 2 || y >= a[a.length - 1] - 2) return;
    for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - y) <= 2) return;   // already on one
    var dest = this.landingFor(y, this.direction);
    if (dest != null) this.glideTo(dest, 'idle');
  };

  SequenceChain.prototype.glideTo = function (dest, kind) {
    var self = this;
    var from = window.scrollY, dist = dest - from;
    var a = this.anchors();
    var section = a.length > 1 ? (a[a.length - 1] - a[0]) / (a.length - 1) : window.innerHeight;
    var ms = kind === 'finish'
      ? Math.min(FINISH_MAX_MS, Math.max(FINISH_MIN_MS, Math.abs(dist) / section * FINISH_MS_PER_SECTION))
      : Math.min(ASSIST_MAX_MS, Math.max(ASSIST_MIN_MS, Math.abs(dist) / section * ASSIST_MS_PER_SECTION));
    if (this.auto) cancelAnimationFrame(this.auto.raf);
    var start = performance.now();
    this.ignoreScroll = true;
    this.auto = { raf: 0, kind: kind };

    function step(now) {
      if (!self.auto) return;
      var t = Math.min(1, (now - start) / ms);
      jumpTo(from + dist * easeGlide(t));
      if (t < 1) { self.auto.raf = requestAnimationFrame(step); return; }
      self.auto = null;
      if (kind === 'wheel') self.wheelLock = true;   // swallow leftover momentum
      // The final step's scroll event arrives next frame; keep ignoring it.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (!self.auto && !self.touch) self.ignoreScroll = false; });
      });
    }
    this.auto.raf = requestAnimationFrame(step);
  };

  // ---- smooth wheel (data-seq-assist="smooth") -------------------------------
  // The middle ground between the package glide and raw browser scrolling: a
  // wheel notch moves the page by its normal distance, but spread over a few
  // frames (eased toward a target) instead of jumping 100 px in one frame and
  // standing still until the next notch, which made the room stutter.
  // Whole page; touch, keyboard and the scrollbar stay native.
  var SMOOTH_WHEEL_TAU = 110;         // ms: time constant of the ease toward the target

  SequenceChain.prototype.bindSmoothWheel = function () {
    var self = this, target = null, raf = 0, last = 0;
    this.smoothWheel = false;
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
      window.addEventListener(type, function () { stop(); self.cancelAssist(); }, { passive: true });
    });
    this.bindAutoFinish();
  };

  // ---- auto finish (with "smooth") -------------------------------------------
  // Client 2026-10-03: "make auto finish scroll". When scrolling stops part-way
  // between two packages (any input: wheel, touch, keys, scrollbar), the page
  // glides to the end of that transition in the direction of travel. A tiny
  // nudge (under FINISH_MIN of the way) returns to where it came from instead,
  // so a small scroll never carries the page a whole package. New input
  // cancels the glide at once.
  var FINISH_IDLE_MS = 160;           // scroll pause before finishing
  var FINISH_MIN = 0.1;               // share of a transition that counts as "going"
  var FINISH_MS_PER_SECTION = 1500, FINISH_MIN_MS = 450, FINISH_MAX_MS = 1400;

  SequenceChain.prototype.bindAutoFinish = function () {
    var self = this, timer = 0, lastY = window.scrollY, dir = 1, touching = false;
    this.auto = null;
    this.ignoreScroll = false;
    function finish() {
      if (self.auto || touching || self.smoothWheel || reducedMotion.matches) return;
      var a = self.anchors(), y = window.scrollY;
      if (a.length < 2 || y <= a[0] + 2 || y >= a[a.length - 1] - 2) return;
      for (var i = 0; i < a.length - 1; i++) {
        if (y > a[i] + 2 && y < a[i + 1] - 2) {
          var p = (y - a[i]) / (a[i + 1] - a[i]);
          var dest = dir > 0 ? (p > FINISH_MIN ? a[i + 1] : a[i]) : (p < 1 - FINISH_MIN ? a[i] : a[i + 1]);
          self.glideTo(dest, 'finish');
          return;
        }
      }
    }
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      if (self.auto || self.ignoreScroll) return;
      clearTimeout(timer);
      timer = setTimeout(finish, FINISH_IDLE_MS);
    }, { passive: true });
    window.addEventListener('wheel', function () { if (self.auto) self.cancelAssist(); }, { passive: true, capture: true });
    window.addEventListener('touchstart', function () { touching = true; self.cancelAssist(); }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (t) {
      window.addEventListener(t, function () {
        touching = false;
        clearTimeout(timer); timer = setTimeout(finish, FINISH_IDLE_MS);
      }, { passive: true });
    });
  };

  SequenceChain.prototype.cancelAssist = function () {
    clearTimeout(this.idleTimer);
    this.wheelLock = false;
    if (!this.auto) return;
    cancelAnimationFrame(this.auto.raf);
    this.auto = null;
    this.ignoreScroll = false;
    this.lastY = window.scrollY;
  };

  SequenceChain.prototype.startLoadClip = function (clip, then) {
    var spec = clip.spec, set = clip.set;
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
    function play() { setTimeout(function () { clip.playing = true; clip.lastNow = 0; }, delay); }
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
  };

  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

  SequenceChain.prototype.update = function (now) {
    // Glides and finger drags are already smooth; smoothing them again only
    // makes the room lag behind the page. Wheel input keeps the smoothing.
    var follow = this.auto || this.smoothWheel || (this.touch && this.touch.mode === 'drag') ? 0.5 : SMOOTHING;
    for (var c = 0; c < this.clips.length; c++) {
      var clip = this.clips[c];
      if (clip.forced) {                       // playClip(): time, not scroll
        var f = clip.forced;
        if (f.t0 === null && clip.set.loaded >= clip.set.count) f.t0 = now;
        clip.p = f.t0 === null ? 0 : f.dur ? clamp01((now - f.t0) / f.dur) : 1;
        if (clip.p >= 1) clip.forced = null;
        if (clip.fromEl && clip.toEl) {
          var fa = docTop(clip.fromEl), fb = docTop(clip.toEl);
          clip.target = clamp01((window.scrollY - fa) / Math.max(fb - fa, 1));
        }
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
      } else if (clip.fromEl && clip.toEl) {
        var a = docTop(clip.fromEl), b = docTop(clip.toEl);
        clip.target = clamp01((window.scrollY - a) / Math.max(b - a, 1));
        var gap = clip.target - clip.p;
        clip.p = Math.abs(gap) < SNAP ? clip.target : clip.p + gap * follow;
      }
    }
    // A playClip() playback only holds while the page rests on its package;
    // once the visitor scrolls on, the scroll takes over again.
    for (var i = 0; i < this.clips.length; i++) {
      if (!this.clips[i].forced) continue;
      var here = this.clips[i].play !== 'scroll' || this.clips[i].target > 0.999;
      for (var j = 0; j < this.clips.length; j++) {
        if (j !== i && this.clips[j].play === 'scroll' && j > i && this.clips[j].target > 0.001) here = false;
      }
      if (!here) this.clips[i].forced = null;
    }
  };

  // Decide which frames of each clip stay decoded: a long run ahead of the
  // playhead in the direction it is heading, a few behind, and a few either
  // side of clips that are standing still (ready for the next glide).
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
        // At rest next to this clip: the next glide plays it forward from its
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

  // Which clip is on screen: the latest scroll clip that has started;
  // otherwise the first clip.
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
  SequenceChain.prototype.drawImage = function (img, alpha) {   // ImageBitmap
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

  SequenceChain.prototype.render = function () {
    var ci = this.activeIndex(), clip = this.clips[ci], set = clip.set;
    var pos = clip.p * (set.count - 1);
    var i = set.nearestIndex(Math.round(pos));   // closest decoded frame
    if (i < 0) return;                      // nothing decoded yet: keep the last frame
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
    if (key === this.lastKey) return;
    if (under) this.drawImage(under, 1);
    this.drawImage(img, alpha);
    if (!this.lastKey) this.canvas.style.visibility = '';
    this.lastKey = key;
  };

  SequenceChain.prototype.tick = function (now) {
    this.update(now);
    if (this.active) {
      this.prepare();
      this.render();
    }
    requestAnimationFrame(this.tick);
  };

  // ---- boot --------------------------------------------------------------
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-seq]'), function (el) {
      if (!el.__seq) el.__seq = new ScrollSequence(el);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-seq-chain]'), function (el) {
      if (!el.__seq) el.__seq = new SequenceChain(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.ScrollSequence = ScrollSequence;
  window.SequenceChain = SequenceChain;
})();
