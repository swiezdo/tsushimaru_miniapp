(function(){
  // Совместимый JS для Telegram WebView
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  function onReady(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  // ==== Storage (с fallback в память) ====
  var STORAGE_KEY = 'demo_profile_v6';
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

  // ==== Наборы значений для чипов ====
  var PLATFORM   = ['🎮 PlayStation','💻 ПК'];
  var MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
  var GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
  var DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

  function renderChips(container, values){
    container.innerHTML = '';
    for(var i=0;i<values.length;i++){
      var v = values[i];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip-btn';
      b.textContent = v;
      b.setAttribute('data-value', v);
      container.appendChild(b);
    }
  }
  function setChipsActive(container, selectedArr){
    var map = {};
    for(var i=0;i<selectedArr.length;i++) map[selectedArr[i]] = true;
    var nodes = container.querySelectorAll('.chip-btn');
    for(var j=0;j<nodes.length;j++){
      var val = nodes[j].getAttribute('data-value');
      if(map[val]) nodes[j].classList.add('active');
      else nodes[j].classList.remove('active');
    }
  }
  function getSelectedFromChips(container){
    var nodes = container.querySelectorAll('.chip-btn.active');
    var out = [];
    for(var i=0;i<nodes.length;i++) out.push(nodes[i].getAttribute('data-value'));
    return out;
  }
  function joinLines(arr){ return (arr && arr.length) ? arr.join('\n') : '—'; }

  // ===== Небольшая обратная связь =====
  function scrollTopSmooth(){
    try{ window.scrollTo({top:0, behavior:'smooth'}); }
    catch(e){ window.scrollTo(0,0); }
  }
  function showFeedback(message){
    try{
      if(tg && tg.showPopup){ tg.showPopup({title:'Готово', message: message}); return; }
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

  // ===== Навигация между экранами =====
  function showScreen(name){
    var home = document.getElementById('homeScreen');
    var prof = document.getElementById('profileScreen');
    var title = document.getElementById('appTitle');

    if(name === 'profile'){
      home.classList.add('hidden');
      prof.classList.remove('hidden');
      title.textContent = 'Профиль';
      scrollTopSmooth();
    } else {
      prof.classList.add('hidden');
      home.classList.remove('hidden');
      title.textContent = 'Tsushima.Ru';
      scrollTopSmooth();
    }
  }

  onReady(function(){
    // UI refs
    var userChip = document.getElementById('userChip');
    var form = document.getElementById('profileForm');
    var resetBtn = document.getElementById('resetBtn');

    var openProfileBtn = document.getElementById('openProfileBtn');
    var homeBtn = document.getElementById('homeBtn');
    var trophiesBtn = document.getElementById('trophiesBtn');
    var builderBtn = document.getElementById('builderBtn');

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

    // Тоггл по клику
    function toggleHandler(e){
      if(e.target && e.target.classList.contains('chip-btn')){
        e.target.classList.toggle('active');
      }
    }
    platformChips.addEventListener('click', toggleHandler);
    modesChips.addEventListener('click', toggleHandler);
    goalsChips.addEventListener('click', toggleHandler);
    difficultyChips.addEventListener('click', toggleHandler);

    // Сохранить
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
      renderProfile(updated); // мгновенное обновление карточки
      try{ if(tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success'); }catch(e){}
      scrollTopSmooth();
      showFeedback('Профиль обновлён');
    });

    // Сброс (полностью пусто)
    resetBtn.addEventListener('click', function(){
      var empty = {
        real_name:'', psn:'', platform:[], modes:[], goals:[], difficulty:[]
      };
      saveProfile(empty);
      renderProfile(empty);
      fillForm(empty);
      setChipsActive(platformChips,   []);
      setChipsActive(modesChips,      []);
      setChipsActive(goalsChips,      []);
      setChipsActive(difficultyChips, []);
      try{ if(tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light'); }catch(e){}
      scrollTopSmooth();
      showFeedback('Профиль очищен');
    });

    // Навигация
    openProfileBtn.addEventListener('click', function(){ showScreen('profile'); });
    homeBtn.addEventListener('click', function(){ showScreen('home'); });

    // Пока заглушки
    function soon(){ showFeedback('Скоро! В разработке.'); }
    trophiesBtn.addEventListener('click', soon);
    builderBtn.addEventListener('click', soon);

    // По умолчанию показываем Home
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
  });
})();
