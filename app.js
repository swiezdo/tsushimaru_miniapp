const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const screens = {
  home: document.getElementById("homeScreen"),
  profile: document.getElementById("profileScreen"),
  trophies: document.getElementById("trophiesScreen"),
  trophyDetail: document.getElementById("trophyDetailScreen"),
  builds: document.getElementById("buildsScreen"),
  buildCreate: document.getElementById("buildCreateScreen"),
  buildDetail: document.getElementById("buildDetailScreen"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ========== Главная ==========
document.getElementById("openProfileBtn").onclick = () => showScreen("profile");
document.getElementById("trophiesBtn").onclick = () => showScreen("trophies");
document.getElementById("buildsBtn").onclick = () => showScreen("builds");

// ========== Профиль ==========
document.getElementById("homeBtn").onclick = () => showScreen("home");

// Обновление профиля
const psnInput = document.getElementById("psn");
const profileForm = document.getElementById("profileForm");
const v_real_name = document.getElementById("v_real_name");
const v_psn = document.getElementById("v_psn");

profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  v_real_name.textContent = profileForm.real_name.value || "—";
  v_psn.textContent = profileForm.psn.value || "—";
  tg.showPopup({
    title: "✅ Профиль обновлён",
    message: "Изменения успешно сохранены.",
    buttons: [{ type: "ok" }],
  });
});

document.getElementById("resetBtn").onclick = () => {
  profileForm.reset();
};

// ========== Трофеи ==========
const trophyList = document.getElementById("trophyList");
const trophyTitle = document.getElementById("trophyTitle");
const trophyDesc = document.getElementById("trophyDesc");
let trophiesData = {};

fetch("trophies.json")
  .then((res) => res.json())
  .then((data) => {
    trophiesData = data;
    Object.keys(data).forEach((key) => {
      const t = data[key];
      const btn = document.createElement("button");
      btn.className = "list-btn";
      btn.innerHTML = `<span>${t.name} ${t.emoji}</span><span class="right">›</span>`;
      btn.onclick = () => openTrophyDetail(key);
      trophyList.appendChild(btn);
    });
  });

function openTrophyDetail(key) {
  const t = trophiesData[key];
  trophyTitle.textContent = `${t.name} ${t.emoji}`;
  trophyDesc.innerHTML = t.description.map((d) => `<li>${d}</li>`).join("");
  showScreen("trophyDetail");
}

// кнопки навигации
document.getElementById("trophiesHomeBtn").onclick = () => showScreen("home");
document.getElementById("backToListBtn").onclick = () => showScreen("trophies");

// =
