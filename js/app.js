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

   window.navigateTo = navigateTo;

    if (window.initLanguage) {
    await window.initLanguage();
  }
});
