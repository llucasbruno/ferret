// ══════════════════════════════════════════════
//  ACTIVITY.JS — Log de atividades
// ══════════════════════════════════════════════

const ACCESS_ACTIONS = ['login', 'logout', 'register'];

async function renderActivity() {
  const isMgr     = meData?.access === 'manager';
  const memberSel = $('act-filter-member');
  const typeSel   = $('act-filter-type');

  // Popula filtro de membros uma vez
  if (memberSel && memberSel.options.length <= 1) {
    users.forEach(u => {
      const o = document.createElement('option');
      o.value = u.uid; o.textContent = u.displayName;
      memberSel.appendChild(o);
    });
  }

  let logs = await loadLog(200);

  // ── Seção de Acessos (só ADM) ────────────────
  const acSec = $('act-acesso-section');
  if (isMgr) {
    acSec.classList.remove('hidden');
    // Agrupa logins consecutivos do mesmo usuário no mesmo dia
    const acessos = _agruparAcessos(logs.filter(l => ACCESS_ACTIONS.includes(l.action)));
    $('act-acesso-list').innerHTML = renderLogs(acessos);
  }

  // ── Log geral: SEMPRE remove acessos ────────
  // login/logout/register nunca aparecem na lista geral
  logs = logs.filter(l => !ACCESS_ACTIONS.includes(l.action));

  // Resetar actLimit ao renderizar do zero
  const memVal  = memberSel?.value || 'all';
  const typeVal = typeSel?.value   || 'all';

  if (memVal !== 'all') logs = logs.filter(l => l.userId === memVal);

  if (typeVal !== 'all') {
    const catMap = {
      task:    ['task_create', 'task_pending', 'task_approve', 'task_reject', 'task_start', 'task_done', 'task_delete', 'task_update'],
      project: ['project_create', 'project_update'],
      xp:      ['xp_penalty', 'task_done'],
      member:  ['cargo_update'],
      system:  ['patch_note']
    };
    logs = logs.filter(l => (catMap[typeVal] || []).includes(l.action));
  }

  $('act-list').innerHTML = renderLogs(logs.slice(0, actLimit));

  const more = $('act-load-more');
  if (more) {
    more.innerHTML = logs.length > actLimit
      ? `<button class="btn btn-ghost btn-sm" onclick="actLimit+=50;renderActivity()">VER MAIS (${logs.length - actLimit} restantes)</button>`
      : '';
  }
}

// ── Agrupa logins do mesmo usuário no mesmo dia ──
function _agruparAcessos(logs) {
  const visto = new Set();
  return logs.filter(l => {
    if (l.action !== 'login') return true; // logout e register passam direto
    const data = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
    const chave = l.userId + '_' + data.toISOString().split('T')[0];
    if (visto.has(chave)) return false;
    visto.add(chave);
    return true;
  });
}