// Stylised animated ocean: gerstner-ish sine waves in the vertex shader, fresnel sky tint, sun glints and foam.
// The hub ship stays still and the sea scrolls past it, so uOff/uRot map the mesh into "sea chart" space.
import * as THREE from 'three';
export function makeSea(o = {}) {
  const size = o.size || 2400, seg = o.seg || 160;
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const U = { uT: { value: 0 }, uOff: { value: new THREE.Vector2() }, uRot: { value: 0 }, uDeep: { value: new THREE.Color(o.deep || 0x0b4f8a) }, uShal: { value: new THREE.Color(o.shallow || 0x1fb5c9) }, uSky: { value: new THREE.Color(o.sky || 0xbfe6ff) },
    uSun: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() }, uSunC: { value: new THREE.Color(0xfff3d6) }, uFogC: { value: new THREE.Color(0xcfe9ff) }, uFogD: { value: 0.002 }, uAmp: { value: o.amp != null ? o.amp : 1 }, uFoam: { value: o.foam != null ? o.foam : 1 }, uY: { value: o.y || 0 }, uShore: { value: new THREE.Vector4(0, 0, 0, 0) } };
  const m = new THREE.ShaderMaterial({ uniforms: U, fog: false, lights: false,
    vertexShader: `uniform float uT, uRot, uAmp; uniform vec2 uOff; varying vec3 vW; varying vec2 vS; varying float vH;
      float wave(vec2 p, vec2 d, float f, float a, float s){ return sin(dot(p, d) * f + uT * s) * a; }
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); float c = cos(uRot), s = sin(uRot); vec2 sp = vec2(w.x * c + w.z * s, -w.x * s + w.z * c) + uOff; vS = sp;
        float h = wave(sp, normalize(vec2(1.0, 0.3)), 0.06, 0.55, 1.1) + wave(sp, normalize(vec2(-0.4, 1.0)), 0.09, 0.35, 1.6) + wave(sp, normalize(vec2(0.7, -0.8)), 0.16, 0.18, 2.3);
        float fade = 1.0 - smoothstep(60.0, 260.0, length(w.xz - cameraPosition.xz)); h *= uAmp * (0.35 + 0.65 * fade); w.y += h; vH = h; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uT, uFogD, uFoam, uAmp; uniform vec3 uDeep, uShal, uSky, uSun, uSunC, uFogC; uniform vec4 uShore; varying vec3 vW; varying vec2 vS; varying float vH;
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float nz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hsh(i), hsh(i + vec2(1, 0)), f.x), mix(hsh(i + vec2(0, 1)), hsh(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 p = vS; float e = 0.6;
        float dx = cos(dot(p, normalize(vec2(1.0, 0.3))) * 0.06 + uT * 1.1) * 0.06 * 0.55 * normalize(vec2(1.0, 0.3)).x + cos(dot(p, normalize(vec2(-0.4, 1.0))) * 0.09 + uT * 1.6) * 0.09 * 0.35 * normalize(vec2(-0.4, 1.0)).x;
        float dz = cos(dot(p, normalize(vec2(1.0, 0.3))) * 0.06 + uT * 1.1) * 0.06 * 0.55 * normalize(vec2(1.0, 0.3)).y + cos(dot(p, normalize(vec2(-0.4, 1.0))) * 0.09 + uT * 1.6) * 0.09 * 0.35 * normalize(vec2(-0.4, 1.0)).y;
        float r1 = nz(p * 0.35 + vec2(uT * 0.3, uT * 0.2)), r2 = nz(p * 0.9 - vec2(uT * 0.5, -uT * 0.3));
        vec3 n = normalize(vec3(-dx * uAmp * 3.0 + (r1 - 0.5) * 0.18, 1.0, -dz * uAmp * 3.0 + (r2 - 0.5) * 0.18));
        vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - max(dot(n, V), 0.0), 3.0);
        vec3 col = mix(uShal, uDeep, clamp(0.55 + vH * 0.25, 0.0, 1.0)); col = mix(col, uSky, fr * 0.65);
        vec3 H = normalize(uSun + V); float sp = pow(max(dot(n, H), 0.0), 220.0) * 2.2 + pow(max(dot(n, H), 0.0), 30.0) * 0.12; col += uSunC * sp;
        float foam = smoothstep(0.62, 0.9, vH / max(0.3, uAmp) + r1 * 0.35) * uFoam; col = mix(col, vec3(0.95, 0.98, 1.0), foam * 0.55);
        if (uShore.w > 0.0) { float d = length(vW.xz - uShore.xy) - uShore.z; float band = 1.0 - smoothstep(0.0, 9.0, abs(d - 2.0 - sin(uT * 1.2 + atan(vW.z - uShore.y, vW.x - uShore.x) * 6.0) * 1.2)); col = mix(col, vec3(0.97, 1.0, 1.0), band * 0.6 * step(-6.0, d)); col = mix(col, vec3(0.35, 0.85, 0.85), (1.0 - smoothstep(0.0, 22.0, d)) * 0.35); }
        float dist = length(vW - cameraPosition); float f = 1.0 - exp(-pow(dist * uFogD, 2.0)); col = mix(col, uFogC, clamp(f, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.receiveShadow = false; mesh.renderOrder = -1; mesh.position.y = o.y || 0;
  mesh.userData.U = U; return mesh;
}
// keep sea uniforms in sync with the scene (fog, sun) every frame
export function updateSea(mesh, dt, scene, sunDir) { const U = mesh.userData.U; U.uT.value += dt; if (scene.fog) { U.uFogC.value.copy(scene.fog.color); U.uFogD.value = scene.fog.density; } if (sunDir) U.uSun.value.copy(sunDir); }
