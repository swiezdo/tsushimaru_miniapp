(function () {
  const tg = window.Telegram?.WebApp;

  // ===== Тема из Telegram (или демо в браузере) =====
  function hexA(hex, alpha) {
    if (!hex || !/^#([0-9a-f]{6})$/i.test(hex)) return null;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyThemeFromTelegram() {
    const tp = tg?.themeParams || {};
    const map = {
      '--bg'    : tp.bg_color,
      '--fg'    : tp.text_color,
      '--muted' : tp.hint_color,
      '--card'  : tp.secondary_bg_color ? hexA(tp.secondary_bg_color, 0.85) : null,
      '--accent': tp.button_color,
      '--stroke': tp.section_separator_color ? hexA(tp.section_separator_color, 0.3) : null,
    };
    for (const [k, v] of Object.entries(map)) if (v) document.documentElement.style.setProperty(k, v);
  }

  // ===== Элементы =====
  const userChip = document.getElementById('userChip');
  const form = document.getElementById('profileForm');
  const resetBtn = document.getElementById('resetBtn');

  // Поля отображения
  const out = {
    psn_id: document.getElementById('v_psn_id'),
    platform: document.getElementById('v_platform'),
    modes: document.getElementById('v_modes'),
    goals: document.getElementById('v_goals'),
    level: document.getElementById('v_level'),
    trophies: document.getElementById('v_trophies'),
    message_id: document.getElementById('v_message_id'),
    state: document.getElementById('v_state'),
  };

  // ===== Демо-режим =====
  const DEMO_DEFAULT = {
    psn_id: 'swiezdo',
    platform: 'PS5',
    modes: 'Legends, Story',
    goals: 'Рейды и платина',
    level: '120',
    trophies: 'Платина, Йотэй',
    message_id: '—',
    state: 'active',
  };

  function isTelegram() { return !!tg && !!tg.initDataUnsafe; }

  function getDemoProfile() {
    // возьмём из localStorage, чтобы при перезагрузке оставалось
    try {
      const raw = localStorage.getItem('demo_profile');
      return raw ? JSON.parse(raw) : { ...DEMO_DEFAULT };
    } catch (_) {
      return { ...DEMO_DEFAULT };
    }
  }

  function setDemoProfile(p) {
    try { localStorage.setItem('demo_profile', JSON.stringify(p)); } catch (_) {}
  }

  function renderProfile(p) {
    out.psn_id.textContent = p.psn_id || '—';
    out.platform.textContent = p.platform || '—';
    out.modes.textContent = p.modes || '—';
    out.goals.textContent = p.goals || '—';
    out.level.textContent = p.level || '—';
    out.trophies.textContent = p.trophies || '—';
    out.message_id.textContent = p.message_id ?? '—';
    out.state.textContent = p.state ?? '—';
  }

  function fillForm(p) {
    form.psn_id.value = p.psn_id || '';
    form.platform.value = p.platform || '';
    form.modes.value = p.modes || '';
    form.goals.value = p.goals || '';
    form.level.value = p.level || '';
    form.trophies.value = p.trophies || '';
  }

  // ===== Инициализация UI =====
  function init() {
    if (isTelegram()) {
      applyThemeFromTelegram();
      tg.onEvent?.('themeChanged', applyThemeFromTelegram);
      const me = tg.initDataUnsafe?.user;
      userChip.textContent = (me?.first_name || '') + (me?.last_name ? ' ' + me.last_name : '') || `@${me?.username || me?.id || 'user'}`;
      tg.ready?.();
      tg.expand?.();
    } else {
      // демо в браузере
      userChip.textContent = 'Демо-режим';
    }

    // данные для отображения
    const profile = getDemoProfile();
    renderProfile(profile);
    fillForm(profile);

    // обработчики
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      // В демо просто обновим профиль локально
      const updated = { ...getDemoProfile(), ...payload };
      setDemoProfile(updated);
      renderProfile(updated);

      if (isTelegram()) {
        tg.HapticFeedback?.notificationOccurred?.('success');
        tg.showPopup?.({ title: 'Сохранено', message: 'Данные обновлены (демо).' });
      } else {
        alert('Сохранено (демо)');
      }
    });

    resetBtn.addEventListener('click', () => {
      setDemoProfile({ ...DEMO_DEFAULT });
      renderProfile(DEMO_DEFAULT);
      fillForm(DEMO_DEFAULT);
      if (isTelegram()) {
        tg.HapticFeedback?.impactOccurred?.('light');
      }
    });
  }

  init();
})();
