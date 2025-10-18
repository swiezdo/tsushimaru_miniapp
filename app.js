(function(){
  const tg = window.Telegram?.WebApp;

  // ===== UI refs
  const userChip = document.getElementById('userChip');
  const form = document.getElementById('profileForm');
  const resetBtn = document.getElementById('resetBtn');

  const out = {
    real_name: document.getElementById('v_real_name'),
    psn:       document.getElementById('v_psn'),
    platform:  document.getElementById('v_platform'),
    modes:     document.getElementById('v_modes'),
    goals:     document.getElementById('v_goals'),
    difficulty:document.getElementById('v_difficulty'),
    trophies:  document.getElementById('v_trophies'),
  };

  // ===== Demo store
  const STORAGE_KEY = 'demo_profile_v2';
  const DEFAULTS = {
    real_name: 'Дмитрий',
    psn: 'swiezdo',
    platform: '🎮 PlayStation',
    modes: ['🏹 Выживание','🗻 Испытания Иё'],
    goals: ['🏆 Получение трофеев'],
  };

  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { ...DEFAULTS }; }
    catch { return { ...DEFAULTS }; }
  };
  const save = (p) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  };

  // ===== Helpers
  const getChecked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(c => c.value);
  const setChecked = (name, values=[]) => {
    const set = new Set(values);
    document.querySelectorAll(`input[name="${name}"]`).forEach(c => c.checked = set.has(c.value));
  };
  const list = (arr) => (arr && arr.length) ? arr.join(', ') : '—';

  const render = (p) => {
    out.real_name.textContent = p.real_name || '—';
    out.psn.textContent       = p.psn || '—';
    out.platform.textContent  = p.platform || '—';
    out.modes.textContent     = list(p.modes);
    out.goals.textContent     = list(p.goals);
    out.difficulty.innerHTML  = '👻 Кошмар<br>🔥 HellMode';
    out.trophies.innerHTML    = 'Легенда Цусимы 🗡<br>Легенда Эдзо 🏔';
  };

  const fillForm = (p) => {
    form.real_name.value = p.real_name || '';
    form.psn.value       = p.psn || '';
    form.platform.value  = p.platform || '';
    setChecked('modes', p.modes);
    setChecked('goals', p.goals);
  };

  // ===== Init
  const init = () => {
    if (tg?.initDataUnsafe) {
      tg.ready?.(); tg.expand?.();
      const me = tg.initDataUnsafe.user;
      userChip.textContent = (me?.first_name || '') || (me?.username ? '@'+me.username : 'Пользователь');
    } else {
      userChip.textContent = 'Демо';
    }

    const profile = load();
    render(profile);
    fillForm(profile);

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // собираем строго из полей и чекбоксов
      const updated = {
        real_name: form.real_name.value.trim(),
        psn:       form.psn.value.trim(),
        platform:  form.platform.value,
        modes:     getChecked('modes'),
        goals:     getChecked('goals'),
      };

      // сохраняем и обновляем профиль
      save(updated);
      render(updated);
      // поля уже содержат введённое — оставляем как есть
      tg?.HapticFeedback?.notificationOccurred?.('success');
    });

    resetBtn.addEventListener('click', () => {
      save({ ...DEFAULTS });
      render(DEFAULTS);
      fillForm(DEFAULTS);
      tg?.HapticFeedback?.impactOccurred?.('light');
    });
  };

  init();
})();
