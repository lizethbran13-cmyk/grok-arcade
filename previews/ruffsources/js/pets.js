// The 5 Grok pets as real 3D cameo characters: Candy (miniature schnauzer), Torty (Martina the tortoise), Luna, Pi-rat (eyepatch) and Snowie (white fancy rat).
// Every cameo turns to face you when you come close or talk.
import * as THREE from 'three';
import { makeRat, animRat, makeMartina, animMartina } from './models.js?v=rs5';
import { makePup, animPup } from './dogs.js?v=rs5';
export const PETS = {
  candy: { name: 'Candy', title: 'Head of Ruffsources', emoji: '🐶' },
  torty: { name: 'Torty', title: 'CEO, Tortuga Tech Inc.', emoji: '🐢' },
  luna: { name: 'Luna', title: 'Boss of Ratita Industries', emoji: '🐭' },
  pirat: { name: 'Pi-rat', title: 'Captain, one eye on everything', emoji: '🏴‍☠️' },
  snowie: { name: 'Snowie', title: 'Snowie Sky Tours', emoji: '🐁' },
};
// scale tuned so pets read as cartoon-big next to a 1.75 m visitor (Candy ~0.95 m tall, rats ~0.7 m, Torty ~1.1 m wide)
export function makePet(id, o = {}) {
  let rig, kind; const holder = new THREE.Group();
  if (id === 'candy') { rig = makePup('schnauzer', { collar: 0xff4fa0 }); kind = 'dog'; rig.root.scale.setScalar(0.85 * (o.s || 1)); }
  else if (o.breed) { rig = makePup(o.breed, { collar: o.collar, seed: o.seed }); kind = 'dog'; rig.root.scale.setScalar(o.s || 0.85); }
  else if (id === 'torty') { rig = makeMartina(); kind = 'tort'; rig.root.scale.setScalar(0.27 * (o.s || 1)); }
  else { rig = makeRat(id, 'none', { pack: o.pack === undefined ? false : o.pack, extras: id === 'pirat' ? ['patch', ...(o.extras || [])] : (o.extras || []), noBlaster: true }); kind = 'rat'; rig.root.scale.setScalar(1.0 * (o.s || 1)); }
  holder.add(rig.root);
  return { id, kind, rig, root: holder, x: 0, y: 0, z: 0, yaw: 0, mode: o.mode || 'idle', t: Math.random() * 9, speed: 0, home: null, name: PETS[id] ? PETS[id].name : id };
}
export function animPet(p, dt, me) {
  p.t += dt; const r = p.rig;
  if (me && p.mode !== 'sleep' && !p.noTurn) { const dx = me.x - p.x, dz = me.z - p.z, d = Math.hypot(dx, dz); if (d < 7) { let want = Math.atan2(dx, dz), dy = want - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.yaw += dy * Math.min(1, dt * 5); } }
  p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw;
  if (p.kind === 'dog') animPup(r, dt, p.speed, p.mode);
  else if (p.kind === 'tort') animMartina(r, dt, p.speed);
  else animRat(r, dt, { speed: p.speed, air: false, lean: 0 });
}
