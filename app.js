(function(){
  // БЕЗ современного синтаксиса, чтобы Telegram WebView не тупил

  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  function onReady(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // ===== Хранилище: localStorage с fallback в память =====
  var STORAGE_KEY = 'demo_profile_v3';
  var memStore = null;

  function loadProfile(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw){ return JSON.parse(raw); }
    }catch(e){ /* no-op */ }
    return memStore || {
      real_name:'Дмитрий',
      psn:'swiezdo',
      platform:'🎮 PlayStation',
      modes:['🏹 Выживание','🗻 Испытания Иё'],
      goals:['🏆 Получение трофеев']
    };
  }
  function saveProfile(p){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    }catch(e){
      memStore = p; // если localStorage заблокирован — храним в памяти на сессию
    }
  }

  // ===== Отрисовка "чипов" =====
  var MODES = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
  var GOALS = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];

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
    var set = {};
    for(var i=0;i<selectedArr.length;i++){ set[selectedArr[i]] = true; }
    var nodes = container.querySelectorAll('.chip-btn');
    for(var j=0;j<nodes.length;j++){
      var val = nodes[j].getAttribute('data-value');
      if(set[val]) nodes[j].classList.add('active');
      else nodes[j].classList.remove('active');
    }
  }
  function getSelectedFromChips(container){
    var nodes = container.querySelectorAll('.chip-btn.active');
    var out = [];
    for(var i=0;i<nodes.length;i++){ out.push(nodes[i].getAttribute('data-value')); }
    return out;
  }

  // ===== Основная логика =====
  onReady(function(){
    // UI refs
    var userChip = document.getElementById('userChip');
    var form = document.getElementById('profileForm');
    var resetBtn = document.getElementById('resetBtn');

    var out = {
      real_name: document.getElementById('v_real_name'),
      psn:       document.getElementById('v_psn'),
      platform:  document.getElementById('v_platform'),
      modes:     document.getElementById('v_modes'),
      goals:     document.getElementById('v_goals'),
      difficulty:document.getElementById('v_difficulty'),
      trophies:  document.getElementById('v_trophies')
    };

    var modesChips = document.getElementById('modesChips');
    var goalsChips = document.getElementById('goalsChips');

    // Тема Телеграма (минимально)
    if(tg && tg.themeParams){
      try{
        var tp = tg.themeParams;
        if(tp.bg_color) document.documentElement.style.setProperty('--bg', tp.bg_color);
        if(tp.text_color) document.documentElement.style.setProperty('--fg', tp.text_color);
        if(tp.hint_color) document.documentElement.style.setProperty('--muted', tp.hint_color);
        if(tp.button_color) document.documentElement.style.setProperty('--accent', tp.button_color);
      }catch(e){}
      if(tg.ready) tg.ready();
      if(tg.expand) tg.expand();
      var me = tg.initDataUnsafe ? tg.initDataUnsafe.user : null;
      if(me && me.first_name){ userChip.textContent = me.first_name; }
    } else {
      userChip.textContent = 'Демо';
    }

    // Отрисовать чипы
    renderChips(modesChips, MODES);
    renderChips(goalsChips, GOALS);

    // Подготовить профиль
    var p = loadProfile();
    renderProfile(p);
    fillForm(p);
    setChipsActive(modesChips, p.modes || []);
    setChipsActive(goalsChips, p.goals || []);

    // Тоггл по клику на чип
    modesChips.addEventListener('click', function(e){
      if(e.target && e.target.classList.contains('chip-btn')){
        e.target.classList.toggle('active');
      }
    });
    goalsChips.addEventListener('click', function(e){
      if(e.target && e.target.classList.contains('chip-btn')){
        e.target.classList.toggle('active');
      }
    });

    // Сохранить
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var updated = {
        real_name: (form.real_name.value || '').trim(),
        psn:       (form.psn.value || '').trim(),
        platform:  form.platform.value || '',
        modes:     getSelectedFromChips(modesChips),
        goals:     getSelectedFromChips(goalsChips)
      };
      saveProfile(updated);
      renderProfile(updated); // мгновенно обновляем карточку
      try{ if(tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success'); }catch(e){}
    });

    // Сбросить к дефолту
    resetBtn.addEventListener('click', function(){
      var def = {
        real_name:'Дмитрий',
        psn:'swiezdo',
        platform:'🎮 PlayStation',
        modes:['🏹 Выживание','🗻 Испытания Иё'],
        goals:['🏆 Получение трофеев']
      };
      saveProfile(def);
      renderProfile(def);
      fillForm(def);
      setChipsActive(modesChips, def.modes);
      setChipsActive(goalsChips, def.goals);
      try{ if(tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light'); }catch(e){}
    });

    // helpers: отрисовать профиль и заполнить форму
    function renderProfile(p){
      out.real_name.textContent = p.real_name || '—';
      out.psn.textContent       = p.psn || '—';
      out.platform.textContent  = p.platform || '—';
      out.modes.textContent     = (p.modes && p.modes.length) ? p.modes.join(', ') : '—';
      out.goals.textContent     = (p.goals && p.goals.length) ? p.goals.join(', ') : '—';
      out.difficulty.innerHTML  = '👻 Кошмар<br>🔥 HellMode';
      out.trophies.innerHTML    = 'Легенда Цусимы 🗡<br>Легенда Эдзо 🏔';
    }
    function fillForm(p){
      form.real_name.value = p.real_name || '';
      form.psn.value       = p.psn || '';
      form.platform.value  = p.platform || '';
    }
  });
})();
