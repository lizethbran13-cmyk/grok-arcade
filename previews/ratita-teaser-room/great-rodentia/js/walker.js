// Grok Great Rodentia — 3D Rat Walker & Platforming Controller (Brie & Evil Twin Sisters)
import * as THREE from 'three';
import { makeRat, animRat, setOutfit } from './models.js?v=gr3';
import { topOf } from './world.js?v=gr3';
import { readMove, edge, held } from './input.js?v=gr3';
import { sfx } from './audio.js?v=gr3';

const GRAV = -26, JUMP = 10.6, DJUMP = 9.4, R = 0.42, H = 1.1, STEP = 0.65;
const near = [];

export class RatHero {
  constructor(scene, world) {
    this.scene = scene;
    this.w = world;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.charId = 'brie';
    this.outfit = 'detective';
    this.rig = null;

    // Ground shadow blob
    const sg = new THREE.CircleGeometry(0.46, 20);
    sg.rotateX(-Math.PI / 2);
    this.shadow = new THREE.Mesh(
      sg,
      new THREE.MeshBasicMaterial({ color: 0x050208, transparent: true, opacity: 0.38, depthWrite: false })
    );
    scene.add(this.shadow);

    // Spin aura ring
    const rg = new THREE.RingGeometry(0.45, 0.88, 24);
    rg.rotateX(-Math.PI / 2);
    this.spinRing = new THREE.Mesh(
      rg,
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
    );
    this.group.add(this.spinRing);

    this.x = 0; this.y = 0.2; this.z = -34;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.yaw = 0;
    this.onG = false;
    this.airT = 0;
    this.djump = true;
    this.gliding = false;
    this.spinT = 0;
    this.spinCd = 0;
    this.hurtT = 0;
    this.squash = 0;
    this.lean = 0;
    this.speed = 0;
    this.locked = false;

    // District Z-boundaries (locked gates block movement past maxZ)
    this.districtGates = [];
    this.gateBlockedCb = null;
    this._gateMsgCd = 0;

    this.setCharacter('brie', 'detective');
  }

  setCharacter(charId, outfit = 'none') {
    this.charId = charId;
    this.outfit = outfit;
    if (this.rig && this.rig.root) {
      this.group.remove(this.rig.root);
    }
    this.rig = makeRat(charId);
    this.rig.root.scale.setScalar(1.08);
    if (this.rig.blaster) this.rig.blaster.visible = false;
    setOutfit(this.rig, outfit);
    this.group.add(this.rig.root);
    if (this.spinRing) {
      this.spinRing.material.color.setHex(charId.startsWith('evil_') ? 0xff1e42 : 0x38bdf8);
    }
  }

  place(p, yaw = 0) {
    this.x = p[0]; this.y = p[1]; this.z = p[2];
    this.vx = this.vy = this.vz = 0;
    this.yaw = yaw;
    this.onG = true;
    this.group.position.set(this.x, this.y, this.z);
    this.group.rotation.y = this.yaw;
  }

  respawn(x, y, z, yaw = 0) {
    this.place([x, y, z], yaw);
  }

  step(dt, w, camYaw, fx) {
    const world = w || this.w;
    if (this._gateMsgCd > 0) this._gateMsgCd -= dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.spinCd > 0) this.spinCd -= dt;
    if (this.spinT > 0) this.spinT = Math.max(0, this.spinT - dt);

    if (this.locked) {
      animRat(this.rig, dt, { speed: 0, air: false, glide: false, spin: 0, vy: 0 });
      this.group.position.set(this.x, this.y, this.z);
      this.group.rotation.y = this.yaw;
      if (this.spinRing) this.spinRing.material.opacity = 0;
      return;
    }

    const mv = readMove(); const mx = mv.x || 0, my = mv.y || 0;
    const mag = Math.min(1, Math.hypot(mx, my));
    const sprinting = held('sprint');
    const spd = (sprinting ? 9.6 : 7.4) * (this.spinT > 0 ? 1.25 : 1.0);

    if (mag > 0.02) {
      const s = Math.sin(camYaw), c = Math.cos(camYaw);
      const dx = -mx * c + my * s, dz = mx * s + my * c; // right = camera-right (fixed reversed strafe)
      const ta = Math.atan2(dx, dz);
      let da = ((ta - this.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.yaw += da * Math.min(1, dt * 14);
      this.lean = Math.max(-0.22, Math.min(0.22, -da * 0.25));
      const acc = this.onG ? 14 : 7;
      this.vx += (dx * spd - this.vx) * Math.min(1, dt * acc);
      this.vz += (dz * spd - this.vz) * Math.min(1, dt * acc);
    } else {
      this.lean *= Math.max(0, 1 - dt * 10);
      const fr = this.onG ? 12 : 3;
      this.vx *= Math.max(0, 1 - dt * fr);
      this.vz *= Math.max(0, 1 - dt * fr);
    }

    // Jump & Double Jump & Glide
    const jEdge = edge('jump');
    if (jEdge) {
      if (this.onG || this.airT < 0.12) {
        this.vy = JUMP;
        this.onG = false;
        this.airT = 0.2;
        this.djump = true;
        this.squash = -0.25;
        sfx('jump');
        if (fx) fx.burst(this.x, this.y + 0.1, this.z, 0xfef08a, 8, 2.5);
      } else if (this.djump) {
        this.vy = DJUMP;
        this.djump = false;
        this.spinT = 0.32;
        this.squash = -0.2;
        sfx('jump2');
        if (fx) fx.ring(this.x, this.y + 0.2, this.z, this.charId.startsWith('evil_') ? 0xff1e42 : 0x38bdf8);
      }
    }

    // Spin / Dash attack
    if ((edge('spin') || edge('hook')) && this.spinCd <= 0) {
      this.spinT = 0.42;
      this.spinCd = 0.55;
      sfx('spin');
      const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
      this.vx += s * 4.2;
      this.vz += c * 4.2;
      if (fx) fx.ring(this.x, this.y + 0.35, this.z, this.charId.startsWith('evil_') ? 0xff1e42 : 0xfacc15);
    }

    this.gliding = !this.onG && this.vy < -1.0 && held('jump') && this.airT > 0.22;
    const gNow = this.gliding ? GRAV * 0.24 : GRAV;
    this.vy = Math.max(this.gliding ? -3.4 : -28, this.vy + gNow * dt);

    // Sub-stepped horizontal + vertical collision with World
    const steps = 2, sdt = dt / steps;
    for (let st = 0; st < steps; st++) {
      this.x += this.vx * sdt;
      this.z += this.vz * sdt;

      // District gate locks
      for (const g of this.districtGates) {
        if (!g.unlocked && this.z > g.z - 0.55 && this.z < g.z + 1.8) {
          this.z = g.z - 0.56;
          this.vz = Math.min(0, this.vz);
          if (this.gateBlockedCb && this._gateMsgCd <= 0) {
            this._gateMsgCd = 1.6;
            this.gateBlockedCb(g.district);
          }
        }
      }

      // World outer bounds
      this.x = Math.max(-36.5, Math.min(36.5, this.x));
      this.z = Math.max(-44.5, Math.min(72.5, this.z));

      if (world && world.near) {
        world.near(this.x - R - 0.1, this.z - R - 0.1, this.x + R + 0.1, this.z + R + 0.1, near);
        for (let i = 0; i < near.length; i++) {
          const s = near[i];
          if (s.Trigger) continue;
          const top = topOf(s, this.x, this.z);
          if (this.y + H <= s.min[1] + 0.05 || this.y >= top - STEP) continue;
          const cx = Math.max(s.min[0], Math.min(this.x, s.max[0]));
          const cz = Math.max(s.min[2], Math.min(this.z, s.max[2]));
          let dx = this.x - cx, dz = this.z - cz, d2 = dx * dx + dz * dz;
          if (d2 >= R * R) continue;
          if (d2 < 1e-6) {
            const dl = this.x - s.min[0], dr = s.max[0] - this.x;
            const db = this.z - s.min[2], df = s.max[2] - this.z;
            const m = Math.min(dl, dr, db, df);
            if (m === dl) this.x = s.min[0] - R;
            else if (m === dr) this.x = s.max[0] + R;
            else if (m === db) this.z = s.min[2] - R;
            else this.z = s.max[2] + R;
          } else {
            const d = Math.sqrt(d2), push = R - d;
            this.x += (dx / d) * push;
            this.z += (dz / d) * push;
          }
        }
      }

      this.y += this.vy * sdt;
      const gRes = world && world.ground ? world.ground(this.x, this.z, this.y + STEP, R * 0.8) : { y: 0 };
      const gy = (typeof gRes === 'number') ? gRes : (gRes && gRes.y > -1e6 ? gRes.y : 0);
      if (this.y <= gy + 0.02 && this.vy <= 0) {
        if (!this.onG && this.vy < -5) this.squash = 0.24;
        this.y = gy;
        this.vy = 0;
        this.onG = true;
        this.airT = 0;
        this.djump = true;
        this.gliding = false;
      } else {
        this.onG = false;
        this.airT += sdt;
      }
    }

    this.squash *= Math.max(0, 1 - dt * 10);
    this.speed = Math.hypot(this.vx, this.vz);

    animRat(this.rig, dt, {
      speed: this.speed,
      air: !this.onG,
      glide: this.gliding,
      spin: this.spinT > 0 ? (0.42 - this.spinT) : 0,
      vy: this.vy,
      squash: this.squash,
      lean: this.lean,
    });

    if (this.spinRing) {
      if (this.spinT > 0) {
        this.spinRing.material.opacity = 0.72;
        this.spinRing.rotation.z += dt * 16;
        this.spinRing.position.y = 0.32;
      } else {
        this.spinRing.material.opacity = 0;
      }
    }

    if (this.rig && this.rig.root) {
      this.rig.root.visible = this.hurtT <= 0 || Math.floor(this.hurtT * 16) % 2 === 0;
    }

    this.group.position.set(this.x, this.y, this.z);
    this.group.rotation.y = this.yaw;

    const sRes = world && world.ground ? world.ground(this.x, this.z, this.y + 0.3, 0.1) : { y: 0 };
    const sy = (typeof sRes === 'number') ? sRes : (sRes && sRes.y > -1e6 ? sRes.y : 0);
    const h = Math.max(0, this.y - sy), sc = Math.max(0.3, 1 - h * 0.08);
    this.shadow.position.set(this.x, sy + 0.025, this.z);
    this.shadow.scale.setScalar(sc);
    this.shadow.material.opacity = 0.38 * sc;
  }

  update(dt, w, camYaw, fx) {
    this.step(dt, w, camYaw, fx);
  }
}
