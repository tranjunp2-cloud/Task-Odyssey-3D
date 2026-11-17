import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { STATIONS, FSTATUS } from './data.js';
import { buildWorld } from './world.js';
import { PM } from './props.js';
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
  const e = el(onClick ? 'button' : 'div', cls, html); if (onClick) { e.addEventListener('pointerdown', ev => ev.stopPropagation()); e.addEventListener('click', ev => { ev.stopPropagation(); onClick(); }); }   // keep MapControls from capturing the pointer, or the click never reaches the label
  const o = new CSS2DObject(e); o.position.y = y; parent.add(o); return { el: e, obj: o };
};
const stLabels = {};
for (const s of STATIONS) {
  const st = W.stations[s.key], y = { task: 9, research: 7.5, define: 7, design: 7, techreview: 6.5, test: 8, review: 7.5, handoff: 13, dev: 9, qc: 15, user: 33 }[s.key];
  const anchor = new THREE.Object3D(); anchor.position.copy(st.pos);
  if (s.key === 'design') anchor.position.addScaledVector(st.right, -4);
  if (s.key === 'handoff') anchor.position.addScaledVector(st.right, -4);
  if (s.key === 'define') anchor.position.addScaledVector(st.right, 9);
  if (s.key === 'techreview') anchor.position.addScaledVector(st.right, 10);
  scene.add(anchor);
  stLabels[s.key] = label(`<span class="n">${s.n}</span><b>${s.name}</b><em class="cnt"></em>`, 'st-label', anchor, y, () => openStation(s.key));
}
// feature workbenches: each feature has its own design agent
const plotsCenter = W.plots.reduce((a, p) => a.add(p.pos), new THREE.Vector3()).multiplyScalar(1 / W.plots.length); W.plotsCenter = plotsCenter;
const AGENTS = ['Pixel', 'Grid', 'Kern', 'Hue', 'Flex', 'Vector', 'Nova', 'Bezier', 'Glyph', 'Layer', 'Frame', 'Mono'];
const AGENT_DO = { todo: 'đang sạc · chờ task', doing: 'đang vẽ wireframe → UI', redo: 'vẽ lại theo góp ý của dev', review: 'chờ duyệt · tự soát UI', dev: 'hỗ trợ dev build', qa: 'soát Design QA', qc: 'theo dõi QC test', done: 'UI đã live ✓', improve: 'đọc số liệu để cải tiến', bug: 'user báo lỗi! đang tìm nguyên nhân' };
const agentChars = W.plots.map(p => ({ kind: 'agent', label: `Agent ${AGENTS[p.i]}`, group: p.agent.g, key: 'design', plot: p }));
const plotLabels = W.plots.map(p => { const a = new THREE.Object3D(); a.position.copy(p.labelPos); scene.add(a);
  const l = label(`<span class="av" style="--c:${p.col}">${AGENTS[p.i][0]}</span><div><b>${p.id} · ${p.name}</b><small></small><i class="bar"><u></u></i></div>`, 'f-label', a, 0.6, () => openChar(agentChars[p.i]));
  return { ...l, small: l.el.querySelector('small'), bar: l.el.querySelector('u') }; });
W.people.filter(p => p.label).forEach(p => label(p.label, 'p-label', p.group, 2.1));
W.bots.forEach(b => label(`<i>AI</i>${b.label.replace(/^AI /, '')}`, 'b-label', b.hover, 2.15));
const devPopAnchor = new THREE.Object3D(); W.anim.handoff.isle.add(devPopAnchor); devPopAnchor.position.set(0, 9, 0);
const qcPopAnchor = new THREE.Object3D(); W.qc.isle.add(qcPopAnchor); qcPopAnchor.position.set(1.5, 9, 0);
const userPopAnchor = new THREE.Object3D(); W.user.isle.add(userPopAnchor); userPopAnchor.position.set(0, 20, 0);
const userAlert = label('<b class="u"></b><span class="b"></span>', 'useralert', W.user.isle, 27, () => openStation('user'));

// ---------- simulation ----------
const feed = $('#feed');
const sim = new Sim(W, scene, {
  event(text, kind) { const li = el('li', kind, text); feed.prepend(li); while (feed.children.length > 6) feed.lastChild.remove(); },
  stamp(tr, ok, text) { const l = label(text || (ok ? 'DUYỆT ✔' : 'SỬA LẠI ✗'), `stamp ${ok ? 'ok' : 'no'}`, tr.g, 4.2); setTimeout(() => l.obj.removeFromParent(), 1700); },
  devPop(text) { const l = label(text, 'devpop', devPopAnchor, 0); setTimeout(() => l.obj.removeFromParent(), 2600); },
  userPop(text) { const l = label(text, 'devpop sos', userPopAnchor, 0); setTimeout(() => l.obj.removeFromParent(), 3200); userAlert.el.classList.remove('flash'); void userAlert.el.offsetWidth; userAlert.el.classList.add('flash'); },
  qcPop(text) { const l = label(text, 'devpop', qcPopAnchor, 0); setTimeout(() => l.obj.removeFromParent(), 2600); },
});
const chips = sim.trucks.map(tr => {
  const l = label('', 'chip', tr.g, 3.0, () => follow(tr)); l.el.innerHTML = '<i class="dot"></i><b></b><span></span>';
  return { tr, ...l, dot: l.el.querySelector('i'), id: l.el.querySelector('b'), txt: l.el.querySelector('span'), last: '' };
});

// ---------- camera: overview map ↔ detail ↔ follow ----------
const controls = new MapControls(camera, labels.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.screenSpacePanning = false;
controls.maxPolarAngle = 1.25; controls.minPolarAngle = 0.35;
const OVERVIEW_WIDE = { target: new THREE.Vector3(22, 0, 20), dist: 268, polar: 0.9, az: -0.42 };
const OVERVIEW_TALL = { target: new THREE.Vector3(24, 0, 22), dist: 360, polar: 0.8, az: -0.42 + Math.PI / 2 };
const overview = () => (innerWidth / innerHeight < 0.8 ? OVERVIEW_TALL : OVERVIEW_WIDE);
let mode = 'overview', current = null, followed = null, fly = null, charSel = null;
const focusOf = tr => tr.walker.g.visible ? tr.walker.g.position : tr.g.position;   // follow the designer while they walk
const sph = (target, dist, polar, az) => new THREE.Vector3(Math.sin(polar) * Math.sin(az), Math.cos(polar), Math.sin(polar) * Math.cos(az)).multiplyScalar(dist).add(target);
function flyTo(target, dist, polar, az, dur = 1.3) {
  const off = camera.position.clone().sub(controls.target), curAz = Math.atan2(off.x, off.z);
  if (az === undefined) az = curAz; while (az - curAz > Math.PI) az -= Math.PI * 2; while (az - curAz < -Math.PI) az += Math.PI * 2;
  fly = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), t1: target.clone(),
    d0: off.length(), d1: dist, pol0: Math.acos(off.y / off.length()), pol1: polar, az0: curAz, az1: az };
}
{ const o = overview(); camera.position.copy(sph(o.target, o.dist, o.polar, o.az)); controls.target.copy(o.target); }

const panel = $('#panel'), body = document.body;
function setMode(m) { mode = m; body.dataset.mode = m; controls.minDistance = m === 'overview' ? 70 : 10; controls.maxDistance = m === 'overview' ? 440 : 130; }
setMode('overview');

function goOverview() {
  followed = null; current = null; charSel = null; setMode('overview'); panel.classList.remove('open');
  const o = overview(); flyTo(o.target, o.dist, o.polar, o.az); renderSteps();
}
function stationFocus(key) {
  const st = W.stations[key];
  if (key === 'design') {   // the 12 agent workbenches + the studio behind the road
    const pc = W.plots.reduce((a, p) => a.add(p.pos), new THREE.Vector3()).multiplyScalar(1 / W.plots.length);
    const p = st.pos.clone().lerp(pc, 0.7), dir = st.right.clone().addScaledVector(st.tan, -0.35).normalize();
    return { p, az: Math.atan2(dir.x, dir.z), dist: 66 };
  }
  if (key === 'user') return { p: W.user.pos.clone().setY(16), az: -0.55, dist: 112 };
  if (key === 'dev' || key === 'qc' || !W.rooms[key]) { const dir = st.right.clone().addScaledVector(st.tan, -0.45).normalize(); return { p: st.pos.clone().setY(key === 'qc' ? 7 : 0), az: Math.atan2(dir.x, dir.z), dist: key === 'qc' ? 66 : 40 }; }
  // look at the department from the road side: lot + open front of the room in frame
  const c = new THREE.Vector3(); W.rooms[key].g.getWorldPosition(c);
  if (key === 'task') { const lot = W.parks.task.group.localToWorld(new THREE.Vector3(-12, 0, 11)); c.lerp(lot, 0.8); }   // keep the carport in frame too
  const p = st.pos.clone().lerp(c, 0.55), toRoad = st.pos.clone().sub(c).setY(0).normalize();
  const dir = toRoad.addScaledVector(st.tan, -0.5).normalize();
  return { p, az: Math.atan2(dir.x, dir.z), dist: { design: 50, task: 58, research: 48, handoff: 52 }[key] || 42 };
}
function openStation(key) {
  followed = null; current = key; charSel = null; setMode('detail');
  const f = stationFocus(key); flyTo(f.p, f.dist, 0.98, f.az);
  renderPanel(); panel.classList.add('open'); renderSteps();
}
function follow(tr) {
  followed = tr; current = null; charSel = null; setMode('follow');
  const off = camera.position.clone().sub(controls.target);
  flyTo(focusOf(tr), 26, 1.0, Math.atan2(off.x, off.z));
  renderPanel(); panel.classList.add('open'); renderSteps();
}
// a person or an AI bot: what they do, and which tasks they are working on right now
function openChar(c) {
  followed = null; current = c.key && W.stations[c.key] ? c.key : null; charSel = c; setMode('detail');
  const p = new THREE.Vector3(); c.group.getWorldPosition(p); p.y = 0.8;
  flyTo(p, 15, 0.95);
  renderPanel(); panel.classList.add('open'); renderSteps();
}

// ---------- panel ----------
const fmt = s => { const m = Math.floor(s / 60), x = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
function renderPanel() {
  if (mode === 'detail' && charSel?.kind === 'agent') {
    const c = charSel, P = c.plot, f = sim.features[P.i], tr = sim.trucks.find(t => t.task?.feature === f), j = sim.island.find(j => j.f === f);
    panel.innerHTML = `
      <button class="x" data-act="close" aria-label="Đóng">×</button>
      <div class="kicker">Agent thiết kế · Xưởng Design</div>
      <h2><span class="av big" style="--c:${P.col}">${AGENTS[P.i][0]}</span> ${c.label}</h2>
      <p>Phụ trách <b>${f.id} · ${f.name}</b>. Agent vẽ UI phủ dần lên wireframe khi designer đang làm task, tự soát khi chờ duyệt, ăn mừng khi tính năng live và báo động khi user gặp lỗi.</p>
      <div class="now"><b>Đang làm</b>${AGENT_DO[f.status] || FSTATUS[f.status][0]}<small>Tiến độ UI ${Math.round(P.prog * 100)}% · trạng thái: ${FSTATUS[f.status][0]}</small></div>
      <div class="badges"><span>Dev trả về: ${f.redo}</span>${f.userBug ? `<span class="hot">🆘 ${f.bugMsg} (${f.reports || 1} báo cáo)</span>` : ''}</div>
      <h4>Task của tính năng này</h4><ul class="tasks">${tr ? `<li><button data-truck="${tr.i}"><i class="dot ${sim.tone(tr)}"></i><b>#${tr.task.no}</b> ${tr.task.feature.name}<span>${tr.status}</span></button></li>` : j ? `<li><button><i class="dot yellow"></i><b>#${j.t.no}</b> đang ở đảo ${j.phase === 'qc' || j.phase === 'toqc' ? 'QC' : 'Dev'}<span>${j.phase}</span></button></li>` : `<li class="muted">${f.status === 'todo' ? 'Chưa có xe nhận task này' : 'Không có xe nào đang chở tính năng này'}</li>`}</ul>
      <div class="nav"><button data-go="design">Xem Xưởng Design</button><button data-act="map">Bản đồ</button></div>`;
    return;
  }
  if (mode === 'detail' && charSel) {
    const c = charSel, s = c.key && W.stations[c.key], here = s ? sim.at(c.key) : [];
    const working = c.key === 'dev' || c.key === 'qc' ? islandJobs(c.key) :
      here.map(tr => `<li><button data-truck="${tr.i}"><i class="dot ${sim.tone(tr)}"></i><b>#${tr.task.no}</b> ${tr.task.feature.name}<span>${tr.status}</span></button></li>`);
    panel.innerHTML = `
      <button class="x" data-act="close" aria-label="Đóng">×</button>
      <div class="kicker">${c.kind === 'bot' ? 'Trợ lý AI' : 'Nhân vật'} · ${s ? s.name : 'Quán cà phê'}</div>
      <h2>${c.kind === 'bot' ? '🤖 ' : ''}${c.label || 'Nhân viên'}</h2>
      <p>${roleOf(c)}</p>
      ${c.kind === 'bot' && c.holo ? `<div class="flows"><div class="on"><b>Đang hỗ trợ</b>${c.holo}</div></div>` : ''}
      ${s ? `<h4>Đang làm với task <em>${working.length}</em></h4><ul class="tasks">${working.length ? working.join('') : `<li class="muted">${c.kind === 'bot' ? 'Đang chờ task tiếp theo' : 'Chưa có task nào ở đây, đang chờ xe tới'}</li>`}</ul>` : ''}
      <div class="nav">${s ? `<button data-go="${c.key}">Xem ${s.short}</button>` : ''}<button data-act="map">Bản đồ</button></div>`;
    return;
  }
  if (mode === 'detail' && current) {
    const s = W.stations[current], idx = STATIONS.findIndex(x => x.key === current), N = STATIONS.length;
    const here = sim.at(current);
    let extra = '';
    if (current === 'task') { const lot = sim.at('lot'); extra = `<h4>Bãi chờ task <em>${sim.trucks.filter(t => t.mode === 'parked' && t.lot === 'task').length}/4</em></h4><ul class="tasks">${lot.length ? lot.map(tr => `<li><button data-truck="${tr.i}"><i class="dot gray"></i><b>Xe ${tr.i + 1}</b> ${tr.status}<span>${tr.mode === 'parked' ? 'chờ ' + Math.floor(sim.t - tr.parkedAt) + 's' : ''}</span></button></li>`).join('') : '<li class="muted">Bãi trống, xe nào cũng đang có task</li>'}</ul>`; }
    if (current === 'design') extra = `<h4>Bảng tính năng</h4><ul class="feats">${sim.features.map(f => `<li><i class="dot ${FSTATUS[f.status][1]}"></i><b>${f.id}</b> ${f.name}<span>${FSTATUS[f.status][0]}</span></li>`).join('')}</ul>`;
    if (current === 'user') { const bugs = sim.features.filter(f => f.userBug), live = sim.features.filter(f => ['done', 'improve'].includes(f.status));
      extra += `<div class="badges"><span>👥 ${sim.users.toLocaleString('vi-VN')} user</span><span>✅ ${live.length} tính năng đang live</span><span class="${bugs.length ? 'hot' : ''}">⚠ ${bugs.length} lỗi đang mở</span></div>
        <h4>User báo lỗi <em>${bugs.length}</em></h4><ul class="tasks">${bugs.length ? bugs.map(f => { const tr = sim.trucks.find(t => t.task?.feature === f); return `<li><button ${tr ? `data-truck="${tr.i}"` : ''}><i class="dot red"></i><b>${f.id}</b> ${f.bugMsg}${f.reports > 1 ? ` <em>×${f.reports}</em>` : ''}<span>${tr ? 'đang hotfix · #' + tr.task.no : 'chờ nhận hotfix'}</span></button></li>`; }).join('') : '<li class="muted">Chưa có lỗi nào, user đang dùng ổn</li>'}</ul>`; }
    if (current === 'dev' || current === 'qc') { const js = islandJobs(current); extra += `<h4>${current === 'dev' ? 'Trên đảo Dev' : 'Đang ở QC'} <em>${js.length}</em></h4><ul class="tasks">${js.length ? js.join('') : '<li class="muted">Chưa có bản build nào</li>'}</ul>`; }
    if (current === 'dev' || current === 'handoff') extra += `<h4>Tàu DEV TEAM</h4><p class="muted">${{ docked: 'Đang cập cảng', out: 'Đang chạy ra đảo Dev', unload: 'Đang dỡ file ở đảo Dev', back: 'Đang quay về cảng' }[sim.ship.state]} · ${sim.ship.cargo.length} file trên tàu</p>`;
    panel.innerHTML = `
      <button class="x" data-act="close" aria-label="Đóng">×</button>
      <div class="kicker">Bước ${s.n} / ${String(STATIONS.length).padStart(2, '0')}</div><h2>${s.name}</h2><p>${s.desc}</p>
      <div class="flows"><div class="on"><b>✅ Cách làm chuẩn</b>${s.std}</div></div>
      ${['dev', 'qc', 'user'].includes(current) ? '' : `<h4>Task đang ở đây <em>${here.length}</em></h4>
      <ul class="tasks">${here.length ? here.map(tr => `<li><button data-truck="${tr.i}"><i class="dot ${sim.tone(tr)}"></i><b>#${tr.task.no}</b> ${tr.task.feature.name}<span>${tr.status}</span></button></li>`).join('') : '<li class="muted">Trống, chưa có xe nào</li>'}</ul>`}
      ${extra}
      <h4>Khó khăn thường gặp</h4><ul class="pains">${s.pains.map(p => `<li>${p}</li>`).join('')}</ul>
      <div class="tip"><b>Mẹo</b> ${s.tip}</div>
      <div class="nav"><button data-go="${STATIONS[(idx + N - 1) % N].key}">← ${STATIONS[(idx + N - 1) % N].short}</button><button data-act="map">Bản đồ</button><button data-go="${STATIONS[(idx + 1) % N].key}">${STATIONS[(idx + 1) % N].short} →</button></div>`;
  } else if (mode === 'follow' && followed) {
    const tr = followed, t = tr.task;
    panel.innerHTML = `
      <button class="x" data-act="close" aria-label="Đóng">×</button>
      <div class="kicker">Đang theo dõi xe</div>
      ${t ? `<h2>#${t.no} · ${t.feature.name}</h2>
        <div class="now"><b>Đang làm</b>${nowText(tr)}</div>
        <div class="badges"><span><i class="dot ${sim.tone(tr)}"></i>${tr.status}</span><span>v${t.version}</span><span>Sếp trả về: ${t.rejects}</span>${t.feature.redo ? `<span>Dev trả về: ${t.feature.redo}</span>` : ''}${t.hotfix ? '<span class="hot">🩹 Hotfix</span>' : ''}<span>⏱ ${fmt(sim.t - (t.history[0]?.t ?? sim.t))}</span></div>
        <h4>Hành trình</h4><ol class="hist">${t.history.slice().reverse().map(h => `<li><time>${fmt(h.t)}</time>${h.text}</li>`).join('')}</ol>`
      : `<h2>Xe trống</h2><p>${tr.status}. Về tới bến sẽ nhận task mới.</p>`}
      <div class="nav"><button data-act="map">Bản đồ</button></div>`;
  }
}
const JOB = { build: 'dev đang build', qa: 'design QA', toqc: 'đang qua cầu sang QC', qc: 'QC đang test' };
const islandJobs = key => sim.island.filter(j => (key === 'qc') === (j.phase === 'toqc' || j.phase === 'qc')).map(j => `<li><button><i class="dot yellow"></i><b>#${j.t.no}</b> ${j.f.name}<span>${JOB[j.phase]}${j.bugs ? ` · lỗi ${j.bugs}` : ''}</span></button></li>`);
// plain-language "what is this task doing right now"
function nowText(tr) {
  const t = tr.task, ws = tr.walker.state, key = tr.lot && tr.lot !== 'task' ? tr.lot : tr.mode === 'dwell' || tr.mode === 'wait' ? tr.dwellKey : tr.stop;
  const st = W.stations[key === 'research' && tr.walker.room === 'define' ? 'define' : key], where = st ? st.name : '';
  let line;
  if (tr.mode === 'reverse') line = `Bị trả về, xe đang lùi về Xưởng Design để sửa.`;
  else if (tr.mode === 'merge') line = `Chờ làn trống để vào bãi Xưởng Design sửa.`;
  else if (ws === 'in') line = `Designer vừa xuống xe, đang đi bộ vào ${where}.`;
  else if (ws === 'room') line = `Designer đang làm việc trong ${where}: ${tr.status}.`;
  else if (ws === 'out') line = `Xong việc ở ${where}, designer đang đi bộ về xe.`;
  else if (tr.mode === 'parkIn') line = `Đang rẽ vào bãi đỗ của ${where}.`;
  else if (tr.mode === 'parkOut') line = `Rời ${where}, đang nhập làn.`;
  else if (tr.mode === 'wait') line = `Đậu ở cảng, chờ tàu DEV TEAM cập bến để cẩu file lên.`;
  else if (tr.mode === 'dwell') line = `Đang ở ${where}: ${tr.status}.`;
  else line = `Đang chạy tới ${where}.`;
  return `${line}<small>Tính năng ${t.feature.id} · ${FSTATUS[t.feature.status][0]}</small>`;
}
const ROLE = {
  'task:PM': 'Product Manager. Viết brief: mục tiêu, người dùng, tiêu chí nghiệm thu, rồi giao task cho designer.',
  'research:Designer': 'Designer đang research: đọc đối thủ, gom reference, ghi lại insight.',
  'research:User': 'Người dùng thật được mời phỏng vấn để hiểu nhu cầu.',
  'define:PM': 'Cùng designer chốt 1 câu vấn đề và 3 tiêu chí nghiệm thu.',
  'define:Designer': 'Biến insight từ research thành vấn đề và tiêu chí rõ ràng.',
  'design:Designer': 'Vẽ wireframe → UI → prototype, dùng component từ design system.',
  'techreview:Dev': 'Xem thiết kế sớm để báo ngay chỗ nào khó code.',
  'techreview:PM': 'Góp ý sớm khi sửa còn rẻ.',
  'test:Tester': 'Điều phối buổi test, quan sát sau gương một chiều và ghi lỗi.',
  'test:User': 'Người dùng thật bấm thử prototype.',
  'review:Sếp': 'Duyệt bản cuối theo các tiêu chí đã chốt ở Define.',
  'handoff:Designer': 'Chuẩn bị spec, trạng thái hover/lỗi/rỗng, asset để bàn giao.',
  'handoff:Dev': 'Nhận file bàn giao và hỏi lại chỗ chưa rõ.',
  'dev:Dev 1': 'Build tính năng từ file thiết kế.', 'dev:Dev 2': 'Build tính năng từ file thiết kế.',
  'dev:Design QA': 'Designer soát bản build so với thiết kế trước khi chuyển QC.',
  'qc:Tester 1': 'Chạy test case trên bản build, ghi bug kèm bước tái hiện.', 'qc:Tester 2': 'Test trên nhiều thiết bị và trình duyệt.',
  'qc:QC Lead': 'Quyết định pass hay fail. Pass thì bật đèn hải đăng release.',
};
const roleOf = c => c.kind === 'bot' ? `Bot AI của ${W.stations[c.key]?.name || 'phòng'}: hỗ trợ con người làm nhanh hơn, không thay quyết định của họ.`
  : ROLE[`${c.key}:${c.label}`] || (c.key === 'cafe' ? 'Pha cà phê cho designer ghé nghỉ sau mỗi lần bàn giao.' : `Thành viên của ${W.stations[c.key]?.name || 'đội'}, đang hỗ trợ các task ở đây.`);

panel.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.truck) follow(sim.trucks[+b.dataset.truck]);
  else if (b.dataset.go) openStation(b.dataset.go);
  else if (b.dataset.act === 'map' || b.dataset.act === 'close') goOverview();
});

// ---------- step bar ----------
function renderSteps() { setViewBtn('front'); controls.autoRotate = false; $('#views [data-v="orbit"]')?.classList.remove('on'); }

// ---------- camera angles while looking at a department or following a car ----------
const VIEWS = [['front', 'Chính diện'], ['left', '◀ Trái'], ['right', 'Phải ▶'], ['top', '⬇ Từ trên'], ['close', '🔍 Cận cảnh'], ['orbit', '⟳ Xoay vòng']];
const viewsEl = $('#views');
viewsEl.innerHTML = VIEWS.map(([k, t], i) => `<button data-v="${k}" title="Phím ${i + 1}">${t}</button>`).join('');
viewsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.v); });
function setViewBtn(v) { viewsEl.querySelectorAll('button').forEach(b => b.dataset.v !== 'orbit' && b.classList.toggle('on', b.dataset.v === v)); }
controls.autoRotateSpeed = 0.8;
controls.addEventListener('start', () => { if (controls.autoRotate) { controls.autoRotate = false; viewsEl.querySelector('[data-v="orbit"]').classList.remove('on'); } });
function setView(v) {
  if (v === 'orbit') { controls.autoRotate = !controls.autoRotate; viewsEl.querySelector('[data-v="orbit"]').classList.toggle('on', controls.autoRotate); return; }
  if (mode === 'detail' && current) {
    let { p, az, dist } = stationFocus(current), pol = 0.98;
    if (v === 'left') az += 0.95; if (v === 'right') az -= 0.95;
    if (v === 'top') { pol = 0.37; dist *= 1.05; }
    if (v === 'close') { p = new THREE.Vector3(); (charSel?.kind === 'agent' ? charSel.plot.group : W.rooms[current]?.g || W.anim.handoff.isle).getWorldPosition(p); p.y = 0; dist = current === 'dev' ? 24 : charSel?.kind === 'agent' ? 14 : 17; pol = 0.95; }
    flyTo(p, dist, pol, az, 1.1);
  } else if (mode === 'follow' && followed) {
    const r = followed.g.rotation.y, back = Math.atan2(-Math.cos(r), Math.sin(r));   // camera behind the car
    const [az, dist, pol] = { front: [back, 24, 0.95], left: [r + Math.PI, 18, 1.05], right: [r, 18, 1.05], top: [back, 30, 0.37], close: [back + Math.PI + 0.5, 11, 1.15] }[v];
    flyTo(focusOf(followed), dist, pol, az, 1.1);
  } else return;
  setViewBtn(v);
}
addEventListener('keydown', e => { if (mode === 'overview' || e.target.closest?.('input,textarea')) return; const i = +e.key - 1; if (i >= 0 && i < VIEWS.length) setView(VIEWS[i][0]); });

// ---------- top controls ----------
let speed = 1, paused = false, nightT = 0, night = 0;
$('#btn-map').onclick = goOverview;
// ---------- play / pause / speed ----------
const toastEl = el('div', 'toast'); document.body.appendChild(toastEl); let toastT = null;
const toast = text => { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1300); };
function setPaused(v) { paused = v; const b = $('#btn-pause'); b.textContent = paused ? '▶' : '❚❚'; b.setAttribute('aria-label', paused ? 'Tiếp tục' : 'Tạm dừng'); b.classList.toggle('paused', paused); toast(paused ? '❚❚ Tạm dừng' : `▶ Chạy · ${speed}×`); }
function setSpeed(n) {
  speed = n; document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('on', +x.dataset.speed === n));
  if (paused) setPaused(false); else toast(`⏩ Tốc độ ${n}×`);   // picking a speed always resumes, otherwise nothing seems to happen while paused
}
$('#btn-pause').onclick = e => { setPaused(!paused); e.currentTarget.blur(); };
document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { setSpeed(+b.dataset.speed); b.blur(); });
addEventListener('keydown', e => { if (e.target.closest?.('input,textarea')) return; const SP = [1, 2, 4], i = SP.indexOf(speed);
  if (e.key === ']' || e.key === '+' || e.key === '=') setSpeed(SP[Math.min(2, i + 1)]); if (e.key === '[' || e.key === '-') setSpeed(SP[Math.max(0, i - 1)]); });
$('#btn-night').onclick = e => { nightT = nightT ? 0 : 1; e.currentTarget.textContent = nightT ? '☀' : '🌙'; };
addEventListener('keydown', e => { if (e.key === 'Escape') goOverview(); if (e.key === ' ') { setPaused(!paused); e.preventDefault(); } });

// ---------- click on 3D objects ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let downAt = null;
labels.domElement.addEventListener('pointerdown', e => downAt = [e.clientX, e.clientY]);
labels.domElement.addEventListener('pointerup', e => {
  if (e.target.closest('button')) return;
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const tr = truckAt(); if (tr) return follow(tr);
  const c = charAt(); if (c) return openChar(c);
  const k = stationAt(); if (k) openStation(k);
});
sim.trucks.forEach(tr => tr.walker.g.userData.truck = tr);
function truckAt() {
  const hit = ray.intersectObjects(sim.trucks.flatMap(t => t.walker.g.visible ? [t.g, t.walker.g] : [t.g]), true)[0];
  if (hit) for (let o = hit.object; o; o = o.parent) if (o.userData.truck) return o.userData.truck;
  return null;
}
// people + AI bots, tagged with the department they belong to
const chars = [...W.people.map(p => ({ kind: 'person', label: p.label, group: p.group })), ...W.bots.map(b => ({ kind: 'bot', label: b.label, holo: b.holo, group: b.group }))];
for (const c of chars) { c.group.userData.char = c;
  for (let o = c.group; o && !c.key; o = o.parent) { if (o === W.qc.isle) c.key = 'qc'; else if (o === W.anim.handoff.isle) c.key = 'dev'; else if (o === W.cafe) c.key = 'cafe';
    else { const r = Object.entries(W.rooms).find(([, r]) => r.g === o); if (r) c.key = r[0]; else { const s = STATIONS.find(s => W.stations[s.key].group === o); if (s) c.key = s.key; } } } }
function charAt() {
  const all = [...chars, ...agentChars], hit = ray.intersectObjects(all.map(c => c.group).concat(W.plots.map(p => p.group)), true)[0];
  if (hit) for (let o = hit.object; o; o = o.parent) { const P = W.plots.find(p => p.group === o); if (P) return agentChars[P.i]; }
  if (hit) for (let o = hit.object; o; o = o.parent) if (o.userData.char) return o.userData.char;
  return null;
}
const selRing = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 32), new THREE.MeshBasicMaterial({ color: '#ff5a1f', transparent: true, opacity: .9, depthWrite: false }));
selRing.rotation.x = -Math.PI / 2; selRing.visible = false; scene.add(selRing);
// which department is under the pointer: rooms first, then the dev island, then the rest of a station
const isle = W.anim.handoff.isle, roomList = Object.entries(W.rooms).filter(([k]) => W.stations[k]).map(([k, r]) => [k, r.g]);
function stationAt() {
  const h = ray.intersectObjects([...roomList.map(r => r[1]), isle, W.qc.isle, W.user.isle], true)[0];
  if (h) { for (let o = h.object; o; o = o.parent) { if (o === isle) return 'dev'; if (o === W.qc.isle) return 'qc'; if (o === W.user.isle) return 'user'; const r = roomList.find(x => x[1] === o); if (r) return r[0]; } }
  const groups = STATIONS.map(s => W.stations[s.key].group), h2 = ray.intersectObjects(groups, true)[0];
  if (h2) { let o = h2.object; while (o && !groups.includes(o)) o = o.parent; return STATIONS.find(s => W.stations[s.key].group === o)?.key; }
  return null;
}
// hover: pointer cursor + highlight the department's label
let hoverKey = null, hoverT = 0;
labels.domElement.addEventListener('pointermove', e => {
  if (e.buttons || performance.now() - hoverT < 60) return; hoverT = performance.now();
  const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const car = truckAt() || charAt(), k = car ? null : stationAt();
  if (k !== hoverKey) { if (hoverKey) stLabels[hoverKey].el.classList.remove('hover'); if (k) stLabels[k].el.classList.add('hover'); hoverKey = k; }
  labels.domElement.style.cursor = car || k ? 'pointer' : '';
});

// ---------- minimap ----------
const mm = $('#minimap'), mx = mm.getContext('2d');
const MB = { x0: -82, x1: 122, z0: -68, z1: 104 };
const mmXY = (x, z) => [(x - MB.x0) / (MB.x1 - MB.x0) * mm.width, (z - MB.z0) / (MB.z1 - MB.z0) * mm.height];
function drawMinimap() {
  const w = mm.width, h = mm.height; mx.clearRect(0, 0, w, h);
  mx.fillStyle = '#0e3b5c'; mx.fillRect(0, 0, w, h);
  mx.fillStyle = '#d6d9c3'; mx.beginPath(); W.islandPoly.forEach(([x, z], i) => { const [a, b] = mmXY(x, z); i ? mx.lineTo(a, b) : mx.moveTo(a, b); }); mx.fill();
  for (const [c, r] of [[W.devIsland, 10], [W.qcIsland, 11], [W.user.pos, 18]]) { const [ix, iz] = mmXY(c.x, c.z); mx.beginPath(); mx.arc(ix, iz, r / (MB.x1 - MB.x0) * w, 0, 7); mx.fill(); }
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
    const tgt = followed ? focusOf(followed) : fly.t1;
    controls.target.lerpVectors(fly.t0, tgt, k);
    const d = THREE.MathUtils.lerp(fly.d0, fly.d1, k), pol = THREE.MathUtils.lerp(fly.pol0, fly.pol1, k), az = THREE.MathUtils.lerp(fly.az0, fly.az1, k);
    camera.position.copy(sph(controls.target, d, pol, az)); camera.lookAt(controls.target);
    if (fly.t >= fly.dur) fly = null;
  } else {
    if (followed) { const delta = focusOf(followed).clone().setY(0).sub(controls.target).multiplyScalar(Math.min(1, rdt * 6)); controls.target.add(delta); camera.position.add(delta); }
    controls.update();
  }

  // day / night
  night += (nightT - night) * Math.min(1, rdt * 2);
  scene.background.copy(DAY_BG).lerp(NIGHT_BG, night); scene.fog.color.copy(scene.background);
  hemi.intensity = THREE.MathUtils.lerp(1.3, 0.13, night); scene.environmentIntensity = THREE.MathUtils.lerp(0.35, 0.02, night);
  W.night.screens.forEach(m => m.emissiveIntensity = 0.85 + night * 0.6);
  W.night.roomLights.forEach(l => l.intensity = night * 45); W.designNight(night); W.lighthouseLight.intensity = night * 120; PM.strip.emissiveIntensity = 0.3 + night * 2.5; W.tick(sim.t, camera); W.tickPlots(sim.t, sim.features); sun.intensity = THREE.MathUtils.lerp(1.7, 0.1, night);
  sun.color.setRGB(1, 1 - night * 0.2, 1 - night * 0.05);
  W.mats.lamp.emissiveIntensity = night * 2.4; W.mats.pool.opacity = night * 0.85; W.night.windows.forEach(m => m.emissiveIntensity = night * 1.3);
  W.mats.glow.emissiveIntensity = 0.4 + night * 1.6; headM.emissiveIntensity = night * 3; tailM.emissiveIntensity = night * 2.5; beamM.opacity = night * 0.5; W.ocean.uniforms.uNight.value = night;

  // shadow camera follows what we look at
  const sz = mode === 'overview' ? 95 : 40;
  sun.position.set(controls.target.x - 30, 70, controls.target.z + 40); sun.target.position.copy(controls.target); sun.target.updateMatrixWorld();
  const sc = sun.shadow.camera; if (sc.right !== sz) { Object.assign(sc, { left: -sz, right: sz, top: sz, bottom: -sz, near: 1, far: 220 }); sc.updateProjectionMatrix(); }

  if (charSel) { charSel.group.getWorldPosition(selRing.position); selRing.position.y += 0.08 - (charSel.kind === 'person' ? charSel.group.position.y : 0); selRing.scale.setScalar(1 + 0.08 * Math.sin(performance.now() / 200)); } selRing.visible = !!charSel;
  // chips + labels
  const camD = camera.position.distanceTo(controls.target);
  body.classList.toggle('far', camD > 120); body.classList.toggle('mid', camD > 40);
  // the 12 feature cards only show when zoomed in on the design field
  body.classList.toggle('show-feats', camD < 90 && controls.target.distanceTo(W.plotsCenter) < 40);
  for (const c of chips) {
    const tr = c.tr, txt = tr.task ? `#${tr.task.no}` : 'trống', st = tr.status, tone = sim.tone(tr), key = txt + st + tone + (tr === followed);
    if (key !== c.last) { c.id.textContent = txt; c.txt.textContent = st; c.dot.className = `dot ${tone}`; c.el.classList.toggle('on', tr === followed); c.last = key; }
  }
  if ((statTick += rdt) > 0.25) {
    statTick = 0;
    for (const s of STATIONS) { const n = sim.at(s.key).length, e = stLabels[s.key].el.querySelector('.cnt'); e.textContent = n || ''; e.style.display = n ? '' : 'none'; stLabels[s.key].el.classList.toggle('on', s.key === current); }
    sim.features.forEach((f, i) => { const L = plotLabels[i], tone = FSTATUS[f.status][1], txt = `${AGENTS[i]} · ${AGENT_DO[f.status] || FSTATUS[f.status][0]}`;
      if (L.small.textContent !== txt) L.small.textContent = txt; L.el.dataset.tone = tone; L.bar.style.width = Math.round(W.plots[i].prog * 100) + '%'; });
    { const n = sim.openBugs; userAlert.el.querySelector('.u').textContent = `👥 ${sim.users.toLocaleString('vi-VN')} user`; userAlert.el.querySelector('.b').textContent = n ? `⚠ ${n} lỗi · ${sim.openReports} báo cáo` : '✓ ổn định'; userAlert.el.classList.toggle('hot', n > 0); }
    $('#st-active').textContent = sim.trucks.filter(t => t.task).length; $('#st-shipped').textContent = sim.stats.shipped; $('#st-rej').textContent = sim.stats.rejected; $('#st-bounce').textContent = sim.stats.bounced; $('#st-sprint').textContent = sim.stats.sprint;
  }
  if (mode !== 'overview' && (panelTick += rdt) > 0.6) { panelTick = 0; if (!panel.matches(':hover')) renderPanel(); }
  if (mode !== 'overview') drawMinimap();

  renderer.render(scene, camera); labels.render(scene, camera);
});
$('#loading').classList.add('done');
window.__dt = { sim, W, openStation, follow, goOverview, camera, controls, openChar, chars, charAt, truckAt, ray, get charSel() { return charSel; } };
