(function(){
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  function onReady(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  // ==== Storage (с fallback в память) ====
  var STORAGE_KEY = 'demo_profile_v7';
  var memStore = null;

  function loadProfile(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return memStore || {
      real_name:'Дмитрий',
      psn:'swiezdo',
      platform:['🎮 PlayStation'],
      modes:['🏹 Выживание','🗻 Испытания Иё'],
      goals:['🏆 Получение трофеев'],
      difficulty:['👻 Кошмар','🔥 HellMode']
    };
  }
  function saveProfile(p){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    catch(e){ memStore = p; }
  }

  // ==== Наборы для чипов ====
  var PLATFORM   = ['🎮 PlayStation','💻 ПК'];
  var MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
  var GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
  var DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

  // ==== Источник трофеев ====
  // Поменяй на свой RAW-URL GitHub, например:
  // const TROPHIES_JSON_URL = 'https://raw.githubusercontent.com/USERNAME/REPO/BRANCH/trophies.json';
  const TROPHIES_JSON_URL = './trophies.json';
  var trophiesCache = null;

  function renderChips(container, values){
    container.innerHTML = '';
    values.forEach(function(v){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip-btn';
      b.textContent = v;
      b.setAttribute('data-value', v);
      container.appendChild(b);
    });
  }
  function setChipsActive(container, selectedArr){
    var set = new Set(selectedArr || []);
    container.querySelectorAll('.chip-btn').forEach(function(btn){
      var val = btn.getAttribute('data-value');
      btn.classList.toggle('active', set.has(val));
    });
  }
  function getSelectedFromChips(container){
    return Array.from(container.querySelectorAll('.chip-btn.active')).map(function(b){ return b.getAttribute('data-value'); });
  }
  function joinLines(arr){ return (arr && arr.length) ? arr.join('\n') : '—'; }

  // ===== Вспомогательные UI =====
  function scrollTopSmooth(){ try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); } }
  function showFeedback(message){
    try{
      if(tg && tg.showPopup){ tg.showPopup({title:'Готово', message}); return; }
    }catch(e){}
    var t = document.createElement('div');
    t.textContent = message;
    t.style.position = 'fixed';
    t.style.top = '12px';
    t.style.left = '50%';
    t.style.transform = 'translateX(-50%)';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '12px';
    t.style.border = '1px solid var(--stroke)';
    t.style.background = 'var(--card)';
    t.style.color = 'var(--fg)';
    t.style.zIndex = '9999';
    t.style.boxShadow = '0 4px 16px rgba(0,0,0,.25)';
    document.body.appendChild(t);
    setTimeout(function(){ if(t && t.parentNode) t.parentNode.removeChild(t); }, 1600);
  }

  // ===== Навигация =====
  function showTopbar(show, title){
    var tb = document.querySelector('.topbar');
    tb.style.display = show ? 'flex' : 'none';
    if(title) document.getElementById('appTitle').textContent = title;
  }

  function showScreen(name) {
    ['homeScreen', 'profileScreen', 'trophiesScreen', 'trophyDetailScreen']
      .forEach(id => document.getElementById(id).classList.add('hidden'));

    if (name === 'home') {
      document.getElementById('homeScreen').classList.remove('hidden');
      showTopbar(false);
    } else if (name === 'profile') {
      document.getElementById('profileScreen').classList.remove('hidden');
      showTopbar(true, 'Профиль');
    } else if (name === 'trophies') {
      document.getElementById('trophiesScreen').classList.remove('hidden');
      showTopbar(true, 'Трофеи');
    } else if (name === 'trophyDetail') {
      document.getElementById('trophyDetailScreen').classList.remove('hidden');
      showTopbar(true, 'Трофеи');
    }
    scrollTopSmooth();
  }

  // ===== Трофеи (данные) =====
  function fetchTrophies(){
    if(trophiesCache) return Promise.resolve(trophiesCache);
    return fetch(TROPHIES_JSON_URL, {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(data){ trophiesCache = data || {}; return trophiesCache; })
      .catch(function(){ return {}; });
  }

  // ===== Инициализация =====
  onReady(function(){
    // UI refs
    var userChip = document.getElementById('userChip');

    // Home
    var openProfileBtn = document.getElementById('openProfileBtn');
    var trophiesBtn    = document.getElementById('trophiesBtn');
    var builderBtn     = document.getElementById('builderBtn');

    // Profile
    var form = document.getElementById('profileForm');
    var resetBtn = document.getElementById('resetBtn');
    var homeBtn = document.getElementById('homeBtn');

    var out = {
      real_name:  document.getElementById('v_real_name'),
      psn:        document.getElementById('v_psn'),
      platform:   document.getElementById('v_platform'),
      modes:      document.getElementById('v_modes'),
      goals:      document.getElementById('v_goals'),
      difficulty: document.getElementById('v_difficulty'),
      trophies:   document.getElementById('v_trophies')
    };

    var platformChips   = document.getElementById('platformChips');
    var modesChips      = document.getElementById('modesChips');
    var goalsChips      = document.getElementById('goalsChips');
    var difficultyChips = document.getElementById('difficultyChips');

    // Trophies
    var trophyList     = document.getElementById('trophyList');
    var trophiesHomeBtn= document.getElementById('trophiesHomeBtn');

    // Trophy detail
    var trophyTitle = document.getElementById('trophyTitle');
    var trophyDesc  = document.getElementById('trophyDesc');
    var proofForm   = document.getElementById('proofForm');
    var backToListBtn = document.getElementById('backToListBtn');

    // Тема Telegram (минимально)
    try{
      if(tg && tg.themeParams){
        var tp = tg.themeParams;
        if(tp.bg_color)     document.documentElement.style.setProperty('--bg', tp.bg_color);
        if(tp.text_color)   document.documentElement.style.setProperty('--fg', tp.text_color);
        if(tp.hint_color)   document.documentElement.style.setProperty('--muted', tp.hint_color);
        if(tp.button_color) document.documentElement.style.setProperty('--accent', tp.button_color);
        if(tg.ready) tg.ready();
        if(tg.expand) tg.expand();
        var me = tg.initDataUnsafe ? tg.initDataUnsafe.user : null;
        if(me && me.first_name) userChip.textContent = me.first_name;
        else userChip.textContent = 'Пользователь';
      } else {
        userChip.textContent = 'Демо';
      }
    }catch(e){}

    // Рисуем чипы
    renderChips(platformChips, PLATFORM);
    renderChips(modesChips, MODES);
    renderChips(goalsChips, GOALS);
    renderChips(difficultyChips, DIFFICULTY);

    // Профиль -> форма
    var p = loadProfile();
    renderProfile(p);
    fillForm(p);
    setChipsActive(platformChips,   p.platform || []);
    setChipsActive(modesChips,      p.modes || []);
    setChipsActive(goalsChips,      p.goals || []);
    setChipsActive(difficultyChips, p.difficulty || []);

    // Тоггл по клику (чипы)
    function toggleHandler(e){
      if(e.target && e.target.classList.contains('chip-btn')){
        e.target.classList.toggle('active');
      }
    }
    platformChips.addEventListener('click', toggleHandler);
    modesChips.addEventListener('click', toggleHandler);
    goalsChips.addEventListener('click', toggleHandler);
    difficultyChips.addEventListener('click', toggleHandler);

    // Сохранить профиль
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var updated = {
        real_name: (form.real_name.value || '').trim(),
        psn:       (form.psn.value || '').trim(),
        platform:  getSelectedFromChips(platformChips),
        modes:     getSelectedFromChips(modesChips),
        goals:     getSelectedFromChips(goalsChips),
        difficulty:getSelectedFromChips(difficultyChips)
      };
      saveProfile(updated);
      renderProfile(updated);
      try{ if(tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success'); }catch(e){}
      showFeedback('Профиль обновлён');
      scrollTopSmooth();
    });

    // Сброс профиля
    resetBtn.addEventListener('click', function(){
      var empty = { real_name:'', psn:'', platform:[], modes:[], goals:[], difficulty:[] };
      saveProfile(empty);
      renderProfile(empty);
      fillForm(empty);
      setChipsActive(platformChips, []);
      setChipsActive(modesChips, []);
      setChipsActive(goalsChips, []);
      setChipsActive(difficultyChips, []);
      try{ if(tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light'); }catch(e){}
      showFeedback('Профиль очищен');
      scrollTopSmooth();
    });

    // Делегирование кликов — работает даже если что-то рендерится позже
    document.addEventListener('click', function (e) {
      const t = e.target.closest('button, a.big-btn'); // ловим и <button>, и нашу большую <a>
      if (!t) return;

      // Не даём тексту выделяться/перетаскиваться при длинном тапе
      t.blur();

      // Домой (из профиля / трофеев)
      if (t.id === 'homeBtn' || t.id === 'trophiesHomeBtn') {
        showScreen('home');
        e.preventDefault();
        return;
      }

      // Открыть профиль
      if (t.id === 'openProfileBtn') {
        showScreen('profile');
        e.preventDefault();
        return;
      }

      // Открыть список трофеев
      if (t.id === 'trophiesBtn') {
        populateTrophyList();
        showScreen('trophies');
        e.preventDefault();
        return;
      }

      // Назад к списку трофеев
      if (t.id === 'backToListBtn') {
        showScreen('trophies');
        e.preventDefault();
        return;
      }

      // Кнопка «трофей в списке»
      if (t.classList.contains('list-btn') && t.dataset.id) {
        openTrophyDetail(t.dataset.id);
        e.preventDefault();
        return;
      }
    }, { passive: true });


    // Заглушка билдера
    function soon(){ showFeedback('Скоро! В разработке.'); }
    builderBtn.addEventListener('click', soon);

    // По умолчанию — Домой
    showScreen('home');

    function renderProfile(p){
      out.real_name.textContent   = p.real_name || '—';
      out.psn.textContent         = p.psn || '—';
      out.platform.textContent    = joinLines(p.platform);
      out.modes.textContent       = joinLines(p.modes);
      out.goals.textContent       = joinLines(p.goals);
      out.difficulty.textContent  = joinLines(p.difficulty);
      out.trophies.innerHTML      = 'Легенда Цусимы 🗡<br>Легенда Эдзо 🏔';
    }
    function fillForm(p){
      form.real_name.value = p.real_name || '';
      form.psn.value       = p.psn || '';
    }

    // ====== ТРОФЕИ: список + детали ======
    function populateTrophyList(){
      fetchTrophies().then(function(data){
        trophyList.innerHTML = '';
        Object.keys(data).forEach(function(key){
          var t = data[key];
          var btn = document.createElement('button');
          btn.className = 'list-btn';
          btn.type = 'button';
          btn.setAttribute('data-id', key);
          btn.innerHTML = '<span>' + (t.name || key) + ' ' + (t.emoji || '') + '</span><span class="right">›</span>';
          btn.addEventListener('click', function(){ openTrophyDetail(key); });
          trophyList.appendChild(btn);
        });
      });
    }

    function openTrophyDetail(key){
      fetchTrophies().then(function(data){
        var t = data[key] || {};
        var title = (t.name || 'Трофей') + (t.emoji ? ' ' + t.emoji : '');
        trophyTitle.textContent = title;
        trophyDesc.innerHTML = '';
        (t.description || ['Описание скоро будет.']).forEach(function(line){
          var li = document.createElement('li');
          li.textContent = line;
          trophyDesc.appendChild(li);
        });
        showScreen('trophyDetail');
      });
    }

    // Отправка заявки (тест)
    proofForm.addEventListener('submit', function(e){
      e.preventDefault();
      var files = document.getElementById('proofFiles').files;
      var count = files ? files.length : 0;
      // тут в будущем: отправка в админ-группу
      showFeedback('Заявка отправлена (тест). Файлов: ' + count);
      try{ if(tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success'); }catch(e){}
      showScreen('trophies');
    });
  });
})();
