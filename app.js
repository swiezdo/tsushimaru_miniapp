(function(){
  // ==== Telegram SDK (без изменения твоей логики) ====
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  function initTG(){
    if(!tg) return;
    try{
      tg.ready();
      tg.expand();
      var th = tg.themeParams || {};
      if(th.bg_color)   document.documentElement.style.setProperty('--tg-bg', th.bg_color);
      if(th.text_color) document.documentElement.style.setProperty('--tg-tx', th.text_color);
      if(th.hint_color) document.documentElement.style.setProperty('--tg-hint', th.hint_color);
      document.documentElement.classList.add('tg');
    }catch(e){}
  }
  function haptic(type){ try{ tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred(type); }catch(e){} }
  function tap(){ try{ tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred('light'); }catch(e){} }

  function onReady(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  // ==== Storage (с fallback в память) ====
  var STORAGE_KEY = 'demo_profile_v8';
  var memStore = null;

  function loadProfile(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return memStore || { real_name:'', psn:'', platform:[], modes:[], goals:[], difficulty:[] };
  }
  function saveProfile(p){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    catch(e){ memStore = p; }
  }

  // ==== Наборы для чипов (РОВНО как в твоём проекте) ====
  var PLATFORM   = ['🎮 PlayStation','💻 ПК'];
  var MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
  var GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
  var DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

  // ==== Источник трофеев ====
  // Для GitHub Pages подставь RAW-URL:
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
    var arr = [];
    container.querySelectorAll('.chip-btn.active').forEach(function(btn){
      arr.push(btn.getAttribute('data-value'));
    });
    return arr;
  }
  function joinLines(arr){
    if(!arr || !arr.length) return '—';
    return arr.join('\n');
  }

  function scrollTopSmooth(){ window.scrollTo({top:0, behavior:'smooth'}); }

  onReady(function(){
    initTG();

    // ==== Выходные поля профиля ====
    var out = {
      real_name:  document.getElementById('v_real_name'),
      psn:        document.getElementById('v_psn'),
      platform:   document.getElementById('v_platform'),
      modes:      document.getElementById('v_modes'),
      goals:      document.getElementById('v_goals'),
      difficulty: document.getElementById('v_difficulty'),
    };

    var platformChips   = document.getElementById('platformChips');
    var modesChips      = document.getElementById('modesChips');
    var goalsChips      = document.getElementById('goalsChips');
    var difficultyChips = document.getElementById('difficultyChips');

    renderChips(platformChips, PLATFORM);
    renderChips(modesChips, MODES);
    renderChips(goalsChips, GOALS);
    renderChips(difficultyChips, DIFFICULTY);

    var p = loadProfile();
    renderProfile(p);
    fillForm(p);
    setChipsActive(platformChips,   p.platform || []);
    setChipsActive(modesChips,      p.modes || []);
    setChipsActive(goalsChips,      p.goals || []);
    setChipsActive(difficultyChips, p.difficulty || []);

    // Клики по чипам (мультивыбор)
    document.addEventListener('click', function(e){
      var c = e.target.closest('.chip-btn');
      if(!c) return;
      c.classList.toggle('active');
      tap();
    }, {passive:true});

    // ==== Форма профиля ====
    var profileForm = document.getElementById('profileForm');
    var resetBtn    = document.getElementById('resetBtn');

    function renderProfile(p){
      out.real_name.textContent   = p.real_name || '—';
      out.psn.textContent         = p.psn || '—';
      out.platform.textContent    = joinLines(p.platform);
      out.modes.textContent       = joinLines(p.modes);
      out.goals.textContent       = joinLines(p.goals);
      out.difficulty.textContent  = joinLines(p.difficulty);
    }
    function fillForm(p){
      profileForm.real_name.value = p.real_name || '';
      profileForm.psn.value       = p.psn || '';
    }

    profileForm.addEventListener('submit', function(e){
      e.preventDefault();
      var updated = {
        real_name: profileForm.real_name.value.trim(),
        psn:       profileForm.psn.value.trim(),
        platform:  getSelectedFromChips(platformChips),
        modes:     getSelectedFromChips(modesChips),
        goals:     getSelectedFromChips(goalsChips),
        difficulty:getSelectedFromChips(difficultyChips)
      };
      saveProfile(updated);
      renderProfile(updated);
      haptic('success');
      showFeedback('Профиль обновлён');
      scrollTopSmooth();
    });

    resetBtn.addEventListener('click', function(){
      var empty = { real_name:'', psn:'', platform:[], modes:[], goals:[], difficulty:[] };
      saveProfile(empty);
      renderProfile(empty);
      fillForm(empty);
      setChipsActive(platformChips, []);
      setChipsActive(modesChips, []);
      setChipsActive(goalsChips, []);
      setChipsActive(difficultyChips, []);
      tap();
      showFeedback('Профиль очищен');
      scrollTopSmooth();
    });

    // ==== Трофеи: список + детали ====
    var trophyList      = document.getElementById('trophyList');
    var trophyTitle     = document.getElementById('trophyTitle');
    var trophyDesc      = document.getElementById('trophyDesc');
    var proofForm       = document.getElementById('proofForm');

    function fetchTrophies(){
      if(trophiesCache) return Promise.resolve(trophiesCache);
      return fetch(TROPHIES_JSON_URL, {cache:'no-store'})
        .then(function(r){ return r.json(); })
        .then(function(data){ trophiesCache = data || {}; return trophiesCache; })
        .catch(function(){ return {}; });
    }

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
        // Показ экрана и Telegram MainButton
        showScreen('trophyDetail');
        if(tg){
          tg.MainButton.setParams({ text: 'Отправить', is_active: true, is_visible: true });
          tg.MainButton.show();
          tg.BackButton.show();
        }
      });
    }

    populateTrophyList();

    // ==== Отправка заявки (тест) ====
    function submitProof(){
      var filesInput = document.getElementById('proofFiles');
      var commentEl  = document.getElementById('commentText'); // если добавлен в HTML
      var count = filesInput && filesInput.files ? filesInput.files.length : 0;
      var comment = commentEl ? (commentEl.value || '').trim() : '';

      if(count === 0 && !comment){
        if(tg && tg.showPopup){
          tg.showPopup({ title:'Нужно доказательство', message:'Добавьте файл и/или комментарий.', buttons:[{type:'ok'}] });
        } else {
          alert('Добавьте файл и/или комментарий.');
        }
        haptic('error');
        return;
      }
      // Здесь будет реальный аплоад на бэкенд.

      haptic('success');
      if(tg && tg.showPopup){
        tg.showPopup({ title:'Заявка отправлена', message:'Спасибо! Модераторы рассмотрят вашу заявку.', buttons:[{type:'ok'}] });
      } else {
        alert('Заявка отправлена (тест). Файлов: ' + count + (comment ? '\nКомментарий: ' + comment : ''));
      }
      showScreen('trophies');
      if(tg){
        tg.MainButton.hide();
        tg.BackButton.hide();
      }
    }

    proofForm.addEventListener('submit', function(e){
      e.preventDefault();
      submitProof();
    });

    // ==== Навигация и клики ====
    function showTopbar(visible, title){
      var tb = document.querySelector('.topbar');
      if(!tb) return;
      tb.style.display = visible ? 'flex' : 'none';
      if(title) document.getElementById('appTitle').textContent = title;
    }

    function showScreen(name){
      var screens = ['homeScreen','profileScreen','trophiesScreen','trophyDetailScreen'];
      screens.forEach(function(id){ document.getElementById(id).classList.add('hidden'); });

      if(name === 'home'){
        document.getElementById('homeScreen').classList.remove('hidden');
        showTopbar(false);
      } else if(name === 'profile'){
        document.getElementById('profileScreen').classList.remove('hidden');
        showTopbar(true, 'Профиль');
      } else if(name === 'trophies'){
        document.getElementById('trophiesScreen').classList.remove('hidden');
        showTopbar(true, 'Трофеи');
      } else if(name === 'trophyDetail'){
        document.getElementById('trophyDetailScreen').classList.remove('hidden');
        showTopbar(true, 'Трофеи');
      }
      scrollTopSmooth();
    }

    document.addEventListener('click', function(e){
      var t = e.target.closest('button, a.big-btn');
      if(!t) return;

      // Домой
      if(t.id === 'homeBtn' || t.id === 'trophiesHomeBtn'){
        showScreen('home');
        e.preventDefault();
        return;
      }

      // Открыть профиль
      if(t.id === 'openProfileBtn'){
        showScreen('profile');
        e.preventDefault();
        return;
      }

      // Открыть список трофеев
      if(t.id === 'trophiesBtn'){
        showScreen('trophies');
        e.preventDefault();
        return;
      }

      // Назад к списку трофеев
      if(t.id === 'backToListBtn'){
        showScreen('trophies');
        e.preventDefault();
        return;
      }

      // Кнопка конкретного трофея
      if(t.classList.contains('list-btn') && t.dataset.id){
        openTrophyDetail(t.dataset.id);
        e.preventDefault();
        return;
      }
      // Ссылку на группу (a.big-btn без id) не перехватываем — пусть открывается.
    }, {passive:true});

    // Telegram MainButton/BackButton
    if(tg){
      tg.onEvent('mainButtonClicked', submitProof);
      tg.onEvent('backButtonClicked', function(){ showScreen('trophies'); tg.MainButton.hide(); tg.BackButton.hide(); });
    }

    // Старт: Домой
    showScreen('home');
  });
})();
