#!/usr/bin/env node
/* Grok Arcade - make a Time Jumper preview (see PREVIEW.md).
   Copies a PLAYABLE work-in-progress build into previews/<id>/, injects the preview shim into every .html page
   (own save keys, WIP banner, noindex) and adds/updates the entry in preview.json.

     node tools/make-preview.js <build-folder> <id> --game kart --issue 28 --name "Super Kart Expansion" [--notes "2 of 4 racers so far"]
     node tools/make-preview.js --archive <id>     (the game SHIPPED: moves previews/<id>/ to archive/<id>-beta/, re-shims it as the
                                                   'Final Beta (Time Jumper)', moves its entry to preview.json "archive" -> Save Booth + Hall Old Versions)
     node tools/make-preview.js --remove <id>      (same as --archive: previews are never deleted any more)
     node tools/make-preview.js --list

   Only make a preview when the build really runs. Posters and the schedule board already cover builds that don't. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PJ = path.join(ROOT, 'preview.json'), PDIR = path.join(ROOT, 'previews'), ADIR = path.join(ROOT, 'archive');
const SKIP = new Set(['.git', 'node_modules', '.github', 'previews', 'archive']);
const BETA_LABEL = 'Final Beta (Time Jumper)';
function die(m) { console.error('make-preview: ' + m); process.exit(1); }
function args() { const a = process.argv.slice(2), o = { _: [] }; for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); if (k === 'remove' || k === 'list' || k === 'archive') o[k] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; else o[k] = a[++i]; } else o._.push(a[i]); } return o; }
function readPJ() { try { return JSON.parse(fs.readFileSync(PJ, 'utf8')); } catch (e) { die('cannot read preview.json: ' + e.message); } }
function today() { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); } // the builders' local date (Pacific), not UTC
function writePJ(d) { d.updated = today(); fs.writeFileSync(PJ, JSON.stringify(d, null, 2) + '\n'); }
function copyDir(src, dst) { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const s = path.join(src, e.name), d = path.join(dst, e.name); if (e.isDirectory()) copyDir(s, d); else if (e.isFile()) fs.copyFileSync(s, d); } }
function htmlFiles(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) htmlFiles(p, out); else if (/\.html?$/i.test(e.name)) out.push(p); } return out; }
const MARK = '<!-- ratita-preview-shim -->';
function shim(id, name, depth, beta) {
  const back = '../'.repeat(depth + 2); // previews/<id>/(sub/)page.html or archive/<id>-beta/(sub/)page.html -> arcade root
  return MARK + '\n<meta name="robots" content="noindex,nofollow">\n<script>/* Ratita Preview shim: this page is a WORK-IN-PROGRESS preview. Its saves live under their own prefix so the real game\'s saves are never read or changed. */\n' +
`(function () {
  var PFX = '${beta ? 'grokBeta.' : 'grokPreview.'}${id}.';
  try {
    var SP = Storage.prototype, gI = SP.getItem, sI = SP.setItem, rI = SP.removeItem, kI = SP.key, cl = SP.clear, lenD = Object.getOwnPropertyDescriptor(SP, 'length');
    function mine(st) { var a = [], n = lenD.get.call(st); for (var i = 0; i < n; i++) { var k = kI.call(st, i); if (k && k.indexOf(PFX) === 0) a.push(k); } return a; }
${beta ? `    // archived beta: its own save prefix. The first visit copies the old preview save over, so Time Jumper progress comes along.
    try { var OLD = 'grokPreview.${id}.'; [localStorage, sessionStorage].forEach(function (st) { if (mine(st).length) return; var n = lenD.get.call(st), ks = []; for (var i = 0; i < n; i++) { var k = kI.call(st, i); if (k && k.indexOf(OLD) === 0) ks.push(k); } ks.forEach(function (k) { sI.call(st, PFX + k.slice(OLD.length), gI.call(st, k)); }); }); } catch (e) {}
` : ''}    SP.getItem = function (k) { return gI.call(this, PFX + k); };
    SP.setItem = function (k, v) { return sI.call(this, PFX + k, v); };
    SP.removeItem = function (k) { return rI.call(this, PFX + k); };
    SP.key = function (i) { var a = mine(this); return i >= 0 && i < a.length ? a[i].slice(PFX.length) : null; };
    SP.clear = function () { var st = this; mine(st).forEach(function (k) { rI.call(st, k); }); };
    Object.defineProperty(SP, 'length', { configurable: true, get: function () { return mine(this).length; } });
    if (window.indexedDB) { var IO = indexedDB.open.bind(indexedDB), ID = indexedDB.deleteDatabase.bind(indexedDB); indexedDB.open = function (n, v) { return v === undefined ? IO(PFX + n) : IO(PFX + n, v); }; indexedDB.deleteDatabase = function (n) { return ID(PFX + n); }; }
  } catch (e) { if (window.console) console.warn('preview shim', e); }
  function banner() { if (document.getElementById('ratitaWip')) return; var b = document.createElement('div'); b.id = 'ratitaWip';
    b.setAttribute('style', 'position:fixed;left:8px;top:8px;z-index:2147483647;display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:12px;font:bold 12px Trebuchet MS,system-ui,sans-serif;color:#fff;background:${beta ? 'repeating-linear-gradient(45deg,#0f766e 0 10px,#111827 10px 20px)' : 'repeating-linear-gradient(45deg,#b45309 0 10px,#111827 10px 20px)'};box-shadow:0 2px 10px rgba(0,0,0,.5);text-shadow:0 1px 2px #000;max-width:calc(100vw - 16px)');
    b.innerHTML = '${beta ? '\\uD83D\\uDCBE FINAL BETA \\u00b7 ' + name.replace(/[\\'"<>&]/g, '') + ' \\u00b7 from the Time Jumper Save Booth' : '\\uD83E\\uDDEA WORK IN PROGRESS \\u00b7 ' + name.replace(/[\\'"<>&]/g, '') + ' \\u00b7 may be buggy'} <a href="${back}" style="color:#5eead4">\\u23EA back to the arcade</a> <button aria-label="hide" style="background:none;border:0;color:#fff;font:bold 14px sans-serif;cursor:pointer">\\u00d7</button>';
    b.querySelector('button').onclick = function () { b.remove(); }; document.body.appendChild(b); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner();
})();
</script>
`;
}
function inject(file, id, name, depth, beta) {
  let h = fs.readFileSync(file, 'utf8');
  if (h.includes(MARK)) { if (!beta) return false; const a = h.indexOf(MARK), e = h.indexOf('</script>', a); if (e < 0) return false; h = h.slice(0, a) + h.slice(e + '</script>'.length).replace(/^\n/, ''); } // re-shim as the archived beta
  const s = shim(id, name, depth, beta), m = /<head[^>]*>/i.exec(h);
  h = m ? h.slice(0, m.index + m[0].length) + '\n' + s + h.slice(m.index + m[0].length) : s + h; fs.writeFileSync(file, h); return true;
}
const o = args();
if (o.list) { const d = readPJ(); (d.previews || []).forEach(p => console.log(p.id, '-', p.name, p.url, p.playable ? '(playable)' : '(off)')); (d.archive || []).forEach(p => console.log(p.id, '-', p.name, p.url, '(archived ' + p.archived + ', ' + p.label + ')')); if (!(d.previews || []).length) console.log('(no previews: the Time Jumper shows "nothing in the Jumper right now")'); process.exit(0); }
if (o.remove || o.archive) { // a game shipped: NEVER delete its last preview. Archive it as the Final Beta (Save Booth + Hall Old Versions).
  const id = String(o.archive || o.remove); if (!/^[a-z0-9-]{2,40}$/.test(id)) die('bad id');
  const d = readPJ(), p = (d.previews || []).find(x => x.id === id), src = path.join(PDIR, id), dst = path.join(ADIR, id + '-beta');
  if (!p && !fs.existsSync(src)) { if ((d.archive || []).some(x => x.id === id) && fs.existsSync(dst)) { console.log(id + ' is already archived at archive/' + id + '-beta/ (nothing deleted)'); process.exit(0); } die('no preview called ' + id + ' (see --list)'); }
  if (fs.existsSync(src)) { fs.rmSync(dst, { recursive: true, force: true }); fs.mkdirSync(ADIR, { recursive: true }); fs.renameSync(src, dst); }
  if (!fs.existsSync(dst)) die('archive/' + id + '-beta/ is missing');
  const nm = (p && p.name) || id; let n = 0; for (const f of htmlFiles(dst)) { const depth = path.relative(dst, path.dirname(f)).split(path.sep).filter(Boolean).length; if (inject(f, id, nm, depth, true)) n++; }
  d.previews = (d.previews || []).filter(x => x.id !== id); d.archive = (d.archive || []).filter(x => x.id !== id);
  d.archive.unshift({ id, game: (p && p.game) || 'arcade', issue: p && p.issue, name: nm, label: BETA_LABEL, url: 'archive/' + id + '-beta/', built: p && p.built, archived: today(), notes: p && p.notes, playable: true });
  writePJ(d); console.log('archived ' + id + ' -> archive/' + id + '-beta/ (' + n + ' page(s) re-shimmed as the ' + BETA_LABEL + '). Commit + push: it shows in the Save Booth and the game\'s Hall Old Versions.'); process.exit(0); }
const [src, id] = o._; if (!src || !id) die('usage: node tools/make-preview.js <build-folder> <id> --game <gameId> --issue <n> --name "<name>" [--notes "..."]');
if (!/^[a-z0-9-]{2,40}$/.test(id)) die('id must be 2-40 chars of a-z, 0-9 and -');
const S = path.resolve(src); if (!fs.existsSync(path.join(S, 'index.html'))) die('the build folder needs an index.html (it must be the playable game)');
if (S.startsWith(PDIR) || S.startsWith(ADIR)) die('copy from the real build folder, not from previews/ or archive/');
const dst = path.join(PDIR, id); fs.rmSync(dst, { recursive: true, force: true }); copyDir(S, dst);
let n = 0; for (const f of htmlFiles(dst)) { const depth = path.relative(dst, path.dirname(f)).split(path.sep).filter(Boolean).length; if (inject(f, id, o.name || id, depth)) n++; }
const d = readPJ(); d.previews = (d.previews || []).filter(p => p.id !== id);
if ((d.archive || []).some(p => p.id === id)) console.warn('note: ' + id + ' already has an archived Final Beta; it stays in the Save Booth.');
d.previews.push({ id, game: o.game || 'arcade', issue: o.issue ? +o.issue : undefined, name: o.name || id, url: 'previews/' + id + '/', playable: true, built: today(), notes: o.notes || undefined });
writePJ(d);
console.log('preview ' + id + ' -> previews/' + id + '/ (' + n + ' page(s) shimmed) and added to preview.json. Commit + push, then it shows up in the Time Jumper.');
