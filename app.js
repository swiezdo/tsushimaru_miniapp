(function () {
const me = tg.initDataUnsafe?.user;
const API_BASE = 'https://flexible-puzzles-abroad-sizes.trycloudflare.com/api';
if (me) userChip.textContent = `${me.first_name || ''} ${me.last_name || ''}`.trim() || `@${me.username || me.id}`;


// 5) Загрузка профиля
async function loadProfile() {
toggleBusy(true);
try {
const url = new URL(API_BASE + '/profile');
url.searchParams.set('init_data', tg.initData); // важная часть — проверяется на сервере
const res = await fetch(url.toString(), { method: 'GET' });
if (!res.ok) throw new Error('HTTP ' + res.status);
const data = await res.json();
renderProfile(data?.profile);
prefillForm(data?.profile);
} catch (e) {
console.error(e);
tg.showPopup?.({ title: 'Ошибка', message: 'Не удалось загрузить профиль. Попробуйте обновить.' });
renderProfile(null);
} finally {
toggleBusy(false);
}
}


function renderProfile(p) {
if (p && Object.keys(p).length) {
setText('v_psn_id', p.psn_id);
setText('v_platform', p.platform);
setText('v_modes', p.modes);
setText('v_goals', p.goals);
setText('v_level', p.level);
setText('v_trophies', p.trophies);
setText('v_message_id', p.message_id);
setText('v_state', p.state);
profileView.hidden = false;
emptyState.hidden = true;
} else {
profileView.hidden = true;
emptyState.hidden = false;
}
}
function setText(id, val) {
document.getElementById(id).textContent = val ?? '—';
}
function prefillForm(p) {
if (!p) return;
form.psn_id.value = p.psn_id || '';
form.platform.value = p.platform || '';
form.modes.value = p.modes || '';
form.goals.value = p.goals || '';
form.level.value = p.level || '';
form.trophies.value = p.trophies || '';
}


// 6) Сохранение
form.addEventListener('submit', async (ev) => {
ev.preventDefault();
const payload = Object.fromEntries(new FormData(form).entries());


// быстрая валидация
if (!payload.psn_id?.trim()) return toast('Укажите PSN ID');
if (!payload.platform) return toast('Выберите платформу');


toggleBusy(true);
saveBtn.disabled = true;


try {
const res = await fetch(API_BASE + '/register', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ init_data: tg.initData, profile: payload }),
});
if (!res.ok) throw new Error('HTTP ' + res.status);
const data = await res.json();
renderProfile(data?.profile);
prefillForm(data?.profile);
toast('Сохранено');
} catch (e) {
console.error(e);
tg.showPopup?.({ title: 'Ошибка', message: 'Не удалось сохранить. Попробуйте ещё раз.' });
} finally {
saveBtn.disabled = false;
toggleBusy(false);
}
});


refreshBtn.addEventListener('click', loadProfile);


function toggleBusy(busy) {
if (busy) tg.MainButton?.showProgress?.(); else tg.MainButton?.hideProgress?.();
}
function toast(message) { tg.showPopup?.({ title: 'Готово', message }); }


tg.ready?.();
tg.expand?.();
loadProfile();
})();