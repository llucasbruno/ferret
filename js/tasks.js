// ══════════════════════════════════════════════
//  TASKS.JS — Tasks, Subtasks e Aprovações
// ══════════════════════════════════════════════

let stWeight = 75;
let _movingTask = false;

// ── Create task ──────────────────────────────
async function openCreate() {
  await refresh();
  const projOpts = projects.filter(p => !p.archived && p.status !== 'pending').map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  $('t-project').innerHTML = `<option value="">— Sem projeto —</option>${projOpts}`;
  if (globalProjFV !== 'all') $('t-project').value = globalProjFV;
  $('t-assignee').innerHTML = users.map(u => `<option value="${u.uid}">${u.displayName}</option>`).join('');
  $('t-assignee').value = me.uid;
  ['t-title', 't-problem', 't-resolution', 't-tags'].forEach(id => { $(id).value = ''; });
  $('t-priority').value = 'medium';
  const d = new Date(); d.setDate(d.getDate() + 7); $('t-deadline').value = d.toISOString().split('T')[0];
  $('appr-notice').classList.toggle('hidden', meData?.access === 'manager');
  showModal('m-create');
}

async function doCreate() {
  const required = ['t-title', 't-problem', 't-resolution', 't-deadline', 't-assignee'];
  if (required.some(id => !$(id).value.trim())) { toast('Preencha os campos obrigatórios', false); return; }
  const title = $('t-title').value.trim(), problem = $('t-problem').value.trim(), resolution = $('t-resolution').value.trim();
  const deadline = $('t-deadline').value, priority = $('t-priority').value;
  const assigneeId = $('t-assignee').value, projectId = $('t-project').value || null;
  const assignee = users.find(u => u.uid === assigneeId), proj = projectId ? projects.find(p => p.id === projectId) : null;
  const isMgr = meData.access === 'manager';
  await db.collection('tasks').add({
    title, problem, resolution, deadline: new Date(deadline + 'T00:00:00'), priority, assigneeId,
    assigneeName: assignee?.displayName || '—', createdById: me.uid, createdByName: meData.displayName,
    projectId: projectId || null, projectName: proj?.name || null,
    status: isMgr ? 'active' : 'pending_approval',
    tags: $('t-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    xpReward: XP_REWARD[priority], level: tasks.filter(t => t.assigneeId === assigneeId).length + 1,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    completedAt: null, approvedById: isMgr ? me.uid : null, rejectionReason: null,
  });
  const projLabel = proj ? `[${proj.name}]` : '[sem projeto]';
  await log(isMgr ? 'task_create' : 'task_pending', isMgr ? `${meData.displayName} criou "${title}" ${projLabel}` : `${meData.displayName} submeteu "${title}" para aprovação`);
  closeModal('m-create'); toast(isMgr ? 'Task criada!' : 'Enviada para aprovação!', true);
  if (isMgr && assigneeId !== me.uid) await saveNotif(assigneeId, 'task_assigned', title);
  await refresh(); renderCurView();
}

// ── Task detail modal ────────────────────────
async function moveFromModal(id, newStatus) {
  await moveTaskStatus(id, newStatus);
  await refresh();
  const t = tasks.find(x => x.id === id);
  if (t) openTask(id);
}

async function openTask(id) {
  selTask = id; const t = tasks.find(x => x.id === id); if (!t) return;
  const dl = t.deadline?.toDate ? t.deadline.toDate() : t.deadline ? new Date(t.deadline) : null;
  const overdue = isOverdue(t);
  const col = projColor(t.projectId), pname = t.projectName || projName(t.projectId);
  $('md-title').textContent = t.title;
  $('md-proj-info').innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:${col}"></div><span style="color:${col}">${pname}</span>`;
  $('md-problem').textContent = t.problem; $('md-resolution').textContent = t.resolution;
  $('md-deadline').textContent = fmtDate(dl) + (overdue ? ' ⚠ ATRASADA' : '');
  $('md-deadline').style.color = overdue ? 'var(--red)' : 'var(--cream)';
  $('md-assignee').textContent = t.assigneeName; $('md-xp').textContent = `+${t.xpReward} XP`;
  if (t.status === 'rejected' && t.rejectionReason) { show('md-rejection'); $('md-rejection-txt').textContent = t.rejectionReason; } else { hide('md-rejection'); }
  $('md-badges').innerHTML = `<span class="badge bp-${t.priority}">${PL[t.priority]}</span>${overdue ? '<span class="badge bs-overdue">ATRASADA</span>' : `<span class="badge bs-${t.status === 'finalized' ? 'finalized' : t.status}">${SL[t.status] || t.status}</span>`}${(t.tags || []).map(x => `<span class="badge" style="background:rgba(255,255,255,.06);color:var(--dim);border:1px solid rgba(255,255,255,.08);">${x}</span>`).join('')}`;
  const isMgr = meData?.access === 'manager'; const isPending = t.status === 'pending_approval'; let acts = '';

  // Status flow mover
  const FLOW = [
    { id: 'pending_approval', label: 'AGUARDANDO', color: '#F5C518' },
    { id: 'active',           label: 'A FAZER',    color: '#00C4B4' },
    { id: 'in_progress',      label: 'PROGRESSO',  color: '#FF8C42' },
    { id: 'done',             label: 'CONCLUÍDO',  color: '#44FF99' },
    { id: 'finalized',        label: 'FINALIZADO', color: '#CC88FF' },
  ];
  const notMovable = ['archived', 'rejected'].includes(t.status);
  $('md-status-flow').innerHTML = notMovable ? '' : FLOW.map(step => {
    const isCurrent = t.status === step.id;
    const isLocked  = step.id === 'finalized' && !isMgr;
    const canClick   = !isCurrent && !isLocked;
    return `<div onclick="${canClick ? `moveFromModal('${id}','${step.id}')` : ''}"
      title="${isLocked ? 'Apenas ADMs podem finalizar' : isCurrent ? 'Status atual' : 'Mover para este status'}"
      style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:3px;cursor:${canClick ? 'pointer' : 'default'};
        background:${isCurrent ? step.color + '22' : 'transparent'};
        border:1px solid ${isCurrent ? step.color + '88' : 'rgba(255,255,255,.06)'};
        opacity:${isLocked ? '.4' : '1'};
        transition:all .15s;"
      onmouseover="${canClick ? `this.style.background='${step.color}18';this.style.borderColor='${step.color}55'` : ''}"
      onmouseout="${canClick ? `this.style.background='${isCurrent ? step.color + '22' : 'transparent'}';this.style.borderColor='${isCurrent ? step.color + '88' : 'rgba(255,255,255,.06)'}'` : ''}">
      <div style="width:7px;height:7px;border-radius:50%;background:${isCurrent ? step.color : 'rgba(255,255,255,.2)'};flex-shrink:0;"></div>
      <span style="font-family:var(--M);font-size:9px;letter-spacing:1px;color:${isCurrent ? step.color : 'var(--dim)'};">${step.label}</span>
      ${isCurrent ? `<svg viewBox="0 0 24 24" width="9" height="9" style="stroke:${step.color};fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
    </div>`;
  }).join('<span style="color:rgba(255,255,255,.15);font-size:10px;">›</span>');
  if (isPending && !isMgr) {
    acts = `<div style="font-family:var(--M);font-size:11px;color:#F5C518;background:#F5C51811;border:1px solid #F5C51833;padding:8px 12px;border-radius:4px;">⏳ Aguardando aprovação do administrador</div>`;
  } else {
    if (t.status === 'active'      && t.assigneeId === me.uid) acts += `<button class="btn btn-warn btn-sm" onclick="startTask('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg> INICIAR</button>`;
    if (t.status === 'in_progress' && t.assigneeId === me.uid) { acts += `<button class="btn btn-success btn-sm" onclick="completeTask('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> CONCLUIR</button>`; if (overdue) acts += `<span class="xp-penalty"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> -${XP_PENALTY[t.priority]} XP atraso</span>`; }
    if (t.status === 'done') {
      acts += `<span style="color:var(--green);font-family:var(--M);font-size:11px;">${ic('check',11,'var(--green)')} CONCLUÍDA</span>`;
      if (isMgr) acts += `<button class="btn btn-sm" style="background:rgba(204,136,255,.12);color:#CC88FF;border:1px solid rgba(204,136,255,.3);" onclick="finalizeTask('${id}')">★ FINALIZAR</button>`;
    }
    if (t.status === 'finalized') {
      acts += `<span style="color:#CC88FF;font-family:var(--M);font-size:11px;">${ic('star',11,'#CC88FF')} FINALIZADA</span>`;
      if (isMgr) acts += `<button class="btn btn-ghost btn-sm" onclick="archiveTask('${id}')">${ic('archive',11,'currentColor')} ARQUIVAR</button>`;
    }
    if (isMgr && isPending) { acts += `<button class="btn btn-success btn-sm" onclick="approveTask('${id}');closeModal('m-task')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> APROVAR</button><button class="btn btn-danger btn-sm" onclick="openReject('${id}');closeModal('m-task')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> REJEITAR</button>`; }
    const canEdit = !['done', 'rejected'].includes(t.status) && (isMgr || (t.createdById === me.uid && t.status !== 'pending_approval'));
    if (canEdit) acts += `<button class="btn btn-info btn-sm" onclick="openEditTask('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> EDITAR</button>`;
    if (isMgr || (t.createdById === me.uid && !['done', 'pending_approval'].includes(t.status))) acts += `<button class="btn btn-danger btn-sm" onclick="deleteTask('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>`;
    if (!['done', 'rejected'].includes(t.status)) acts += `<button class="btn btn-ghost btn-sm" onclick="openAssignProject('${id}')" style="color:var(--cyan);"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> PROJETO</button>`;
  }
  $('md-acts').innerHTML = acts;
  renderSubtasks(t);
  renderComments(await loadComments(id)); showModal('m-task');
  openTDSections();
}

// ── Task actions ─────────────────────────────
async function startTask(id) {
  await db.collection('tasks').doc(id).update({ status: 'in_progress' });
  await log('task_start', `${meData.displayName} iniciou uma task`);
  toast('Task em progresso!'); closeModal('m-task'); await refresh(); renderCurView();
}

async function completeTask(id) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  if (t.status === 'done') { toast('Task já concluída', false); return; }
  // Verifica subtasks
  const subs = t.subtasks || [];
  const allSubsDone = subs.length === 0 || subs.every(s => s.done);
  if (!allSubsDone) {
    const pending = subs.filter(s => !s.done).length;
    toast(pending + ' subtask(s) ainda pendente(s). Conclua todas antes de avançar.', false);
    return;
  }
  // CONCLUÍDO não gera XP — XP é concedido apenas ao FINALIZAR
  await db.collection('tasks').doc(id).update({ status: 'done', completedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await log('task_done', `${meData.displayName} concluiu "${t.title}" (aguardando finalização)`);
  toast('Task concluída! Aguardando finalização pelo ADM.', true);
  _movingTask = false; closeModal('m-task'); await refresh(); renderCurView();
}

async function finalizeTask(id) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  if (meData?.access !== 'manager') { toast('Apenas ADMs podem finalizar tasks', false); return; }
  // Verifica subtasks
  const subs = t.subtasks || [];
  const allSubsDone = subs.length === 0 || subs.every(s => s.done);
  if (!allSubsDone) {
    const pending = subs.filter(s => !s.done).length;
    toast(pending + ' subtask(s) ainda pendente(s). Não é possível finalizar.', false);
    return;
  }
  const overdue = t.completedAt && t.deadline
    ? (new Date(t.completedAt?.toDate ? t.completedAt.toDate() : t.completedAt) > new Date(t.deadline?.toDate ? t.deadline.toDate() : t.deadline))
    : false;
  const pen = overdue ? XP_PENALTY[t.priority] : 0;
  const xp  = Math.max(0, t.xpReward - pen);
  await db.collection('tasks').doc(id).update({ status: 'finalized', finalizedAt: firebase.firestore.FieldValue.serverTimestamp() });
  if (xp > 0) await addXP(t.assigneeId, xp, true);
  else await addXP(t.assigneeId, 0, true);
  await log('task_finalize', overdue
    ? `${meData.displayName} finalizou "${t.title}" com atraso (+${xp} XP, -${pen} penalidade)`
    : `${meData.displayName} finalizou "${t.title}" (+${xp} XP)`);
  await saveNotif(t.assigneeId, 'task_approved', t.title, { fromName: meData.displayName, reason: `Task finalizada! +${xp} XP` });
  toast(overdue ? `Finalizada com atraso! +${xp} XP (-${pen})` : `Task finalizada! +${xp} XP`, true);
  _movingTask = false; closeModal('m-task'); await refresh(); renderCurView();
}

async function archiveTask(id) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  if (meData?.access !== 'manager') { toast('Apenas ADMs podem arquivar tasks', false); return; }
  if (t.status !== 'finalized') { toast('Só tarefas finalizadas podem ser arquivadas', false); return; }
  if (!confirm(`Arquivar "${t.title}"? Ela sairá do Kanban mas ficará acessível na aba Arquivadas.`)) return;
  await db.collection('tasks').doc(id).update({ status: 'archived', archivedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await log('task_archive', `${meData.displayName} arquivou "${t.title}"`);
  toast('Task arquivada.', true);
  closeModal('m-task'); await refresh(); renderCurView();
}

async function approveTask(id) {
  const snap = await db.collection('tasks').doc(id).get();
  const t = { id, ...snap.data() };
  await db.collection('tasks').doc(id).update({ status: 'active', approvedById: me.uid, rejectionReason: null });
  await log('task_approve', `${meData.displayName} aprovou "${t.title}"`);
  await saveNotif(t.assigneeId, 'task_approved', t.title);
  toast('Task aprovada!', true); await refresh(); renderCurView(); updBadge();
}

function openReject(id) { rejTask = id; $('rej-reason').value = ''; showModal('m-reject'); }
async function doReject() {
  const reason = $('rej-reason').value.trim();
  if (!reason) { toast('Informe o motivo', false); return; }
  if (!rejTask) { toast('Erro: task não encontrada', false); return; }
  const snap = await db.collection('tasks').doc(rejTask).get();
  const t = { id: rejTask, ...snap.data() };
  await db.collection('tasks').doc(rejTask).update({ status: 'rejected', rejectionReason: reason });
  await saveNotif(t.assigneeId, 'rejection', t.title, { reason });
  await log('task_reject', `${meData.displayName} rejeitou "${t.title}": ${reason}`);
  toast('Task rejeitada'); closeModal('m-reject'); await refresh(); renderCurView(); updBadge();
}

async function deleteTask(id) {
  if (!confirm('Excluir esta task? Ação irreversível.')) return;
  const t = tasks.find(x => x.id === id);
  await db.collection('tasks').doc(id).delete();
  await log('task_delete', `${meData.displayName} excluiu "${t?.title}"`);
  toast('Task excluída'); closeModal('m-task'); await refresh(); renderCurView();
}

// ── Move task (kanban drag) ──────────────────
async function moveTaskStatus(id, newStatus) {
  if (_movingTask) return;
  const t = tasks.find(x => x.id === id);
  if (!t || t.status === newStatus) return;
  _movingTask = true;

  try {
    const isMgr = meData?.access === 'manager';

    // Bloqueios
    if (t.status === 'archived')                         { toast('Tasks arquivadas não podem ser movidas', false); return; }
    if (t.status === 'pending_approval' && !isMgr)       { toast('Task aguardando aprovação do ADM', false); return; }
    if (newStatus === 'finalized' && !isMgr)             { toast('Apenas ADMs podem finalizar tasks', false); return; }
    if (t.status === 'finalized' && !isMgr)              { toast('Apenas ADMs podem reabrir tasks finalizadas', false); return; }

    // Verifica subtasks antes de avançar
    if (newStatus === 'done' || newStatus === 'finalized') {
      const subs = t.subtasks || [];
      if (subs.length > 0 && !subs.every(s => s.done)) {
        const pending = subs.filter(s => !s.done).length;
        toast(pending + ' subtask(s) ainda pendente(s). Conclua todas antes de avançar.', false);
        return;
      }
    }

    // Finalizar — concede XP
    if (newStatus === 'finalized') {
      await finalizeTask(id);
      return;
    }

    // Concluir — sem XP
    if (newStatus === 'done') {
      await completeTask(id);
      return;
    }

    // Reverter de FINALIZADO — remove XP
    if (t.status === 'finalized') {
      const xpGained = Math.max(0, t.xpReward - (t.penalty || 0));
      if (xpGained > 0) {
        await db.collection('users').doc(t.assigneeId).update({
          xp: firebase.firestore.FieldValue.increment(-xpGained),
          tasksCompleted: firebase.firestore.FieldValue.increment(-1)
        });
        if (t.assigneeId === me?.uid) {
          meData.xp = Math.max(0, (meData.xp || 0) - xpGained);
          meData.tasksCompleted = Math.max(0, (meData.tasksCompleted || 1) - 1);
          updateSidebar();
        }
      }
      await db.collection('tasks').doc(id).update({ status: newStatus, finalizedAt: null });
      await log('task_start', `${meData.displayName} reabriu "${t.title}" de FINALIZADO → ${SL[newStatus]}`);
      toast('Task reaberta. XP revertido.', false);
      await refresh(); renderCurView();
      return;
    }

    // Reverter de CONCLUÍDO — sem XP a reverter
    if (t.status === 'done') {
      await db.collection('tasks').doc(id).update({ status: newStatus, completedAt: null });
      await log('task_start', `${meData.displayName} reabriu "${t.title}" → ${SL[newStatus]}`);
      toast('Task reaberta.', false);
      await refresh(); renderCurView();
      return;
    }

    // Iniciar
    if (newStatus === 'in_progress' && t.status === 'active') {
      await startTask(id);
      return;
    }

    // Movimentação normal
    await db.collection('tasks').doc(id).update({ status: newStatus });
    await log('task_start', `${meData.displayName} moveu "${t.title}" para ${SL[newStatus]}`);
    await refresh(); renderCurView();

  } finally {
    _movingTask = false;
  }
}

// ── Edit task ────────────────────────────────
function openEditTask(id) {
  editingTaskId = id;
  const t = tasks.find(x => x.id === id); if (!t) return;
  const isMgr = meData?.access === 'manager';
  const projOpts = projects.filter(p => !p.archived).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  $('et-project').innerHTML = `<option value="">— Sem projeto —</option>${projOpts}`;
  $('et-project').value = t.projectId || '';
  $('et-assignee').innerHTML = users.map(u => `<option value="${u.uid}">${u.displayName}</option>`).join('');
  $('et-assignee').value = t.assigneeId;
  $('et-assignee').disabled = !isMgr; $('et-assignee').style.opacity = isMgr ? '1' : '0.5';
  $('et-assignee').title = isMgr ? '' : 'Apenas gerentes podem trocar o responsável';
  $('et-title').value = t.title || ''; $('et-problem').value = t.problem || ''; $('et-resolution').value = t.resolution || '';
  $('et-priority').value = t.priority || 'medium'; $('et-tags').value = (t.tags || []).join(', ');
  const dl = t.deadline?.toDate ? t.deadline.toDate() : t.deadline ? new Date(t.deadline) : null;
  $('et-deadline').value = dl ? dl.toISOString().split('T')[0] : '';
  $('et-notice').classList.toggle('hidden', !isMgr);
  closeModal('m-task'); showModal('m-edit-task');
}

async function doEditTask() {
  if (!editingTaskId) return;
  const t = tasks.find(x => x.id === editingTaskId); if (!t) return;
  const isMgr = meData?.access === 'manager';
  const title = $('et-title').value.trim(), problem = $('et-problem').value.trim(), resolution = $('et-resolution').value.trim(), deadline = $('et-deadline').value;
  if (!title || !problem || !resolution) { toast('Preencha título, problema e resolução', false); return; }
  if (!deadline) { toast('Informe o deadline', false); return; }
  const priority = $('et-priority').value, projectId = $('et-project').value || null;
  const proj = projectId ? projects.find(p => p.id === projectId) : null;
  const assigneeId = isMgr ? $('et-assignee').value : t.assigneeId;
  const assignee = users.find(u => u.uid === assigneeId);
  const tags = $('et-tags').value.split(',').map(x => x.trim()).filter(Boolean);
  const upd = { title, problem, resolution, priority, tags, deadline: new Date(deadline + 'T00:00:00'), xpReward: XP_REWARD[priority], projectId: projectId || null, projectName: proj?.name || null };
  if (isMgr) { upd.assigneeId = assigneeId; upd.assigneeName = assignee?.displayName || t.assigneeName; }
  await db.collection('tasks').doc(editingTaskId).update(upd);
  await log('task_update', `${meData.displayName} editou a task "${title}"`);
  closeModal('m-edit-task'); editingTaskId = null;
  toast('Task atualizada!', true); await refresh(); renderCurView();
}

// ── Comments ─────────────────────────────────
async function doComment() {
  const txt = $('cmt-in').value.trim(); if (!txt || !selTask) return;
  await db.collection('comments').add({ taskId: selTask, userId: me.uid, userName: meData.displayName, text: txt, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  const t = tasks.find(x => x.id === selTask);
  parseMentions(txt).forEach(async u => {
    if (u.uid !== me.uid) await saveNotif(u.uid, 'mention', t?.title || '—', { reason: `${meData.displayName}: "${txt.slice(0, 80)}"`, refId: selTask });
  });
  $('cmt-in').value = ''; closeMentionDrop('mdd-task');
  renderComments(await loadComments(selTask));
}

function renderComments(cmts) {
  const c = $('md-cmts');
  if (!cmts.length) { c.innerHTML = '<div style="color:var(--dim);font-size:13px;padding:8px 0;">Nenhum comentário ainda.</div>'; return; }
  c.innerHTML = cmts.map(x => `<div class="cmt">
    <div class="cmt-author">${x.userName}</div>
    <div class="cmt-txt">${renderMentionText(x.text)}</div>
    <div class="cmt-time">${fmtTime(x.createdAt)}</div>
  </div>`).join('');
  c.scrollTop = c.scrollHeight;
}

// ── Subtasks ─────────────────────────────────
function calcProgress(subtasks) {
  if (!subtasks || !subtasks.length) return 0;
  const total = subtasks.reduce((s, x) => s + (x.weight || 1), 0);
  const done  = subtasks.filter(x => x.done).reduce((s, x) => s + (x.weight || 1), 0);
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function renderSubtasks(t) {
  const subs = t.subtasks || [];
  const pct  = calcProgress(subs);
  const bar  = $('md-sub-progress'), barFill = $('md-sub-bar'), pctLabel = $('md-sub-pct');
  if (subs.length) { bar.style.display = 'block'; barFill.style.width = pct + '%'; barFill.style.background = pct === 100 ? 'var(--green)' : 'var(--cyan)'; pctLabel.textContent = pct + '%'; }
  else { bar.style.display = 'none'; pctLabel.textContent = ''; }
  const totalW = subs.reduce((s, x) => s + (x.weight || 1), 0);
  $('md-subtasks').innerHTML = subs.map((s, i) => {
    const normPct = totalW > 0 ? Math.round(((s.weight || 1) / totalW) * 100) : 0;
    return `<div class="subtask-item${s.done ? ' done' : ''}" id="sti-${i}">
      <div class="st-check${s.done ? ' done' : ''}" onclick="toggleSubtask(${i})">${s.done ? '✓' : ''}</div>
      <div class="st-title">${s.title}</div>
      <div class="st-weight">${normPct}%</div>
      <button class="st-del" onclick="deleteSubtask(${i})">✕</button>
    </div>`;
  }).join('') || `<div style="font-family:var(--M);font-size:10px;color:var(--dim);padding:6px 0;">Nenhuma subtask ainda.</div>`;
}

function selectWeight(btn, w) {
  stWeight = w;
  document.querySelectorAll('.st-w-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function openAddSubtask() {
  stWeight = 75;
  document.querySelectorAll('.st-w-btn').forEach(b => b.classList.toggle('active', b.textContent === '75%'));
  $('st-title').value = ''; show('subtask-form'); $('st-title').focus();
}

async function saveSubtask() {
  const title = $('st-title').value.trim(); if (!title) return;
  const t = tasks.find(x => x.id === selTask); if (!t) return;
  const subs = [...(t.subtasks || []), { title, weight: stWeight, done: false, createdAt: Date.now() }];
  await db.collection('tasks').doc(selTask).update({ subtasks: subs });
  t.subtasks = subs; hide('subtask-form'); $('st-title').value = '';
  renderSubtasks(t); renderCurView();
}

async function toggleSubtask(idx) {
  const t = tasks.find(x => x.id === selTask); if (!t) return;
  const subs = (t.subtasks || []).map((s, i) => i === idx ? { ...s, done: !s.done } : s);
  await db.collection('tasks').doc(selTask).update({ subtasks: subs });
  t.subtasks = subs; renderSubtasks(t); renderCurView();
}

async function deleteSubtask(idx) {
  const t = tasks.find(x => x.id === selTask); if (!t) return;
  const subs = (t.subtasks || []).filter((_, i) => i !== idx);
  await db.collection('tasks').doc(selTask).update({ subtasks: subs });
  t.subtasks = subs; renderSubtasks(t); renderCurView();
}

// ── Task card (list view) ────────────────────
function taskCard(t, i, isMe) {
  const dl = t.deadline?.toDate ? t.deadline.toDate() : t.deadline ? new Date(t.deadline) : null;
  const overdue = isOverdue(t);
  const urgent  = dl && !overdue && (dl - new Date()) < 2 * 864e5 && t.status !== 'done';
  const tags    = (t.tags || []).map(x => `<span class="tag-pill${tagFV.includes(x) ? ' active' : ''}" data-tag="${x.replace(/"/g, '&quot;')}" onclick="event.stopPropagation();filterByTag(this.dataset.tag)">${x}</span>`).join('');
  const col     = projColor(t.projectId);
  const pname   = t.projectName || projName(t.projectId);
  const statusBadge = overdue ? `<span class="badge bs-overdue">ATRASADA</span>` : `<span class="badge bs-${t.status}">${SL[t.status] || t.status}</span>`;
  const isMgrCard = meData?.access === 'manager';
  let acts = '';
  if (t.status !== 'pending_approval' || isMgrCard) {
    if (t.status === 'active'      && t.assigneeId === me?.uid) acts += `<button class="btn btn-warn btn-sm" onclick="event.stopPropagation();startTask('${t.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg> INICIAR</button>`;
    if (t.status === 'in_progress' && t.assigneeId === me?.uid) acts += `<button class="btn btn-success btn-sm" onclick="event.stopPropagation();completeTask('${t.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> CONCLUIR</button>`;
  }
  const rejBlock = t.status === 'rejected' && t.rejectionReason ? `<div class="rej-notice"><div class="rej-notice-lbl">// MOTIVO DA REJEIÇÃO</div><div style="font-size:13px;color:var(--dim)">${t.rejectionReason}</div></div>` : '';
  return `<div class="tc p-${t.priority} s-${overdue ? 'overdue' : t.status}${overdue ? ' overdue' : ''}" onclick="openTask('${t.id}')">
    <div class="tc-head">
      <div class="tc-proj"><div class="tc-proj-dot" style="background:${col}"></div>${pname}</div>
      <div class="tc-badges">${!isMe ? `<span style="font-family:var(--M);font-size:9px;color:var(--dim);">👤 ${t.assigneeName}</span>` : ''}<span class="badge bp-${t.priority}">${PL[t.priority]}</span>${statusBadge}<span class="badge bxp">+${t.xpReward}</span></div>
    </div>
    ${rejBlock}
    <div class="tc-body"><div class="tc-title">${t.title}</div><div class="tc-desc">${t.problem}</div></div>
    ${(()=>{const subs=t.subtasks||[];if(!subs.length)return'';const pct=calcProgress(subs);const done=subs.filter(x=>x.done).length;return`<div style="padding:0 16px 8px;"><div style="display:flex;justify-content:space-between;font-family:var(--M);font-size:9px;color:var(--dim);margin-bottom:4px;"><span>SUBTASKS ${done}/${subs.length}</span><span style="color:${pct===100?'var(--green)':'var(--cyan)'};">${pct}%</span></div><div style="height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${pct===100?'var(--green)':'var(--cyan)'};border-radius:2px;transition:width .3s;"></div></div></div>`;})()}
    <div class="tc-foot">
      <div class="tc-meta"><span class="${urgent ? 'urgent' : overdue ? 'overdue-txt' : ''}"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${fmtDate(dl)}${overdue ? ' ⚠' : ''}</span>${tags}</div>
      <div class="tc-acts" onclick="event.stopPropagation()"><button class="btn btn-ghost btn-sm" onclick="openTask('${t.id}')">VER</button>${acts}</div>
    </div>
  </div>`;
}

// ── Render views ─────────────────────────────
async function renderMyTasks() {
  // FIX: usa o array local em vez de chamar loadTasks() novamente
  let t = filterByGlobalProj(tasks.filter(x => x.assigneeId === me.uid && x.status !== 'archived'));
  if (myFV !== 'all') t = t.filter(x => x.status === myFV);
  $('my-tag-bar').innerHTML = buildTagBar(t);
  t = applyTagFilter(t);
  $('my-list').innerHTML = t.length ? t.map((t, i) => taskCard(t, i, true)).join('') : `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div><h3>SEM MISSÕES</h3><p>Nenhuma task encontrada</p></div>`;
}

async function renderAllTasks() {
  await refresh();
  $('all-tabs').innerHTML = `<button class="ftab ${allFV === 'all' ? 'active' : ''}" onclick="allFilter('all',this)">TODOS</button>` + users.map(u => `<button class="ftab ${allFV === u.uid ? 'active' : ''}" onclick="allFilter('${u.uid}',this)">${u.displayName.split(' ')[0].toUpperCase()}</button>`).join('');
  let t = filterByGlobalProj(tasks.filter(x => x.status !== 'rejected' && x.status !== 'archived'));
  if (allFV !== 'all') t = t.filter(x => x.assigneeId === allFV);
  $('all-tag-bar').innerHTML = buildTagBar(t);
  t = applyTagFilter(t);
  $('all-list').innerHTML = t.length ? t.map((t, i) => taskCard(t, i, false)).join('') : `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg></div><h3>SEM TASKS</h3></div>`;
}

async function renderHistory() {
  await refresh();
  $('hist-tabs').innerHTML = `<button class="ftab ${histFV === 'all' ? 'active' : ''}" onclick="histFilter('all',this)">TODOS</button>` +
    users.map(u => `<button class="ftab ${histFV === u.uid ? 'active' : ''}" onclick="histFilter('${u.uid}',this)">${u.displayName.split(' ')[0].toUpperCase()}</button>`).join('');
  let done = filterByGlobalProj(tasks.filter(t => t.status === 'done'));
  if (histFV !== 'all') done = done.filter(t => t.assigneeId === histFV);
  if (!done.length) { $('hist-list').innerHTML = `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div><h3>SEM CONCLUÍDAS</h3></div>`; return; }
  $('hist-list').innerHTML = `<table class="hist-table"><thead><tr><th>TASK</th><th>PROJETO</th><th>RESPONSÁVEL</th><th>PRIO</th><th>XP</th><th>CONCLUÍDA</th></tr></thead>
  <tbody>${done.map(t => {
    const col = projColor(t.projectId);
    const cd  = t.completedAt?.toDate ? t.completedAt.toDate() : t.completedAt ? new Date(t.completedAt) : null;
    return `<tr onclick="openTask('${t.id}')" style="cursor:pointer">
      <td><span style="font-family:var(--R);font-weight:700;">${t.title}</span></td>
      <td><span style="font-family:var(--M);font-size:10px;display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;border-radius:50%;background:${col};display:inline-block;flex-shrink:0"></span>${t.projectName || '—'}</span></td>
      <td style="color:var(--dim);font-family:var(--M);font-size:10px;">${t.assigneeName}</td>
      <td><span class="badge bp-${t.priority}">${PL[t.priority]}</span></td>
      <td style="color:var(--gold);font-family:var(--M);">+${t.xpReward}</td>
      <td style="color:var(--dim);font-family:var(--M);font-size:10px;">${fmtDate(cd)}</td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

async function renderApprovals() {
  await loadTasks();
  const pend = tasks.filter(t => t.status === 'pending_approval');
  const apSnap     = await db.collection('actionPlans').where('status', '==', 'pending_approval').get();
  const apPending  = apSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const assignSnap = await db.collection('projectAssignmentRequests').where('status', '==', 'pending').get();
  const assignReqs = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const delSnap    = await db.collection('projectDeletionRequests').where('status', '==', 'pending').get();
  const delReqs    = delSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.requestedBy !== me.uid);
  let html = '';

  if (apPending.length) {
    html += `<div class="sec" style="color:var(--cyan);"><svg viewBox="0 0 24 24" width="12" height="12" style="stroke:var(--cyan);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:6px;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> ACTION PLANS AGUARDANDO APROVAÇÃO</div>`;
    html += apPending.map(ap => {
      const dl = fmtDate(ap.deadline?.toDate ? ap.deadline.toDate() : ap.deadline ? new Date(ap.deadline) : null);
      return `<div class="ac" style="border-color:rgba(0,196,180,.2);margin-bottom:10px;">
        <div class="ac-head"><div><div class="ac-meta">DE: <strong>${ap.createdByName}</strong>${ap.projectId ? ` · <span style="color:${projColor(ap.projectId)}">${ap.projectName}</span>` : ''}</div><div class="ac-title">${ap.title}</div></div>
        <div style="display:flex;gap:5px;"><span class="badge asev-${ap.severity}">${AP_SEV_LABEL[ap.severity]}</span><span class="badge bp-${ap.priority}">${AP_PRIO_LABEL[ap.priority]}</span></div></div>
        <div class="detail-block db-p"><div class="detail-lbl">// PROBLEMA</div><div class="detail-txt">${ap.problem}</div></div>
        <div class="detail-block db-r"><div class="detail-lbl">// SOLUÇÃO</div><div class="detail-txt">${ap.solution}</div></div>
        <div style="font-family:var(--M);font-size:10px;color:var(--dim);margin:8px 0;">📅 <strong style="color:var(--cream)">${dl}</strong> &nbsp;·&nbsp; 👤 <strong style="color:var(--cream)">${ap.ownerName}</strong></div>
        <div class="ac-acts"><button class="btn btn-success btn-sm" onclick="approveAction('${ap.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> APROVAR</button><button class="btn btn-danger btn-sm" onclick="openRejectAction('${ap.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> REJEITAR</button><button class="btn btn-ghost btn-sm" onclick="openActionDetail('${ap.id}')">VER DETALHES</button></div>
      </div>`;
    }).join('');
  }

  if (delReqs.length) {
    html += `<div class="sec" style="color:var(--red);margin-top:${apPending.length ? 16 : 0}px;">🗑 EXCLUSÕES DE PROJETO PENDENTES</div>`;
    html += delReqs.map(r => `<div class="ac" style="border-color:rgba(255,70,85,.3);margin-bottom:10px;">
      <div class="ac-head"><div><div class="ac-meta">SOLICITADO POR: <strong>${r.requestedByName}</strong></div><div class="ac-title">${r.projectName}</div></div><span class="badge" style="background:rgba(255,70,85,.15);color:var(--red);">EXCLUSÃO</span></div>
      <div style="background:rgba(255,70,85,.06);border-left:3px solid var(--red);padding:10px 14px;border-radius:3px;margin:8px 0;font-size:13px;color:var(--dim);">${r.reason}</div>
      <div style="font-family:var(--M);font-size:9px;color:rgba(255,70,85,.6);margin-bottom:8px;">⚠ Tasks vinculadas serão desvinculadas</div>
      <div class="ac-acts"><button class="btn btn-danger btn-sm" onclick="approveDeleteProject('${r.id}')">🗑 APROVAR EXCLUSÃO</button><button class="btn btn-ghost btn-sm" onclick="rejectDeleteProject('${r.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> REJEITAR</button></div>
    </div>`).join('');
  }

  if (assignReqs.length) {
    html += `<div class="sec" style="color:#F5C518;margin-top:${(apPending.length || delReqs.length) ? 16 : 0}px;">📁 ATRIBUIÇÕES DE PROJETO PENDENTES</div>`;
    html += assignReqs.map(r => `<div class="ac" style="border-color:#F5C51833;margin-bottom:10px;">
      <div class="ac-head"><div><div class="ac-meta">SOLICITADO POR: <strong>${r.requestedByName}</strong></div><div class="ac-title">${r.taskTitle}</div></div><span class="badge" style="background:#F5C51822;color:#F5C518;">VÍNCULO</span></div>
      <div style="font-family:var(--M);font-size:11px;color:var(--dim);margin-bottom:8px;">📁 Projeto: <strong style="color:var(--cyan)">${r.projectName || '— Sem projeto —'}</strong></div>
      <div class="ac-acts"><button class="btn btn-success btn-sm" onclick="approveAssignment('${r.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> APROVAR</button><button class="btn btn-danger btn-sm" onclick="rejectAssignment('${r.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> REJEITAR</button></div>
    </div>`).join('');
  }

  if (pend.length) {
    html += `<div class="sec" style="margin-top:${(apPending.length || delReqs.length || assignReqs.length) ? 16 : 0}px;">✅ TASKS AGUARDANDO APROVAÇÃO</div>`;
    html += pend.map(t => {
      const dl = fmtDate(t.deadline?.toDate ? t.deadline.toDate() : t.deadline ? new Date(t.deadline) : null);
      const pc = projColor(t.projectId);
      return `<div class="ac"><div class="ac-head">
        <div><div class="ac-meta"><span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;border-radius:50%;background:${pc};display:inline-block"></span>${t.projectName || '—'}</span> · DE: <strong>${t.createdByName}</strong> → <strong>${t.assigneeName}</strong></div>
        <div class="ac-title">${t.title}</div></div><span class="badge bp-${t.priority}">${PL[t.priority]}</span></div>
        <div class="detail-block db-p"><div class="detail-lbl">// PROBLEMA</div><div class="detail-txt">${t.problem}</div></div>
        <div class="detail-block db-r"><div class="detail-lbl">// RESOLUÇÃO</div><div class="detail-txt">${t.resolution}</div></div>
        <div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-top:8px;"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Deadline: <strong style="color:var(--cream)">${dl}</strong> &nbsp;✨ <strong style="color:var(--gold)">+${t.xpReward} XP</strong></div>
        <div class="ac-acts"><button class="btn btn-success btn-sm" onclick="approveTask('${t.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> APROVAR</button><button class="btn btn-danger btn-sm" onclick="openReject('${t.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> REJEITAR</button><button class="btn btn-ghost btn-sm" onclick="openTask('${t.id}')">DETALHES</button></div></div>`;
    }).join('');
  }

  $('appr-list').innerHTML = html || `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--green);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><h3>TUDO APROVADO</h3></div>`;
}