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
  { id: 'pending_approval', label: 'AGUARDANDO',   color: '#F5C518' },
  { id: 'active',           label: 'A FAZER',      color: '#00C4B4' },
  { id: 'in_progress',      label: 'EM PROGRESSO', color: '#FF8C42' },
  { id: 'done',             label: 'CONCLUÍDO',    color: '#44FF99' },
  { id: 'finalized',        label: 'FINALIZADO',   color: '#CC88FF' },
];

const PL = { low: 'BAIXA', medium: 'MÉDIA', high: 'ALTA', critical: 'CRÍTICA' };
const SL = { active: 'A FAZER', in_progress: 'EM PROGRESSO', done: 'CONCLUÍDA', pending_approval: 'AGUARDANDO', rejected: 'REJEITADA', finalized: 'FINALIZADA' };
const LI = { register: '👤', task_create: '➕', task_pending: '⏳', task_approve: '✅', task_reject: '❌', task_start: '▶️', task_done: '🏆', task_delete: '🗑️', xp_penalty: '📉', cargo_update: '✏️', project_create: '📁', project_update: '✏️' };

// Action Plan constants
const AP_STATUS_LABEL = { pending_approval: 'AGUARDANDO', identified: 'IDENTIFICADO', analyzing: 'EM ANÁLISE', executing: 'EM EXECUÇÃO', resolved: 'RESOLVIDO', monitoring: 'MONITORANDO', rejected: 'REJEITADO' };
const AP_SEV_LABEL    = { critical: 'CRÍTICO', moderate: 'MODERADO', low: 'LEVE' };
const AP_PRIO_LABEL   = { critical: 'CRÍTICA', high: 'ALTA', medium: 'MÉDIA', low: 'BAIXA' };

// ── EmailJS ──────────────────────────────────
const EMAILJS_SERVICE_ID = 'service_v5m774r';
const EMAILJS_PUBLIC_KEY = 'hXXhnJQSBGrG1zVp8';

// SVG paths para ícones do log
const LOG_SVG = {
  register:       '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  login:          '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  logout:         '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  task_create:    '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  task_pending:   '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  task_approve:   '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  task_reject:    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  task_start:     '<polygon points="5 3 19 12 5 21 5 3"/>',
  task_done:      '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',
  task_delete:    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
  task_update:    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  xp_penalty:     '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
  cargo_update:   '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  project_create: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  project_update: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
  patch_note:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
};

const LOG_META = {
  register:       { color: 'var(--cyan)',   cat: 'acesso'  },
  login:          { color: 'var(--green)',  cat: 'acesso'  },
  logout:         { color: 'var(--dim)',    cat: 'acesso'  },
  task_create:    { color: 'var(--green)',  cat: 'task'    },
  task_pending:   { color: '#F5C518',       cat: 'task'    },
  task_approve:   { color: 'var(--green)',  cat: 'task'    },
  task_reject:    { color: 'var(--red)',    cat: 'task'    },
  task_start:     { color: 'var(--cyan)',   cat: 'task'    },
  task_done:      { color: 'var(--gold)',   cat: 'task'    },
  task_delete:    { color: 'var(--red)',    cat: 'task'    },
  xp_penalty:     { color: 'var(--red)',    cat: 'xp'      },
  cargo_update:   { color: 'var(--cyan)',   cat: 'member'  },
  project_create: { color: 'var(--cyan)',   cat: 'project' },
  project_update: { color: '#F5C518',       cat: 'project' },
  patch_note:     { color: 'var(--cyan)',   cat: 'system'  },
  task_update:    { color: '#F5C518',       cat: 'task'    },
  task_finalize:  { color: '#CC88FF',       cat: 'task'    },
  task_archive:   { color: 'var(--dim)',     cat: 'task'    },
};
