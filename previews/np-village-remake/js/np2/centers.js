// One Regional Tracking Center at a time (streamed into the RTC far slot and freed on leaving).
// Names, supervisors and facts come from santaupdate.com via merrydata.js.
import { G } from './vworld.js';
import * as K from './kit2.js';
import { building } from './buildings.js';
import { RTC, setRtcAreaName, SANTA_AWAY, santaWhere, ONLINE, EVE_DAYS } from './cal.js';
const PI = Math.PI, E = PI / 2, S = 0;
function palm(w, x, z, s = 1) { for (let i = 0; i < 5; i++) w.add('m', G.cyl(8), 0x8b5a2b, x + i * 0.05 * s, i * 0.85 * s, z, 0, 0, -0.04, 0.14 * s, 0.9 * s, 0.14 * s);
  for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; w.add('g', G.box(), 0x16a34a, x + Math.cos(a) * 1.0 * s, 4.4 * s, z + Math.sin(a) * 1.0 * s, 0, -a, -0.5, 0.12 * s, 0.06 * s, 1.5 * s); } }
function sand(w, cx, cz, warm) { w.addFn('m', G.plane(), (c) => warm ? c.setRGB(0.93, 0.84, 0.62) : c.setRGB(0.93, 0.955, 1), cx, 0, cz, 0, 0, 0, 420, 1, 420); }
function water(w, cx, cz, z0) { w.addFn('m', G.box(), (c) => c.setRGB(0.15, 0.55, 0.68), cx, -0.4, z0, 0, 0, 0, 420, 0.7, 80); }
export function buildCenter(w, c) { K.seed(c.sector * 19 + 7); w.region = 'rtc'; const [cx, cz] = RTC; const warm = c.look !== 'gable';
  sand(w, cx, cz, warm); w.solid(cx - 200, -2, cz - 200, cx + 200, 0, cz + 200);
  const B = 80; w.solid(cx - B - 5, 0, cz - B - 5, cx + B + 5, 30, cz - B, { nocam: true }); w.solid(cx - B - 5, 0, cz + B, cx + B + 5, 30, cz + B + 5, { nocam: true });
  w.solid(cx - B - 5, 0, cz - B, cx - B, 30, cz + B, { nocam: true }); w.solid(cx + B, 0, cz - B, cx + B + 5, 30, cz + B, { nocam: true });
  if (c.look === 'island' || c.look === 'beach' || c.look === 'fiesta') { water(w, cx, cz - 70, cz - 90); for (let i = 0; i < 8; i++) palm(w, cx - 28 + i * 8, cz - 48, 0.85 + (i % 3) * 0.12); }
  if (c.look === 'gable') { for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2, r = 48 + (i % 3) * 8; K.pine(w, cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0.8 + (i % 4) * 0.2); } for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2, r = 200; w.add('m', G.cone(7), 0x7d8da3, cx + Math.cos(a) * r, -2, cz + Math.sin(a) * r, 0, i, 0, 40, 55, 40); w.add('m', G.cone(7), 0xf8fafc, cx + Math.cos(a) * r, 30, cz + Math.sin(a) * r, 0, i, 0, 20, 26, 20); } }
  if (c.look === 'tower') { for (let i = 0; i < 6; i++) { const x = cx - 36 + (i % 3) * 12, z = cz + 28 + Math.floor(i / 3) * 10; w.add('m', G.box(), 0xcbd5e1, x, 0, z, 0, 0, 0, 6, 8 + (i % 3) * 3, 6); w.add('m', G.box(), 0x1e3a8a, x, 8 + (i % 3) * 3, z, 0, 0, 0, 6.4, 0.4, 6.4); w.solid(x - 3, 0, z - 3, x + 3, 12, z + 3); } }
  if (c.look === 'fiesta') { for (let i = 0; i < 8; i++) { const x = cx - 16 + i * 4.4; w.add('f', G.box(), [0xdc2626, 0xfacc15, 0x16a34a, 0x2563eb][i % 4], x, 3.4, cz + 18, 0, 0, 0, 0.08, 1.6, 0.08); w.add('f', G.box(), [0xfacc15, 0xdc2626, 0x2563eb, 0x16a34a][i % 4], x, 4.9, cz + 18, 0, 0.4, 0, 1.6, 0.7, 0.04); } }
  const style = { island: 'office', tower: 'office', gable: 'timber', beach: 'log', fiesta: 'ginger' }[c.look] || 'office';
  const place = { id: c.id, name: `📡 Sector ${c.sector} · ${c.place}`, x: cx, z: cz - 8, ry: S, W: 20, D: 14, H: 7, style, col: c.col, trim: c.trim, roof: c.look === 'gable' ? 0x7f1d1d : 0x0f172a, sign: `SECTOR ${c.sector}  ·  ${c.place.toUpperCase()}`, signBg: '#' + c.col.toString(16).padStart(6, '0'), signFg: '#fff7e0', int: 'rtc', center: c, dish: c.look === 'tower' || c.look === 'island', feat: c.look === 'tower' ? ['antenna'] : c.look === 'fiesta' ? ['bunting'] : c.look === 'gable' ? ['clockspire'] : ['beacon'] };
  building(w, place);
  // sleigh pad in front of the door
  w.add('m', G.cyl(24), warm ? 0xe7d3a8 : 0xcbd5e1, cx, 0, cz + 22, 0, 0, 0, 8, 0.1, 8); w.add('l', G.ring(0.9, 24), 0xfacc15, cx, 0.12, cz + 22, 0, 0, 0, 7.5, 1, 7.5, 0.6);
  { const T = w.tf(cx - 8, 0, cz + 16, 0.3); K.sign(w, T, `📡 SECTOR ${c.sector} REGIONAL TRACKING CENTER`, 0, 2.4, 0.05, 7.2, 0.7, '#' + c.col.toString(16).padStart(6, '0'), '#fff7e0'); T.box('m', 0x3b2414, -3.4, 0, 0, 0.14, 2.2, 0.14); T.box('m', 0x3b2414, 3.4, 0, 0, 0.14, 2.2, 0.14); }
  { const T = w.tf(cx + 9, 0, cz + 14, -0.4); const loc = SANTA_AWAY ? 'SANTA NOW: CHILE' : (ONLINE ? 'SANTA: IN FLIGHT' : 'SANTA: NORTH POLE'); K.sign(w, T, loc, 0, 2.1, 0.05, 5.4, 0.6, '#0c4a6e', '#facc15'); T.box('m', 0x1f2937, 0, 0, 0, 0.16, 1.8, 0.16); }
  K.sledge(w, cx + 14, cz + 22, PI, c.col, 1.4); K.sledge(w, cx - 14, cz + 20, 0.4, 0xdc2626, 1.2);
  for (const sd of [-1, 1]) { K.lamp(w, cx + sd * 7, cz + 10); K.bench(w, cx + sd * 10, cz + 6, sd < 0 ? E : -E); }
  const sub = ONLINE ? 'FULLY ONLINE · Christmas Eve tracking' : `${EVE_DAYS} days to Christmas Eve · preparing`;
  { const T = w.tf(cx, 0, cz + 4, 0); K.sign(w, T, `${c.boss}  ·  ${c.country}  ·  ${sub}`, 0, 0.9, 0, 8.4, 0.45, '#111827', '#e0f2fe'); }
  setRtcAreaName(`📡 Sector ${c.sector} Tracking Center · ${c.place}, ${c.country}`);
  return place; }
