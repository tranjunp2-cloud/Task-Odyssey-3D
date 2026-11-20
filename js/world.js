// Dựng hòn đảo Design Trip: đường vòng khép kín, 8 phòng ban + đảo Dev, cây, đèn, nước.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { STATIONS, FEATURES } from './data.js';
import { CL, CH, CW, TRAILER_TOP, PM, room, desk, chair, plant, tallPlant, wallBoard, bookshelf, sofa, roundTable, bigScreen, phoneStand, tripod, boxes, coffeeBar, bot, bots, tickBots, fileCard, screens, roomLights, miniAgent, colorMat, makeHuman, walkCycle } from './props.js';
export { CL, CH, TRAILER_TOP } from './props.js';

export const COL = { dark: '#0b1a24', cream: '#efede8', ink: '#0a0f12', orange: '#ff5a1f', sea: '#0e3b5c' };
export const LANE = 1.2;
export const seeded = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- textures ----------
const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export function signTex(top, bottom, accent = COL.orange) {
  const [c, x] = canvas(512, 256);
  x.fillStyle = COL.dark; x.fillRect(0, 0, 512, 256); x.strokeStyle = '#fff'; x.lineWidth = 10; x.strokeRect(14, 14, 484, 228);
  x.fillStyle = '#fff'; x.font = '900 60px Montserrat'; x.fillText(top, 40, 118, 432);
  x.fillStyle = accent; x.font = '600 42px "JetBrains Mono"'; x.fillText(bottom, 40, 194, 432);
  return tex(c);
}
const winTex = (() => { const [c, x] = canvas(128, 256); x.fillStyle = '#000'; x.fillRect(0, 0, 128, 256);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 6; k++) if (seeded(r * 9 + k) > 0.42) { x.fillStyle = seeded(r + k * 3) > 0.3 ? '#ffd9a0' : '#9fd0ff'; x.fillRect(8 + k * 20, 8 + r * 15.5, 11, 8); }
  return tex(c); })();
const grassTex = (() => { const [c, x] = canvas(512, 512); x.fillStyle = '#a9c98a'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { const r = 6 + seeded(i) * 26; x.fillStyle = seeded(i + 7) > .5 ? 'rgba(126,170,98,.22)' : 'rgba(204,226,160,.22)'; x.beginPath(); x.arc(seeded(i + 1) * 512, seeded(i + 2) * 512, r, 0, 7); x.fill(); }
  for (let i = 0; i < 2600; i++) { x.fillStyle = seeded(i + 3) > .5 ? 'rgba(90,140,80,.35)' : 'rgba(230,240,190,.35)'; x.fillRect(seeded(i + 4) * 512, seeded(i + 5) * 512, 2, 3); }
  const t = tex(c, true); t.repeat.set(1 / 22, 1 / 22); return t; })();
const poolTex = (() => { const [c, x] = canvas(128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
// artboard: wireframe (xám) hoặc UI đã lên màu
function artTex(i, ui) {
  const [c, x] = canvas(320, 224), r = k => seeded(i * 31 + k);
  x.fillStyle = ui ? '#fbfaf7' : '#f4f2ee'; x.fillRect(0, 0, 320, 224);
  const ink = ui ? '#0b1a24' : '#9aa3a8', acc = ui ? COL.orange : '#b8bfc3', soft = ui ? '#d8e6ee' : '#e2e2de';
  x.lineWidth = 3; x.strokeStyle = ink; x.fillStyle = ink;
  ui ? x.fillRect(14, 14, 292, 22) : x.strokeRect(14, 14, 292, 22);
  const layout = Math.floor(r(1) * 3);
  if (layout === 0) { x.fillStyle = soft; x.fillRect(14, 48, 170, 110); if (!ui) { x.strokeRect(14, 48, 170, 110); x.beginPath(); x.moveTo(14, 48); x.lineTo(184, 158); x.moveTo(184, 48); x.lineTo(14, 158); x.stroke(); }
    x.fillStyle = ink; for (let k = 0; k < 4; k++) x.fillRect(200, 56 + k * 20, 100 - r(k + 2) * 40, 8); x.fillStyle = acc; x.fillRect(200, 140, 80, 18); }
  else if (layout === 1) { for (let k = 0; k < 3; k++) { x.fillStyle = soft; x.fillRect(14 + k * 100, 50, 90, 70); if (!ui) x.strokeRect(14 + k * 100, 50, 90, 70); x.fillStyle = ink; x.fillRect(14 + k * 100, 128, 70, 7); x.fillStyle = acc; x.fillRect(14 + k * 100, 142, 40, 12); } }
  else { x.fillStyle = ink; x.fillRect(60, 56, 200, 12); x.fillRect(90, 76, 140, 8); x.fillStyle = soft; x.fillRect(70, 96, 180, 26); x.fillRect(70, 128, 180, 26); if (!ui) { x.strokeRect(70, 96, 180, 26); x.strokeRect(70, 128, 180, 26); } x.fillStyle = acc; x.fillRect(110, 164, 100, 22); }
  x.fillStyle = ink; for (let k = 0; k < 3; k++) x.fillRect(14, 176 + k * 12, 260 - r(k + 9) * 120, 6);
  return tex(c);
}

export function buildWorld(scene) {
  const W = { stations: {}, night: { lamps: [], pools: [], windows: [], heads: [] }, anim: {} };

  // ---------- materials ----------
  const M = W.mats = {
    steel: new THREE.MeshStandardMaterial({ color: '#1a2128', roughness: .5, metalness: .3 }),
    orange: new THREE.MeshStandardMaterial({ color: COL.orange, roughness: .45 }),
    pole: new THREE.MeshStandardMaterial({ color: '#2a333a', roughness: .5 }),
    white: new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: .5 }),
    ground: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }),
    pad: new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: .95 }),
    curb: new THREE.MeshStandardMaterial({ color: '#efebe2', roughness: .8 }),
    sand: new THREE.MeshStandardMaterial({ color: '#f0e2bf', roughness: 1 }),
    quay: new THREE.MeshStandardMaterial({ color: '#c9c3b7', roughness: .9 }),
    soil: new THREE.MeshStandardMaterial({ color: '#b9ae97', roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: '#13232e', roughness: .2, metalness: .5 }),
    bld: new THREE.MeshStandardMaterial({ color: '#8a949a', roughness: .8, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0 }),
    bldLight: new THREE.MeshStandardMaterial({ color: '#eae6dc', roughness: .8, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0 }),
    lamp: new THREE.MeshStandardMaterial({ color: COL.orange, emissive: '#ffc58a', emissiveIntensity: 0, roughness: .4 }),
    pool: new THREE.MeshBasicMaterial({ map: poolTex, color: '#ffb26b', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    glow: new THREE.MeshStandardMaterial({ color: COL.orange, emissive: COL.orange, emissiveIntensity: 0.4 }),
  };
  W.night.windows.push(M.bld, M.bldLight); W.poolTex = poolTex;
  const add = (o, parent = scene) => { parent.add(o); return o; };
  const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m, parent); };
  const plane = (w, h, mat, parent) => add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat), parent);
  const board = (top, bottom, w, x, y, z, parent, ry = 0) => { const m = plane(w, w / 2, new THREE.MeshBasicMaterial({ map: signTex(top, bottom) }), parent); m.position.set(x, y, z); m.rotation.y = ry; return m; };
  W.helpers = { box, board };

  // ---------- road curve (closed loop, clockwise seen from above) ----------
  const PTS = [[-50, 18], [-48, 0], [-38, -14], [-20, -24], [0, -26], [20, -22], [33, -12], [40, 2], [44, 16], [40, 30], [22, 37], [-6, 39], [-34, 34]];
  const curve = new THREE.CatmullRomCurve3(PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const N = 1600, L = curve.getLength(), P = curve.getSpacedPoints(N), T = [];
  for (let i = 0; i <= N; i++) T.push(curve.getTangentAt((i % N) / N));
  W.L = L;
  W.at = (d, out = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() }) => {
    d = ((d % L) + L) % L; const f = d / L * N, i = Math.min(N - 1, Math.floor(f)), k = f - i;
    out.pos.lerpVectors(P[i], P[i + 1], k); out.tan.lerpVectors(T[i], T[i + 1], k).normalize(); out.right.set(-out.tan.z, 0, out.tan.x); return out;
  };
  const nearestD = (x, z) => { let b = 0, bd = 1e9; for (let i = 0; i < N; i++) { const dx = P[i].x - x, dz = P[i].z - z, q = dx * dx + dz * dz; if (q < bd) { bd = q; b = i; } } return b / N * L; };
  const roadDist = (x, z) => { let bd = 1e9; for (let i = 0; i < N; i += 4) { const dx = P[i].x - x, dz = P[i].z - z; bd = Math.min(bd, dx * dx + dz * dz); } return Math.sqrt(bd); };
  W.roadPts = P;

  // station frames: local +x = travel direction, local +z = right (inside the loop), local -z = outside
  const frames = {};
  for (const s of STATIONS) if (s.anchor || s.anchorD) {
    const d = s.anchor ? nearestD(...s.anchor) : frames[s.anchorD[0]].d + s.anchorD[1], f = W.at(d), g = new THREE.Group();
    g.position.copy(f.pos); g.rotation.y = Math.atan2(-f.tan.z, f.tan.x); scene.add(g);
    frames[s.key] = { d, group: g, frame: { pos: f.pos.clone(), tan: f.tan.clone(), right: f.right.clone() } };
  }

  // parking lots in front of each department: lot x in the station frame, side +1 = inside the loop, -1 = outside
  const VLOT = W.VLOT = { design: { x: 2, side: 1, rows: 3 }, techreview: { x: 3, side: 1, rows: 2 }, test: { x: 3, side: -1, rows: 2 }, review: { x: -6, side: 1, rows: 2 }, handoff: { x: -9, side: 1, rows: 2 } };

  // ---------- island (offset of the road outward, wider where stations need room) ----------
  const dOf = k => frames[k].d;
  const bump = (d, c, w) => { let x = Math.abs(d - c); x = Math.min(x, L - x); return Math.exp(-(x * x) / (2 * w * w)); };
  const margin = d => 19 + 15 * bump(d, dOf('design'), 22) + 4 * bump(d, dOf('research'), 12) - 9.5 * bump(d, dOf('handoff'), 9) + 3 * bump(d, dOf('task'), 10);
  const shapePts = [], sandPts = [];
  for (let i = 0; i < 400; i++) { const d = i / 400 * L, f = W.at(d), m = margin(d);
    shapePts.push(new THREE.Vector2(f.pos.x - f.right.x * m, -(f.pos.z - f.right.z * m)));
    sandPts.push(new THREE.Vector2(f.pos.x - f.right.x * (m + 2.6), -(f.pos.z - f.right.z * (m + 2.6)))); }
  const extr = (pts, depth, mat, y) => { const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.y = y - depth; m.receiveShadow = true; return add(m); };
  extr(shapePts, 1.2, M.ground, 0); extr(sandPts, 1.0, M.sand, -0.18);
  W.islandPoly = shapePts.map(v => [v.x, -v.y]);
  // turquoise shallows + a foam line around the beach
  W.foamM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false });
  W.shallowM = new THREE.MeshBasicMaterial({ color: '#7fe8e0', transparent: true, opacity: .36, depthWrite: false });
  const ringAt = (m0, m1, mat, y) => { const o = [], h = [];
    for (let i = 0; i < 400; i++) { const d = i / 400 * L, f = W.at(d), m = margin(d); o.push(new THREE.Vector2(f.pos.x - f.right.x * (m + m1), -(f.pos.z - f.right.z * (m + m1)))); h.push(new THREE.Vector2(f.pos.x - f.right.x * (m + m0), -(f.pos.z - f.right.z * (m + m0)))); }
    const sh = new THREE.Shape(o); sh.holes.push(new THREE.Path(h)); const g = new THREE.ShapeGeometry(sh, 1); g.rotateX(-Math.PI / 2); const mesh = new THREE.Mesh(g, mat); mesh.position.y = y; return add(mesh); };
  ringAt(2.2, 11, W.shallowM, -0.535); W.foam = ringAt(2.4, 3.6, W.foamM, -0.5);
  const inPoly = (x, z, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside; } return inside; };

  // ocean
  const ocean = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime; uniform float uNight; varying vec2 vW;
      void main(){ vec2 p = vW*.18; vec2 q = p + .8*vec2(sin(p.y*.9+uTime*.3), sin(p.x*.8-uTime*.25));
        float w = .5*sin(q.x*1.1+q.y*.6+uTime*1.1) + .35*sin(q.y*1.7-q.x*.8-uTime*.9) + .2*sin((q.x-q.y)*3.3+uTime*1.9);
        float fk = smoothstep(60., 260., length(vW - vec2(20., 8.)));
        vec3 nearC = mix(vec3(.06,.46,.62), vec3(.16,.62,.76), .5+.3*w);
        vec3 deep = mix(vec3(.04,.33,.55), vec3(.10,.47,.68), .5+.3*w);
        vec3 day = mix(nearC, deep, fk) + smoothstep(.75,1.15,w)*.14;
        vec3 night = mix(vec3(.02,.07,.13), vec3(.04,.12,.2), .5+.3*w);
        gl_FragColor = vec4(mix(day, night, uNight), 1.); }` });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), ocean); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.55; add(sea);
  W.ocean = ocean;

  // road ribbon with lane markings
  { const [c, x] = canvas(128, 256); x.fillStyle = '#3d434a'; x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 700; i++) { x.fillStyle = seeded(i) > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; x.fillRect(seeded(i + 1) * 128, seeded(i + 2) * 256, 2, 2); }
    x.fillStyle = '#ffd36b'; x.fillRect(61, 0, 6, 120); x.fillStyle = '#f7f3ea'; x.fillRect(6, 0, 4, 256); x.fillRect(118, 0, 4, 256);
    const t = tex(c, true); t.repeat.set(1, 1);
    const RW = 4.8, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const p = P[i], t2 = T[i], r = new THREE.Vector3(-t2.z, 0, t2.x), v = i / N * L / 6;
      pos.push(p.x - r.x * RW / 2, 0.03, p.z - r.z * RW / 2, p.x + r.x * RW / 2, 0.03, p.z + r.z * RW / 2); uv.push(0, v, 1, v);
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const road = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, roughness: .85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })); road.receiveShadow = true; add(road);
    // curbs on both edges
    for (const side of [-1, 1]) { const cp = [], ci = [];
      for (let i = 0; i <= N; i++) { const p = P[i], t2 = T[i], r = new THREE.Vector3(-t2.z, 0, t2.x), a = side * 2.4, b = side * 2.75;
        cp.push(p.x + r.x * a, 0.09, p.z + r.z * a, p.x + r.x * b, 0.09, p.z + r.z * b); if (i < N) { const k = i * 2; side > 0 ? ci.push(k, k + 2, k + 1, k + 1, k + 2, k + 3) : ci.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci); cg.computeVertexNormals();
      const curb = new THREE.Mesh(cg, M.curb); curb.material.side = THREE.DoubleSide; curb.receiveShadow = true; add(curb); } }

  const excl = [];   // circles kept clear of trees
  for (const k in frames) excl.push([frames[k].frame.pos.x, frames[k].frame.pos.z, 9]);
  const nFrameExcl = excl.length;
  const obst = [];   // things a street lamp must not stand in (posts, booths, cranes…)
  const obstL = (g, x, z, r) => { g.updateMatrixWorld(true); const p = g.localToWorld(new THREE.Vector3(x, 0, z)); obst.push([p.x, p.z, r]); };

  // ---------- people ----------
  W.people = [];
  const person = (label, color, parent, x, z, { seat = false } = {}) => {
    const h = makeHuman({ seed: W.people.length + 1, shirt: color, pose: seat ? 'seat' : 'stand' }), g = h.g; g.position.set(x, 0, z); parent.add(g);
    // ngồi: tìm ghế/sofa gần nhất để ngồi đúng chỗ và quay mặt đúng hướng; đứng: quay về giữa phòng
    let yaw = Math.atan2(-x, -z);
    if (seat) { parent.updateMatrixWorld(true); const me = parent.localToWorld(new THREE.Vector3(x, 0, z)); let best = null, bd = 0.9;
      parent.traverse(o => { if (!o.userData.seat) return; const p = o.getWorldPosition(new THREE.Vector3()), d = Math.hypot(p.x - me.x, p.z - me.z); if (d < bd) { bd = d; best = o; } });
      if (best) { const wp = best.getWorldPosition(new THREE.Vector3()), dir = new THREE.Vector3(0, 0, best.userData.seat).transformDirection(best.matrixWorld), inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
        const lp = parent.worldToLocal(wp.clone()); g.position.set(lp.x, 0, lp.z); dir.transformDirection(inv); yaw = Math.atan2(dir.x, dir.z);
        if (best.userData.seat < 0) g.position.y = 0.02; }
      else yaw = Math.PI; }
    g.rotation.y = yaw;
    W.people.push({ label, group: g, seed: W.people.length, human: h }); return g;
  };


  // ---------- departments: each station is a cutaway office with desks, tools and an AI assistant ----------
  const sign = (top, bottom, w = 3.2) => (g, x, y, z) => board(top, bottom, w, x, y, z, g, Math.PI);
  W.rooms = {};
  const dept = (frameKey, opts, spots) => { const r = room(frames[frameKey].group, opts); r.spots = spots.map(([x, z]) => new THREE.Vector3(x, 0.22, z)); W.rooms[frameKey] = r; const c = new THREE.Vector3(); r.g.updateMatrixWorld(true); r.g.getWorldPosition(c); excl.push([c.x, c.z, Math.max(opts.w, opts.d) * 0.8]); return r; };

  // ---------- 01 task: Product / PM room + task portal over the road ----------
  { const { group: g } = frames.task, TOP = 6.2;
    for (const x of [-2.4, 2.4]) { for (const z of [-8.2, 3.2]) { box(0.32, TOP, 0.32, M.white, x, TOP / 2, z, g); box(0.7, 0.3, 1.2, M.orange, x, 0.15, z, g); }
      box(0.44, 0.44, 12.2, M.white, x, TOP + 0.22, -2.5, g); box(0.46, 0.08, 12.2, M.glow, x, TOP - 0.02, -2.5, g); }
    const trolley = new THREE.Group(); g.add(trolley); box(5.2, 0.36, 0.9, M.steel, 0, TOP - 0.15, 0, trolley);
    const cables = [-0.6, 0.6].map(dx => box(0.04, 1, 0.04, M.steel, dx, 0, 0, trolley));
    const spreader = box(CL + 0.2, 0.12, CW + 0.1, M.orange, 0, 0, 0, trolley);
    // brief counter: new task files wait here
    const cardPal = ['#ff5a1f', '#1f6f8b', '#7b5cff', '#2bd47d', '#e9b949', '#e86a92'];
    const counter = (x, n) => { box(2.2, 0.9, 1.7, M.white, x, 0.45, -5, g); box(2.3, 0.06, 1.8, M.orange, x, 0.93, -5, g);
      for (let l = 0; l < n; l++) { const c = fileCard(cardPal[(l + Math.abs(x)) % 6 | 0]); c.children[1].visible = false; c.position.set(x, 0.96 + CH / 2 + l * CH, -5); g.add(c); } };
    counter(0, 3); counter(-5.4, 4); counter(5.4, 2);
    const r = dept('task', { x: 8.6, z: 8.6, w: 8.4, d: 6, back: 1, accent: '#3fb5ff', board: sign('PHÒNG PRODUCT', 'nhận task · brief') }, [[-1.4, -1.0], [-0.1, -0.3], [-0.6, 0.6], [0.4, -1.5]]);
    wallBoard(r.in, 'kanban', -0.6, 1.45, r.wallZ, 4.2, Math.PI);
    desk(r.in, -2.2, 1.5, Math.PI, { screen: 'ui', s: 1, chairColor: '#3fb5ff' }); desk(r.in, 0.6, 1.5, Math.PI, { screen: 'chart', s: 2, chairColor: '#3fb5ff' });
    coffeeBar(r.in, r.leftX + 0.35, -1, Math.PI / 2); plant(r.in, 3.6, 2.3); tallPlant(r.in, -3.6, -2.4);
    person('PM', '#3fb5ff', r.in, 2.6, -0.6); person('', '#e9b949', r.in, -2.2, 2.25, { seat: true });
    bot(r.in, 1.2, -1.6, 'AI viết brief', 'Brief: mục tiêu, người dùng, tiêu chí nghiệm thu');
    // waiting lot: empty cars park here until there is a task for them
    // carport ("nhà xe"): 4 open bays with EV chargers, set back from the curve
    const LX = -12, LZ = 7.4, SP = 2.6, PARK = [0, 1, 2, 3].map(k => new THREE.Vector3(LX, 0, LZ + k * SP));
    const zMin = LZ - 1.4, zMax = LZ + 3 * SP + 1.4, zc = (zMin + zMax) / 2;
    const pad = box(7, 0.06, zMax - zMin + 0.6, new THREE.MeshStandardMaterial({ color: '#4a5058', roughness: .9 }), LX, 0.035, zc, g); pad.receiveShadow = true;
    const lineM = new THREE.MeshBasicMaterial({ color: '#f7f3ea' });
    for (let k = 0; k <= 4; k++) box(4.6, 0.02, 0.1, lineM, LX, 0.075, LZ - SP / 2 + k * SP, g);
    for (let k = 0; k < 4; k++) { const n = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: signTex('P', '', '#3fb5ff'), transparent: true, opacity: .85 })); n.rotation.x = -Math.PI / 2; n.position.set(LX + 1.5, 0.08, LZ + k * SP); g.add(n); }
    // EV chargers on the bay lines
    const chgM = new THREE.MeshStandardMaterial({ color: '#2bd47d', emissive: '#2bd47d', emissiveIntensity: .8 });
    for (let k = 0; k < 3; k++) { const z = LZ + SP / 2 + k * SP; box(0.28, 1.1, 0.28, M.white, LX - 1.1, 0.55, z, g); box(0.3, 0.12, 0.3, chgM, LX - 1.1, 0.95, z, g); }
    board('NHÀ XE', 'chờ task · 4 chỗ', 3.2, LX - 4.6, 2.6, zc, g, -Math.PI / 2); for (const dz of [-1.2, 1.2]) box(0.1, 1.9, 0.1, M.pole, LX - 4.65, 0.95, zc + dz, g);
    W.parks = { task: { slots: PARK, group: g, aisleX: LX + 3.3 } };
    { g.updateMatrixWorld(true); const c = g.localToWorld(new THREE.Vector3(LX, 0, zc)); excl.push([c.x, c.z, 9]); obst.push([c.x, c.z, 7]); const c2 = g.localToWorld(new THREE.Vector3(0, 0, -5)); excl.push([c2.x, c2.z, 8]); }
    W.anim.gantry = { trolley, cables, spreader, TOP, stackZ: -5, laneZ: LANE, grabY: 0.96 + 3 * CH + 0.08 };
    obstL(g, 0, 3.2, 3.4); obstL(g, 0, -5, 8);
  }

  // ---------- 02 research: research room with bookshelves, moodboard, interview corner ----------
  { const { group: g } = frames.research;
    const r = dept('research', { x: -1.5, z: -10.8, w: 10, d: 7, back: -1, accent: '#e9b949', board: sign('PHÒNG RESEARCH', 'ref · insight · user') }, [[-0.6, -1.4], [1.8, -0.1], [-0.8, 0.5]]);
    wallBoard(r.in, 'mood', 1, 1.45, r.wallZ, 4.4, Math.PI);
    bookshelf(r.in, r.leftX + 0.22, -1.3, -Math.PI / 2, 2.2); bookshelf(r.in, r.leftX + 0.22, 1.2, -Math.PI / 2, 2.2);
    desk(r.in, 2.8, 2, Math.PI, { screen: 'ui', s: 4, chairColor: '#e9b949', lamp: true }); desk(r.in, 0, 2, Math.PI, { mon: 2, screen: 'chart', s: 5, chairColor: '#e9b949' });
    sofa(r.in, -2.2, -1.9, Math.PI, '#1f6f8b'); chair(r.in, -2.2, -0.2, Math.PI, '#ff5a1f');
    plant(r.in, 4.4, -2.9); tallPlant(r.in, -4.3, 2.9);
    person('Designer', '#ff5a1f', r.in, 0.8, -0.8); person('User', '#c9b6ff', r.in, -2.2, -1.8, { seat: true });
    bot(r.in, 3.2, -1.1, 'AI tổng hợp', 'Gom 20 ref thành 3 insight chính');
    const mag = new THREE.Group(); mag.position.set(5.6, 4.2, -9.5); g.add(mag);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.16, 12, 36), M.orange); mag.add(ring);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(1.0, 32), new THREE.MeshStandardMaterial({ color: '#bfe3f5', transparent: true, opacity: .45, side: THREE.DoubleSide })); mag.add(lens);
    box(0.24, 1.6, 0.24, M.steel, 0, -1.8, 0, mag);
    box(0.12, 2.6, 0.12, M.pole, 5.6, 1.3, -9.5, g);
    W.anim.mag = mag; W.anim.magY = 4.2;
    // research lot (outside the loop, past the room): 3 bays, cars stay ~30 s
    const RS = [0, 1, 2].map(k => new THREE.Vector3(15, 0, -5.4 - k * 2.5));
    const pad = box(12.5, 0.06, 9, M.pad, 15.2, 0.03, -7.9, g); pad.receiveShadow = true;
    const lineM = new THREE.MeshBasicMaterial({ color: '#f7f3ea' });
    for (let k = 0; k <= 3; k++) box(5.2, 0.02, 0.1, lineM, 15.4, 0.07, -4.15 - k * 2.5, g);
    box(0.1, 0.02, 7.6, lineM, 18.05, 0.07, -7.9, g);
    board('BÃI RESEARCH', '3 chỗ · ~30s', 3.4, 15.2, 2.6, -12.6, g); for (const dx of [-1.3, 1.3]) box(0.1, 1.9, 0.1, M.pole, 15.2 + dx, 0.95, -12.7, g);
    W.researchLot = { slots: RS, group: g };
    { g.updateMatrixWorld(true); const c = g.localToWorld(new THREE.Vector3(15, 0, -8)); excl.push([c.x, c.z, 9]); }
  }

  // ---------- 04 design studio + artboard fields ----------
  W.parks.research = W.researchLot;
  W.plots = [];
  { const { group: g } = frames.design;
    const r = dept('design', { x: 2, z: 16.4, w: 9, d: 7, back: 1, accent: '#ff5a1f', board: sign('XƯỞNG DESIGN', 'wireframe → UI') }, [[-1.6, -1.2], [0, 0.3], [-2.4, 0.5]]);
    wallBoard(r.in, 'palette', 1.2, 1.45, r.wallZ, 4, Math.PI);
    bigScreen(r.in, r.leftX + 0.5, 0.2, -Math.PI / 2, 'figma', 2.6);
    desk(r.in, -1.2, 1.9, Math.PI, { mon: 2, screen: 'figma', s: 1, chairColor: '#ff5a1f', tablet: true }); desk(r.in, 2.3, 1.9, Math.PI, { mon: 2, screen: 'ui', s: 2, chairColor: '#ff5a1f', tablet: true });
    desk(r.in, 1.2, -1.3, 0, { screen: 'figma', s: 3, chairColor: '#0b1a24', tablet: true });
    tallPlant(r.in, 4, -2.9); plant(r.in, -3.8, 2.9);
    person('Designer', '#ff5a1f', r.in, -1.2, 2.65, { seat: true }); person('', '#7b5cff', r.in, 2.3, 2.65, { seat: true });
    bot(r.in, 3.6, 0.2, 'AI Copilot', 'Gợi ý layout, đặt tên layer, kiểm tra tương phản');
    // 12 feature workbenches, each with its own design agent painting the UI over the wireframe
    const AG_COL = ['#ff5a1f', '#3fb5ff', '#7b5cff', '#2bd47d', '#e9b949', '#e86a92', '#1f6f8b', '#ff9f5a', '#5ff3ff', '#b5452d', '#a3d65c', '#c9a6ff'];
    const baseM = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: .7 }), frameM = new THREE.MeshStandardMaterial({ color: '#1d2329', roughness: .5 });
    FEATURES.forEach((f, i) => {
      const c = i % 4, rr = Math.floor(i / 4), x = -14.5 + c * 9.6, z = -9 - rr * 7.4, col = AG_COL[i];
      const pg = new THREE.Group(); pg.position.set(x, 0, z); g.add(pg);
      const edgeM = new THREE.MeshStandardMaterial({ color: '#9aa3a8', emissive: '#9aa3a8', emissiveIntensity: .25, roughness: .5 });
      box(8.7, 0.16, 6.3, edgeM, 0, 0.08, 0, pg); box(8.4, 0.18, 6.0, baseM, 0, 0.17, 0, pg);
      for (const [dx, dz, w, d] of [[0, -2.62, 7.7, .1], [0, 2.62, 7.7, .1], [-3.8, 0, .1, 5.34], [3.8, 0, .1, 5.34]]) box(w, 0.08, d, frameM, dx, 0.3, dz, pg);
      const wire = artTex(i, false), ui = artTex(i, true);
      const art = plane(7.4, 5.1, new THREE.MeshStandardMaterial({ map: wire, roughness: .8, emissive: '#ffffff', emissiveMap: wire, emissiveIntensity: 0 }), pg); art.rotation.x = -Math.PI / 2; art.position.set(0, 0.27, 0);
      const uiM = new THREE.MeshStandardMaterial({ map: ui, roughness: .6, emissive: '#ffffff', emissiveMap: ui, emissiveIntensity: .12 });
      const paint = plane(7.4, 5.1, uiM, pg); paint.rotation.x = -Math.PI / 2; paint.position.set(0, 0.285, 0); paint.visible = false;
      const edgeGlow = box(0.07, 0.03, 5.1, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.3, 0, pg);
      const scanBar = box(0.12, 0.03, 5.1, new THREE.MeshBasicMaterial({ color: '#ffd84d', transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.31, 0, pg); scanBar.visible = false;
      const glitch = plane(7.4, 5.1, new THREE.MeshBasicMaterial({ color: '#ff3b1f', transparent: true, opacity: 0, depthWrite: false }), pg); glitch.rotation.x = -Math.PI / 2; glitch.position.set(0, 0.3, 0);
      // charging pad in the corner
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.12, 24), M.steel); pad.position.set(3.25, 0.32, 2.15); pg.add(pad);
      const padRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: col })); padRing.rotation.x = Math.PI / 2; padRing.position.set(3.25, 0.39, 2.15); pg.add(padRing);
      const agent = miniAgent(col); agent.g.scale.setScalar(1.35); pg.add(agent.g); agent.g.position.set(3.25, 0.9, 2.15);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false })); pg.add(beam); beam.visible = false;
      const agentPool = plane(3.2, 3.2, new THREE.MeshBasicMaterial({ map: poolTex, color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), pg); agentPool.rotation.x = -Math.PI / 2; agentPool.position.y = 0.33;
      const wp = new THREE.Vector3(x, 0, z); g.localToWorld(wp);
      const lp = new THREE.Vector3(0, 0, 3.6); pg.localToWorld(lp);
      W.plots.push({ id: f[0], name: f[1], i, col, group: pg, art, wire, ui, paint, uiM, agentPool, edgeM, edgeGlow, scanBar, glitch, agent, beam, pos: wp, labelPos: lp, prog: i >= 8 ? 1 : 0, mode: null });
      excl.push([wp.x, wp.z, 6]);
    });
    // night shift: floodlight masts around the field + two real lights over it, so the agents keep working after dark
    const flood = new THREE.MeshStandardMaterial({ color: '#fff7e0', emissive: '#fff2cc', emissiveIntensity: 0 });
    const fieldPools = [];
    for (const [x, z] of [[-19.6, -5.4], [19.6, -5.4], [-19.6, -20.2], [19.6, -20.2], [0, -5.4], [0, -20.2]]) {
      box(0.22, 7.5, 0.22, M.pole, x, 3.75, z, g); const head = box(1.4, 0.3, 0.6, M.steel, x, 7.55, z, g); head.rotation.y = 0.3;
      box(1.3, 0.08, 0.5, flood, x, 7.38, z, g);
      const pl = plane(16, 16, new THREE.MeshBasicMaterial({ map: poolTex, color: '#ffe6b8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), g); pl.rotation.x = -Math.PI / 2; pl.position.set(x, 0.36, z); fieldPools.push(pl.material);
      obstL(g, x, z, 1.2); }
    const fieldLights = [[-9.6, -12.8], [9.6, -12.8]].map(([x, z]) => { const l = new THREE.PointLight('#ffe9c4', 0, 34, 1.3); l.position.set(x, 9, z); g.add(l); return l; });
    W.designNight = n => { W.arcade.rimM.emissiveIntensity = 0.4 + n * 2; flood.emissiveIntensity = n * 3; fieldPools.forEach(m => m.opacity = n * 0.35); fieldLights.forEach(l => l.intensity = n * 260);
      for (const P of W.plots) { P.art.material.emissiveIntensity = n * 0.35; P.uiM.emissiveIntensity = 0.12 + n * 0.75; P.agentPool.material.opacity = n * 0.55; } };
  }

  // ---------- 03 define: meeting room with a sticky-note wall (inside the loop, across from the research lot) ----------
  { const r = dept('define', { x: 0, z: 9.8, w: 8, d: 6, back: 1, accent: '#2bd47d', board: sign('PHÒNG DEFINE', 'mục tiêu · tiêu chí') }, [[-0.9, -1.3], [1.6, 1.2], [1.3, -1.4]]);
    wallBoard(r.in, 'sticky', 0.4, 1.45, r.wallZ, 4.4, Math.PI);
    roundTable(r.in, 0.4, 0, 0.8, 4, '#2bd47d');
    plant(r.in, 3.4, 2.3); tallPlant(r.in, -3.4, -2.3);
    person('PM', '#3fb5ff', r.in, 2.6, -1.3); person('Designer', '#ff5a1f', r.in, -1.6, 0.7);
    bot(r.in, -2.6, -1.4, 'AI tóm tắt', '1 câu vấn đề + 3 tiêu chí nghiệm thu');
    W.defineGroup = frames.define.group;
  }
  // ---------- 05 early review: PM + dev look at the design before testing ----------
  { const r = dept('techreview', { x: 3, z: 13, w: 7.4, d: 5.2, back: 1, accent: '#7b5cff', board: sign('REVIEW SỚM', 'PM + Dev', 2.8) }, [[-0.6, -1.05], [0.9, -1.05]]);
    wallBoard(r.in, 'wire', 0, 1.5, r.wallZ, 3.6, Math.PI);
    box(2.8, 0.06, 1.2, PM.white, 0.2, 0.75, -0.2, r.in); for (const sx of [-1, 1]) box(0.06, 0.72, 1.1, PM.dark, 0.2 + sx * 1.3, 0.36, -0.2, r.in);
    box(0.5, 0.02, 0.34, PM.dark, -0.4, 0.79, -0.2, r.in); box(0.44, 0.3, 0.02, PM.dark, -0.4, 0.95, -0.05, r.in);
    for (const [x, z, ry] of [[-0.6, 0.65, Math.PI], [0.9, 0.65, Math.PI], [-0.6, -1.05, 0], [0.9, -1.05, 0]]) chair(r.in, x, z, ry, '#7b5cff');
    plant(r.in, 3.1, 1.9);
    person('Dev', '#3fb5ff', r.in, -0.6, 1.1); person('PM', '#7b5cff', r.in, 0.9, 1.1);
    bot(r.in, -2.6, -0.6, 'AI kiểm tra', 'Component có sẵn ✔ · animation này khó ✗');
    W.reviewGroup = frames.techreview.group;
  }

  // ---------- 06 test: scanner arch over the road + usability lab ----------
  { const { group: g } = frames.test;
    const AX = -10;   // the scanner arch stands before the lot
    for (const z of [-3.3, 3.3]) box(0.3, 5, 0.3, M.white, AX, 2.5, z, g);
    box(0.7, 0.55, 7.2, M.white, AX, 5.0, 0, g); box(0.72, 0.14, 7.22, M.glow, AX, 4.66, 0, g);
    const scanM = new THREE.MeshBasicMaterial({ color: '#ff7a3d', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beam = plane(6.4, 4.4, scanM, g); beam.position.set(AX, 2.3, 0); beam.rotation.y = Math.PI / 2;
    board('USER TEST', '5 người →', 2.6, AX, 6.1, 0, g, 0);
    const r = dept('test', { x: 5, z: -14.5, w: 9.4, d: 6.4, back: -1, accent: '#2bd47d', board: sign('LAB USER TEST', 'prototype v8') }, [[1.6, -1.6], [2.2, 0.2]]);
    wallBoard(r.in, 'persona', -1.6, 1.45, r.wallZ, 3.8, Math.PI);
    box(0.08, 2.2, 3.4, M.glass, 0.6, 1.1, -0.9, r.in); box(0.12, 0.08, 3.4, PM.dark, 0.6, 2.22, -0.9, r.in);   // gương một chiều
    phoneStand(r.in, -2.6, -1.4, Math.PI); chair(r.in, -2.6, -0.7, Math.PI, '#2bd47d'); phoneStand(r.in, -0.8, -1.4, Math.PI);
    tripod(r.in, -1.7, 0.4, Math.PI * 0.8);
    desk(r.in, 2.6, 1.6, Math.PI, { mon: 2, screen: 'chart', s: 6, chairColor: '#2bd47d' });
    plant(r.in, 4.3, -2.6);
    person('User', '#c9b6ff', r.in, -2.6, -0.7, { seat: true }); person('Tester', '#2bd47d', r.in, 2.6, 2.35, { seat: true }); person('User', '#ffd84d', r.in, -0.8, -0.6);
    bot(r.in, 3.6, -1.2, 'AI ghi chú', '3/5 người hoàn thành · 2 lỗi lớn');
    W.anim.scan = { mat: scanM, x: AX }; obstL(g, AX, 0, 4.5);
  }

  // ---------- 07 review: the boss's office, booth, barrier on the forward lane ----------
  { const { group: g } = frames.review;
    const r = dept('review', { x: -4, z: 14, w: 9, d: 7, back: 1, accent: '#0b1a24', board: sign('PHÒNG SẾP', 'duyệt bản cuối') }, [[0.9, 0.4], [2.1, 0.3]]);
    wallBoard(r.in, 'goals', 1.6, 1.45, r.wallZ, 3.8, Math.PI);
    bookshelf(r.in, r.leftX + 0.22, 0.6, -Math.PI / 2, 2.6);
    desk(r.in, 1.4, 1.6, Math.PI, { w: 2.2, screen: 'ui', s: 8, top: PM.darkWood, lamp: true });
    { const ch = chair(r.in, 1.4, 2.4, Math.PI, '#3a2418'); ch.scale.set(1.3, 1.35, 1.2); }
    sofa(r.in, 1.2, -2.2, 0, '#e9e2d0'); box(1.1, 0.4, 0.6, PM.darkWood, 1.2, 0.2, -1.1, r.in);
    tallPlant(r.in, 4, 2.9); tallPlant(r.in, -4, -2.9);
    person('Sếp', '#7b5cff', r.in, 1.4, 2.35, { seat: true });
    bot(r.in, 3.5, -0.6, 'AI chấm điểm', 'Đối chiếu 4 tiêu chí đã chốt ở Define');
    box(1.6, 2.2, 1.6, M.white, 5.2, 1.1, 4.4, g); box(1.64, 0.2, 1.64, M.orange, 5.2, 1.9, 4.4, g); board('SẾP DUYỆT', 'phòng 302', 2.0, 5.2, 2.95, 3.55, g, Math.PI);
    box(0.3, 1.1, 0.3, M.pole, 4.2, 0.55, 3.0, g);
    const stripe = (() => { const [c, x] = canvas(256, 16); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : COL.orange; x.fillRect(i * 32, 0, 32, 16); } return tex(c); })();
    const arm = new THREE.Group(); arm.position.set(4.2, 1.05, 3.0); g.add(arm);
    { const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.0), new THREE.MeshStandardMaterial({ map: stripe })); a.position.z = -1.5; arm.add(a); }
    W.anim.barrier = { arm, open: 0 }; obstL(g, 4.6, 3.8, 2.6);
  }

  // ---------- 08 handoff: handoff room, quay, ship-to-shore crane, ship, and 09 the dev island ----------
  { const { group: g } = frames.handoff;
    const r = dept('handoff', { x: -9, z: 13.5, w: 8.4, d: 6, back: 1, accent: '#1f6f8b', board: sign('PHÒNG BÀN GIAO', 'spec · asset · proto') }, [[0.2, 0.2], [1.3, -0.5]]);
    wallBoard(r.in, 'check', -0.8, 1.45, r.wallZ, 3.8, Math.PI);
    desk(r.in, -1.6, 1.5, Math.PI, { mon: 2, screen: 'ui', s: 9, chairColor: '#1f6f8b' }); desk(r.in, 1.8, 1.5, Math.PI, { screen: 'code', s: 3, chairColor: '#1f6f8b' });
    boxes(r.in, 3.3, -1.8); plant(r.in, -3.6, -2.3);
    person('Designer', '#ff5a1f', r.in, -1.6, 2.25, { seat: true }); person('Dev', '#3fb5ff', r.in, 0.4, -0.9);
    bot(r.in, -2.2, -0.8, 'AI xuất spec', 'Spec, asset, 12 trạng thái đã đủ ✔');
    board('ĐẦU CẦU BÀN GIAO', 'xe → khu dev', 3.6, 6, 3.4, 2.8, g, Math.PI); for (const dx of [-1.2, 1.2]) box(0.1, 2.2, 0.1, M.pole, 6 + dx, 1.1, 2.9, g);
    obstL(g, 6, 2.8, 2);
    // (cảng, cẩu bờ và tàu DEV TEAM đã bỏ: file sang đảo Dev bằng xe tải qua cầu, dựng ở phần "cầu" bên dưới)
    // dev island
    const isle = new THREE.Group(); isle.position.set(4, 0, -42); g.add(isle);
    // (đất, cát, sóng của đảo Dev được dựng chung với đảo QC thành một đảo liền, xem "đảo Dev + QC" bên dưới)
    const dr = room(isle, { x: 0, z: -1.2, w: 9.4, d: 6.4, back: -1, accent: '#3fb5ff', board: sign('DEV TEAM', 'build · design QA') });
    wallBoard(dr.in, 'wire', -1.5, 1.45, dr.wallZ, 3.2, Math.PI);
    desk(dr.in, -2.6, 1.6, Math.PI, { mon: 2, screen: 'code', s: 1, chairColor: '#3fb5ff' }); desk(dr.in, 0.6, 1.6, Math.PI, { mon: 2, screen: 'code', s: 2, chairColor: '#3fb5ff' });
    desk(dr.in, 3, -1.2, 0, { screen: 'ui', s: 5, chairColor: '#ff5a1f' }); coffeeBar(dr.in, dr.leftX + 0.35, -1.2, Math.PI / 2);
    person('Dev 1', '#3fb5ff', dr.in, -2.6, 2.35, { seat: true }); person('Dev 2', '#3fb5ff', dr.in, 0.6, 2.35, { seat: true }); person('Design QA', '#ff5a1f', dr.in, 3, -1.95, { seat: true });
    W.devRoom = dr;
    bot(dr.in, 1.6, -1.6, 'AI review code', 'Build #42: lệch 2px so với thiết kế');
    W.isleTrees = [[6.8, 4.6], [-7, 3.4], [7.4, -4.6], [-2, 7.6], [-6.6, -5.4]];
    // ---------- khu QC: phòng QC + hải đăng release, cùng một đảo với khu Dev ----------
    const qc = new THREE.Group(); qc.position.set(-27, 0, -47); g.add(qc);
    const qr = room(qc, { x: 1.5, z: 0.5, w: 9.4, d: 6.4, back: -1, accent: '#e9b949', board: sign('TEAM QC', 'test case · bug') });
    qr.spots = [];
    wallBoard(qr.in, 'qc', -1.2, 1.45, qr.wallZ, 4, Math.PI);
    desk(qr.in, -2.6, 1.6, Math.PI, { mon: 2, screen: 'chart', s: 4, chairColor: '#e9b949' }); desk(qr.in, 0.8, 1.6, Math.PI, { mon: 2, screen: 'ui', s: 6, chairColor: '#e9b949' });
    phoneStand(qr.in, 3, -1.2, 0); phoneStand(qr.in, 1.8, -1.6, 0); plant(qr.in, -4, -2.6);
    person('Tester 1', '#e9b949', qr.in, -2.6, 2.35, { seat: true }); person('Tester 2', '#e9b949', qr.in, 0.8, 2.35, { seat: true }); person('QC Lead', '#2bd47d', qr.in, 2.4, -0.6);
    bot(qr.in, -2.2, -1.2, 'AI test tự động', 'Chạy 248 test case hồi quy · báo 2 lỗi');
    W.rooms.qc = qr; W.qcRoom = qr;
    // lighthouse: striped tower, glass lantern, rotating beams
    const lh = new THREE.Group(); lh.position.set(-6.2, 0, -5.4); qc.add(lh);
    const redM = new THREE.MeshStandardMaterial({ color: '#d9412b', roughness: .5 });
    for (let i = 0; i < 6; i++) { const r0 = 1.5 - i * 0.14, r1 = 1.5 - (i + 1) * 0.14; const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 1.8, 24), i % 2 ? redM : M.white); seg.position.y = 0.9 + i * 1.8; lh.add(seg); }
    const gal = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.18, 24), M.steel); gal.position.y = 10.9; lh.add(gal);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(0.05, 0.6, 0.05, M.steel, Math.cos(a) * 1.15, 11.3, Math.sin(a) * 1.15, lh); }
    const releaseM = new THREE.MeshStandardMaterial({ color: '#fff2c8', emissive: '#ffd27a', emissiveIntensity: 0.6 });
    const lampL = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), releaseM); lampL.position.y = 11.6; lh.add(lampL);
    { const ll = new THREE.PointLight('#ffe3a0', 0, 30, 1.4); ll.position.y = 11.6; lh.add(ll); W.lighthouseLight = ll; }
    const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 16, 1, true), new THREE.MeshPhysicalMaterial({ color: '#cfeaf7', transparent: true, opacity: .3, roughness: .05, side: THREE.DoubleSide, depthWrite: false })); lant.position.y = 11.65; lh.add(lant);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.9, 16), redM); cap.position.y = 12.75; lh.add(cap);
    const beamM2 = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beams = new THREE.Group(); beams.position.y = 11.6; lh.add(beams);
    for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(2.2, 16, 20, 1, true), beamM2); b.rotation.z = s * Math.PI / 2; b.position.x = s * 8; beams.add(b); }
    board('SẴN SÀNG RELEASE', 'QC pass → 🎆', 3.4, -6.2, 2.6, -3.6, qc);
    W.qcTrees = [[7.2, 5.2], [-8.2, 3.6], [8.4, -4.8], [3, 8.6]];
    // lối đi lát gạch nối khu Dev ↔ khu QC trên đất liền (bản build đi theo lối này sang QC)
    const A = new THREE.Vector3(-8, 0, -1.4).add(isle.position), Bq = new THREE.Vector3(9, 0, 1.2).add(qc.position), mid = A.clone().lerp(Bq, 0.5), len = A.distanceTo(Bq), ang = Math.atan2(-(Bq.z - A.z), Bq.x - A.x);
    const walk = new THREE.Group(); walk.position.copy(mid); walk.rotation.y = ang; g.add(walk);
    box(len + 2, 0.06, 2.6, new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: .9 }), 0, 0.03, 0, walk);
    for (const z of [-1.4, 1.4]) box(len + 2, 0.1, 0.2, M.curb, 0, 0.05, z, walk);
    for (let k = 0; k < 4; k++) { const x = -len / 2 + 3 + k * (len - 6) / 3, z = k % 2 ? 1.7 : -1.7; box(0.1, 2.6, 0.1, M.pole, x, 1.3, z, walk); box(0.45, 0.16, 0.3, M.lamp, x, 2.6, z * 0.85, walk); }
    g.updateMatrixWorld(true);
    W.qc = { isle: qc, lighthouse: lh, beams, beamM: beamM2, bridgeA: g.localToWorld(A.clone().setY(0.9)), bridgeB: g.localToWorld(Bq.clone().setY(0.9)), lampTop: lh.localToWorld(new THREE.Vector3(0, 12, 0)) };
    W.anim.handoff = { isle, group: g, releaseM };
    const iw = new THREE.Vector3(); isle.getWorldPosition(iw); W.devIsland = iw; excl.push([iw.x, iw.z, 13]);
    const qw = new THREE.Vector3(); qc.getWorldPosition(qw); W.qcIsland = qw; excl.push([qw.x, qw.z, 14]);
    // ---------- đảo Dev + QC: một đảo liền, đường bờ là bao lồi của 2 hình tròn quanh 2 khu ----------
    const hull = (ra, rb, n = 72) => { const pts = [];
      for (const [c, r] of [[iw, ra], [qw, rb]]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([c.x + Math.cos(a) * r, c.z + Math.sin(a) * r]); }
      pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
      for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of pts.slice().reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
      return lo.slice(0, -1).concat(hi.slice(0, -1)); };
    const shapeOf = pts => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const slab = (ra, rb, h, top, mat) => { const geo = new THREE.ExtrudeGeometry(shapeOf(hull(ra, rb)), { depth: h, bevelEnabled: false, curveSegments: 1 }); geo.rotateX(-Math.PI / 2); geo.translate(0, top - h, 0);
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; add(m); return m; };
    const band = (r0a, r0b, r1a, r1b, y, mat) => { const sh = shapeOf(hull(r1a, r1b)); sh.holes.push(new THREE.Path(hull(r0a, r0b).map(([x, z]) => new THREE.Vector2(x, -z))));
      const geo = new THREE.ShapeGeometry(sh, 1); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.position.y = y; add(m); return m; };
    slab(9.75, 10.75, 1.2, 0, M.ground); slab(12, 13, 1, -0.18, M.sand);
    band(12, 13, 13.4, 14.4, -0.5, W.foamM); band(12, 13, 19, 20, -0.53, W.shallowM);
    W.devQcHull = hull(12, 13, 36); W.devQcHullAt = hull;
    // cọ trên dải đất mới nối 2 khu
    { const dx = qw.x - iw.x, dz = qw.z - iw.z, L2 = Math.hypot(dx, dz), nx = -dz / L2, nz = dx / L2; W.neckPalms = [];
      for (const f of [0.36, 0.5, 0.64]) for (const sd of [-1, 1]) { const r = 7.6 + (f === 0.5 ? 0.8 : 0); W.neckPalms.push([iw.x + dx * f + nx * sd * r, iw.z + dz * f + nz * sd * r, nx * sd, nz * sd]); } }
  }

  // ---------- USER island: a city where people use the product after release ----------
  // lưới đường: vành đai tròn + 2 đại lộ dọc (x = ±AV) và 2 đại lộ ngang (z = ±AV); 4 ngã tư có đèn giao thông, xe hơi tự dừng khi đèn đỏ
  { const U = new THREE.Group(); U.position.set(114, 0, 42); add(U);
    const R = 31, RING = 26, RW = 3, AV = 10, AW = 3, RIN = RING - RW / 2;
    const dU = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.6, 1.2, 96), M.ground); dU.position.y = -0.6; dU.receiveShadow = true; U.add(dU);
    const sU = new THREE.Mesh(new THREE.CylinderGeometry(R + 2.4, R + 2.9, 1, 96), M.sand); sU.position.y = -0.68; U.add(sU);
    const fU = new THREE.Mesh(new THREE.RingGeometry(R + 2.6, R + 4.2, 112), W.foamM); fU.rotation.x = -Math.PI / 2; fU.position.y = -0.5; U.add(fU);
    const shU = new THREE.Mesh(new THREE.RingGeometry(R + 2.6, R + 10, 112), W.shallowM); shU.rotation.x = -Math.PI / 2; shU.position.y = -0.53; U.add(shU);
    const flat = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; U.add(m); return m; };
    // nền vỉa hè trong vành đai, đường nhựa, công viên trung tâm
    const paveM = new THREE.MeshStandardMaterial({ color: '#cfcac0', roughness: .95 });
    const asphalt = new THREE.MeshStandardMaterial({ color: '#3d434a', roughness: .85 });
    const lineY = new THREE.MeshBasicMaterial({ color: '#f2c94c' }), lineW = new THREE.MeshBasicMaterial({ color: '#f7f3ea' });
    flat(new THREE.CircleGeometry(RING + RW / 2 + 1, 96), paveM, 0.01);
    flat(new THREE.RingGeometry(RIN, RING + RW / 2, 96), asphalt, 0.03);
    for (const r of [RING - 0.04]) flat(new THREE.RingGeometry(r, r + 0.08, 128), lineY, 0.045);
    const AH = Math.sqrt(RING * RING - AV * AV);   // nửa chiều dài đại lộ (chạm vành đai)
    for (const c of [-AV, AV]) { box(AW, 0.03, AH * 2, asphalt, c, 0.035, 0, U); box(AH * 2, 0.031, AW, asphalt, 0, 0.036, c, U);
      for (let k = -AH + 1; k < AH - 1; k += 2.2) { if (Math.abs(Math.abs(k) - AV) < 2.6) continue;
        box(0.08, 0.01, 1.1, lineW, c, 0.06, k, U); box(1.1, 0.01, 0.08, lineW, k, 0.06, c, U); } }
    // vạch qua đường ở 4 ngã tư
    { const zebra = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.01, 1.2), lineW, 4 * 4 * 5), o = new THREE.Object3D(); let n = 0;
      for (const cx of [-AV, AV]) for (const cz of [-AV, AV]) for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 0; k < 5; k++) {
        const along = AW / 2 + 0.9, across = -1.2 + k * 0.6;
        o.position.set(cx + ax * along + (az ? across : 0), 0.065, cz + az * along + (ax ? across : 0)); o.rotation.y = ax ? 0 : Math.PI / 2; o.updateMatrix(); zebra.setMatrixAt(n++, o.matrix); }
      U.add(zebra); }
    const park = new THREE.Mesh(new THREE.BoxGeometry(AV * 2 - AW - 1, 0.12, AV * 2 - AW - 1), M.ground); park.position.y = 0.06; park.receiveShadow = true; U.add(park);
    const plaza = flat(new THREE.CircleGeometry(4.6, 40), M.curb, 0.13);
    const pathM = M.curb; for (const r of [0, Math.PI / 2]) { const p = box(AV * 2 - AW - 1, 0.02, 1.2, pathM, 0, 0.125, 0, U); p.rotation.y = r; }
    // nhà cao tầng trong 8 ô phố quanh công viên
    const towerMats = [], towers = [];
    const winFor = h => { const t = winTex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, Math.max(1, h / 7)); t.needsUpdate = true; return t; };
    const COLS = ['#5f7f96', '#8fa4b3', '#d9d4c8', '#4a6375', '#b7c3cc', '#e8e2d6', '#9db6c9', '#c7b9a6'];
    const cellR = [[-RIN + 0.4, -AV - AW / 2 - 0.6], [-AV + AW / 2 + 0.6, AV - AW / 2 - 0.6], [AV + AW / 2 + 0.6, RIN - 0.4]];
    let bi = 0;
    for (let cx = 0; cx < 3; cx++) for (let cz = 0; cz < 3; cz++) { if (cx === 1 && cz === 1) continue;
      const [x0, x1] = cellR[cx], [z0, z1] = cellR[cz];
      for (const S of [3.8, 2.8]) {   // lô lớn trước, lô nhỏ lấp chỗ trống
        const nx = Math.floor((x1 - x0 + 0.7) / (S + 0.7)), nz = Math.floor((z1 - z0 + 0.7) / (S + 0.7));
        const ox = (x0 + x1) / 2 - (nx - 1) * (S + 0.7) / 2, oz = (z0 + z1) / 2 - (nz - 1) * (S + 0.7) / 2;
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = ox + i * (S + 0.7), z = oz + j * (S + 0.7);
          if (Math.hypot(Math.abs(x) + S / 2, Math.abs(z) + S / 2) > RIN - 0.8) continue;
          if (towers.some(t => Math.abs(t.x - x) < (t.s + S) / 2 + 0.3 && Math.abs(t.z - z) < (t.s + S) / 2 + 0.3)) continue;
          const r = Math.hypot(x, z), k = bi++, h = Math.round(4 + seeded(k * 3 + 1) * 10 + Math.max(0, 20 - r) * 1.1 * (S > 3 ? 1 : 0.5));
          towers.push({ x, z, s: S, h, k }); } } }
    const top = towers.reduce((a, b) => (b.h > a.h ? b : a));
    top.h += 8;   // toà cao nhất: nơi bắn pháo sáng khi user báo lỗi
    for (const T of towers) { const { x, z, s: S, h, k } = T, glass = seeded(k + 40) > 0.6, t = winFor(h);
      const m = new THREE.MeshStandardMaterial({ color: COLS[k % COLS.length], roughness: glass ? .25 : .6, metalness: glass ? .45 : .05, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0 }); towerMats.push(m);
      box(S, h, S, m, x, h / 2, z, U);
      let roof = h;
      if (h > 16 && S > 3) { const h2 = Math.round(h * 0.22), m2 = m.clone(); m2.emissiveMap = winFor(h2); towerMats.push(m2); box(S * 0.66, h2, S * 0.66, m2, x, h + h2 / 2, z, U); roof = h + h2; }
      box(S * (roof > h ? 0.7 : 1.04), 0.3, S * (roof > h ? 0.7 : 1.04), k % 3 ? M.white : M.orange, x, roof + 0.15, z, U);
      if (h > 12 && S > 3 && T !== top) box(S * 0.4, 0.9, S * 0.4, M.steel, x, roof + 0.75, z, U);
      T.roof = roof; }
    W.night.windows.push(...towerMats);
    // biển hiệu công ty trên 4 toà gần camera (mặt +z)
    const signs = [['CÔNG TY A', 'đang dùng app'], ['STARTUP B', '12k user'], ['NGÂN HÀNG C', 'live ✓'], ['SHOP D', 'checkout mới']];
    towers.filter(T => T.s > 3 && T.h > 9).sort((a, b) => b.z - a.z || a.x - b.x).slice(0, 4).forEach((T, i) => board(signs[i][0], signs[i][1], 3.2, T.x, Math.min(T.h - 2, 7 + i), T.z + T.s / 2 + 0.03, U));
    // ăng-ten đèn đỏ nhấp nháy trên toà cao nhất
    box(0.14, 6, 0.14, M.steel, top.x, top.roof + 3, top.z, U);
    const blinkM = new THREE.MeshBasicMaterial({ color: '#ff2a10' }); const blink = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), blinkM); blink.position.set(top.x, top.roof + 6.2, top.z); U.add(blink);
    // màn hình APP LIVE giữa công viên
    const bb = new THREE.Group(); bb.position.set(0, 0.13, -1); U.add(bb);
    for (const sx of [-1, 1]) box(0.25, 5, 0.25, M.steel, sx * 2.6, 2.5, 0, bb);
    box(6.2, 3.8, 0.3, PM.dark, 0, 5.6, 0, bb);
    const appTex = (() => { const [c, x] = canvas(512, 300); x.fillStyle = '#0b1a24'; x.fillRect(0, 0, 512, 300); x.fillStyle = '#f5f3ee'; x.fillRect(150, 20, 212, 260); x.fillStyle = COL.orange; x.fillRect(166, 40, 180, 70);
      x.fillStyle = '#9aa3a8'; for (let i = 0; i < 5; i++) x.fillRect(166, 128 + i * 22, 150 - i * 14, 10); x.fillStyle = '#2bd47d'; x.fillRect(166, 240, 120, 26);
      x.fillStyle = '#fff'; x.font = '900 40px Montserrat'; x.fillText('APP', 30, 80); x.fillText('LIVE', 30, 128); x.fillStyle = '#2bd47d'; x.beginPath(); x.arc(40, 170, 12, 0, 7); x.fill(); return tex(c); })();
    const scr = plane(5.8, 3.4, new THREE.MeshBasicMaterial({ map: appTex }), bb); scr.position.set(0, 5.6, 0.16);
    // cây trong công viên và quanh bờ
    const trunkM = new THREE.MeshStandardMaterial({ color: '#6d5640' }), leafM = new THREE.MeshStandardMaterial({ color: '#77ab63', flatShading: true });
    const tree = (x, z, s = 1) => { box(0.2 * s, 1.4 * s, 0.2 * s, trunkM, x, 0.7 * s + 0.1, z, U); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 * s, 1), leafM); c.position.set(x, 2.1 * s + 0.1, z); U.add(c); };
    for (const [x, z] of [[-5.6, -5.6], [5.6, -5.6], [-5.6, 5.6], [5.6, 5.6], [-6.2, 2], [6.2, -2.4], [2.2, 6.2], [-2.4, -6.2]]) tree(x, z, 0.85);
    for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2 + 0.1, r = R - 1.4; if (k % 4 === 1) continue; if (Math.cos(a) * r < -18 && Math.abs(Math.abs(Math.sin(a) * r) - AV) < 4) continue; tree(Math.cos(a) * r, Math.sin(a) * r, 0.9 + seeded(k + 70) * 0.3); }
    // đèn đường quanh vành đai (sáng ban đêm)
    for (let k = 0; k < 16; k++) { const a = (k + 0.5) / 16 * Math.PI * 2, r = RING + RW / 2 + 0.6, x = Math.cos(a) * r, z = Math.sin(a) * r;
      box(0.12, 3.4, 0.12, M.pole, x, 1.7, z, U); box(0.5, 0.18, 0.3, M.lamp, x - Math.cos(a) * 0.3, 3.4, z - Math.sin(a) * 0.3, U); }
    // ---------- đèn giao thông: 4 ngã tư, đồng bộ theo pha ----------
    const LAMP = { r: ['#ff2a1a', '#3a1410'], y: ['#ffc21a', '#3a3010'], g: ['#2bff6a', '#0f3a1c'] };
    const lightM = { NS: {}, EW: {} }; for (const ax in lightM) for (const c in LAMP) lightM[ax][c] = new THREE.MeshBasicMaterial({ color: LAMP[c][1] });
    const CYCLE = 15, phase = (axis, t) => { const p = (t + (axis === 'EW' ? CYCLE / 2 : 0)) % CYCLE; return p < 5.5 ? 'g' : p < 7 ? 'y' : 'r'; };
    const housingM = new THREE.MeshStandardMaterial({ color: '#1b2228', roughness: .6 }), lampGeo = new THREE.SphereGeometry(0.13, 10, 8);
    // mỗi hướng xe vào ngã tư có một cột đèn ở góc phải, mặt đèn nhìn về phía xe tới
    const addLight = (x, z, faceX, faceZ, axis) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(faceX, faceZ); U.add(g);
      box(0.12, 2.8, 0.12, M.pole, 0, 1.4, 0, g); box(0.36, 1.05, 0.28, housingM, 0, 3.05, 0, g); box(0.5, 0.06, 0.4, housingM, 0, 3.6, 0.05, g);
      ['r', 'y', 'g'].forEach((c, i) => { const l = new THREE.Mesh(lampGeo, lightM[axis][c]); l.position.set(0, 3.38 - i * 0.32, 0.12); g.add(l); }); };
    const C = AW / 2 + 0.35;
    for (const cx of [-AV, AV]) for (const cz of [-AV, AV]) {
      addLight(cx + C, cz - C, 0, -1, 'NS'); addLight(cx - C, cz + C, 0, 1, 'NS');     // xe chạy dọc (theo trục z)
      addLight(cx - C, cz - C, -1, 0, 'EW'); addLight(cx + C, cz + C, 1, 0, 'EW'); }   // xe chạy ngang (theo trục x)
    // ---------- xe hơi ----------
    const CAR_COLS = ['#ff5a1f', '#3fb5ff', '#f4f2ee', '#e9b949', '#2bd47d', '#c9a6ff', '#2a333a', '#ff7aa8', '#d64545', '#7fd6ff'];
    const headLM = new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#fff1c0', emissiveIntensity: 0 }), tailLM = new THREE.MeshStandardMaterial({ color: '#8a1a14', emissive: '#ff2a10', emissiveIntensity: 0 });
    W.night.windows.push(headLM, tailLM);
    const wheelGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 12); wheelGeo.rotateX(Math.PI / 2);
    const wheelM = new THREE.MeshStandardMaterial({ color: '#15191d', roughness: .8 }), glassM = new THREE.MeshStandardMaterial({ color: '#1c2f3d', roughness: .15, metalness: .5 });
    const makeCar = (i, parent = U) => { const g = new THREE.Group(); parent.add(g); const bus = i % 7 === 3, taxi = i % 5 === 1;
      const len = bus ? 3.2 : 1.7, wid = bus ? 0.95 : 0.82, col = bus ? '#ff5a1f' : taxi ? '#ffd84d' : CAR_COLS[i % CAR_COLS.length];
      const bodyM = new THREE.MeshStandardMaterial({ color: col, roughness: .35, metalness: .3 });
      if (bus) { box(len, 1.05, wid, bodyM, 0, 0.72, 0, g); box(len - 0.5, 0.32, wid + 0.02, glassM, -0.1, 0.95, 0, g); box(0.04, 0.5, wid - 0.1, glassM, len / 2, 0.85, 0, g); box(len + 0.02, 0.12, wid + 0.02, M.white, 0, 1.25, 0, g); }
      else { box(len, 0.42, wid, bodyM, 0, 0.4, 0, g); box(len * 0.55, 0.36, wid - 0.08, glassM, -0.12, 0.78, 0, g); box(len * 0.5, 0.05, wid - 0.1, bodyM, -0.12, 0.98, 0, g);
        if (taxi) box(0.32, 0.14, 0.2, M.white, -0.12, 1.07, 0, g); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(wheelGeo, wheelM); w.position.set(sx * len * 0.32, 0.17, sz * wid / 2); g.add(w); }
      for (const sz of [-1, 1]) { box(0.05, 0.1, 0.16, headLM, len / 2, bus ? 0.45 : 0.45, sz * (wid / 2 - 0.14), g); box(0.05, 0.1, 0.16, tailLM, -len / 2, bus ? 0.45 : 0.45, sz * (wid / 2 - 0.14), g); }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      return { g, len, v: 0, vmax: bus ? 3 : 3.6 + seeded(i + 5) * 1.2 }; };
    // tuyến đại lộ: vòng khép kín (làn đi + quay đầu + làn về), u chạy dọc đại lộ, v lệch làn
    const LO = 0.75, H = AH - 2.4, TURN = Math.PI * LO, LOOP = 4 * H + 2 * TURN;
    const loopAt = (s, out) => { s = ((s % LOOP) + LOOP) % LOOP; let u, v, du, dv;
      if (s < 2 * H) { u = -H + s; v = LO; du = 1; dv = 0; }
      else if (s < 2 * H + TURN) { const th = (s - 2 * H) / LO; u = H + LO * Math.sin(th); v = LO * Math.cos(th); du = Math.cos(th); dv = -Math.sin(th); }
      else if (s < 4 * H + TURN) { u = H - (s - 2 * H - TURN); v = -LO; du = -1; dv = 0; }
      else { const th = (s - 4 * H - TURN) / LO; u = -H - LO * Math.sin(th); v = -LO * Math.cos(th); du = -Math.cos(th); dv = Math.sin(th); }
      out.u = u; out.v = v; out.du = du; out.dv = dv; return out; };
    const STOP = AW / 2 + 0.5;   // đầu xe dừng trước vạch qua đường
    const routes = [];
    for (const axis of ['NS', 'EW']) for (const c of [-AV, AV]) {
      const stops = []; for (const p of [-AV, AV]) { stops.push(p - STOP - 1.2 + H); stops.push(2 * H + TURN + (H - (p + STOP + 1.2))); }
      routes.push({ axis, c, stops, cars: [] }); }
    let ci = 0;
    routes.forEach((rt, ri) => { const n = 5; for (let k = 0; k < n; k++) { const car = makeCar(ci++); car.s = (k / n + ri * 0.13) * LOOP; car.v = car.vmax; rt.cars.push(car); } });
    // vành đai: 2 làn ngược chiều, xe chạy đều
    const ringCars = []; for (let k = 0; k < 14; k++) { const car = makeCar(ci++), outer = k % 2; car.r = RING + (outer ? 0.75 : -0.75); car.dir = outer ? 1 : -1; car.a = k / 14 * Math.PI * 2; car.vmax *= 1.1; ringCars.push(car); }
    // người đi bộ quanh công viên, vừa đi vừa xem điện thoại
    const walkers = [];
    for (let i = 0; i < 12; i++) { const h = makeHuman({ seed: 200 + i, shirt: ['#3fb5ff', '#ff7aa8', '#e9b949', '#2bd47d', '#c9a6ff', '#ff5a1f'][i % 6], pose: i % 3 === 0 ? 'phone' : 'stand' }), g2 = h.g; g2.scale.setScalar(0.85); U.add(g2);
      if (h.hand) { const ph = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.02), new THREE.MeshBasicMaterial({ color: '#9fe7ff' })); ph.position.copy(h.hand.position); ph.position.z += 0.03; ph.rotation.x = -0.5; h.hand.parent.add(ph); }
      walkers.push({ g: g2, h, a: i / 12 * Math.PI * 2, r: 4.9 + (i % 2) * 0.9, y0: 0.13, sp: (i % 2 ? -1 : 1) * (0.14 + seeded(i) * 0.06) }); }
    const tmpL = {};
    const tickCity = (t, dt) => {
      for (const ax of ['NS', 'EW']) { const st = phase(ax, t); for (const c of ['r', 'y', 'g']) lightM[ax][c].color.set(LAMP[c][st === c ? 0 : 1]); }
      for (const rt of routes) { const st = phase(rt.axis, t), cars = rt.cars; cars.sort((a, b) => a.s - b.s);
        cars.forEach((car, i) => { const nx = cars[(i + 1) % cars.length];
          let limit = Infinity;
          if (nx !== car) { const d = ((nx.s - car.s) % LOOP + LOOP) % LOOP; limit = d - (nx.len + car.len) / 2 - 0.7; }
          if (st !== 'g') for (const sp of rt.stops) { const d = ((sp - car.s - car.len / 2) % LOOP + LOOP) % LOOP;
            if (d < 9 && !(st === 'y' && d < 1.2)) limit = Math.min(limit, d); }
          const want = Math.min(car.vmax, Math.max(0, limit) * 1.4);
          car.v += Math.max(-9 * dt, Math.min(3 * dt, want - car.v)); car.v = Math.max(0, car.v);
          car.s = ((car.s + Math.min(car.v * dt, Math.max(0, limit))) % LOOP + LOOP) % LOOP; });
        for (const car of cars) { const p = loopAt(car.s, tmpL), x = rt.axis === 'NS' ? rt.c + p.v : p.u, z = rt.axis === 'NS' ? p.u : rt.c + p.v,
            dx = rt.axis === 'NS' ? p.dv : p.du, dz = rt.axis === 'NS' ? p.du : p.dv;
          car.g.position.set(x, 0.04, z); car.g.rotation.y = Math.atan2(-dz, dx); } }
      for (const car of ringCars) { car.a += car.dir * car.vmax * dt / car.r;
        car.g.position.set(Math.cos(car.a) * car.r, 0.04, Math.sin(car.a) * car.r); car.g.rotation.y = Math.atan2(-Math.cos(car.a) * car.dir, -Math.sin(car.a) * car.dir); }
    };
    U.updateMatrixWorld(true);
    W.user = { isle: U, pos: U.position.clone(), plaza: U.localToWorld(new THREE.Vector3(0, 4, -1)), roof: U.localToWorld(new THREE.Vector3(top.x, top.roof + 0.5, top.z)), blinkM, walkers, tickCity, radius: R, makeCar };
    excl.push([U.position.x, U.position.z, R + 4]);
  }

  // ---------- cầu đi bộ nối thành phố User với các đảo khác (không cho xe chạy), đầu cầu nối vào đường giao thông ----------
  // cầu dây văng: đường vòng đảo chính → đại lộ phía bắc thành phố; cầu treo: đại lộ phía nam thành phố → đảo QC (đảo QC đã có cầu sang đảo Dev)
  { const UC = W.user.pos, QC = W.qcIsland, DV = W.devIsland;
    // gạch lát lối đi bộ: viền gạch đậm hai bên, giữa là gạch kem xen hoa văn cam
    const paveTex = (() => { const [c, x] = canvas(128, 128); x.fillStyle = '#b9ad9a'; x.fillRect(0, 0, 128, 128);
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const edge = i === 0 || i === 7, mid = (i === 3 || i === 4) && j % 4 === 1;
        x.fillStyle = edge ? '#9c7b62' : mid ? '#e08a5a' : ['#eee6d8', '#e6dccb', '#f2ebdf'][(i * 3 + j * 5) % 3]; x.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); }
      return tex(c, true); })();
    const deckM = new THREE.MeshStandardMaterial({ map: paveTex, roughness: .9, side: THREE.DoubleSide });
    const concreteM = new THREE.MeshStandardMaterial({ color: '#e4e0d8', roughness: .8 });
    const walkM = new THREE.MeshStandardMaterial({ color: '#6fa860', roughness: .9, side: THREE.DoubleSide });   // bồn cây dọc lan can
    const cableM = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: .4, metalness: .3 });
    const towerM = new THREE.MeshStandardMaterial({ color: COL.orange, roughness: .45 });
    const pylonM = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: .5 });
    const up = new THREE.Vector3(0, 1, 0);
    // thanh nối hai điểm (cột, dây cáp)
    const beam = (a, b, r, mat, round = true) => { const d = b.clone().sub(a), len = d.length();
      const m = new THREE.Mesh(round ? new THREE.CylinderGeometry(r, r, len, 8) : new THREE.BoxGeometry(r * 2, len, r * 2), mat);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); scene.add(m); return m; };
    const onLand = (x, z) => inPoly(x, z, W.islandPoly) || Math.hypot(x - UC.x, z - UC.z) < W.user.radius + 2.2 || inPoly(x, z, W.devQcHull);
    const bridgeWalkers = [], bridgeCars = []; W.bridgePts = [];
    // mặt cầu xe: 4 làn, vạch trắng 2 mép, vạch đứt chia làn, vạch vàng đôi ở giữa
    const roadDeckTex = (() => { const [c, x] = canvas(256, 256); x.fillStyle = '#3d434a'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1400; i++) { x.fillStyle = seeded(i + 1900) > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; x.fillRect(seeded(i + 1901) * 256, seeded(i + 1902) * 256, 2, 2); }
      x.fillStyle = '#f7f3ea'; x.fillRect(6, 0, 6, 256); x.fillRect(244, 0, 6, 256); x.fillRect(62, 0, 5, 128); x.fillRect(189, 0, 5, 128);
      x.fillStyle = '#ffd36b'; x.fillRect(121, 0, 5, 256); x.fillRect(130, 0, 5, 256); return tex(c, true); })();
    const roadDeckM = new THREE.MeshStandardMaterial({ map: roadDeckTex, roughness: .85, side: THREE.DoubleSide }), curbM = new THREE.MeshStandardMaterial({ color: '#c9c4ba', roughness: .9, side: THREE.DoubleSide });
    W.nearBridge = (x, z, r) => W.bridgePts.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < r * r);
    const build = (pts2, { hmax, ramp, kind, walkers = true, deck = 'walk', rampInWater = false, cars = 0 }) => {
      const curve = new THREE.CatmullRomCurve3(pts2.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
      const N = 220, L = curve.getLength(), P = curve.getSpacedPoints(N), S = P.map((_, i) => i / N * L);
      const T = P.map((_, i) => curve.getTangentAt(i / N).setY(0).normalize()), Rv = T.map(t => new THREE.Vector3(-t.z, 0, t.x));
      const water = P.map(p => !onLand(p.x, p.z)), wi = water.indexOf(true), wj = water.lastIndexOf(true), wa = S[wi], wb = S[wj];
      const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      const Y = S.map(s => 0.045 + hmax * (rampInWater ? sm(wa, wa + ramp, s) * (1 - sm(wb - ramp, wb, s)) : sm(wa - ramp * 0.35, wa + ramp * 0.65, s) * (1 - sm(wb - ramp * 0.65, wb + ramp * 0.35, s))));   // rampInWater: hai đầu cầu bằng mặt đất ngay tại bờ
      const at = s => { const f = Math.min(N - 1e-6, Math.max(0, s / L * N)), i = Math.floor(f), k = f - i;
        return { p: P[i].clone().lerp(P[i + 1], k).setY(Y[i] + (Y[i + 1] - Y[i]) * k), t: T[i].clone().lerp(T[i + 1], k).normalize(), r: Rv[i].clone().lerp(Rv[i + 1], k).normalize(), slope: (Y[i + 1] - Y[i]) / (L / N) }; };
      const g = new THREE.Group(); scene.add(g);
      // mặt cầu lát gạch, bồn cây hai bên và thành dầm
      const ribbon = (o0, o1, dy, mat, uvAlong) => { const pos = [], uv = [], idx = [];
        for (let i = 0; i <= N; i++) { const p = P[i], r = Rv[i], y = Y[i] + dy, v = uvAlong ? S[i] / 6 : 0;
          pos.push(p.x + r.x * o0, y, p.z + r.z * o0, p.x + r.x * o1, y, p.z + r.z * o1); uv.push(0, v, 1, v);
          if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; g.add(m); return m; };
      const skirt = (o, mat) => { const pos = [], idx = [];
        for (let i = 0; i <= N; i++) { const p = P[i], r = Rv[i]; pos.push(p.x + r.x * o, Y[i] + 0.2, p.z + r.z * o, p.x + r.x * o, Y[i] - 0.75, p.z + r.z * o); if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: mat.color, roughness: .8, side: THREE.DoubleSide }))); };
      const road = deck === 'road', DW = road ? 3.4 : 2.1, SW = road ? 4.0 : 2.8;   // cầu xe: 4 làn xe + vỉa hè; cầu đi bộ: lối lát gạch + bồn hoa
      if (road) { ribbon(-DW, DW, 0, roadDeckM, true); ribbon(-SW, -DW, 0.15, curbM); ribbon(DW, SW, 0.15, curbM); }
      else { ribbon(-DW, DW, 0, deckM, true); ribbon(-SW, -DW, 0.22, walkM); ribbon(DW, SW, 0.22, walkM); }
      const bottom = ribbon(SW, -SW, -0.75, concreteM); bottom.material = new THREE.MeshStandardMaterial({ color: '#cfc9bf', roughness: .9 });
      skirt(-SW, concreteM); skirt(SW, concreteM);
      // lan can: cột nhỏ (instanced) + tay vịn ống
      const nPost = Math.floor(L / 1.1), posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), cableM, nPost * 2), o3 = new THREE.Object3D();
      for (let k = 0; k < nPost; k++) for (const sd of [-1, 1]) { const a = at(k * 1.1 + 0.5); o3.position.copy(a.p).addScaledVector(a.r, sd * (SW - 0.05)); o3.position.y += 0.5; o3.updateMatrix(); posts.setMatrixAt(k * 2 + (sd > 0), o3.matrix); }
      g.add(posts);
      for (const sd of [-1, 1]) { const rail = []; for (let i = 0; i <= N; i += 4) rail.push(P[i].clone().addScaledVector(Rv[i], sd * (SW - 0.05)).setY(Y[i] + 0.9));
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail), N, 0.05, 6), cableM)); }
      // trụ cầu dưới nước
      for (let s = wa + 3; s < wb - 2; s += 6.5) { const a = at(s);
        for (const sd of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, a.p.y + 1.6, 12), concreteM); c.position.copy(a.p).addScaledVector(a.r, sd * 1.5); c.position.y = (a.p.y - 0.75 - 1.6) / 2 + 0.05; g.add(c); }
        const cap = beam(a.p.clone().addScaledVector(a.r, -2.3).setY(a.p.y - 0.85), a.p.clone().addScaledVector(a.r, 2.3).setY(a.p.y - 0.85), 0.3, concreteM, false); g.attach(cap); }
      // đèn trên cầu, sáng ban đêm
      for (let s = 3, k = 0; s < L - 2; s += 7, k++) { const a = at(s), sd = k % 2 ? 1 : -1, base = a.p.clone().addScaledVector(a.r, sd * (SW - 0.1)).setY(a.p.y + 0.12);
        g.attach(beam(base, base.clone().setY(base.y + 3.1), 0.06, M.pole)); const h = box(0.55, 0.16, 0.3, M.lamp, 0, 0, 0, g); h.position.copy(base).addScaledVector(a.r, -sd * 0.3).setY(base.y + 3.1); h.rotation.y = Math.atan2(-a.t.z, a.t.x); }
      const mid = at((wa + wb) / 2);
      if (kind === 'stay') {   // cầu dây văng: một tháp chữ A ở giữa, dây cáp xoè hai bên
        const a = mid, top = a.p.clone().setY(a.p.y + 17);
        for (const sd of [-1, 1]) g.attach(beam(a.p.clone().addScaledVector(a.r, sd * (SW + 0.8)).setY(-1.2), top.clone().addScaledVector(a.r, sd * 0.35), 0.38, pylonM, false));
        g.attach(beam(a.p.clone().addScaledVector(a.r, -(SW + 0.6)).setY(a.p.y - 0.9), a.p.clone().addScaledVector(a.r, SW + 0.6).setY(a.p.y - 0.9), 0.4, pylonM, false));
        g.attach(beam(top.clone().setY(top.y - 0.5), top.clone().setY(top.y + 2.2), 0.22, towerM, false));
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12), towerM); ring.position.copy(top).setY(top.y - 1.2); g.add(ring);
        const sMid = (wa + wb) / 2;
        for (let k = 1; k <= 7; k++) for (const dir of [-1, 1]) for (const sd of [-1, 1]) {
          const d = at(sMid + dir * (2.2 + k * 2.6)), anchor = top.clone().setY(top.y - 1 - k * 0.95).addScaledVector(a.r, sd * 0.35);
          const pt = d.p.clone().addScaledVector(d.r, sd * (SW - 0.05)).setY(d.p.y + 0.9); g.attach(beam(anchor, pt, 0.045, cableM)); }
      } else {   // cầu treo: hai tháp, cáp chính võng xuống, dây treo thẳng đứng
        const sa = wa + (wb - wa) * 0.2, sb = wa + (wb - wa) * 0.8, TH = 13;
        for (const s of [sa, sb]) { const a = at(s), topY = a.p.y + TH;
          for (const sd of [-1, 1]) g.attach(beam(a.p.clone().addScaledVector(a.r, sd * (SW + 0.3)).setY(-1.2), a.p.clone().addScaledVector(a.r, sd * (SW + 0.2)).setY(topY), 0.34, towerM, false));
          for (const y of [a.p.y - 0.9, a.p.y + 6.5, topY - 0.4]) g.attach(beam(a.p.clone().addScaledVector(a.r, -(SW + 0.3)).setY(y), a.p.clone().addScaledVector(a.r, SW + 0.3).setY(y), 0.3, towerM, false)); }
        const topAt = s => at(s).p.y + TH, s0 = Math.max(1, wa - ramp * 0.6), s1 = Math.min(L - 1, wb + ramp * 0.6), sm2 = (sa + sb) / 2;
        const cableY = s => { if (s <= sa) { const k = (s - s0) / (sa - s0); return at(s0).p.y + 0.9 + (topAt(sa) - at(s0).p.y - 0.9) * k; }
          if (s >= sb) { const k = (s1 - s) / (s1 - sb); return at(s1).p.y + 0.9 + (topAt(sb) - at(s1).p.y - 0.9) * k; }
          const sag = at(sm2).p.y + 1.4, q = (s - sm2) / (sb - sm2); return sag + (topAt(sb) - sag) * q * q; };
        for (const sd of [-1, 1]) { const pts = []; for (let s = s0; s <= s1 + 0.01; s += (s1 - s0) / 80) { const a = at(s); pts.push(a.p.clone().addScaledVector(a.r, sd * (SW + 0.2)).setY(cableY(s))); }
          g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.13, 8), cableM));
          for (let s = s0 + 1.6; s < s1 - 1; s += 1.6) { if (Math.abs(s - sa) < 0.8 || Math.abs(s - sb) < 0.8) continue; const a = at(s), y0 = a.p.y + 0.9, y1 = cableY(s); if (y1 - y0 < 0.3) continue;
            g.attach(beam(a.p.clone().addScaledVector(a.r, sd * (SW + 0.2)).setY(y0), a.p.clone().addScaledVector(a.r, sd * (SW + 0.2)).setY(y1), 0.035, cableM)); }
          // mố neo cáp ở hai đầu
          for (const s of [s0, s1]) { const a = at(s); const blk = box(1.2, 1.4, 1.6, concreteM, 0, 0, 0, g); blk.position.copy(a.p).addScaledVector(a.r, sd * (SW + 0.2)).setY(a.p.y + 0.5); blk.rotation.y = Math.atan2(-a.t.z, a.t.x); } }
      }
      g.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });
      // chừa chỗ cho cầu: cây trên đảo chính không mọc đè lên đường dẫn
      for (let i = 0; i <= N; i += 3) W.bridgePts.push([P[i].x, P[i].z]);
      for (let i = 0; i <= N; i += 6) if (inPoly(P[i].x, P[i].z, W.islandPoly)) excl.push([P[i].x, P[i].z, 3.6]);
      // hoa trong bồn cây (chỉ cầu đi bộ)
      if (!road) { const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshStandardMaterial({ roughness: .7 }), Math.floor(L / 0.9) * 2), lc2 = new THREE.Color(); let n = 0;
        for (let k = 0; n < fl.count - 1; k++) for (const sd of [-1, 1]) { const a = at(0.6 + k * 0.9); o3.position.copy(a.p).addScaledVector(a.r, sd * (DW + 0.35 + (seeded(k * 2 + sd) - 0.5) * 0.3)); o3.position.y += 0.3; o3.updateMatrix();
          fl.setMatrixAt(n, o3.matrix); fl.setColorAt(n++, lc2.set(['#ff7aa8', '#ffd84d', '#ffffff', '#ff9f5a', '#c9a6ff'][(k + (sd > 0 ? 2 : 0)) % 5])); }
        g.add(fl); }
      // người đi bộ: hai làn đi + quay đầu ở hai đầu cầu (vòng khép kín), mỗi làn một tốc độ nên không ai đi xuyên qua ai
      const sA = 1.2, sB = L - 1.2, SEG = sB - sA;
      const place = (w, s) => { const LO = w.lo, TURN = Math.PI * LO, LOOP = 2 * SEG + 2 * TURN; s = ((s % LOOP) + LOOP) % LOOP; let a, v, dx, dz;
        if (s < SEG) { a = at(sA + s); v = LO; dx = a.t.x; dz = a.t.z; }
        else if (s < SEG + TURN) { a = at(sB); const th = (s - SEG) / LO; v = LO * Math.cos(th); a.p.addScaledVector(a.t, LO * Math.sin(th)); dx = a.t.x * Math.cos(th) - a.r.x * Math.sin(th); dz = a.t.z * Math.cos(th) - a.r.z * Math.sin(th); }
        else if (s < 2 * SEG + TURN) { a = at(sB - (s - SEG - TURN)); v = -LO; dx = -a.t.x; dz = -a.t.z; }
        else { a = at(sA); const th = (s - 2 * SEG - TURN) / LO; v = -LO * Math.cos(th); a.p.addScaledVector(a.t, -LO * Math.sin(th)); dx = -a.t.x * Math.cos(th) + a.r.x * Math.sin(th); dz = -a.t.z * Math.cos(th) + a.r.z * Math.sin(th); }
        w.g.position.copy(a.p).addScaledVector(a.r, v); w.g.rotation.y = Math.atan2(dx, dz); return 2 * SEG + 2 * TURN; };
      const SHIRT = ['#3fb5ff', '#ff7aa8', '#e9b949', '#2bd47d', '#c9a6ff', '#ff5a1f', '#f4f2ee', '#1f6f8b'];
      if (walkers) for (const [lo, sp, n] of [[0.6, 1.15, 6], [1.4, 0.85, 5]]) for (let k = 0; k < n; k++) { const i = bridgeWalkers.length;
        const h = makeHuman({ seed: 300 + i + Math.round(L), shirt: SHIRT[i % SHIRT.length], pose: i % 3 === 0 ? 'phone' : 'stand', style: i % 4 === 1 ? 4 : undefined }), wg = h.g; wg.scale.setScalar(0.85); g.add(wg);
        if (h.hand) { const ph = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.02), new THREE.MeshBasicMaterial({ color: '#9fe7ff' })); ph.position.copy(h.hand.position); ph.position.z += 0.03; ph.rotation.x = -0.5; h.hand.parent.add(ph); }
        const w = { g: wg, h, lo, sp: sp * (0.95 + seeded(i + 77) * 0.1), s: 0, place }; const loop = place(w, 0); w.s = (k / n + seeded(i + 5) * 0.05) * loop; w.ph = seeded(i + 9) * 6; bridgeWalkers.push(w); place(w, w.s); }
      // xe hơi chạy 2 làn ngoài (±2.6), quay đầu ở 2 đầu cầu; làn trong để dành cho xe tải DEV TEAM
      if (cars) { const LO = 2.6, sA = 2.8, sB = L - 2.8, SEG = sB - sA, TURN = Math.PI * LO, LOOP = 2 * SEG + 2 * TURN;
        const place = (car, s) => { s = ((s % LOOP) + LOOP) % LOOP; let a, v, dx, dz;
          if (s < SEG) { a = at(sA + s); v = LO; dx = a.t.x; dz = a.t.z; }
          else if (s < SEG + TURN) { a = at(sB); const th = (s - SEG) / LO; v = LO * Math.cos(th); a.p.addScaledVector(a.t, LO * Math.sin(th)); dx = a.t.x * Math.cos(th) - a.r.x * Math.sin(th); dz = a.t.z * Math.cos(th) - a.r.z * Math.sin(th); }
          else if (s < 2 * SEG + TURN) { a = at(sB - (s - SEG - TURN)); v = -LO; dx = -a.t.x; dz = -a.t.z; a.slope = -a.slope; }
          else { a = at(sA); const th = (s - 2 * SEG - TURN) / LO; v = -LO * Math.cos(th); a.p.addScaledVector(a.t, -LO * Math.sin(th)); dx = -a.t.x * Math.cos(th) + a.r.x * Math.sin(th); dz = -a.t.z * Math.cos(th) + a.r.z * Math.sin(th); a.slope = 0; }
          car.g.position.copy(a.p).addScaledVector(a.r, v); car.g.position.y += 0.01; car.g.rotation.set(0, Math.atan2(-dz, dx), Math.atan(a.slope || 0), 'YZX'); };
        for (let k = 0; k < cars; k++) { const car = W.user.makeCar(120 + bridgeCars.length, scene); car.s = k / cars * LOOP; car.place = place; bridgeCars.push(car); place(car, car.s); } }
      const deckY = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i <= N; i++) { const d2 = (P[i].x - x) ** 2 + (P[i].z - z) ** 2; if (d2 < bd) { bd = d2; bi = i; } } return bd < (SW + 0.3) ** 2 ? Y[bi] : null; };
      return { g, at, L, P, deckY };
    };
    // 1) cầu dây văng: rẽ từ đường vòng đảo chính, qua biển, vào đại lộ phía bắc thành phố (z = -10 trong toạ độ thành phố)
    const cityN = [UC.x - 25.6, UC.z - 10], cityS = [UC.x - 25.6, UC.z + 10];
    W.bridgeMain = build([[46.3, 14.2], [53, 14.6], [61, 16.6], [69, 21.5], [77, 27.8], [83.5, 31.4], cityN], { hmax: 2.8, ramp: 12, kind: 'stay' });
    // 2) cầu bàn giao: đầu cầu bàn giao (08, đảo chính) → khu Dev (09); thay cho cảng + tàu cũ. xe designer chạy qua giao task cho dev rồi quay về quán cà phê
    const HF = W.anim.handoff.group; HF.updateMatrixWorld(true);
    const fw = (x, z) => { const v = HF.localToWorld(new THREE.Vector3(x, 0, z)); return [v.x, v.z]; };
    W.bridgeDev = build([fw(0, -2.5), fw(0.4, -8), fw(1.8, -16), fw(3.4, -24), fw(4, -29.5), fw(4, -34)], { hmax: 3.0, ramp: 8, kind: 'hang', walkers: false, deck: 'road', rampInWater: true, cars: 0 });
    // xe designer tự chạy qua cầu giao task cho dev (sim.js dựng lộ trình từ W.bridgeDev.at)
    // lối rẽ từ cầu đi bộ vào phòng 06 Lab User Test: user từ thành phố qua cầu, rẽ vào phòng test rồi quay về
    { const B = W.bridgeMain, r = W.rooms.test; r.g.updateMatrixWorld(true); const rl = (x, y, z) => r.g.localToWorld(new THREE.Vector3(x, y, z));
      const side = -1, sF = 7, aF = B.at(sF), LANE_T = 1.9;
      const edge = aF.p.clone().addScaledVector(aF.r, side * 3.3).setY(0.04), front = rl(0, 0, -r.d / 2 - 0.9).setY(0.04), mid1 = edge.clone().lerp(front, 0.38), mid2 = edge.clone().lerp(front, 0.72);
      mid1.x += 0.9; mid2.x += 0.4;
      const vis = new THREE.CatmullRomCurve3([aF.p.clone().addScaledVector(aF.r, side * 2.4).setY(0.04), edge, mid1, mid2, front], false, 'centripetal');
      const pathM = new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: .9 }), edgeM = new THREE.MeshStandardMaterial({ color: '#b9ad97', roughness: .9 });
      const strip = (curve, n, half, y, mat) => { const pos = [], idx = [], up = new THREE.Vector3(0, 1, 0), tg = new THREE.Vector3();
        for (let i = 0; i <= n; i++) { const u = i / n, p = curve.getPointAt(u); curve.getTangentAt(u, tg).setY(0).normalize(); const nx = -tg.z, nz = tg.x;
          pos.push(p.x + nx * half, y, p.z + nz * half, p.x - nx * half, y, p.z - nz * half); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, mat); m.material.side = THREE.DoubleSide; m.receiveShadow = true; scene.add(m); return m; };
      strip(vis, 60, 1.15, 0.045, edgeM); strip(vis, 60, 0.95, 0.055, pathM);
      for (let i = 0; i <= 12; i++) { const p = vis.getPointAt(i / 12); excl.push([p.x, p.z, 2.2]); }
      { const g = new THREE.Group(), p = vis.getPointAt(0.25), tg = vis.getTangentAt(0.25); g.position.set(p.x - tg.z * 1.6, 0, p.z + tg.x * 1.6); g.rotation.y = Math.atan2(tg.x, tg.z) + Math.PI; scene.add(g);
        board('LAB USER TEST', '← user vào test', 2.4, 0, 2.2, 0, g); box(0.08, 1.6, 0.08, M.pole, -0.9, 0.8, -0.02, g); box(0.08, 1.6, 0.08, M.pole, 0.9, 0.8, -0.02, g); }
      for (const u of [0.5, 0.85]) { const p = vis.getPointAt(u), tg = vis.getTangentAt(u), x = p.x + tg.z * 1.5, z = p.z - tg.x * 1.5; box(0.1, 2.6, 0.1, M.pole, x, 1.3, z); box(0.36, 0.14, 0.36, M.lamp, x, 2.62, z); }
      // đường đi của user: đầu cầu phía thành phố → dọc cầu → rẽ xuống lối → cửa phòng 06 → vào trong
      const pts = []; for (let s = B.L - 1.5; s > sF + 1.5; s -= 3) { const a = B.at(s); pts.push(a.p.clone().addScaledVector(a.r, side * LANE_T)); }
      pts.push(aF.p.clone().addScaledVector(aF.r, side * 2.3), edge, mid1, mid2, front, rl(0, 0.22, -r.d / 2 + 0.6));
      const C = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), LC = C.getLength();
      const spots = [[-3.7, -0.3], [-1.3, -0.5], [-3.6, 1.3], [-0.6, 1.1], [-2.2, 1.9], [-1.9, -2.2]].map(([x, z]) => rl(x, 0.22, z));
      const SH = ['#ff7aa8', '#3fb5ff', '#c9a6ff', '#ffd84d', '#2bd47d', '#f4f2ee'], tg = new THREE.Vector3(), testers = [];
      for (let k = 0; k < 6; k++) { const h = makeHuman({ seed: 700 + k, shirt: SH[k], pose: k % 2 ? 'phone' : 'stand', style: k % 5 }), g = h.g; g.scale.setScalar(0.85); scene.add(g);
        if (h.hand) { const ph = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.02), new THREE.MeshBasicMaterial({ color: '#9fe7ff' })); ph.position.copy(h.hand.position); ph.position.z += 0.03; ph.rotation.x = -0.5; h.hand.parent.add(ph); }
        testers.push({ g, h, s: (k / 6) * LC, dir: k % 2 ? -1 : 1, st: 'walk', timer: 0, spot: spots[k], sp: 0.95 + seeded(k + 40) * 0.2, ph: seeded(k + 41) * 6, u: 0 }); }
      const offAt = (s, dir, out) => { const u = Math.min(1, Math.max(0, s / LC)); C.getPointAt(u, out); C.getTangentAt(u, tg); const o = u > 0.93 ? 0 : 0.3 * dir; out.x += -tg.z * o; out.z += tg.x * o; return Math.atan2(tg.x * dir, tg.z * dir); };
      const tmpP = new THREE.Vector3(), endP = C.getPointAt(1);
      W.testerTick = (t, dt) => { for (const w of testers) { let moving = true;
        if (w.st === 'walk') { w.s += w.dir * w.sp * dt;
          if (w.dir > 0 && w.s >= LC) { w.s = LC; w.st = 'toSpot'; w.u = 0; }
          else if (w.dir < 0 && w.s <= 0) { w.s = 0; w.st = 'city'; w.timer = 2 + seeded(w.ph * 9) * 3; } }
        if (w.st === 'walk') { w.g.rotation.y = offAt(w.s, w.dir, w.g.position); }
        else if (w.st === 'toSpot' || w.st === 'fromSpot') { const d = endP.distanceTo(w.spot); w.u += w.sp * dt / Math.max(0.1, d);
          const a = w.st === 'toSpot' ? endP : w.spot, b = w.st === 'toSpot' ? w.spot : endP; w.g.position.lerpVectors(a, b, Math.min(1, w.u)); w.g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
          if (w.u >= 1) { if (w.st === 'toSpot') { w.st = 'room'; w.timer = 6 + seeded(w.ph * 7 + t) * 5; } else { w.st = 'walk'; w.dir = -1; } } }
        else { moving = false; w.timer -= dt; if (w.timer <= 0) { if (w.st === 'room') { w.st = 'fromSpot'; w.u = 0; } else { w.st = 'walk'; w.dir = 1; } } }
        w.g.position.y += moving ? Math.abs(Math.sin(t * 6 + w.ph)) * 0.03 : 0; walkCycle(w.h, moving ? t * 6 + w.ph : 0, moving ? 1 : 0); } };
      W.testers = testers; }
    // bãi đỗ xe khu Dev: ngay đầu cầu, bên trái hướng xe tới; xe đỗ đầu vào, designer đi bộ vào phòng DEV TEAM giao task
    { const B = W.bridgeDev, E = B.at(B.L), LG = new THREE.Group(); LG.position.set(E.p.x, 0, E.p.z); LG.rotation.y = Math.atan2(-E.t.z, E.t.x); scene.add(LG);
      const asph = new THREE.MeshStandardMaterial({ color: '#41474e', roughness: .9 }), lineM = new THREE.MeshBasicMaterial({ color: '#f4f1e8' }), yelM = new THREE.MeshBasicMaterial({ color: '#f2c14e' });
      const A0 = 0, A1 = 3.1, S0 = 2.5, S1 = 6.9, BL = -19.6, BR = 3.6;   // a: dọc hướng cầu, b: ngang (âm = phía bãi)
      const pad = (a0, a1, b0, b1, y = 0.05) => { const m = box(a1 - a0, 0.04, b1 - b0, asph, (a0 + a1) / 2, y, (b0 + b1) / 2, LG); m.receiveShadow = true; return m; };
      pad(A0, A1, BL, BR); pad(S0, S1, BL, -4.6, 0.052);
      for (const [a0, a1, b0, b1] of [[S1, S1 + 0.25, BL, -4.6], [A0 - 0.25, A0, BL, -4.2]]) box(a1 - a0, 0.16, b1 - b0, M.curb, (a0 + a1) / 2, 0.08, (b0 + b1) / 2, LG);
      const slotsB = [-6.6, -9.6, -12.6, -15.6];
      for (let k = 0; k <= slotsB.length; k++) box(S1 - S0 - 0.4, 0.012, 0.12, lineM, (S0 + S1) / 2 + 0.2, 0.075, -5.1 - k * 3, LG);
      for (const b of slotsB) { box(0.25, 0.12, 1.4, M.curb, S1 - 0.55, 0.1, b, LG); const pm = box(1.1, 0.012, 1.1, yelM, 4.4, 0.074, b, LG); pm.material = lineM; }
      for (let b = -2; b > BL + 1; b -= 2.2) box(0.9, 0.012, 0.12, yelM, 1.55, 0.074, b, LG);   // vạch chia 2 làn của lối chạy trong bãi
      const sg = board('BÃI ĐỖ XE DEV', 'đỗ xe → đi bộ vào giao task', 3.4, S1 + 0.6, 2.6, -11.1, LG, -Math.PI / 2);
      for (const db of [-1.3, 1.3]) box(0.1, 2.2, 0.1, M.pole, S1 + 0.62, 1.1, -11.1 + db, LG);
      for (const b of [-4.9, -18.2]) { box(0.1, 2.8, 0.1, M.pole, S1 + 0.5, 1.4, b, LG); box(0.5, 0.14, 0.32, M.lamp, S1 + 0.25, 2.8, b, LG); }
      LG.updateMatrixWorld(true);
      const lp = (a, b) => LG.localToWorld(new THREE.Vector3(a, 0.06, b));
      W.devLot = { g: LG, lp, slotsB, slotA: 4.6, laneIn: 2.25, laneOut: 0.85, occ: slotsB.map(() => null) };
      W.inDevLot = (x, z, m = 0) => { const v = LG.worldToLocal(new THREE.Vector3(x, 0, z)); return v.x > A0 - m && v.x < S1 + m && v.z > BL - m && v.z < BR + m; };
      W.devRoom.spots = [new THREE.Vector3(-1.0, 0.22, 0.1), new THREE.Vector3(2.0, 0.22, 0.4), new THREE.Vector3(-3.2, 0.22, -0.3), new THREE.Vector3(0.6, 0.22, -0.8)]; }
    // 3) cảng bàn giao mới: bến khu QC ↔ bến thành phố User; tàu RELEASE chở bản release sang cho user (thay cho cầu đi bộ cũ)
    const qcEnd = [55.6, 77.3];
    { const rb = new THREE.Mesh(new THREE.CircleGeometry(2.9, 40), new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: .9 })); rb.rotation.x = -Math.PI / 2; rb.position.set(qcEnd[0], 0.05, qcEnd[1]); rb.receiveShadow = true; scene.add(rb);
      const isl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.05, 0.25, 24), M.curb); isl.position.set(qcEnd[0], 0.12, qcEnd[1]); scene.add(isl);
      const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshStandardMaterial({ color: '#77ab63', flatShading: true })); fl.position.set(qcEnd[0], 0.6, qcEnd[1]); scene.add(fl); }
    { const PQ = new THREE.Vector3(qcEnd[0], 0, qcEnd[1]), PU = new THREE.Vector3(UC.x - 27.6, 0, UC.z + 10.5), dir = PU.clone().sub(PQ).normalize(), yawDir = Math.atan2(-dir.z, dir.x);
      const pier = (start, d, len, label) => { const end = start.clone().addScaledVector(d, len), mid = start.clone().lerp(end, 0.5), g = new THREE.Group(); g.position.copy(mid); g.rotation.y = Math.atan2(-d.z, d.x); add(g);
        box(len, 0.5, 3.2, M.quay, 0, -0.1, 0, g); box(len, 0.06, 0.12, M.curb, 0, 0.18, 1.55, g); box(len, 0.06, 0.12, M.curb, 0, 0.18, -1.55, g);
        for (let x = -len / 2 + 0.8; x < len / 2; x += 2.2) for (const sd of [-1, 1]) box(0.35, 1.6, 0.35, M.steel, x, -0.9, sd * 1.3, g);
        for (const sd of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.35, 10), M.steel); b.position.set(len / 2 - 0.5, 0.33, sd * 1.25); g.add(b); }
        board(label[0], label[1], 2.6, -len / 2 + 1, 2.2, 1.7, g, Math.PI / 2); box(0.1, 1.6, 0.1, M.pole, -len / 2 + 0.2, 0.9, 1.7, g); box(0.1, 1.6, 0.1, M.pole, -len / 2 + 1.8, 0.9, 1.7, g);
        return end; };
      const endQ = pier(PQ.clone().addScaledVector(dir, 2.6), dir, 5, ['CẢNG BÀN GIAO', 'release → user']);
      const endU = pier(PU, dir.clone().negate(), 8, ['CẢNG USER', 'nhận bản release']);
      const dockQ = endQ.clone().addScaledVector(dir, 5.2), dockU = endU.clone().addScaledVector(dir, -5.2);
      // tàu RELEASE
      const ship = new THREE.Group(); add(ship);
      { const hullS = new THREE.Shape(); hullS.moveTo(-4.2, -1.5); hullS.lineTo(2.8, -1.5); hullS.quadraticCurveTo(4.6, -1.2, 5.2, 0); hullS.quadraticCurveTo(4.6, 1.2, 2.8, 1.5); hullS.lineTo(-4.2, 1.5); hullS.lineTo(-4.2, -1.5);
        const hg = new THREE.ExtrudeGeometry(hullS, { depth: 1.5, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.translate(0, -0.6, 0);
        ship.add(new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: .5 })));
        box(9.2, 0.25, 3.05, new THREE.MeshStandardMaterial({ color: '#1f6f8b' }), -0.1, 0.75, 0, ship);
        box(8.8, 0.06, 2.8, new THREE.MeshStandardMaterial({ color: '#c49a6c', roughness: .8 }), -0.2, 0.92, 0, ship);
        box(2.4, 1.3, 2.3, M.white, -2.6, 1.6, 0, ship); box(2.45, 0.45, 2.35, M.glass, -2.6, 1.95, 0, ship); box(2.6, 0.12, 2.5, new THREE.MeshStandardMaterial({ color: COL.orange }), -2.6, 2.32, 0, ship);
        box(0.08, 1.6, 0.08, M.pole, -3.4, 3.1, 0, ship); const flag = box(0.7, 0.45, 0.03, new THREE.MeshStandardMaterial({ color: '#2bd47d', side: THREE.DoubleSide }), -3.05, 3.65, 0, ship);
        const sg = board('TÀU RELEASE', 'giao cho user', 2.2, -2.6, 1.55, 1.18, ship); sg.scale.setScalar(0.8);
        ship.traverse(o => { if (o.isMesh) o.castShadow = true; }); ship.userData.flag = flag; }
      const slots = []; for (let k = 0; k < 6; k++) slots.push(new THREE.Vector3(0.4 + (k % 3) * 1.25 - 1.2, 0.95 + CH / 2 + Math.floor(k / 3) * (CH + 0.04), 0));
      ship.position.copy(dockQ); ship.rotation.y = yawDir;
      const P = W.port = { state: 'atQ', t: 0, waiting: [], cargo: [], hops: [], pending: 0, ship, dockQ, dockU };
      const waitPos = i => PQ.clone().addScaledVector(dir, 4.6).setY(0.15 + CH / 2 + i * (CH + 0.04));
      P.waitSpot = () => waitPos(P.waiting.length + P.pending++);
      P.arrive = c => { P.pending = Math.max(0, P.pending - 1); c.position.copy(waitPos(P.waiting.length)); c.rotation.set(0, yawDir, 0); P.waiting.push(c); };
      const hop = (c, from, to, dur, h, done) => P.hops.push({ c, from: from && from.clone(), to, k: 0, dur, h, done });
      const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      P.tick = (t, dt) => { P.t += dt; const S = P.ship;
        S.position.y = Math.sin(t * 1.3) * 0.06; S.rotation.z = Math.sin(t * 0.9) * 0.015; S.userData.flag.rotation.y = Math.sin(t * 5) * 0.25;
        if (P.state === 'atQ') { S.rotation.y += (yawDir - S.rotation.y) * Math.min(1, dt * 2);
          while (P.waiting.length && P.cargo.length < slots.length) { const c = P.waiting.shift(), slot = slots[P.cargo.length]; P.cargo.push(c); hop(c, c.position, () => S.localToWorld(slot.clone()), 0.9, 1.2, () => { S.attach(c); c.position.copy(slot); c.rotation.set(0, 0, 0); }); }
          if (P.t > 4 && (P.cargo.length || P.t > 12) && !P.hops.length) { P.state = 'toU'; P.t = 0; } }
        else if (P.state === 'toU' || P.state === 'toQ') { const k = Math.min(1, P.t / 9), a = P.state === 'toU' ? dockQ : dockU, b = P.state === 'toU' ? dockU : dockQ;
          S.position.lerpVectors(a, b, ease(k)); S.position.y = Math.sin(t * 1.3) * 0.08;
          if (k >= 1) { P.state = P.state === 'toU' ? 'atU' : 'atQ'; P.t = 0;
            if (P.state === 'atU') P.cargo.forEach((c, i) => hop(c, null, W.user.plaza, 1.6 + i * 0.25, 9, () => c.removeFromParent())); P.cargo = []; } }
        else if (P.state === 'atU') { S.rotation.y += (yawDir + Math.PI - S.rotation.y) * Math.min(1, dt * 1.5); if (P.t > 4 && !P.hops.length) { P.state = 'toQ'; P.t = 0; } }
        for (let i = P.hops.length - 1; i >= 0; i--) { const h = P.hops[i]; if (!h.from) { h.c.updateMatrixWorld(true); h.from = h.c.getWorldPosition(new THREE.Vector3()); scene.attach(h.c); }
          h.k += dt / h.dur; const k = Math.min(1, h.k), to = typeof h.to === 'function' ? h.to() : h.to; h.c.position.lerpVectors(h.from, to, ease(k)); h.c.position.y += Math.sin(k * Math.PI) * h.h;
          if (k >= 1) { P.hops.splice(i, 1); h.done(); } } };
    }
    // ---------- lối đi bộ lát gỗ ven biển quanh đảo Dev + QC, rẽ vào quảng trường cuối cầu treo ----------
    { const PQ = new THREE.Vector3(qcEnd[0], 0, qcEnd[1]), ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      // đường bờ (bao lồi) → chia đều 1 m → kéo lõm vào quảng trường → làm mượt
      const H = W.devQcHullAt(11.3, 12.3, 48), even = [];
      for (let i = 0; i < H.length; i++) { const [x0, z0] = H[i], [x1, z1] = H[(i + 1) % H.length], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0)));
        for (let k = 0; k < n; k++) even.push(new THREE.Vector3(x0 + (x1 - x0) * k / n, 0, z0 + (z1 - z0) * k / n)); }
      for (const p of even) { const d = p.distanceTo(PQ); if (d < 7) p.lerp(PQ.clone().add(p.clone().sub(PQ).setLength(1.8)), ss(7, 3.2, d) * 0.95); }
      const curve = new THREE.CatmullRomCurve3(even, true, 'centripetal'), N = 420, L = curve.getLength(), P = curve.getSpacedPoints(N).slice(0, N);
      const T = P.map((_, i) => curve.getTangentAt(i / N).setY(0).normalize()), R = T.map(t => new THREE.Vector3(-t.z, 0, t.x));
      const C = W.devIsland.clone().lerp(W.qcIsland, 0.5), outer = P.map((p, i) => Math.sign(R[i].dot(p.clone().sub(C))) || 1);   // phía biển
      const BD = W.bridgeDev.P, nearDev = (p, r) => BD.some(q => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < r * r);
      const Y = 0.1, HW = 0.85, gap = i => P[i].distanceTo(PQ) < 2.8 || nearDev(P[i], 4.4);   // để trống: chỗ nối quảng trường cảng và chỗ băng qua cầu xe (có vạch qua đường)
      const plankTex = (() => { const [c, x] = canvas(64, 128); for (let j = 0; j < 8; j++) { x.fillStyle = ['#c69c6d', '#b98e60', '#cfa676'][j % 3]; x.fillRect(0, j * 16, 64, 15); x.fillStyle = 'rgba(60,40,20,.35)'; x.fillRect(0, j * 16 + 15, 64, 1); }
        x.fillStyle = 'rgba(60,40,20,.25)'; x.fillRect(3, 0, 2, 128); x.fillRect(59, 0, 2, 128); return tex(c, true); })();
      const woodM = new THREE.MeshStandardMaterial({ map: plankTex, roughness: .85, side: THREE.DoubleSide }), woodDark = new THREE.MeshStandardMaterial({ color: '#7d5a3a', roughness: .9, side: THREE.DoubleSide });
      const strip = (fn, mat, uvAlong) => { const pos = [], uv = [], idx = [];
        for (let i = 0; i <= N; i++) { const k = i % N, [a, b] = fn(k); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); const v = uvAlong ? i / N * L / 1.6 : 0; uv.push(0, v, 1, v);
          if (i < N && !gap(k) && !gap((k + 1) % N)) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; add(m); return m; };
      const off = (k, o, y) => P[k].clone().addScaledVector(R[k], o).setY(y);
      strip(k => [off(k, -HW, Y), off(k, HW, Y)], woodM, true);
      for (const sd of [-1, 1]) strip(k => [off(k, sd * HW, Y), off(k, sd * HW, -0.3)], woodDark);
      // cột lan can gỗ + dây thừng phía biển, đèn và ghế phía đảo
      const postI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.6, 8), woodDark, Math.ceil(N / 6)), o3 = new THREE.Object3D(); let np = 0;
      const ropeRuns = [[]];
      for (let k = 0; k < N; k += 6) { if (P[k].distanceTo(PQ) < 4.2 || nearDev(P[k], 5)) { if (ropeRuns[ropeRuns.length - 1].length) ropeRuns.push([]); continue; }
        const p = off(k, outer[k] * (HW - 0.08), Y + 0.3); o3.position.copy(p); o3.updateMatrix(); postI.setMatrixAt(np++, o3.matrix); ropeRuns[ropeRuns.length - 1].push(p.clone().setY(Y + 0.52)); }
      postI.count = np; postI.castShadow = true; add(postI);
      if (ropeRuns.length > 1 && ropeRuns[0].length && ropeRuns[ropeRuns.length - 1].length) ropeRuns[0].unshift(...ropeRuns.pop());   // nối đoạn đầu/cuối của vòng
      const ropeM = new THREE.MeshStandardMaterial({ color: '#e8dcc2', roughness: .9 });
      for (const run of ropeRuns) if (run.length > 1) add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(run), run.length * 4, 0.025, 5), ropeM));
      const benchM = new THREE.MeshStandardMaterial({ color: '#a8763f', roughness: .8 });
      const benchSpots = [];
      for (let k = 12, n = 0; k < N; k += 35, n++) { if (P[k].distanceTo(PQ) < 6 || nearDev(P[k], 7)) continue; const inSd = -outer[k];
        if (n % 2 === 0) { const b = off(k, inSd * (HW + 0.15), 0); box(0.09, 2.5, 0.09, M.pole, b.x, 1.25, b.z); const h = box(0.42, 0.15, 0.3, M.lamp, 0, 0, 0); h.position.set(b.x - R[k].x * inSd * 0.25, 2.5, b.z - R[k].z * inSd * 0.25); h.rotation.y = Math.atan2(-T[k].z, T[k].x); }
        else { const c = off(k, inSd * (HW - 0.32), Y), g = new THREE.Group(); g.position.copy(c); g.rotation.y = Math.atan2(R[k].x * -inSd, R[k].z * -inSd); add(g);   // ghế nhìn ra biển
          box(1.3, 0.07, 0.42, benchM, 0, 0.42, 0, g); box(1.3, 0.34, 0.06, benchM, 0, 0.66, -0.2, g); for (const sx of [-0.55, 0.55]) box(0.07, 0.42, 0.38, woodDark, sx, 0.21, 0, g);
          benchSpots.push(g); } }
      // người ngồi ghế ngắm biển
      benchSpots.forEach((bg, i) => { if (i % 2) return; const h = makeHuman({ seed: 700 + i, shirt: ['#ff7aa8', '#3fb5ff', '#2bd47d'][i % 3], pose: 'seat' }); h.g.position.set(-0.3, 0.42 - 0.48, 0); bg.add(h.g); });
      W.promenade = { P, L };
      // vạch qua đường trên cầu xe, chỗ lối ven biển băng qua
      { let bi = 0, bd = 1e9; const B = W.bridgeDev; for (let i = 0; i < B.P.length; i++) for (let k = 0; k < N; k += 3) { const d = B.P[i].distanceToSquared(P[k]); if (d < bd) { bd = d; bi = i; } }
        const a = B.at(bi / (B.P.length - 1) * B.L), zm = new THREE.MeshBasicMaterial({ color: '#f7f3ea' });
        for (let k = -6; k <= 6; k++) { const z = box(0.3, 0.02, 1.5, zm, 0, 0, 0); z.position.copy(a.p).addScaledVector(a.r, k * 0.52).setY(a.p.y + 0.03); z.rotation.y = Math.atan2(-a.t.z, a.t.x) + Math.PI / 2; } }
      // người đi bộ dạo một vòng quanh đảo, hai chiều (mỗi người đi bên phải theo hướng của mình)
      for (const dir of [1, -1]) { const n = 7;
        const place = (w, s) => { const u = ((s / L % 1) + 1) % 1, f = u * N, i = Math.floor(f) % N, k = f - Math.floor(f), j = dir > 0 ? i : (N - i) % N, j2 = dir > 0 ? (i + 1) % N : (N - i - 1 + N) % N;
          const a = off(j, dir * 0.42, Y), b = off(j2, dir * 0.42, Y); w.g.position.lerpVectors(a, b, k); w.g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); return L; };
        for (let k = 0; k < n; k++) { const i = bridgeWalkers.length, h = makeHuman({ seed: 800 + i, shirt: ['#3fb5ff', '#ff7aa8', '#e9b949', '#2bd47d', '#c9a6ff', '#ff5a1f', '#f4f2ee'][i % 7], pose: i % 3 === 0 ? 'phone' : 'stand' });
          h.g.scale.setScalar(0.85); add(h.g);
          if (h.hand) { const ph = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.02), new THREE.MeshBasicMaterial({ color: '#9fe7ff' })); ph.position.copy(h.hand.position); ph.position.z += 0.03; ph.rotation.x = -0.5; h.hand.parent.add(ph); }
          const w = { g: h.g, h, sp: 0.9 + (dir > 0 ? 0 : 0.15), s: (k / n + (dir > 0 ? 0 : 0.5 / n)) * L, ph: seeded(i + 31) * 6, place }; bridgeWalkers.push(w); place(w, w.s); } }
    }
    const prev = W.user.tickCity;
    W.user.tickCity = (t, dt) => { prev(t, dt); W.port.tick(t, dt); for (const car of bridgeCars) { car.s += 4 * dt; car.place(car, car.s); } for (const w of bridgeWalkers) { w.s += w.sp * dt; w.place(w, w.s); w.g.position.y += Math.abs(Math.sin(t * 6 + w.ph)) * 0.03 + 0.01; walkCycle(w.h, t * 6 + w.ph); } };
  }

  // ---------- department parking lots (between the road and each room) ----------
  W.vlots = {};
  { const lineM = new THREE.MeshBasicMaterial({ color: '#f7f3ea' });
    for (const [key, v] of Object.entries(VLOT)) {
      const g = frames[key].group, slots = [];
      for (let r = 0; r < v.rows; r++) slots.push(new THREE.Vector3(v.x, 0, v.side * (4.6 + r * 2.5)));
      const zc = v.side * (4.6 + (v.rows - 1) * 1.25), depth = v.rows * 2.5 + 0.4;
      const pad = box(5.6, 0.06, depth, M.pad, v.x, 0.03, zc, g); pad.receiveShadow = true;
      for (let r = 0; r <= v.rows; r++) box(5.2, 0.02, 0.09, lineM, v.x, 0.07, v.side * (3.35 + r * 2.5), g);
      const pm = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#3fb5ff' })); pm.rotation.x = -Math.PI / 2; pm.position.set(v.x + 3.4, 0.08, v.side * 3.6); g.add(pm);
      W.parks[key] = { slots, group: g }; W.vlots[key] = { ...v, slots, group: g, aisleX: v.x + 3.2 };
      g.updateMatrixWorld(true); const c = g.localToWorld(new THREE.Vector3(v.x, 0, zc)); excl.push([c.x, c.z, 6 + v.rows]);
    } }

  // ---------- roadside café on the empty stretch after the port: empty cars stop here ~10 s before going back for a task ----------
  { const d = (frames.handoff.d + 28) % L, f = W.at(d), g = new THREE.Group(); g.position.copy(f.pos); g.rotation.y = Math.atan2(-f.tan.z, f.tan.x); scene.add(g);
    W.cafeD = d;
    const r = room(g, { x: 0, z: 13.6, w: 9.4, d: 6.4, back: 1, accent: '#b5452d', board: sign('CÀ PHÊ', '☕ nghỉ 10 giây') });
    r.spots = [[-2.2, -0.15], [2.3, -0.15], [0.2, -1.6]].map(([x, z]) => new THREE.Vector3(x, 0.22, z));
    coffeeBar(r.in, -1.6, 2.1, Math.PI); coffeeBar(r.in, 0, 2.1, Math.PI);
    person('Barista', '#6d5640', r.in, -0.8, 2.75);
    roundTable(r.in, -2.2, -0.9, 0.55, 2, '#b5452d'); roundTable(r.in, 2.3, -0.9, 0.55, 2, '#b5452d');
    tallPlant(r.in, 4.2, 2.6); plant(r.in, -4.2, -2.6); bookshelf(r.in, r.leftX + 0.22, 0.4, -Math.PI / 2, 2);
    // striped awning over the open front
    for (let i = 0; i < 7; i++) { const a = box(1.3, 0.08, 0.75, i % 2 ? M.white : M.orange, -3.9 + i * 1.3, 2.0, -3.6, r.g); a.rotation.x = -0.35; }
    W.rooms.cafe = r; W.cafe = r.g;
    const slots = [0, 1].map(k => new THREE.Vector3(0, 0, 4.6 + k * 2.5));
    const pad = box(5.6, 0.06, 5.4, M.pad, 0, 0.03, 5.85, g); pad.receiveShadow = true;
    const lineM = new THREE.MeshBasicMaterial({ color: '#f7f3ea' }); for (let k = 0; k <= 2; k++) box(5.2, 0.02, 0.09, lineM, 0, 0.07, 3.35 + k * 2.5, g);
    W.parks.cafe = { slots, group: g }; W.vlots.cafe = { x: 0, side: 1, rows: 2, slots, group: g, aisleX: 3.2 };
    g.updateMatrixWorld(true); for (const [x, z, rr] of [[0, 5.85, 8], [0, 13.6, 7]]) { const c = g.localToWorld(new THREE.Vector3(x, 0, z)); excl.push([c.x, c.z, rr]); }
  }

  // ---------- GAME ZONE next to the café: arcade cabinets, a claw machine and a small ferris wheel ----------
  { const d = (frames.handoff.d + 41) % L, f = W.at(d), g = new THREE.Group(); g.position.copy(f.pos); g.rotation.y = Math.atan2(-f.tan.z, f.tan.x); scene.add(g);
    const r = room(g, { x: 0, z: 13.2, w: 10, d: 6.4, back: 1, accent: '#7b5cff', board: sign('GAME ZONE', '🎮 mini game · giải trí') });
    const screenFor = (k, col) => { const [c, x] = canvas(128, 112); x.fillStyle = '#0b1020'; x.fillRect(0, 0, 128, 112); x.fillStyle = col;
      if (k === 0) { x.font = '44px serif'; x.fillText('🐞', 36, 70); } else if (k === 1) { x.strokeStyle = col; x.lineWidth = 4; x.strokeRect(34, 36, 60, 34); x.fillRect(62, 12, 4, 88); }
      else if (k === 2) { for (let i = 0; i < 6; i++) { x.fillRect(16 + (i % 3) * 34, 18 + Math.floor(i / 3) * 42, 26, 34); } } else { ['#ff5a1f', '#2bd47d', '#3fb5ff', '#e9b949'].forEach((cc, i) => { x.fillStyle = cc; x.fillRect(14 + i * 26, 30, 22, 50); }); }
      return tex(c); };
    const CAB = ['#ff5a1f', '#3fb5ff', '#7b5cff', '#2bd47d'];
    CAB.forEach((col, k) => { const cg = new THREE.Group(); cg.position.set(-3.3 + k * 2.2, 0, 2.3); cg.rotation.y = Math.PI; r.in.add(cg);
      const cm = colorMat(col);
      box(1.1, 1.9, 0.9, PM.dark, 0, 0.95, 0, cg); box(1.14, 0.12, 0.94, cm, 0, 1.92, 0, cg);
      const mq = box(1.0, 0.3, 0.1, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2 }), 0, 2.15, -0.42, cg);
      const sm = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff', emissiveMap: screenFor(k, col), emissiveIntensity: 1 }); screens.push(sm);
      const scr = plane(0.84, 0.72, sm, cg); scr.position.set(0, 1.45, -0.46); scr.rotation.y = Math.PI; scr.rotation.x = -0.12;
      const deck = box(1.1, 0.08, 0.5, cm, 0, 1.0, -0.6, cg); deck.rotation.x = -0.25;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8), PM.dark); stick.position.set(-0.25, 1.12, -0.65); cg.add(stick);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), colorMat('#ff3b1f')); knob.position.set(-0.25, 1.22, -0.65); cg.add(knob);
      for (const bx of [0.1, 0.28]) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), colorMat(['#ffd84d', '#5ff3ff'][bx > 0.2 ? 1 : 0])); bt.position.set(bx, 1.07, -0.66); cg.add(bt); } });
    // claw machine
    { const cg = new THREE.Group(); cg.position.set(-3.9, 0, -1.6); r.in.add(cg);
      box(1.3, 0.9, 1.3, colorMat('#e86a92'), 0, 0.45, 0, cg); box(1.3, 0.12, 1.3, colorMat('#ffd84d'), 0, 2.36, 0, cg);
      box(1.24, 1.4, 1.24, PM.glass, 0, 1.6, 0, cg);
      for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), colorMat(['#ff5a1f', '#3fb5ff', '#2bd47d', '#ffd84d', '#c9a6ff'][i % 5])); b.position.set(-0.4 + (i % 3) * 0.4, 1.06 + (i % 2) * 0.1, -0.4 + Math.floor(i / 3) * 0.4); cg.add(b); }
      box(0.04, 0.5, 0.04, PM.metal, 0.2, 2.05, 0.1, cg); box(0.2, 0.08, 0.2, PM.metal, 0.2, 1.8, 0.1, cg); }
    // neon strips + bean bags
    for (const [x, z, w2, d2] of [[0, 2.95, 9.4, 0.06], [-4.75, 0, 0.06, 6]]) box(w2, 0.06, d2, new THREE.MeshStandardMaterial({ color: '#c9a6ff', emissive: '#a259ff', emissiveIntensity: 1.6 }), x, 0.9, z, r.in);
    for (const [x, z, c] of [[1.6, -1.6, '#ff5a1f'], [3.2, -1.3, '#3fb5ff']]) { const bb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), colorMat(c)); bb.scale.set(1, 0.55, 1); bb.position.set(x, 0.27, z); r.in.add(bb); }
    person('Designer', '#ff5a1f', r.in, -1.1, 1.45); person('Dev', '#3fb5ff', r.in, 1.1, 1.45); person('', '#2bd47d', r.in, 3.2, -1.0, { seat: true });
    // ferris wheel beside the arcade
    const fw = new THREE.Group(); fw.position.set(9, 0, 13); g.add(fw);
    for (const sx of [-0.7, 0.7]) { const leg1 = box(0.18, 7.4, 0.18, M.white, 0, 3.6, 0, fw); leg1.position.set(-1.6, 3.4, sx); leg1.rotation.x = 0; leg1.rotation.z = -0.22; const leg2 = box(0.18, 7.4, 0.18, M.white, 1.6, 3.4, sx, fw); leg2.rotation.z = 0.22; }
    const wheel = new THREE.Group(); wheel.position.set(0, 6.8, 0); fw.add(wheel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(4, 0.1, 8, 48), new THREE.MeshStandardMaterial({ color: '#c9a6ff', emissive: '#a259ff', emissiveIntensity: 0.4 })); wheel.add(rim);
    const cabins = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = box(0.06, 4, 0.06, M.white, Math.cos(a) * 2, Math.sin(a) * 2, 0, wheel); sp.rotation.z = a - Math.PI / 2;
      const cab = new THREE.Group(); cab.position.set(Math.cos(a) * 4, Math.sin(a) * 4, 0); wheel.add(cab);
      box(0.7, 0.6, 0.7, colorMat(['#ff5a1f', '#3fb5ff', '#2bd47d', '#ffd84d'][i % 4]), 0, -0.45, 0, cab); box(0.04, 0.3, 0.04, PM.dark, 0, -0.05, 0, cab); cabins.push(cab); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 16), M.steel); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    W.arcade = { group: g, room: r.g, wheel, cabins, rimM: rim.material, pos: g.localToWorld(new THREE.Vector3(2, 0, 13)) };
    g.updateMatrixWorld(true); W.arcade.pos = g.localToWorld(new THREE.Vector3(2, 0, 13));
    for (const [x, z, rr] of [[0, 13.2, 8], [9, 13, 6]]) { const c = g.localToWorld(new THREE.Vector3(x, 0, z)); excl.push([c.x, c.z, rr]); }
  }

  // ---------- bãi tắm du lịch: dải đất trống phía biển, đối diện quán cà phê + Game Zone (giữ trống cho cây/hoa) ----------
  W.tourD = [(frames.handoff.d + 19) % L, (frames.handoff.d + 54) % L];
  { const [a, b] = W.tourD; for (let d = a; d <= a + ((b - a + L) % L); d += 2.5) { const f = W.at(d % L), m = margin(d % L); for (let o = 4.5; o < m + 1; o += 3.5) excl.push([f.pos.x - f.right.x * o, f.pos.z - f.right.z * o, 2.6]); } }
  const inTour = d => { const [a, b] = W.tourD, x = ((d - a) % L + L) % L; return x <= ((b - a) % L + L) % L; };

  // ---------- street lamps: one every ~11 units, on whichever side of the road is free ----------
  { const far = ([ox, oz, r], x, z) => (ox - x) ** 2 + (oz - z) ** 2 >= r * r;
    const free = (x, z) => obst.every(o => far(o, x, z)) && excl.slice(nFrameExcl).every(([ex, ez, r]) => far([ex, ez, r * 0.85], x, z));
    let i = 0;
    for (let d = 3; d < L; d += 11, i++) { const f = W.at(d);
      for (const s of i % 2 ? [1, -1] : [-1, 1]) {
        const x = f.pos.x + f.right.x * 3.3 * s, z = f.pos.z + f.right.z * 3.3 * s; if (!free(x, z)) continue;
        const rx = f.right.x * s, rz = f.right.z * s;   // points away from the road
        box(0.14, 4.2, 0.14, M.pole, x, 2.1, z);
        const arm = box(1.1, 0.1, 0.12, M.pole, x - rx * 0.5, 4.15, z - rz * 0.5); arm.rotation.y = Math.atan2(-rz, rx);
        box(0.4, 0.12, 0.3, M.lamp, x - rx * 1.0, 4.07, z - rz * 1.0);
        const pool = plane(8, 8, M.pool, scene); pool.rotation.x = -Math.PI / 2; pool.position.set(x - rx * 2.2, 0.06, z - rz * 2.2);
        obst.push([x, z, 2]); break; } } }

  // ---------- giữa đảo Design: toà văn phòng DESIGN TRIP HQ (thay cho hồ nước cũ) + cột cờ Việt Nam ----------
  { const CX = -8, CZ = 8, hq = new THREE.Group(); hq.position.set(CX, 0, CZ); add(hq);
    excl.push([CX, CZ, 12]);
    const stone = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: .6 }), stoneD = new THREE.MeshStandardMaterial({ color: '#d9d3c7', roughness: .7 });
    const glassM = new THREE.MeshStandardMaterial({ color: '#7fb9d9', roughness: .12, metalness: .35, emissive: '#ffd98a', emissiveIntensity: 0 }); W.night.windows.push(glassM);
    const accent = new THREE.MeshStandardMaterial({ color: COL.orange, roughness: .4 }), dark = new THREE.MeshStandardMaterial({ color: '#1d2329', roughness: .5 });
    const green = new THREE.MeshStandardMaterial({ color: '#6aa35f', roughness: .9, flatShading: true });
    // quảng trường lát đá + viền cỏ
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(10, 64), new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: .9 })); plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.04; plaza.receiveShadow = true; hq.add(plaza);
    const rimP = new THREE.Mesh(new THREE.RingGeometry(9.7, 10.2, 64), stoneD); rimP.rotation.x = -Math.PI / 2; rimP.position.y = 0.05; hq.add(rimP);
    for (let i = 0; i < 8; i++) { const r0 = 2 + i * 1; const ring = new THREE.Mesh(new THREE.RingGeometry(r0, r0 + 0.06, 48, 1, Math.PI * 0.15, Math.PI * 0.7), stoneD); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.045, 3.5); hq.add(ring); }
    // khối đế 2 tầng + tháp kính 4 tầng lùi vào, sân thượng xanh
    const W0 = 12.4, D0 = 8.2, FH = 1.45;
    const floor = (w, d, y, n) => { for (let k = 0; k < n; k++) { const yy = y + k * FH;
        box(w + 0.3, 0.22, d + 0.3, stone, 0, yy + 0.11, 0, hq);
        box(w, FH - 0.22, d, glassM, 0, yy + 0.22 + (FH - 0.22) / 2, 0, hq);
        for (let x = -w / 2 + 0.9; x < w / 2 - 0.5; x += 1.25) { box(0.08, FH - 0.22, 0.12, dark, x, yy + 0.22 + (FH - 0.22) / 2, d / 2 + 0.02, hq); box(0.08, FH - 0.22, 0.12, dark, x, yy + 0.22 + (FH - 0.22) / 2, -d / 2 - 0.02, hq); }
        for (let z = -d / 2 + 0.9; z < d / 2 - 0.5; z += 1.25) for (const sx of [-1, 1]) box(0.12, FH - 0.22, 0.08, dark, sx * (w / 2 + 0.02), yy + 0.22 + (FH - 0.22) / 2, z, hq); }
      box(w + 0.3, 0.3, d + 0.3, stone, 0, y + n * FH + 0.15, 0, hq); return y + n * FH + 0.3; };
    const y1 = floor(W0, D0, 0.05, 2);
    const W1 = 9.2, D1 = 6.4, y2 = floor(W1, D1, y1, 4);
    // lam chắn nắng cam chạy dọc mặt tiền tháp
    for (const x of [-W1 / 2 + 0.5, -1.6, 1.6, W1 / 2 - 0.5]) box(0.22, y2 - y1, 0.5, accent, x, (y1 + y2) / 2, D1 / 2 + 0.28, hq);
    // sân thượng khối đế: bồn cây + ghế
    for (const [x, z] of [[-5.4, 3.4], [5.4, 3.4], [-5.4, -3.4], [5.4, -3.4]]) { box(1.1, 0.5, 1.1, stoneD, x, y1 + 0.25, z, hq); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), green); b.position.set(x, y1 + 0.85, z); b.castShadow = true; hq.add(b); }
    for (const x of [-3.2, 3.2]) box(1.6, 0.35, 0.5, new THREE.MeshStandardMaterial({ color: '#b58a5c', roughness: .8 }), x, y1 + 0.18, 3.75, hq);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(sx > 0 ? 0.08 : 0.08, 0.7, D0 / 2 + 0.15, M.steel || dark, sx * (W0 / 2 + 0.1), y1 + 0.35, sz * (D0 / 4 + 0.07), hq);
    box(W0 + 0.3, 0.7, 0.06, new THREE.MeshStandardMaterial({ color: '#cfeaf7', transparent: true, opacity: .35, depthWrite: false }), 0, y1 + 0.35, D0 / 2 + 0.12, hq);
    // mái: lan can, tấm pin mặt trời, khu kỹ thuật
    box(W1 + 0.3, 0.6, 0.12, stone, 0, y2 + 0.3, D1 / 2 + 0.1, hq); box(W1 + 0.3, 0.6, 0.12, stone, 0, y2 + 0.3, -D1 / 2 - 0.1, hq);
    for (const sx of [-1, 1]) box(0.12, 0.6, D1 + 0.3, stone, sx * (W1 / 2 + 0.1), y2 + 0.3, 0, hq);
    const pv = new THREE.MeshStandardMaterial({ color: '#1f3b5c', roughness: .3, metalness: .6 });
    for (let i = 0; i < 4; i++) { const p = box(1.5, 0.06, 1.0, pv, -3 + i * 1.7, y2 + 0.45, -1.6, hq); p.rotation.x = -0.35; }
    box(2.2, 1.1, 1.8, stoneD, 2.6, y2 + 0.55, 1.2, hq);
    // sảnh: mái đón cam, cửa kính, biển tên toà nhà
    box(5.6, 0.25, 2.4, accent, 0, 2.9, D0 / 2 + 1.2, hq); for (const x of [-2.5, 2.5]) box(0.16, 2.85, 0.16, dark, x, 1.45, D0 / 2 + 2.25, hq);
    box(3.2, 2.4, 0.1, new THREE.MeshStandardMaterial({ color: '#cfeaf7', transparent: true, opacity: .5, roughness: .05 }), 0, 1.25, D0 / 2 + 0.06, hq);
    board('DESIGN TRIP HQ', 'văn phòng công ty', 4.6, 0, y1 + 1.6 + 0.4, D1 / 2 + 0.45, hq);
    for (let i = 0; i < 3; i++) box(5 - i * 0.6, 0.12, 0.7, stoneD, 0, 0.06 + i * 0.0, D0 / 2 + 3.0 + i * 0.7, hq);
    // bồn cây, ghế đá, cây quanh quảng trường
    for (const [x, z] of [[-7, 2], [7, 2], [-6.5, -4.5], [6.5, -4.5], [-3.5, -7.6], [3.5, -7.6]]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 7), new THREE.MeshStandardMaterial({ color: '#6d5640' })); tr.position.set(x, 0.7, z); hq.add(tr);
      const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), green); cr.position.set(x, 2.1, z); cr.castShadow = true; hq.add(cr); box(1.6, 0.3, 1.6, stoneD, x, 0.15, z, hq); }
    for (const x of [-5.2, 5.2]) box(1.8, 0.4, 0.55, stone, x, 0.2, 7.2, hq);
    // cột cờ trước sảnh + cờ đỏ sao vàng bay trong gió; thêm một cột cờ nhỏ trên mái
    const flagTex = (() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; const x = c.getContext('2d');
      x.fillStyle = '#da251d'; x.fillRect(0, 0, 300, 200); x.fillStyle = '#ffff00'; x.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 24 : 60, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(150 + Math.cos(a) * r, 100 + Math.sin(a) * r); } x.closePath(); x.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
    const flagGeo = new THREE.PlaneGeometry(3, 2, 24, 12); flagGeo.translate(1.5, -1, 0);
    const base = flagGeo.attributes.position.array.slice(), flagM = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: .8 });
    const flagPole = (x, z, h, sc, parent) => { const pg = new THREE.Group(); pg.position.set(x, 0, z); parent.add(pg);
      box(0.9 * sc, 0.3, 0.9 * sc, stoneD, 0, 0.15, 0, pg);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * sc + 0.02, 0.09 * sc + 0.02, h, 12), new THREE.MeshStandardMaterial({ color: '#e8e8e8', metalness: .7, roughness: .25 })); pole.position.y = h / 2; pole.castShadow = true; pg.add(pole);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1 * sc + 0.04, 12, 8), new THREE.MeshStandardMaterial({ color: '#e9b949', metalness: .8, roughness: .2 })); ball.position.y = h + 0.08; pg.add(ball);
      const fl = new THREE.Mesh(flagGeo, flagM); fl.scale.setScalar(sc); fl.position.set(0.06, h - 0.15, 0); fl.castShadow = true; pg.add(fl); return pg; };
    flagPole(-4.6, D0 / 2 + 4.4, 10, 1, hq); flagPole(-W1 / 2 + 0.8, D1 / 2 - 0.6, 3.2, 0.55, (() => { const g = new THREE.Group(); g.position.y = y2; hq.add(g); return g; })());
    hq.traverse(o => { if (o.isMesh && !o.castShadow && o.geometry.type === 'BoxGeometry') o.castShadow = true; });
    // gió thổi: sóng chạy dọc lá cờ, mép ngoài bay nhiều hơn mép buộc vào cột
    const pa = flagGeo.attributes.position; let fk = 0;
    W.flagTick = t => { const arr = pa.array; for (let i = 0; i < arr.length; i += 3) { const x0 = base[i], y0 = base[i + 1], k = x0 / 3;
        arr[i + 2] = Math.sin(x0 * 2.1 - t * 5.2 + y0 * 0.6) * 0.22 * k + Math.sin(x0 * 3.7 - t * 7.9) * 0.05 * k;
        arr[i] = x0 - Math.abs(arr[i + 2]) * 0.15; arr[i + 1] = y0 - k * k * 0.12; }
      pa.needsUpdate = true; if ((fk++ & 3) === 0) flagGeo.computeVertexNormals(); };
    W.hq = hq; }

  // ---------- trees ----------
  { const leaf = [new THREE.MeshStandardMaterial({ color: '#6f8a6b', roughness: .9 }), new THREE.MeshStandardMaterial({ color: '#8aa184', roughness: .9 }), new THREE.MeshStandardMaterial({ color: '#e8b4c4', roughness: .9 })];
    const trunkM = new THREE.MeshStandardMaterial({ color: '#6d5640' });
    const spots = [];
    for (let i = 0; spots.length < 260 && i < 4000; i++) {
      const x = -80 + seeded(i + 11) * 150, z = -75 + seeded(i + 999) * 135;
      if (!inPoly(x, z, W.islandPoly)) continue;
      const rd = roadDist(x, z); if (rd < 5.5) continue;
      if (excl.some(([ex, ez, r]) => (ex - x) ** 2 + (ez - z) ** 2 < r * r)) continue;
      let edge = 1e9; for (const [px, pz] of W.islandPoly) edge = Math.min(edge, (px - x) ** 2 + (pz - z) ** 2); if (edge < 4) continue;
      spots.push([x, z, 0.7 + seeded(i + 5) * 0.8, i]);
    }
    const cone = new THREE.ConeGeometry(0.75, 2.2, 7), ball = new THREE.IcosahedronGeometry(1, 1), trunk = new THREE.CylinderGeometry(0.08, 0.11, 1, 6);
    const kinds = [[cone, leaf[0]], [ball, leaf[1]], [ball, leaf[2]]];
    const counts = [0, 0, 0]; spots.forEach(s => counts[s[3] % 7 === 0 ? 2 : s[3] % 2]++);
    const inst = kinds.map(([g2, m], k) => { const im = new THREE.InstancedMesh(g2, m, Math.max(1, counts[k])); im.castShadow = true; im.receiveShadow = true; scene.add(im); return im; });
    const trunks = new THREE.InstancedMesh(trunk, trunkM, spots.length); scene.add(trunks);
    const o = new THREE.Object3D(), used = [0, 0, 0];
    spots.forEach(([x, z, s, i], n) => {
      const k = i % 7 === 0 ? 2 : i % 2;
      o.position.set(x, 0.5 * s, z); o.scale.set(s, s, s); o.rotation.set(0, 0, 0); o.updateMatrix(); trunks.setMatrixAt(n, o.matrix);
      o.position.set(x, k === 0 ? 1.9 * s : 1.6 * s, z); o.scale.set(s, k === 0 ? s : s * 0.95, s); o.rotation.y = seeded(i) * 6; o.updateMatrix(); inst[k].setMatrixAt(used[k]++, o.matrix);
    });
  }

  // ---------- đường đi bộ trên cát quanh đảo Design (đảo chính): vòng khép kín, đi ngang qua chân 2 cây cầu ----------
  { const N = 520, OFF = 0.8, ring = [];
    for (let i = 0; i < N; i++) { const d = i / N * L, f = W.at(d), m = margin(d) + OFF; ring.push(new THREE.Vector3(f.pos.x - f.right.x * m, 0, f.pos.z - f.right.z * m)); }
    const C = new THREE.CatmullRomCurve3(ring, true, 'centripetal'), LC = C.getLength(), M2 = Math.round(LC / 0.5);
    const deckAt = (x, z) => { for (const B of [W.bridgeMain, W.bridgeDev]) { const y = B.deckY(x, z); if (y !== null) return { y, B }; } return null; };
    const pos = [], idx = [], ePos = [], eIdx = [], tg = new THREE.Vector3(), Ys = [];
    for (let i = 0; i <= M2; i++) { const u = (i % M2) / M2, p = C.getPointAt(u); C.getTangentAt(u, tg).setY(0).normalize(); const nx = -tg.z, nz = tg.x, y = -0.155;
      const on = deckAt(p.x, p.z); Ys.push(on ? on.y + 0.02 : -0.16);
      pos.push(p.x + nx * 0.7, y, p.z + nz * 0.7, p.x - nx * 0.7, y, p.z - nz * 0.7);
      ePos.push(p.x + nx * 0.85, y - 0.006, p.z + nz * 0.85, p.x - nx * 0.85, y - 0.006, p.z - nz * 0.85);
      if (i < M2) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); eIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      if (on && on.B === W.bridgeDev && i % 2 === 0) { const z = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.012, 1.5), new THREE.MeshBasicMaterial({ color: '#f4f1e8' })); z.position.set(p.x, on.y + 0.012, p.z); z.rotation.y = Math.atan2(-tg.z, tg.x); scene.add(z); } }
    const mk = (P, I, col) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, roughness: 1, side: THREE.DoubleSide })); m.receiveShadow = true; return add(m); };
    mk(ePos, eIdx, '#a8875a'); mk(pos, idx, '#d6bb88');
    // cọc gỗ nhỏ dọc mép ngoài, đèn thấp mỗi ~14 đơn vị
    for (let k = 0; k < Math.floor(LC / 14); k++) { const u = (k + 0.5) / Math.floor(LC / 14), p = C.getPointAt(u); C.getTangentAt(u, tg).setY(0).normalize(); if (deckAt(p.x, p.z) || W.nearBridge(p.x, p.z, 5)) continue;
      const x = p.x + tg.z * 1.05, z = p.z - tg.x * 1.05; box(0.12, 0.9, 0.12, M.pole, x, 0.27, z); box(0.26, 0.16, 0.26, M.lamp, x, 0.78, z); }
    const yAt = u => { const f = (((u % 1) + 1) % 1) * M2, i = Math.floor(f), k = f - i; return Ys[i] + (Ys[Math.min(M2, i + 1)] - Ys[i]) * k; };
    const SH = ['#ff7aa8', '#3fb5ff', '#e9b949', '#2bd47d', '#c9a6ff', '#ff5a1f', '#f4f2ee', '#1f6f8b', '#ffd84d'], walkers = [];
    for (let k = 0; k < 20; k++) { const dir = k % 2 ? -1 : 1, h = makeHuman({ seed: 820 + k, shirt: SH[k % SH.length], pose: k % 4 === 1 ? 'phone' : 'stand', style: k % 5 }); h.g.scale.setScalar(0.85); scene.add(h.g);
      if (h.hand) { const ph = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.02), new THREE.MeshBasicMaterial({ color: '#9fe7ff' })); ph.position.copy(h.hand.position); ph.position.z += 0.03; ph.rotation.x = -0.5; h.hand.parent.add(ph); }
      walkers.push({ g: h.g, h, dir, u: (Math.floor(k / 2) / 10 + (dir < 0 ? 0.05 : 0) + seeded(k + 60) * 0.03), sp: (0.85 + seeded(k + 61) * 0.3) / LC, ph: seeded(k + 62) * 6 }); }
    W.sandPath = { curve: C, length: LC, walkers };
    W.sandTick = (t, dt) => { for (const w of walkers) { w.u = (w.u + w.dir * w.sp * dt + 1) % 1; const p = C.getPointAt(w.u); C.getTangentAt(w.u, tg).setY(0).normalize();
      const o = 0.35 * w.dir; w.g.position.set(p.x - tg.z * o, yAt(w.u) + Math.abs(Math.sin(t * 6 + w.ph)) * 0.03, p.z + tg.x * o); w.g.rotation.y = Math.atan2(tg.x * w.dir, tg.z * w.dir); walkCycle(w.h, t * 6 + w.ph); } };
  }

  // ---------- beach palms, rocks, flower beds, bushes, umbrellas ----------
  { const hD = dOf('handoff'), near = (d, c, w) => { const x = Math.abs(d - c); return Math.min(x, L - x) < w; };
    const palms = [];
    for (let i = 0; i < 140; i++) { const d = (i + seeded(i) * .6) / 140 * L; if (near(d, hD, 26) || seeded(i + 50) < .42 || (inTour(d) && i % 3)) continue;
      const f = W.at(d), m = margin(d) + 1.75 + seeded(i + 3) * 0.6; palms.push([f.pos.x - f.right.x * m, f.pos.z - f.right.z * m, -f.right.x, -f.right.z, 0.8 + seeded(i + 9) * 0.45, i]); }
    for (const [isle, pts, c] of [[W.anim.handoff.isle, W.isleTrees, W.devIsland], [W.qc.isle, W.qcTrees, W.qcIsland]]) { isle.updateMatrixWorld(true); pts.forEach(([x, z], k) => { const p = isle.localToWorld(new THREE.Vector3(x, 0, z)), o = p.clone().sub(c).setY(0).normalize(); palms.push([p.x, p.z, o.x, o.z, 0.85, 900 + k + palms.length]); }); }
    for (const [x, z, ox, oz] of W.neckPalms) palms.push([x, z, ox, oz, 0.8 + seeded(palms.length) * 0.3, 950 + palms.length]);
    for (let i = palms.length - 1; i >= 0; i--) if (W.nearBridge(palms[i][0], palms[i][1], 6.5)) palms.splice(i, 1); else if (W.inDevLot(palms[i][0], palms[i][1], 1.6)) palms.splice(i, 1);   // không mọc xuyên qua cầu
    const trunkG = new THREE.CylinderGeometry(0.11, 0.15, 1, 7), leafG = new THREE.SphereGeometry(1, 8, 4).scale(1.25, .06, .28).translate(1.2, 0, 0), nutG = new THREE.SphereGeometry(.13, 8, 6);
    const trunkI = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: '#8a6a4a', roughness: .9 }), palms.length * 4);
    const leafI = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ color: '#4f9a58', roughness: .8, side: THREE.DoubleSide }), palms.length * 8);
    const nutI = new THREE.InstancedMesh(nutG, new THREE.MeshStandardMaterial({ color: '#6b4a2a' }), palms.length * 3);
    const o = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), lc = new THREE.Color(); let ti = 0, li = 0, ni = 0;
    for (const [x, z, ox, oz, sc, i] of palms) { const h = 4.6 * sc, lean = 0.22 + seeded(i + 2) * 0.2;
      for (let j = 0; j < 4; j++) { const t = (j + .5) / 4, dir = new THREE.Vector3(ox * 2 * lean * t, 1, oz * 2 * lean * t).normalize();
        o.position.set(x + ox * lean * h * t * t, h * t, z + oz * lean * h * t * t); o.quaternion.setFromUnitVectors(up, dir); o.scale.set(sc, h / 4 * 1.08, sc); o.updateMatrix(); trunkI.setMatrixAt(ti++, o.matrix); }
      const cx = x + ox * lean * h, cz = z + oz * lean * h; o.quaternion.identity();
      for (let k = 0; k < 8; k++) { o.position.set(cx, h, cz); o.rotation.set(0, k / 8 * 6.28 + seeded(i) * 3, -0.35 - seeded(i + k) * 0.25); o.scale.setScalar(sc * (0.9 + seeded(i * 3 + k) * 0.3)); o.updateMatrix(); leafI.setMatrixAt(li, o.matrix); leafI.setColorAt(li++, lc.set(k % 2 ? '#5fae5f' : '#468f50')); }
      o.rotation.set(0, 0, 0); for (let k = 0; k < 3; k++) { o.position.set(cx + Math.cos(k * 2.1) * .2, h - .2, cz + Math.sin(k * 2.1) * .2); o.scale.setScalar(sc); o.updateMatrix(); nutI.setMatrixAt(ni++, o.matrix); } }
    for (const im of [trunkI, leafI, nutI]) { im.castShadow = true; im.instanceMatrix.needsUpdate = true; scene.add(im); }
    // rocks along the shore
    const rocks = [];
    for (let i = 0; i < 110; i++) { if (seeded(i + 300) < .45) continue; const d = (i + seeded(i + 301)) / 110 * L; if (near(d, hD, 14) || inTour(d)) continue; const f = W.at(d), m = margin(d) + 2.1 + seeded(i + 302) * 1.4; rocks.push([f.pos.x - f.right.x * m, f.pos.z - f.right.z * m, .35 + seeded(i + 303) * .8, i]); }
    for (let i = rocks.length - 1; i >= 0; i--) if (W.nearBridge(rocks[i][0], rocks[i][1], 4.2)) rocks.splice(i, 1); else if (W.inDevLot(rocks[i][0], rocks[i][1], 1)) rocks.splice(i, 1);
    const rockI = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#a8a296', roughness: .95, flatShading: true }), rocks.length);
    rocks.forEach(([x, z, sc, i], n) => { o.position.set(x, -0.45, z); o.rotation.set(seeded(i) * 3, seeded(i + 1) * 3, 0); o.scale.set(sc * 1.3, sc * .7, sc); o.updateMatrix(); rockI.setMatrixAt(n, o.matrix); rockI.setColorAt(n, lc.set(seeded(i + 5) > .5 ? '#b3ad9f' : '#8f897d')); });
    rockI.castShadow = true; scene.add(rockI);
    // flower beds + bushes on the grass
    const okSpot = (x, z, rd = 4.4) => inPoly(x, z, W.islandPoly) && roadDist(x, z) > rd && !excl.some(([ex, ez, r]) => (ex - x) ** 2 + (ez - z) ** 2 < r * r) && W.islandPoly.every(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 > 3);
    const flowers = [], bushes = [], FC = ['#ff7aa8', '#ffd84d', '#ffffff', '#ff9f5a', '#c9a6ff'];
    for (let i = 0; flowers.length < 640 && i < 500; i++) { const cx = -80 + seeded(i + 1200) * 150, cz = -75 + seeded(i + 1300) * 135; if (!okSpot(cx, cz)) continue; const col = FC[i % 5];
      for (let k = 0; k < 10; k++) { const x = cx + (seeded(i * 11 + k) - .5) * 2.6, z = cz + (seeded(i * 13 + k) - .5) * 2.6; if (okSpot(x, z, 4)) flowers.push([x, z, col, i * 10 + k]); }
      if (i % 2 === 0) bushes.push([cx + 1.4, cz - 1, i]); }
    const flI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.17, 0), new THREE.MeshStandardMaterial({ roughness: .7 }), flowers.length);
    const stemI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.22, 0), new THREE.MeshStandardMaterial({ color: '#5f9c55', roughness: .9 }), flowers.length);
    flowers.forEach(([x, z, col, i], n) => { o.rotation.set(0, seeded(i) * 3, 0); o.position.set(x, .32, z); o.scale.setScalar(.8 + seeded(i + 1) * .5); o.updateMatrix(); flI.setMatrixAt(n, o.matrix); flI.setColorAt(n, lc.set(col)); o.position.y = .14; o.scale.set(1, .7, 1); o.updateMatrix(); stemI.setMatrixAt(n, o.matrix); });
    scene.add(flI, stemI);
    const buI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.6, 1), new THREE.MeshStandardMaterial({ roughness: .9, flatShading: true }), Math.max(1, bushes.length));
    bushes.forEach(([x, z, i], n) => { const sc = .7 + seeded(i + 2) * .6; o.position.set(x, .38 * sc, z); o.rotation.set(0, seeded(i) * 3, 0); o.scale.set(sc * 1.2, sc * .8, sc); o.updateMatrix(); buI.setMatrixAt(n, o.matrix); buI.setColorAt(n, lc.set(['#5e9c58', '#77ab63', '#4c8a52'][i % 3])); });
    buI.castShadow = true; scene.add(buI);
    // beach umbrellas + towels
    const UC = ['#ff5a1f', '#1f6f8b', '#e9b949', '#e86a92', '#2bd47d'];
    for (let k = 0; k < 9; k++) { const d = (k + 0.3) / 9 * L; if (near(d, hD, 30) || near(d, dOf('research'), 20) || near(d, dOf('design'), 34) || inTour(d)) continue; const f = W.at(d), m = margin(d) + 2.05, x = f.pos.x - f.right.x * m, z = f.pos.z - f.right.z * m; if (W.nearBridge(x, z, 6.5)) continue;
      const u = new THREE.Group(); u.position.set(x, 0, z); u.rotation.y = Math.atan2(f.right.z, -f.right.x) - 0.3; add(u); box(0.06, 2.2, 0.06, M.white, 0, 1.0, 0, u);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 10), new THREE.MeshStandardMaterial({ color: UC[k % 5], roughness: .6 })); top.position.y = 2.2; u.add(top);
      const tw = box(0.9, 0.03, 1.8, new THREE.MeshStandardMaterial({ color: UC[(k + 2) % 5] }), 1.1, -0.1, 0.3, u); tw.rotation.y = 0.4; }

    // ---------- bãi biển có sóng: dải cát thoai thoải ra biển, sóng cuộn vào bờ, dù + ghế nằm ----------
    const frameM = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: .5 }), woodM = new THREE.MeshStandardMaterial({ color: '#b98a56', roughness: .8 });
    const skinM = ['#f1c9a5', '#d9a47a', '#a8754f'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .8 }));
    const PADS = ['#ff5a1f', '#1f6f8b', '#ffffff', '#e9b949', '#2bd47d', '#e86a92'], UMB = ['#ff5a1f', '#ffffff', '#1f6f8b', '#e9b949', '#e86a92'];
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const waveSets = [], swimmers = [];
    const lounger = (parent, x, z, col, who) => { const l = new THREE.Group(); l.position.set(x, 0, z); parent.add(l);
      for (const lx of [-0.28, 0.28]) for (const lz of [-0.8, 0.75]) box(0.05, 0.22, 0.05, frameM, lx, -0.06, lz, l);
      box(0.66, 0.06, 1.25, frameM, 0, 0.06, 0.25, l); box(0.6, 0.07, 1.2, new THREE.MeshStandardMaterial({ color: col, roughness: .7 }), 0, 0.12, 0.25, l);
      const back = new THREE.Group(); back.position.set(0, 0.08, -0.35); back.rotation.x = -0.75; l.add(back); box(0.66, 0.06, 0.7, frameM, 0, 0, -0.35, back); box(0.6, 0.07, 0.66, new THREE.MeshStandardMaterial({ color: col, roughness: .7 }), 0, 0.06, -0.35, back);
      if (who >= 0) { const sk = skinM[who % 3]; const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 3, 8), sk); body.rotation.x = Math.PI / 2 - 0.12; body.position.set(0, 0.3, 0.32); l.add(body);
        const sw = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.18, 3, 8), new THREE.MeshStandardMaterial({ color: PADS[(who + 3) % 6], roughness: .7 })); sw.rotation.x = Math.PI / 2; sw.position.set(0, 0.32, 0.32); l.add(sw);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), sk); head.position.set(0, 0.5, -0.32); l.add(head);
        if (who % 2) { const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 14), new THREE.MeshStandardMaterial({ color: '#e8d49a' })); hat.position.set(0, 0.64, -0.36); hat.rotation.x = -0.6; l.add(hat); } }
      return l; };
    // 1 bộ = dù sọc + 2 ghế nằm quay ra biển + bàn nhỏ có ly dừa (+ khăn)
    const umbrellaSet = (x, y, z, yaw, n) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; add(g);
      box(0.07, 2.6, 0.07, woodM, 0, 1.2, 0.1, g);
      const segs = 12, cg = new THREE.ConeGeometry(1.55, 0.55, segs, 1, true), cc = [], ca = UMB[n % 5], cb = n % 2 ? '#ffffff' : UMB[(n + 2) % 5];
      const c1 = new THREE.Color(ca), c2 = new THREE.Color(cb === ca ? '#ffffff' : cb), pa = cg.attributes.position; for (let v = 0; v < pa.count; v++) { const ang = Math.atan2(pa.getZ(v), pa.getX(v)), sgi = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * segs + 0.5) % 2, c = sgi ? c1 : c2; cc.push(c.r, c.g, c.b); }
      cg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); const top = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6, side: THREE.DoubleSide, flatShading: true })); top.position.set(0, 2.6, 0.1); top.castShadow = true; g.add(top);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), woodM); knob.position.set(0, 2.9, 0.1); g.add(knob);
      lounger(g, -0.62, 0.55, PADS[n % 6], seeded(n + 40) < 0.55 ? n : -1); lounger(g, 0.62, 0.55, PADS[(n + 2) % 6], seeded(n + 41) < 0.4 ? n + 1 : -1);
      box(0.32, 0.36, 0.32, woodM, 0, 0.1, -0.35, g); const cup = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: '#7a4f2a' })); cup.position.set(0, 0.36, -0.35); g.add(cup);
      if (n % 3 === 1) { const tw = box(0.8, 0.02, 1.5, new THREE.MeshStandardMaterial({ color: PADS[(n + 4) % 6] }), 1.9, -0.02, 0.6, g); tw.rotation.y = 0.3; }
      return g; };
    let nSet = 0;
    // dải cát dốc + sóng quanh một đoạn bờ; trả về mẫu S để đặt đồ lên
    const beachAt = (dC, SPAN, EXT, BW, landFrom = null, landY = null) => { const NS = Math.round(SPAN * 1.9), d0 = dC - SPAN / 2;
      const S = []; for (let i = 0; i <= NS; i++) { const d = ((d0 + i / NS * SPAN) % L + L) % L, f = W.at(d), m = margin(d);
        const ox = -f.right.x, oz = -f.right.z, e = m + 2.6 + 0.6 * EXT, bx = f.pos.x + ox * e, bz = f.pos.z + oz * e;
        S.push({ d, px: f.pos.x, pz: f.pos.z, ox, oz, m, raw: EXT * bump(d, dC, BW) * (W.nearBridge(bx, bz, 8) ? 0 : 1) }); }
      for (let i = 0; i <= NS; i++) { let mn = 9; for (let j = Math.max(0, i - 5); j <= Math.min(NS, i + 5); j++) mn = Math.min(mn, S[j].raw); S[i].ext0 = mn; }
      for (let i = 0; i <= NS; i++) { let a = 0, n = 0; for (let j = Math.max(0, i - 4); j <= Math.min(NS, i + 4); j++) { a += S[j].ext0; n++; } S[i].ext = a / n; }
      const P = (s, o, y, arr) => arr.push(s.px + s.ox * o, y, s.pz + s.oz * o);
      { const pos = [], col = [], idx = [], dry = new THREE.Color('#ecd4a0'), wet = new THREE.Color('#c9a66e'), deep = new THREE.Color('#b08c58');
        S.forEach((s, i) => { const e = s.ext, lf = landFrom ? landFrom(s, i) : null, inner = lf === null ? s.m + 2.3 : lf;
          const ly = landY ? landY(i) : -0.17; P(s, inner, ly, pos); P(s, s.m + 2.6 + e * 0.62, Math.max(-0.2, ly - 0.015), pos); P(s, s.m + 2.6 + e * 0.85, -0.36, pos); P(s, s.m + 2.6 + e + 0.8, -0.66, pos);
          [dry, dry, wet, deep].forEach(c => col.push(c.r, c.g, c.b)); });
        for (let i = 0; i < NS; i++) for (let k = 0; k < 3; k++) { const a = i * 4 + k, b = a + 4; idx.push(a, b, a + 1, a + 1, b, b + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
        const bm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 })); bm.receiveShadow = true; add(bm); }
      const prof = (s, o) => { const e = s.ext, X = [s.m + 2.3, s.m + 2.6 + e * 0.62, s.m + 2.6 + e * 0.85, s.m + 2.6 + e + 0.8], Y = [-0.17, -0.2, -0.36, -0.66];
        if (o <= X[0]) return Y[0]; for (let q = 1; q < 4; q++) if (o <= X[q]) return Y[q - 1] + (Y[q] - Y[q - 1]) * (o - X[q - 1]) / Math.max(1e-3, X[q] - X[q - 1]); return -0.9; };
      const KW = 5, waves = [];
      for (let k = 0; k < KW; k++) { const n = (NS + 1) * 2, pos = new Float32Array(n * 3), col = new Float32Array(n * 4), idx = [];
        for (let i = 0; i < NS; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(idx);
        const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide })); mesh.frustumCulled = false; mesh.renderOrder = 2; add(mesh); waves.push({ g, pos, col, k }); }
      waveSets.push({ S, NS, waves, prof, EXT, KW, seed: dC });
      return S; };
    W.waveTick = t => { for (const ws of waveSets) { const { S, NS, waves, prof, EXT, KW, seed } = ws;
      for (const w of waves) { const { pos, col, k } = w;
        for (let i = 0; i <= NS; i++) { const s = S[i], e = s.ext, edge = s.m + 2.6 + e;
          const p = ((t * 0.16 + k / KW + seed * 0.013 + 0.05 * Math.sin(i * 0.11 + k * 1.7)) % 1 + 1) % 1;                 // 0 = ngoài khơi, 1 = tràn hết lên cát
          const run = 9.5 * (1 - p) - 1.2 * sm(0.75, 1, p) * (e / EXT) - 0.6;
          const o = edge + run + 0.35 * Math.sin(i * 0.31 + k * 2.3 + t * 0.4), wdt = 0.25 + 1.1 * sm(0.45, 0.85, p) - 0.5 * sm(0.9, 1, p);
          const y0 = Math.max(-0.49 + 0.04 * sm(0.5, 0.8, p), prof(s, o) + 0.035);
          const a = (sm(0, 0.25, p) * (1 - sm(0.88, 1, p))) * (0.3 + 0.6 * sm(0.4, 0.8, p)) * Math.min(1, e / 1.2 + 0.25) * sm(0, 6, i) * sm(0, 6, NS - i);
          const j = i * 6; pos[j] = s.px + s.ox * o; pos[j + 1] = y0; pos[j + 2] = s.pz + s.oz * o; pos[j + 3] = s.px + s.ox * (o + wdt); pos[j + 4] = y0 - 0.01; pos[j + 5] = s.pz + s.oz * (o + wdt);
          const c = i * 8; col[c] = col[c + 1] = col[c + 2] = 1; col[c + 3] = a; col[c + 4] = 0.82; col[c + 5] = 0.96; col[c + 6] = 0.97; col[c + 7] = a * 0.35; }
        w.g.attributes.position.needsUpdate = true; w.g.attributes.color.needsUpdate = true; } }
      for (const sw of swimmers) { sw.g.position.y = -0.52 + 0.07 * Math.sin(t * 1.6 + sw.ph); sw.g.rotation.z = 0.08 * Math.sin(t * 1.1 + sw.ph); if (sw.arm) sw.arm.rotation.x = t * 3 + sw.ph; } };

    // --- đảo Design: bãi tắm rìa ngoài ---
    { const S = beachAt(dOf('design'), 64, 4.6, 13);
      for (let i = 6; i <= S.length - 7; i += 6) { const s = S[i]; if (s.ext < 2.6) continue; const o = s.m + 2.6 + s.ext * 0.36, x = s.px + s.ox * o, z = s.pz + s.oz * o; if (W.nearBridge(x, z, 7.5)) continue;
        umbrellaSet(x, -0.08, z, Math.atan2(s.ox, s.oz), nSet++); } }

    // --- bãi tắm du lịch đối diện quán cà phê + Game Zone: biến bãi đất trống thành bãi cát ---
    { const [ta, tb] = W.tourD, SPAN = ((tb - ta) % L + L) % L, dC = (ta + SPAN / 2) % L, NSx = Math.round((SPAN + 8) * 1.9), xs = i => Math.max(0, Math.min(1, Math.min(i, NSx - i) / 18));
      const S = beachAt(dC, SPAN + 8, 3.8, 11, (s, i) => s.m + 2.3 - (s.m - 0.7) * xs(i), i => -0.17 + 0.205 * xs(i));
      const NS = S.length - 1, at = (i, o) => { const s = S[Math.max(0, Math.min(NS, Math.round(i)))]; return [s.px + s.ox * o, s.pz + s.oz * o, Math.atan2(s.ox, s.oz), s]; };
      const ic = Math.round((((W.cafeD - (dC - (SPAN + 8) / 2)) % L + L) % L) / (SPAN + 8) * NS), iv = NS * 0.7;
      // dù + ghế: 3 hàng so le trên cát khô, 1 hàng sát mép nước (chừa lối gỗ từ cổng và sân bóng chuyền)
      for (let i = 12; i <= NS - 12; i += 8) { const s = S[i];
        for (const [r, o] of [[0, 7.2], [1, 11.0], [2, 14.8]]) { const ii = i + (r % 2) * 4; if (o > s.m || Math.abs(ii - ic) < 5 || Math.abs(ii - iv) < 9) continue; if ((i / 8 + r) % 5 === 3) continue; const [x, z, yaw] = at(i + (r % 2) * 4, o); umbrellaSet(x, 0.08, z, yaw, nSet++); }
        if (s.ext > 2) { const [x, z, yaw] = at(i + 2, s.m + 2.6 + s.ext * 0.32); if (!W.nearBridge(x, z, 7.5)) umbrellaSet(x, -0.08, z, yaw, nSet++); } }
      // cổng vào bãi tắm, đối diện quán cà phê
      { const [x, z, yaw] = at(ic, 3.6), gate = new THREE.Group(); gate.position.set(x, 0, z); gate.rotation.y = yaw; add(gate);
        for (const sx of [-2.2, 2.2]) { box(0.22, 3.4, 0.22, woodM, sx, 1.7, 0, gate); const top = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 6), new THREE.MeshStandardMaterial({ color: '#d9b56a', flatShading: true })); top.position.set(sx, 3.6, 0); gate.add(top); }
        const [c, cx] = canvas(512, 128); cx.fillStyle = '#1f6f8b'; cx.fillRect(0, 0, 512, 128); cx.fillStyle = '#ffd84d'; cx.fillRect(0, 108, 512, 20);
        cx.fillStyle = '#fff'; cx.font = 'bold 50px system-ui, sans-serif'; cx.textAlign = 'center'; cx.fillText('🏖 BÃI TẮM DU LỊCH', 256, 62); cx.font = '26px system-ui, sans-serif'; cx.fillText('tắm biển · nằm dù · bóng chuyền', 256, 98);
        const bm = new THREE.MeshStandardMaterial({ map: tex(c), roughness: .6 }); const board = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.15, 0.1), [M.white, M.white, M.white, M.white, bm, bm]); board.position.set(0, 3.0, 0); board.rotation.y = Math.PI; gate.add(board);
        // lối gỗ từ cổng xuống bãi + vạch qua đường từ quán cà phê
        for (let k = 0; k < 9; k++) box(1.6, 0.06, 0.42, woodM, 0, 0.08, 0.6 + k * 0.7, gate);
        const zM = new THREE.MeshBasicMaterial({ color: '#f7f3ea' }); for (let k = 0; k < 6; k++) box(2.6, 0.03, 0.42, zM, 0, 0.1, -3.6 - 2.0 + k * 0.8, gate); }
      // chòi cứu hộ ở giữa bãi
      { const [x, z, yaw, s] = at(NS * 0.5 + 3, S[Math.round(NS * 0.5)].m + 0.2), lg = new THREE.Group(); lg.position.set(x, 0, z); lg.rotation.y = yaw; add(lg);
        const redM = new THREE.MeshStandardMaterial({ color: '#e0352b', roughness: .6 });
        for (const lx of [-0.7, 0.7]) for (const lz of [-0.7, 0.7]) { const leg = box(0.12, 2.6, 0.12, frameM, lx, 1.3, lz, lg); leg.rotation.x = lz * 0.08; leg.rotation.z = -lx * 0.08; }
        box(1.9, 0.12, 1.9, woodM, 0, 2.6, 0, lg); box(1.6, 1.0, 1.4, redM, 0, 3.2, -0.15, lg); box(1.1, 0.5, 0.05, new THREE.MeshStandardMaterial({ color: '#1d2329' }), 0, 3.35, 0.56, lg);
        const roof = box(2.2, 0.1, 2.0, M.white, 0, 3.8, -0.1, lg); roof.rotation.x = -0.12;
        for (let k = 0; k < 6; k++) { const st = box(0.9, 0.06, 0.14, woodM, 0, 0.3 + k * 0.4, -1.05 - k * 0.2, lg); }
        box(0.05, 1.6, 0.05, frameM, 0.8, 4.4, -0.8, lg); const fl = box(0.7, 0.45, 0.02, redM, 1.15, 5.0, -0.8, lg); fl.material = new THREE.MeshStandardMaterial({ color: '#ffd84d', side: THREE.DoubleSide });
        const guard = makeHuman({ seed: 911, shirt: '#e0352b', pose: 'stand' }); guard.g.position.set(0, 2.66, 0.45); guard.g.scale.setScalar(0.85); lg.add(guard.g); }
      // sân bóng chuyền bãi biển ở đầu bãi
      { const [x, z, yaw] = at(iv, 10.5), vb = new THREE.Group(); vb.position.set(x, 0.09, z); vb.rotation.y = yaw + Math.PI / 2; add(vb);
        const lineM2 = new THREE.MeshBasicMaterial({ color: '#2f7fd1' }); for (const lz of [-3, 3]) box(9, 0.02, 0.08, lineM2, 0, 0, lz, vb); for (const lx of [-4.5, 4.5]) box(0.08, 0.02, 6, lineM2, lx, 0, 0, vb);
        for (const lz of [-3.3, 3.3]) box(0.08, 2.3, 0.08, frameM, 0, 1.15, lz, vb);
        const net = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 0.8, 22, 4), new THREE.MeshBasicMaterial({ color: '#1d2329', wireframe: true })); net.position.set(0, 1.85, 0); net.rotation.y = Math.PI / 2; vb.add(net);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffd84d' })); ball.position.set(-1.2, 2.8, 0.8); vb.add(ball);
        const SH2 = ['#ff7aa8', '#3fb5ff', '#2bd47d', '#e9b949'];
        const pl = [[-2.6, -1.2], [-2.2, 1.4], [2.4, -1.0], [2.8, 1.2]].map(([px, pz], k) => { const h = makeHuman({ seed: 930 + k, shirt: SH2[k], pose: 'stand' }); h.g.position.set(px, 0, pz); h.g.rotation.y = px < 0 ? Math.PI / 2 : -Math.PI / 2; h.g.scale.setScalar(0.85); vb.add(h.g);
          return { h, home: [px, pz], side: Math.sign(px), ph: 0, hitT: 9, jump: false }; });
        // trận bóng chuyền liên tục: bóng bay theo đường parabol giữa các người chơi (chuyền cho đồng đội rồi đập sang lưới bên kia),
        // người nhận chạy tới điểm rơi, giơ tay đỡ/đập (nhảy khi đập), những người khác lùi về vị trí và nhún chờ
        const HAND = 1.75, rnd = n => seeded(n * 7.31 + 3.3);
        const R = { n: 0, hitter: 0, recv: 2, from: [-2.6, -1.2], to: [2.2, -0.6], t: 0, dur: 1.5, H: 2.4 };
        const nextShot = () => { const n = ++R.n, hp = pl[R.recv]; R.hitter = R.recv; R.from = R.to.slice();
          const pass = R.n % 3 !== 0;                     // 2 chạm trong sân mình rồi đánh sang
          const mate = pl.findIndex((p, i) => i !== R.hitter && p.side === hp.side), opp = pl.map((p, i) => i).filter(i => pl[i].side !== hp.side)[rnd(n) < 0.5 ? 0 : 1];
          R.recv = pass ? mate : opp; const side = pl[R.recv].side;
          const rp = pl[R.recv].h.g.position; R.to = [side * Math.min(4.2, Math.max(1.0, Math.abs(rp.x) + (rnd(n + 1) - 0.5) * 2.4)), Math.min(2.6, Math.max(-2.6, rp.z + (rnd(n + 2) - 0.5) * 2.6))]; R.t = 0;
          R.dur = pass ? 1.0 + rnd(n + 3) * 0.3 : 1.25 + rnd(n + 4) * 0.35; R.H = pass ? 1.5 + rnd(n + 5) * 0.6 : 2.0 + rnd(n + 6) * 0.9;
          hp.hitT = 0; hp.jump = !pass && rnd(n + 7) < 0.6; };
        W.vballTick = (t, dt) => { R.t += dt; let u = R.t / R.dur; if (u >= 1) { nextShot(); u = 0; }
          ball.position.set(R.from[0] + (R.to[0] - R.from[0]) * u, HAND + 0.25 + 4 * R.H * u * (1 - u) + (pl[R.hitter].jump ? 0.35 * (1 - u) : 0), R.from[1] + (R.to[1] - R.from[1]) * u); ball.rotation.x += dt * 6; ball.rotation.z += dt * 4;
          pl.forEach((p, i) => { const g = p.h.g; p.hitT += dt;
            let tx, tz; if (i === R.recv) { tx = R.to[0]; tz = R.to[1]; } else { tx = p.home[0] + 0.4 * Math.sin(t * 0.7 + i); tz = p.home[1] + 0.5 * Math.sin(t * 0.9 + i * 2); }
            if (i !== R.recv && pl[R.recv].side === p.side) { tx = p.home[0] * 1.15; }   // đồng đội lùi ra cho người đỡ bóng
            const dx = tx - g.position.x, dz = tz - g.position.z, dist = Math.hypot(dx, dz), sp = i === R.recv ? 4.2 : 1.6, step = Math.min(dist, sp * dt);
            if (dist > 0.02) { g.position.x += dx / dist * step; g.position.z += dz / dist * step; }
            const moving = dist > 0.08; p.ph += dt * (moving ? 11 : 0);
            walkCycle(p.h, p.ph, moving ? 0.6 : 0);
            // nhìn theo quả bóng
            const fy = Math.atan2(ball.position.x - g.position.x, ball.position.z - g.position.z); let df = fy - g.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); g.rotation.y += df * Math.min(1, dt * 8);
            // tư thế tay: vừa chạm bóng -> giơ thẳng lên (đập) / ra trước (chuyền); sắp nhận -> đưa tay ra trước
            const up = p.hitT < 0.35, ready = i === R.recv && u > 0.6;
            if (up || ready) p.h.arms.forEach(a => a.rotation.x = up ? (p.jump ? 2.9 : 2.3) : 1.3);
            // nhảy khi đập, nhún nhẹ khi chờ
            g.position.y = up && p.jump ? 0.45 * Math.sin(Math.min(1, p.hitT / 0.35) * Math.PI) : (moving ? 0 : 0.04 * Math.max(0, Math.sin(t * 6 + i * 1.3))); }); };
        W.vball = { ball, players: pl }; }
      // lâu đài cát + phao bơi + dây phao giới hạn vùng tắm + người đang bơi
      { const [x, z, yaw, s] = at(NS * 0.8, S[Math.round(NS * 0.8)].m + 2.9), sandM = new THREE.MeshStandardMaterial({ color: '#d9bd86', roughness: 1, flatShading: true });
        const cs = new THREE.Group(); cs.position.set(x, -0.15, z); add(cs); for (const [cx2, cz2, h] of [[0, 0, 0.55], [0.5, 0.2, 0.38], [-0.45, 0.25, 0.4], [0.1, -0.45, 0.34]]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, h, 8), sandM); tw.position.set(cx2, h / 2, cz2); cs.add(tw); const cn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.25, 8), sandM); cn.position.set(cx2, h + 0.12, cz2); cs.add(cn); }
        const buoyM = [new THREE.MeshStandardMaterial({ color: '#ff5a1f' }), new THREE.MeshStandardMaterial({ color: '#ffffff' })], rope = [];
        for (let i = 6; i <= NS - 6; i += 3) { const s2 = S[i], o = s2.m + 2.6 + s2.ext + 11; const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), buoyM[(i / 3) % 2]); b.position.set(s2.px + s2.ox * o, -0.48, s2.pz + s2.oz * o); add(b); rope.push(b.position.clone()); swimmers.push({ g: b, ph: i }); }
        add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rope), rope.length * 3, 0.025, 4), new THREE.MeshStandardMaterial({ color: '#f4f1ea' })));
        const RING = ['#ff5a1f', '#ffd84d', '#2bd47d', '#e86a92', '#3fb5ff'];
        for (let k = 0; k < 9; k++) { const s2 = S[Math.round(NS * (0.12 + 0.09 * k))], o = s2.m + 2.6 + s2.ext + 3.5 + seeded(k + 70) * 5, g = new THREE.Group(); g.position.set(s2.px + s2.ox * o, -0.52, s2.pz + s2.oz * o); g.rotation.y = seeded(k + 71) * 6; add(g);
          const sk = skinM[k % 3]; const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), sk); head.position.y = 0.2; g.add(head);
          const sh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), sk); sh.scale.set(1.2, 0.5, 0.8); g.add(sh);
          let arm = null; if (k % 3 === 0) { arm = new THREE.Group(); arm.position.set(0.25, 0.02, 0); g.add(arm); const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.4, 2, 6), sk); a.position.y = 0.25; arm.add(a); arm.rotation.z = -0.3; }
          if (k % 2 === 0) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.11, 8, 16), new THREE.MeshStandardMaterial({ color: RING[k % 5], roughness: .5 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.04; g.add(ring); }
          swimmers.push({ g, ph: k * 1.7, arm }); } }
    }
  }

  W.night.screens = screens; W.bots = bots; W.night.roomLights = roomLights;
  // ---------- fireworks over the lighthouse ----------
  { const FC = ['#ff5a1f', '#ffd84d', '#5ff3ff', '#ff7aa8', '#2bd47d', '#c9a6ff', '#ffffff'];
    const rockets = [], bursts = [], queue = []; let last = null; const col = new THREE.Color();
    W.fireworks = (n = 4) => { for (let k = 0; k < n; k++) queue.push(k * 0.32 + Math.random() * 0.1); };
    W.tickFireworks = t => {
      const dt = last === null ? 0 : Math.max(0, Math.min(0.1, t - last)); last = t; if (!dt) return;
      for (let i = queue.length - 1; i >= 0; i--) if ((queue[i] -= dt) <= 0) { queue.splice(i, 1);
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3c4' })); m.position.copy(W.qc.lampTop); scene.add(m);
        rockets.push({ m, v: new THREE.Vector3((Math.random() - .5) * 6, 11 + Math.random() * 3, (Math.random() - .5) * 6), life: 0.75 + Math.random() * 0.25 }); }
      for (let i = rockets.length - 1; i >= 0; i--) { const r = rockets[i]; r.m.position.addScaledVector(r.v, dt); r.v.y -= 9 * dt;
        if ((r.life -= dt) <= 0) { rockets.splice(i, 1); scene.remove(r.m); r.m.geometry.dispose();
          const N = 220, pos = new Float32Array(N * 3), cols = new Float32Array(N * 3), vel = [], c1 = FC[Math.random() * FC.length | 0], c2 = FC[Math.random() * FC.length | 0];
          for (let k = 0; k < N; k++) { pos.set([r.m.position.x, r.m.position.y, r.m.position.z], k * 3); const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u), sp = 5 + Math.random() * 2.5;
            vel.push(new THREE.Vector3(s * Math.cos(a) * sp, u * sp, s * Math.sin(a) * sp)); col.set(k % 3 ? c1 : c2); cols.set([col.r, col.g, col.b], k * 3); }
          const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
          const mat = new THREE.PointsMaterial({ size: 1.8, map: poolTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
          const pts = new THREE.Points(geo, mat); scene.add(pts); bursts.push({ pts, vel, life: 2.0 }); } }
      for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i], p = b.pts.geometry.attributes.position;
        for (let k = 0; k < b.vel.length; k++) { const v = b.vel[k]; v.y -= 3.2 * dt; v.multiplyScalar(1 - 1.2 * dt); p.array[k * 3] += v.x * dt; p.array[k * 3 + 1] += v.y * dt; p.array[k * 3 + 2] += v.z * dt; }
        p.needsUpdate = true; b.life -= dt; b.pts.material.opacity = Math.min(1, b.life / 1.2); b.pts.material.size = 1.8 + (2 - b.life) * 0.4;
        if (b.life <= 0) { bursts.splice(i, 1); scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); } }
    }; }
  // ---------- released features fly from the lighthouse to the user city; SOS flares when users hit a bug ----------
  { const flights = [], flares = []; let last = null;
    const smokeM = new THREE.MeshBasicMaterial({ color: '#c9c3b7', transparent: true, opacity: .5, depthWrite: false });
    W.sendToUsers = color => { const c = fileCard(color, ''); c.scale.setScalar(0.8); scene.add(c); flights.push({ c, k: 0, to: W.port.waitSpot() }); };   // hải đăng → bến cảng bàn giao, tàu RELEASE chở sang thành phố
    W.flare = () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff3b1f' })); m.position.copy(W.user.roof); scene.add(m);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: poolTex, color: '#ff3b1f', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.add(glow);
      const light = new THREE.PointLight('#ff3b1f', 0, 60, 1.2); m.add(light);
      flares.push({ m, glow, light, v: 11, t: 0, puffs: [] }); };
    W.tickUser = (t, cam) => {
      const dt = last === null ? 0 : Math.max(0, Math.min(0.1, t - last)); last = t;
      W.user.blinkM.color.set(Math.sin(t * 4) > 0.3 ? '#ff2a10' : '#3a0a05');
      W.user.tickCity(t, dt);
      for (const w of W.user.walkers) { w.a += w.sp * dt; w.g.position.set(Math.cos(w.a) * w.r, w.y0 + Math.abs(Math.sin(t * 8 + w.r)) * 0.05, Math.sin(w.a) * w.r); w.g.rotation.y = -w.a + (w.sp > 0 ? Math.PI : 0); if (w.h) walkCycle(w.h, t * 6 + w.r * 3); }
      for (let i = flights.length - 1; i >= 0; i--) { const f = flights[i]; f.k += dt / 3.2; const k = Math.min(1, f.k), e = k * k * (3 - 2 * k);
        f.c.position.lerpVectors(W.qc.lampTop, f.to, e); f.c.position.y += Math.sin(k * Math.PI) * 6; f.c.rotation.y += dt * 3;
        if (f.k >= 1) { flights.splice(i, 1); W.port.arrive(f.c); } }
      for (let i = flares.length - 1; i >= 0; i--) { const f = flares[i]; f.t += dt;
        if (f.t < 2.2) { f.m.position.y += f.v * dt; f.v = Math.max(1, f.v - 4.5 * dt);
          if (Math.random() < 0.6) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), smokeM.clone()); p.position.copy(f.m.position); scene.add(p); f.puffs.push({ p, life: 2.5 }); } }
        else { f.m.position.y -= 1.1 * dt; f.m.position.x += Math.sin(f.t * 2) * 0.02; const fl = 0.8 + 0.2 * Math.sin(f.t * 30);
          f.glow.material.opacity = Math.min(1, (f.t - 2.2) * 3) * fl * (f.t > 6 ? Math.max(0, 1 - (f.t - 6) / 1.2) : 1); f.light.intensity = f.glow.material.opacity * 400; }
        if (cam) f.glow.quaternion.copy(cam.quaternion);
        for (let j = f.puffs.length - 1; j >= 0; j--) { const q = f.puffs[j]; q.life -= dt; q.p.scale.setScalar(1 + (2.5 - q.life) * 1.2); q.p.material.opacity = Math.max(0, q.life / 2.5 * 0.45); if (q.life <= 0) { scene.remove(q.p); q.p.material.dispose(); f.puffs.splice(j, 1); } }
        if (f.t > 7.4 && !f.puffs.length) { scene.remove(f.m); flares.splice(i, 1); } }
    }; }
  // ---------- feature agents: behaviour follows the feature status ----------
  { let last = null; const up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3(), tgt = new THREE.Vector3();
    const MODE = { todo: 'idle', doing: 'paint', redo: 'paint', review: 'scan', dev: 'scan', qa: 'scan', qc: 'scan', done: 'happy', improve: 'happy', bug: 'alarm' };
    const EDGE = { idle: '#9aa3a8', paint: '#ff5a1f', scan: '#e9b949', happy: '#2bd47d', alarm: '#ff3b1f' };
    const EYE = { idle: '#2c5560', paint: '#5ff3ff', scan: '#ffd84d', happy: '#7dffa8', alarm: '#ff3b1f' };
    W.tickPlots = (t, feats) => {
      const dt = last === null ? 0 : Math.max(0, Math.min(0.1, t - last)); last = t;
      for (const P of W.plots) { const f = feats[P.i]; let mode = MODE[f.status] || 'idle'; if (f.status === 'bug' && f.taken) mode = 'paint';
        if (mode !== P.mode) { if (mode === 'paint' && P.prog > 0.9) P.prog = 0.45; P.edgeM.color.set(EDGE[mode]); P.edgeM.emissive.set(EDGE[mode]); P.agent.eyesM.color.set(EYE[mode]); P.mode = mode; }
        // progress of the painted UI
        if (mode === 'idle') P.prog = Math.max(0, P.prog - dt * 0.5);
        else if (mode === 'paint') P.prog = Math.min(0.9, P.prog + dt * 0.03);
        else P.prog = Math.min(1, P.prog + dt * 0.4);
        const p = P.prog; P.paint.visible = p > 0.005;
        if (P.paint.visible) { P.paint.scale.x = p; P.paint.position.x = -3.7 + 3.7 * p; P.ui.repeat.set(p, 1); P.ui.offset.set(0, 0); }
        const ex = -3.7 + 7.4 * p, s = P.i * 1.7, A = P.agent;
        P.edgeGlow.visible = mode === 'paint'; P.edgeGlow.position.x = ex;
        P.scanBar.visible = mode === 'scan'; P.scanBar.position.x = Math.sin(t * 1.2 + s) * 3.6;
        P.glitch.material.opacity = mode === 'alarm' ? (Math.sin(t * 22 + s) > 0.2 ? 0.28 : 0.05) : 0;
        if (mode === 'alarm') P.edgeM.emissiveIntensity = Math.sin(t * 10) > 0 ? 1.2 : 0.2; else P.edgeM.emissiveIntensity = mode === 'idle' ? 0.15 : 0.5;
        // where the agent wants to be
        if (mode === 'idle') tgt.set(3.25, 0.85 + Math.sin(t * 1.2 + s) * 0.03, 2.15);
        else if (mode === 'paint') tgt.set(ex - 0.35, 1.75 + Math.sin(t * 3 + s) * 0.08, Math.sin(t * 1.4 + s) * 1.9);
        else if (mode === 'scan') tgt.set(P.scanBar.position.x, 2.0 + Math.sin(t * 2 + s) * 0.1, -0.3);
        else if (mode === 'happy') tgt.set(3.25, 0.95 + Math.abs(Math.sin(t * 4 + s)) * 0.55, 2.15);
        else tgt.set(Math.sin(t * 30) * 0.06, 2.3 + Math.sin(t * 6) * 0.1, 0);
        A.g.position.lerp(tgt, Math.min(1, dt * (mode === 'paint' ? 6 : 3)));
        A.hover.rotation.y = mode === 'happy' ? t * 4 + s : mode === 'idle' ? Math.sin(t * 0.5 + s) * 0.4 : Math.sin(t * 1.5 + s) * 0.25;
        A.halo.rotation.z = t * 6; A.halo.material.opacity = mode === 'idle' ? 0.2 : 0.75;
        const blink = ((t + s) % 3.3) < 0.1 ? 0.15 : 1; A.eyes.forEach(e => e.scale.y = mode === 'idle' ? 0.35 : blink);
        if (mode === 'alarm') A.eyesM.color.set(Math.sin(t * 12) > 0 ? '#ff3b1f' : '#5a0d05');
        // painting beam from the pen to the canvas
        P.beam.visible = mode === 'paint';
        if (P.beam.visible) { const from = A.g.position.clone(); from.y -= 0.55; tmp.set(ex, 0.3, A.g.position.z); const d = from.distanceTo(tmp);
          P.beam.position.copy(from).lerp(tmp, 0.5); P.beam.scale.set(1, d, 1); P.beam.quaternion.setFromUnitVectors(up, from.clone().sub(tmp).normalize()); P.beam.material.opacity = 0.55 + 0.3 * Math.sin(t * 20 + s); }
      }
    }; }

  W.tick = (t, cam) => { tickBots(t); W.arcade.wheel.rotation.z = t * 0.25; W.arcade.cabins.forEach(c => c.rotation.z = -t * 0.25); W.qc.beams.rotation.y = t * 0.9; W.tickFireworks(t); W.tickUser(t, cam); { const dt = W._wt === undefined ? 0 : Math.max(0, Math.min(0.1, t - W._wt)); W._wt = t; if (dt) { W.testerTick(t, dt); W.sandTick(t, dt); W.vballTick(t, dt); } } W.foamM.opacity = 0.42 + 0.18 * Math.sin(t * 0.9); W.shallowM.opacity = 0.3 + 0.04 * Math.sin(t * 0.5); W.flagTick(t); W.waveTick(t); };

  // stations: positions for the camera + stop distances for the trucks
  for (const s of STATIONS) {
    if (frames[s.key]) { const f = frames[s.key]; W.stations[s.key] = { ...s, d: f.d, group: f.group, pos: f.frame.pos, tan: f.frame.tan, right: f.frame.right }; }
    else W.stations[s.key] = { ...s, d: null, group: s.key === 'qc' ? W.qc.isle : s.key === 'user' ? W.user.isle : W.anim.handoff.isle, pos: (s.key === 'qc' ? W.qcIsland : s.key === 'user' ? W.user.pos : W.devIsland).clone(), tan: frames.handoff.frame.tan, right: frames.handoff.frame.right };
  }

  scene.traverse(o => { if (o.isMesh && !o.material.transparent && !o.isInstancedMesh && o !== sea) { o.castShadow = true; o.receiveShadow = true; } });
  return W;
}
