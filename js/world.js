// Dựng hòn đảo Design Trip: đường vòng khép kín, 8 phòng ban + đảo Dev, cây, đèn, nước.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { STATIONS, FEATURES } from './data.js';
import { CL, CH, CW, PM, room, desk, chair, plant, tallPlant, wallBoard, bookshelf, sofa, roundTable, bigScreen, phoneStand, tripod, boxes, coffeeBar, bot, bots, tickBots, fileCard, screens } from './props.js';
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
  W.shallowM = new THREE.MeshBasicMaterial({ color: '#5fd0d8', transparent: true, opacity: .32, depthWrite: false });
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
        vec3 day = mix(vec3(.05,.24,.38), vec3(.09,.36,.52), .5+.3*w) + smoothstep(.8,1.2,w)*.06;
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

  // ---------- lamps along the inside of the road ----------
  const excl = [];   // circles kept clear of trees
  for (const k in frames) excl.push([frames[k].frame.pos.x, frames[k].frame.pos.z, 9]);
  for (let d = 4; d < L; d += 13) {
    if (Object.values(frames).some(f => { const x = Math.abs(f.d - d); return Math.min(x, L - x) < 8; })) continue;
    if (Object.entries(VLOT).some(([k, v]) => { const x = Math.abs(frames[k].d + v.x - d); return Math.min(x, L - x) < 11; })) continue;
    const f = W.at(d), x = f.pos.x + f.right.x * 3.2, z = f.pos.z + f.right.z * 3.2;
    box(0.14, 4.2, 0.14, M.pole, x, 2.1, z);
    const arm = box(1.1, 0.1, 0.12, M.pole, x - f.right.x * 0.5, 4.15, z - f.right.z * 0.5); arm.rotation.y = Math.atan2(-f.right.z, f.right.x);
    box(0.4, 0.12, 0.3, M.lamp, x - f.right.x * 1.0, 4.07, z - f.right.z * 1.0);
    const pool = plane(6, 6, M.pool, scene); pool.rotation.x = -Math.PI / 2; pool.position.set(x - f.right.x * 2, 0.05, z - f.right.z * 2);
  }

  // ---------- people ----------
  W.people = [];
  const person = (label, color, parent, x, z, { seat = false } = {}) => {
    const g = new THREE.Group(); g.position.set(x, seat ? -0.22 : 0, z); parent.add(g);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 4, 10), new THREE.MeshStandardMaterial({ color, roughness: .6 })); body.position.y = 0.62; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), new THREE.MeshStandardMaterial({ color: '#f1c7a5' })); head.position.y = 1.3; g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.255, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: ['#2a1d16', '#7a4a2a', '#111', '#c98b4b'][W.people.length % 4] })); hair.position.y = 1.33; g.add(hair);
    W.people.push({ label, group: g, seed: W.people.length }); return g;
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
    const PARK = [0, 1, 2, 3].map(k => new THREE.Vector3(-13, 0, 6.2 + k * 2.5));
    const pad = box(13, 0.06, 11.4, M.pad, -14, 0.03, 9.9, g); pad.receiveShadow = true;
    const lineM = new THREE.MeshBasicMaterial({ color: '#f7f3ea' });
    for (let k = 0; k <= 4; k++) box(5.2, 0.02, 0.1, lineM, -12.6, 0.07, 4.95 + k * 2.5, g);
    box(0.1, 0.02, 10.1, lineM, -10.05, 0.07, 9.95, g);
    board('BÃI CHỜ TASK', '4 chỗ · P', 3.4, -14, 2.6, 16.1, g); for (const dx of [-1.3, 1.3]) box(0.1, 1.9, 0.1, M.pole, -14 + dx, 0.95, 16, g);
    W.parks = { task: { slots: PARK, group: g } };
    { g.updateMatrixWorld(true); const c = g.localToWorld(new THREE.Vector3(-14, 0, 10)); excl.push([c.x, c.z, 10]); const c2 = g.localToWorld(new THREE.Vector3(0, 0, -5)); excl.push([c2.x, c2.z, 8]); }
    W.anim.gantry = { trolley, cables, spreader, TOP, stackZ: -5, laneZ: LANE, grabY: 0.96 + 3 * CH + 0.08 };
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
    const fenceM = new THREE.MeshStandardMaterial({ color: '#7c6b55' });
    FEATURES.forEach((f, i) => {
      const c = i % 4, rr = Math.floor(i / 4), x = -14.5 + c * 9.6, z = -9 - rr * 7.4;
      box(8.4, 0.2, 6, M.soil, x, 0.1, z, g);
      const wire = artTex(i, false), ui = artTex(i, true);
      const art = plane(7.4, 5.1, new THREE.MeshStandardMaterial({ map: wire, roughness: .8 }), g); art.rotation.x = -Math.PI / 2; art.position.set(x, 0.22, z);
      for (const [dx, dz, w, d] of [[0, -3, 8.4, .08], [0, 3, 8.4, .08], [-4.2, 0, .08, 6], [4.2, 0, .08, 6]]) box(w, 0.35, d, fenceM, x + dx, 0.37, z + dz, g);
      const wp = new THREE.Vector3(x, 0, z); g.localToWorld(wp);
      W.plots.push({ id: f[0], name: f[1], art, wire, ui, pos: wp }); excl.push([wp.x, wp.z, 6]);
    });
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
    W.anim.scan = { mat: scanM, x: AX };
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
    W.anim.barrier = { arm, open: 0 };
  }

  // ---------- 08 handoff: handoff room, quay, ship-to-shore crane, ship, and 09 the dev island ----------
  { const { group: g } = frames.handoff, STS = 10;
    const r = dept('handoff', { x: -9, z: 13.5, w: 8.4, d: 6, back: 1, accent: '#1f6f8b', board: sign('PHÒNG BÀN GIAO', 'spec · asset · proto') }, [[0.2, 0.2], [1.3, -0.5]]);
    wallBoard(r.in, 'check', -0.8, 1.45, r.wallZ, 3.8, Math.PI);
    desk(r.in, -1.6, 1.5, Math.PI, { mon: 2, screen: 'ui', s: 9, chairColor: '#1f6f8b' }); desk(r.in, 1.8, 1.5, Math.PI, { screen: 'code', s: 3, chairColor: '#1f6f8b' });
    boxes(r.in, 3.3, -1.8); plant(r.in, -3.6, -2.3);
    person('Designer', '#ff5a1f', r.in, -1.6, 2.25, { seat: true }); person('Dev', '#3fb5ff', r.in, 0.4, -0.9);
    bot(r.in, -2.2, -0.8, 'AI xuất spec', 'Spec, asset, 12 trạng thái đã đủ ✔');
    box(26, 0.6, 7, M.quay, 0, -0.25, -6.5, g);
    board('CẢNG BÀN GIAO', 'handoff → dev', 3.6, 6, 3.4, 2.8, g, Math.PI); for (const dx of [-1.2, 1.2]) box(0.1, 2.2, 0.1, M.pole, 6 + dx, 1.1, 2.9, g);
    const crane = new THREE.Group(); g.add(crane);
    for (const x of [-3.2, 3.2]) for (const z of [-1.8, -8.8]) box(0.4, STS, 0.4, M.white, x, STS / 2, z, crane);
    for (const z of [-1.8, -8.8]) box(6.8, 0.5, 0.5, M.orange, 0, STS, z, crane);
    for (const x of [-1.3, 1.3]) { box(0.45, 0.55, 22, M.white, x, STS + 0.5, -10, crane); box(0.47, 0.08, 22, M.glow, x, STS + 0.2, -10, crane); }
    const sts = new THREE.Group(); crane.add(sts); box(3.2, 0.5, 1.2, M.steel, 0, STS + 0.1, 0, sts);
    const stsCables = [-0.7, 0.7].map(dx => box(0.04, 1, 0.04, M.steel, dx, 0, 0, sts));
    const stsSpreader = box(CL + 0.2, 0.14, CW + 0.1, M.orange, 0, 0, 0, sts);
    // ship (child of the handoff frame; it sails in this frame)
    const ship = new THREE.Group(); g.add(ship);
    box(17, 2.2, 5, new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: .5 }), 0, 0.5, 0, ship);
    box(17.2, 0.3, 5.1, new THREE.MeshStandardMaterial({ color: COL.orange }), 0, -0.2, 0, ship);
    box(16.6, 0.06, 4.6, new THREE.MeshStandardMaterial({ color: '#d9d2c4', roughness: .8 }), 0, 1.62, 0, ship);
    box(2.6, 3.4, 4.2, M.white, 6.8, 3.3, 0, ship); box(2.65, 0.6, 4.25, M.glass, 6.8, 4.2, 0, ship); box(0.9, 1, 1, M.orange, 6.2, 5.5, 0, ship);
    board('DEV TEAM', 'chờ file…', 2.6, 6.8, 3.0, 2.13, ship);
    const SHIP_DOCK = new THREE.Vector3(0, 0, -15.5), SHIP_ISLE = new THREE.Vector3(4, 0, -31.5);
    ship.position.copy(SHIP_DOCK);
    const slots = []; for (let k = 0; k < 4; k++) for (const z of [-1.1, 1.1]) slots.push(new THREE.Vector3(-3.8 + k * 2.6, 1.6 + CH / 2, z));
    // dev island
    const isle = new THREE.Group(); isle.position.set(4, 0, -42); g.add(isle);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 10, 1.2, 48), M.ground); disc.position.y = -0.6; disc.receiveShadow = true; isle.add(disc);
    const sand = new THREE.Mesh(new THREE.CylinderGeometry(11.8, 12.2, 1, 48), M.sand); sand.position.y = -0.68; isle.add(sand);
    const foam = new THREE.Mesh(new THREE.RingGeometry(12, 13.4, 64), W.foamM); foam.rotation.x = -Math.PI / 2; foam.position.y = -0.5; isle.add(foam);
    const shallow = new THREE.Mesh(new THREE.RingGeometry(12, 19, 64), W.shallowM); shallow.rotation.x = -Math.PI / 2; shallow.position.y = -0.53; isle.add(shallow);
    const dr = room(isle, { x: 0, z: -1.2, w: 9.4, d: 6.4, back: -1, accent: '#3fb5ff', board: sign('DEV TEAM', 'build · QA · release') });
    wallBoard(dr.in, 'wire', -1.5, 1.45, dr.wallZ, 3.2, Math.PI);
    desk(dr.in, -2.6, 1.6, Math.PI, { mon: 2, screen: 'code', s: 1, chairColor: '#3fb5ff' }); desk(dr.in, 0.6, 1.6, Math.PI, { mon: 2, screen: 'code', s: 2, chairColor: '#3fb5ff' });
    desk(dr.in, 3, -1.2, 0, { screen: 'ui', s: 5, chairColor: '#ff5a1f' }); coffeeBar(dr.in, dr.leftX + 0.35, -1.2, Math.PI / 2);
    person('Dev 1', '#3fb5ff', dr.in, -2.6, 2.35, { seat: true }); person('Dev 2', '#3fb5ff', dr.in, 0.6, 2.35, { seat: true }); person('Design QA', '#ff5a1f', dr.in, 3, -1.95, { seat: true });
    bot(dr.in, 1.6, -1.6, 'AI review code', 'Build #42: lệch 2px so với thiết kế');
    box(5, 0.3, 2.4, M.quay, 0, -0.05, 10.2, isle);
    // release tower: the lamp flashes on every release
    const tower = new THREE.Group(); tower.position.set(-6.4, 0, -5.6); isle.add(tower);
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 6, 16), M.white); tw.position.y = 3; tower.add(tw);
    for (const y of [1.6, 3.6]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.74, 0.5, 16), M.orange); band.position.y = y; tower.add(band); }
    const releaseM = new THREE.MeshStandardMaterial({ color: '#fff2c8', emissive: '#ffd27a', emissiveIntensity: 0.2 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), releaseM); lamp.position.y = 6.5; tower.add(lamp);
    board('RELEASE', 'lên sóng →', 2.6, -6.4, 2.2, -4.4, isle);
    W.isleTrees = [[6.8, 4.6], [-7, 3.4], [7.4, -4.6], [-2, 7.6]];
    W.anim.handoff = { crane, sts, stsCables, stsSpreader, STS, ship, slots, SHIP_DOCK, SHIP_ISLE, isle, group: g, releaseM };
    const iw = new THREE.Vector3(); isle.getWorldPosition(iw); W.devIsland = iw; excl.push([iw.x, iw.z, 13]);
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

  // ---------- centre of the loop: a pond and the deadline café ----------
  { const lake = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: '#3f8fb5', roughness: .25, metalness: .1 })); lake.rotation.x = -Math.PI / 2; lake.position.set(-8, 0.04, 8); add(lake);
    const rim = new THREE.Mesh(new THREE.RingGeometry(9, 10, 48), M.sand); rim.rotation.x = -Math.PI / 2; rim.position.set(-8, 0.05, 8); add(rim);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 1.4, 16), M.white); f.position.set(-8, 0.7, 8); add(f);
    const cafe = new THREE.Group(); cafe.position.set(14, 0, 12); add(cafe);
    box(7, 3.2, 5, M.bldLight, 0, 1.6, 0, cafe); box(7.6, 0.35, 5.8, M.orange, 0, 3.35, 0, cafe);
    for (let i = 0; i < 5; i++) { const w = box(1.3, 0.12, 2.2, i % 2 ? M.white : M.orange, -2.8 + i * 1.4, 2.9, 3.4, cafe); w.rotation.x = 0.35; }
    board('CÀ PHÊ', '☕ chạy deadline', 3.2, 0, 5.0, 2.55, cafe);
    for (const [x, z] of [[-2, 5.5], [1.5, 6]]) { box(1.2, 0.08, 1.2, M.white, x, 0.75, z, cafe); box(0.1, 0.75, 0.1, M.pole, x, 0.375, z, cafe); }
    person('Designer', '#ff5a1f', cafe, -2.9, 5.8); person('PM', '#3fb5ff', cafe, 2.6, 6.4);
    excl.push([-8, 8, 12], [14, 12, 9]); W.cafe = cafe;
    // lily pads, a little pier and the fountain jet
    const padM = new THREE.MeshStandardMaterial({ color: '#5d9a5a', roughness: .8 });
    for (let i = 0; i < 14; i++) { const a = seeded(i + 40) * 6.28, r = 3 + seeded(i + 41) * 5; const lp = new THREE.Mesh(new THREE.CylinderGeometry(.45 + seeded(i) * .3, .45 + seeded(i) * .3, .03, 14, 1, false, 0, 5.6), padM); lp.position.set(-8 + Math.cos(a) * r, 0.07, 8 + Math.sin(a) * r); lp.rotation.y = a; add(lp);
      if (i % 4 === 0) { const fl = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshStandardMaterial({ color: '#f7b8d8' })); fl.position.set(lp.position.x, 0.14, lp.position.z); add(fl); } }
    box(1.4, 0.12, 5.2, M.wood || new THREE.MeshStandardMaterial({ color: '#b58a5c' }), -8, 0.16, 14.4);
    const jetM = new THREE.MeshStandardMaterial({ color: '#d6f3ff', transparent: true, opacity: .6, roughness: .1 });
    W.jet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.32, 1.6, 12, 1, true), jetM); W.jet.position.set(-8, 2.2, 8); add(W.jet);
    const splash = new THREE.Mesh(new THREE.SphereGeometry(.5, 14, 8, 0, 6.29, 0, 1.2), jetM); splash.position.set(-8, 2.9, 8); splash.rotation.x = Math.PI; add(splash); }

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

  // ---------- beach palms, rocks, flower beds, bushes, umbrellas ----------
  { const hD = dOf('handoff'), near = (d, c, w) => { const x = Math.abs(d - c); return Math.min(x, L - x) < w; };
    const palms = [];
    for (let i = 0; i < 140; i++) { const d = (i + seeded(i) * .6) / 140 * L; if (near(d, hD, 26) || seeded(i + 50) < .42) continue;
      const f = W.at(d), m = margin(d) + 0.8 + seeded(i + 3) * 1.3; palms.push([f.pos.x - f.right.x * m, f.pos.z - f.right.z * m, -f.right.x, -f.right.z, 0.8 + seeded(i + 9) * 0.45, i]); }
    { const isle = W.anim.handoff.isle; isle.updateMatrixWorld(true); W.isleTrees.forEach(([x, z], k) => { const p = isle.localToWorld(new THREE.Vector3(x, 0, z)), o = p.clone().sub(W.devIsland).setY(0).normalize(); palms.push([p.x, p.z, o.x, o.z, 0.85, 900 + k]); }); }
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
    for (let i = 0; i < 110; i++) { if (seeded(i + 300) < .45) continue; const d = (i + seeded(i + 301)) / 110 * L; if (near(d, hD, 14)) continue; const f = W.at(d), m = margin(d) + 2.1 + seeded(i + 302) * 1.4; rocks.push([f.pos.x - f.right.x * m, f.pos.z - f.right.z * m, .35 + seeded(i + 303) * .8, i]); }
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
    for (let k = 0; k < 9; k++) { const d = (k + 0.3) / 9 * L; if (near(d, hD, 30) || near(d, dOf('research'), 20)) continue; const f = W.at(d), m = margin(d) + 1.6, x = f.pos.x - f.right.x * m, z = f.pos.z - f.right.z * m;
      const u = new THREE.Group(); u.position.set(x, 0, z); add(u); box(0.06, 2.2, 0.06, M.white, 0, 1.0, 0, u);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 10), new THREE.MeshStandardMaterial({ color: UC[k % 5], roughness: .6 })); top.position.y = 2.2; u.add(top);
      const tw = box(0.9, 0.03, 1.8, new THREE.MeshStandardMaterial({ color: UC[(k + 2) % 5] }), 1.1, -0.1, 0.3, u); tw.rotation.y = 0.4; }
  }

  W.night.screens = screens; W.bots = bots;
  W.tick = t => { tickBots(t); W.foamM.opacity = 0.42 + 0.18 * Math.sin(t * 0.9); W.shallowM.opacity = 0.3 + 0.04 * Math.sin(t * 0.5); W.jet.scale.y = 1 + 0.12 * Math.sin(t * 6); };

  // stations: positions for the camera + stop distances for the trucks
  for (const s of STATIONS) {
    if (frames[s.key]) { const f = frames[s.key]; W.stations[s.key] = { ...s, d: f.d, group: f.group, pos: f.frame.pos, tan: f.frame.tan, right: f.frame.right }; }
    else W.stations[s.key] = { ...s, d: null, group: W.anim.handoff.isle, pos: W.devIsland.clone(), tan: frames.handoff.frame.tan, right: frames.handoff.frame.right };
  }

  scene.traverse(o => { if (o.isMesh && !o.material.transparent && !o.isInstancedMesh && o !== sea) { o.castShadow = true; o.receiveShadow = true; } });
  return W;
}
