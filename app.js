// --- Telegram WebApp init ---
const tg = window.Telegram?.WebApp || null;
(function initTG(){
  if(!tg) return;
  try{
    tg.ready();
    tg.expand();
    const th = tg.themeParams || {};
    if(th.bg_color)   document.documentElement.style.setProperty('--tg-bg', th.bg_color);
    if(th.text_color) document.documentElement.style.setProperty('--tg-tx', th.text_color);
    if(th.hint_color) document.documentElement.style.setProperty('--tg-hint', th.hint_color);
    document.documentElement.classList.add('tg');
    tg.MainButton.hide();
    tg.BackButton.hide();
  }catch(e){}
})();
function hapticOK(){ try{ tg?.HapticFeedback?.notificationOccurred('success'); }catch{} }
function hapticERR(){ try{ tg?.HapticFeedback?.notificationOccurred('error'); }catch{} }
function hapticTap(){ try{ tg?.HapticFeedback?.impactOccurred('light'); }catch{} }

function $(id){ return document.getElementById(id); }
function scrollTopSmooth(){ window.scrollTo({top:0, behavior:'smooth'}); }

/* === ГЛОБАЛЬНЫЕ ФИКСЫ ВЁРСТКИ (без правок style.css) ===================== */
/* 1) «Опускаем» контент ниже системной шапки Telegram (Back, title и т.п.)
   2) Рубим горизонтальную прокрутку и потенциальные переполнения
   3) Чиним превью на странице заявки (строго в пределах ширины) */
(function injectGlobalFixStyles(){
  const css = `
    :root{
      --safe-top: calc(14px + env(safe-area-inset-top, 0px));
      --safe-bottom-js: calc(14px + env(safe-area-inset-bottom, 0px));
    }
    html,body{ overflow-x:hidden; }
    /* Основной отступ сверху/снизу для ВСЕГО приложения (только в Telegram) */
    html.tg body{ padding-top: calc(var(--safe-top) + 44px); padding-bottom: var(--safe-bottom-js); }

    /* Страница заявки на трофей: ничто не должно выползать по ширине */
    #trophyDetailScreen{ overflow-x:hidden; }
    #trophyDetailScreen .form{ max-width:100%; }
    #trophyDetailScreen .upload-row{ width:100%; max-width:100%; overflow:hidden; }
    #trophyDetailScreen .preview-row{ display:flex; gap:8px; overflow:hidden; max-width:100%; }
    #trophyDetailScreen .preview-item,
    #trophyDetailScreen .preview-more{
      flex:0 0 76px; height:76px; border-radius:12px; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
    }
    #trophyDetailScreen .preview-item img{ width:100%; height:100%; object-fit:cover; display:block; }
  `;
  const s = document.createElement('style');
  s.id = 'js-global-fixes';
  s.textContent = css;
  document.head.appendChild(s);
})();

/* Доп. страховка: если Telegram не сообщает safe-area, слегка увеличим отступ */
function applyTopSafeOffset(){
  const isTG = document.documentElement.classList.contains('tg');
  if(!isTG) return;
  // Базовая высота шапки Telegram ~44–48px. Дадим чутка больше запаса.
  const headerReserve = 52;
  const safeTop = 14;    // небольшой базовый отступ
  const safeBottom = 14; // небольшой базовый отступ
  document.body.style.paddingTop = `calc(${safeTop}px + env(safe-area-inset-top, 0px) + ${headerReserve}px)`;
  document.body.style.paddingBottom = `calc(${safeBottom}px + env(safe-area-inset-bottom, 0px))`;
  // И полностью вырубим горизонтальную прокрутку, даже если где-то «перелив»
  document.documentElement.style.overflowX = 'hidden';
  document.body.style.overflowX = 'hidden';
}
window.addEventListener('resize', applyTopSafeOffset);
window.addEventListener('orientationchange', applyTopSafeOffset);

/* === ЭКРАНЫ =============================================================== */
const screens = {
  home: $('homeScreen'),
  profile: $('profileScreen'),
  trophies: $('trophiesScreen'),
  trophyDetail: $('trophyDetailScreen'),
  builds: $('buildsScreen'),
  buildCreate: $('buildCreateScreen'),
  buildDetail: $('buildDetailScreen'),
};
let currentScreen = 'home';

function setTopbar(visible, title){
  const tb = document.querySelector('.topbar');
  if(tb) tb.style.display = visible ? 'flex' : 'none';
  if(title) { const t = $('appTitle'); if(t) t.textContent = title; }
}

function setFooterSafeSpacing(name){
  // Небольшой нижний «воздух», чтобы скругления не «съедали» кнопки
  const APPLY = (rootSel, pxBottom) => {
    const el = document.querySelector(`${rootSel} .footer-actions`);
    if(el) el.style.margin = `8px 0 ${pxBottom}px`;
  };
  if(name === 'home'){ APPLY('#homeScreen', 28); }
  else if(name === 'profile'){ APPLY('#profileScreen', 28); }
  else if(name === 'trophies'){ APPLY('#trophiesScreen', 28); }
  else if(name === 'trophyDetail'){ APPLY('#trophyDetailScreen', 10); }
  else if(name === 'builds'){ APPLY('#buildsScreen', 28); }
  else if(name === 'buildCreate'){ APPLY('#buildCreateScreen', 28); }
  else if(name === 'buildDetail'){ APPLY('#buildDetailScreen', 28); }
}

function configureSystemButtons(name){
  if(!tg) return;

  if(name === 'home'){
    // Главный экран: Back скрыт, доступно «Закрыть»
    tg.BackButton.hide();
    tg.MainButton.setText('Закрыть');
    tg.MainButton.show();
    tg.offEvent?.('mainButtonClicked');
    tg.onEvent('mainButtonClicked', ()=> tg.close && tg.close());
    return;
  }

  // Остальные экраны: показываем системный BackButton, MainButton прячем
  tg.MainButton.hide();
  tg.offEvent?.('mainButtonClicked');
  tg.BackButton.show();
}

function showScreen(name){
  Object.values(screens).forEach(el => el && el.classList.add('hidden'));
  const el = screens[name];
  if(el) el.classList.remove('hidden');
  currentScreen = name;

  configureSystemButtons(name);
  setFooterSafeSpacing(name);

  if(tg){
    // Жёстко синхронизируем BackButton
    if(name === 'home') tg.BackButton.hide();
    else tg.BackButton.show();
  }

  if(name === 'home') setTopbar(false);
  else if(name === 'profile') setTopbar(true, 'Профиль');
  else if(name === 'trophies') setTopbar(true, 'Трофеи');
  else if(name === 'trophyDetail') setTopbar(true, 'Трофеи');
  else if(name === 'builds') setTopbar(true, 'Билды');
  else if(name === 'buildCreate') setTopbar(true, 'Создать билд');
  else if(name === 'buildDetail') setTopbar(true, 'Билд');

  if(name === 'trophyDetail'){ ensureInlineSubmitButton(); }

  // каждый раз страхуемся от переполнений/смещений
  applyTopSafeOffset();
  scrollTopSmooth();
}

/* Инлайн «Отправить заявку» на экране трофея */
function ensureInlineSubmitButton(){
  const form = $('proofForm');
  if(!form) return;
  let submitInline = $('submitInlineBtn');
  if(!submitInline){
    submitInline = document.createElement('button');
    submitInline.id = 'submitInlineBtn';
    submitInline.className = 'btn primary';
    submitInline.textContent = 'Отправить заявку';
    form.appendChild(submitInline);
    submitInline.style.marginTop = '4px';
  }else{
    submitInline.textContent = 'Отправить заявку';
  }
  submitInline.onclick = (e)=>{ e.preventDefault(); submitProof(); };

  // Убираем «левую пустоту» именно на этой странице
  const fa = document.querySelector('#trophyDetailScreen .footer-actions');
  if(fa) fa.style.margin = '8px 0 10px';
}

/* Header user chip */
(function(){
  const chip = $('userChip');
  const uname = tg?.initDataUnsafe?.user?.username;
  if(chip && uname) chip.textContent = '@' + uname;
})();

/* Chips (профиль) */
const PLATFORM   = ['🎮 PlayStation','💻 ПК'];
const MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
const GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
const DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

function renderChips(container, values, {single=false, onChange}={}){
  if(!container) return;
  container.innerHTML = '';
  values.forEach(v=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-btn';
    b.textContent = v;
    b.dataset.value = v;
    b.addEventListener('click', ()=>{
      if(single){
        container.querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
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
function activeValues(container){
  if(!container) return [];
  return Array.from(container.querySelectorAll('.chip-btn.active')).map(b=>b.dataset.value);
}
function setActive(container, arr){
  if(!container) return;
  const set = new Set(arr||[]);
  container.querySelectorAll('.chip-btn').forEach(b=>{
    b.classList.toggle('active', set.has(b.dataset.value));
  });
}

/* Профиль: отображение */
const v_real_name  = $('v_real_name');
const v_psn        = $('v_psn');
const v_platform   = $('v_platform');
const v_modes      = $('v_modes');
const v_goals      = $('v_goals');
const v_difficulty = $('v_difficulty');

function prettyLines(arr){ return (arr && arr.length) ? arr.join('\n') : '—'; }
function refreshProfileView(){
  if(v_platform)   v_platform.textContent   = prettyLines(activeValues($('platformChips')));
  if(v_modes)      v_modes.textContent      = prettyLines(activeValues($('modesChips')));
  if(v_goals)      v_goals.textContent      = prettyLines(activeValues($('goalsChips')));
  if(v_difficulty) v_difficulty.textContent = prettyLines(activeValues($('difficultyChips')));
}

/* Профиль: форма */
const profileForm = $('profileForm');
const resetBtn    = $('resetBtn');

if(profileForm){
  renderChips($('platformChips'),   PLATFORM,   {onChange:refreshProfileView});
  renderChips($('modesChips'),      MODES,      {onChange:refreshProfileView});
  renderChips($('goalsChips'),      GOALS,      {onChange:refreshProfileView});
  renderChips($('difficultyChips'), DIFFICULTY, {onChange:refreshProfileView});

  const psnInput = profileForm.psn;
  const psnError = document.createElement('div');
  psnError.className = 'error-text';
  psnInput?.parentNode?.appendChild(psnError);

  function validatePSN(){
    if(!psnInput) return true;
    const val = psnInput.value.trim();
    const ok = !val || /^[A-Za-z0-9_-]{3,16}$/.test(val);
    if(!ok){
      psnError.textContent = "Ник должен быть 3–16 символов, латиница, цифры, дефис или подчёркивание.";
      psnInput.classList.add('error');
    } else {
      psnError.textContent = "";
      psnInput.classList.remove('error');
    }
    return ok;
  }
  psnInput?.addEventListener('input', validatePSN);

  profileForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!validatePSN()){ hapticERR(); return; }

    if(v_real_name) v_real_name.textContent = (profileForm.real_name?.value || '').trim() || '—';
    if(v_psn)       v_psn.textContent       = (profileForm.psn?.value || '').trim() || '—';
    refreshProfileView();

    if(tg?.showPopup){
      tg.showPopup({ title: 'Профиль обновлён', message: 'Данные сохранены.', buttons: [{type:'ok'}] });
      hapticOK();
    }
    scrollTopSmooth();
  });

  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      try{ profileForm.reset(); }catch{}
      setActive($('platformChips'), []);
      setActive($('modesChips'), []);
      setActive($('goalsChips'), []);
      setActive($('difficultyChips'), []);
      refreshProfileView();
      if(tg?.showPopup){ tg.showPopup({ title:'Сброс', message:'Все поля очищены.', buttons:[{type:'ok'}] }); }
    });
  }
}

/* --- Трофеи --- */
const trophyListEl  = $('trophyList');
const trophyTitleEl = $('trophyTitle');
const trophyDescEl  = $('trophyDesc');

const TROPHIES_URL = './trophies.json';
let TROPHIES = null;

async function loadTrophies(){
  if(TROPHIES) return TROPHIES;
  try{
    const res = await fetch(TROPHIES_URL, { cache:'no-store' });
    TROPHIES = await res.json();
  }catch(e){ TROPHIES = {}; }
  return TROPHIES;
}
function renderTrophyList(data){
  if(!trophyListEl) return;
  trophyListEl.innerHTML = '';
  Object.keys(data||{}).forEach(key=>{
    const t = data[key];
    const btn = document.createElement('button');
    btn.className = 'list-btn';
    btn.type = 'button';
    btn.dataset.id = key;
    btn.innerHTML = `<span>${t.name || key} ${t.emoji || ''}</span><span class="right">›</span>`;
    btn.addEventListener('click', ()=> openTrophyDetail(key));
    trophyListEl.appendChild(btn);
  });
}

const proofFormEl   = $('proofForm');
const proofFilesEl  = $('proofFiles');      // скрытый input
const proofUpload   = $('proofUploadBox');  // узкий прямоугольник
const commentEl     = $('commentText');
const previewEl     = $('filePreview');

// Буфер выбранных медиа
let proofFilesBuffer = [];

function uniqueKey(file){ return [file.name, file.size, file.lastModified, file.type].join('::'); }
function syncProofInputFromBuffer(){
  try{
    const dt = new DataTransfer();
    proofFilesBuffer.forEach(f=> dt.items.add(f));
    proofFilesEl.files = dt.files;
  }catch(_){}
}
function renderProofPreviews(){
  if(!previewEl) return;
  previewEl.innerHTML = '';
  if(!proofFilesBuffer.length) return;

  const MAX_TILES = 4;

  if(proofFilesBuffer.length <= MAX_TILES){
    proofFilesBuffer.slice(0, MAX_TILES).forEach(file=>{
      const div = document.createElement('div');
      div.className = 'preview-item';
      if(file.type.startsWith('image/')){
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = ()=> URL.revokeObjectURL(img.src);
        div.appendChild(img);
      }else if(file.type.startsWith('video/')){
        div.textContent = '🎥';
      }else{
        div.textContent = '📄';
      }
      previewEl.appendChild(div);
    });
    return;
  }

  // Больше 4: первые 3 + четвёртая «+N»
  proofFilesBuffer.slice(0, 3).forEach(file=>{
    const div = document.createElement('div');
    div.className = 'preview-item';
    if(file.type.startsWith('image/')){
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = ()=> URL.revokeObjectURL(img.src);
      div.appendChild(img);
    }else if(file.type.startsWith('video/')){
      div.textContent = '🎥';
    }else{
      div.textContent = '📄';
    }
    previewEl.appendChild(div);
  });

  const moreCount = proofFilesBuffer.length - 3;
  const more = document.createElement('div');
  more.className = 'preview-more';
  more.textContent = `+${moreCount}`;
  previewEl.appendChild(more);
}

// Триггер выбора медиа
proofUpload?.addEventListener('click', ()=>{
  try{ proofFilesEl.value = ''; }catch{}
  proofFilesEl?.click();
});

// На каждое добавление — дополняем буфер
if(proofFilesEl){
  proofFilesEl.addEventListener('change', ()=>{
    const picked = Array.from(proofFilesEl.files || []);
    if(!picked.length) return;

    const existing = new Set(proofFilesBuffer.map(uniqueKey));
    picked.forEach(f=>{
      const key = uniqueKey(f);
      if(!existing.has(key)){
        proofFilesBuffer.push(f);
        existing.add(key);
      }
    });

    renderProofPreviews();
    syncProofInputFromBuffer();
  });
}

function resetProofForm(){
  proofFilesBuffer = [];
  syncProofInputFromBuffer();
  if(previewEl) previewEl.innerHTML = '';
  if(proofFilesEl) { try{ proofFilesEl.value = ''; }catch{} }
  if(commentEl){
    commentEl.value = '';
    commentEl.style.height = 'auto';
  }
}
function openTrophyDetail(key){
  const t = (TROPHIES && TROPHIES[key]) || {};
  if(trophyTitleEl) trophyTitleEl.textContent = `${t.name || 'Трофей'}${t.emoji ? ' '+t.emoji : ''}`;
  if(trophyDescEl){
    trophyDescEl.innerHTML = '';
    (t.description || ['Описание скоро будет.']).forEach(line=>{
      const li = document.createElement('li');
      li.textContent = line;
      trophyDescEl.appendChild(li);
    });
  }
  resetProofForm();
  showScreen('trophyDetail');
}

// авто-рост textarea (трофеи)
if(commentEl){
  const autoResize = ()=>{
    commentEl.style.height = 'auto';
    commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
  };
  commentEl.addEventListener('input', autoResize);
  setTimeout(autoResize, 0);
}

let submitting = false;
function shake(el){
  if(!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  hapticERR();
}
async function submitProof(){
  if(submitting) return;
  submitting = true;
  setTimeout(()=>submitting=false, 1200);

  const filesCount = (proofFilesEl?.files?.length || 0);
  const comment    = (commentEl?.value || '').trim();

  if(filesCount === 0 || !comment){
    if(filesCount === 0) shake(proofUpload || proofFilesEl);
    if(!comment)         shake(commentEl);
    tg?.showPopup?.({ title:'Ошибка', message:'Добавьте медиа и комментарий.', buttons:[{type:'ok'}] });
    return;
  }

  hapticOK();
  tg?.showPopup?.({ title:'Заявка отправлена', message:'✅ Модераторы рассмотрят вашу заявку.' });
  resetProofForm();
  showScreen('trophies');
}

/* Навигация по системной кнопке «Назад» Telegram */
function handleBack(){
  switch(currentScreen){
    case 'profile':
    case 'trophies':
    case 'builds':
      showScreen('home'); break;
    case 'trophyDetail':
      resetProofForm();
      showScreen('trophies'); break;
    case 'buildCreate':
    case 'buildDetail':
      showScreen('builds'); break;
    default:
      showScreen('home'); break;
  }
}
if(tg){
  // Старый и новый варианты API — оба, чтобы работало везде
  tg.onEvent('backButtonClicked', handleBack);
  try{ tg.BackButton.onClick(handleBack); }catch{}
}

/* --- Навигация (главное меню) --- */
$('openProfileBtn')?.addEventListener('click', ()=> showScreen('profile'));
$('trophiesBtn')?.addEventListener('click', ()=> showScreen('trophies'));
$('buildsBtn')?.addEventListener('click', ()=> { renderMyBuilds(); showScreen('builds'); });

/* ===================== БИЛДЫ ===================== */
const LS_KEY_BUILDS = 'tsu_builds_v1';
const CLASS_VALUES = ['Самурай','Охотник','Убийца','Ронин'];
const TAG_VALUES   = ['HellMode','Спидран','Соло','Сюжет','Соперники'];
const CLASS_ICON = {
  'Самурай':'./samurai-wh.svg',
  'Охотник':'./hunter-wh.svg',
  'Убийца':'./assassin-wh.svg',
  'Ронин':'./ronin-wh.svg'
};

// Элементы
const myBuildsList   = $('myBuildsList');
const noBuildsHint   = $('noBuildsHint');
const createBuildBtn = $('createBuildBtn');

const buildForm      = $('buildForm');
const buildNameEl    = $('build_name');
const buildDescEl    = $('build_desc');
const classChipsEl   = $('classChips');
const tagsChipsEl    = $('tagsChips');

const shotInput1     = $('build_shot1');
const shotInput2     = $('build_shot2');
const shotsTwo       = $('shotsTwo');

const buildSubmitBtn = $('buildSubmitBtn');

const buildDetailTitle = $('buildDetailTitle');
const vd_class   = $('vd_class');
const vd_tags    = $('vd_tags');
const vd_desc    = $('vd_desc');
const buildDetailShots = $('buildDetailShots');

// Рендер чипов для формы билда
renderChips(classChipsEl, CLASS_VALUES, { single:true });
renderChips(tagsChipsEl,  TAG_VALUES);

// Авто-рост описания
if(buildDescEl){
  const autoResize2 = ()=>{
    buildDescEl.style.height = 'auto';
    buildDescEl.style.height = Math.min(buildDescEl.scrollHeight, 200) + 'px';
  };
  buildDescEl.addEventListener('input', autoResize2);
  setTimeout(autoResize2, 0);
}

// Helpers
function fileToDataURL(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function getShotInputByIdx(idx){ return idx === '1' ? shotInput1 : shotInput2; }
function renderShotThumb(idx, src){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'shot-thumb';
  btn.dataset.idx = String(idx);
  const img = document.createElement('img');
  img.src = src;
  btn.appendChild(img);
  btn.addEventListener('click', ()=>{
    const input = getShotInputByIdx(String(idx));
    if(!input) return;
    try{ input.value = ''; }catch{}
    input.click();
  });
  return btn;
}

// Два отдельных слота
let shot1Data = null;
let shot2Data = null;

// Делегирование клика по квадратам — надёжно в WebView
if(shotsTwo){
  shotsTwo.addEventListener('click', (e)=>{
    const box = e.target.closest('.upload-box');
    if(!box) return;
    const idx = box.dataset.idx;
    const input = getShotInputByIdx(idx);
    if(!input) return;
    try{ input.value = ''; }catch{}
    input.click();
  });
}

// Реакция на выбор файла
function bindShotInput(input, idx){
  input?.addEventListener('change', async ()=>{
    const file = input.files && input.files[0];
    if(!file) return;
    try{
      const data = await fileToDataURL(file);
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

// Storage
function loadBuilds(){
  try{
    const raw = localStorage.getItem(LS_KEY_BUILDS);
    return raw ? JSON.parse(raw) : [];
  }catch(_){ return []; }
}
function saveBuilds(arr){
  try{ localStorage.setItem(LS_KEY_BUILDS, JSON.stringify(arr||[])); }catch(_){}
}

// Рендер «Мои билды»
function renderMyBuilds(){
  const items = loadBuilds();
  myBuildsList.innerHTML = '';
  if(!items.length){
    noBuildsHint.style.display = 'block';
    return;
  }
  noBuildsHint.style.display = 'none';

  items.slice().reverse().forEach(b=>{
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
    const safeName = name.length > 40 ? (name.slice(0,40) + '…') : name;
    title.textContent = safeName;

    row.appendChild(icon);
    row.appendChild(title);
    row.addEventListener('click', ()=> openBuildDetail(b.id));

    myBuildsList.appendChild(row);
  });
}

// Открыть экран «Создать билд»
createBuildBtn?.addEventListener('click', ()=>{
  resetBuildForm();
  showScreen('buildCreate');
});

// Сброс формы билда
function resetBuildForm(){
  try{ buildForm?.reset(); }catch{}
  setActive(classChipsEl, []);
  setActive(tagsChipsEl,  []);
  if(shotInput1) shotInput1.value = '';
  if(shotInput2) shotInput2.value = '';
  shot1Data = null; shot2Data = null;

  if(shotsTwo){
    shotsTwo.innerHTML = `
      <button type="button" class="upload-box" data-idx="1" aria-label="Загрузить первое изображение">＋</button>
      <button type="button" class="upload-box" data-idx="2" aria-label="Загрузить второе изображение">＋</button>
    `;
  }
  if(buildDescEl) buildDescEl.style.height = 'auto';
}

// Только «Создать» (кнопка Отмена удалена)
buildSubmitBtn?.addEventListener('click', ()=> buildForm?.requestSubmit());

// Создание билда
if(buildForm){
  buildForm.addEventListener('submit', async (e)=>{
    e.preventDefault();

    let name = (buildNameEl?.value || '').trim();
    if(name.length > 40) name = name.slice(0,40);

    const klass = activeValues(classChipsEl)[0] || '';
    const tags  = activeValues(tagsChipsEl);
    const desc  = (buildDescEl?.value || '').trim();

    if(!name){ shake(buildNameEl); buildNameEl?.focus(); return; }
    if(!klass){ shake(classChipsEl); return; }
    if(!shot1Data || !shot2Data){
      shake(shotsTwo);
      return;
    }

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
    saveBuilds(all);

    hapticOK();
    tg?.showPopup?.({ title:'Билд создан', message:'Сохранено локально (макет, без сервера).', buttons:[{type:'ok'}] });

    renderMyBuilds();
    showScreen('builds');
  });
}

// Детали билда
function openBuildDetail(id){
  const all = loadBuilds();
  const b = all.find(x=> String(x.id) === String(id));
  if(!b){
    tg?.showAlert?.('Билд не найден');
    return;
  }
  buildDetailTitle.textContent = b.name || 'Билд';
  vd_class.textContent = b.class || '—';
  vd_tags.textContent  = (b.tags && b.tags.length) ? b.tags.join('\n') : '—';
  vd_desc.textContent  = b.desc || '—';

  buildDetailShots.innerHTML = '';
  (b.shots || []).forEach(src=>{
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'shot-thumb';
    const img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);
    wrap.addEventListener('click', ()=> openLightbox(src) );
    buildDetailShots.appendChild(wrap);
  });

  showScreen('buildDetail');
}

// Лайтбокс
const lightbox = $('lightbox');
const lightboxImg = $('lightboxImg');
function openLightbox(src){
  if(!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.remove('hidden');
}
function closeLightbox(){
  if(!lightbox) return;
  lightbox.classList.add('hidden');
}
lightbox?.addEventListener('click', closeLightbox);

// ===================== Старт =====================
(async function start(){
  applyTopSafeOffset();
  showScreen('home');
  const data = await loadTrophies();
  renderTrophyList(data);
  refreshProfileView();
  renderMyBuilds();
})();
