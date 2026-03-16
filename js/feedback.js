// ══════════════════════════════════════════════
//  FEEDBACK.JS — Bug Report e Sugestões
// ══════════════════════════════════════════════


const EMAILJS_TEMPLATE_ID = 'template_qzne6sj';


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
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        tipo,
        titulo,
        descricao,
        nome:          meData.displayName,
        email_usuario: meData.email || me.email || '—',
        name:          meData.displayName,
        time:          new Date().toLocaleString('pt-BR'),
        message:       `Tipo: ${tipo}\nTítulo: ${titulo}\nDescrição: ${descricao}`,
        email:         meData.email || me.email || '—',
      },
      EMAILJS_PUBLIC_KEY
    );

    toast('Feedback enviado com sucesso! 🎉', true);
    closeModal('m-feedback');

  } catch (e) {
    console.error('EmailJS error:', e);
    err.textContent = 'Erro ao enviar. Tente novamente.';
    err.style.display = 'block';
    $('fb-btn').textContent = 'ENVIAR';
    $('fb-btn').disabled = false;
  }
}