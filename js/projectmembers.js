// ══════════════════════════════════════════════
//  PROJECTMEMBERS.JS — Membros por Projeto
// ══════════════════════════════════════════════

// ── Helpers ──────────────────────────────────

function userHasProjectAccess(uid, project) {
  if (!project) return false;
  if (meData?.access === 'manager') return true;
  const members = project.members || [];
  if (members.includes(uid)) return true;
  const hasTask = tasks.some(t => t.projectId === project.id && t.assigneeId === uid);
  return hasTask;
}

function currentUserHasAccess(project) {
  return userHasProjectAccess(me?.uid, project);
}

// ── Adicionar membro (ADM) ────────────────────
function openAddProjectMember(projectId) {
  const p = projects.find(x => x.id === projectId); if (!p) return;
  const members = p.members || [];
  const eligible = users.filter(u => !members.includes(u.uid));

  $('add-member-proj-name').textContent = p.name;
  $('add-member-proj-id').value = projectId;
  $('add-member-select').innerHTML = eligible.length
    ? eligible.map(u => `<option value="${u.uid}">${u.displayName}</option>`).join('')
    : '<option disabled>Todos os membros já estão no projeto</option>';

  showModal('m-add-proj-member');
}

async function saveAddProjectMember() {
  const projectId = $('add-member-proj-id').value;
  const uid       = $('add-member-select').value;
  if (!projectId || !uid) return;
  const u = users.find(x => x.uid === uid);
  const p = projects.find(x => x.id === projectId);
  const members = [...(p.members || []), uid];
  await db.collection('projects').doc(projectId).update({ members });
  await saveNotif(uid, 'project_approved', p.name, { fromName: meData.displayName, reason: 'Você foi adicionado ao projeto' });
  await log('project_member', `${meData.displayName} adicionou ${u?.displayName} ao projeto "${p.name}"`);
  toast(`${u?.displayName} adicionado ao projeto!`, true);
  closeModal('m-add-proj-member');
}

async function removeProjectMember(projectId, uid) {
  if (!confirm('Remover este membro do projeto?')) return;
  const p = projects.find(x => x.id === projectId); if (!p) return;
  const u = users.find(x => x.uid === uid);
  const members = (p.members || []).filter(m => m !== uid);
  await db.collection('projects').doc(projectId).update({ members });
  await log('project_member', `${meData.displayName} removeu ${u?.displayName} do projeto "${p.name}"`);
  toast(`${u?.displayName} removido do projeto.`, true);
}

// ── Solicitar entrada (Membro) ────────────────
async function requestProjectAccess(projectId) {
  const p = projects.find(x => x.id === projectId); if (!p) return;

  const existing = await db.collection('projectMemberRequests')
    .where('projectId', '==', projectId)
    .where('userId', '==', me.uid)
    .where('status', '==', 'pending')
    .get();
  if (!existing.empty) { toast('Você já solicitou acesso a este projeto', false); return; }

  await db.collection('projectMemberRequests').add({
    projectId, projectName: p.name,
    userId: me.uid, userName: meData.displayName,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Notifica cada manager de forma independente (erro em um não afeta os outros)
  const managers = users.filter(u => u.access === 'manager');
  for (const mgr of managers) {
    try {
      await saveNotif(mgr.uid, 'action_pending', p.name, {
        fromName: meData.displayName,
        reason: `${meData.displayName} solicitou acesso ao projeto`
      });
    } catch (e) { console.warn('Notif falhou para', mgr.displayName, e.message); }

    if (mgr.email) {
      try {
        emailProjectRequested(
          mgr.email,
          mgr.displayName,
          meData.displayName,
          p.name,
          `Solicitação de entrada no projeto como membro.`
        );
      } catch (e) { console.warn('Email falhou para', mgr.email, e.message); }
    }
  }

  await log('project_member', `${meData.displayName} solicitou acesso ao projeto "${p.name}"`);
  await updBadge();
  toast('Solicitação enviada para o ADM!', true);
}

async function approveProjectMemberRequest(reqId) {
  const snap = await db.collection('projectMemberRequests').doc(reqId).get();
  const r = snap.data(); if (!r) return;
  const p = projects.find(x => x.id === r.projectId);
  const members = [...(p?.members || []), r.userId];
  await db.collection('projects').doc(r.projectId).update({ members });
  await db.collection('projectMemberRequests').doc(reqId).update({ status: 'approved' });
  await saveNotif(r.userId, 'project_approved', r.projectName, { fromName: meData.displayName, reason: 'Sua solicitação de acesso foi aprovada' });
  await log('project_member', `${meData.displayName} aprovou acesso de ${r.userName} ao projeto "${r.projectName}"`);
  toast(`${r.userName} adicionado ao projeto!`, true); updBadge();
}

async function rejectProjectMemberRequest(reqId) {
  const snap = await db.collection('projectMemberRequests').doc(reqId).get();
  const r = snap.data(); if (!r) return;
  await db.collection('projectMemberRequests').doc(reqId).update({ status: 'rejected' });
  await saveNotif(r.userId, 'project_rejected', r.projectName, { fromName: meData.displayName, reason: 'Sua solicitação de acesso foi negada' });
  toast('Solicitação rejeitada.', false); updBadge();
}

// ── Render member list for project detail ─────
function renderProjectMembers(p) {
  const isMgr  = meData?.access === 'manager';
  const members = (p.members || []).map(uid => users.find(u => u.uid === uid)).filter(Boolean);
  const hasAccess = currentUserHasAccess(p);

  let html = `<div class="sec">MEMBROS DO PROJETO</div>`;

  if (!members.length) {
    html += `<div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-bottom:12px;">Nenhum membro adicionado ainda.</div>`;
  } else {
    html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
      ${members.map(u => {
        const av = u.photoURL
          ? `<img src="${u.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'">`
          : `<span style="font-family:var(--R);font-weight:700;font-size:12px;">${u.displayName[0]}</span>`;
        return `<div style="display:flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid rgba(255,255,255,.08);padding:5px 10px;border-radius:20px;">
          <div style="width:22px;height:22px;border-radius:50%;overflow:hidden;background:var(--bg2);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${av}</div>
          <span style="font-family:var(--M);font-size:10px;color:var(--cream);">${u.displayName.split(' ')[0]}</span>
          ${isMgr ? `<button onclick="removeProjectMember('${p.id}','${u.uid}')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px;padding:0;margin-left:2px;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--dim)'">${ic('x',10,'currentColor')}</button>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }

  if (isMgr) {
    html += `<button class="btn btn-info btn-sm" onclick="openAddProjectMember('${p.id}')">${ic('user',11,'currentColor')} + ADICIONAR MEMBRO</button>`;
  } else if (!hasAccess) {
    html += `<button class="btn btn-ghost btn-sm" onclick="requestProjectAccess('${p.id}')">${ic('lock',11,'currentColor')} SOLICITAR ACESSO</button>`;
  }

  return html;
}