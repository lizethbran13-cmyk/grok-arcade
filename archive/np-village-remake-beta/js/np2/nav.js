// Walk grid for townsfolk: a 2 m occupancy grid baked from the village colliders, A* + line-of-sight smoothing.
// Elves, Santa and Mrs. Claus route around buildings instead of walking through them.
const C = 2;
export class Nav {
  constructor(w, x0, z0, x1, z1) { this.x0 = x0; this.z0 = z0; this.nx = Math.ceil((x1 - x0) / C); this.nz = Math.ceil((z1 - z0) / C); this.b = new Uint8Array(this.nx * this.nz);
    for (const s of w.solids) { if (s.region !== 'out' || s.max[1] < 0.35 || s.min[1] > 2.2 || s.ramp) continue; const a = Math.max(0, Math.floor((s.min[0] - 0.5 - x0) / C)), b = Math.min(this.nx - 1, Math.floor((s.max[0] + 0.5 - x0) / C)), c = Math.max(0, Math.floor((s.min[2] - 0.5 - z0) / C)), d = Math.min(this.nz - 1, Math.floor((s.max[2] + 0.5 - z0) / C));
      if ((b - a) > this.nx * 0.8) continue; for (let i = a; i <= b; i++) for (let j = c; j <= d; j++) this.b[j * this.nx + i] = 1; }
    for (const z of w.zones) if (z.type === 'slip' && z.region === 'out') { /* ice is walkable but avoided */ }
    this.g = new Float32Array(this.nx * this.nz); this.par = new Int32Array(this.nx * this.nz); this.seen = new Uint32Array(this.nx * this.nz); this.stamp = 0; }
  cell(x, z) { return [Math.floor((x - this.x0) / C), Math.floor((z - this.z0) / C)]; }
  free(i, j) { return i >= 0 && j >= 0 && i < this.nx && j < this.nz && !this.b[j * this.nx + i]; }
  freeAt(x, z) { const [i, j] = this.cell(x, z); return this.free(i, j); }
  nearestFree(x, z) { let [i, j] = this.cell(x, z); if (this.free(i, j)) return [i, j]; for (let r = 1; r < 8; r++) for (let a = -r; a <= r; a++) for (const [di, dj] of [[a, -r], [a, r], [-r, a], [r, a]]) if (this.free(i + di, j + dj)) return [i + di, j + dj]; return null; }
  los(ax, az, bx, bz) { const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / (C * 0.5)); for (let k = 1; k < n; k++) { const t = k / n; if (!this.freeAt(ax + (bx - ax) * t, az + (bz - az) * t)) return false; } return true; }
  path(ax, az, bx, bz) { const s = this.nearestFree(ax, az), e = this.nearestFree(bx, bz); if (!s || !e) return null; const nx = this.nx, st = ++this.stamp, si = s[1] * nx + s[0], ei = e[1] * nx + e[0];
    const H = []; const push = (k, f) => { H.push([f, k]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
    const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
    this.seen[si] = st; this.g[si] = 0; this.par[si] = -1; push(si, 0); let it = 0, found = false;
    while (H.length && it++ < 120000) { const [, k] = pop(); if (k === ei) { found = true; break; } const ci = k % nx, cj = (k / nx) | 0, gk = this.g[k];
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (!this.free(ni, nj)) continue; if (di && dj && (!this.free(ci + di, cj) || !this.free(ci, cj + dj))) continue;
        const nk = nj * nx + ni, ng = gk + (di && dj ? 1.414 : 1); if (this.seen[nk] === st && this.g[nk] <= ng) continue; this.seen[nk] = st; this.g[nk] = ng; this.par[nk] = k; push(nk, ng + 1.25 * Math.hypot(ni - e[0], nj - e[1])); } }
    if (!found) return null; const pts = []; for (let k = ei; k !== -1; k = this.par[k]) pts.push([this.x0 + (k % nx + 0.5) * C, this.z0 + (((k / nx) | 0) + 0.5) * C]); pts.reverse(); pts[pts.length - 1] = this.freeAt(bx, bz) ? [bx, bz] : pts[pts.length - 1];
    // smooth: keep only turning points that are needed
    const out = [pts[0]]; let i = 0; while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !this.los(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--; out.push(pts[j]); i = j; } return out; }
}
