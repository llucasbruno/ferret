// ══════════════════════════════════════════════
//  DRAG SCROLL — Arrastar para rolar kanban
// ══════════════════════════════════════════════
function enableDragScroll(el) {
  if (!el || el._dragScrollEnabled) return;
  el._dragScrollEnabled = true;

  let isDown = false, startX = 0, scrollLeft = 0;

  el.addEventListener('mousedown', e => {
    // Ignora se clicou em card, botão ou drag handle
    if (e.target.closest('.kc, button, select, input, .kp-btn')) return;
    isDown    = true;
    startX    = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  });

  el.addEventListener('mouseleave', () => {
    isDown = false;
    el.style.cursor = '';
    el.style.userSelect = '';
  });

  el.addEventListener('mouseup', () => {
    isDown = false;
    el.style.cursor = '';
    el.style.userSelect = '';
  });

  el.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeft - walk;
  });
}

function enableAllKanbanDragScroll() {
  enableDragScroll($('kanban-board'));
  enableDragScroll($('pd-kanban'));
}

// ══════════════════════════════════════════════
//  ICON HELPER — Ícones SVG inline
// ══════════════════════════════════════════════
const ICONS = {
  check:       '<polyline points="20 6 9 17 4 12"/>',
  x:           '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  play:        '<polygon points="5 3 19 12 5 21 5 3"/>',
  trash:       '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
  edit:        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  calendar:    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  user:        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  star:        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  alert:       '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  bell:        '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  message:     '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  clock:       '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  folder:      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  upload:      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  settings:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  award:       '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',
  megaphone:   '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
  key:         '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  target:      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trending_down: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  archive:     '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  file:        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  zap:         '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  refresh:     '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  lock:        '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  info:        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
};

// Helper: retorna SVG inline
function ic(name, size=12, color='currentColor') {
  const path = ICONS[name] || ICONS.info;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="stroke:${color};fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;display:inline-block;vertical-align:middle;">${path}</svg>`;
}

// ══════════════════════════════════════════════
//  UI.JS — Navegação, Sidebar, Filtros, Badges
// ══════════════════════════════════════════════

// ── Mobile sidebar ───────────────────────────
function toggleSidebar() {
  $('sidebar').classList.toggle('open');
  $('sidebar-overlay').style.display = $('sidebar').classList.contains('open') ? 'block' : 'none';
}
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebar-overlay').style.display = 'none';
}

// ── Sidebar content ──────────────────────────
function updateSidebar() {
  if (!meData) return;
  const av = $('sb-av');
  if (meData.photoURL) {
    av.innerHTML = `<img src="${meData.photoURL}" onerror="this.style.display='none';this.parentNode.textContent='${meData.displayName[0] || '?'}'" style="width:100%;height:100%;object-fit:cover;display:block">`;
  } else {
    av.textContent = meData.displayName[0] || '?';
  }
  $('sb-name').textContent = meData.displayName;
  const r = rank(meData.xp || 0), p = xpPct(meData.xp || 0);
  $('sb-rank').textContent = `${r.icon} ${r.name}`;
  $('sb-rank').style.color = r.color;
  $('sb-xp').style.width = p + '%';
  const isMgr = meData.access === 'manager';
  document.querySelectorAll('.mgr-only').forEach(el => el.classList.toggle('hidden', !isMgr));
  document.querySelectorAll('.member-only').forEach(el => el.classList.toggle('hidden', isMgr));
  if (!isMgr) updNotifBadge();
}

// ── Global project filter ────────────────────
function setGlobalProject(val) { globalProjFV = val; renderCurView(); }

function buildGlobalProjSel() {
  const sel = $('global-proj-sel');
  sel.innerHTML = `<option value="all">TODOS</option>` + projects.map(p => `<option value="${p.id}">${p.name.toUpperCase()}</option>`).join('');
  sel.value = globalProjFV;
}

// ── Navigation ───────────────────────────────
const NAV_ORDER = ['dashboard', 'projects', 'kanban', 'my-tasks', 'all-tasks', 'history', 'actions', 'approvals', 'members', 'notifications', 'profile', 'activity', 'studiodna', 'patchnotes'];

async function go(v) {
  const mgrOnly = ['activity', 'approvals', 'members'];
  if (mgrOnly.includes(v) && meData?.access !== 'manager') v = 'dashboard';
  curView = v; closeSidebar();
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  $('view-' + v)?.classList.add('active');
  const navKey = v === 'project-detail' ? 'projects' : v;
  document.querySelectorAll('.nav-item')[NAV_ORDER.indexOf(navKey)]?.classList.add('active');
  await renderCurView();
}

async function renderCurView() {
  const map = {
    dashboard: renderDash,
    projects: renderProjects,
    'project-detail': renderProjectDetail,
    kanban: renderKanban,
    'my-tasks': renderMyTasks,
    'all-tasks': renderAllTasks,
    history: renderHistory,
    actions: renderActions,
    approvals: renderApprovals,
    members: renderMembers,
    notifications: renderNotifications,
    profile: renderProfile,
    activity: renderActivity,
    patchnotes: renderPatchNotes,
    studiodna: renderStudioDNA
  };
  await map[curView]?.();
}

// ── View filters ─────────────────────────────
function myFilter(val, btn)   { myFV   = val; document.querySelectorAll('#my-tabs .ftab').forEach(t => t.classList.remove('active'));   btn.classList.add('active'); renderMyTasks(); }
function allFilter(val, btn)  { allFV  = val; document.querySelectorAll('#all-tabs .ftab').forEach(t => t.classList.remove('active'));  btn.classList.add('active'); renderAllTasks(); }
function histFilter(val, btn) { histFV = val; document.querySelectorAll('#hist-tabs .ftab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); renderHistory(); }
function projFilter(val, btn) { projFV = val; document.querySelectorAll('#proj-tabs .ftab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); renderProjects(); }
function apFilter(val, btn)   { apFV   = val; document.querySelectorAll('#ap-tabs .ftab').forEach(t => t.classList.remove('active'));   btn.classList.add('active'); renderActions(); }

// ── Tag filter ───────────────────────────────
function _toggleTag(tag) {
  if (tagFV.includes(tag)) tagFV = tagFV.filter(t => t !== tag);
  else tagFV = [...tagFV, tag];
}
function toggleTagFilter(tag) { _toggleTag(tag); renderCurView(); }
function filterByTag(tag)     { _toggleTag(tag); go('all-tasks'); }
function clearTagFilter()     { tagFV = []; renderCurView(); }
function removeTag(tag)       { tagFV = tagFV.filter(t => t !== tag); renderCurView(); }

function buildTagBar(taskList) {
  const counts = {};
  taskList.forEach(t => (t.tags || []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; }));
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  if (!sorted.length) return '';
  const chips = sorted.map(([tag, n]) => {
    const active = tagFV.includes(tag);
    return `<span class="tag-pill${active ? ' active' : ''}" onclick="toggleTagFilter(${JSON.stringify(tag)})">${tag} <span style="opacity:.5">${n}</span></span>`;
  }).join('');
  const activeChips = tagFV.map(tag => `<span class="tag-active-chip">🏷 ${tag} <button onclick="removeTag('${tag}')">✕</button></span>`).join('');
  return `<div class="tag-filter-bar">
    <span style="font-family:var(--M);font-size:9px;color:var(--dim);letter-spacing:1px;flex-shrink:0;">TAGS:</span>
    ${chips}
    ${tagFV.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-left:4px;padding-left:8px;border-left:1px solid rgba(255,255,255,.1);">${activeChips}<button class="btn btn-ghost btn-sm" style="font-size:9px;padding:2px 6px;" onclick="clearTagFilter()">LIMPAR</button></div>` : ''}
  </div>`;
}

function applyTagFilter(arr)     { if (!tagFV.length) return arr; return arr.filter(t => tagFV.every(tag => (t.tags || []).includes(tag))); }
function filterByGlobalProj(arr) { if (globalProjFV === 'all') return arr; return arr.filter(t => t.projectId === globalProjFV); }

// ── Badges ───────────────────────────────────
async function updBadge() {
  const taskPending = tasks.filter(t => t.status === 'pending_approval').length;
  const assignSnap  = await db.collection('projectAssignmentRequests').where('status', '==', 'pending').get();
  const delSnap     = await db.collection('projectDeletionRequests').where('status', '==', 'pending').get();
  const delForMe    = delSnap.docs.filter(d => d.data().requestedBy !== me.uid).length;
  const apSnap      = await db.collection('actionPlans').where('status', '==', 'pending_approval').get();
  const n = taskPending + assignSnap.size + delForMe + apSnap.size;
  const b = $('appr-badge'); b.textContent = n; b.classList.toggle('hidden', n === 0);
}

async function updNotifBadge() {
  if (!me) return;
  const s = await db.collection('notifications').where('toUid', '==', me.uid).get();
  const n = s.docs.filter(d => d.data().read === false).length;
  const b = $('notif-badge'); b.textContent = n; b.classList.toggle('hidden', n === 0);
}

// ── Render helpers ───────────────────────────
function renderLogs(logs) {
  if (!logs.length) return `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><h3>SEM ATIVIDADE</h3></div>`;
  return logs.map(l => {
    const m    = LOG_META[l.action] || { color: 'var(--dim)', cat: 'system' };
    const svg  = LOG_SVG[l.action]  || '<circle cx="12" cy="12" r="4"/>';
    const user = users.find(u => u.uid === l.userId);
    const av   = user?.photoURL
      ? `<img src="${user.photoURL}" onerror="this.style.display='none';this.parentNode.textContent='${(user.displayName||'?')[0]}'" style="width:100%;height:100%;object-fit:cover;display:block;">`
      : `<span style="font-family:var(--R);font-weight:700;font-size:14px;">${(l.userName||'?')[0].toUpperCase()}</span>`;

    return `<div class="al-item" style="border-left:3px solid ${m.color}44;padding:10px 14px;margin-bottom:6px;background:var(--bg2);border-radius:0 4px 4px 0;display:flex;align-items:center;gap:12px;">
      <!-- Avatar do usuário -->
      <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:var(--bg3);border:2px solid ${m.color}55;display:flex;align-items:center;justify-content:center;color:${m.color};flex-shrink:0;">
        ${av}
      </div>
      <!-- Conteúdo -->
      <div style="flex:1;min-width:0;">
        <div class="al-txt" style="color:var(--cream);">${l.details}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
          <span class="al-time">${fmtTime(l.createdAt)}</span>
          <!-- Ícone SVG + label da ação -->
          <span style="display:inline-flex;align-items:center;gap:4px;background:${m.color}15;border:1px solid ${m.color}33;padding:1px 7px;border-radius:20px;">
            <svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:${m.color};fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;">${svg}</svg>
            <span style="font-family:var(--M);font-size:9px;color:${m.color};letter-spacing:1px;">${(l.action||'').toUpperCase().replace(/_/g,' ')}</span>
          </span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Boot ─────────────────────────────────────
async function boot() {
  updateSidebar(); show('main-app'); hide('auth-screen');
  await refresh(); buildGlobalProjSel();
  await go('dashboard');
  startListeners();
  await updBadge();
}