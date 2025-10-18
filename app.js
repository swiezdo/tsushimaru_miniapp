(function () {
  const tg = window.Telegram?.WebApp;

  // ===== Тема из Telegram =====
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

  const out = {
    real_name:  document.getElementById('v_real_name'),
    psn:        document.getElementById('v_psn'),
    platform:   document.getElementById('v_platform'),
    modes:      document.getElementById('v_modes'),
    goals:      document.getElementById('v_goals'),
    difficulty: document.getElementById('v_difficulty'),
    trophies:   document.getElementById('v_trophies'),
  };

  // ===== Демо-данные (без бэка) =====
  const DEMO_DEFAULT = {
    real_name: 'Дмитрий',
    psn: 'swiezdo',
    platform: '🎮 PlayStation',
    modes: ['🏹 Выживание', '🗻 Испытания Иё'],
    goals: ['🏆 Получение трофеев'],
    // difficulty — фиксировано визуально, как просил
    // trophies   — фиксировано визуально, как просил
  };

  function isTelegram() { return !!tg && !!tg.initDataUnsafe; }

  function getDemoProfile() {
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

  // helpers
  const getMultiValues = (sel) => Array.from(sel.options).filter(o => o.selected).map(o => o.value);
  const setMultiValues = (sel, values) => {
    const set = new Set(values || []);
    Array.from(sel.options).forEach(o => o.selected = set.has(o.value));
  };
  const listToPretty = (arr) => (arr && arr.length) ? arr.join(', ') : '—';

  function renderProfile(p) {
    out.real_name.textContent = p.real_name || '—';
    out.psn.textContent       = p.psn || '—';
    out.platform.textContent  = p.platform || '—';
    out.modes.textContent     = listToPretty(p.modes);
    out.goals.textContent     = listToPretty(p.goals);

    // difficulty и trophies фиксированы (по ТЗ)
    out.difficulty.innerHTML = '👻 Кошмар<br/>🔥 HellMode';
    out.trophies.innerHTML   = 'Легенда Цусимы 🗡<br/>Легенда Эдзо 🏔';
  }

  function fillForm(p) {
    form.real_name.value = p.real_name || '';
    form.psn.value       = p.psn || '';
    form.platform.value  = p.platform || '';
    setMultiValues(form.modes, p.modes || []);
    setMultiValues(form.goals, p.goals || []);
  }

  // ===== Инициализация =====
  function init() {
    if (isTelegram()) {
      applyThemeFromTelegram();
      tg.onEvent?.('themeChanged', applyThemeFromTelegram);
      const me = tg.initDataUnsafe?.user;
      userChip.textContent = (me?.first_name || '') + (me?.last_name ? ' ' + me.last_name : '') || `@${me?.username || me?.id || 'user'}`;
      tg.ready?.();
      tg.expand?.();
    } else {
      userChip.textContent = 'Демо-режим';
    }

    const profile = getDemoProfile();
    renderProfile(profile);
    fillForm(profile);

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const payload = {
        real_name: form.real_name.value.trim(),
        psn: form.psn.value.trim(),
        platform: form.platform.value,
        modes: getMultiValues(form.modes),
        goals: getMultiValues(form.goals),
      };
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
