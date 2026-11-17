// Mini game ở khu giải trí: chơi trong một hộp thoại nổi trên bản đồ. Game tự viết, cơ chế đơn giản.
export const GAMES = [
  { id: 'bug', icon: '🐞', name: 'Bắt Bug', desc: 'Bug bò lên màn hình, bấm thật nhanh để diệt. 25 giây.', color: '#ff5a1f' },
  { id: 'pixel', icon: '📐', name: 'Căn Pixel', desc: 'Dừng khung đúng giữa vạch căn. 5 lượt, càng lệch ít càng nhiều điểm.', color: '#3fb5ff' },
  { id: 'memory', icon: '🧩', name: 'Lật Thẻ Icon', desc: 'Tìm 8 cặp icon thiết kế giống nhau với ít lượt lật nhất.', color: '#7b5cff' },
  { id: 'hex', icon: '🎨', name: 'Đoán Mã Màu', desc: 'Nhìn ô màu, chọn đúng mã HEX. 10 câu, mỗi câu 8 giây.', color: '#2bd47d' },
];

const best = {
  get(id) { try { return +localStorage.getItem('dt-best-' + id) || 0; } catch { return 0; } },
  set(id, v) { try { localStorage.setItem('dt-best-' + id, v); } catch {} },
};
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const rnd = n => Math.floor(Math.random() * n);

let root = null, cleanup = null, keyHandler = null;
export const isGameOpen = () => !!root && !root.hidden;

export function openGame(id) {
  root ||= document.getElementById('game');
  closeGame();
  const g = GAMES.find(x => x.id === id); if (!g) return;
  root.hidden = false;
  root.innerHTML = `<div class="gbox" style="--gc:${g.color}">
    <header><span class="gi">${g.icon}</span><div><b>${g.name}</b><small>${g.desc}</small></div><button class="gx" aria-label="Đóng">×</button></header>
    <div class="ghud"><span>Điểm <b class="gs">0</b></span><span class="gt"></span><span>Kỷ lục <b class="gb">${best.get(id)}</b></span></div>
    <div class="gstage"></div><footer class="gfoot"></footer></div>`;
  root.querySelector('.gx').onclick = closeGame;
  root.onclick = e => { if (e.target === root) closeGame(); };
  const ui = { stage: root.querySelector('.gstage'), score: root.querySelector('.gs'), time: root.querySelector('.gt'), foot: root.querySelector('.gfoot'), best: root.querySelector('.gb') };
  const finish = (score, text) => {
    const b = best.get(id), rec = score > b; if (rec) { best.set(id, score); ui.best.textContent = score; }
    ui.foot.innerHTML = `<div class="gend"><b>${text}</b>${rec ? '<em>🏆 Kỷ lục mới!</em>' : ''}<button class="gagain">Chơi lại</button><button class="gback">Chọn game khác</button></div>`;
    ui.foot.querySelector('.gagain').onclick = () => openGame(id);
    ui.foot.querySelector('.gback').onclick = () => { closeGame(); root.dispatchEvent(new CustomEvent('pick')); };
  };
  cleanup = { bug: playBug, pixel: playPixel, memory: playMemory, hex: playHex }[id](ui, finish);
  keyHandler = e => { if (root.hidden) return; if (e.key === 'Escape') closeGame(); else ui.keys?.(e); e.stopImmediatePropagation(); if (e.key === ' ') e.preventDefault(); };
  addEventListener('keydown', keyHandler, true);
}
export function closeGame() {
  if (cleanup) { cleanup(); cleanup = null; }
  if (keyHandler) { removeEventListener('keydown', keyHandler, true); keyHandler = null; }
  if (root) { root.hidden = true; root.innerHTML = ''; }
}

// ---------- 1. Bắt Bug: whack the bugs on a 4×4 board of UI cards ----------
function playBug(ui, finish) {
  let score = 0, t = 25, alive = true;
  const grid = el('div', 'gbug'); ui.stage.appendChild(grid);
  const cells = Array.from({ length: 16 }, () => { const c = el('button', 'cell', '<i></i>'); grid.appendChild(c); return c; });
  const timers = [];
  cells.forEach(c => c.onclick = () => { if (!alive) return; if (c.classList.contains('on')) { c.classList.remove('on'); c.classList.add('hit'); setTimeout(() => c.classList.remove('hit'), 250); score += 1; ui.score.textContent = score; } });
  const spawn = () => { if (!alive) return; const free = cells.filter(c => !c.classList.contains('on')); const c = free[rnd(free.length)];
    c.firstChild.textContent = ['🐞', '🐛', '🪲', '🦗'][rnd(4)]; c.classList.add('on');
    timers.push(setTimeout(() => c.classList.remove('on'), Math.max(550, 1100 - (25 - t) * 22))); timers.push(setTimeout(spawn, Math.max(330, 700 - (25 - t) * 15))); };
  ui.time.textContent = `⏱ ${t}s`; spawn();
  const tick = setInterval(() => { t--; ui.time.textContent = `⏱ ${t}s`; if (t <= 0) { alive = false; clearInterval(tick); cells.forEach(c => c.classList.remove('on')); finish(score, `Diệt ${score} bug trong 25 giây`); } }, 1000);
  return () => { alive = false; clearInterval(tick); timers.forEach(clearTimeout); };
}

// ---------- 2. Căn Pixel: stop the sliding frame on the guide ----------
function playPixel(ui, finish) {
  let W = 420, round = 0, score = 0, x = 0, dir = 1, speed = 260, raf = 0, last = 0, stopped = false;
  const box = el('div', 'gpix', `<div class="guide"></div><div class="frame"><span>Button</span></div><p class="hint">Bấm vào khung hoặc nhấn phím cách để dừng</p><p class="res"></p>`);
  ui.stage.appendChild(box);
  W = box.clientWidth || 420;   // fits narrow screens too
  const frame = box.querySelector('.frame'), res = box.querySelector('.res'), FW = 120, target = (W - FW) / 2;
  const loop = ts => { const dt = last ? (ts - last) / 1000 : 0; last = ts;
    if (!stopped) { x += dir * speed * dt; if (x <= 0) { x = 0; dir = 1; } if (x >= W - FW) { x = W - FW; dir = -1; } frame.style.transform = `translateX(${x}px)`; }
    raf = requestAnimationFrame(loop); };
  const stop = () => {
    if (stopped || round >= 5) return; stopped = true; round++;
    const off = Math.round(Math.abs(x - target)), pts = Math.max(0, 100 - off * 4); score += pts; ui.score.textContent = score;
    res.innerHTML = off === 0 ? '🎯 Chuẩn từng pixel! +100' : `Lệch ${off}px · +${pts}`; frame.classList.toggle('good', off <= 3);
    ui.time.textContent = `Lượt ${round}/5`;
    if (round >= 5) return setTimeout(() => finish(score, `Tổng ${score}/500 điểm`), 600);
    setTimeout(() => { stopped = false; frame.classList.remove('good'); speed += 70; res.textContent = ''; }, 900);
  };
  frame.onclick = stop; box.onclick = e => { if (e.target === box) stop(); };
  ui.keys = e => { if (e.key === ' ' || e.key === 'Enter') stop(); };
  ui.time.textContent = 'Lượt 1/5'; raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

// ---------- 3. Lật Thẻ Icon: memory pairs ----------
function playMemory(ui, finish) {
  const ICONS = ['🎨', '✏️', '📐', '🖌️', '🔤', '📱', '💡', '🧩'];
  const deck = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);
  const grid = el('div', 'gmem'); ui.stage.appendChild(grid);
  let open = [], moves = 0, found = 0, lock = false; const t0 = performance.now();
  const timer = setInterval(() => ui.time.textContent = `⏱ ${Math.floor((performance.now() - t0) / 1000)}s`, 250);
  deck.forEach(icon => { const c = el('button', 'card', `<span class="b">?</span><span class="f">${icon}</span>`); c.dataset.icon = icon; grid.appendChild(c);
    c.onclick = () => {
      if (lock || c.classList.contains('up')) return; c.classList.add('up'); open.push(c);
      if (open.length < 2) return; moves++; const [a, b] = open; open = [];
      if (a.dataset.icon === b.dataset.icon) { a.classList.add('done'); b.classList.add('done'); found++;
        const score = Math.max(0, 200 - moves * 8); ui.score.textContent = score;
        if (found === 8) { clearInterval(timer); finish(score, `Xong trong ${moves} lượt · ${Math.floor((performance.now() - t0) / 1000)} giây`); } }
      else { lock = true; setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); lock = false; }, 700); }
      ui.time.title = `${moves} lượt`;
    }; });
  return () => clearInterval(timer);
}

// ---------- 4. Đoán Mã Màu: pick the right HEX ----------
function playHex(ui, finish) {
  const hex = () => '#' + Array.from({ length: 3 }, () => (rnd(14) * 16 + 16 + rnd(16)).toString(16).padStart(2, '0')).join('').toUpperCase();
  const near = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return '#' + c.map(v => Math.min(255, Math.max(0, v + (rnd(2) ? 1 : -1) * (40 + rnd(60))))).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(); };
  const box = el('div', 'ghex', `<div class="sw"></div><div class="opts"></div><p class="res"></p>`); ui.stage.appendChild(box);
  const sw = box.querySelector('.sw'), opts = box.querySelector('.opts'), res = box.querySelector('.res');
  let q = 0, score = 0, t = 8, tick = null, answered = false;
  const next = () => {
    if (q >= 10) { clearInterval(tick); return finish(score, `Đúng ${score / 10}/10 màu`); }
    q++; answered = false; t = 8; res.textContent = ''; const right = hex(), list = [right, near(right), near(right), near(right)].sort(() => Math.random() - 0.5);
    sw.style.background = right; opts.innerHTML = ''; ui.time.textContent = `Câu ${q}/10 · ${t}s`;
    list.forEach(h => { const b = el('button', 'opt', h); opts.appendChild(b); b.onclick = () => {
      if (answered) return; answered = true; const ok = h === right; if (ok) { score += 10; ui.score.textContent = score; }
      b.classList.add(ok ? 'ok' : 'no'); [...opts.children].find(x => x.textContent === right).classList.add('ok');
      res.textContent = ok ? '✓ Chuẩn mắt designer!' : `✗ Đáp án ${right}`; setTimeout(next, 900); }; });
  };
  tick = setInterval(() => { if (answered) return; t--; ui.time.textContent = `Câu ${q}/10 · ${t}s`; if (t <= 0) { answered = true; res.textContent = 'Hết giờ!'; [...opts.children].forEach(b => b.disabled = true); setTimeout(next, 800); } }, 1000);
  next();
  return () => clearInterval(tick);
}
