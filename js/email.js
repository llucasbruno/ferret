// ══════════════════════════════════════════════
//  EMAIL.JS — Emails para membros via EmailJS
//             Emails para managers via Backend (Resend)
// ══════════════════════════════════════════════

const EMAILJS_SVC      = 'service_v5m774r';
const EMAILJS_TPL      = 'template_qzne6sj';  // template genérico (to_email, tipo, titulo, mensagem)
const EMAILJS_KEY      = EMAILJS_PUBLIC_KEY;   // definido no config.js

// ── Helper EmailJS (membros) ─────────────────
async function _sendEJS(toEmail, tipo, titulo, mensagem) {
  if (!toEmail) return;
  try {
    await emailjs.send(EMAILJS_SVC, EMAILJS_TPL, {
      to_email: toEmail,
      name:     'Ferret Studio',
      email:    'noreply@ferretstudio.com',
      tipo,
      titulo,
      mensagem,
    }, EMAILJS_KEY);
  } catch (e) {
    console.warn('EmailJS falhou para', toEmail, e);
  }
}

// ── Helper Backend (managers via Resend) ─────
async function _callEmail(route, body) {
  try {
    await fetch(BACKEND_URL + '/email/' + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn('Backend email falhou:', route, e.message);
  }
}

// ════════════════════════════════════════════
//  EMAILS PARA MEMBROS — via EmailJS
// ════════════════════════════════════════════

// ── Task atribuída ───────────────────────────
async function emailTaskAssigned(assigneeEmail, assigneeName, task) {
  if (!assigneeEmail) return;
  const mensagem = `
    <p>Olá, <strong>${assigneeName}</strong>. Uma nova missão foi atribuída a você.</p>
    <p><strong>Título:</strong> ${task.title}</p>
    ${task.projectName ? `<p><strong>Projeto:</strong> ${task.projectName}</p>` : ''}
    <p><strong>Prioridade:</strong> ${PL[task.priority] || task.priority}</p>
    <p><strong>Deadline:</strong> ${fmtDate(task.deadline?.toDate ? task.deadline.toDate() : task.deadline ? new Date(task.deadline) : null)}</p>
    <p><strong>Recompensa:</strong> +${task.xpReward} XP ao finalizar</p>
    <p>Acesse o app para ver os detalhes.</p>
  `;
  await _sendEJS(assigneeEmail, 'Nova Task', task.title, mensagem);
}

// ── Task finalizada ──────────────────────────
async function emailTaskFinalized(assigneeEmail, assigneeName, task, totalXp) {
  if (!assigneeEmail) return;
  const mensagem = `
    <p>Parabéns, <strong>${assigneeName}</strong>! Sua task foi aprovada.</p>
    <p><strong>Task:</strong> ${task.title}</p>
    <p><strong>XP ganhos:</strong> +${task.xpReward} XP</p>
    <p><strong>Total atual:</strong> ${totalXp} XP</p>
  `;
  await _sendEJS(assigneeEmail, 'Task Finalizada ★', task.title, mensagem);
}

// ── Task rejeitada ───────────────────────────
async function emailTaskRejected(assigneeEmail, assigneeName, task, reason) {
  if (!assigneeEmail) return;
  const mensagem = `
    <p>Olá, <strong>${assigneeName}</strong>. Sua task foi rejeitada.</p>
    <p><strong>Task:</strong> ${task.title}</p>
    <p><strong>Motivo:</strong> ${reason}</p>
    <p>Revise e reenvie para aprovação.</p>
  `;
  await _sendEJS(assigneeEmail, 'Task Rejeitada', task.title, mensagem);
}

// ── Task em atraso ───────────────────────────
async function emailTaskOverdue(assigneeEmail, assigneeName, task) {
  if (!assigneeEmail) return;
  const dl = fmtDate(task.deadline?.toDate ? task.deadline.toDate() : task.deadline ? new Date(task.deadline) : null);
  const mensagem = `
    <p>Olá, <strong>${assigneeName}</strong>. Você tem uma task com prazo vencido.</p>
    <p><strong>Task:</strong> ${task.title}</p>
    <p><strong>Prazo era:</strong> ${dl}</p>
    <p>Conclua o quanto antes para evitar penalidade de XP.</p>
  `;
  await _sendEJS(assigneeEmail, '⚠ Task em Atraso', task.title, mensagem);
}

// ── Cargo atualizado ─────────────────────────
async function emailCargoUpdated(memberEmail, memberName, newCargo, newAccess) {
  if (!memberEmail) return;
  const mensagem = `
    <p>Olá, <strong>${memberName}</strong>. Seu cargo no estúdio foi alterado.</p>
    <p><strong>Novo cargo:</strong> ${newCargo}</p>
    <p><strong>Nível de acesso:</strong> ${newAccess === 'manager' ? 'Gerente (ADM) 👑' : 'Membro'}</p>
  `;
  await _sendEJS(memberEmail, 'Cargo Atualizado', newCargo, mensagem);
}

// ── Novo login ───────────────────────────────
async function emailNewLogin(memberEmail, memberName) {
  if (!memberEmail) return;
  const ua      = navigator.userAgent;
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Navegador desconhecido';
  const os      = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iPhone' : 'SO desconhecido';
  const date    = new Date().toLocaleString('pt-BR');

  let city = '—', country = '—';
  try {
    const geo  = await fetch('https://ipapi.co/json/');
    const data = await geo.json();
    city    = data.city         || '—';
    country = data.country_name || '—';
  } catch (_) {}

  const mensagem = `
    <p>Olá, <strong>${memberName}</strong>. Um novo acesso foi detectado na sua conta.</p>
    <p><strong>Navegador:</strong> ${browser} — ${os}</p>
    <p><strong>Localização:</strong> ${city}, ${country}</p>
    <p><strong>Data e hora:</strong> ${date}</p>
    <p>Se foi você, ignore este email. Caso contrário, entre em contato com o administrador.</p>
  `;
  await _sendEJS(memberEmail, 'Novo Acesso Detectado', 'Acesso à sua conta', mensagem);
}

// ════════════════════════════════════════════
//  EMAILS PARA MANAGERS — via Backend (Resend)
// ════════════════════════════════════════════

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

// ── Patch note ───────────────────────────────
async function emailPatchNote(recipients, version, type, title, body) {
  if (!recipients?.length) return;
  await _callEmail('patch-note', { recipients, version, type, title, body });
}

// ── Feedback ─────────────────────────────────
async function emailFeedback(adminEmail, feedbackData) {
  if (!adminEmail) return;
  await _callEmail('feedback', {
    to:   adminEmail,
    ...feedbackData,
    time: new Date().toLocaleString('pt-BR'),
  });
}

// ── Projeto solicitado ───────────────────────
async function emailProjectRequested(adminEmail, adminName, requesterName, projectName, description) {
  if (!adminEmail) return;
  await _callEmail('project-requested', {
    to: adminEmail,
    adminName,
    requesterName,
    projectName,
    description: description || '',
  });
}

// ── Action plan pendente ─────────────────────
async function emailActionPending(adminEmail, adminName, requesterName, title, severity, priority) {
  if (!adminEmail) return;
  await _callEmail('action-pending', {
    to: adminEmail,
    adminName,
    requesterName,
    title,
    severity,
    priority,
  });
}