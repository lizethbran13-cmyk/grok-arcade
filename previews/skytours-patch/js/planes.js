// Grok Snowie Sky Tours - the hangar fleet: seven real 3D aircraft (3 copters, 4 fixed-wing), each with its own handling,
// plus layered crash damage (scuffs -> dents + smoke -> bent parts, taped patches). Forward is +z, wheels/skids sit on y=0.
import * as THREE from 'three';
import { Builder, P, blob } from './geo.js?v=st6';
import { compact } from './compact.js?v=st6';
import { MATS } from './mats.js?v=st6';
import { textGeo } from './text3d.js?v=st6';
const PI = Math.PI;
// kind: heli (hover, stick = fly that way) | wing (always flying forward, min speed, rolls out on landing)
// spd = top speed, acc = response, climb = m/s, turn = rad/s (wing), arm = damage taken x, rep = repair cost x, fare = payout x
export const PLANES = [
  { id: 'classic', name: 'Snowie Classic', kind: 'heli', price: 0, spd: 30, acc: 1.4, climb: 11, turn: 2.2, arm: 1.0, rep: 1.0, fare: 1.0, emoji: '🚁', desc: 'The bubble copter that started it all. Hovers anywhere, lands anywhere.' },
  { id: 'rescue', name: 'Rescue Ranger', kind: 'heli', price: 180, spd: 35, acc: 1.9, climb: 13, turn: 2.6, arm: 0.85, rep: 1.2, fare: 1.1, emoji: '🚑', desc: 'Zippy red rescue heli with a winch arm and a searchlight. Tough and quick.' },
  { id: 'twin', name: 'Big Bertha Twin-Rotor', kind: 'heli', price: 320, spd: 26, acc: 1.0, climb: 8, turn: 1.6, arm: 0.6, rep: 1.4, fare: 1.6, emoji: '🚛', desc: 'Two rotors, room for a whole tour group. Slow, steady and super sturdy.' },
  { id: 'biplane', name: 'Barnstormer Biplane', kind: 'wing', price: 120, spd: 32, min: 11, acc: 1.3, climb: 9, turn: 1.7, arm: 1.1, rep: 0.8, fare: 1.0, emoji: '🛩️', desc: 'Two wings, open cockpit, wind in your whiskers. Loops not included (yet).' },
  { id: 'seaplane', name: 'Lake Skipper Seaplane', kind: 'wing', price: 220, spd: 35, min: 12, acc: 1.2, climb: 9, turn: 1.5, arm: 0.9, rep: 1.0, fare: 1.2, water: true, emoji: '🌊', desc: 'Floats instead of wheels: land on Lake Shimmer or Frost Pond like a duck.' },
  { id: 'cargo', name: 'Cheddar Cargo Hauler', kind: 'wing', price: 380, spd: 38, min: 14, acc: 0.9, climb: 7, turn: 1.0, arm: 0.6, rep: 1.4, fare: 1.7, emoji: '📦', desc: 'Chunky twin-prop freighter. Big fares, big wings, big turning circle.' },
  { id: 'jet', name: 'Comet Jet', kind: 'wing', price: 520, spd: 58, min: 19, acc: 1.6, climb: 16, turn: 1.3, arm: 1.2, rep: 1.6, fare: 1.3, emoji: '✈️', desc: 'The fastest thing in the valley. Needs a long runway and a gentle touch.' },
];
export const PLANE = (id) => PLANES.find((p) => p.id === id) || PLANES[0];
export const PAINTS = [{ n: 'Snowie Classic', a: 0xffffff, b: 0xff4fa0 }, { n: 'Sky Cyan', a: 0x3ff0ff, b: 0xffffff }, { n: 'Sunny Bee', a: 0xffd23f, b: 0x111827 }, { n: 'Mint Chip', a: 0x86efac, b: 0x7c3f2c }, { n: 'Grape Soda', a: 0xa78bfa, b: 0xffd23f }, { n: 'Rescue Red', a: 0xef4444, b: 0xffffff }];
const MB = () => ({ f: new Builder(), g: new Builder(), m: new Builder(), l: new Builder(), x: new Builder(), e: new Builder() });
// FREE_CPU: static display copies (lineup + hangar lift) drop their CPU-side arrays once uploaded to the GPU (no visual change)
let FREE_CPU = false; const freeArr = function () { this.array = new this.array.constructor(0); };
export function meshFrom(b, shadow = true) { const g = new THREE.Group(); for (const k in b) { if (!b[k].parts.length) continue; const geo = compact(b[k].build(), k); if (FREE_CPU) { for (const a in geo.attributes) geo.attributes[a].onUpload(freeArr); if (geo.index) geo.index.onUpload(freeArr); } const m = new THREE.Mesh(geo, MATS[k]); m.castShadow = shadow && k !== 'l' && k !== 'e'; m.receiveShadow = k !== 'l'; if (k === 'e') { m.renderOrder = 2; m.userData.glass = true; } g.add(m); } return g; }
// ---- shape helpers (all smooth primitives) ----
const SCORCH = [blob(3, 0.32, 2), blob(11, 0.3, 2), blob(23, 0.34, 2)];
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
function rod(B, col, p, q, r) { _a.set(...p); _b.set(...q); const L = _a.distanceTo(_b); _b.sub(_a).normalize(); _q.setFromUnitVectors(Y, _b); _e.setFromQuaternion(_q, 'XYZ'); B.add(P.cyl, col, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2, _e.x, _e.y, _e.z, r, L, r); }
// fuselage capsule lying along z: width, length, height
const fuse = (B, col, x, y, z, w, len, h, rx = 0) => B.add(P.capsule, col, x, y, z, PI / 2 + rx, 0, 0, w, len / 2, h);
// smooth wing: capsule along x (rounded leading/trailing edges + tips); ry sweeps it, rz adds dihedral
const wingC = (B, col, x, y, z, span, chord, th, ry = 0, rz = 0) => B.add(P.capsule, col, x, y, z, 0, ry, PI / 2 + rz, th, span / 2, chord);
const wheel = (B, x, y, z, r, w = 0.22) => { B.x.add(P.cyl, 0x1f2937, x, y, z, 0, 0, PI / 2, r, w, r); B.x.add(P.cyl, 0xcbd5e1, x, y, z, 0, 0, PI / 2, r * 0.45, w + 0.02, r * 0.45); };
function propeller(n, R, col = 0x1f2937, tip = 0xffd23f) { const b = MB(); for (let i = 0; i < n; i++) { const a = i / n * PI * 2; b.g.add(P.rboxS, col, Math.sin(a) * R / 2, Math.cos(a) * R / 2, 0, 0.35, 0, -a, 0.3, R, 0.06); b.g.add(P.rboxS, tip, Math.sin(a) * (R - 0.12), Math.cos(a) * (R - 0.12), 0.01, 0.18, 0, -a, 0.21, 0.24, 0.06); } b.x.add(P.sphere, 0xcbd5e1, 0, 0, 0, 0, 0, 0, 0.16, 0.16, 0.12); return meshFrom(b, true); }
function rotor(n, R, col = 0x1f2937, tip = 0xff4fa0) { const b = MB(); for (let i = 0; i < n; i++) { const a = i / n * PI * 2; b.g.add(P.rboxS, col, Math.cos(a) * R / 2, 0, Math.sin(a) * R / 2, 0, -a, 0.05, R, 0.06, 0.32); b.g.add(P.rboxS, tip, Math.cos(a) * (R - 0.2), 0.01, Math.sin(a) * (R - 0.2), 0, -a, 0, 0.36, 0.07, 0.34); } b.x.add(P.sphere, 0x94a3b8, 0, 0.08, 0, 0, 0, 0, 0.32, 0.16, 0.32); return meshFrom(b, true); }
function tailRotor(R = 1.3) { const b = MB(); for (let i = 0; i < 2; i++) b.g.add(P.rboxS, 0x1f2937, 0, 0, 0, i * PI / 2, 0, 0, 0.05, R, 0.14); return meshFrom(b, false); }
const disc = (R) => { const m = new THREE.Mesh(new THREE.CircleGeometry(R, 40), new THREE.MeshBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -PI / 2; return m; };
const label = (B, s, size, col, x, y, z, ry) => { const tg = textGeo(s, size, size * 0.18); if (tg) B.add(tg, col, x, y, z, 0, ry, 0); };
const lights = (b, xl, xr, y, z, tail) => { b.l.add(P.sphere, 0xff3b3b, xl, y, z, 0, 0, 0, 0.09, 0.09, 0.09, 1.2); b.l.add(P.sphere, 0x3bff6b, xr, y, z, 0, 0, 0, 0.09, 0.09, 0.09, 1.2); if (tail) b.l.add(P.sphere, 0xffffff, tail[0], tail[1], tail[2], 0, 0, 0, 0.08, 0.08, 0.08, 1.4); };
// ---------------- the seven models ----------------
// each returns { body, spin: [{o, ax: 'y'|'z'|'x', k}], discs, seat: {pilot, snowie, eye}, smoke, dents: [[x,y,z,s]], bend: {at, parts}, rad, len, span }
const MODELS = {
  classic(A, B) { const b = MB();
    b.g.add(P.capsule, A, 0, 1.45, 0.2, PI / 2, 0, 0, 2.0, 2.4, 1.9); b.g.add(P.capsule, B, 0, 1.0, 0.2, PI / 2, 0, 0, 2.04, 1.8, 1.0);
    b.e.add(P.sphere, 0xbfe9ff, 0, 1.75, 1.15, 0, 0, 0, 0.95, 0.85, 1.05); [-1, 1].forEach((s) => b.e.add(P.rbox, 0xbfe9ff, s * 1.0, 1.8, 0.0, 0, 0, 0, 0.06, 0.7, 1.1));
    b.g.add(P.cyl, A, 0, 1.75, -2.9, PI / 2, 0, 0, 0.3, 3.6, 0.36); b.g.add(P.cyl, B, 0, 1.75, -2.9, PI / 2, 0, 0, 0.32, 0.5, 0.38);
    b.g.add(P.rbox, B, 0, 2.4, -4.6, 0.25, 0, 0, 0.12, 1.3, 0.8); b.g.add(P.rbox, A, 0, 1.75, -4.4, 0, 0, 0, 1.6, 0.1, 0.5);
    [-1, 1].forEach((s) => b.g.add(P.sphere, 0xffb3d1, s * 0.22, 2.95, -4.75, 0, 0, 0, 0.18, 0.18, 0.06));
    b.x.add(P.cyl, 0x94a3b8, 0, 2.6, 0.1, 0, 0, 0, 0.14, 0.5, 0.14); b.x.add(P.sphere, 0x94a3b8, 0, 2.95, 0.1, 0, 0, 0, 0.3, 0.18, 0.3);
    [-1, 1].forEach((s) => { b.x.add(P.cyl, 0x64748b, s * 0.9, 0.06, 0.2, PI / 2, 0, 0, 0.08, 3.4, 0.08); b.x.add(P.sphere, 0x64748b, s * 0.9, 0.06, 1.9, 0, 0, 0, 0.08); [-0.8, 1.2].forEach((z) => b.x.add(P.cyl, 0x64748b, s * 0.78, 0.4, z, 0, 0, s * 0.35, 0.06, 0.75, 0.06)); });
    lights(b, -1.0, 1.0, 1.1, 0.9, [0, 1.75, -4.9]); b.f.add(P.rbox, 0x334155, 0, 1.0, 0.2, 0, 0, 0, 1.6, 0.4, 2.2);
    label(b.g, 'SKY TOURS', 0.22, B === 0xffffff ? 0xff4fa0 : 0xffffff, 1.03, 1.0, 0.2, PI / 2); label(b.g, 'SKY TOURS', 0.22, B === 0xffffff ? 0xff4fa0 : 0xffffff, -1.03, 1.0, 0.2, -PI / 2);
    const body = meshFrom(b), r = rotor(4, 4.4), t = tailRotor(), d = disc(4.7); r.position.set(0, 3.05, 0.1); t.position.set(0.2, 2.4, -4.75); d.position.set(0, 3.1, 0.1); body.add(r, t, d);
    return { body, spin: [{ o: r, ax: 'y', k: 40 }, { o: t, ax: 'x', k: 50 }], discs: [d], seat: { pilot: [-0.5, 0.95, 0.5], snowie: [0.5, 1.15, 0.6], eye: [-0.45, 2.05, 0.75] }, smoke: [0, 2.7, -0.6], dents: [[1.0, 1.5, -0.4, 0.3], [-0.95, 1.2, 0.8, 0.26], [0.3, 2.3, -0.6, 0.24], [-0.3, 1.8, -2.4, 0.2], [0.8, 0.8, 1.2, 0.22], [-1.0, 1.8, -0.5, 0.28]], bend: { at: [0, 2.4, -4.6], fin: [0.12, 1.3, 0.8, B] }, rad: 2.4, len: 10, span: 9.4 }; },
  rescue(A, B) { const b = MB(), R = 0xef4444, W = 0xffffff, red = A === 0xffffff ? R : A, acc = A === 0xffffff ? W : B;
    fuse(b.g, red, 0, 1.55, 0.3, 1.85, 5.6, 1.95); fuse(b.g, acc, 0, 1.05, 0.3, 1.9, 4.6, 0.9);
    b.e.add(P.sphere, 0xbfe9ff, 0, 1.7, 2.1, -0.15, 0, 0, 0.88, 0.8, 1.05); [-1, 1].forEach((s) => { b.e.add(P.rbox, 0xbfe9ff, s * 0.92, 1.8, 0.7, 0, 0, 0, 0.06, 0.65, 1.0); b.g.add(P.rbox, 0x334155, s * 0.93, 1.55, -0.6, 0, 0, 0, 0.05, 1.3, 1.1); b.x.add(P.rboxS, 0x94a3b8, s * 0.97, 2.25, -0.6, 0, 0, 0, 0.06, 0.06, 1.4); });
    b.g.add(P.cone, red, 0, 1.85, -3.6, -PI / 2, 0, 0, 0.42, 4.4, 0.42); b.g.add(P.torus, red, 0, 2.05, -5.6, 0, PI / 2, 0, 0.75, 0.75, 1.1); b.e.add(P.cyl, 0x1f2937, 0, 2.05, -5.6, 0, 0, PI / 2, 0.62, 0.12, 0.62);
    b.g.add(P.rbox, acc, 0, 2.9, -5.5, 0.35, 0, 0, 0.12, 1.4, 0.9); [-1, 1].forEach((s) => b.g.add(P.rbox, red, s * 0.8, 1.9, -4.6, 0, 0, s * 0.2, 1.1, 0.08, 0.5));
    // white rescue cross + label
    [-1, 1].forEach((s) => { b.g.add(P.rboxS, W, s * 0.97, 1.55, -1.9, 0, 0, 0, 0.04, 0.7, 0.24); b.g.add(P.rboxS, W, s * 0.97, 1.55, -1.9, 0, 0, 0, 0.04, 0.24, 0.7); }); label(b.g, 'RESCUE', 0.2, W, 0.97, 1.05, 0.9, PI / 2); label(b.g, 'RESCUE', 0.2, W, -0.97, 1.05, 0.9, -PI / 2);
    // winch arm + searchlight + mast + wheels on sponsons
    b.x.add(P.rboxS, 0x64748b, 1.25, 2.55, 0.2, 0, 0, 0, 0.7, 0.14, 0.14); b.x.add(P.cyl, 0x64748b, 1.55, 2.25, 0.2, 0, 0, 0, 0.03, 0.6, 0.03); b.x.add(P.torus, 0xffd23f, 1.55, 1.9, 0.2, 0, 0, 0, 0.12, 0.12, 0.12);
    b.x.add(P.sphere, 0x334155, 0, 0.7, 1.9, 0, 0, 0, 0.26); b.l.add(P.sphere, 0xfff3c4, 0, 0.66, 2.12, 0, 0, 0, 0.18, 0.18, 0.08, 1.4);
    b.x.add(P.cyl, 0x94a3b8, 0, 2.65, 0.2, 0, 0, 0, 0.16, 0.5, 0.16); b.x.add(P.sphere, 0x94a3b8, 0, 2.95, 0.2, 0, 0, 0, 0.32, 0.2, 0.32);
    [-1, 1].forEach((s) => { b.g.add(P.capsule, acc, s * 1.05, 0.75, -0.2, PI / 2, 0, 0, 0.45, 0.9, 0.4); wheel(b, s * 1.05, 0.34, -0.2, 0.34); }); wheel(b, 0, 0.3, 2.0, 0.28);
    lights(b, -0.95, 0.95, 1.2, 1.4, [0, 2.05, -6.3]); b.l.add(P.sphere, 0x3b82f6, 0, 2.6, -0.8, 0, 0, 0, 0.14, 0.1, 0.14, 1.4); b.f.add(P.rbox, 0x334155, 0, 1.0, 0.6, 0, 0, 0, 1.5, 0.4, 2.0);
    const body = meshFrom(b), r = rotor(5, 4.8, 0x1f2937, 0xffffff), t = tailRotor(1.05), d = disc(5.1); r.position.set(0, 3.1, 0.2); t.position.set(0, 2.05, -5.6); d.position.set(0, 3.15, 0.2); body.add(r, t, d);
    return { body, spin: [{ o: r, ax: 'y', k: 44 }, { o: t, ax: 'x', k: 60 }], discs: [d], seat: { pilot: [-0.45, 0.95, 1.0], snowie: [0.45, 1.15, 1.1], eye: [-0.42, 2.05, 1.3] }, smoke: [0, 2.8, -0.8], dents: [[0.95, 1.7, 0.2, 0.3], [-0.93, 1.3, -0.4, 0.26], [0.2, 2.4, -1.4, 0.24], [0.35, 1.9, -3.4, 0.2], [-0.8, 0.9, 1.4, 0.22], [-0.6, 2.2, 0.6, 0.25]], bend: { at: [0, 2.9, -5.5], fin: [0.12, 1.4, 0.9, acc] }, rad: 2.5, len: 11.5, span: 10 }; },
  twin(A, B) { const b = MB(), body2 = A === 0xffffff ? 0x84cc16 : A;
    b.g.add(P.rbox, body2, 0, 2.15, 0, 0, 0, 0, 2.4, 2.5, 10.4); b.g.add(P.rbox, B, 0, 1.25, 0, 0, 0, 0, 2.44, 0.5, 10.44);
    b.g.add(P.sphere, body2, 0, 2.05, 5.0, 0, 0, 0, 1.2, 1.25, 1.2); b.e.add(P.sphere, 0xbfe9ff, 0, 2.45, 5.55, -0.25, 0, 0, 0.98, 0.7, 0.75);
    b.g.add(P.rbox, body2, 0, 3.7, 4.4, 0, 0, 0, 1.2, 0.9, 2.0); b.g.add(P.rbox, body2, 0, 4.1, -4.3, -0.1, 0, 0, 1.3, 2.0, 2.6); b.g.add(P.rbox, B, 0, 3.4, -4.6, 0, 0, 0, 1.36, 0.25, 2.6);
    for (let i = 0; i < 6; i++) [-1, 1].forEach((s) => b.e.add(P.rbox, 0xbfe9ff, s * 1.22, 2.6, 3.0 - i * 1.3, 0, 0, 0, 0.05, 0.5, 0.6));
    b.g.add(P.rbox, 0x475569, 0, 1.6, -5.25, 0.25, 0, 0, 2.1, 1.6, 0.12); [-1, 1].forEach((s) => { b.g.add(P.capsule, B, s * 1.35, 1.0, 0, PI / 2, 0, 0, 0.55, 2.8, 0.7); [-2.2, 2.6].forEach((z) => wheel(b, s * 1.4, 0.4, z, 0.4, 0.28)); });
    label(b.g, 'BIG BERTHA', 0.28, 0xffffff, 1.23, 1.25, -0.6, PI / 2); label(b.g, 'BIG BERTHA', 0.28, 0xffffff, -1.23, 1.25, -0.6, -PI / 2);
    lights(b, -1.25, 1.25, 1.6, 4.5, [0, 5.2, -5.4]); b.l.add(P.sphere, 0xffd23f, 0, 3.45, 0, 0, 0, 0, 0.14, 0.1, 0.14, 1.4); b.f.add(P.rbox, 0x334155, 0, 1.4, 4.4, 0, 0, 0, 1.8, 0.4, 1.4);
    const body = meshFrom(b), r1 = rotor(3, 4.5, 0x1f2937, 0xffd23f), r2 = rotor(3, 4.5, 0x1f2937, 0xffd23f), d1 = disc(4.8), d2 = disc(4.8); r1.position.set(0, 4.25, 4.4); r2.position.set(0, 5.2, -4.3); d1.position.set(0, 4.3, 4.4); d2.position.set(0, 5.25, -4.3); body.add(r1, r2, d1, d2);
    return { body, spin: [{ o: r1, ax: 'y', k: 34 }, { o: r2, ax: 'y', k: -34 }], discs: [d1, d2], seat: { pilot: [-0.5, 1.45, 4.5], snowie: [0.5, 1.65, 4.6], eye: [-0.45, 2.55, 4.9] }, smoke: [0, 4.6, -3.6], dents: [[1.22, 2.2, 1.0, 0.36], [-1.22, 2.6, -2.0, 0.34], [0.5, 3.4, 0.0, 0.3], [1.22, 1.8, -3.2, 0.3], [-1.2, 1.6, 2.2, 0.3], [-0.5, 3.45, -1.6, 0.3]], bend: { at: [0, 1.6, -5.25], ramp: true }, rad: 2.6, len: 12, span: 9.6 }; },
  biplane(A, B) { const b = MB();
    fuse(b.g, A, 0, 1.55, 0.4, 1.15, 6.0, 1.25); b.g.add(P.cone, A, 0, 1.65, -3.5, -PI / 2, 0, 0, 0.56, 2.6, 0.6); b.g.add(P.capsule, B, 0, 1.25, 0.4, PI / 2, 0, 0, 1.18, 2.4, 0.6);
    b.g.add(P.cyl, B, 0, 1.6, 3.15, PI / 2, 0, 0, 0.66, 0.9, 0.66); b.x.add(P.torus, 0x475569, 0, 1.6, 2.7, 0, 0, 0, 0.62, 0.62, 0.4);
    for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => b.x.add(P.cyl, 0x64748b, s * 0.55, 1.15 + i * 0.12, 2.5 - i * 0.35, 0, 0, s * 0.9, 0.06, 0.5, 0.06)); // exhaust stubs
    wingC(b.g, A, 0, 0.95, 1.0, 8.6, 1.55, 0.17, 0, 0.03); wingC(b.g, A, 0, 2.95, 1.25, 9.0, 1.6, 0.17);
    [-1, 1].forEach((s) => { [[3.4, 0.45], [3.4, 1.8]].forEach(([x, z]) => rod(b.x, 0x7c4a1e, [s * x, 1.05, z], [s * x, 2.88, z + 0.15], 0.05)); rod(b.x, 0x7c4a1e, [s * 0.45, 2.0, 0.7], [s * 0.6, 2.88, 0.9], 0.045); rod(b.x, 0x7c4a1e, [s * 0.45, 2.0, 1.7], [s * 0.6, 2.88, 1.9], 0.045);
      b.g.add(P.cyl, B, s * 3.5, 3.05, 1.25, 0, 0, 0, 0.5, 0.03, 0.5); b.g.add(P.cyl, 0xffffff, s * 3.5, 3.065, 1.25, 0, 0, 0, 0.3, 0.03, 0.3); b.g.add(P.rboxS, B, s * 4.25, 2.95, 1.25, 0, 0, 0, 0.55, 0.19, 1.62); b.g.add(P.rboxS, B, s * 4.1, 0.95, 1.0, 0, 0, 0, 0.55, 0.19, 1.57);
      rod(b.x, 0x475569, [s * 1.05, 0.38, 1.5], [s * 0.4, 1.2, 1.2], 0.06); rod(b.x, 0x475569, [s * 1.05, 0.38, 1.5], [s * 0.4, 1.1, 2.2], 0.06); wheel(b, s * 1.1, 0.4, 1.5, 0.4, 0.2); });
    wingC(b.g, A, 0, 1.75, -4.6, 3.2, 0.9, 0.1); b.g.add(P.rbox, B, 0, 2.4, -4.65, 0.3, 0, 0, 0.1, 1.2, 1.0); b.x.add(P.sphere, 0x1f2937, 0, 0.3, -4.5, 0, 0, 0, 0.12); rod(b.x, 0x475569, [0, 0.3, -4.5], [0, 1.3, -4.2], 0.04);
    b.x.add(P.torus, 0x7c4a1e, 0, 2.18, -0.6, PI / 2, 0, 0, 0.55, 0.65, 0.5); b.x.add(P.torus, 0x7c4a1e, 0, 2.18, 1.0, PI / 2, 0, 0, 0.48, 0.55, 0.45); b.e.add(P.rbox, 0xbfe9ff, 0, 2.38, 0.15, -0.35, 0, 0, 0.7, 0.4, 0.05);
    lights(b, -4.5, 4.5, 3.0, 1.25, [0, 2.95, -5.1]); b.f.add(P.rbox, 0x7c3f2c, 0, 1.55, -0.6, 0, 0, 0, 0.9, 0.3, 0.9);
    const body = meshFrom(b), pr = propeller(2, 1.55, 0x7c4a1e, B === 0xffffff ? 0xff4fa0 : B); pr.position.set(0, 1.6, 3.75); b.x.parts.length; body.add(pr); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 20).rotateX(PI / 2), MATS.g); body.add(cone); cone.position.set(0, 1.6, 3.95);
    return { body, spin: [{ o: pr, ax: 'z', k: 45 }], discs: [], seat: { pilot: [0, 1.25, -0.65], snowie: [0, 1.5, 0.95], eye: [0, 3.15, -0.3] }, smoke: [0, 2.2, 2.6], dents: [[0.58, 1.6, 0.3, 0.26], [-0.58, 1.4, -1.0, 0.24], [2.6, 3.05, 1.2, 0.28], [-2.2, 1.05, 0.9, 0.26], [0.3, 2.0, -2.4, 0.2], [-3.6, 3.0, 1.5, 0.24]], bend: { at: [0, 2.4, -4.65], fin: [0.1, 1.2, 1.0, B] }, rad: 2.2, len: 9, span: 9 }; },
  seaplane(A, B) { const b = MB();
    fuse(b.g, A, 0, 2.55, 0.3, 1.35, 5.6, 1.55); b.g.add(P.cone, A, 0, 2.75, -3.7, -PI / 2, 0, 0, 0.66, 3.2, 0.7); b.g.add(P.capsule, B, 0, 2.2, 0.3, PI / 2, 0, 0, 1.38, 2.0, 0.55);
    b.e.add(P.sphere, 0xbfe9ff, 0, 3.0, 1.75, -0.4, 0, 0, 0.62, 0.48, 0.8); [-1, 1].forEach((s) => [0.7, -0.4].forEach((z) => b.e.add(P.rbox, 0xbfe9ff, s * 0.66, 2.85, z, 0, 0, 0, 0.06, 0.48, 0.8)));
    b.g.add(P.cyl, B, 0, 2.6, 3.05, PI / 2, 0, 0, 0.6, 0.6, 0.6); wingC(b.g, A, 0, 3.5, 0.6, 10.6, 1.65, 0.2);
    [-1, 1].forEach((s) => { b.g.add(P.rboxS, B, s * 4.9, 3.5, 0.6, 0, 0, 0, 0.8, 0.22, 1.66); rod(b.x, 0x94a3b8, [s * 0.65, 2.05, 0.5], [s * 3.0, 3.4, 0.6], 0.06);
      fuse(b.g, 0xffffff, s * 1.65, 0.5, 0.4, 0.62, 6.6, 0.62); b.g.add(P.capsule, B, s * 1.65, 0.35, 0.4, PI / 2, 0, 0, 0.64, 2.9, 0.3); b.g.add(P.sphere, 0xffffff, s * 1.65, 0.62, 3.55, 0.4, 0, 0, 0.3, 0.26, 0.5);
      [[-0.6, 1.0], [1.6, 2.1]].forEach(([z, zz]) => rod(b.x, 0x64748b, [s * 1.65, 0.8, z], [s * 0.55, 2.0, zz - 0.4], 0.055)); b.x.add(P.rboxS, 0x334155, s * 1.65, 0.3, -2.9, 0, 0, 0, 0.04, 0.4, 0.3); });
    wingC(b.g, A, 0, 2.95, -5.0, 3.6, 1.0, 0.12); b.g.add(P.rbox, B, 0, 3.75, -5.1, 0.35, 0, 0, 0.12, 1.5, 1.2); label(b.g, 'LAKE SKIPPER', 0.18, B === 0xffffff ? 0x0ea5e9 : 0xffffff, 0.69, 2.2, -0.9, PI / 2); label(b.g, 'LAKE SKIPPER', 0.18, B === 0xffffff ? 0x0ea5e9 : 0xffffff, -0.69, 2.2, -0.9, -PI / 2);
    lights(b, -5.25, 5.25, 3.5, 0.6, [0, 4.4, -5.6]); b.f.add(P.rbox, 0x334155, 0, 2.05, 0.7, 0, 0, 0, 1.0, 0.3, 1.6);
    const body = meshFrom(b), pr = propeller(3, 1.5, 0x1f2937, 0xffd23f); pr.position.set(0, 2.6, 3.45); body.add(pr); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 20).rotateX(PI / 2), MATS.g); cone.position.set(0, 2.6, 3.65); body.add(cone);
    return { body, spin: [{ o: pr, ax: 'z', k: 45 }], discs: [], seat: { pilot: [-0.32, 1.95, 1.0], snowie: [0.32, 2.15, 1.05], eye: [-0.3, 3.45, 1.2] }, smoke: [0, 3.3, 2.4], dents: [[0.68, 2.6, 0.0, 0.26], [-0.66, 2.4, -1.2, 0.24], [3.3, 3.62, 0.6, 0.28], [-2.4, 3.62, 0.4, 0.26], [1.65, 0.75, 1.4, 0.24], [0.3, 3.2, -2.4, 0.22]], bend: { at: [0, 3.75, -5.1], fin: [0.12, 1.5, 1.2, B] }, rad: 2.4, len: 9.2, span: 10.6 }; },
  jet(A, B) { const b = MB(), acc = B;
    fuse(b.g, A, 0, 1.55, -0.2, 1.25, 8.4, 1.25); b.g.add(P.cone, acc, 0, 1.55, 4.65, PI / 2, 0, 0, 0.6, 1.9, 0.6); b.g.add(P.capsule, acc, 0, 1.25, -0.2, PI / 2, 0, 0, 1.28, 3.6, 0.5);
    b.e.add(P.sphere, 0x9fd8ff, 0, 2.15, 1.6, 0, 0, 0, 0.55, 0.5, 1.55); b.x.add(P.torus, 0x475569, 0, 1.92, 1.6, PI / 2, 0, 0, 0.56, 1.5, 0.25);
    [-1, 1].forEach((s) => { const sw = 0.55, L = 3.9, cx = s * (0.5 + L / 2 * Math.cos(sw)), cz = -0.8 - L / 2 * Math.sin(sw); wingC(b.g, A, cx, 1.35, cz, L, 2.3, 0.14, s * sw, s * 0.05); b.g.add(P.rboxS, acc, s * (0.5 + L * 0.92 * Math.cos(sw)), 1.4, -0.8 - L * 0.92 * Math.sin(sw), 0, s * sw, 0, 0.5, 0.17, 1.0);
      const fx = s * 0.7; b.g.add(P.rbox, A, fx, 2.55, -3.6, -0.5, 0, s * -0.3, 0.12, 1.7, 1.3); wingC(b.g, A, s * 1.25, 1.55, -3.9, 1.9, 1.0, 0.1, s * 0.5, 0);
      b.x.add(P.rbox, 0x334155, s * 0.75, 1.45, 1.2, 0, 0, 0, 0.35, 0.6, 1.4); b.x.add(P.cyl, 0x334155, s * 0.36, 1.45, -4.45, PI / 2, 0, 0, 0.36, 0.7, 0.36); b.l.add(P.cyl, 0xff8a1a, s * 0.36, 1.45, -4.82, PI / 2, 0, 0, 0.26, 0.04, 0.26, 1.6);
      rod(b.x, 0x64748b, [s * 1.3, 0.35, -0.9], [s * 1.0, 1.2, -0.7], 0.06); wheel(b, s * 1.35, 0.32, -0.9, 0.32, 0.22); });
    rod(b.x, 0x64748b, [0, 0.3, 3.0], [0, 1.2, 2.8], 0.06); wheel(b, 0, 0.27, 3.0, 0.27, 0.18); label(b.g, 'COMET', 0.26, acc === 0xffffff ? 0xff4fa0 : 0xffffff, 0.64, 1.3, -1.8, PI / 2); label(b.g, 'COMET', 0.26, acc === 0xffffff ? 0xff4fa0 : 0xffffff, -0.64, 1.3, -1.8, -PI / 2);
    lights(b, -3.6, 3.6, 1.4, -2.9, [0, 3.3, -4.2]); b.f.add(P.rbox, 0x334155, 0, 1.6, 1.1, 0, 0, 0, 0.7, 0.3, 2.2);
    const body = meshFrom(b); return { body, spin: [], discs: [], jet: [[-0.36, 1.45, -4.9], [0.36, 1.45, -4.9]], seat: { pilot: [0, 1.25, 2.0], snowie: [0, 1.45, 0.9], eye: [0, 3.05, 2.35] }, smoke: [0, 1.9, -4.0], dents: [[0.62, 1.6, 0.4, 0.26], [-0.62, 1.4, -1.4, 0.24], [2.2, 1.48, -1.9, 0.28], [-1.8, 1.48, -1.6, 0.26], [0.2, 2.1, -2.6, 0.2], [0.6, 2.6, -3.6, 0.2]], bend: { at: [0.7, 2.55, -3.6], fin: [0.12, 1.7, 1.3, A], rz: -0.3 }, rad: 2.3, len: 11, span: 8.8 }; },
  cargo(A, B) { const b = MB(), body2 = A === 0xffffff ? 0xfde68a : A;
    fuse(b.g, body2, 0, 2.3, 0.4, 2.5, 10.4, 2.5); b.g.add(P.cone, body2, 0, 2.85, -6.4, -PI / 2 + 0.1, 0, 0, 1.25, 4.4, 1.2); b.g.add(P.capsule, B, 0, 1.6, 0.4, PI / 2, 0, 0, 2.53, 4.4, 0.9);
    b.e.add(P.capsule, 0x9fd8ff, 0, 3.0, 4.35, PI / 2 - 0.5, 0, 0, 1.7, 0.5, 0.9); for (let i = 0; i < 5; i++) [-1, 1].forEach((s) => b.e.add(P.sphere, 0xbfe9ff, s * 1.22, 2.7, 2.4 - i * 1.4, 0, 0, 0, 0.06, 0.32, 0.32));
    wingC(b.g, body2, 0, 3.62, 0.7, 16.0, 2.3, 0.3); [-1, 1].forEach((s) => { b.g.add(P.rboxS, B, s * 7.3, 3.62, 0.7, 0, 0, 0, 1.3, 0.32, 2.32); fuse(b.g, B, s * 3.7, 3.3, 1.3, 0.8, 3.0, 0.85); b.x.add(P.cyl, 0x334155, s * 3.7, 3.3, -0.25, PI / 2, 0, 0, 0.3, 0.3, 0.3);
      b.g.add(P.capsule, B, s * 1.35, 0.95, 0.6, PI / 2, 0, 0, 0.6, 1.8, 0.75); [-0.3, 1.5].forEach((z) => wheel(b, s * 1.4, 0.42, z, 0.42, 0.3)); });
    b.g.add(P.rbox, body2, 0, 5.0, -7.5, -0.4, 0, 0, 0.22, 3.3, 2.2); wingC(b.g, body2, 0, 6.55, -8.25, 5.8, 1.3, 0.16); b.g.add(P.rbox, B, 0, 4.0, -7.1, -0.4, 0, 0, 0.24, 0.5, 2.0); rod(b.x, 0x64748b, [0, 0.35, 4.0], [0, 1.4, 3.8], 0.08); wheel(b, 0, 0.35, 4.0, 0.35, 0.24);
    b.g.add(P.rbox, 0x475569, 0, 1.75, -5.6, 0.45, 0, 0, 1.8, 0.08, 2.2); label(b.g, 'CHEDDAR CARGO', 0.34, 0xffffff, 1.26, 1.55, -0.6, PI / 2); label(b.g, 'CHEDDAR CARGO', 0.34, 0xffffff, -1.26, 1.55, -0.6, -PI / 2);
    lights(b, -7.95, 7.95, 3.62, 0.7, [0, 6.6, -8.9]); b.f.add(P.rbox, 0x334155, 0, 2.0, 3.9, 0, 0, 0, 1.8, 0.35, 1.2);
    const body = meshFrom(b), p1 = propeller(4, 1.7, 0x1f2937, 0xffd23f), p2 = propeller(4, 1.7, 0x1f2937, 0xffd23f); p1.position.set(-3.7, 3.3, 2.9); p2.position.set(3.7, 3.3, 2.9); body.add(p1, p2);
    return { body, spin: [{ o: p1, ax: 'z', k: 40 }, { o: p2, ax: 'z', k: -40 }], discs: [], seat: { pilot: [-0.5, 1.95, 3.6], snowie: [0.5, 2.15, 3.7], eye: [-0.45, 3.05, 3.95] }, smoke: [3.7, 3.9, 0.4], dents: [[1.25, 2.4, 1.6, 0.38], [-1.25, 2.0, -1.4, 0.36], [5.2, 3.8, 0.8, 0.34], [-4.6, 3.8, 0.4, 0.34], [0.6, 3.5, -3.0, 0.3], [-1.0, 3.3, 2.6, 0.3]], bend: { at: [0, 6.55, -8.25], stab: true }, rad: 2.8, len: 15, span: 16 }; },
};
// damage layers: 3 tiers of real 3D scuffs/dents, a smoking engine and a bent/broken part
function damageLayers(M, A) { const tiers = [];
  for (let t = 0; t < 3; t++) { const b = MB(); const n = [2, 4, 6][t];
    for (let i = 0; i < n; i++) { const [x, y, z, s] = M.dents[i], k = t === 2 ? 1.6 : t === 1 ? 1.3 : 1.05, ry = Math.atan2(x, 0.001) * 0.5;
      b.m.add(SCORCH[i % 3], 0x57534e, x, y, z, i * 0.7, ry, i, s * 1.1 * k, s * 0.42 * k, s * 1.0 * k); // sooty scuff
      b.m.add(SCORCH[(i + 1) % 3], 0x292524, x * 1.01, y, z, i, ry, i * 0.5, s * 0.62 * k, s * 0.3 * k, s * 0.55 * k); // dented hollow
      for (let j = 0; j < 2; j++) b.x.add(P.rboxS, 0xe7e5e4, x * 1.02, y + (j - 0.5) * s * 0.5, z + (j - 0.5) * s * 0.3, 0.4 + j * 0.5, ry, 0.3 - j * 0.7, s * 0.06, s * 0.06, s * 1.6 * k); } // bare-metal scratches
    if (t >= 1) { const [x, y, z] = M.dents[1]; const tp = M.dents[2]; [[tp, 1], [M.dents[1], -1]].forEach(([d, sg]) => { b.f.add(P.rboxS, 0xe8dcb5, d[0] * 1.04, d[1] + 0.05, d[2] + 0.3 * sg, 0.7, 0, 0.6, 0.08, 0.22, 0.9); b.f.add(P.rboxS, 0xe8dcb5, d[0] * 1.04, d[1] + 0.05, d[2] + 0.3 * sg, -0.7, 0, -0.6, 0.08, 0.22, 0.9); }); } // tape X patch
    if (t === 2) { const [x, y, z] = M.dents[0]; [0xef4444, 0x3b82f6, 0xfacc15].forEach((c, j) => b.x.add(P.torus, c, x * 1.04, y - 0.1 - j * 0.08, z + 0.1 * j, 0.6, j, 0, 0.16, 0.16, 0.24)); } // poking-out wires
    const g = meshFrom(b, false); g.visible = false; tiers.push(g); }
  // the bent / broken part (a flapping fin, a hanging ramp, a bent stabiliser)
  const bk = new THREE.Group(), bb = MB(), f = M.bend; if (f.fin) { bb.g.add(P.rbox, f.fin[3], 0, f.fin[1] * 0.5, 0, 0, 0, 0, f.fin[0], f.fin[1], f.fin[2]); } else if (f.ramp) { bb.g.add(P.rbox, 0x475569, 0, -0.8, 0, 0, 0, 0, 2.1, 1.6, 0.12); } else { bb.g.add(P.capsule, A, 0, 0, 0, 0, 0, PI / 2, 0.16, 1.4, 1.3); }
  bk.add(meshFrom(bb, false)); bk.position.set(...f.at); bk.visible = false; return { tiers, bk }; }
// build a model instance: { root (Group), spin, discs, seat, smoke, setDamage(hp) }
export function buildPlane(id, paintI = 0, o = {}) { FREE_CPU = !!o.display; try { return buildPlane0(id, paintI, o); } finally { FREE_CPU = false; } }
function buildPlane0(id, paintI, o) { const pt = PAINTS[paintI % PAINTS.length], M = MODELS[PLANE(id).id](pt.a, pt.b); const g = new THREE.Group(); g.add(M.body);
  const D = damageLayers(M, pt.a); D.tiers.forEach((t) => M.body.add(t)); M.body.add(D.bk); M.root = g;
  M.setDamage = (hp) => { const t = hp < 30 ? 2 : hp < 55 ? 1 : hp < 82 ? 0 : -1; D.tiers.forEach((m, i) => m.visible = i === t); D.bk.visible = hp < 55; const f = M.bend; if (D.bk.visible) { if (f.fin) D.bk.rotation.set(0.25, 0, (f.rz || 0) + (hp < 30 ? 0.9 : 0.45)); else if (f.ramp) D.bk.rotation.set(hp < 30 ? 1.1 : 0.55, 0, 0); else D.bk.rotation.set(0, 0, hp < 30 ? 0.5 : 0.25); } M.hp = hp; };
  M.setDamage(o.hp == null ? 100 : o.hp); return M; }
