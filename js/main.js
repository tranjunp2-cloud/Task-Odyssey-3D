import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { STATIONS, FSTATUS } from './data.js';
import { buildWorld } from './world.js';
import { Sim, headM, tailM, beamM } from './sim.js';

await Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('600 20px "JetBrains Mono"')]).catch(() => {});
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp01 = v => Math.min(1, Math.max(0, v));
const eIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ---------- renderer / scene ----------
const app = $('#app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);
const labels = new CSS2DRenderer(); labels.domElement.className = 'labels'; app.appendChild(labels.domElement);

const scene = new THREE.Scene();
const DAY_BG = new THREE.Color('#9fc3d6'), NIGHT_BG = new THREE.Color('#0b1622');
scene.background = DAY_BG.clone(); scene.fog = new THREE.Fog(DAY_BG.clone(), 260, 520);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
const hemi = new THREE.HemisphereLight(0xfff6e8, 0x9fb38a, 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.7); scene.add(sun); scene.add(sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 1200);

const W = buildWorld(scene);

// ---------- labels ----------
const label = (html, cls, parent, y, onClick) => {
  const e = el(onClick ? 'button' : 'div', cls, html); if (onClick) e.addEventListener('click', ev => { ev.stopPropagation(); onClick(); });
  const o = new CSS2DObject(e); o.position.y = y; parent.add(o); return { el: e, obj: o };
};
const stLabels = {};
for (const s of STATIONS) {
  const st = W.stations[s.key], y = { task: 9, research: 7.5, define: 7, design: 7, techreview: 6.5, test: 8, review: 7.5, handoff: 13, dev: 9 }[s.key];
  const anchor = new THREE.Object3D(); anchor.position.copy(st.pos);
  if (s.key === 'design') anchor.position.addScaledVector(st.right, -4);
  if (s.key === 'handoff') anchor.position.addScaledVector(st.right, -4);
  if (s.key === 'define') anchor.position.addScaledVector(st.right, 9);
  if (s.key === 'techreview') anchor.position.addScaledVector(st.right, 10);
  scene.add(anchor);
  stLabels[s.key] = label(`<span class="n">${s.n}</span><b>${s.name}</b><em class="cnt"></em>${s.skipInReal ? '<i class="skip">bỏ qua</i>' : ''}`, 'st-label' + (s.skipInReal ? ' skippable' : ''), anchor, y, () => openStation(s.key));
}
const plotLabels = W.plots.map(p => { const a = new THREE.Object3D(); a.position.copy(p.pos); scene.add(a); return label(`<b>${p.id}</b> ${p.name} <i class="dot gray"></i>`, 'f-label', a, 1.2); });
W.people.filter(p => p.label).forEach(p => label(p.label, 'p-label', p.group, 2.1));
W.bots.forEach(b => label(`<i>AI</i>${b.label.replace(/^AI /, '')}`, 'b-label', b.hover, 2.15));
const devPopAnchor = new THREE.Object3D(); W.anim.handoff.isle.add(devPopAnchor); devPopAnchor.position.set(0, 9, 0);

// ---------- simulation ----------
const feed = $('#feed');
const sim = new Sim(W, scene, {
  event(text, kind) { const li = el('li', kind, text); feed.prepend(li); while (feed.children.length > 6) feed.lastChild.remove(); },
  stamp(tr, ok, text) { const l = label(text || (ok ? 'DUYỆT ✔' : 'SỬA LẠI ✗'), `stamp ${ok ? 'ok' : 'no'}`, tr.g, 4.2); setTimeout(() => l.obj.removeFromParent(), 1700); },
  devPop(text) { const l = label(text, 'devpop', devPopAnchor, 0); setTimeout(() => l.obj.removeFromParent(), 2600); },
});
const chips = sim.trucks.map(tr => {
  const l = label('', 'chip', tr.g, 3.0, () => follow(tr)); l.el.innerHTML = '<i class="dot"></i><b></b><span></span>';
  return { tr, ...l, dot: l.el.querySelector('i'), id: l.el.querySelector('b'), txt: l.el.querySelector('span'), last: '' };
});

// ---------- camera: overview map ↔ detail ↔ follow ----------
const controls = new MapControls(camera, labels.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.screenSpacePanning = false;
controls.maxPolarAngle = 1.25; controls.minPolarAngle = 0.35;
const OVERVIEW_WIDE = { target: new THREE.Vector3(10, 0, 22), dist: 240, polar: 0.9, az: -0.42 };
const OVERVIEW_TALL = { target: new THREE.Vector3(12, 0, 24), dist: 320, polar: 0.8, az: -0.42 + Math.PI / 2 };
const overview = () => (innerWidth / innerHeight < 0.8 ? OVERVIEW_TALL : OVERVIEW_WIDE);
let mode = 'overview', current = null, followed = null, fly = null;
const sph = (target, dist, polar, az) => new THREE.Vector3(Math.sin(polar) * Math.sin(az), Math.cos(polar), Math.sin(polar) * Math.cos(az)).multiplyScalar(dist).add(target);
function flyTo(target, dist, polar, az, dur = 1.3) {
  const off = camera.position.clone().sub(controls.target), curAz = Math.atan2(off.x, off.z);
  if (az === undefined) az = curAz; while (az - curAz > Math.PI) az -= Math.PI * 2; while (az - curAz < -Math.PI) az += Math.PI * 2;
  fly = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), t1: target.clone(),
    d0: off.length(), d1: dist, pol0: Math.acos(off.y / off.length()), pol1: polar, az0: curAz, az1: az };
}
{ const o = overview(); camera.position.copy(sph(o.target, o.dist, o.polar, o.az)); controls.target.copy(o.target); }

const panel = $('#panel'), body = document.body;
function setMode(m) { mode = m; body.dataset.mode = m; controls.minDistance = m === 'overview' ? 70 : 10; controls.maxDistance = m === 'overview' ? 440 : 90; }
setMode('overview');

function goOverview() {
  followed = null; current = null; setMode('overview'); panel.classList.remove('open');
  const o = overview(); flyTo(o.target, o.dist, o.polar, o.az); renderSteps();
}
function stationFocus(key) {
  const st = W.stations[key];
  if (key === 'dev' || !W.rooms[key]) { const dir = st.right.clone().addScaledVector(st.tan, -0.45).normalize(); return { p: st.pos.clone(), az: Math.atan2(dir.x, dir.z), dist: 40 }; }
  // look at the department from the road side: lot + open front of the room in frame
  const c = new THREE.Vector3(); W.rooms[key].g.getWorldPosition(c);
  const p = st.pos.clone().lerp(c, 0.55), toRoad = st.pos.clone().sub(c).setY(0).normalize();
  const dir = toRoad.addScaledVector(st.tan, -0.5).normalize();
  return { p, az: Math.atan2(dir.x, dir.z), dist: { design: 50, task: 50, research: 48, handoff: 52 }[key] || 42 };
}
function openStation(key) {
  followed = null; current = key; setMode('detail');
  const f = stationFocus(key); flyTo(f.p, f.dist, 0.98, f.az);
  renderPanel(); panel.classList.add('open'); renderSteps();
}
function follow(tr) {
  followed = tr; current = null; setMode('follow');
  const off = camera.position.clone().sub(controls.target);
  flyTo(tr.g.position, 30, 1.0, Math.atan2(off.x, off.z));
  renderPanel(); panel.classList.add('open'); renderSteps();
}

// ---------- panel ----------
const fmt = s => { const m = Math.floor(s / 60), x = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
function renderPanel() {
  if (mode === 'detail' && current) {
    const s = W.stations[current], idx = STATIONS.findIndex(x => x.key === current);
    const here = sim.at(current);
    let extra = '';
    const skipped = sim.flow === 'real' && s.skipInReal;
    if (current === 'task') { const lot = sim.at('lot'); extra = `<h4>Bãi chờ task <em>${sim.trucks.filter(t => t.mode === 'parked' && t.lot === 'task').length}/4</em></h4><ul class="tasks">${lot.length ? lot.map(tr => `<li><button data-truck="${tr.i}"><i class="dot gray"></i><b>Xe ${tr.i + 1}</b> ${tr.status}<span>${tr.mode === 'parked' ? 'chờ ' + Math.floor(sim.t - tr.parkedAt) + 's' : ''}</span></button></li>`).join('') : '<li class="muted">Bãi trống, xe nào cũng đang có task</li>'}</ul>`; }
    if (current === 'design') extra = `<h4>Bảng tính năng</h4><ul class="feats">${sim.features.map(f => `<li><i class="dot ${FSTATUS[f.status][1]}"></i><b>${f.id}</b> ${f.name}<span>${FSTATUS[f.status][0]}</span></li>`).join('')}</ul>`;
    if (current === 'dev' && sim.island.length) extra += `<h4>Trên đảo Dev <em>${sim.island.length}</em></h4><ul class="tasks">${sim.island.map(j => `<li><button><i class="dot yellow"></i><b>#${j.t.no}</b> ${j.f.name}<span>${j.phase === 'build' ? 'dev đang build' : 'design QA'}</span></button></li>`).join('')}</ul>`;
    if (current === 'dev' || current === 'handoff') extra += `<h4>Tàu DEV TEAM</h4><p class="muted">${{ docked: 'Đang cập cảng', out: 'Đang chạy ra đảo Dev', unload: 'Đang dỡ file ở đảo Dev', back: 'Đang quay về cảng' }[sim.ship.state]} · ${sim.ship.cargo.length} file trên tàu</p>`;
    panel.innerHTML = `
      <button class="x" data-act="close" aria-label="Đóng">×</button>
      <div class="kicker">Bước ${s.n} / 09</div><h2>${s.name}</h2><p>${s.desc}</p>
      ${skipped ? '<div class="warn">⚠ Đang ở quy trình thực tế: bước này bị bỏ qua, xe chạy thẳng qua.</div>' : ''}
      <div class="flows"><div class="${sim.flow === 'std' ? 'on' : ''}"><b>✅ Chuẩn</b>${s.std}</div><div class="${sim.flow === 'real' ? 'on' : ''}"><b>😭 Thực tế</b>${s.real}</div></div>
      ${current === 'dev' ? '' : `<h4>Task đang ở đây <em>${here.length}</em></h4>
      <ul class="tasks">${here.length ? here.map(tr => `<li><button data-truck="${tr.i}"><i class="dot ${sim.tone(tr)}"></i><b>#${tr.task.no}</b> ${tr.task.feature.name}<span>${tr.status}</span></button></li>`).join('') : '<li class="muted">Trống, chưa có xe nào</li>'}</ul>`}
      ${extra}
      <h4>Khó khăn thường gặp</h4><ul class="pains">${s.pains.map(p => `<li>${p}</li>`).join('')}</ul>
      <div class="tip"><b>Mẹo</b> ${s.tip}</div>
      <div class="nav"><button data-go="${STATIONS[(idx + 8) % 9].key}">← ${STATIONS[(idx + 8) % 9].short}</button><button data-act="map">Bản đồ</button><button data-go="${STATIONS[(idx + 1) % 9].key}">${STATIONS[(idx + 1) % 9].short} →</button></div>`;
  } else if (mode === 'follow' && followed) {
    const tr = followed, t = tr.task;
    panel.innerHTML = `
      <button class="x" data-act="close" aria-label="Đóng">×</button>
      <div class="kicker">Đang theo dõi xe</div>
      ${t ? `<h2>#${t.no} · ${t.feature.name}</h2>
        <div class="badges"><span><i class="dot ${sim.tone(tr)}"></i>${tr.status}</span><span>v${t.version}</span><span>Sếp trả về: ${t.rejects}</span>${t.feature.redo ? `<span>Dev trả về: ${t.feature.redo}</span>` : ''}</div>
        <h4>Hành trình</h4><ol class="hist">${t.history.slice().reverse().map(h => `<li><time>${fmt(h.t)}</time>${h.text}</li>`).join('')}</ol>`
      : `<h2>Xe trống</h2><p>${tr.status}. Về tới bến sẽ nhận task mới.</p>`}
      <div class="nav"><button data-act="map">Bản đồ</button></div>`;
  }
}
panel.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.truck) follow(sim.trucks[+b.dataset.truck]);
  else if (b.dataset.go) openStation(b.dataset.go);
  else if (b.dataset.act === 'map' || b.dataset.act === 'close') goOverview();
});

// ---------- step bar ----------
const steps = $('#steps');
steps.innerHTML = STATIONS.map(s => `<button data-key="${s.key}"${s.skipInReal ? ' class="skippable"' : ''}><span>${s.n}</span>${s.short}</button>`).join('');
steps.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openStation(b.dataset.key); });
function renderSteps() { steps.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.key === current)); }

// ---------- top controls ----------
let speed = 1, paused = false, nightT = 0, night = 0;
$('#btn-map').onclick = goOverview;
document.querySelectorAll('[data-flow]').forEach(b => b.onclick = () => { sim.setFlow(b.dataset.flow); body.classList.toggle('flow-real', sim.flow === 'real');
  document.querySelectorAll('[data-flow]').forEach(x => x.classList.toggle('on', x.dataset.flow === sim.flow)); renderPanel(); });
const cmp = $('#compare');
function renderCompare() {
  const row = (k, name) => { const m = sim.ms[k]; const lead = m.done ? Math.round(m.leadSum / m.done) + 's' : '—';
    return `<tr class="${sim.flow === k ? 'on' : ''}"><th>${name}</th><td>${lead}</td><td>${m.shipped ? (m.rejects / m.shipped).toFixed(1) : '—'}</td><td>${m.shipped ? Math.round(m.bounced / m.shipped * 100) + '%' : '—'}</td><td>${m.done}</td></tr>`; };
  cmp.innerHTML = `<h4>So sánh 2 quy trình <small>(mô phỏng)</small></h4><table><tr><th></th><th>TB 1 tính năng</th><th>Sếp trả / task</th><th>Dev trả</th><th>Xong</th></tr>${row('std', '✅ Chuẩn')}${row('real', '😭 Thực tế')}</table><p class="assume" title="Chuẩn: sếp trả 20% → 8% → 0%, 70% là góp ý nhỏ (sửa 3s, không test lại); review sớm góp ý 35% (sửa 3s); dev trả 3% nếu đã review sớm. Thực tế: sếp trả 55% → 35% → 12%, mỗi lần sửa 8–12s và test lại; dev trả 25%; task làm lại research lại từ đầu.">Giả định mô phỏng, không phải số liệu thật ⓘ</p>`;
}
$('#btn-pause').onclick = e => { paused = !paused; e.currentTarget.textContent = paused ? '▶' : '❚❚'; e.currentTarget.setAttribute('aria-label', paused ? 'Tiếp tục' : 'Tạm dừng'); };
document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { speed = +b.dataset.speed; document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('on', x === b)); });
$('#btn-night').onclick = e => { nightT = nightT ? 0 : 1; e.currentTarget.textContent = nightT ? '☀' : '🌙'; };
addEventListener('keydown', e => { if (e.key === 'Escape') goOverview(); if (e.key === ' ') { $('#btn-pause').click(); e.preventDefault(); } });

// ---------- click on 3D objects ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let downAt = null;
labels.domElement.addEventListener('pointerdown', e => downAt = [e.clientX, e.clientY]);
labels.domElement.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(sim.trucks.map(t => t.g), true)[0];
  if (hit) { let o = hit.object; while (o && !o.userData.truck) o = o.parent; if (o) return follow(o.userData.truck); }
  const groups = STATIONS.map(s => W.stations[s.key].group), h2 = ray.intersectObjects(groups, true)[0];
  if (h2) { let o = h2.object; while (o && !groups.includes(o)) o = o.parent; const k = STATIONS.find(s => W.stations[s.key].group === o)?.key; if (k) openStation(k); }
});

// ---------- minimap ----------
const mm = $('#minimap'), mx = mm.getContext('2d');
const MB = { x0: -82, x1: 98, z0: -68, z1: 100 };
const mmXY = (x, z) => [(x - MB.x0) / (MB.x1 - MB.x0) * mm.width, (z - MB.z0) / (MB.z1 - MB.z0) * mm.height];
function drawMinimap() {
  const w = mm.width, h = mm.height; mx.clearRect(0, 0, w, h);
  mx.fillStyle = '#0e3b5c'; mx.fillRect(0, 0, w, h);
  mx.fillStyle = '#d6d9c3'; mx.beginPath(); W.islandPoly.forEach(([x, z], i) => { const [a, b] = mmXY(x, z); i ? mx.lineTo(a, b) : mx.moveTo(a, b); }); mx.fill();
  const [ix, iz] = mmXY(W.devIsland.x, W.devIsland.z); mx.beginPath(); mx.arc(ix, iz, 9 / (MB.x1 - MB.x0) * w, 0, 7); mx.fill();
  mx.strokeStyle = '#8f877a'; mx.lineWidth = 3; mx.beginPath(); W.roadPts.forEach((p, i) => { const [a, b] = mmXY(p.x, p.z); i ? mx.lineTo(a, b) : mx.moveTo(a, b); }); mx.stroke();
  for (const s of STATIONS) { const [a, b] = mmXY(W.stations[s.key].pos.x, W.stations[s.key].pos.z); mx.fillStyle = s.key === current ? '#ff5a1f' : '#0b1a24'; mx.beginPath(); mx.arc(a, b, 7, 0, 7); mx.fill(); mx.fillStyle = '#fff'; mx.font = '700 8px JetBrains Mono'; mx.textAlign = 'center'; mx.fillText(s.n, a, b + 3); }
  const TONE = { red: '#ff4d3d', yellow: '#f5c518', green: '#2bd47d', gray: '#c9cdd0' };
  for (const tr of sim.trucks) { const [a, b] = mmXY(tr.g.position.x, tr.g.position.z); mx.fillStyle = TONE[sim.tone(tr)]; mx.strokeStyle = tr === followed ? '#fff' : '#0b1a24'; mx.lineWidth = 2; mx.beginPath(); mx.arc(a, b, tr === followed ? 5 : 3.5, 0, 7); mx.fill(); mx.stroke(); }
  const [cx, cz] = mmXY(controls.target.x, controls.target.z); mx.strokeStyle = '#ff5a1f'; mx.lineWidth = 2; mx.strokeRect(cx - 12, cz - 9, 24, 18);
}
mm.addEventListener('click', e => {
  const r = mm.getBoundingClientRect(), x = MB.x0 + (e.clientX - r.left) / r.width * (MB.x1 - MB.x0), z = MB.z0 + (e.clientY - r.top) / r.height * (MB.z1 - MB.z0);
  let best = null, bd = 1e9; for (const s of STATIONS) { const p = W.stations[s.key].pos, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = s.key; } }
  openStation(best);
});

// ---------- loop ----------
function resize() { const w = app.clientWidth, h = app.clientHeight; renderer.setSize(w, h); labels.setSize(w, h); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 42 : 30; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock(); let panelTick = 0, statTick = 0;
renderer.setAnimationLoop(() => {
  const rdt = Math.min(0.05, clock.getDelta()), dt = paused ? 0 : rdt * speed;
  if (dt > 0) { const n = Math.ceil(dt / 0.02); for (let i = 0; i < n; i++) sim.update(dt / n); }
  W.ocean.uniforms.uTime.value += rdt;

  // camera fly / follow
  if (fly) {
    fly.t += rdt; const k = eIO(clamp01(fly.t / fly.dur));
    const tgt = followed ? followed.g.position : fly.t1;
    controls.target.lerpVectors(fly.t0, tgt, k);
    const d = THREE.MathUtils.lerp(fly.d0, fly.d1, k), pol = THREE.MathUtils.lerp(fly.pol0, fly.pol1, k), az = THREE.MathUtils.lerp(fly.az0, fly.az1, k);
    camera.position.copy(sph(controls.target, d, pol, az)); camera.lookAt(controls.target);
    if (fly.t >= fly.dur) fly = null;
  } else {
    if (followed) { const delta = followed.g.position.clone().setY(0).sub(controls.target); controls.target.add(delta); camera.position.add(delta); }
    controls.update();
  }

  // day / night
  night += (nightT - night) * Math.min(1, rdt * 2);
  scene.background.copy(DAY_BG).lerp(NIGHT_BG, night); scene.fog.color.copy(scene.background);
  hemi.intensity = THREE.MathUtils.lerp(1.3, 0.3, night); scene.environmentIntensity = THREE.MathUtils.lerp(0.35, 0.06, night);
  W.night.screens.forEach(m => m.emissiveIntensity = 0.85 + night * 0.6); W.tick(sim.t); sun.intensity = THREE.MathUtils.lerp(1.7, 0.25, night);
  sun.color.setRGB(1, 1 - night * 0.2, 1 - night * 0.05);
  W.mats.lamp.emissiveIntensity = night * 2.4; W.mats.pool.opacity = night * 0.5; W.night.windows.forEach(m => m.emissiveIntensity = night * 1.3);
  W.mats.glow.emissiveIntensity = 0.4 + night * 1.6; headM.emissiveIntensity = night * 3; tailM.emissiveIntensity = night * 2.5; beamM.opacity = night * 0.5; W.ocean.uniforms.uNight.value = night;

  // shadow camera follows what we look at
  const sz = mode === 'overview' ? 95 : 40;
  sun.position.set(controls.target.x - 30, 70, controls.target.z + 40); sun.target.position.copy(controls.target); sun.target.updateMatrixWorld();
  const sc = sun.shadow.camera; if (sc.right !== sz) { Object.assign(sc, { left: -sz, right: sz, top: sz, bottom: -sz, near: 1, far: 220 }); sc.updateProjectionMatrix(); }

  // chips + labels
  const camD = camera.position.distanceTo(controls.target);
  body.classList.toggle('far', camD > 120);
  for (const c of chips) {
    const tr = c.tr, txt = tr.task ? `#${tr.task.no}` : 'trống', st = tr.status, tone = sim.tone(tr), key = txt + st + tone + (tr === followed);
    if (key !== c.last) { c.id.textContent = txt; c.txt.textContent = st; c.dot.className = `dot ${tone}`; c.el.classList.toggle('on', tr === followed); c.last = key; }
  }
  if ((statTick += rdt) > 0.25) {
    statTick = 0;
    for (const s of STATIONS) { const n = sim.at(s.key).length, e = stLabels[s.key].el.querySelector('.cnt'); e.textContent = n || ''; e.style.display = n ? '' : 'none'; stLabels[s.key].el.classList.toggle('on', s.key === current); }
    sim.features.forEach((f, i) => { const [txt, tone] = FSTATUS[f.status]; const d = plotLabels[i].el.querySelector('.dot'); if (!d.classList.contains(tone)) d.className = `dot ${tone}`; plotLabels[i].el.title = txt;
      const want = f.status === 'done' ? f.plot.ui : f.plot.wire; if (f.plot.art.material.map !== want) { f.plot.art.material.map = want; f.plot.art.material.needsUpdate = true; } });
    $('#st-active').textContent = sim.trucks.filter(t => t.task).length; $('#st-shipped').textContent = sim.stats.shipped; $('#st-rej').textContent = sim.stats.rejected; $('#st-bounce').textContent = sim.stats.bounced; $('#st-sprint').textContent = sim.stats.sprint; renderCompare();
    body.classList.toggle('flow-real', sim.flow === 'real'); document.querySelectorAll('[data-flow]').forEach(x => x.classList.toggle('on', x.dataset.flow === sim.flow));
  }
  if (mode !== 'overview' && (panelTick += rdt) > 0.6) { panelTick = 0; if (!panel.matches(':hover')) renderPanel(); }
  if (mode !== 'overview') drawMinimap();

  renderer.render(scene, camera); labels.render(scene, camera);
});
$('#loading').classList.add('done');
window.__dt = { sim, W, openStation, follow, goOverview, camera, controls };
