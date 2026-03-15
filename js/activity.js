// ══════════════════════════════════════════════
//  ACTIVITY.JS — Log de atividades
// ══════════════════════════════════════════════

async function renderActivity() {
  const isMgr    = meData?.access === 'manager';
  const memberSel = $('act-filter-member');
  const typeSel   = $('act-filter-type');

  if (memberSel && memberSel.options.length <= 1) {
    users.forEach(u => { const o = document.createElement('option'); o.value = u.uid; o.textContent = u.displayName; memberSel.appendChild(o); });
  }

  let logs = await loadLog(200);
  const ACCESS_ACTIONS = ['login', 'logout', 'register'];

  const acSec = $('act-acesso-section');
  if (isMgr) {
    acSec.classList.remove('hidden');
    const acessos = logs.filter(l => ACCESS_ACTIONS.includes(l.action)).slice(0, 20);
    $('act-acesso-list').innerHTML = renderLogs(acessos);
  }

  logs = logs.filter(l => !ACCESS_ACTIONS.includes(l.action));

  const memVal  = memberSel?.value || 'all';
  const typeVal = typeSel?.value   || 'all';
  if (memVal !== 'all')  logs = logs.filter(l => l.userId === memVal);
  if (typeVal !== 'all') {
    const catMap = {
      task:    ['task_create', 'task_pending', 'task_approve', 'task_reject', 'task_start', 'task_done', 'task_delete'],
      project: ['project_create', 'project_update'],
      xp:      ['xp_penalty', 'task_done'],
      member:  ['cargo_update'],
      acesso:  ACCESS_ACTIONS,
      system:  ['patch_note']
    };
    logs = logs.filter(l => (catMap[typeVal] || []).includes(l.action));
  }

  $('act-list').innerHTML = renderLogs(logs.slice(0, actLimit));
  const more = $('act-load-more');
  if (more) { more.innerHTML = logs.length > actLimit ? `<button class="btn btn-ghost btn-sm" onclick="actLimit+=50;renderActivity()">VER MAIS (${logs.length - actLimit} restantes)</button>` : ''; }
}
