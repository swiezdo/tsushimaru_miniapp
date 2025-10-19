// ============ Telegram Mini App boot ============
const tg = window.Telegram?.WebApp || null;

function initTelegramUI() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();

    // Тема из Telegram
    const theme = tg.themeParams || {};
    const cssVars = {
      '--tg-bg': theme.bg_color,
      '--tg-tx': theme.text_color,
      '--tg-hint': theme.hint_color,
    };
    Object.entries(cssVars).forEach(([k, v]) => {
      if (v) document.documentElement.style.setProperty(k, v);
    });
  } catch (e) {
    console.warn('TG init skipped:', e);
  }
}
initTelegramUI();

// Haptics helpers
function hapticSuccess() { try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {} }
function hapticError()   { try { tg?.HapticFeedback?.notificationOccurred('error'); } catch {} }
function hapticTap()     { try { tg?.HapticFeedback?.impactOccurred('light'); } catch {} }

// ====== DOM ======
const screens = {
  home: document.getElementById('homeScreen'),
  profile: document.getElementById('profileScreen'),
  trophies: document.getElementById('trophiesScreen'),
  trophyDetail: document.getElementById('trophyDetailScreen'),
};

function showScreen(name) {
  Object.values(screens).forEach(el => el.classList.add('hidden'));
  screens[name].classList.remove('hidden');

  // Кнопки Telegram
  if (tg) {
    if (name === 'trophyDetail') {
      tg.MainButton.setParams({ text: 'Отправить', is_active: true, is_visible: true });
      tg.MainButton.show();
      tg.BackButton.show();
    } else {
      tg.MainButton.hide();
      tg.BackButton.hide();
    }
  }
}

const openProfileBtn  = document.getElementById('openProfileBtn');
const trophiesBtn     = document.getElementById('trophiesBtn');
const homeBtn         = document.getElementById('homeBtn');
const trophiesHomeBtn = document.getElementById('trophiesHomeBtn');
const backToListBtn   = document.getElementById('backToListBtn');

const trophyListEl    = document.getElementById('trophyList');
const trophyTitleEl   = document.getElementById('trophyTitle');
const trophyDescEl    = document.getElementById('trophyDesc');
const proofForm       = document.getElementById('proofForm');
const proofFiles      = document.getElementById('proofFiles');
const commentText     = document.getElementById('commentText');

const profileForm     = document.getElementById('profileForm');
const resetBtn        = document.getElementById('resetBtn');

const userChip        = document.getElementById('userChip');

// Выводимые поля профиля
const v_real_name  = document.getElementById('v_real_name');
const v_psn        = document.getElementById('v_psn');
const v_platform   = document.getElementById('v_platform');
const v_modes      = document.getElementById('v_modes');
const v_goals      = document.getElementById('v_goals');
const v_difficulty = document.getElementById('v_difficulty');

// Контейнеры чипов
const platformChipsEl  = document.getElementById('platformChips');
const modesChipsEl     = document.getElementById('modesChips');
const goalsChipsEl     = document.getElementById('goalsChips');
const difficultyChipsEl= document.getElementById('difficultyChips');

// ====== ЧИПЫ: данные и состояние ======
const PLATFORMS = [
  { key: 'ps5', label: 'PS5', emoji: '🎮' },
  { key: 'ps4', label: 'PS4', emoji: '🎮' },
  { key: 'pc',  label: 'PC',  emoji: '🖥️' },
];

const MODES = [
  { key: 'story', label: 'Сюжет', emoji: '📖' },
  { key: 'legends', label: 'Легенды', emoji: '👻' },
  { key: 'raid', label: 'Рейд', emoji: '🏯' },
  { key: 'survival', label: 'Выживание', emoji: '🌊' },
];

const GOALS = [
  { key: 'platinum', label: 'Платина', emoji: '🏆' },
  { key: 'weekly', label: 'Еженедельки', emoji: '📅' },
  { key: 'farm', label: 'Фарм', emoji: '⛏️' },
  { key: 'cosmetics', label: 'Косметика', emoji: '🎭' },
];

const DIFFICULTY = [
  { key: 'bronze',  label: '🥉 Бронза' },
  { key: 'silver',  label: '🥈 Серебро' },
  { key: 'gold',    label: '🥇 Золото' },
  { key: 'plat',    label: '🏅 Платина' },
  { key: 'nightmare', label: '👻 Кошмар' },
  { key: 'hell',    label: '🔥 HellMode' },
];

// множества выбранных значений
const sel = {
  platforms: new Set(),
  modes: new Set(),
  goals: new Set(),
  difficulty: new Set(), // оставляем мультивыбор, как вы просили ранее
};

// универсальный рендер чипов
function renderChips(container, options, stateSet, onChange) {
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-btn';
    btn.dataset.key = opt.key;
    btn.innerHTML = `${opt.emoji ? opt.emoji + ' ' : ''}${opt.label}`;
    if (stateSet.has(opt.key)) btn.classList.add('active');

    btn.addEventListener('click', () => {
      if (stateSet.has(opt.key)) stateSet.delete(opt.key);
      else stateSet.add(opt.key);
      btn.classList.toggle('active');
      onChange?.();
      hapticTap();
    });

    container.appendChild(btn);
  });
}

// формирует красивый текст из набора ключей
function prettyList(options, stateSet) {
  const map = new Map(options.map(o => [o.key, (o.emoji ? o.emoji + ' ' : '') + o.label]));
  const arr = [...stateSet].map(k => map.get(k)).filter(Boolean);
  return arr.length ? arr.join('\n') : '—';
}

// обновление видимых значений профиля
function refreshProfileView() {
  v_platform.textContent   = prettyList(PLATFORMS, sel.platforms);
  v_modes.textContent      = prettyList(MODES, sel.modes);
  v_goals.textContent      = prettyList(GOALS, sel.goals);
  v_difficulty.textContent = prettyList(DIFFICULTY, sel.difficulty);
}

// ====== ТРОФЕИ ======
let TROPHIES = [];
let currentTrophy = null;

// на случай, если fetch не сработает (WebApp/подпапка/кэш и т.п.)
const TROPHIES_FALLBACK = [
  {
    key: 'legend_tsushima',
    name: 'Легенда Цусимы',
    emoji: '🗡',
    desc: [
      'Завершите ключевые испытания режима «Легенды».',
      'Предоставьте скриншоты/видео с результатами.',
    ],
  },
  {
    key: 'legend_edzo',
    name: 'Легенда Эдзо',
    emoji: '🏔',
    desc: [
      'Пройдите дополнительные испытания Эдзо.',
      'Приложите доказательства (скриншоты/видео).',
    ],
  },
];

async function loadTrophies() {
  // Путь берём относительный к текущему index.html
  const url = new URL('./trophies.json', window.location.href).toString();
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty trophies');
    TROPHIES = data;
  } catch (e) {
    console.warn('trophies.json load error, using fallback:', e);
    TROPHIES = TROPHIES_FALLBACK;
  }
  renderTrophyList();
}

function renderTrophyList() {
  trophyListEl.innerHTML = '';
  TROPHIES.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'list-btn';
    btn.innerHTML = `<span>${t.emoji || '🏆'} ${t.name}</span><span class="right">›</span>`;
    btn.addEventListener('click', () => openTrophyDetail(t));
    trophyListEl.appendChild(btn);
  });
}

function openTrophyDetail(trophy) {
  currentTrophy = trophy;
  trophyTitleEl.textContent = `${trophy.emoji || '🏆'} ${trophy.name}`;
  trophyDescEl.innerHTML = '';
  (trophy.desc || []).forEach(line => {
    const li = document.createElement('li');
    li.textContent = line;
    trophyDescEl.appendChild(li);
  });

  // очистить форму при открытии
  proofForm.reset();
  showScreen('trophyDetail');
  hapticTap();
}

// ====== ОТПРАВКА ЗАЯВКИ ======
async function handleSubmitProof() {
  const files = proofFiles?.files || [];
  const comment = (commentText?.value || '').trim();

  if (files.length === 0 && !comment) {
    (tg?.showPopup
      ? tg.showPopup({ title: 'Нужно приложить доказательство', message: 'Добавьте файл и/или комментарий.', buttons: [{type:'ok'}] })
      : alert('Добавьте файл и/или комментарий.')
    );
    hapticError();
    return;
  }

  // Здесь будет реальный аплоад на бэкенд:
  // const formData = new FormData();
  // formData.append('trophy_key', currentTrophy.key);
  // for (const f of files) formData.append('files', f);
  // formData.append('comment', comment);
  // await fetch('/api/proof', { method:'POST', body: formData });

  hapticSuccess();
  if (tg?.showPopup) {
    tg.showPopup({
      title: 'Заявка отправлена',
      message: 'Спасибо! Модераторы рассмотрят вашу заявку.',
      buttons: [{ type: 'ok' }]
    });
  } else {
    alert('Заявка отправлена (демо).');
  }

  showScreen('trophies');
}

// ====== Telegram MainButton / BackButton ======
if (tg) {
  tg.onEvent('mainButtonClicked', () => handleSubmitProof());
  tg.onEvent('backButtonClicked', () => showScreen('trophies'));
}

// Fallback кнопка для браузера (которую скрываем в Telegram CSS)
document.getElementById('sendProofBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  handleSubmitProof();
});

// ====== Навигация ======
openProfileBtn.addEventListener('click', () => showScreen('profile'));
trophiesBtn.addEventListener('click', () => showScreen('trophies'));
homeBtn.addEventListener('click', () => showScreen('home'));
trophiesHomeBtn.addEventListener('click', () => showScreen('home'));
backToListBtn.addEventListener('click', () => showScreen('trophies'));

// ====== Профиль ======
profileForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(profileForm);
  const name = (form.get('real_name') || '').toString().trim() || '—';
  const psn  = (form.get('psn') || '').toString().trim() || '—';

  v_real_name.textContent = name;
  v_psn.textContent = psn;

  // Можно тут же сохранить в localStorage при желании
  // localStorage.setItem('profile', JSON.stringify({name, psn, sel}));

  if (tg?.showPopup) {
    tg.showPopup({ title: 'Профиль обновлён', message: 'Данные сохранены.', buttons: [{type:'ok'}] });
    try { tg.HapticFeedback.impactOccurred('medium'); } catch {}
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

resetBtn?.addEventListener('click', () => {
  profileForm.reset();
  sel.platforms.clear();
  sel.modes.clear();
  sel.goals.clear();
  sel.difficulty.clear();
  renderAllChips();
  refreshProfileView();
  if (tg?.showPopup) tg.showPopup({ title: 'Сброс', message: 'Все поля очищены.', buttons: [{type:'ok'}] });
});

// Вывести ник из Telegram, если есть
(function setUserChip() {
  const uname = tg?.initDataUnsafe?.user?.username;
  if (uname) userChip.textContent = '@' + uname;
})();

// ====== РЕНДЕР ВСЕХ ЧИПОВ И СТАРТ ======
function renderAllChips() {
  renderChips(platformChipsEl, PLATFORMS, sel.platforms, refreshProfileView);
  renderChips(modesChipsEl, MODES, sel.modes, refreshProfileView);
  renderChips(goalsChipsEl, GOALS, sel.goals, refreshProfileView);
  renderChips(difficultyChipsEl, DIFFICULTY, sel.difficulty, refreshProfileView);
}
renderAllChips();
refreshProfileView();

showScreen('home');
loadTrophies();
