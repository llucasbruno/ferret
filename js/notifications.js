// ══════════════════════════════════════════════
//  NOTIFICATIONS.JS — Notificações
// ══════════════════════════════════════════════

const NOTIF_ICONS  = { cargo_update: '✏️', patch_note: '📢', rejection: '✕', task_approved: '✓', task_assigned: '⚡', project_approved: '✓', project_rejected: '✕', mention: '💬', deadline_warning: '⏰', delete_request: '🗑', delete_approved: '✓', delete_rejected: '✕', action_pending: '🎯', action_approved: '✓', action_rejected: '✕', action_assigned: '🎯' };
const NOTIF_COLORS = { cargo_update: 'var(--cyan)', patch_note: 'var(--cyan)', rejection: 'var(--red)', task_approved: 'var(--green)', task_assigned: 'var(--cyan)', project_approved: 'var(--green)', project_rejected: 'var(--red)', mention: 'var(--gold)', deadline_warning: '#F5C518', delete_request: 'var(--red)', delete_approved: 'var(--green)', delete_rejected: 'var(--red)', action_pending: '#F5C518', action_approved: 'var(--green)', action_rejected: 'var(--red)', action_assigned: 'var(--cyan)' };
const NOTIF_LABELS = { cargo_update: 'Cargo atualizado', patch_note: '📢 Nova atualização', rejection: 'Task rejeitada', task_approved: 'Task aprovada', task_assigned: 'Task atribuída a você', project_approved: 'Projeto aprovado', project_rejected: 'Projeto rejeitado', mention: '💬 Menção', deadline_warning: '⚠ Prazo próximo', delete_request: 'Solicitação de exclusão', delete_approved: 'Exclusão aprovada', delete_rejected: 'Exclusão rejeitada', action_pending: '🎯 Action Plan aguardando', action_approved: 'Action Plan aprovado', action_rejected: 'Action Plan rejeitado', action_assigned: 'Action Plan atribuído' };

async function renderNotifications() {
  $('notif-list').innerHTML = `<div style="color:var(--dim);font-family:var(--M);font-size:11px;padding:12px 0;">Carregando...</div>`;
  const s = await db.collection('notifications').where('toUid', '==', me.uid).get();
  const notifs = s.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 60);
  const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
  if (unreadIds.length) {
    const batch = db.batch();
    unreadIds.forEach(id => batch.update(db.collection('notifications').doc(id), { read: true }));
    await batch.commit();
    $('notif-badge').classList.add('hidden');
  }
  if (!notifs.length) {
    $('notif-list').innerHTML = `<div class="empty"><div class="empty-icon">🔔</div><h3>TUDO LIMPO</h3><p>Nenhuma notificação ainda</p></div>`; return;
  }
  $('notif-list').innerHTML = notifs.map(n => {
    const col   = NOTIF_COLORS[n.type] || 'var(--dim)';
    const icon  = NOTIF_ICONS[n.type]  || '•';
    const label = NOTIF_LABELS[n.type] || n.type;
    const time  = n.createdAt?.toDate ? n.createdAt.toDate() : null;
    const wasUnread = unreadIds.includes(n.id);
    return `<div class="notif-item${wasUnread ? ' unread' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;margin-bottom:6px;background:var(--bg2);border-left:3px solid ${col}33;border-radius:0 4px 4px 0;cursor:pointer;transition:background .15s;" onclick="navigateFromNotif('${n.type}','${n.refId || ''}')" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='var(--bg2)'">
      <div style="width:30px;height:30px;border-radius:50%;background:${col}18;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;color:${col};">${icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
          <div style="font-family:var(--M);font-size:10px;color:${col};letter-spacing:1px;">${label}</div>
          ${wasUnread ? `<span style="font-family:var(--M);font-size:9px;background:${col}22;color:${col};padding:1px 6px;border-radius:8px;">NOVO</span>` : ''}
        </div>
        ${n.taskTitle ? `<div style="font-family:var(--R);font-size:14px;font-weight:600;color:var(--cream);margin:3px 0;">${n.taskTitle}</div>` : ''}
        ${n.reason    ? `<div style="font-size:12px;color:var(--dim);line-height:1.4;">${n.reason}</div>` : ''}
        <div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-top:4px;">${n.fromName || '—'} · ${time ? fmtTime(n.createdAt) : '—'}</div>
      </div>
      <button onclick="event.stopPropagation();deleteNotif('${n.id}')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:14px;flex-shrink:0;opacity:.4;transition:opacity .15s;padding:2px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.4">✕</button>
    </div>`;
  }).join('');
}

async function markAllRead() {
  const s = await db.collection('notifications').where('toUid', '==', me.uid).where('read', '==', false).get();
  if (!s.empty) {
    const batch = db.batch();
    s.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
  await updNotifBadge(); renderNotifications();
}

async function deleteNotif(id) {
  await db.collection('notifications').doc(id).delete();
  await updNotifBadge(); renderNotifications();
}

function navigateFromNotif(type, refId) {
  if (['rejection', 'task_approved', 'task_assigned', 'deadline_warning', 'mention'].includes(type)) { go('my-tasks'); return; }
  if (type === 'patch_note') { go('patchnotes'); return; }
  if (['action_pending', 'action_approved', 'action_rejected', 'action_assigned'].includes(type)) {
    go('actions');
    if (refId) setTimeout(() => openActionDetail(refId), 300);
    return;
  }
  if (['project_approved', 'project_rejected'].includes(type)) { go('projects'); return; }
  if (['delete_request', 'delete_approved', 'delete_rejected'].includes(type)) { go('approvals'); return; }
}