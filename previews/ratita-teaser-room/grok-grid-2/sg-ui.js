'use strict';
/* Grok Grid 2 + Super Grid Expansion UI & Gameplay Systems:
 * - 8 vehicles (F1, IndyCar Aero, Stock Thunder #42, Neon Drift GT, Ratita Rocket, Thunder GT, Sandstorm Buggy, Comet Hover)
 * - 4 Motorsport Series modes (ALL SERIES, F1 GP, INDYCAR, NASCAR, DRIFT CUP)
 * - Custom Garage Tuning (Gearbox Ratio, Aero Downforce, Drift/Rally Suspension + Presets)
 * - Drift Boost Chains (x1 / x2 / x3 multiplier + turbo release + Grid Bucks) & Slipstream Drafting
 * - Real crash consequences (repair bills, engine/wing damage, Pit Lane drive-through repair & Candy's Emergency Pit Tow so the player is never stuck) */
(function () {
  const EXT = window.GRID_EXT;
  const LS_SET = 'grokgrid2_settings';
  const LS_BANK = 'grokGrid2.bank.v1';
  const ui = (EXT.ui = {});
  let api = null, tAcc = 0, lodT = 0;
  const $ = (id) => document.getElementById(id);
  const online = () => !!(window.GridNet && window.GridNet.active);
  function save() { try { localStorage.setItem(LS_SET, JSON.stringify(api.settings)); } catch (e) {} }

  // Grid Bucks bank for repairs, drift bonuses & race winnings
  let bank = (function () {
    try {
      const v = parseInt(localStorage.getItem(LS_BANK), 10);
      if (Number.isFinite(v) && v >= 0) return v;
    } catch (e) {}
    return 2500;
  })();
  function addBank(delta) {
    bank = Math.max(0, Math.round(bank + delta));
    try { localStorage.setItem(LS_BANK, String(bank)); } catch (e) {}
    updateBadges();
  }
  ui.getBank = () => bank;

  const GOLD = 0xffc83a;
  function carColor(id) { return api.settings.gold && EXT.hub.goldUnlocked() ? GOLD : EXT.vehById(id).color; }

  const SERIES_INFO = {
    all: { name: 'ALL SERIES', cars: ['f1', 'indy', 'nascar', 'drift', 'rocket', 'gt', 'buggy', 'hover'], blurb: 'Mixed-class motorsport grid with all 8 vehicles.' },
    f1: { name: 'F1 GP', cars: ['f1', 'rocket', 'hover'], blurb: 'Formula open-wheelers with high cornering downforce & DRS straights.' },
    indy: { name: 'INDYCAR', cars: ['indy', 'f1', 'buggy'], blurb: 'Aeroscreen IndyCars with Push-to-Pass oval & road course speed.' },
    nascar: { name: 'NASCAR', cars: ['nascar', 'gt', 'rocket'], blurb: 'Heavy V8 stock cars with 2x pack slipstream drafting on banks.' },
    drift: { name: 'DRIFT CUP', cars: ['drift', 'gt', 'rocket'], blurb: 'Widebody street tuners with 1.5x faster Drift Boost Chains.' },
  };

  ui.pickCar = function (id) {
    const v = EXT.vehById(id);
    api.settings.car = v.id;
    save();
    api.setVehicle(api.player, v.id, carColor(v.id));
    renderCar();
    if (EXT.hub.active) ui.hubHud(true);
    return true;
  };

  function renderCar() {
    const id = api.settings.car || 'f1';
    const show = ui._view || id;
    const v = EXT.vehById(show);
    const st = EXT.stats(show);
    $('sg-car-name').innerHTML = v.name + (show === id ? '' : ' <small>(tap to drive)</small>');
    const bSpd = Math.max(1, Math.min(5, Math.round(v.bars[0] + (st.top - v.stats.top) * 18)));
    const bAcc = Math.max(1, Math.min(5, Math.round(v.bars[1] + (st.acc - v.stats.acc) * 18)));
    const bGrp = Math.max(1, Math.min(5, Math.round(v.bars[2] + (st.grip - v.stats.grip) * 18)));
    const bOff = Math.max(1, Math.min(5, Math.round(v.bars[3] + (st.off - v.stats.off) * 4)));
    const bar = (lab, n) => '<span class="sgb"><i>' + lab + '</i>' + '<b class="on"></b>'.repeat(n) + '<b></b>'.repeat(5 - n) + '</span>';
    $('sg-car-info').innerHTML =
      '<div class="sgblurb"><span class="sgnew">' + (v.series ? v.series.toUpperCase() : 'GRID 2') + '</span> ' + v.blurb + '</div>' +
      bar('SPEED', bSpd) + bar('ACCEL', bAcc) + bar('GRIP', bGrp) + bar('OFF-ROAD', bOff);
    const gb = $('sg-gold');
    if (gb) { gb.style.display = EXT.hub.goldUnlocked() ? '' : 'none'; gb.classList.toggle('on', !!api.settings.gold); }
  }

  function cycle(d) {
    const list = EXT.VEHICLES;
    const cur = list.findIndex((v) => v.id === (ui._view || api.settings.car || 'f1'));
    const nv = list[(cur + d + list.length) % list.length];
    ui._view = null;
    ui.pickCar(nv.id);
  }

  ui.cycleSeries = function () {
    const keys = Object.keys(SERIES_INFO);
    const cur = keys.indexOf(EXT.tuning.series || 'all');
    const next = keys[(cur + 1) % keys.length];
    setSeries(next);
    ui.flash(SERIES_INFO[next].name + '!');
  };

  function setSeries(sKey) {
    if (!SERIES_INFO[sKey]) sKey = 'all';
    EXT.tuning.series = sKey;
    EXT.saveTuning();
    const seg = $('seg-series');
    if (seg) seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === sKey));
    if (sKey !== 'all') {
      const prefCar = SERIES_INFO[sKey].cars[0];
      if (prefCar) ui.pickCar(prefCar);
    }
  }

  ui.applyPreset = function (preset) {
    if (preset === 'oval') { EXT.tuning.gearbox = 2; EXT.tuning.aero = -1; EXT.tuning.suspension = 0; }
    else if (preset === 'f1') { EXT.tuning.gearbox = 0; EXT.tuning.aero = 2; EXT.tuning.suspension = 0; }
    else if (preset === 'drift') { EXT.tuning.gearbox = -1; EXT.tuning.aero = 0; EXT.tuning.suspension = -2; }
    else if (preset === 'rally') { EXT.tuning.gearbox = -1; EXT.tuning.aero = 1; EXT.tuning.suspension = 2; }
    else { EXT.tuning.gearbox = 0; EXT.tuning.aero = 0; EXT.tuning.suspension = 0; }
    EXT.saveTuning();
    api.player.veh = EXT.stats(api.settings.car || 'f1');
    syncTuneModal();
    renderCar();
    ui.flash('TUNING UPDATED!');
  };

  function syncTuneModal() {
    if (!$('g2-tune-card')) return;
    const t = EXT.tuning;
    $('g2-rng-gear').value = t.gearbox || 0;
    $('g2-rng-aero').value = t.aero || 0;
    $('g2-rng-susp').value = t.suspension || 0;
    const gLabels = ['SHORT (LAUNCH)', 'QUICK ACCEL', 'BALANCED', 'TALL OVAL', 'SUPERSPEEDWAY'];
    const aLabels = ['LOW DRAG', 'SLICK', 'BALANCED', 'HIGH GRIP', 'MAX DOWNFORCE'];
    const sLabels = ['PRO DRIFT (3x)', 'STREET DRIFT', 'BALANCED', 'RALLY SPEC', 'OFF-ROAD MAX'];
    $('g2-val-gear').textContent = gLabels[(t.gearbox || 0) + 2];
    $('g2-val-aero').textContent = aLabels[(t.aero || 0) + 2];
    $('g2-val-susp').textContent = sLabels[(t.suspension || 0) + 2];
    const st = EXT.stats(api.settings.car || 'f1');
    $('g2-tune-summary').textContent =
      'CAR: ' + EXT.vehById(api.settings.car || 'f1').name +
      '  ·  TOP ' + Math.round(st.top * 100) + '%  ·  ACC ' + Math.round(st.acc * 100) +
      '%  ·  GRIP ' + Math.round(st.grip * 100) + '%  ·  DRIFT x' + st.driftBonus;
  }

  ui.openTuning = function () {
    syncTuneModal();
    api.cards.tune = $('g2-tune-card');
    api.showOverlay('tune');
  };

  // Emergency Pit Tow & Repair (works both mid-race and on DNF so player is NEVER stuck)
  let towCd = 0;
  ui.pitTow = function () {
    if (!api) return;
    const p = api.player, st = api.state;
    if (st.mode !== 'race' && st.mode !== 'dnf') return;
    if (towCd > 0 && st.mode === 'race') { ui.flash('PIT CREW BUSY (' + Math.ceil(towCd) + 's)'); return; }
    const cost = Math.min(bank, p.damage >= 95 ? 200 : 120);
    addBank(-cost);
    towCd = 4.0;
    p.damage = 0;
    p.dnf = false;
    p.out = false;
    p.lat = 0;
    p.speed = Math.max(p.speed, 22);
    p.boostT = 1.1;
    p.shieldT = 3.0;
    const s = api.H.samples[p.idx % api.H.SAMPLES];
    p.x = s.x; p.z = s.z; p.y = s.y;
    p.yaw = Math.atan2(s.tx, s.tz);
    api.applyVisualDamage(p);
    api.syncCarMesh(p);
    if (st.mode === 'dnf') {
      st.mode = 'race';
      api.hideOverlay();
      api.setRacingChrome(true);
    }
    api.audioBeep(520, 0.12, 0.08);
    api.audioBeep(880, 0.18, 0.08);
    ui.flash('🔧 CANDY PIT TOW! (-$' + cost + ')');
    ui.say('🐶 CANDY & LUNA: Towed back to the racing line & repaired to 100% (-$' + cost + ' Grid Bucks)!', 4);
  };

  // Drift Boost Chain & Slipstream state
  const raceState = {
    driftTime: 0,
    driftTier: 0,
    drafting: false,
    pitCooldown: 0,
    lastDamageBill: 0,
  };

  function updateBadges() {
    const box = $('g2-race-badges');
    if (!box) return;
    const inRace = api && (api.state.mode === 'race' || api.state.mode === 'countdown');
    box.style.display = inRace ? 'flex' : 'none';
    const towBtn = $('g2-tow-btn');
    if (towBtn) {
      towBtn.style.display = inRace ? 'block' : 'none';
      const p = api ? api.player : null;
      const urgent = p && (p.damage > 60 || Math.abs(p.lat) > api.H.HALF_WIDTH + 1.5);
      towBtn.classList.toggle('urgent', !!urgent);
      towBtn.textContent = urgent ? '🔧 PIT TOW & REPAIR [T]' : '🔧 PIT TOW [T]';
    }
    if (!inRace) return;
    const sKey = EXT.tuning.series || 'all';
    let html = '<div class="g2-badge">💰 $' + bank + ' · ' + SERIES_INFO[sKey].name + '</div>';
    if (raceState.driftTier > 0 || raceState.driftTime > 0.15) {
      const bars = '█'.repeat(Math.min(8, Math.ceil(raceState.driftTime * 3.5)));
      html += '<div class="g2-badge drift">🔥 DRIFT CHAIN x' + Math.max(1, raceState.driftTier) + ' ' + bars + '</div>';
    }
    if (raceState.drafting) {
      html += '<div class="g2-badge draft">💨 SLIPSTREAM DRAFT (+SPEED)</div>';
    }
    box.innerHTML = html;
  }

  function buildUI() {
    const title = $('title-card');
    const rows = title.querySelectorAll('.opt-row');
    const last = rows[rows.length - 1];

    // Motorsport Series row (ALL / F1 / INDYCAR / NASCAR / DRIFT)
    const seriesRow = document.createElement('div');
    seriesRow.className = 'opt-row g2-series-row';
    seriesRow.innerHTML =
      '<span class="opt-label">SERIES</span>' +
      '<div class="seg" id="seg-series">' +
      '<button type="button" data-v="all">ALL</button>' +
      '<button type="button" data-v="f1">F1 GP</button>' +
      '<button type="button" data-v="indy">INDY</button>' +
      '<button type="button" data-v="nascar">NASCAR</button>' +
      '<button type="button" data-v="drift">DRIFT</button>' +
      '</div>';
    last.after(seriesRow);
    seriesRow.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.dataset.v === (EXT.tuning.series || 'all'));
      b.addEventListener('click', () => setSeries(b.dataset.v));
    });

    // Car selector row
    const carRow = document.createElement('div');
    carRow.className = 'opt-row sg-car-row';
    carRow.innerHTML = '<span class="opt-label">CAR</span><div class="sg-car"><button type="button" id="sg-prev" aria-label="Previous car">◀</button><div id="sg-car-name"></div><button type="button" id="sg-next" aria-label="Next car">▶</button><button type="button" id="sg-gold" class="sg-goldbtn" style="display:none">🏆 GOLD</button></div>';
    seriesRow.after(carRow);
    const info = document.createElement('div');
    info.id = 'sg-car-info';
    carRow.after(info);

    // Items row
    const ir = document.createElement('div');
    ir.className = 'opt-row';
    ir.innerHTML = '<span class="opt-label">ITEMS</span><div class="seg" id="seg-items"><button type="button" data-v="true">ON</button><button type="button" data-v="false">OFF</button></div>';
    info.after(ir);
    const sync = () => ir.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(api.settings.items !== false) === b.dataset.v));
    ir.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { api.settings.items = b.dataset.v === 'true'; save(); sync(); }));
    sync();

    const tag = title.querySelector('.tag');
    if (tag) tag.textContent = '14 TRACKS · 8 CARS · F1 / INDY / NASCAR / DRIFT · TUNING · HUB';

    // Hub button + Garage Tuning button
    const btnRow = title.querySelector('.btn-row');
    const hb = document.createElement('button');
    hb.type = 'button';
    hb.id = 'hub-btn';
    hb.className = 'btn sg-hub';
    hb.innerHTML = '🏁 SUPER GRID HUB';
    btnRow.prepend(hb);
    hb.addEventListener('click', () => EXT.hub.enter());

    const tb = document.createElement('button');
    tb.type = 'button';
    tb.id = 'g2-tune-btn';
    tb.className = 'btn';
    tb.innerHTML = '🔧 GARAGE TUNING';
    hb.after(tb);
    tb.addEventListener('click', () => ui.openTuning());

    const rib = document.createElement('div');
    rib.className = 'sg-ribbon';
    rib.textContent = '🏁 GROK GRID 2 · SUPER EDITION';
    title.querySelector('.kicker').before(rib);

    $('sg-prev').addEventListener('click', () => cycle(-1));
    $('sg-next').addEventListener('click', () => cycle(1));
    $('sg-gold').addEventListener('click', () => {
      api.settings.gold = !api.settings.gold;
      save();
      api.setVehicle(api.player, api.settings.car || 'f1', carColor(api.settings.car || 'f1'));
      renderCar();
    });

    // Garage Tuning Modal Card inside #overlay
    const tuneCard = document.createElement('div');
    tuneCard.id = 'g2-tune-card';
    tuneCard.className = 'card modal hidden';
    tuneCard.innerHTML =
      '<div class="modal-head"><h2>🔧 LUNA’S GARAGE TUNING DYNO</h2><button id="g2-tune-close" class="icon-btn" aria-label="Close">✕</button></div>' +
      '<p class="sub" id="g2-tune-summary"></p>' +
      '<div class="g2-presets">' +
        '<button type="button" data-p="balanced">⚖️ BALANCED</button>' +
        '<button type="button" data-p="oval">🏁 OVAL SPEEDWAY</button>' +
        '<button type="button" data-p="f1">🏎️ F1 DOWNFORCE</button>' +
        '<button type="button" data-p="drift">🔥 DRIFT CHAIN</button>' +
        '<button type="button" data-p="rally">🚙 OFF-ROAD</button>' +
      '</div>' +
      '<div class="g2-tune-grid">' +
        '<div class="g2-tune-row"><div class="g2-tune-head"><span>GEARBOX RATIO</span><span id="g2-val-gear">BALANCED</span></div><input id="g2-rng-gear" type="range" min="-2" max="2" step="1" value="0"/><div class="g2-tune-ends"><span>Quick Launch Accel</span><span>Superspeedway Top Speed</span></div></div>' +
        '<div class="g2-tune-row"><div class="g2-tune-head"><span>AERO WING PACKAGE</span><span id="g2-val-aero">BALANCED</span></div><input id="g2-rng-aero" type="range" min="-2" max="2" step="1" value="0"/><div class="g2-tune-ends"><span>Low-Drag Oval Trim</span><span>Max Corner Downforce</span></div></div>' +
        '<div class="g2-tune-row"><div class="g2-tune-head"><span>SUSPENSION & DRIFT BIAS</span><span id="g2-val-susp">BALANCED</span></div><input id="g2-rng-susp" type="range" min="-2" max="2" step="1" value="0"/><div class="g2-tune-ends"><span>Drift Boost Chain (3x)</span><span>All-Terrain Stability</span></div></div>' +
      '</div>' +
      '<div class="btn-row"><button type="button" id="g2-tune-save" class="btn primary">✅ APPLY DYNO TUNE</button></div>';
    $('overlay').appendChild(tuneCard);
    api.cards.tune = tuneCard;

    tuneCard.querySelectorAll('.g2-presets button').forEach((b) => b.addEventListener('click', () => ui.applyPreset(b.dataset.p)));
    ['gear', 'aero', 'susp'].forEach((k) => {
      $('g2-rng-' + k).addEventListener('input', () => {
        EXT.tuning.gearbox = parseInt($('g2-rng-gear').value, 10) || 0;
        EXT.tuning.aero = parseInt($('g2-rng-aero').value, 10) || 0;
        EXT.tuning.suspension = parseInt($('g2-rng-susp').value, 10) || 0;
        EXT.saveTuning();
        api.player.veh = EXT.stats(api.settings.car || 'f1');
        syncTuneModal();
        renderCar();
      });
    });
    const closeTune = () => {
      if (EXT.hub.active) api.hideOverlay();
      else api.showOverlay('title');
    };
    $('g2-tune-close').addEventListener('click', closeTune);
    $('g2-tune-save').addEventListener('click', () => { ui.flash('DYNO TUNE SAVED!'); closeTune(); });

    // HUB buttons on Finish & DNF cards + Emergency Tow & Continue on DNF card so player is NEVER stuck!
    ['finish-card', 'dnf-card'].forEach((cid) => {
      const row = $(cid).querySelector('.btn-row');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ghost sg-hubbtn';
      b.textContent = '🏁 HUB';
      b.addEventListener('click', () => { api.goTitle(); EXT.hub.enter(); });
      row.appendChild(b);
    });
    const dnfRow = $('dnf-card').querySelector('.btn-row');
    const towContBtn = document.createElement('button');
    towContBtn.type = 'button';
    towContBtn.id = 'g2-dnf-tow';
    towContBtn.className = 'btn primary';
    towContBtn.textContent = '🔧 CANDY PIT TOW & CONTINUE (-$200)';
    dnfRow.prepend(towContBtn);
    towContBtn.addEventListener('click', () => ui.pitTow());

    // Floating HUD elements
    const add = (html) => { const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d.firstChild); };
    add('<button type="button" id="sg-item" class="hidden" aria-label="Use item"><span id="sg-item-ico"></span><span id="sg-item-lab">ITEM</span></button>');
    add('<div id="sg-flash"></div>');
    add('<div id="sg-say" class="hidden"></div>');
    add('<div id="sg-prompt" class="hidden"><div id="sg-prompt-txt"></div><button type="button" id="sg-prompt-btn" class="btn primary"></button></div>');
    add('<div id="sg-hubhud" class="hidden"></div>');
    add('<div id="g2-race-badges" style="display:none"></div>');
    add('<button type="button" id="g2-tow-btn" style="display:none">🔧 PIT TOW [T]</button>');

    $('g2-tow-btn').addEventListener('click', (e) => { e.preventDefault(); ui.pitTow(); });
    const itemBtn = $('sg-item');
    const useItem = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } EXT.items.use(api.player); };
    itemBtn.addEventListener('pointerdown', useItem);
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'KeyE' || e.code === 'KeyQ') && api.state.mode === 'race' && !api.state.paused) useItem();
      if (e.code === 'KeyT' && (api.state.mode === 'race' || api.state.mode === 'dnf') && !api.state.paused) ui.pitTow();
      if ((e.code === 'Enter' || e.code === 'KeyE') && api.state.mode === 'hub' && ui._promptFn) { const f = ui._promptFn; f(); }
    });
    $('sg-prompt-btn').addEventListener('click', () => { if (ui._promptFn) ui._promptFn(); });
    renderCar();
  }

  ui.itemSlot = function (item, uses) {
    const b = $('sg-item');
    if (!b) return;
    const it = item && EXT.items.ITEMS[item];
    b.classList.toggle('full', !!it);
    $('sg-item-ico').textContent = it ? (item === 'turbo3' ? '🔥' : it.icon) : '❓';
    $('sg-item-lab').textContent = it ? (item === 'turbo3' ? 'TURBO ×' + (uses || 3) : it.name) : (api && api.isTouch ? 'ITEM' : 'ITEM (E)');
  };
  let flashT = 0;
  ui.flash = function (txt) {
    const f = $('sg-flash');
    if (!f) return;
    f.textContent = txt;
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
    clearTimeout(flashT);
    flashT = setTimeout(() => f.classList.remove('go'), 900);
  };
  let sayT = 0;
  ui.say = function (txt, sec) {
    const s = $('sg-say');
    if (!s) return;
    s.textContent = txt;
    s.classList.remove('hidden');
    clearTimeout(sayT);
    sayT = setTimeout(() => s.classList.add('hidden'), (sec || 4) * 1000);
  };
  ui.prompt = function (txt, btn, fn) {
    const p = $('sg-prompt');
    if (!p) return;
    const key = txt + '|' + btn;
    if (!txt) { if (ui._pk) { p.classList.add('hidden'); ui._pk = ''; ui._promptFn = null; } return; }
    if (ui._pk === key) { ui._promptFn = btn ? fn : null; return; }
    ui._pk = key;
    $('sg-prompt-txt').textContent = txt;
    const b = $('sg-prompt-btn');
    b.textContent = btn || '';
    b.style.display = btn ? '' : 'none';
    ui._promptFn = btn ? fn : null;
    p.classList.remove('hidden');
  };
  ui.hubHud = function (on) {
    const h = $('sg-hubhud');
    if (!h) return;
    h.classList.toggle('hidden', !on);
    if (on) h.innerHTML = '<b>🏁 GROK GRID 2 HUB</b><span>💰 $' + bank + '</span><span>🔩 ' + EXT.hub.nutCount() + '/12</span><span>' + EXT.vehById(api.settings.car || 'f1').name + '</span>';
  };
  ui.drawHubMap = function (c, gates, nuts, rooms) {
    const cv = $('minimap');
    if (!cv) return;
    const g = cv.getContext('2d'), w = cv.width, h = cv.height, sc = (Math.min(w, h) / 2 - 6) / 152;
    const X = (x) => w / 2 - x * sc, Z = (z) => h / 2 - z * sc;
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,120,50,0.55)';
    g.beginPath(); g.arc(w / 2, h / 2, 150 * sc, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(232,220,200,0.7)';
    g.beginPath(); g.arc(w / 2, h / 2, 62 * sc, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a3550';
    rooms.forEach((r) => g.fillRect(X(r.x1), Z(r.z1), (r.x1 - r.x0) * sc, (r.z1 - r.z0) * sc));
    const gc = ['#ffd23b', '#1e5aff', '#ff2a9d', '#3fa9ff', '#2fc46a'];
    gates.forEach((gt, k) => { g.fillStyle = gc[k % gc.length]; g.fillRect(X(gt.x) - 5, Z(gt.z) - 2, 10, 4); });
    g.fillStyle = '#ffc83a';
    nuts.forEach((n) => { if (!n.got) { g.beginPath(); g.arc(X(n.x), Z(n.z), 2, 0, Math.PI * 2); g.fill(); } });
    g.save();
    g.translate(X(c.x), Z(c.z));
    g.rotate(-c.yaw + Math.PI);
    g.fillStyle = '#00e8ff'; g.strokeStyle = '#fff'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(-4.5, 5); g.closePath(); g.fill(); g.stroke();
    g.restore();
  };

  /* ---------- hooks called by game.js ---------- */
  EXT.boot = function (a) {
    api = EXT.api = a;
    const s = api.settings;
    if (!EXT.VEHICLES.some((v) => v.id === s.car)) s.car = 'indy';
    if (s.gold && !EXT.hub.goldUnlocked()) s.gold = false;
    api.setVehicle(api.player, s.car, carColor(s.car));
    buildUI();
  };
  EXT.onTrackBuilt = function (G, track, H) {
    if (!track.dlc) {
      EXT.anim = [];
      if (EXT.buildPetPitLane) EXT.buildPetPitLane(G, H);
    }
    EXT.items.build(G, H);
  };
  EXT.onRaceStart = function (TR) {
    const itemsOn = online() ? !!TR.dlc : api.settings.items !== false;
    EXT.items.reset(itemsOn && !!EXT.items.group);
    raceState.driftTime = 0;
    raceState.driftTier = 0;
    raceState.drafting = false;
    raceState.pitCooldown = 0;
    raceState.lastDamageBill = 0;
    towCd = 0;

    // Pick rival vehicles based on selected Motorsport Series or track default series
    const sKey = EXT.tuning.series && EXT.tuning.series !== 'all' ? EXT.tuning.series : (TR.series || 'all');
    const pool = (SERIES_INFO[sKey] || SERIES_INFO.all).cars;
    api.cars.forEach((c) => {
      if (c.isPlayer || c.human) {
        c.veh = EXT.stats(api.settings.car || 'f1');
        return;
      }
      const want = pool[c.id % pool.length];
      if (c.vis.kind !== want) api.setVehicle(c, want, api.LIVERY[c.id].color);
    });
    const ib = $('sg-item');
    if (ib) ib.classList.toggle('hidden', !EXT.items.active);
    ui.itemSlot(null);
    updateBadges();
    document.querySelectorAll('.sg-hubbtn').forEach((b) => (b.style.display = !online() ? '' : 'none'));
  };

  EXT.raceUpdate = function (dt, racing) {
    EXT.items.update(dt, racing);
    if (!api || !racing) return;
    const p = api.player, H = api.H, N = H.SAMPLES;
    if (towCd > 0) towCd = Math.max(0, towCd - dt);
    if (raceState.pitCooldown > 0) raceState.pitCooldown = Math.max(0, raceState.pitCooldown - dt);

    // 1. Real Crash Repair Bill notification when taking heavy damage
    if (p.damage - raceState.lastDamageBill >= 22) {
      const bill = 45;
      raceState.lastDamageBill = p.damage;
      addBank(-bill);
      ui.flash('CRASH DAMAGE -$' + bill);
    } else if (p.damage < raceState.lastDamageBill) {
      raceState.lastDamageBill = p.damage;
    }

    // 2. Trackside Pet Pit Lane Repair Box (drive onto right shoulder near start/finish to repair!)
    if (EXT.pitBox && p.damage > 5 && raceState.pitCooldown <= 0) {
      let dIdx = p.idx - EXT.pitBox.idx;
      if (dIdx > N / 2) dIdx -= N;
      if (dIdx < -N / 2) dIdx += N;
      if (Math.abs(dIdx) <= EXT.pitBox.halfSpan && p.lat > H.HALF_WIDTH - 2.5) {
        const repCost = Math.min(bank, Math.max(25, Math.round(p.damage * 1.2)));
        addBank(-repCost);
        p.damage = Math.max(0, p.damage - 65);
        api.applyVisualDamage(p);
        raceState.pitCooldown = 4.5;
        api.audioBeep(780, 0.16, 0.08);
        ui.flash('🔧 PET PIT STOP! (-$' + repCost + ')');
        ui.say('🐭 LUNA & PI-RAT: Quick pit stop complete! Wings & tyres repaired (-$' + repCost + ').', 3.5);
      }
    }

    // 3. Drift Boost Chains: carving corners at high speed builds Drift Chain x1 -> x2 -> x3
    const st = p.veh || { driftBonus: 1 };
    const isCarving = p.speed > 26 && Math.abs(p.steerVis) > 0.24 && Math.abs(p.lat) < H.HALF_WIDTH + 1.2;
    const seriesMult = (EXT.tuning.series === 'drift' || (api.settings.car === 'drift')) ? 1.45 : 1.0;
    if (isCarving) {
      raceState.driftTime += dt * (st.driftBonus || 1) * seriesMult;
      const newTier = raceState.driftTime >= 2.1 ? 3 : raceState.driftTime >= 1.15 ? 2 : raceState.driftTime >= 0.45 ? 1 : 0;
      if (newTier > raceState.driftTier) {
        raceState.driftTier = newTier;
        api.audioBeep(540 + newTier * 160, 0.08, 0.06);
        ui.flash('DRIFT x' + newTier + '!');
      }
    } else if (raceState.driftTime > 0) {
      if (raceState.driftTier >= 1) {
        const tier = raceState.driftTier;
        p.boostT = Math.max(p.boostT, 0.55 + tier * 0.42);
        const bonus = tier * 35;
        addBank(bonus);
        api.audioBeep(880 + tier * 140, 0.14, 0.07);
        ui.flash('DRIFT BOOST x' + tier + ' (+$' + bonus + ')');
      }
      raceState.driftTime = 0;
      raceState.driftTier = 0;
    }

    // 4. Slipstream Pack Drafting (especially strong in NASCAR & IndyCar series)
    let draftingNow = false;
    for (const c of api.cars) {
      if (c === p || c.out) continue;
      const ds = c.s - p.s;
      if (ds > 4 && ds < 28 && Math.abs(c.lat - p.lat) < 2.2) {
        draftingNow = true;
        break;
      }
    }
    raceState.drafting = draftingNow;
    if (draftingNow && p.speed > 20) {
      const draftBoost = (EXT.tuning.series === 'nascar' || api.settings.car === 'nascar') ? 9.5 : 5.5;
      p.speed += draftBoost * dt;
    }

    updateBadges();
  };

  EXT.hubUpdate = function (dt, inp) { EXT.hub.update(dt, inp); };
  EXT.onTitle = function () {
    EXT.hub.exit();
    const ib = $('sg-item');
    if (ib) ib.classList.add('hidden');
    updateBadges();
    ui._view = null;
    if ($('sg-car-name')) renderCar();
  };
  EXT.frame = function (dt, paused) {
    if (!api) return;
    if (!paused) tAcc += dt;
    if (EXT.hub.active) EXT.hub.frame(tAcc, paused ? 0 : dt);
    else EXT.tickAnim(tAcc, paused ? 0 : dt);
    EXT.items.frame(tAcc, dt);
    if (!EXT.hub.active) {
      const cp = api.camera.position, pl = api.player;
      const dp = Math.hypot(pl.x - cp.x, pl.z - cp.z);
      const near = Math.min(6.5, dp - 1.2);
      for (const c of api.cars) {
        if (c.isPlayer || c.out) { if (c._camHid) { c._camHid = false; if (!c.out) c.vis.root.visible = true; } continue; }
        const d = Math.hypot(c.x - cp.x, c.z - cp.z, (c.y || 0) + 0.6 - cp.y);
        if (!c._camHid && d < near && c.vis.root.visible) { c._camHid = true; c.vis.root.visible = false; }
        else if (c._camHid && d > near + 0.8) { c._camHid = false; c.vis.root.visible = true; }
      }
    }
    lodT -= dt;
    if (lodT <= 0) { lodT = 0.3; EXT.updateLod(api.camera); }
    const ib = $('sg-item');
    if (ib && api.state.mode !== 'race' && api.state.mode !== 'countdown' && !ib.classList.contains('hidden')) ib.classList.add('hidden');
  };
  EXT.onShieldHit = function (car) { if (car.isPlayer) ui.flash('🛡️ BLOCKED!'); };
})();
