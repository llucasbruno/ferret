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
    await db.collection('users').doc(c.user.uid).set({
      displayName: name, email, cargo: cargo || 'Motion Designer',
      photoURL: photo || '', access, xp: 0,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await log('register', `${name} entrou no estúdio como ${access === 'manager' ? 'CEO 👑' : 'Membro'}`);
  } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
}

async function doLogout() {
  stopListeners();
  await log('logout', `${meData?.displayName} fez logout`);
  return auth.signOut();
}

function switchTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  $('f-' + tab).classList.add('active');
}