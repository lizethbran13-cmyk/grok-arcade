// Minimal panel/closePanel (same markup as the classic ui.js) without pulling in the old town modules.
const $ = (id) => document.getElementById(id);
export function panel(html, mount, cls = '') { const ui = $('ui'); { const t = $('toast'); if (t && !ui.classList.contains('open')) { t.innerHTML = ''; t.classList.add('low'); } } ui.innerHTML = `<div class="panel ${cls}">${html}</div>`; ui.classList.add('open'); if (mount) mount(ui.firstChild); return ui.firstChild; }
export function closePanel() { const ui = $('ui'); ui.innerHTML = ''; ui.classList.remove('open'); const t = $('toast'); if (t && !t.children.length) t.classList.remove('low'); }
