// ══════════════════════════════════════════════
//  DASHBOARD.JS — Dashboard e métricas
// ══════════════════════════════════════════════

function renderMetrics() {
  const isMgr = meData?.access === 'manager';
  const myTasks = tasks.filter(t => t.assigneeId === me.uid && !['rejected', 'done'].includes(t.status));
  const active  = myTasks.filter(t => ['active', 'in_progress'].includes(t.status)).length;
  const overdue = myTasks.filter(t => isOverdue(t)).length;
  const xp      = meData?.xp || 0;
  const r       = rank(xp);
  const done    = meData?.tasksCompleted || 0;
  const pending = isMgr ? tasks.filter(t => t.status === 'pending_approval').length : 0;

  const ic = (path, extra = '') => `<svg viewBox="0 0 24 24" ${extra}>${path}</svg>`;
  const iconXP      = ic('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>');
  const iconRank    = ic('<path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/><path d="M15 7a3 3 0 1 0-6 0"/><path d="M18.05 7.27A9 9 0 1 0 5.95 7.27"/>');
  const iconDone    = ic('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>');
  const iconActive  = ic('<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>');
  const iconOverdue = ic('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>');
  const iconPending = ic('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><circle cx="12" cy="12" r="3"/>');

  const card = (cls, icon, label, value, color, sub) => `
    <div class="metric-card ${cls}" onclick="${cls === 'm-overdue' ? "go('my-tasks');myFilter('active',document.querySelector('.ftab'))" : `go('${cls === 'm-active' || cls === 'm-overdue' ? 'my-tasks' : cls === 'm-done' ? 'history' : cls === 'm-pending' ? 'approvals' : 'profile'}')`}" style="cursor:pointer;">
      <div class="metric-label" style="color:${color};">${icon} ${label}</div>
      <div class="metric-value" style="color:${color};">${value}</div>
      ${sub ? `<div class="metric-sub">${sub}</div>` : ''}
    </div>`;

  $('dash-metrics').innerHTML =
    card('m-xp',     iconXP,      'MEU XP',     xp.toLocaleString(), 'var(--gold)',  r.icon + ' ' + r.name) +
    card('m-rank',   iconRank,    'RANK',        r.name,              r.color,       xp + ' / ' + (rank(xp + 1)?.min || 'MAX') + ' XP') +
    card('m-done',   iconDone,    'CONCLUÍDAS',  done,                'var(--green)', 'tasks finalizadas') +
    card('m-active', iconActive,  'ATIVAS',      active,              'var(--cyan)',  'em andamento') +
    card('m-overdue', iconOverdue, 'EM ATRASO',  overdue,             overdue > 0 ? 'var(--red)' : 'var(--dim)', overdue > 0 ? 'requer atenção' : 'tudo em dia') +
    (isMgr ? card('m-pending', iconPending, 'APROVAÇÕES', pending, '#F5C518', pending > 0 ? 'aguardando revisão' : 'nenhuma pendente') : '');
}

async function renderDash() {
  renderMetrics();

  // Mini project cards
  const activeProjs = projects.filter(p => !p.archived).slice(0, 6);
  $('dash-projects').innerHTML = activeProjs.length
    ? `<div class="proj-grid">${activeProjs.map(p => {
        const pt = tasks.filter(t => t.projectId === p.id && !['rejected', 'pending_approval'].includes(t.status));
        const done = pt.filter(t => t.status === 'done').length, pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
        return `<div class="proj-card" onclick="go('kanban');kanbanProjFV='${p.id}'" style="border-color:${p.color}22">
          <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${p.color},transparent)"></div>
          <div class="proj-card-header"><div class="proj-dot" style="background:${p.color}"></div><div class="proj-name">${p.name}</div><span style="font-family:var(--M);font-size:10px;color:${p.color}">${pct}%</span></div>
          <div class="proj-client" style="padding-left:20px">${p.client || '—'}</div>
          <div class="proj-bar"><div class="proj-bar-fill" style="width:${pct}%;background:${p.color}"></div></div>
          <div class="proj-stats">
            <div class="proj-stat"><div class="proj-stat-v" style="color:${p.color}">${pt.length}</div><div class="proj-stat-l">Total</div></div>
            <div class="proj-stat"><div class="proj-stat-v">${done}</div><div class="proj-stat-l">Feitas</div></div>
            <div class="proj-stat"><div class="proj-stat-v" style="color:var(--red)">${pt.filter(t => isOverdue(t)).length}</div><div class="proj-stat-l">Atras.</div></div>
            <div class="proj-stat"><div class="proj-stat-v" style="color:#F5C518">${pt.filter(t => t.status === 'pending_approval').length}</div><div class="proj-stat-l">Aprov.</div></div>
          </div>
        </div>`;
      }).join('')}</div>`
    : `<div class="empty" style="padding:20px;"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div><h3>SEM PROJETOS</h3><p style="margin-bottom:10px">Crie o primeiro projeto para organizar as tasks</p>${meData?.access === 'manager' ? `<button class="btn btn-primary btn-sm" onclick="go('projects');openCreateProject()">+ CRIAR PROJETO</button>` : ''}</div>`;

  // Ranking
  const stats = users.map(u => {
    const ut = tasks.filter(t => t.assigneeId === u.uid && !['rejected', 'pending_approval', 'done'].includes(t.status));
    return { ...u, overdue: ut.filter(t => isOverdue(t)).length, total: ut.length };
  }).sort((a, b) => (b.xp || 0) - (a.xp || 0));

  $('rank-grid').innerHTML = stats.map((u, i) => {
    const r = rank(u.xp || 0), n = nextRank(u.xp || 0), p = xpPct(u.xp || 0);
    const medal = i === 0 ? `<span style="color:var(--gold)">#1 ★</span>` : i === 1 ? `<span style="color:#C0C0C0">#2</span>` : i === 2 ? `<span style="color:#CD7F32">#3</span>` : `<span style="color:var(--dim)">#${i + 1}</span>`;
    const av = u.photoURL ? `<img src="${u.photoURL}" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:cover;display:block">` : (u.displayName[0] || '?');
    return `<div class="rm"><div class="rm-pos">${medal}</div>
      <div class="rm-head"><div class="avatar" style="width:42px;height:42px;font-size:17px;">${av}</div>
      <div><div class="rm-name">${u.displayName}</div><div class="rm-role">${u.cargo || '—'}</div>
      <div class="rank-badge" style="background:${r.color}20;color:${r.color};border:1px solid ${r.color}40;">${r.icon} ${r.name}</div></div></div>
      <div class="rm-stats">
        <div class="rm-stat"><div class="rm-sv">${u.tasksCompleted || 0}</div><div class="rm-sl">Feitas</div></div>
        <div class="rm-stat"><div class="rm-sv" style="color:${u.overdue > 0 ? 'var(--red)' : 'var(--cream)'}">${u.overdue}</div><div class="rm-sl">Atraso</div></div>
        <div class="rm-stat"><div class="rm-sv" style="color:${i === 0 ? 'var(--gold)' : 'var(--cream)'}">${u.xp || 0}</div><div class="rm-sl">XP</div></div>
      </div>
      <div class="pbar"><div class="pfill" style="width:${p}%"></div></div>
      <div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-top:4px;display:flex;justify-content:space-between;">
        <span>${u.xp || 0} XP${n ? ' → ' + n.name : ' MAX'}</span><span>${r.icon} ${r.name}</span></div>
      <div class="xp-bar2" style="overflow:hidden;"><div style="height:100%;width:${p}%;background:${r.color};opacity:.7;"></div></div></div>`;
  }).join('');

  $('dash-activity').innerHTML = `<div>${renderLogs(await loadLog(5))}</div>`;
}
