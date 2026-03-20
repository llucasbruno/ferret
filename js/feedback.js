// ══════════════════════════════════════════════
//  FEEDBACK.JS — Bug Report e Sugestões
// ══════════════════════════════════════════════

function openFeedback() {
  $('fb-tipo').value = 'Bug';
  $('fb-titulo').value = '';
  $('fb-descricao').value = '';
  $('fb-err').style.display = 'none';
  $('fb-btn').textContent = 'ENVIAR';
  $('fb-btn').disabled = false;
  showModal('m-feedback');
}

async function doSendFeedback() {
  const tipo      = $('fb-tipo').value;
  const titulo    = $('fb-titulo').value.trim();
  const descricao = $('fb-descricao').value.trim();
  const err       = $('fb-err');

  err.style.display = 'none';

  if (!titulo || !descricao) {
    err.textContent = 'Preencha título e descrição.';
    err.style.display = 'block';
    return;
  }

  $('fb-btn').textContent = 'ENVIANDO...';
  $('fb-btn').disabled = true;

  try {
    // Envia para todos os managers via backend
    const managersSnap = await db.collection('users').where('access', '==', 'manager').get();
    const managers = managersSnap.docs.map(d => d.data()).filter(u => u.email);

    await Promise.all(managers.map(mgr =>
      emailFeedback(mgr.email, {
        nome:      meData.displayName,
        email:     meData.email || me.email || '—',
        tipo,
        titulo,
        descricao,
      })
    ));

    toast('Feedback enviado com sucesso! 🎉', true);
    closeModal('m-feedback');

  } catch (e) {
    console.error('Feedback error:', e);
    err.textContent = 'Erro ao enviar. Tente novamente.';
    err.style.display = 'block';
    $('fb-btn').textContent = 'ENVIAR';
    $('fb-btn').disabled = false;
  }
}