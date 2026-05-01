// ==========================================================================
// LÒGICA DE CONTROL DE L'APP – VERSIÓ FINAL I ESTABLE
// ==========================================================================

let activeScreen = 'home';
let currentAudio = null;

// --------------------------------------------------------------------------
// CONTROL D'ACCÉS A LA RA (Onboarding, futur checks de WebXR, etc.)
// --------------------------------------------------------------------------
function canEnterRA() {
  const seenOnboarding = localStorage.getItem("adarro_seen_onboarding");
  return !!seenOnboarding;
}

// --------------------------------------------------------------------------
// NAVEGACIÓ ENTRE PANTALLES
// --------------------------------------------------------------------------
function navigateTo(targetId) {
  if (activeScreen === targetId) return;

  // Si l’usuari intenta entrar a RA sense onboarding → redirigeix
  if (targetId === 'visor' && !canEnterRA()) {
    console.warn('[App] Intent d’entrar a RA sense onboarding. Redirigint.');
    showScreen('onboarding');
    activeScreen = 'onboarding';
    return;
  }

  console.log(`[App] Navegant cap a: ${targetId}`);

  // Si canviem de pantalla 3D, netegem el visor anterior
  if (window.disposeVisor3D) window.disposeVisor3D();

  // Control d’scroll segons pantalla
  document.body.style.overflow =
    (targetId === 'visor' || targetId === 'anfora') ? 'hidden' : 'auto';

  // Mostra la pantalla
  showScreen(targetId);
  activeScreen = targetId;

  // IMPORTANT:
  // Només inicialitzem 3D automàticament per ANFORA.
  // La RA s’inicialitza NOMÉS quan l’usuari prem el botó RA.
  if (targetId === 'anfora') {
    init3DForScreen(targetId);
  }
}

// --------------------------------------------------------------------------
// MOSTRAR UNA PANTALLA I AMAGAR LES ALTRES
// --------------------------------------------------------------------------
function showScreen(targetId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === targetId);
  });

  // Actualitza estat del menú inferior
  document.querySelectorAll('.nav-item').forEach(item => {
    const action = item.getAttribute('onclick');
    item.classList.toggle('active', action && action.includes(`'${targetId}'`));
  });
}

// --------------------------------------------------------------------------
// INICIALITZAR VISOR 3D (ANFORA o RA)
// Ara retorna una PROMESA perquè puguem esperar-lo abans d’iniciar la RA
// --------------------------------------------------------------------------
function init3DForScreen(targetId) {
  return new Promise((resolve) => {
    let containerId = null;
    let modelPath = null;

    if (targetId === 'anfora') {
      containerId = 'd-container-piece';
      modelPath = 'assets/models/anfora.glb';
    }

    if (targetId === 'visor') {
      containerId = 'd-container-ra';
      modelPath = 'assets/models/villa_darro.glb';
    }

    const container = document.getElementById(containerId);

    if (!container) {
      console.warn(`[App] Contenidor no trobat: ${containerId}`);
      resolve();
      return;
    }

    // Esperem fins que el contenidor tingui mida real
    waitForContainerSize(container).then(() => {
      console.log(`[App] Inicialitzant visor a #${containerId}`);

      if (window.initVisor3D) {
        window.initVisor3D(containerId, modelPath);
      }

      resolve();
    }).catch(() => {
      console.warn(`[App] No s’ha pogut inicialitzar el visor a #${containerId} (sense mida).`);
      resolve();
    });
  });
}

// --------------------------------------------------------------------------
// ESPERAR FINS QUE UN CONTENIDOR TINGUI MIDA REAL (per evitar 0×0)
// --------------------------------------------------------------------------
function waitForContainerSize(container, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    function check() {
      const w = container.clientWidth;
      const h = container.clientHeight;

      if (w > 0 && h > 0) {
        resolve();
      } else if (performance.now() - start > timeout) {
        reject();
      } else {
        requestAnimationFrame(check);
      }
    }

    check();
  });
}

// --------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------
function toggleMode() {
  window.toggleVisorTheme?.();
}

function toggleInfoPanel() {
  const activeScreenEl = document.querySelector('.screen.active');
  if (activeScreenEl) {
    const panel = activeScreenEl.querySelector('.info-panel');
    if (panel) {
      panel.classList.toggle('hidden');
      console.log("Toggle info panel");
    }
  }
}

function resetCamera() {
  window.resetCamera3D?.();
}

// --------------------------------------------------------------------------
// AUDIO
// --------------------------------------------------------------------------
function toggleAudio() {
  if (!currentAudio) {
    currentAudio = new Audio('assets/audio/historia_darro.mp3');
  }

  const icon = document.querySelector('.play-btn span');

  if (currentAudio.paused) {
    currentAudio.play().catch(() => {});
    if (icon) icon.textContent = 'pause_circle';
  } else {
    currentAudio.pause();
    if (icon) icon.textContent = 'play_circle';
  }

  currentAudio.onended = () => {
    if (icon) icon.textContent = 'play_circle';
  };
}

// --------------------------------------------------------------------------
// CONTEXT HISTÒRIC (acordions)
// --------------------------------------------------------------------------
function toggleContext(header) {
  header?.parentElement?.classList.toggle('active');
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
  window.toggleContext = toggleContext;

  // BOTÓ RA
  const startARBtn = document.getElementById('startARBtn');
  if (startARBtn) {
    startARBtn.addEventListener('click', async () => {

      // 1) Inicialitza el visor RA i ESPERA que estigui llest
      await init3DForScreen('visor');

      // 2) Ara sí, inicia la sessió AR
      if (window.startARSession) {
        window.startARSession();
      } else {
        alert('La RA no està disponible en aquest dispositiu o navegador.');
      }
    });
  }
});

// --------------------------------------------------------------------------
// PWA
// --------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('✅ PWA activa'))
      .catch(err => console.error(err));
  });
}
