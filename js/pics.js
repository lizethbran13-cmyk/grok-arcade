/* Grok Arcade - pictures in the 3D world (booth #20): game covers, framed screenshots, posters.
   - frames follow the real picture shape (portrait games get tall frames, nothing is squashed)
   - posters keep the picture's shape too: the art sits on a soft blurred copy of itself instead of being stretched
   - sharp at an angle: mipmaps + anisotropic filtering
   - texture budget: every frame starts with the small cover; the sharp HD copy only loads when you walk up close,
     and is dropped again when you leave, so only a few big pictures are ever in memory at once. */
(function () {
  'use strict';
  var T = THREE, P = GA.Pics = {};
  P.SIZES = {"hunters":{"w":237,"h":512,"hd":true},"blocks":{"w":237,"h":512,"hd":true},"brawl":{"w":512,"h":288,"hd":true},"dash":{"w":512,"h":237,"hd":true},"detective":{"w":512,"h":237,"hd":true},"disaster":{"w":237,"h":512,"hd":false},"fc":{"w":512,"h":214,"hd":true},"grid":{"w":512,"h":237,"hd":true},"heist":{"w":237,"h":512,"hd":false},"kart":{"w":237,"h":512,"hd":true},"land":{"w":512,"h":237,"hd":true},"life":{"w":237,"h":512,"hd":true},"party":{"w":512,"h":288,"hd":true},"pets":{"w":237,"h":512,"hd":true},"pickle":{"w":237,"h":512,"hd":true},"poke":{"w":237,"h":512,"hd":true},"rides":{"w":237,"h":512,"hd":true},"sky":{"w":512,"h":237,"hd":true},"spooks":{"w":237,"h":512,"hd":true},"sports":{"w":237,"h":512,"hd":true},"surfers":{"w":512,"h":237,"hd":true},"voxels":{"w":512,"h":288,"hd":true}}; // cover sizes (w,h) + whether an HD copy exists, so frames have the right shape before the image loads
  var loader = null, cache = {}, HD = [], HD_NEAR = 6.5, HD_FAR = 10, HD_MAX = 6;
  P.stats = { hdLoaded: 0, hdLive: 0 };
  P.aniso = function () { var r = GA.Hub && GA.Hub.renderer && GA.Hub.renderer(); return r ? Math.min(8, r.capabilities.getMaxAnisotropy() || 1) : 4; };
  function prep(t) { t.anisotropy = P.aniso(); t.minFilter = T.LinearMipmapLinearFilter; t.magFilter = T.LinearFilter; t.generateMipmaps = true; return t; }
  P.prep = prep;
  P.load = function (url, cb) { // shared, filtered texture for an image url (one GPU copy per url)
    if (cache[url]) { var c = cache[url]; if (cb) { if (c.image && c.image.width) cb(c); else c.__cbs.push(cb); } return c; }
    loader = loader || new T.TextureLoader();
    var t = loader.load(url, function (tx) { prep(tx); tx.needsUpdate = true; var cbs = tx.__cbs || []; tx.__cbs = []; cbs.forEach(function (f) { f(tx); }); }, undefined, function () {});
    if (!t.__cbs) t.__cbs = []; if (cb) t.__cbs.push(cb); prep(t); cache[url] = t; return t;
  };
  P.gameId = function (url) { var m = /assets\/hall\/([^/]+)\//.exec(url || ''); return m ? m[1] : null; };
  P.aspect = function (url, fallback) { var s = P.SIZES[P.gameId(url)]; return s ? s.w / s.h : (fallback || 16 / 9); };
  // biggest w x h with the picture's real shape inside maxW x maxH
  P.fit = function (aspect, maxW, maxH) { var w = maxW, h = w / aspect; if (h > maxH) { h = maxH; w = h * aspect; } return [w, h]; };

  /* a framed picture that keeps its shape: gold trim + black mat + the picture. Built at the biggest size that fits, then
     resized if the real image turns out to have a different shape. Returns the group. */
  P.frame = function (par, url, o) {
    o = o || {}; var maxW = o.maxW || 1.2, maxH = o.maxH || 0.8, a = P.aspect(url), g = new T.Group(); g.position.set(o.x || 0, o.y || 0, o.z || 0); par.add(g);
    var trimM = o.trim || new T.MeshPhongMaterial({ color: '#d4a93a', shininess: 70, specular: '#fff2b0' }), matM = new T.MeshBasicMaterial({ color: '#0d0d12' });
    var trim = new T.Mesh(new T.BoxGeometry(1, 1, 0.08), trimM), mat = new T.Mesh(new T.BoxGeometry(1, 1, 0.02), matM); mat.position.z = 0.04; g.add(trim); g.add(mat);
    var tex = P.load(url), pm = new T.MeshBasicMaterial({ map: tex, toneMapped: false }), pic = new T.Mesh(new T.PlaneGeometry(1, 1), pm); pic.position.z = 0.052; g.add(pic);
    function size(asp) { var s = P.fit(asp, maxW, maxH), w = s[0], h = s[1], b = o.border || 0.05; pic.scale.set(w, h, 1); mat.scale.set(w + 0.04, h + 0.04, 1); trim.scale.set(w + 2 * b + 0.04, h + 2 * b + 0.04, 1); g.userData.size = [w, h]; }
    size(a);
    P.load(url, function (t) { var ra = t.image.width / t.image.height; if (Math.abs(ra / a - 1) > 0.02) size(ra); });
    var s = P.SIZES[P.gameId(url)]; if (o.hd !== false && s && s.hd) HD.push({ mesh: pic, low: url, hd: url.replace(/cover\.webp/, 'cover-hd.webp'), on: false });
    g.userData.pic = pic; return g;
  };

  /* a poster texture of any shape (w x h metres): the art keeps its shape on a soft blurred, darkened copy of itself */
  P.poster = function (url, w, h, o) {
    o = o || {}; var W = o.px || 1024, H = Math.round(W * h / w), c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'); g.fillStyle = o.bg || '#140a2b'; g.fillRect(0, 0, W, H);
    var tex = prep(new T.CanvasTexture(c));
    var img = new Image(); img.onload = function () {
      var ia = img.width / img.height, ca = W / H;
      // backdrop: the same art scaled to cover, blurred by drawing it tiny and blowing it up, then dimmed
      var sm = document.createElement('canvas'), sw = 24, sh = Math.max(4, Math.round(24 / ca)); sm.width = sw; sm.height = sh; var sg = sm.getContext('2d');
      var cw = ia > sw / sh ? sh * ia : sw, chh = ia > sw / sh ? sh : sw / ia; sg.drawImage(img, (sw - cw) / 2, (sh - chh) / 2, cw, chh);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(sm, 0, 0, W, H); g.fillStyle = 'rgba(10,4,26,.45)'; g.fillRect(0, 0, W, H);
      // the art itself, whole, centred, with a little shadow + white edge
      var pad = Math.round(H * 0.05), fw = W - pad * 2, fh = H - pad * 2, dw = fw, dh = dw / ia; if (dh > fh) { dh = fh; dw = dh * ia; }
      var dx = (W - dw) / 2, dy = (H - dh) / 2; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = pad * 0.6; g.fillStyle = '#ffffff'; g.fillRect(dx - 4, dy - 4, dw + 8, dh + 8); g.shadowBlur = 0;
      g.drawImage(img, dx, dy, dw, dh); tex.needsUpdate = true;
    };
    var s = P.SIZES[P.gameId(url)]; img.src = s && s.hd && o.hd !== false ? url.replace(/cover\.webp/, 'cover-hd.webp') : url;
    return tex;
  };

  // HD streaming: only pictures you are standing near get their sharp copy (max HD_MAX at once)
  var wp = new T.Vector3(), lastTick = 0;
  P.tick = function (px, pz, t) {
    if (t - lastTick < 0.3) return; lastTick = t; var live = 0;
    HD.forEach(function (e) {
      var vis = true, o = e.mesh; while (o) { if (!o.visible) { vis = false; break; } o = o.parent; }
      e.mesh.getWorldPosition(wp); var d = Math.hypot(wp.x - px, wp.z - pz);
      if (!e.on && vis && d < HD_NEAR && P.stats.hdLive < HD_MAX) { e.on = true; P.stats.hdLive++; P.stats.hdLoaded++; e.tex = P.load(e.hd, function (tx) { if (e.on) { e.mesh.material.map = tx; e.mesh.material.needsUpdate = true; } }); }
      else if (e.on && (d > HD_FAR || !vis)) { e.on = false; P.stats.hdLive--; e.mesh.material.map = P.load(e.low); e.mesh.material.needsUpdate = true; if (e.tex && !HD.some(function (q) { return q !== e && q.on && q.hd === e.hd; })) { e.tex.dispose(); delete cache[e.hd]; } e.tex = null; }
      if (e.on) live++;
    });
  };
  P.hdCount = function () { return HD.length; };
})();
