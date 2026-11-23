/* LapFit · so sánh CPU và GPU bằng biểu đồ.
   Dữ liệu: window.CHIPS (build-data.mjs, từ research/benchmarks.json). Chỉ vẽ số có nguồn; chip thiếu số được liệt kê là "chưa có".
   Màu theo hãng (thứ tự cố định, đã kiểm tra bằng validate_palette: đạt CVD và độ tách màu; vàng, aqua, hồng dưới 3:1 so với nền
   nên mọi điểm đều có nhãn tên khi chọn, có chú giải và bảng đối đầu bằng chữ). */
(() => {
  const C = window.CHIPS || { cpus: {}, gpus: {} }, L = window.LAPTOPS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const nz = (v) => v !== null && v !== undefined;
  const fmt = (v, d = 0) => (nz(v) ? Number(v).toLocaleString('vi-VN', { maximumFractionDigits: d }) : 'chưa có');
  const vnd = (n) => (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const COLOR = { intel: '#2a78d6', amd: '#eb6834', apple: '#1baf7a', qualcomm: '#eda100', nvidia: '#e87ba4' };
  const VENDOR = { intel: 'Intel', amd: 'AMD', apple: 'Apple', qualcomm: 'Qualcomm', nvidia: 'NVIDIA' };
  const AB = { a: '#2a78d6', b: '#eb6834' };
  const shortGpu = (k) => k.replace(/^NVIDIA GeForce /, '').replace(/ Laptop/, '').replace(/^Qualcomm /, '').replace(/ \((\d\.\d) TFLOPS\)/, '').replace(/^Intel UHD Graphics \/ Intel Graphics/, 'Intel Graphics');
  const shortCpu = (k) => k.replace(/^(Intel|AMD) /, '');
  const usedBy = (kind, key) => {
    const ls = L.filter((l) => (kind === 'cpu' ? l.cpuKey : l.gpuKey) === key);
    return ls.length ? `${ls.length} mẫu, từ ${vnd(Math.min(...ls.map((l) => l.price)))}` : 'không có mẫu';
  };

  /* ---------------------------------------------------------------- shared tooltip */
  const tip = document.createElement('div'); tip.className = 'chart-tip'; tip.hidden = true; tip.setAttribute('role', 'status');
  document.body.appendChild(tip);
  const showTip = (html, x, y) => {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect(), pad = 12;
    let left = x + pad, top = y + pad;
    if (left + r.width > innerWidth - 8) left = x - r.width - pad;
    if (top + r.height > innerHeight - 8) top = y - r.height - pad;
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = Math.max(8, top) + 'px';
  };
  const hideTip = () => { tip.hidden = true; };

  /* ---------------------------------------------------------------- legend */
  const legend = (vendors) => vendors.map((v) => `<li><i style="--c:${COLOR[v]}"></i>${VENDOR[v]}</li>`).join('');
  $('#cpu-legend').innerHTML = legend(['intel', 'amd', 'apple', 'qualcomm']);
  $('#gpu-legend').innerHTML = legend(['intel', 'amd', 'apple', 'qualcomm', 'nvidia']);

  /* ---------------------------------------------------------------- selects */
  const cpuKeys = Object.keys(C.cpus).sort((x, y) => (C.cpus[y].cb2024_multi ?? -1) - (C.cpus[x].cb2024_multi ?? -1));
  const gpuKeys = Object.keys(C.gpus).sort((x, y) => (C.gpus[y].steel_nomad ?? -1) - (C.gpus[x].steel_nomad ?? -1));
  const fill = (sel, keys, short) => { sel.innerHTML = keys.map((k) => `<option value="${esc(k)}">${esc(short(k))}</option>`).join(''); };
  const cA = $('#cpu-a'), cB = $('#cpu-b'), gA = $('#gpu-a'), gB = $('#gpu-b');
  fill(cA, cpuKeys, shortCpu); fill(cB, cpuKeys, shortCpu); fill(gA, gpuKeys, shortGpu); fill(gB, gpuKeys, shortGpu);
  const pickDefault = (sel, want, i) => { sel.value = want.find((k) => [...sel.options].some((o) => o.value === k)) || sel.options[i].value; };
  pickDefault(cA, ['Apple M5 (10-core)'], 0); pickDefault(cB, ['Intel Core Ultra X7 358H', 'AMD Ryzen AI 9 465'], 1);
  pickDefault(gA, ['NVIDIA GeForce RTX 5050 Laptop'], 0); pickDefault(gB, ['NVIDIA GeForce RTX 5060 Laptop'], 1);

  /* ---------------------------------------------------------------- CPU scatter: single (x) vs multi (y), Cinebench 2024 */
  const drawCpuChart = () => {
    const pts = cpuKeys.filter((k) => nz(C.cpus[k].cb2024_single) && nz(C.cpus[k].cb2024_multi));
    const W = 640, H = 340, m = { l: 56, r: 20, t: 12, b: 40 };
    const xs = pts.map((k) => C.cpus[k].cb2024_single), ys = pts.map((k) => C.cpus[k].cb2024_multi);
    const x0 = Math.floor((Math.min(...xs) - 5) / 20) * 20, x1 = Math.ceil((Math.max(...xs) + 5) / 20) * 20;
    const y1 = Math.ceil(Math.max(...ys) / 500) * 500;
    const X = (v) => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r), Y = (v) => H - m.b - (v / y1) * (H - m.t - m.b);
    let g = '';
    for (let v = 0; v <= y1; v += 500) g += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    for (let v = x0; v <= x1; v += 20) g += `<text class="tick" x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle">${v}</text>`;
    g += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}"/>`;
    g += `<text class="axis-title" x="${(m.l + W - m.r) / 2}" y="${H - 6}" text-anchor="middle">Đơn nhân (cao hơn: phản hồi nhanh hơn khi gõ code, mở app)</text>`;
    g += `<text class="axis-title" transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">Đa nhân (biên dịch, máy ảo, Docker)</text>`;
    const sel = { [cA.value]: 'a', [cB.value]: 'b' };
    const order = pts.filter((p) => !sel[p]).concat(pts.filter((p) => sel[p])); // the chosen two drawn last, on top
    for (const k of order) {
      const c = C.cpus[k], cx = X(c.cb2024_single), cy = Y(c.cb2024_multi), s = sel[k];
      g += `<g class="dot${s ? ' is-' + s : ''}" data-k="${esc(k)}">
        <circle class="hit" cx="${cx}" cy="${cy}" r="12"/>
        ${s ? `<circle class="ring" cx="${cx}" cy="${cy}" r="11" style="stroke:${AB[s]}"/>` : ''}
        <circle class="mark" cx="${cx}" cy="${cy}" r="${s ? 7 : 6}" style="fill:${COLOR[c.brand]}"/>
        ${s ? `<text class="dot-label" x="${cx + (cx > W * 0.7 ? -14 : 14)}" y="${cy + 4}" text-anchor="${cx > W * 0.7 ? 'end' : 'start'}">${s.toUpperCase()} · ${esc(shortCpu(k))}</text>` : ''}
      </g>`;
    }
    const svg = $('#cpu-chart');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = g;
    const miss = cpuKeys.filter((k) => !pts.includes(k));
    $('#cpu-missing').textContent = miss.length ? `Chưa có Cinebench 2024 nên không có trên biểu đồ (${miss.length} chip): ${miss.map(shortCpu).join(', ')}. Bảng đối đầu vẫn hiện Geekbench 6 nếu có.` : '';
  };
  const cpuTip = (k) => {
    const c = C.cpus[k];
    return `<b>${esc(k)}</b><br>Cinebench 2024: ${fmt(c.cb2024_single, 1)} đơn nhân · ${fmt(c.cb2024_multi)} đa nhân<br>Geekbench 6: ${fmt(c.gb6_single)} · ${fmt(c.gb6_multi)}<br>${esc(c.cores_threads || 'Số nhân chưa có')}<br><span>${usedBy('cpu', k)} · bấm để so sánh</span>`;
  };

  /* ---------------------------------------------------------------- GPU bars: Steel Nomad, linear from zero */
  const drawGpuChart = () => {
    const rows = gpuKeys.filter((k) => nz(C.gpus[k].steel_nomad));
    const max = Math.max(...rows.map((k) => C.gpus[k].steel_nomad));
    const sel = { [gA.value]: 'a', [gB.value]: 'b' };
    $('#gpu-chart').innerHTML = rows.map((k) => {
      const g = C.gpus[k], s = sel[k];
      return `<li class="bar-row${s ? ' is-' + s : ''}" data-k="${esc(k)}">
        <span class="bar-row__name">${s ? `<b class="ab ab--${s}">${s.toUpperCase()}</b>` : ''}${esc(shortGpu(k))}</span>
        <span class="bar-row__track"><i style="--w:${(g.steel_nomad / max) * 100}%;--c:${COLOR[g.vendor]}"></i><span class="bar-row__val">${fmt(g.steel_nomad)}</span></span>
      </li>`;
    }).join('');
    const miss = gpuKeys.filter((k) => !rows.includes(k));
    $('#gpu-missing').textContent = miss.length ? `Chưa có Steel Nomad (${miss.length}): ${miss.map(shortGpu).join(', ')}.` : '';
  };
  const gpuTip = (k) => {
    const g = C.gpus[k];
    return `<b>${esc(k)}</b><br>Steel Nomad: ${fmt(g.steel_nomad)} · Time Spy: ${fmt(g.timespy_graphics)}<br>VRAM: ${esc(g.vram || 'chưa có')} · TGP: ${esc(g.tgp_w || 'không áp dụng')}<br><span>${usedBy('gpu', k)} · bấm để so sánh</span>`;
  };

  /* ---------------------------------------------------------------- head to head */
  const duel = (box, a, b, rows, head) => {
    const html = rows.map(([label, va, vb, unit, higherBetter = true]) => {
      if (!nz(va) && !nz(vb)) return `<div class="duel__row"><span class="duel__k">${label}</span><span class="duel__na">Cả hai: chưa có</span></div>`;
      const mx = Math.max(nz(va) ? va : 0, nz(vb) ? vb : 0) || 1;
      const line = (v, s) => `<span class="duel__line"><i style="--w:${nz(v) ? (v / mx) * 100 : 0}%;--c:${AB[s]}"></i><b>${nz(v) ? fmt(v, v < 100 && v % 1 ? 1 : 0) + (unit || '') : '<span class="duel__na">chưa có</span>'}</b></span>`;
      return `<div class="duel__row"><span class="duel__k">${label}</span>${line(va, 'a')}${line(vb, 'b')}</div>`;
    }).join('');
    box.innerHTML = head + html;
  };
  const pct = (x, y) => Math.round((x / y - 1) * 100);
  const lead = (na, nb, va, vb, what) => {
    if (!nz(va) || !nz(vb)) return `Chưa đủ số ${what} để so ${esc(na)} với ${esc(nb)}.`;
    if (va === vb) return `${esc(na)} và ${esc(nb)} ngang nhau ở ${what}.`;
    return va > vb ? `<b>${esc(na)}</b> cao hơn ${pct(va, vb)}% ở ${what}.` : `<b>${esc(nb)}</b> cao hơn ${pct(vb, va)}% ở ${what}.`;
  };
  const num = (s) => { const m = String(s ?? '').match(/[\d.]+/); return m ? +m[0] : null; };
  const drawCpuDuel = () => {
    const a = C.cpus[cA.value], b = C.cpus[cB.value];
    const head = `<p class="duel__lead">${lead(shortCpu(cA.value), shortCpu(cB.value), a.cb2024_multi, b.cb2024_multi, 'đa nhân (Cinebench 2024)')}</p>`;
    duel($('#cpu-duel'), a, b, [
      ['Đa nhân CB2024', a.cb2024_multi, b.cb2024_multi], ['Đơn nhân CB2024', a.cb2024_single, b.cb2024_single],
      ['Đa nhân GB6', a.gb6_multi, b.gb6_multi], ['Đơn nhân GB6', a.gb6_single, b.gb6_single],
      ['NPU (TOPS)', num(a.npu_tops), num(b.npu_tops)],
    ], head);
    $('#cpu-meta').innerHTML = [[cA.value, a, 'a'], [cB.value, b, 'b']].map(([k, c, s]) =>
      `<li><b class="ab ab--${s}">${s.toUpperCase()}</b>${esc(c.cores_threads || 'số nhân chưa có')}, TDP ${esc(c.tdp_w || 'chưa có')} W · ${usedBy('cpu', k)}${c.source ? ` · <a href="${c.source}" target="_blank" rel="noopener">nguồn</a>` : ''}</li>`).join('');
  };
  const drawGpuDuel = () => {
    const a = C.gpus[gA.value], b = C.gpus[gB.value];
    const head = `<p class="duel__lead">${lead(shortGpu(gA.value), shortGpu(gB.value), a.steel_nomad, b.steel_nomad, 'Steel Nomad')}</p>`;
    duel($('#gpu-duel'), a, b, [
      ['Steel Nomad', a.steel_nomad, b.steel_nomad], ['Time Spy', a.timespy_graphics, b.timespy_graphics],
      ['VRAM', num(a.vram), num(b.vram), ' GB'],
    ], head);
    $('#gpu-meta').innerHTML = [[gA.value, a, 'a'], [gB.value, b, 'b']].map(([k, g, s]) =>
      `<li><b class="ab ab--${s}">${s.toUpperCase()}</b>${g.vendor === 'nvidia' ? `TGP ${esc(g.tgp_w || 'chưa có')}` : 'GPU tích hợp'} · ${usedBy('gpu', k)}${g.source ? ` · <a href="${g.source}" target="_blank" rel="noopener">nguồn</a>` : ''}</li>`).join('');
  };

  const cpuAll = () => { drawCpuChart(); drawCpuDuel(); };
  const gpuAll = () => { drawGpuChart(); drawGpuDuel(); };
  [cA, cB].forEach((s) => s.addEventListener('change', cpuAll));
  [gA, gB].forEach((s) => s.addEventListener('change', gpuAll));

  /* hover and click: a chip clicked goes to slot B, the B chip moves to A */
  const take = (a, b, k, redraw) => { if (k === a.value || k === b.value) return; a.value = b.value; b.value = k; redraw(); };
  const cpuSvg = $('#cpu-chart');
  cpuSvg.addEventListener('pointermove', (e) => { const d = e.target.closest('.dot'); d ? showTip(cpuTip(d.dataset.k), e.clientX, e.clientY) : hideTip(); });
  cpuSvg.addEventListener('pointerleave', hideTip);
  cpuSvg.addEventListener('click', (e) => { const d = e.target.closest('.dot'); if (d) take(cA, cB, d.dataset.k, cpuAll); });
  const gpuList = $('#gpu-chart');
  gpuList.addEventListener('pointermove', (e) => { const r = e.target.closest('.bar-row'); r ? showTip(gpuTip(r.dataset.k), e.clientX, e.clientY) : hideTip(); });
  gpuList.addEventListener('pointerleave', hideTip);
  gpuList.addEventListener('click', (e) => { const r = e.target.closest('.bar-row'); if (r) take(gA, gB, r.dataset.k, gpuAll); });
  addEventListener('scroll', hideTip, { passive: true });

  cpuAll(); gpuAll();
})();
