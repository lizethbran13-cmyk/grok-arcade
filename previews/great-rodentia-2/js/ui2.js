// UI helpers for Great Rodentia 2 (toast, dialogue, act prompt)
import { $ } from './util.js?v=gr3';
import { sfx } from './audio.js?v=gr3';
let toastTimer = null, dlgQueue = [], dlgDone = null, dlgChoices = null;
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
