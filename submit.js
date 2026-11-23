/* LapFit · gửi lựa chọn: gom câu trả lời, hồ sơ nhu cầu, 5 mẫu gợi ý và máy được chọn thành một JSON,
   vẽ mã QR chứa JSON đó, và (khi trang chạy trên claude.ai với quyền db) lưu một bản ghi vào "submissions".
   Không gửi đi đâu khác. Tên và ghi chú không bắt buộc. */
(() => {
  const L = window.LAPTOPS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const vnd = (n) => (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
  const api = window.LAPFIT || null; // exposed by app.js: read(), rank()
  const sel = $('#pick-laptop'), nameIn = $('#sv-name'), noteIn = $('#sv-note');
  const status = $('#send-status'), qrBox = $('#qr-box'), qrMeta = $('#qr-meta'), qrActions = $('#qr-actions');
  let last = null; // the JSON text last sent

  /* ---------------------------------------------------------------- the laptop list: the five best first */
  const sendBtn = $('#send-btn'), lock = $('#send-lock');
  const fillPick = () => {
    const keep = sel.value;
    // sending needs every question answered: the record carries the answers and the match %
    const ok = api.isComplete();
    sendBtn.disabled = !ok; lock.hidden = ok;
    lock.innerHTML = ok ? '' : 'Trả lời đủ 6 nhóm câu hỏi để gửi kết quả. <button class="link" type="button" data-goto-missing>Trả lời tiếp</button>';
    const res = api.rank(api.read());
    const top = ok ? res.rows.slice(0, 5) : [];
    const topIdx = new Set(top.map((r) => L.indexOf(r.l)));
    sel.innerHTML = (top.length ? `<optgroup label="5 mẫu hợp nhất với bạn">${top.map((r, i) => `<option value="${L.indexOf(r.l)}">${i + 1}. ${r.l.name} · ${r.pct}% · ${vnd(r.l.price)}</option>`).join('')}</optgroup>` : '') + `
      <optgroup label="Các mẫu khác">${L.map((l, i) => (topIdx.has(i) ? '' : `<option value="${i}">${l.name} · ${vnd(l.price)}</option>`)).join('')}</optgroup>`;
    if (keep && [...sel.options].some((o) => o.value === keep)) sel.value = keep;
  };
  fillPick();
  $('#tool').addEventListener('change', fillPick);
  $('#next').addEventListener('click', () => setTimeout(fillPick, 0));

  // "Chọn máy này" on a result card
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-choose]'); if (!b) return;
    sel.value = b.dataset.choose;
    $('#gui').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    sel.focus({ preventScroll: true });
  });

  /* ---------------------------------------------------------------- the record */
  const code = () => 'LF-' + Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 7).toUpperCase();
  const build = () => {
    const a = api.read(), res = api.rank(a), n = res.P.n;
    const pick = L[+sel.value];
    const pr = res.rows.find((r) => r.l === pick);
    const lap = (l, pct) => ({ name: l.name, sku: l.sku, price_vnd: l.price, match_pct: pct ?? null });
    return {
      app: 'LapFit', v: 1, id: code(), time: new Date().toISOString(),
      student: { name: nameIn.value.trim().slice(0, 40) || null, note: noteIn.value.trim().slice(0, 120) || null },
      answers: {
        langs: a.langs, job: a.job, fun: a.fun, budget_vnd: a.budget, carry: a.carry, battery: a.batt, os: a.os, four_years: a.years,
        cpu_brand: a.cpuBrand, gpu: a.gpuPref, ram_min: a.ramMin, size: a.size, panel: a.panel, hz: a.hz, material: a.material,
      },
      needs: { cpu: n.cpu, gpu: n.gpu, ram_gb: n.ram, ssd_gb: n.ssd, display: n.disp, portability: n.port, battery: n.bat, mac: !!n.mac, cuda: !!n.cuda, x86: !!n.x86 },
      choice: { ...lap(pick, pr ? pr.pct : null), in_budget: !!pr, price_source: pick.priceSource },
      top5: res.rows.slice(0, 5).map((r) => lap(r.l, r.pct)),
      data_checked: window.LAPFIT_CHECKED || null,
    };
  };
  // JSON in plain ASCII (Vietnamese as \u escapes): every QR reader decodes it the same way, and it stays valid JSON
  const asciiJson = (o) => JSON.stringify(o).replace(/[\u0080-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

  /* ---------------------------------------------------------------- QR */
  // one QR (version 40, error level L, byte mode) holds 2,953 bytes; the JSON is plain ASCII, so characters = bytes
  const QR_MAX = 2900;
  const drawQr = (text) => {
    if (typeof window.qrcode !== 'function') { qrBox.innerHTML = '<p class="qr-empty">Không tải được thư viện QR. Hãy tạo file JSON hoặc .md bên dưới và gửi file đó.</p>'; return false; }
    const tooBig = () => { qrBox.innerHTML = `<p class="qr-empty qr-empty--warn"><b>Kết quả dài ${text.length.toLocaleString('vi-VN')} ký tự, quá sức chứa của một mã QR</b> (tối đa khoảng ${QR_MAX.toLocaleString('vi-VN')}).<br>Hãy bấm <b>Tạo file JSON</b> hoặc <b>Tạo file .md</b> bên dưới và gửi file đó cho người thu kết quả.</p>`; return false; };
    if (text.length > QR_MAX) return tooBig();
    const level = text.length > 1700 ? 'L' : 'M';
    const qr = window.qrcode(0, level);
    try { qr.addData(text, 'Byte'); qr.make(); } catch { return tooBig(); }
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true, alt: 'Mã QR chứa JSON kết quả', title: 'Mã QR chứa JSON kết quả' });
    const svg = qrBox.querySelector('svg'); if (svg) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Mã QR chứa JSON kết quả'); }
    return true;
  };

  /* ---------------------------------------------------------------- saving online (claude.ai artifact with db) */
  let dbP = null;
  const getDb = () => (dbP ||= (window.claude && typeof window.claude.use === 'function' ? window.claude.use('db').catch(() => null) : Promise.resolve(null)));
  // each viewer writes only their own document submissions/<their id> (a list of their sends);
  // the artifact's owner and editors read every document (access rules declared at publish)
  const saveOnline = async (rec) => {
    const db = await getDb();
    if (!db) return { ok: false, why: 'offline' };
    const user = await window.claude.use('user').catch(() => null);
    const uid = user ? await user.id().catch(() => null) : null;
    if (!uid) return { ok: false, why: 'no_user' };
    try {
      const ref = db.doc('submissions/' + uid);
      const snap = await ref.get();
      const prev = snap.exists && Array.isArray(snap.data().entries) ? snap.data().entries : [];
      await ref.set({ updated: rec.time, entries: [...prev, rec].slice(-20) });
      return { ok: true };
    } catch (e) { return { ok: false, why: e && e.code ? e.code : 'error' }; }
  };

  /* ---------------------------------------------------------------- send */
  $('#send-btn').addEventListener('click', async () => {
    const rec = build();
    const text = asciiJson(rec);
    last = { text, rec };
    const drawn = drawQr(text);
    qrMeta.innerHTML = `Mã kết quả <b>${rec.id}</b> · ${rec.choice.name} · ${text.length.toLocaleString('vi-VN')} ký tự JSON`;
    qrActions.hidden = false;
    status.textContent = 'Đang lưu kết quả…';
    const r = await saveOnline(rec);
    const hand = drawn ? `Hãy đưa mã QR ${rec.id} cho người thu kết quả quét, hoặc tạo file JSON/.md và gửi file đó.` : `Hãy tạo file JSON hoặc .md và gửi file đó cho người thu kết quả.`;
    status.textContent = r.ok
      ? `Đã lưu kết quả ${rec.id} lên hệ thống.${drawn ? ' Mã QR bên cạnh chứa cùng dữ liệu.' : ''}`
      : r.why === 'offline' ? `Đã tạo kết quả ${rec.id}. Trang này không lưu online. ${hand}`
      : r.why === 'no_user' ? `Chưa lưu online (cần đăng nhập claude.ai). ${hand}`
      : `Không lưu online được (${r.why}): có thể bạn chỉ có quyền xem. ${hand}`;
    loadOwner();
  });

  /* copy and save the JSON */
  if ($('#copy-json')) $('#copy-json').addEventListener('click', async () => {
    if (!last) return;
    const pretty = JSON.stringify(last.rec, null, 2);
    try { await navigator.clipboard.writeText(pretty); status.textContent = 'Đã sao chép JSON.'; }
    catch { $('#json-out').hidden = false; $('#json-out').value = pretty; $('#json-out').select(); status.textContent = 'Trình duyệt không cho sao chép tự động: JSON đã được chọn sẵn bên dưới, bấm Ctrl+C.'; }
  });
  const saveFile = async (filename, data) => {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads').catch(() => null) : null;
    if (dl) { try { await dl.save({ filename, data }); return 'Đã lưu ' + filename + '.'; } catch { return 'Bạn đã huỷ lưu file.'; } }
    if (window.claude) return 'Trang này không được phép lưu file; hãy dùng nút Sao chép JSON.';
    const type = filename.endsWith('.md') ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); return 'Đã tạo ' + filename + ' (xem trong thư mục Tải xuống).';
  };
  $('#save-json').addEventListener('click', async () => { if (last) status.textContent = await saveFile(`lapfit-${last.rec.id}.json`, JSON.stringify(last.rec, null, 2)); });

  /* the same record as a readable Markdown file */
  const labelOf = (name, v) => {
    const i = document.querySelector(`input[name="${name}"][value="${CSS.escape(String(v))}"]`);
    const lab = i && i.closest('label');
    return lab ? lab.querySelector('b') ? lab.querySelector('b').textContent.trim() : lab.textContent.trim() : String(v);
  };
  const toMarkdown = (r) => {
    const a = r.answers, n = r.needs, list = (name, vs) => (vs.length ? vs.map((v) => labelOf(name, v)).join(', ') : 'không chọn');
    const row = (l) => `| ${l.name} | ${l.sku || ''} | ${vnd(l.price_vnd)} | ${l.match_pct ?? 'vượt ngân sách'}${l.match_pct != null ? '%' : ''} |`;
    return [
      `# Kết quả LapFit ${r.id}`, '',
      `- Thời gian: ${new Date(r.time).toLocaleString('vi-VN')}`,
      `- Sinh viên: ${r.student.name || 'không ghi'}`, `- Ghi chú: ${r.student.note || 'không có'}`, '',
      '## Máy đã chọn', '',
      `**${r.choice.name}** (${r.choice.sku || 'không có mã'}) · ${vnd(r.choice.price_vnd)} · phù hợp ${r.choice.match_pct != null ? r.choice.match_pct + '%' : 'chưa tính (vượt ngân sách)'}`, '',
      `Nơi bán: ${r.choice.price_source}`, '',
      '## Câu trả lời', '',
      `- Ngôn ngữ đang học: ${list('lang', a.langs)}`,
      `- Nghề muốn làm: ${labelOf('job', a.job)}`,
      `- Giải trí: ${list('fun', a.fun)}`,
      `- Ngân sách: ${vnd(a.budget_vnd)}`,
      `- Mang máy đi học: ${labelOf('carry', a.carry)} · Pin: ${labelOf('batt', a.battery)} · Hệ điều hành: ${labelOf('os', a.os)}`,
      `- Dùng đủ 4 năm: ${a.four_years ? 'có' : 'không'}`,
      `- Hãng CPU: ${labelOf('cpub', a.cpu_brand)} · Card đồ hoạ: ${labelOf('gpup', a.gpu)} · RAM tối thiểu: ${labelOf('ramp', a.ram_min)}`,
      `- Màn hình: ${labelOf('size', a.size)}, ${labelOf('panel', a.panel)}, ${labelOf('hz', a.hz)} · Vỏ: ${labelOf('mat', a.material)}`, '',
      '## Hồ sơ nhu cầu (thang 0–100)', '',
      `CPU ${n.cpu} · GPU ${n.gpu} · RAM ${n.ram_gb} GB · SSD ${n.ssd_gb} GB · Màn hình ${n.display} · Gọn nhẹ ${n.portability} · Pin ${n.battery}`,
      `Ràng buộc: ${[n.mac && 'cần macOS', n.cuda && 'nên có GPU NVIDIA', n.x86 && 'nên dùng chip x86'].filter(Boolean).join(', ') || 'không có'}`, '',
      '## 5 mẫu gợi ý', '', '| Mẫu | Mã | Giá | Phù hợp |', '|---|---|---|---|', ...r.top5.map(row), '',
      '## Dữ liệu gốc (JSON)', '', '```json', JSON.stringify(r, null, 2), '```', '',
    ].join('\n');
  };
  $('#save-md').addEventListener('click', async () => { if (last) status.textContent = await saveFile(`lapfit-${last.rec.id}.md`, toMarkdown(last.rec)); });

  /* ---------------------------------------------------------------- owner: every submission */
  const owner = $('#owner-panel');
  let ownerRows = [];
  async function loadOwner() {
    const db = await getDb(); if (!db) return;
    const user = await window.claude.use('user').catch(() => null);
    const can = user ? await user.canEdit().catch(() => false) : false;
    if (!can) return;
    try {
      const snap = await db.collection('submissions').limit(200).get();
      ownerRows = snap.docs.flatMap((d) => (d.data() && Array.isArray(d.data().entries) ? d.data().entries : []))
        .sort((x, y) => String(y.time).localeCompare(String(x.time)));
      owner.hidden = false;
      $('#owner-count').textContent = `${ownerRows.length} lượt gửi`;
      $('#owner-list').innerHTML = ownerRows.slice(0, 5).map((r) => `<li><b>${r.id}</b> ${r.student && r.student.name ? r.student.name.replace(/[<>&]/g, '') : 'Không tên'} · ${r.choice ? r.choice.name : ''} · ${new Date(r.time).toLocaleString('vi-VN')}</li>`).join('');
    } catch { /* not readable for this viewer */ }
  }
  $('#owner-save').addEventListener('click', async () => { status.textContent = await saveFile('lapfit-tat-ca-ket-qua.json', JSON.stringify(ownerRows, null, 2)); });
  setTimeout(loadOwner, 0);
})();
