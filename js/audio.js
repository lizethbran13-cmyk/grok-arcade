/* Grok Arcade - tiny WebAudio synth for light arcade sounds */
(function () {
  'use strict';
  var ctx = null, master = null;
  var muted = !!GA.store.get('muted', false);
  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function tone(f, dur, type, vol, slideTo, delay) {
    if (!ctx || muted) return;
    var t0 = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, delay) {
    if (!ctx || muted) return;
    var t0 = ctx.currentTime + (delay || 0);
    var len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = 1800;
    s.buffer = buf; g.gain.value = vol || 0.15;
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t0);
  }
  var SFX = {
    start: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.16, 'square', 0.12, 0, i * 0.08); }); },
    near: function () { tone(880, 0.09, 'sine', 0.15); tone(1320, 0.12, 'sine', 0.12, 0, 0.06); },
    click: function () { tone(660, 0.06, 'square', 0.08); },
    menu: function () { tone(440, 0.07, 'triangle', 0.15); tone(660, 0.09, 'triangle', 0.15, 0, 0.05); },
    launch: function () { tone(330, 0.35, 'sawtooth', 0.12, 1320); tone(660, 0.3, 'square', 0.06, 1760, 0.05); },
    open: function () { tone(392, 0.1, 'square', 0.1); tone(587, 0.12, 'square', 0.1, 0, 0.08); },
    eat: function () { tone(700, 0.08, 'square', 0.12, 1100); },
    bonus: function () { [880, 1175, 1568].forEach(function (f, i) { tone(f, 0.1, 'square', 0.1, 0, i * 0.05); }); },
    brick: function () { tone(520 + Math.random() * 200, 0.07, 'square', 0.1); },
    paddle: function () { tone(260, 0.07, 'triangle', 0.18); },
    wall: function () { tone(200, 0.04, 'triangle', 0.1); },
    lifelost: function () { tone(400, 0.3, 'sawtooth', 0.12, 120); },
    level: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.12, 'square', 0.1, 0, i * 0.07); }); },
    flap: function () { tone(300, 0.1, 'triangle', 0.14, 520); },
    point: function () { tone(988, 0.07, 'square', 0.09); tone(1318, 0.1, 'square', 0.09, 0, 0.06); },
    crash: function () { noise(0.35, 0.25); tone(180, 0.35, 'sawtooth', 0.12, 60); },
    boop: function () { tone(900, 0.06, 'sine', 0.2, 1400); tone(1600, 0.08, 'sine', 0.1, 0, 0.05); },
    squeak: function () { tone(1700, 0.07, 'sine', 0.12, 2200); tone(1900, 0.06, 'sine', 0.1, 1500, 0.08); },
    miss: function () { tone(330, 0.16, 'triangle', 0.15, 200); },
    drop: function () { tone(220, 0.08, 'square', 0.12, 160); },
    perfect: function () { tone(784, 0.08, 'square', 0.1); tone(1175, 0.14, 'square', 0.1, 0, 0.06); },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.18, 'square', 0.1, 0, i * 0.12); }); },
    zap: function () { noise(0.55, 0.35); tone(110, 0.5, 'sawtooth', 0.2, 55); tone(1900, 0.18, 'square', 0.08, 260); },
    buzz: function () { tone(92, 0.65, 'sawtooth', 0.18); tone(95, 0.65, 'square', 0.09); },
    powerdown: function () { tone(440, 1.3, 'sawtooth', 0.12, 38); noise(0.3, 0.12, 0.2); },
    powerup: function () { tone(60, 1.0, 'sawtooth', 0.09, 480); [523, 784, 1046].forEach(function (f, i) { tone(f, 0.14, 'square', 0.09, 0, 0.9 + i * 0.08); }); },
    fixed: function () { [659, 880, 1175, 1568].forEach(function (f, i) { tone(f, 0.12, 'square', 0.1, 0, i * 0.07); }); },
    wire: function () { tone(1200, 0.05, 'square', 0.08); tone(1800, 0.06, 'square', 0.06, 0, 0.04); },
    spark: function () { noise(0.07, 0.05); },
    talk: function () { for (var i = 0; i < 4; i++) tone(260 + Math.random() * 160, 0.05, 'square', 0.05, 0, i * 0.07); },
    win: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.12, 'triangle', 0.12, 0, i * 0.06); }); },
    bad: function () { tone(180, 0.16, 'square', 0.12, 120); },
    ding: function () { tone(1318, 0.5, 'sine', 0.16); tone(1046, 0.7, 'sine', 0.12, 0, 0.18); },
    firework: function () { noise(0.6, 0.22); tone(90, 0.4, 'sine', 0.2, 40); for (var i = 0; i < 6; i++) noise(0.05, 0.06, 0.25 + i * 0.07); },
    tick: function () { tone(2400, 0.025, 'square', 0.06); },
    burp: function () { tone(110, 0.45, 'sawtooth', 0.16, 70); tone(90, 0.4, 'square', 0.08, 60, 0.05); },
    unlock: function () { tone(1600, 0.05, 'square', 0.1); tone(900, 0.08, 'square', 0.1, 0, 0.07); [659, 988, 1318].forEach(function (f, i) { tone(f, 0.14, 'triangle', 0.1, 0, 0.18 + i * 0.07); }); },
    best: function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.14, 'square', 0.1, 0, i * 0.09); }); }
  };
  GA.Audio = {
    unlock: function () { var c = ensure(); if (c && c.state === 'suspended') c.resume(); },
    log: [],
    play: function (name) { GA.Audio.log.push(name); if (GA.Audio.log.length > 60) GA.Audio.log.shift(); if (!ctx || muted) return; var f = SFX[name]; if (f) { try { f(); } catch (e) {} } },
    isMuted: function () { return muted; },
    raw: function () { ensure(); return { ctx: ctx, master: master }; }, // for the rooftop DJ booth / basement jukebox music

    setMuted: function (m) {
      muted = !!m; GA.store.set('muted', muted);
      if (master) master.gain.value = muted ? 0 : 0.5;
      document.body.classList.toggle('muted', muted);
    },
    toggle: function () { this.setMuted(!muted); if (!muted) { this.unlock(); this.play('click'); } return muted; }
  };
  document.addEventListener('DOMContentLoaded', function () { document.body.classList.toggle('muted', muted); });
  if (document.body) document.body.classList.toggle('muted', muted);
})();
