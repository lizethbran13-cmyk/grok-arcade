#!/usr/bin/env node
/* Grok Arcade - make a Time Jumper preview (see PREVIEW.md).
   Copies a PLAYABLE work-in-progress build into previews/<id>/, injects the preview shim into every .html page
   (own save keys, WIP banner, noindex) and adds/updates the entry in preview.json.

     node tools/make-preview.js <build-folder> <id> --game kart --issue 28 --name "Super Kart Expansion" [--notes "2 of 4 racers so far"]
     node tools/make-preview.js --remove <id>      (deletes previews/<id>/ and its preview.json entry, e.g. once it ships)
     node tools/make-preview.js --list

   Only make a preview when the build really runs. Posters and the schedule board already cover builds that don't. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PJ = path.join(ROOT, 'preview.json'), PDIR = path.join(ROOT, 'previews');
const SKIP = new Set(['.git', 'node_modules', '.github', 'previews']);
function die(m) { console.error('make-preview: ' + m); process.exit(1); }
function args() { const a = process.argv.slice(2), o = { _: [] }; for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); if (k === 'remove' || k === 'list') o[k] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; else o[k] = a[++i]; } else o._.push(a[i]); } return o; }
function readPJ() { try { return JSON.parse(fs.readFileSync(PJ, 'utf8')); } catch (e) { die('cannot read preview.json: ' + e.message); } }
function writePJ(d) { d.updated = new Date().toISOString().slice(0, 10); fs.writeFileSync(PJ, JSON.stringify(d, null, 2) + '\n'); }
function copyDir(src, dst) { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const s = path.join(src, e.name), d = path.join(dst, e.name); if (e.isDirectory()) copyDir(s, d); else if (e.isFile()) fs.copyFileSync(s, d); } }
function htmlFiles(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) htmlFiles(p, out); else if (/\.html?$/i.test(e.name)) out.push(p); } return out; }
const MARK = '<!-- ratita-preview-shim -->';
function shim(id, name, depth) {
  const back = '../'.repeat(depth + 2); // previews/<id>/(sub/)page.html -> arcade root
  return MARK + '\n<meta name="robots" content="noindex,nofollow">\n<script>/* Ratita Preview shim: this page is a WORK-IN-PROGRESS preview. Its saves live under their own prefix so the real game\'s saves are never read or changed. */\n' +
`(function () {
  var PFX = 'grokPreview.${id}.';
  try {
    var SP = Storage.prototype, gI = SP.getItem, sI = SP.setItem, rI = SP.removeItem, kI = SP.key, cl = SP.clear, lenD = Object.getOwnPropertyDescriptor(SP, 'length');
    function mine(st) { var a = [], n = lenD.get.call(st); for (var i = 0; i < n; i++) { var k = kI.call(st, i); if (k && k.indexOf(PFX) === 0) a.push(k); } return a; }
    SP.getItem = function (k) { return gI.call(this, PFX + k); };
    SP.setItem = function (k, v) { return sI.call(this, PFX + k, v); };
    SP.removeItem = function (k) { return rI.call(this, PFX + k); };
    SP.key = function (i) { var a = mine(this); return i >= 0 && i < a.length ? a[i].slice(PFX.length) : null; };
    SP.clear = function () { var st = this; mine(st).forEach(function (k) { rI.call(st, k); }); };
    Object.defineProperty(SP, 'length', { configurable: true, get: function () { return mine(this).length; } });
    if (window.indexedDB) { var IO = indexedDB.open.bind(indexedDB), ID = indexedDB.deleteDatabase.bind(indexedDB); indexedDB.open = function (n, v) { return v === undefined ? IO(PFX + n) : IO(PFX + n, v); }; indexedDB.deleteDatabase = function (n) { return ID(PFX + n); }; }
  } catch (e) { if (window.console) console.warn('preview shim', e); }
  function banner() { if (document.getElementById('ratitaWip')) return; var b = document.createElement('div'); b.id = 'ratitaWip';
    b.setAttribute('style', 'position:fixed;left:8px;top:8px;z-index:2147483647;display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:12px;font:bold 12px Trebuchet MS,system-ui,sans-serif;color:#fff;background:repeating-linear-gradient(45deg,#b45309 0 10px,#111827 10px 20px);box-shadow:0 2px 10px rgba(0,0,0,.5);text-shadow:0 1px 2px #000;max-width:calc(100vw - 16px)');
    b.innerHTML = '\\uD83E\\uDDEA WORK IN PROGRESS \\u00b7 ${name.replace(/[\\'"<>&]/g, '')} \\u00b7 may be buggy <a href="${back}" style="color:#5eead4">\\u23EA back to the arcade</a> <button aria-label="hide" style="background:none;border:0;color:#fff;font:bold 14px sans-serif;cursor:pointer">\\u00d7</button>';
    b.querySelector('button').onclick = function () { b.remove(); }; document.body.appendChild(b); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner();
})();
</script>
`;
}
function inject(file, id, name, depth) {
  let h = fs.readFileSync(file, 'utf8'); if (h.includes(MARK)) return false;
  const s = shim(id, name, depth), m = /<head[^>]*>/i.exec(h);
  h = m ? h.slice(0, m.index + m[0].length) + '\n' + s + h.slice(m.index + m[0].length) : s + h; fs.writeFileSync(file, h); return true;
}
const o = args();
if (o.list) { const d = readPJ(); (d.previews || []).forEach(p => console.log(p.id, '-', p.name, p.url, p.playable ? '(playable)' : '(off)')); if (!(d.previews || []).length) console.log('(no previews: the Time Jumper shows "nothing in the Jumper right now")'); process.exit(0); }
if (o.remove) { const id = String(o.remove); if (!/^[a-z0-9-]{2,40}$/.test(id)) die('bad id'); fs.rmSync(path.join(PDIR, id), { recursive: true, force: true }); const d = readPJ(); d.previews = (d.previews || []).filter(p => p.id !== id); writePJ(d); console.log('removed preview ' + id); process.exit(0); }
const [src, id] = o._; if (!src || !id) die('usage: node tools/make-preview.js <build-folder> <id> --game <gameId> --issue <n> --name "<name>" [--notes "..."]');
if (!/^[a-z0-9-]{2,40}$/.test(id)) die('id must be 2-40 chars of a-z, 0-9 and -');
const S = path.resolve(src); if (!fs.existsSync(path.join(S, 'index.html'))) die('the build folder needs an index.html (it must be the playable game)');
if (S.startsWith(PDIR)) die('copy from the real build folder, not from previews/');
const dst = path.join(PDIR, id); fs.rmSync(dst, { recursive: true, force: true }); copyDir(S, dst);
let n = 0; for (const f of htmlFiles(dst)) { const depth = path.relative(dst, path.dirname(f)).split(path.sep).filter(Boolean).length; if (inject(f, id, o.name || id, depth)) n++; }
const d = readPJ(); d.previews = (d.previews || []).filter(p => p.id !== id);
d.previews.push({ id, game: o.game || 'arcade', issue: o.issue ? +o.issue : undefined, name: o.name || id, url: 'previews/' + id + '/', playable: true, built: new Date().toISOString().slice(0, 10), notes: o.notes || undefined });
writePJ(d);
console.log('preview ' + id + ' -> previews/' + id + '/ (' + n + ' page(s) shimmed) and added to preview.json. Commit + push, then it shows up in the Time Jumper.');
