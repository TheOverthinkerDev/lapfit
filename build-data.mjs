// LapFit · build data.js from the two sourced research files.
//   node build-data.mjs
// research/market-vn.json  : models, prices, specs (each with source URLs; null = "chưa có")
// research/benchmarks.json : CPU / GPU / per-laptop benchmark results (each with source URLs; null = "chưa có")
// Rule: nothing is estimated here. A chip is linked to a benchmark entry only when the names match, or when a
// benchmark entry's own sourced note names that CPU (iGPU links). Anything else stays null and the app shows "chưa có".
import { readFileSync, writeFileSync } from 'node:fs';

const M = JSON.parse(readFileSync('research/market-vn.json', 'utf8'));
const B = JSON.parse(readFileSync('research/benchmarks.json', 'utf8'));
const log = [];

/* ---------------------------------------------------------------- CPU: market string -> benchmark key */
const CODENAMES = /\b(raptor|wildcat|panther|arrow|meteor|lunar|alder) lake\b|\b400 series\b/gi;
const norm = (s) => s.toLowerCase().replace(CODENAMES, '').replace(/\(.*?\)/g, '').replace(/[^a-z0-9+]/g, '');
const cpuIndex = new Map();
for (const k of Object.keys(B.cpus)) cpuIndex.set(norm(k), k);
const SPECIAL_CPU = [
  [/^(?:Qualcomm )?Snapdragon X2 Elite X2E ?-?88 ?-?100/i, 'Snapdragon X2 Elite (X2E-88-100)'],
  [/^(?:Qualcomm )?Snapdragon X Elite X1E ?-?78 ?-?100/i, 'Snapdragon X Elite (X1E-78-100)'],
  [/^(?:Qualcomm )?Snapdragon X X1 ?-?26 ?-?100\b/i, 'Snapdragon X (X1-26-100)'],
  [/^(?:Qualcomm )?Snapdragon X X1 ?-?26 ?-?101\b/i, 'Snapdragon X (X1-26-101)'],
];
const cpuKeyOf = (l) => {
  const raw = (l.cpu || '').replace(/ \(.*$/, '').trim();
  for (const [re, k] of SPECIAL_CPU) if (re.test(raw)) return k;
  if (/^Apple M5 Pro/i.test(raw)) return /20 nhân/.test(l.gpu) ? 'Apple M5 Pro (18-core CPU)' : /16 nhân/.test(l.gpu) ? 'Apple M5 Pro (15-core CPU)' : null;
  if (/^Apple M5\b/i.test(raw)) return 'Apple M5 (10-core)';
  if (/^Apple A18 Pro/i.test(raw)) return 'Apple A18 Pro';
  // "Intel Core i5 Raptor Lake 13420H" -> "Intel Core i5-13420H"
  const intelI = raw.match(/^Intel Core (i[3579])\s.*?(\d{4,5}[A-Z]{0,2})$/i);
  if (intelI) { const k = `Intel Core ${intelI[1].toLowerCase()}-${intelI[2].toUpperCase()}`; return B.cpus[k] ? k : null; }
  const n = norm(raw);
  return cpuIndex.get(n) || cpuIndex.get(norm('Intel ' + raw)) || null;
};

/* ---------------------------------------------------------------- GPU: market string (+ its CPU) -> benchmark key */
const gpuKeyOf = (l, cpuKey) => {
  const g = l.gpu || '';
  const rtx = g.match(/RTX\s*(\d{4})\s*(Ti)?/i);
  if (rtx) {
    const k = `NVIDIA GeForce RTX ${rtx[1]}${rtx[2] ? ' Ti' : ''} Laptop`;
    if (B.gpus[k]) return k;
    const vram = (g.match(/(\d+)\s*GB/i) || [])[1]; // RTX 3050 has separate 4 GB / 6 GB entries
    return vram && B.gpus[`${k} (${vram} GB)`] ? `${k} (${vram} GB)` : null;
  }
  const apple = g.match(/Apple GPU (\d+) nhân/);
  if (apple) {
    const c = +apple[1];
    return { 5: 'Apple A18 Pro GPU 5-core', 8: 'Apple M5 GPU 8-core', 10: 'Apple M5 GPU 10-core', 16: 'Apple M5 Pro GPU 16-core', 20: 'Apple M5 Pro GPU 20-core' }[c] || null;
  }
  if (/Radeon 8060S/i.test(g)) return 'AMD Radeon 8060S';
  if (/Radeon 840M/i.test(g)) return 'AMD Radeon 840M';
  if (/Arc Graphics 130V/i.test(g)) return 'Intel Arc Graphics 130V';
  if (/Arc Graphics 140V/i.test(g)) return 'Intel Arc Graphics 140V';
  // a shop page that names the Radeon model: use that entry when benchmarks.json has it
  const radeon = g.match(/Radeon\s+(\d{3,4}[MS])\b/i);
  if (radeon && B.gpus[`AMD Radeon ${radeon[1].toUpperCase()}`]) return `AMD Radeon ${radeon[1].toUpperCase()}`;
  // round 3: benchmarks.json gives each CPU's integrated GPU (igpu_key, from the maker's spec page).
  // Used only when the shop page names no discrete GPU and the iGPU does not depend on RAM (no igpu_key_note).
  const C = cpuKey && B.cpus[cpuKey];
  if (C && typeof C.igpu_key === 'string' && B.gpus[C.igpu_key] && !C.igpu_key_note) return C.igpu_key;
  // integrated graphics named only generically on the shop page: linked through the CPU, as benchmarks.json maps it
  const byCpu = {
    'Intel Core 3 100U': 'Intel UHD Graphics 64EUs (Alder Lake 12th Gen)',
    'Intel Core 5 210H': /UHD/i.test(g) ? 'Intel UHD Graphics Xe G4 48EUs' : null,
    'Intel Core 5 320': 'Intel Graphics 2 Xe3 (Wildcat Lake)',
    'Intel Core Ultra 5 322': 'Intel Graphics 2 Xe3 (Panther Lake, Core Ultra 5 322/332)',
    'Intel Core Ultra 5 225U': 'Intel Graphics 4-Core iGPU (Meteor / Arrow Lake)',
    'Intel Core Ultra 5 325': 'Intel Graphics 4 Xe3 (Panther Lake)',
    'Intel Core Ultra 7 355': 'Intel Graphics 4 Xe3 (Panther Lake)',
    'Intel Core Ultra 7 356H': 'Intel Graphics 4 Xe3 (Panther Lake)',
    'Intel Core Ultra X7 358H': 'Intel Arc B390 (12 Xe3)',
    'Intel Core Ultra 7 258V': /Arc/i.test(g) ? 'Intel Arc Graphics 140V' : null,
    // round 2 (benchmarks.json names the iGPU for each of these from the maker's spec page or NBC's chip page)
    'Intel Core Ultra 5 225H': /Arc/i.test(g) ? 'Intel Arc Graphics 130T' : null,
    'Intel Core Ultra 5 235U': 'Intel Graphics (Core Ultra 5 235U)',
    'Intel Core 5 315': 'Intel Graphics (Core 5 315, Wildcat Lake)',
    'Intel Core 5 120U': 'Intel UHD Graphics / Intel Graphics (Core 5 120U)',
    'Intel Core Ultra 5 135H': 'Intel Graphics (Core Ultra 5 135H)',
    'AMD Ryzen 5 7520U': 'AMD Radeon 610M',
    'AMD Ryzen 3 5400U': 'AMD Radeon Graphics (Ryzen 3 5400U, Vega 6)',
    'Snapdragon X (X1-26-101)': 'Qualcomm Adreno X1-85 (3.8 TFLOPS)',
    'Intel Core Ultra 7 255H': /Arc/i.test(g) ? 'Intel Arc Graphics 140T' : null,
    'Snapdragon X2 Elite (X2E-88-100)': 'Qualcomm Adreno X2-90',
    'Snapdragon X Elite (X1E-78-100)': 'Qualcomm Adreno X1-85 (3.8 TFLOPS)',
    'Snapdragon X (X1-26-100)': 'Qualcomm Adreno X1-45 (1.7 TFLOPS)',
  };
  return cpuKey && cpuKey in byCpu ? byCpu[cpuKey] : null;
};

/* ---------------------------------------------------------------- helpers */
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const short = (s) => s.replace(/\s*\(.*$/, '').replace(CODENAMES, '').replace(/\s{2,}/g, ' ').trim();
const resW = (r) => { const m = (r || '').match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/); return m ? +m[1] : null; };
const panelOf = (d) => {
  if (d.panel) return /oled/i.test(d.panel) ? 'OLED' : /mini/i.test(d.panel) ? 'mini-LED' : /ips|wva/i.test(d.panel) ? 'IPS' : d.panel;
  // the shop page wrote Apple's panel name in its resolution field: take it as written there
  if (/Liquid Retina XDR/i.test(d.resolution || d.raw || '')) return 'Liquid Retina XDR';
  if (/Liquid Retina/i.test(d.resolution || d.raw || '')) return 'Liquid Retina';
  return null;
};
const osOf = (s) => (!s ? null : /mac/i.test(s) ? 'mac' : /win/i.test(s) ? 'win' : null);

/* ---------------------------------------------------------------- per-laptop measurements (review of the same model) */
const measuredFor = (l) => {
  const m = l.existing_name && B.laptops[l.existing_name];
  if (!m) return null;
  // configs that changed since the review was matched are not carried over
  if (/Swift Go 14 AI|Nitro V 16S/.test(l.existing_name)) { log.push(`measured skipped (config changed): ${l.existing_name}`); return null; }
  return {
    cb: num(m.cb2024_multi), ts: num(m.timespy_graphics),
    bat: num(m.battery_hours_test), batType: m.battery_test_type || null,
    nits: num(m.display_measured_nits), src: m.source || (m.sources || [])[0] || null,
  };
};

/* ---------------------------------------------------------------- build */
const out = M.laptops.filter((l) => l.status === 'on_sale').map((l) => {
  const cpuKey = cpuKeyOf(l), gpuKey = gpuKeyOf(l, cpuKey);
  const C = cpuKey ? B.cpus[cpuKey] : null, G = gpuKey ? B.gpus[gpuKey] : null;
  if (!cpuKey) log.push(`CPU chưa có benchmark: ${l.cpu} (${l.name})`);
  if (!gpuKey) log.push(`GPU chưa có benchmark: ${l.gpu} (${l.name})`);
  const d = l.display || {};
  const tgp = ((l.gpu || '').match(/TGP[^0-9]*(\d{2,3})\s*W/i) || [])[1];
  const meas = measuredFor(l);
  const nbcBattery = meas && meas.bat && /notebookcheck/i.test(meas.batType || '') && /wi-?fi/i.test(meas.batType || '') ? meas.bat : null;
  const brandCpu = /apple/i.test(l.cpu) ? 'apple' : /snapdragon|qualcomm/i.test(l.cpu) ? 'qualcomm' : /amd|ryzen/i.test(l.cpu) ? 'amd' : /intel|core/i.test(l.cpu) ? 'intel' : null;
  const parts = [d.size_in ? `${String(d.size_in).replace('.', ',')}"` : null, d.resolution ? d.resolution.replace(/\s*-\s*(OLED|IPS)$/i, '') : null, panelOf(d), d.hz ? `${d.hz} Hz` : null, d.nits ? `${d.nits} nit` : null].filter(Boolean);
  return {
    name: l.name.replace(/\s+-\s+[A-Z0-9.\-]+$/, ''), sku: l.sku || null, brand: l.brand,
    price: l.price_vnd, priceSource: l.price_source, priceNote: l.price_note || null,
    cpu: short(l.cpu), cpuFull: l.cpu, cpuBrand: brandCpu, cpuKey,
    cpuSingle: C ? num(C.cb2024_single) : null, cpuMulti: C ? num(C.cb2024_multi) : null,
    gb6Single: C ? num(C.gb6_single) : null, gb6Multi: C ? num(C.gb6_multi) : null,
    cpuSrc: C ? (C.sources || [])[0] || null : null,
    gpu: l.gpu ? l.gpu.replace(/\s*\(\d+ CUDA Cores\)/i, '') : 'chưa có', gpuKey,
    gpuSN: G ? num(G.steel_nomad) : null, gpuTS: G ? num(G.timespy_graphics) : null,
    gpuSrc: G ? (G.sources || []).find((u) => /notebookcheck/.test(u)) || (G.sources || [])[0] || null : null,
    tgp: tgp ? +tgp : null,
    dgpu: /nvidia|rtx/i.test(l.gpu || ''), cuda: /nvidia|rtx/i.test(l.gpu || ''),
    ram: num(l.ram_gb), ramUp: typeof l.ram_upgradeable === 'boolean' ? l.ram_upgradeable : null,
    ssd: num(l.storage_gb),
    size: num(d.size_in), panel: panelOf(d), resW: resW(d.resolution || d.raw), hz: num(d.hz), nits: num(d.nits),
    screen: parts.join(', ') || null,
    weight: num(l.weight_kg), batWh: num(l.battery_wh), batHours: nbcBattery,
    material: l.material || null, os: osOf(l.os), osText: l.os || null,
    arm: /apple|snapdragon|qualcomm/i.test(l.cpu), ports: l.ports || null,
    measured: meas, sources: l.sources || [], missing: l.missing || [], notes: l.notes || [],
  };
});

const header = `/* LapFit · ${out.length} mẫu laptop đang bán tại Việt Nam. TẠO TỰ ĐỘNG bởi build-data.mjs, đừng sửa tay.
   Giá, thông số: research/market-vn.json (kiểm tra ${M.checked}, mỗi giá có link nguồn).
   Điểm CPU (Cinebench 2024), GPU (3DMark Steel Nomad, Time Spy): research/benchmarks.json (kiểm tra ${B.checked}).
   null = nguồn chưa có thông tin này; web hiện "chưa có", không ước tính. */
window.LAPFIT_UPDATED = '11/2026';
window.LAPFIT_CHECKED = ${JSON.stringify({ market: M.checked, benchmarks: B.checked })};
window.LAPTOPS = `;
// the chips the laptops use, with their sourced specs, for the CPU / GPU comparison charts
const pickKeys = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k] ?? null]));
const chips = { cpus: {}, gpus: {} };
for (const l of out) {
  if (l.cpuKey && !chips.cpus[l.cpuKey]) {
    const c = B.cpus[l.cpuKey];
    chips.cpus[l.cpuKey] = { ...pickKeys(c, ['cores_threads', 'boost_ghz', 'tdp_w', 'npu_tops', 'cb2024_single', 'cb2024_multi', 'gb6_single', 'gb6_multi', 'test_device']), brand: l.cpuBrand, source: (c.sources || [])[0] || null };
  }
  if (l.gpuKey && !chips.gpus[l.gpuKey]) {
    const g = B.gpus[l.gpuKey];
    chips.gpus[l.gpuKey] = { ...pickKeys(g, ['vram', 'tgp_w', 'timespy_graphics', 'steel_nomad', 'test_device']), vendor: l.dgpu ? 'nvidia' : l.cpuBrand, source: (g.sources || []).find((u) => /notebookcheck/.test(u)) || (g.sources || [])[0] || null };
  }
}
writeFileSync('data.js', header + JSON.stringify(out, null, 1) + ';\nwindow.CHIPS = ' + JSON.stringify(chips, null, 1) + ';\n');
writeFileSync('research/build-log.txt', log.join('\n') + '\n');
console.log(`data.js: ${out.length} laptops; CPU benchmark linked ${out.filter((l) => l.cpuMulti).length}, GPU Steel Nomad ${out.filter((l) => l.gpuSN).length}, GPU any ${out.filter((l) => l.gpuKey).length}`);
console.log(log.join('\n'));
