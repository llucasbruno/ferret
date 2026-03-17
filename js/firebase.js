// ══════════════════════════════════════════════
//  FIREBASE.JS — Inicialização e Auth State
// ══════════════════════════════════════════════

function initFB(cfg) {
  if (firebase.apps.length) firebase.apps.forEach(a => a.delete());
  firebase.initializeApp(cfg);
  db = firebase.firestore();
  auth = firebase.auth();
  auth.onAuthStateChanged(onAuth);
}

async function onAuth(user) {
  hide('loader');
  if (user) {
    me = user;
    const d = await db.collection('users').doc(user.uid).get();
    if (!d.exists) { await auth.signOut(); show('auth-screen'); return; }
    meData = { uid: user.uid, ...d.data() };
    await applyOverduePenalties();
    await checkDeadlineAlerts();

    // Só registra login uma vez por sessão (evita spam em reloads)
    const sessionKey = 'fs_logged_' + me.uid;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      await log('login', `${meData.displayName} fez login`);
    }

    await boot();
  } else {
    me = null; meData = null;
    show('auth-screen'); hide('main-app');
  }
}

// ── XP Penalty por atraso ───────────────────
async function applyOverduePenalties() {
  const uDoc = await db.collection('users').doc(me.uid).get();
  const lastCheck = uDoc.data().lastPenaltyCheck?.toDate ? uDoc.data().lastPenaltyCheck.toDate() : null;
  const days = lastCheck ? Math.floor((Date.now() - lastCheck) / 864e5) : 0;
  if (days < 1) return;

  const s = await db.collection('tasks').where('assigneeId', '==', me.uid).get();
  let pen = 0;
  s.docs.forEach(doc => {
    const t = { id: doc.id, ...doc.data() };
    if (['active', 'in_progress'].includes(t.status) && isOverdue(t)) pen += XP_DAILY_DECAY * days;
  });

  if (pen > 0) {
    const nxp = Math.max(0, (meData.xp || 0) - pen);
    await db.collection('users').doc(me.uid).update({ xp: nxp, lastPenaltyCheck: firebase.firestore.FieldValue.serverTimestamp() });
    meData.xp = nxp;
    await log('xp_penalty', `${meData.displayName} perdeu ${pen} XP por tasks atrasadas`);
    toast(`⚠ -${pen} XP por tasks atrasadas`, false);
  } else {
    await db.collection('users').doc(me.uid).update({ lastPenaltyCheck: firebase.firestore.FieldValue.serverTimestamp() });
  }
}

// ── Alertas de deadline ──────────────────────
async function checkDeadlineAlerts() {
  const s = await db.collection('tasks').where('assigneeId', '==', me.uid).get();
  const now = Date.now();
  const TWO_DAYS = 2 * 864e5;
  const TODAY = new Date().toISOString().split('T')[0];
  const batch = db.batch();
  let alertCount = 0;

  for (const doc of s.docs) {
    const t = { id: doc.id, ...doc.data() };
    if (!['active', 'in_progress'].includes(t.status)) continue;
    const dl = t.deadline?.toDate ? t.deadline.toDate() : t.deadline ? new Date(t.deadline) : null;
    if (!dl) continue;
    const diff = dl.getTime() - now;
    if (diff < 0 || diff > TWO_DAYS) continue;
    if (t.lastDeadlineAlert === TODAY) continue;

    const daysLeft = Math.ceil(diff / 864e5);
    const label = daysLeft <= 0 ? 'hoje' : daysLeft === 1 ? 'amanhã' : `em ${daysLeft} dias`;

    await saveNotif(me.uid, 'deadline_warning', t.title, {
      fromName: 'Sistema',
      reason: `Prazo: ${dl.toLocaleDateString('pt-BR')} — vence ${label}`
    });
    batch.update(doc.ref, { lastDeadlineAlert: TODAY });
    alertCount++;
  }

  if (alertCount > 0) {
    await batch.commit();
    toast(`⏰ ${alertCount} task${alertCount > 1 ? 's' : ''} com prazo próximo!`, false);
  }
}

// ── Config screen ────────────────────────────
function saveConfig() {
  const ids = ['c-apiKey', 'c-authDomain', 'c-projectId', 'c-storageBucket', 'c-messagingSenderId', 'c-appId'];
  const cfg = Object.fromEntries(ids.map(id => [id.slice(2), $(id).value.trim()]));
  if (!cfg.apiKey || !cfg.projectId) { toast('Preencha API Key e Project ID', false); return; }
  localStorage.setItem('fs_cfg', JSON.stringify(cfg));
  hide('config-screen');
  initFB(cfg);
}