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
  }catch(e){}
})();
function hapticOK(){ try{ tg?.HapticFeedback?.notificationOccurred('success'); }catch{} }
function hapticERR(){ try{ tg?.HapticFeedback?.notificationOccurred('error'); }catch{} }
// Тап-хаптик отключён глобально (по задаче)
function hapticTap(){}

// Утилиты
function $(id){ return document.getElementById(id); }
function scrollTopSmooth(){ window.scrollTo({top:0, behavior:'smooth'}); }

// ===== Отступ сверху под системные элементы Telegram =====
const TOP_OFFSET_PX = 64; // ≈ 4 строки
function applyTopInset(){
  const root = document.querySelector('main.container');
  if(!root) return;
  root.style.paddingTop = `calc(env(safe-area-inset-top, 0px) + ${TOP_OFFSET_PX}px)`;
}
window.addEventListener('resize', applyTopInset);

// ===== Подсветка при тапе + тактильная отдача =====
// Полностью отключено (не добавляем классы/слушатели)
function addTapHighlight(/* selector */){ /* disabled by request */ }

// --- Screens ---
const screens = {
  home: $('homeScreen'),
  profile: $('profileScreen'),
  trophies: $('trophiesScreen'),
  trophyDetail: $('trophyDetailScreen'),
  builds: $('buildsScreen'),
  buildCreate: $('buildCreateScreen'),
  buildDetail: $('buildDetailScreen'),
};
function isVisible(name){
  const el = screens[name];
  return el && !el.classList.contains('hidden');
}
function setTopbar(visible, title){
  const tb = document.querySelector('.topbar');
  if(tb) tb.style.display = visible ? 'flex' : 'none';
  if(title) { const t = $('appTitle'); if(t) t.textContent = title; }
}

function showScreen(name){
  Object.values(screens).forEach(el => el && el.classList.add('hidden'));
  const el = screens[name];
  if(el) el.classList.remove('hidden');

  if(tg){
    if (['profile','trophies','builds','buildCreate','buildDetail','trophyDetail'].includes(name)){
      tg.BackButton.show();
      if(name === 'trophyDetail') ensureInlineSubmitButton();
    } else {
      tg.BackButton.hide();
    }
  }

  if(name === 'home') setTopbar(false);
  else if(name === 'profile') setTopbar(true, 'Профиль');
  else if(name === 'trophies') setTopbar(true, 'Трофеи');
  else if(name === 'trophyDetail') setTopbar(true, 'Трофеи');
  else if(name === 'builds') setTopbar(true, 'Билды');
  else if(name === 'buildCreate') setTopbar(true, 'Создать билд');
  else if(name === 'buildDetail') setTopbar(true, 'Билд');

  scrollTopSmooth();
}

// inline «Отправить» на экране трофея
function ensureInlineSubmitButton(){
  const backBtn = $('backToListBtn'); // кнопки больше нет — будет undefined
  const form = $('proofForm');

  if(backBtn && backBtn.parentNode){
    let submitInline = $('submitInlineBtn');
    if(!submitInline){
      submitInline = document.createElement('button');
      submitInline.id = 'submitInlineBtn';
      submitInline.className = backBtn.className || 'btn';
      submitInline.textContent = 'Отправить';
      backBtn.parentNode.insertBefore(submitInline, backBtn);
      submitInline.style.marginBottom = '8px';
    }else{
      submitInline.textContent = 'Отправить';
    }
    submitInline.onclick = (e)=>{ e.preventDefault(); submitProof(); };
    // Хаптик только для этой кнопки
    submitInline.addEventListener('pointerdown', ()=>{ try{ tg?.HapticFeedback?.impactOccurred('light'); }catch{} });
    return;
  }

  if(form){
    let submitInline = $('submitInlineBtn');
    if(!submitInline){
      submitInline = document.createElement('button');
      submitInline.id = 'submitInlineBtn';
      submitInline.type = 'button';
      submitInline.className = 'btn primary wide';
      submitInline.textContent = 'Отправить';
      form.appendChild(submitInline);
    }
    submitInline.onclick = (e)=>{ e.preventDefault(); submitProof(); };
    // Хаптик только для этой кнопки
    submitInline.addEventListener('pointerdown', ()=>{ try{ tg?.HapticFeedback?.impactOccurred('light'); }catch{} });
  }
}

// Header user chip
(function(){
  const chip = $('userChip');
  const uname = tg?.initDataUnsafe?.user?.username;
  if(chip && uname) chip.textContent = '@' + uname;
})();

// Chips (профиль)
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
      // tap-хаптик отключён
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

// Профиль: отображение
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

// Профиль: форма
const profileForm     = $('profileForm');
const profileSaveBtn  = $('profileSaveBtn');

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

  // Хаптик только на нажатие «Сохранить»
  profileSaveBtn?.addEventListener('pointerdown', ()=>{ try{ tg?.HapticFeedback?.impactOccurred('light'); }catch{} });
  profileSaveBtn?.addEventListener('click', ()=> profileForm.requestSubmit());
}

// --- Трофеи ---
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

  // Подсветка/хаптик — отключены глобально
}

const proofFormEl  = $('proofForm');
const proofFilesEl = $('proofFiles');
const commentEl    = $('commentText');
const previewEl    = $('filePreview');

function resetProofForm(){
  if(previewEl) previewEl.innerHTML = '';
  if(proofFilesEl) proofFilesEl.value = '';
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

// превью файлов (трофеи)
if(proofFilesEl && previewEl){
  proofFilesEl.addEventListener('change', ()=>{
    previewEl.innerHTML = '';
    const files = Array.from(proofFilesEl.files || []);
    if(!files.length) return;
    const limit = 5;
    files.slice(0, limit).forEach(file=>{
      const div = document.createElement('div');
      div.className = 'preview-item';
      if(file.type.startsWith('image/')){
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = ()=> URL.revokeObjectURL(img.src);
        div.appendChild(img);
      } else if(file.type.startsWith('video/')){
        const vid = document.createElement('div');
        vid.textContent = '🎥';
        div.appendChild(vid);
      } else {
        div.textContent = '📄';
      }
      previewEl.appendChild(div);
    });
    if(files.length > limit){
      const more = document.createElement('div');
      more.className = 'preview-more';
      more.textContent = `+${files.length - limit}`;
      previewEl.appendChild(more);
    }
  });
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

  const filesCount = proofFilesEl?.files?.length || 0;
  const comment    = (commentEl?.value || '').trim();

  if(filesCount === 0 || !comment){
    if(!filesCount) shake(proofFilesEl.closest('.form-group') || proofFilesEl);
    if(!comment)    shake(commentEl);
    if(tg?.showPopup){
      tg.showPopup({ title:'Ошибка', message:'Добавьте файл и комментарий.', buttons:[{type:'ok'}] });
    }
    return;
  }

  hapticOK();
  if(tg?.showPopup){
    tg.showPopup({ title:'Заявка отправлена', message:'✅ Модераторы рассмотрят вашу заявку.' });
  }
  resetProofForm();
  showScreen('trophies');
}

// Навигация «трофеи»
if(proofFormEl){
  proofFormEl.addEventListener('submit', (e)=>{ e.preventDefault(); submitProof(); });
}
$('backToListBtn')?.addEventListener('click', ()=>{
  resetProofForm();
  showScreen('trophies');
});

// Системная назад-кнопка Telegram — маршрутизация
if(tg){
  tg.onEvent('backButtonClicked', ()=>{
    if (isVisible('buildCreate')) { showScreen('builds'); return; }
    if (isVisible('buildDetail')) { showScreen('builds'); return; }
    if (isVisible('trophyDetail')) { resetProofForm(); showScreen('trophies'); return; }
    if (isVisible('profile') || isVisible('trophies') || isVisible('builds')) { showScreen('home'); return; }
    showScreen('home');
  });
}

// --- Навигация (главное меню) ---
$('openProfileBtn')?.addEventListener('click', ()=> showScreen('profile'));
$('trophiesBtn')?.addEventListener('click', ()=> showScreen('trophies'));
$('buildsBtn')?.addEventListener('click', ()=> { renderMyBuilds(); showScreen('builds'); });

// Подсветка для кнопок на главном экране — отключено
addTapHighlight('.big-btn');

// ===================== БИЛДЫ =====================
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
  const autoResize = ()=>{
    buildDescEl.style.height = 'auto';
    buildDescEl.style.height = Math.min(buildDescEl.scrollHeight, 200) + 'px';
  };
  buildDescEl.addEventListener('input', autoResize);
  setTimeout(autoResize, 0);
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
function getShotInputByIdx(idx){
  return idx === '1' ? shotInput1 : shotInput2;
}
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

// Два отдельных слота: по одному файлу
let shot1Data = null;
let shot2Data = null;

// Делегирование клика по квадратам
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
      // tap-хаптик отключён
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

  // Подсветка/хаптик — отключены глобально
}

// Открыть экран «Создать билд»
createBuildBtn?.addEventListener('click', ()=>{
  resetBuildForm();
  showScreen('buildCreate');
});
// Хаптик только на кнопку «Создать билд» (на экране «Билды»)
createBuildBtn?.addEventListener('pointerdown', ()=>{ try{ tg?.HapticFeedback?.impactOccurred('light'); }catch{} });

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

// Кнопка «Создать»
buildSubmitBtn?.addEventListener('pointerdown', ()=>{ try{ tg?.HapticFeedback?.impactOccurred('light'); }catch{} });
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
$('backToBuildsBtn')?.addEventListener('click', ()=> showScreen('builds'));

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
  applyTopInset();
  showScreen('home');
  const data = await loadTrophies();
  renderTrophyList(data);
  refreshProfileView();
  renderMyBuilds();

  // подсветка для кнопок на главной отключена
})();
