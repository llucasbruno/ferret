// ══════════════════════════════════════════════
//  EMAIL.JS — Integração com backend de emails
// ══════════════════════════════════════════════

async function _callEmail(route, body) {
  try {
    await fetch(BACKEND_URL + '/email/' + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn('Email não enviado:', route, e.message);
  }
}

// ── Task atribuída ───────────────────────────
async function emailTaskAssigned(assigneeEmail, assigneeName, task) {
  if (!assigneeEmail) return;
  await _callEmail('task-assigned', {
    to:          assigneeEmail,
    memberName:  assigneeName,
    taskTitle:   task.title,
    priority:    PL[task.priority] || task.priority,
    deadline:    fmtDate(task.deadline?.toDate ? task.deadline.toDate() : task.deadline ? new Date(task.deadline) : null),
    xpReward:    task.xpReward,
    projectName: task.projectName || null,
  });
}

// ── Task finalizada ──────────────────────────
async function emailTaskFinalized(assigneeEmail, assigneeName, task, totalXp) {
  if (!assigneeEmail) return;
  await _callEmail('task-finalized', {
    to:         assigneeEmail,
    memberName: assigneeName,
    taskTitle:  task.title,
    xpReward:   task.xpReward,
    totalXp,
  });
}

// ── Task rejeitada ───────────────────────────
async function emailTaskRejected(assigneeEmail, assigneeName, task, reason) {
  if (!assigneeEmail) return;
  await _callEmail('task-rejected', {
    to:         assigneeEmail,
    memberName: assigneeName,
    taskTitle:  task.title,
    reason,
  });
}

// ── Task em atraso ───────────────────────────
async function emailTaskOverdue(assigneeEmail, assigneeName, task) {
  if (!assigneeEmail) return;
  await _callEmail('task-overdue', {
    to:         assigneeEmail,
    memberName: assigneeName,
    taskTitle:  task.title,
    deadline:   fmtDate(task.deadline?.toDate ? task.deadline.toDate() : task.deadline ? new Date(task.deadline) : null),
  });
}

// ── Novo membro ──────────────────────────────
async function emailNewMember(adminEmail, adminName, member) {
  if (!adminEmail) return;
  await _callEmail('new-member', {
    to:          adminEmail,
    adminName,
    memberName:  member.displayName,
    memberEmail: member.email,
    cargo:       member.cargo || 'Motion Designer',
  });
}

// ── Cargo atualizado ─────────────────────────
async function emailCargoUpdated(memberEmail, memberName, newCargo, newAccess) {
  if (!memberEmail) return;
  await _callEmail('cargo-updated', {
    to:         memberEmail,
    memberName,
    newCargo,
    newAccess,
  });
}

// ── Novo login ───────────────────────────────
async function emailNewLogin(memberEmail, memberName) {
  if (!memberEmail) return;
  const ua    = navigator.userAgent;
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Navegador desconhecido';
  const os      = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iPhone' : 'SO desconhecido';
  const date    = new Date().toLocaleString('pt-BR');

  // Tenta pegar localização aproximada via IP
  let city = '—', country = '—';
  try {
    const geo = await fetch('https://ipapi.co/json/');
    const data = await geo.json();
    city    = data.city    || '—';
    country = data.country_name || '—';
  } catch (_) {}

  await _callEmail('new-login', {
    to: memberEmail,
    memberName,
    browser,
    os,
    city,
    country,
    date,
  });
}

// ── Patch note ───────────────────────────────
async function emailPatchNote(recipients, version, type, title, body) {
  if (!recipients?.length) return;
  await _callEmail('patch-note', {
    recipients, // [{ email, name }]
    version,
    type,
    title,
    body,
  });
}

// ── Feedback ─────────────────────────────────
async function emailFeedback(adminEmail, feedbackData) {
  if (!adminEmail) return;
  await _callEmail('feedback', {
    to:        adminEmail,
    ...feedbackData,
    time:      new Date().toLocaleString('pt-BR'),
  });
}

// ── Projeto solicitado ───────────────────────
async function emailProjectRequested(adminEmail, adminName, requesterName, projectName, description) {
  if (!adminEmail) return;
  await _callEmail('project-requested', {
    to:           adminEmail,
    adminName,
    requesterName,
    projectName,
    description:  description || '',
  });
}