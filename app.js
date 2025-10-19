(function(){
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  function onReady(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  // ====== Storage (с fallback в память) ======
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

  // ====== Наборы значений для чипов ======
  var PLATFORM   = ['🎮 PlayStation','💻 ПК'];
  var MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
  var GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
  var DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

  // ====== Трофеи (подтягиваем из JSON на GitHub/локально) ======
  // Положи trophies.json в корень репозитория — либо укажи прямой URL GitHub Raw.
  var TROPHIES_URL = './trophies.json';

  // Встроенный дефолт на случай, если загрузка не удалась
  var TROPHIES_FALLBACK = {
    "trophy1": {
      "name": "Легенда Цусимы",
      "emoji": "🗡️",
      "description": [
        "Легенда Цусимы — получите платиновый трофей в игре Ghost of Tsushima.",
        "Доказательство: Скриншот с видимым PSN и платиновым призом."
      ]
    },
    "trophy2": {
      "name": "Легенда Эдзо",
      "emoji": "🏔",
      "description": [
        "Легенда Эдзо — получите платиновый трофей в Ghost of Yōtei.",
        "Доказательство: Скриншот с видимым PSN и платиновым призом."
      ]
    }
  };

  function fetchTrophies(){
    return fetch(TROPHIES_URL,{cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .catch(function(){ return JSON.parse(JSON.stringify(TROPHIES_FALLBACK)); });
  }

  // ===== helpers =====
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
  function showScreen(name, options){
    var home    = document
