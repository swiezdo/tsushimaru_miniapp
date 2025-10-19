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
function hapticSuccess() {
  try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {}
}
function hapticError() {
  try { tg?.HapticFeedback?.notificationOccurred('error'); } catch {}
}
function hapticTap() {
  try { tg?.HapticFeedback?.impactOccurred('light'); } catch {}
}

// Screens
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

// Elements
const openProfileBtn = document.getElementById('openProfileBtn');
const trophiesBtn = document.getElementById('trophiesBtn');
const builderBtn = document.getElementById('builderBtn');
const homeBtn = document.getElementById('homeBtn');
const trophiesHomeBtn = document.getElementById('trophiesHomeBtn');
const backToListBtn = document.getElementById('backToListBtn');

const trophyListEl = document.getElementById('trophyList');
const trophyTitleEl = document.getElementById('trophyTitle');
const trophyDescEl = document.getElementById('trophyDesc');
const proofForm = document.getElementById('proofForm');
const proofFiles = document.getElementById('proofFiles');
const commentText = document.getElementById('commentText');

// Dummy profile (можно связать с бэком позже)
const v_real_name = document.getElementById('v_real_name');
const v_psn = document.getElementById('v_psn');
const v_platform = document.getElementById('v_platform');
const v_modes = document.getElementById('v_modes');
const v_goals = document.getElementById('v_goals');
const v_difficulty = document.getElementById('v_difficulty');

const profileForm = document.getElementById('profileForm');
const resetBtn = document.getElementById('resetBtn');

const userChip = document.getElementById('userChip');

// Simple state
let TROPHIES = [];
let currentTrophy = null;

// Load trophies.json
async function loadTrophies() {
  try {
    const res = await fetch('./trophies.json', { cache: 'no-store' });
    TROPHIES = await res.json();
    renderTrophyList();
  } catch (e) {
    console.error('trophies.json load error', e);
  }
}

function renderTrophyList() {
  trophyListEl.innerHTML = '';
  TROPHIES.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'list-btn';
    btn.innerHTML = `<span>${t.emoji || '🏆'} ${t.name}</span><span class="right">›</span>`;
    btn.addEventListener('click', () => {
      openTrophyDetail(t);
    });
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

// Submit proof (demo)
async function handleSubmitProof() {
  // Сбор данных
  const files = proofFiles?.files || [];
  const comment = (commentText?.value || '').trim();

  if (files.length === 0 && !comment) {
    (tg?.showPopup ? tg.showPopup({ title: 'Нужно приложить доказательство', message: 'Добавьте файл и/или комментарий.', buttons: [{type:'ok'}] }) : alert('Добавьте файл и/или комментарий.'));
    hapticError();
    return;
  }

  // Здесь будет загрузка на бэкенд
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

  // Возврат к списку
  showScreen('trophies');
}

// Bind MainButton / BackButton for Telegram
if (tg) {
  tg.onEvent('mainButtonClicked', () => {
    // submit proof
    handleSubmitProof();
  });

  tg.onEvent('backButtonClicked', () => {
    // back to list
    showScreen('trophies');
  });
}

// Fallback button (browser)
const sendProofBtn = document.getElementById('sendProofBtn');
sendProofBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  handleSubmitProof();
});

// Nav
openProfileBtn.addEventListener('click', () => showScreen('profile'));
trophiesBtn.addEventListener('click', () => showScreen('trophies'));
homeBtn.addEventListener('click', () => showScreen('home'));
trophiesHomeBtn.addEventListener('click', () => showScreen('home'));
backToListBtn.addEventListener('click', () => showScreen('trophies'));

// Dummy profile form
profileForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(profileForm);
  const name = (form.get('real_name') || '').toString().trim() || '—';
  const psn = (form.get('psn') || '').toString().trim() || '—';

  v_real_name.textContent = name;
  v_psn.textContent = psn;

  if (tg?.showPopup) {
    tg.showPopup({ title: 'Профиль обновлён', message: 'Данные сохранены.', buttons: [{type:'ok'}] });
    try { tg.HapticFeedback.impactOccurred('medium'); } catch {}
  }
  // Скролл вверх, как просили ранее
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

resetBtn?.addEventListener('click', () => {
  profileForm.reset();
  if (tg?.showPopup) tg.showPopup({ title: 'Сброс', message: 'Все поля очищены.', buttons: [{type:'ok'}] });
});

// Set username in chip if available from Telegram initDataUnsafe
(function setUserChip() {
  const uname = tg?.initDataUnsafe?.user?.username;
  if (uname) userChip.textContent = '@' + uname;
})();

// Start
showScreen('home');
loadTrophies();
