// Shared materials (all vertex-coloured so a whole room batches into a handful of draw calls).
import * as THREE from 'three';
export const MATS = {};
export function initMats() {
  MATS.m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.68, metalness: 0 });          // matte: wood, paper, plaster
  MATS.g = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.18 }); // glossy plastic / ceramic / paint
  MATS.x = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.85 });         // metal
  MATS.f = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xffffff) }); // fabric / fur
  MATS.e = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }); // glass / water
  MATS.l = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });                         // glowing bits (bloom)
  MATS.fur = MATS.f; MATS.w = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }); // walls/ceilings (no shadow casting)
  MATS.s = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }); // sail cloth / leaves (two-sided)
  return MATS;
}
// glowing-at-night window glass + lamp heads (emissive intensity follows the clock)
export function initMats2() {
  MATS.n = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.2, clearcoat: 1, emissive: new THREE.Color(0xffc870), emissiveIntensity: 0 });
  return MATS;
}
