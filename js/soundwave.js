// ══════════════════════════════════════════════
//  SOUNDWAVE.JS — Música ambiente + animação
// ══════════════════════════════════════════════

const soundSystem = {
  enabled: false,
  audio: null,
  volume: 0.25,
  src: null,
};

// ── Inicializa com a URL da música ───────────
// fromClick = true  → boot veio de clique manual de login, toca direto
// fromClick = false → sessão restaurada automaticamente, aguarda primeiro clique
function initSound(src, fromClick = false) {
  soundSystem.src = src;
  soundSystem.audio = new Audio(src);
  soundSystem.audio.loop = true;
  soundSystem.audio.volume = soundSystem.volume;

  const saved = localStorage.getItem('fs_sound');

  // Usuário desligou manualmente — respeita e não toca
  if (saved === 'off') return;

  // Veio de clique direto — navegador aceita play() imediatamente
  if (fromClick) {
    _startSound();
    return;
  }

  // Sessão restaurada — tenta tocar direto.
  // O navegador geralmente permite pois o usuário já interagiu com o site antes.
  // Se bloquear, o .catch() do _startSound captura silenciosamente
  // e o listener de clique serve de fallback.
  document.addEventListener('click', () => {
    if (!soundSystem.enabled) _startSound();
  }, { once: true });

  _startSound();
}

// ── Start ────────────────────────────────────
function _startSound() {
  if (!soundSystem.audio) return;

  // Seguro contra browsers que suspendem o loop após longo período
  soundSystem.audio.addEventListener('ended', () => {
    if (soundSystem.enabled) {
      soundSystem.audio.currentTime = 0;
      soundSystem.audio.play().catch(() => {});
    }
  });

  // Detecta suspensão involuntária do browser (ex: economia de energia)
  // Se o usuário pausou manualmente, enabled já é false — ignora
  soundSystem.audio.addEventListener('pause', () => {
    if (soundSystem.enabled) {
      // O browser pausou sem o usuário pedir — tenta retomar
      soundSystem.audio.play().catch(() => {
        // Se não conseguir retomar, sincroniza a animação com a realidade
        soundSystem.enabled = false;
        _updateSoundBtn();
      });
    }
  });

  soundSystem.audio.play()
    .then(() => {
      soundSystem.enabled = true;
      localStorage.setItem('fs_sound', 'on');
      _updateSoundBtn();
    })
    .catch(() => {
      // autoplay bloqueado pelo navegador, vai aguardar clique
      soundSystem.enabled = false;
    });
}

// ── Toggle play/pause ────────────────────────
function toggleSound() {
  if (!soundSystem.audio) return;

  if (soundSystem.enabled) {
    soundSystem.audio.pause();
    soundSystem.enabled = false;
    localStorage.setItem('fs_sound', 'off');
  } else {
    soundSystem.audio.play().then(() => {
      soundSystem.enabled = true;
      localStorage.setItem('fs_sound', 'on');
    });
  }

  _updateSoundBtn();
}

// ── Atualiza botão ───────────────────────────
function _updateSoundBtn() {
  const btn = document.getElementById('soundToggle');
  if (!btn) return;

  btn.title = soundSystem.enabled ? 'Pausar música' : 'Tocar música';
}

// ── Canvas animation ─────────────────────────
(function initSoundWave() {
  const canvas = document.getElementById('soundWaveCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = 32, H = 16;
  const cy = Math.floor(H / 2);
  let amp = 0;
  const startTime = Date.now();

  function draw() {
    const target = soundSystem.enabled ? 1 : 0;
    amp += (target - amp) * 0.08;

    ctx.clearRect(0, 0, W, H);
    const t = (Date.now() - startTime) / 1000;

    if (!soundSystem.enabled && amp < 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.fillRect(0, cy, W, 1);
    } else {
      ctx.fillStyle = soundSystem.enabled ? '#FF4655' : 'rgba(255,255,255,.5)';
      for (let i = 0; i < W; i++) {
        const x = i - W / 2;
        const e = Math.exp((-x * x) / 50);
        const y = cy + Math.cos(x * 0.4 - t * 8) * e * H * 0.35 * amp;
        ctx.fillRect(i, Math.round(y), 1, 2);
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();