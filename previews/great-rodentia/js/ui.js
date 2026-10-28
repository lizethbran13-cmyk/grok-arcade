// UI manager for Grok Great Rodentia (#69, #70, #71, #72)
import { $ } from './util.js?v=gr1';
import { sfx } from './audio.js?v=gr1';
import { S, save, hasClue, addClue, isDistrictUnlocked, unlockDistrict } from './save.js?v=gr1';
import { LORE_INTRO, DISTRICTS, CLUES, TWIN_PROFILES, ENDINGS } from './story.js?v=gr1';

let toastTimer = null;
let dlgQueue = [];
let dlgDone = null;
let dlgChoices = null;

export function toast(msg, dur = 3100) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), dur);
}

export function isTalking() {
  const el = $('dlgBox');
  return !!(el && el.classList.contains('on'));
}

export function startDialogue(lines, onDone = null, choices = null) {
  dlgQueue = (lines || []).slice();
  dlgDone = onDone;
  dlgChoices = choices;
  const box = $('dlgBox');
  if (!box) return;
  box.classList.add('on');
  sfx('click');
  stepDialogue();
}

export function stepDialogue() {
  const box = $('dlgBox');
  if (!box || !box.classList.contains('on')) return;
  if (dlgQueue.length === 0) {
    box.classList.remove('on');
    const cb = dlgDone;
    dlgDone = null;
    dlgChoices = null;
    if (cb) cb();
    return;
  }
  const [speaker, text] = dlgQueue.shift();
  $('dlgSpeaker').textContent = speaker || 'Dossier';
  $('dlgText').textContent = text || '';
  const chEl = $('dlgChoices');
  chEl.innerHTML = '';
  if (dlgQueue.length === 0 && dlgChoices && dlgChoices.length) {
    $('dlgNextBtn').style.display = 'none';
    for (const c of dlgChoices) {
      const b = document.createElement('button');
      b.className = 'dlg-choice-btn';
      b.textContent = c.t;
      b.onclick = (e) => {
        e.stopPropagation();
        sfx('click');
        box.classList.remove('on');
        dlgDone = null;
        dlgChoices = null;
        if (c.f) c.f();
      };
      chEl.appendChild(b);
    }
  } else {
    $('dlgNextBtn').style.display = 'inline-flex';
    $('dlgNextBtn').textContent = dlgQueue.length > 0 ? 'Next ▸' : 'Done ✓';
  }
}

export function updateHud(game) {
  if (!game) return;
  const isEvil = S.mode === 'evil';
  const twin = TWIN_PROFILES[S.twin] || TWIN_PROFILES.evil_luna;
  const modeBadge = $('hudMode');
  if (modeBadge) {
    modeBadge.textContent = isEvil
      ? `😈 EVIL TWIN: ${twin.name.toUpperCase()} (NON-CANON)`
      : '🕵️‍♀️ BRIE — GOOD MODE (CANON)';
    modeBadge.className = 'hud-pill ' + (isEvil ? 'evil' : 'good');
  }
  const distInfo = DISTRICTS.find((d) => d.id === game.curDistrict) || DISTRICTS[0];
  const locEl = $('hudLoc');
  if (locEl) {
    locEl.textContent = game.inB ? game.inB.name : `🌆 ${distInfo.name} (Year ${LORE_INTRO.year})`;
  }
  const objEl = $('hudObj');
  if (objEl) {
    objEl.textContent = isEvil ? `🎯 Evil Goal: ${distInfo.evilGoal}` : `🎯 Detective Goal: ${distInfo.goodGoal}`;
  }
  const hpEl = $('hudHp');
  if (hpEl) {
    const h = Math.max(0, game.me ? game.me.hp : 3);
    hpEl.textContent = '❤️'.repeat(h) + '🖤'.repeat(Math.max(0, 3 - h));
  }
  const chEl = $('hudCheese');
  if (chEl) chEl.textContent = `🧀 ${S.cheese || 0}`;
  const clEl = $('hudClues');
  if (clEl) clEl.textContent = `🔎 ${(S.clues || []).length}/${CLUES.length}`;

  // Rescue / Takeover status pills
  const resCount = Object.values(S.rescued || {}).filter(Boolean).length;
  const sabCount = Object.values(S.sabotaged || {}).filter(Boolean).length;
  const stEl = $('hudStatus');
  if (stEl) {
    stEl.textContent = isEvil
      ? `⚡ Nodes Locked: ${sabCount}/4`
      : `🔓 Allies Freed: ${resCount}/4`;
  }

  // Twin switcher bar visibility
  const twinBar = $('twinSwitchBar');
  if (twinBar) {
    twinBar.style.display = isEvil ? 'flex' : 'none';
    twinBar.querySelectorAll('[data-twin]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.twin === S.twin);
    });
  }
}

export function setPrompt(act) {
  const btn = $('actBtn');
  if (!btn) return;
  if (!act) {
    btn.classList.remove('on');
    return;
  }
  btn.textContent = `[E] ${act.label}`;
  btn.classList.add('on');
}

export function openConspiracyBoard(game) {
  const modal = $('boardModal');
  if (!modal) return;
  const grid = $('clueGrid');
  grid.innerHTML = '';
  const foundCount = (S.clues || []).length;
  $('boardCount').textContent = `${foundCount} / ${CLUES.length} Clues Pinned — Year 000 1`;

  for (const c of CLUES) {
    const got = hasClue(c.id);
    const card = document.createElement('div');
    card.className = 'clue-card ' + (got ? 'found' : 'locked');
    card.innerHTML = `
      <div class="clue-head">
        <span class="clue-dist">District ${c.district} • ${c.loc}</span>
        <span class="clue-state">${got ? '📌 PINNED' : '🔒 UNFOUND'}</span>
      </div>
      <h4>${c.title}</h4>
      <p>${got ? c.body : 'Explore ' + c.loc + ' in District ' + c.district + ' (or click below to inspect from Nana Gouda\'s files).'}</p>
    `;
    const btn = document.createElement('button');
    btn.className = 'clue-inspect-btn';
    btn.textContent = got ? '🔍 Read Dossier' : '📌 Pin Clue to Board';
    btn.onclick = () => {
      sfx('check');
      if (!got) {
        addClue(c.id);
        game.checkDistrictUnlocks();
        openConspiracyBoard(game);
        updateHud(game);
        toast(`📌 Pinned Clue: ${c.title}`);
      } else {
        toast(`🔎 ${c.title}: ${c.summary}`);
      }
    };
    card.appendChild(btn);
    grid.appendChild(card);
  }
  modal.classList.add('on');
}

export function openDistrictModal(game) {
  const modal = $('mapModal');
  if (!modal) return;
  const list = $('districtList');
  list.innerHTML = '';
  for (const d of DISTRICTS) {
    const unlocked = isDistrictUnlocked(d.id);
    const row = document.createElement('div');
    row.className = 'dist-card ' + (unlocked ? 'open' : 'locked');
    row.innerHTML = `
      <div class="dist-info">
        <div class="dist-badge">${d.badge} • ${unlocked ? '✅ UNLOCKED' : '🔒 ' + d.reqText}</div>
        <h3>${d.name}</h3>
        <p>${d.lore}</p>
        <div class="dist-goals">
          <span>🕵️‍♀️ <b>Good:</b> ${d.goodGoal}</span>
          <span>😈 <b>Evil:</b> ${d.evilGoal}</span>
        </div>
      </div>
    `;
    const actCol = document.createElement('div');
    actCol.className = 'dist-actions';
    const tpBtn = document.createElement('button');
    tpBtn.className = 'primary-btn';
    tpBtn.textContent = unlocked ? `🚀 Fast-Travel to D${d.id}` : `🔓 Unlock & Travel D${d.id}`;
    tpBtn.onclick = () => {
      sfx('win');
      unlockDistrict(d.id);
      game.syncGateVisuals();
      game.teleportToDistrict(d.id);
      modal.classList.remove('on');
    };
    actCol.appendChild(tpBtn);
    row.appendChild(actCol);
    list.appendChild(row);
  }
  modal.classList.add('on');
}

export function showEndingModal(endingKey, game) {
  const e = ENDINGS[endingKey] || ENDINGS.good_win;
  const modal = $('endingModal');
  if (!modal) return;
  $('endBadge').textContent = e.badge;
  $('endBadge').style.background = e.color;
  $('endTitle').textContent = e.title;
  $('endSub').textContent = e.subtitle;
  const body = $('endBody');
  body.innerHTML = '';
  for (const p of e.paragraphs) {
    const el = document.createElement('p');
    el.textContent = p;
    body.appendChild(el);
  }
  $('endStats').textContent = `Year 000 1 • Clues Pinned: ${(S.clues || []).length}/${CLUES.length} • Cheese Wedges: ${S.cheese || 0} • Mode: ${S.mode === 'evil' ? 'Evil Twin (Non-Canon)' : 'Brie (Canon Good)'}`;
  modal.classList.add('on');
  sfx(endingKey.endsWith('win') ? 'win' : 'hit');
}
