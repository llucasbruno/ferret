// ══════════════════════════════════════════════
//  MEMBERS.JS — Membros, XP, Cargo e Perfil
// ══════════════════════════════════════════════

// ── XP Edit ──────────────────────────────────
function openEditXP(uid) {
  const u = users.find(x => x.uid === uid); if (!u) return;
  cargoUID = uid;
  $('edit-xp-name').textContent = u.displayName;
  $('edit-xp-current').textContent = `XP atual: ${u.xp || 0} · Feitas: ${u.tasksCompleted || 0}`;
  $('edit-xp-value').value = u.xp || 0;
  $('edit-xp-tasks').value = u.tasksCompleted || 0;
  showModal('m-edit-xp');
}

async function saveEditXP() {
  const u = users.find(x => x.uid === cargoUID); if (!u) return;
  const xpVal = $('edit-xp-value').value, tasksVal = $('edit-xp-tasks').value;
  const upd = {};
  if (xpVal   !== '') upd.xp             = Math.max(0, parseInt(xpVal)   || 0);
  if (tasksVal !== '') upd.tasksCompleted = Math.max(0, parseInt(tasksVal) || 0);
  if (!Object.keys(upd).length) { closeModal('m-edit-xp'); return; }
  await db.collection('users').doc(cargoUID).update(upd);
  await log('cargo_update', `${meData.displayName} ajustou XP de ${u.displayName} → ${upd.xp ?? u.xp} XP, ${upd.tasksCompleted ?? u.tasksCompleted} feitas`);
  closeModal('m-edit-xp'); toast(`XP de ${u.displayName} atualizado!`, true);
}

async function doResetXPSingle() {
  const u = users.find(x => x.uid === cargoUID); if (!u) return;
  await db.collection('users').doc(cargoUID).update({ xp: 0, tasksCompleted: 0 });
  await log('cargo_update', `${meData.displayName} zerou XP de ${u.displayName}`);
  closeModal('m-edit-xp'); toast(`XP de ${u.displayName} zerado!`, true);
}

function openResetXP() {
  $('reset-confirm-input').value = ''; $('btn-confirm-reset').disabled = true; showModal('m-reset-xp');
}
async function doResetXP() {
  closeModal('m-reset-xp');
  const snap = await db.collection('users').get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { xp: 0, tasksCompleted: 0 }));
  await batch.commit();
  await log('cargo_update', `${meData.displayName} resetou o XP e tarefas concluídas de todos os membros`);
  toast('XP e Feitas zerados com sucesso!', true);
}

// ── Cargo ────────────────────────────────────
function openCargo(uid) {
  cargoUID = uid; const u = users.find(x => x.uid === uid); if (!u) return;
  $('m-cargo-name').textContent = u.displayName;
  $('cargo-input').value = u.cargo || ''; $('access-input').value = u.access || 'member';
  showModal('m-cargo');
}
async function saveCargo() {
  const cargo = $('cargo-input').value.trim(), access = $('access-input').value;
  if (!cargo) { toast('Informe o cargo', false); return; }
  await db.collection('users').doc(cargoUID).update({ cargo, access });
  const u = users.find(x => x.uid === cargoUID);
  await log('cargo_update', `${meData.displayName} atualizou cargo de ${u?.displayName} para "${cargo}"`);
  toast('Cargo atualizado!', true); closeModal('m-cargo'); await refresh(); renderCurView();
}

// ── Render members ───────────────────────────
async function renderMembers() {
  await loadUsers();
  $('members-list').innerHTML = users.map(u => {
    const r = rank(u.xp || 0);
    const av = u.photoURL ? `<img src="${u.photoURL}" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:cover;display:block">` : (u.displayName[0] || '?');
    const xpPct_ = xpPct(u.xp || 0);
    return `<div class="member-card">
      <div class="avatar" style="width:42px;height:42px;font-size:17px;">${av}</div>
      <div class="member-info" style="flex:1;">
        <div class="member-name">${u.displayName}</div>
        <div class="member-role">${u.cargo || '—'} · <span style="color:${u.access === 'manager' ? 'var(--gold)' : 'var(--cyan)'};">${u.access === 'manager' ? 'GERENTE' : 'MEMBRO'}</span></div>
        <div style="font-family:var(--M);font-size:9px;color:var(--dim);margin-top:2px;">${r.icon} <span style="color:${r.color}">${r.name}</span> · <strong style="color:var(--gold)">${u.xp || 0} XP</strong> · ${u.tasksCompleted || 0} feitas</div>
        <div style="margin-top:5px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${xpPct_}%;background:${r.color};transition:width .3s;"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button class="btn btn-ghost btn-sm" onclick="openEditXP('${u.uid}')" style="color:var(--gold);">✨ XP</button>
        <button class="btn btn-info btn-sm" onclick="openCargo('${u.uid}')">✏ CARGO</button>
      </div>
    </div>`;
  }).join('');
}

// ── Profile ───────────────────────────────────
async function renderProfile() {
  await loadTasks();
  const mt      = tasks.filter(t => t.assigneeId === me.uid);
  const active  = mt.filter(t => ['active', 'in_progress'].includes(t.status)).length;
  const pend    = mt.filter(t => t.status === 'pending_approval').length;
  const overdue = mt.filter(t => isOverdue(t)).length;
  const done    = meData.tasksCompleted || 0;
  const r = rank(meData.xp || 0), n = nextRank(meData.xp || 0), p = xpPct(meData.xp || 0);
  const av = meData.photoURL ? `<img src="${meData.photoURL}" onerror="this.style.display='none';this.parentNode.textContent='${meData.displayName[0] || '?'}'" style="width:100%;height:100%;object-fit:cover;display:block">` : (meData.displayName[0] || '?');
  $('p-hero').innerHTML = `<div class="p-avatar" style="cursor:pointer;position:relative;" onclick="openEditProfile()" title="Editar perfil">
      ${av}
      <div style="position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;border-radius:inherit;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
        <span style="font-size:18px;">✏</span>
      </div>
    </div>
    <div style="flex:1;min-width:180px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div class="p-name">${meData.displayName}</div>
        <button class="btn btn-ghost btn-sm" onclick="openEditProfile()" style="padding:4px 10px;font-size:10px;opacity:.7;">✏ EDITAR</button>
      </div>
      <div class="p-role">${meData.cargo || '—'} · ${meData.access === 'manager' ? 'GERENTE' : 'MEMBRO'}</div>
      <div class="p-rank" style="background:${r.color}20;color:${r.color};border:1px solid ${r.color}40;">${r.icon} ${r.name}</div>
      <div class="p-xp-lbl"><span>${meData.xp || 0} XP total</span><span>${n ? `→ ${n.name} (${p}%)` : 'RANK MÁXIMO ✨'}</span></div>
      <div class="pbar" style="height:5px;"><div class="pfill" style="width:${p}%;background:${r.color};"></div></div>
    </div>`;
  $('p-stats').innerHTML = [
    { v: done,           l: 'Concluídas', c: 'var(--green)' },
    { v: active,         l: 'Ativas',     c: 'var(--cyan)' },
    { v: overdue,        l: 'Atrasadas',  c: 'var(--red)' },
    { v: pend,           l: 'Aguardando', c: '#F5C518' },
    { v: meData.xp || 0, l: 'Total XP',  c: 'var(--gold)' },
  ].map(s => `<div class="stat-card"><div class="stat-v" style="color:${s.c}">${s.v}</div><div class="stat-l">${s.l}</div></div>`).join('');
}

// ── Edit profile ──────────────────────────────
function openEditProfile() {
  $('ep-name').value = meData.displayName || '';
  $('ep-photo').value = meData.photoURL && !meData.photoURL.startsWith('data:') ? meData.photoURL : '';
  $('ep-file-name').textContent = ''; $('ep-file').value = '';
  previewProfilePhoto(meData.photoURL || '');
  showModal('m-profile');
}

function previewProfilePhoto(url) {
  const el = $('ep-avatar-preview');
  if (url) { el.innerHTML = `<img src="${url}" onerror="this.style.display='none';this.parentNode.textContent='${meData.displayName[0] || '?'}'" style="width:100%;height:100%;object-fit:cover;display:block">`; }
  else { el.textContent = meData.displayName[0] || '?'; }
}

function handleProfileUpload(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('Imagem muito grande (máx 5MB)', false); return; }
  $('ep-file-name').textContent = file.name; $('ep-photo').value = '';
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const MAX = 200, scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const b64 = canvas.toDataURL('image/jpeg', .85);
      previewProfilePhoto(b64); input._b64 = b64;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  const name = $('ep-name').value.trim(); if (!name) { toast('Informe o nome', false); return; }
  const fileInput = $('ep-file');
  const photo = fileInput._b64 || $('ep-photo').value.trim() || meData.photoURL || '';
  await db.collection('users').doc(me.uid).update({ displayName: name, photoURL: photo });
  meData.displayName = name; meData.photoURL = photo;
  fileInput._b64 = null; closeModal('m-profile'); updateSidebar();
  toast('Perfil atualizado!', true); await renderProfile();
}
