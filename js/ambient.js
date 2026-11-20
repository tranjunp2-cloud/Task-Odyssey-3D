// Cảnh quanh đảo: hải âu bay lượn, máy bay bay ngang, tàu du lịch lớn chạy vòng ngoài khơi.
import * as THREE from 'three';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
const box = (w, h, d, mat, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);

// window strip texture for the cruise ships (lit at night through emissiveMap)
const winTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 16; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 256, 16);
  for (let i = 0; i < 32; i++) { x.fillStyle = Math.sin(i * 12.9898) > -0.6 ? '#ffe2a8' : '#203040'; x.fillRect(i * 8 + 2, 4, 5, 8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
})();

// vệt sóng chữ V sau đuôi tàu, nhạt dần về phía sau (u = 0 xa tàu, u = 1 sát đuôi)
const wakeTex = (() => {
  const W = 256, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H);
  for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) {
    const u = i / W, v = Math.abs(j / H - 0.5) * 2, spread = 0.25 + 0.75 * (1 - u);
    const edge = Math.exp(-Math.pow((v - spread * 0.9) / 0.08, 2)), core = Math.exp(-Math.pow(v / (0.12 + 0.3 * (1 - u)), 2)) * 0.7;
    const n = 0.75 + 0.25 * Math.sin(i * 0.9 + j * 1.7) * Math.sin(i * 0.31 - j * 0.6);
    const a = Math.min(1, (edge + core) * n) * Math.pow(u, 1.6);
    const k = (j * W + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = a * 255;
  }
  x.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
})();

export function buildAmbient(scene) {
  const root = new THREE.Group(); root.name = 'ambient'; scene.add(root);
  const CENTER = new THREE.Vector3(30, 0, 10);   // giữa cụm đảo (đảo chính + thành phố User ở x≈114)
  const nightMats = [];   // emissive materials that light up at night

  // ---------- hải âu ----------
  const gullBody = std('#f7f7f4'), gullWing = std('#e9ecef', { side: THREE.DoubleSide }), gullTip = std('#3a4148', { side: THREE.DoubleSide }), beak = std('#f2b632');
  const wingGeo = new THREE.BoxGeometry(1.5, 0.05, 0.55); wingGeo.translate(0.75, 0, 0);
  const tipGeo = new THREE.BoxGeometry(0.45, 0.05, 0.4); tipGeo.translate(1.7, 0, 0.05);
  const gulls = [];
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group(); root.add(g);
    const body = mesh(new THREE.SphereGeometry(0.32, 10, 8), gullBody, g); body.scale.set(1, 0.85, 2.4);
    mesh(new THREE.SphereGeometry(0.22, 10, 8), gullBody, g, 0, 0.12, 0.72);
    const b = mesh(new THREE.ConeGeometry(0.07, 0.3, 6), beak, g, 0, 0.08, 1.02); b.rotation.x = Math.PI / 2;
    const tail = box(0.4, 0.05, 0.45, gullWing, g, 0, 0.02, -0.85);
    const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.18, 0.12, 0.05); w.scale.x = s; g.add(w);
      mesh(wingGeo, gullWing, w); mesh(tipGeo, gullTip, w); return w; });
    const group = i % 4;   // 4 đàn, mỗi đàn lượn quanh một chỗ
    const hub = [[-10, 10], [60, -40], [114, 42], [-45, -55]][group];
    gulls.push({ g, wings, tail, hub, r: 10 + Math.random() * 22, a: Math.random() * Math.PI * 2, sp: (0.18 + Math.random() * 0.14) * (group % 2 ? 1 : -1),
      h: 16 + Math.random() * 14, ph: Math.random() * 10, flap: 6 + Math.random() * 3 });
  }

  // ---------- máy bay ----------
  const plane = new THREE.Group(); root.add(plane);
  { const white = std('#f8f8f6', { metalness: 0.2, roughness: 0.35 }), stripe = std('#ff5a1f'), dark = std('#1d2a33', { roughness: 0.3 });
    const body = mesh(new THREE.CylinderGeometry(1.1, 1.1, 18, 16), white, plane); body.rotation.x = Math.PI / 2;
    const nose = mesh(new THREE.SphereGeometry(1.1, 16, 10), white, plane, 0, 0, 9); nose.scale.z = 1.8;
    const tailCone = mesh(new THREE.ConeGeometry(1.1, 4, 16), white, plane, 0, 0.3, -11); tailCone.rotation.x = -Math.PI / 2;
    box(2.26, 0.35, 15, stripe, plane, 0, -0.2, -0.5);
    box(2.25, 0.35, 0.5, dark, plane, 0, 0.45, 9.6);   // kính buồng lái
    for (let k = 0; k < 12; k++) for (const s of [-1, 1]) box(0.05, 0.3, 0.35, dark, plane, s * 1.1, 0.35, 7 - k * 1.3);
    const wing = new THREE.Shape([[0, 0], [12, -4.5], [12, -6], [0, -5.5]].map(([a, b]) => new THREE.Vector2(a, b)));
    const wingGeo = new THREE.ExtrudeGeometry(wing, { depth: 0.25, bevelEnabled: false }); wingGeo.rotateX(Math.PI / 2);
    for (const s of [-1, 1]) { const w = mesh(wingGeo, white, plane, 0, -0.4, 2.5); w.scale.x = s;
      const eng = mesh(new THREE.CylinderGeometry(0.6, 0.55, 2.6, 12), std('#c9ced3', { metalness: 0.4 }), plane, s * 4.2, -1.1, 1.2); eng.rotation.x = Math.PI / 2; }
    const hst = new THREE.Shape([[0, 0], [4.5, -1.8], [4.5, -2.6], [0, -2.6]].map(([a, b]) => new THREE.Vector2(a, b)));
    const hstGeo = new THREE.ExtrudeGeometry(hst, { depth: 0.2, bevelEnabled: false }); hstGeo.rotateX(Math.PI / 2);
    for (const s of [-1, 1]) { const h = mesh(hstGeo, white, plane, 0, 0.4, -9.8); h.scale.x = s; }
    const fin = new THREE.Shape([[0, 0], [-3.2, 0], [-4.6, 4.6], [-2.8, 4.6]].map(([a, b]) => new THREE.Vector2(a, b)));
    const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.22, bevelEnabled: false }); finGeo.rotateY(-Math.PI / 2);
    mesh(finGeo, stripe, plane, 0.11, 0.8, -9);
  }
  const navR = new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), navG = new THREE.MeshBasicMaterial({ color: '#2aff6a' }), strobe = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true });
  mesh(new THREE.SphereGeometry(0.3, 8, 6), navR, plane, 12, -0.4, -3.4); mesh(new THREE.SphereGeometry(0.3, 8, 6), navG, plane, -12, -0.4, -3.4);
  mesh(new THREE.SphereGeometry(0.35, 8, 6), strobe, plane, 0, 1.2, -1);
  // vệt khói trắng sau máy bay
  const trailM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  const trails = [-4.2, 4.2].map(x => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.9, 1, 8, 1, true), trailM); m.rotation.x = Math.PI / 2; plane.add(m); return { m, x }; });
  const FLIGHT = { period: 46, dur: 30, len: 900, alt: 62 };
  let route = -1; const from = new THREE.Vector3(), to = new THREE.Vector3(), dir = new THREE.Vector3();
  const newRoute = n => {   // mỗi chuyến một hướng khác nhau, luôn bay ngang qua cụm đảo
    const a = n * 2.39996 + 0.7, off = ((n * 37) % 7 - 3) * 18;
    dir.set(Math.cos(a), 0, Math.sin(a)); const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(off);
    from.copy(CENTER).add(side).addScaledVector(dir, -FLIGHT.len / 2).setY(FLIGHT.alt + (n % 3) * 8);
    to.copy(from).addScaledVector(dir, FLIGHT.len);
    plane.rotation.set(0, Math.atan2(dir.x, dir.z), 0);
  };

  // ---------- tàu du lịch ----------
  const ships = [];
  const makeShip = (hullColor, accent, name) => {
    const s = new THREE.Group(); root.add(s);
    const hullShape = new THREE.Shape(); hullShape.moveTo(-22, -4.2); hullShape.lineTo(17, -4.2); hullShape.quadraticCurveTo(26, -3.5, 30, 0); hullShape.quadraticCurveTo(26, 3.5, 17, 4.2); hullShape.lineTo(-22, 4.2); hullShape.quadraticCurveTo(-24, 0, -22, -4.2);
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 5, bevelEnabled: false }); hullGeo.rotateX(-Math.PI / 2); hullGeo.translate(0, -2, 0);
    mesh(hullGeo, std(hullColor), s);                                     // thân tàu
    const red = std('#b3262a'); const rb = mesh(hullGeo, red, s, 0, -0.01, 0); rb.scale.set(1.002, 0.25, 1.004);   // sơn chống hà dưới nước
    box(46, 0.5, 8.6, std(accent), s, 1, 2.6, 0);                         // viền màu
    const deckM = std('#f4f2ee');
    const winBand = new THREE.MeshStandardMaterial({ color: '#16324a', roughness: 0.2, metalness: 0.4, emissive: '#ffd9a0', emissiveMap: winTex, emissiveIntensity: 0 }); nightMats.push(winBand);
    for (let k = 0; k < 5; k++) {                                         // 5 tầng boong, càng lên càng ngắn
      const len = 38 - k * 4.2, x0 = -2 - k * 1.2, y = 3.5 + k * 1.6, w = 7.6 - k * 0.5;
      box(len, 1.25, w, deckM, s, x0, y, 0);
      for (const sd of [-1, 1]) box(len - 0.4, 0.55, 0.05, winBand, s, x0, y + 0.05, sd * (w / 2 + 0.03));
      box(len + 0.3, 0.12, w + 0.3, std('#dfe6ea'), s, x0, y + 0.68, 0);
    }
    box(5, 2.6, 7, std('#f4f2ee'), s, 13, 7.0, 0); box(5.05, 0.7, 7.05, std('#16324a', { metalness: 0.4, roughness: 0.2 }), s, 13, 7.6, 0);   // buồng lái
    const funnel = mesh(new THREE.CylinderGeometry(1.5, 1.9, 4.5, 16), std(accent), s, -11, 12.5, 0); funnel.scale.z = 1.4;
    mesh(new THREE.CylinderGeometry(1.52, 1.52, 0.6, 16), std('#1b1f24'), s, -11, 14.5, 0).scale.z = 1.4;
    for (let k = 0; k < 6; k++) for (const sd of [-1, 1]) {                 // xuồng cứu sinh
      const lb = mesh(new THREE.CapsuleGeometry(0.45, 1.6, 4, 8), std('#ff8a1f'), s, -12 + k * 4.6, 4.3, sd * 4.5); lb.rotation.z = Math.PI / 2; }
    const pool = box(5, 0.1, 3.4, std('#38c6e6', { roughness: 0.1 }), s, -6, 10.62, 0); pool.material.emissive = new THREE.Color('#38c6e6'); pool.material.emissiveIntensity = 0.15;
    for (let k = 0; k < 6; k++) { const u = mesh(new THREE.ConeGeometry(0.7, 0.5, 8), std(['#ff5a1f', '#ffd84d', '#2bd47d'][k % 3]), s, -12 + k * 2.2, 11.4, (k % 2 ? 1 : -1) * 2.6); mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 4), deckM, s, u.position.x, 10.9, u.position.z); }
    box(0.2, 4, 0.2, deckM, s, 13, 10.3, 0);
    const top = mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3030' }), s, 13, 12.4, 0);
    // tên tàu trên mạn
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#ffffff00'; x.clearRect(0, 0, 512, 64);
    x.fillStyle = '#16324a'; x.font = '900 46px Montserrat, sans-serif'; x.fillText(name, 10, 50);
    const nt = new THREE.CanvasTexture(c); nt.colorSpace = THREE.SRGBColorSpace;
    for (const sd of [-1, 1]) { const p = mesh(new THREE.PlaneGeometry(12, 1.5), new THREE.MeshBasicMaterial({ map: nt, transparent: true }), s, 18, 1.1, sd * 4.25); p.rotation.y = sd > 0 ? 0 : Math.PI; }
    // vệt sóng sau đuôi + bọt mũi tàu
    const wakeM = new THREE.MeshBasicMaterial({ color: '#ffffff', map: wakeTex, transparent: true, opacity: 0.6, depthWrite: false });
    const wakeGeo = new THREE.PlaneGeometry(60, 18); wakeGeo.translate(-52, 0, 0);
    const wake = mesh(wakeGeo, wakeM, s, 0, -0.44, 0); wake.rotation.x = -Math.PI / 2;
    const bowM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
    const bow = mesh(new THREE.RingGeometry(3.5, 5, 24, 1, -1.2, 2.4), bowM, s, 26, -0.43, 0); bow.rotation.x = -Math.PI / 2;
    s.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; } });
    s.scale.setScalar(0.62);
    return { s, wakeM, top };
  };
  const SHIPS = [
    { hull: '#f6f6f3', accent: '#1e6fd9', name: 'OCEAN UX', rx: 180, rz: 135, sp: 0.022, a: 0.4 },
    { hull: '#f6f6f3', accent: '#ff5a1f', name: 'PIXEL QUEEN', rx: 212, rz: 160, sp: -0.017, a: 2.6 },
    { hull: '#16324a', accent: '#e9b949', name: 'FIGMA STAR', rx: 242, rz: 182, sp: 0.026, a: 4.4 },
  ];
  for (const d of SHIPS) ships.push({ ...d, ...makeShip(d.hull, d.accent, d.name) });

  const tmp = new THREE.Vector3();
  let last = null;
  const tick = (t, night = 0) => {
    const dt = last === null ? 0 : Math.max(0, Math.min(0.1, t - last)); last = t;
    // hải âu: lượn vòng, vỗ cánh rồi lướt
    for (const b of gulls) {
      b.a += b.sp * dt;
      const wob = Math.sin(t * 0.4 + b.ph);
      b.g.position.set(b.hub[0] + Math.cos(b.a) * (b.r + wob * 4), b.h + Math.sin(t * 0.7 + b.ph) * 2, b.hub[1] + Math.sin(b.a) * (b.r + wob * 4));
      b.g.rotation.set(0, -b.a + (b.sp > 0 ? 0 : Math.PI), b.sp > 0 ? 0.35 : -0.35);
      const glide = Math.sin(t * 0.5 + b.ph) > 0.3;
      const ang = glide ? 0.12 + Math.sin(t * 1.5 + b.ph) * 0.05 : Math.sin(t * b.flap + b.ph) * 0.65;
      b.wings[0].rotation.z = ang; b.wings[1].rotation.z = ang;
    }
    // máy bay: mỗi FLIGHT.period giây bay ngang một lần
    const n = Math.floor(t / FLIGHT.period), k = (t % FLIGHT.period) / FLIGHT.dur;
    if (n !== route) { route = n; newRoute(n); }
    plane.visible = k < 1;
    if (plane.visible) {
      plane.position.lerpVectors(from, to, k);
      const len = Math.min(140, k * FLIGHT.len);
      for (const tr of trails) { tr.m.scale.set(1, len, 1); tr.m.position.set(tr.x, -1, -6 - len / 2); }
      trailM.opacity = 0.5 * (1 - night * 0.7);
      strobe.opacity = (t % 1.2) < 0.08 ? 1 : 0;
    }
    // tàu du lịch chạy vòng elip ngoài khơi
    for (const sh of ships) {
      sh.a += sh.sp * dt;
      const x = CENTER.x + Math.cos(sh.a) * sh.rx, z = CENTER.z + Math.sin(sh.a) * sh.rz;
      tmp.set(-Math.sin(sh.a) * sh.rx * Math.sign(sh.sp), 0, Math.cos(sh.a) * sh.rz * Math.sign(sh.sp));
      sh.s.position.set(x, -0.2 + Math.sin(t * 0.8 + sh.a * 10) * 0.08, z);
      sh.s.rotation.set(Math.sin(t * 0.6 + sh.rx) * 0.012, Math.atan2(-tmp.z, tmp.x), Math.sin(t * 0.5) * 0.01);
      sh.wakeM.opacity = 0.55 + 0.1 * Math.sin(t * 1.3 + sh.rx);
      sh.top.visible = night < 0.3 || (t % 1.5) < 0.75;
    }
    for (const m of nightMats) m.emissiveIntensity = night * 1.4;
  };
  return { root, tick };
}
