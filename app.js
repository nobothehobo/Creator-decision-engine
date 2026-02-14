const STORAGE_KEY = 'creatorCompass.entries.v1';
const PLANNER_KEY = 'creatorCompass.planner.v1';
const THEME_KEY = 'creatorCompass.theme';

const $ = (id) => document.getElementById(id);
const els = {
  tabs: [...document.querySelectorAll('.tab')], panels: [...document.querySelectorAll('.tab-panel')],
  themeToggle: $('themeToggle'), lastSaved: $('lastSaved'), toast: $('toast'),
  form: $('videoForm'), formError: $('formError'), titleError: $('titleError'), submitBtn: $('submitBtn'), cancelEditBtn: $('cancelEditBtn'),
  libraryBody: $('libraryBody'), entryCount: $('entryCount'), search: $('search'), filterPlatform: $('filterPlatform'), filterFormat: $('filterFormat'), sortBy: $('sortBy'),
  planForm: $('planForm'), planDateError: $('planDateError'), planFormError: $('planFormError'), planSubmitBtn: $('planSubmitBtn'), cancelPlanEditBtn: $('cancelPlanEditBtn'), plannerList: $('plannerList'),
  weekViewBtn: $('weekViewBtn'), monthViewBtn: $('monthViewBtn'),
  statsGrid: $('statsGrid'), confidenceBadge: $('confidenceBadge'), workingList: $('workingList'), testingList: $('testingList'), winsList: $('winsList'),
  timeChart: $('timeChart'), tagsChart: $('tagsChart'), timeChartEmpty: $('timeChartEmpty'), tagsChartEmpty: $('tagsChartEmpty'),
  exportBtn: $('exportBtn'), exportCsvBtn: $('exportCsvBtn'), exportPlannerCsvBtn: $('exportPlannerCsvBtn'), importInput: $('importInput'), importError: $('importError'),
  resetBtn: $('resetBtn'), resetDialog: $('resetDialog'), resetFormModal: $('resetFormModal'), resetConfirmInput: $('resetConfirmInput'), resetError: $('resetError'), cancelResetBtn: $('cancelResetBtn'),
  ideaIdInput: $('ideaIdInput'), ideaYoutubeUrl: $('ideaYoutubeUrl'), attachYoutubeBtn: $('attachYoutubeBtn'), fetchYoutubeStatsBtn: $('fetchYoutubeStatsBtn'), youtubeFetchError: $('youtubeFetchError'), youtubeLatest: $('youtubeLatest'), youtubeSnapshots: $('youtubeSnapshots'), youtubeDerived: $('youtubeDerived'), youtubeTrendChart: $('youtubeTrendChart'), youtubeTrendEmpty: $('youtubeTrendEmpty'), youtubeSnapshotsTable: $('youtubeSnapshotsTable'), coachDiagnose: $('coachDiagnose'), coachFix: $('coachFix'), coachExperiment: $('coachExperiment'),
};

let entries = migrateEntries(loadJson(STORAGE_KEY, []));
let plans = migratePlans(loadJson(PLANNER_KEY, []));
let plannerViewMode = 'week';
let hovered = null;
let youtubeState = {
  video: null,
  snapshots: [],
  channelBaseline: null,
};

function loadJson(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch { return fallback; } }
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  localStorage.setItem(PLANNER_KEY, JSON.stringify(plans));
  els.lastSaved.textContent = `Last saved: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
function migrateEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => e && e.id && e.title).map((e) => ({
    id: e.id, title: String(e.title), platform: e.platform || 'Other', format: e.format || 'Other', tags: Array.isArray(e.tags) ? e.tags : parseTags(String(e.tags || '')),
    uploadDate: e.uploadDate || '', views24h: n(e.views24h), views7d: n(e.views7d), notes: String(e.notes || ''),
    hookType: e.hookType || 'Other', lengthSeconds: n(e.lengthSeconds), firstHourViews: n(e.firstHourViews), retentionRating: e.retentionRating || 'OK', ctaUsed: e.ctaUsed || 'None', audioType: e.audioType || 'Other', postTime: e.postTime || '',
  }));
}
function migratePlans(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((p) => ({
    id: p.id || crypto.randomUUID(), plannedDate: p.plannedDate || '', platform: p.platform || 'Other', format: p.format || 'Other', title: p.title || '', tags: Array.isArray(p.tags) ? p.tags : parseTags(String(p.tags || '')), status: p.status || 'Planned', notes: p.notes || '', linkedVideoId: p.linkedVideoId || '',
  }));
}
function n(v) { const x = Number(v); return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0; }
const parseTags = (s) => s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
function postWindow(t) { if (!t) return 'Unknown'; const h = Number(t.split(':')[0]); if (h < 6) return 'Night'; if (h < 12) return 'Morning'; if (h < 18) return 'Afternoon'; return 'Evening'; }

function showToast(msg) { els.toast.textContent = msg; els.toast.hidden = false; clearTimeout(showToast.t); showToast.t = setTimeout(() => els.toast.hidden = true, 1500); }

function setupTabs() {
  els.tabs.forEach((t) => t.addEventListener('click', () => {
    els.tabs.forEach((x) => x.classList.toggle('active', x === t));
    els.panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
  }));
}

function getVideoFormData() {
  const data = {
    id: $('entryId').value || crypto.randomUUID(), title: $('title').value.trim(), platform: $('platform').value, format: $('format').value,
    tags: parseTags($('tags').value), uploadDate: $('uploadDate').value, views24h: n($('views24h').value), views7d: n($('views7d').value), notes: $('notes').value.trim(),
    hookType: $('hookType').value, lengthSeconds: n($('lengthSeconds').value), firstHourViews: n($('firstHourViews').value), retentionRating: $('retentionRating').value, ctaUsed: $('ctaUsed').value, audioType: $('audioType').value, postTime: $('postTime').value,
  };
  els.formError.textContent = ''; els.titleError.textContent = '';
  if (!data.title) { els.titleError.textContent = 'Title is required.'; return null; }
  return data;
}
function resetVideoForm() { els.form.reset(); $('entryId').value = ''; els.submitBtn.textContent = 'Add Video'; els.cancelEditBtn.hidden = true; els.formError.textContent = ''; els.titleError.textContent = ''; }

function getPlanData() {
  const p = { id: $('planId').value || crypto.randomUUID(), plannedDate: $('plannedDate').value, platform: $('planPlatform').value, format: $('planFormat').value, title: $('planTitle').value.trim(), tags: parseTags($('planTags').value), status: $('planStatus').value, notes: $('planNotes').value.trim(), linkedVideoId: '' };
  els.planDateError.textContent = ''; els.planFormError.textContent = '';
  if (!p.plannedDate) { els.planDateError.textContent = 'Planned date is required.'; return null; }
  return p;
}
function resetPlanForm() { els.planForm.reset(); $('planId').value = ''; els.planSubmitBtn.textContent = 'Add Plan'; els.cancelPlanEditBtn.hidden = true; els.planDateError.textContent = ''; els.planFormError.textContent = ''; }

function filteredEntries() {
  const q = els.search.value.trim().toLowerCase();
  const out = entries.filter((e) => `${e.title} ${e.tags.join(' ')}`.toLowerCase().includes(q) && (els.filterPlatform.value === 'all' || e.platform === els.filterPlatform.value) && (els.filterFormat.value === 'all' || e.format === els.filterFormat.value));
  return out.sort((a, b) => els.sortBy.value === 'dateAsc' ? new Date(a.uploadDate || 0) - new Date(b.uploadDate || 0) : els.sortBy.value === 'views24hDesc' ? b.views24h - a.views24h : els.sortBy.value === 'views7dDesc' ? b.views7d - a.views7d : new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
}

function renderLibrary() {
  const rows = filteredEntries();
  els.entryCount.textContent = `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`;
  if (!rows.length) {
    els.libraryBody.innerHTML = '<tr><td colspan="9">No entries yet.</td></tr>'; return;
  }
  els.libraryBody.innerHTML = rows.map((e) => `<tr><td>${esc(e.title)}</td><td>${e.platform}</td><td>${e.format}</td><td>${fmtDate(e.uploadDate)}</td><td>${e.views24h.toLocaleString()}</td><td>${e.views7d.toLocaleString()}</td><td>${e.hookType}</td><td>${e.tags.map((t) => `<span class="tags-pill">${esc(t)}</span>`).join(' ') || '—'}</td><td><div class="table-actions"><button class="btn-table" data-edit="${e.id}">Edit</button><button class="btn-table" data-delete="${e.id}">Delete</button></div></td></tr>`).join('');
}

function groupPlans() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today); start.setDate(today.getDate() - today.getDay() + 1);
  const end = new Date(start); end.setDate(start.getDate() + (plannerViewMode === 'week' ? 6 : 30));
  const inRange = plans.filter((p) => p.plannedDate && new Date(p.plannedDate) >= start && new Date(p.plannedDate) <= end).sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate));
  const map = new Map();
  inRange.forEach((p) => { const k = new Date(p.plannedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); if (!map.has(k)) map.set(k, []); map.get(k).push(p); });
  return map;
}

function renderPlanner() {
  els.weekViewBtn.classList.toggle('active', plannerViewMode === 'week');
  els.monthViewBtn.classList.toggle('active', plannerViewMode === 'month');
  const groups = groupPlans();
  if (!groups.size) { els.plannerList.innerHTML = '<div class="planner-day">No planned uploads in this range yet.</div>'; return; }

  const videoOptions = entries.map((e) => `<option value="${e.id}">${esc(e.title)}</option>`).join('');
  els.plannerList.innerHTML = [...groups.entries()].map(([day, items]) => `<div class="planner-day"><strong>${day}</strong>${items.map((p) => `<div class="planner-item"><div><strong>${esc(p.title || 'Untitled idea')}</strong></div><div class="planner-meta">${p.platform} • ${p.format} • ${p.status} • tags: ${p.tags.join(', ') || '—'}</div><div class="actions wrap"><button class="btn-table" data-plan-edit="${p.id}">Edit</button><button class="btn-table" data-plan-delete="${p.id}">Delete</button><button class="btn-table" data-plan-convert="${p.id}">Convert to Log</button>${p.status === 'Posted' ? `<select data-plan-link="${p.id}"><option value="">Link published video...</option>${videoOptions}</select>` : ''}</div>${p.linkedVideoId ? `<div class="planner-meta">Linked video: ${esc((entries.find((e) => e.id === p.linkedVideoId) || {}).title || 'Unknown')}</div>` : ''}</div>`).join('')}</div>`).join('');
}

function aggregate() {
  const total = entries.length;
  const avg24 = total ? entries.reduce((s, e) => s + e.views24h, 0) / total : 0;
  const avg7 = total ? entries.reduce((s, e) => s + e.views7d, 0) / total : 0;
  const by = (field) => {
    const m = new Map(); entries.forEach((e) => { const k = field(e); if (!k || k === 'Unknown') return; const r = m.get(k) || { total: 0, count: 0 }; r.total += e.views7d; r.count += 1; m.set(k, r); });
    return [...m.entries()].map(([k, v]) => ({ k, avg: v.total / v.count, count: v.count })).sort((a, b) => b.avg - a.avg);
  };
  const topTags = by((e) => e.tags[0]);
  const hooks = by((e) => e.hookType);
  const windows = by((e) => postWindow(e.postTime));
  const platforms = by((e) => e.platform);
  const formats = by((e) => e.format);
  const firstHour = entries.filter((e) => e.firstHourViews > 0);
  const avgFirstHour = firstHour.length ? firstHour.reduce((s, e) => s + e.firstHourViews, 0) / firstHour.length : 0;
  let corr = 0;
  if (firstHour.length > 1) {
    const x = firstHour.map((e) => e.firstHourViews), y = firstHour.map((e) => e.views7d);
    const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
    const cov = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0), sx = Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0)), sy = Math.sqrt(y.reduce((s, v) => s + (v - my) ** 2, 0));
    corr = sx && sy ? cov / (sx * sy) : 0;
  }
  return { total, avg24, avg7, topTags, hooks, windows, platforms, formats, avgFirstHour, corr };
}

function renderStatsInsights() {
  const d = aggregate();
  const short = d.formats.find((x) => x.k === 'Short'), long = d.formats.find((x) => x.k === 'Long');
  els.statsGrid.innerHTML = [
    ['Total videos', d.total], ['Avg 24h', Math.round(d.avg24).toLocaleString()], ['Avg 7d', Math.round(d.avg7).toLocaleString()],
    ['Best hook type', d.hooks[0] ? `${d.hooks[0].k} (${Math.round(d.hooks[0].avg).toLocaleString()})` : '—'],
    ['Best posting window', d.windows[0] ? d.windows[0].k : '—'],
    ['Early velocity', `${Math.round(d.avgFirstHour).toLocaleString()} avg • corr ${d.corr.toFixed(2)}`],
    ['Shorts vs Long', short && long ? `${Math.round(short.avg).toLocaleString()} vs ${Math.round(long.avg).toLocaleString()}` : 'Need both'],
    ['Best platform', d.platforms[0] ? d.platforms[0].k : '—'],
  ].map(([k, v]) => `<div class="stat"><p>${k}</p><strong>${v}</strong></div>`).join('');

  const confidence = d.total < 5 ? 'Low' : d.total < 15 ? 'Medium' : 'High';
  els.confidenceBadge.textContent = `Confidence: ${confidence}`;
  const bestTag = d.topTags[0]?.k || 'your top tag';
  const nextWeekTarget = Math.max(1, Math.round((plans.filter((p) => p.status !== 'Posted').length || 2) / 2));
  const working = [
    d.hooks[0] ? `Hook type “${d.hooks[0].k}” currently leads 7d performance.` : 'Add hook type data to unlock hook insights.',
    d.windows[0] ? `${d.windows[0].k} posting window performs best so far.` : 'Add post times to uncover best posting windows.',
    d.platforms[0] ? `${d.platforms[0].k} is your strongest platform right now.` : 'Track more platforms to compare.',
  ];
  const testing = [
    `Your next week should include ${nextWeekTarget} videos using tag “${bestTag}”.`,
    d.windows[0] ? `Try posting at your best window (${d.windows[0].k}) twice next week.` : 'Pick one consistent time window for two uploads next week.',
    'Run one Short and one Long on the same topic to compare 7d outcomes.',
  ];
  const wins = [
    `Planned items pending: ${plans.filter((p) => p.status !== 'Posted').length}. Convert ready ones into log entries.`,
    'Fill first-hour views on every upload to strengthen early velocity signal.',
    'Link posted planner items to published videos to close the planning loop.',
  ];
  els.workingList.innerHTML = working.map((x) => `<li>${x}</li>`).join('');
  els.testingList.innerHTML = [...new Set(testing)].map((x) => `<li>${x}</li>`).join('');
  els.winsList.innerHTML = wins.map((x) => `<li>${x}</li>`).join('');

  drawViewsChart();
  drawTagsChart(d.topTags.slice(0, 6));
}

function chartTheme() { const s = getComputedStyle(document.documentElement); return { axis: s.getPropertyValue('--border').trim(), text: s.getPropertyValue('--muted').trim(), line: s.getPropertyValue('--primary').trim(), card: s.getPropertyValue('--card').trim() }; }
function setupCanvas(canvas) { const dpr = window.devicePixelRatio || 1; const r = canvas.getBoundingClientRect(); canvas.width = Math.max(300, r.width * dpr); canvas.height = Math.max(210, r.height * dpr); const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { ctx, w: r.width, h: r.height }; }
function axes(ctx, w, h, t, y) { ctx.strokeStyle = t.axis; ctx.beginPath(); ctx.moveTo(40, 14); ctx.lineTo(40, h - 28); ctx.lineTo(w - 10, h - 28); ctx.stroke(); ctx.fillStyle = t.text; ctx.font = '12px sans-serif'; ctx.fillText(y, 8, 12); }

function drawViewsChart() {
  const { ctx, w, h } = setupCanvas(els.timeChart); const t = chartTheme(); const data = [...entries].filter((e) => e.uploadDate).sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate)).slice(-12);
  ctx.clearRect(0, 0, w, h); axes(ctx, w, h, t, '7d views'); hovered = null;
  if (!data.length) { els.timeChartEmpty.hidden = false; els.timeChartEmpty.innerHTML = '<div><strong>No chart data yet</strong><br>Add dated uploads with 7d views.</div>'; return; } els.timeChartEmpty.hidden = true;
  const max = Math.max(...data.map((e) => e.views7d), 1); const points = data.map((e, i) => ({ x: 48 + (i * (w - 66)) / Math.max(1, data.length - 1), y: h - 32 - ((e.views7d / max) * (h - 56)), v: e.views7d, d: fmtDate(e.uploadDate) }));
  els.timeChart.__points = points;
  ctx.strokeStyle = t.line; ctx.lineWidth = 2; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
  points.forEach((p, i) => { ctx.fillStyle = t.line; ctx.beginPath(); ctx.arc(p.x, p.y, 3.1, 0, Math.PI * 2); ctx.fill(); if (i % Math.ceil(points.length / 4) === 0 || i === points.length - 1) { ctx.fillStyle = t.text; ctx.font = '11px sans-serif'; ctx.fillText(p.d, p.x - 18, h - 9); } });
}

function drawTagsChart(tags) {
  const { ctx, w, h } = setupCanvas(els.tagsChart); const t = chartTheme(); ctx.clearRect(0, 0, w, h); axes(ctx, w, h, t, 'avg 7d');
  if (!tags.length) { els.tagsChartEmpty.hidden = false; els.tagsChartEmpty.innerHTML = '<div><strong>No chart data yet</strong><br>Add tags to see top performers.</div>'; return; } els.tagsChartEmpty.hidden = true;
  const max = Math.max(...tags.map((x) => x.avg), 1), gap = 10, bw = Math.max(24, (w - 64 - gap * (tags.length - 1)) / tags.length);
  tags.forEach((x, i) => { const bx = 48 + i * (bw + gap); const bh = (x.avg / max) * (h - 56); const by = h - 30 - bh; ctx.fillStyle = t.line; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = t.text; ctx.font = '11px sans-serif'; ctx.fillText(x.k.slice(0, 9), bx, h - 10); });
}

function metricsFromSnapshots(snapshots, publishedAt) {
  if (!snapshots.length) return { viewsPerHour: 0, likesPer1k: 0, commentsPer1k: 0 };
  const latest = snapshots[0];
  const hours = Math.max(1, (new Date(latest.fetchedAt) - new Date(publishedAt)) / 3600000);
  const viewsPerHour = latest.viewCount / hours;
  const likesPer1k = latest.viewCount ? ((latest.likeCount || 0) / latest.viewCount) * 1000 : 0;
  const commentsPer1k = latest.viewCount ? ((latest.commentCount || 0) / latest.viewCount) * 1000 : 0;
  return { viewsPerHour, likesPer1k, commentsPer1k };
}

function drawYoutubeTrendChart() {
  if (!els.youtubeTrendChart) return;
  const points = [...youtubeState.snapshots].sort((a, b) => new Date(a.fetchedAt) - new Date(b.fetchedAt));
  const { ctx, w, h } = setupCanvas(els.youtubeTrendChart);
  const t = chartTheme();
  ctx.clearRect(0, 0, w, h); axes(ctx, w, h, t, 'views');
  if (!points.length) {
    els.youtubeTrendEmpty.hidden = false;
    els.youtubeTrendEmpty.innerHTML = '<div><strong>No trend yet</strong><br>Fetch 2+ snapshots to see trajectory.</div>';
    return;
  }
  els.youtubeTrendEmpty.hidden = true;
  const max = Math.max(...points.map((p) => p.viewCount), 1);
  const chartPts = points.map((p, i) => ({ x: 48 + (i * (w - 66)) / Math.max(1, points.length - 1), y: h - 32 - ((p.viewCount / max) * (h - 56)), v: p.viewCount }));
  ctx.strokeStyle = t.line; ctx.lineWidth = 2; ctx.beginPath();
  chartPts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
  chartPts.forEach((p) => { ctx.fillStyle = t.line; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });
}

function renderCoach() {
  const snaps = youtubeState.snapshots;
  const diag = [];
  const fix = [];
  const experiment = [];
  if (!youtubeState.video || !snaps.length) {
    els.coachDiagnose.innerHTML = '<li>Attach a video and fetch snapshots to start coaching.</li>';
    els.coachFix.innerHTML = '<li>Add at least 2 snapshots over a few hours to detect momentum.</li>';
    els.coachExperiment.innerHTML = '<li>Next upload: test one title with a clear promise + specific audience.</li>';
    return;
  }

  const latest = snaps[0];
  const prev = snaps[1];
  const metrics = metricsFromSnapshots(snaps, youtubeState.video.publishedAt);
  const baseline = youtubeState.channelBaseline || { avgViewsPerHour: metrics.viewsPerHour, avgEngagementPer1k: metrics.likesPer1k + metrics.commentsPer1k };
  const currentEngagement = metrics.likesPer1k + metrics.commentsPer1k;
  const deltaViews = prev ? latest.viewCount - prev.viewCount : 0;

  if (prev && deltaViews <= 0) diag.push('Growth is flat between the last two snapshots.');
  else if (prev && deltaViews > 0) diag.push(`Growth is accelerating (+${deltaViews.toLocaleString()} views since last snapshot).`);
  if (currentEngagement >= baseline.avgEngagementPer1k) diag.push('Engagement is at or above your channel baseline.');
  else diag.push('Engagement is below your channel baseline right now.');

  if (currentEngagement < baseline.avgEngagementPer1k) {
    fix.push('Pin a comment with a specific response prompt (e.g., “Which part should I break down next?”).');
    fix.push('Tighten title promise: make outcome + audience explicit in 50–60 chars.');
  } else {
    fix.push('Create a follow-up video in 24h that answers top comment questions from this upload.');
  }

  experiment.push('Next upload test: publish at your strongest window and compare first 2-hour views vs this video.');

  els.coachDiagnose.innerHTML = diag.map((x) => `<li>${x}</li>`).join('');
  els.coachFix.innerHTML = fix.slice(0, 2).map((x) => `<li>${x}</li>`).join('');
  els.coachExperiment.innerHTML = experiment.map((x) => `<li>${x}</li>`).join('');
}

function renderYoutubeSnapshots() {
  if (!els.youtubeLatest) return;
  if (!youtubeState.video || !youtubeState.snapshots.length) {
    els.youtubeLatest.textContent = 'No snapshot fetched yet.';
    if (els.youtubeDerived) els.youtubeDerived.innerHTML = '';
    if (els.youtubeSnapshotsTable) els.youtubeSnapshotsTable.innerHTML = '<tr><td colspan="5">No snapshots yet.</td></tr>';
    drawYoutubeTrendChart();
    renderCoach();
    return;
  }

  const latest = youtubeState.snapshots[0];
  els.youtubeLatest.innerHTML = `<strong>${esc(youtubeState.video.title)}</strong><div class="planner-meta">${esc(youtubeState.video.channelTitle)} • Published ${new Date(youtubeState.video.publishedAt).toLocaleString()}</div><div>Latest: ${new Date(latest.fetchedAt).toLocaleString()} • Views ${latest.viewCount.toLocaleString()} • Likes ${latest.likeCount ?? '—'} • Comments ${latest.commentCount ?? '—'}</div>`;

  const m = metricsFromSnapshots(youtubeState.snapshots, youtubeState.video.publishedAt);
  els.youtubeDerived.innerHTML = [
    ['Views / hour', Math.round(m.viewsPerHour).toLocaleString()],
    ['Likes / 1k views', m.likesPer1k.toFixed(2)],
    ['Comments / 1k views', m.commentsPer1k.toFixed(2)],
  ].map(([k, v]) => `<div class="stat"><p>${k}</p><strong>${v}</strong></div>`).join('');

  els.youtubeSnapshotsTable.innerHTML = youtubeState.snapshots.map((s, idx) => {
    const prev = youtubeState.snapshots[idx + 1];
    const hours = prev ? Math.max(0.1, (new Date(s.fetchedAt) - new Date(prev.fetchedAt)) / 3600000) : Math.max(1, (new Date(s.fetchedAt) - new Date(youtubeState.video.publishedAt)) / 3600000);
    const vph = prev ? (s.viewCount - prev.viewCount) / hours : s.viewCount / hours;
    return `<tr><td>${new Date(s.fetchedAt).toLocaleString()}</td><td>${s.viewCount.toLocaleString()}</td><td>${s.likeCount ?? '—'}</td><td>${s.commentCount ?? '—'}</td><td>${Math.round(vph).toLocaleString()}</td></tr>`;
  }).join('');

  drawYoutubeTrendChart();
  renderCoach();
}

async function callYoutubePublic(mode) {
  if (!els.fetchYoutubeStatsBtn) return;
  const ideaId = Number(els.ideaIdInput.value);
  const youtubeUrl = els.ideaYoutubeUrl.value.trim();
  els.youtubeFetchError.textContent = '';
  if (!Number.isInteger(ideaId) || ideaId < 1) { els.youtubeFetchError.textContent = 'Provide a valid Idea ID.'; return; }
  if (!youtubeUrl) { els.youtubeFetchError.textContent = 'Provide a YouTube URL.'; return; }

  const btn = mode === 'attach' ? els.attachYoutubeBtn : els.fetchYoutubeStatsBtn;
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = mode === 'attach' ? 'Attaching...' : 'Fetching...';
  try {
    const res = await fetch('/api/youtube/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, youtubeUrl, mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    youtubeState.video = {
      videoId: data.videoId,
      title: data.title,
      publishedAt: data.publishedAt,
      channelTitle: data.channelTitle,
    };
    youtubeState.snapshots = (data.snapshots || []).map((s) => ({
      fetchedAt: s.fetchedAt,
      viewCount: Number(s.viewCount || 0),
      likeCount: s.likeCount == null ? null : Number(s.likeCount),
      commentCount: s.commentCount == null ? null : Number(s.commentCount),
    })).sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt));
    youtubeState.channelBaseline = data.channelBaseline || null;
    renderYoutubeSnapshots();
    showToast(mode === 'attach' ? 'Video attached' : 'Snapshot fetched');
  } catch (err) {
    els.youtubeFetchError.textContent = String(err.message || err);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function rerender() { renderLibrary(); renderPlanner(); renderStatsInsights(); }

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = getVideoFormData(); if (!data) return;
  const idx = entries.findIndex((x) => x.id === data.id); if (idx >= 0) entries[idx] = data; else entries.unshift(data);
  save(); resetVideoForm(); rerender(); showToast('Video saved');
});
els.cancelEditBtn.addEventListener('click', resetVideoForm);
els.libraryBody.addEventListener('click', (e) => {
  const edit = e.target.getAttribute('data-edit'); const del = e.target.getAttribute('data-delete');
  if (edit) {
    const x = entries.find((r) => r.id === edit); if (!x) return;
    $('entryId').value = x.id; $('title').value = x.title; $('platform').value = x.platform; $('format').value = x.format; $('tags').value = x.tags.join(', '); $('uploadDate').value = x.uploadDate; $('views24h').value = x.views24h; $('views7d').value = x.views7d; $('notes').value = x.notes;
    $('hookType').value = x.hookType; $('lengthSeconds').value = x.lengthSeconds || ''; $('firstHourViews').value = x.firstHourViews || ''; $('retentionRating').value = x.retentionRating; $('ctaUsed').value = x.ctaUsed; $('audioType').value = x.audioType; $('postTime').value = x.postTime;
    els.submitBtn.textContent = 'Save Changes'; els.cancelEditBtn.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (del) { entries = entries.filter((x) => x.id !== del); save(); rerender(); showToast('Entry deleted'); }
});
[els.search, els.filterPlatform, els.filterFormat, els.sortBy].forEach((el) => el.addEventListener('input', renderLibrary));

els.planForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const p = getPlanData(); if (!p) return;
  const idx = plans.findIndex((x) => x.id === p.id); if (idx >= 0) p.linkedVideoId = plans[idx].linkedVideoId || ''; if (idx >= 0) plans[idx] = p; else plans.unshift(p);
  save(); resetPlanForm(); renderPlanner(); showToast('Plan saved');
});
els.cancelPlanEditBtn.addEventListener('click', resetPlanForm);
els.weekViewBtn.addEventListener('click', () => { plannerViewMode = 'week'; renderPlanner(); });
els.monthViewBtn.addEventListener('click', () => { plannerViewMode = 'month'; renderPlanner(); });
els.plannerList.addEventListener('click', (e) => {
  const id = e.target.getAttribute('data-plan-edit') || e.target.getAttribute('data-plan-delete') || e.target.getAttribute('data-plan-convert');
  if (!id) return;
  const p = plans.find((x) => x.id === id); if (!p) return;
  if (e.target.hasAttribute('data-plan-edit')) {
    $('planId').value = p.id; $('plannedDate').value = p.plannedDate; $('planPlatform').value = p.platform; $('planFormat').value = p.format; $('planTitle').value = p.title; $('planTags').value = p.tags.join(', '); $('planStatus').value = p.status; $('planNotes').value = p.notes;
    els.planSubmitBtn.textContent = 'Save Plan'; els.cancelPlanEditBtn.hidden = false; return;
  }
  if (e.target.hasAttribute('data-plan-delete')) { plans = plans.filter((x) => x.id !== id); save(); rerender(); showToast('Plan deleted'); return; }
  if (e.target.hasAttribute('data-plan-convert')) {
    $('title').value = p.title; $('platform').value = p.platform; $('format').value = p.format; $('tags').value = p.tags.join(', '); $('uploadDate').value = p.plannedDate; $('notes').value = p.notes;
    els.tabs.find((x) => x.dataset.tab === 'log').click(); showToast('Plan copied to Video Log form');
  }
});
els.plannerList.addEventListener('change', (e) => {
  const id = e.target.getAttribute('data-plan-link'); if (!id) return;
  const p = plans.find((x) => x.id === id); if (!p) return;
  p.linkedVideoId = e.target.value; save(); renderPlanner();
});

els.themeToggle.addEventListener('click', () => { document.documentElement.classList.toggle('dark'); const dark = document.documentElement.classList.contains('dark'); localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); els.themeToggle.textContent = dark ? '☀️ Light' : '🌙 Dark'; renderStatsInsights(); });
function initTheme() { const saved = localStorage.getItem(THEME_KEY); const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.classList.toggle('dark', dark); els.themeToggle.textContent = dark ? '☀️ Light' : '🌙 Dark'; }

els.exportBtn.addEventListener('click', () => download('creator-compass-export.json', JSON.stringify({ exportedAt: new Date().toISOString(), entries, plans }, null, 2), 'application/json'));
els.exportCsvBtn.addEventListener('click', () => download('creator-compass-logs.csv', toCsv(entries, ['title', 'platform', 'format', 'uploadDate', 'views24h', 'views7d', 'firstHourViews', 'hookType', 'retentionRating', 'ctaUsed', 'audioType', 'postTime', 'tags', 'notes']), 'text/csv'));
els.exportPlannerCsvBtn.addEventListener('click', () => download('creator-compass-planner.csv', toCsv(plans, ['plannedDate', 'platform', 'format', 'title', 'status', 'tags', 'linkedVideoId', 'notes']), 'text/csv'));
function toCsv(rows, headers) { return `${headers.join(',')}\n${rows.map((r) => headers.map((h) => `"${String(h === 'tags' ? (r.tags || []).join('|') : (r[h] ?? '')).replaceAll('"', '""')}"`).join(',')).join('\n')}`; }
function download(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

els.importInput.addEventListener('change', async (e) => {
  els.importError.textContent = '';
  const f = e.target.files?.[0]; if (!f) return;
  try {
    const parsed = JSON.parse(await f.text());
    if (!Array.isArray(parsed.entries)) throw new Error('Expected entries array');
    entries = migrateEntries(parsed.entries);
    plans = migratePlans(parsed.plans || []);
    save(); rerender(); showToast('Import complete');
  } catch (err) { els.importError.textContent = `Import failed: ${err.message}`; }
  e.target.value = '';
});

els.resetBtn.addEventListener('click', () => { els.resetConfirmInput.value = ''; els.resetError.textContent = ''; els.resetDialog.showModal(); });
els.cancelResetBtn.addEventListener('click', () => els.resetDialog.close());
els.resetFormModal.addEventListener('submit', (e) => { e.preventDefault(); if (els.resetConfirmInput.value.trim() !== 'RESET') { els.resetError.textContent = 'Type RESET exactly.'; return; } entries = []; plans = []; save(); resetVideoForm(); resetPlanForm(); els.resetDialog.close(); rerender(); showToast('All data reset'); });

els.timeChart.addEventListener('mousemove', (e) => {
  const p = els.timeChart.__points || []; if (!p.length) return;
  const rect = els.timeChart.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
  hovered = p.find((pt) => Math.hypot(pt.x - x, pt.y - y) < 10) || null;
  if (!hovered) return;
  const { ctx } = setupCanvas(els.timeChart); drawViewsChart();
  const t = chartTheme(); ctx.fillStyle = t.card; ctx.strokeStyle = t.axis; ctx.fillRect(hovered.x + 8, hovered.y - 26, 90, 22); ctx.strokeRect(hovered.x + 8, hovered.y - 26, 90, 22); ctx.fillStyle = t.text; ctx.font = '11px sans-serif'; ctx.fillText(`${hovered.v} views`, hovered.x + 12, hovered.y - 11);
});
els.timeChart.addEventListener('mouseleave', () => { hovered = null; drawViewsChart(); });
window.addEventListener('resize', () => { clearTimeout(window.__cc_r); window.__cc_r = setTimeout(renderStatsInsights, 140); });
if (els.attachYoutubeBtn) els.attachYoutubeBtn.addEventListener('click', () => callYoutubePublic('attach'));
if (els.fetchYoutubeStatsBtn) els.fetchYoutubeStatsBtn.addEventListener('click', () => callYoutubePublic('snapshot'));

setupTabs(); initTheme(); els.lastSaved.textContent = localStorage.getItem(STORAGE_KEY) ? `Last saved: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Last saved: —'; rerender(); renderYoutubeSnapshots();

setupTabs(); initTheme(); els.lastSaved.textContent = localStorage.getItem(STORAGE_KEY) ? `Last saved: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Last saved: —'; rerender();
