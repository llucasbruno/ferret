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
  const isMgr = meData?.access === 'manager';
  const col = p.color || 'var(--cyan)';
  const pt = tasks.filter(t => t.projectId === p.id && t.status !== 'rejected');
  const done = pt.filter(t => t.status === 'done').length;
  const pct  = pt.length ? Math.round((done / pt.length) * 100) : 0;
  const dl   = p.deadline?.toDate ? p.deadline.toDate() : p.deadline ? new Date(p.deadline) : null;

  $('pd-header').innerHTML = `
    ${p.coverImage ? `<div style="height:160px;background:url('${p.coverImage}') center/cover no-repeat;border-radius:4px;margin-bottom:18px;position:relative;"><div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,var(--bg) 100%);border-radius:4px;"></div></div>` : ''}
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <div style="width:14px;height:14px;border-radius:50%;background:${col};flex-shrink:0;"></div>
          <div class="page-title" style="font-size:26px;">${p.name}</div>
        </div>
        ${p.client ? `<div style="font-family:var(--M);font-size:11px;color:var(--dim);margin-left:24px;">👤 ${p.client}</div>` : ''}
        ${p.description ? `<div style="font-size:13px;color:var(--dim);margin:8px 0 0 24px;line-height:1.5;">${p.description}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${isMgr ? `<button class="btn btn-ghost btn-sm" onclick="openEditProject('${p.id}')">✏ EDITAR</button>` : ''}
        <button class="btn btn-primary btn-sm" onclick="openCreateForProject()">+ TASK</button>
        <button class="btn btn-ghost btn-sm" onclick="go('projects')">← VOLTAR</button>
      </div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
      <div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:${col}">${pt.length}</div><div class="proj-stat-l">Total</div></div>
      <div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:var(--green)">${done}</div><div class="proj-stat-l">Feitas</div></div>
      <div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:var(--red)">${pt.filter(t => isOverdue(t)).length}</div><div class="proj-stat-l">Atraso</div></div>
      ${dl ? `<div class="proj-stat" style="background:var(--bg2);padding:10px 16px;"><div class="proj-stat-v" style="color:var(--dim);font-size:14px;">${fmtDate(dl)}</div><div class="proj-stat-l">Deadline</div></div>` : ''}
    </div>
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;font-family:var(--M);font-size:10px;color:var(--dim);margin-bottom:5px;"><span>PROGRESSO</span><span style="color:${col}">${pct}%</span></div>
      <div class="proj-bar" style="height:6px;"><div class="proj-bar-fill" style="width:${pct}%;background:${col}"></div></div>
    </div>`;

  // Mini kanban
  $('pd-kanban').innerHTML = KANBAN_COLS.map(col => {
    const colTasks = pt.filter(t => t.status === col.id);
    return `<div style="flex:1;min-width:180px;">
      <div style="font-family:var(--M);font-size:9px;color:${col.color};letter-spacing:2px;margin-bottom:8px;display:flex;justify-content:space-between;">
        <span>${col.label}</span><span>${colTasks.length}</span>
      </div>
      ${colTasks.map(t => `<div onclick="openTask('${t.id}')" style="background:var(--bg3);border-radius:3px;padding:7px 9px;margin-bottom:5px;cursor:pointer;border-left:2px solid ${col.color};transition:opacity .15s;" onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">
        <div style="font-family:var(--R);font-size:12px;font-weight:600;color:var(--cream);margin-bottom:3px;">${t.title}</div>
        <div style="font-family:var(--M);font-size:9px;color:var(--dim);">👤 ${t.assigneeName || '—'}</div>
        ${(t.subtasks || []).length ? `<div style="margin-top:4px;height:2px;background:var(--bg2);border-radius:1px;overflow:hidden;"><div style="height:100%;width:${calcProgress(t.subtasks)}%;background:var(--cyan);"></div></div>` : ''}
      </div>`).join('') || `<div style="font-family:var(--M);font-size:9px;color:rgba(255,255,255,.1);text-align:center;padding:12px 0;">VAZIO</div>`}
    </div>`;
  }).join('');

  const allProjTasks = tasks.filter(t => t.projectId === p.id && t.status !== 'rejected');
  $('pd-tasks').innerHTML = allProjTasks.length
    ? allProjTasks.map((t, i) => taskCard(t, i, false)).join('')
    : `<div class="empty"><div class="empty-icon">📋</div><h3>SEM TASKS</h3><p>Crie a primeira task deste projeto</p></div>`;
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
          ${p.client ? `<div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-bottom:6px;">👤 ${p.client}</div>` : ''}
          ${p.description ? `<div class="detail-block db-r"><div class="detail-txt">${p.description}</div></div>` : ''}
          <div class="ac-acts">
            <button class="btn btn-success btn-sm" onclick="approveProject('${p.id}')">✓ APROVAR</button>
            <button class="btn btn-danger btn-sm" onclick="openRejectProject('${p.id}')">✕ REJEITAR</button>
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
      : `<div class="empty"><div class="empty-icon">📁</div><h3>SEM PROJETOS ATIVOS</h3><p style="margin-bottom:12px">Organize as tasks por projeto/cliente</p><button class="btn btn-${isMgr ? 'primary' : 'ghost'} btn-sm" onclick="${isMgr ? 'openCreateProject()' : 'openRequestProject()'}">+ ${isMgr ? 'CRIAR PROJETO' : 'SOLICITAR PROJETO'}</button></div>`;

  } else if (projFV === 'deletion') {
    if (!isMgr) { html = `<div class="empty"><div class="empty-icon">🔒</div><h3>ACESSO RESTRITO</h3></div>`; $('projects-list').innerHTML = html; return; }
    const delProjIds = delReqs.map(r => r.projectId);
    const delProjs   = projects.filter(p => delProjIds.includes(p.id));
    html = delProjs.length
      ? `<div class="proj-grid">${delProjs.map(p => { const req = delReqs.find(r => r.projectId === p.id); return projCard(p, isMgr, req); }).join('')}</div>`
      : `<div class="empty"><div class="empty-icon">✅</div><h3>NENHUMA EXCLUSÃO PENDENTE</h3></div>`;

  } else if (projFV === 'archived') {
    const archivedProjs = projects.filter(p => p.archived);
    html = archivedProjs.length
      ? `<div class="proj-grid">${archivedProjs.map(p => projCard(p, isMgr)).join('')}</div>`
      : `<div class="empty"><div class="empty-icon">📦</div><h3>NENHUM PROJETO ARQUIVADO</h3></div>`;
  }

  $('projects-list').innerHTML = html;
}

function projCard(p, isMgr, delReq = null) {
  const pt      = tasks.filter(t => t.projectId === p.id && !['rejected'].includes(t.status));
  const done    = pt.filter(t => t.status === 'done').length;
  const active  = pt.filter(t => ['active', 'in_progress'].includes(t.status)).length;
  const overdue = pt.filter(t => isOverdue(t)).length;
  const pct     = pt.length ? Math.round((done / pt.length) * 100) : 0;
  const dl      = p.deadline?.toDate ? p.deadline.toDate() : p.deadline ? new Date(p.deadline) : null;
  const isDeletion = projFV === 'deletion';
  const isArchived = projFV === 'archived';
  return `<div class="proj-card" style="border-color:${isDeletion ? 'rgba(255,70,85,.4)' : p.color + '33'};cursor:pointer;${isDeletion ? 'opacity:.85' : ''};padding:0;overflow:hidden;" onclick="openProjectDetail('${p.id}')">
    ${p.coverImage ? `
    <div style="height:110px;background:url('${p.coverImage}') center/cover no-repeat;position:relative;flex-shrink:0;">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,var(--bg2) 100%);"></div>
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${isDeletion ? 'var(--red)' : p.color};"></div>
      ${isDeletion ? `<div style="position:absolute;top:10px;right:10px;background:rgba(255,70,85,.85);color:#fff;font-family:var(--M);font-size:9px;padding:2px 8px;border-radius:2px;letter-spacing:1px;">🗑 EXCLUSÃO PENDENTE</div>` : ''}
    </div>
    <div style="padding:14px 16px 0;">` : `
    <div style="padding:20px 20px 0;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${isDeletion ? 'var(--red)' : 'linear-gradient(90deg,' + p.color + ',transparent)'};"></div>
      ${isDeletion ? `<div style="position:absolute;top:10px;right:10px;background:rgba(255,70,85,.15);border:1px solid rgba(255,70,85,.4);color:var(--red);font-family:var(--M);font-size:9px;padding:2px 8px;border-radius:2px;letter-spacing:1px;">🗑 EXCLUSÃO PENDENTE</div>` : ''}
    `}
    <div class="proj-card-header" style="padding:${p.coverImage ? '0 0 10px' : '0 0 10px'}">
      <div class="proj-dot" style="background:${p.color}"></div>
      <div class="proj-name">${p.name}</div>
      <div style="display:flex;gap:5px;" onclick="event.stopPropagation()">
        ${isMgr && !isDeletion && !isArchived ? `<button class="btn btn-ghost btn-sm" onclick="openEditProject('${p.id}')" style="padding:4px 8px;font-size:10px;">✏</button>` : ''}
      </div>
    </div>
    ${p.client ? `<div class="proj-client" style="padding-left:20px;margin-bottom:8px;">👤 ${p.client}</div>` : ''}
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
      <div class="proj-stat"><div class="proj-stat-v" style="color:var(--green)">${done}</div><div class="proj-stat-l">Feitas</div></div>
      <div class="proj-stat"><div class="proj-stat-v" style="color:var(--cyan)">${active}</div><div class="proj-stat-l">Ativas</div></div>
      <div class="proj-stat"><div class="proj-stat-v" style="color:var(--red)">${overdue}</div><div class="proj-stat-l">Atraso</div></div>
    </div>
    ${dl ? `<div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-top:10px;padding:0 4px">📅 Deadline: <strong style="color:var(--cream)">${fmtDate(dl)}</strong></div>` : ''}
    <div class="proj-acts" onclick="event.stopPropagation()">
      ${!isArchived ? `<button class="btn btn-info btn-sm" onclick="go('kanban');kanbanProjFV='${p.id}';renderKanban()">🗂 KANBAN</button>` : ''}
      ${isMgr && isDeletion && delReq && delReq.requestedBy !== me.uid ? `<button class="btn btn-danger btn-sm" onclick="approveDeleteProject('${delReq.id}')">🗑 CONFIRMAR EXCLUSÃO</button><button class="btn btn-ghost btn-sm" onclick="rejectDeleteProject('${delReq.id}')">✕ CANCELAR</button>` : ''}
      ${isMgr && isDeletion && delReq?.requestedBy === me.uid ? `<span style="font-family:var(--M);font-size:9px;color:var(--dim);">Aguardando outro ADM</span>` : ''}
      ${isMgr && !isDeletion && !isArchived ? `<button class="btn btn-ghost btn-sm" onclick="archiveProject('${p.id}')">📦 ARQUIVAR</button><button class="btn btn-danger btn-sm" onclick="openDeleteProject('${p.id}')">🗑 EXCLUIR</button>` : ''}
      ${isMgr && isArchived ? `<button class="btn btn-ghost btn-sm" onclick="unarchiveProject('${p.id}')">📂 DESARQUIVAR</button>` : ''}
    </div>
    </div>
  </div>`;
}
