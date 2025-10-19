// --- Telegram WebApp init (безопасно) ---
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
  }catch(e){}
})();
function hapticOK(){ try{ tg?.HapticFeedback?.notificationOccurred('success'); }catch{} }
function hapticERR(){ try{ tg?.HapticFeedback?.notificationOccurred('error'); }catch{} }
function hapticTap(){ try{ tg?.HapticFeedback?.impactOccurred('light'); }catch{} }

// --- DOM helpers ---
function $(id){ return document.getElementById(id); }
function scrollTopSmooth(){ window.scrollTo({top:0, behavior:'smooth'}); }

// --- Screens ---
const screens = {
  home: $('homeScreen'),
  profile: $('profileScreen'),
  trophies: $('trophiesScreen'),
  trophyDetail: $('trophyDetailScreen'),
};
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
    if(name === 'trophyDetail'){
      tg.MainButton.setParams({ text: 'Отправить', is_active: true, is_visible: true });
      tg.MainButton.show();
      tg.BackButton.show();
    } else {
      tg.MainButton.hide();
      tg.BackButton.hide();
    }
  }

  if(name === 'home') setTopbar(false);
  else if(name === 'profile') setTopbar(true, 'Профиль');
  else if(name === 'trophies') setTopbar(true, 'Трофеи');
  else if(name === 'trophyDetail') setTopbar(true, 'Трофеи');

  scrollTopSmooth();
}

// --- Header user chip ---
(function(){
  const chip = $('userChip');
  const uname = tg?.initDataUnsafe?.user?.username;
  if(chip && uname) chip.textContent = '@' + uname;
})();

// --- ЧИПЫ ---
const PLATFORM   = ['🎮 PlayStation','💻 ПК'];
const MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
const GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
const DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

function renderChips(container, values){
  if(!container) return;
  container.innerHTML = '';
  values.forEach(v=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-btn';
    b.textContent = v;
    b.dataset.value = v;
    b.addEventListener('click', ()=>{
      b.classList.toggle('active');
      hapticTap();
      refreshProfileView();
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

// --- Профиль: отображение ---
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

// --- Профиль: форма ---
const profileForm = $('profileForm');
const resetBtn    = $('resetBtn');

if(profileForm){
  renderChips($('platformChips'),   PLATFORM);
  renderChips($('modesChips'),      MODES);
  renderChips($('goalsChips'),      GOALS);
  renderChips($('difficultyChips'), DIFFICULTY);

  // --- PSN validation ---
  const psnInput = profileForm.psn;
  const psnError = document.createElement('div');
  psnError.className = 'error-text';
  psnInput?.parentNode?.appendChild(psnError);

  function validatePSN(){
    if(!psnInput) return true;
    const val = psnInput.value.trim();
    const ok = /^[A-Za-z0-9_-]{3,16}$/.test(val);
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

// --- Трофеи: загрузка и список ---
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
  showScreen('trophyDetail');
}

// --- Трофеи: отправка заявки ---
const proofFormEl  = $('proofForm');
const proofFilesEl = $('proofFiles');
const commentEl    = $('commentText');
const previewEl    = $('filePreview');

if(commentEl){
  commentEl.addEventListener('input', ()=>{
    commentEl.style.height = 'auto';
    commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
  });
}

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
  setTimeout(()=>submitting=false, 1500);

  const filesCount = proofFilesEl?.files?.length || 0;
  const comment = (commentEl?.value || '').trim();

  if(filesCount === 0 || !comment){
    if(!filesCount) shake(proofFilesEl.closest('.form-group') || proofFilesEl);
    if(!comment) shake(commentEl);
    if(tg?.showPopup){
      tg.showPopup({ title:'Ошибка', message:'Добавьте файл и комментарий.', buttons:[{type:'ok'}] });
    }
    return;
  }

  hapticOK();
  if(tg?.showPopup){
    tg.showPopup({ title:'Заявка отправлена', message:'✅ Спасибо! Модераторы рассмотрят вашу заявку.' });
  }

  if(previewEl) previewEl.innerHTML = '';
  if(proofFilesEl) proofFilesEl.value = '';
  if(commentEl) commentEl.value = '';

  const form = document.querySelector('.application-form');
  if(form){
    form.innerHTML = `<div class="success-message">Заявка отправлена ✅</div>
      <button id="backButton" class="button">Назад</button>`;
    $('backButton')?.addEventListener('click', ()=> showScreen('trophies'));
  }
}

if(proofFormEl){ proofFormEl.addEventListener('submit', e=>{ e.preventDefault(); submitProof(); }); }
if(tg){
  tg.onEvent('mainButtonClicked', submitProof);
  tg.onEvent('backButtonClicked', ()=> showScreen('trophies'));
}

// --- Навигация ---
$('openProfileBtn')?.addEventListener('click', ()=> showScreen('profile'));
$('trophiesBtn')?.addEventListener('click', ()=> showScreen('trophies'));
$('homeBtn')?.addEventListener('click', ()=> showScreen('home'));
$('trophiesHomeBtn')?.addEventListener('click', ()=> showScreen('home'));
$('backToListBtn')?.addEventListener('click', ()=> showScreen('trophies'));

// --- Старт ---
(async function start(){
  showScreen('home');
  const data = await loadTrophies();
  renderTrophyList(data);
  refreshProfileView();
})();
