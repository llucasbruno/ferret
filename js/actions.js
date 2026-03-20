// ══════════════════════════════════════════════
//  ACTIONS.JS — Action Plans
// ══════════════════════════════════════════════

let apFV = 'all', editingActionId = null, selAction = null;
let apPendingSubactions = [], apSelectedParticipants = [], rejectActionId = null;

function apStatusColor(s) {
  return { pending_approval: '#F5C518', identified: 'var(--dim)', analyzing: 'var(--gold)', executing: 'var(--red)', resolved: 'var(--green)', monitoring: 'var(--cyan)', rejected: 'var(--dim)' }[s] || 'var(--dim)';
}

// ── Open Create ──────────────────────────────
async function openCreateAction() {
  editingActionId = null; apPendingSubactions = []; apSelectedParticipants = [];
  $('m-action-title').innerHTML = 'NOVO <span style="color:var(--red)">PLANO DE AÇÃO</span>';
  ['ap-title', 'ap-problem', 'ap-rootcause', 'ap-solution'].forEach(id => $(id).value = '');
  $('ap-severity').value = 'moderate'; $('ap-priority').value = 'medium';
  const d = new Date(); d.setDate(d.getDate() + 14); $('ap-deadline').value = d.toISOString().split('T')[0];
  $('ap-project').innerHTML = `<option value="">— Sem projeto —</option>` + projects.filter(p => !p.archived && p.status === 'active').map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  $('ap-owner').innerHTML = users.map(u => `<option value="${u.uid}">${u.displayName}</option>`).join('');
  $('ap-owner').value = me.uid;
  $('ap-appr-notice').classList.toggle('hidden', meData.access === 'manager');
  renderApParticipantsWrap(); renderApSubactionsList(); showModal('m-action');
}

// ── Open Edit ────────────────────────────────
async function openEditAction(id) {
  editingActionId = id;
  const snap = await db.collection('actionPlans').doc(id).get();
  const ap = { id, ...snap.data() };
  apPendingSubactions    = (ap.subactions   || []).map(s => ({ ...s }));
  apSelectedParticipants = (ap.participants || []).map(p => p.uid);
  $('m-action-title').innerHTML = 'EDITAR <span style="color:var(--red)">PLANO DE AÇÃO</span>';
  $('ap-title').value = ap.title || ''; $('ap-problem').value = ap.problem || '';
  $('ap-rootcause').value = ap.rootCause || ''; $('ap-solution').value = ap.solution || '';
  $('ap-severity').value = ap.severity || 'moderate'; $('ap-priority').value = ap.priority || 'medium';
  $('ap-project').innerHTML = `<option value="">— Sem projeto —</option>` + projects.filter(p => !p.archived && p.status === 'active').map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  $('ap-project').value = ap.projectId || '';
  $('ap-owner').innerHTML = users.map(u => `<option value="${u.uid}">${u.displayName}</option>`).join('');
  $('ap-owner').value = ap.ownerId || me.uid;
  const dl = ap.deadline?.toDate ? ap.deadline.toDate() : ap.deadline ? new Date(ap.deadline) : null;
  $('ap-deadline').value = dl ? dl.toISOString().split('T')[0] : '';
  $('ap-appr-notice').classList.add('hidden');
  renderApParticipantsWrap(); renderApSubactionsList();
  closeModal('m-action-detail'); showModal('m-action');
}

// ── Participants ─────────────────────────────
function renderApParticipantsWrap() {
  const wrap = $('ap-participants-wrap'); if (!wrap) return;
  const ownerId  = $('ap-owner').value;
  const eligible = users.filter(u => u.uid !== ownerId);
  if (!eligible.length) { wrap.innerHTML = `<span style="font-family:var(--M);font-size:10px;color:var(--dim);">Sem outros membros.</span>`; return; }
  wrap.innerHTML = eligible.map(u => {
    const sel = apSelectedParticipants.includes(u.uid);
    const av  = u.photoURL ? `<img src="${u.photoURL}" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'">` : (u.displayName[0] || '?');
    return `<div onclick="toggleApParticipant('${u.uid}')" style="display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;cursor:pointer;border:1px solid ${sel ? 'var(--cyan)' : 'rgba(255,255,255,.1)'};background:${sel ? 'rgba(0,196,180,.1)' : 'transparent'};transition:all .15s;">
      <div style="width:20px;height:20px;border-radius:50%;overflow:hidden;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-family:var(--R);font-size:11px;font-weight:700;color:var(--cyan);flex-shrink:0;">${av}</div>
      <span style="font-family:var(--M);font-size:10px;color:${sel ? 'var(--cyan)' : 'var(--dim)'};">${u.displayName.split(' ')[0]}</span>
      ${sel ? `<span style="color:var(--cyan);">✓</span>` : ''}
    </div>`;
  }).join('');
}

function toggleApParticipant(uid_) {
  apSelectedParticipants = apSelectedParticipants.includes(uid_) ? apSelectedParticipants.filter(x => x !== uid_) : [...apSelectedParticipants, uid_];
  renderApParticipantsWrap();
}

// ── Sub-actions ──────────────────────────────
function addApSubaction() {
  const inp = $('ap-subaction-input'), text = inp.value.trim(); if (!text) return;
  apPendingSubactions.push({ id: 'sa_' + Date.now(), text, done: false });
  inp.value = ''; renderApSubactionsList();
}
function removeApSubaction(id) { apPendingSubactions = apPendingSubactions.filter(s => s.id !== id); renderApSubactionsList(); }
function renderApSubactionsList() {
  const el = $('ap-subactions-list'); if (!el) return;
  if (!apPendingSubactions.length) { el.innerHTML = '<div style="font-family:var(--M);font-size:10px;color:var(--dim);padding:4px 0;">Nenhuma sub-ação</div>'; return; }
  el.innerHTML = apPendingSubactions.map(s => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:rgba(255,255,255,.03);border-radius:2px;margin-bottom:4px;">
      <div style="width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-radius:3px;flex-shrink:0;"></div>
      <span style="flex:1;font-size:13px;color:var(--cream);">${s.text}</span>
      <button onclick="removeApSubaction('${s.id}')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--dim)'">×</button>
    </div>`).join('');
}

// ── Save ─────────────────────────────────────
async function saveAction() {
  const title = $('ap-title').value.trim(), problem = $('ap-problem').value.trim(), solution = $('ap-solution').value.trim();
  const deadline = $('ap-deadline').value, ownerId = $('ap-owner').value;
  if (!title || !problem || !solution || !deadline || !ownerId) { toast('Preencha os campos obrigatórios', false); return; }
  const isMgr = meData.access === 'manager';
  const owner = users.find(u => u.uid === ownerId);
  const projectId = $('ap-project').value || null;
  const proj = projectId ? projects.find(p => p.id === projectId) : null;
  const participants = apSelectedParticipants.map(uid_ => { const u = users.find(x => x.uid === uid_); return { uid: uid_, name: u?.displayName || '—' }; });
  const data = {
    title, problem, rootCause: $('ap-rootcause').value.trim() || null, solution,
    severity: $('ap-severity').value, priority: $('ap-priority').value,
    ownerId, ownerName: owner?.displayName || '—', participants, projectId, projectName: proj?.name || null,
    deadline: new Date(deadline + 'T00:00:00'), subactions: apPendingSubactions,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (editingActionId) {
    await db.collection('actionPlans').doc(editingActionId).update(data);
    await log('task_create', `${meData.displayName} editou o plano "${title}"`);
    toast('Plano atualizado!', true);
  } else {
    data.status        = isMgr ? 'identified' : 'pending_approval';
    data.createdById   = me.uid; data.createdByName = meData.displayName;
    data.createdAt     = firebase.firestore.FieldValue.serverTimestamp();
    data.order         = Date.now(); data.rejectionReason = null;
    const ref = await db.collection('actionPlans').add(data);
    if (isMgr) {
      await log('task_create', `${meData.displayName} criou o plano "${title}"`);
      if (ownerId !== me.uid) await saveNotif(ownerId, 'action_assigned', title, { refId: ref.id });
      for (const p of participants) { if (p.uid !== me.uid && p.uid !== ownerId) await saveNotif(p.uid, 'action_assigned', title, { refId: ref.id }); }
      toast('Plano criado!', true);
    } else {
      await log('task_pending', `${meData.displayName} submeteu o plano "${title}" para aprovação`);
      for (const mgr of users.filter(u => u.access === 'manager')) {
        await saveNotif(mgr.uid, 'action_pending', title, { fromName: meData.displayName, reason: `Severidade: ${AP_SEV_LABEL[data.severity]} · Prioridade: ${AP_PRIO_LABEL[data.priority]}`, refId: ref.id });
        // Email para o manager
        if (mgr.email) emailActionPending(mgr.email, mgr.displayName, meData.displayName, title, data.severity, data.priority);
      }
      toast('Plano enviado para aprovação!', true); await updBadge();
    }
  }
  closeModal('m-action'); apPendingSubactions = []; apSelectedParticipants = []; editingActionId = null;
  renderActions();
}

// ── Approve / Reject ─────────────────────────
async function approveAction(id) {
  const snap = await db.collection('actionPlans').doc(id).get();
  const ap = { id, ...snap.data() };
  await db.collection('actionPlans').doc(id).update({ status: 'identified', rejectionReason: null, approvedById: me.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await log('task_approve', `${meData.displayName} aprovou o plano "${ap.title}"`);
  await saveNotif(ap.createdById, 'action_approved', ap.title, { refId: id });
  if (ap.ownerId !== ap.createdById) await saveNotif(ap.ownerId, 'action_assigned', ap.title, { refId: id });
  for (const p of (ap.participants || [])) { if (p.uid !== ap.createdById && p.uid !== ap.ownerId) await saveNotif(p.uid, 'action_assigned', ap.title, { refId: id }); }
  toast('Plano aprovado!', true); closeModal('m-action-detail'); renderApprovals(); renderActions(); updBadge();
}

function openRejectAction(id) { rejectActionId = id; $('rej-action-reason').value = ''; showModal('m-reject-action'); }
async function doRejectAction() {
  const reason = $('rej-action-reason').value.trim(); if (!reason) { toast('Informe o motivo', false); return; }
  const snap = await db.collection('actionPlans').doc(rejectActionId).get();
  const ap = { id: rejectActionId, ...snap.data() };
  await db.collection('actionPlans').doc(rejectActionId).update({ status: 'rejected', rejectionReason: reason, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await saveNotif(ap.createdById, 'action_rejected', ap.title, { reason, refId: rejectActionId });
  await log('task_reject', `${meData.displayName} rejeitou o plano "${ap.title}": ${reason}`);
  toast('Plano rejeitado'); closeModal('m-reject-action'); closeModal('m-action-detail');
  renderApprovals(); renderActions(); updBadge();
}

async function updateActionStatus(id, status) {
  await db.collection('actionPlans').doc(id).update({ status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await log('task_start', `${meData.displayName} moveu plano para ${AP_STATUS_LABEL[status]}`);
  toast(`Status: ${AP_STATUS_LABEL[status]}`, true); openActionDetail(id); renderActions();
}

async function toggleApSubaction(actionId, subId) {
  const snap = await db.collection('actionPlans').doc(actionId).get();
  const ap = snap.data();
  const updated = (ap.subactions || []).map(s => s.id === subId ? { ...s, done: !s.done } : s);
  await db.collection('actionPlans').doc(actionId).update({ subactions: updated, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  openActionDetail(actionId); renderActions();
}

async function deleteAction(id) {
  if (!confirm('Excluir este plano? Ação irreversível.')) return;
  const snap = await db.collection('actionPlans').doc(id).get();
  await db.collection('actionPlans').doc(id).delete();
  await log('task_delete', `${meData.displayName} excluiu o plano "${snap.data()?.title}"`);
  toast('Plano excluído'); closeModal('m-action-detail'); renderActions();
}

// ── Detail Modal ─────────────────────────────
async function openActionDetail(id) {
  selAction = id;
  const snap = await db.collection('actionPlans').doc(id).get(); if (!snap.exists) return;
  const ap = { id, ...snap.data() };
  const isMgr = meData?.access === 'manager';
  const dl    = ap.deadline?.toDate ? ap.deadline.toDate() : ap.deadline ? new Date(ap.deadline) : null;
  const isOD  = dl && dl < new Date() && !['resolved', 'rejected'].includes(ap.status);

  $('apd-title').textContent = ap.title;
  $('apd-proj').innerHTML = ap.projectId ? `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background:${projColor(ap.projectId)};display:inline-block;"></span>${ap.projectName}</span>` : '';
  $('apd-badges').innerHTML = `
    <span class="badge asev-${ap.severity}">${AP_SEV_LABEL[ap.severity]}</span>
    <span class="badge bp-${ap.priority}">${AP_PRIO_LABEL[ap.priority]}</span>
    <span class="badge ast-${ap.status}">${AP_STATUS_LABEL[ap.status]}</span>
    ${isOD ? '<span class="badge bs-overdue">PRAZO VENCIDO</span>' : ''}`;

  if (!['pending_approval', 'rejected'].includes(ap.status)) {
    $('apd-status-btns').innerHTML = `<span style="font-family:var(--M);font-size:9px;color:var(--dim);letter-spacing:1px;margin-right:4px;">STATUS:</span>` +
      ['identified', 'analyzing', 'executing', 'resolved', 'monitoring'].map(s =>
        `<button class="btn btn-sm ${ap.status === s ? 'btn-primary' : 'btn-ghost'}" onclick="updateActionStatus('${id}','${s}')" style="${ap.status === s ? `background:${apStatusColor(s)}33;color:${apStatusColor(s)};border-color:${apStatusColor(s)};` : ''}font-size:10px;padding:4px 10px;">${AP_STATUS_LABEL[s]}</button>`
      ).join('');
  } else { $('apd-status-btns').innerHTML = ''; }

  $('apd-problem').textContent  = ap.problem  || '—';
  $('apd-solution').textContent = ap.solution || '—';
  if (ap.rootCause)      { show('apd-rootcause-block');  $('apd-rootcause').textContent   = ap.rootCause; }      else { hide('apd-rootcause-block'); }
  if (ap.rejectionReason){ show('apd-rejection-block');  $('apd-rejection-txt').textContent = ap.rejectionReason; } else { hide('apd-rejection-block'); }
  $('apd-deadline').textContent  = fmtDate(dl) + (isOD ? ' ⚠ VENCIDO' : '');
  $('apd-deadline').style.color  = isOD ? 'var(--red)' : 'var(--cream)';
  $('apd-owner').textContent = ap.ownerName || '—';
  const parts = ap.participants || [];
  $('apd-participants-info').innerHTML = parts.length ? `👥 <strong style="color:var(--cream)">${parts.map(p => p.name.split(' ')[0]).join(', ')}</strong>` : '';

  const subs = ap.subactions || [];
  const sd   = subs.filter(s => s.done).length, pct = subs.length ? Math.round((sd / subs.length) * 100) : 0;
  $('apd-subactions-wrap').innerHTML = subs.length ? `
    <div class="detail-lbl" style="margin-bottom:8px;">// SUB-AÇÕES <span style="color:var(--cyan);margin-left:6px;">${sd}/${subs.length} · ${pct}%</span></div>
    <div style="height:3px;background:rgba(255,255,255,.07);overflow:hidden;margin-bottom:8px;border-radius:2px;"><div style="height:100%;width:${pct}%;background:var(--cyan);border-radius:2px;transition:width .3s;"></div></div>
    ${subs.map(s => `<div class="act-item ${s.done ? 'done' : ''}" onclick="toggleApSubaction('${id}','${s.id}')">
      <div class="act-check ${s.done ? 'done' : ''}"></div>
      <span style="flex:1;font-size:13px;">${s.text}</span>
    </div>`).join('')}` : '';

  let acts = '';
  if (isMgr && ap.status === 'pending_approval') {
    acts += `<button class="btn btn-success btn-sm" onclick="approveAction('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> APROVAR</button>`;
    acts += `<button class="btn btn-danger btn-sm" onclick="openRejectAction('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> REJEITAR</button>`;
  }
  if ((isMgr || ap.createdById === me.uid) && ap.status !== 'rejected') acts += `<button class="btn btn-info btn-sm" onclick="openEditAction('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> EDITAR</button>`;
  if (isMgr || ap.createdById === me.uid) acts += `<button class="btn btn-danger btn-sm" onclick="deleteAction('${id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> EXCLUIR</button>`;
  $('apd-acts').innerHTML = acts;

  const cmts  = await db.collection('actionComments').where('actionId', '==', id).get();
  const cList = cmts.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  const cel   = $('apd-cmts');
  if (!cList.length) cel.innerHTML = '<div style="color:var(--dim);font-size:13px;padding:8px 0;">Nenhum comentário ainda.</div>';
  else cel.innerHTML = cList.map(x => `<div class="cmt"><div class="cmt-author">${x.userName}</div><div class="cmt-txt">${renderMentionText(x.text)}</div><div class="cmt-time">${fmtTime(x.createdAt)}</div></div>`).join('');
  cel.scrollTop = cel.scrollHeight; $('apcmt-in').value = '';
  showModal('m-action-detail');
}

async function doActionComment() {
  const txt = $('apcmt-in').value.trim(); if (!txt || !selAction) return;
  await db.collection('actionComments').add({ actionId: selAction, userId: me.uid, userName: meData.displayName, text: txt, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  const snap = await db.collection('actionPlans').doc(selAction).get();
  const apTitle = snap.data()?.title || '—';
  parseMentions(txt).forEach(async u => {
    if (u.uid !== me.uid) await saveNotif(u.uid, 'mention', apTitle, { reason: `${meData.displayName}: "${txt.slice(0, 80)}"`, refId: selAction });
  });
  $('apcmt-in').value = ''; closeMentionDrop('mdd-action'); openActionDetail(selAction);
}

// ── Render list ──────────────────────────────
async function renderActions() {
  const snap = await db.collection('actionPlans').orderBy('order', 'asc').get();
  let aps    = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (apFV !== 'all') aps = aps.filter(a => a.status === apFV);
  const all_ = snap.docs.map(d => d.data());
  const counts = { pending_approval: 0, identified: 0, analyzing: 0, executing: 0, resolved: 0, monitoring: 0 };
  all_.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
  const odCnt = all_.filter(a => { const dl = a.deadline?.toDate ? a.deadline.toDate() : a.deadline ? new Date(a.deadline) : null; return dl && dl < new Date() && !['resolved', 'rejected'].includes(a.status); }).length;

  $('ap-summary').innerHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;">
    ${Object.entries(counts).filter(([, n]) => n > 0).map(([s, n]) => `<div style="background:${apStatusColor(s)}15;border:1px solid ${apStatusColor(s)}40;padding:4px 12px;border-radius:20px;font-family:var(--M);font-size:10px;color:${apStatusColor(s)};">${AP_STATUS_LABEL[s]} <strong>${n}</strong></div>`).join('')}
    ${odCnt > 0 ? `<div style="background:rgba(255,70,85,.12);border:1px solid rgba(255,70,85,.35);padding:4px 12px;border-radius:20px;font-family:var(--M);font-size:10px;color:var(--red);"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> VENCIDOS <strong>${odCnt}</strong></div>` : ''}
  </div>`;

  if (!aps.length) {
    $('ap-list').innerHTML = `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div><h3>SEM PLANOS DE AÇÃO</h3><p style="margin-bottom:12px">${apFV === 'all' ? 'Crie o primeiro plano de ação' : 'Nenhum plano com este status'}</p>${apFV === 'all' ? `<button class="btn btn-primary btn-sm" onclick="openCreateAction()">+ CRIAR PLANO</button>` : ''}</div>`;
    return;
  }

  $('ap-list').innerHTML = aps.map(ap => {
    const dl    = ap.deadline?.toDate ? ap.deadline.toDate() : ap.deadline ? new Date(ap.deadline) : null;
    const isOD  = dl && dl < new Date() && !['resolved', 'rejected'].includes(ap.status);
    const subs  = ap.subactions || [], sd = subs.filter(s => s.done).length, pct = subs.length ? Math.round((sd / subs.length) * 100) : 0;
    const allM  = [{ uid: ap.ownerId, name: ap.ownerName || '?' }, ...(ap.participants || [])];
    const avs   = allM.slice(0, 5).map(p => { const u = users.find(x => x.uid === p.uid); const av = u?.photoURL ? `<img src="${u.photoURL}" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'">` : (p.name[0] || '?'); return `<div class="ap-mini-av">${av}</div>`; }).join('');
    return `<div class="ap-card sev-${ap.severity} st-${ap.status}" onclick="openActionDetail('${ap.id}')">
      <div class="ap-head">
        <div class="ap-title">${ap.title}</div>
        <div class="ap-badges">
          <span class="badge asev-${ap.severity}">${AP_SEV_LABEL[ap.severity]}</span>
          <span class="badge bp-${ap.priority}">${AP_PRIO_LABEL[ap.priority]}</span>
          <span class="badge ast-${ap.status}">${AP_STATUS_LABEL[ap.status]}</span>
          ${isOD ? '<span class="badge bs-overdue">VENCIDO</span>' : ''}
        </div>
      </div>
      <div class="ap-problem">${ap.problem}</div>
      <div class="ap-solution-block">${ap.solution}</div>
      ${ap.projectId ? `<div style="display:flex;align-items:center;gap:5px;font-family:var(--M);font-size:9px;color:var(--dim);margin-bottom:8px;"><span style="width:7px;height:7px;border-radius:50%;background:${projColor(ap.projectId)};display:inline-block;flex-shrink:0;"></span>${ap.projectName}</div>` : ''}
      <div class="ap-foot">
        <div class="ap-participants">${avs}${allM.length > 5 ? `<span style="font-family:var(--M);font-size:9px;color:var(--dim);margin-left:8px;">+${allM.length - 5}</span>` : ''}</div>
        <span><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> <strong style="color:${isOD ? 'var(--red)' : 'var(--cream)'}">${fmtDate(dl)}${isOD ? ' ⚠' : ''}</strong></span>
        ${subs.length ? `<span style="color:var(--cyan);">✓ ${sd}/${subs.length}</span>` : ''}
      </div>
      ${subs.length ? `<div class="ap-progress"><div class="ap-progress-fill" style="width:${pct}%;background:${pct === 100 ? 'var(--green)' : 'var(--cyan)'}"></div></div>` : ''}
    </div>`;
  }).join('');
}