// Real extruded 3D lettering for signs (no flat textures). Font is preloaded at boot.
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
let font = null; const cache = new Map();
export async function loadFont() { if (font) return font; try { const r = await fetch('lib/fonts/helvetiker_bold.typeface.json'); font = new Font(await r.json()); } catch (e) { console.warn('font', e); } return font; }
// centred text geometry (x centred, y from baseline 0); null if font missing
export function textGeo(str, size = 1, depth = 0.3) { if (!font) return null; const k = str + '|' + size + '|' + depth; if (cache.has(k)) return cache.get(k);
  const g = new TextGeometry(str, { font, size, depth, curveSegments: size < 1.2 ? 4 : 6, bevelEnabled: true, bevelThickness: depth * 0.25, bevelSize: size * 0.04, bevelSegments: size < 1.2 ? 1 : 2 });
  g.computeBoundingBox(); const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, 0, -depth / 2); g.userData.w = b.max.x - b.min.x; cache.set(k, g); return g; }
