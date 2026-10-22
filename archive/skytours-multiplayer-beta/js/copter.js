// Snowie's tour copter: real 3D model (white bubble cabin, rotor, skids, Snowie co-pilot) + an arcade flight model that
// any kid can fly with one thumb: stick = fly that way (camera-relative), UP/DOWN buttons = climb/descend, auto-hover.
// Plus the tow-drone that rescues you after a (harmless!) crash landing.
import * as THREE from 'three';
import { Builder, P } from './geo.js?v=st11mp';
import { compact } from './compact.js?v=st11mp';
import { MATS } from './mats.js?v=st11mp';
import { textGeo } from './text3d.js?v=st11mp';
import { makePet } from './pets.js?v=st11mp';
import { makeHuman } from './humans.js?v=st11mp';
import { buildPlane, PLANE } from './planes.js?v=st11mp';
const PI = Math.PI;
export { PAINTS, PLANES, PLANE } from './planes.js?v=st11mp';
const MB = () => ({ f: new Builder(), g: new Builder(), m: new Builder(), l: new Builder(), x: new Builder(), e: new Builder() });
function meshFrom(b, shadow = true) { const g = new THREE.Group(); for (const k in b) { if (!b[k].parts.length) continue; const m = new THREE.Mesh(compact(b[k].build(), k), MATS[k]); m.castShadow = shadow && k !== 'l' && k !== 'e'; m.receiveShadow = k !== 'l'; if (k === 'e') m.renderOrder = 2; g.add(m); } return g; }
// the player's aircraft: any of the seven hangar models (planes.js), swappable at the Plane Lineup, with live damage
export function makeCopter(paintI, look, planeId = 'classic') {
  const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt);
  const c = { root, tilt, body: null, M: null, id: planeId, paint: paintI || 0, x: 0, y: 0, z: 0, yaw: 0, vx: 0, vy: 0, vz: 0, spin: 0, mode: 'ground', pitchV: 0, rollV: 0, t: 0, onPad: null, passenger: null, hp: 100 };
  c.snowie = makePet('snowie', { s: 0.75 }); c.snowie.noTurn = true; tilt.add(c.snowie.root);
  const seat = () => { const st = c.M.seat; c.snowie.root.position.set(...st.snowie); if (c.pilot) c.pilot.root.position.set(...st.pilot); };
  c.setModel = (id, paint) => { if (paint != null) c.paint = paint; if (id) c.id = id; if (c.body) { tilt.remove(c.body); c.body.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    c.M = buildPlane(c.id, c.paint, { hp: c.hp }); c.body = c.M.root; tilt.add(c.body); c.rotor = c.M.spin[0] ? c.M.spin[0].o : new THREE.Group(); c.tail = c.M.spin[1] ? c.M.spin[1].o : new THREE.Group(); c.disc = c.M.discs[0] || { material: {}, visible: false }; c.kind = PLANE(c.id).kind; seat(); };
  c.setPaint = (i) => c.setModel(null, i);
  c.setHp = (hp) => { c.hp = hp; if (c.M) c.M.setDamage(hp); };
  c.setPilot = (L) => { if (c.pilot) tilt.remove(c.pilot.root); c.pilot = makeHuman(L); c.pilot.root.scale.setScalar(0.62); tilt.add(c.pilot.root); if (c.M) seat(); };
  c.setPilot(look); c.setModel(planeId, paintI || 0);
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
