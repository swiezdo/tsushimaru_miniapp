(function(){
  const tg = window.Telegram?.WebApp;

  const userChip = document.getElementById('userChip');
  const form = document.getElementById('profileForm');
  const resetBtn = document.getElementById('resetBtn');

  const out = {
    real_name:document.getElementById('v_real_name'),
    psn:document.getElementById('v_psn'),
    platform:document.getElementById('v_platform'),
    modes:document.getElementById('v_modes'),
    goals:document.getElementById('v_goals'),
    difficulty:document.getElementById('v_difficulty'),
    trophies:document.getElementById('v_trophies'),
  };

  const DEMO_DEFAULT={
    real_name:'Дмитрий',
    psn:'swiezdo',
    platform:'🎮 PlayStation',
    modes:['🏹 Выживание','🗻 Испытания Иё'],
    goals:['🏆 Получение трофеев'],
  };

  const isTelegram=()=>!!tg&&!!tg.initDataUnsafe;
  const getDemo=()=>JSON.parse(localStorage.getItem('demo_profile')||'null')||{...DEMO_DEFAULT};
  const setDemo=p=>localStorage.setItem('demo_profile',JSON.stringify(p));

  const getMulti=v=>Array.from(v.options).filter(o=>o.selected).map(o=>o.value);
  const setMulti=(v,arr=[])=>{
    const s=new Set(arr);
    for(const o of v.options)o.selected=s.has(o.value);
  };
  const arrToTxt=a=>a?.length?a.join(', '):'—';

  const render=p=>{
    out.real_name.textContent=p.real_name||'—';
    out.psn.textContent=p.psn||'—';
    out.platform.textContent=p.platform||'—';
    out.modes.textContent=arrToTxt(p.modes);
    out.goals.textContent=arrToTxt(p.goals);
    out.difficulty.innerHTML='👻 Кошмар<br>🔥 HellMode';
    out.trophies.innerHTML='Легенда Цусимы 🗡<br>Легенда Эдзо 🏔';
  };

  const fill=p=>{
    form.real_name.value=p.real_name||'';
    form.psn.value=p.psn||'';
    form.platform.value=p.platform||'';
    setMulti(form.modes,p.modes);
    setMulti(form.goals,p.goals);
  };

  const init=()=>{
    if(isTelegram()){
      tg.ready?.();tg.expand?.();
      const me=tg.initDataUnsafe?.user;
      userChip.textContent=(me?.first_name||'')||(me?.username?'@'+me.username:'Пользователь');
    }else userChip.textContent='Демо';

    const p=getDemo();render(p);fill(p);

    form.addEventListener('submit',e=>{
      e.preventDefault();
      const upd={
        real_name:form.real_name.value.trim(),
        psn:form.psn.value.trim(),
        platform:form.platform.value,
        modes:getMulti(form.modes),
        goals:getMulti(form.goals),
      };
      setDemo(upd);render(upd);
      tg?.HapticFeedback?.notificationOccurred?.('success');
    });

    resetBtn.addEventListener('click',()=>{
      setDemo({...DEMO_DEFAULT});render(DEMO_DEFAULT);fill(DEMO_DEFAULT);
      tg?.HapticFeedback?.impactOccurred?.('light');
    });
  };
  init();
})();
