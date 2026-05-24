// ==========================================================================
// APP.JS
// ==========================================================================

let activeScreen = null;
let currentAudio = null;

let modelLoaded = {
  anfora: false,
  visor: false
};

// --------------------------------------------------------------------------
// NAVEGACIÓ ENTRE PANTALLES
// --------------------------------------------------------------------------
function navigateTo(targetId) {

  // Amagar totes les pantalles
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Mostrar la pantalla objectiu
  const target = document.getElementById(targetId);
  if (!target) {
    console.error("Pantalla no trobada:", targetId);
    return;
  }

  target.classList.add('active');
  activeScreen = targetId;
  window.activeScreen = targetId;

  // Reaplicar traduccions
  if (window.applyTranslations) applyTranslations();
}

// --------------------------------------------------------------------------
// INICIALITZACIÓ GENERAL
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {

  // Exposar navigateTo
  window.navigateTo = navigateTo;

  // Esperar que i18n.js estigui carregat
  if (window.initLanguage) {
    await window.initLanguage();
  }

  // BOTONS ONBOARDING
  const btnPermisos = document.getElementById("requestCameraBtn");
  const btnSaltar = document.getElementById("skipOnboardingBtn");

  if (btnPermisos) {
    btnPermisos.addEventListener("click", () => {
      localStorage.setItem("adarro_seen_onboarding", "true");
      navigateTo("home");
    });
  }

  if (btnSaltar) {
    btnSaltar.addEventListener("click", () => {
      localStorage.setItem("adarro_seen_onboarding", "true");
      navigateTo("home");
    });
  }
});
