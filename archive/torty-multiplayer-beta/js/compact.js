// Memory diet for merged static geometry (no visual change): drop unused UVs (no texture maps anywhere), 16-bit normals,
// 8-bit colours (glow bucket keeps float colours for bloom), 16-bit indices where they fit. Optionally frees the CPU copy once on the GPU.
import * as THREE from 'three';
function freeArr() { this.array = new this.array.constructor(0); }
// spill form: fixed attribute types so spilled pieces of one chunk can be merged later (Int16 normals, Uint8/Float32 colours, Uint32 index)
export function spillCompact(g, bucket) { if (g.attributes.uv) g.deleteAttribute('uv'); const n = g.attributes.normal; if (n && n.array instanceof Float32Array) { const a = n.array, o = new Int16Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.round(Math.max(-1, Math.min(1, a[i])) * 32767); g.setAttribute('normal', new THREE.BufferAttribute(o, 3, true)); }
  const c = g.attributes.color; if (bucket !== 'l' && c && c.array instanceof Float32Array) { const a = c.array, o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.round(Math.min(1, a[i]) * 255); g.setAttribute('color', new THREE.BufferAttribute(o, 3, true)); }
  if (g.index && !(g.index.array instanceof Uint32Array)) g.setIndex(new THREE.BufferAttribute(new Uint32Array(g.index.array), 1)); g.userData.spill = true; return g; }
export function compact(g, bucket, freeCpu = false) {
  if (!g || g.userData.compact) return g; g.userData.compact = true;
  if (g.attributes.uv) g.deleteAttribute('uv'); if (g.attributes.uv1) g.deleteAttribute('uv1');
  const n = g.attributes.normal; if (n && n.array instanceof Float32Array) { const a = n.array, o = new Int16Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.round(Math.max(-1, Math.min(1, a[i])) * 32767); g.setAttribute('normal', new THREE.BufferAttribute(o, 3, true)); }
  const c = g.attributes.color; if (c && c.array instanceof Float32Array && bucket !== 'l') { const a = c.array; let max = 0; for (let i = 0; i < a.length; i++) if (a[i] > max) max = a[i]; if (max <= 1.001) { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.round(a[i] * 255); g.setAttribute('color', new THREE.BufferAttribute(o, 3, true)); } }
  const ix = g.index; if (ix && ix.array instanceof Uint32Array && g.attributes.position.count < 65535) g.setIndex(new THREE.BufferAttribute(new Uint16Array(ix.array), 1));
  if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingBox) g.computeBoundingBox();
  let by = 0; for (const k in g.attributes) by += g.attributes[k].array.byteLength; if (g.index) by += g.index.array.byteLength; g.userData.bytes = by;
  if (freeCpu) { for (const k in g.attributes) g.attributes[k].onUpload(freeArr); if (g.index) g.index.onUpload(freeArr); }
  return g; }
