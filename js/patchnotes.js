// ══════════════════════════════════════════════
//  PATCHNOTES.JS — Notas de atualização
// ══════════════════════════════════════════════

const EMAILJS_PN_TEMPLATE_ID = 'template_bo4ktef';

const PN_TYPE_LABEL = { new: '🟢 Nova Funcionalidade', improve: '💠 Melhoria', fix: '🔴 Correção de Bug' };
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

  // Busca todos os usuários
  const snap = await db.collection('users').get();
  const todos = snap.docs.map(d => ({ uid: d.id, ...d.data() }));

  const promises = todos.map(async u => {
    // 1. Notificação no app (para todos exceto quem publicou)
    if (u.uid !== me.uid) {
      await saveNotif(u.uid, 'patch_note', title, {
        fromName: meData.displayName,
        reason: `${tipoLabel} · Versão ${version}`
      });
    }

    // 2. Email (para todos incluindo quem publicou)
    if (u.email) {
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_PN_TEMPLATE_ID,
          {
            para_email: u.email,
            versao:     version,
            titulo:     title,
            tipo:       tipoLabel,
            descricao:  body,
            nome:       u.displayName || '—',
          },
          EMAILJS_PUBLIC_KEY
        );
      } catch (err) {
        console.error(`Erro ao enviar email para ${u.email}:`, err);
      }
    }
  });

  await Promise.all(promises);
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
    $('pn-list').innerHTML = `<div class="empty"><div class="empty-icon">📰</div><h3>SEM ATUALIZAÇÕES</h3><p>Nenhuma nota de atualização publicada ainda.</p>${isMgr ? '<br><button class="btn btn-primary btn-sm" onclick="openCreatePN()">+ PUBLICAR PRIMEIRA NOTA</button>' : ''}</div>`;
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
      <div class="pn-meta">📅 ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; ✍ ${n.authorName}</div>
      <div class="pn-body">${n.body}</div>
      ${isMgr ? `<div style="margin-top:14px;"><button class="btn btn-danger btn-sm" onclick="deletePN('${n.id}')">🗑 EXCLUIR</button></div>` : ''}
    </div>`;
  }).join('');
}