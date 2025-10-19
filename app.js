(function(){
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  function onReady(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  const TROPHIES_JSON_URL = './trophies.json';
  let trophiesCache = null;

  function fetchTrophies(){
    if(trophiesCache) return Promise.resolve(trophiesCache);
    return fetch(TROPHIES_JSON_URL).then(r=>r.json()).catch(()=>({}));
  }

  function showTopbar(show, title){
    const tb = document.querySelector('.topbar');
    tb.style.display = show ? 'flex' : 'none';
    if(title) document.getElementById('appTitle').textContent = title;
  }

  function showScreen(name){
    ['homeScreen','profileScreen','trophiesScreen','trophyDetailScreen']
      .forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(name + 'Screen').classList.remove('hidden');
    if(name==='home') showTopbar(false);
    else if(name==='profile') showTopbar(true,'Профиль');
    else if(name==='trophies'||name==='trophyDetail') showTopbar(true,'Трофеи');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function showFeedback(msg){
    const t=document.createElement('div');
    t.textContent=msg;
    Object.assign(t.style,{
      position:'fixed',top:'12px',left:'50%',transform:'translateX(-50%)',
      padding:'10px 14px',borderRadius:'12px',border:'1px solid var(--stroke)',
      background:'var(--secondary)',color:'var(--fg)',zIndex:'9999',
      boxShadow:'0 4px 16px rgba(0,0,0,.25)'
    });
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1600);
  }

  function applyTheme(){
    if(!tg) return;
    const root = document.documentElement;
    // CSS уже читает Telegram CSS variables, обновлять ничего не нужно
    document.body.classList.toggle('tg-dark', tg.colorScheme === 'dark');
  }

  onReady(function(){
    try{
      if(tg){
        applyTheme();
        tg.onEvent('themeChanged', applyTheme);
        if(tg.ready) tg.ready();
        if(tg.expand) tg.expand();
        const me = tg.initDataUnsafe ? tg.initDataUnsafe.user : null;
        const userChip = document.getElementById('userChip');
        userChip.textContent = (me && me.first_name) ? me.first_name : 'Пользователь';
      }
    }catch(e){}

    document.addEventListener('click',e=>{
      const t=e.target.closest('button, a.big-btn');
      if(!t)return;
      if(t.id==='homeBtn'||t.id==='trophiesHomeBtn'){showScreen('home');return;}
      if(t.id==='openProfileBtn'){showScreen('profile');return;}
      if(t.id==='trophiesBtn'){populateTrophyList();showScreen('trophies');return;}
      if(t.id==='backToListBtn'){showScreen('trophies');return;}
      if(t.classList.contains('list-btn')&&t.dataset.id){openTrophyDetail(t.dataset.id);return;}
    });

    // Профиль
    const form=document.getElementById('profileForm');
    const resetBtn=document.getElementById('resetBtn');

    const out={
      real_name:document.getElementById('v_real_name'),
      psn:document.getElementById('v_psn'),
      platform:document.getElementById('v_platform'),
      modes:document.getElementById('v_modes'),
      goals:document.getElementById('v_goals'),
      difficulty:document.getElementById('v_difficulty')
    };

    const PLATFORM=['🎮 PlayStation','💻 ПК'];
    const MODES=['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
    const GOALS=['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
    const DIFFICULTY=['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

    function renderChips(container,values){
      container.innerHTML='';
      values.forEach(v=>{
        const b=document.createElement('button');
        b.type='button';b.className='chip-btn';b.textContent=v;b.dataset.value=v;
        container.appendChild(b);
      });
    }
    function setChipsActive(container,selected){
      const set=new Set(selected||[]);
      container.querySelectorAll('.chip-btn').forEach(btn=>btn.classList.toggle('active',set.has(btn.dataset.value)));
    }
    function getSelected(container){
      return Array.from(container.querySelectorAll('.chip-btn.active')).map(b=>b.dataset.value);
    }
    function joinLines(arr){return (arr&&arr.length)?arr.join('\n'):'—';}

    const platformChips=document.getElementById('platformChips');
    const modesChips=document.getElementById('modesChips');
    const goalsChips=document.getElementById('goalsChips');
    const difficultyChips=document.getElementById('difficultyChips');

    renderChips(platformChips,PLATFORM);
    renderChips(modesChips,MODES);
    renderChips(goalsChips,GOALS);
    renderChips(difficultyChips,DIFFICULTY);

    function toggleChip(e){ if(e.target.classList.contains('chip-btn')) e.target.classList.toggle('active'); }
    platformChips.addEventListener('click',toggleChip,{passive:true});
    modesChips.addEventListener('click',toggleChip,{passive:true});
    goalsChips.addEventListener('click',toggleChip,{passive:true});
    difficultyChips.addEventListener('click',toggleChip,{passive:true});

    const STORAGE_KEY='demo_profile_v12'; let mem=null;
    const load=()=>{try{const r=localStorage.getItem(STORAGE_KEY);return r?JSON.parse(r):(mem||{});}catch{return mem||{}}};
    const save=(p)=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(p));}catch{mem=p;}};

    const p=load();
    out.real_name.textContent=p.real_name||'—';
    out.psn.textContent=p.psn||'—';
    out.platform.textContent=joinLines(p.platform||[]);
    out.modes.textContent=joinLines(p.modes||[]);
    out.goals.textContent=joinLines(p.goals||[]);
    out.difficulty.textContent=joinLines(p.difficulty||[]);

    form.real_name.value=p.real_name||'';
    form.psn.value=p.psn||'';
    setChipsActive(platformChips,p.platform||[]);
    setChipsActive(modesChips,p.modes||[]);
    setChipsActive(goalsChips,p.goals||[]);
    setChipsActive(difficultyChips,p.difficulty||[]);

    form.addEventListener('submit',e=>{
      e.preventDefault();
      const updated={
        real_name:(form.real_name.value||'').trim(),
        psn:(form.psn.value||'').trim(),
        platform:getSelected(platformChips),
        modes:getSelected(modesChips),
        goals:getSelected(goalsChips),
        difficulty:getSelected(difficultyChips)
      };
      save(updated);
      out.real_name.textContent=updated.real_name||'—';
      out.psn.textContent=updated.psn||'—';
      out.platform.textContent=joinLines(updated.platform);
      out.modes.textContent=joinLines(updated.modes);
      out.goals.textContent=joinLines(updated.goals);
      out.difficulty.textContent=joinLines(updated.difficulty);
      showFeedback('Профиль обновлён');
      window.scrollTo({top:0,behavior:'smooth'});
    });

    resetBtn.addEventListener('click',()=>{
      const empty={real_name:'',psn:'',platform:[],modes:[],goals:[],difficulty:[]};
      save(empty);
      out.real_name.textContent='—';
      out.psn.textContent='—';
      out.platform.textContent='—';
      out.modes.textContent='—';
      out.goals.textContent='—';
      out.difficulty.textContent='—';
      form.reset();
      setChipsActive(platformChips,[]);
      setChipsActive(modesChips,[]);
      setChipsActive(goalsChips,[]);
      setChipsActive(difficultyChips,[]);
      showFeedback('Профиль очищен');
    });

    // Трофеи
    const trophyList=document.getElementById('trophyList');
    const trophyTitle=document.getElementById('trophyTitle');
    const trophyDesc=document.getElementById('trophyDesc');
    const proofForm=document.getElementById('proofForm');

    function populateTrophyList(){
      fetchTrophies().then(data=>{
        trophiesCache=data;
        trophyList.innerHTML='';
        Object.entries(data).forEach(([key,t])=>{
          const b=document.createElement('button');
          b.className='list-btn';b.type='button';b.dataset.id=key;
          b.innerHTML=`<span>${t.name} ${t.emoji||''}</span><span class="right">›</span>`;
          trophyList.appendChild(b);
        });
      });
    }

    function openTrophyDetail(id){
      const data=trophiesCache;
      const t=(data && data[id])?data[id]:{};
      if(!t){ showFeedback('Трофей не найден'); return; }
      trophyTitle.textContent=`${t.name||'Трофей'} ${t.emoji||''}`;
      trophyDesc.innerHTML='';
      (t.description||['Описание скоро будет.']).forEach(line=>{
        const li=document.createElement('li');li.textContent=line;trophyDesc.appendChild(li);
      });
      showScreen('trophyDetail');
    }

    proofForm.addEventListener('submit',e=>{
      e.preventDefault();
      const files=document.getElementById('proofFiles').files;
      const note=(document.getElementById('proofNote').value||'').trim();
      showFeedback(`Заявка отправлена (тест). Файлов: ${files.length}${note?`, текст: ${Math.min(note.length,120)} симв.`:''}`);
      showScreen('trophies');
    });

    document.addEventListener('click',e=>{
      const b=e.target.closest('.list-btn');
      if(b && b.dataset.id){ openTrophyDetail(b.dataset.id); }
    });

    showScreen('home');
  });
})();