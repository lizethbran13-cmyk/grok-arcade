'use strict';
// GROK SKY DLC: SUPER TRAVEL EXPANSION (issue #80). Ratita Airways passenger travel (Economy / Business / First),
// 4 new cities (Zacatecas City, Ambato, Cusco, Cairo), a walk-in Super Travel terminal wing at every airport with customs &
// baggage check, VIP lounge, gate boarding, Torty's hangar forge and all 5 family pets, the Golden Pilot Wheel heist
// (Bad Guy Mode vs. the Sky Marshal) and Real Consequences + the Never-Stuck free emergency rebuild.
// Unlocked by localStorage 'grokDLC.sky.super_travel_expansion' (Grok Arcade DLC Machine). Unlocks live, no reload.
(() => {
const WB = SKY.WB, W = SKY.World, D = SKY.CityDefs, PL = SKY.Places;
const { signBoard, onHill, curveStruct } = SKY._cityHelpers;
const hyp = Math.hypot, $ = (id) => document.getElementById(id);
const ST = SKY.SuperTravel = { KEY: 'grokDLC.sky.super_travel_expansion', ARCADE: 'https://lizethbran13-cmyk.github.io/grok-arcade/', PRICE: 175, pets: [] };
const SAVE = 'grokSkySuperTravel';
const S = { airframe: 100, gear: 100, stamps: [], souv: [], flights: 0, cls: 'economy', heists: 0, caught: 0, cargo: 'clear', log: [] };
try { Object.assign(S, JSON.parse(localStorage.getItem(SAVE) || '{}') || {}); } catch (e) { }
const persist = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { } };
ST.save = S;
ST.owned = () => { try { return localStorage.getItem(ST.KEY) != null; } catch (e) { return false; } };
const coins = () => (PL && PL.coins ? PL.coins() : 0);
const toast = (m, c) => SKY.toast(m, c);
const logEv = (t) => { S.log.unshift(t); if (S.log.length > 6) S.log.length = 6; persist(); };

// =============================================================================== NEW CITIES
// ---- ZACATECAS CITY, Mexico (pink-quarry baroque, Cerro de la Bufa, Teleférico, Mina El Edén)
D.ZAC = (P, c, r, low) => {
  P.area('urban', { rect: [-1800, -1600, 1800, 1600] });
  P.hill(-900, -700, 700, 260, 0x9a7a55); P.hill(1400, -1400, 900, 180, 0xa08060); P.hill(-2600, 1800, 1200, 320, 0x8f7a58);
  P.lm('Catedral de Zacatecas', 0, 0, 0, (x, z) => WB.shape(x, 0, z, 44, 70, 80, 2, (px, y, pz) => {
    const ax = Math.abs(px); if (ax < 14 && Math.abs(pz) < 34 && y < 26) return (y > 6 && y < 22 && ax > 13 && Math.floor(pz / 4) % 2) ? 22 : 44;
    if (y >= 26 && y < 40 && hyp(px, pz) < 9) return 44; if (y >= 40 && hyp(px, y - 40, pz) < 9) return 53;
    for (const tx of [-11, 11]) if (Math.abs(px - tx) < 4 && Math.abs(pz - 32) < 4 && y < 62) return y > 54 ? 53 : 44; return 0;
  }, { name: 'Catedral' }), [30, 60, 70, 0xd99a8a], { label: true });
  P.lm('Cerro de la Bufa', -900, -700, 0, (x, z) => WB.shape(x, onHill(x, z) - 1, z, 30, 14, 12, 1, (px, y, pz) => (Math.abs(pz) < 4 && Math.abs(px) < 12 && y < 10) ? (y > 7 ? 70 : 45) : 0, { name: 'La Bufa chapel' }), [24, 12, 10, 0x8a6a4a], { label: true });
  P.lm('Teleférico de Zacatecas', -300, -300, 0, (x, z) => { const top = [c.x - 900, W.heightAt(c.x - 900, c.z - 700) + 8, c.z - 700]; const pts = []; for (let i = 0; i <= 40; i++) { const f = i / 40; pts.push([x + (top[0] - x) * f, 6 + (top[1] - 6) * f - Math.sin(f * Math.PI) * 20, z + (top[2] - z) * f]); } curveStruct(pts, 1, 0.4, 56, { name: 'teleferico' }); for (const k of [12, 26]) WB.shape(pts[k][0], pts[k][1] - 4, pts[k][2], 4, 4, 4, 0.5, (px, y, pz) => (Math.abs(px) < 1.6 && Math.abs(pz) < 1.6 && y < 3.2) ? (y > 1.2 && y < 2.4 ? 3 : 63) : 0, { name: 'gondola' }); }, [10, 10, 10, 0xe53935], { label: true });
  P.lm('Mina El Edén', 700, -500, 0, (x, z) => WB.shape(x, 0, z, 30, 14, 20, 1, (px, y, pz) => { if (Math.abs(px) > 13 || Math.abs(pz) > 8 || y > 12) return 0; if (Math.abs(px) < 4 && y < 6 && pz > 4) return 0; return y > 10 ? 58 : 45; }, { name: 'Mina El Eden' }), [26, 12, 16, 0x6a5a4a], { label: true });
  P.lm('Acueducto El Cubo', 300, 700, 0, (x, z) => WB.shape(x, 0, z, 160, 16, 6, 1, (px, y, pz) => { if (Math.abs(pz) > 2) return 0; const u = ((px % 12) + 12) % 12; if (y > 11) return 44; return (hyp(u - 6, y - 0) < 5) ? 0 : 44; }, { name: 'Acueducto' }), [150, 14, 6, 0xd99a8a]);
  P.road([[-1800, 0], [1800, 0]], 'ave', { name: 'Av. Hidalgo' }); P.road([[0, -1600], [0, 1600]], 'ave', { name: 'Calle Tacuba' });
  for (const z of [-1100, -500, 500, 1100]) P.road([[-1700, z], [1700, z]], 'street'); for (const x of [-1200, -600, 600, 1200]) P.road([[x, -1500], [x, 1500]], 'street');
  P.district({ rect: [-1750, -1550, 1750, 1550], lot: 26, fill: 0.85, lowFill: 0.65, styles: ['mex', 'stucco', 'mex'], h: [2, 4] });
  P.job(() => signBoard(c.x + 60, 0, c.z + 60, [{ t: 'ZACATECAS', m: 64, sc: 2 }, { t: 'PATRIMONIO' }], 0.5, 44, 29, 's'));
  P.label(-900, -820, 'LA BUFA'); P.label(0, -60, 'CENTRO'); P.label(700, -560, 'MINA EL EDEN');
  c.aptDef = { code: 'ZCL', name: 'ZACATECAS INTL', x: 3200, z: 800, side: -1, parallel: false, gates: 3, ai: [1], link: [1800, 0], airline: 'RATITA', sig: 'ZCL' };
};
// ---- AMBATO, Ecuador (Tierra de las Flores y las Frutas, Tungurahua volcano)
D.AMB = (P, c, r, low) => {
  P.area('urban', { rect: [-1700, -1500, 1700, 1500] });
  P.hill(3800, 3200, 2200, 1100, 0x6f6a5c, true); P.hill(-3000, -2400, 1600, 520, 0x5d7a45); P.river([[-2600, 1700], [-800, 1550], [600, 1700], [2600, 1600]], 70);
  P.lm('Catedral de Ambato', 0, -100, 0, (x, z) => WB.shape(x, 0, z, 40, 64, 70, 2, (px, y, pz) => { const ax = Math.abs(px); if (ax < 14 && Math.abs(pz) < 30 && y < 22) return (y > 4 && y < 20 && ax > 13 && Math.floor(pz / 4) % 2) ? 22 : 56; if (Math.abs(pz - 28) < 5 && ax < 5 && y < 60) return y > 50 ? 3 : 56; if (y >= 22 && y < 26 && ax < 14 - (y - 22) * 3 && Math.abs(pz) < 28) return 70; return 0; }, { name: 'Catedral de Ambato' }), [28, 56, 60, 0xd0d4d8], { label: true });
  P.area('park', { rect: [-140, 40, 140, 260] }); P.treesIn(-130, 50, 130, 250, low ? 14 : 30);
  P.lm('Parque Montalvo', 0, 150, 0, (x, z) => WB.shape(x, 0, z, 8, 14, 8, 1, (px, y, pz) => { const d = hyp(px, pz); if (y < 4) return d < 3 ? 45 : 0; return d < 1.2 && y < 12 ? 29 : 0; }, { name: 'Montalvo monument' }), [8, 12, 8, 0xb0b0b0], { label: true });
  P.lm('Quinta de Juan León Mera', -900, 600, 0, (x, z) => WB.shape(x, 0, z, 40, 12, 30, 1, (px, y, pz) => { if (Math.abs(px) > 18 || Math.abs(pz) > 13) return 0; if (y < 8) return (Math.abs(px) > 17 || Math.abs(pz) > 12) ? ((y > 2 && y < 6 && Math.floor(px / 3) % 2) ? 22 : 29) : 0; return y < 10 ? 28 : 0; }, { name: 'Quinta Mera' }), [36, 10, 26, 0xf2f2f2], { label: true });
  P.lm('Fiesta de las Flores y las Frutas', 700, -600, 0, (x, z) => { for (let i = 0; i < 10; i++) WB.shape(x - 180 + i * 40, 0, z, 6, 6, 6, 0.5, (px, y, pz) => (hyp(px, y - 3, pz) < 2.6) ? [63, 64, 60, 28, 67][i % 5] : (Math.abs(px) < 0.3 && Math.abs(pz) < 0.3 ? 36 : 0), { name: 'flower float' }); }, null, { label: true });
  P.road([[-1700, 0], [1700, 0]], 'ave', { name: 'Av. Cevallos' }); P.road([[0, -1500], [0, 1500]], 'ave', { name: 'Av. Bolívar' });
  for (const z of [-1000, -500, 500, 1000]) P.road([[-1600, z], [1600, z]], 'street'); for (const x of [-1100, -500, 500, 1100]) P.road([[x, -1400], [x, 1400]], 'street');
  P.district({ rect: [-1650, -1450, 1650, 1450], lot: 28, fill: 0.8, lowFill: 0.6, styles: ['stucco', 'concrete', 'mex'], h: [2, 6] });
  P.job(() => signBoard(c.x + 200, 0, c.z - 40, [{ t: 'AMBATO', m: 63, sc: 2 }, { t: 'FLORES Y FRUTAS' }], 0.5, 68, 60, 's'));
  P.label(3800, 2900, 'TUNGURAHUA'); P.label(0, 300, 'PARQUE MONTALVO');
  c.aptDef = { code: 'ATF', name: 'CHACHOAN AMBATO', x: -3200, z: -600, side: 1, parallel: false, gates: 3, ai: [1], link: [-1700, 0], airline: 'RATITA', sig: 'ATF' };
};
// ---- CUSCO, Peru (Plaza de Armas, Sacsayhuamán, Machu Picchu terraces, Rainbow Mountain)
D.CUS = (P, c, r, low) => {
  P.area('urban', { rect: [-1600, -1400, 1600, 1400] });
  P.hill(-600, -1500, 700, 220, 0x6a8f48); P.hill(3600, -2600, 1600, 900, 0x6b8d3e); P.hill(-3200, 2400, 1400, 700, 0xc0704a);
  P.area('plaza', { rect: [-120, -120, 120, 120] }); P.treesIn(-100, -100, 100, 100, 10);
  P.lm('Plaza de Armas del Cusco', 0, 0, 0, (x, z) => { WB.shape(x, 0, z - 150, 60, 50, 40, 2, (px, y, pz) => { if (Math.abs(px) > 26 || Math.abs(pz) > 16) return 0; if (y < 24) return (y > 4 && y < 20 && pz > 14 && Math.floor(px / 4) % 2) ? 22 : 58; for (const tx of [-20, 20]) if (Math.abs(px - tx) < 5 && y < 46) return y > 40 ? 45 : 58; return 0; }, { name: 'Catedral del Cusco' }); WB.shape(x, 0, z, 6, 12, 6, 1, (px, y, pz) => { const d = hyp(px, pz); if (y < 3) return d < 2.6 ? 45 : 0; return d < 0.9 ? 53 : 0; }, { name: 'fountain' }); }, [60, 46, 40, 0x8a6a4a, 0, -150], { label: true });
  P.lm('Sacsayhuamán', -600, -1500, 0, (x, z) => WB.shape(x, onHill(x, z) - 2, z, 140, 12, 30, 2, (px, y, pz) => { const zz = pz - Math.abs(((px % 20) + 20) % 20 - 10) * 0.8; return (Math.abs(zz) < 4 && Math.abs(px) < 66 && y < 4 + Math.floor((pz + 15) / 10) * 3) ? 45 : 0; }, { name: 'Sacsayhuaman' }), [130, 10, 24, 0x9a9488], { label: true });
  P.lm('Machu Picchu Terraces', 3000, -2200, 0, (x, z) => { const h0 = onHill(x, z); WB.shape(x, h0 - 20, z, 120, 40, 120, 2, (px, y, pz) => { const d = hyp(px, pz); const lvl = Math.floor((60 - d) / 8); if (d > 58) return 0; return y < 20 + lvl * 3 && y > 20 + lvl * 3 - 3 ? (lvl % 2 ? 36 : 45) : 0; }, { name: 'Machu Picchu' }); }, [100, 40, 100, 0x6b8d3e], { label: true });
  P.lm('Rainbow Mountain', -3200, 2400, 0, (x, z) => { const h0 = onHill(x, z); WB.shape(x, h0 - 30, z, 80, 34, 80, 2, (px, y, pz) => (hyp(px, pz) < 36 - y * 0.9) ? [63, 64, 60, 28, 53, 67][Math.floor(y / 5) % 6] : 0, { name: 'Vinicunca' }); }, [70, 30, 70, 0xc0704a], { label: true });
  P.road([[-1600, 200], [1600, 200]], 'ave', { name: 'Av. El Sol' }); P.road([[200, -1400], [200, 1400]], 'ave');
  for (const z of [-900, -400, 600, 1000]) P.road([[-1500, z], [1500, z]], 'street'); for (const x of [-1000, -400, 700, 1200]) P.road([[x, -1300], [x, 1300]], 'street');
  P.district({ rect: [-1550, -1350, 1550, 1350], lot: 24, fill: 0.85, lowFill: 0.65, styles: ['stucco', 'brown', 'mex'], h: [2, 3] });
  P.job(() => signBoard(c.x + 150, 0, c.z + 150, [{ t: 'CUSCO', m: 63, sc: 2 }, { t: 'QOSQO' }], 0.5, 58, 53, 's'));
  P.label(-600, -1650, 'SACSAYHUAMAN'); P.label(3000, -2400, 'MACHU PICCHU'); P.label(-3200, 2200, 'RAINBOW MTN');
  c.aptDef = { code: 'CUZ', name: 'ALEJANDRO VELASCO ASTETE', x: 3000, z: 900, side: -1, parallel: false, gates: 3, ai: [1], link: [1600, 200], airline: 'RATITA', sig: 'CUZ' };
};
// ---- CAIRO, Egypt (Giza Pyramids, Sphinx, Nile, Cairo Tower)
D.CAI = (P, c, r, low) => {
  P.area('urban', { rect: [-600, -1800, 2200, 1800] }); P.area('sand', { rect: [-4200, -2400, -700, 2400] });
  P.river([[150, -4200], [100, -1500], [-100, 0], [150, 1500], [100, 4200]], 140);
  const pyr = (x, z, b, name) => WB.shape(x, 0, z, b + 4, b * 0.64 + 2, b + 4, 4, (px, y, pz) => (Math.max(Math.abs(px), Math.abs(pz)) < b / 2 * (1 - y / (b * 0.64))) ? 53 : 0, { name });
  P.lm('Great Pyramid of Giza', -2200, -400, 0, (x, z) => pyr(x, z, 230, 'Khufu'), [230, 146, 230, 0xd8b878], { label: true });
  P.lm('Pyramid of Khafre', -2500, 0, 0, (x, z) => pyr(x, z, 214, 'Khafre'), [214, 137, 214, 0xd8b878]);
  P.lm('Pyramid of Menkaure', -2750, 330, 0, (x, z) => pyr(x, z, 104, 'Menkaure'), [104, 66, 104, 0xd8b878]);
  P.lm('Great Sphinx', -1800, -60, 0, (x, z) => WB.shape(x, 0, z, 20, 22, 74, 1, (px, y, pz) => { if (Math.abs(px) > 8) return 0; if (pz > -20 && pz < 34 && y < 10) return 53; if (pz > -32 && pz < -20 && y < 20 && Math.abs(px) < 5) return y > 16 && Math.abs(px) > 3 ? 60 : 53; return 0; }, { name: 'Sphinx' }), [16, 20, 70, 0xd8b878], { label: true });
  P.lm('Cairo Tower', 300, -300, 0, (x, z) => WB.shape(x, 0, z, 16, 190, 16, 2, (px, y, pz) => { const d = hyp(px, pz); if (y < 150) return d < 4 + (150 - y) * 0.01 ? (Math.floor(y / 6) % 2 ? 29 : 56) : 0; if (y < 170) return d < 7 ? (y % 6 < 2 ? 22 : 29) : 0; return d < 1 ? 47 : 0; }, { name: 'Cairo Tower' }), [14, 186, 14, 0xe0dcd0], { label: true });
  P.lm('Egyptian Museum', 1000, 300, 0, (x, z) => WB.shape(x, 0, z, 100, 24, 60, 2, (px, y, pz) => (Math.abs(px) < 48 && Math.abs(pz) < 28 && y < 20) ? ((Math.abs(pz) > 26 && y > 4 && y < 16 && Math.floor(px / 4) % 2) ? 22 : 63) : 0, { name: 'Egyptian Museum' }), [96, 20, 56, 0xc9604a], { label: true });
  P.road([[-600, 600], [2200, 600]], 'blvd', { palms: 30, name: 'Corniche el-Nil' }); P.road([[1100, -1800], [1100, 1800]], 'ave', { name: 'Tahrir St' });
  P.road([[-2000, -800], [-500, -800]], 'ave', { name: 'Pyramids Rd' });
  for (const z of [-1300, -700, 0, 1200]) P.road([[400, z], [2100, z]], 'street'); for (const x of [600, 1600, 2000]) P.road([[x, -1700], [x, 1700]], 'street');
  P.district({ rect: [400, -1750, 2150, 1750], lot: 30, fill: 0.85, lowFill: 0.6, styles: ['stucco', 'concrete', 'brown'], h: [3, 9] });
  P.job(() => signBoard(c.x - 1700, 0, c.z - 400, [{ t: 'GIZA', m: 60, sc: 2 }, { t: 'CAIRO EGYPT' }], 0.5, 53, 70, 'e'));
  P.label(-2200, -620, 'GIZA'); P.label(150, -1600, 'NILE'); P.label(1400, 0, 'DOWNTOWN');
  c.aptDef = { code: 'CAI', name: 'CAIRO INTL', x: 3800, z: -800, side: -1, parallel: false, gates: 4, ai: [1, 2], link: [2200, 600], airline: 'RATITA', sig: 'CAI' };
};

// =============================================================================== WALK-IN PLACES FOR THE NEW CITIES
const PD = (PL && PL.DEFS) || {};
function cafe(id, name, icon, door, face, fac, cook, lines, menu, souv, flag, photo) {
  return { id, short: id.split('-')[1], name, icon, kind: 'interior', door, face, fac, room: { w: 22, h: 6, d: 20 }, hint: 'Super Travel DLC · local food, souvenirs and a photo spot.',
    build(ctx) {
      ctx.shell((x, z) => ((Math.floor(x) + Math.floor(z)) % 2 ? 28 : 31), (x, y) => (y > 2.5 ? fac.wall : 37), 37);
      ctx.exit(ctx.W / 2, ctx.D - 1, 'n'); ctx.spawn(ctx.W / 2, ctx.D - 4, 0);
      for (let x = 3; x < ctx.W - 1; x += 6) for (let z = 3; z < ctx.D - 1; z += 6) ctx.B(x - 0.5, ctx.H - 0.5, z - 0.5, x + 0.5, ctx.H, z + 0.5, 62);
      ctx.B(3, 0, 3, 19, 1, 4.5, 37); ctx.B(3, 1, 3, 19, 1.5, 4.5, fac.trim || 29);
      ctx.txt(11, 4.5, 2.01, fac.sign, fac.signM || 63, 's', 1);
      ctx.menu(11, 1.2, 6.5, icon + ' Order here', icon + ' ' + name, menu);
      ctx.npc(11, 2.4, { name: cook, shirt: 0xffffff, yaw: 0, lines });
      for (const [x, z] of [[5, 10], [11, 10], [17, 10], [8, 15], [14, 15]]) { ctx.B(x - 0.5, 0, z - 0.5, x + 0.5, 0.5, z + 0.5, 56); ctx.B(x - 1, 0.5, z - 1, x + 1, 1, z + 1, 37); }
      ctx.npc(5, 11.5, { sit: true, yaw: Math.PI, lines: ['¡Qué rico!', 'Did you fly Ratita Airways here?', 'First Class had champagne AND caviar!'] });
      ctx.photo(11, 1.2, 17, photo);
      ctx.shop(3, 1.2, 15, '🎁 ' + flag + ' souvenirs', flag + ' souvenirs', souv);
    } };
}
PD.ZAC = (PD.ZAC || []).concat([
  cafe('zac-gorditas', 'Gorditas Doña Julia', '🌮', [120, 60], 'w', { w: 14, d: 14, h: 9, wall: 44, sign: 'GORDITAS', signM: 64, awnA: 64, awnB: 29, trim: 44, window: 3, roof: 44 }, 'Doña Julia', ['¡Bienvenidos a Zacatecas!', 'Las gorditas de chicharrón son famosas.', 'Ride the Teleférico up La Bufa!'],
    [{ e: '🫓', n: 'Gordita de chicharrón', heal: 30, price: 3, col: 0xf2c46b }, { e: '🍲', n: 'Asado de boda', heal: 38, price: 5, col: 0x8d3a2a }, { e: '🥤', n: 'Agua de horchata', heal: 8, price: 2, col: 0xf1e7d0 }],
    [{ e: '⛏', n: 'Silver miner keychain', price: 5 }, { e: '🚡', n: 'Teleférico model', price: 6 }, { e: '💍', n: 'Zacatecas silver ring', price: 9 }], '🇲🇽', 'Zacatecas Cathedral'),
]);
PD.AMB = (PD.AMB || []).concat([
  cafe('amb-panaderia', 'Pan de Pinllo Bakery', '🥖', [160, -60], 'w', { w: 14, d: 14, h: 9, wall: 60, sign: 'PAN DE PINLLO', signM: 63, awnA: 63, awnB: 60, trim: 60, window: 3, roof: 60 }, 'Don Marcelo', ['¡Bienvenidos a Ambato, tierra de las flores y las frutas!', 'Pan de Pinllo, fresh from the oven!', 'Tungurahua is smoking a little today…'],
    [{ e: '🥖', n: 'Pan de Pinllo', heal: 18, price: 2, col: 0xe0a14a }, { e: '🍲', n: 'Llapingachos', heal: 35, price: 5, col: 0xffd54f }, { e: '🍓', n: 'Colada morada', heal: 12, price: 2, col: 0x6a1b9a }, { e: '🥭', n: 'Fruit salad (Fiesta special)', heal: 15, price: 3, col: 0xffb300 }],
    [{ e: '🌸', n: 'Fiesta de las Flores pin', price: 4 }, { e: '🌋', n: 'Tungurahua snow globe', price: 6 }, { e: '📖', n: 'Juan León Mera book', price: 5 }], '🇪🇨', 'Ambato Cathedral'),
]);
PD.CUS = (PD.CUS || []).concat([
  cafe('cus-picanteria', 'Picantería Inca', '🦙', [140, 40], 'w', { w: 14, d: 14, h: 9, wall: 58, sign: 'PICANTERIA', signM: 63, awnA: 63, awnB: 53, trim: 58, window: 3, roof: 58 }, 'Mamá Killa', ['¡Allillanchu! Welcome to Cusco!', 'Drink coca tea for the altitude!', 'Machu Picchu is just a short flight away.'],
    [{ e: '🍲', n: 'Lomo saltado', heal: 40, price: 6, col: 0x8d3a2a }, { e: '🌽', n: 'Choclo con queso', heal: 18, price: 2, col: 0xffe082 }, { e: '🍵', n: 'Mate de coca', heal: 10, price: 2, col: 0x9ccc65 }, { e: '🥤', n: 'Chicha morada', heal: 8, price: 2, col: 0x4a148c }],
    [{ e: '🦙', n: 'Alpaca plush', price: 6 }, { e: '🧶', n: 'Rainbow Mountain scarf', price: 5 }, { e: '🗿', n: 'Mini Machu Picchu', price: 8 }], '🇵🇪', 'Plaza de Armas del Cusco'),
]);
PD.CAI = (PD.CAI || []).concat([
  cafe('cai-koshary', 'Koshary Pharaoh', '🍛', [1200, 640], 'n', { w: 14, d: 14, h: 9, wall: 53, sign: 'KOSHARY', signM: 60, awnA: 60, awnB: 53, trim: 53, window: 3, roof: 53 }, 'Chef Amira', ['Ahlan wa sahlan! Welcome to Cairo!', 'Koshary: rice, lentils, pasta and crispy onions!', 'The Pyramids are 4,500 years old — older than Torty!'],
    [{ e: '🍛', n: 'Koshary', heal: 40, price: 5, col: 0xc0704a }, { e: '🧆', n: 'Ta\'ameya (falafel)', heal: 20, price: 3, col: 0x6d8b3a }, { e: '🍯', n: 'Basbousa', heal: 14, price: 2, col: 0xe0a14a }, { e: '🍵', n: 'Mint tea', heal: 8, price: 2, col: 0x9ccc65 }],
    [{ e: '🔺', n: 'Mini Pyramid', price: 6 }, { e: '🐈', n: 'Bastet cat statue', price: 7 }, { e: '📜', n: 'Papyrus with your name', price: 5 }], '🇪🇬', 'Pyramids of Giza'),
]);

// =============================================================================== TERMINAL WING: 3D PETS + STATIONS
const mat = {}; const L = (c) => mat[c] || (mat[c] = new THREE.MeshLambertMaterial({ color: c }));
function bx(g, w, h, d, c, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), L(c)); m.position.set(x, y, z); g.add(m); return m; }
function mouse(col, patch, hat) { const g = new THREE.Group(); bx(g, 0.5, 0.4, 0.9, col, 0, 0.3, 0); bx(g, 0.38, 0.34, 0.4, col, 0, 0.45, -0.58); bx(g, 0.14, 0.14, 0.04, 0xf9a8d4, -0.14, 0.68, -0.6); bx(g, 0.14, 0.14, 0.04, 0xf9a8d4, 0.14, 0.68, -0.6); bx(g, 0.08, 0.08, 0.06, 0xfb7185, 0, 0.42, -0.8); bx(g, 0.06, 0.06, 0.04, 0x111111, 0.1, 0.52, -0.78); bx(g, patch ? 0.14 : 0.06, patch ? 0.12 : 0.06, 0.04, 0x111111, -0.1, 0.52, -0.79); const t = bx(g, 0.06, 0.06, 0.9, 0xf0b4c0, 0, 0.3, 0.85); t.rotation.x = 0.3; if (hat) bx(g, 0.42, 0.12, 0.42, hat, 0, 0.68, -0.55); return g; }
function dog() { const g = new THREE.Group(), c = 0xc98a4a; bx(g, 0.6, 0.5, 1.1, c, 0, 0.7, 0); [[-0.2, -0.4], [0.2, -0.4], [-0.2, 0.4], [0.2, 0.4]].forEach((p) => bx(g, 0.15, 0.45, 0.15, 0x8a5a2a, p[0], 0.23, p[1])); bx(g, 0.45, 0.45, 0.45, c, 0, 1.05, -0.62); bx(g, 0.3, 0.2, 0.3, 0xf2e0c8, 0, 0.85, -0.85); bx(g, 0.1, 0.1, 0.05, 0x111111, 0, 0.98, -1.0); bx(g, 0.12, 0.2, 0.08, 0x8a5a2a, -0.17, 1.35, -0.6); bx(g, 0.12, 0.2, 0.08, 0x8a5a2a, 0.17, 1.35, -0.6); bx(g, 0.62, 0.12, 0.3, 0x1d4ed8, 0, 0.98, -0.1); return g; }
function turtle() { const g = new THREE.Group(); bx(g, 1.1, 0.5, 1.3, 0x2e7d32, 0, 0.45, 0); bx(g, 0.8, 0.25, 1.0, 0x4caf50, 0, 0.8, 0); bx(g, 0.36, 0.3, 0.4, 0x9a8a5a, 0, 0.4, -0.85); bx(g, 0.06, 0.06, 0.04, 0x111111, 0.1, 0.48, -1.05); bx(g, 0.06, 0.06, 0.04, 0x111111, -0.1, 0.48, -1.05); bx(g, 0.5, 0.12, 0.5, 0xffd23a, 0, 1.0, 0); [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach((p) => bx(g, 0.25, 0.3, 0.25, 0x9a8a5a, p[0], 0.15, p[1])); return g; }
function tag(txt, w) { w = w || 384; const cv = document.createElement('canvas'); cv.width = w; cv.height = 64; const x = cv.getContext('2d'); x.font = 'bold 24px system-ui'; const tw = Math.min(w - 8, x.measureText(txt).width + 24); x.fillStyle = 'rgba(15,23,42,.88)'; x.fillRect((w - tw) / 2, 8, tw, 48); x.fillStyle = '#ffd23a'; x.textAlign = 'center'; x.fillText(txt, w / 2, 41); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthWrite: false })); s.scale.set(w / 64, 1, 1); return s; }
const PETS = [
  { id: 'luna', name: 'Luna', role: 'Chief Flight Dispatcher', e: '🐭', mk: () => mouse(0x9ca3af, false, 0x1d4ed8), station: 'dispatch', lines: ['🐭 Luna: Ratita Airways dispatch — pick your class & destination!', '🐭 Luna: Every route is cleared. Even the weird ones.'] },
  { id: 'pirat', name: 'Pi-rat', role: 'One-Eyed Baggage & Customs Captain', e: '🏴‍☠️', mk: () => mouse(0x8b5a2b, true, 0x111111), station: 'customs', lines: ['🏴‍☠️ Pi-rat: Arrr! Bags on the scanner, matey!', '🏴‍☠️ Pi-rat: Overweight AND uninspected? That be a fine!'] },
  { id: 'snowie', name: 'Snowie', role: 'Polar & Weather Radar Specialist', e: '🐁', mk: () => mouse(0xffffff, false, 0x7dd3fc), station: 'radar', lines: ['🐁 Snowie: Radar shows thunder cells — fly around the red blobs!', '🐁 Snowie: Weather strikes hurt the airframe. Trust the radar!'] },
  { id: 'candy', name: 'Candy', role: 'VIP Lounge & Security K9', e: '🐶', mk: dog, station: 'lounge', lines: ['🐶 Candy: WOOF! *sniffs bag* All clear — enjoy the VIP lounge!', '🐶 Candy: Free rebuild if you ever get stuck. Woof!'] },
  { id: 'torty', name: 'Torty (Martina)', role: 'Armored Fuselage & Landing Gear Inspector', e: '🐢', mk: turtle, station: 'forge', lines: ['🐢 Torty: Shell-armor check… slow and steady, landing gear ready.', '🐢 Torty: Hard landings crack gear. I fix it. Slowly.'] },
];
ST.PETS = PETS;
ST.buildAirport = (apt) => {
  const c = apt.c; if (!c || !c.group) return;
  const side = apt.side, XF = apt.XF, az = apt.az, L0 = apt.L;
  const bx0 = XF + side * 58, bz0 = az - L0 / 2 + 30; // landside plaza, beside the terminal
  const gy = W.heightAt(bx0, bz0); const wing = new THREE.Group(); wing.position.set(bx0, gy, bz0); c.group.add(wing); wing.matrixAutoUpdate = true;
  // floor, roof canopy and the RATITA AIRWAYS sign
  bx(wing, 36, 0.2, 30, 0xe7e2d6, 0, 0.1, 0); bx(wing, 36, 0.4, 30, 0x1e3a8a, 0, 7, 0).material = new THREE.MeshLambertMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.55 });
  for (const p of [[-17, -14], [17, -14], [-17, 14], [17, 14]]) bx(wing, 0.5, 7, 0.5, 0xd4af37, p[0], 3.5, p[1]);
  const sg = tag('✈ RATITA AIRWAYS · SUPER TRAVEL TERMINAL', 768); sg.position.set(0, 8.6, 0); sg.scale.multiplyScalar(1.4); wing.add(sg);
  // stations: ticket counter, customs X-ray arch + belt, VIP lounge carpet & bar, radar dish, hangar forge, gate board
  bx(wing, 8, 1.1, 1.2, 0x1e3a8a, -12, 0.65, -9); bx(wing, 8, 0.15, 1.3, 0xd4af37, -12, 1.25, -9); bx(wing, 6, 2, 0.2, 0x0f172a, -12, 3.2, -10); bx(wing, 5.6, 1.6, 0.05, 0x22c55e, -12, 3.2, -9.88);
  bx(wing, 0.5, 3, 0.8, 0x94a3b8, -3, 1.5, -9); bx(wing, 0.5, 3, 0.8, 0x94a3b8, 1, 1.5, -9); bx(wing, 4.5, 0.6, 0.8, 0x94a3b8, -1, 3.2, -9); bx(wing, 8, 0.6, 1, 0x334155, 4, 0.4, -9);
  for (let i = 0; i < 3; i++) bx(wing, 0.9, 0.6, 0.5, [0x6a1b9a, 0xc62828, 0x2e7d32][i], 2 + i * 2, 0.95, -9);
  bx(wing, 12, 0.05, 8, 0x8b0000, 10, 0.22, 4); bx(wing, 4, 1.1, 1, 0x3e2723, 13, 0.65, 1.5); bx(wing, 4, 0.12, 1.1, 0xd4af37, 13, 1.25, 1.5);
  for (const x of [6, 9]) { bx(wing, 1.6, 0.6, 1.6, 0x4a148c, x, 0.5, 5.5); bx(wing, 1.6, 1, 0.3, 0x4a148c, x, 1, 6.2); }
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })); dish.position.set(-13, 5, 8); dish.rotation.x = -1.0; wing.add(dish); bx(wing, 0.3, 4.4, 0.3, 0xcbd5e1, -13, 2.2, 8); ST.dish = dish;
  bx(wing, 6, 0.4, 4, 0x475569, -2, 0.3, 10); bx(wing, 1.2, 1.6, 1.2, 0x2e7d32, -4, 1.1, 10); bx(wing, 0.9, 0.9, 0.9, 0x111111, 0, 0.75, 10);
  const cam = c.group; void cam;
  // pets with name tags
  const spots = { dispatch: [-12, -7], customs: [-1, -7], radar: [-11, 8], lounge: [8, 2.5], forge: [-2, 7.5] };
  const pets = [];
  for (const p of PETS) { const m = p.mk(); const sp = spots[p.station]; m.scale.setScalar(p.id === 'torty' ? 1.3 : p.id === 'candy' ? 1.25 : 1.9); m.position.set(sp[0], 0.2, sp[1]); m.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; wing.add(m); const t = tag(p.e + ' ' + p.name + ' · ' + p.role, 640); t.position.set(sp[0], 3.2, sp[1]); t.scale.multiplyScalar(0.75); wing.add(t); pets.push({ p, m, base: m.position.y }); }
  ST.pets = ST.pets.filter((q) => q.city !== c && q.city.built).concat([{ city: c, apt, wing, pets }]);
  const wp = (lx, lz) => new THREE.Vector3(bx0 + lx, gy + 1.2, bz0 + lz);
  const it = (lx, lz, r, label, act) => W.interactables.push({ city: c, pos: wp(lx, lz), r, label: () => (ST.owned() ? label() : '🔒 Super Travel DLC (' + ST.PRICE + ' 🎟️ at Grok Arcade) — ' + label()), act: () => (ST.owned() ? act() : ST.open('locked')) });
  it(-12, -7.5, 5, () => '🎫 Ratita Airways ticket counter (Luna) — book First / Business / Economy', () => ST.open('tickets'));
  it(-1, -7.5, 5, () => '🛃 Customs & baggage X-ray (Pi-rat) — passport stamp ' + apt.code, () => ST.customs(apt));
  it(8, 3, 6, () => '🥂 VIP First-Class Lounge (Candy K9 security)', () => ST.lounge());
  it(-11, 7.5, 5, () => '📡 Snowie\'s polar & weather radar dispatch', () => ST.radar());
  it(-2, 8, 5, () => '🐢 Torty\'s hangar forge — airframe ' + Math.round(S.airframe) + '% · gear ' + Math.round(S.gear) + '%', () => ST.open('forge'));
  it(13, -8, 5, () => '🚪 Gate boarding — Super Travel HQ', () => ST.open('tickets'));
};

// =============================================================================== GAMEPLAY
const CLASSES = {
  economy: { name: 'Economy', e: '💺', price: 8, perk: 'Pretzels, a window seat and a cup of juice.', heal: 10 },
  business: { name: 'Business', e: '🛋', price: 18, perk: 'Lie-flat seat, hot meal, warm towel.', heal: 30 },
  first: { name: 'First Class', e: '🥂', price: 35, perk: 'Champagne & caviar mini-bar, golden suite, pyjamas.', heal: 60 },
};
ST.CLASSES = CLASSES;
const stamp = (code) => { if (!S.stamps.includes(code)) { S.stamps.push(code); persist(); toast('🛂 Passport stamped: ' + code + ' (' + S.stamps.length + ' stamps)', 'good'); return true; } return false; };
ST.book = (cls, dest) => {
  const C = CLASSES[cls]; const G = SKY.Game; const city = W.city(dest); if (!C || !city) return false;
  if (!PL.spend(C.price)) { ST.render(); return false; }
  S.cls = cls; S.flights++; persist();
  const pl = G.plane, P = SKY.Player; const crashRoll = Math.random();
  logEv(C.e + ' ' + C.name + ' → ' + city.name);
  ST.close();
  if (G.state !== 'play') G.start(dest, 'passenger');
  else G.fastTravel(dest, 'gate');
  P.hp = Math.min(100, P.hp + C.heal);
  stamp(city.apt ? city.apt.code : city.id);
  if (crashRoll < 0.12) { // Tortuga Tech crash-test chaos (cartoon) → real consequence: airframe damage + repair fee
    S.airframe = Math.max(0, S.airframe - 22); S.gear = Math.max(0, S.gear - 18); persist();
    toast('🐢💥 Tortuga Tech "crash-tested" landing! Bumpy arrival at ' + city.name + ' — airframe -22%, gear -18%. Visit Torty\'s forge.', 'warn');
  } else toast(C.e + ' ' + C.name + ' with Ratita Airways → ' + city.name + '! ' + C.perk + ' (+' + C.heal + ' HP)', 'good');
  ST.checkStuck(); return true;
};
ST.customs = (apt) => {
  const r = Math.random(); stamp(apt.code);
  if (S.cargo === 'overweight' || r < 0.2) { const fee = 6; S.cargo = 'clear'; S.gear = Math.max(0, S.gear - 8); persist(); if (coins() >= fee) PL.spend(fee); toast('🏴‍☠️ Pi-rat: Arrr! Overweight uninspected cargo! Fine ' + fee + ' 🪙 and the gear took a beating (-8%).', 'warn'); }
  else { toast('🛃 Pi-rat & Candy K9 scanned your bags — all clear! 🐶 *happy sniff*', 'good'); }
  ST.checkStuck();
};
ST.lounge = () => { const P = SKY.Player; P.hp = 100; toast('🥂 VIP Lounge: champagne-flute of sparkling cider, caviar crackers and a nap — full HP! Candy guards the door. 🐶', 'good'); SKY.Audio.play('ok'); };
ST.radar = () => { const R = SKY.Remaster; const n = R && R.fronts ? R.fronts.filter((f) => f.kind === 'thunder').length : 0; toast('📡 Snowie: ' + n + ' thunder cells on radar. Weather strikes cost 15% airframe — fly around them!', 'good'); };
ST.repair = (free) => {
  if (free) { if (!(S.airframe < 30 || S.gear < 30 || coins() < 15)) { toast('🐢 Free Emergency Rebuild is for emergencies (airframe/gear < 30% or under 15 🪙)', 'warn'); return false; } }
  else if (!PL.spend(15)) { ST.render(); return false; }
  S.airframe = 100; S.gear = 100; persist(); const pl = SKY.Game.plane; if (pl) { pl.gearBroken = false; pl.wheelStolen = false; }
  toast(free ? '🐶🐢 Candy & Torty\'s 100% FREE Emergency Hangar Rebuild — 0 Coins, Never Stuck! Airframe & gear 100%.' : '🔧 Hangar Tune-Up done (15 🪙): airframe & gear 100%.', 'good'); SKY.Audio.play('ok'); logEv(free ? '🆓 Emergency rebuild' : '🔧 Paid tune-up'); ST.render(); return true;
};
ST.damage = (why, af, gr) => { S.airframe = Math.max(0, S.airframe - af); S.gear = Math.max(0, S.gear - (gr || 0)); persist(); toast('⚠ ' + why + ' — airframe ' + Math.round(S.airframe) + '%, gear ' + Math.round(S.gear) + '%', 'warn'); logEv('⚠ ' + why); ST.checkStuck(); };
ST.checkStuck = () => { if (S.airframe < 30 || S.gear < 30) toast('🐢 Airframe/gear below 30% — handling degraded! Torty\'s forge: paid tune-up or FREE emergency rebuild (Never Stuck).', 'warn'); };
// Bad Guy Mode: golden pilot wheel heist vs. the Sky Marshal
ST.heist = () => {
  const G = SKY.Game, pl = G.plane; if (!pl || pl.small || !pl.goldenWheel) { toast('🕵️ Board an airliner first — the Golden Pilot Wheel lives in the cockpit.', 'warn'); return; }
  ST.close(); S.heists++; persist();
  if (Math.random() < 0.55) { S.caught++; persist(); toast('🚨 SKY MARSHAL REX & K9 CANDY caught you sneaking into the cockpit! Cartoon cuffs + 10 🪙 fine. The wheel stays put.', 'bad'); if (coins() >= 10) PL.spend(10); logEv('🚔 Caught by the Sky Marshal'); return; }
  pl.wheelStolen = true; pl.goldenWheel.visible = false; logEv('🕵️ Stole the Golden Pilot Wheel');
  toast('🕵️ You grabbed the 3D GOLDEN PILOT WHEEL! The plane is spiralling — return it (Super Travel HQ) before it\'s too late!', 'bad'); SKY.Audio.play('error');
};
ST.returnWheel = () => { const pl = SKY.Game.plane; if (!pl || !pl.wheelStolen) return; pl.wheelStolen = false; if (pl.goldenWheel) pl.goldenWheel.visible = true; toast('🧑‍✈️ Golden Pilot Wheel returned — the captain recovers the spiral. Phew!', 'good'); ST.damage('Spiral stress', 10, 0); ST.render(); };
// watch landings and weather → real consequences
let lastGround = true, lastVy = 0;
ST.update = (dt) => {
  const G = SKY.Game, pl = G.plane; if (!pl || G.state !== 'play' || !ST.owned()) return;
  if (pl.onGround && !lastGround && !pl.crashed) { const vy = -lastVy; if (vy > 4.5) ST.damage('Hard landing (' + Math.round(vy * 196.85) + ' fpm)', Math.round(vy * 2), Math.round(vy * 3)); }
  lastGround = pl.onGround; lastVy = pl.vel.y;
  const R = SKY.Remaster; if (R && R.inFront && R.inFront.kind === 'thunder' && !pl.onGround) { ST.zapT = (ST.zapT || 0) - dt; if (ST.zapT <= 0) { ST.zapT = 30; ST.damage('Weather strike ⚡', 15, 0); } }
  if ((S.airframe < 30 || S.gear < 30) && !pl.onGround) pl.vel.multiplyScalar(1 - dt * 0.01);
  const t = G.time; for (const w of ST.pets) for (const q of w.pets) q.m.position.y = q.base + Math.abs(Math.sin(t * 3 + q.m.position.x)) * 0.12;
  if (ST.dish) ST.dish.rotation.z += dt * 0.8;
};

// =============================================================================== HQ MODAL + HUD BUTTON
let tab = 'tickets';
ST.isOpen = () => SKY.Game.ui === 'supertravel';
ST.open = (t) => { const G = SKY.Game; if (G.ui && G.ui !== 'supertravel') G.closeUI(); tab = t || tab; G.ui = 'supertravel'; G.unlockPointer(); $('stPanel').classList.add('show'); ST.render(); };
ST.close = () => { $('stPanel').classList.remove('show'); if (SKY.Game.ui === 'supertravel') SKY.Game.closeUI(); };
ST.render = () => {
  const el = $('stBody'); if (!el) return; const own = ST.owned();
  let h = '<div class="stTabs">' + [['tickets', '🎫 Passenger Travel'], ['customs', '🛃 Customs & Passport'], ['badguy', '🕵️ Bad Guy Mode'], ['forge', '🐢 Airframe Forge'], ['crew', '🐾 Pet Crew']].map((t) => '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>';
  h += '<div class="stCoins">🪙 ' + coins() + ' · ✈ Airframe <b>' + Math.round(S.airframe) + '%</b> · ⚙ Gear <b>' + Math.round(S.gear) + '%</b> · 🛂 ' + S.stamps.length + ' stamps</div>';
  if (!own) h += '<div class="stLock"><h3>🔒 Super Travel Expansion DLC</h3><p>Unlock at the <b>DLC Machine 3000</b> in Grok Arcade for <b>' + ST.PRICE + ' 🎟️</b>.</p><a class="go" href="' + ST.ARCADE + '" target="_blank" rel="noopener">OPEN GROK ARCADE</a></div>';
  else if (tab === 'tickets') {
    const cities = W.cities.filter((c) => !c.space && c.apt);
    h += '<p class="fine">Ratita Airways ✈ point A → point B as a passenger. Crash-tested by Tortuga Tech (not very thoroughly: 12% bumpy-arrival chance).</p><div class="stClasses">' + Object.keys(CLASSES).map((k) => { const C = CLASSES[k]; return '<button data-cls="' + k + '" class="stCls' + (S.cls === k ? ' on' : '') + '"><b>' + C.e + ' ' + C.name + '</b><small>' + C.perk + '</small><em>🪙 ' + C.price + '</em></button>'; }).join('') + '</div>';
    h += '<div class="stDest">' + cities.map((c) => '<button data-dest="' + c.id + '">' + (['ZAC', 'AMB', 'CUS', 'CAI'].includes(c.id) ? '🆕 ' : '') + c.name + ' <small>' + c.apt.code + '</small></button>').join('') + '</div>';
  } else if (tab === 'customs') {
    h += '<p>🏴‍☠️ <b>Pi-rat</b> runs customs; 🐶 <b>Candy</b> sniffs the bags. Visit the 🛃 X-ray arch in any Super Travel terminal to stamp your Flight Passport.</p><div class="stStamps">' + (S.stamps.length ? S.stamps.map((s) => '<span>🛂 ' + s + '</span>').join('') : '<i>No stamps yet — fly somewhere!</i>') + '</div>';
    h += '<p>Cargo status: <b>' + (S.cargo === 'overweight' ? '⚠ OVERWEIGHT (uninspected)' : '✅ clear') + '</b></p><button class="go" data-act="pack">🧳 Over-pack souvenirs (risky!)</button> <button class="go" data-act="dutyfree">🛍 Duty-free souvenir (5 🪙)</button>';
    if (S.souv.length) h += '<p class="fine">Duty-free haul: ' + S.souv.join(' ') + '</p>';
  } else if (tab === 'badguy') {
    const pl = SKY.Game.plane;
    h += '<p>🕵️ Sneak into the cockpit and steal the <b>3D Golden Pilot Wheel</b>. Without it the plane spirals! <b>Sky Marshal Rex</b> & <b>K9 Candy</b> patrol the aisle (55% chance they cuff you: 10 🪙 fine).</p><p>Heists ' + S.heists + ' · Caught ' + S.caught + '</p>';
    h += (pl && pl.wheelStolen ? '<button class="go" data-act="return">🧑‍✈️ Return the Golden Wheel (stop the spiral)</button>' : '<button class="go bad" data-act="heist">🕵️ Attempt the Golden Wheel heist</button>');
  } else if (tab === 'forge') {
    const low = S.airframe < 30 || S.gear < 30 || coins() < 15;
    h += '<p>🐢 <b>Torty (Martina)</b> inspects the Tortuga armored fuselage & landing gear. Hard landings, overweight uninspected cargo and weather strikes cause damage. Below 30% handling degrades.</p>';
    h += '<div class="stBars"><label>✈ Airframe</label><div><i style="width:' + S.airframe + '%"></i></div><label>⚙ Landing gear</label><div><i style="width:' + S.gear + '%"></i></div></div>';
    h += '<button class="go" data-act="repair">🔧 Hangar Tune-Up (15 🪙)</button> <button class="go free' + (low ? '' : ' dim') + '" data-act="free">🐶🐢 Free Emergency Hangar Rebuild (0 Coins — Never Stuck!)</button>';
    if (S.log.length) h += '<p class="fine">Log: ' + S.log.join(' · ') + '</p>';
  } else {
    h += '<div class="stCrew">' + PETS.map((p) => '<div><b>' + p.e + ' ' + p.name + '</b><small>' + p.role + '</small><i>' + p.lines[0].split(': ')[1] + '</i></div>').join('') + '</div>';
  }
  el.innerHTML = h;
  el.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; ST.render(); });
  el.querySelectorAll('[data-cls]').forEach((b) => b.onclick = () => { S.cls = b.dataset.cls; persist(); ST.render(); });
  el.querySelectorAll('[data-dest]').forEach((b) => b.onclick = () => ST.book(S.cls, b.dataset.dest));
  el.querySelectorAll('[data-act]').forEach((b) => b.onclick = () => {
    const a = b.dataset.act;
    if (a === 'heist') ST.heist(); else if (a === 'return') ST.returnWheel(); else if (a === 'repair') ST.repair(false); else if (a === 'free') ST.repair(true);
    else if (a === 'pack') { S.cargo = 'overweight'; persist(); toast('🧳 Bag stuffed with 14 alpaca plushies… overweight! Pi-rat will notice at customs.', 'warn'); ST.render(); }
    else if (a === 'dutyfree') { if (PL.spend(5)) { const s = SKY.choose(['🔺', '🦙', '🌸', '💍', '🐈', '🌋', '🍫']); S.souv.push(s); persist(); PL.addSouvenir(s, 'Duty-free'); } ST.render(); }
  });
};
function injectDom() {
  if ($('stPanel')) return;
  const css = document.createElement('style'); css.textContent = '#stPanel{max-width:760px;width:94vw;max-height:86vh;overflow:auto;background:linear-gradient(160deg,#0b1a3a,#1e3a8a);color:#f8fafc;border:2px solid #d4af37}#stPanel h2{color:#ffd23a;margin:0 0 6px}.stTabs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.stTabs button{padding:6px 10px;border-radius:10px;border:1px solid #d4af37;background:#0f172a;color:#fde68a}.stTabs button.on{background:#d4af37;color:#111}.stCoins{margin:6px 0;font-size:14px}.stClasses{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.stCls{text-align:left;padding:8px;border-radius:12px;border:1px solid #64748b;background:#0f172acc;color:#fff}.stCls.on{border:2px solid #ffd23a;background:#3b2f0b}.stCls small{display:block;opacity:.85}.stCls em{color:#ffd23a;font-style:normal}.stDest{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.stDest button{padding:6px 9px;border-radius:9px;border:1px solid #93c5fd;background:#1d4ed8;color:#fff}.stStamps span{display:inline-block;margin:3px;padding:4px 8px;border:2px dashed #fca5a5;border-radius:8px;color:#fecaca;transform:rotate(-4deg)}.stBars{display:grid;grid-template-columns:120px 1fr;gap:6px;align-items:center;margin:8px 0}.stBars div{height:14px;background:#334155;border-radius:7px;overflow:hidden}.stBars i{display:block;height:100%;background:linear-gradient(90deg,#ef4444,#facc15,#22c55e)}#stPanel .go.free{background:#16a34a}#stPanel .go.dim{opacity:.6}#stPanel .go.bad{background:#b91c1c}.stCrew{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.stCrew div{background:#0f172acc;border:1px solid #d4af37;border-radius:12px;padding:8px}.stCrew small,.stCrew i{display:block;font-size:12px;opacity:.9}#stBtn{position:fixed;right:8px;top:36%;z-index:30;padding:7px 10px;border-radius:12px;border:2px solid #d4af37;background:#1e3a8aee;color:#ffd23a;font:bold 12px system-ui;display:none}body.playing #stBtn{display:block}.stLock{text-align:center}';
  document.head.appendChild(css);
  const p = document.createElement('div'); p.id = 'stPanel'; p.className = 'panel'; p.innerHTML = '<div class="pp-head"><h2>✈️ Ratita Airways · Super Travel HQ</h2><button id="st-x">✕</button></div><div id="stBody"></div>'; document.body.appendChild(p);
  $('st-x').onclick = () => ST.close();
  const b = document.createElement('button'); b.id = 'stBtn'; b.type = 'button'; b.textContent = '✈️ SUPER TRAVEL'; b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (ST.isOpen()) ST.close(); else ST.open(); }); document.body.appendChild(b);
  const card = document.querySelector('#title .card'); if (card) { const a = document.createElement('div'); a.id = 'stBadge'; a.className = 'fhTitleBadge'; a.textContent = ST.owned() ? '✈️ SUPER TRAVEL EXPANSION UNLOCKED · press U or tap ✈️ SUPER TRAVEL in game' : '✈️ NEW DLC: SUPER TRAVEL EXPANSION 🔒'; card.insertBefore(a, card.firstChild); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectDom); else injectDom();
addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; const G = SKY.Game; if (!G || G.state !== 'play') return; if (e.code === 'KeyU') { if (ST.isOpen()) ST.close(); else ST.open(); } });
addEventListener('storage', (e) => { if (e.key === ST.KEY) { const a = $('stBadge'); if (a) a.textContent = '✈️ SUPER TRAVEL EXPANSION UNLOCKED'; } });
// hooks
const G = SKY.Game;
const oClose = G.closeUI; G.closeUI = function () { const p = $('stPanel'); if (p) p.classList.remove('show'); return oClose.apply(this, arguments); };
const oUpd = G.update; G.update = function (dt) { const r = oUpd.apply(this, arguments); try { ST.update(dt); } catch (e) { if (!ST.err) { ST.err = 1; console.warn('supertravel', e); } } return r; };
})();
