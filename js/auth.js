// ══════════════════════════════════════════════
//  AUTH.JS — Login, Registro e Logout
// ══════════════════════════════════════════════

async function doLogin() {
  const e = $('l-email').value.trim(), p = $('l-pass').value, err = $('l-err');
  err.style.display = 'none';
  if (!e || !p) { err.textContent = 'Preencha todos os campos'; err.style.display = 'block'; return; }
  try {
    // Marca que o próximo onAuth veio de um clique manual do usuário
    _loginWasManual = true;
    await auth.signInWithEmailAndPassword(e, p);
  }
  catch {
    _loginWasManual = false;
    err.textContent = 'Email ou senha incorretos';
    err.style.display = 'block';
  }
}

async function doRegister() {
  const [name, email, pass, cargo, photo] = ['r-name', 'r-email', 'r-pass', 'r-cargo', 'r-photo'].map(id => $(id).value.trim());
  const err = $('r-err'); err.style.display = 'none';
  if (!name || !email || !pass) { err.textContent = 'Preencha nome, email e senha'; err.style.display = 'block'; return; }
  try {
    const access = CEO_EMAILS.includes(email.toLowerCase()) ? 'manager' : 'member';
    const c = await auth.createUserWithEmailAndPassword(email, pass);
    const member = { displayName: name, email, cargo: cargo || 'Motion Designer', photoURL: photo || '', access, xp: 0, joinedAt: firebase.firestore.FieldValue.serverTimestamp() };
    await db.collection('users').doc(c.user.uid).set(member);
    await log('register', `${name} entrou no estúdio como ${access === 'manager' ? 'CEO 👑' : 'Membro'}`);
    // Notifica todos os managers sobre o novo membro
    const usersSnap = await db.collection('users').where('access', '==', 'manager').get();
    usersSnap.docs.forEach(d => {
      const mgr = d.data();
      if (mgr.email) emailNewMember(mgr.email, mgr.displayName, member);
    });
  } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
}

async function doLogout() {
  stopListeners();
  await log('logout', `${meData?.displayName} fez logout`);
  return auth.signOut();
}

// ── Recuperação de senha ──────────────────────
function toggleForgotPassword() {
  const el = $('f-forgot');
  const hidden = el.classList.contains('hidden');
  el.classList.toggle('hidden', !hidden);
  if (!hidden) return; // fechando — limpa
  // abrindo — pré-preenche com o email já digitado
  const email = $('l-email').value.trim();
  if (email) $('forgot-email').value = email;
  $('forgot-err').style.display = 'none';
  $('forgot-ok').classList.add('hidden');
  $('forgot-btn').textContent = 'ENVIAR';
  $('forgot-btn').disabled = false;
  $('forgot-email').focus();
}

async function doForgotPassword() {
  const email = $('forgot-email').value.trim();
  const err   = $('forgot-err');
  const ok    = $('forgot-ok');
  const btn   = $('forgot-btn');
  err.style.display = 'none'; ok.classList.add('hidden');

  if (!email) { err.textContent = 'Informe o email'; err.style.display = 'block'; return; }

  btn.textContent = 'ENVIANDO...'; btn.disabled = true;

  try {
    await auth.sendPasswordResetEmail(email);
    ok.classList.remove('hidden');
    btn.textContent = 'ENVIADO ✓';
    // Pré-preenche o campo de login com o email
    $('l-email').value = email;
  } catch (ex) {
    btn.textContent = 'ENVIAR'; btn.disabled = false;
    const msg = ex.code === 'auth/user-not-found'
      ? 'Nenhuma conta encontrada com este email.'
      : ex.code === 'auth/invalid-email'
      ? 'Email inválido.'
      : 'Erro ao enviar. Tente novamente.';
    err.textContent = msg; err.style.display = 'block';
  }
}

function switchTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  $('f-' + tab).classList.add('active');
}