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

  const render=p=>{
    out.real_name.textContent=p.real_name||'—';
    out.psn.textContent=p.psn||'—';
    out.platform.textContent=p.platform||'—';
    out.modes.textContent=p.modes?.join(', ')||'—';
    out.goals.textContent=p.goals?.join(', ')||'—';
    out.difficulty.innerHTML='👻 Кошмар<br>🔥 HellMode';
    out.trophies.innerHTML='Легенда Цусимы 🗡<br>Легенда Эдзо 🏔';
  };

  const fill=p=>{
    form.real_name.value=p.real_name||'';
    form.psn.value=p.psn||'';
    form.platform.value=p.platform||'';
    for(const c of document.querySelectorAll('#modes input')) c.checked=p.modes?.includes(c.value);
    for(const c of document.querySelectorAll('#goals input')) c.checked=p.goals?.includes(c.value);
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
      const modes=[...document.querySelectorAll('#modes input:checked')].map(c=>c.value);
      const goals=[...document.querySelectorAll('#goals input:checked')].map(c=>c.value);
      const upd={
        real_name:form.real_name.value.trim(),
        psn:form.psn.value.trim(),
        platform:form.platform.value,
        modes,goals,
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
