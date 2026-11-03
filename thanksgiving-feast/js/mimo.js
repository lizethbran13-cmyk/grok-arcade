// Chef Mimo: a human chef, brother of Chef Gio from the Grok Arcade food court (same build, puffy hat, curly mustache, big friendly nose).
// His own touch: pumpkin-orange neckerchief, short beard, rust harvest apron, a maple-leaf pin on his hat, and a ladle instead of a spoon.
import * as THREE from 'three';
const mats = {}; const ph = (c, s = 30) => mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 1 - s / 120 }));
const add = (p, g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
const sp = (r, n) => new THREE.SphereGeometry(r, n, Math.max(6, n * 0.7 | 0)), cy = (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n), bx = (a, b, c) => new THREE.BoxGeometry(a, b, c);
export function makeChefMimo() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const skin = ph('#e9b994', 20), white = ph('#fbfbf7', 30), orange = ph('#f07f1d', 40), dark = ph('#3a2416', 30), rust = ph('#a5481f', 25);
  add(body, cy(0.18, 0.2, 0.75, 14), ph('#3b3b4a', 15), 0, 0.37, 0);
  const torso = add(body, sp(0.36, 22), white, 0, 1.05, 0); torso.scale.set(1, 1.28, 0.86);
  add(body, sp(0.31, 18), rust, 0, 0.84, 0.12).scale.set(1, 1.05, 0.5); // harvest apron
  const pk = add(body, sp(0.06, 10), orange, 0, 0.86, 0.29); pk.scale.set(1.2, 1, 0.5); // pumpkin patch on apron
  [0.95, 1.1, 1.25].forEach((y) => [-0.09, 0.09].forEach((x) => add(body, sp(0.025, 8), ph('#c9a227', 80), x, y, 0.3)));
  const sc = add(body, new THREE.TorusGeometry(0.17, 0.05, 7, 18), orange, 0, 1.43, 0.02); sc.rotation.x = PI2; add(body, new THREE.ConeGeometry(0.07, 0.16, 10), orange, -0.06, 1.33, 0.2).rotation.x = 0.4;
  const arm = (sd) => { const a = new THREE.Group(); a.position.set(sd * 0.38, 1.36, 0); body.add(a); add(a, cy(0.085, 0.075, 0.46, 10), white, 0, -0.23, 0); add(a, sp(0.08, 10), skin, 0, -0.5, 0); return a; };
  const aL = arm(-1), aR = arm(1);
  const ld = new THREE.Group(); ld.position.set(0, -0.55, 0.04); aR.add(ld); add(ld, cy(0.015, 0.015, 0.45, 6), ph('#9ca3af', 70), 0, -0.05, 0.12).rotation.x = 1.2; add(ld, sp(0.07, 10), ph('#9ca3af', 70), 0, -0.13, 0.32).scale.set(1, 0.6, 1);
  const head = new THREE.Group(); head.position.set(0, 1.66, 0.02); body.add(head);
  add(head, sp(0.25, 22), skin, 0, 0.1, 0);
  add(head, sp(0.075, 12), ph('#d98a6c', 20), 0, 0.07, 0.25);
  [-1, 1].forEach((sd) => { add(head, sp(0.028, 8), ph('#111827', 90), sd * 0.09, 0.17, 0.22); add(head, sp(0.045, 8), ph('#ff9eb4', 10), sd * 0.15, 0.06, 0.19).scale.set(1, 0.6, 0.4); add(head, bx(0.09, 0.03, 0.03), dark, sd * 0.09, 0.24, 0.22).rotation.z = sd * -0.15; add(head, sp(0.07, 10), skin, sd * 0.25, 0.1, 0).scale.set(0.5, 1, 0.8); });
  [-1, 1].forEach((sd) => { const m = add(head, sp(0.075, 12), dark, sd * 0.07, 0, 0.24); m.scale.set(1.4, 0.55, 0.6); m.rotation.z = sd * 0.3; add(head, sp(0.03, 8), dark, sd * 0.16, 0.03, 0.23); });
  const beard = add(head, sp(0.2, 16), dark, 0, -0.07, 0.07); beard.scale.set(1.05, 0.6, 0.85); // short beard: Gio is clean-chinned
  add(head, cy(0.21, 0.23, 0.2, 20), white, 0, 0.36, -0.01);
  [[0, 0.58, 0], [-0.12, 0.54, 0.02], [0.12, 0.54, 0.02], [0, 0.55, -0.12], [0, 0.55, 0.11]].forEach((q) => add(head, sp(0.15, 14), white, q[0], q[1], q[2] - 0.01));
  const leaf = add(head, new THREE.CircleGeometry(0.07, 5), ph('#d9480f', 20), 0.1, 0.38, 0.215); leaf.material.side = THREE.DoubleSide; // maple-leaf pin
  return { root, body, head, aL, aR };
}
const PI2 = Math.PI / 2;
