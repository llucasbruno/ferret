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
const NAV_ORDER = ['dashboard', 'projects', 'kanban', 'my-tasks', 'all-tasks', 'history', 'actions', 'approvals', 'members', 'notifications', 'profile', 'activity', 'patchnotes', 'studiodna'];

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
  if (!logs.length) return `<div class="empty"><div class="empty-icon">📜</div><h3>SEM ATIVIDADE</h3></div>`;
  return logs.map(l => {
    const m = LOG_META[l.action] || { icon: '•', color: 'var(--dim)', cat: 'system' };
    return `<div class="al-item" style="border-left:3px solid ${m.color}33;padding:10px 14px;margin-bottom:6px;background:var(--bg2);border-radius:0 4px 4px 0;">
      <div class="al-dot" style="background:${m.color}22;color:${m.color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${m.icon}</div>
      <div style="flex:1;min-width:0;">
        <div class="al-txt" style="color:var(--cream);">${l.details}</div>
        <div style="display:flex;gap:8px;margin-top:3px;flex-wrap:wrap;">
          <span class="al-time">${fmtTime(l.createdAt)}</span>
          <span style="font-family:var(--M);font-size:9px;color:${m.color};letter-spacing:1px;">${(l.action || '').toUpperCase().replace(/_/g, ' ')}</span>
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