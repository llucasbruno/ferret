let projectDetailView = "kanban"; // "kanban" | "list"

// ══════════════════════════════════════════════
//  PROJECTS.JS — Projetos
// ══════════════════════════════════════════════

let deleteProjId = null, rejProjId = null;
let curProjectId = null, assignTaskId = null;

// ── Cover preview ────────────────────────────
function previewCover(url) {
  const el = $('proj-cover-preview'); if (!el) return;
  if (url) { el.style.backgroundImage = `url('${url}')`; el.style.display = 'block'; }
  else     { el.style.backgroundImage = ''; el.style.display = 'none'; }
}

// ── Create / Edit ────────────────────────────
function openCreateProject() {
  editProjId = null;
  $('m-proj-modal-title').innerHTML = 'NOVO <span style="color:var(--red)">PROJETO</span>';
  ['proj-name', 'proj-client', 'proj-desc', 'proj-cover'].forEach(id => $(id).value = '');
  $('proj-color').value = '#FF4655';
  $('proj-cover-preview').style.display = 'none';
  const today = new Date().toISOString().split('T')[0];
  $('proj-start').value = today; $('proj-deadline').value = '';
  showModal('m-project');
}

function openRequestProject() {
  editProjId = null;
  $('m-proj-modal-title').innerHTML = 'SOLICITAR <span style="color:var(--red)">PROJETO</span>';
  ['proj-name', 'proj-client', 'proj-desc'].forEach(id => $(id).value = '');
  $('proj-color').value = '#FF4655';
  const today = new Date().toISOString().split('T')[0];
  $('proj-start').value = today; $('proj-deadline').value = '';
  showModal('m-project');
}

function openEditProject(id) {
  editProjId = id;
  const p = projects.find(x => x.id === id); if (!p) return;
  $('m-proj-modal-title').innerHTML = 'EDITAR <span style="color:var(--red)">PROJETO</span>';
  $('proj-name').value = p.name || ''; $('proj-client').value = p.client || '';
  $('proj-desc').value = p.description || ''; $('proj-color').value = p.color || '#FF4655';
  $('proj-cover').value = p.coverImage || '';
  previewCover(p.coverImage || '');
  const toDate = d => d?.toDate ? d.toDate() : d ? new Date(d) : null;
  const fmtInput = d => { if (!d) return ''; const dt = toDate(d); if (!dt) return ''; return dt.toISOString().split('T')[0]; };
  $('proj-start').value = fmtInput(p.startDate); $('proj-deadline').value = fmtInput(p.deadline);
  showModal('m-project');
}

async function saveProject() {
  const name = $('proj-name').value.trim();
  if (!name) { toast('Informe o nome do projeto', false); return; }
  const isMgr = meData.access === 'manager';
  const data = {
    name, client: $('proj-client').value.trim(), description: $('proj-desc').value.trim(),
    color: $('proj-color').value, coverImage: $('proj-cover').value.trim() || null,
    startDate: $('proj-start').value ? new Date($('proj-start').value + 'T00:00:00') : null,
    deadline: $('proj-deadline').value ? new Date($('proj-deadline').value + 'T00:00:00') : null
  };
  if (editProjId) {
    await db.collection('projects').doc(editProjId).update(data);
    await log('project_update', `${meData.displayName} editou o projeto "${name}"`);
    toast('Projeto atualizado!', true);
  } else {
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    data.createdById = me.uid;
    data.requestedBy = meData.displayName;
    data.status = isMgr ? 'active' : 'pending';
    await db.collection('projects').add(data);
    if (isMgr) {
      await log('project_create', `${meData.displayName} criou o projeto "${name}"`);
      toast('Projeto criado!', true);
    } else {
      await log('project_create', `${meData.displayName} solicitou o projeto "${name}" (aguardando aprovação)`);
      toast('Solicitação enviada! Aguardando aprovação.', true);
    }
  }
  closeModal('m-project'); await refresh(); buildGlobalProjSel(); renderCurView();
}

// ── Approve / Reject project ─────────────────
async function approveProject(id) {
  const snap = await db.collection('projects').doc(id).get();
  const p = { id, ...snap.data() };
  await db.collection('projects').doc(id).update({ status: 'active', rejectionReason: null });
  await log('project_update', `${meData.displayName} aprovou o projeto "${p.name}"`);
  await saveNotif(p.createdById, 'project_approved', p.name);
  toast('Projeto aprovado!', true); await refresh(); buildGlobalProjSel(); renderCurView();
}

function openRejectProject(id) { rejProjId = id; $('rej-proj-reason').value = ''; showModal('m-reject-proj'); }
async function doRejectProject() {
  const reason = $('rej-proj-reason').value.trim();
  if (!reason) { toast('Informe o motivo', false); return; }
  const snap = await db.collection('projects').doc(rejProjId).get();
  const p = { id: rejProjId, ...snap.data() };
  await db.collection('projects').doc(rejProjId).update({ status: 'rejected', rejectionReason: reason });
  await saveNotif(p.createdById, 'project_rejected', p.name, { reason });
  await log('project_update', `${meData.displayName} rejeitou o projeto "${p.name}": ${reason}`);
  closeModal('m-reject-proj'); toast('Projeto rejeitado'); await refresh(); buildGlobalProjSel(); renderCurView();
}

// ── Archive ──────────────────────────────────
async function archiveProject(id) {
  if (!confirm('Arquivar este projeto?')) return;
  await db.collection('projects').doc(id).update({ archived: true });
  await refresh(); buildGlobalProjSel(); renderCurView(); toast('Projeto arquivado');
}
async function unarchiveProject(id) {
  await db.collection('projects').doc(id).update({ archived: false });
  await refresh(); buildGlobalProjSel(); renderCurView(); toast('Projeto reativado!', true);
}

// ── Delete (2-ADM flow) ──────────────────────
async function openDeleteProject(id) {
  const existing = await db.collection('projectDeletionRequests').where('projectId', '==', id).where('status', '==', 'pending').get();
  if (!existing.empty) { toast('Já existe uma solicitação de exclusão pendente para este projeto.', false); return; }
  deleteProjId = id;
  const p = projects.find(x => x.id === id); if (!p) return;
  $('del-proj-name').textContent = p.name; $('del-proj-reason').value = '';
  showModal('m-delete-proj');
}

async function submitDeleteProject() {
  const reason = $('del-proj-reason').value.trim();
  if (!reason) { toast('Informe o motivo da exclusão', false); return; }
  const p = projects.find(x => x.id === deleteProjId); if (!p) return;
  await db.collection('projectDeletionRequests').add({
    projectId: deleteProjId, projectName: p.name,
    requestedBy: me.uid, requestedByName: meData.displayName,
    reason, status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  const otherMgrs = users.filter(u => u.access === 'manager' && u.uid !== me.uid);
  for (const mgr of otherMgrs) await saveNotif(mgr.uid, 'delete_request', p.name, { fromName: meData.displayName, reason: `Motivo: ${reason}` });
  await log('project_update', `${meData.displayName} solicitou exclusão do projeto "${p.name}": ${reason}`);
  closeModal('m-delete-proj'); toast('Solicitação enviada para outro ADM!', true); await updBadge();
}

async function approveDeleteProject(reqId) {
  const snap = await db.collection('projectDeletionRequests').doc(reqId).get();
  const r = snap.data(); if (!r) return;
  const taskSnap = await db.collection('tasks').where('projectId', '==', r.projectId).get();
  if (taskSnap.size > 0) {
    const batch = db.batch();
    taskSnap.docs.forEach(d => batch.update(d.ref, { projectId: null, projectName: null }));
    await batch.commit();
  }
  await db.collection('projects').doc(r.projectId).delete();
  await db.collection('projectDeletionRequests').doc(reqId).update({ status: 'approved' });
  await saveNotif(r.requestedBy, 'delete_approved', r.projectName, { fromName: meData.displayName });
  await log('project_update', `${meData.displayName} aprovou exclusão do projeto "${r.projectName}"`);
  toast('Projeto excluído!', true); await refresh(); buildGlobalProjSel(); renderCurView(); updBadge();
}

async function rejectDeleteProject(reqId) {
  const snap = await db.collection('projectDeletionRequests').doc(reqId).get();
  const r = snap.data(); if (!r) return;
  await db.collection('projectDeletionRequests').doc(reqId).update({ status: 'rejected' });
  await saveNotif(r.requestedBy, 'delete_rejected', r.projectName, { fromName: meData.displayName });
  await log('project_update', `${meData.displayName} rejeitou exclusão do projeto "${r.projectName}"`);
  toast('Solicitação rejeitada.', false); renderCurView(); updBadge();
}

// ── Task → Project assignment ─────────────────
function openAssignProject(taskId) {
  assignTaskId = taskId;
  const t = tasks.find(x => x.id === taskId); if (!t) return;
  const isMgr = meData?.access === 'manager';
  $('assign-task-info').innerHTML = `TASK: <strong style="color:var(--cream)">${t.title}</strong>${t.projectId ? ` · Projeto atual: <span style="color:var(--cyan)">${projName(t.projectId)}</span>` : ''}`;
  const opts = projects.filter(p => !p.archived && p.status === 'active').map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  $('assign-proj-select').innerHTML = `<option value="">— Sem projeto —</option>${opts}`;
  if (t.projectId) $('assign-proj-select').value = t.projectId;
  $('assign-member-notice').classList.toggle('hidden', isMgr);
  showModal('m-assign-project');
}

async function saveAssignProject() {
  const t = tasks.find(x => x.id === assignTaskId); if (!t) return;
  const projId = $('assign-proj-select').value;
  const isMgr  = meData?.access === 'manager';
  const proj   = projects.find(p => p.id === projId);
  if (isMgr) {
    await db.collection('tasks').doc(assignTaskId).update({ projectId: projId || null, projectName: proj?.name || null });
    closeModal('m-assign-project'); toast('Task atribuída ao projeto!', true);
  } else {
    await db.collection('projectAssignmentRequests').add({
      taskId: assignTaskId, taskTitle: t.title,
      projectId: projId || null, projectName: proj?.name || null,
      requestedBy: me.uid, requestedByName: meData.displayName,
      status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('m-assign-project'); toast('Solicitação enviada para o ADM!', true);
  }
}

async function approveAssignment(reqId) {
  const snap = await db.collection('projectAssignmentRequests').doc(reqId).get();
  const r = snap.data(); if (!r) return;
  const proj = projects.find(p => p.id === r.projectId);
  await db.collection('tasks').doc(r.taskId).update({ projectId: r.projectId || null, projectName: proj?.name || null });
  await db.collection('projectAssignmentRequests').doc(reqId).update({ status: 'approved' });
  await log('project_update', `${meData.displayName} aprovou vínculo de task "${r.taskTitle}" ao projeto "${r.projectName || 'nenhum'}"`);
  toast('Vínculo aprovado!', true);
}

async function rejectAssignment(reqId) {
  await db.collection('projectAssignmentRequests').doc(reqId).update({ status: 'rejected' });
  toast('Vínculo rejeitado.', false);
}

// ── Project Detail ───────────────────────────
function openProjectDetail(id) { curProjectId = id; go('project-detail'); }

async function openCreateForProject() {
  await openCreate();
  if ($('t-project') && curProjectId) $('t-project').value = curProjectId;
}

async function renderProjectDetail() {
  await refresh();
  const p = projects.find(x => x.id === curProjectId);
  if (!p) { go('projects'); return; }
  const isMgr     = meData?.access === 'manager';
  const hasAccess = currentUserHasAccess(p);
  const col       = p.color || 'var(--cyan)';
  const pt        = tasks.filter(t => t.projectId === p.id && t.status !== 'rejected' && t.status !== 'archived');
  const finalizedTasks = pt.filter(t => t.status === 'finalized').length;
  const pct  = pt.length ? Math.round((finalizedTasks / pt.length) * 100) : 0;
  const dl   = p.deadline?.toDate ? p.deadline.toDate() : p.deadline ? new Date(p.deadline) : null;

  // If no access — show locked state
  if (!hasAccess) {
    $('pd-header').innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">' +
        '<button class="btn btn-ghost btn-sm" onclick="go(&quot;projects&quot;)" style="padding:6px 10px;">← VOLTAR</button>' +
        '<div class="page-title">' + p.name + '</div>' +
      '</div>' +
      '<div style="background:var(--bg2);border:1px solid rgba(255,255,255,.06);clip-path:var(--clip-lg);padding:40px;text-align:center;margin-bottom:20px;">' +
        '<div style="margin-bottom:16px;">' + ic('lock', 40, 'var(--dim)') + '</div>' +
        '<div style="font-family:var(--R);font-size:18px;font-weight:700;letter-spacing:3px;color:var(--dim);margin-bottom:8px;">ACESSO RESTRITO</div>' +
        '<div style="font-family:var(--M);font-size:11px;color:var(--dim);margin-bottom:20px;">Você não é membro deste projeto.</div>' +
        '<button class="btn btn-ghost" onclick="requestProjectAccess(&quot;' + p.id + '&quot;)">' + ic('user',12,'currentColor') + ' SOLICITAR ACESSO</button>' +
      '</div>';
    $('pd-kanban').innerHTML = '';
    $('pd-tasks').innerHTML  = '';
    return;
  }

  $('pd-header').innerHTML = `
    ${p.coverImage ? `<div style="height:160px;background:url('${p.coverImage}') center/cover no-repeat;border-radius:4px;margin-bottom:18px;position:relative;"><div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,var(--bg) 100%);border-radius:4px;"></div></div>` : ''}
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <div style="width:14px;height:14px;border-radius:50%;background:${col};flex-shrink:0;"></div>
          <div class="page-title" style="font-size:26px;">${p.name}</div>
        </div>
        ${p.client ? `<div style="font-family:var(--M);font-size:11px;color:var(--dim);margin-left:24px;"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${p.client}</div>` : ''}
        ${p.description ? `<div style="font-size:13px;color:var(--dim);margin:8px 0 0 24px;line-height:1.5;">${p.description}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${isMgr ? `<button class="btn btn-ghost btn-sm" onclick="openEditProject('${p.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> EDITAR</button>` : ''}
        <button class="btn btn-primary btn-sm" onclick="openCreateForProject()">+ TASK</button>
        <button class="btn btn-ghost btn-sm" onclick="go('projects')">← VOLTAR</button>
      </div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
      <div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:${col}">${pt.length}</div><div class="proj-stat-l">Total</div></div>
      <div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:var(--green)">${finalizedTasks}</div><div class="proj-stat-l">Finalizadas</div></div>
      <div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:var(--red)">${pt.filter(t => isOverdue(t)).length}</div><div class="proj-stat-l">Atraso</div></div>
      ${dl ? `<div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:var(--dim);font-size:14px;">${fmtDate(dl)}</div><div class="proj-stat-l">Deadline</div></div>` : ''}
    </div>
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;font-family:var(--M);font-size:10px;color:var(--dim);margin-bottom:5px;"><span>PROGRESSO</span><span style="color:${col}">${pct}%</span></div>
      <div class="proj-bar" style="height:6px;"><div class="proj-bar-fill" style="width:${pct}%;background:${col}"></div></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:16px;">
      <button class="kp-btn ` + (projectDetailView === 'kanban' ? 'active' : '') + `" onclick="projectDetailView='kanban';renderProjectDetail()">KANBAN</button>
      <button class="kp-btn ` + (projectDetailView === 'list' ? 'active' : '') + `" onclick="projectDetailView='list';renderProjectDetail()">LISTA</button>
    </div>`;

  $('pd-header').innerHTML += renderProjectMembers(p);

  // ── Mini kanban com movimentação ─────────────
  const finalizedCount = tasks.filter(t => t.projectId === p.id && t.status === 'finalized').length;
  const totalActive    = tasks.filter(t => t.projectId === p.id && !['rejected','archived'].includes(t.status)).length;
  const pctFinal       = totalActive ? Math.round((finalizedCount / totalActive) * 100) : 0;

  $('pd-kanban').innerHTML = KANBAN_COLS.map(col => {
    const isFinal  = col.id === 'finalized';
    const colTasks = pt.filter(t => t.status === col.id);
    const canDrop  = isFinal ? isMgr : true;
    return `<div class="kb-col" data-status="${col.id}"
      ${canDrop ? `ondragover="event.preventDefault();this.querySelector('.kb-col-body').classList.add('drag-over')" ondragleave="this.querySelector('.kb-col-body').classList.remove('drag-over')" ondrop="projKanbanDrop(event,'${col.id}')"` : ''}>
      <div class="kb-col-head" style="${isFinal ? 'border-bottom:1px solid rgba(204,136,255,.2);' : ''}">
        <span class="kb-col-title" style="color:${col.color}">${col.label}</span>
        <span class="kb-col-count">${colTasks.length}</span>
        ${isFinal && !isMgr ? `<span>${ic('lock',10,'var(--dim)')}</span>` : ''}
      </div>
      <div class="kb-col-body" data-status="${col.id}" style="${isFinal && !isMgr ? 'opacity:.5;pointer-events:none;' : ''}">
        ${colTasks.map(t => kanbanCard(t)).join('')}
        ${colTasks.length === 0 ? `<div style="font-family:var(--M);font-size:10px;color:rgba(255,255,255,.15);text-align:center;padding:20px 10px;letter-spacing:2px;">${canDrop ? 'SOLTE AQUI' : ic('lock',12,'rgba(255,255,255,.1)')}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  enableDragScroll($('pd-kanban'));

  const allProjTasks = tasks.filter(t => t.projectId === p.id && t.status !== 'rejected' && t.status !== 'archived');
  $('pd-tasks').innerHTML = allProjTasks.length
    ? allProjTasks.map((t, i) => taskCard(t, i, false)).join('')
    : `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg></div><h3>SEM TASKS</h3><p>Crie a primeira task deste projeto</p></div>`;
}


// ── Project kanban action buttons ────────────
function _projKanbanActions(t, col, isMgr) {
  var subs    = t.subtasks || [];
  var subDone = subs.filter(function(x){ return x.done; }).length;
  var allDone = subs.length === 0 || subDone === subs.length;
  var id = t.id;
  var btns = '';
  var s = t.status;
  var qid = '&quot;' + id + '&quot;';

  if (s === 'active') {
    btns += '<button onclick="event.stopPropagation();projMoveTask(' + qid + ',&quot;in_progress&quot;)" style="' + _pkBtnStyle('var(--cyan)') + '">&#9654; INICIAR</button>';
  }
  if (s === 'in_progress') {
    if (allDone) {
      btns += '<button onclick="event.stopPropagation();projMoveTask(' + qid + ',&quot;done&quot;)" style="' + _pkBtnStyle('var(--green)') + '">' + ic('check',9,'var(--green)') + ' CONCLUIR</button>';
    } else {
      btns += '<button disabled title="Conclua todas as subtasks primeiro" style="' + _pkBtnStyle('var(--dim)') + 'opacity:.4;cursor:not-allowed;">' + ic('lock',9,'var(--dim)') + ' CONCLUIR</button>';
    }
  }
  if (s === 'done' && isMgr) {
    if (allDone) {
      btns += '<button onclick="event.stopPropagation();projFinalizeTask(' + qid + ')" style="' + _pkBtnStyle('#CC88FF') + '">&#9733; FINALIZAR</button>';
    } else {
      btns += '<button disabled title="Conclua todas as subtasks primeiro" style="' + _pkBtnStyle('var(--dim)') + 'opacity:.4;cursor:not-allowed;">' + ic('lock',9,'var(--dim)') + ' FINALIZAR</button>';
    }
  }
  if (s === 'finalized' && isMgr) {
    btns += '<button onclick="event.stopPropagation();projMoveTask(' + qid + ',&quot;done&quot;)" style="' + _pkBtnStyle('var(--dim)') + '">' + ic('refresh',9,'var(--dim)') + ' REABRIR</button>';
  }

  if (!btns) return '';
  return '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">' + btns + '</div>';
}

function _pkBtnStyle(color) {
  return 'background:' + color + '15;border:1px solid ' + color + '44;color:' + color + ';font-family:var(--M);font-size:9px;letter-spacing:1px;padding:2px 7px;cursor:pointer;border-radius:2px;display:inline-flex;align-items:center;gap:3px;';
}

// ── Project kanban drop handler ───────────────
// O kanban de projetos reutiliza o mesmo dragTask do kanban geral
// e o mesmo moveTaskStatus — apenas o renderCurView chama renderProjectDetail

function projKanbanDrop(event, newStatus) {
  event.preventDefault();
  // Remove drag-over de todas as colunas do projeto
  document.querySelectorAll('#pd-kanban .kb-col-body').forEach(el => el.classList.remove('drag-over'));
  if (!dragTask) return;
  // Usa moveTaskStatus que já tem toda a lógica de bloqueios, subtasks e _movingTask
  moveTaskStatus(dragTask, newStatus);
  dragTask = null;
}

// ── Project task move (botões de ação) ───────
async function projMoveTask(id, newStatus) {
  if (_movingTask) return;
  _movingTask = true;
  try {
    const t = tasks.find(x => x.id === id); if (!t) return;
    const isMgr = meData?.access === 'manager';

    if (newStatus === 'finalized' && !isMgr) { toast('Apenas ADMs podem finalizar tasks.', false); return; }
    if (t.status === 'finalized' && !isMgr)  { toast('Apenas ADMs podem reabrir tasks finalizadas.', false); return; }

    const subs = t.subtasks || [];
    if ((newStatus === 'done' || newStatus === 'finalized') && subs.length > 0 && !subs.every(s => s.done)) {
      toast(subs.filter(s => !s.done).length + ' subtask(s) ainda pendentes.', false);
      return;
    }

    if (newStatus === 'finalized') { await projFinalizeTask(id); return; }

    await db.collection('tasks').doc(id).update({ status: newStatus });
    await log('task_start', `${meData.displayName} moveu "${t.title}" para ${SL[newStatus] || newStatus}`);
    toast(`"${t.title}" movida para ${SL[newStatus] || newStatus}.`, true);
    await refresh(); renderProjectDetail();
  } finally {
    _movingTask = false;
  }
}

// ── Project finalize task (with XP) ──────────
async function projFinalizeTask(id) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  if (meData?.access !== 'manager') { toast('Apenas ADMs podem finalizar tasks.', false); return; }

  const subs = t.subtasks || [];
  if (subs.length > 0 && !subs.every(s => s.done)) {
    toast(subs.filter(s => !s.done).length + ' subtask(s) ainda pendentes. Não é possível finalizar.', false);
    return;
  }

  const xp = t.xpReward || XP_REWARD[t.priority] || 0;
  await db.collection('tasks').doc(id).update({ status: 'finalized', finalizedAt: firebase.firestore.FieldValue.serverTimestamp() });
  if (xp > 0) await addXP(t.assigneeId, xp, true);
  await saveNotif(t.assigneeId, 'task_approved', t.title, { fromName: meData.displayName, reason: `Task finalizada! +${xp} XP` });
  await log('task_finalize', `${meData.displayName} finalizou "${t.title}" (+${xp} XP)`);
  toast(`"${t.title}" finalizada! +${xp} XP`, true);
  await refresh(); renderProjectDetail();
}

// ── Render projects list ──────────────────────
async function renderProjects() {
  await refresh();
  const isMgr = meData?.access === 'manager';
  $('proj-head-acts').innerHTML = isMgr
    ? `<button class="btn btn-primary" onclick="openCreateProject()">+ NOVO PROJETO</button>`
    : `<button class="btn btn-ghost" onclick="openRequestProject()">+ SOLICITAR PROJETO</button>`;

  const delSnap = await db.collection('projectDeletionRequests').where('status', '==', 'pending').get();
  const delReqs = delSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const delCount = $('del-req-count');
  if (delCount) { delCount.textContent = delReqs.length; delCount.classList.toggle('hidden', delReqs.length === 0); }

  let html = '';

  if (projFV === 'active') {
    const pendingProjs = projects.filter(p => p.status === 'pending' && !p.archived);
    if (isMgr && pendingProjs.length) {
      html += `<div style="margin-bottom:24px;"><div class="sec">⏳ AGUARDANDO APROVAÇÃO</div>
        ${pendingProjs.map(p => `<div class="ac" style="margin-bottom:10px;">
          <div class="ac-head"><div>
            <div class="ac-meta">SOLICITADO POR: <strong>${p.requestedBy || '—'}</strong></div>
            <div class="ac-title">${p.name}</div>
          </div><div class="proj-dot" style="background:${p.color};width:12px;height:12px;border-radius:50%;flex-shrink:0"></div></div>
          ${p.client ? `<div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-bottom:6px;"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${p.client}</div>` : ''}
          ${p.description ? `<div class="detail-block db-r"><div class="detail-txt">${p.description}</div></div>` : ''}
          <div class="ac-acts">
            <button class="btn btn-success btn-sm" onclick="approveProject('${p.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> APROVAR</button>
            <button class="btn btn-danger btn-sm" onclick="openRejectProject('${p.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> REJEITAR</button>
          </div>
        </div>`).join('')}
      </div>`;
    }
    if (!isMgr) {
      const myRej  = projects.filter(p => p.status === 'rejected' && !p.archived && p.createdById === me.uid);
      const myPend = projects.filter(p => p.status === 'pending'  && !p.archived && p.createdById === me.uid);
      if (myPend.length) html += `<div style="margin-bottom:24px;"><div class="sec" style="color:#F5C518">⏳ SUAS SOLICITAÇÕES PENDENTES</div>${myPend.map(p => `<div class="ac" style="margin-bottom:10px;opacity:.75;"><div class="ac-head"><div><div class="ac-title">${p.name}</div></div><span class="badge" style="background:#F5C51822;color:#F5C518;">AGUARDANDO</span></div>${p.description ? `<div style="font-size:13px;color:var(--dim);margin-top:6px;">${p.description}</div>` : ''}</div>`).join('')}</div>`;
      if (myRej.length)  html += `<div style="margin-bottom:24px;"><div class="sec" style="color:var(--red)">✕ PROJETOS REJEITADOS</div>${myRej.map(p => `<div class="ac" style="border-color:var(--red)33;margin-bottom:10px;"><div class="ac-head"><div><div class="ac-title">${p.name}</div></div><span class="badge" style="background:var(--red)22;color:var(--red);">REJEITADO</span></div><div style="background:rgba(255,70,85,.08);border-left:3px solid var(--red);padding:10px 14px;margin-top:8px;border-radius:4px;"><div style="font-family:var(--M);font-size:10px;color:var(--red);margin-bottom:4px;">// MOTIVO</div><div style="font-size:13px;color:var(--dim);">${p.rejectionReason || '—'}</div></div></div>`).join('')}</div>`;
    }
    const activeProjs = projects.filter(p => !p.archived && p.status === 'active');
    const delProjIds  = new Set(delReqs.map(r => r.projectId));
    const list = activeProjs.filter(p => !delProjIds.has(p.id));
    html += list.length
      ? `<div class="proj-grid">${list.map(p => projCard(p, isMgr)).join('')}</div>`
      : `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div><h3>SEM PROJETOS ATIVOS</h3><p style="margin-bottom:12px">Organize as tasks por projeto/cliente</p><button class="btn btn-${isMgr ? 'primary' : 'ghost'} btn-sm" onclick="${isMgr ? 'openCreateProject()' : 'openRequestProject()'}">+ ${isMgr ? 'CRIAR PROJETO' : 'SOLICITAR PROJETO'}</button></div>`;

  } else if (projFV === 'deletion') {
    if (!isMgr) { html = `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3>ACESSO RESTRITO</h3></div>`; $('projects-list').innerHTML = html; return; }
    const delProjIds = delReqs.map(r => r.projectId);
    const delProjs   = projects.filter(p => delProjIds.includes(p.id));
    html = delProjs.length
      ? `<div class="proj-grid">${delProjs.map(p => { const req = delReqs.find(r => r.projectId === p.id); return projCard(p, isMgr, req); }).join('')}</div>`
      : `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--green);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><h3>NENHUMA EXCLUSÃO PENDENTE</h3></div>`;

  } else if (projFV === 'archived') {
    const archivedProjs = projects.filter(p => p.archived);
    html = archivedProjs.length
      ? `<div class="proj-grid">${archivedProjs.map(p => projCard(p, isMgr)).join('')}</div>`
      : `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg></div><h3>NENHUM PROJETO ARQUIVADO</h3></div>`;
  }

  $('projects-list').innerHTML = html;
}

function projCard(p, isMgr, delReq = null) {
  const pt             = tasks.filter(t => t.projectId === p.id && !['rejected','archived'].includes(t.status));
  const finalizedTasks = pt.filter(t => t.status === 'finalized').length;
  const active         = pt.filter(t => ['active', 'in_progress'].includes(t.status)).length;
  const overdue        = pt.filter(t => isOverdue(t)).length;
  const pct            = pt.length ? Math.round((finalizedTasks / pt.length) * 100) : 0;
  const dl      = p.deadline?.toDate ? p.deadline.toDate() : p.deadline ? new Date(p.deadline) : null;
  const isDeletion = projFV === 'deletion';
  const isArchived = projFV === 'archived';
  const hasAccess_ = userHasProjectAccess(me?.uid, p);
  return `<div class="proj-card" style="border-color:${isDeletion ? 'rgba(255,70,85,.4)' : p.color + '33'};cursor:pointer;${isDeletion ? 'opacity:.85' : ''};${!hasAccess_ ? 'opacity:.65;' : ''}padding:0;overflow:hidden;" onclick="openProjectDetail('${p.id}')">
    ${!hasAccess_ ? `<div style="position:absolute;top:8px;right:8px;z-index:2;background:var(--bg3);border:1px solid rgba(255,255,255,.1);border-radius:4px;padding:3px 7px;display:flex;align-items:center;gap:4px;font-family:var(--M);font-size:9px;color:var(--dim);">${ic('lock',9,'var(--dim)')} SEM ACESSO</div>` : ''}
    ${p.coverImage ? `
    <div style="height:110px;background:url('${p.coverImage}') center/cover no-repeat;position:relative;flex-shrink:0;">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,var(--bg2) 100%);"></div>
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${isDeletion ? 'var(--red)' : p.color};"></div>
      ${isDeletion ? `<div style="position:absolute;top:10px;right:10px;background:rgba(255,70,85,.85);color:#fff;font-family:var(--M);font-size:9px;padding:2px 8px;border-radius:2px;letter-spacing:1px;"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> EXCLUSÃO PENDENTE</div>` : ''}
    </div>
    <div style="padding:14px 16px 0;">` : `
    <div style="padding:20px 20px 0;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${isDeletion ? 'var(--red)' : 'linear-gradient(90deg,' + p.color + ',transparent)'};"></div>
      ${isDeletion ? `<div style="position:absolute;top:10px;right:10px;background:rgba(255,70,85,.15);border:1px solid rgba(255,70,85,.4);color:var(--red);font-family:var(--M);font-size:9px;padding:2px 8px;border-radius:2px;letter-spacing:1px;"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> EXCLUSÃO PENDENTE</div>` : ''}
    `}
    <div class="proj-card-header" style="padding:${p.coverImage ? '0 0 10px' : '0 0 10px'}">
      <div class="proj-dot" style="background:${p.color}"></div>
      <div class="proj-name">${p.name}</div>
      <div style="display:flex;gap:5px;" onclick="event.stopPropagation()">
        ${isMgr && !isDeletion && !isArchived ? `<button class="btn btn-ghost btn-sm" onclick="openEditProject('${p.id}')" style="padding:4px 8px;font-size:10px;"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>` : ''}
      </div>
    </div>
    ${p.client ? `<div class="proj-client" style="padding-left:20px;margin-bottom:8px;"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${p.client}</div>` : ''}
    ${isDeletion && delReq ? `<div style="background:rgba(255,70,85,.06);border-left:3px solid var(--red);padding:8px 12px;margin-bottom:10px;border-radius:3px;font-family:var(--M);font-size:10px;"><span style="color:var(--red);">MOTIVO:</span> <span style="color:var(--dim)">${delReq.reason}</span><br><span style="color:var(--dim);">Solicitado por <strong style="color:var(--cream)">${delReq.requestedByName}</strong></span></div>` : ''}
    ${p.description ? `<div style="font-size:13px;color:var(--dim);margin-bottom:10px;padding-left:20px;">${p.description}</div>` : ''}
    <div style="padding:0 4px 4px">
      <div style="display:flex;justify-content:space-between;font-family:var(--M);font-size:10px;color:var(--dim);">
        <span>PROGRESSO</span><span style="color:${p.color}">${pct}%</span>
      </div>
      <div class="proj-bar"><div class="proj-bar-fill" style="width:${pct}%;background:${p.color}"></div></div>
    </div>
    <div class="proj-stats" style="padding:0 4px">
      <div class="proj-stat"><div class="proj-stat-v" style="color:${p.color}">${pt.length}</div><div class="proj-stat-l">Total</div></div>
      <div class="proj-stat"><div class="proj-stat-v" style="color:var(--green)">${finalizedTasks}</div><div class="proj-stat-l">Finalizadas</div></div>
      <div class="proj-stat"><div class="proj-stat-v" style="color:var(--cyan)">${active}</div><div class="proj-stat-l">Ativas</div></div>
      <div class="proj-stat"><div class="proj-stat-v" style="color:var(--red)">${overdue}</div><div class="proj-stat-l">Atraso</div></div>
    </div>
    ${dl ? `<div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-top:10px;padding:0 4px"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Deadline: <strong style="color:var(--cream)">${fmtDate(dl)}</strong></div>` : ''}
    <div class="proj-acts" onclick="event.stopPropagation()">
      ${!isArchived ? `<button class="btn btn-info btn-sm" onclick="go('kanban');kanbanProjFV='${p.id}';renderKanban()"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg> KANBAN</button>` : ''}
      ${isMgr && isDeletion && delReq && delReq.requestedBy !== me.uid ? `<button class="btn btn-danger btn-sm" onclick="approveDeleteProject('${delReq.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> CONFIRMAR EXCLUSÃO</button><button class="btn btn-ghost btn-sm" onclick="rejectDeleteProject('${delReq.id}')">✕ CANCELAR</button>` : ''}
      ${isMgr && isDeletion && delReq?.requestedBy === me.uid ? `<span style="font-family:var(--M);font-size:9px;color:var(--dim);">Aguardando outro ADM</span>` : ''}
      ${isMgr && !isDeletion && !isArchived ? `<button class="btn btn-ghost btn-sm" onclick="archiveProject('${p.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> ARQUIVAR</button><button class="btn btn-danger btn-sm" onclick="openDeleteProject('${p.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> EXCLUIR</button>` : ''}
      ${isMgr && isArchived ? `<button class="btn btn-ghost btn-sm" onclick="unarchiveProject('${p.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg> DESARQUIVAR</button>` : ''}
    </div>
    </div>
  </div>`;
}