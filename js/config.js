// ══════════════════════════════════════════════
//  CONFIG.JS — Constantes e configurações
// ══════════════════════════════════════════════

const CEO_EMAILS = ['avacode394@gmail.com', 'ramombenfica99@gmail.com'];

const FB_CONFIG = {
  apiKey: "AIzaSyCo2XRo7OwUln0yj4U8Ry4APC4fg2dOvHQ",
  authDomain: "ferret-studio.firebaseapp.com",
  projectId: "ferret-studio",
  storageBucket: "ferret-studio.firebasestorage.app",
  messagingSenderId: "983275545835",
  appId: "1:983275545835:web:b6a3c0a62e086ff7fe8aae"
};

const XP_REWARD   = { low: 80, medium: 150, high: 300, critical: 700 };
const XP_PENALTY  = { low: 40, medium: 100, high: 200, critical: 400 };
const XP_DAILY_DECAY = 5;

const RANKS = [
  { name: 'IRON',      min: 0,     color: '#9B9B9B', icon: '⬜' },
  { name: 'BRONZE',    min: 500,   color: '#CD7F32', icon: '🟫' },
  { name: 'SILVER',    min: 1200,  color: '#C0C0C0', icon: '🩶' },
  { name: 'GOLD',      min: 2500,  color: '#FFD700', icon: '🟡' },
  { name: 'PLATINUM',  min: 5000,  color: '#00C4B4', icon: '💠' },
  { name: 'DIAMOND',   min: 9000,  color: '#88CCFF', icon: '💎' },
  { name: 'ASCENDANT', min: 15000, color: '#44FF99', icon: '🌿' },
  { name: 'IMMORTAL',  min: 24000, color: '#FF4655', icon: '🔥' },
  { name: 'RADIANT',   min: 40000, color: '#FFD700', icon: '✨' },
];

const KANBAN_COLS = [
  { id: 'pending_approval', label: 'AGUARDANDO', color: '#F5C518' },
  { id: 'active',           label: 'A FAZER',    color: '#00C4B4' },
  { id: 'in_progress',      label: 'EM PROGRESSO', color: '#FF8C42' },
  { id: 'done',             label: 'CONCLUÍDO',  color: '#44FF99' },
];

const PL = { low: 'BAIXA', medium: 'MÉDIA', high: 'ALTA', critical: 'CRÍTICA' };
const SL = { active: 'A FAZER', in_progress: 'EM PROGRESSO', done: 'CONCLUÍDA', pending_approval: 'AGUARDANDO', rejected: 'REJEITADA' };
const LI = { register: '👤', task_create: '➕', task_pending: '⏳', task_approve: '✅', task_reject: '❌', task_start: '▶️', task_done: '🏆', task_delete: '🗑️', xp_penalty: '📉', cargo_update: '✏️', project_create: '📁', project_update: '✏️' };

// Action Plan constants
const AP_STATUS_LABEL = { pending_approval: 'AGUARDANDO', identified: 'IDENTIFICADO', analyzing: 'EM ANÁLISE', executing: 'EM EXECUÇÃO', resolved: 'RESOLVIDO', monitoring: 'MONITORANDO', rejected: 'REJEITADO' };
const AP_SEV_LABEL    = { critical: 'CRÍTICO', moderate: 'MODERADO', low: 'LEVE' };
const AP_PRIO_LABEL   = { critical: 'CRÍTICA', high: 'ALTA', medium: 'MÉDIA', low: 'BAIXA' };

const LOG_META = {
  register:       { icon: '🆕', color: 'var(--cyan)',   cat: 'acesso'  },
  login:          { icon: '🔑', color: 'var(--green)',  cat: 'acesso'  },
  logout:         { icon: '🚪', color: 'var(--dim)',    cat: 'acesso'  },
  task_create:    { icon: '➕', color: 'var(--green)',  cat: 'task'    },
  task_pending:   { icon: '⏳', color: '#F5C518',       cat: 'task'    },
  task_approve:   { icon: '✅', color: 'var(--green)',  cat: 'task'    },
  task_reject:    { icon: '❌', color: 'var(--red)',    cat: 'task'    },
  task_start:     { icon: '▶️', color: 'var(--cyan)',   cat: 'task'    },
  task_done:      { icon: '🏆', color: 'var(--gold)',   cat: 'task'    },
  task_delete:    { icon: '🗑️', color: 'var(--red)',    cat: 'task'    },
  xp_penalty:     { icon: '📉', color: 'var(--red)',    cat: 'xp'      },
  cargo_update:   { icon: '✏️', color: 'var(--cyan)',   cat: 'member'  },
  project_create: { icon: '📁', color: 'var(--cyan)',   cat: 'project' },
  project_update: { icon: '✏️', color: '#F5C518',       cat: 'project' },
  patch_note:     { icon: '📰', color: 'var(--cyan)',   cat: 'system'  },
};
