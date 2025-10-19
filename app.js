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
      background:'var(--card)',color:'var(--fg)',zIndex:'9999',
      boxShadow:'0 4px 16px rgba(0,0,0,.25)'
    });
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1600);
  }

  onReady(function(){
    const userChip=document.getElementById('userChip');
    try{
      if(tg&&tg.themeParams){
        const tp=tg.themeParams;
        if(tp.bg_color)document.documentElement.style.setProperty('--bg',tp.bg_color);
        if(tp.text_color)document.documentElement.style.setProperty('--fg',tp.text_color);
        if(tp.hint_color)document.documentElement.style.setProperty('--muted',tp.hint_color);
        if(tp.button_color)document.documentElement.style.setProperty('--accent',tp.button_color);
        if(tg.ready)tg.ready();
        if(tg.expand)tg.expand();
        const me=tg.initDataUnsafe?tg.initDataUnsafe.user:null;
        userChip.textContent=me?.first_name||'Пользователь';
      } else userChip.textContent='Демо';
    }catch(e){}

    // Навигация через делегирование
    document.addEventListener('click',e=>{
      const t=e.target.closest('button, a.big-btn');
      if(!t)return;

      if(t.id==='homeBtn'||t.id==='trophiesHomeBtn'){showScreen('home');return;}
      if(t.id==='openProfileBtn'){showScreen('profile');return;}
      if(t.id==='trophiesBtn'){populateTrophyList();showScreen('trophies');return;}
      if(t.id==='backToListBtn'){showScreen('trophies');return;}
      if(t.classList.contains('list-btn')&&t.dataset.id){openTrophyDetail(t.dataset.id);return;}
    });

    // Трофеи
    const trophyList=document.getElementById('trophyList');
    const trophyTitle=document.getElementById('trophyTitle');
    const trophyDesc=document.getElementById('trophyDesc');
    const proofForm=document.getElementById('proofForm');

    function populateTrophyList(){
      fetchTrophies().then(data=>{
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
      fetchTrophies().then(data=>{
        const t=data[id]||{};
        trophyTitle.textContent=`${t.name||'Трофей'} ${t.emoji||''}`;
        trophyDesc.innerHTML='';
        (t.description||['Описание скоро будет.']).forEach(line=>{
          const li=document.createElement('li');li.textContent=line;trophyDesc.appendChild(li);
        });
        showScreen('trophyDetail');
      });
    }

    proofForm.addEventListener('submit',e=>{
      e.preventDefault();
      const files=document.getElementById('proofFiles').files;
      showFeedback(`Заявка отправлена (тест). Файлов: ${files.length}`);
      showScreen('trophies');
    });

    showScreen('home');
  });
})();
