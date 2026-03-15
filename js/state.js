// ══════════════════════════════════════════════
//  STATE.JS — Estado global e helpers
// ══════════════════════════════════════════════

// Firebase instances
let db, auth;

// User state
let me = null, meData = null;

// Data arrays
let tasks = [], users = [], projects = [];

// View state
let curView = 'dashboard';
let myFV = 'all', allFV = 'all', histFV = 'all';
let kanbanProjFV = 'all', globalProjFV = 'all';
let tagFV = [], projFV = 'active';

// Modal state
let selTask = null, rejTask = null, cargoUID = null;
let editProjId = null, editingTaskId = null;
let dragTask = null;

// Activity
let actLimit = 50;

// ── Helpers básicos ──────────────────────────
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const showModal = id => $(id).classList.remove('hidden');
const closeModal = id => $(id).classList.add('hidden');

const rank    = xp => { let r = RANKS[0]; for (const x of RANKS) if (xp >= x.min) r = x; return r; };
const nextRank = xp => { for (let i = 0; i < RANKS.length - 1; i++) if (xp < RANKS[i + 1].min) return RANKS[i + 1]; return null; };
const xpPct   = xp => { const r = rank(xp), n = nextRank(xp); if (!n) return 100; return Math.round(((xp - r.min) / (n.min - r.min)) * 100); };

const fmtDate = d => { if (!d) return '—'; return d instanceof Date ? d.toLocaleDateString('pt-BR') : fmtDate(new Date(d)); };
const fmtTime = ts => {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts), diff = Date.now() - d;
  if (diff < 60e3)   return 'Agora mesmo';
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)}min atrás`;
  if (diff < 86400e3) return `${Math.floor(diff / 3600e3)}h atrás`;
  return d.toLocaleDateString('pt-BR');
};

const isOverdue = t => {
  if (!t.deadline || ['done', 'rejected'].includes(t.status)) return false;
  const dl = t.deadline?.toDate ? t.deadline.toDate() : new Date(t.deadline);
  return dl < new Date();
};

const toast = (msg, ok = true) => {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show' + (ok ? ' ok' : '');
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className = ''; }, 3500);
};

const projColor = id => { const p = projects.find(x => x.id === id); return p?.color || 'var(--dim)'; };
const projName  = id => { const p = projects.find(x => x.id === id); return p?.name || '—'; };
