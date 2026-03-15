// ══════════════════════════════════════════════
//  MENTIONS.JS — Sistema de @menções
//  FIX: renderMentionText duplicada removida
// ══════════════════════════════════════════════

let _mentionIdx = -1;

function parseMentions(text) {
  const matches = [];
  const re = /@(\S+)/g; let m;
  while ((m = re.exec(text)) !== null) {
    const q = m[1].toLowerCase();
    const u = users.find(u => {
      const first = u.displayName.toLowerCase().split(' ')[0];
      const full  = u.displayName.toLowerCase().replace(/\s+/g, '');
      return first === q || full === q || first.startsWith(q) || full.startsWith(q);
    });
    if (u && !matches.find(x => x.uid === u.uid)) matches.push(u);
  }
  return matches;
}

// FIX: função definida uma única vez aqui (era duplicada no código original)
function renderMentionText(text) {
  if (!text) return '';
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return safe.replace(/@(\S+)/g, (m, name) => `<span class="mention-highlight">@${name}</span>`);
}

function _getMentionQuery(input) {
  const val = input.value, cur = input.selectionStart;
  let i = cur - 1;
  while (i >= 0 && val[i] !== ' ' && val[i] !== '\n') i--;
  const word = val.slice(i + 1, cur);
  if (word.startsWith('@') && word.length > 1) return { query: word.slice(1).toLowerCase(), start: i + 1, end: cur };
  return null;
}

function closeMentionDrop(ddId) {
  const dd = $(ddId); if (dd) { dd.classList.add('hidden'); dd.innerHTML = ''; }
  _mentionIdx = -1;
}

function mentionInput(input, ddId) {
  const dd = $(ddId); if (!dd) return;
  const q = _getMentionQuery(input);
  if (!q) { closeMentionDrop(ddId); return; }
  const matches = users.filter(u => u.uid !== me.uid && u.displayName.toLowerCase().split(' ')[0].startsWith(q.query)).slice(0, 6);
  if (!matches.length) { closeMentionDrop(ddId); return; }
  _mentionIdx = -1;
  dd.classList.remove('hidden');
  dd.innerHTML = matches.map((u, i) => {
    const av = u.photoURL ? `<img src="${u.photoURL}" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'">` : (u.displayName[0] || '?');
    const firstName = u.displayName.split(' ')[0];
    return `<div class="mention-item" data-idx="${i}" onmousedown="event.preventDefault();_insertMention(document.getElementById('${input.id}'),'${ddId}','${firstName}')">
      <div class="mention-av">${av}</div>
      <span class="mention-name">${u.displayName}</span>
      <span class="mention-role">${u.cargo || ''}</span>
    </div>`;
  }).join('');
}

function mentionKey(e, input, ddId) {
  const dd = $(ddId);
  if (!dd || dd.classList.contains('hidden')) {
    if (e.key === 'Enter') e.currentTarget.id === 'cmt-in' ? doComment() : doActionComment();
    return;
  }
  const items = dd.querySelectorAll('.mention-item'); if (!items.length) return;
  if (e.key === 'ArrowDown')  { e.preventDefault(); _mentionIdx = Math.min(_mentionIdx + 1, items.length - 1); items.forEach((el, i) => el.classList.toggle('sel', i === _mentionIdx)); items[_mentionIdx]?.scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); _mentionIdx = Math.max(_mentionIdx - 1, 0); items.forEach((el, i) => el.classList.toggle('sel', i === _mentionIdx)); items[_mentionIdx]?.scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'Enter') { e.preventDefault(); const active = items[_mentionIdx >= 0 ? _mentionIdx : 0]; if (active) _insertMention(input, ddId, active.querySelector('.mention-name')?.textContent?.split(' ')[0] || ''); }
  else if (e.key === 'Escape') { closeMentionDrop(ddId); }
}

function _insertMention(input, ddId, firstName) {
  const q = _getMentionQuery(input); if (!q) return;
  const before = input.value.slice(0, q.start);
  const after  = input.value.slice(q.end);
  input.value  = `${before}@${firstName} ${after}`;
  const pos = q.start + firstName.length + 2;
  input.setSelectionRange(pos, pos); input.focus();
  closeMentionDrop(ddId);
}

// Fecha dropdown ao clicar fora
document.addEventListener('click', e => {
  ['mdd-task', 'mdd-action'].forEach(id => {
    const dd = $(id);
    if (dd && !dd.classList.contains('hidden') && !dd.contains(e.target)) closeMentionDrop(id);
  });
});
