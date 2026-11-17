// Mô phỏng: mỗi siêu xe = một designer chở file (thẻ file) của một tính năng qua các trạm.
// Hai chế độ quy trình: 'std' (chuẩn: Define, Review sớm, Design QA, Release) và 'real' (thực tế: bỏ các bước đó,
// hay bị trả về, sửa gì cũng test lại, task làm lại phải research lại, dev hay trả "không code được").
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FEATURES } from './data.js';
import { LANE, COL } from './world.js';
import { CL, CH, TRAILER_TOP, fileCard as container, makeCar, makeWalker } from './props.js';
const V3 = THREE.Vector3;

const ALL = ['task', 'research', 'design', 'techreview', 'test', 'review', 'handoff'];
// tham số của từng chế độ
const FLOW = {
  std:  { label: 'Quy trình chuẩn', reject: [0.2, 0.08, 0], minor: 0.7, early: 0.35, bounceChecked: 0.03, bounce: 0.2, research: [18, 22], define: 10, qcFail: 0.12, userBug: 0.08, fixMinor: [2.5, 3.5], fixMajor: [5, 7], skip: [] },
  real: { label: 'Quy trình thực tế', reject: [0.55, 0.35, 0.12], minor: 0, early: 0, bounceChecked: 0.25, bounce: 0.25, research: [27, 33], define: 0, qcFail: 0.35, userBug: 0.3, fixMinor: [8, 12], fixMajor: [8, 12], skip: ['techreview'] },
};
const emptyStats = () => ({ done: 0, leadSum: 0, rejects: 0, early: 0, bounced: 0, shipped: 0, userBugs: 0 });
const USER_BUG_EVERY = 5;   // seconds of simulation between two user bug reports
const BUGMSG = ['nút thanh toán không bấm được', 'màn hình trắng trên iPhone cũ', 'chữ tràn khỏi nút', 'không nhận được email xác nhận', 'tải trang quá chậm', 'bấm quay lại bị mất giỏ hàng', 'chế độ tối không đọc được chữ'];
const PAL = ['#ff5a1f', '#1f6f8b', '#b5452d', '#e9b949', '#0e3b5c', '#7b5cff', '#2bd47d', '#e86a92'];
const eIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = v => Math.min(1, Math.max(0, v));
const W01 = (a, b, x) => clamp01((x - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
let rs = 20261117; const rnd = () => ((rs = (rs * 1664525 + 1013904223) >>> 0) / 4294967296);
const rr = (a, b) => a + rnd() * (b - a);

const steel = new THREE.MeshStandardMaterial({ color: '#1a2128', roughness: .5, metalness: .3 });
const orangeM = new THREE.MeshStandardMaterial({ color: COL.orange, roughness: .45 });
export const headM = new THREE.MeshStandardMaterial({ color: '#fff7e0', emissive: '#fff2c8', emissiveIntensity: 0 });
export const tailM = new THREE.MeshStandardMaterial({ color: '#ff3b1f', emissive: '#ff2a10', emissiveIntensity: 0 });
export const beamM = new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });

const makeTruck = (color, poolTex, i) => makeCar(color, poolTex, headM, tailM, beamM, HAIR[i % HAIR.length]);
const HAIR = ['#2a1d16', '#7a4a2a', '#111', '#c98b4b', '#3b2a5c', '#e2c48f'];

export class Sim {
  constructor(world, scene, hooks) {
    this.w = world; this.scene = scene; this.hooks = hooks; // hooks: { event(text, kind), stamp(truck, ok), devPop(text) }
    this.features = FEATURES.map(([id, name], i) => ({ id, name, status: i >= 8 ? 'done' : 'todo', plot: world.plots[i], taken: false, redo: 0 }));   // F09–F12 are already live from an earlier release
    this.bugClock = USER_BUG_EVERY;
    this.stats = { shipped: 0, rejected: 0, bounced: 0, sprint: 1 };
    this.flow = 'std'; this.ms = { std: emptyStats(), real: emptyStats() }; this.island = []; this.live = []; this.users = 1240;
    this.taskNo = 2531; this.trucks = []; this.t = 0;
    this.gantry = { busy: null, t: 0 }; this.crane = { busy: null, t: 0 };
    this.ship = { state: 'docked', t: 0, cargo: [], firstLoad: null };
    this.stopD = Object.fromEntries(ALL.map(k => [k, world.stations[k].d]));
    this.tmp = world.at(0);
    // parking lots: the task station's waiting lot, and the research lot (~30 s per truck)
    const makeLot = (key, entryD, exitD, kk = 7) => {
      const { group: g, slots } = world.parks[key]; g.updateMatrixWorld(true);
      const local = (d, lane) => { const f = world.at(d); const p = g.worldToLocal(f.pos.clone().addScaledVector(f.right, lane)); const q = g.worldToLocal(f.pos.clone().add(f.tan).addScaledVector(f.right, lane)); return [p, q.sub(p).normalize()]; };
      const [E0, T0] = local(entryD, LANE), [X1, T1] = local(exitD, LANE), X = new THREE.Vector3(1, 0, 0);
      return { key, g, entryD, exitD, occ: slots.map(() => null), reserved: null,
        inPath: slots.map(sl => new THREE.CubicBezierCurve3(E0, E0.clone().addScaledVector(T0, kk), sl.clone().addScaledVector(X, -kk), sl.clone())),
        outPath: slots.map(sl => new THREE.CubicBezierCurve3(sl.clone(), sl.clone().addScaledVector(X, kk), X1.clone().addScaledVector(T1, -kk), X1.clone())) };
    };
    this.lots = { task: makeLot('task', this.stopD.task - 30, this.stopD.task), research: makeLot('research', this.stopD.research - 4, this.stopD.research + 30) };
    this.park = this.lots.task;
    // department lots: park, walk into the room, work, walk back, drive on
    this.stopD.cafe = world.cafeD;
    for (const [k, v] of Object.entries(world.vlots)) { const sd = this.stopD[k]; this.lots[k] = makeLot(k, sd + v.x - 8, sd + v.x + 8, 3.6); this.lots[k].visit = true; this.lots[k].side = v.side; }
    // six trucks spread over the route, already mid-task
    const start = [['task', 'dwell'], ['research', 'dwell'], ['design', 'drive'], ['test', 'drive'], ['review', 'drive'], ['handoff', 'return']];
    start.forEach(([key, mode], i) => {
      const m = makeTruck(PAL[i % PAL.length], world.poolTex, i), tr = { i, ...m, d: 0, lane: LANE, laneT: LANE, v: 0, mode: 'drive', stop: 0, timer: 0, task: null, cargo: null, dist: 0, status: '', bounce: 0 };
      scene.add(m.g); m.g.userData.truck = tr; this.trucks.push(tr);
      { const wk = makeWalker(HAIR[i % HAIR.length]); scene.add(wk.g); tr.walker = { ...wk, state: 'car', pts: [], i: 0, home: [], room: null }; }
      const si = ALL.indexOf(key);
      if (mode === 'return') { tr.d = this.stopD.handoff + 18; tr.stop = 'task'; tr.mode = 'drive'; }
      else {
        this.assign(tr, true); tr.task.version = si >= 2 ? 2 + Math.floor(rnd() * 3) : 0;
        if (si >= 3) tr.task.feature.status = 'review';
        tr.stop = key;
        if (key === 'research') { const R = this.lots.research; R.occ[0] = tr; Object.assign(tr, { lot: 'research', slot: 0, offroad: true, mode: 'parked', path: R.inPath[0], parkedAt: 0, timer: rr(8, 14), defineT: FLOW.std.define }); tr.pl = tr.ps = tr.path.getLength(); }
        else if (mode === 'dwell') { tr.d = this.stopD[key]; tr.mode = 'dwell'; tr.timer = rr(1, 4); tr.dwellKey = key; if (key === 'task') { tr.timer = 0.5; } }
        else { tr.d = this.stopD[key] - 22; tr.mode = 'drive'; }
      }
    });
    this.trucks.forEach(tr => this.place(tr, 0));
    for (const tr of this.trucks) if (tr.lot === 'research') { this.goIn(tr, 'research'); const k = tr.walker; k.g.position.copy(k.pts[k.pts.length - 1]); k.i = k.pts.length; k.state = 'room'; }
  }

  // ---------- walking: car door → (aisle) → room door → spot inside ----------
  roomPts(key, n) {
    const r = this.w.rooms[key]; r.g.updateMatrixWorld(true); const w = v => r.g.localToWorld(v.clone());
    return { out: w(new V3(0, 0, -r.d / 2 - 0.9)), in: w(new V3(0, 0.22, -r.d / 2 + 0.7)), spot: w(r.spots[n % r.spots.length]) };
  }
  inRoute(tr, key) {
    const lot = this.lots[tr.lot], side = lot.visit ? lot.side : tr.lot === 'research' ? -1 : 1, R = this.roomPts(key, tr.slot || 0);
    tr.g.updateMatrixWorld(true); const door = tr.g.localToWorld(new V3(-0.2, 0, side * 1.25)); door.y = 0;
    const pts = [door];
    const v = lot.visit ? this.w.vlots[tr.lot] : tr.lot === 'task' ? this.w.parks.task : null;   // walk out along the aisle, not through the other parked cars
    if (v) { const g = v.group, cl = g.worldToLocal(door.clone()), fl = g.worldToLocal(R.out.clone());
      pts.push(g.localToWorld(new V3(v.aisleX, 0, cl.z)), g.localToWorld(new V3(v.aisleX, 0, fl.z))); }
    pts.push(R.out, R.in, R.spot); return pts;
  }
  walkTo(tr, pts, state) { const k = tr.walker; k.pts = pts; k.i = 1; k.state = state; k.g.position.copy(pts[0]); k.g.visible = true; tr.drv.visible = false; }
  goIn(tr, key) { const k = tr.walker, pts = this.inRoute(tr, key); k.home = pts; k.room = key; k.cardM.color.set(tr.task?.color || '#b8c0c5'); k.cardM.emissive.set(tr.task?.color || '#000'); this.walkTo(tr, pts, 'in'); }
  toDefine(tr) {
    const k = tr.walker, A = this.roomPts('research', tr.slot || 0), home = this.inRoute(tr, 'define');
    k.home = home; k.room = 'define'; this.walkTo(tr, [k.g.position.clone(), A.in, A.out, ...home.slice(1)], 'in');
  }
  goBack(tr) {
    const k = tr.walker; if (k.state !== 'in' && k.state !== 'room') return;
    const idx = k.pts === k.home ? k.i : k.home.length;
    this.walkTo(tr, [k.g.position.clone(), ...k.home.slice(0, idx).reverse()], 'out');
  }
  stepWalker(tr, dt) {
    const k = tr.walker; if (k.state !== 'in' && k.state !== 'out') { k.legs.forEach(l => l.rotation.x = 0); return; }
    let rem = 2.8 * dt;
    while (rem > 0 && k.i < k.pts.length) { const tgt = k.pts[k.i], dir = tgt.clone().sub(k.g.position), d = dir.length();
      if (d > 0.05) k.g.rotation.y = Math.atan2(dir.x, dir.z);
      if (d <= rem) { k.g.position.copy(tgt); rem -= d; k.i++; } else { k.g.position.addScaledVector(dir, rem / d); rem = 0; } }
    const sw = Math.sin(this.t * 13) * 0.6; k.legs[0].rotation.x = sw; k.legs[1].rotation.x = -sw;
    if (k.i >= k.pts.length) { if (k.state === 'in') k.state = 'room'; else { k.state = 'car'; k.g.visible = false; tr.drv.visible = true; } }
  }
  visitArrive(tr, key) {
    const t = tr.task, F = this.Ft(tr);
    if (key === 'cafe') { tr.timer = rr(9, 11); tr.mode = 'parked'; tr.dwellKey = key; tr.ready = false; return; }
    if (key === 'design' && tr.fixPending) { tr.fixPending = false; tr.fixing = true; tr.timer = tr.early ? rr(2.5, 3.5) : rr(...(tr.minorFix ? F.fixMinor : F.fixMajor)); t.version++; this.log(tr, `Sửa lại → v${t.version}`); tr.early = false; }
    else if (key === 'handoff') { tr.fixing = false; tr.timer = rr(2.5, 3.5); this.log(tr, 'Phòng bàn giao: chuẩn bị spec, asset, prototype'); }
    else this.arrive(tr, key);
    tr.mode = 'parked'; tr.dwellKey = key; tr.ready = false;
  }

  assign(tr, silent) {
    let pool = this.features.filter(f => !f.taken && ['todo', 'redo', 'improve', 'bug'].includes(f.status));
    const done = this.features.filter(f => f.status === 'done');
    if (!pool.length && done.length >= 4) {   // rolling backlog: finished features come back as next sprint's work
      this.stats.sprint++; done.forEach(f => { f.status = 'todo'; f.redo = 0; f.improved = false; });
      this.hooks.event(`🎉 Sprint ${this.stats.sprint}: ${done.length} tính năng vào lượt mới`, 'good'); pool = done;
    }
    if (!pool.length) return false;
    const f = pool[Math.floor(rnd() * pool.length)]; const wasRedo = f.status === 'redo', wasImprove = f.status === 'improve', wasBug = f.status === 'bug'; f.taken = true; f.status = 'doing';
    if (f.firstStart == null) { f.firstStart = this.t; f.startMode = this.flow; }
    const no = this.taskNo++, color = PAL[(no + 3) % PAL.length];
    tr.task = { no, feature: f, version: 0, rejects: 0, history: [], color, flow: this.flow, skipResearch: (wasRedo || wasBug) && this.flow === 'std', improve: wasImprove, hotfix: wasBug };
    tr.cargo = container(color, `#${no} · ${f.id}`);
    this.log(tr, wasBug ? `Task hotfix: user báo “${f.bugMsg}”` : wasRedo ? `Nhận lại task sau khi dev trả về${tr.task.skipResearch ? ' (không research lại)' : ''}` : wasImprove ? 'Task cải tiến từ số liệu sau release' : 'Nhận task từ PM');
    if (!silent) this.hooks.event(wasBug ? `🩹 #${no} ${f.name}: nhận task hotfix` : `📦 #${no} ${f.name}: nhận task`, 'info');
    if (silent) { tr.cargo.position.set(0, TRAILER_TOP + CH / 2, 0); tr.g.add(tr.cargo); }
    return true;
  }
  log(tr, text) { if (tr.task) tr.task.history.push({ t: this.t, text }); }
  get F() { return FLOW[this.flow]; }
  Ft(tr) { return FLOW[tr?.task?.flow || this.flow]; }   // a task keeps the flow it started in
  active(key, tr) { return !this.Ft(tr).skip.includes(key); }
  // next active station after `key` for this truck
  next(tr, key) {
    let i = ALL.indexOf(key);
    for (let n = 0; n < ALL.length; n++) { i = (i + 1) % ALL.length; const k = ALL[i];
      if (!this.active(k, tr)) continue; if (k === 'research' && tr.task?.skipResearch) continue; return k; }
    return 'task';
  }
  setFlow(f) { if (f === this.flow) return; this.flow = f; this.hooks.event(f === 'std' ? '✅ Chuyển sang quy trình chuẩn' : '😭 Chuyển sang quy trình thực tế', 'info'); }
  finishFeature(f) {   // feature released (std) or accepted (real): lead time from first pick-up, in the flow it started in
    const m = this.ms[f.startMode || this.flow]; m.done++; m.leadSum += this.t - (f.firstStart ?? this.t); f.firstStart = null; f.startMode = null;
  }

  // drive a truck along a bezier in the task-station frame (into / out of the lot)
  placeOff(tr) {
    const g = this.lots[tr.lot].g, c = tr.path, u = Math.min(1, tr.ps / tr.pl), p = c.getPointAt(u), t = c.getTangentAt(u);
    tr.g.position.copy(g.localToWorld(p)); tr.g.position.y = 0;
    tr.g.rotation.y = g.rotation.y + Math.atan2(-t.z, t.x);
    tr.wheels.forEach(w => w.rotation.z = -tr.dist / 0.3);
  }
  canAssign() { return this.features.some(f => !f.taken && ['todo', 'redo', 'improve', 'bug'].includes(f.status)) || this.features.filter(f => f.status === 'done').length >= 4; }
  updateOff(tr, dt) {
    if (tr.mode === 'parked') { tr.v = 0; const lot = this.lots[tr.lot], ws = tr.walker.state;
      if (tr.lot === 'research') { const was = tr.timer > tr.defineT; tr.timer -= dt;
        if (was && tr.timer <= tr.defineT && tr.defineT) { this.log(tr, 'Research xong, sang phòng Define'); this.toDefine(tr); }
        if (tr.timer <= 0) this.goBack(tr); }
      else if (lot.visit) { if (ws === 'room') { tr.timer -= dt; if (tr.timer <= 0) this.goBack(tr); } else if (ws === 'car' && tr.timer <= 0) tr.ready = true; }
      else if (tr.lot === 'task' && tr.wantOut && ws === 'car') { tr.wantOut = false; tr.mode = 'parkOut'; tr.path = lot.outPath[tr.slot]; tr.pl = tr.path.getLength(); tr.ps = 0; }
      return; }
    const left = tr.pl - tr.ps, vmax = Math.min(5, Math.sqrt(2 * 3 * left) + 0.3);
    tr.v += Math.max(-8 * dt, Math.min(4 * dt, vmax - tr.v));
    const step = Math.min(left, tr.v * dt); tr.ps += step; tr.dist += step;
    if (left - step < 0.02) {
      const lot = this.lots[tr.lot];
      if (tr.mode === 'parkIn') { tr.mode = 'parked'; tr.parkedAt = this.t; tr.v = 0;
        if (tr.lot === 'research') { tr.defineT = this.Ft(tr).define; tr.timer = rr(...this.Ft(tr).research) + tr.defineT; this.log(tr, 'Đỗ ở bãi research, vào phòng: gom reference, đọc đối thủ, phỏng vấn user'); this.goIn(tr, 'research'); }
        else if (lot.visit) { this.visitArrive(tr, tr.lot); this.goIn(tr, tr.lot); }
        else this.goIn(tr, 'task'); }
      else if (tr.lot === 'research') {
        tr.offroad = false; lot.occ[tr.slot] = null; tr.slot = null; tr.lot = null; tr.d = lot.exitD; tr.lane = tr.laneT = LANE; tr.v = 3;
        tr.mode = 'drive'; tr.stop = 'design'; this.log(tr, tr.defineT ? 'Define xong: chốt mục tiêu + tiêu chí, đi vẽ' : 'Research xong, đi vẽ luôn');
      }
      else if (lot.visit) {
        const key = tr.lot; lot.occ[tr.slot] = null; tr.slot = null; tr.lot = null; tr.offroad = false; tr.d = lot.exitD; tr.lane = tr.laneT = LANE; tr.ready = false;
        if (key === 'handoff') { tr.mode = 'drive'; tr.stop = 'handoff'; tr.visited = 'handoff'; tr.v = 2; } else { tr.mode = 'dwell'; tr.dwellKey = key; tr.timer = 0; tr.v = 0; }
      }
      else { tr.lot = null; tr.offroad = false; this.park.occ[tr.slot] = null; tr.slot = null; tr.d = this.stopD.task; tr.lane = tr.laneT = LANE; tr.v = 0; this.park.reserved = null; this.arrive(tr, 'task'); }
    }
  }
  place(tr, dt) {
    if (tr.offroad) return this.placeOff(tr);
    const f = this.w.at(tr.d, this.tmp);
    tr.g.position.copy(f.pos).addScaledVector(f.right, tr.lane);
    tr.g.rotation.y = Math.atan2(-f.tan.z, f.tan.x);
    tr.wheels.forEach(w => w.rotation.z = -tr.dist / 0.3);
    tr.g.position.y = Math.abs(tr.v) > 0.6 ? 0.012 * Math.sin(this.t * 40 + tr.i) : 0;
  }

  // forward gap to the nearest truck ahead on the same (forward) lane
  gapAhead(tr) {
    let best = 1e9; const L = this.w.L;
    for (const o of this.trucks) if (o !== tr && o.lane > 0 && !o.offroad) { const g = ((o.d - tr.d) % L + L) % L; if (g > 0.01 && g < best) best = g; }
    return best;
  }

  status(tr) {
    const t = tr.task, k = tr.mode === 'dwell' ? tr.dwellKey : tr.stop;
    if (tr.lot === 'research') { if (tr.mode === 'parkIn') return 'vào bãi research'; if (tr.mode === 'parkOut') return 'xong → đi vẽ';
      return tr.timer > tr.defineT ? `đang research · còn ${Math.ceil(tr.timer - tr.defineT)}s` : `define · còn ${Math.max(0, Math.ceil(tr.timer))}s`; }
    if (tr.lot && this.lots[tr.lot]?.visit) { if (tr.mode === 'parkIn') return 'vào bãi đỗ'; if (tr.mode === 'parkOut') return 'ra đường';
      const ws = tr.walker.state; if (ws === 'in') return 'xuống xe → vào phòng'; if (ws === 'out') return 'về xe'; if (ws === 'car') return 'chuẩn bị ra';
      if (tr.lot === 'handoff') return 'chuẩn bị spec'; if (tr.lot === 'cafe') return '☕ nghỉ cà phê'; }
    if (tr.mode === 'merge') return 'chờ nhập làn';
    if (tr.lot === 'task' && tr.wantOut) return 'về xe nhận task';
    if (tr.mode === 'parkIn') return 'vào bãi chờ';
    if (tr.mode === 'parked' && tr.lot === 'task') return 'chờ task ⏳';
    if (tr.mode === 'parkOut') return 'ra nhận task';
    if (!t) return tr.mode === 'dwell' ? 'chờ task' : tr.stop === 'cafe' ? 'đi uống cà phê ☕' : 'xe trống · về bến';
    if (tr.mode === 'reverse') return tr.early ? 'quay lại sửa sớm' : 'quay xe sửa 😭';
    if (tr.mode === 'wait') return 'chờ tàu';
    if (tr.mode === 'dwell' || tr.mode === 'parked') return { task: 'nhận task', research: 'đang research', design: tr.fixing ? `sửa lại v${t.version}` : (t.flow === 'std' ? `wireframe → UI v${t.version}` : `đang vẽ v${t.version}`), techreview: 'review sớm: PM + Dev', test: 'user test', review: 'chờ sếp duyệt', handoff: 'bàn giao dev' }[k] || '';
    if (tr.afterFix && tr.stop === tr.afterFix && tr.afterFix === 'review') return 'sửa xong → gửi lại';
    return { research: 'đi research', design: 'đi vẽ', techreview: 'đi review sớm', test: 'đi test', review: 'gửi sếp', handoff: 'đã duyệt → cảng', task: '' }[k] || '';
  }
  tone(tr) {
    const t = tr.task; if (!t) return 'gray';
    if (tr.mode === 'reverse' || tr.fixing) return 'red';
    const k = tr.mode === 'dwell' ? tr.dwellKey : tr.stop;
    return ['techreview', 'test', 'review'].includes(k) ? 'yellow' : k === 'handoff' ? 'green' : 'red';
  }

  update(dt) {
    this.t += dt; const L = this.w.L;
    for (const tr of this.trucks) {
      tr.lane += (tr.laneT - tr.lane) * Math.min(1, dt * 1.6);
      const rev = tr.mode === 'reverse';
      tr.revM.emissiveIntensity = rev ? 4 : 0; tr.revPoolM.opacity = rev ? 0.55 : 0;
      if (tr.offroad) { this.updateOff(tr, dt); }
      else if (tr.mode === 'drive') {
        if (!this.active(tr.stop, tr)) tr.stop = this.next(tr, tr.stop);
        if (tr.stop === 'research' && tr.task?.skipResearch) tr.stop = 'design';
        const lotKey = !tr.task && tr.stop === 'cafe' ? 'cafe' : !tr.task && tr.stop === 'task' && !tr.skipPark ? 'task' : tr.task && tr.stop === 'research' ? 'research' : tr.task && this.lots[tr.stop]?.visit && tr.visited !== tr.stop ? tr.stop : null, toLot = !!lotKey;
        const target = toLot ? this.lots[lotKey].entryD : this.stopD[tr.stop], fd = ((target - tr.d) % L + L) % L;
        if (toLot && fd < 0.3) { const lot = this.lots[lotKey], k = lot.occ.indexOf(null);
          if (k >= 0 && tr.v < 4) { lot.occ[k] = tr; tr.slot = k; tr.lot = lotKey; tr.offroad = true; tr.mode = 'parkIn'; tr.path = lot.inPath[k]; tr.pl = tr.path.getLength(); tr.ps = 0; this.place(tr, dt); tr.status = this.status(tr); continue; }
          if (k < 0 && lotKey === 'task') tr.skipPark = true;
          if (k < 0 && lotKey === 'cafe') tr.stop = 'task'; }   // café full: skip the coffee
        let vmax = Math.min(9, Math.sqrt(2 * 5 * fd));
        vmax = Math.min(vmax, Math.sqrt(2 * 6 * Math.max(0, this.gapAhead(tr) - 6.2)));
        tr.v += Math.max(-12 * dt, Math.min(5 * dt, vmax - tr.v));
        const step = Math.min(fd, Math.max(0, tr.v) * dt); tr.d = (tr.d + step) % L; tr.dist += step;
        if (!toLot && fd - step < 0.04 && tr.v < 1.2 && this.gapAhead(tr) > 6) { tr.d = target; tr.v = 0; tr.skipPark = false; this.arrive(tr, tr.stop); }
      } else if (rev) {
        const target = this.lots.design.entryD - 3, bd = ((tr.d - target) % L + L) % L;
        const vmax = Math.min(6.5, Math.sqrt(2 * 4 * bd));
        tr.v += Math.max(-10 * dt, Math.min(4 * dt, vmax - tr.v));
        const step = Math.min(bd, tr.v * dt); tr.d = ((tr.d - step) % L + L) % L; tr.dist -= step;
        if (bd - step < 0.04) { tr.d = target; tr.v = 0; tr.mode = 'merge'; tr.fixPending = true; tr.stop = 'design'; }
      } else if (tr.mode === 'merge') {
        const busy = this.trucks.some(o => { if (o === tr || o.offroad || o.lane <= 0) return false; const g = ((o.d - tr.d) % L + L) % L; return g < 7 || g > L - 10; });
        if (!busy) { tr.laneT = LANE; tr.mode = 'drive'; }
      } else if (tr.mode === 'dwell') {
        tr.timer -= dt;
        if (tr.dwellKey === 'task' && tr.task && this.gantry.busy === tr) this.gantryAnim(tr, dt);
        if (tr.timer <= 0) this.leave(tr);
      } else if (tr.mode === 'wait') {
        if (this.ship.state === 'docked' && !this.crane.busy && this.ship.cargo.length < 8) { tr.mode = 'dwell'; tr.dwellKey = 'handoff'; tr.timer = 3.7; this.crane.busy = tr; this.crane.t = 0; }
      }
      if (tr.mode === 'dwell' && tr.dwellKey === 'handoff' && this.crane.busy === tr) this.craneAnim(tr, dt);
      this.place(tr, dt); this.stepWalker(tr, dt);
      tr.status = this.status(tr);
    }
    { const P = this.park, L2 = this.w.L, sd = this.stopD.task;
      const stopClear = !this.trucks.some(o => !o.offroad && o.lane > 0 && Math.min(Math.abs(o.d - sd), L2 - Math.abs(o.d - sd)) < 6.5);
      if (!P.reserved && !this.gantry.busy && stopClear && this.canAssign()) {
        const tr = this.trucks.filter(o => o.mode === 'parked' && o.lot === 'task').sort((a, b) => a.parkedAt - b.parkedAt)[0];
        if (tr) { P.reserved = tr; if (tr.walker.state === 'car') { tr.mode = 'parkOut'; tr.path = P.outPath[tr.slot]; tr.pl = tr.path.getLength(); tr.ps = 0; } else { tr.wantOut = true; this.goBack(tr); } }
      } }
    { const R = this.lots.research, L2 = this.w.L, xd = R.exitD;
      const clear = !this.trucks.some(o => !o.offroad && o.lane > 0 && Math.min(Math.abs(o.d - xd), L2 - Math.abs(o.d - xd)) < 7);
      const tr = this.trucks.filter(o => o.lot === 'research' && o.mode === 'parked' && o.timer <= 0 && o.walker.state === 'car').sort((a, b) => a.parkedAt - b.parkedAt)[0];
      if (tr && clear && !this.trucks.some(o => o.lot === 'research' && o.mode === 'parkOut')) { tr.mode = 'parkOut'; tr.path = R.outPath[tr.slot]; tr.pl = tr.path.getLength(); tr.ps = 0; } }
    for (const key of Object.keys(this.w.vlots)) {
      const V = this.lots[key], xd = V.exitD;
      if (this.trucks.some(o => o.lot === key && o.mode === 'parkOut')) continue;
      const clear = !this.trucks.some(o => { if (o.offroad || o.lane <= 0) return false; const g = ((xd - o.d) % L + L) % L; return g < 12 || g > L - 5; });
      const tr = this.trucks.filter(o => o.lot === key && o.mode === 'parked' && o.ready).sort((a, b) => a.parkedAt - b.parkedAt)[0];
      if (tr && clear) { tr.mode = 'parkOut'; tr.path = V.outPath[tr.slot]; tr.pl = tr.path.getLength(); tr.ps = 0; }
    }
    this.updateShip(dt); this.updateIsland(dt); this.updateLive(dt);
    // barrier: open while an approved truck is leaving review
    const b = this.w.anim.barrier, want = this.trucks.some(tr => tr.approvedAt && this.t - tr.approvedAt < 3.2) ? 1 : 0;
    b.open += (want - b.open) * Math.min(1, dt * 3); b.arm.rotation.x = 0; b.arm.rotation.z = 0; b.arm.rotation.x = b.open * 1.35;
    // scanner pulses while a truck is under the arch
    const sd = this.stopD.test + (this.w.anim.scan.x || 0), under = this.trucks.some(tr => { const x = Math.abs(tr.d - sd); return Math.min(x, L - x) < 3; });
    this.w.anim.scan.mat.opacity = under ? 0.18 + 0.12 * Math.abs(Math.sin(this.t * 9)) : 0;
    this.w.anim.mag.rotation.y += dt * 0.8; this.w.anim.mag.position.y = (this.w.anim.magY || 3.2) + Math.sin(this.t * 1.5) * 0.25;
  }

  arrive(tr, key) {
    tr.mode = 'dwell'; tr.dwellKey = key; tr.fixing = false;
    const t = tr.task;
    if (key === 'task') {
      if (!t) { if (this.gantry.busy || (this.park.reserved && this.park.reserved !== tr) || !this.assign(tr)) { tr.timer = 1.5; tr.dwellKey = 'task'; return; } this.gantry.busy = tr; this.gantry.t = 0; tr.timer = 3.2; tr.cargo.visible = true; this.w.anim.gantry.trolley.add(tr.cargo); }
      else tr.timer = 1.2;
      return;
    }
    if (!t) { tr.timer = 0.1; return; }
    if (key === 'research') { tr.timer = rr(3.5, 5.5); this.log(tr, 'Research: gom reference, đọc đối thủ'); }
    if (key === 'design') { tr.timer = rr(4.5, 7); t.version += 2 + Math.floor(rnd() * 3); this.log(tr, t.flow === 'std' ? `Wireframe → UI → prototype v${t.version}` : `Vẽ UI luôn → v${t.version}`); }
    if (key === 'techreview') { tr.timer = rr(2.5, 3.5); this.log(tr, 'Review sớm với PM + Dev'); }
    if (key === 'test') { tr.timer = rr(2.5, 3.5); t.feature.status = 'review'; this.log(tr, 'User test với 5 người'); }
    if (key === 'review') { tr.timer = 2.2; this.log(tr, 'Gửi sếp duyệt'); }
    if (key === 'handoff') { tr.mode = 'wait'; }
  }

  leave(tr) {
    const key = tr.dwellKey, t = tr.task;
    if (key === 'cafe') { tr.stop = 'task'; tr.mode = 'drive'; return; }
    if (key === 'task' && !t) { this.arrive(tr, 'task'); return; }
    if (key === 'techreview' && t) {
      t.techChecked = true;
      if (rnd() < this.Ft(tr).early) {
        this.ms[t.flow].early++; this.hooks.stamp(tr, false, 'GÓP Ý SỚM ✎'); this.hooks.event(`✎ #${t.no} ${t.feature.name}: góp ý sớm, sửa nhanh`, 'info');
        this.log(tr, 'PM + Dev góp ý sớm → sửa khi còn rẻ'); tr.mode = 'reverse'; tr.early = true; tr.laneT = -LANE; tr.v = 0; tr.afterFix = 'test'; return;
      }
      this.hooks.stamp(tr, true, 'CODE ĐƯỢC ✔'); this.log(tr, 'Dev xác nhận code được');
    }
    if (key === 'review' && t) {
      const p = this.Ft(tr).reject[Math.min(2, t.rejects)];
      if (rnd() < p) {
        t.rejects++; this.stats.rejected++; this.ms[t.flow].rejects++; t.feature.status = 'doing';
        const minor = rnd() < this.Ft(tr).minor;
        this.hooks.stamp(tr, false); this.hooks.event(`❌ #${t.no} ${t.feature.name}: ${minor ? 'góp ý nhỏ' : 'sếp trả về'} (lần ${t.rejects})`, 'bad');
        this.log(tr, minor ? `Góp ý nhỏ theo tiêu chí → sửa rồi gửi lại, không cần test lại` : `Sếp: “chưa ổn em ơi” → trả về lần ${t.rejects}`);
        tr.mode = 'reverse'; tr.laneT = -LANE; tr.v = 0; tr.afterFix = minor ? 'review' : 'test'; tr.minorFix = minor; return;
      }
      this.hooks.stamp(tr, true); this.hooks.event(`✅ #${t.no} ${t.feature.name}: sếp duyệt`, 'good'); this.log(tr, 'Sếp duyệt ✔'); tr.approvedAt = this.t;
    }
    if (key === 'handoff') {
      this.crane.busy = null; tr.task = null; tr.cargo = null; tr.stop = 'cafe'; tr.visited = null; tr.mode = 'drive'; tr.v = 0; tr.afterFix = null; return;
    }
    if (key === 'task') this.gantry.busy = null;
    if (key === 'design' && tr.fixing) {
      const L = this.w.L, blocked = tr.lane < 0 && this.trucks.some(o => o !== tr && o.lane > 0 && Math.min(Math.abs(o.d - tr.d), L - Math.abs(o.d - tr.d)) < 6.5);
      if (blocked) { tr.timer = 0.5; return; }
      tr.laneT = LANE; tr.fixing = false; tr.stop = tr.afterFix && this.active(tr.afterFix, tr) ? tr.afterFix : this.next(tr, 'design'); tr.mode = 'drive'; return; }
    if (key === 'review') tr.afterFix = null;
    tr.stop = this.next(tr, key); tr.mode = 'drive'; tr.fixing = false;
  }

  // gantry lifts the new file from the yard onto the truck
  gantryAnim(tr, dt) {
    const G = this.w.anim.gantry, k = (this.gantry.t += dt), topY = G.TOP - 1.2, grabY = G.grabY, dropY = TRAILER_TOP + CH + 0.08;
    const z = k < 0.9 ? G.stackZ : lerp(G.stackZ, G.laneZ, eIO(W01(0.9, 1.8, k)));
    const y = k < 0.4 ? lerp(topY, grabY, eIO(W01(0, 0.4, k))) : k < 0.9 ? lerp(grabY, topY, eIO(W01(0.4, 0.9, k))) : k < 1.8 ? topY : k < 2.5 ? lerp(topY, dropY, eIO(W01(1.8, 2.5, k))) : lerp(dropY, topY, eIO(W01(2.6, 3.1, k)));
    G.trolley.position.z = z; G.spreader.position.y = y;
    for (const c of G.cables) { const len = G.TOP - 0.3 - y; c.scale.y = Math.max(0.01, len); c.position.y = y + len / 2; }
    if (k < 2.5) { if (tr.cargo.parent !== G.trolley) G.trolley.add(tr.cargo); tr.cargo.rotation.set(0, 0, 0); tr.cargo.position.set(0, y - 0.08 - CH / 2, 0); }
    else if (tr.cargo.parent !== tr.g) { tr.g.add(tr.cargo); tr.cargo.position.set(0, TRAILER_TOP + CH / 2, 0); tr.cargo.rotation.set(0, 0, 0); this.log(tr, 'Cẩu file lên xe, lên đường'); }
  }

  // ship-to-shore crane: truck → ship slot
  craneAnim(tr, dt) {
    const H = this.w.anim.handoff, k = (this.crane.t += dt), slot = H.slots[this.ship.cargo.length], dockZ = H.SHIP_DOCK.z;
    const topY = H.STS - 1.0, grabY = TRAILER_TOP + CH + 0.16, liftY = 7.5, landY = slot.y + CH / 2 + 0.08;
    const sx = slot.x, sz = dockZ + slot.z;
    const x = lerp(0, sx, eIO(W01(1.1, 2.2, k))), z = k < 1.1 ? LANE : lerp(LANE, sz, eIO(W01(1.1, 2.2, k)));
    const y = k < 0.5 ? lerp(topY, grabY, eIO(W01(0, 0.5, k))) : k < 1.1 ? lerp(grabY, liftY, eIO(W01(0.5, 1.1, k))) : k < 2.2 ? liftY : k < 3.0 ? lerp(liftY, landY, eIO(W01(2.2, 3.0, k))) : lerp(landY, topY, eIO(W01(3.05, 3.6, k)));
    H.crane.position.x = x; H.sts.position.z = z; H.stsSpreader.position.y = y;
    for (const c of H.stsCables) { const len = H.STS - 0.15 - y; c.scale.y = Math.max(0.01, len); c.position.y = y + len / 2; }
    if (k >= 0.5 && k < 3.0 && tr.cargo) { if (tr.cargo.parent !== H.group) { H.group.add(tr.cargo); tr.cargo.rotation.set(0, 0, 0); } tr.cargo.position.set(x, y - 0.08 - CH / 2, z); }
    if (k >= 3.0 && tr.cargo && tr.cargo.parent === H.group) {
      H.ship.add(tr.cargo); tr.cargo.position.copy(slot);
      const t = tr.task; t.feature.status = 'dev'; t.feature.taken = false; this.stats.shipped++; this.ms[t.flow].shipped++;
      this.ship.cargo.push({ mesh: tr.cargo, task: t }); if (this.ship.firstLoad === null) this.ship.firstLoad = this.t;
      this.log(tr, 'Bàn giao lên tàu DEV TEAM'); this.hooks.event(`🚢 #${t.no} ${t.feature.name}: đã bàn giao dev`, 'info');
      tr.cargo = null;
    }
  }

  updateShip(dt) {
    const S = this.ship, H = this.w.anim.handoff; S.t += dt;
    const sail = (from, to, k) => { H.ship.position.lerpVectors(from, to, eIO(k)); H.ship.rotation.y = Math.sin(k * Math.PI) * 0.35 * (to === H.SHIP_ISLE ? 1 : -1); H.ship.position.y = Math.sin(this.t * 1.2) * 0.06; };
    if (S.state === 'docked') {
      H.ship.position.y = Math.sin(this.t * 1.2) * 0.04;
      const full = S.cargo.length >= 3 || (S.cargo.length && this.t - S.firstLoad > 16);
      if (full && !this.crane.busy) { S.state = 'out'; S.t = 0; this.hooks.event(`⛴ Tàu chở ${S.cargo.length} file sang đảo Dev`, 'info'); }
    } else if (S.state === 'out') { sail(H.SHIP_DOCK, H.SHIP_ISLE, Math.min(1, S.t / 6)); if (S.t >= 6) { S.state = 'unload'; S.t = 0; S.idx = 0; } }
    else if (S.state === 'unload') {
      const per = 1.1, i = Math.floor(S.t / per);
      S.cargo.forEach((c, j) => { const k = clamp01((S.t - j * per) / per); c.mesh.scale.setScalar(1 - eIO(k)); });
      while (S.idx < Math.min(i, S.cargo.length)) {
        const { task: t } = S.cargo[S.idx++], f = t.feature;
        const FL = FLOW[t.flow], pb = t.techChecked ? FL.bounceChecked : FL.bounce;
        if (rnd() < pb) { f.status = 'redo'; f.redo++; this.stats.bounced++; this.ms[t.flow].bounced++; this.hooks.devPop(`💀 #${t.no} “cái này không code được”`); this.hooks.event(`💀 Dev trả #${t.no} ${f.name}: không code được`, 'bad'); }
        else { f.status = 'dev'; this.island.push({ t, f, phase: 'build', timer: rr(5, 7) }); this.hooks.devPop(`💻 #${t.no} dev đang build`); }
      }
      if (S.t >= S.cargo.length * per + 0.4) { S.cargo.forEach(c => c.mesh.removeFromParent()); S.cargo = []; S.firstLoad = null; S.state = 'back'; S.t = 0; }
    } else if (S.state === 'back') { sail(H.SHIP_ISLE, H.SHIP_DOCK, Math.min(1, S.t / 6)); if (S.t >= 6) { S.state = 'docked'; S.t = 0; H.ship.rotation.y = 0; H.ship.position.copy(H.SHIP_DOCK); } }
  }

  // dev island → QC island: build → design QA (standard only) → cross the bridge → QC test → release from the lighthouse
  updateIsland(dt) {
    const R = this.w.anim.handoff.releaseM, Q = this.w.qc; R.emissiveIntensity = Math.max(0.6, R.emissiveIntensity - dt * 1.5);
    Q.beamM.opacity = 0.14 + Math.min(0.5, (R.emissiveIntensity - 0.6) * 0.12);
    const toQC = j => { j.phase = 'toqc'; j.timer = 3.2; j.f.status = 'qc'; this.hooks.devPop(`🌉 #${j.t.no} qua cầu sang QC`);
      j.card = container(j.t.color, `#${j.t.no}`); j.card.scale.setScalar(0.7); this.scene.add(j.card); };
    for (const j of this.island) {
      j.timer -= dt;
      if (j.phase === 'toqc' && j.card) { const k = clamp01(1 - j.timer / 3.2); j.card.position.lerpVectors(Q.bridgeA, Q.bridgeB, eIO(k)); j.card.position.y += 0.35 + Math.sin(k * Math.PI) * 0.6; }
      if (j.timer > 0) continue;
      if (j.phase === 'build') {
        if (j.t.flow === 'std') { j.phase = 'qa'; j.f.status = 'qa'; j.timer = 3; this.hooks.devPop(`🔍 #${j.t.no} design QA`);
          if (rnd() < 0.15) { j.timer += 2.5; this.hooks.event(`🔍 #${j.t.no} ${j.f.name}: Design QA thấy lệch spacing, dev chỉnh`, 'info'); } }
        else toQC(j);
      }
      else if (j.phase === 'qa') toQC(j);
      else if (j.phase === 'toqc') { j.card.removeFromParent(); j.card = null; j.phase = 'qc'; j.timer = rr(4, 6); this.hooks.qcPop(`🧪 #${j.t.no} QC đang chạy test case`); }
      else if (j.phase === 'qc') {
        if (rnd() < FLOW[j.t.flow].qcFail) { j.phase = 'build'; j.f.status = 'dev'; j.timer = rr(3, 4.5); j.bugs = (j.bugs || 0) + 1;
          this.hooks.qcPop(`🐞 #${j.t.no} QC báo lỗi → trả dev`); this.hooks.event(`🐞 QC: #${j.t.no} ${j.f.name} còn lỗi, trả về dev sửa`, 'bad'); continue; }
        j.phase = 'gone'; j.f.status = 'done'; this.finishFeature(j.f); R.emissiveIntensity = 5; this.w.fireworks(j.t.flow === 'std' ? 5 : 3);
        j.f.userBug = false; j.f.reports = 0; this.w.sendToUsers(j.t.color); this.users += Math.round(rr(60, 220));
        this.hooks.qcPop(`🎆 #${j.t.no} QC pass · release!`); this.hooks.event(`🎆 ${j.f.id} ${j.f.name}: QC pass, hải đăng bật đèn release`, 'good');
        if (j.t.flow === 'std' && !j.f.improved && rnd() < 0.12) { j.f.improved = true; j.f.status = 'improve'; this.hooks.event(`📈 Đo lường sau release: thêm task cải tiến ${j.f.id} ${j.f.name}`, 'info'); }
      }
    }
    this.island = this.island.filter(j => j.phase !== 'gone');
  }

  // user city: a released feature may hit a bug in real use → SOS flare + a hotfix task back in the backlog
  // user city: every USER_BUG_EVERY seconds a user hits a bug → SOS flare. A live feature becomes a hotfix task;
  // if nothing is live and bug-free, another user reports one of the bugs that are already open.
  updateLive(dt) {
    if ((this.bugClock -= dt) > 0) return;
    this.bugClock += USER_BUG_EVERY;
    const live = this.features.filter(f => ['done', 'improve'].includes(f.status) && !f.taken && !f.userBug);
    let f, text;
    if (live.length) {
      f = live[Math.floor(rnd() * live.length)]; f.status = 'bug'; f.userBug = true; f.taken = false; f.reports = 1; f.bugMsg = BUGMSG[Math.floor(rnd() * BUGMSG.length)];
      this.stats.userBugs = (this.stats.userBugs || 0) + 1; this.ms[this.flow].userBugs++;
      text = `🆘 User báo lỗi ${f.id} ${f.name}: ${f.bugMsg}`;
    } else {
      const open = this.features.filter(f => f.userBug); if (!open.length) return;
      f = open[Math.floor(rnd() * open.length)]; f.reports++;
      text = `🆘 Thêm user báo lỗi ${f.id}: ${f.bugMsg} (${f.reports} báo cáo)`;
    }
    this.hooks.event(text, 'bad'); this.hooks.userPop?.(`🆘 ${f.id}: ${f.bugMsg}`); this.w.flare();
  }
  get openReports() { return this.features.reduce((n, f) => n + (f.userBug ? f.reports || 1 : 0), 0); }
  get openBugs() { return this.features.filter(f => f.userBug).length; }

  // trucks at / heading into a station (for the detail panel)
  at(key) {
    if (key === 'dev' || key === 'qc' || key === 'user') return [];
    if (key === 'define') return this.trucks.filter(tr => tr.lot === 'research' && tr.mode === 'parked' && tr.defineT && tr.timer <= tr.defineT);
    if (key === 'research') return this.trucks.filter(tr => tr.task && ((tr.lot === 'research' && !(tr.mode === 'parked' && tr.defineT && tr.timer <= tr.defineT)) || (tr.mode === 'drive' && tr.stop === 'research')));
    const L = this.w.L, d = this.stopD[key];
    if (key === 'lot') return this.trucks.filter(tr => tr.offroad && tr.lot === 'task');
    return this.trucks.filter(tr => tr.task && (tr.lot === key || (tr.mode === 'dwell' && tr.dwellKey === key) || (tr.mode === 'wait' && key === 'handoff') || (tr.mode === 'drive' && tr.stop === key && ((d - tr.d) % L + L) % L < 20)));
  }
}
