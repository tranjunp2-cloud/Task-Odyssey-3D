// Đồ nội thất, phòng ban, bot AI, siêu xe và "thẻ file" cho bản đồ Design Trip.
import * as THREE from 'three';

export const CL = 1.6, CH = 0.2, CW = 1.1;          // thẻ file (cargo): dài, dày, rộng
export const TRAILER_TOP = 1.42;                      // đáy thẻ file khi nổi trên nóc siêu xe

const seeded = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tx = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const rr = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
const STK = ['#ffd84d', '#ff9f7a', '#9fe0c0', '#a9c8ff', '#f7b8d8'];

// ---------- shared materials ----------
export const PM = {
  white: new THREE.MeshStandardMaterial({ color: '#f6f4ef', roughness: .55 }),
  wall: new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: .8 }),
  floor: new THREE.MeshStandardMaterial({ color: '#e9dfcc', roughness: .7 }),
  wood: new THREE.MeshStandardMaterial({ color: '#c79b6d', roughness: .6 }),
  darkWood: new THREE.MeshStandardMaterial({ color: '#5a3d2b', roughness: .5 }),
  dark: new THREE.MeshStandardMaterial({ color: '#1d2329', roughness: .45, metalness: .3 }),
  metal: new THREE.MeshStandardMaterial({ color: '#b9c0c6', roughness: .3, metalness: .7 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#cfeaf7', roughness: .05, metalness: 0, transparent: true, opacity: .22, depthWrite: false }),
  pot: new THREE.MeshStandardMaterial({ color: '#d8734c', roughness: .8 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#4f8a55', roughness: .8 }),
  leaf2: new THREE.MeshStandardMaterial({ color: '#77ab63', roughness: .8 }),
  skin: new THREE.MeshStandardMaterial({ color: '#f1c7a5', roughness: .7 }),
  botWhite: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .25, clearcoat: 1, clearcoatRoughness: .1 }),
  visor: new THREE.MeshStandardMaterial({ color: '#0b1520', roughness: .15, metalness: .6 }),
  botEye: new THREE.MeshBasicMaterial({ color: '#5ff3ff' }),
  botRing: new THREE.MeshBasicMaterial({ color: '#5ff3ff', transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }),
  strip: new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#fff1cc', emissiveIntensity: .3 }),
};
const matCache = {};
export const colorMat = (c, o = {}) => matCache[c + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: .55, ...o });
export const screens = [];
export const roomLights = [];   // one warm light per room, lit at night   // screen materials (glow, stronger at night)
const screenMat = t => { const m = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff', emissiveMap: t, emissiveIntensity: .9, map: t, roughness: .3 }); screens.push(m); return m; };

const B = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
const C = (rt, rb, h, m, x, y, z, p, seg = 18) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); p.add(o); return o; };
const Pl = (w, h, m, x, y, z, p, ry = 0) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; p.add(o); return o; };

// ---------- textures ----------
const texCache = {};
export function screenTex(kind, s = 0) {
  const k = kind + s; if (texCache[k]) return texCache[k];
  const [c, x] = cv(256, 160), r = i => seeded(s * 17 + i);
  x.fillStyle = kind === 'code' ? '#14181f' : '#1b2430'; x.fillRect(0, 0, 256, 160);
  if (kind === 'code') {
    const cols = ['#ff7ab6', '#7fdcff', '#ffd27a', '#9ff0a6', '#c9b6ff'];
    for (let l = 0; l < 13; l++) { let X = 12 + (r(l) * 3 | 0) * 14; for (let k2 = 0; k2 < 3; k2++) { const w = 18 + r(l * 5 + k2) * 50; x.fillStyle = cols[(l + k2) % 5]; x.fillRect(X, 10 + l * 11, w, 5); X += w + 6; if (X > 230) break; } }
  } else if (kind === 'chart') {
    x.fillStyle = '#26323f'; x.fillRect(10, 10, 236, 140);
    for (let i = 0; i < 9; i++) { const h = 20 + r(i) * 90; x.fillStyle = i % 3 ? '#5ff3ff' : '#ff7a3d'; x.fillRect(22 + i * 25, 140 - h, 15, h); }
  } else if (kind === 'figma') {
    x.fillStyle = '#2c2c2c'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#1e1e1e'; x.fillRect(0, 0, 40, 160); x.fillRect(216, 0, 40, 160);
    for (let i = 0; i < 3; i++) { x.fillStyle = '#f5f3ee'; rr(x, 50 + i * 55, 22, 46, 100, 4); x.fill(); x.fillStyle = ['#ff5a1f', '#5ff3ff', '#a259ff'][i]; x.fillRect(55 + i * 55, 30, 36, 18); x.fillStyle = '#c9c9c9'; for (let l = 0; l < 4; l++) x.fillRect(55 + i * 55, 56 + l * 12, 30 - l * 4, 5); }
    for (let l = 0; l < 8; l++) { x.fillStyle = '#4a4a4a'; x.fillRect(6, 12 + l * 16, 26, 6); x.fillRect(222, 12 + l * 16, 26, 6); }
  } else {   // ui
    x.fillStyle = '#f5f3ee'; x.fillRect(8, 8, 240, 144); x.fillStyle = '#0b1a24'; x.fillRect(8, 8, 240, 18);
    x.fillStyle = ['#ff5a1f', '#1f6f8b', '#7b5cff'][s % 3]; x.fillRect(18, 38, 110, 64);
    x.fillStyle = '#9aa3a8'; for (let l = 0; l < 4; l++) x.fillRect(140, 40 + l * 16, 90 - r(l) * 40, 7);
    x.fillStyle = '#d8e6ee'; for (let i = 0; i < 3; i++) x.fillRect(18 + i * 78, 112, 68, 30);
  }
  return (texCache[k] = tx(c));
}
export function wallTex(kind) {
  if (texCache['w' + kind]) return texCache['w' + kind];
  const [c, x] = cv(512, 288);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 512, 288); x.strokeStyle = '#cfd4d8'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 278);
  const head = (t, X, Y) => { x.fillStyle = '#0b1a24'; x.font = '800 22px Montserrat'; x.fillText(t, X, Y); };
  if (kind === 'kanban') {
    ['TODO', 'DOING', 'DONE'].forEach((t, i) => { const X = 22 + i * 164; x.fillStyle = '#eef1f3'; x.fillRect(X, 20, 150, 250); head(t, X + 10, 46);
      const n = [4, 2, 3][i]; for (let k = 0; k < n; k++) { x.fillStyle = STK[(i * 2 + k) % 5]; x.fillRect(X + 12, 60 + k * 50, 126, 40); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(X + 20, 72 + k * 50, 80, 5); x.fillRect(X + 20, 84 + k * 50, 55, 5); } });
  } else if (kind === 'mood') {
    head('MOODBOARD', 22, 40);
    const pal = ['#ff5a1f', '#0e3b5c', '#e9b949', '#7b5cff', '#2bd47d', '#e86a92', '#1f6f8b', '#c9b6ff'];
    for (let i = 0; i < 8; i++) { const X = 22 + (i % 4) * 120, Y = 56 + Math.floor(i / 4) * 110; x.fillStyle = pal[i]; x.fillRect(X, Y, 108, 98); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(X + 40 + seeded(i) * 30, Y + 50, 18 + seeded(i + 3) * 14, 0, 7); x.fill(); }
  } else if (kind === 'sticky') {
    head('VẤN ĐỀ · MỤC TIÊU · TIÊU CHÍ', 22, 40);
    for (let i = 0; i < 15; i++) { const X = 22 + (i % 5) * 96, Y = 58 + Math.floor(i / 5) * 72; x.save(); x.translate(X + 40, Y + 30); x.rotate((seeded(i) - .5) * .12); x.fillStyle = STK[i % 5]; x.fillRect(-40, -30, 82, 62); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-30, -14, 56, 5); x.fillRect(-30, -2, 40, 5); x.restore(); }
  } else if (kind === 'palette') {
    head('DESIGN SYSTEM', 22, 40);
    const pal = ['#0b1a24', '#ff5a1f', '#ffb48f', '#1f6f8b', '#9fd0e6', '#f4f2ee', '#2bd47d', '#e9b949'];
    pal.forEach((p, i) => { x.fillStyle = p; rr(x, 22 + i * 60, 58, 50, 50, 10); x.fill(); x.strokeStyle = '#d9d9d9'; x.lineWidth = 2; x.stroke(); });
    x.fillStyle = '#0b1a24'; x.font = '900 54px Montserrat'; x.fillText('Aa', 24, 180); x.font = '600 20px "JetBrains Mono"'; x.fillText('H1 · H2 · Body · Caption', 120, 170);
    for (let i = 0; i < 4; i++) { x.fillStyle = i ? '#eef1f3' : '#ff5a1f'; rr(x, 24 + i * 120, 210, 104, 44, 22); x.fill(); }
  } else if (kind === 'check') {
    head('CHECKLIST BÀN GIAO', 22, 40);
    ['Spec + khoảng cách', 'Hover · lỗi · rỗng', 'Prototype', 'Asset đã xuất', 'Đặt tên layer'].forEach((t, i) => { const Y = 70 + i * 42; x.fillStyle = '#2bd47d'; rr(x, 24, Y - 22, 28, 28, 6); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.moveTo(30, Y - 8); x.lineTo(37, Y); x.lineTo(47, Y - 16); x.stroke(); x.fillStyle = '#0b1a24'; x.font = '600 22px Montserrat'; x.fillText(t, 66, Y); });
  } else if (kind === 'wire') {
    x.fillStyle = '#f4f2ee'; x.fillRect(10, 10, 492, 268); x.strokeStyle = '#8b949a'; x.lineWidth = 4;
    x.strokeRect(30, 30, 452, 34); x.strokeRect(30, 80, 270, 170); x.beginPath(); x.moveTo(30, 80); x.lineTo(300, 250); x.moveTo(300, 80); x.lineTo(30, 250); x.stroke();
    x.fillStyle = '#8b949a'; for (let l = 0; l < 5; l++) x.fillRect(320, 92 + l * 26, 150 - l * 18, 10); x.fillStyle = '#ff5a1f'; x.fillRect(320, 220, 110, 30);
  } else if (kind === 'goals') {
    head('OKR · TIÊU CHÍ DUYỆT', 22, 40);
    ['Rõ mục tiêu', 'Đúng tiêu chí', 'Code được', 'Đo được'].forEach((t, i) => { const Y = 80 + i * 50; x.fillStyle = '#0b1a24'; x.font = '600 22px Montserrat'; x.fillText(t, 24, Y); x.fillStyle = '#eef1f3'; x.fillRect(220, Y - 18, 260, 20); x.fillStyle = ['#2bd47d', '#ff5a1f', '#1f6f8b', '#e9b949'][i]; x.fillRect(220, Y - 18, 120 + seeded(i) * 140, 20); });
  } else if (kind === 'qc') {
    head('TEST CASE · BẢN BUILD', 22, 40);
    [['PASS', '#2bd47d', 7], ['FAIL', '#ff5a1f', 2], ['ĐANG TEST', '#e9b949', 3]].forEach(([t, c, n], i) => { const X = 22 + i * 164; x.fillStyle = '#eef1f3'; x.fillRect(X, 56, 150, 214); x.fillStyle = c; x.fillRect(X, 56, 150, 30); x.fillStyle = '#fff'; x.font = '800 18px Montserrat'; x.fillText(t, X + 10, 78);
      for (let k = 0; k < n; k++) { x.fillStyle = c; x.globalAlpha = .35; x.fillRect(X + 10, 96 + k * 24, 130, 16); x.globalAlpha = 1; } });
  } else if (kind === 'persona') {
    head('USER TEST · 5 NGƯỜI', 22, 40);
    for (let i = 0; i < 5; i++) { const X = 30 + i * 94; x.fillStyle = STK[i]; x.beginPath(); x.arc(X + 36, 100, 32, 0, 7); x.fill(); x.fillStyle = '#0b1a24'; x.fillRect(X + 6, 150, 60, 7); x.fillStyle = i < 3 ? '#2bd47d' : '#ff5a1f'; x.fillRect(X + 6, 170, 30 + seeded(i) * 30, 9); }
    x.fillStyle = '#0b1a24'; x.font = '600 20px "JetBrains Mono"'; x.fillText('3/5 hoàn thành task', 30, 250);
  }
  return (texCache['w' + kind] = tx(c));
}
function holoTex(text) {
  const [c, x] = cv(256, 160);
  x.strokeStyle = 'rgba(95,243,255,.9)'; x.lineWidth = 4; x.strokeRect(4, 4, 248, 152);
  x.fillStyle = 'rgba(95,243,255,.16)'; x.fillRect(4, 4, 248, 152);
  x.fillStyle = '#bffbff'; x.font = '700 22px "JetBrains Mono"'; x.fillText('AI ▸', 16, 36);
  x.font = '600 19px Montserrat'; const words = text.split(' '); let line = '', Y = 70;
  for (const w of words) { if (x.measureText(line + w).width > 220) { x.fillText(line, 16, Y); line = ''; Y += 26; } line += w + ' '; } x.fillText(line, 16, Y);
  x.fillStyle = 'rgba(95,243,255,.7)'; for (let i = 0; i < 3; i++) x.fillRect(16, 128 + i * 0, 40 + i * 60, 6);
  return tx(c);
}

// ---------- furniture ----------
export function chair(p, x, z, ry = 0, color = '#0b1a24') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  const m = colorMat(color);
  B(.5, .09, .5, m, 0, .48, 0, g); B(.5, .55, .08, m, 0, .8, -.24, g); C(.03, .03, .4, PM.metal, 0, .25, 0, g, 8); B(.5, .04, .08, PM.dark, 0, .04, 0, g); B(.08, .04, .5, PM.dark, 0, .04, 0, g);
  return g;
}
// desk: worker sits on local -z, monitors face -z
export function desk(p, x, z, ry = 0, { w = 1.5, mon = 1, screen = 'ui', s = 0, chairColor, top = PM.white, lamp = false, tablet = false } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  B(w, .06, .76, top, 0, .75, 0, g); for (const sx of [-1, 1]) B(.05, .72, .7, PM.dark, sx * (w / 2 - .06), .36, 0, g);
  const sm = screenMat(screenTex(screen, s));
  for (let i = 0; i < mon; i++) { const mx = mon === 1 ? 0 : (i - .5) * .9;
    B(.06, .28, .06, PM.dark, mx, .92, .22, g); B(.86, .52, .04, PM.dark, mx, 1.3, .24, g);
    Pl(.8, .46, sm, mx, 1.3, .218, g, Math.PI); }
  B(.48, .02, .15, PM.dark, 0, .79, -.12, g);
  if (tablet) { B(.36, .02, .26, PM.dark, w / 2 - .32, .79, -.08, g); B(.012, .012, .2, PM.white, w / 2 - .25, .81, -.08, g); }
  if (lamp) { C(.08, .1, .03, PM.dark, -w / 2 + .2, .79, .15, g, 10); B(.02, .36, .02, PM.dark, -w / 2 + .2, .97, .15, g); C(.04, .1, .1, colorMat('#ff5a1f'), -w / 2 + .2, 1.15, .1, g, 10); }
  C(.05, .045, .1, PM.white, w / 2 - .14, .83, .1, g, 10);   // cốc cà phê
  if (chairColor) chair(g, 0, -.72, 0, chairColor);
  return g;
}
export function plant(p, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); p.add(g);
  C(.2, .16, .38, PM.pot, 0, .19, 0, g, 12);
  const ico = new THREE.IcosahedronGeometry(.32, 0);
  [[0, .7, 0, 1], [.15, .95, .08, .7], [-.13, .9, -.1, .75]].forEach(([a, b, c2, k], i) => { const m = new THREE.Mesh(ico, i % 2 ? PM.leaf2 : PM.leaf); m.position.set(a, b, c2); m.scale.setScalar(k); g.add(m); });
  return g;
}
export function tallPlant(p, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g);
  C(.24, .2, .5, PM.white, 0, .25, 0, g, 14); C(.03, .03, .8, colorMat('#6d5640'), 0, .9, 0, g, 6);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), i % 2 ? PM.leaf : PM.leaf2); const a = i * 1.05; l.scale.set(1.4, .35, .7); l.position.set(Math.cos(a) * .25, 1.2 + (i % 3) * .18, Math.sin(a) * .25); l.rotation.y = -a; g.add(l); }
  return g;
}
export function wallBoard(p, kind, x, y, z, w, ry = 0) { const m = Pl(w, w * 288 / 512, new THREE.MeshStandardMaterial({ map: wallTex(kind), roughness: .7 }), x, y, z, p, ry); return m; }
export function bookshelf(p, x, z, ry = 0, w = 2) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  B(w, 2, .4, PM.darkWood, 0, 1, 0, g);
  const [c, cx] = cv(256, 256); cx.fillStyle = '#3e2a1e'; cx.fillRect(0, 0, 256, 256);
  const pal = ['#ff5a1f', '#0e3b5c', '#e9e2d0', '#1f6f8b', '#b5452d', '#e9b949', '#2bd47d', '#7b5cff'];
  for (let row = 0; row < 4; row++) { let X = 8; while (X < 244) { const bw = 8 + seeded(X + row * 77) * 12, bh = 38 + seeded(X * 3 + row) * 20; cx.fillStyle = pal[Math.floor(seeded(X + row * 9) * 8)]; cx.fillRect(X, row * 64 + 62 - bh, bw - 2, bh); X += bw; } cx.fillStyle = '#5a3d2b'; cx.fillRect(0, row * 64 + 60, 256, 6); }
  Pl(w - .1, 1.9, new THREE.MeshStandardMaterial({ map: tx(c), roughness: .8 }), 0, 1, -.205, g, Math.PI);
  return g;
}
export function sofa(p, x, z, ry = 0, color = '#1f6f8b') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g); const m = colorMat(color);
  B(1.8, .4, .8, m, 0, .3, 0, g); B(1.8, .5, .22, m, 0, .65, .3, g); for (const sx of [-1, 1]) B(.2, .5, .8, m, sx * .9, .45, 0, g);
  B(.5, .14, .5, colorMat('#f4f2ee'), -.4, .55, .05, g);
  return g;
}
export function roundTable(p, x, z, r = .7, chairs = 4, chairColor = '#ff5a1f') {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g);
  C(r, r, .06, PM.white, 0, .75, 0, g, 28); C(.06, .06, .72, PM.dark, 0, .37, 0, g, 8); C(.35, .35, .03, PM.dark, 0, .02, 0, g, 16);
  for (let i = 0; i < chairs; i++) { const a = i / chairs * Math.PI * 2 + .4; chair(g, Math.cos(a) * (r + .45), Math.sin(a) * (r + .45), -a - Math.PI / 2, chairColor); }
  return g;
}
export function bigScreen(p, x, z, ry = 0, kind = 'figma', w = 2.4) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  for (const sx of [-1, 1]) B(.06, 1.5, .06, PM.dark, sx * w * .4, .75, 0, g);
  B(w, w * .6, .08, PM.dark, 0, 1.75, 0, g);
  Pl(w - .12, w * .6 - .12, screenMat(screenTex(kind, 7)), 0, 1.75, -.045, g, Math.PI);
  return g;
}
export function phoneStand(p, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  B(.6, .06, .5, PM.white, 0, .75, 0, g); C(.04, .04, .72, PM.dark, 0, .37, 0, g, 8);
  const ph = B(.16, .3, .02, PM.dark, 0, .95, .05, g); ph.rotation.x = -.35;
  const s = Pl(.14, .27, screenMat(screenTex('ui', 3)), 0, .95, .038, g, Math.PI); s.rotation.x = .35; s.rotation.y = Math.PI;
  return g;
}
export function tripod(p, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  for (let i = 0; i < 3; i++) { const l = C(.015, .015, 1.4, PM.dark, Math.cos(i * 2.1) * .22, .66, Math.sin(i * 2.1) * .22, g, 6); l.rotation.set(Math.sin(i * 2.1) * .3, 0, -Math.cos(i * 2.1) * .3); }
  B(.3, .2, .18, PM.dark, 0, 1.42, 0, g); C(.06, .06, .12, PM.visor, 0, 1.42, -.14, g, 12).rotation.x = Math.PI / 2;
  return g;
}
export function boxes(p, x, z, colors = ['#e9b949', '#ff5a1f', '#1f6f8b']) {
  colors.forEach((c, i) => { const b = B(.5, .4, .5, colorMat(c), x + (i % 2) * .15, .2 + i * .4, z + (i % 2 ? .08 : 0), p); b.rotation.y = seeded(i + x) * .5; });
}
export function coffeeBar(p, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  B(1.4, .9, .55, PM.wood, 0, .45, 0, g); B(1.44, .05, .6, PM.white, 0, .92, 0, g);
  B(.34, .42, .32, PM.dark, -.35, 1.15, 0, g); C(.05, .045, .1, PM.white, .1, .99, 0, g, 10); C(.05, .045, .1, colorMat('#ff5a1f'), .3, .99, .1, g, 10);
  return g;
}

// ---------- the room shell (cutaway: two walls, low glass on the road sides) ----------
// local frame: back wall at +z, road side at -z. back = +1 keeps the frame, -1 turns the room around.
export function room(parent, { x, z, w, d, back = 1, accent = '#ff5a1f', board }) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = back > 0 ? 0 : Math.PI; parent.add(g);
  const am = colorMat(accent);
  B(w + .5, .14, d + .5, am, 0, .07, 0, g);
  B(w, .22, d, PM.floor, 0, .11, 0, g).receiveShadow = true;
  const rug = Pl(w * .55, d * .45, colorMat(accent, { roughness: 1, transparent: true, opacity: .22 }), 0, .225, -.2, g); rug.rotation.x = -Math.PI / 2;
  const H = 2.5, y0 = .22;
  B(w, H, .18, PM.wall, 0, y0 + H / 2, d / 2 - .09, g); B(.18, H, d, PM.wall, -w / 2 + .09, y0 + H / 2, 0, g);
  B(w + .02, .16, .22, am, 0, y0 + H + .08, d / 2 - .09, g); B(.22, .16, d + .02, am, -w / 2 + .09, y0 + H + .08, 0, g);
  B(w - .6, .05, .05, PM.strip, 0, y0 + H - .25, d / 2 - .2, g); B(.05, .05, d - .6, PM.strip, -w / 2 + .2, y0 + H - .25, 0, g);
  // ceiling lamp: off by day, warm light at night (main.js drives the intensity)
  { const l = new THREE.PointLight('#ffd9a8', 0, Math.max(w, d) * 1.5, 1.4); l.position.set(0, y0 + 2.1, -.3); g.add(l); roomLights.push(l);
    const pend = new THREE.Mesh(new THREE.CylinderGeometry(.06, .4, .22, 16, 1, true), colorMat('#1d2329', { side: THREE.DoubleSide })); pend.position.set(0, y0 + 2.3, -.3); g.add(pend);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), PM.strip); bulb.position.set(0, y0 + 2.17, -.3); g.add(bulb); }
  // low glass: right side + front with a door gap
  const glass = (gw, gx, gz, alongX) => { B(alongX ? gw : .05, 1.1, alongX ? .05 : gw, PM.glass, gx, y0 + .55, gz, g); B(alongX ? gw : .07, .05, alongX ? .07 : gw, PM.dark, gx, y0 + 1.12, gz, g); };
  glass(d, w / 2, 0, false);
  const seg = (w - 1.6) / 2; glass(seg, -w / 2 + seg / 2, -d / 2, true); glass(seg, w / 2 - seg / 2, -d / 2, true);
  if (board) board(g, 0, y0 + H + .95, d / 2 - .09);
  const inside = new THREE.Group(); inside.position.y = y0; g.add(inside);
  return { g, in: inside, w, d, wallZ: d / 2 - .19, leftX: -w / 2 + .19 };
}

// ---------- AI assistant bot ----------
export const bots = [];
export function bot(p, x, z, label, holo, { y = 0, ry = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  const hover = new THREE.Group(); g.add(hover);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .22, 6, 14), PM.botWhite); body.position.y = .95; hover.add(body);
  const band = new THREE.Mesh(new THREE.TorusGeometry(.205, .025, 8, 24), PM.botEye); band.rotation.x = Math.PI / 2; band.position.y = .98; hover.add(band);
  const head = new THREE.Group(); head.position.y = 1.42; hover.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.26, 22, 16), PM.botWhite); skull.scale.set(1.15, .9, 1); head.add(skull);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.22, 22, 14, -Math.PI * .38, Math.PI * .76, Math.PI * .3, Math.PI * .4), PM.visor); visor.scale.set(1.18, .95, 1.05); visor.rotation.y = -Math.PI / 2; head.add(visor);   // visor faces local -z
  const eyes = [];
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.CapsuleGeometry(.025, .05, 4, 8), PM.botEye); e.position.set(sx * .08, .02, -.235); head.add(e); eyes.push(e); }
  for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .05, 14), colorMat('#ff5a1f')); ear.rotation.z = Math.PI / 2; ear.position.set(sx * .3, 0, 0); head.add(ear); }
  B(.015, .16, .015, PM.dark, 0, .3, 0, head); const tip = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), colorMat('#ff5a1f', { emissive: '#ff5a1f', emissiveIntensity: .8 })); tip.position.y = .4; head.add(tip);
  for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .18, 4, 8), PM.botWhite); arm.position.set(sx * .27, .92, -.04); arm.rotation.z = sx * .35; hover.add(arm); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.24, .03, 8, 28), PM.botRing); ring.rotation.x = Math.PI / 2; ring.position.y = .58; hover.add(ring);
  const glowM = new THREE.MeshBasicMaterial({ color: '#5ff3ff', transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.4, 24), glowM); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; g.add(shadow);
  let panel = null;
  if (holo) { const m = new THREE.MeshBasicMaterial({ map: holoTex(holo), transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    panel = new THREE.Mesh(new THREE.PlaneGeometry(.9, .56), m); panel.position.set(.62, 1.5, -.1); panel.rotation.y = -.35; hover.add(panel); }
  const b = { label, holo, group: g, hover, head, eyes, ring, panel, glowM, seed: bots.length * 1.7 };
  bots.push(b); return b;
}
export function tickBots(t) {
  for (const b of bots) {
    const s = b.seed;
    b.hover.position.y = .12 * Math.sin(t * 1.8 + s);
    b.head.rotation.y = .5 * Math.sin(t * .6 + s);
    b.head.rotation.x = .08 * Math.sin(t * 1.1 + s);
    const blink = ((t + s) % 3.7) < .12 ? .15 : 1; b.eyes.forEach(e => e.scale.y = blink);
    b.ring.scale.setScalar(1 + .12 * Math.sin(t * 4 + s)); b.ring.material.opacity = .55 + .3 * Math.sin(t * 4 + s);
    b.glowM.opacity = .18 + .1 * Math.sin(t * 1.8 + s);
    if (b.panel) b.panel.position.y = 1.5 + .05 * Math.sin(t * 1.3 + s);
  }
}

// ---------- the file card (cargo) ----------
const cardCache = {};
function cardMats(color, label) {
  const k = color + label; if (cardCache[k]) return cardCache[k];
  const [c, x] = cv(512, 352);
  x.fillStyle = color; x.fillRect(0, 0, 512, 352);
  x.fillStyle = 'rgba(255,255,255,.95)'; rr(x, 22, 60, 468, 270, 22); x.fill(); rr(x, 22, 30, 180, 60, 18); x.fill();
  x.fillStyle = color; x.beginPath(); x.arc(70, 130, 26, 0, 7); x.fill();
  x.fillStyle = '#0b1a24'; x.font = '800 40px "JetBrains Mono"'; x.fillText(label || 'FILE', 112, 145, 360);
  x.fillStyle = '#b8c0c5'; for (let i = 0; i < 3; i++) x.fillRect(48, 190 + i * 34, 380 - i * 90, 16);
  x.fillStyle = color; rr(x, 340, 262, 120, 44, 22); x.fill();
  const t = tx(c);
  const top = new THREE.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .25, roughness: .4 });
  const side = new THREE.MeshStandardMaterial({ color, roughness: .4, emissive: color, emissiveIntensity: .25 });
  return (cardCache[k] = [side, side, top, side, side, side]);
}
const liftM = new THREE.MeshBasicMaterial({ color: '#7ff6ff', transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
export function fileCard(color, label = '') {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(CL, CH, CW), cardMats(color, label)); slab.castShadow = true; g.add(slab);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.62, .3, .34, 20, 1, true), liftM); beam.position.y = -CH / 2 - .17; g.add(beam);
  return g;
}

// ---------- the supercar: a designer drives the file to every department ----------
export function makeCar(color, poolTex, headM, tailM, beamM, hair = '#2a1d16') {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: .28, metalness: .45, clearcoat: 1, clearcoatRoughness: .06 });
  const carbon = new THREE.MeshStandardMaterial({ color: '#15181c', roughness: .5, metalness: .4 });
  const prof = new THREE.Shape(), P = [[-2.0, .26], [2.1, .26], [2.3, .36], [2.24, .46], [1.45, .6], [.7, .68], [-.9, .72], [-1.7, .78], [-2.06, .76], [-2.08, .36]];
  prof.moveTo(...P[0]); P.slice(1).forEach(p => prof.lineTo(...p));
  const bg = new THREE.ExtrudeGeometry(prof, { depth: 1.46, bevelEnabled: true, bevelThickness: .1, bevelSize: .08, bevelSegments: 3, curveSegments: 2 }); bg.translate(0, 0, -.73);
  const body = new THREE.Mesh(bg, paint); g.add(body);
  const cp = new THREE.Shape(), Q = [[.85, .66], [.1, 1.0], [-.7, 1.02], [-1.55, .74]];
  cp.moveTo(...Q[0]); Q.slice(1).forEach(p => cp.lineTo(...p));
  const cg = new THREE.ExtrudeGeometry(cp, { depth: .96, bevelEnabled: true, bevelThickness: .12, bevelSize: .08, bevelSegments: 3, curveSegments: 2 }); cg.translate(0, 0, -.48);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#0d1a24', roughness: .04, metalness: .3, clearcoat: 1, transparent: true, opacity: .55 });
  g.add(new THREE.Mesh(cg, glass));
  // designer at the wheel (left seat)
  const drv = new THREE.Group(); drv.position.set(-.35, 0, -.24); g.add(drv);
  const sh = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .12, 4, 10), colorMat('#f4f2ee')); sh.position.y = .72; sh.scale.set(1, 1, 1.3); drv.add(sh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 14, 10), PM.skin); head.position.y = .97; drv.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * .55), colorMat(hair)); hairM.position.set(-.02, .99, 0); drv.add(hairM);
  const phones = new THREE.Mesh(new THREE.TorusGeometry(.145, .02, 6, 18, Math.PI), colorMat('#ff5a1f')); phones.position.y = .99; phones.rotation.y = Math.PI / 2; drv.add(phones);
  // details
  for (const sz of [-1, 1]) { B(.75, .17, .03, carbon, -.75, .47, sz * .82, g); B(1.9, .05, .03, carbon, .1, .3, sz * .82, g); }
  for (const sz of [-1, 1]) B(.06, .24, .06, carbon, -1.82, .9, sz * .5, g);
  B(.42, .05, 1.72, carbon, -1.86, 1.03, 0, g); for (const sz of [-1, 1]) B(.46, .16, .03, paint, -1.86, .98, sz * .86, g);
  B(.5, .06, 1.3, carbon, 2.12, .3, 0, g);                 // splitter
  for (const sz of [-1, 1]) { const h = B(.06, .045, .42, headM, 2.2, .47, sz * .5, g); h.rotation.y = sz * -.25; }
  B(.04, .055, 1.36, tailM, -2.12, .64, 0, g);
  const revM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0 });
  for (const sz of [-1, 1]) B(.04, .05, .14, revM, -2.12, .5, sz * .4, g);
  for (const sz of [-1, 1]) C(.05, .05, .08, PM.metal, -2.1, .34, sz * .18, g, 10).rotation.z = Math.PI / 2;
  // light pools
  beamM.map = poolTex; const beam = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.6), beamM); beam.rotation.x = -Math.PI / 2; beam.position.set(5.8, .05, 0); g.add(beam);
  const revPoolM = new THREE.MeshBasicMaterial({ map: poolTex, color: '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const revPool = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), revPoolM); revPool.rotation.x = -Math.PI / 2; revPool.position.set(-3.6, .05, 0); g.add(revPool);
  const underM = new THREE.MeshBasicMaterial({ map: poolTex, color, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false });
  const under = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), underM); under.rotation.x = -Math.PI / 2; under.position.y = .04; g.add(under);
  // wheels
  const wheels = [], tyreM = new THREE.MeshStandardMaterial({ color: '#121417', roughness: .85 }), rimM = new THREE.MeshStandardMaterial({ color: '#d4d9de', roughness: .25, metalness: .85 }), calM = colorMat('#ffcf3a');
  for (const x of [-1.32, 1.4]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .3, 22).rotateX(Math.PI / 2), tyreM); w.position.set(x, .34, sz * .74); g.add(w); wheels.push(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .31, 20).rotateX(Math.PI / 2), rimM); w.add(rim);
    for (let k = 0; k < 5; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.42, .05, .32), carbon); sp.rotation.z = k / 5 * Math.PI; w.add(sp); }
    B(.14, .1, .05, calM, x + .12, .44, sz * .6, g);
  }
  g.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
  return { g, wheels, revM, revPoolM, underM, drv };
}

// ---------- the designer on foot (gets out of the car and walks into the room) ----------
export function makeWalker(hair) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 4, 10), colorMat('#f4f2ee')); body.position.y = 0.78; g.add(body);
  const legs = [-1, 1].map(sx => { const pivot = new THREE.Group(); pivot.position.set(sx * 0.1, 0.5, 0); g.add(pivot);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 4, 8), colorMat('#1d2a38')); leg.position.y = -0.24; pivot.add(leg); return pivot; });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), PM.skin); head.position.y = 1.35; g.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.212, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), colorMat(hair)); hairM.position.set(0, 1.37, -0.02); g.add(hairM);
  const phones = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.03, 6, 18, Math.PI), colorMat('#ff5a1f')); phones.position.y = 1.37; g.add(phones);
  const cardM = new THREE.MeshStandardMaterial({ color: '#ff5a1f', emissive: '#ff5a1f', emissiveIntensity: 0.25, roughness: .4 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.05), cardM); card.position.set(0, 0.85, 0.26); card.rotation.x = -0.25; g.add(card);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.visible = false;
  return { g, legs, card, cardM };
}

// ---------- mini design agent: one per feature plot in the design studio ----------
export function miniAgent(color) {
  const g = new THREE.Group();
  const acc = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .45, roughness: .4 });
  const hover = new THREE.Group(); g.add(hover);
  const body = new THREE.Mesh(new THREE.SphereGeometry(.34, 22, 16), PM.botWhite); body.scale.set(1.05, .9, 1); hover.add(body);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.29, 22, 14, -Math.PI * .4, Math.PI * .8, Math.PI * .3, Math.PI * .38), PM.visor); visor.scale.set(1.18, .95, 1.1); visor.rotation.y = Math.PI / 2; hover.add(visor);   // faces +z
  const eyesM = new THREE.MeshBasicMaterial({ color: '#5ff3ff' });
  const eyes = [-1, 1].map(sx => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(.03, .06, 4, 8), eyesM); e.position.set(sx * .1, .02, .315); hover.add(e); return e; });
  const band = new THREE.Mesh(new THREE.TorusGeometry(.355, .03, 8, 28), acc); band.rotation.x = Math.PI / 2; band.position.y = -.08; hover.add(band);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .22, 6), PM.dark); ant.position.y = .4; hover.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), acc); tip.position.y = .53; hover.add(tip);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.42, .025, 6, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); halo.rotation.x = Math.PI / 2; halo.position.y = -.32; hover.add(halo);
  const pen = new THREE.Mesh(new THREE.ConeGeometry(.06, .3, 10), acc); pen.rotation.x = Math.PI; pen.position.y = -.42; hover.add(pen);
  for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.045, .14, 4, 8), PM.botWhite); arm.position.set(sx * .38, -.05, .02); arm.rotation.z = sx * .5; hover.add(arm); }
  g.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
  return { g, hover, eyes, eyesM, halo, acc };
}
