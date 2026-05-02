// ==========================================================================
// APP.JS – Versió optimitzada i estable
// ==========================================================================

let activeScreen = 'home';
let currentAudio = null;

let modelLoaded = {
  anfora: false,
  visor: false
};

// --------------------------------------------------------------------------
// CONTROL D'ACCÉS A LA RA
// --------------------------------------------------------------------------
function canEnterRA() {
  return !!localStorage.getItem("adarro_seen_onboarding");
}

// --------------------------------------------------------------------------
// NAVEGACIÓ ENTRE PANTALLES
// --------------------------------------------------------------------------
function navigateTo(targetId) {
  console.log("NAVIGATE:", activeScreen, "→", targetId);

  if (activeScreen === targetId) {
    console.warn("Navegació duplicada bloquejada:", targetId);
    return;
  }

  // Destruir visor només si cal
  if (activeScreen === 'anfora' || activeScreen === 'visor') {
    if (window.disposeVisor3D) window.disposeVisor3D();

    //RESET DEL MODEL CARREGAT
    modelLoaded[activeScreen] = false;
  }

  // Ocultar totes les pantalles
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Mostrar pantalla objectiu
  const targetScreen = document.getElementById(targetId);
  targetScreen.classList.add('active');

  activeScreen = targetId;

  // Inicialitzar visor 3D si cal
  if (targetId === 'anfora' || targetId === 'visor') {
    const containerId = targetId === 'anfora' ? 'd-container-piece' : 'd-container-ra';
    const container = document.getElementById(containerId);

    waitForContainerSize(container).then(() => {
      init3DForScreen(targetId);
    });
  }
}

// --------------------------------------------------------------------------
// ESPERAR FINS QUE UN CONTENIDOR TINGUI MIDA REAL
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
// INICIALITZAR VISOR 3D
// --------------------------------------------------------------------------
function init3DForScreen(targetId) {
  if (modelLoaded[targetId]) {
    console.log("[App] Model ja carregat:", targetId);
    return;
  }

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
// UI
// --------------------------------------------------------------------------
function toggleMode() { window.toggleVisorTheme?.(); }

function toggleInfoPanel() {
  const panel = document.querySelector('#anfora .info-panel');
  panel?.classList.toggle('hidden');
}

function resetCamera() { window.resetCamera3D?.(); }

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

// --------------------------------------------------------------------------
// INICIALITZACIÓ GENERAL
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

  window.navigateTo = navigateTo;
  window.toggleMode = toggleMode;
  window.toggleInfoPanel = toggleInfoPanel;
  window.resetCamera = resetCamera;
  window.toggleAudio = toggleAudio;

  // Botó RA
  const startARBtn = document.getElementById('startARBtn');
  if (startARBtn) {
    startARBtn.addEventListener('click', async () => {
      navigateTo('visor');
      await waitForContainerSize(document.getElementById('d-container-ra'));
      window.startARSession?.();
    });
  }
});
