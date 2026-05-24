// ==========================================================================
// APP.JS – Versió corregida i funcional
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

  // ----------------------------------------------------------------------
  // 🔥 1. DESTRUIR VISOR ANTIC SI VENIM D'UNA PANTALLA 3D
  // ----------------------------------------------------------------------
  if (activeScreen === 'anfora' || activeScreen === 'visor') {
    if (window.disposeVisor3D) window.disposeVisor3D();
    modelLoaded[activeScreen] = false;
  }

  // ----------------------------------------------------------------------
  // 2. AMAGAR TOTES LES PANTALLES
  // ----------------------------------------------------------------------
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // ----------------------------------------------------------------------
  // 3. MOSTRAR LA PANTALLA OBJECTIU
  // ----------------------------------------------------------------------
  const target = document.getElementById(targetId);
  if (!target) {
    console.error("Pantalla no trobada:", targetId);
    return;
  }

  target.classList.add('active');
  activeScreen = targetId;
  window.activeScreen = targetId;

  // ----------------------------------------------------------------------
  // 4. TRADUCCIONS
  // ----------------------------------------------------------------------
  if (window.applyTranslations) applyTranslations();

  // ----------------------------------------------------------------------
  // 5. INICIALITZAR VISOR 3D SI CAL
  // ----------------------------------------------------------------------
  if (targetId === 'anfora' || targetId === 'visor') {

    const containerId = targetId === 'anfora' ? 'd-container-piece' : 'd-container-ra';
    const container = document.getElementById(containerId);

    waitForContainerSize(container).then(() => {

      // Forçar que el contenidor tingui alçada real
      container.parentElement.style.height = "100%";
      container.style.height = "100%";

      init3DForScreen(targetId);

      // 🔥 Resize doble per assegurar layout correcte
      setTimeout(() => {
        if (window.forceVisorResize) window.forceVisorResize(containerId);
      }, 50);

      setTimeout(() => {
        if (window.forceVisorResize) window.forceVisorResize(containerId);
      }, 250);
    });
  }
}

// --------------------------------------------------------------------------
// ESPERAR FINS QUE EL CONTENIDOR TINGUI MIDA REAL
// --------------------------------------------------------------------------
function waitForContainerSize(container, timeout = 3000) {
  return new Promise(resolve => {
    const start = performance.now();

    function check() {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        resolve();
      } else if (performance.now() - start > timeout) {
        console.warn("Timeout esperant mida del contenidor");
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    }

    check();
  });
}

// --------------------------------------------------------------------------
// INICIALITZAR VISOR 3D PER A CADA PANTALLA
// --------------------------------------------------------------------------
function init3DForScreen(targetId) {
  if (modelLoaded[targetId]) return;

  let containerId, modelPath;

  if (targetId === 'anfora') {
    containerId = 'd-container-piece';
    modelPath = 'assets/models/anfora.glb';
  }

  if (targetId === 'visor') {
    containerId = 'd-container-ra';
    modelPath = 'assets/models/villa_darro.glb';
  }

  console.log("[App] Inicialitzant visor:", containerId);
  window.initVisor3D(containerId, modelPath);

  modelLoaded[targetId] = true;
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

// --------------------------------------------------------------------------
// FUNCIONS NECESSÀRIES PER EVITAR ERRORS AL VISOR 3D
// --------------------------------------------------------------------------

window.toggleInfoPanel = function () {
  const panel = document.querySelector('#anfora .info-panel');
  panel?.classList.toggle('hidden');
};

window.toggleMode = function () {
  window.toggleVisorTheme?.();
};

window.resetCamera = function () {
  window.resetCamera3D?.();
};

// --------------------------------------------------------------------------
// AUDIO
// --------------------------------------------------------------------------
function toggleAudio() {
  if (!currentAudio) currentAudio = new Audio('assets/audio/historia_darro.mp3');
  const icon = document.querySelector('.play-btn span');

  if (currentAudio.paused) {
    currentAudio.play();
    icon.textContent = 'pause_circle';
  } else {
    currentAudio.pause();
    icon.textContent = 'play_circle';
  }
}

window.toggleAudio = toggleAudio;

// --------------------------------------------------------------------------
// DESPLEGABLES CONTEXT HISTÒRIC
// --------------------------------------------------------------------------
function toggleContext(header) {
  const block = header.parentElement;
  block.classList.toggle("active");
}

window.toggleContext = toggleContext;
