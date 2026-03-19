// ══════════════════════════════════════════════
//  KANBAN.JS — Board, cards e drag-and-drop
// ══════════════════════════════════════════════

let kanbanView = 'board'; // 'board' | 'archived'

async function renderKanban() {
  await refresh();

  const kps = $('kanban-proj-sel');
  kps.innerHTML = `<button class="kp-btn ${kanbanProjFV === 'all' ? 'active' : ''}" onclick="kanbanProjFV='all';renderKanban()">TODOS</button>` +
    projects.filter(p => !p.archived).map(p => `<button class="kp-btn ${kanbanProjFV === p.id ? 'active' : ''}" onclick="kanbanProjFV='${p.id}';renderKanban()" style="${kanbanProjFV === p.id ? `border-color:${p.color};color:${p.color}` : ''}">${p.name.toUpperCase()}</button>`).join('');

  let filtered = tasks.filter(t => t.status !== 'rejected');
  if (kanbanProjFV !== 'all') filtered = filtered.filter(t => t.projectId === kanbanProjFV);
  if (globalProjFV !== 'all') filtered = filtered.filter(t => t.projectId === globalProjFV);

  const isMgr = meData?.access === 'manager';
  const board  = $('kanban-board');
  const tabs   = $('kanban-view-tabs');

  // Render view tabs
  if (tabs) tabs.innerHTML = `
    <button class="kp-btn ${kanbanView === 'board' ? 'active' : ''}" onclick="kanbanView='board';renderKanban()">BOARD</button>
    <button class="kp-btn ${kanbanView === 'archived' ? 'active' : ''}" style="${kanbanView === 'archived' ? 'border-color:var(--dim);color:var(--cream);' : ''}" onclick="kanbanView='archived';renderKanban()">ARQUIVADAS</button>
  `;

  // Archived view
  if (kanbanView === 'archived') {
    const archived = tasks.filter(t => t.status === 'archived');
    if (!archived.length) {
      board.innerHTML = `<div style="font-family:var(--M);font-size:11px;color:var(--dim);padding:30px;letter-spacing:2px;">NENHUMA TASK ARQUIVADA</div>`;
      return;
    }
    board.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:600px;">
      ${archived.map(t => `<div class="kc" style="opacity:.7;cursor:pointer;" onclick="openTask('${t.id}')">
        <div class="kc-title">${t.title}</div>
        <div style="font-family:var(--M);font-size:9px;color:var(--dim);margin-top:6px;">${t.assigneeName} · ${fmtDate(t.archivedAt?.toDate ? t.archivedAt.toDate() : new Date())}</div>
      </div>`).join('')}
    </div>`;
    return;
  }

  // Normal board view — exclude archived
  filtered = filtered.filter(t => t.status !== 'archived');

  board.innerHTML = KANBAN_COLS.map(col => {
    const isFinal  = col.id === 'finalized';
    const colTasks = filtered.filter(t => t.status === col.id).sort((a, b) => {
      const pa = { critical: 0, high: 1, medium: 2, low: 3 };
      return (pa[a.priority] || 2) - (pa[b.priority] || 2);
    });
    // FINALIZADO col: only ADM can drop
    const canDrop = isFinal ? isMgr : true;
    return `<div class="kb-col" data-status="${col.id}"
      ${canDrop ? `ondragover="event.preventDefault();this.querySelector('.kb-col-body').classList.add('drag-over')" ondragleave="this.querySelector('.kb-col-body').classList.remove('drag-over')" ondrop="onDrop(event,'${col.id}')"` : ''}>
      <div class="kb-col-head" style="${isFinal ? 'border-bottom:1px solid rgba(204,136,255,.2);' : ''}">
        <span class="kb-col-title" style="color:${col.color}">${col.label}</span>
        <span class="kb-col-count">${colTasks.length}</span>
        ${isFinal && !isMgr ? `<span style="font-family:var(--M);font-size:8px;color:var(--dim);letter-spacing:1px;">${ic('lock',10,'var(--dim)')}</span>` : ''}
      </div>
      <div class="kb-col-body" data-status="${col.id}" style="${isFinal && !isMgr ? 'opacity:.5;pointer-events:none;' : ''}">
        ${colTasks.map(t => kanbanCard(t)).join('')}
        ${colTasks.length === 0 ? `<div style="font-family:var(--M);font-size:10px;color:rgba(255,255,255,.15);text-align:center;padding:20px 10px;letter-spacing:2px;">${canDrop ? 'SOLTE AQUI' : '🔒'}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  enableDragScroll($('kanban-board'));
}

function kanbanCard(t) {
  const dl       = t.deadline?.toDate ? t.deadline.toDate() : t.deadline ? new Date(t.deadline) : null;
  const overdue  = isOverdue(t);
  const assignee = users.find(u => u.uid === t.assigneeId);
  const col      = projColor(t.projectId);
  const pname    = t.projectName || projName(t.projectId);
  const av       = assignee?.photoURL ? `<img src="${assignee.photoURL}" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:cover;display:block">` : (assignee?.displayName[0] || '?');
  const isMgr    = meData?.access === 'manager';
  const isPending = t.status === 'pending_approval';
  const locked   = isPending && !isMgr;
  return `<div class="kc p-${t.priority}${locked ? ' locked' : ''}"
    ${locked ? '' : `draggable="true" ondragstart="dragTask='${t.id}';this.classList.add('dragging')" ondragend="this.classList.remove('dragging')"`}
    onclick="openTask('${t.id}')" style="${locked ? 'opacity:.55;cursor:default;' : ''}" title="${locked ? 'Aguardando aprovação do ADM' : ''}">
    <span class="kc-drag-handle" style="${locked ? 'opacity:.3;cursor:not-allowed;' : ''}">⠿</span>
    ${locked ? `<div style="font-family:var(--M);font-size:9px;color:#F5C518;margin-bottom:5px;letter-spacing:1px;">⏳ AGUARDANDO APROVAÇÃO</div>` : ''}
    <div style="display:inline-flex;align-items:center;gap:5px;background:${col}22;border:1px solid ${col}55;padding:2px 8px;border-radius:2px;margin-bottom:8px;max-width:100%;">
      <div style="width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0;"></div>
      <span style="font-family:var(--M);font-size:9px;color:${col};letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pname}</span>
    </div>
    <div class="kc-title">${t.title}</div>
    <div class="kc-meta">
      <div class="kc-assign">
        <div class="kc-mini-av">${av}</div>
        <span>${assignee?.displayName?.split(' ')[0] || '—'}</span>
      </div>
      <span class="kc-dl ${overdue ? 'kc-overdue' : ''}"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${fmtDate(dl)}${overdue ? ' ⚠' : ''}</span>
    </div>
    <div style="margin-top:7px;display:flex;gap:4px;flex-wrap:wrap;">
      <span class="kc-prio bp-${t.priority}">${PL[t.priority]}</span>
      <span style="font-family:var(--M);font-size:9px;color:var(--gold);">+${t.xpReward}</span>
    </div>
    ${(t.tags || []).length ? `<div style="margin-top:5px;display:flex;gap:3px;flex-wrap:wrap;">${(t.tags || []).map(x => `<span class="tag-pill${tagFV.includes(x) ? ' active' : ''}" data-tag="${x.replace(/"/g, '&quot;')}" onclick="event.stopPropagation();filterByTag(this.dataset.tag)">${x}</span>`).join('')}</div>` : ''}
    ${(()=>{const subs=t.subtasks||[];if(!subs.length)return'';const pct=calcProgress(subs);const done=subs.filter(x=>x.done).length;return`<div style="margin-top:7px;"><div style="display:flex;justify-content:space-between;font-family:var(--M);font-size:8px;color:var(--dim);margin-bottom:3px;"><span>${done}/${subs.length} subtasks</span><span style="color:${pct===100?'var(--green)':'var(--cyan)'};">${pct}%</span></div><div style="height:2px;background:var(--bg3);border-radius:1px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${pct===100?'var(--green)':'var(--cyan)'};border-radius:1px;"></div></div></div>`;})()}
  </div>`;
}

function onDrop(e, newStatus) {
  e.preventDefault();
  document.querySelectorAll('.kb-col-body').forEach(c => c.classList.remove('drag-over'));
  if (!dragTask) return;
  moveTaskStatus(dragTask, newStatus);
  dragTask = null;
}