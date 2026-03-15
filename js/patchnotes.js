// ══════════════════════════════════════════════
//  PATCHNOTES.JS — Notas de atualização
// ══════════════════════════════════════════════

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
  await db.collection('patchNotes').add({
    version, title, body, type,
    authorId: me.uid, authorName: meData.displayName,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await log('patch_note', `${meData.displayName} publicou atualização ${version}: "${title}"`);
  closeModal('m-pn');
  toast(`📢 Atualização ${version} publicada!`, true);
  await renderPatchNotes();
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

  const typeLabel = { new: '🟢 NOVA FUNCIONALIDADE', improve: '💠 MELHORIA', fix: '🔴 CORREÇÃO' };
  const typeClass = { new: 'pn-new', improve: 'pn-improve', fix: 'pn-fix' };

  if (!notes.length) {
    $('pn-list').innerHTML = `<div class="empty"><div class="empty-icon">📰</div><h3>SEM ATUALIZAÇÕES</h3><p>Nenhuma nota de atualização publicada ainda.</p>${isMgr ? '<br><button class="btn btn-primary btn-sm" onclick="openCreatePN()">+ PUBLICAR PRIMEIRA NOTA</button>' : ''}</div>`;
    return;
  }

  $('pn-list').innerHTML = notes.map(n => {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
    return `<div class="pn-card">
      <div class="pn-ver">
        <span>${n.version}</span>
        <span class="pn-tag ${typeClass[n.type] || 'pn-new'}">${typeLabel[n.type] || 'NOVO'}</span>
      </div>
      <div class="pn-title">${n.title}</div>
      <div class="pn-meta">📅 ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; ✍ ${n.authorName}</div>
      <div class="pn-body">${n.body}</div>
      ${isMgr ? `<div style="margin-top:14px;"><button class="btn btn-danger btn-sm" onclick="deletePN('${n.id}')">🗑 EXCLUIR</button></div>` : ''}
    </div>`;
  }).join('');
}
