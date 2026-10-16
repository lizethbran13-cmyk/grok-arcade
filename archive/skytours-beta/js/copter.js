// Snowie's tour copter: real 3D model (white bubble cabin, rotor, skids, Snowie co-pilot) + an arcade flight model that
// any kid can fly with one thumb: stick = fly that way (camera-relative), UP/DOWN buttons = climb/descend, auto-hover.
// Plus the tow-drone that rescues you after a (harmless!) crash landing.
import * as THREE from 'three';
import { Builder, P } from './geo.js?v=st5';
import { compact } from './compact.js?v=st5';
import { MATS } from './mats.js?v=st5';
import { textGeo } from './text3d.js?v=st5';
import { makePet } from './pets.js?v=st5';
import { makeHuman } from './humans.js?v=st5';
const PI = Math.PI;
export const PAINTS = [{ n: 'Snowie Classic', a: 0xffffff, b: 0xff4fa0 }, { n: 'Sky Cyan', a: 0x3ff0ff, b: 0xffffff }, { n: 'Sunny Bee', a: 0xffd23f, b: 0x111827 }, { n: 'Mint Chip', a: 0x86efac, b: 0x7c3f2c }, { n: 'Grape Soda', a: 0xa78bfa, b: 0xffd23f }, { n: 'Rescue Red', a: 0xef4444, b: 0xffffff }];
const MB = () => ({ f: new Builder(), g: new Builder(), m: new Builder(), l: new Builder(), x: new Builder(), e: new Builder() });
function meshFrom(b, shadow = true) { const g = new THREE.Group(); for (const k in b) { if (!b[k].parts.length) continue; const m = new THREE.Mesh(compact(b[k].build(), k), MATS[k]); m.castShadow = shadow && k !== 'l' && k !== 'e'; m.receiveShadow = k !== 'l'; if (k === 'e') m.renderOrder = 2; g.add(m); } return g; }
function bodyModel(paint) { const b = MB(), A = paint.a, B = paint.b;
  b.g.add(P.capsule, A, 0, 1.45, 0.2, PI / 2, 0, 0, 2.0, 2.4, 1.9); // cabin pod (lies along z)
  b.g.add(P.capsule, B, 0, 1.0, 0.2, PI / 2, 0, 0, 2.04, 1.8, 1.0); // belly stripe
  b.e.add(P.sphere, 0xbfe9ff, 0, 1.75, 1.15, 0, 0, 0, 0.95, 0.85, 1.05); // bubble windscreen
  [-1, 1].forEach((s) => b.e.add(P.rbox, 0xbfe9ff, s * 1.0, 1.8, 0.0, 0, 0, 0, 0.06, 0.7, 1.1)); // side windows
  b.g.add(P.cyl, A, 0, 1.75, -2.9, PI / 2, 0, 0, 0.3, 3.6, 0.36); b.g.add(P.cyl, B, 0, 1.75, -2.9, PI / 2, 0, 0, 0.32, 0.5, 0.38); // tail boom
  b.g.add(P.rbox, B, 0, 2.4, -4.6, 0.25, 0, 0, 0.12, 1.3, 0.8); b.g.add(P.rbox, A, 0, 1.75, -4.4, 0, 0, 0, 1.6, 0.1, 0.5); // fins
  [-1, 1].forEach((s) => b.g.add(P.sphere, 0xffb3d1, s * 0.22, 2.95, -4.75, 0, 0, 0, 0.18, 0.18, 0.06)); // rat ears logo
  b.x.add(P.cyl, 0x94a3b8, 0, 2.6, 0.1, 0, 0, 0, 0.14, 0.5, 0.14); b.x.add(P.sphere, 0x94a3b8, 0, 2.95, 0.1, 0, 0, 0, 0.3, 0.18, 0.3); // mast
  [-1, 1].forEach((s) => { b.x.add(P.cyl, 0x64748b, s * 0.9, 0.06, 0.2, PI / 2, 0, 0, 0.08, 3.4, 0.08); b.x.add(P.sphere, 0x64748b, s * 0.9, 0.06, 1.9, 0, 0, 0, 0.08); [-0.8, 1.2].forEach((z) => b.x.add(P.cyl, 0x64748b, s * 0.78, 0.4, z, 0, 0, s * 0.35, 0.06, 0.75, 0.06)); }); // skids
  b.l.add(P.sphere, 0xff3b3b, -1.0, 1.1, 0.9, 0, 0, 0, 0.08, 0.08, 0.08, 1.2); b.l.add(P.sphere, 0x3bff6b, 1.0, 1.1, 0.9, 0, 0, 0, 0.08, 0.08, 0.08, 1.2); b.l.add(P.sphere, 0xffffff, 0, 1.75, -4.9, 0, 0, 0, 0.07, 0.07, 0.07, 1.4);
  b.f.add(P.rbox, 0x334155, 0, 1.0, 0.2, 0, 0, 0, 1.6, 0.4, 2.2); // seats
  const tg = textGeo('SKY TOURS', 0.22, 0.04); if (tg) [-1, 1].forEach((s) => b.g.add(tg, B === 0xffffff ? 0xff4fa0 : 0xffffff, s * 1.03, 1.0, 0.2, 0, s * PI / 2, 0));
  return meshFrom(b); }
function rotorModel() { const b = MB(); for (let i = 0; i < 4; i++) { const a = i * PI / 2; b.g.add(P.rboxS, 0x1f2937, Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4, 0, -a, 0.05, 4.4, 0.06, 0.32); b.g.add(P.rboxS, 0xff4fa0, Math.cos(a) * 4.45, 0.01, Math.sin(a) * 4.45, 0, -a, 0, 0.35, 0.07, 0.34); } b.x.add(P.sphere, 0x94a3b8, 0, 0.08, 0, 0, 0, 0, 0.32, 0.16, 0.32); return meshFrom(b, true); }
function tailRotor() { const b = MB(); for (let i = 0; i < 2; i++) b.g.add(P.rboxS, 0x1f2937, 0, 0, 0, i * PI / 2, 0, 0, 0.05, 1.3, 0.14); return meshFrom(b, false); }
export function makeCopter(paintI, look) {
  const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt);
  const c = { root, tilt, body: null, rotor: rotorModel(), tail: tailRotor(), x: 0, y: 0, z: 0, yaw: 0, vx: 0, vy: 0, vz: 0, spin: 0, mode: 'ground', pitchV: 0, rollV: 0, t: 0, onPad: null, passenger: null };
  c.rotor.position.set(0, 3.05, 0.1); c.tail.position.set(0.2, 2.4, -4.75); tilt.add(c.rotor, c.tail);
  // a soft disc so the spinning rotor reads as motion
  c.disc = new THREE.Mesh(new THREE.CircleGeometry(4.7, 40), new THREE.MeshBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0, depthWrite: false })); c.disc.rotation.x = -PI / 2; c.disc.position.set(0, 3.1, 0.1); tilt.add(c.disc);
  // Snowie co-pilot (right seat) + you (left seat)
  c.snowie = makePet('snowie', { s: 0.75 }); c.snowie.root.position.set(0.5, 1.15, 0.6); c.snowie.noTurn = true; tilt.add(c.snowie.root);
  c.setPaint = (i) => { if (c.body) { tilt.remove(c.body); c.body.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); } c.body = bodyModel(PAINTS[i % PAINTS.length]); tilt.add(c.body); };
  c.setPilot = (L) => { if (c.pilot) tilt.remove(c.pilot.root); c.pilot = makeHuman(L); c.pilot.root.scale.setScalar(0.62); c.pilot.root.position.set(-0.5, 0.95, 0.5); tilt.add(c.pilot.root); };
  c.setPaint(paintI || 0); c.setPilot(look);
  // shadow blob for when the sun shadow is out of range
  c.blob = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22, depthWrite: false })); c.blob.rotation.x = -PI / 2; c.blob.renderOrder = 1;
  return c;
}
export function makeTowDrone() { const b = MB();
  b.g.add(P.rbox, 0xffd23f, 0, 0, 0, 0, 0, 0, 2.4, 0.7, 2.4); b.g.add(P.rbox, 0x111827, 0, 0.36, 0, 0, 0, 0, 1.6, 0.1, 1.6); b.l.add(P.sphere, 0xff7a1a, 0, 0.45, 0, 0, 0, 0, 0.3, 0.2, 0.3, 1.2);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => { b.x.add(P.cyl, 0x334155, a * 1.0, 0.1, c * 1.0, 0, 0, a * 0.9, 0.08, 1.2, 0.08); b.g.add(P.torus, 0x111827, a * 1.7, 0.4, c * 1.7, PI / 2, 0, 0, 0.75, 0.75, 0.5); });
  b.x.add(P.cyl, 0x94a3b8, 0, -0.6, 0, 0, 0, 0, 0.1, 0.5, 0.1); b.l.add(P.sphere, 0x3ff0ff, 0, -0.1, 1.25, 0, 0, 0, 0.18, 0.12, 0.08, 1.0);
  const tg = textGeo('TOW', 0.3, 0.05); if (tg) b.g.add(tg, 0x111827, 0, -0.15, 1.22);
  const root = new THREE.Group(); root.add(meshFrom(b)); const props = []; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.16), MATS.g); p.position.set(a * 1.7, 0.45, c * 1.7); root.add(p); props.push(p); });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6).translate(0, -0.5, 0), MATS.x); cable.visible = false; root.add(cable);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), MATS.x); hook.visible = false; root.add(hook);
  return { root, props, cable, hook, t: 0 };
}
