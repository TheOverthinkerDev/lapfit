/* LapFit · bộ chấm điểm laptop theo nhu cầu sinh viên CNTT.
   Mọi điểm 0–100. Hồ sơ nhu cầu (need) lấy giá trị lớn nhất từ ngôn ngữ, nghề nghiệp, giải trí;
   mỗi laptop được chấm "có" (have) trên cùng thang, rồi so từng chiều. */
(() => {
  const L = window.LAPTOPS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const vnd = (n) => (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';

  /* ---------------------------------------------------------------- nhu cầu theo lựa chọn */
  const LANG = {
    python: { cpu: 30, ram: 16 }, java: { cpu: 38, ram: 16 }, cpp: { cpu: 40, ram: 16 }, csharp: { cpu: 38, ram: 16 },
    js: { cpu: 32, ram: 16 }, ts: { cpu: 34, ram: 16 }, swift: { cpu: 42, ram: 16, mac: 1 }, kotlin: { cpu: 46, ram: 16, gpu: 25 },
    dart: { cpu: 44, ram: 16, gpu: 25 }, go: { cpu: 34, ram: 16 }, rust: { cpu: 48, ram: 16 }, php: { cpu: 25, ram: 8 },
    sql: { cpu: 25, ram: 8 }, c: { cpu: 28, ram: 8 },
  };
  const JOB = {
    web:      { cpu: 35, gpu: 5, ram: 16, ssd: 512, disp: 55, why: 'Trình duyệt, VS Code và Node.js chạy cùng lúc' },
    backend:  { cpu: 45, gpu: 5, ram: 24, ssd: 512, why: 'Docker, cơ sở dữ liệu và nhiều service chạy nền' },
    android:  { cpu: 50, gpu: 30, ram: 24, ssd: 512, why: 'Android Studio và máy ảo Android ngốn CPU, RAM' },
    ios:      { cpu: 45, gpu: 25, ram: 16, ssd: 512, mac: 1, why: 'Xcode chỉ chạy trên macOS' },
    ai:       { cpu: 55, gpu: 75, ram: 32, ssd: 1024, cuda: 1, why: 'Huấn luyện mô hình cần GPU NVIDIA (CUDA) và nhiều RAM' },
    data:     { cpu: 42, gpu: 5, ram: 16, ssd: 512, why: 'Pandas, Jupyter và bảng dữ liệu lớn cần RAM' },
    game:     { cpu: 58, gpu: 70, ram: 32, ssd: 1024, cuda: 1, x86: 1, why: 'Unity, Unreal build và chạy thử game nặng' },
    devops:   { cpu: 50, gpu: 5, ram: 32, ssd: 1024, x86: 1, why: 'Nhiều máy ảo, Kubernetes cục bộ' },
    security: { cpu: 42, gpu: 5, ram: 24, ssd: 512, x86: 1, why: 'Máy ảo Kali, Windows lab, công cụ x86' },
    embedded: { cpu: 32, gpu: 5, ram: 16, ssd: 512, x86: 1, why: 'Toolchain, driver nạp mạch thường chỉ có bản x86' },
    uiux:     { cpu: 40, gpu: 35, ram: 16, ssd: 512, disp: 85, why: 'Figma, ảnh và màu sắc cần màn hình chuẩn màu' },
    unsure:   { cpu: 38, gpu: 10, ram: 16, ssd: 512, why: 'Cấu hình cân bằng, dễ đổi hướng sau' },
  };
  const FUN = {
    film:   { disp: 75, why: 'Xem phim: màn OLED, độ sáng cao' },
    esport: { gpu: 45, hz: 120, why: 'Game eSports: 120 Hz trở lên' },
    aaa:    { gpu: 70, cpu: 45, hz: 144, ram: 16, why: 'Game AAA: GPU rời mạnh' },
    video:  { cpu: 58, gpu: 55, ram: 32, disp: 70, ssd: 1024, why: 'Dựng video: CPU, GPU và SSD lớn' },
    stream: { cpu: 50, gpu: 50, ram: 16, why: 'Stream: mã hoá video bằng GPU' },
    music:  { cpu: 40, ram: 16, why: 'Làm nhạc: CPU ổn định, RAM đủ' },
  };
  const CARRY = { daily: { port: 75, w: 0.16 }, some: { port: 45, w: 0.08 }, desk: { port: 0, w: 0.01 } };
  const BATT = { long: { bat: 80, w: 0.13 }, mid: { bat: 50, w: 0.07 }, plug: { bat: 0, w: 0.01 } };

  /* ---------------------------------------------------------------- điểm "có" của từng laptop */
  // null = nguồn chưa có số liệu: không đoán, không coi là yếu hay mạnh
  const nz = (v) => v !== null && v !== undefined;
  // CPU: Cinebench 2024 (trung bình của chip, Notebookcheck): 0.65·đa nhân/2100 + 0.35·đơn nhân/200
  const cpuScore = (l) => (nz(l.cpuMulti) && nz(l.cpuSingle) ? clamp(Math.round(0.65 * (l.cpuMulti / 2100) * 100 + 0.35 * (l.cpuSingle / 200) * 100)) : null);
  // GPU: 3DMark Steel Nomad (chạy được trên Windows, macOS, ARM), thang log: 150 -> 0, 6.000 (RTX 5090 laptop) -> 100
  const gpuScore = (l) => (nz(l.gpuSN) ? clamp(Math.round((100 * Math.log(Math.max(l.gpuSN, 150) / 150)) / Math.log(40))) : null);
  const dispScore = (l) => {
    const base = { IPS: 52, OLED: 84, 'mini-LED': 88, 'Liquid Retina': 72, 'Liquid Retina XDR': 92 }[l.panel];
    if (!nz(base)) return null;
    let s = base;
    if (l.resW >= 2500) s += 6; if (l.hz >= 120) s += 4; if (nz(l.nits) && l.nits >= 500) s += 4; if (nz(l.nits) && l.nits < 300) s -= 12;
    return clamp(s);
  };
  const portScore = (l) => (nz(l.weight) ? clamp(Math.round(100 - (l.weight - 1.1) * 62)) : null);
  // pin: chỉ số giờ đo theo cùng một chuẩn (Notebookcheck Wi-Fi 150 nit); máy khác: chưa có
  const batScore = (l) => (nz(l.batHours) ? clamp(Math.round(l.batHours * 6.8)) : null);
  const ramScore = (gb) => (nz(gb) ? clamp(Math.round(gb / 32 * 100), 0, 100) : null);
  const kg = (w) => (nz(w) ? w.toLocaleString('vi-VN') + ' kg' : 'chưa có');
  const txt = (v) => (nz(v) && v !== '' ? v : 'chưa có');
  L.forEach((l) => { l.s = { cpu: cpuScore(l), gpu: gpuScore(l), disp: dispScore(l), port: portScore(l), bat: batScore(l), ram: ramScore(l.ram) }; });

  /* ---------------------------------------------------------------- đọc form */
  const form = $('#tool');
  const read = () => {
    const pick = (n) => $$(`input[name="${n}"]:checked`, form).map((i) => i.value);
    const one = (n) => (pick(n)[0] || 'any');
    return {
      langs: pick('lang'), job: one('job'), fun: pick('fun').filter((v) => v !== 'none'),
      budget: +$('#budget').value * 1e6, carry: one('carry'), batt: one('batt'), os: one('os'), years: $('#years').checked,
      cpuBrand: one('cpub'), gpuPref: one('gpup'), ramMin: one('ramp'), size: one('size'), panel: one('panel'), hz: one('hz'), material: one('mat'),
    };
  };

  const profile = (a) => {
    const n = { cpu: 30, gpu: 5, ram: 8, ssd: 256, disp: 40, hz: 60, port: CARRY[a.carry]?.port ?? 60, bat: BATT[a.batt]?.bat ?? 55, mac: 0, cuda: 0, x86: 0 };
    const why = [];
    const take = (o) => { if (!o) return; for (const k of ['cpu', 'gpu', 'ram', 'ssd', 'disp', 'hz']) if (o[k] > n[k]) n[k] = o[k]; for (const k of ['mac', 'cuda', 'x86']) if (o[k]) n[k] = 1; };
    a.langs.forEach((id) => take(LANG[id]));
    const job = JOB[a.job] || JOB.unsure; take(job); why.push(job.why);
    a.fun.forEach((id) => { take(FUN[id]); why.push(FUN[id].why); });
    if (a.os === 'linux') n.x86 = 1;
    if (a.years) { n.cpu = clamp(Math.round(n.cpu * 1.08)); n.gpu = clamp(Math.round(n.gpu * 1.08)); }
    if (a.ramMin !== 'any') n.ram = Math.max(n.ram, +a.ramMin);
    if (a.gpuPref === 'mid') n.gpu = Math.max(n.gpu, 70); if (a.gpuPref === 'high') n.gpu = Math.max(n.gpu, 82);
    if (a.panel === 'oled' || a.panel === 'miniled') n.disp = Math.max(n.disp, 80);
    if (a.hz !== 'any') n.hz = Math.max(n.hz, +a.hz);
    n.ramScore = ramScore(n.ram);
    return { n, why };
  };

  /* ---------------------------------------------------------------- so khớp */
  // chưa có số liệu: trung tính (0,7) khi bạn có nhu cầu, để máy thiếu dữ liệu không lên đầu cũng không bị loại
  // an unknown score never ranks above a known weak one when the need is high
  const unknownFit = (need) => (need >= 60 ? 0 : need >= 40 ? 0.25 : need >= 25 ? 0.5 : 0.8);
  const fit = (have, need, soft = 1.6) => (need <= 5 ? 1 : !nz(have) ? unknownFit(need) : have >= need ? 1 : clamp(1 - ((need - have) / need) * soft, 0, 1));
  const verdict = (have, need) => {
    if (need <= 5) return ['ok', 'Không đòi hỏi'];
    if (!nz(have)) return ['na', 'Chưa có'];
    const d = have - need;
    if (d >= 15) return ['plus', 'Dư sức']; if (d >= 0) return ['ok', 'Đáp ứng']; if (d >= -10) return ['warn', 'Hơi thiếu']; return ['bad', 'Không đủ'];
  };

  const score = (l, a, P) => {
    const n = P.n, s = l.s, notes = [], warns = [];
    const ramFit = !nz(l.ram) ? 0.7 : l.ram >= n.ram ? 1 : l.ramUp === true ? 0.75 : l.ramUp === null ? 0.5 : 0.35 * (l.ram / n.ram) + 0.2;
    const gw = n.gpu >= 50 ? 0.24 : n.gpu >= 30 ? 0.12 : 0.06;
    const W = { cpu: 0.24, gpu: gw, ram: 0.15, disp: 0.08, port: CARRY[a.carry]?.w ?? 0.08, bat: BATT[a.batt]?.w ?? 0.07, ssd: 0.04 };
    const F = {
      cpu: fit(s.cpu, n.cpu, 2.6), gpu: fit(s.gpu, n.gpu, 2.0), ram: ramFit, disp: fit(s.disp, n.disp, 1.8),
      port: fit(s.port, n.port, 2.0), bat: fit(s.bat, n.bat, 1.8), ssd: !nz(l.ssd) ? 0.85 : l.ssd >= n.ssd ? 1 : 0.7,
    };
    let tot = 0, wsum = 0; for (const k in W) { tot += W[k] * F[k]; wsum += W[k]; }
    let pts = (tot / wsum) * 100;
    // mỗi chiều "Hơi thiếu" hoặc "Không đủ" trừ thêm, để 9x% chỉ dành cho máy đáp ứng đủ mọi chiều
    for (const [have, need] of [[s.cpu, n.cpu], [s.gpu, n.gpu], [s.disp, n.disp], [s.port, n.port], [s.bat, n.bat]]) if (need > 5 && nz(have) && have < need) pts -= have < need - 10 ? 5 : 2.5;
    // dư sức CPU so với nhu cầu: thêm chút điểm cho 4 năm học
    if (nz(s.cpu)) pts += clamp((s.cpu - n.cpu) / 10, 0, 2);
    // nói rõ chiều nào chưa có số liệu
    const unknown = [['CPU', s.cpu, n.cpu], ['GPU', s.gpu, n.gpu], ['pin', s.bat, n.bat]].filter(([, h, nd]) => !nz(h) && nd > 25).map(([k]) => k);
    pts -= unknown.length * 4;
    if (unknown.length) warns.push(`Chưa có số đo ${unknown.join(', ')} cho máy này`);

    // ngân sách
    const over = (l.price - a.budget) / a.budget;
    if (over > 0.15) return null;
    if (over > 0) { pts -= 4 + over * 120; warns.push(`Vượt ngân sách ${vnd(l.price - a.budget)}`); }
    else pts += Math.min(2, (-over) * 5);

    // ràng buộc cứng
    if (n.mac && l.os !== 'mac') { pts -= 40; warns.push('Bạn học Swift hoặc làm iOS: cần MacBook để chạy Xcode'); }
    if (n.x86 && l.arm) { pts -= 16; warns.push('Chip ARM: máy ảo x86 và một số toolchain chưa chạy được'); }
    if (n.cuda && !l.cuda) { pts -= l.os === 'mac' && l.ram >= 24 ? 6 : 12; warns.push(l.os === 'mac' ? 'Không có CUDA; học AI vẫn được với PyTorch MPS, MLX' : 'Không có GPU NVIDIA nên không chạy được CUDA'); }
    if (a.os === 'windows' && l.os !== 'win') pts -= 25; if (a.os === 'mac' && l.os !== 'mac') pts -= 25; if (a.os === 'linux' && l.os === 'mac') pts -= 20;
    if (l.os === 'mac' && a.fun.includes('aaa')) { pts -= 10; warns.push('Ít game AAA chạy trên macOS'); }

    // tuỳ chọn phần cứng
    const pref = (cond, pen) => { if (cond === null) pts -= pen / 2; else if (!cond) pts -= pen; };
    const known = (v, f) => (nz(v) ? f(v) : null);
    if (a.cpuBrand !== 'any') pref(l.cpuBrand === a.cpuBrand, 9);
    if (a.gpuPref === 'igpu') pref(!l.dgpu, 8);
    if (a.gpuPref === 'mid' || a.gpuPref === 'high') pref(l.dgpu, 6);
    if (a.size === 'small') pref(known(l.size, (v) => v <= 14.5), 8); if (a.size === 'big') pref(known(l.size, (v) => v >= 15), 8);
    if (a.panel === 'ips') pref(known(l.panel, (v) => v === 'IPS'), 4); if (a.panel === 'oled') pref(known(l.panel, (v) => v === 'OLED'), 7); if (a.panel === 'miniled') pref(known(l.panel, (v) => /mini-LED|XDR/.test(v)), 7);
    if (a.hz !== 'any') pref(known(l.hz, (v) => v >= +a.hz), 6);
    const mat = (l.material || '').toLowerCase();
    if (a.material === 'metal') pref(known(l.material, () => /nhôm|kim loại|magie|carbon/.test(mat) && !/nhựa/.test(mat)), 6);
    if (a.material === 'light') pref(known(l.material, () => /magie|carbon/.test(mat) || (nz(l.weight) && l.weight <= 1.15)), 6);
    if (a.material === 'plastic') pts += /nhựa/.test(mat) ? 2 : 0;
    if (nz(l.ram) && l.ram < n.ram && l.ramUp === true) notes.push(`Nâng được RAM lên ${n.ram} GB`);
    if (nz(l.ram) && l.ram < n.ram && l.ramUp === false) { pts -= 8; warns.push(`RAM ${l.ram} GB hàn chết, nhu cầu là ${n.ram} GB`); }
    if (nz(l.ram) && l.ram < n.ram && l.ramUp === null) { pts -= 4; warns.push(`RAM ${l.ram} GB; chưa có thông tin nâng cấp RAM`); }

    // điểm mạnh
    const dims = [['cpu', 'CPU'], ['gpu', 'GPU'], ['disp', 'màn hình'], ['port', 'độ gọn nhẹ'], ['bat', 'pin']];
    dims.filter(([k]) => nz(s[k])).map(([k, name]) => [k, name, s[k] - (n[k] || 0)]).filter((d) => d[2] >= 15 && (n[d[0]] || 0) >= 30).sort((x, y) => y[2] - x[2]).slice(0, 2)
      .forEach(([, name]) => notes.unshift(`Dư sức về ${name}`));
    if (l.cuda && n.cuda) notes.unshift('GPU NVIDIA, chạy được CUDA');
    return { l, pct: Math.round(clamp(pts, 0, 98)), notes, warns };
  };

  const rank = (a) => {
    const P = profile(a);
    const unk = (l) => [l.s.cpu, l.s.gpu].filter((v) => !nz(v)).length; // ties: the laptop with more measured data first
    let rows = L.map((l) => score(l, a, P)).filter(Boolean).sort((x, y) => y.pct - x.pct || unk(x.l) - unk(y.l) || x.l.price - y.l.price);
    return { P, rows };
  };

  /* ---------------------------------------------------------------- vẽ hồ sơ nhu cầu */
  const LOGO = { intel: 'intel', amd: 'amd', apple: 'apple', qualcomm: 'qualcomm' };
  const logos = (l) => !LOGO[l.cpuBrand] ? '' : `<span class="logos"><img src="assets/icons/${LOGO[l.cpuBrand]}.svg" alt="${l.cpuBrand === 'qualcomm' ? 'Snapdragon' : l.cpuBrand.toUpperCase()}">${l.dgpu ? '<img src="assets/icons/nvidia.svg" alt="NVIDIA">' : ''}</span>`;
  const level = (v) => (v < 30 ? 'Nhẹ' : v < 55 ? 'Vừa' : v < 75 ? 'Cao' : 'Rất cao');
  const cheapestFor = (key, need) => {
    const c = L.filter((l) => nz(l.s[key]) && l.s[key] >= need).sort((x, y) => x.s[key] - y.s[key])[0];
    return c ? (key === 'cpu' ? c.cpu : c.gpu) : '';
  };
  const drawProfile = (P) => {
    const n = P.n;
    const rows = [
      ['cpu', 'CPU', n.cpu, `Tối thiểu cỡ ${cheapestFor('cpu', n.cpu)}`],
      ['gpu', 'GPU', n.gpu, n.gpu < 30 ? 'GPU tích hợp là đủ' : `Tối thiểu cỡ ${cheapestFor('gpu', n.gpu)}`],
      ['ram', 'RAM', n.ramScore, `${n.ram} GB trở lên, SSD ${n.ssd >= 1024 ? '1 TB' : n.ssd + ' GB'}`],
      ['disp', 'Màn hình', n.disp, n.disp >= 80 ? 'OLED hoặc mini-LED, chuẩn màu' : n.hz >= 120 ? `${n.hz} Hz trở lên` : 'IPS 300 nit trở lên'],
      ['port', 'Gọn nhẹ', n.port, n.port >= 70 ? 'Khoảng 1,5 kg trở xuống' : n.port >= 40 ? 'Dưới 2 kg' : 'Không quan trọng'],
      ['bat', 'Pin', n.bat, n.bat >= 75 ? 'Từ 12 giờ (bài đo Wi-Fi Notebookcheck)' : n.bat >= 45 ? 'Khoảng 7 giờ trở lên' : 'Không quan trọng'],
    ];
    $('#need-list').innerHTML = rows.map(([k, name, v, hint]) => `
      <li class="need">
        <span class="need__name">${name}</span><span class="need__lvl">${level(v)}</span>
        <span class="meter" aria-hidden="true"><i style="--v:${v}%"></i></span>
        <span class="need__hint">${hint}</span>
      </li>`).join('');
    const tags = [];
    if (n.mac) tags.push('Cần macOS'); if (n.cuda) tags.push('Nên có GPU NVIDIA'); if (n.x86) tags.push('Nên dùng chip x86');
    $('#need-tags').innerHTML = tags.map((t) => `<li>${t}</li>`).join('') || '<li>Không có ràng buộc bắt buộc</li>';
  };

  /* ---------------------------------------------------------------- vẽ kết quả */
  const bar = (label, have, need) => {
    const [cls, word] = verdict(have, need);
    return `<li class="cmp cmp--${cls}"><span class="cmp__name">${label}</span><span class="cmp__word">${word}</span>
      <span class="cmp__bar" aria-hidden="true">${nz(have) ? `<i style="--v:${have}%"></i>` : ''}${need > 5 ? `<b style="--n:${need}%"></b>` : ''}</span></li>`;
  };
  const card = (r, i) => {
    const l = r.l, n = rank.P.n;
    return `<article class="card pick">
      <div class="pick__head"><span class="pick__rank">${i + 1}</span>${logos(l)}<span class="pick__pct"><b>${r.pct}%</b> phù hợp</span></div>
      <h3>${l.name}</h3>
      <p class="pick__price">${vnd(l.price)}</p>
      <dl class="pick__spec">
        <div><dt>CPU</dt><dd>${l.cpu}</dd></div><div><dt>GPU</dt><dd>${l.gpu}</dd></div>
        <div><dt>RAM, SSD</dt><dd>${txt(l.ram) + (nz(l.ram) ? ' GB' : '')}${l.ramUp === false ? ' (hàn)' : ''}, ${nz(l.ssd) ? (l.ssd >= 1024 ? l.ssd / 1024 + ' TB' : l.ssd + ' GB') : 'SSD chưa có'}</dd></div>
        <div><dt>Màn hình</dt><dd>${txt(l.screen)}</dd></div><div><dt>Thân máy</dt><dd>${kg(l.weight)}, ${txt(l.material)}</dd></div>
      </dl>
      <ul class="cmps">${bar('CPU', l.s.cpu, n.cpu)}${bar('GPU', l.s.gpu, n.gpu)}${bar('RAM', l.s.ram, n.ramScore)}${bar('Màn hình', l.s.disp, n.disp)}${bar('Gọn nhẹ', l.s.port, n.port)}${bar('Pin', l.s.bat, n.bat)}</ul>
      <button class="link pick__choose" type="button" data-choose="${L.indexOf(l)}">Chọn máy này để gửi</button>
      <ul class="pick__notes">${r.notes.slice(0, 2).map((t) => `<li class="is-good">${t}</li>`).join('')}${r.warns.slice(0, 2).map((t) => `<li class="is-warn">${t}</li>`).join('')}</ul>
    </article>`;
  };
  const drawResults = (res, a) => {
    rank.P = res.P; rank.a = a;
    if (!isComplete()) return drawLocked();
    const top = res.rows.slice(0, 5);
    const box = $('#picks'), more = $('#more');
    const weak = top.length && top[0].pct < 60;
    $('#res-count').textContent = `${res.rows.length} trong ${L.length} mẫu vừa ngân sách ${vnd(a.budget)}` + (weak ? '. Chưa mẫu nào đáp ứng tốt nhu cầu này: cân nhắc tăng ngân sách hoặc bớt yêu cầu.' : '');
    if (!top.length) { box.innerHTML = '<p class="empty">Không có mẫu nào trong ngân sách này. Kéo ngân sách lên hoặc bỏ bớt tuỳ chọn phần cứng.</p>'; more.innerHTML = ''; return; }
    box.innerHTML = top.slice(0, 3).map(card).join('');
    const n = res.P.n;
    more.innerHTML = `<table class="cmp-table"><caption class="sr">So sánh 5 mẫu hợp nhất</caption>
      <thead><tr><th scope="col">Mẫu</th><th scope="col">Phù hợp</th><th scope="col">Giá</th><th scope="col">CPU <span class="muted">cần ${n.cpu}</span></th><th scope="col">GPU <span class="muted">cần ${n.gpu}</span></th><th scope="col">RAM</th><th scope="col">Nặng</th><th scope="col">Lưu ý</th></tr></thead>
      <tbody>${top.map((r, i) => `<tr><th scope="row"><span class="pick__rank">${i + 1}</span>${r.l.name}</th><td><b>${r.pct}%</b></td><td>${vnd(r.l.price)}</td>
        <td><span class="num">${txt(r.l.s.cpu)}</span> ${nz(r.l.s.cpu) ? verdict(r.l.s.cpu, n.cpu)[1] : ''}</td><td><span class="num">${txt(r.l.s.gpu)}</span> ${nz(r.l.s.gpu) ? verdict(r.l.s.gpu, n.gpu)[1] : ''}</td>
        <td>${txt(r.l.ram)} GB</td><td>${kg(r.l.weight)}</td><td>${r.warns[0] || r.notes[0] || 'Cân bằng'}</td></tr>`).join('')}</tbody></table>`;
    drawAdvice(res.P, a);
  };

  // before every question is answered: the list of what is left, and two ghost cards holding the layout
  const drawLocked = () => {
    const m = missing();
    $('#res-count').textContent = 'Kết quả hiện sau khi bạn trả lời đủ câu hỏi';
    $('#picks').innerHTML = `<article class="card pick pick--locked">
        <p class="locked__title">Còn ${m.length} câu chưa trả lời</p>
        <ul class="locked__list">${m.map((g) => `<li>${g[1]}</li>`).join('')}</ul>
        <button class="btn btn--secondary" type="button" data-goto-missing>Trả lời tiếp</button>
      </article>` + '<div class="card pick pick--ghost" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'.repeat(2);
    $('#more').innerHTML = '<p class="locked__note">Bảng so sánh 5 mẫu hợp nhất hiện ở đây khi bạn trả lời xong.</p>';
    ['#adv-min', '#adv-avoid', '#adv-tips'].forEach((sel) => { $(sel).innerHTML = '<li class="na">Hiện sau khi trả lời đủ câu hỏi</li>'; });
  };
  const drawAdvice = (P, a) => {
    const n = P.n;
    const min = [
      ['CPU', n.cpu < 30 ? 'Loại nào cũng đủ' : `Từ ${cheapestFor('cpu', n.cpu)}`],
      ['GPU', n.gpu < 30 ? 'Tích hợp là đủ' : `Từ ${cheapestFor('gpu', n.gpu)}`],
      ['RAM, SSD', `${n.ram} GB, ${n.ssd >= 1024 ? '1 TB' : n.ssd + ' GB'}`],
      ['Màn hình', n.disp >= 80 ? 'OLED hoặc mini-LED' : n.hz >= 120 ? `IPS ${n.hz} Hz` : 'IPS từ 300 nit'],
    ];
    const avoid = [];
    if (n.mac) avoid.push('Laptop Windows: không chạy được Xcode để làm app iOS');
    if (n.x86) avoid.push('Chip ARM (Apple, Snapdragon) nếu bạn cần máy ảo x86');
    if (n.cuda) avoid.push('GPU AMD, Intel nếu bạn muốn chạy CUDA');
    if (n.ram >= 24) avoid.push(`RAM 16 GB hàn chết: không nâng lên ${n.ram} GB được`);
    if (a.carry === 'daily') avoid.push('Máy nặng trên 2 kg khi mang đi học mỗi ngày');
    if (avoid.length < 3) avoid.push('RAM 8 GB: IDE, trình duyệt và Docker chạy cùng lúc sẽ chậm');
    if (avoid.length < 3) avoid.push('Màn dưới 300 nit: khó nhìn ở giảng đường sáng');
    const tips = [
      'RAM hàn chết thì mua bản RAM cao ngay từ đầu',
      'Hỏi giá sinh viên, Apple và nhiều hãng có ưu đãi giáo dục',
      'Thử màn, bàn phím và hỏi bảo hành 2 năm tại cửa hàng',
    ];
    $('#adv-min').innerHTML = min.map(([k, v]) => `<li><span class="muted">${k}</span> ${v}</li>`).join('');
    $('#adv-avoid').innerHTML = avoid.slice(0, 3).map((t) => `<li>${t}</li>`).join('');
    $('#adv-tips').innerHTML = tips.map((t) => `<li>${t}</li>`).join('');
  };

  /* ---------------------------------------------------------------- bảng danh sách */
  let catPage = 0; const PER = 6;
  const drawCatalog = () => {
    const f = $('#cat-filter').value, sort = $('#cat-sort').value;
    let rows = L.filter((l) => f === 'all' || (f === 'thin' && !l.dgpu && l.os !== 'mac') || (f === 'gpu' && l.dgpu) || (f === 'mac' && l.os === 'mac'));
    const hi = (v) => (nz(v) ? v : -1), lo = (v) => (nz(v) ? v : 1e9);
    rows = rows.sort((x, y) => (sort === 'price' ? x.price - y.price : sort === 'cpu' ? hi(y.s.cpu) - hi(x.s.cpu) : sort === 'gpu' ? hi(y.s.gpu) - hi(x.s.gpu) : lo(x.weight) - lo(y.weight)));
    const pages = Math.max(1, Math.ceil(rows.length / PER)); catPage = clamp(catPage, 0, pages - 1);
    $('#cat-page').textContent = `Trang ${catPage + 1} trên ${pages} · ${rows.length} mẫu`;
    $('#cat-prev').disabled = catPage === 0; $('#cat-next').disabled = catPage === pages - 1;
    const full = mc.length >= MC_MAX;
    $('#cat-body').innerHTML = rows.slice(catPage * PER, catPage * PER + PER).map((l) => { const i = L.indexOf(l), on = mc.includes(i); return `<tr>
      <th scope="row">${logos(l)}${l.name}</th><td class="num"><a class="price-link" href="${l.priceSource}" target="_blank" rel="noopener">${vnd(l.price)}</a></td>
      <td>${nz(l.s.cpu) ? `<span class="mini"><i style="--v:${l.s.cpu}%"></i></span><span class="num">${l.s.cpu}</span>` : '<span class="na">chưa có điểm</span>'}<small>${l.cpu}</small></td>
      <td>${nz(l.s.gpu) ? `<span class="mini"><i style="--v:${l.s.gpu}%"></i></span><span class="num">${l.s.gpu}</span>` : '<span class="na">chưa có điểm</span>'}<small>${l.gpu}</small></td>
      <td class="num">${txt(l.ram)} GB</td><td>${txt(l.screen)}</td><td class="num">${kg(l.weight)}</td>
      <td><label class="mc-toggle"><input type="checkbox" data-mc="${i}"${on ? ' checked' : ''}${full && !on ? ' disabled' : ''}>So sánh</label></td></tr>`; }).join('');
  };

  /* ---------------------------------------------------------------- so sánh nhiều laptop (2 đến 4) */
  // only fields the dataset holds; a field it lacks reads "chưa có", never a guess
  const NA = '<span class="na">chưa có</span>';
  const has = (v) => v !== undefined && v !== null && v !== '';
  const gb = (v) => (v >= 1024 ? v / 1024 + ' TB' : v + ' GB');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }
  function measuredText(l) {
    const m = l.measured; if (!m) return NA + ' <small>(chưa có bài đánh giá đúng cấu hình)</small>';
    const parts = [];
    if (nz(m.cb)) parts.push(`Cinebench 2024 đa nhân ${m.cb}`);
    if (nz(m.ts)) parts.push(`Time Spy ${m.ts}`);
    if (nz(m.bat)) parts.push(`pin ${m.bat.toLocaleString('vi-VN')} giờ (${m.batType})`);
    if (nz(m.nits)) parts.push(`độ sáng đo ${m.nits} nit`);
    if (!parts.length) return NA;
    return `<small>${parts.join('; ')}${m.src ? ` · <a href="${m.src}" target="_blank" rel="noopener">${host(m.src)}</a>` : ''}</small>`;
  }
  function sourceLinks(l) {
    const urls = [...new Set([l.priceSource, ...(l.sources || []), l.cpuSrc, l.gpuSrc].filter(Boolean))].slice(0, 5);
    return '<small>' + urls.map((u) => `<a href="${u}" target="_blank" rel="noopener">${host(u)}</a>`).join(', ') + '</small>';
  }
  // the match % only exists once every question is answered
  const matchOf = (l) => { if (!isComplete()) return null; const r = score(l, rank.a, rank.P); return r ? r.pct : null; };

  // four series colours, validated (validate_palette: CVD and normal-vision separation pass on white; aqua and
  // yellow sit under 3:1, so every bar carries its value as text and every series its name in the legend chips)
  const MC_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
  const MC_MAX = 4;
  let mc = [];             // selected laptop indexes, in order added
  const mcColor = new Map(); // laptop index -> colour, kept while it stays selected (colour follows the laptop)
  const colorFor = (i) => {
    if (!mcColor.has(i)) { const used = new Set(mcColor.values()); mcColor.set(i, MC_COLORS.find((c) => !used.has(c)) || MC_COLORS[0]); }
    return mcColor.get(i);
  };
  const mcSet = (list) => {
    mc = [...new Set(list)].slice(0, MC_MAX);
    for (const k of [...mcColor.keys()]) if (!mc.includes(k)) mcColor.delete(k);
    mc.forEach(colorFor);
    drawMc(); drawCatalog();
  };

  // the small charts: one measure each; null draws no bar and says "chưa có"
  const METRICS = [
    { k: 'Hợp với bạn', unit: '%', get: (l) => matchOf(l), hi: true, max: 100, na: () => (isComplete() ? 'vượt ngân sách' : 'trả lời đủ câu hỏi để tính') },
    { k: 'Điểm CPU', unit: '/100', get: (l) => l.s.cpu, hi: true, max: 100, sub: 'Cinebench 2024' },
    { k: 'Điểm GPU', unit: '/100', get: (l) => l.s.gpu, hi: true, max: 100, sub: '3DMark Steel Nomad' },
    { k: 'RAM', unit: ' GB', get: (l) => l.ram, hi: true },
    { k: 'Giá', unit: ' triệu', get: (l) => +(l.price / 1e6).toFixed(1), hi: false, sub: 'thấp hơn là tốt hơn' },
    { k: 'Cân nặng', unit: ' kg', get: (l) => l.weight, hi: false, sub: 'nhẹ hơn là tốt hơn' },
  ];
  const chartHtml = (m) => {
    const vals = mc.map((i) => m.get(L[i]));
    const known = vals.filter(nz);
    const max = m.max || Math.max(...known, 1);
    const best = known.length > 1 ? (m.hi ? Math.max(...known) : Math.min(...known)) : null;
    const rows = mc.map((i, j) => {
      const v = vals[j], l = L[i];
      return `<li class="mc-bar${v === best ? ' is-best' : ''}">
        <span class="mc-bar__name"><i style="--c:${colorFor(i)}"></i>${esc(l.name)}</span>
        <span class="mc-bar__track">${nz(v) ? `<b style="--w:${Math.max(2, (v / max) * 100)}%;--c:${colorFor(i)}"></b><span class="mc-bar__val">${v.toLocaleString('vi-VN')}${m.unit}${v === best ? ' · tốt nhất' : ''}</span>` : `<span class="na">${m.na ? m.na() : 'chưa có'}</span>`}</span>
      </li>`;
    }).join('');
    return `<figure class="mc-chart card span-4"><figcaption><b>${m.k}</b>${m.sub ? ` <span class="muted">${m.sub}</span>` : ''}</figcaption><ul>${rows}</ul></figure>`;
  };

  const TROWS = [
    ['Giá', (l) => `<a class="price-link" href="${l.priceSource}" target="_blank" rel="noopener">${vnd(l.price)}</a> <small>${host(l.priceSource)}</small>`, (l) => l.price, false],
    ['Hợp với bạn', (l) => { const p = matchOf(l); return nz(p) ? p + '%' : `<span class="na">${isComplete() ? 'vượt ngân sách' : 'chưa đủ câu trả lời'}</span>`; }, matchOf, true],
    ['CPU', (l) => `${l.cpu}<br><small>${nz(l.cpuMulti) ? `Cinebench 2024: ${l.cpuSingle} đơn nhân, ${l.cpuMulti} đa nhân` : 'Cinebench 2024 chưa có'}${nz(l.gb6Multi) ? ` · Geekbench 6: ${l.gb6Single}/${l.gb6Multi}` : ''}</small>`, (l) => l.s.cpu, true],
    ['GPU', (l) => `${l.gpu}<br><small>${nz(l.gpuSN) ? `Steel Nomad ${l.gpuSN}` : 'Steel Nomad chưa có'}${nz(l.gpuTS) ? ` · Time Spy ${l.gpuTS}` : ''}${l.dgpu ? ` · TGP ${nz(l.tgp) ? l.tgp + ' W' : 'chưa có'}` : ''}${l.cuda ? ' · có CUDA' : ''}</small>`, (l) => l.s.gpu, true],
    ['RAM', (l) => (has(l.ram) ? l.ram + ' GB' + (has(l.ramUp) ? (l.ramUp ? ', nâng được' : ', hàn chết') : '') : NA), (l) => l.ram, true],
    ['SSD', (l) => (has(l.ssd) ? gb(l.ssd) : NA), (l) => l.ssd, true],
    ['Màn hình', (l) => (has(l.screen) ? l.screen : NA), (l) => l.s.disp, true],
    ['Cân nặng', (l) => (has(l.weight) ? l.weight.toLocaleString('vi-VN') + ' kg' : NA), (l) => l.weight, false],
    ['Pin', (l) => (has(l.batWh) ? l.batWh + ' Wh' : 'Dung lượng ' + NA) + (has(l.batHours) ? `<br><small>${l.batHours.toLocaleString('vi-VN')} giờ, bài Wi-Fi Notebookcheck</small>` : ''), (l) => l.batHours, true],
    ['Đo thực tế', measuredText, null, true],
    ['Vỏ máy', (l) => (has(l.material) ? l.material : NA), null, true],
    ['Hệ điều hành', (l) => (has(l.osText) ? l.osText : NA) + (l.arm ? ', chip ARM' : ''), null, true],
    ['Nguồn', sourceLinks, null, true],
  ];
  const drawMc = () => {
    $('#mc-chips').innerHTML = mc.map((i) => `<li><i style="--c:${colorFor(i)}"></i><span>${esc(L[i].name)}</span>${mc.length > 2 ? `<button type="button" class="mc-x" data-mc-remove="${i}" aria-label="Bỏ ${esc(L[i].name)} khỏi so sánh">×</button>` : ''}</li>`).join('');
    const add = $('#mc-add');
    add.disabled = mc.length >= MC_MAX;
    add.innerHTML = `<option value="">${mc.length >= MC_MAX ? 'Đã đủ 4 mẫu, bỏ bớt để thêm' : '+ Thêm laptop vào so sánh'}</option>` +
      L.map((l, i) => (mc.includes(i) ? '' : `<option value="${i}">${esc(l.name)} · ${vnd(l.price)}</option>`)).join('');
    $('#mc-charts').innerHTML = METRICS.map(chartHtml).join('');
    const ls = mc.map((i) => L[i]);
    const row = ([label, text, num, up]) => {
      let best = null;
      if (num) { const v = ls.map(num).filter(has); if (v.length > 1 && new Set(v).size > 1) best = up ? Math.max(...v) : Math.min(...v); }
      return `<tr><th scope="row">${label}</th>${ls.map((l) => `<td${best !== null && num(l) === best ? ' class="is-better"' : ''}>${text(l)}</td>`).join('')}</tr>`;
    };
    $('#mc-table').innerHTML = `<thead><tr><th scope="col" class="vs__k"><span class="sr">Tiêu chí</span></th>${mc.map((i) => `<th scope="col"><span class="mc-head"><i style="--c:${colorFor(i)}"></i>${esc(L[i].name)}</span></th>`).join('')}</tr></thead><tbody>${TROWS.map(row).join('')}</tbody>`;
    const miss = ls.filter((l) => (l.missing || []).length).map((l) => `${l.name}: ${l.missing.join(', ')}`);
    $('#vs-note').textContent = 'Ô có chấm xanh là mẫu tốt nhất ở dòng đó. “Chưa có” nghĩa là nguồn chưa công bố số liệu; web không ước tính.' + (miss.length ? ` Trường trang bán chưa ghi: ${miss.join('; ')}.` : '');
  };
  $('#mc-add').addEventListener('change', (e) => { const v = e.target.value; if (v !== '') mcSet([...mc, +v]); });
  document.addEventListener('click', (e) => { const x = e.target.closest('[data-mc-remove]'); if (x) mcSet(mc.filter((i) => i !== +x.dataset.mcRemove)); });
  $('#cat-body').addEventListener('change', (e) => {
    const c = e.target.closest('[data-mc]'); if (!c) return;
    const i = +c.dataset.mc;
    if (c.checked) mcSet([...mc, i]);
    else if (mc.length > 2) mcSet(mc.filter((k) => k !== i));
    else { c.checked = true; $('#cat-page').textContent = 'Cần ít nhất 2 mẫu để so sánh.'; }
  });

  /* ---------------------------------------------------------------- các bước, và kiểm tra đã trả lời đủ */
  const steps = $$('.step', form), tabs = $$('.stepper button', form);
  let cur = 0, budgetOk = false;
  const chosen = (n) => !!form.querySelector(`input[name="${n}"]:checked`);
  const GROUPS = [
    [0, 'Ngôn ngữ đang học', () => chosen('lang')],
    [1, 'Nghề muốn làm', () => chosen('job')],
    [2, 'Ngân sách', () => budgetOk], [2, 'Mang máy đi học', () => chosen('carry')], [2, 'Thời lượng pin', () => chosen('batt')], [2, 'Hệ điều hành', () => chosen('os')],
    [3, 'Giải trí', () => chosen('fun')],
    [4, 'Hãng CPU', () => chosen('cpub')], [4, 'Card đồ hoạ', () => chosen('gpup')], [4, 'RAM tối thiểu', () => chosen('ramp')],
    [5, 'Kích thước', () => chosen('size')], [5, 'Tấm nền', () => chosen('panel')], [5, 'Tần số quét', () => chosen('hz')], [5, 'Chất liệu vỏ', () => chosen('mat')],
  ];
  const missing = () => GROUPS.filter((g) => !g[2]());
  function isComplete() { return missing().length === 0; }
  const stepDone = (k) => GROUPS.filter((g) => g[0] === k).every((g) => g[2]());
  const go = (i) => {
    cur = clamp(i, 0, steps.length - 1);
    steps.forEach((s, k) => { s.hidden = k !== cur; });
    tabs.forEach((t, k) => { t.setAttribute('aria-current', k === cur ? 'step' : 'false'); t.classList.toggle('is-done', stepDone(k)); });
    $('#prev').disabled = cur === 0;
    $('#next').hidden = cur === steps.length - 1; $('#see').hidden = cur !== steps.length - 1;
    const done = GROUPS.length - missing().length;
    $('#step-of').textContent = `Bước ${cur + 1} trên ${steps.length} · ${tabs[cur].textContent} · đã trả lời ${done}/${GROUPS.length} câu`;
  };
  const leave = () => { if (cur === 2) budgetOk = true; }; // the budget counts as answered once its step is left with "Câu tiếp theo"
  tabs.forEach((t, k) => t.addEventListener('click', () => go(k)));
  $('#prev').addEventListener('click', () => go(cur - 1));
  $('#next').addEventListener('click', () => { leave(); update(); go(cur + 1); });
  $$('[data-step]').forEach((a) => a.addEventListener('click', () => go(+a.dataset.step)));
  const goMissing = () => { const m = missing(); if (m.length) { go(m[0][0]); $('#chon').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-goto-missing]')) goMissing(); });
  // "Chỉ dùng để học" excludes the other entertainment answers, and the other way round
  form.addEventListener('change', (e) => {
    const t = e.target; if (t.name !== 'fun' || !t.checked) return;
    $$('input[name="fun"]', form).forEach((i) => { if (t.value === 'none' ? i.value !== 'none' : i.value === 'none') i.checked = false; });
  });
  $('#budget').addEventListener('input', () => { budgetOk = true; });

  const update = () => {
    const a = read();
    $('#budget-out').textContent = `${a.budget / 1e6} triệu`;
    const res = rank(a); drawProfile(res.P); drawResults(res, a); drawMc();
    go(cur);
  };
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  $('#see').addEventListener('click', () => {
    if (!isComplete()) { goMissing(); return; }
    update(); $('#ket-qua').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  $('#cat-filter').addEventListener('change', () => { catPage = 0; drawCatalog(); });
  $('#cat-sort').addEventListener('change', () => { catPage = 0; drawCatalog(); });
  $('#cat-prev').addEventListener('click', () => { catPage--; drawCatalog(); });
  $('#cat-next').addEventListener('click', () => { catPage++; drawCatalog(); });

  $$('[data-count-laptops]').forEach((e) => { e.textContent = L.length; });
  $$('[data-stat-laptops]').forEach((e) => { e.textContent = L.length; });
  $$('[data-stat-cpus]').forEach((e) => { e.textContent = new Set(L.map((l) => l.cpu.replace(/ \(.*\)$/, ''))).size; });
  // three laptops to start the comparison: a MacBook, a business ultrabook and a budget gaming laptop
  mcSet([/MacBook Air 13/, /ThinkPad E14/, /LOQ 15IRH11E/].map((re) => L.findIndex((l) => re.test(l.name))).filter((i) => i >= 0));
  window.LAPFIT = { read, rank, isComplete };
  go(0); update(); drawCatalog();
})();
