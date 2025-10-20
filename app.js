// ---------------- Telegram WebApp init ----------------
const tg = window.Telegram?.WebApp || null;

(function initTG() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();

    const th = tg.themeParams || {};
    if (th.bg_color)   document.documentElement.style.setProperty('--tg-bg', th.bg_color);
    if (th.text_color) document.documentElement.style.setProperty('--tg-tx', th.text_color);
    if (th.hint_color) document.documentElement.style.setProperty('--tg-hint', th.hint_color);

    document.documentElement.classList.add('tg');
    tg.MainButton.hide();
  } catch (e) {}
})();

// ---------------- Haptics OFF (для всех наших кнопок; BackButton нативный — не трогаем)
function hapticOK()  {}
function hapticERR() {}
function hapticTap() {}

function $(id) { return document.getElementById(id); }
function scrollTopSmooth() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ---------------- Визуальные инклюды и отступы ----------------
const TOP_OFFSET_PX = 64; // запас под верхние элементы Telegram
function applyTopInset() {
  const root = document.querySelector('main.container');
  if (!root) return;
  root.style.paddingTop = `calc(env(safe-area-inset-top, 0px) + ${TOP_OFFSET_PX}px)`;
}
window.addEventListener('resize', applyTopInset);

// Подсветка при тапе — ОТКЛЮЧЕНА
function addTapHighlight(selector) {
  // Ничего не делаем: подсветка выключена глобально
}

// ---------------- Экранная навигация ----------------
const screens = {
  home:               $('homeScreen'),
  profile:            $('profileScreen'),
  trophies:           $('trophiesScreen'),
  trophyDetail:       $('trophyDetailScreen'),
  builds:             $('buildsScreen'),
  buildCreate:        $('buildCreateScreen'),
  buildDetail:        $('buildDetailScreen'),       // детали МОЕГО билда (с кнопками)
  buildPublicDetail:  $('buildPublicDetailScreen'), // детали ПУБЛИКАЦИИ (без кнопок)
};

function isVisible(name) {
  const el = screens[name];
  return el && !el.classList.contains('hidden');
}

function setTopbar(visible, title) {
  const tb = document.querySelector('.topbar');
  if (tb) tb.style.display = visible ? 'flex' : 'none';
  if (title) {
    const t = $('appTitle');
    if (t) t.textContent = title;
  }
}

function showScreen(name) {
  Object.values(screens).forEach((el) => el && el.classList.add('hidden'));
  const el = screens[name];
  if (el) el.classList.remove('hidden');

  if (tg) {
    if (['profile','trophies','builds','buildCreate','buildDetail','buildPublicDetail','trophyDetail'].includes(name)) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }

  if (name === 'home')                 setTopbar(false);
  else if (name === 'profile')         setTopbar(true, 'Профиль');
  else if (name === 'trophies')        setTopbar(true, 'Трофеи');
  else if (name === 'trophyDetail')    setTopbar(true, 'Трофеи');
  else if (name === 'builds')          setTopbar(true, 'Билды');
  else if (name === 'buildCreate')     setTopbar(true, 'Создать билд');
  else if (name === 'buildDetail')     setTopbar(true, 'Билд');
  else if (name === 'buildPublicDetail') setTopbar(true, 'Билд');

  scrollTopSmooth();
}

// Header user chip
(function () {
  const chip = $('userChip');
  const uname = tg?.initDataUnsafe?.user?.username;
  if (chip && uname) chip.textContent = '@' + uname;
})();

// ---------------- Чипы (профиль) ----------------
const PLATFORM   = ['🎮 PlayStation','💻 ПК'];
const MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
const GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
const DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

function renderChips(container, values, { single = false, onChange } = {}) {
  if (!container) return;
  container.innerHTML = '';
  values.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-btn';
    b.textContent = v;
    b.dataset.value = v;
    b.addEventListener('click', () => {
      if (single) {
        container.querySelectorAll('.chip-btn').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      } else {
        b.classList.toggle('active');
      }
      hapticTap();
      onChange?.();
    });
    container.appendChild(b);
  });
}

function activeValues(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('.chip-btn.active')).map((b) => b.dataset.value);
}
function setActive(container, arr) {
  if (!container) return;
  const set = new Set(arr || []);
  container.querySelectorAll('.chip-btn').forEach((b) => {
    b.classList.toggle('active', set.has(b.dataset.value));
  });
}

// ---------------- Профиль: отображение ----------------
const v_real_name  = $('v_real_name');
const v_psn        = $('v_psn');
const v_platform   = $('v_platform');
const v_modes      = $('v_modes');
const v_goals      = $('v_goals');
const v_difficulty = $('v_difficulty');

function prettyLines(arr) { return (arr && arr.length) ? arr.join('\n') : '—'; }
function refreshProfileView() {
  if (v_platform)   v_platform.textContent   = prettyLines(activeValues($('platformChips')));
  if (v_modes)      v_modes.textContent      = prettyLines(activeValues($('modesChips')));
  if (v_goals)      v_goals.textContent      = prettyLines(activeValues($('goalsChips')));
  if (v_difficulty) v_difficulty.textContent = prettyLines(activeValues($('difficultyChips')));
}

// ---------------- Профиль: форма ----------------
const profileForm     = $('profileForm');
const profileSaveBtn  = $('profileSaveBtn');

if (profileForm) {
  renderChips($('platformChips'),   PLATFORM,   { onChange: refreshProfileView });
  renderChips($('modesChips'),      MODES,      { onChange: refreshProfileView });
  renderChips($('goalsChips'),      GOALS,      { onChange: refreshProfileView });
  renderChips($('difficultyChips'), DIFFICULTY, { onChange: refreshProfileView });

  const psnInput = profileForm.psn;
  const psnError = document.createElement('div');
  psnError.className = 'error-text';
  psnInput?.parentNode?.appendChild(psnError);

  // Навигация по Enter
  const nameInput = profileForm.real_name;
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); psnInput?.focus(); }
  });
  psnInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); }
  });

  function validatePSN() {
    if (!psnInput) return true;
    const val = psnInput.value.trim();
    const ok = !val || /^[A-Za-z0-9_-]{3,16}$/.test(val);
    if (!ok) {
      psnError.textContent = 'Ник должен быть 3–16 символов, латиница, цифры, дефис или подчёркивание.';
      psnInput.classList.add('error');
    } else {
      psnError.textContent = '';
      psnInput.classList.remove('error');
    }
    return ok;
  }
  psnInput?.addEventListener('input', validatePSN);

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validatePSN()) { hapticERR(); return; }

    if (v_real_name) v_real_name.textContent = (profileForm.real_name?.value || '').trim() || '—';
    if (v_psn)       v_psn.textContent       = (profileForm.psn?.value || '').trim()       || '—';
    refreshProfileView();

    if (tg?.showPopup) {
      tg.showPopup({ title: 'Профиль обновлён', message: 'Данные сохранены.', buttons: [{ type: 'ok' }] });
      hapticOK();
    }
    scrollTopSmooth();
  });

  profileSaveBtn?.addEventListener('click', () => profileForm.requestSubmit());
}

// ---------------- Трофеи ----------------
const trophyListEl  = $('trophyList');
const trophyTitleEl = $('trophyTitle');
const trophyDescEl  = $('trophyDesc');

const TROPHIES_URL = './trophies.json';
let TROPHIES = null;

async function loadTrophies() {
  if (TROPHIES) return TROPHIES;
  try {
    const res = await fetch(TROPHIES_URL, { cache: 'no-store' });
    TROPHIES = await res.json();
  } catch (e) { TROPHIES = {}; }
    return TROPHIES;
}

function renderTrophyList(data) {
  if (!trophyListEl) return;
  trophyListEl.innerHTML = '';
  Object.keys(data || {}).forEach((key) => {
    const t = data[key];
    const btn = document.createElement('button');
    btn.className = 'list-btn';
    btn.type = 'button';
    btn.dataset.id = key;
    btn.innerHTML = `<span>${t.name || key} ${t.emoji || ''}</span><span class="right">›</span>`;
    btn.addEventListener('click', () => openTrophyDetail(key));
    trophyListEl.appendChild(btn);
  });

  addTapHighlight('#trophyList .list-btn');
}

const proofFormEl     = $('proofForm');
const proofFilesEl    = $('proofFiles');       // скрытый input[type=file]
const proofSubmitBtn  = $('proofSubmitBtn');   // ВНЕ формы — общий actions-bar
const commentEl       = $('commentText');
const previewEl       = $('filePreview');
const proofAddBtn     = $('proofAddBtn');      // узкая кнопка-строка «＋ Прикрепить»

// Локальный список выбранных файлов (мы контролируем превью и отправку)
let proofSelected = []; // Array<File>

// Кнопка «＋ Прикрепить»
proofAddBtn?.addEventListener('click', () => {
  try { proofFilesEl.value = ''; } catch {}
  proofFilesEl?.click();
});

// При выборе файлов — дополняем список и перерисовываем превью
if (proofFilesEl) {
  proofFilesEl.addEventListener('change', () => {
    const files = Array.from(proofFilesEl.files || []);
    if (!files.length) return;

    // Добавляем, избегая дублей (по name+size+lastModified)
    const keyOf = (f) => `${f.name}::${f.size}::${f.lastModified}`;
    const existing = new Set(proofSelected.map(keyOf));
    files.forEach((f) => { if (!existing.has(keyOf(f))) proofSelected.push(f); });

    renderProofPreview();
  });
}

// Рендер компактных превью (макс 4 + «+N») с возможностью удаления по тапу
function renderProofPreview() {
  if (!previewEl) return;
  previewEl.innerHTML = '';

  const limit = 4;
  const toShow = proofSelected.slice(0, limit);

  toShow.forEach((file, idx) => {
    const tile = document.createElement('div');
    tile.className = 'preview-item removable'; // overlay «×»
    tile.title = 'Нажмите, чтобы удалить';

    // Контент
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      tile.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      tile.textContent = '🎥';
    } else {
      tile.textContent = '📄';
    }

    // Удаление по тапу
    tile.addEventListener('click', () => {
      proofSelected.splice(idx, 1);
      hapticTap();
      renderProofPreview();
    });

    previewEl.appendChild(tile);
  });

  if (proofSelected.length > limit) {
    const more = document.createElement('div');
    more.className = 'preview-more';
    more.textContent = `+${proofSelected.length - limit}`;
    previewEl.appendChild(more);
  }
}

// Сброс формы заявки
function resetProofForm() {
  if (previewEl) previewEl.innerHTML = '';
  if (proofFilesEl) proofFilesEl.value = '';
  proofSelected = [];
  if (commentEl) {
    commentEl.value = '';
    commentEl.style.height = 'auto';
  }
}

function openTrophyDetail(key) {
  const t = (TROPHIES && TROPHIES[key]) || {};
  if (trophyTitleEl) trophyTitleEl.textContent = `${t.name || 'Трофей'}${t.emoji ? ' ' + t.emoji : ''}`;
  if (trophyDescEl) {
    trophyDescEl.innerHTML = '';
    (t.description || ['Описание скоро будет.']).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      trophyDescEl.appendChild(li);
    });
  }
  resetProofForm();
  showScreen('trophyDetail');
}

// авто-рост textarea (трофеи)
if (commentEl) {
  const autoResize = () => {
    commentEl.style.height = 'auto';
    commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
  };
  commentEl.addEventListener('input', autoResize);
  setTimeout(autoResize, 0);
}

let submitting = false;
function shake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  hapticERR();
}

async function submitProof() {
  if (submitting) return;
  submitting = true;
  setTimeout(() => (submitting = false), 1200);

  const filesCount = proofSelected.length; // используем наш список
  const comment    = (commentEl?.value || '').trim();

  if (filesCount === 0 || !comment) {
    if (!filesCount) shake(previewEl || proofAddBtn || proofFilesEl);
    if (!comment)    shake(commentEl);
    tg?.showPopup?.({ title: 'Ошибка', message: 'Добавьте файл и комментарий.', buttons: [{ type: 'ok' }] });
    return;
  }

  // тут была бы отправка на сервер; в демо просто показываем ok
  hapticOK();
  tg?.showPopup?.({ title: 'Заявка отправлена', message: '✅ Модераторы рассмотрят вашу заявку.' });
  resetProofForm();
  showScreen('trophies');
}

// Кнопка «Отправить» — вне формы, в общем actions-bar
proofSubmitBtn?.addEventListener('pointerdown', () => hapticTap());
proofSubmitBtn?.addEventListener('click', (e) => { e.preventDefault?.(); submitProof(); });

// Защита от случайной отправки самой form
if (proofFormEl) {
  proofFormEl.addEventListener('submit', (e) => { e.preventDefault(); submitProof(); });
}

// BackButton Telegram
if (tg) {
  tg.onEvent('backButtonClicked', () => {
    if (isVisible('buildCreate'))        { showScreen('builds'); return; }
    if (isVisible('buildDetail'))        { showScreen('builds'); return; }
    if (isVisible('buildPublicDetail'))  { showScreen('builds'); return; }
    if (isVisible('trophyDetail'))       { resetProofForm(); showScreen('trophies'); return; }
    if (isVisible('profile') || isVisible('trophies') || isVisible('builds')) { showScreen('home'); return; }
    showScreen('home');
  });
}

// ---------------- Главное меню ----------------
$('openProfileBtn')?.addEventListener('click', () => showScreen('profile'));
$('trophiesBtn')?.addEventListener('click', () => showScreen('trophies'));
$('buildsBtn')?.addEventListener('click', () => { renderMyBuilds(); renderAllBuilds(); showScreen('builds'); });

addTapHighlight('.big-btn');

// ---------------- БИЛДЫ ----------------
const LS_KEY_BUILDS      = 'tsu_builds_v1';            // мои локальные билды
const LS_KEY_PUB_BUILDS  = 'tsu_builds_public_v1';     // опубликованные (все билды, локальная имитация)

const CLASS_VALUES = ['Самурай','Охотник','Убийца','Ронин'];
const TAG_VALUES   = ['HellMode','Спидран','Соло','Сюжет','Соперники'];
const CLASS_ICON = {
  'Самурай':'./samurai-wh.svg',
  'Охотник':'./hunter-wh.svg',
  'Убийца':'./assassin-wh.svg',
  'Ронин':'./ronin-wh.svg'
};

// Элементы
const myBuildsList     = $('myBuildsList');
const noBuildsHint     = $('noBuildsHint');
const createBuildBtn   = $('createBuildBtn');

const buildForm        = $('buildForm');
const buildNameEl      = $('build_name');
const buildDescEl      = $('build_desc');
const classChipsEl     = $('classChips');
const tagsChipsEl      = $('tagsChips');

const shotInput1       = $('build_shot1');
const shotInput2       = $('build_shot2');
const shotsTwo         = $('shotsTwo');

const buildSubmitBtn   = $('buildSubmitBtn');

const buildDetailTitle = $('buildDetailTitle');
const vd_class         = $('vd_class');
const vd_tags          = $('vd_tags');
const vd_desc          = $('vd_desc');
const buildDetailShots = $('buildDetailShots');

const publishBuildBtn  = $('publishBuildBtn');
const deleteBuildBtn   = $('deleteBuildBtn');

// Публичные детали
const publicDetailTitle = $('publicDetailTitle');
const pd_class          = $('pd_class');
const pd_tags           = $('pd_tags');
const pd_desc           = $('pd_desc');
const pd_author         = $('pd_author');
const pd_date           = $('pd_date');
const publicDetailShots = $('publicDetailShots');

// Списки «Все билды»
const allBuildsList   = $('allBuildsList');
const noAllBuildsHint = $('noAllBuildsHint');

// Текущий билд в деталях (мой)
let currentBuildId = null;

// Рендер чипов формы билда
renderChips(classChipsEl, CLASS_VALUES, { single: true });
renderChips(tagsChipsEl,  TAG_VALUES);

// Авто-рост описания
if (buildDescEl) {
  const autoResize = () => {
    buildDescEl.style.height = 'auto';
    buildDescEl.style.height = Math.min(buildDescEl.scrollHeight, 200) + 'px';
  };
  buildDescEl.addEventListener('input', autoResize);
  setTimeout(autoResize, 0);
}

// --------- Helpers для файлов / сжатия ---------
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Сжатие изображения в JPEG (без EXIF), ограничение по длинной стороне
async function compressImageFile(file, { maxEdge = 1280, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (e) { reject(e); }
    };
    img.onerror = reject;

    const r = new FileReader();
    r.onload = () => { img.src = r.result; };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getShotInputByIdx(idx) { return idx === '1' ? shotInput1 : shotInput2; }
function renderShotThumb(idx, src) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'shot-thumb';
  btn.dataset.idx = String(idx);
  const img = document.createElement('img');
  img.src = src;
  btn.appendChild(img);
  btn.addEventListener('click', () => {
    const input = getShotInputByIdx(String(idx));
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });
  return btn;
}

// Два отдельных слота
let shot1Data = null;
let shot2Data = null;

// Делегирование клика по квадратам
if (shotsTwo) {
  shotsTwo.addEventListener('click', (e) => {
    const box = e.target.closest('.upload-box');
    if (!box) return;
    const idx = box.dataset.idx;
    const input = getShotInputByIdx(idx);
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });
}

// Реакция на выбор файла — сжатие перед сохранением
function bindShotInput(input, idx){
  input?.addEventListener('change', async ()=>{
    const file = input.files && input.files[0];
    if(!file) return;
    try{
      const data = await compressImageFile(file, { maxEdge: 1280, quality: 0.7 });

      const targetEl =
        shotsTwo?.querySelector(`.upload-box[data-idx="${idx}"]`) ||
        shotsTwo?.querySelector(`.shot-thumb[data-idx="${idx}"]`);
      const thumb = renderShotThumb(idx, data);

      if(targetEl && targetEl.parentNode){
        targetEl.parentNode.replaceChild(thumb, targetEl);
      } else if (shotsTwo){
        shotsTwo.appendChild(thumb);
      }

      if(idx === '1') shot1Data = data; else shot2Data = data;
      hapticTap();
    }catch(_){
      shake(shotsTwo);
    }
  });
}
bindShotInput(shotInput1, '1');
bindShotInput(shotInput2, '2');

// --------- Storage helpers ---------
function loadBuilds() {
  try {
    const raw = localStorage.getItem(LS_KEY_BUILDS);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}
function saveBuilds(arr){
  try{
    localStorage.setItem(LS_KEY_BUILDS, JSON.stringify(arr||[]));
    return true;
  }catch(e){
    tg?.showPopup?.({
      title: 'Хранилище заполнено',
      message: 'Не удалось сохранить билд: лимит хранения исчерпан. Уменьшите размер скриншотов или удалите старые билды.',
      buttons: [{ type:'ok' }]
    });
    hapticERR();
    return false;
  }
}

function loadPublicBuilds() {
  try {
    const raw = localStorage.getItem(LS_KEY_PUB_BUILDS);
    return raw ? JSON.parse(raw) : [];
  } catch(_) { return []; }
}
function savePublicBuilds(arr) {
  try {
    localStorage.setItem(LS_KEY_PUB_BUILDS, JSON.stringify(arr||[]));
    return true;
  } catch(_) { return false; }
}

// --------- Списки ---------
function renderMyBuilds() {
  const items = loadBuilds();
  myBuildsList.innerHTML = '';
  if (!items.length) {
    noBuildsHint.style.display = 'block';
    return;
  }
  noBuildsHint.style.display = 'none';

  items.slice().reverse().forEach((b) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'build-item';
    row.setAttribute('data-id', b.id);

    const icon = document.createElement('div');
    icon.className = 'build-icon';
    const img = document.createElement('img');
    img.alt = b.class || 'Класс';
    img.src = CLASS_ICON[b.class] || CLASS_ICON['Самурай'];
    icon.appendChild(img);

    const title = document.createElement('div');
    title.className = 'build-title';
    const name = (b.name || 'Без названия').toString();
    const safeName = name.length > 40 ? (name.slice(0, 40) + '…') : name;
    title.textContent = safeName;

    row.appendChild(icon);
    row.appendChild(title);
    row.addEventListener('click', () => openBuildDetail(b.id));
    myBuildsList.appendChild(row);
  });

  addTapHighlight('#myBuildsList .build-item');
}

function renderAllBuilds() {
  const items = loadPublicBuilds();
  allBuildsList.innerHTML = '';
  if (!items.length) {
    noAllBuildsHint.style.display = 'block';
    return;
  }
  noAllBuildsHint.style.display = 'none';

  items.slice().reverse().forEach((p) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'build-item';
    row.setAttribute('data-id', p.id);

    const icon = document.createElement('div');
    icon.className = 'build-icon';
    const img = document.createElement('img');
    img.alt = p.class || 'Класс';
    img.src = CLASS_ICON[p.class] || CLASS_ICON['Самурай'];
    icon.appendChild(img);

    const title = document.createElement('div');
    title.className = 'build-title';
    const name = (p.name || 'Без названия').toString();
    const safeName = name.length > 40 ? (name.slice(0, 40) + '…') : name;
    title.textContent = safeName;

    row.appendChild(icon);
    row.appendChild(title);
    row.addEventListener('click', () => openPublicBuildDetail(p.id));
    allBuildsList.appendChild(row);
  });

  addTapHighlight('#allBuildsList .build-item');
}

// --------- Создание билда ---------
createBuildBtn?.addEventListener('click', () => {
  resetBuildForm();
  showScreen('buildCreate');
});
createBuildBtn?.addEventListener('pointerdown', () => hapticTap());

function resetBuildForm() {
  try { buildForm?.reset(); } catch {}
  setActive(classChipsEl, []);
  setActive(tagsChipsEl,  []);
  if (shotInput1) shotInput1.value = '';
  if (shotInput2) shotInput2.value = '';
  shot1Data = null; shot2Data = null;

  if (shotsTwo) {
    shotsTwo.innerHTML = `
      <button type="button" class="upload-box" data-idx="1" aria-label="Загрузить первое изображение">＋</button>
      <button type="button" class="upload-box" data-idx="2" aria-label="Загрузить второе изображение">＋</button>
    `;
  }
  if (buildDescEl) buildDescEl.style.height = 'auto';
}

buildSubmitBtn?.addEventListener('pointerdown', () => hapticTap());
buildSubmitBtn?.addEventListener('click', () => buildForm?.requestSubmit());

if (buildForm) {
  buildForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let name = (buildNameEl?.value || '').trim();
    if (name.length > 40) name = name.slice(0, 40);

    const klass = activeValues(classChipsEl)[0] || '';
    const tags  = activeValues(tagsChipsEl);
    const desc  = (buildDescEl?.value || '').trim();

    if (!name)   { shake(buildNameEl); buildNameEl?.focus(); return; }
    if (!klass)  { shake(classChipsEl); return; }
    if (!shot1Data || !shot2Data) { shake(shotsTwo); return; }

    const item = {
      id: Date.now(),
      name,
      class: klass,
      tags,
      desc,
      shots: [shot1Data, shot2Data],
      createdAt: new Date().toISOString()
    };

    const all = loadBuilds();
    all.push(item);
    if (!saveBuilds(all)) { return; }

    hapticOK();
    tg?.showPopup?.({ title: 'Билд создан', message: 'Сохранено локально (макет, без сервера).', buttons: [{ type:'ok' }] });

    renderMyBuilds();
    showScreen('builds');
  });
}

// --------- Детали МОЕГО билда ---------
function isBuildPublished(myId) {
  const pubs = loadPublicBuilds();
  return pubs.some(p => String(p.originalId) === String(myId));
}
function updatePublishButton(myId) {
  if (!publishBuildBtn) return;
  const published = isBuildPublished(myId);
  if (published) {
    publishBuildBtn.textContent = 'Скрыть';
    publishBuildBtn.classList.remove('primary');
    publishBuildBtn.classList.add('danger');
  } else {
    publishBuildBtn.textContent = 'Опубликовать';
    publishBuildBtn.classList.add('primary');
    publishBuildBtn.classList.remove('danger');
  }
}

function openBuildDetail(id) {
  const all = loadBuilds();
  const b = all.find((x) => String(x.id) === String(id));
  if (!b) { tg?.showAlert?.('Билд не найден'); return; }
  currentBuildId = b.id;

  if (deleteBuildBtn) {
    deleteBuildBtn.dataset.id = String(b.id);
  }

  buildDetailTitle.textContent = b.name || 'Билд';
  vd_class.textContent = b.class || '—';
  vd_tags.textContent  = (b.tags && b.tags.length) ? b.tags.join('\n') : '—';
  vd_desc.textContent  = b.desc || '—';

  buildDetailShots.innerHTML = '';
  (b.shots || []).forEach((src) => {
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'shot-thumb';
    const img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);
    wrap.addEventListener('click', () => openLightbox(src));
    buildDetailShots.appendChild(wrap);
  });

  updatePublishButton(b.id);
  showScreen('buildDetail');
}

// Публикация/Скрытие
publishBuildBtn?.addEventListener('click', () => {
  if (!currentBuildId) return;

  const myAll = loadBuilds();
  const me = myAll.find(x => String(x.id) === String(currentBuildId));
  if (!me) return;

  const pubs = loadPublicBuilds();
  const already = pubs.find(p => String(p.originalId) === String(me.id));

  if (already) {
    // СКРЫТЬ = удалить из «Все билды»
    const rest = pubs.filter(p => String(p.originalId) !== String(me.id));
    savePublicBuilds(rest);
    updatePublishButton(me.id);
    renderAllBuilds();
    tg?.showPopup?.({ title:'Скрыто', message:'Билд скрыт из списка «Все билды».', buttons:[{type:'ok'}] });
    return;
  }

  // ОПУБЛИКОВАТЬ = добавить дубль в «Все билды»
  const uname = tg?.initDataUnsafe?.user?.username || 'Гость';
  const pubItem = {
    id: `pub_${Date.now()}`,
    originalId: me.id,
    name: me.name,
    class: me.class,
    tags: me.tags || [],
    desc: me.desc || '',
    shots: me.shots || [],
    author: '@' + uname,
    publishedAt: new Date().toISOString()
  };

  pubs.push(pubItem);
  savePublicBuilds(pubs);
  updatePublishButton(me.id);
  renderAllBuilds();
  tg?.showPopup?.({ title:'Опубликовано', message:'Билд добавлен в «Все билды».', buttons:[{type:'ok'}] });
});

// Подтверждение удаления (через Telegram popup с промисом)
let _popupResolver = null;
tg?.onEvent?.('popupClosed', (e) => {
  if (_popupResolver) {
    _popupResolver(e?.button_id === 'yes');
    _popupResolver = null;
  }
});
function tgConfirm(title, message) {
  if (!tg?.showPopup) {
    return Promise.resolve(window.confirm(message || title));
  }
  return new Promise((resolve) => {
    _popupResolver = resolve;
    tg.showPopup({
      title: title || 'Подтверждение',
      message: message || '',
      buttons: [
        {id:'no',  type:'cancel',      text:'Отмена'},
        {id:'yes', type:'destructive', text:'Удалить'}
      ]
    });
  });
}

// Обработчик «Удалить»
deleteBuildBtn?.addEventListener('click', async () => {
  const idFromBtn = deleteBuildBtn?.dataset?.id;
  const id = idFromBtn ?? currentBuildId;
  if (!id) { tg?.showAlert?.('Не удалось определить билд для удаления.'); return; }

  const ok = await tgConfirm('Удалить билд?', 'Вы уверены, что хотите удалить этот билд?');
  if (!ok) return;

  deleteBuildById(String(id));
});

// Универсальная функция удаления (убирает и из «Все билды», если опубликован)
function deleteBuildById(id) {
  // удалить из моих
  const rest = loadBuilds().filter((b) => String(b.id) !== String(id));
  if (!saveBuilds(rest)) return;

  // если был опубликован — убрать и из публик-листа
  const pubs = loadPublicBuilds();
  const pubsRest = pubs.filter(p => String(p.originalId) !== String(id));
  savePublicBuilds(pubsRest);

  renderMyBuilds();
  renderAllBuilds();
  tg?.showPopup?.({ title: 'Удалено', message: 'Билд удалён.', buttons: [{ type:'ok' }] });
  showScreen('builds');
}

// --------- Детали ПУБЛИЧНОГО билда (без кнопок) ---------
function openPublicBuildDetail(pubId) {
  const pubs = loadPublicBuilds();
  const p = pubs.find(x => String(x.id) === String(pubId));
  if (!p) { tg?.showAlert?.('Публикация не найдена'); return; }

  publicDetailTitle.textContent = p.name || 'Билд';
  pd_class.textContent = p.class || '—';
  pd_tags.textContent  = (p.tags && p.tags.length) ? p.tags.join('\n') : '—';
  pd_desc.textContent  = p.desc || '—';
  pd_author.textContent = p.author || '—';

  // форматируем дату
  try {
    const d = new Date(p.publishedAt);
    pd_date.textContent = isNaN(d.getTime()) ? '—' : d.toLocaleString();
  } catch { pd_date.textContent = '—'; }

  publicDetailShots.innerHTML = '';
  (p.shots || []).forEach((src) => {
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'shot-thumb';
    const img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);
    wrap.addEventListener('click', () => openLightbox(src));
    publicDetailShots.appendChild(wrap);
  });

  showScreen('buildPublicDetail');
}

// --------- Лайтбокс ---------
const lightbox = $('lightbox');
const lightboxImg = $('lightboxImg');
function openLightbox(src) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.remove('hidden');
}
function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.add('hidden');
}
lightbox?.addEventListener('click', closeLightbox);

// ---------------- Старт ----------------
(async function start() {
  applyTopInset();
  showScreen('home');

  const data = await loadTrophies();
  renderTrophyList(data);
  refreshProfileView();
  renderMyBuilds();
  renderAllBuilds();

  // Вызов хайлайта теперь без эффекта
  addTapHighlight('.btn, .big-btn, .list-btn, .build-item, .chip-btn');
})();
