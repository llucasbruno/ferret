// ══════════════════════════════════════════════
//  DATA.JS — Camada de dados e listeners
// ══════════════════════════════════════════════

// ── Loaders ─────────────────────────────────
async function loadUsers()    { const s = await db.collection('users').get();                                   users    = s.docs.map(d => ({ uid: d.id, ...d.data() })); }
async function loadTasks()    { const s = await db.collection('tasks').orderBy('createdAt', 'desc').get();      tasks    = s.docs.map(d => ({ id: d.id,  ...d.data() })); }
async function loadProjects() { const s = await db.collection('projects').orderBy('createdAt', 'asc').get();   projects = s.docs.map(d => ({ id: d.id,  ...d.data() })); }
async function refresh()      { await Promise.all([loadTasks(), loadUsers(), loadProjects()]); }

async function loadLog(lim = 30) {
  const s = await db.collection('activityLog').orderBy('createdAt', 'desc').limit(lim).get();
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadComments(taskId) {
  const s = await db.collection('comments').where('taskId', '==', taskId).get();
  return s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
}

// ── XP ──────────────────────────────────────
async function addXP(uid, amt, countTask = false) {
  const upd = { xp: firebase.firestore.FieldValue.increment(amt) };
  if (countTask && amt > 0) upd.tasksCompleted = firebase.firestore.FieldValue.increment(1);
  await db.collection('users').doc(uid).update(upd);
  if (uid === me?.uid) {
    meData.xp = Math.max(0, (meData.xp || 0) + amt);
    if (countTask && amt > 0) meData.tasksCompleted = (meData.tasksCompleted || 0) + 1;
    updateSidebar();
  }
}

// ── Activity log ─────────────────────────────
async function log(action, details) {
  if (!me) return;
  await db.collection('activityLog').add({
    userId: me.uid, userName: meData?.displayName || '—',
    action, details, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ── Notifications ────────────────────────────
async function saveNotif(toUid, type, title, extra = {}) {
  if (!toUid) return;
  const payload = {
    toUid, type, taskTitle: title, fromName: meData.displayName,
    read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp(), ...extra
  };
  try {
    await db.collection('notifications').add(payload);
  } catch (err) {
    console.error('[saveNotif] Erro:', err);
  }
}

// ── Real-time listeners ──────────────────────
let _unsub = [];
function stopListeners() { _unsub.forEach(u => u()); _unsub = []; }

function startListeners() {
  stopListeners();

  _unsub.push(db.collection('tasks').orderBy('createdAt', 'desc').onSnapshot(s => {
    tasks = s.docs.map(d => ({ id: d.id, ...d.data() }));
    _onDataChange();
  }));

  _unsub.push(db.collection('users').onSnapshot(s => {
    users = s.docs.map(d => ({ uid: d.id, ...d.data() }));
    const me_ = users.find(u => u.uid === me?.uid);
    if (me_) { meData = { ...meData, ...me_ }; updateSidebar(); }
    _onDataChange();
  }));

  _unsub.push(db.collection('projects').orderBy('createdAt', 'asc').onSnapshot(s => {
    projects = s.docs.map(d => ({ id: d.id, ...d.data() }));
    buildGlobalProjSel();
    _onDataChange();
  }));

  _unsub.push(db.collection('notifications').where('toUid', '==', me.uid).onSnapshot(s => {
    const n = s.docs.filter(d => !d.data().read).length;
    const b = $('notif-badge');
    if (b) { b.textContent = n; b.classList.toggle('hidden', n === 0); }
  }));
}

let _changeTimer = null;
function _onDataChange() {
  clearTimeout(_changeTimer);
  _changeTimer = setTimeout(() => {
    const modalOpen = document.querySelector('.overlay:not(.hidden)');
    if (!modalOpen) renderCurView();
    updBadge();
    if (curView === 'dashboard') renderMetrics();
  }, 120);
}
