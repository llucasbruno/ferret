// ══════════════════════════════════════════════
//  NOTIFICATIONS.JS — Notificações
// ══════════════════════════════════════════════

const NOTIF_ICON_NAMES = { cargo_update: 'user', patch_note: 'megaphone', rejection: 'x', task_approved: 'check', task_assigned: 'zap', project_approved: 'check', project_rejected: 'x', mention: 'message', deadline_warning: 'clock', delete_request: 'trash', delete_approved: 'check', delete_rejected: 'x', action_pending: 'target', action_approved: 'check', action_rejected: 'x', action_assigned: 'target' };
const NOTIF_COLORS = { cargo_update: 'var(--cyan)', patch_note: 'var(--cyan)', rejection: 'var(--red)', task_approved: 'var(--green)', task_assigned: 'var(--cyan)', project_approved: 'var(--green)', project_rejected: 'var(--red)', mention: 'var(--gold)', deadline_warning: '#F5C518', delete_request: 'var(--red)', delete_approved: 'var(--green)', delete_rejected: 'var(--red)', action_pending: '#F5C518', action_approved: 'var(--green)', action_rejected: 'var(--red)', action_assigned: 'var(--cyan)' };
const NOTIF_LABELS = { cargo_update: 'Cargo atualizado', patch_note: 'Nova atualização', rejection: 'Task rejeitada', task_approved: 'Task aprovada', task_assigned: 'Task atribuída a você', project_approved: 'Projeto aprovado', project_rejected: 'Projeto rejeitado', mention: 'Menção', deadline_warning: 'Prazo próximo', delete_request: 'Solicitação de exclusão', delete_approved: 'Exclusão aprovada', delete_rejected: 'Exclusão rejeitada', action_pending: 'Action Plan aguardando', action_approved: 'Action Plan aprovado', action_rejected: 'Action Plan rejeitado', action_assigned: 'Action Plan atribuído' };

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
    $('notif-list').innerHTML = `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div><h3>TUDO LIMPO</h3><p>Nenhuma notificação ainda</p></div>`; return;
  }
  $('notif-list').innerHTML = notifs.map(n => {
    const col      = NOTIF_COLORS[n.type] || 'var(--dim)';
    const iconName = NOTIF_ICON_NAMES[n.type] || 'bell';
    const label    = NOTIF_LABELS[n.type] || n.type;
    const time  = n.createdAt?.toDate ? n.createdAt.toDate() : null;
    const wasUnread = unreadIds.includes(n.id);
    return `<div class="notif-item${wasUnread ? ' unread' : ''}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;margin-bottom:6px;background:var(--bg2);border-left:3px solid ${col}33;border-radius:0 4px 4px 0;cursor:pointer;transition:background .15s;" onclick="navigateFromNotif('${n.type}','${n.refId || ''}')" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='var(--bg2)'">
      <div style="width:32px;height:32px;border-radius:50%;background:${col}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ic(iconName, 14, col)}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:5px;font-family:var(--M);font-size:10px;color:${col};letter-spacing:1px;">${ic(iconName, 10, col)} ${label}</div>
          ${wasUnread ? `<span style="font-family:var(--M);font-size:9px;background:${col}22;color:${col};padding:1px 6px;border-radius:8px;">NOVO</span>` : ''}
        </div>
        ${n.taskTitle ? `<div style="font-family:var(--R);font-size:14px;font-weight:600;color:var(--cream);margin:3px 0;">${n.taskTitle}</div>` : ''}
        ${n.reason    ? `<div style="font-size:12px;color:var(--dim);line-height:1.4;">${n.reason}</div>` : ''}
        <div style="font-family:var(--M);font-size:10px;color:var(--dim);margin-top:4px;">${n.fromName || '—'} · ${time ? fmtTime(n.createdAt) : '—'}</div>
      </div>
      <button onclick="event.stopPropagation();deleteNotif('${n.id}')" style="background:none;border:none;color:var(--dim);cursor:pointer;flex-shrink:0;opacity:.4;transition:opacity .15s;padding:2px;display:flex;align-items:center;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.4"><svg viewBox="0 0 24 24" width="12" height="12" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
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
