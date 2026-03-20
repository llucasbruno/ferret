// ══════════════════════════════════════════════
//  PATCHNOTES.JS — Notas de atualização
// ══════════════════════════════════════════════

const EMAILJS_PN_TEMPLATE_ID = 'template_bo4ktef';

const PN_TYPE_LABEL = { new: 'Nova Funcionalidade', improve: 'Melhoria', fix: 'Correção de Bug' };
const PN_TYPE_CLASS = { new: 'pn-new', improve: 'pn-improve', fix: 'pn-fix' };

function openCreatePN() {
  ['pn-version', 'pn-title', 'pn-body'].forEach(id => $(id).value = '');
  $('pn-type').value = 'new';
  showModal('m-pn');
}

async function doCreatePN() {
  const version = $('pn-version').value.trim();
  const title   = $('pn-title').value.trim();
  const body    = $('pn-body').value.trim();
  const type    = $('pn-type').value;
  if (!version || !title || !body) { toast('Preencha versão, título e descrição', false); return; }

  // Salva no Firestore
  await db.collection('patchNotes').add({
    version, title, body, type,
    authorId: me.uid, authorName: meData.displayName,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  await log('patch_note', `${meData.displayName} publicou atualização ${version}: "${title}"`);

  // Envia notificação no app + email para todos os usuários
  await _notificarAtualizacao(version, title, body, type);

  closeModal('m-pn');
  toast(`📢 Atualização ${version} publicada!`, true);
  await renderPatchNotes();
}

// ── Notifica todos os usuários ───────────────
async function _notificarAtualizacao(version, title, body, type) {
  const tipoLabel = PN_TYPE_LABEL[type] || 'Nova Atualização';
  const snap = await db.collection('users').get();
  const todos = snap.docs.map(d => ({ uid: d.id, ...d.data() }));

  // Notificação in-app para todos exceto quem publicou
  for (const u of todos) {
    if (u.uid !== me.uid) {
      await saveNotif(u.uid, 'patch_note', title, {
        fromName: meData.displayName,
        reason: `${tipoLabel} · Versão ${version}`
      });
    }
  }

  // Email via backend para todos que têm email cadastrado
  const recipients = todos.filter(u => u.email).map(u => ({ email: u.email, name: u.displayName || '—' }));
  if (recipients.length) {
    await emailPatchNote(recipients, version, tipoLabel, title, body);
  }
}

async function deletePN(id) {
  if (!confirm('Excluir esta nota de atualização?')) return;
  await db.collection('patchNotes').doc(id).delete();
  await log('patch_note', `${meData.displayName} removeu uma nota de atualização`);
  toast('Nota removida');
  await renderPatchNotes();
}

async function renderPatchNotes() {
  const snap  = await db.collection('patchNotes').orderBy('createdAt', 'desc').get();
  const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const isMgr = meData?.access === 'manager';

  document.querySelectorAll('.mgr-only').forEach(el => el.classList.toggle('hidden', meData.access !== 'manager'));

  if (!notes.length) {
    $('pn-list').innerHTML = `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" style="stroke:var(--dim);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div><h3>SEM ATUALIZAÇÕES</h3><p>Nenhuma nota de atualização publicada ainda.</p>${isMgr ? '<br><button class="btn btn-primary btn-sm" onclick="openCreatePN()">+ PUBLICAR PRIMEIRA NOTA</button>' : ''}</div>`;
    return;
  }

  $('pn-list').innerHTML = notes.map(n => {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
    return `<div class="pn-card">
      <div class="pn-ver">
        <span>${n.version}</span>
        <span class="pn-tag ${PN_TYPE_CLASS[n.type] || 'pn-new'}">${PN_TYPE_LABEL[n.type] || 'NOVO'}</span>
      </div>
      <div class="pn-title">${n.title}</div>
      <div class="pn-meta"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:var(--dim);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:3px;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; ✍ ${n.authorName}</div>
      <div class="pn-body">${n.body}</div>
      ${isMgr ? `<div style="margin-top:14px;"><button class="btn btn-danger btn-sm" onclick="deletePN('${n.id}')"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> EXCLUIR</button></div>` : ''}
    </div>`;
  }).join('');
}