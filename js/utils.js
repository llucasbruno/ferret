// ══════════════════════════════════════════════
//  UTILS.JS — Utilitários e sanitização
// ══════════════════════════════════════════════

// ── Sanitização XSS ──────────────────────────
// Escapa caracteres HTML perigosos em qualquer string
// vinda do usuário antes de inserir via innerHTML.
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// ── Toggle visibilidade de senha ──────────────
function togglePassVis(inputId, btn) {
  const input = $(inputId); if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const eyeOn  = btn.querySelector('.eye-icon');
  const eyeOff = btn.querySelector('.eye-off-icon');
  if (eyeOn)  eyeOn.style.display  = isPass ? 'none'  : '';
  if (eyeOff) eyeOff.style.display = isPass ? ''      : 'none';
}
